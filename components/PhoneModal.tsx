'use client'

import { useState, useEffect, useRef } from 'react'
import { Phone, Copy, Check, X, MessageSquare } from 'lucide-react'
import Link from 'next/link'

interface PhoneModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PhoneModal({ isOpen, onClose }: PhoneModalProps) {
  const [copied, setCopied] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    // Move focus into modal on open
    closeButtonRef.current?.focus()
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleCopy = () => {
    navigator.clipboard.writeText('(585) 645-4549')
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Phone number dialog"
    >
      <div 
        className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 relative text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute top-4 right-4 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        {/* Icon Header */}
        <div className="w-16 h-16 bg-sst-primary/10 text-sst-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone size={32} aria-hidden="true" />
        </div>

        <h3 className="text-2xl md:text-3xl font-extrabold text-sst-primary mb-2">
          Call (585) 645-4549
        </h3>

        <p className="text-sst-dark font-medium text-lg mb-4">
          Available Mon–Sat: 8:00 AM – 6:00 PM
        </p>

        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          If you are viewing this on a computer or tablet, please dial <strong>(585) 645-4549</strong> on your mobile phone or landline. You can also send us a quick message below and Renee will call you right back!
        </p>

        <div className="space-y-3">
          <button
            onClick={handleCopy}
            className="w-full min-h-[52px] bg-sst-primary hover:bg-sst-primary-dark text-white font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-200 shadow-md flex items-center justify-center gap-2 text-lg"
          >
            {copied ? (
              <>
                <Check size={20} className="text-green-300" />
                Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy size={20} />
                Copy Phone Number
              </>
            )}
          </button>

          <Link
            href="/contact"
            onClick={onClose}
            className="w-full min-h-[52px] bg-sst-bg-light hover:bg-gray-200 text-sst-dark font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 flex items-center justify-center gap-2 text-lg border border-gray-200"
          >
            <MessageSquare size={20} className="text-sst-primary" />
            Send Us a Message Instead
          </Link>
        </div>
      </div>
    </div>
  )
}
