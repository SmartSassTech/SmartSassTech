'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import withAuth from '@/components/withAuth'
import { Calendar, Clock, Video, MapPin, Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Booking {
    id: string
    service_name: string
    booking_date: string
    booking_time: string
    location_preference: string
    customer_address: string | null
    price: number
    payment_status: string
    service_status: string
    notes: string | null
    created_at: string
    user_id: string | null
    device_id: string | null
    chat_session_id: string | null
}

type Tab = 'upcoming' | 'past' | 'canceled'

function locationLabel(loc: string, address: string | null): string {
    if (loc === 'home') return address ? `At home · ${address}` : 'At your home'
    if (loc === 'remote') return 'Remote (Zoom)'
    if (loc === 'public') return 'Local public place'
    return loc || '—'
}

function StatusBadge({ status, tab }: { status: string; tab: Tab }) {
    if (status === 'cancelled') return <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full uppercase tracking-wide">Canceled</span>
    if (status === 'completed') return <span className="px-3 py-1 bg-kb-navy/10 text-kb-navy text-xs font-bold rounded-full uppercase tracking-wide">Completed</span>
    if (tab === 'upcoming') return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wide">Upcoming</span>
    return <span className="px-3 py-1 bg-kb-navy/10 text-kb-navy text-xs font-bold rounded-full uppercase tracking-wide">Completed</span>
}

function MyBookingsContent() {
    const [tab, setTab] = useState<Tab>('upcoming')
    const [allBookings, setAllBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchBookings()
    }, [])

    const fetchBookings = async () => {
        setLoading(true)
        setError(null)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch bookings with device info
            const { data, error } = await supabase
                .from('bookings')
                .select('*, user_devices(device_name, brand, model)')
                .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
                .order('booking_date', { ascending: false })

            if (error) throw error
            setAllBookings(data || [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCancelBooking = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ service_status: 'cancelled' })
                .eq('id', id)
            if (error) throw error
            fetchBookings()
        } catch (err: any) {
            alert('Error cancelling booking: ' + err.message)
        }
    }

    const handleCompleteBooking = async (booking: any) => {
        if (!confirm('Mark this session as completed? This will log it to your device history.')) return
        try {
            // 1. Update booking status
            const { error: bookingError } = await supabase
                .from('bookings')
                .update({ service_status: 'completed' })
                .eq('id', booking.id)
            
            if (bookingError) throw bookingError

            // 2. Log to service history if device_id exists
            if (booking.device_id) {
                const { error: historyError } = await supabase
                    .from('device_service_history')
                    .insert([{
                        device_id: booking.device_id,
                        user_id: booking.user_id,
                        service_date: booking.booking_date,
                        issue_description: `Booked Service: ${booking.service_name}`,
                        resolution: `Session completed on ${booking.booking_date}. Note: ${booking.notes || 'None'}`,
                        cost: booking.price,
                        technician_notes: 'Automatically logged from booking system.'
                    }])
                if (historyError) console.error("Error logging history:", historyError)
            }

            fetchBookings()
        } catch (err: any) {
            alert('Error completing booking: ' + err.message)
        }
    }

    const today = new Date().toISOString().split('T')[0]

    const filtered = allBookings.filter(b => {
        if (tab === 'canceled') return b.service_status === 'cancelled'
        if (tab === 'past') return b.service_status === 'completed' || (b.booking_date < today && b.service_status !== 'cancelled')
        return b.booking_date >= today && b.service_status === 'scheduled'
    })

    const tabCounts = {
        upcoming: allBookings.filter(b => b.booking_date >= today && b.service_status === 'scheduled').length,
        past: allBookings.filter(b => b.service_status === 'completed' || (b.booking_date < today && b.service_status !== 'cancelled' && b.service_status !== 'scheduled')).length,
        canceled: allBookings.filter(b => b.service_status === 'cancelled').length,
    }

    const emptyMessages: Record<Tab, { icon: React.ReactNode; title: string; body: string }> = {
        upcoming: {
            icon: <Search size={24} />,
            title: 'No upcoming sessions',
            body: "You don't have any appointments scheduled. Ready to get some tech help?",
        },
        past: {
            icon: <Clock size={24} />,
            title: 'No past sessions',
            body: "Your completed sessions will appear here after they take place.",
        },
        canceled: {
            icon: <XCircle size={24} />,
            title: 'No canceled sessions',
            body: "You have no canceled appointments. Great!",
        },
    }

    return (
        <div className="bg-kb-bg min-h-screen py-16 md:py-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-title mb-2">My Bookings</h1>
                        <p className="text-kb-dark text-lg">Manage your upcoming tech sessions and view past appointments.</p>
                    </div>
                    <Link href="/booking" className="px-6 py-3 bg-sst-primary text-white font-bold rounded-xl hover:bg-sst-secondary transition-all shadow-md flex items-center gap-2">
                        <Calendar size={18} />
                        Book New Session
                    </Link>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-kb-cream">
                    {/* Tabs */}
                    <div className="flex border-b border-kb-cream p-4 gap-3 bg-gray-50/50">
                        {(['upcoming', 'past', 'canceled'] as Tab[]).map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`px-5 py-2 font-bold rounded-xl text-sm transition-all capitalize flex items-center gap-2 ${tab === t
                                        ? 'bg-kb-navy text-white shadow-sm'
                                        : 'text-kb-muted hover:bg-gray-100'
                                    }`}
                            >
                                {t}
                                {tabCounts[t] > 0 && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tab === t ? 'bg-white/20 text-white' : 'bg-gray-200 text-kb-muted'}`}>
                                        {tabCounts[t]}
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
                        ) : error ? (
                            <div className="flex items-center gap-3 p-6 bg-red-50 rounded-2xl text-red-700">
                                <AlertCircle size={20} />
                                <p className="font-medium text-sm">Error loading bookings: {error}</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16 px-4 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-kb-navy/5 text-kb-navy rounded-full flex items-center justify-center mx-auto mb-4">
                                    {emptyMessages[tab].icon}
                                </div>
                                <h3 className="mb-2">{emptyMessages[tab].title}</h3>
                                <p className="text-kb-muted mb-6 max-w-md mx-auto">{emptyMessages[tab].body}</p>
                                {tab === 'upcoming' && (
                                    <Link href="/booking" className="inline-flex px-8 py-3 bg-white border-2 border-sst-primary text-sst-primary font-bold rounded-xl hover:bg-gray-50 transition-all">
                                        Book a Session
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filtered.map(booking => (
                                    <div key={booking.id} className="bg-gray-50/60 rounded-2xl border border-gray-100 p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50 transition-all">
                                        {/* Date block */}
                                        <div className="flex-shrink-0 w-16 h-16 bg-kb-navy rounded-2xl flex flex-col items-center justify-center text-white shadow-md">
                                            <span className="text-xs font-bold uppercase opacity-70">
                                                {new Date(booking.booking_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                                            </span>
                                            <span className="text-2xl font-heading leading-none">
                                                {new Date(booking.booking_date + 'T00:00:00').getDate()}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 flex-wrap">
                                                <div>
                                                    <p className="font-bold text-kb-navy text-lg leading-tight">{booking.service_name}</p>
                                                    {(booking as any).user_devices && (
                                                        <p className="text-xs text-sst-primary font-bold mt-1">
                                                            Device: {(booking as any).user_devices.device_name || (booking as any).user_devices.model}
                                                        </p>
                                                    )}
                                                </div>
                                                <StatusBadge status={booking.service_status} tab={tab} />
                                            </div>
                                            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-kb-muted">
                                                <span className="flex items-center gap-1.5">
                                                    <Clock size={13} /> {booking.booking_time}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    {booking.location_preference === 'remote' ? <Video size={13} /> : <MapPin size={13} />}
                                                    {locationLabel(booking.location_preference, booking.customer_address)}
                                                </span>
                                                <span className="font-bold text-sst-primary">${booking.price}</span>
                                            </div>
                                            {booking.notes && (
                                                <p className="mt-2 text-xs text-kb-muted italic truncate">Note: {booking.notes}</p>
                                            )}
                                            {booking.chat_session_id && (
                                                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-kb-navy/40 uppercase tracking-wider">
                                                    <span className="w-1.5 h-1.5 bg-sst-primary rounded-full animate-pulse" />
                                                    Linked to Chat Session
                                                </div>
                                            )}

                                            {/* Actions */}
                                            {tab === 'upcoming' && (
                                                <div className="flex gap-3 mt-4">
                                                    <Link 
                                                        href={`/booking?reschedule=${booking.id}`}
                                                        className="px-4 py-2 bg-white border-2 border-sst-primary text-sst-primary text-xs font-bold rounded-lg hover:bg-sst-primary hover:text-white transition-all shadow-sm"
                                                    >
                                                        Reschedule
                                                    </Link>
                                                    <button 
                                                        onClick={() => handleCancelBooking(booking.id)}
                                                        className="px-4 py-2 bg-white border-2 border-red-200 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50 transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        onClick={() => handleCompleteBooking(booking)}
                                                        className="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-all shadow-sm ml-auto"
                                                    >
                                                        Mark Completed
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function MyBookings() {
    return <MyBookingsContent />
}

export default withAuth(MyBookings, { allowedRoles: ['client'] })

