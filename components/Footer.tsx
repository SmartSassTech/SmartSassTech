'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapPin, Phone, Clock, Mail } from 'lucide-react'

export default function Footer() {
  const pathname = usePathname()

  // Do not render public footer on admin portal
  if (pathname?.startsWith('/admin')) {
    return null
  }
  return (
    <footer className="footer bg-sst-primary pt-14 pb-8 border-t border-white/20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 mb-12">
          
          {/* Brand & Business Info */}
          <div>
            <Link href="/" aria-label="SmartSass Tech Home" className="inline-block mb-4">
              <img
                src="/assets/images/darkLogo-horiz.svg"
                alt="SmartSass Tech"
                className="h-14 sm:h-16 md:h-18 w-auto max-w-[280px] sm:max-w-[320px] object-contain"
              />
            </Link>
            <p className="text-sst-beige text-base mb-6 leading-relaxed">
              Patient, friendly technology support in plain English for Rochester, NY. We fix device issues, protect against scams, and leave clear written instructions.
            </p>
            <div className="space-y-3 text-white">
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-white shrink-0" />
                <a href="tel:5856454549" className="font-bold text-lg hover:text-sst-beige transition-colors">(585) 645-4549</a>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-white shrink-0" />
                <a href="mailto:smartsasstech@gmail.com" className="hover:text-sst-beige transition-colors text-base">smartsasstech@gmail.com</a>
              </div>
            </div>
          </div>

          {/* Service Areas & Hours */}
          <div className="text-white">
            <h3 className="text-xl font-bold mb-4 text-white border-b border-white/20 pb-2">Location & Hours</h3>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-white shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-base mb-1 text-white">Service Area</h4>
                  <p className="text-sst-beige text-sm leading-relaxed">
                    Rochester, Webster, Fairport, Pittsford, Penfield, Brighton, and Monroe County.
                    <span className="italic block mt-1">Remote support nationwide.</span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={20} className="text-white shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-base mb-1 text-white">Hours</h4>
                  <p className="text-sst-beige text-sm">Mon–Sat: 8:00 AM – 6:00 PM</p>
                  <p className="text-white font-medium text-xs mt-1">Emergency calls available 24/7</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-white border-b border-white/20 pb-2">Quick Navigation</h3>
            <ul className="grid grid-cols-2 gap-2 text-base">
              <li><Link href="/" className="text-sst-beige hover:text-white transition-colors duration-200 block py-3">Home</Link></li>
              <li><Link href="/#services" className="text-sst-beige hover:text-white transition-colors duration-200 block py-3">Services</Link></li>
              <li><Link href="/about" className="text-sst-beige hover:text-white transition-colors duration-200 block py-3">About Renee</Link></li>
              <li><Link href="/contact" className="text-sst-beige hover:text-white transition-colors duration-200 block py-3">Contact Us</Link></li>
              <li><Link href="/scam-prevention" className="text-sst-beige hover:text-white transition-colors duration-200 block py-3">Scam Safety</Link></li>
              <li><Link href="/booking" className="text-white font-bold hover:text-sst-beige hover:underline transition-colors duration-200 block py-3">Book Session &rarr;</Link></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-sst-beige text-sm">
            &copy; {new Date().getFullYear()} SmartSass Tech. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-sst-beige">
            <Link href="/scam-prevention" className="hover:text-white transition-colors">Scam Prevention</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
