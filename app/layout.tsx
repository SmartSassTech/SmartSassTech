import '@/app/globals.css'
import type { Metadata, Viewport } from 'next'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
// Trigger rebuild for logo change
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { DM_Sans, Outfit } from 'next/font/google'

// Use next/font instead of CSS @import to eliminate font-swap CLS
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-dm-sans',
})

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: 'SmartSass Tech | Patient, Stress-Free Tech Help | Rochester, NY',
  description: 'Patient, friendly in-home and remote technology support, 1-on-1 lessons, device setup, and scam protection in plain English for Rochester, NY.',
  icons: {
    icon: '/assets/images/logo.png',
    apple: '/assets/images/logo.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

const businessSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["LocalBusiness", "ProfessionalService"],
      "@id": "https://www.smartsasstech.com/#business",
      "name": "SmartSass Tech",
      "legalName": "SmartSass Tech",
      "alternateName": ["SST", "SmartSass Tech Support"],
      "url": "https://www.smartsasstech.com",
      "logo": "https://www.smartsasstech.com/assets/images/logo.png",
      "image": "https://www.smartsasstech.com/assets/images/logo.png",
      "description": "Patient, friendly in-home and remote technology support, 1-on-1 lessons, device setup, and scam protection in plain English for older adults and families in Rochester, NY and surrounding Monroe County areas.",
      "telephone": "+1-585-645-4549",
      "email": "smartsasstech@gmail.com",
      "priceRange": "$50/hr",
      "currenciesAccepted": "USD",
      "paymentAccepted": "Cash, Check, Credit Card, PayPal",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Rochester",
        "addressRegion": "NY",
        "postalCode": "14618",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 43.1566,
        "longitude": -77.6088
      },
      "areaServed": [
        {
          "@type": "City",
          "name": "Rochester",
          "sameAs": "https://en.wikipedia.org/wiki/Rochester,_New_York"
        },
        { "@type": "City", "name": "Webster" },
        { "@type": "City", "name": "Fairport" },
        { "@type": "City", "name": "Pittsford" },
        { "@type": "City", "name": "Penfield" },
        { "@type": "City", "name": "Brighton" },
        {
          "@type": "AdministrativeArea",
          "name": "Monroe County",
          "sameAs": "https://en.wikipedia.org/wiki/Monroe_County,_New_York"
        },
        {
          "@type": "Country",
          "name": "United States",
          "description": "Remote Support available nationwide"
        }
      ],
      "founder": {
        "@type": "Person",
        "name": "Renee Sassone",
        "jobTitle": "Founder & Lead Tech Guide"
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          "opens": "08:00",
          "closes": "18:00"
        }
      ],
      "audience": {
        "@type": "Audience",
        "audienceType": "Older adults, seniors, adult children, and caregivers"
      },
      "knowsAbout": [
        "Senior Technology Support",
        "In-Home Tech Help",
        "Remote Computer Assistance",
        "Elder Tech Scam & Fraud Prevention",
        "iPad and Smartphone Lessons",
        "Wi-Fi and Printer Troubleshooting",
        "Photo Backup and Organization",
        "Video Calling Setup (Zoom, FaceTime, Google Meet)"
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Patient Technology Support & Tutoring",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "In-Home Tech Visit",
              "description": "Hands-on in-home technology help for printers, Wi-Fi, smart TVs, laptops, and personalized device guidance in the Greater Rochester area.",
              "provider": { "@id": "https://www.smartsasstech.com/#business" }
            },
            "price": "50.00",
            "priceCurrency": "USD",
            "unitText": "HOUR",
            "url": "https://www.smartsasstech.com/booking?type=in-home"
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Remote Support",
              "description": "Patient technology assistance over the phone or Zoom screen share for quick software fixes, email questions, and general guidance nationwide.",
              "provider": { "@id": "https://www.smartsasstech.com/#business" }
            },
            "price": "50.00",
            "priceCurrency": "USD",
            "unitText": "HOUR",
            "url": "https://www.smartsasstech.com/booking?type=remote"
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Scam Safety & Security Inspection",
              "description": "Reviewing suspicious emails and texts, securing accounts, removing unwanted remote access programs, and teaching seniors how to spot scammers.",
              "provider": { "@id": "https://www.smartsasstech.com/#business" }
            },
            "price": "50.00",
            "priceCurrency": "USD",
            "unitText": "HOUR",
            "url": "https://www.smartsasstech.com/scam-prevention"
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "1-on-1 Patient Tech Lessons",
              "description": "Patient, personalized lessons for iPads, smartphones, Facebook, and video calling grandchildren with written notes left after every session.",
              "provider": { "@id": "https://www.smartsasstech.com/#business" }
            },
            "price": "50.00",
            "priceCurrency": "USD",
            "unitText": "HOUR",
            "url": "https://www.smartsasstech.com/booking?note=1-on-1%20Lessons"
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Device Setup & Fixing",
              "description": "Proper setup and Wi-Fi connection for new computers, iPads, printers, and smart home gadgets.",
              "provider": { "@id": "https://www.smartsasstech.com/#business" }
            },
            "price": "50.00",
            "priceCurrency": "USD",
            "unitText": "HOUR",
            "url": "https://www.smartsasstech.com/booking?note=Device%20Setup%20%26%20Fixing"
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Photo Organization & Backup",
              "description": "Safe cloud backup and storage clean-up so you never lose precious memories and can find photos easily.",
              "provider": { "@id": "https://www.smartsasstech.com/#business" }
            },
            "price": "50.00",
            "priceCurrency": "USD",
            "unitText": "HOUR",
            "url": "https://www.smartsasstech.com/booking?note=Photo%20Organization"
          }
        ]
      },
      "potentialAction": [
        {
          "@type": "ReserveAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://www.smartsasstech.com/booking",
            "inLanguage": "en-US",
            "actionPlatform": [
              "http://schema.org/DesktopWebPlatform",
              "http://schema.org/MobileWebPlatform"
            ]
          },
          "result": {
            "@type": "Reservation",
            "name": "Schedule Tech Help Session"
          }
        },
        {
          "@type": "CommunicateAction",
          "target": "tel:+15856454549"
        }
      ]
    }
  ]
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${outfit.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
        />
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
