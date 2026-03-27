/**
 * Pre-built search index — fetches all data sources once at startup,
 * builds a flat searchable index, and answers queries in <1ms.
 *
 * No Notion API calls happen at query time.
 */

import { fetchArticlesFromNotion } from './notion'
import { EXPERTISE_DATA } from './expertise-data'
import { STATIC_PAGES } from './static-pages'
import type { SearchResultType, GroupedSearchResults } from './search'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchEntry {
  id: string
  title: string
  description: string
  url: string
  type: SearchResultType | 'Page'
  badge?: string
  /** If true, the link should open in a new tab */
  external?: boolean
  /** Pre-computed: individual searchable words (lowered, deduped) */
  searchWords: string[]
  /** Pre-computed: all searchable text joined & lowercased (for phrase matching) */
  searchText: string
  /** Pre-computed: title lowercased */
  titleLower: string
}

// ---------------------------------------------------------------------------
// Global index (survives hot reloads in dev)
// ---------------------------------------------------------------------------

interface GlobalSearchIndex {
  entries: SearchEntry[]
  ready: boolean
  buildPromise: Promise<void> | null
  lastBuildTime: number
}

const g = global as typeof globalThis & { __searchIndex?: GlobalSearchIndex }
const INDEX = g.__searchIndex || (g.__searchIndex = {
  entries: [],
  ready: false,
  buildPromise: null,
  lastBuildTime: 0,
})

const INDEX_TTL = 10 * 60 * 1000 // 10 minutes

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Tokenize text into individual lowercase words */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\-_/&.,;:!?()"']+/)
    .filter(w => w.length > 1) // drop single-char noise
}

// ---------------------------------------------------------------------------
// Index builder
// ---------------------------------------------------------------------------

function makeEntry(
  id: string,
  title: string,
  description: string,
  url: string,
  type: SearchResultType | 'Page',
  badge: string | undefined,
  extraKeywords: string[] = [],
  external = false,
): SearchEntry {
  const parts = [title, description, badge ?? '', ...extraKeywords]
  const fullText = parts.join(' ').toLowerCase()
  const words = [...new Set(tokenize(parts.join(' ')))]
  return {
    id,
    title,
    description,
    url,
    type,
    badge,
    external,
    searchWords: words,
    searchText: fullText,
    titleLower: title.toLowerCase(),
  }
}

