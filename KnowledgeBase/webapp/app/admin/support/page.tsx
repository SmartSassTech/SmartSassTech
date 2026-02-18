'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
    Users,
    MessageSquare,
    Clock,
    CheckCircle2,
    ArrowRight,
    AlertCircle,
    User,
    Monitor,
    Smartphone,
    LifeBuoy
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminDashboard() {
    const [sessions, setSessions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [currentAgent, setCurrentAgent] = useState<any>(null)

    useEffect(() => {
        const fetchSessions = async () => {
            // Get current agent auth info
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentAgent(user)

            const { data, error } = await supabase
                .from('chat_sessions')
                .select('*')
                .order('created_at', { ascending: false })

            if (data) setSessions(data)
            setIsLoading(false)
        }

        fetchSessions()

        // Subscribe to changes
        const channel = supabase
            .channel('admin-support')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_sessions' }, () => {
                fetchSessions()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    const handleClaim = async (sessionId: string) => {
        if (!currentAgent) return alert('You must be logged in to claim tickets.')

        await supabase
            .from('chat_sessions')
            .update({
                agent_id: currentAgent.id,
                status: 'in_progress'
            })
            .eq('id', sessionId)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-red-100 text-red-700 border-red-200'
            case 'in_progress': return 'bg-amber-100 text-amber-700 border-amber-200'
            case 'resolved':
            case 'closed': return 'bg-kb-navy/10 text-kb-navy border-kb-navy/20'
            default: return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-kb-navy text-white p-6 shadow-lg">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-xl">
                            <LifeBuoy size={24} />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">Support Command Center</h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm bg-white/5 px-4 py-2 rounded-full border border-white/10">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span>Connected: {currentAgent?.email || 'Support System'}</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Awaiting Help</p>
                            <p className="text-2xl font-bold text-kb-navy">
                                {sessions.filter(s => s.status === 'open').length}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Active Chats</p>
                            <p className="text-2xl font-bold text-kb-navy">
                                {sessions.filter(s => s.status === 'in_progress').length}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Resolved Today</p>
                            <p className="text-2xl font-bold text-kb-navy">
                                {sessions.filter(s => s.status === 'resolved').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-kb-navy flex items-center gap-2">
                            <MessageSquare size={20} className="text-kb-navy/50" />
                            Live Support Queue
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/80 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Device</th>
                                    <th className="px-6 py-4">Initial Issue</th>
                                    <th className="px-6 py-4">Assigned To</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                            Loading chat queue...
                                        </td>
                                    </tr>
                                ) : sessions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                                            No active support requests. Everything is quiet!
                                        </td>
                                    </tr>
                                ) : (
                                    sessions.map((session) => (
                                        <tr key={session.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(session.status)}`}>
                                                    {session.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-kb-navy/10 flex items-center justify-center text-kb-navy">
                                                        <User size={14} />
                                                    </div>
                                                    <span className="font-semibold text-gray-800 text-sm">{session.user_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                    {session.user_email?.includes('iPhone') || session.user_email?.includes('Phone') ? <Smartphone size={14} /> : <Monitor size={14} />}
                                                    {session.user_email?.replace('device: ', '') || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-600 line-clamp-1 max-w-[200px]">
                                                    {session.initial_issue}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {session.agent_id ? (
                                                    <span className="text-sm font-medium text-kb-navy">
                                                        Agent #{session.agent_id.substring(0, 4)}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {session.status === 'open' ? (
                                                    <button
                                                        onClick={() => handleClaim(session.id)}
                                                        className="bg-kb-navy text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-kb-navy/90 transition-all active:scale-95"
                                                    >
                                                        Claim Ticket
                                                    </button>
                                                ) : (
                                                    <a
                                                        href={`/chat/${session.id}?admin=true`}
                                                        className="inline-flex items-center gap-2 text-kb-navy hover:text-blue-700 transition-colors font-bold text-xs"
                                                    >
                                                        Join Conversation
                                                        <ArrowRight size={14} />
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    )
}
