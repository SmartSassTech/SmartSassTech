'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
    ChevronRight,
    Send,
    Loader2,
    Inbox,
    Smartphone,
    Monitor,
    Wifi,
    DollarSign,
    HelpCircle,
    CheckCircle2,
    AlertCircle,
    Phone,
    Mail,
    MapPin,
    Bot,
    Users,
    FileText
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'

// Lazy-load the inline chatbot (it pulls in heavy deps like marked / sanitize-html)
const InlineChatbot = dynamic(() => import('@/components/InlineChatbot'), {
    loading: () => (
        <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-sst-primary border-t-transparent rounded-full animate-spin" />
        </div>
    ),
})

// =============================================================
// Types
// =============================================================

interface Ticket {
    id: string
    ticket_number: number
    subject: string
    description: string
    status: string
    priority: string
    category: string
    source: string
    created_at: string
    updated_at: string
}

interface UserProfile {
    id: string
    role?: string
}

// =============================================================
// Category cards — large icon tiles for ticket creation
// =============================================================

const CATEGORY_CARDS = [
    { value: 'Device Repair', label: 'Phone / Tablet', emoji: '📱' },
    { value: 'Software',      label: 'Computer',      emoji: '💻' },
    { value: 'Network',       label: 'Internet / WiFi', emoji: '🌐' },
    { value: 'Billing',       label: 'Billing',       emoji: '💰' },
    { value: 'General',       label: 'Something Else', emoji: '❓' },
]

// =============================================================
// Helpers
// =============================================================

function friendlyStatus(status: string): { text: string; color: string } {
    switch (status) {
        case 'open':     return { text: 'Waiting for our team', color: 'border-l-amber-400 bg-amber-50/60' }
        case 'replied':  return { text: 'We responded!',        color: 'border-l-blue-400 bg-blue-50/60' }
        case 'resolved': return { text: 'Resolved ✓',           color: 'border-l-green-400 bg-green-50/60' }
        case 'closed':   return { text: 'Closed',               color: 'border-l-gray-300 bg-gray-50/60' }
        default:         return { text: status,                  color: 'border-l-gray-300 bg-gray-50/60' }
    }
}