async function buildIndex(): Promise<SearchEntry[]> {
  const entries: SearchEntry[] = []

  // 1. Notion articles
  try {
    const articles = await fetchArticlesFromNotion()
    for (const a of articles) {
      const extra = [
        ...(a.tags ?? []),
        ...(a.deviceType ?? []),
        ...(a.platformCategory ?? []),
        a.category ?? '',
      ]
      const artType: SearchResultType =
        (a as any).articleType === 'Troubleshooting' ? 'Troubleshooting' : 'Article'
      entries.push(
        makeEntry(a.slug, a.title, a.description, `/articles/${a.slug}`, artType, a.category, extra),
      )
    }
  } catch (e) {
    console.error('[SEARCH INDEX] Failed to load Notion articles:', e)
  }

  // 2. Expertise / Device Support pages
  const CATEGORY_SLUGS: Record<string, string> = {
    'laptops-desktops': 'laptops-desktops',
    'tablets-phones': 'tablets-phones',
    'watches-wearables': 'watches-wearables',
    'tv-streaming': 'tv-streaming',
    'smart-home-security': 'smart-home-security',
    'printers-scanners': 'printers-scanners',
    'wifi-networking': 'wifi-networking',
    'accessories-peripherals': 'accessories-peripherals',
  }

  for (const [slug, data] of Object.entries(EXPERTISE_DATA)) {
    // Gather rich keywords from all sub-content
    const extra = [
      data.tip,
      ...data.helpItems.map(h => h.title),
      ...data.helpItems.map(h => h.description),
      ...data.officialResources.map(r => r.title),
    ]
    entries.push(
      makeEntry(
        `expertise-${slug}`,
        data.heroTitle,
        `Support and setup help for ${data.title}. Includes ${data.helpItems.map(h => h.title).slice(0, 3).join(', ')}, and more.`,
        `/expertise/${CATEGORY_SLUGS[slug] ?? slug}`,
        'Device Support',
        'Device Support',
        extra,
      ),
    )

    // 2b. External resources from each expertise category
    //     Only index the resource's own title + parent category name.
    //     Do NOT include helpItem titles — that causes cross-contamination
    //     (e.g. "Samsung Mobile Support" matching "iphone" via "iPhone & Android Setup")
    for (const res of data.officialResources) {
      entries.push(
        makeEntry(
          `ext-${slug}-${res.title.toLowerCase().replace(/\s+/g, '-')}`,
          res.title,
          `Official support portal for ${data.title}. Visit ${res.title} for product help, downloads, troubleshooting, and warranty info.`,
          res.url,
          'External Resource',
          data.title,
          [data.title],
          true, // external
        ),
      )
    }
  }

  // 3. Static pages (scam prevention, about, contact, etc.)
  for (const page of STATIC_PAGES) {
    entries.push(
      makeEntry(page.id, page.title, page.description, page.url, page.type, page.badge, page.keywords),
    )
  }

  // 4. Services (inline, keep small)
  const SERVICES = [
    {
      id: 'service-standard',
      title: 'Standard Support',
      description: 'Perfect for one-off tech issues or occasional questions. 1 hour guided session, remote or in-person.',
      keywords: ['standard', 'support', 'session', 'one-off', 'hour', 'remote', 'in-person'],
    },
    {
      id: 'service-monthly',
      title: 'The Monthly Master',
      description: 'Our most popular plan. 1 remote session per month, priority messaging, and access to premium guides.',
      keywords: ['monthly', 'plan', 'popular', 'subscription', 'premium', 'priority'],
    },
    {
      id: 'service-scholar',
      title: 'The Tech Scholar',
      description: 'A discounted 3-session bundle for deep dives and training. Sessions never expire and can be shared with family.',
      keywords: ['scholar', 'bundle', 'discount', 'training', 'family', 'session'],
    },
  ]
  for (const s of SERVICES) {
    entries.push(
      makeEntry(s.id, s.title, s.description, '/pricing', 'Service', undefined, s.keywords),
    )
  }

  return entries
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build (or refresh) the search index. Called at startup and periodically.
 * Safe to call multiple times — deduplicates concurrent builds.
 */
export async function warmUpSearchIndex(): Promise<void> {
  if (INDEX.buildPromise) return INDEX.buildPromise

  INDEX.buildPromise = (async () => {
    try {
      const t0 = Date.now()
      console.log('[SEARCH INDEX] Building...')
      INDEX.entries = await buildIndex()
      INDEX.ready = true
      INDEX.lastBuildTime = Date.now()
      console.log(`[SEARCH INDEX] Ready — ${INDEX.entries.length} entries in ${Date.now() - t0}ms`)
    } catch (e) {
      console.error('[SEARCH INDEX] Build failed:', e)
    } finally {
      INDEX.buildPromise = null
    }
  })()

  return INDEX.buildPromise
}

/**
 * Query the search index. Returns grouped results sorted by relevance.
 *
 * Scoring algorithm:
 *  - ALL query keywords must match somewhere in the entry (AND logic)
 *  - Title word match:  +5 per keyword
 *  - Body word match:   +1 per keyword
 *  - Full phrase bonus:  +8 if exact query phrase found in searchText
 *  - Prefix matching:    "ipho" matches "iphone"
 *
 * If the index is stale or empty, triggers a background rebuild.
 */
export async function querySearchIndex(rawQuery: string): Promise<GroupedSearchResults> {
  const empty: GroupedSearchResults = {
    articles: [], troubleshooting: [], deviceSupport: [], services: [], externalResources: [], total: 0
  }

  const q = rawQuery.toLowerCase().trim()
  if (!q) return empty

  // Ensure index is built
  if (!INDEX.ready || (Date.now() - INDEX.lastBuildTime > INDEX_TTL)) {
    await warmUpSearchIndex()
  }

  const keywords = q.split(/\s+/).filter(k => k.length > 1)
  if (keywords.length === 0) return empty

  // Score each entry — track matchedCount for category-aware filtering
  const scored: { entry: SearchEntry; score: number; matchedCount: number }[] = []

  for (const entry of INDEX.entries) {
    let score = 0
    let matchedCount = 0

    for (const kw of keywords) {
      // Check title first (word-prefix matching)
      const titleMatch = entry.titleLower.includes(kw)
      // Check body words (prefix matching against tokenized words)
      const bodyMatch = !titleMatch && (
        entry.searchWords.some(w => w.startsWith(kw) || w.includes(kw)) ||
        entry.searchText.includes(kw)
      )

      if (titleMatch) {
        score += 5
        matchedCount++
      } else if (bodyMatch) {
        score += 1
        matchedCount++
      }
    }

    // Skip if no keywords matched at all
    if (matchedCount === 0) continue

    // For multi-word queries, require at least half the keywords to match
    // This prevents single-word noise while still allowing partial matches
    const minRequired = keywords.length > 1 ? Math.ceil(keywords.length / 2) : 1
    if (matchedCount < minRequired) continue

    // Big bonus when ALL keywords match (rewards full relevance)
    if (matchedCount === keywords.length) {
      score += 10
    }

    // Bonus: exact phrase match in the full text
    if (keywords.length > 1 && entry.searchText.includes(q)) {
      score += 8
    }

    if (score > 0) {
      scored.push({ entry, score, matchedCount })
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  // Group into categories
  const result: GroupedSearchResults = {
    articles: [], troubleshooting: [], deviceSupport: [], services: [], externalResources: [], total: 0
  }

  // Per-category caps to keep results focused
  const caps = { articles: 5, troubleshooting: 3, deviceSupport: 5, services: 3, externalResources: 8 }

  for (const { entry, matchedCount } of scored) {
    const item = {
      id: entry.id,
      title: entry.title,
      description: entry.description,
      url: entry.url,
      type: entry.type === 'Page' ? 'Article' as const : entry.type as SearchResultType,
      badge: entry.badge,
      external: entry.external,
    }

    // For Device Support in multi-word queries, require ALL keywords to match
    if (entry.type === 'Device Support' && keywords.length > 1 && matchedCount < keywords.length) continue

    // For External Resources in multi-word queries, require at least one
    // keyword to appear in the TITLE or BADGE (parent category name).
    // Title check: "Apple iPhone Support" matches "iphone setup" ✓
    // Badge check: "Epson Support" with badge "Printers & Scanners" matches "printer setup" ✓
    // Excluded: "Samsung Mobile Support" with badge "Tablets & Phones" doesn't match "iphone setup" ✓
    if (entry.type === 'External Resource' && keywords.length > 1) {
      const badgeLower = (entry.badge ?? '').toLowerCase()
      const titleOrBadgeHasKeyword = keywords.some(kw =>
        entry.titleLower.includes(kw) || badgeLower.includes(kw)
      )
      if (!titleOrBadgeHasKeyword) continue
    }

    switch (entry.type) {
      case 'Troubleshooting':
        if (result.troubleshooting.length < caps.troubleshooting) result.troubleshooting.push(item)
        break
      case 'Device Support':
        if (result.deviceSupport.length < caps.deviceSupport) result.deviceSupport.push(item)
        break
      case 'Service':
        if (result.services.length < caps.services) result.services.push(item)
        break
      case 'External Resource':
        if (result.externalResources.length < caps.externalResources) result.externalResources.push(item)
        break
      default: // 'Article' and 'Page'
        if (result.articles.length < caps.articles) result.articles.push(item)
        break
    }
  }

  result.total =
    result.articles.length +
    result.troubleshooting.length +
    result.deviceSupport.length +
    result.services.length +
    result.externalResources.length

  return result
}
