import Link from 'next/link'
import { ShieldAlert, PhoneOff, BookOpen, AlertTriangle } from 'lucide-react'

export const metadata = {
    title: 'Scam Prevention & Protection | SmartSass Tech',
    description: 'Essential resources for scam prevention, reporting fraud, and protecting your identity online.',
}

export default function ScamPreventionPage() {
    return (
        <main id="main-content">
            {/* Hero Section */}
            <section className="hero section bg-sst-beige text-kb-navy pb-12 pt-20">
                <div className="container">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">Scam Prevention & Protection</h1>
                        <p className="text-xl text-kb-slate">
                            Stay safe online with our curated list of essential resources. Learn how to spot scams, report fraud, and protect your personal information.
                        </p>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="section bg-[var(--color-bg-alt)] py-16">
                <div className="container">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">

                        {/* Reporting Scams & Fraud */}
                        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-6 flex-wrap">
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                                    <AlertTriangle size={24} />
                                </div>
                                <h2 className="text-2xl font-bold text-kb-navy">Reporting Scams & Fraud</h2>
                            </div>
                            <ul className="space-y-4">
                                <li>
                                    <a href="https://www.bbb.org/scamtracker" target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-xl hover:border-sst-primary hover:bg-slate-50 transition-colors">
                                        <span className="font-semibold block text-kb-navy mb-1">BBB Scam Tracker</span>
                                        <span className="text-sm text-kb-slate">Report a scam or search to see if someone else has reported a similar situation.</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="https://www.usa.gov/where-report-scams" target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-xl hover:border-sst-primary hover:bg-slate-50 transition-colors">
                                        <span className="font-semibold block text-kb-navy mb-1">USA.gov Report Scams</span>
                                        <span className="text-sm text-kb-slate">Official guide on where to report scams, fraud, and bad business practices.</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="https://www.identitytheft.gov/" target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-xl hover:border-sst-primary hover:bg-slate-50 transition-colors">
                                        <span className="font-semibold block text-kb-navy mb-1">IdentityTheft.gov</span>
                                        <span className="text-sm text-kb-slate">Report identity theft and get a personalized recovery plan from the federal government.</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="https://www.ic3.gov/" target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-xl hover:border-sst-primary hover:bg-slate-50 transition-colors">
                                        <span className="font-semibold block text-kb-navy mb-1">Internet Crime Complaint Center (IC3)</span>
                                        <span className="text-sm text-kb-slate">The FBI's official portal for reporting internet crime and cyber incidents.</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="https://oig.ssa.gov/fraud-reporting/splash/?URL=%2Fipff%2Fhome&LVL=3" target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-xl hover:border-sst-primary hover:bg-slate-50 transition-colors">
                                        <span className="font-semibold block text-kb-navy mb-1">SSA Fraud Reporting</span>
                                        <span className="text-sm text-kb-slate">Report Social Security fraud, waste, or abuse to the Office of the Inspector General.</span>
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Prevention & Education */}
                        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-6 flex-wrap">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                    <BookOpen size={24} />
                                </div>
                                <h2 className="text-2xl font-bold text-kb-navy">Prevention & Education</h2>
                            </div>
                            <ul className="space-y-4">
                                <li>
                                    <a href="https://scamsurvivaltoolkit.bbbmarketplacetrust.org/" target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-xl hover:border-sst-primary hover:bg-slate-50 transition-colors">
                                        <span className="font-semibold block text-kb-navy mb-1">BBB Scam Survival Toolkit</span>
                                        <span className="text-sm text-kb-slate">Practical tools and resources to help you survive and avoid scams.</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="https://consumer.ftc.gov/scams" target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-xl hover:border-sst-primary hover:bg-slate-50 transition-colors">
                                        <span className="font-semibold block text-kb-navy mb-1">FTC Scams Information</span>
                                        <span className="text-sm text-kb-slate">Learn about recent scams and how to avoid them from the Federal Trade Commission.</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="https://www.aarp.org/money/scams-fraud/" target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-xl hover:border-sst-primary hover:bg-slate-50 transition-colors">
                                        <span className="font-semibold block text-kb-navy mb-1">AARP Scams & Fraud</span>
                                        <span className="text-sm text-kb-slate">Resources keeping up with the latest fraud tactics targeting older adults.</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="https://www.finra.org/investors/protect-your-money" target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-xl hover:border-sst-primary hover:bg-slate-50 transition-colors">
                                        <span className="font-semibold block text-kb-navy mb-1">FINRA: Protect Your Money</span>
                                        <span className="text-sm text-kb-slate">Tools and guidance to avoid investment fraud and protect your finances.</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="https://www.bbb.org/all/scam-prevention" target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-xl hover:border-sst-primary hover:bg-slate-50 transition-colors">
                                        <span className="font-semibold block text-kb-navy mb-1">BBB Scam Prevention Hub</span>
                                        <span className="text-sm text-kb-slate">Comprehensive articles and tips from the Better Business Bureau.</span>
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Stopping Unwanted Calls & Texts */}
                        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-6 flex-wrap">
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                                    <PhoneOff size={24} />
                                </div>
                                <h2 className="text-2xl font-bold text-kb-navy">Stop Calls & Texts</h2>
                            </div>
                            <ul className="space-y-4">
                                <li>
                                    <a href="https://www.fcc.gov/consumers/guides/stop-unwanted-robocalls-and-texts" target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-xl hover:border-sst-primary hover:bg-slate-50 transition-colors">
                                        <span className="font-semibold block text-kb-navy mb-1">FCC Guide on Robocalls</span>
                                        <span className="text-sm text-kb-slate">Official guidelines on stopping unwanted robocalls and text messages.</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="https://www.donotcall.gov/" target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-xl hover:border-sst-primary hover:bg-slate-50 transition-colors">
                                        <span className="font-semibold block text-kb-navy mb-1">National Do Not Call Registry</span>
                                        <span className="text-sm text-kb-slate">Register your phone boundaries to stop receiving telemarketing calls.</span>
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Advocacy & Support */}
                        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-6 flex-wrap">
                                <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                                    <ShieldAlert size={24} />
                                </div>
                                <h2 className="text-2xl font-bold text-kb-navy">Advocacy & Support</h2>
                            </div>
                            <ul className="space-y-4">
                                <li>
                                    <a href="https://advocatingforu.com/" target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-xl hover:border-sst-primary hover:bg-slate-50 transition-colors">
                                        <span className="font-semibold block text-kb-navy mb-1">Advocating for U</span>
                                        <span className="text-sm text-kb-slate">Support services and advocacy for victims of fraud and scams.</span>
                                    </a>
                                </li>
                            </ul>
                        </div>

                    </div>

                    <div className="text-center mt-12 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-3xl mx-auto">
                        <h3 className="text-xl font-bold mb-4 text-kb-navy">Need Help with Tech Security?</h3>
                        <p className="text-kb-slate mb-6">
                            If you're unsure about an email, text, or alert on your device, we can help you assess the situation and secure your accounts.
                        </p>
                        <Link href="/booking" className="btn btn-primary">
                            Book a Security Check Session
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    )
}
