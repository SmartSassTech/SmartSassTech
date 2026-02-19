import { getArticles, getDailyFeaturedArticles } from '@/lib/articles'
import ArticleCard from '@/components/ArticleCard'
import DeviceSlider from '@/components/DeviceSlider'
import Link from 'next/link'

export const revalidate = 3600 // Revalidate every hour

export default async function Home() {
  const allArticles = await getArticles()

  // Show 6 articles that refresh daily
  const featured = getDailyFeaturedArticles(allArticles, 6)

  return (
    <main id="main-content">
      {/* Hero Section */}
      <section className="hero section">
        <div className="container">
          <h1 className="hero-title">Support for Every Device You Use</h1>
        </div>

        {/* Device Category Slider (Outside container for full-width) */}
        <div className="slider-container">
          <DeviceSlider />
        </div>
      </section>

      {/* Featured Articles Section - Replaces the static "Resources" from original if desired, or appended */}
      {featured.length > 0 && (
        <section className="section" style={{ backgroundColor: 'var(--color-bg-alt)', padding: 'var(--spacing-xxl) 0' }}>
          <div className="container">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h2 className="mb-2" style={{ fontSize: 'var(--font-size-subhero)' }}>Featured Guides</h2>
                <p className="text-kb-muted text-xl max-w-xl">Step-by-step instructions for your most common tech questions.</p>
              </div>
              <Link href="/articles" className="text-sst-primary font-bold border-b-2 border-sst-primary pb-1 hover:text-sst-secondary hover:border-sst-secondary transition-all">
                View All Resources
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featured.map(article => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section className="section" style={{ backgroundColor: 'var(--color-white)' }}>
        <div className="container">
          <h2 className="text-center mb-xl">How It Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Book a Session</h3>
              <p>Tell us what you need help with and pick a time that works best for you. We'll confirm the details immediately.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Meet Your Guide</h3>
              <p>We'll meet at your pace, either in-person or remotely. No jargon, just patient guidance and clear steps.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Learn and Master</h3>
              <p>Walk away feeling confident with your technology. We'll even provide notes so you can remember what we did!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section">
        <div className="container">
          <h2 className="text-center mb-xl">What Our Clients Say</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <p className="testimonial-text">"SmartSass Tech made me feel so comfortable. I finally understand how to use FaceTime with my grandkids! I'm no longer afraid of my tablet."</p>
              <p className="testimonial-author">Mary J.</p>
              <p className="testimonial-location">Pittsford, NY</p>
            </div>
            <div className="testimonial-card">
              <p className="testimonial-text">"Patient, professional, and genuinely kind. They fixed my printer issues and set up a secure password system for me. Highly recommend!"</p>
              <p className="testimonial-author">Robert L.</p>
              <p className="testimonial-location">Brighton, NY</p>
            </div>
            <div className="testimonial-card">
              <p className="testimonial-text">"The jargon-free approach is exactly what I needed. They didn't talk down to me once. I feel so much more tech-savvy now."</p>
              <p className="testimonial-author">Helen S.</p>
              <p className="testimonial-location">Rochester, NY</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section section">
        <div className="container">
          <h2 className="mb-xl">Need a Hand? We're Here For You!</h2>
          <p className="cta-text">
            If you're stuck, don't worry -- you don't have to figure it out alone.
            We'll walk you through any issue with patience and clear instructions.
            Whether it's a simple setup or frustrating error, we've got your back.
          </p>
          <Link href="/booking" className="btn btn-primary btn-large">
            Book a Personal Session
          </Link>
        </div>
      </section>
    </main>
  )
}
