'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ShieldAlert,
  PhoneOff,
  BookOpen,
  AlertTriangle,
  Phone,
  ExternalLink,
  Lock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

export default function ScamPreventionPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0)

  const toggleFaq = (index: number) => {
    setActiveFaq(prev => (prev === index ? null : index))
  }

  return (
    <main id="main-content" className="min-h-screen bg-slate-50">
      
      {/* 1. HERO SECTION */}
      <section className="bg-gradient-to-b from-[#2E3B69] via-[#222C4E] to-[#171F38] text-white pt-16 pb-14 px-4 relative overflow-hidden">
        <div className="container mx-auto max-w-5xl relative z-10">
          
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs sm:text-sm font-bold bg-red-500/25 text-red-200 border border-red-400/40 shadow-sm">
              <ShieldAlert size={16} className="text-red-400" />
              SENIOR TECH DEFENSE & FRAUD PREVENTION HUB
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-center mb-6 tracking-tight leading-tight !text-white" style={{ color: '#ffffff' }}>
            Protect Yourself from Tech Scams, <br className="hidden sm:inline" />
            Phishing &amp; Online Fraud
          </h1>

          <p className="text-lg sm:text-xl text-slate-100 text-center max-w-3xl mx-auto leading-relaxed mb-8">
            Scammers rely on fear, panic, and fake urgency. Here are simple, jargon-free guidelines, defense rules, and official trusted reporting resources to keep your devices, money, and identity safe.
          </p>

          {/* Emergency Alert Hotline Callout */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/20 max-w-3xl mx-auto shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-600/30">
                  <AlertTriangle size={26} />
                </div>
                <div>
                  <h2 className="font-bold text-base sm:text-lg !text-white" style={{ color: '#ffffff' }}>Suspect an Active Scam Right Now?</h2>
                  <p className="text-xs sm:text-sm text-slate-200">
                    Hang up immediately! Never grant remote computer access or buy gift cards.
                  </p>
                </div>
              </div>
              <a
                href="tel:5856454549"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-red-600/30 transition-all duration-200 shrink-0"
              >
                <Phone size={18} />
                <span>Call Renee: (585) 645-4549</span>
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* 2. THE 3-STEP GOLDEN RULE PROTOCOL */}
      <section className="py-14 px-4 bg-white border-b border-slate-200">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <span className="text-sst-primary font-bold text-xs uppercase tracking-wider">
              UNIVERSAL DEFENSE STRATEGY
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 mb-3">
              The 3-Step Scam Defense Protocol
            </h2>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              Whenever you receive an unexpected message, phone call, or alarming pop-up, remember this simple routine:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl border-2 border-red-100 bg-red-50/40 relative flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-xl mb-4 shadow-md shadow-red-600/20">
                  1
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">🛑 PAUSE &amp; BREATHE</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Scammers always manufacture <strong>fake urgency</strong> ("Your account will close in 1 hour!" or "Virus detected, call now!"). Slow down. Legitimate banks, Medicare, and tech companies never force immediate panic decisions.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-red-200/60 text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <XCircle size={15} /> Do NOT click links or call the number provided.
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl border-2 border-blue-100 bg-blue-50/40 relative flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl mb-4 shadow-md shadow-blue-600/20">
                  2
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">🔍 VERIFY INDEPENDENTLY</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Always check separately. If a message claims to be your bank, Amazon, or Medicare, look up their verified phone number on your physical card or monthly billing statement — <strong>never use the link or phone number in the unexpected message</strong>.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-blue-200/60 text-xs font-bold text-blue-800 flex items-center gap-1.5">
                <CheckCircle2 size={15} /> Call the real number on your physical card.
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl border-2 border-slate-200 bg-slate-50 relative flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xl mb-4 shadow-md shadow-slate-800/20">
                  3
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">🗣️ ASK A TRUSTED PERSON</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  When in doubt, get a second opinion from a family member or SmartSass Tech. A 2-minute conversation can protect your savings and prevent identity theft before anything happens.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-300 text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Phone size={15} /> Free reassurance from SmartSass Tech anytime.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. VERIFIED OFFICIAL REPORTING & PROTECTION RESOURCES */}
      <section className="py-14 px-4 bg-slate-50 border-b border-slate-200">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <span className="text-blue-700 font-bold text-xs uppercase tracking-wider">
              TRUSTED GOVERNMENT &amp; CONSUMER DIRECTORY
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 mb-3">
              Official Fraud Reporting &amp; Protection Resources
            </h2>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              If you or a loved one have experienced fraud or suspicious activity, these official federal and non-profit services provide authoritative reporting, recovery guides, and scam alerts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Column 1: Reporting Fraud & Identity Theft */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-2.5 mb-4 text-sst-primary">
                  <AlertTriangle size={22} />
                  <h3 className="text-lg font-bold text-slate-900">Report Scams &amp; Theft</h3>
                </div>
                <p className="text-xs text-slate-600 mb-4">
                  Official federal portals to report fraud, freeze credit, and recover stolen identity.
                </p>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="https://www.identitytheft.gov/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200 hover:border-sst-primary hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center justify-between text-sm font-bold text-slate-900 group-hover:text-sst-primary">
                        <span>IdentityTheft.gov</span>
                        <ExternalLink size={14} aria-hidden="true" /><span className="sr-only"> (opens in new tab)</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Official FTC step-by-step identity recovery plan.</p>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.ic3.gov/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200 hover:border-sst-primary hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center justify-between text-sm font-bold text-slate-900 group-hover:text-sst-primary">
                        <span>FBI IC3 Portal</span>
                        <ExternalLink size={14} aria-hidden="true" /><span className="sr-only"> (opens in new tab)</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Report major internet crime and financial wire scams.</p>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://oig.ssa.gov/fraud-reporting/splash/?URL=%2Fipff%2Fhome&LVL=3"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200 hover:border-sst-primary hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center justify-between text-sm font-bold text-slate-900 group-hover:text-sst-primary">
                        <span>Social Security OIG</span>
                        <ExternalLink size={14} aria-hidden="true" /><span className="sr-only"> (opens in new tab)</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Report fake Social Security suspension calls.</p>
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Column 2: Stopping Robocalls & Spam */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-2.5 mb-4 text-blue-600">
                  <PhoneOff size={22} />
                  <h3 className="text-lg font-bold text-slate-900">Stop Unwanted Calls</h3>
                </div>
                <p className="text-xs text-slate-600 mb-4">
                  Tools to reduce robocalls, telemarketing spam, and unwanted text solicitations.
                </p>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="https://www.donotcall.gov/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center justify-between text-sm font-bold text-slate-900 group-hover:text-blue-600">
                        <span>National Do Not Call Registry</span>
                        <ExternalLink size={14} aria-hidden="true" /><span className="sr-only"> (opens in new tab)</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Register landlines and mobile phones for free.</p>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.fcc.gov/consumers/guides/stop-unwanted-robocalls-and-texts"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center justify-between text-sm font-bold text-slate-900 group-hover:text-blue-600">
                        <span>FCC Robocall Guide</span>
                        <ExternalLink size={14} aria-hidden="true" /><span className="sr-only"> (opens in new tab)</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">How to enable carrier call blocking on your phone.</p>
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Column 3: Senior Education & Trusted Toolkits */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-2.5 mb-4 text-slate-800">
                  <BookOpen size={22} />
                  <h3 className="text-lg font-bold text-slate-900">Education &amp; Toolkits</h3>
                </div>
                <p className="text-xs text-slate-600 mb-4">
                  Free watchdog alerts, scam trackers, and senior-focused education materials.
                </p>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="https://www.aarp.org/money/scams-fraud/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200 hover:border-sst-primary hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center justify-between text-sm font-bold text-slate-900 group-hover:text-sst-primary">
                        <span>AARP Fraud Watch Network</span>
                        <ExternalLink size={14} aria-hidden="true" /><span className="sr-only"> (opens in new tab)</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Helpline: (877) 908-3360 &amp; bi-weekly fraud alerts.</p>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.bbb.org/scamtracker"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200 hover:border-sst-primary hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center justify-between text-sm font-bold text-slate-900 group-hover:text-sst-primary">
                        <span>BBB Scam Tracker</span>
                        <ExternalLink size={14} aria-hidden="true" /><span className="sr-only"> (opens in new tab)</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Search reported scams in the Upstate NY area.</p>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.finra.org/investors/protect-your-money"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200 hover:border-sst-primary hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center justify-between text-sm font-bold text-slate-900 group-hover:text-sst-primary">
                        <span>FINRA Investor Protection</span>
                        <ExternalLink size={14} aria-hidden="true" /><span className="sr-only"> (opens in new tab)</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Protect your 401(k), pension, and retirement assets.</p>
                    </a>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. "IS IT A SCAM?" FAQ ACCORDION */}
      <section className="py-14 px-4 bg-white border-b border-slate-200">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
              Common Questions &amp; Quick Answers
            </h2>
            <p className="text-base text-slate-600">
              Clear answers to the most frequent tech security questions we receive from clients:
            </p>
          </div>

          <div className="space-y-4">

            {/* Q1 */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <button
                type="button"
                id="faq-btn-0"
                onClick={() => toggleFaq(0)}
                aria-expanded={activeFaq === 0}
                aria-controls="faq-panel-0"
                className="w-full text-left p-5 font-bold text-slate-900 flex items-center justify-between gap-4 hover:bg-slate-100/70 transition-colors"
              >
                <span>Someone called saying my Amazon account was charged $999. What should I do?</span>
                {activeFaq === 0 ? <ChevronUp size={20} className="text-sst-primary shrink-0" aria-hidden="true" /> : <ChevronDown size={20} className="text-slate-400 shrink-0" aria-hidden="true" />}
              </button>
              {activeFaq === 0 && (
                <div id="faq-panel-0" role="region" aria-labelledby="faq-btn-0" className="px-5 pb-5 pt-1 text-sm text-slate-700 leading-relaxed border-t border-slate-200/60 bg-white">
                  <p className="mb-2">
                    <strong>Do not press 1 and do not stay on the phone.</strong> Hang up immediately.
                  </p>
                  <p>
                    Go to Amazon.com on your computer or phone by typing the address yourself. Check your "Returns &amp; Orders". If you do not see the purchase there, it was a fake robo-call trying to get your credit card number.
                  </p>
                </div>
              )}
            </div>

            {/* Q2 */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <button
                type="button"
                id="faq-btn-1"
                onClick={() => toggleFaq(1)}
                aria-expanded={activeFaq === 1}
                aria-controls="faq-panel-1"
                className="w-full text-left p-5 font-bold text-slate-900 flex items-center justify-between gap-4 hover:bg-slate-100/70 transition-colors"
              >
                <span>I allowed someone remote access to my computer and I feel uneasy. What now?</span>
                {activeFaq === 1 ? <ChevronUp size={20} className="text-sst-primary shrink-0" aria-hidden="true" /> : <ChevronDown size={20} className="text-slate-400 shrink-0" aria-hidden="true" />}
              </button>
              {activeFaq === 1 && (
                <div id="faq-panel-1" role="region" aria-labelledby="faq-btn-1" className="px-5 pb-5 pt-1 text-sm text-slate-700 leading-relaxed border-t border-slate-200/60 bg-white">
                  <ol className="list-decimal list-inside space-y-1.5 mb-3">
                    <li><strong>Turn off your computer immediately</strong> or disconnect your home Wi-Fi router.</li>
                    <li>Call your bank from a separate phone to freeze your cards or monitor activity.</li>
                    <li>Call SmartSass Tech at <strong>(585) 645-4549</strong> to inspect your computer, remove any hidden remote control programs (AnyDesk, TeamViewer), and safely restore your settings.</li>
                  </ol>
                </div>
              )}
            </div>

            {/* Q3 */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <button
                type="button"
                id="faq-btn-2"
                onClick={() => toggleFaq(2)}
                aria-expanded={activeFaq === 2}
                aria-controls="faq-panel-2"
                className="w-full text-left p-5 font-bold text-slate-900 flex items-center justify-between gap-4 hover:bg-slate-100/70 transition-colors"
              >
                <span>How can I tell if an email from my bank or credit card is real?</span>
                {activeFaq === 2 ? <ChevronUp size={20} className="text-sst-primary shrink-0" aria-hidden="true" /> : <ChevronDown size={20} className="text-slate-400 shrink-0" aria-hidden="true" />}
              </button>
              {activeFaq === 2 && (
                <div id="faq-panel-2" role="region" aria-labelledby="faq-btn-2" className="px-5 pb-5 pt-1 text-sm text-slate-700 leading-relaxed border-t border-slate-200/60 bg-white">
                  <p className="mb-2">
                    Look at the sender's actual email address (not just their display name). If it contains strange letters, misspelled domain names, or gmail.com addresses for official companies, it is fake.
                  </p>
                  <p>
                    <strong>Golden Rule:</strong> Never click buttons inside the email. Open a new browser window, visit the bank website directly, and log in securely.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* 5. NEED PERSONALIZED HELP CTA */}
      <section className="py-16 px-4 bg-gradient-to-br from-[#2E3B69] via-[#222C4E] to-[#171F38] text-white text-center">
        <div className="container mx-auto max-w-3xl">
          <div className="w-16 h-16 rounded-2xl bg-white/10 text-white flex items-center justify-center mx-auto mb-5 border border-white/20 shadow-lg">
            <Lock size={30} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight !text-white" style={{ color: '#ffffff' }}>
            Need Help Inspecting or Securing Your Device?
          </h2>
          <p className="text-base sm:text-lg text-slate-200 leading-relaxed mb-8 max-w-2xl mx-auto">
            If you're worried about suspicious software, strange emails, or lost passwords, we'll visit you in-home in Rochester or connect remotely to scan your device, remove threats, and set up simple protections.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="tel:5856454549"
              className="w-full sm:w-auto min-h-[52px] px-8 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-base shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Phone size={18} />
              <span>Call (585) 645-4549</span>
            </a>
            <Link
              href="/booking?note=Security%20and%20Scam%20Inspection"
              className="w-full sm:w-auto min-h-[52px] px-8 rounded-full bg-white text-blue-900 hover:bg-slate-100 font-bold text-base shadow-lg transition-all flex items-center justify-center"
            >
              Book a Security Check Session &rarr;
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}
