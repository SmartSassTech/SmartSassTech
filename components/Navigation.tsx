'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Phone } from 'lucide-react'
import PhoneModal from '@/components/PhoneModal'

export default function Navigation() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [phoneModalOpen, setPhoneModalOpen] = useState(false)

  // Do not render public header on admin portal
  if (pathname?.startsWith('/admin')) {
    return null
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handlePhoneClick = (e: React.MouseEvent) => {
    // Check if device is desktop (screen width >= 768px)
    if (window.innerWidth >= 768) {
      e.preventDefault()
      setPhoneModalOpen(true)
    }
  }

  return (
    <>
      <header className={`header sticky top-0 bg-white border-b border-gray-200 z-50 transition-all duration-300 ${isScrolled ? 'shadow-md py-2' : 'py-4'}`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center header-top">
            {/* Logo on the Left */}
            <div className="logo-container flex-shrink-0">
              <Link href="/" aria-label="SmartSass Tech Home">
                <img
                  src="/assets/images/logo-horiz.svg"
                  alt="SmartSass Tech"
                  className="logo h-12 w-auto md:h-14 lg:h-16"
                />
              </Link>
            </div>

            {/* Navigation Links in the Middle (Hidden on mobile/tablet) */}
            <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-6 xl:gap-8 justify-center flex-1 mx-4">
              <Link
                href="/"
                className={`relative font-semibold text-lg py-1 px-1 transition-colors duration-200 ${
                  pathname === '/' ? 'text-sst-primary font-bold' : 'text-sst-dark hover:text-sst-primary'
                } after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-sst-primary after:transition-all after:duration-200 ${
                  pathname === '/' ? 'after:opacity-100 after:scale-x-100' : 'after:opacity-0 after:scale-x-0 hover:after:opacity-100 hover:after:scale-x-100'
                }`}
              >
                Home
              </Link>
              <Link
                href="/#services"
                className="relative font-semibold text-lg py-1 px-1 transition-colors duration-200 text-sst-dark hover:text-sst-primary after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-sst-primary after:transition-all after:duration-200 after:opacity-0 after:scale-x-0 hover:after:opacity-100 hover:after:scale-x-100"
              >
                Services
              </Link>
              <Link
                href="/#in-home-vs-remote"
                className="relative font-semibold text-lg py-1 px-1 transition-colors duration-200 text-sst-dark hover:text-sst-primary after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-sst-primary after:transition-all after:duration-200 after:opacity-0 after:scale-x-0 hover:after:opacity-100 hover:after:scale-x-100"
              >
                In-Home vs. Remote
              </Link>
              <Link
                href="/about"
                className={`relative font-semibold text-lg py-1 px-1 transition-colors duration-200 ${
                  pathname === '/about' ? 'text-sst-primary font-bold' : 'text-sst-dark hover:text-sst-primary'
                } after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-sst-primary after:transition-all after:duration-200 ${
                  pathname === '/about' ? 'after:opacity-100 after:scale-x-100' : 'after:opacity-0 after:scale-x-0 hover:after:opacity-100 hover:after:scale-x-100'
                }`}
              >
                About Renee
              </Link>
              <Link
                href="/contact"
                className={`relative font-semibold text-lg py-1 px-1 transition-colors duration-200 ${
                  pathname === '/contact' ? 'text-sst-primary font-bold' : 'text-sst-dark hover:text-sst-primary'
                } after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-sst-primary after:transition-all after:duration-200 ${
                  pathname === '/contact' ? 'after:opacity-100 after:scale-x-100' : 'after:opacity-0 after:scale-x-0 hover:after:opacity-100 hover:after:scale-x-100'
                }`}
              >
                Contact
              </Link>
            </nav>

            {/* Actions on the Right */}
            <div className="flex items-center gap-4 header-actions flex-shrink-0">
              {/* Click to call button */}
              <a 
                href="tel:5856454549" 
                onClick={handlePhoneClick}
                className="hidden lg:flex items-center gap-2 text-sst-dark hover:text-sst-primary font-semibold text-lg mr-2 transition-colors cursor-pointer"
                aria-label="Call (585) 645-4549"
              >
                <Phone size={20} className="text-sst-primary shrink-0" aria-hidden="true" />
                <span className="hidden xl:inline">(585) 645-4549</span>
                <span className="xl:hidden text-base">Call</span>
              </a>

              <Link
                href="/booking"
                className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-full bg-sst-primary text-white font-semibold hover:bg-sst-primary-dark hover:text-white transition-all duration-200 shadow-sm hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5"
              >
                Book Now
              </Link>

              {/* Hamburger toggle */}
              <button
                className="mobile-menu-toggle lg:hidden p-2 min-w-[44px] min-h-[44px] text-sst-dark hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
                onClick={() => setMobileNavOpen(prev => !prev)}
                aria-expanded={mobileNavOpen}
                aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                {mobileNavOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile nav dropdown panel */}
      {mobileNavOpen && (
        <div 
          className="lg:hidden bg-white shadow-xl absolute w-full z-40 border-b border-gray-200"
          role="menu"
          aria-label="Mobile navigation"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setMobileNavOpen(false)
          }}
        >
          <div className="flex flex-col p-4 space-y-2">
            <Link role="menuitem" href="/" className="px-4 py-3 text-lg font-medium text-sst-dark rounded-lg hover:bg-sst-bg-light hover:text-sst-primary transition-colors" onClick={() => setMobileNavOpen(false)}>Home</Link>
            <Link role="menuitem" href="/#services" className="px-4 py-3 text-lg font-medium text-sst-dark rounded-lg hover:bg-sst-bg-light hover:text-sst-primary transition-colors" onClick={() => setMobileNavOpen(false)}>Services</Link>
            <Link role="menuitem" href="/#in-home-vs-remote" className="px-4 py-3 text-lg font-medium text-sst-dark rounded-lg hover:bg-sst-bg-light hover:text-sst-primary transition-colors" onClick={() => setMobileNavOpen(false)}>In-Home vs. Remote</Link>
            <Link role="menuitem" href="/about" className="px-4 py-3 text-lg font-medium text-sst-dark rounded-lg hover:bg-sst-bg-light hover:text-sst-primary transition-colors" onClick={() => setMobileNavOpen(false)}>About Renee</Link>
            <Link role="menuitem" href="/contact" className="px-4 py-3 text-lg font-medium text-sst-dark rounded-lg hover:bg-sst-bg-light hover:text-sst-primary transition-colors" onClick={() => setMobileNavOpen(false)}>Contact</Link>
          </div>
        </div>
      )}

      {/* Mobile Sticky Call Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 flex items-center justify-between gap-4">
        <a href="tel:5856454549" className="flex-1 flex items-center justify-center gap-2 bg-sst-primary text-white rounded-full min-h-[56px] font-bold text-lg shadow-md active:bg-sst-primary-dark transition-all duration-200">
          <Phone size={24} />
          Call: (585) 645-4549
        </a>
      </div>

      {/* Phone Modal for Desktop Users */}
      <PhoneModal isOpen={phoneModalOpen} onClose={() => setPhoneModalOpen(false)} />
    </>
  )
}

