import Link from 'next/link'
import Image from 'next/image'
import { Phone, Mail, MapPin, UserCheck, FileText, MessageCircle, ArrowRight } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us | SmartSass Tech',
  description: 'Learn about Renee Sassone, founder of SmartSass Tech, and our mission to provide personalized, jargon-free technology help for seniors and adults in Rochester, NY.',
}

export default function AboutPage() {
  return (
    <main id="main-content" className="bg-sst-bg-light min-h-screen py-10 md:py-16">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Page Hero Header */}
        <div className="bg-sst-primary rounded-3xl p-8 md:p-12 text-center text-white mb-10 shadow-lg relative overflow-hidden">
          <div className="max-w-2xl mx-auto relative z-10">
            <span className="inline-block text-xs md:text-sm font-semibold tracking-wider uppercase text-sst-beige/80 bg-white/10 px-4 py-1.5 rounded-full mb-4">
              SmartSass Tech
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
              About Us
            </h1>
            <p className="text-lg md:text-xl text-sst-beige leading-relaxed">
              Empowering seniors and adults across Greater Rochester with patient, one-on-one technology guidance and genuine peace of mind.
            </p>
          </div>
        </div>

        {/* Founder Feature: Profile Card + Bio */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch mb-12">
          
          {/* Left Column: Founder Profile Card */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between items-center text-center h-full">
            <div className="w-full flex flex-col items-center">
              <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full border-4 border-sst-bg-light shadow-md overflow-hidden mb-4 bg-gray-100">
                <Image
                  src="/assets/images/headshot.png"
                  alt="Renee Sassone, Founder of SmartSass Tech"
                  fill
                  sizes="(max-width: 640px) 176px, 192px"
                  className="object-cover"
                  priority
                />
              </div>

              <h2 className="text-2xl font-bold text-sst-primary">Renee Sassone</h2>
              <p className="text-sst-secondary font-medium text-sm sm:text-base mt-1 mb-5">
                Founder & Lead Tech Guide
              </p>
              
              {/* Location, Delivery & Services List */}
              <div className="w-full border-t border-gray-100 pt-4 space-y-2.5 text-left">
                <div className="flex items-center gap-2.5 text-sst-dark text-sm sm:text-base">
                  <div className="w-7 h-7 rounded-full bg-sst-bg-light flex items-center justify-center shrink-0">
                    <MapPin size={16} className="text-sst-primary" />
                  </div>
                  <span className="font-medium">Rochester, NY</span>
                </div>

                <div className="flex items-center gap-2.5 text-sst-dark text-sm sm:text-base">
                  <div className="w-7 h-7 rounded-full bg-sst-bg-light flex items-center justify-center shrink-0">
                    <UserCheck size={16} className="text-sst-primary" />
                  </div>
                  <span className="font-medium">In-Home & Remote Sessions</span>
                </div>

                <div className="pt-2">
                  <p className="text-xs uppercase tracking-wider font-bold text-sst-primary/80 mb-2">
                    Services Provided
                  </p>
                  <ul className="space-y-1.5 text-sm text-sst-dark">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sst-primary shrink-0"></span>
                      Device Setup & Troubleshooting
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sst-primary shrink-0"></span>
                      Scam Prevention & Account Security
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sst-primary shrink-0"></span>
                      Photo Backup & Organization
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sst-primary shrink-0"></span>
                      1-on-1 Patient Tech Lessons
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Call and Email CTA Buttons */}
            <div className="w-full mt-6 pt-4 border-t border-gray-100 flex flex-col gap-2.5">
              <a
                href="tel:5856454549"
                className="w-full py-2.5 px-4 rounded-xl bg-sst-primary hover:bg-sst-primary-dark text-white font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                <Phone size={16} />
                Call (585) 645-4549
              </a>
              <a
                href="mailto:smartsasstech@gmail.com"
                className="w-full py-2.5 px-4 rounded-xl bg-sst-bg-light hover:bg-gray-100 text-sst-primary font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200"
              >
                <Mail size={16} />
                Email smartsasstech@gmail.com
              </a>
            </div>
          </div>

          {/* Right Column: Bio Content */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm flex flex-col justify-center h-full">
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-sst-primary mb-6 leading-snug">
                Technology Guidance Grounded in Clarity and Respect
              </h3>
              
              <div className="space-y-5 text-sst-dark text-base sm:text-lg leading-relaxed">
                <p>
                  I am Renee Sassone, founder of SmartSass Tech. I started this service to address a significant gap in how personal technology assistance and education are delivered. Too often, conventional tech support is hurried, filled with confusing technical jargon, and leaves clients feeling overwhelmed or unheard.
                </p>
                <p>
                  I believe technology should serve as an empowering tool that supports your independence, rather than a source of stress. Whether you want to stay easily connected with loved ones, safely manage your personal accounts and emails, or resolve everyday device and home network problems, SmartSass Tech is here to provide attentive, individualized assistance.
                </p>
                <p>
                  My approach focuses on <strong>respectful, personalized guidance, plain-English explanations, and clear written reference notes</strong> provided after every session. We work through each question collaboratively at your own pace, ensuring you feel completely confident and in control of your technology.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Why Choose SmartSass Tech Feature Grid */}
        <div className="bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-sm mb-12">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-sst-primary mb-3">
              Why Work With SmartSass Tech?
            </h2>
            <p className="text-base sm:text-lg text-sst-dark">
              Every session is designed around your specific goals, comfort level, and equipment.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-sst-bg-light rounded-2xl p-6 border border-gray-100 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-sst-primary text-white flex items-center justify-center shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-bold text-sst-primary text-lg mb-1">Local & Community-Trusted</h3>
                <p className="text-sst-dark text-sm sm:text-base leading-relaxed">
                  Serving the Greater Rochester area with reliable, friendly in-home visits and remote sessions.
                </p>
              </div>
            </div>

            <div className="bg-sst-bg-light rounded-2xl p-6 border border-gray-100 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-sst-primary text-white flex items-center justify-center shrink-0">
                <MessageCircle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-sst-primary text-lg mb-1">Zero Technical Jargon</h3>
                <p className="text-sst-dark text-sm sm:text-base leading-relaxed">
                  Clear, plain-English explanations without confusing acronyms or high-pressure tech talk.
                </p>
              </div>
            </div>

            <div className="bg-sst-bg-light rounded-2xl p-6 border border-gray-100 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-sst-primary text-white flex items-center justify-center shrink-0">
                <UserCheck size={24} />
              </div>
              <div>
                <h3 className="font-bold text-sst-primary text-lg mb-1">Your Pace, Your Priorities</h3>
                <p className="text-sst-dark text-sm sm:text-base leading-relaxed">
                  We move at whatever pace feels comfortable to you, focusing strictly on the tasks you care about.
                </p>
              </div>
            </div>

            <div className="bg-sst-bg-light rounded-2xl p-6 border border-gray-100 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-sst-primary text-white flex items-center justify-center shrink-0">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-bold text-sst-primary text-lg mb-1">Custom Written Notes</h3>
                <p className="text-sst-dark text-sm sm:text-base leading-relaxed">
                  Personalized, easy-to-read step-by-step instructions left behind for your ongoing reference.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Card */}
        <div className="text-center bg-sst-primary rounded-3xl p-8 md:p-12 text-white shadow-lg">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to Get Started?</h2>
          <p className="text-lg md:text-xl text-sst-beige mb-8 max-w-xl mx-auto">
            Give us a call or book a session online. We look forward to working with you!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="tel:5856454549"
              className="w-full sm:w-auto min-h-[56px] px-8 rounded-full bg-white text-sst-primary font-bold text-lg hover:bg-sst-beige hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 shadow-md flex items-center justify-center gap-2"
            >
              <Phone size={20} />
              (585) 645-4549
            </a>
            <Link
              href="/booking"
              className="w-full sm:w-auto min-h-[56px] px-8 rounded-full bg-transparent border-2 border-white text-white font-bold text-lg hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
            >
              Book a Session
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}
