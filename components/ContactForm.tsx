'use client'

import React, { useState } from 'react'

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [serviceType, setServiceType] = useState<'in-home' | 'remote' | ''>('')
  const [remotePlatform, setRemotePlatform] = useState('')
  const [knowsRemoteEmail, setKnowsRemoteEmail] = useState<'yes' | 'no' | ''>('')
  const [remoteEmailDetails, setRemoteEmailDetails] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorMessage('')

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      cityZip: formData.get('cityZip'),
      message: formData.get('message'),
      serviceType: serviceType || formData.get('serviceType'),
      remotePlatform,
      knowsRemoteEmail,
      remoteEmailDetails,
      website: formData.get('website'), // honeypot
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to submit form')
      }

      setStatus('success')
    } catch (err: any) {
      console.error(err)
      setStatus('error')
      setErrorMessage(err.message || 'Something went wrong. Please try calling us instead.')
    }
  }

  const handleReset = () => {
    setStatus('idle')
    setServiceType('')
    setRemotePlatform('')
    setKnowsRemoteEmail('')
    setRemoteEmailDetails('')
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg max-w-2xl mx-auto border border-gray-100">
      {status === 'success' ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-sst-primary mb-3">Message Received!</h3>
          {serviceType === 'remote' && knowsRemoteEmail === 'no' ? (
            <p className="text-lg text-sst-dark leading-relaxed max-w-lg mx-auto">
              Since you're not sure about your video calling account details, don't worry — <strong>we will reach out directly by phone</strong> to help you get that set up before our session!
            </p>
          ) : (
            <p className="text-lg text-sst-dark leading-relaxed">
              We'll get back to you shortly. For immediate assistance, please call <a href="tel:5856454549" className="text-sst-teal font-bold hover:underline">(585) 645-4549</a>.
            </p>
          )}
          <button 
            onClick={handleReset}
            className="mt-6 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-sst-dark rounded-full font-medium hover:-translate-y-0.5 transition-all duration-200"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          {/* Honeypot field - hidden from real users */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-bold text-sst-dark mb-1">Your Name *</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              required 
              autoComplete="name"
              className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-gray-300 text-gray-900 bg-white focus:border-sst-primary focus:ring-2 focus:ring-sst-primary/20 outline-none transition-all"
              placeholder="e.g. Mary Smith"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="phone" className="block text-sm font-bold text-sst-dark mb-1">Phone Number *</label>
              <input 
                type="tel" 
                id="phone" 
                name="phone" 
                required 
                autoComplete="tel"
                className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-gray-300 text-gray-900 bg-white focus:border-sst-primary focus:ring-2 focus:ring-sst-primary/20 outline-none transition-all"
                placeholder="(585) 555-0123"
              />
            </div>
            <div>
              <label htmlFor="cityZip" className="block text-sm font-bold text-sst-dark mb-1">City or Zip Code *</label>
              <input 
                type="text" 
                id="cityZip" 
                name="cityZip" 
                required 
                autoComplete="postal-code"
                className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-gray-300 text-gray-900 bg-white focus:border-sst-primary focus:ring-2 focus:ring-sst-primary/20 outline-none transition-all"
                placeholder="e.g. Rochester, NY 14618"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-sst-dark mb-2">How would you like to meet? *</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer p-3.5 border border-gray-200 rounded-xl hover:bg-sst-bg-light hover:border-sst-primary/40 transition-all duration-200 flex-1 min-w-[200px]">
                <input 
                  type="radio" 
                  name="serviceType" 
                  value="in-home" 
                  required 
                  checked={serviceType === 'in-home'}
                  onChange={() => setServiceType('in-home')}
                  className="w-5 h-5 text-sst-primary" 
                />
                <span className="font-medium text-sst-dark">In-Home Visit</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3.5 border border-gray-200 rounded-xl hover:bg-sst-bg-light hover:border-sst-primary/40 transition-all duration-200 flex-1 min-w-[200px]">
                <input 
                  type="radio" 
                  name="serviceType" 
                  value="remote" 
                  required 
                  checked={serviceType === 'remote'}
                  onChange={() => setServiceType('remote')}
                  className="w-5 h-5 text-sst-primary" 
                />
                <span className="font-medium text-sst-dark">Remote (Phone/Zoom)</span>
              </label>
            </div>
          </div>

          {/* Conditional questions for Remote / Zoom support */}
          {serviceType === 'remote' && (
            <div className="p-4 bg-sst-primary/5 rounded-xl border border-sst-primary/20 space-y-4">
              <div>
                <label className="block text-sm font-bold text-sst-dark mb-1">
                  Which video calling platform do you use?
                </label>
                <select
                  value={remotePlatform}
                  onChange={(e) => setRemotePlatform(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 bg-white focus:border-sst-primary focus:ring-2 focus:ring-sst-primary/20 outline-none transition-all"
                >
                  <option value="">Select platform...</option>
                  <option value="Zoom">Zoom</option>
                  <option value="Google Meet">Google Meet</option>
                  <option value="FaceTime">FaceTime (Apple)</option>
                  <option value="Skype">Skype</option>
                  <option value="Not Sure / Need Help">I'm not sure / need help</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-sst-dark mb-2">
                  Do you know the email address associated with your video calling account?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sst-dark text-sm">
                    <input
                      type="radio"
                      name="knowsEmailRadio"
                      value="yes"
                      checked={knowsRemoteEmail === 'yes'}
                      onChange={() => setKnowsRemoteEmail('yes')}
                      className="w-4 h-4 text-sst-primary"
                    />
                    <span>Yes, I know my video calling account email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sst-dark text-sm">
                    <input
                      type="radio"
                      name="knowsEmailRadio"
                      value="no"
                      checked={knowsRemoteEmail === 'no'}
                      onChange={() => setKnowsRemoteEmail('no')}
                      className="w-4 h-4 text-sst-primary"
                    />
                    <span>No, I don't know my email / need help finding it</span>
                  </label>
                </div>
              </div>

              {knowsRemoteEmail === 'yes' && (
                <div>
                  <label htmlFor="remoteEmailDetails" className="block text-sm font-bold text-sst-dark mb-1">
                    Your video calling email address (if available)
                  </label>
                  <input
                    type="email"
                    id="remoteEmailDetails"
                    value={remoteEmailDetails}
                    onChange={(e) => setRemoteEmailDetails(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 bg-white focus:border-sst-primary focus:ring-2 focus:ring-sst-primary/20 outline-none transition-all"
                    placeholder="e.g. mary@gmail.com"
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label htmlFor="message" className="block text-sm font-bold text-sst-dark mb-1">How can we help? (Optional)</label>
            <textarea 
              id="message" 
              name="message" 
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 bg-white focus:border-sst-primary focus:ring-2 focus:ring-sst-primary/20 outline-none transition-all resize-none"
              placeholder="Tell us what you're struggling with or what you'd like to learn..."
            ></textarea>
          </div>

          {status === 'error' && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 font-medium">
              {errorMessage}
            </div>
          )}

          <button 
            type="submit" 
            disabled={status === 'submitting'}
            className="w-full min-h-[56px] bg-sst-primary hover:bg-sst-primary-dark text-white font-bold text-lg rounded-xl hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-200 shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {status === 'submitting' ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : 'Send Message'}
          </button>
        </form>
      )}
    </div>
  )
}
