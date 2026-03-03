'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Search } from 'lucide-react'

interface UserProfile {
  firstName: string
  email: string
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadProfile(session.user.id, session.user.email ?? '')
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        loadProfile(session.user.id, session.user.email ?? '')
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string, email: string) {
    const { data } = await supabase
      .from('profiles')
      .select('first_name, email')
      .eq('id', userId)
      .single()

    const nameFromProfile = (data as any)?.first_name
    const firstName = (nameFromProfile || email.split('@')[0]).split(' ')[0]
    setUser({ firstName, email })
  }

  async function handleLogout() {
    setMenuOpen(false)
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <>
      <header className="header">
        <div className="container">
          <div className="header-top">
            <form onSubmit={handleSearchSubmit} className="search-container relative w-full max-w-xs">
              <input
                type="search"
                className="search-input w-full pr-10"
                placeholder="Search..."
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-kb-muted hover:text-sst-primary transition-colors focus:outline-none"
                aria-label="Submit search"
              >
                <Search size={18} />
              </button>
            </form>

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
              {user ? (
                <div className="user-menu-wrapper" ref={menuRef}>
                  <button
                    className="user-greeting-btn"
                    onClick={() => setMenuOpen(prev => !prev)}
                    aria-expanded={menuOpen}
                    aria-haspopup="true"
                  >
                    <span className="greeting-icon">👋</span>
                    <span className="greeting-text">
                      {getGreeting()}, <strong>{user.firstName}</strong>
                    </span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`chevron ${menuOpen ? 'open' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {menuOpen && (
                    <div className="user-dropdown" role="menu">
                      <Link href="/account" className="user-dropdown-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                        <span className="menu-icon">👤</span> Manage My Account
                      </Link>
                      <Link href="/my-devices" className="user-dropdown-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                        <span className="menu-icon">📱</span> My Devices
                      </Link>
                      <Link href="/my-bookings" className="user-dropdown-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                        <span className="menu-icon">📅</span> My Bookings
                      </Link>
                      <Link href="/subscriptions" className="user-dropdown-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                        <span className="menu-icon">✨</span> My Subscriptions
                      </Link>
                      <Link href="/rewards" className="user-dropdown-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                        <span className="menu-icon">🏆</span> My Rewards
                      </Link>
                      <button className="user-dropdown-item user-dropdown-logout" role="menuitem" onClick={handleLogout}>
                        <span className="menu-icon">🚪</span> Log Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/login" className="btn btn-secondary">Log In</Link>
                  <Link href="/booking" className="btn btn-primary">Book Now</Link>
                </>
              )}
              {user && (
                <Link href="/booking" className="btn btn-primary">Book Now</Link>
              )}
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
            <li className={`nav-tab ${pathname === '/scam-prevention' ? 'active' : ''}`}>
              <Link href="/scam-prevention">Scam Prevention</Link>
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
