'use client'

import { useState, ChangeEvent, useEffect } from 'react'
import { TASK_CATEGORIES, DEVICE_TYPES, PLATFORM_CATEGORIES, ARTICLE_TYPES } from '@/lib/constants'
import { ArticleMetadata } from '@/lib/articles'
import ArticleCard from './ArticleCard'

interface FilterBarProps {
  articles: ArticleMetadata[]
  initialQuery?: string
  initialCategory?: string
  initialHardware?: string
  initialPlatform?: string
  initialType?: string
}

export default function FilterBar({
  articles,
  initialQuery = '',
  initialCategory,
  initialHardware,
  initialPlatform,
  initialType,
}: FilterBarProps) {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // initialize searchQuery and initial selections from server-provided props
  useEffect(() => {
    if (initialQuery && initialQuery !== searchQuery) {
      setSearchQuery(initialQuery)
    }

    if (initialCategory) {
      if (TASK_CATEGORIES.includes(initialCategory)) {
        setSelectedTasks(prev => (prev.includes(initialCategory) ? prev : [...prev, initialCategory]))
      }
    }

    if (initialHardware) {
      if (DEVICE_TYPES.includes(initialHardware)) {
        setSelectedDevices(prev => (prev.includes(initialHardware) ? prev : [...prev, initialHardware]))
      }
    }

    if (initialPlatform) {
      if (PLATFORM_CATEGORIES.includes(initialPlatform)) {
        setSelectedPlatforms(prev => (prev.includes(initialPlatform) ? prev : [...prev, initialPlatform]))
      }
    }

    if (initialType) {
      if (ARTICLE_TYPES.includes(initialType)) {
        setSelectedTypes(prev => (prev.includes(initialType) ? prev : [...prev, initialType]))
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, initialCategory, initialHardware, initialPlatform, initialType])

  const toggleTask = (task: string) => {
    setSelectedTasks(prev =>
      prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]
    )
  }

  const toggleDevice = (dev: string) => {
    setSelectedDevices(prev => (prev.includes(dev) ? prev.filter(d => d !== dev) : [...prev, dev]))
  }

  const togglePlatform = (plat: string) => {
    setSelectedPlatforms(prev => (prev.includes(plat) ? prev.filter(p => p !== plat) : [...prev, plat]))
  }

  const toggleType = (type: string) => {
    setSelectedTypes(prev => (prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]))
  }

  const clearFilters = () => {
    setSelectedTasks([])
    setSelectedDevices([])
    setSelectedPlatforms([])
    setSelectedTypes([])
    setSearchQuery('')
  }

  // Filter articles based on selections
  const filteredArticles = articles.filter((article: ArticleMetadata) => {
    const matchesTask =
      selectedTasks.length === 0 ||
      selectedTasks.includes(article.category)

    const matchesDevice =
      selectedDevices.length === 0 ||
      selectedDevices.some(dev =>
        article.deviceType?.includes(dev) || article.hardware?.includes(dev)
      )

    const matchesPlatform =
      selectedPlatforms.length === 0 ||
      (article.platformCategory && article.platformCategory.some(plat => selectedPlatforms.includes(plat)))

    const matchesType =
      selectedTypes.length === 0 ||
      (article.articleType && selectedTypes.includes(article.articleType))

    const matchesSearch =
      searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesTask && matchesDevice && matchesPlatform && matchesType && matchesSearch
  })

  const activeFilters = selectedTasks.length + selectedDevices.length + selectedPlatforms.length + selectedTypes.length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Filters */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-md sticky top-20 flex flex-col h-[calc(100vh-80px)]">
          <div className="p-6 border-b border-kb-pale">
            <h2 className="text-xl font-bold text-kb-navy">Filters</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-kb-pale scrollbar-track-transparent">
            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-kb-slate mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-kb-pale rounded-lg text-kb-dark placeholder-kb-muted focus:outline-none focus:ring-2 focus:ring-kb-navy"
              />
            </div>

            {/* Clear Filters */}
            {activeFilters > 0 && (
              <button
                onClick={clearFilters}
                className="w-full mb-6 px-3 py-2 bg-kb-pale text-kb-navy rounded-lg font-semibold hover:bg-kb-light transition-colors text-sm"
              >
                Clear All Filters
              </button>
            )}

            {/* Task Categories */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-kb-slate mb-3 uppercase">Goals</h3>
              <div className="space-y-2">
                {TASK_CATEGORIES.map(task => (
                  <label key={task} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task)}
                      onChange={() => toggleTask(task)}
                      className="mr-2 w-4 h-4 accent-kb-navy rounded"
                    />
                    <span className="text-sm text-kb-dark hover:text-kb-navy transition-colors">
                      {task}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Device Types */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-kb-slate mb-3 uppercase">Devices</h3>
              <div className="space-y-2">
                {DEVICE_TYPES.map(dev => (
                  <label key={dev} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDevices.includes(dev)}
                      onChange={() => toggleDevice(dev)}
                      className="mr-2 w-4 h-4 accent-kb-navy rounded"
                    />
                    <span className="text-sm text-kb-dark hover:text-kb-navy transition-colors">
                      {dev}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Platform Categories */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-kb-slate mb-3 uppercase">Platforms</h3>
              <div className="space-y-2">
                {PLATFORM_CATEGORIES.map(plat => (
                  <label key={plat} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(plat)}
                      onChange={() => togglePlatform(plat)}
                      className="mr-2 w-4 h-4 accent-kb-navy rounded"
                    />
                    <span className="text-sm text-kb-dark hover:text-kb-navy transition-colors">
                      {plat}
                    </span>
                  </label>
                ))}
              </div>
            </div>


          </div>
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-3">
        <div className="mb-6">
          <p className="text-kb-muted text-sm">
            Showing <span className="font-bold text-kb-navy">{filteredArticles.length}</span> of{' '}
            <span className="font-bold text-kb-navy">{articles.length}</span> articles
          </p>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-kb-muted text-lg mb-4">No articles found matching your filters.</p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-kb-navy text-white rounded-lg hover:bg-kb-slate transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredArticles.map((article: ArticleMetadata) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
