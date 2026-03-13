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
  /** Pre-computed: all searchable text joined & lowercased */
  searchText: string
  /** Pre-computed: title lowercased (for title-boost scoring) */
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
): SearchEntry {
  const parts = [title, description, badge ?? '', ...extraKeywords]
  return {
    id,
    title,
    description,
    url,
    type,
    badge,
    searchText: parts.join(' ').toLowerCase(),
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
    const extra = [
      data.tip,
      ...data.helpItems.map(h => h.title),
      ...data.helpItems.map(h => h.description),
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
 * If the index is stale or empty, triggers a background rebuild.
 */
export async function querySearchIndex(rawQuery: string): Promise<GroupedSearchResults> {
  const empty: GroupedSearchResults = {
    articles: [], troubleshooting: [], deviceSupport: [], services: [], total: 0
  }

  const q = rawQuery.toLowerCase().trim()
  if (!q) return empty

  // Ensure index is built
  if (!INDEX.ready || (Date.now() - INDEX.lastBuildTime > INDEX_TTL)) {
    await warmUpSearchIndex()
  }

  const keywords = q.split(/\s+/).filter(k => k.length > 0)
  if (keywords.length === 0) return empty

  // Score each entry
  const scored: { entry: SearchEntry; score: number }[] = []

  for (const entry of INDEX.entries) {
    let score = 0
    for (const kw of keywords) {
      if (entry.titleLower.includes(kw)) score += 3
      else if (entry.searchText.includes(kw)) score += 1
    }
    if (score > 0) {
      scored.push({ entry, score })
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  // Group into categories
  const result: GroupedSearchResults = {
    articles: [], troubleshooting: [], deviceSupport: [], services: [], total: 0
  }

  for (const { entry } of scored) {
    const item = {
      id: entry.id,
      title: entry.title,
      description: entry.description,
      url: entry.url,
      type: entry.type === 'Page' ? 'Article' as const : entry.type as SearchResultType,
      badge: entry.badge,
    }

    switch (entry.type) {
      case 'Troubleshooting':
        result.troubleshooting.push(item)
        break
      case 'Device Support':
        result.deviceSupport.push(item)
        break
      case 'Service':
        result.services.push(item)
        break
      default: // 'Article' and 'Page'
        result.articles.push(item)
        break
    }
  }

  result.total =
    result.articles.length +
    result.troubleshooting.length +
    result.deviceSupport.length +
    result.services.length

  return result
}
