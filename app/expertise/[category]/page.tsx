import { notFound } from 'next/navigation'
import Link from 'next/link'
import { EXPERTISE_DATA } from '@/lib/expertise-data'

export async function generateStaticParams() {
    return Object.keys(EXPERTISE_DATA).map((category) => ({
        category,
    }))
}

// Map resource titles to their official brand logo SVG paths
function BrandLogo({ title }: { title: string }) {
    const t = title.toLowerCase()

    const logoMap: { [key: string]: string } = {
        'apple': '/assets/images/External Resources/apple-color-svgrepo-com.svg',
        'google': '/assets/images/External Resources/google-color-svgrepo-com.svg',
        'android': '/assets/images/External Resources/android-color-svgrepo-com.svg',
        'pixel': '/assets/images/External Resources/google-color-svgrepo-com.svg',
        'nest': '/assets/images/External Resources/google-color-svgrepo-com.svg',
        'samsung': '/assets/images/External Resources/samsung-svgrepo-com.svg',
        'microsoft': '/assets/images/External Resources/microsoft-svgrepo-com.svg',
        'hp': '/assets/images/External Resources/hp-svgrepo-com.svg',
        'dell': '/assets/images/External Resources/dell-2-logo-svgrepo-com.svg',
        'lenovo': '/assets/images/External Resources/lenovo-svgrepo-com.svg',
        'amazon': '/assets/images/External Resources/amazon-color-svgrepo-com.svg',
        'fire': '/assets/images/External Resources/amazon-color-svgrepo-com.svg',
        'roku': '/assets/images/External Resources/roku-svgrepo-com.svg',
        'fitbit': '/assets/images/External Resources/fitbit-logo-svgrepo-com.svg',
        'garmin': '/assets/images/External Resources/garmin-svgrepo-com.svg',
        'ring': '/assets/images/External Resources/Ring_logo.svg',
        'arlo': '/assets/images/External Resources/arlo-svgrepo-com.svg',
        'epson': '/assets/images/External Resources/epson-svgrepo-com.svg',
        'brother': '/assets/images/External Resources/Brother_logo.svg',
        'canon': '/assets/images/External Resources/Canon_logo.svg',
        'spectrum': '/assets/images/External Resources/Spectrum_Logo.svg',
        'netgear': '/assets/images/External Resources/Netgearlogo.svg',
        'tp-link': '/assets/images/External Resources/TP-LINK_logo.svg',
        'logitech': '/assets/images/External Resources/logitech-svgrepo-com.svg',
        'logi': '/assets/images/External Resources/logitech-svgrepo-com.svg'
    }

    // Find the first matching key in the logo map
    const matchingKey = Object.keys(logoMap).find(key => t.includes(key))

    if (matchingKey) {
        const logoSrc = logoMap[matchingKey]
        const isWide = ['samsung', 'dell', 'lenovo', 'amazon', 'roku', 'epson', 'brother', 'canon', 'spectrum', 'netgear', 'tp-link', 'logitech', 'logi'].includes(matchingKey)

        return (
            <img
                src={logoSrc}
                className={`resource-logo ${isWide ? 'resource-logo--wide' : ''}`}
                alt={`${matchingKey} logo`}
                aria-hidden="true"
            />
        )
    }

    // Default fallback if no logo found (same as original fallback logic)
    return (
        <div className="resource-logo-fallback" aria-hidden="true">
            {title.charAt(0).toUpperCase()}
        </div>
    )
}

export default async function ExpertisePage({ params }: { params: Promise<{ category: string }> }) {
    const { category } = await params
    const data = EXPERTISE_DATA[category]

    if (!data) {
        notFound()
    }

    return (
        <main id="main-content">
            {/* Page Hero */}
            <section className="bg-kb-navy py-24 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-8 text-white">
                        {data.heroTitle}
                    </h1>
                    <Link href={data.quizLink}>
                        <button className="px-10 py-4 bg-sst-secondary text-white font-bold rounded-full hover:bg-white hover:text-kb-navy transition-all shadow-lg text-[1.1rem]">
                            Take {data.quizName}
                        </button>
                    </Link>
                </div>
            </section>

            {/* Info Section */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="mb-16 text-center">
                        {data.comparison.title}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                        {data.comparison.cards.map((card, idx) => (
                            <div key={idx} className="bg-kb-bg/30 p-10 rounded-3xl border border-kb-cream">
                                <h3 className="mb-4">{card.title}</h3>
                                <p className="text-kb-dark leading-relaxed">{card.description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-sst-beige/30 p-12 rounded-[3rem] text-center border-2 border-dashed border-sst-beige">
                        <p className="text-[1.1rem] text-sst-primary mb-10 leading-relaxed max-w-3xl mx-auto">
                            <strong>TIP:</strong> {data.tip}
                        </p>
                        <h2 className="mb-4">{data.matchTitle}</h2>
                        <p className="text-kb-dark mb-10">{data.matchDescription}</p>
                        <Link href={data.quizLink}>
                            <button className="px-10 py-4 bg-sst-primary text-white font-bold rounded-full hover:bg-sst-secondary transition-all text-[1.1rem]">
                                Take Quiz
                            </button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* What We Help With */}
            <section className="py-24 bg-kb-bg/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="mb-16 text-center">
                        Specific {data.title} Help We Provide
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {data.helpItems.map((item, idx) => (
                            <div key={idx} className="bg-white p-10 rounded-3xl shadow-md hover:shadow-xl transition-all border border-kb-cream/50">
                                <div className="text-5xl mb-6">{item.icon}</div>
                                <h3 className="mb-4">{item.title}</h3>
                                <p className="text-kb-dark leading-relaxed">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Official Resources — brand logo cards, centered */}
            <section className="py-24 bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="mb-4 text-center">
                        Official Support &amp; Resources
                    </h2>
                    <p className="text-center text-kb-muted mb-14 text-[1.1rem]">
                        Links to manufacturer support pages for quick help
                    </p>
                    <div className="resources-grid">
                        {data.officialResources.map((resource, idx) => (
                            <a
                                key={idx}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="resource-card"
                                aria-label={`Visit ${resource.title}`}
                            >
                                <div className="resource-card-logo">
                                    <BrandLogo title={resource.title} />
                                </div>
                                <div className="resource-card-name">{resource.title}</div>
                                <div className="resource-card-arrow">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
                                    </svg>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-sst-beige text-sst-primary text-center">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-title mb-8">Need a Hand? We're Here For You!</h2>
                    <p className="text-h3 text-sst-primary/80 font-light mb-12 leading-relaxed">
                        If you're stuck, don't worry—you don't have to figure it out alone.
                        We'll walk you through any issue with patience and clear instructions.
                        Whether it's a simple setup or frustrating error, we've got your back.
                    </p>
                    <Link href="/booking">
                        <button className="px-12 py-5 bg-sst-primary text-white font-bold rounded-full hover:bg-sst-secondary transition-all text-h3 shadow-2xl">
                            Book a Personal Session
                        </button>
                    </Link>
                </div>
            </section>
        </main>
    )
}
