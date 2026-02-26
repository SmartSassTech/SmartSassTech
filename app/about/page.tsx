import Link from 'next/link'

export default function AboutPage() {
    return (
        <div className="bg-kb-bg min-h-screen py-16 md:py-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-title text-center mb-12">
                    About SmartSass Tech
                </h1>

                <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl leading-relaxed">
                    <h2 className="mb-6">Patient, Jargon-Free Support</h2>
                    <p className="text-xl text-kb-dark mb-8">
                        At SmartSass Tech, we believe technology should empower you, not frustrate you.
                        That's why we specialize in patient, jargon-free technology support designed specifically
                        for older adults and beginners in the Rochester, NY area.
                    </p>

                    <h3 className="mb-4">Our Approach</h3>
                    <p className="text-kb-dark mb-8">
                        We understand that technology can be overwhelming. Our personalized, one-on-one sessions
                        are conducted at your pace, in plain English. We never rush you, and we never make you
                        feel silly for asking questions. Every question is valid, and we're here to help you
                        feel confident with your devices.
                    </p>

                    <h3 className="mb-4">What We Help With</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-kb-dark mb-10 list-none">
                        {[
                            { label: 'Devices', detail: 'Computers, smartphones, tablets, printers, and smart TVs' },
                            { label: 'Setup', detail: 'Getting your new devices ready to use' },
                            { label: 'Troubleshooting', detail: 'Fixing problems and errors' },
                            { label: 'Training', detail: 'Learning how to use your technology effectively' },
                            { label: 'Internet & Email', detail: 'WiFi setup, email configuration, and safety' },
                            { label: 'Video Calls', detail: 'Zoom, FaceTime, and staying connected' },
                            { label: 'Security', detail: 'Passwords, scam protection, and banking' },
                            { label: 'Updates & Cloud', detail: 'iCloud, Google Photos, and system updates' },
                        ].map((item) => (
                            <li key={item.label} className="flex gap-2">
                                <span className="text-sst-primary">✓</span>
                                <div>
                                    <strong className="text-sst-primary">{item.label}:</strong> {item.detail}
                                </div>
                            </li>
                        ))}
                    </ul>

                    <h3 className="mb-4">Why Choose Us?</h3>
                    <div className="space-y-4 mb-12">
                        {[
                            { title: 'Patience First', text: 'We take the time to explain things clearly and thoroughly.' },
                            { title: 'No Jargon', text: 'We speak in plain English, not tech-speak.' },
                            { title: 'Personalized Support', text: 'One-on-one sessions tailored to your needs.' },
                            { title: 'Local to Rochester', text: 'Serving our community with pride.' },
                        ].map((reason) => (
                            <div key={reason.title} className="flex items-start gap-3">
                                <span className="text-2xl">✓</span>
                                <div>
                                    <h4 className="font-bold text-sst-primary">{reason.title}</h4>
                                    <p className="text-kb-muted">{reason.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center pt-12 border-t border-kb-cream">
                        <h2 className="mb-4">Ready to Get Started?</h2>
                        <p className="text-lg text-kb-dark mb-8">
                            Book a session today and experience the difference patient, personalized tech support can make.
                        </p>
                        <Link href="/booking">
                            <button className="px-10 py-4 bg-sst-primary text-white font-bold rounded-full hover:bg-sst-secondary transition-all text-xl shadow-lg">
                                Book Your Session
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
