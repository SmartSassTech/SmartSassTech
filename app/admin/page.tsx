'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Ticket, MessageSquare, Shield, ArrowRight, Activity, LifeBuoy } from 'lucide-react'
import withAuth from '@/components/withAuth'
import { supabase } from '@/lib/supabase'

function AgentDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        openTickets: 0,
        activeChats: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        setLoading(true)
        try {
            // Fetch total users (count from profiles)
            const { count: userCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })

            // Fetch open tickets (status != 'resolved' or 'closed')
            const { count: ticketCount } = await supabase
                .from('tickets')
                .select('*', { count: 'exact', head: true })
                .neq('status', 'resolved')

            // Fetch active chats (where session is active/open)
            // Note: Adjust table name if different
            const { count: chatCount } = await supabase
                .from('chat_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'open')

            setStats({
                totalUsers: userCount || 0,
                openTickets: ticketCount || 0,
                activeChats: chatCount || 0
            })
        } catch (error) {
            console.error('Error fetching dashboard stats:', error)
        }
        setLoading(false)
    }

    const adminCards = [
        {
            title: 'User Management',
            description: 'Manage client accounts, adjust roles, and handle account deletions.',
            icon: <Users size={32} className="text-blue-500" />,
            link: '/admin/users',
            stats: stats.totalUsers,
            statsLabel: 'Total Registered'
        },
        {
            title: 'Support Tickets',
            description: 'Respond to client inquiries and manage technical support workflow.',
            icon: <Ticket size={32} className="text-purple-500" />,
            link: '/admin/support',
            stats: stats.openTickets,
            statsLabel: 'Open Tickets'
        },
        {
            title: 'Live Chat',
            description: 'Connect with clients in real-time and view active chat sessions.',
            icon: <MessageSquare size={32} className="text-green-500" />,
            link: '/admin/live-chat', // Point to dedicated live chat dashboard
            stats: stats.activeChats,
            statsLabel: 'Active Chats'
        }
    ]

    return (
        <div className="bg-kb-bg min-h-screen py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-sst-primary/10 rounded-xl">
                            <Shield className="text-sst-primary" size={24} />
                        </div>
                        <span className="text-sst-primary font-bold tracking-widest uppercase text-xs">Agent Command Center</span>
                    </div>
                    <h1 className="text-h1 text-kb-navy mb-4">Agent Dashboard</h1>
                    <p className="text-kb-muted max-w-2xl text-lg">
                        Welcome to the family workspace. Manage users, support tickets, and live interactions from one central place.
                    </p>
                </div>

                {/* Quick Stats Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-2xl group-hover:scale-110 transition-transform">
                                <Users className="text-blue-500" size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-kb-muted uppercase tracking-widest">Users</p>
                                <p className="text-2xl font-black text-kb-navy">{stats.totalUsers}</p>
                            </div>
                        </div>
                        <Activity className="text-blue-100" size={32} />
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 rounded-2xl group-hover:scale-110 transition-transform">
                                <Ticket className="text-purple-500" size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-kb-muted uppercase tracking-widest">Tickets</p>
                                <p className="text-2xl font-black text-kb-navy">{stats.openTickets}</p>
                            </div>
                        </div>
                        <LifeBuoy className="text-purple-100" size={32} />
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 rounded-2xl group-hover:scale-110 transition-transform">
                                <MessageSquare className="text-green-500" size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-kb-muted uppercase tracking-widest">Live</p>
                                <p className="text-2xl font-black text-kb-navy">{stats.activeChats}</p>
                            </div>
                        </div>
                        <Activity className="text-green-100" size={32} />
                    </div>
                </div>

                {/* Tool Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {adminCards.map((card, idx) => (
                        <Link 
                            key={idx}
                            href={card.link}
                            className="group relative bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden flex flex-col h-full"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="text-sst-primary" size={24} />
                            </div>
                            
                            <div className="mb-6 p-4 bg-gray-50 rounded-22xl w-fit group-hover:bg-white transition-colors">
                                {card.icon}
                            </div>
                            
                            <h3 className="text-2xl font-black text-kb-navy mb-3 group-hover:text-sst-primary transition-colors">
                                {card.title}
                            </h3>
                            
                            <p className="text-kb-muted text-sm leading-relaxed mb-6 flex-grow">
                                {card.description}
                            </p>

                            <div className="pt-6 border-t border-gray-50 flex items-center justify-between mt-auto">
                                <span className="text-[10px] font-black uppercase tracking-widest text-kb-muted">
                                    {card.statsLabel}
                                </span>
                                <span className="text-sm font-bold text-kb-navy">
                                    {card.stats}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Footer / Help */}
                <div className="mt-16 bg-gradient-to-br from-kb-navy to-[#1a233b] p-8 md:p-12 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl font-black mb-2 italic">Need assistance?</h2>
                        <p className="text-white/70">Access the internal agent knowledge base or contact the administrator.</p>
                    </div>
                    <Link 
                        href="/support"
                        className="px-8 py-4 bg-white text-kb-navy font-bold rounded-2xl hover:bg-sst-primary hover:text-white transition-all shadow-xl active:scale-95"
                    >
                        Internal Support →
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default withAuth(AgentDashboard, { allowedRoles: ['agent', 'admin'] })

