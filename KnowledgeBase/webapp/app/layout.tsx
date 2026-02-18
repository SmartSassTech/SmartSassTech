import '@/app/globals.css'
import type { Metadata, Viewport } from 'next'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Chatbot from '@/components/Chatbot'

export const metadata: Metadata = {
  title: 'Knowledge Base - Tech Help for Everyone',
  description: 'Find answers to your technology questions. Browse topics by device and category.',
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
      <body className="bg-kb-bg text-kb-dark font-sans">
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <Chatbot />
      </body>
    </html>
  )
}
