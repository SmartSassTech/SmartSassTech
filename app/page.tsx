import Link from 'next/link'
import ContactForm from '@/components/ContactForm'
import HomepageFAQ from '@/components/HomepageFAQ'
import { ShieldCheck, Laptop, Image as ImageIcon, MessageCircle, MapPin, CheckCircle, FileText, UserCheck } from 'lucide-react'

export const revalidate = 3600 // Revalidate every hour

export default function Home() {
  return (
    <main id="main-content">
      {/* 1. Hero Banner */}
      <section className="bg-sst-bg-light relative overflow-hidden py-16 md:py-24">
        {/* Abstract background blobs removed per user request */}
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-sst-primary mb-6 leading-tight tracking-tight">
              Patient, Stress-Free Tech Help <br className="hidden md:block" />
              in the Greater Rochester Area
            </h1>
            <p className="text-xl md:text-2xl text-sst-dark mb-10 max-w-2xl mx-auto leading-relaxed">
              Friendly in-home visits and phone support. We set up your devices, protect you from scams, and explain everything in plain English at your pace.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="tel:5856454549" className="w-full sm:w-auto min-h-[56px] px-8 rounded-full bg-sst-primary text-white font-bold text-lg hover:bg-sst-primary-dark hover:text-white hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)] transition-all duration-200 flex items-center justify-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                Call: (585) 645-4549
              </a>
              <Link href="/booking" className="w-full sm:w-auto min-h-[56px] px-8 rounded-full bg-white border-2 border-sst-primary text-sst-primary font-bold text-lg hover:bg-sst-bg-light hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200 flex items-center justify-center">
                Schedule a Visit
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Local Trust Signals Strip */}
      <section className="bg-sst-primary py-8 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <MapPin size={32} className="text-sst-beige" />
              <span className="font-bold">Local to Rochester, NY</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <UserCheck size={32} className="text-sst-beige" />
              <span className="font-bold">Friendly & Reliable</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <FileText size={32} className="text-sst-beige" />
              <span className="font-bold">Written Step-by-Step Instructions</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CheckCircle size={32} className="text-sst-beige" />
              <span className="font-bold">Patient & in Plain English</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Dual-Audience Messaging */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-sst-primary mb-4">Who We Help</h2>
            <p className="text-xl text-sst-dark max-w-2xl mx-auto">We provide peace of mind for both seniors and their families.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* For Seniors */}
            <div className="bg-sst-bg-light p-8 md:p-10 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-200">
              <div className="absolute top-0 right-0 w-24 h-24 bg-sst-primary/10 rounded-bl-full -mr-4 -mt-4 transition-transform duration-300 group-hover:scale-110"></div>
              <h3 className="text-2xl font-bold text-sst-primary mb-4 relative z-10">For Older Adults</h3>
              <p className="text-lg text-sst-dark mb-6 leading-relaxed relative z-10">
                Tired of struggling with technology or waiting for busy relatives to help? We provide clear, friendly, in-home guidance at your preferred pace, with helpful written notes so you can use your devices with total confidence.
              </p>
              <ul className="space-y-3 mb-8 relative z-10">
                <li className="flex items-start gap-3 text-sst-dark font-medium">
                  <CheckCircle className="text-sst-primary shrink-0 mt-0.5" size={20} />
                  Learn to use your iPad or smartphone
                </li>
                <li className="flex items-start gap-3 text-sst-dark font-medium">
                  <CheckCircle className="text-sst-primary shrink-0 mt-0.5" size={20} />
                  Make your printer and home internet connect reliably
                </li>
                <li className="flex items-start gap-3 text-sst-dark font-medium">
                  <CheckCircle className="text-sst-primary shrink-0 mt-0.5" size={20} />
                  Clear, large-print written instructions left behind
                </li>
              </ul>
              <Link href="/booking" className="inline-flex font-bold text-sst-primary hover:text-sst-secondary hover:underline transition-colors duration-200 relative z-10">
                Book help for yourself &rarr;
              </Link>
            </div>

            {/* For Family */}
            <div className="bg-sst-primary p-8 md:p-10 rounded-3xl text-white shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-200">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full -mr-4 -mt-4 transition-transform duration-300 group-hover:scale-110"></div>
              <h3 className="text-2xl font-bold mb-4 relative z-10 text-white">For Adult Children & Caregivers</h3>
              <p className="text-lg text-sst-beige mb-6 leading-relaxed relative z-10">
                Do you worry about your parents falling for scams or struggling with their devices while you're busy? We act as your family’s trusted, local Rochester tech support team.
              </p>
              <ul className="space-y-3 mb-8 relative z-10 text-sst-beige">
                <li className="flex items-start gap-3 font-medium">
                  <CheckCircle className="text-white shrink-0 mt-0.5" size={20} />
                  Ensure their devices are secure and scam-free
                </li>
                <li className="flex items-start gap-3 font-medium">
                  <CheckCircle className="text-white shrink-0 mt-0.5" size={20} />
                  Set up video calling so you can stay connected
                </li>
                <li className="flex items-start gap-3 font-medium">
                  <CheckCircle className="text-white shrink-0 mt-0.5" size={20} />
                  Receive friendly updates after our visits so you're always in the loop
                </li>
              </ul>
              <Link href="/booking" className="inline-flex font-bold text-white hover:text-sst-beige hover:underline transition-colors duration-200 relative z-10">
                Book help for a loved one &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Solution-Focused Services Grid */}
      <section id="services" className="py-20 bg-sst-bg-light border-y border-gray-200">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-sst-primary mb-4">How We Can Help</h2>
            <p className="text-xl text-sst-dark max-w-2xl mx-auto">We focus on the results you want, explained clearly in plain English.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Service 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 border border-gray-100 flex gap-6">
              <div className="w-16 h-16 shrink-0 bg-sst-primary/10 text-sst-primary rounded-2xl flex items-center justify-center">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-sst-primary mb-2">Scam Safety & Security</h3>
                <p className="text-sst-dark text-lg mb-4">We'll review suspicious emails or texts, protect your email and accounts, and teach you how to spot scammers before they trick you.</p>
                <Link href="/scam-prevention" className="text-sst-primary font-bold hover:text-sst-secondary hover:underline transition-colors duration-200">Learn about scam prevention &rarr;</Link>
              </div>
            </div>

            {/* Service 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 border border-gray-100 flex gap-6">
              <div className="w-16 h-16 shrink-0 bg-sst-primary/10 text-sst-primary rounded-2xl flex items-center justify-center">
                <Laptop size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-sst-primary mb-2">Device Setup & Fixing</h3>
                <p className="text-sst-dark text-lg mb-4">Got a new printer, laptop, computer, or iPad? We'll set it up properly, connect it to your home internet, and make sure it works every time.</p>
                <Link href="/booking?note=Device%20Setup%20%26%20Fixing" className="text-sst-primary font-bold hover:text-sst-secondary hover:underline transition-colors duration-200">Get device help &rarr;</Link>
              </div>
            </div>

            {/* Service 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 border border-gray-100 flex gap-6">
              <div className="w-16 h-16 shrink-0 bg-sst-primary/10 text-sst-primary rounded-2xl flex items-center justify-center">
                <ImageIcon size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-sst-primary mb-2">Photo Organization</h3>
                <p className="text-sst-dark text-lg mb-4">Phone saying "Storage Full" or worried about losing memories? We'll safely back up your pictures and show you how to find them easily.</p>
                <Link href="/booking?note=Photo%20Organization" className="text-sst-primary font-bold hover:text-sst-secondary hover:underline transition-colors duration-200">Organize my photos &rarr;</Link>
              </div>
            </div>

            {/* Service 4 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 border border-gray-100 flex gap-6">
              <div className="w-16 h-16 shrink-0 bg-sst-primary/10 text-sst-primary rounded-2xl flex items-center justify-center">
                <MessageCircle size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-sst-primary mb-2">1-on-1 Lessons</h3>
                <p className="text-sst-dark text-lg mb-4">Want to learn how to video call your grandkids, use Facebook safely, or order groceries online? No question is too simple—we teach patiently.</p>
                <Link href="/booking?note=1-on-1%20Lessons" className="text-sst-primary font-bold hover:text-sst-secondary hover:underline transition-colors duration-200">Book a lesson &rarr;</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. In-Home vs Remote */}
      <section id="in-home-vs-remote" className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-sst-primary mb-4">How We Meet</h2>
            <p className="text-xl text-sst-dark max-w-2xl mx-auto">Choose the option that feels most comfortable for you.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-stretch">
            <div className="flex-1 bg-white border-2 border-sst-primary/20 rounded-3xl p-8 md:p-10 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col">
              <div className="w-20 h-20 bg-sst-primary/10 text-sst-primary rounded-2xl flex items-center justify-center mb-6">
                <MapPin size={40} />
              </div>
              <h3 className="text-3xl font-bold text-sst-primary mb-4">In-Home Visits</h3>
              <p className="text-lg text-sst-dark mb-6 flex-1">
                We come directly to your home throughout Rochester and Monroe County—including Webster, Fairport, Pittsford, Penfield, and Brighton. This is best for hands-on help with home internet, printers, smart TVs, or if you learn best side by side.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 font-medium text-sst-dark">
                  <CheckCircle className="text-sst-primary shrink-0" size={20} /> Hands-on help with your setup
                </li>
                <li className="flex items-center gap-3 font-medium text-sst-dark">
                  <CheckCircle className="text-sst-primary shrink-0" size={20} /> We wear masks upon request
                </li>
                <li className="flex items-center gap-3 font-medium text-sst-dark">
                  <CheckCircle className="text-sst-primary shrink-0" size={20} /> Step-by-step written instructions left on your table
                </li>
              </ul>
              <Link href="/booking?type=in-home" className="min-h-[56px] flex items-center justify-center w-full rounded-xl bg-sst-primary text-white font-bold text-lg hover:bg-sst-primary-dark hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                Book In-Home Visit
              </Link>
            </div>

            <div className="flex-1 bg-sst-bg-light border border-gray-200 rounded-3xl p-8 md:p-10 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col">
              <div className="w-20 h-20 bg-sst-primary/10 text-sst-primary rounded-2xl flex items-center justify-center mb-6">
                <Laptop size={40} />
              </div>
              <h3 className="text-3xl font-bold text-sst-primary mb-4">Remote Support</h3>
              <p className="text-lg text-sst-dark mb-6 flex-1">
                We help you over the phone or via Zoom with safe screen-sharing that you control—you can disconnect at any moment with one click. This is perfect for quick software fixes, email questions, or everyday troubleshooting.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 font-medium text-sst-dark">
                  <CheckCircle className="text-sst-primary shrink-0" size={20} /> Faster availability and flexible scheduling
                </li>
                <li className="flex items-center gap-3 font-medium text-sst-dark">
                  <CheckCircle className="text-sst-primary shrink-0" size={20} /> Available anywhere in the US
                </li>
                <li className="flex items-center gap-3 font-medium text-sst-dark">
                  <CheckCircle className="text-sst-primary shrink-0" size={20} /> Safe screen-sharing you can disconnect at any time
                </li>
              </ul>
              <Link href="/booking?type=remote" className="min-h-[56px] flex items-center justify-center w-full rounded-xl bg-white border-2 border-sst-primary text-sst-primary font-bold text-lg hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
                Book Remote Support
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Homepage FAQ Section (GEO & Conversion) */}
      <HomepageFAQ />

      {/* 7. Streamlined Contact Form */}
      <section className="py-20 bg-sst-primary text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-sst-primary to-sst-primary-dark z-0"></div>
        <div className="container mx-auto px-4 relative z-10 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-white">Need a hand? Reach out today.</h2>
            <p className="text-xl text-sst-beige max-w-2xl mx-auto">
              Send us a message below, or call us directly at <a href="tel:5856454549" className="font-bold text-white hover:underline">(585) 645-4549</a>. We'll get back to you right away.
            </p>
          </div>
          
          <ContactForm />
          
        </div>
      </section>
    </main>
  )
}
