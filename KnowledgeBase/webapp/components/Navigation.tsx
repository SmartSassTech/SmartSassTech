'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Navigation() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const router = useRouter()

  const submitSearch = () => {
    const q = searchValue.trim()
    if (q.length === 0) return
    // navigate to articles page with query param `q` so the FilterBar can prefill
    router.push(`/articles?q=${encodeURIComponent(q)}`)
    setIsSearchOpen(false)
  }

  return (
    <header className="bg-kb-navy text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center h-16">
          <div className="flex items-center justify-start">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold">Knowledge Base</span>
            </Link>
          </div>

          <div className="flex items-center justify-center">
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="hover:text-kb-cream transition-colors">
                Home
              </Link>
              <Link href="/articles" className="hover:text-kb-cream transition-colors">
                Browse
              </Link>
              <Link href="/chat" className="bg-kb-cream text-kb-navy px-4 py-1.5 rounded-full font-bold hover:scale-105 transition-all shadow-sm">
                Get Help Now
              </Link>
            </nav>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="hover:text-kb-cream transition-colors p-2"
              aria-label="Toggle search"
              title="Toggle search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

        </div>

        {isSearchOpen && (
          <div className="pb-4 w-full max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitSearch()
                }}
                className="flex-1 px-4 py-2 rounded-lg text-kb-dark placeholder-kb-muted focus:outline-none focus:ring-2 focus:ring-kb-cream"
              />
              <button
                onClick={submitSearch}
                className="px-3 py-2 bg-kb-cream text-kb-navy rounded-lg font-semibold hover:opacity-95"
              >
                Go
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
