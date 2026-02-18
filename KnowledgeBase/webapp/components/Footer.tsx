'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TOPIC_CATEGORIES } from '@/lib/constants'
import ArticleRequestModal from './ArticleRequestModal'

export default function Footer() {
  const [showModal, setShowModal] = useState(false)

  return (
    <footer className="bg-kb-navy text-kb-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div className="text-left">
            <h3 className="text-sm font-bold mb-4 uppercase tracking-wide">Knowledge Base Topics</h3>
            <ul className="space-y-1 text-xs text-kb-pale">
              {TOPIC_CATEGORIES.map(category => (
                <li key={category}>
                  <Link
                    href={`/articles?category=${encodeURIComponent(category)}`}
                    className="hover:text-kb-cream transition-colors"
                  >
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-left">
            <h3 className="text-sm font-bold mb-4 uppercase tracking-wide">External Support</h3>
            <ul className="space-y-1 text-xs text-kb-pale">
              <li><a href="https://support.apple.com" target="_blank" rel="noopener noreferrer" className="hover:text-kb-cream transition-colors">Apple Support</a></li>
              <li><a href="https://support.microsoft.com" target="_blank" rel="noopener noreferrer" className="hover:text-kb-cream transition-colors">Microsoft Support</a></li>
              <li><a href="https://support.google.com" target="_blank" rel="noopener noreferrer" className="hover:text-kb-cream transition-colors">Google Help</a></li>
              <li><a href="https://www.amazon.com/gp/help/customer/display.html" target="_blank" rel="noopener noreferrer" className="hover:text-kb-cream transition-colors">Amazon Help</a></li>
              <li><a href="https://www.samsung.com/us/support/" target="_blank" rel="noopener noreferrer" className="hover:text-kb-cream transition-colors">Samsung Support</a></li>
            </ul>
          </div>

          <div className="text-left">
            <h3 className="text-sm font-bold mb-4 uppercase tracking-wide">Resources</h3>
            <ul className="space-y-1 text-xs text-kb-pale">
              <li><Link href="/articles" className="hover:text-kb-cream transition-colors">All Articles</Link></li>
              <li><a href="https://www.smartsasstech.com/booking-calendar/tech-support" target="_blank" rel="noopener noreferrer" className="hover:text-kb-cream transition-colors">Get Help</a></li>
              <li><a href="https://www.smartsasstech.com/contact" target="_blank" rel="noopener noreferrer" className="hover:text-kb-cream transition-colors">Contact Us</a></li>
              <li><button onClick={() => setShowModal(true)} className="hover:text-kb-cream transition-colors text-left">Request an Article</button></li>
              <li><a href="https://www.smartsasstech.com" target="_blank" rel="noopener noreferrer" className="hover:text-kb-cream transition-colors">SmartSass Tech Website</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-kb-slate pt-8 flex flex-col items-center gap-4">
          <p className="text-center text-xs text-kb-pale">
            &copy; 2025 SmartSass Tech. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-kb-pale">
            <a href="https://www.smartsasstech.com/contact" target="_blank" rel="noopener noreferrer" className="hover:text-kb-cream transition-colors">Contact</a>
            <Link href="/privacy" className="hover:text-kb-cream transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-kb-cream transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>

      <ArticleRequestModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </footer>
  )
}
