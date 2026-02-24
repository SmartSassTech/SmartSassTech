'use client'

import React from 'react'
import withAuth from '@/components/withAuth'
import { Check } from 'lucide-react'

const PLANS = [
    {
        name: 'Standard Support',
        price: '75',
        duration: 'per session',
        description: 'Perfect for one-off tech issues or occasional questions.',
        features: ['1 Hour Guided Session', 'Remote or In-Person', 'Post-session notes', 'Jargon-free guarantee'],
        recommended: false
    },
    {
        name: 'The Monthly Master',
        price: '69',
        duration: 'per month',
        description: 'Our most popular plan for ongoing peace of mind.',
        features: ['1 Remote Session per month', 'Priority Messaging', 'Access to Premium Guides', 'Cancel anytime'],
        recommended: true
    },
    {
        name: 'The Tech Scholar',
        price: '210',
        duration: '3-pack',
        description: 'A discounted bundle for deep dives and training.',
        features: ['3 Flexible Sessions', 'Never expire', 'Share with family', 'Direct email access'],
        recommended: false
    }
]

function PricingPlans() {
    return (
        <div className="bg-kb-bg min-h-screen py-16 md:py-24">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-heading font-medium text-sst-primary tracking-tight mb-4">Plans & Pricing</h1>
                    <p className="text-kb-dark text-xl max-w-2xl mx-auto">Straightforward pricing. No hidden fees. Just patient, reliable tech support when you need it.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {PLANS.map((plan, index) => (
                        <div key={index} className={`relative bg-white rounded-[2.5rem] p-10 flex flex-col ${plan.recommended ? 'shadow-2xl border-4 border-sst-primary scale-105 z-10' : 'shadow-xl border border-gray-100 mt-0 md:mt-8'}`}>
                            {plan.recommended && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-sst-primary text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest shadow-md">
                                    Most Popular
                                </div>
                            )}

                            <h3 className="text-2xl font-bold text-sst-primary mb-2">{plan.name}</h3>
                            <p className="text-kb-muted min-h-[48px] mb-6">{plan.description}</p>

                            <div className="mb-8">
                                <span className="text-5xl font-heading font-medium text-sst-primary">${plan.price}</span>
                                <span className="text-kb-muted font-bold ml-2">/{plan.duration}</span>
                            </div>

                            <ul className="space-y-4 mb-10 flex-1">
                                {plan.features.map((feature, fIndex) => (
                                    <li key={fIndex} className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-kb-navy/10 flex items-center justify-center text-kb-navy flex-shrink-0">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                        <span className="text-kb-dark font-medium">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <a href="/booking" className={`w-full py-4 text-center font-bold rounded-2xl transition-all shadow-md ${plan.recommended
                                    ? 'bg-sst-primary text-white hover:bg-sst-secondary'
                                    : 'bg-gray-100 text-sst-primary hover:bg-gray-200'
                                }`}>
                                Choose Plan
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default withAuth(PricingPlans)
