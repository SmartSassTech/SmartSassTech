'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    MessageSquare,
    Users,
    Clock,
    CheckCircle,
    RefreshCw,
    ArrowRight,
    Monitor,
    Wifi,
    WifiOff,
    Shield,
    ChevronRight,
    Loader2,
    AlertCircle,
    Circle
} from 'lucide-react'
import withAuth from '@/components/withAuth'
import { supabase } from '@/lib/supabase'

interface ChatSession {
    id: string
    status: 'open' | 'closed' | 'waiting'
    created_at: string
    updated_at: string
    user_id: string | null
    agent_id: string | null
    user_name?: string
    user_email?: string
    last_message?: string
    message_count?: number
}

function LiveChatDashboard() {
    const [activeSessions, setActiveSessions] = useState<ChatSession[]>([])
    const [closedSessions, setClosedSessions] = useState<ChatSession[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
    const [isRefreshing, setIsRefreshing] = useState(false)

    const fetchSessions = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        else setIsRefreshing(true)
        setError(null)

        try {
            // Fetch open/waiting sessions
            const { data: openData, error: openErr } = await supabase
                .from('chat_sessions')
                .select('*')
                .in('status', ['open', 'waiting'])
                .order('created_at', { ascending: false })
                .limit(20)

            if (openErr) throw openErr

            // Fetch recently closed sessions
            const { data: closedData, error: closedErr } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('status', 'closed')
                .order('updated_at', { ascending: false })
                .limit(10)

            if (closedErr) throw closedErr

            setActiveSessions(openData || [])
            setClosedSessions(closedData || [])
            setLastRefresh(new Date())
        } catch (err: any) {
            console.error('[Live Chat Dashboard] Error:', err)
            setError('Unable to load chat sessions. Please try again.')
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    useEffect(() => {
        fetchSessions()

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => fetchSessions(true), 30000)
        return () => clearInterval(interval)
    }, [fetchSessions])

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        const diffHrs = Math.floor(diffMins / 60)
        if (diffHrs < 24) return `${diffHrs}h ago`
        return date.toLocaleDateString()
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'text-green-500 bg-green-50'
            case 'waiting': return 'text-amber-500 bg-amber-50'
            case 'closed': return 'text-gray-400 bg-gray-50'
            default: return 'text-gray-400 bg-gray-50'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'open': return 'Active'
            case 'waiting': return 'Waiting'
            case 'closed': return 'Closed'
            default: return status
        }
    }

    const SessionCard = ({ session, isActive }: { session: ChatSession; isActive: boolean }) => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
        >
            <Link
                href={`/admin/live-chat/${session.id}`}
                className="group flex items-center justify-between bg-white p-5 rounded-2xl border border-gray-100 hover:border-sst-primary/30 hover:shadow-lg transition-all duration-200"
            >
                <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isActive ? 'bg-green-50' : 'bg-gray-50'}`}>
                        <MessageSquare size={20} className={isActive ? 'text-green-500' : 'text-gray-400'} />
                    </div>

                    {/* Session Info */}
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-kb-navy text-sm">
                                {session.user_email || session.user_name || `Session ${session.id.slice(0, 8)}...`}
                            </p>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${getStatusColor(session.status)}`}>
                                {getStatusLabel(session.status)}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                            <p className="text-xs text-kb-muted flex items-center gap-1">
                                <Clock size={11} />
                                Started {formatTime(session.created_at)}
                            </p>
                            {session.status === 'open' && (
                                <p className="text-xs text-green-500 flex items-center gap-1 font-medium">
                                    <Circle size={6} className="fill-green-500" />
                                    Live
                                </p>
                            )}
                        </div>
                        {session.last_message && (
                            <p className="text-xs text-kb-muted mt-1 truncate max-w-xs">{session.last_message}</p>
                        )}
                    </div>
                </div>

                {/* Arrow */}
                <ChevronRight
                    size={18}
                    className="text-gray-300 group-hover:text-sst-primary group-hover:translate-x-1 transition-all"
                />
            </Link>
        </motion.div>
    )

    return (
        <div className="min-h-screen bg-kb-bg pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-green-50 rounded-xl">
                                <MessageSquare className="text-green-500" size={22} />
                            </div>
                            <span className="text-green-600 font-bold tracking-widest uppercase text-xs">Agent Portal</span>
                        </div>
                        <h1 className="text-3xl font-black text-kb-navy">Live Chat Sessions</h1>
                        <p className="text-kb-muted mt-1 text-sm">
                            Monitor and join active client chat sessions in real time.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Live indicator */}
                        <div className="flex items-center gap-2 bg-green-50 px-4 py-2.5 rounded-2xl border border-green-100">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-bold text-green-700">
                                {activeSessions.length} Active
                            </span>
                        </div>

                        {/* Refresh */}
                        <button
                            onClick={() => fetchSessions(true)}
                            disabled={isRefreshing}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-kb-muted hover:text-sst-primary hover:border-sst-primary/30 transition-all disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Active Now', value: activeSessions.filter(s => s.status === 'open').length, color: 'green', icon: <Wifi size={18} className="text-green-500" /> },
                        { label: 'Waiting', value: activeSessions.filter(s => s.status === 'waiting').length, color: 'amber', icon: <Clock size={18} className="text-amber-500" /> },
                        { label: 'Closed Today', value: closedSessions.length, color: 'gray', icon: <CheckCircle size={18} className="text-gray-400" /> },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
                            <div className="p-2.5 bg-gray-50 rounded-xl">{stat.icon}</div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-kb-muted">{stat.label}</p>
                                <p className="text-2xl font-black text-kb-navy">{loading ? '—' : stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center gap-3 mb-6">
                        <AlertCircle size={20} className="text-red-500 shrink-0" />
                        <p className="text-sm text-red-700 font-medium">{error}</p>
                        <button onClick={() => fetchSessions()} className="ml-auto text-sm text-red-600 underline font-bold">
                            Retry
                        </button>
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 size={32} className="text-sst-primary animate-spin" />
                        <p className="text-sm text-kb-muted font-medium">Loading chat sessions...</p>
                    </div>
                ) : (
                    <>
                        {/* Active Sessions */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <h2 className="text-sm font-black uppercase tracking-widest text-kb-navy">Active & Waiting</h2>
                                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    {activeSessions.length}
                                </span>
                            </div>

                            {activeSessions.length === 0 ? (
                                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
                                    <div className="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                        <WifiOff size={28} className="text-green-300" />
                                    </div>
                                    <h3 className="font-black text-kb-navy mb-2">No Active Sessions</h3>
                                    <p className="text-sm text-kb-muted">
                                        Clients who start a live chat will appear here. Sessions refresh automatically.
                                    </p>
                                    <p className="text-xs text-kb-muted/60 mt-3">
                                        Last refreshed: {lastRefresh.toLocaleTimeString()}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <AnimatePresence>
                                        {activeSessions.map(session => (
                                            <SessionCard key={session.id} session={session} isActive />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Recent Closed Sessions */}
                        {closedSessions.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <h2 className="text-sm font-black uppercase tracking-widest text-kb-navy">Recent — Closed</h2>
                                    <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                        {closedSessions.length}
                                    </span>
                                </div>
                                <div className="space-y-3 opacity-70">
                                    <AnimatePresence>
                                        {closedSessions.map(session => (
                                            <SessionCard key={session.id} session={session} isActive={false} />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Back to Dashboard */}
                <div className="mt-12 pt-8 border-t border-gray-100">
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 text-sm font-bold text-kb-muted hover:text-sst-primary transition-colors"
                    >
                        ← Back to Agent Dashboard
                    </Link>
                </div>

            </div>
        </div>
    )
}

export default withAuth(LiveChatDashboard, { allowedRoles: ['agent', 'admin'] })
