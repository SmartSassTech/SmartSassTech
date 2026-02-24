'use client'

import React from 'react'
import withAuth from '@/components/withAuth'
import { CreditCard, CheckCircle, AlertCircle, Clock } from 'lucide-react'

function MySubscriptions() {
    return (
        <div className="bg-kb-bg min-h-screen py-16 md:py-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-10">
                    <h1 className="text-4xl font-heading font-medium text-sst-primary tracking-tight mb-2">My Subscriptions</h1>
                    <p className="text-kb-dark text-lg">Manage your monthly tech support plans and billing.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Active Plan Card */}
                        <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-kb-cream relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -z-10"></div>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full mb-3">Active</span>
                                    <h2 className="text-2xl font-bold text-sst-primary mb-1">Standard Support Pack</h2>
                                    <p className="text-kb-muted flex items-center gap-2 text-sm"><Clock size={16} /> Renews Oct 15, 2026</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-heading font-medium text-sst-primary">$69<span className="text-base text-kb-muted font-normal">/mo</span></p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-100">
                                <h3 className="text-sm font-bold text-kb-muted uppercase tracking-wider mb-4">Plan Benefits</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-kb-dark font-medium"><CheckCircle size={18} className="text-green-500" /> 1 Remote Session per month</li>
                                    <li className="flex items-center gap-3 text-kb-dark font-medium"><CheckCircle size={18} className="text-green-500" /> Priority Messaging Support</li>
                                    <li className="flex items-center gap-3 text-kb-dark font-medium"><CheckCircle size={18} className="text-green-500" /> Access to Premium Guides</li>
                                </ul>
                            </div>

                            <div className="flex gap-4">
                                <button className="px-6 py-3 bg-white border border-gray-200 text-sst-primary font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                                    Change Plan
                                </button>
                                <button className="px-6 py-3 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all">
                                    Cancel Service
                                </button>
                            </div>
                        </div>

                        {/* Order History */}
                        <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-kb-cream">
                            <h2 className="text-xl font-bold text-sst-primary mb-6">Billing History</h2>
                            <div className="space-y-4">
                                {/* Placeholder Invoice Row */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                    <div>
                                        <p className="font-bold text-kb-dark">Sep 15, 2026</p>
                                        <p className="text-sm text-kb-muted">Standard Support Pack</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="font-bold text-sst-primary">$69.00</p>
                                        <button className="text-sm font-bold text-kb-navy hover:underline">Receipt</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-8">
                        <div className="bg-kb-navy text-white rounded-[2rem] shadow-xl p-8">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <CreditCard size={20} /> Payment Method
                            </h3>
                            <div className="bg-white/10 rounded-2xl p-6 mb-6 backdrop-blur-sm border border-white/20">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-8 bg-white/20 rounded-md flex items-center justify-center text-xs font-bold font-mono">VISA</div>
                                        <span className="font-bold tracking-widest">•••• 4242</span>
                                    </div>
                                    <span className="text-sm text-white/50">12/28</span>
                                </div>
                                <p className="text-sm text-white/70">SmartSass User</p>
                            </div>
                            <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all text-sm border border-white/20">
                                Update Payment Info
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default withAuth(MySubscriptions)
