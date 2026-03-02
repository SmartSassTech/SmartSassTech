'use client'

import React, { useState, useEffect } from 'react'
import withAuth from '@/components/withAuth'
import { CreditCard, CheckCircle, AlertTriangle, XCircle, Clock, ArrowRight, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type SubStatus = 'active' | 'past_due' | 'canceled' | 'incomplete'

interface Subscription {
    id: string
    plan_name: string
    status: SubStatus
    current_period_start: string | null
    current_period_end: string | null
    cancel_at_period_end: boolean
    created_at: string
}

function formatDate(dateStr: string | null) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    })
}

function StatusBadge({ status }: { status: SubStatus }) {
    const config: Record<SubStatus, { label: string; className: string; icon: React.ReactNode }> = {
        active: {
            label: 'Active',
            className: 'bg-green-100 text-green-700',
            icon: <CheckCircle size={14} />,
        },
        past_due: {
            label: 'Past Due',
            className: 'bg-yellow-100 text-yellow-700',
            icon: <AlertTriangle size={14} />,
        },
        canceled: {
            label: 'Canceled',
            className: 'bg-red-100 text-red-600',
            icon: <XCircle size={14} />,
        },
        incomplete: {
            label: 'Incomplete',
            className: 'bg-gray-100 text-gray-600',
            icon: <Clock size={14} />,
        },
    }
    const { label, className, icon } = config[status] ?? config.incomplete
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${className}`}>
            {icon}
            {label}
        </span>
    )
}

function MySubscriptions() {
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSubscription()
    }, [])

    const fetchSubscription = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            setSubscription(data ?? null)
        }
        setLoading(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-kb-bg">
                <div className="w-12 h-12 border-4 border-sst-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="bg-kb-bg min-h-screen py-16 md:py-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-10">
                    <h1 className="text-title mb-2">My Subscriptions</h1>
                    <p className="text-kb-dark">Manage your monthly tech support plan and billing.</p>
                </div>

                {subscription ? (
                    <div className="space-y-8">
                        {/* Active Plan Card */}
                        <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-kb-cream relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -z-10" />

                            <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
                                <div>
                                    <StatusBadge status={subscription.status} />
                                    <h2 className="mt-3 mb-1">{subscription.plan_name}</h2>
                                    {subscription.cancel_at_period_end && subscription.status === 'active' && (
                                        <p className="text-sm text-yellow-600 font-medium flex items-center gap-1.5 mt-2">
                                            <AlertTriangle size={14} />
                                            Cancels at end of billing period
                                        </p>
                                    )}
                                </div>
                                <div className="text-right space-y-1">
                                    {subscription.current_period_end && (
                                        <p className="text-kb-muted text-sm flex items-center gap-1.5 justify-end">
                                            <Clock size={14} />
                                            {subscription.status === 'canceled' ? 'Expires' : 'Renews'}{' '}
                                            {formatDate(subscription.current_period_end)}
                                        </p>
                                    )}
                                    {subscription.current_period_start && (
                                        <p className="text-kb-muted text-xs">
                                            Started {formatDate(subscription.current_period_start)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Past Due Warning */}
                            {subscription.status === 'past_due' && (
                                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-start gap-3">
                                    <AlertTriangle size={18} className="text-yellow-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-yellow-800 text-sm">Payment Required</p>
                                        <p className="text-yellow-700 text-sm mt-0.5">
                                            Your payment is past due. Please update your payment method to keep your plan active.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {subscription.status !== 'canceled' && (
                                <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
                                    <Link
                                        href="/pricing"
                                        className="px-6 py-3 bg-white border border-gray-200 text-sst-primary font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm text-sm"
                                    >
                                        View All Plans
                                    </Link>
                                </div>
                            )}

                            {subscription.status === 'canceled' && (
                                <div className="pt-4 border-t border-gray-100">
                                    <Link
                                        href="/pricing"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-sst-primary text-white font-bold rounded-xl hover:bg-sst-secondary transition-all text-sm"
                                    >
                                        Resubscribe
                                        <ArrowRight size={16} />
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Plan Started Info */}
                        <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-kb-cream">
                            <h2 className="mb-6 text-h3 text-kb-navy">Plan Details</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-xs font-bold text-kb-muted uppercase tracking-widest mb-1">Plan</p>
                                    <p className="font-bold text-kb-dark">{subscription.plan_name}</p>
                                </div>
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-xs font-bold text-kb-muted uppercase tracking-widest mb-1">Status</p>
                                    <StatusBadge status={subscription.status} />
                                </div>
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-xs font-bold text-kb-muted uppercase tracking-widest mb-1">Billing Period Start</p>
                                    <p className="font-bold text-kb-dark">{formatDate(subscription.current_period_start)}</p>
                                </div>
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-xs font-bold text-kb-muted uppercase tracking-widest mb-1">Billing Period End</p>
                                    <p className="font-bold text-kb-dark">{formatDate(subscription.current_period_end)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* No Subscription State */
                    <div className="bg-white rounded-[2rem] shadow-xl p-10 md:p-16 border border-kb-cream text-center">
                        <div className="w-20 h-20 bg-kb-bg rounded-full flex items-center justify-center mx-auto mb-6">
                            <CreditCard size={36} className="text-kb-muted" />
                        </div>
                        <h2 className="text-h2 text-kb-navy mb-3">No Active Plan</h2>
                        <p className="text-kb-muted max-w-md mx-auto mb-8 text-base leading-relaxed">
                            You don&apos;t have an active subscription yet. Explore our plans to get priority support, remote sessions, and more.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/pricing"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-sst-primary text-white font-bold rounded-2xl hover:bg-sst-secondary transition-all shadow-sm active:scale-95"
                            >
                                View Plans &amp; Pricing
                                <ArrowRight size={18} />
                            </Link>
                            <button
                                onClick={fetchSubscription}
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border border-gray-200 text-kb-navy font-bold rounded-2xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                            >
                                <RefreshCw size={16} />
                                Refresh
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default withAuth(MySubscriptions)
