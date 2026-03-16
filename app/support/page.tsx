'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import withAuth from '@/components/withAuth'
import { supabase } from '@/lib/supabase'
import {
    TicketPlus,
    Clock,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Send,
    Tag,
    Loader2,
    MessageSquare,
    Filter,
    Inbox
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
    first_response_due: string | null
    resolved_at: string | null
}

type Tab = 'open' | 'resolved' | 'all'

const CATEGORIES = ['General', 'Device Repair', 'Software', 'Network', 'Account', 'Billing']
const PRIORITIES = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-600' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
]

function getStatusStyle(status: string) {
    switch (status) {
        case 'open': return 'bg-red-100 text-red-700 border-red-200'
        case 'replied': return 'bg-blue-100 text-blue-700 border-blue-200'
        case 'resolved': return 'bg-green-100 text-green-700 border-green-200'
        case 'closed': return 'bg-gray-100 text-gray-500 border-gray-200'
        default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
}

function getPriorityStyle(priority: string) {
    switch (priority) {
        case 'urgent': return 'bg-red-50 text-red-600'
        case 'high': return 'bg-orange-50 text-orange-600'
        case 'medium': return 'bg-blue-50 text-blue-600'
        case 'low': return 'bg-gray-50 text-gray-500'
        default: return 'bg-gray-50 text-gray-500'
    }
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function SupportContent() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<Tab>('open')
    const [showForm, setShowForm] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)

    // Form state
    const [subject, setSubject] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('General')
    const [priority, setPriority] = useState('medium')

    useEffect(() => {
        fetchTickets()
    }, [])

    const fetchTickets = async () => {
        setLoading(true)
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
            setLoading(false)
        }
    }

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
                body: JSON.stringify({ subject, description, category, priority }),
            })

            if (res.ok) {
                setSubmitStatus('success')
                setSubject('')
                setDescription('')
                setCategory('General')
                setPriority('medium')
                setShowForm(false)
                fetchTickets()
            } else {
                setSubmitStatus('error')
            }
        } catch (err) {
            setSubmitStatus('error')
        } finally {
            setSubmitting(false)
        }
    }

    const filtered = tickets.filter(t => {
        if (tab === 'open') return t.status === 'open' || t.status === 'replied'
        if (tab === 'resolved') return t.status === 'resolved' || t.status === 'closed'
        return true
    })

    const counts = {
        open: tickets.filter(t => t.status === 'open' || t.status === 'replied').length,
        resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
        all: tickets.length,
    }

    return (
        <div className="bg-kb-bg min-h-screen py-16 md:py-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-title mb-2">Support Center</h1>
                        <p className="text-kb-dark text-lg">Submit tickets, track progress, and get help from our team.</p>
                    </div>
                    <button
                        onClick={() => { setShowForm(!showForm); setSubmitStatus(null) }}
                        className="px-6 py-3 bg-sst-primary text-white font-bold rounded-xl hover:bg-sst-secondary transition-all shadow-md flex items-center gap-2"
                    >
                        <TicketPlus size={18} />
                        {showForm ? 'Cancel' : 'New Ticket'}
                    </button>
                </div>

                {/* Success toast */}
                <AnimatePresence>
                    {submitStatus === 'success' && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-6 bg-green-50 border border-green-200 text-green-800 p-4 rounded-2xl flex items-center gap-3"
                        >
                            <CheckCircle2 size={20} />
                            <p className="font-medium text-sm">Your ticket has been submitted! We&apos;ll respond as soon as possible.</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* New Ticket Form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-8"
                        >
                            <div className="bg-white rounded-[2rem] shadow-xl border border-kb-cream p-8 md:p-10">
                                <h2 className="text-xl font-bold text-kb-navy mb-6 flex items-center gap-2">
                                    <TicketPlus size={22} className="text-kb-navy/50" />
                                    Submit a Support Ticket
                                </h2>

                                {submitStatus === 'error' && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-6 flex items-center gap-3">
                                        <AlertCircle size={18} />
                                        <p className="text-sm font-medium">Something went wrong. Please try again.</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label htmlFor="subject" className="block text-sst-primary font-bold mb-2">Subject *</label>
                                        <input
                                            id="subject"
                                            type="text"
                                            required
                                            value={subject}
                                            onChange={e => setSubject(e.target.value)}
                                            className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all"
                                            placeholder="Brief summary of your issue"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="description" className="block text-sst-primary font-bold mb-2">Description *</label>
                                        <textarea
                                            id="description"
                                            required
                                            rows={4}
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all"
                                            placeholder="Please describe the issue in detail — what happened, what you expected, any error messages, etc."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="category" className="block text-sst-primary font-bold mb-2">Category</label>
                                            <select
                                                id="category"
                                                value={category}
                                                onChange={e => setCategory(e.target.value)}
                                                className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all appearance-none"
                                            >
                                                {CATEGORIES.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sst-primary font-bold mb-2">Priority</label>
                                            <div className="flex gap-2">
                                                {PRIORITIES.map(p => (
                                                    <button
                                                        key={p.value}
                                                        type="button"
                                                        onClick={() => setPriority(p.value)}
                                                        className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border-2 ${
                                                            priority === p.value
                                                                ? 'border-sst-primary ring-2 ring-sst-primary/20 ' + p.color
                                                                : 'border-transparent ' + p.color + ' opacity-60 hover:opacity-80'
                                                        }`}
                                                    >
                                                        {p.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className={`w-full py-5 bg-sst-primary text-white font-bold rounded-2xl hover:bg-sst-secondary transition-all shadow-lg text-lg flex items-center justify-center gap-2 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {submitting ? (
                                            <><Loader2 size={20} className="animate-spin" /> Submitting...</>
                                        ) : (
                                            <><Send size={18} /> Submit Ticket</>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tickets List */}
                <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-kb-cream">
                    {/* Tabs */}
                    <div className="flex border-b border-kb-cream p-4 gap-3 bg-gray-50/50">
                        {(['open', 'resolved', 'all'] as Tab[]).map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`px-5 py-2 font-bold rounded-xl text-sm transition-all capitalize flex items-center gap-2 ${
                                    tab === t
                                        ? 'bg-kb-navy text-white shadow-sm'
                                        : 'text-kb-muted hover:bg-gray-100'
                                }`}
                            >
                                {t === 'open' ? 'Active' : t}
                                {counts[t] > 0 && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                        tab === t ? 'bg-white/20 text-white' : 'bg-gray-200 text-kb-muted'
                                    }`}>
                                        {counts[t]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 md:p-10">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-10 h-10 border-4 border-sst-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16 px-4 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-kb-navy/5 text-kb-navy rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Inbox size={24} />
                                </div>
                                <h3 className="mb-2 font-bold text-kb-navy">
                                    {tab === 'open' ? 'No active tickets' : tab === 'resolved' ? 'No resolved tickets yet' : 'No tickets yet'}
                                </h3>
                                <p className="text-kb-muted mb-6 max-w-md mx-auto">
                                    {tab === 'open'
                                        ? "You don't have any open support tickets. Need help with something?"
                                        : tab === 'resolved'
                                        ? "Your resolved tickets will appear here."
                                        : "Submit your first ticket to get started!"}
                                </p>
                                {(tab === 'open' || tab === 'all') && (
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="inline-flex px-8 py-3 bg-white border-2 border-sst-primary text-sst-primary font-bold rounded-xl hover:bg-gray-50 transition-all"
                                    >
                                        Submit a Ticket
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filtered.map(ticket => (
                                    <Link
                                        key={ticket.id}
                                        href={`/support/${ticket.id}`}
                                        className="block bg-gray-50/60 rounded-2xl border border-gray-100 p-5 hover:bg-gray-50 hover:border-kb-navy/10 hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                                    <span className="text-[10px] font-mono text-kb-muted bg-gray-100 px-2 py-0.5 rounded">
                                                        SST-{String(ticket.ticket_number).padStart(4, '0')}
                                                    </span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusStyle(ticket.status)}`}>
                                                        {ticket.status}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getPriorityStyle(ticket.priority)}`}>
                                                        {ticket.priority}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-kb-navy text-base leading-tight mb-1 truncate">
                                                    {ticket.subject}
                                                </h3>
                                                <div className="flex items-center gap-4 text-xs text-kb-muted">
                                                    <span className="flex items-center gap-1">
                                                        <Tag size={11} />
                                                        {ticket.category}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={11} />
                                                        {timeAgo(ticket.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight size={20} className="text-kb-muted group-hover:text-kb-navy transition-colors shrink-0 mt-1" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function SupportPage() {
    return <SupportContent />
}

export default withAuth(SupportPage)
