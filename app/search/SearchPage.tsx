'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, BookOpen, Wrench, Cpu, Briefcase, ArrowRight, Loader2, X, ExternalLink } from 'lucide-react'
import type { GroupedSearchResults, SearchResult } from '@/lib/search'

// ---------- Badge configs ----------
const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  Article: {
    label: 'Guide',
    color: '#7C5DB4',
    icon: <BookOpen size={14} />,
  },
  Troubleshooting: {
    label: 'Troubleshooting',
    color: '#D97706',
    icon: <Wrench size={14} />,
  },
  'Device Support': {
    label: 'Device Support',
    color: '#0284C7',
    icon: <Cpu size={14} />,
  },
  Service: {
    label: 'Service',
    color: '#059669',
    icon: <Briefcase size={14} />,
  },
  'External Resource': {
    label: 'Official Resource',
    color: '#6366F1',
    icon: <ExternalLink size={14} />,
  },
}

// ---------- Subcomponents ----------
function ResultCard({ result, isNavigating, onNavigate }: { result: SearchResult; isNavigating: boolean; onNavigate: () => void }) {
  const cfg = TYPE_CONFIG[result.type] ?? TYPE_CONFIG['Article']
  const isExternal = result.external || result.url.startsWith('http')

  const linkProps = isExternal
    ? { href: result.url, target: '_blank' as const, rel: 'noopener noreferrer' }
    : { href: result.url }

  return (
    <Link
      {...linkProps}
      onClick={onNavigate}
      className={`group relative z-10 cursor-pointer flex items-start gap-4 p-5 rounded-2xl bg-white border shadow-sm hover:shadow-lg hover:border-[var(--color-primary)] transition-all duration-200 ${
        isNavigating ? 'border-[var(--color-primary)] opacity-80' : 'border-gray-100'
      }`}
    >
      <div
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white mt-0.5"
        style={{ backgroundColor: cfg.color }}
      >
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}
          >
            {cfg.icon}
            {cfg.label}
          </span>
          {result.badge && result.badge !== cfg.label && (
            <span className="text-xs text-gray-400 font-medium">{result.badge}</span>
          )}
        </div>
        <h3 className="font-semibold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors leading-snug mb-1">
          {result.title}
          {isExternal && <ExternalLink size={12} className="inline ml-1.5 text-gray-400" />}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{result.description}</p>
        {isExternal && (
          <p className="text-indigo-400 text-xs mt-1 truncate">{result.url}</p>
        )}
      </div>
      {isNavigating ? (
        <Loader2
          size={18}
          className="flex-shrink-0 text-[var(--color-primary)] animate-spin self-center"
        />
      ) : (
        <ArrowRight
          size={18}
          className="flex-shrink-0 text-gray-300 group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all self-center"
        />
      )}
    </Link>
  )
}

function ResultSection({
  title,
  results,
  icon,
  navigatingTo,
  onNavigate,
}: {
  title: string
  results: SearchResult[]
  icon: React.ReactNode
  navigatingTo: string | null
  onNavigate: (id: string) => void
}) {
  if (results.length === 0) return null
  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-gray-500">{icon}</span>
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        <span className="ml-auto text-xs text-gray-400 font-medium">{results.length} result{results.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex flex-col gap-3">
        {results.map(r => (
          <ResultCard key={r.id} result={r} isNavigating={navigatingTo === r.id} onNavigate={() => onNavigate(r.id)} />
        ))}
      </div>
    </section>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
        <Search size={28} className="text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">No results for &ldquo;{query}&rdquo;</h2>
      <p className="text-gray-500 max-w-sm mx-auto mb-8">
        Try different keywords, or browse all our resources below.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/articles" className="btn btn-secondary btn-sm">Browse All Guides</Link>
        <Link href="/expertise/laptops-desktops" className="btn btn-secondary btn-sm">Device Support</Link>
        <Link href="/pricing" className="btn btn-secondary btn-sm">Services & Pricing</Link>
      </div>
    </div>
  )
}

// ---------- Main Page ----------
export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQ = searchParams.get('q') ?? ''

  const [inputValue, setInputValue] = useState(initialQ)
  const [query, setQuery] = useState(initialQ)
  const [results, setResults] = useState<GroupedSearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`)
      const data: GroupedSearchResults = await res.json()
      setResults(data)
    } catch {
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Run search whenever `query` changes
  useEffect(() => {
    doSearch(query)
  }, [query, doSearch])

  // Kick off initial search from URL param
  useEffect(() => {
    if (initialQ) doSearch(initialQ)
  }, [initialQ, doSearch])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) return
    setQuery(trimmed)
    router.replace(`/search?q=${encodeURIComponent(trimmed)}`, { scroll: false })
  }

  const hasResults = results && results.total > 0

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Search hero */}
      <div
        className="relative py-14 px-4"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-navy) 100%)',
        }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Search SmartSass Tech</h1>
          <p className="text-white mb-8 text-base font-medium">
            Guides, troubleshooting, device support, services &amp; more
          </p>

          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center bg-white rounded-2xl shadow-xl overflow-hidden">
              <Search size={20} className="ml-5 flex-shrink-0 text-gray-400" />
              <input
                id="search-input"
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Try &quot;wifi password&quot;, &quot;printer setup&quot;, &quot;monthly plan&quot;..."
                className="flex-1 py-4 px-4 text-gray-800 placeholder-gray-500 bg-transparent focus:outline-none text-base"
                autoFocus
                autoComplete="off"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => { setInputValue(''); setQuery(''); setResults(null) }}
                  className="p-2 mr-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="submit"
                className="m-1.5 px-5 py-3 rounded-xl text-white font-semibold text-sm transition-all"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Results area */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        {loading && (
          <div className="flex items-center justify-center gap-3 py-20 text-gray-400">
            <Loader2 size={24} className="animate-spin" />
            <span className="text-base">Searching&hellip;</span>
          </div>
        )}

        {!loading && query && hasResults && (
          <>
            <p className="text-sm text-gray-500 mb-8">
              <strong className="text-gray-800">{results.total}</strong> result{results.total !== 1 ? 's' : ''} for &ldquo;<strong className="text-gray-800">{query}</strong>&rdquo;
            </p>

            <ResultSection
              title="Guides & Articles"
              results={results.articles}
              icon={<BookOpen size={18} />}
              navigatingTo={navigatingTo}
              onNavigate={setNavigatingTo}
            />
            <ResultSection
              title="Troubleshooting"
              results={results.troubleshooting}
              icon={<Wrench size={18} />}
              navigatingTo={navigatingTo}
              onNavigate={setNavigatingTo}
            />
            <ResultSection
              title="Device Support"
              results={results.deviceSupport}
              icon={<Cpu size={18} />}
              navigatingTo={navigatingTo}
              onNavigate={setNavigatingTo}
            />
            <ResultSection
              title="Services & Plans"
              results={results.services}
              icon={<Briefcase size={18} />}
              navigatingTo={navigatingTo}
              onNavigate={setNavigatingTo}
            />
            <ResultSection
              title="Official Resources"
              results={results.externalResources}
              icon={<ExternalLink size={18} />}
              navigatingTo={navigatingTo}
              onNavigate={setNavigatingTo}
            />
          </>
        )}

        {!loading && query && !hasResults && results !== null && (
          <EmptyState query={query} />
        )}

        {!loading && !query && (
          <div className="text-center py-20 text-gray-400">
            <Search size={40} className="mx-auto mb-4 opacity-40" />
            <p className="text-base">Start typing to search across the entire site.</p>
          </div>
        )}
      </div>
    </div>
  )
}