function friendlyDate(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// =============================================================
// Contact Info Card
// =============================================================

function ContactCard() {
    return (
        <div className="bg-white rounded-3xl shadow-xl border border-kb-cream p-8 md:p-10">
            <h2 className="text-xl font-bold text-kb-navy mb-6">Contact Info</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sst-primary/10 flex items-center justify-center shrink-0">
                        <Phone size={20} className="text-sst-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-kb-navy mb-0.5">Call Us</p>
                        <a href="tel:5852109758" className="text-sst-primary font-semibold hover:text-sst-secondary transition-colors">
                            (585) 210-9758
                        </a>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sst-primary/10 flex items-center justify-center shrink-0">
                        <Mail size={20} className="text-sst-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-kb-navy mb-0.5">Email Us</p>
                        <a href="mailto:smartsasstech@gmail.com" className="text-sst-primary font-semibold hover:text-sst-secondary transition-colors underline">
                            smartsasstech@gmail.com
                        </a>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sst-primary/10 flex items-center justify-center shrink-0">
                        <MapPin size={20} className="text-sst-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-kb-navy mb-0.5">Service Area</p>
                        <p className="text-kb-dark">Rochester, NY area</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// =============================================================
// 3 Support Option Cards
// =============================================================

type SupportOption = 'ai-chat' | 'human-chat' | 'ticket' | null

function SupportOptionCards({ onSelect }: { onSelect: (opt: SupportOption) => void }) {
    const cards = [
        {
            id: 'ai-chat' as SupportOption,
            icon: Bot,
            title: 'Chat with our Tech Assistant',
            description: 'Get instant answers to tech questions from our AI helper',
            color: 'from-blue-500 to-indigo-600',
            hoverColor: 'hover:shadow-blue-200/50',
        },
        {
            id: 'human-chat' as SupportOption,
            icon: Users,
            title: 'Talk to a Person',
            description: 'Connect with a real person for hands-on help',
            color: 'from-emerald-500 to-teal-600',
            hoverColor: 'hover:shadow-emerald-200/50',
        },
        {
            id: 'ticket' as SupportOption,
            icon: FileText,
            title: 'Submit a Help Request',
            description: "Describe your issue and we'll get back to you",
            color: 'from-amber-500 to-orange-600',
            hoverColor: 'hover:shadow-amber-200/50',
        },
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {cards.map(card => (
                <motion.button
                    key={card.id}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect(card.id)}
                    className={`group text-left bg-white rounded-3xl shadow-lg border border-kb-cream p-7 transition-all hover:shadow-xl ${card.hoverColor} cursor-pointer`}
                >
                    <div className={`w-14 h-14 bg-gradient-to-br ${card.color} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                        <card.icon size={26} className="text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-kb-navy mb-2 leading-tight">{card.title}</h3>
                    <p className="text-kb-muted text-sm leading-relaxed">{card.description}</p>
                </motion.button>
            ))}
        </div>
    )
}

// =============================================================
// Ticket Form (simplified)
// =============================================================

function TicketForm({ onSuccess, onBack }: { onSuccess: () => void; onBack: () => void }) {
    const [subject, setSubject] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('General')
    const [submitting, setSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setSubmitStatus(null)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return
            const res = await fetch('/api/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ subject, description, category }),
            })
            if (res.ok) {
                setSubmitStatus('success')
                setSubject('')
                setDescription('')
                setCategory('General')
                onSuccess()
            } else {
                setSubmitStatus('error')
            }
        } catch {
            setSubmitStatus('error')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-kb-cream overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-5 flex items-center gap-3 text-white">
                <div className="bg-white/20 p-2 rounded-xl">
                    <FileText size={22} />
                </div>
                <div>
                    <h3 className="font-bold text-lg">Submit a Help Request</h3>
                    <p className="text-white/80 text-sm">Don&apos;t worry about the details — just tell us what&apos;s happening</p>
                </div>
            </div>

            <div className="p-8 md:p-10">
                <AnimatePresence>
                    {submitStatus === 'success' && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-6 bg-green-50 border border-green-200 text-green-800 p-5 rounded-2xl flex items-center gap-3"
                        >
                            <CheckCircle2 size={20} />
                            <p className="font-medium">Your request has been submitted! We&apos;ll get back to you soon.</p>
                        </motion.div>
                    )}
                    {submitStatus === 'error' && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3"
                        >
                            <AlertCircle size={18} />
                            <p className="text-sm font-medium">Something went wrong. Please try again.</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Category — icon cards */}
                    <div>
                        <label className="block text-sst-primary font-bold mb-3 text-base">What is this about?</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {CATEGORY_CARDS.map(cat => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setCategory(cat.value)}
                                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all text-center min-h-[90px] ${
                                        category === cat.value
                                            ? 'border-sst-primary bg-sst-primary/5 ring-2 ring-sst-primary/20 shadow-md'
                                            : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                                    }`}
                                >
                                    <span className="text-2xl">{cat.emoji}</span>
                                    <span className={`text-xs font-bold leading-tight ${category === cat.value ? 'text-sst-primary' : 'text-kb-dark'}`}>
                                        {cat.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="ticket-subject" className="block text-sst-primary font-bold mb-2 text-base">What&apos;s going on? *</label>
                        <input
                            id="ticket-subject" type="text" required
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all text-base"
                            placeholder="e.g., My phone won't connect to WiFi"
                        />
                    </div>

                    <div>
                        <label htmlFor="ticket-description" className="block text-sst-primary font-bold mb-2 text-base">Tell us more *</label>
                        <textarea
                            id="ticket-description" required rows={4}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all text-base resize-none"
                            placeholder="What were you trying to do? What happened?"
                        />
                    </div>

                    <button
                        type="submit" disabled={submitting}
                        className={`w-full py-5 bg-sst-primary text-white font-bold rounded-2xl hover:bg-sst-secondary transition-all shadow-lg text-lg flex items-center justify-center gap-2 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {submitting ? <><Loader2 size={20} className="animate-spin" /> Submitting...</> : <><Send size={18} /> Submit Request</>}
                    </button>
                </form>

                <div className="mt-6 flex justify-center">
                    <button onClick={onBack} className="text-kb-muted hover:text-sst-primary text-sm font-medium flex items-center gap-1 transition-colors">
                        ← Back to support options
                    </button>
                </div>
            </div>
        </div>
    )
}

// =============================================================
// Ticket List (simplified)
// =============================================================

function TicketList({ tickets, loading }: { tickets: Ticket[]; loading: boolean }) {
    const [tab, setTab] = useState<'active' | 'completed'>('active')

    const filtered = tickets.filter(t => {
        if (tab === 'active') return t.status === 'open' || t.status === 'replied'
        return t.status === 'resolved' || t.status === 'closed'
    })

    const counts = {
        active: tickets.filter(t => t.status === 'open' || t.status === 'replied').length,
        completed: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
    }

    if (tickets.length === 0 && !loading) return null

    return (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-kb-cream">
            <div className="p-5 border-b border-kb-cream bg-gray-50/50">
                <h2 className="text-xl font-bold text-kb-navy mb-4">Your Past Requests</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setTab('active')}
                        className={`px-5 py-2.5 font-bold rounded-xl text-sm transition-all flex items-center gap-2 ${
                            tab === 'active' ? 'bg-kb-navy text-white shadow-sm' : 'text-kb-muted hover:bg-gray-100'
                        }`}
                    >
                        Needs Attention
                        {counts.active > 0 && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tab === 'active' ? 'bg-white/20 text-white' : 'bg-gray-200 text-kb-muted'}`}>
                                {counts.active}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setTab('completed')}
                        className={`px-5 py-2.5 font-bold rounded-xl text-sm transition-all flex items-center gap-2 ${
                            tab === 'completed' ? 'bg-kb-navy text-white shadow-sm' : 'text-kb-muted hover:bg-gray-100'
                        }`}
                    >
                        Completed
                        {counts.completed > 0 && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tab === 'completed' ? 'bg-white/20 text-white' : 'bg-gray-200 text-kb-muted'}`}>
                                {counts.completed}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="p-6 md:p-8">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-10 h-10 border-4 border-sst-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-10 px-4">
                        <Inbox size={28} className="mx-auto mb-3 text-kb-muted" />
                        <p className="text-kb-muted text-base">
                            {tab === 'active' ? 'No active requests right now.' : 'No completed requests yet.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(ticket => {
                            const status = friendlyStatus(ticket.status)
                            return (
                                <Link
                                    key={ticket.id}
                                    href={`/support/${ticket.id}`}
                                    className={`block rounded-2xl border-l-4 p-5 hover:shadow-md transition-all group ${status.color}`}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-kb-navy text-base leading-tight mb-1.5 truncate">
                                                {ticket.subject}
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm text-kb-muted">
                                                <span className="font-medium">{status.text}</span>
                                                <span>•</span>
                                                <span>{friendlyDate(ticket.created_at)}</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-kb-muted group-hover:text-kb-navy transition-colors shrink-0" />
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

// =============================================================
// Guest Ticket CTA (shown when guest tries to submit a request)
// =============================================================

function GuestTicketCTA({ onBack }: { onBack: () => void }) {
    return (
        <div className="bg-white rounded-3xl shadow-xl border border-kb-cream p-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                <FileText size={28} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-kb-navy mb-3">Log In to Submit a Request</h3>
            <p className="text-kb-dark text-base mb-6 max-w-md mx-auto">
                Submitting a help request lets you track your issue and get updates. Log in or create an account to get started.
            </p>
            <Link href="/login" className="inline-flex px-8 py-4 bg-sst-primary text-white font-bold rounded-2xl hover:bg-sst-secondary transition-all shadow-lg text-lg">
                Log In or Sign Up
            </Link>
            <div className="mt-6">
                <button onClick={onBack} className="text-kb-muted hover:text-sst-primary text-sm font-medium transition-colors">
                    ← Back to support options
                </button>
            </div>
        </div>
    )
}

// =============================================================
// Main Page
// =============================================================

export default function HelpCenterPage() {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [authLoading, setAuthLoading] = useState(true)
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [ticketsLoading, setTicketsLoading] = useState(false)
    const [activeOption, setActiveOption] = useState<SupportOption>(null)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                supabase.from('profiles').select('role').eq('id', session.user.id).single()
                    .then(({ data }) => {
                        setUser({ id: session.user.id, role: data?.role || 'client' })
                    })
            }
            setAuthLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                supabase.from('profiles').select('role').eq('id', session.user.id).single()
                    .then(({ data }) => {
                        setUser({ id: session.user.id, role: data?.role || 'client' })
                    })
            } else {
                setUser(null)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        if (user) fetchTickets()
    }, [user])

    const fetchTickets = async () => {
        setTicketsLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return
            const res = await fetch('/api/tickets', {
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            })
            const data = await res.json()
            if (res.ok) setTickets(data.tickets || [])
        } catch (err) {
            console.error('Error fetching tickets:', err)
        } finally {
            setTicketsLoading(false)
        }
    }

    const handleBack = () => setActiveOption(null)

    if (authLoading) {
        return (
            <div className="bg-kb-bg min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-sst-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="bg-kb-bg min-h-screen py-16 md:py-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-title mb-3">Help Center</h1>
                    <p className="text-kb-dark text-lg max-w-2xl mx-auto">
                        We&apos;re here to help! Choose how you&apos;d like to get support.
                    </p>
                </div>

                {/* Main content area */}
                <div className="space-y-8">
                    <AnimatePresence mode="wait">
                        {activeOption === null ? (
                            /* ─── Card picker ─── */
                            <motion.div
                                key="cards"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <SupportOptionCards onSelect={setActiveOption} />
                            </motion.div>
                        ) : activeOption === 'ai-chat' ? (
                            /* ─── AI Chat (inline) ─── */
                            <motion.div
                                key="ai-chat"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <InlineChatbot startWithHuman={false} onBack={handleBack} />
                            </motion.div>
                        ) : activeOption === 'human-chat' ? (
                            /* ─── Human Chat (inline) ─── */
                            <motion.div
                                key="human-chat"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <InlineChatbot startWithHuman={true} onBack={handleBack} />
                            </motion.div>
                        ) : activeOption === 'ticket' ? (
                            /* ─── Ticket form ─── */
                            <motion.div
                                key="ticket"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {user ? (
                                    <TicketForm onSuccess={fetchTickets} onBack={handleBack} />
                                ) : (
                                    <GuestTicketCTA onBack={handleBack} />
                                )}
                            </motion.div>
                        ) : null}
                    </AnimatePresence>

                    {/* Contact info — always visible */}
                    <ContactCard />

                    {/* Ticket list — logged-in users only */}
                    {user && <TicketList tickets={tickets} loading={ticketsLoading} />}

                    {/* Book a session CTA */}
                    <div className="text-center pt-2 pb-4">
                        <p className="text-kb-dark mb-3">Prefer hands-on help?</p>
                        <Link href="/booking" className="inline-flex px-8 py-3 bg-white border-2 border-sst-primary text-sst-primary font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                            Book a Session
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
