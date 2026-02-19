import { notFound } from 'next/navigation'
import Link from 'next/link'
import { EXPERTISE_DATA } from '@/lib/expertise-data'

export async function generateStaticParams() {
    return Object.keys(EXPERTISE_DATA).map((category) => ({
        category,
    }))
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

            {/* Official Resources */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-heading font-medium text-sst-primary mb-16 text-center">
                        Official Support & Resources
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {data.officialResources.map((resource, idx) => (
                            <a
                                key={idx}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-kb-bg/20 p-6 rounded-2xl text-center hover:bg-sst-primary hover:text-white transition-all border border-kb-cream"
                            >
                                <div className="font-bold text-lg">{resource.title}</div>
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
