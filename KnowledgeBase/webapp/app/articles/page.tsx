import FilterBar from '@/components/FilterBar'
import { getArticles } from '@/lib/articles'

interface PageProps {
  searchParams?: {
    category?: string
    hardware?: string
    platform?: string
    type?: string
    q?: string
  }
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const articles = await getArticles()

  return (
    <div className="bg-kb-bg">
      {/* Header */}
      <section className="bg-kb-navy text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">Browse All Articles</h1>
          <p className="text-kb-cream">
            Filter by topic and device to find the help you need
          </p>
        </div>
      </section>

      {/* Filter and Results */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <FilterBar
          articles={articles}
          initialQuery={searchParams?.q}
          initialCategory={searchParams?.category}
          initialHardware={searchParams?.hardware}
          initialPlatform={searchParams?.platform}
          initialType={searchParams?.type}
        />
      </section>
    </div>
  )
}
