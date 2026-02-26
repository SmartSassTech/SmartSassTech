import '@/app/globals.css'
import type { Metadata, Viewport } from 'next'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Chatbot from '@/components/Chatbot'
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata: Metadata = {
  title: 'SmartSass Tech | Tech Help | Rochester, NY',
  description: 'Patient, jargon-free technology support for older adults and beginners in Rochester, NY. We help with computers, smartphones, tablets, and more.',
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
    <html lang="en">
      <head>
        {/* We can add any specific head tags here if needed, but Next handles metadata */}
      </head>
      <body>
        {/* Skip to main content for accessibility */}
        <a href="#main-content" className="sr-only">Skip to main content</a>

        <Navigation />

        {children}

        <Footer />
        <Chatbot />
        <SpeedInsights />
      </body>
    </html>
  )
}
