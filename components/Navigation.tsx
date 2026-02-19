'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header className="header">
        <div className="container">
          <div className="header-top">
            <div className="search-container">
              <input type="search" className="search-input" placeholder="Search" aria-label="Search" />
            </div>

            <div className="logo-container">
              <Link href="/" aria-label="SmartSass Tech Home">
                <img
                  src="/assets/images/SST Logo Black & Taupe No Background.svg"
                  alt="SmartSass Tech"
                  className="logo"
                />
              </Link>
            </div>

            <div className="header-actions">
              <Link href="/login" className="btn btn-secondary">Log In</Link>
              <Link href="/booking" className="btn btn-primary">Book Now</Link>
            </div>
          </div>
        </div>
      </header>

      <nav aria-label="Main navigation" className={`sticky-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <ul className="nav-tabs">
            <li className={`nav-tab ${pathname === '/' ? 'active' : ''}`}>
              <Link href="/">Home</Link>
            </li>
            <li className={`nav-tab ${pathname.startsWith('/articles') || pathname.startsWith('/expertise') ? 'active' : ''}`}>
              <Link href="/articles">Resources</Link>
            </li>
            <li className={`nav-tab ${pathname === '/about' ? 'active' : ''}`}>
              <Link href="/about">About</Link>
            </li>
            <li className={`nav-tab ${pathname === '/contact' ? 'active' : ''}`}>
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
        </div>
      </nav>
    </>
  )
}
