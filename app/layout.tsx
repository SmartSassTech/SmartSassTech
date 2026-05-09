import '@/app/globals.css'
import type { Metadata, Viewport } from 'next'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
// Trigger rebuild for logo change
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Inter } from 'next/font/google'

// Use next/font instead of CSS @import to eliminate font-swap CLS
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'SmartSass Tech | Tech Help | Rochester, NY',
  description: 'Patient, jargon-free technology support for older adults and beginners in Rochester, NY. We help with computers, smartphones, tablets, and more.',
  icons: {
    icon: '/assets/images/logo.svg',
    apple: '/assets/images/logo.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* We can add any specific head tags here if needed, but Next handles metadata */}
      </head>
      <body>
        {/* Skip to main content for accessibility */}
        <a href="#main-content" className="skip-link">Skip to main content</a>

        <Navigation />

        {children}

        <Footer />

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
