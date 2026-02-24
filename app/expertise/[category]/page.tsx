import { notFound } from 'next/navigation'
import Link from 'next/link'
import { EXPERTISE_DATA } from '@/lib/expertise-data'

export async function generateStaticParams() {
    return Object.keys(EXPERTISE_DATA).map((category) => ({
        category,
    }))
}

// Map resource titles to their official brand logo SVG paths (stored in public/assets)
// We use inline SVG data-URIs for well-known brands for reliability
function BrandLogo({ title }: { title: string }) {
    const t = title.toLowerCase()

    // Apple
    if (t.includes('apple')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 814 1000" className="resource-logo" aria-hidden="true">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-36.8-162.8-128.3C46.5 510.4 8.8 387.3 8.8 269.8c0-159.5 104.5-244.1 199.2-244.1 74.9 0 129.5 49.2 174.9 49.2 42.8 0 109.8-52.5 194.5-52.5 31.2 0 108.1 6.4 160.9 108.2zm-234.2-112c31.2-37.2 53.3-88.4 53.3-139.6 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.5 33.7-146.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 134.3-70.8z" />
            </svg>
        )
    }
    // Google
    if (t.includes('google') || t.includes('android') || t.includes('pixel') || t.includes('nest')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 488" className="resource-logo" aria-hidden="true">
                <path fill="#4285F4" d="M488 250c0-16.5-1.4-32.4-4-47.8H249v90.4h134.7c-5.8 31.3-23.3 57.8-49.7 75.5v62.8h80.5C470.8 385 488 322.4 488 250z" />
                <path fill="#34A853" d="M249 488c67.5 0 124.2-22.4 165.5-60.8l-80.5-62.8c-22.4 15-51 23.9-85 23.9-65.3 0-120.7-44.1-140.5-103.4H25v64.7C66 432.8 151.2 488 249 488z" />
                <path fill="#FBBC05" d="M108.5 285c-5.2-15.3-8.1-31.6-8.1-48.5s2.9-33.2 8.1-48.5v-64.7H25C9 157.2 0 202.5 0 249.5s9 92.3 25 125.2l83.5-64.7z" />
                <path fill="#EA4335" d="M249 99.5c36.8 0 69.8 12.7 95.8 37.5l71.7-71.7C374.9 24.6 316.5 0 249 0 151.2 0 66 55.2 25 124.3l83.5 64.7C128.3 130.3 183.7 99.5 249 99.5z" />
            </svg>
        )
    }
    // Samsung
    if (t.includes('samsung')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 124 24" className="resource-logo resource-logo--wide" aria-hidden="true">
                <text x="0" y="20" fontFamily="sans-serif" fontWeight="bold" fontSize="22" fill="#1428A0">Samsung</text>
            </svg>
        )
    }
    // Microsoft
    if (t.includes('microsoft')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" className="resource-logo" aria-hidden="true">
                <rect x="0" y="0" width="11" height="11" fill="#F25022" />
                <rect x="12" y="0" width="11" height="11" fill="#7FBA00" />
                <rect x="0" y="12" width="11" height="11" fill="#00A4EF" />
                <rect x="12" y="12" width="11" height="11" fill="#FFB900" />
            </svg>
        )
    }
    // HP
    if (t.startsWith('hp') || t.includes('hp ')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" className="resource-logo" aria-hidden="true">
                <circle cx="30" cy="30" r="30" fill="#0096D6" />
                <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize="24" fill="white">hp</text>
            </svg>
        )
    }
    // Dell
    if (t.includes('dell')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30" className="resource-logo resource-logo--wide" aria-hidden="true">
                <text x="0" y="24" fontFamily="sans-serif" fontWeight="900" fontSize="28" fill="#007DB8">Dell</text>
            </svg>
        )
    }
    // Lenovo
    if (t.includes('lenovo')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 30" className="resource-logo resource-logo--wide" aria-hidden="true">
                <text x="0" y="24" fontFamily="sans-serif" fontWeight="bold" fontSize="22" fill="#E2231A">LENOVO</text>
            </svg>
        )
    }
    // Amazon
    if (t.includes('amazon') || t.includes('fire')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30" className="resource-logo resource-logo--wide" aria-hidden="true">
                <text x="0" y="22" fontFamily="sans-serif" fontWeight="bold" fontSize="20" fill="#FF9900">amazon</text>
            </svg>
        )
    }
    // Roku
    if (t.includes('roku')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30" className="resource-logo resource-logo--wide" aria-hidden="true">
                <text x="0" y="24" fontFamily="sans-serif" fontWeight="bold" fontSize="26" fill="#6C1D8E">Roku</text>
            </svg>
        )
    }
    // Fitbit
    if (t.includes('fitbit')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 30" className="resource-logo resource-logo--wide" aria-hidden="true">
                <text x="0" y="24" fontFamily="sans-serif" fontWeight="bold" fontSize="22" fill="#00B0B9">fitbit</text>
            </svg>
        )
    }
    // Garmin
    if (t.includes('garmin')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30" className="resource-logo resource-logo--wide" aria-hidden="true">
                <text x="0" y="24" fontFamily="sans-serif" fontWeight="bold" fontSize="22" fill="#007DC5">Garmin</text>
            </svg>
        )
    }
    // Ring
    if (t.includes('ring')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 30" className="resource-logo resource-logo--wide" aria-hidden="true">
                <text x="0" y="24" fontFamily="sans-serif" fontWeight="bold" fontSize="24" fill="#2F7EB5">Ring</text>
            </svg>
        )
    }
    // Arlo
    if (t.includes('arlo')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 30" className="resource-logo resource-logo--wide" aria-hidden="true">
                <text x="0" y="24" fontFamily="sans-serif" fontWeight="bold" fontSize="24" fill="#18A0A0">Arlo</text>
            </svg>
        )
    }
    // Epson
    if (t.includes('epson')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30" className="resource-logo resource-logo--wide" aria-hidden="true">
                <text x="0" y="24" fontFamily="sans-serif" fontWeight="bold" fontSize="22" fill="#003087">EPSON</text>
            </svg>
        )
    }
    // Brother
    if (t.includes('brother')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 30" className="resource-logo resource-logo--wide" aria-hidden="true">
                <text x="0" y="24" fontFamily="sans-serif" fontWeight="bold" fontSize="22" fill="#003087">brother</text>
            </svg>
        )
    }
    // Canon
    if (t.includes('canon')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30" className="resource-logo resource-logo--wide" aria-hidden="true">
                <text x="0" y="24" fontFamily="sans-serif" fontWeight="bold" fontSize="22" fill="#CC0000">Canon</text>
            </svg>
        )
    }
    // Spectrum
    if (t.includes('spectrum')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 30" className="resource-logo resource-logo--wide" aria-hidden="true">
                <text x="0" y="24" fontFamily="sans-serif" fontWeight="bold" fontSize="20" fill="#0084BE">Spectrum</text>
            </svg>
        )
    }
    // Netgear
    if (t.includes('netgear')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 30" className="resource-logo resource-logo--wide" aria-hidden="true">
                <text x="0" y="24" fontFamily="sans-serif" fontWeight="bold" fontSize="20" fill="#E31837">NETGEAR</text>
            </svg>
        )
    }
    // TP-Link
    if (t.includes('tp-link')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30" className="resource-logo resource-logo--wide" aria-hidden="true">
                <text x="0" y="24" fontFamily="sans-serif" fontWeight="bold" fontSize="20" fill="#4CB748">TP-Link</text>
            </svg>
        )
    }
    // Logitech
    if (t.includes('logitech') || t.includes('logi')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 30" className="resource-logo resource-logo--wide" aria-hidden="true">
                <text x="0" y="24" fontFamily="sans-serif" fontWeight="bold" fontSize="20" fill="#00B7EB">Logitech</text>
            </svg>
        )
    }

    // Fallback: text initials
    const initials = title.split(' ').slice(0, 2).map(w => w[0]).join('')
    return (
        <span className="resource-logo-fallback">{initials}</span>
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
            <section className="bg-kb-bg py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-5xl md:text-6xl font-heading font-medium text-sst-primary mb-8 tracking-tight">
                        {data.heroTitle}
                    </h1>
                    <Link href={data.quizLink}>
                        <button className="px-10 py-4 bg-sst-primary text-white font-bold rounded-full hover:bg-sst-secondary transition-all text-xl shadow-lg">
                            Take {data.quizName}
                        </button>
                    </Link>
                </div>
            </section>

            {/* Info Section */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-heading font-medium text-sst-primary mb-16 text-center">
                        {data.comparison.title}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                        {data.comparison.cards.map((card, idx) => (
                            <div key={idx} className="bg-kb-bg/30 p-10 rounded-3xl border border-kb-cream">
                                <h3 className="text-2xl font-bold text-sst-primary mb-4">{card.title}</h3>
                                <p className="text-kb-dark text-lg leading-relaxed">{card.description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-sst-beige/30 p-12 rounded-[3rem] text-center border-2 border-dashed border-sst-beige">
                        <p className="text-xl text-sst-primary mb-10 leading-relaxed max-w-3xl mx-auto">
                            <strong>TIP:</strong> {data.tip}
                        </p>
                        <h3 className="text-3xl font-heading font-medium text-sst-primary mb-4">{data.matchTitle}</h3>
                        <p className="text-lg text-kb-dark mb-10">{data.matchDescription}</p>
                        <Link href={data.quizLink}>
                            <button className="px-10 py-4 bg-sst-primary text-white font-bold rounded-full hover:bg-sst-secondary transition-all text-xl">
                                Take Quiz
                            </button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* What We Help With */}
            <section className="py-24 bg-kb-bg/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-heading font-medium text-sst-primary mb-16 text-center">
                        Specific {data.title} Help We Provide
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {data.helpItems.map((item, idx) => (
                            <div key={idx} className="bg-white p-10 rounded-3xl shadow-md hover:shadow-xl transition-all border border-kb-cream/50">
                                <div className="text-5xl mb-6">{item.icon}</div>
                                <h3 className="text-xl font-bold text-sst-primary mb-4">{item.title}</h3>
                                <p className="text-kb-dark leading-relaxed">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Official Resources — brand logo cards, centered */}
            <section className="py-24 bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-heading font-medium text-sst-primary mb-4 text-center">
                        Official Support &amp; Resources
                    </h2>
                    <p className="text-center text-kb-muted mb-14 text-lg">
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
                    <h2 className="text-4xl md:text-5xl font-heading font-medium mb-8 tracking-tight">Need a Hand? We're Here For You!</h2>
                    <p className="text-xl md:text-2xl text-sst-primary/80 font-light mb-12 leading-relaxed">
                        If you're stuck, don't worry—you don't have to figure it out alone.
                        We'll walk you through any issue with patience and clear instructions.
                        Whether it's a simple setup or frustrating error, we've got your back.
                    </p>
                    <Link href="/booking">
                        <button className="px-12 py-5 bg-sst-primary text-white font-bold rounded-full hover:bg-sst-secondary transition-all text-2xl shadow-2xl">
                            Book a Personal Session
                        </button>
                    </Link>
                </div>
            </section>
        </main>
    )
}
