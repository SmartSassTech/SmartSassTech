'use client'

import { useState, ChangeEvent, FormEvent } from 'react'

interface ArticleRequestModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ArticleRequestModal({ isOpen, onClose }: ArticleRequestModalProps) {
  const [email, setEmail] = useState('')
  const [question, setQuestion] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/article-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          question,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit article request')
      }

      setSubmitted(true)
      setEmail('')
      setQuestion('')

      // Close modal after 2 seconds
      setTimeout(() => {
        setSubmitted(false)
        onClose()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-kb-navy mb-4">Request an Article</h2>

          {submitted ? (
            <div className="text-center py-8">
              <div className="text-kb-navy text-4xl mb-4">✓</div>
              <p className="text-kb-slate font-semibold">Thank you!</p>
              <p className="text-kb-muted text-sm mt-2">
                We'll review your request and create the article soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-kb-slate mb-2">
                  Your Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 border border-kb-pale rounded-lg text-kb-dark placeholder-kb-muted focus:outline-none focus:ring-2 focus:ring-kb-navy"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-kb-slate mb-2">
                  What article would you like?
                </label>
                <textarea
                  required
                  value={question}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setQuestion(e.target.value)}
                  placeholder="e.g., How do I set up two-factor authentication on Gmail?"
                  rows={5}
                  className="w-full px-4 py-2 border border-kb-pale rounded-lg text-kb-dark placeholder-kb-muted focus:outline-none focus:ring-2 focus:ring-kb-navy resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-kb-pale text-kb-navy rounded-lg font-semibold hover:bg-kb-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-kb-navy text-white rounded-lg font-semibold hover:bg-kb-slate transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Submit'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
