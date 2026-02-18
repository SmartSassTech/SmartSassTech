import { getArticles, getDailyFeaturedArticles } from '@/lib/articles'
import ArticleCard from '@/components/ArticleCard'
import CategoryCard from '@/components/CategoryCard'
import Link from 'next/link'
import { TOPIC_CATEGORIES } from '@/lib/constants'

export const revalidate = 3600 // Revalidate every hour

export default async function Home() {
  const allArticles = await getArticles()

  // Show 6 articles that refresh daily
  const featured = getDailyFeaturedArticles(allArticles, 6)

  // Get article counts per category
  const categoryCounts = TOPIC_CATEGORIES.map(category => ({
    name: category,
    count: allArticles.filter(a => a.category === category).length,
  }))

  return (
    <div className="bg-kb-bg">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-kb-navy to-kb-slate text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6">
            Get Help with Technology
          </h1>
          <p className="text-xl text-kb-cream mb-8 max-w-2xl mx-auto">
            Find answers to common questions about devices, online safety, and digital skills—all in one place.
          </p>
          <Link href="/articles">
            <button className="px-8 py-3 bg-kb-cream text-kb-navy font-bold rounded-lg hover:bg-white transition-colors text-lg">
              Browse All Articles
            </button>
          </Link>
        </div>
      </section>

      {/* Featured Articles */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-kb-navy mb-2">Featured Articles</h2>
          <p className="text-kb-muted mb-8">Start with our most helpful guides</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map(article => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* Browse by Category */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-kb-navy mb-2">Browse by Topic</h2>
          <p className="text-kb-muted mb-8">Find answers organized by topic</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryCounts.map(({ name, count }) => (
              <CategoryCard
                key={name}
                title={name}
                count={count}
                href={`/articles?category=${encodeURIComponent(name)}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-kb-navy mb-12 text-center">How to Use This Knowledge Base</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-kb-navy mb-3">Search</h3>
            <p className="text-kb-muted">
              Use the search bar to quickly find articles about specific topics or devices.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="text-5xl mb-4">📂</div>
            <h3 className="text-xl font-bold text-kb-navy mb-3">Browse</h3>
            <p className="text-kb-muted">
              Explore topics and filter by device type to find the information you need.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-kb-navy mb-3">AI Chatbot</h3>
            <p className="text-kb-muted">
              Ask our intelligent assistant for instant answers and step-by-step help.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-kb-navy mb-3">Live Support</h3>
            <p className="text-kb-muted">
              Chat with a real person for personalized guidance and complex troubleshooting.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="text-5xl mb-4">📖</div>
            <h3 className="text-xl font-bold text-kb-navy mb-3">Learn</h3>
            <p className="text-kb-muted">
              Read step-by-step guides written for beginners to master your technology.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
