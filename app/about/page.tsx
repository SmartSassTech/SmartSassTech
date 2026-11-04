import Link from 'next/link'
import { CheckCircle, Phone } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Renee | SmartSass Tech',
  description: 'Learn about Renee, founder of SmartSass Tech, and her mission to provide patient, jargon-free technology help for seniors in Rochester, NY.',
}

export default function AboutPage() {
  return (
    <main id="main-content" className="bg-sst-bg-light min-h-screen py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          
          <div className="bg-sst-primary p-8 md:p-12 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">About Renee</h1>
            <p className="text-xl text-sst-beige max-w-2xl mx-auto">
              Founder & Lead Tech Guide at SmartSass Tech
            </p>
          </div>

          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-10 items-center md:items-start mb-12">
              <div className="w-48 h-48 md:w-64 md:h-64 shrink-0 bg-gray-200 rounded-full border-4 border-sst-bg-light shadow-md flex items-center justify-center overflow-hidden relative">
                {/* Placeholder for Photo */}
                <span className="text-gray-400 font-medium text-lg text-center p-4">
                  [Photo Placeholder] <br /> <span className="text-sm">To be updated in next phase</span>
                </span>
              </div>
              
              <div className="flex-1 space-y-6 text-lg text-sst-dark leading-relaxed">
                <p>
                  <strong>[Placeholder Bio Content]</strong> Hello! I'm Renee, the founder of SmartSass Tech. I started this business because I noticed a huge gap in how technology is taught to older adults. Too often, tech support is rushed, full of confusing jargon, and leaves people feeling frustrated or embarrassed.
                </p>
                <p>
                  I believe technology should be a tool that empowers you, not something that causes anxiety. Whether you want to learn how to video chat with your grandchildren, safely manage your emails, or just finally get that printer working, I am here to help.
                </p>
                <p>
                  My approach is simple: <strong>infinite patience, zero jargon, and clear, written instructions</strong> that you can reference after I leave. We walk through everything together at your pace, step by step, ensuring you feel completely comfortable.
                </p>
              </div>
            </div>

            <div className="bg-sst-bg-light rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-bold text-sst-primary mb-6 text-center">Why Work With Me?</h2>
              <ul className="grid md:grid-cols-2 gap-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-sst-teal shrink-0 mt-1" size={24} />
                  <span className="font-medium text-sst-dark text-lg">Local to the Rochester, NY area</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-sst-teal shrink-0 mt-1" size={24} />
                  <span className="font-medium text-sst-dark text-lg">Local & Community-Trusted</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-sst-teal shrink-0 mt-1" size={24} />
                  <span className="font-medium text-sst-dark text-lg">Extremely patient and understanding</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-sst-teal shrink-0 mt-1" size={24} />
                  <span className="font-medium text-sst-dark text-lg">Clear, written notes left behind</span>
                </li>
              </ul>
            </div>

            <div className="text-center bg-white border-2 border-sst-primary rounded-2xl p-8 md:p-12">
              <h2 className="text-3xl font-bold text-sst-primary mb-4">Ready to get started?</h2>
              <p className="text-xl text-sst-dark mb-8 max-w-xl mx-auto">
                Give me a call or book a session online. I look forward to meeting you!
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="tel:5856454549" className="w-full sm:w-auto min-h-[56px] px-8 rounded-full bg-sst-primary text-white font-bold text-lg hover:bg-sst-primary-dark hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 shadow-md flex items-center justify-center gap-2">
                  <Phone size={20} />
                  (585) 645-4549
                </a>
                <Link href="/booking" className="w-full sm:w-auto min-h-[56px] px-8 rounded-full bg-white border-2 border-sst-primary text-sst-primary font-bold text-lg hover:bg-sst-bg-light hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 flex items-center justify-center">
                  Book a Session
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
