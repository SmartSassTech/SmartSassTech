import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SmartSass Tech | Private Admin Portal',
  description: 'Internal administration portal for managing bookings, customer records, and operations.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false
    }
  }
}

export default function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 antialiased selection:bg-teal-500 selection:text-white font-sans">
      {children}
    </div>
  )
}
