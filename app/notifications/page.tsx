'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Bell, Check, Trash2, Clock, AlertTriangle, Info, Loader2, ArrowLeft } from 'lucide-react'
import withAuth from '@/components/withAuth'

interface Notification {
    id: string
    type: 'device_alert' | 'maintenance' | 'points' | 'system'
    title: string
    message: string
    is_read: boolean
    created_at: string
}

function NotificationsContent() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [markingAll, setMarkingAll] = useState(false)

    useEffect(() => {
        fetchNotifications()
    }, [])

    const fetchNotifications = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setNotifications(data as Notification[])
            
            // Automatically mark as read when viewing the page
            const hasUnread = data.some(n => !n.is_read);
            if (hasUnread) {
                supabase
                    .from('notifications')
                    .update({ is_read: true })
                    .eq('user_id', user.id)
                    .eq('is_read', false)
                    .then(); // silent background update
            }
        }
        setLoading(false)
    }

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)

        if (!error) {
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n))
        }
    }

    const markAllAsRead = async () => {
        setMarkingAll(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false)

        if (!error) {
            setNotifications(notifications.map(n => ({ ...n, is_read: true })))
        }
        setMarkingAll(false)
    }

    const deleteNotification = async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id)

        if (!error) {
            setNotifications(notifications.filter(n => n.id !== id))
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'device_alert': return <AlertTriangle className="text-red-500" size={20} />
            case 'maintenance': return <Clock className="text-amber-500" size={20} />
            case 'points': return <Bell className="text-sst-primary" size={20} />
            default: return <Info className="text-blue-500" size={20} />
        }
    }

    if (loading) {
        return (
            <div className="bg-kb-bg min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-sst-primary" size={48} />
            </div>
        )
    }

    return (
        <div className="bg-kb-bg min-h-screen py-16 md:py-24">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <Link href="/account" className="text-sm font-bold text-sst-primary hover:underline mb-2 inline-block flex items-center gap-1">
                            <ArrowLeft size={14} /> Back to Account
                        </Link>
                        <h1 className="text-title">Your Notifications</h1>
                    </div>
                    {notifications.some(n => !n.is_read) && (
                        <button 
                            onClick={markAllAsRead}
                            disabled={markingAll}
                            className="text-sm font-bold text-sst-primary hover:text-sst-secondary flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-kb-cream shadow-sm"
                        >
                            {markingAll ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                            Mark all as read
                        </button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <div className="bg-white rounded-[2rem] p-12 text-center border border-kb-cream shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                            <Bell size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-kb-navy mb-2">No notifications yet</h2>
                        <p className="text-kb-muted max-w-xs mx-auto">We'll let you know when there are updates on your devices, points, or bookings.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((n) => (
                            <div 
                                key={n.id} 
                                className={`bg-white rounded-2xl p-6 border transition-all shadow-sm flex gap-4 
                                    ${n.is_read ? 'border-gray-100 opacity-80' : 'border-sst-primary/20 shadow-md transform hover:-translate-y-1'}
                                `}
                            >
                                <div className="mt-1 bg-kb-bg p-3 rounded-xl h-fit">
                                    {getIcon(n.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                        <h3 className={`font-bold text-lg leading-tight ${n.is_read ? 'text-kb-dark' : 'text-sst-primary'}`}>
                                            {n.title}
                                        </h3>
                                        <span className="text-[0.7rem] text-kb-muted font-bold whitespace-nowrap uppercase tracking-widest mt-1">
                                            {new Date(n.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-kb-dark text-[0.95rem] leading-relaxed mb-4">
                                        {n.message}
                                    </p>
                                    <div className="flex items-center gap-4">
                                        {!n.is_read && (
                                            <button 
                                                onClick={() => markAsRead(n.id)}
                                                className="text-xs font-bold text-sst-primary hover:underline"
                                            >
                                                Mark as Read
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => deleteNotification(n.id)}
                                            className="text-xs font-bold text-kb-muted hover:text-red-500 flex items-center gap-1"
                                        >
                                            <Trash2 size={12} /> Delete
                                        </button>
                                    </div>
                                </div>
                                {!n.is_read && (
                                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 shrink-0"></div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default withAuth(NotificationsContent)
