'use client'

import React, { useEffect, useState } from 'react'
import withAuth from '@/components/withAuth'
import { Award, Gift, Star, ArrowRight, Ticket, Loader2, Copy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Discount {
    id: string
    code: string
    percent_off: number
    is_used: boolean
    created_at: string
}

interface Transaction {
    id: string
    amount: number
    reason: 'service_completed' | 'referral_bonus' | 'subscription_reward' | 'redemption'
    created_at: string
}

function MyRewards() {
    const [points, setPoints] = useState<number>(0)
    const [referralCode, setReferralCode] = useState<string>('')
    const [discounts, setDiscounts] = useState<Discount[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [redeeming, setRedeeming] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [copiedCode, setCopiedCode] = useState<string | null>(null)
    const [copiedReferral, setCopiedReferral] = useState(false)

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            setUserId(session.user.id)

            // Fetch points and referral code from profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('reward_points, referral_code')
                .eq('id', session.user.id)
                .single()

            if (profileData) {
                setPoints(profileData.reward_points)
                setReferralCode(profileData.referral_code || '')
            }

            // Fetch unused discounts
            const { data: discountData } = await supabase
                .from('discounts')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('is_used', false)
                .order('created_at', { ascending: false })

            if (discountData) {
                setDiscounts(discountData)
            }

            // Fetch recent transactions
            const { data: transactionData } = await supabase
                .from('point_transactions')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(5)

            if (transactionData) {
                setTransactions(transactionData as Transaction[])
            }

            setLoading(false)
        }

        fetchUserData()
    }, [])

    const handleRedeem = async () => {
        if (points < 100 || !userId) return

        setRedeeming(true)
        try {
            // Use secure RPC to handle point deduction and discount creation atomically
            const { data, error: rpcError } = await supabase
                .rpc('redeem_points_for_discount', {
                    p_user_id: userId,
                    p_points_to_redeem: 100
                })

            if (rpcError) throw rpcError
            
            // RPC returns setof record, we need to extract from first row
            const result = Array.isArray(data) ? data[0] : data
            
            if (!result || !result.success) {
                throw new Error(result?.error_message || 'Failed to redeem points')
            }

            // Success! Update local state
            const newPoints = points - 100
            setPoints(newPoints)
            
            // Refresh discounts and transactions to show new state
            const { data: discountData } = await supabase
                .from('discounts')
                .select('*')
                .eq('user_id', userId)
                .eq('is_used', false)
                .order('created_at', { ascending: false })
            
            if (discountData) setDiscounts(discountData)

            const { data: transactionData } = await supabase
                .from('point_transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5)
            
            if (transactionData) setTransactions(transactionData as Transaction[])

            alert('Congratulations! You redeemed 100 points for a 5% discount code.')
        } catch (error: any) {
            console.error('Redeem error:', error)
            alert(error.message || 'Failed to redeem points. Please try again.')
        } finally {
            setRedeeming(false)
        }
    }

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code)
        setCopiedCode(code)
        setTimeout(() => setCopiedCode(null), 2000)
    }

    const copyReferralCode = () => {
        navigator.clipboard.writeText(referralCode)
        setCopiedReferral(true)
        setTimeout(() => setCopiedReferral(false), 2000)
    }

    if (loading) {
        return (
            <div className="bg-kb-bg min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-sst-primary" size={48} />
            </div>
        )
    }

    const pointsToNext = 100 - (points % 100)
    const progress = (points % 100)

    const getReasonLabel = (reason: string) => {
        switch (reason) {
            case 'service_completed': return 'Service Completed'
            case 'referral_bonus': return 'Referral Bonus'
            case 'subscription_reward': return 'Subscription Reward'
            case 'redemption': return 'Points Redeemed'
            default: return 'Reward'
        }
    }

    return (
        <div className="bg-kb-bg min-h-screen py-16 md:py-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-10 text-center">
                    <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Award size={40} />
                    </div>
                    <h1 className="text-title mb-2">SmartSass Rewards</h1>
                    <p className="text-kb-dark text-[1.1rem]">Earn points for services, referrals, and subscriptions.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="md:col-span-2 bg-white rounded-[2rem] shadow-xl p-8 border border-kb-cream text-center relative overflow-hidden">
                        {/* Decorative Elements */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-50 rounded-full -z-10 blur-2xl"></div>
                        
                        <h2 className="text-kb-muted uppercase font-bold tracking-widest text-sm mb-4">Current Balance</h2>
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <span className="text-6xl font-heading font-bold text-sst-primary">{points}</span>
                            <span className="text-[1.1rem] font-bold text-kb-muted mt-4">Points</span>
                        </div>

                        <div className="w-full bg-gray-100 rounded-full h-4 mb-4 overflow-hidden shadow-inner">
                            <div 
                                className="bg-gradient-to-r from-amber-400 to-amber-500 h-4 rounded-full transition-all duration-500" 
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="text-sm font-bold text-kb-dark mb-8">
                            {pointsToNext} points until your next 5% discount code!
                        </p>

                        <button 
                            onClick={handleRedeem}
                            disabled={points < 100 || redeeming}
                            className={`px-8 py-4 font-bold rounded-xl transition-all shadow-md flex items-center gap-2 mx-auto
                                ${points >= 100 
                                    ? 'bg-sst-primary text-white hover:bg-sst-secondary' 
                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
                            `}
                        >
                            {redeeming ? <Loader2 className="animate-spin" size={20} /> : <Ticket size={20} />}
                            Redeem 100 Points
                        </button>
                    </div>

                    <div className="bg-sst-primary text-white rounded-[2rem] p-8 shadow-lg flex flex-col justify-center items-center text-center">
                        <Gift className="mb-4 text-amber-300" size={40} />
                        <h3 className="text-white mb-2">Refer a Friend</h3>
                        <p className="text-white/80 text-sm mb-6">Give friends $5 off and earn 50 points when they complete their first service!</p>
                        <div className="bg-white/10 w-full p-4 rounded-xl border border-white/20 mb-4 flex items-center justify-between gap-2 overflow-hidden">
                            <code className="text-lg font-mono font-bold truncate">{referralCode}</code>
                            <button 
                                onClick={copyReferralCode}
                                className="p-2 bg-white text-sst-primary rounded-lg hover:bg-amber-100 transition-all shrink-0"
                            >
                                {copiedReferral ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                        </div>
                        <p className="text-[0.7rem] text-white/60 uppercase tracking-widest font-bold">Your Referral Code</p>
                    </div>
                </div>

                {transactions.length > 0 && (
                    <div className="mb-12 bg-white rounded-[2rem] border border-kb-cream p-8 shadow-sm">
                        <h2 className="text-xl font-bold text-sst-primary mb-6 flex items-center gap-2">
                            <Star className="text-amber-500" size={20} /> Recent Activity
                        </h2>
                        <div className="space-y-4">
                            {transactions.map((t) => (
                                <div key={t.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                                    <div>
                                        <p className="font-bold text-kb-dark">{getReasonLabel(t.reason)}</p>
                                        <p className="text-xs text-kb-muted">{new Date(t.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`font-mono font-bold ${t.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {t.amount >= 0 ? `+${t.amount}` : t.amount} pts
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {discounts.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-sst-primary mb-6 flex items-center gap-2">
                            <Ticket className="text-amber-500" /> Your Discount Codes
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {discounts.map((discount) => (
                                <div key={discount.id} className="bg-white p-6 rounded-2xl border-2 border-dashed border-sst-primary/30 flex justify-between items-center group hover:border-sst-primary transition-all shadow-sm">
                                    <div>
                                        <p className="text-xs font-bold text-kb-muted uppercase tracking-wider mb-1">5% OFF DISCOUNT</p>
                                        <p className="text-xl font-mono font-bold text-sst-primary">{discount.code}</p>
                                    </div>
                                    <button 
                                        onClick={() => copyToClipboard(discount.code)}
                                        className="p-3 bg-kb-bg rounded-xl text-sst-primary hover:bg-sst-primary hover:text-white transition-all shadow-sm"
                                        title="Copy to clipboard"
                                    >
                                        {copiedCode === discount.code ? <Check size={20} /> : <Copy size={20} />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 hover:border-sst-primary/30 transition-all group">
                        <div className="w-12 h-12 bg-kb-navy/10 text-kb-navy rounded-xl flex items-center justify-center mb-6">
                            <Star size={24} />
                        </div>
                        <h3 className="mb-2">Services</h3>
                        <p className="text-kb-muted text-sm leading-relaxed">
                            Earn 10 points for every completed support session.
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 hover:border-sst-primary/30 transition-all group">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                            <Gift size={24} />
                        </div>
                        <h3 className="mb-2">Referrals</h3>
                        <p className="text-kb-muted text-sm leading-relaxed">
                            Earn 50 points when a friend joins and completes their first service.
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 hover:border-sst-primary/30 transition-all group">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                            <Star size={24} />
                        </div>
                        <h3 className="mb-2">Subscriptions</h3>
                        <p className="text-kb-muted text-sm leading-relaxed">
                            Earn 20 points every time your subscription renews.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default withAuth(MyRewards, { allowedRoles: ['client'] })

