"use client"
import Link from 'next/link'
import { useState, useMemo } from 'react'

type Heading = {
  level: number
  text: string
  id: string
}

interface ArticleTOCProps {
  headings: Heading[]
}

interface GroupedHeading {
  parent: Heading
  children: Heading[]
}

export default function ArticleTOC({ headings }: ArticleTOCProps) {
  // 1. Filter out the article title and any other H1s.
  // We assume the true sections start at H2.
  const contentHeadings = useMemo(() => {
    if (headings.length === 0) return []
    // Exclude the first heading (usually the title) and any other H1 level headings
    return headings.filter((h, index) => h.level > 1 && index > 0)
  }, [headings])

  // 2. Group headings by their hierarchy
  const groupedHeadings = useMemo(() => {
    if (contentHeadings.length === 0) return []

    // Identify the "Top Level Section" level (highest level remaining, usually H2)
    const topLevelSectionLevel = Math.min(...contentHeadings.map(h => h.level))

    return contentHeadings.reduce((acc, h) => {
      if (h.level === topLevelSectionLevel) {
        acc.push({ parent: h, children: [] })
      } else if (h.level > topLevelSectionLevel && acc.length > 0) {
        acc[acc.length - 1].children.push(h)
      }
      return acc
    }, [] as GroupedHeading[])
  }, [contentHeadings])

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  if (groupedHeadings.length === 0) return null

  return (
    <nav
      id="kb-toc-nav"
      aria-label="Table of contents"
      className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-kb-navy sticky top-24"
    >
      <h3 className="text-sm font-bold text-kb-slate uppercase tracking-wider mb-5 border-b pb-3">Guide Sections</h3>
      <ul className="space-y-4">
        {groupedHeadings.map((group) => {
          const { parent, children } = group
          const isExpanded = expandedSections[parent.id] || false
          const hasChildren = children.length > 0

          return (
            <li key={parent.id} className="group/item">
              <div className="flex items-center gap-2">
                <Link
                  href={`#${parent.id}`}
                  className="text-base font-semibold text-kb-navy hover:text-kb-orange transition-colors flex-grow py-1"
                >
                  {parent.text}
                </Link>

                {hasChildren && (
                  <button
                    onClick={(e) => toggleSection(parent.id, e)}
                    className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-kb-slate hover:text-kb-navy bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 transition-all focus:ring-2 focus:ring-kb-navy focus:outline-none"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                    aria-expanded={isExpanded}
                  >
                    <span>{isExpanded ? 'Hide' : 'Expand'}</span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>

              {hasChildren && isExpanded && (
                <ul className="ml-4 mt-3 space-y-3 py-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  {children.map((child, idx) => (
                    <li key={`${child.id}-${idx}`}>
                      <Link
                        href={`#${child.id}`}
                        className="text-[14px] text-kb-slate hover:text-kb-orange transition-colors block py-0.5 border-l-2 border-slate-100 pl-4 hover:border-kb-orange"
                      >
                        {child.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
