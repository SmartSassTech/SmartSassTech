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

function MyRewards() {
    const [points, setPoints] = useState<number>(0)
    const [discounts, setDiscounts] = useState<Discount[]>([])
    const [loading, setLoading] = useState(true)
    const [redeeming, setRedeeming] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [copiedCode, setCopiedCode] = useState<string | null>(null)

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            setUserId(session.user.id)

            // Fetch points from profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('reward_points')
                .eq('id', session.user.id)
                .single()

            if (profileData) {
                setPoints(profileData.reward_points)
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

            setLoading(false)
        }

        fetchUserData()
    }, [])

    const handleRedeem = async () => {
        if (points < 100 || !userId) return

        setRedeeming(true)
        try {
            const newPoints = points - 100
            const randomCode = 'SST-' + Math.random().toString(36).substring(2, 8).toUpperCase()

            // Update points in profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ reward_points: newPoints })
                .eq('id', userId)

            if (profileError) throw profileError

            // Create new discount
            const { data: newDiscount, error: discountError } = await supabase
                .from('discounts')
                .insert([{
                    user_id: userId,
                    code: randomCode,
                    percent_off: 5
                }])
                .select()
                .single()

            if (discountError) throw discountError

            setPoints(newPoints)
            setDiscounts([newDiscount, ...discounts])
            alert('Congratulations! You redeemed 100 points for a 5% discount code.')
        } catch (error) {
            console.error('Redeem error:', error)
            alert('Failed to redeem points. Please try again.')
        } finally {
            setRedeeming(false)
        }
    }

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code)
        setCopiedCode(code)
        setTimeout(() => setCopiedCode(null), 2000)
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

    return (
        <div className="bg-kb-bg min-h-screen py-16 md:py-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-10 text-center">
                    <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Award size={40} />
                    </div>
                    <h1 className="text-title mb-2">SmartSass Rewards</h1>
                    <p className="text-kb-dark text-[1.1rem]">Earn points for every dollar spent and redeem for discounts.</p>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl p-8 md:p-12 border border-kb-cream text-center mb-12 relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-50 rounded-full -z-10 blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-kb-navy/5 rounded-full -z-10 blur-2xl"></div>

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
                    {points < 100 && (
                        <p className="text-xs text-kb-muted mt-4">You need at least 100 points to redeem a discount.</p>
                    )}
                </div>

                {discounts.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-sst-primary mb-6 flex items-center gap-2">
                            <Ticket className="text-amber-500" /> Your Discount Codes
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {discounts.map((discount) => (
                                <div key={discount.id} className="bg-white p-6 rounded-2xl border-2 border-dashed border-sst-primary/30 flex justify-between items-center group hover:border-sst-primary transition-all">
                                    <div>
                                        <p className="text-xs font-bold text-kb-muted uppercase tracking-wider mb-1">5% OFF DISCOUNT</p>
                                        <p className="text-xl font-mono font-bold text-sst-primary">{discount.code}</p>
                                    </div>
                                    <button 
                                        onClick={() => copyToClipboard(discount.code)}
                                        className="p-3 bg-kb-bg rounded-xl text-sst-primary hover:bg-sst-primary hover:text-white transition-all"
                                        title="Copy to clipboard"
                                    >
                                        {copiedCode === discount.code ? <Check size={20} /> : <Copy size={20} />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 hover:border-sst-primary/30 transition-all group">
                        <div className="w-12 h-12 bg-kb-navy/10 text-kb-navy rounded-xl flex items-center justify-center mb-6">
                            <Star size={24} />
                        </div>
                        <h3 className="mb-2">How to Earn</h3>
                        <p className="text-kb-muted text-sm leading-relaxed mb-6">
                            Earn 1 point for every $1 spent on support sessions or packs. Reach 100 points to unlock a 5% discount code!
                        </p>
                        <a href="/booking" className="text-sst-primary font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                            Book a Session <ArrowRight size={16} />
                        </a>
                    </div>

                    <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 hover:border-sst-primary/30 transition-all group">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                            <Gift size={24} />
                        </div>
                        <h3 className="mb-2">Loyalty Benefits</h3>
                        <p className="text-kb-muted text-sm leading-relaxed mb-6">
                            Points never expire! As a loyal member, you'll also get early access to new service packs and seasonal promotions.
                        </p>
                        <div className="text-sst-primary font-bold text-sm flex items-center gap-2">
                           Thank you for being part of SmartSass Tech!
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default withAuth(MyRewards)
