'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Mail,
  Key,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  Sparkles,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Terminal
} from 'lucide-react'
import { validateEmail } from '@/lib/admin-ui-helpers'

export default function AdminLoginPage() {
  const router = useRouter()
  const [authMode, setAuthMode] = useState<'otp' | 'password'>('otp')
  const [otpStep, setOtpStep] = useState<'send' | 'verify'>('send')

  const [email, setEmail] = useState('sassonerenee@gmail.com')
  const [otpCode, setOtpCode] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Check if already authenticated
  useEffect(() => {
    fetch('/api/admin/auth')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          router.replace('/admin')
        }
      })
      .catch(() => {})
  }, [router])

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/admin/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Could not send verification code. Please check email address.')
        setIsLoading(false)
        return
      }

      setSuccessMsg(`[SENT] 6-digit code delivered to ${email}. Check your inbox.`)
      setOtpStep('verify')
      setIsLoading(false)
    } catch (err: any) {
      console.error(err)
      setErrorMsg('[NETWORK_ERROR] Please try again.')
      setIsLoading(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/admin/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Invalid or expired code. Please try again.')
        setIsLoading(false)
        return
      }

      router.push('/admin')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setErrorMsg('[AUTH_ERROR] Verification failed. Please try again.')
      setIsLoading(false)
    }
  }

  // Password Login (Fallback)
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Invalid credentials. Access denied.')
        setIsLoading(false)
        return
      }

      router.push('/admin')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setErrorMsg('[SYSTEM_ERROR] An unexpected network error occurred.')
      setIsLoading(false)
    }
  }

  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#060914] via-[#0A0E20] to-[#060914] font-mono">
      <div className="w-full max-w-md">
        
        {/* Retro Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/40 mb-4 shadow-xl shadow-black/60">
            <img
              src="/assets/images/logoDark.png"
              onError={(e) => {
                e.currentTarget.src = '/assets/images/darkLogo-horiz.svg'
              }}
              alt="SmartSass Tech"
              className="h-10 w-auto"
            />
          </div>
          <div className="flex items-center justify-center gap-2">
            <Terminal size={18} className="text-red-500 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              SmartSass Tech
            </h1>
          </div>
          <p className="text-xs uppercase font-bold tracking-widest text-blue-400 mt-1">
            &gt; SECURE_ADMIN_TERMINAL
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0A0E20]/95 backdrop-blur-xl border border-blue-900/60 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-red-500 to-blue-600"></div>

          {/* Mode Switcher */}
          <div className="flex rounded-lg bg-[#060914] p-1 border border-blue-950/80 mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode('otp')
                setErrorMsg('')
                setSuccessMsg('')
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'otp'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles size={13} />
              <span>EMAIL_OTP</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('password')
                setErrorMsg('')
                setSuccessMsg('')
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'password'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key size={13} />
              <span>PASSWORD</span>
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs font-medium flex items-start gap-2.5">
              <span className="text-red-400 font-bold text-sm">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-lg bg-blue-950/60 border border-blue-600 text-blue-300 text-xs font-medium flex items-start gap-2.5">
              <CheckCircle2 size={15} className="text-blue-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* EMAIL OTP FLOW */}
          {authMode === 'otp' && (
            <>
              {otpStep === 'send' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
                      ADMIN_EMAIL_ADDRESS
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail size={16} />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="sassonerenee@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#060914] border border-blue-900/60 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-blue-400 text-xs transition-all font-mono"
                      />
                    </div>
                    {!validateEmail(email).isValid && (
                      <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> {validateEmail(email).message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !email || !validateEmail(email).isValid}
                    className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-red-400 text-xs"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>DISPATCHING_CODE...</span>
                      </>
                    ) : (
                      <>
                        <span>&gt; SEND_LOGIN_CODE</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-blue-400">
                        6-DIGIT_AUTH_TOKEN
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep('send')
                          setOtpCode('')
                          setErrorMsg('')
                        }}
                        className="text-xs text-red-400 hover:underline"
                      >
                        CHANGE_EMAIL
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      autoFocus
                      className="w-full py-3 px-4 bg-[#060914] border-2 border-red-500/80 rounded-lg text-white placeholder-slate-700 text-center tracking-[12px] text-xl font-bold focus:outline-none focus:border-red-400 transition-all"
                    />
                    <div className="flex items-center justify-between mt-3 text-xs">
                      <span className="text-slate-400">TARGET: {email}</span>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isLoading}
                        className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                      >
                        <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
                        <span>RESEND</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otpCode.length !== 6}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-blue-400 text-xs"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>AUTHENTICATING...</span>
                      </>
                    ) : (
                      <>
                        <span>&gt; EXEC_VERIFY_AND_LOGIN</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          {/* PASSWORD LOGIN FLOW */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
                  ADMIN_EMAIL_ADDRESS
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="smartsasstech@gmail.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#060914] border border-blue-900/60 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-blue-400 text-xs transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
                  ROOT_PASSWORD
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Key size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-2.5 bg-[#060914] border border-blue-900/60 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-blue-400 text-xs transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-red-400 text-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <span>&gt; LOGIN_WITH_PASSWORD</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-blue-900/40 text-center">
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 mb-3">
              <Lock size={12} className="text-red-500" />
              <span>256-BIT ENCRYPTED TLS ADMIN SESSION</span>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={13} />
              <span>&gt; RETURN_TO_HOMEPAGE</span>
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500 mt-6 font-mono">
          &copy; {new Date().getFullYear()} SmartSass Tech &bull; RESTRICTED_SYSTEM_ACCESS
        </p>

      </div>
    </main>
  )
}
