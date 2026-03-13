import { Suspense } from 'react'
import SearchPage from './SearchPage'

export const metadata = {
  title: 'Search | SmartSass Tech',
  description: 'Search across all SmartSass Tech guides, troubleshooting articles, device support pages, and services.',
}

export default function SearchRoute() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="text-center text-gray-400">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p>Loading search&hellip;</p>
        </div>
      </div>
    }>
      <SearchPage />
    </Suspense>
  )
}
