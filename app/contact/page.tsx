import ContactForm from '@/components/ContactForm'
import { Phone, MapPin, Clock } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | SmartSass Tech',
  description: 'Contact SmartSass Tech for patient, jargon-free technology help in Rochester, NY. Call us or send a message to schedule a visit.',
}

export default function ContactPage() {
  return (
    <main id="main-content" className="bg-sst-bg-light min-h-screen py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-sst-primary mb-4">Contact Us</h1>
          <p className="text-xl text-sst-dark max-w-2xl mx-auto">
            We're here to help. Reach out to schedule a visit or ask a question.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          {/* Contact Info Sidebar */}
          <div className="w-full lg:w-1/3 space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-sst-primary mb-6">Get in Touch</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 shrink-0 bg-sst-primary/10 text-sst-primary rounded-full flex items-center justify-center">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sst-dark text-lg mb-1">Call Us</h3>
                    <a href="tel:5856454549" className="text-sst-teal font-bold text-xl hover:underline">
                      (585) 645-4549
                    </a>
                    <p className="text-gray-600 text-sm mt-1">Leave a voicemail if we don't answer right away.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 shrink-0 bg-sst-primary/10 text-sst-primary rounded-full flex items-center justify-center">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sst-dark text-lg mb-1">Hours</h3>
                    <p className="text-sst-dark font-medium">Mon - Sat: 8:00 AM - 6:00 PM</p>
                    <p className="text-gray-600 text-sm mt-1">Available for emergency calls 24/7</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 shrink-0 bg-sst-primary/10 text-sst-primary rounded-full flex items-center justify-center">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sst-dark text-lg mb-1">Service Area</h3>
                    <p className="text-sst-dark font-medium">In-Home Visits:</p>
                    <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                      Rochester, Webster, Fairport, Pittsford, Penfield, Brighton, and surrounding Monroe County areas.
                    </p>
                    <p className="text-sst-dark font-medium mt-3">Remote Support:</p>
                    <p className="text-gray-600 text-sm mt-1">Available nationwide.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Area */}
          <div className="w-full lg:w-2/3">
            <div className="bg-sst-primary p-1 rounded-2xl shadow-md">
              <ContactForm />
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
