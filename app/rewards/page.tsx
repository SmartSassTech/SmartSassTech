'use client'

import React from 'react'
import withAuth from '@/components/withAuth'
import { Award, Gift, Star, ArrowRight } from 'lucide-react'

function MyRewards() {
    return (
        <div className="bg-kb-bg min-h-screen py-16 md:py-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-10 text-center">
                    <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Award size={40} />
                    </div>
                    <h1 className="text-title mb-2">SmartSass Rewards</h1>
                    <p className="text-kb-dark text-lg">Earn points for every session and referring friends.</p>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl p-8 md:p-12 border border-kb-cream text-center mb-8 relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-50 rounded-full -z-10 blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-kb-navy/5 rounded-full -z-10 blur-2xl"></div>

                    <h2 className="text-kb-muted uppercase font-bold tracking-widest text-sm mb-4">Current Balance</h2>
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <span className="text-6xl font-heading font-bold text-sst-primary">250</span>
                        <span className="text-xl font-bold text-kb-muted mt-4">Points</span>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-4 mb-4 overflow-hidden shadow-inner">
                        <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-4 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                    <p className="text-sm font-bold text-kb-dark mb-8">750 points until your next free session!</p>

                    <button className="px-8 py-4 bg-sst-primary text-white font-bold rounded-xl hover:bg-sst-secondary transition-all shadow-md">
                        Redeem Points
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 hover:border-sst-primary/30 transition-all group">
                        <div className="w-12 h-12 bg-kb-navy/10 text-kb-navy rounded-xl flex items-center justify-center mb-6">
                            <Star size={24} />
                        </div>
                        <h3 className="mb-2">How to Earn</h3>
                        <p className="text-kb-muted text-sm leading-relaxed mb-6">
                            Earn 100 points for every completed support session. Leave a review to earn an extra 50 points!
                        </p>
                        <a href="/booking" className="text-sst-primary font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                            Book a Session <ArrowRight size={16} />
                        </a>
                    </div>

                    <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 hover:border-sst-primary/30 transition-all group">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                            <Gift size={24} />
                        </div>
                        <h3 className="mb-2">Refer a Friend</h3>
                        <p className="text-kb-muted text-sm leading-relaxed mb-6">
                            Give a friend 20% off their first session. When they book, you get 500 bonus points!
                        </p>
                        <button className="text-sst-primary font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                            Get your link <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default withAuth(MyRewards)
