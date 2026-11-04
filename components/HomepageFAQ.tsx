'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'

interface FAQItem {
  question: string
  answer: React.ReactNode
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How much do you charge for tech support?',
    answer: (
      <p>
        We charge a flat rate of <strong>$50 per hour</strong> for both in-home visits in the Rochester area and remote phone/Zoom sessions. There are no monthly contracts, diagnostic fees, or travel surcharges within our Monroe County service area.
      </p>
    ),
  },
  {
    question: 'What towns do you travel to for in-home visits?',
    answer: (
      <p>
        We provide in-home visits throughout <strong>Rochester, Webster, Fairport, Pittsford, Penfield, Brighton, and surrounding Monroe County areas</strong>. If you live outside this area or prefer not to meet in person, remote phone and Zoom support is available nationwide.
      </p>
    ),
  },
  {
    question: 'What if I forget what we did after you leave?',
    answer: (
      <p>
        Every visit includes <strong>clear, large-print written instructions</strong> that we write down together and leave on your table. You can reference them anytime at your own pace so you never have to worry about forgetting the steps.
      </p>
    ),
  },
  {
    question: 'Can adult children book sessions for their parents?',
    answer: (
      <p>
        Yes! Many of our sessions are scheduled by adult children and caregivers. You can book the visit online, join in person or over the phone, and we will send you a post-visit summary so you're always kept in the loop.
      </p>
    ),
  },
  {
    question: 'Are you patient with complete beginners?',
    answer: (
      <p>
        Absolutely. <strong>Infinite patience and zero jargon</strong> are our founding principles. No question is ever too simple or silly—we walk through everything step by step and repeat anything you need until you feel 100% comfortable.
      </p>
    ),
  },
]

export default function HomepageFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (index: number) => {
    setOpenIndex(prev => (prev === index ? null : index))
  }

  return (
    <section id="faq" className="py-20 bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sst-primary/10 text-sst-primary font-bold text-sm mb-4">
            <HelpCircle size={18} aria-hidden="true" />
            FREQUENTLY ASKED QUESTIONS
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-sst-primary mb-4">
            Common Questions &amp; Clear Answers
          </h2>
          <p className="text-xl text-sst-dark max-w-2xl mx-auto">
            Everything you need to know about our patient in-home visits and remote tech support.
          </p>
        </div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx
            return (
              <div
                key={idx}
                className="bg-sst-bg-light rounded-2xl border border-gray-200 overflow-hidden transition-all duration-200 shadow-sm"
              >
                <button
                  type="button"
                  id={`home-faq-btn-${idx}`}
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  aria-controls={`home-faq-panel-${idx}`}
                  className="w-full text-left p-6 font-bold text-lg text-sst-primary flex items-center justify-between gap-4 hover:bg-gray-100/60 transition-colors"
                >
                  <span>{item.question}</span>
                  {isOpen ? (
                    <ChevronUp size={22} className="text-sst-primary shrink-0" aria-hidden="true" />
                  ) : (
                    <ChevronDown size={22} className="text-gray-400 shrink-0" aria-hidden="true" />
                  )}
                </button>
                {isOpen && (
                  <div
                    id={`home-faq-panel-${idx}`}
                    role="region"
                    aria-labelledby={`home-faq-btn-${idx}`}
                    className="px-6 pb-6 pt-1 text-sst-dark text-lg leading-relaxed border-t border-gray-200/60 bg-white"
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

