'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    })
    const [status, setStatus] = useState<null | 'success' | 'error'>(null)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // In a real app, you'd send this to an API
        console.log('Form submitted:', formData)
        setStatus('success')
    }

    return (
        <div className="bg-kb-bg min-h-screen py-16 md:py-24">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-title text-center mb-16">
                    Get In Touch
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Contact Info */}
                    <div className="bg-white p-10 md:p-12 rounded-3xl shadow-xl">
                        <h2 className="mb-10">Contact Information</h2>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <span className="text-3xl">📞</span>
                                <div>
                                    <h3 className="mb-1">Phone</h3>
                                    <a href="tel:5852109758" className="text-2xl text-sst-primary font-semibold hover:text-sst-secondary transition-colors">
                                        (585) 210-9758
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <span className="text-3xl">✉️</span>
                                <div>
                                    <h3 className="mb-1">Email</h3>
                                    <a href="mailto:smartsasstech@gmail.com" className="text-2xl text-sst-primary font-semibold hover:text-sst-secondary transition-colors underline">
                                        smartsasstech@gmail.com
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <span className="text-3xl">📍</span>
                                <div>
                                    <h3 className="mb-1">Service Area</h3>
                                    <p className="text-xl text-kb-dark">
                                        Rochester, NY and surrounding areas
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-10 border-t border-kb-cream">
                            <h3 className="mb-6">Prefer to Book Online?</h3>
                            <Link href="/booking">
                                <button className="px-8 py-4 bg-sst-primary text-white font-bold rounded-full hover:bg-sst-secondary transition-all shadow-lg">
                                    Book a Session
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white p-10 md:p-12 rounded-3xl shadow-xl">
                        <h2 className="mb-10">Send Us a Message</h2>

                        {status === 'success' ? (
                            <div className="bg-green-100 text-green-800 p-6 rounded-2xl text-center">
                                <h3 className="mb-2">Message Sent!</h3>
                                <p>Thank you for reaching out. We'll get back to you shortly.</p>
                                <button onClick={() => setStatus(null)} className="mt-4 text-sst-primary font-bold underline">Send another message</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sst-primary font-bold mb-2">Your Name *</label>
                                    <input
                                        type="text"
                                        id="name"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all"
                                        placeholder="Jane Doe"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sst-primary font-bold mb-2">Email Address *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all"
                                        placeholder="jane@example.com"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-sst-primary font-bold mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all"
                                        placeholder="(585) 000-0000"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sst-primary font-bold mb-2">Message *</label>
                                    <textarea
                                        id="message"
                                        required
                                        rows={4}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all"
                                        placeholder="How can we help you today?"
                                    ></textarea>
                                </div>

                                <button type="submit" className="w-full py-5 bg-sst-primary text-white font-bold rounded-2xl hover:bg-sst-secondary transition-all shadow-lg text-lg">
                                    Send Message
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
