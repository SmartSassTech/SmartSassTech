'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, ShieldAlert } from 'lucide-react'

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' }
    if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' }
    if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' }
    if (score <= 4) return { score, label: 'Strong', color: 'bg-green-500' }
    return { score, label: 'Very Strong', color: 'bg-emerald-500' }
}

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [phone, setPhone] = useState('')
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [acknowledgePhone, setAcknowledgePhone] = useState(false)
    const [phoneExists, setPhoneExists] = useState(false)
    const [failedAttempts, setFailedAttempts] = useState(0)
    const [lockoutUntil, setLockoutUntil] = useState<number | null>(null)
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})
    const router = useRouter()

    useEffect(() => {
        const savedEmail = localStorage.getItem('sst_saved_email')
        if (savedEmail) {
            setEmail(savedEmail)
            setRememberMe(true)
        }

        // Check for message/type in URL (from auth confirmation)
        const searchParams = new URLSearchParams(window.location.search)
        const urlMsg = searchParams.get('message')
        const urlType = searchParams.get('type') as 'success' | 'error' | null
        if (urlMsg && urlType) {
            setMessage({ text: urlMsg, type: urlType })
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname)
        }
    }, [])

    const validateForm = (): boolean => {
        const errs: Record<string, string> = {}
        if (!isLogin) {
            if (!firstName.trim()) errs.firstName = 'Please enter your first name'
            if (!lastName.trim()) errs.lastName = 'Please enter your last name'
        }
        if (!email.trim()) {
            errs.email = 'Please enter your email address'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errs.email = 'Please enter a valid email address (e.g., name@example.com)'
        }
        if (!password) {
            errs.password = 'Please enter your password'
        } else if (!isLogin && password.length < 8) {
            errs.password = 'Password must be at least 8 characters long'
        }
        setFormErrors(errs)
        return Object.keys(errs).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)

        if (!validateForm()) return

        setIsLoading(true)

        // Capture redirect parameter if it exists
        const searchParams = new URLSearchParams(window.location.search)
        const redirectPath = searchParams.get('redirect') || '/'

        try {
            if (isLogin) {
                // Rate limiting check
                if (lockoutUntil && Date.now() < lockoutUntil) {
                    const secondsLeft = Math.ceil((lockoutUntil - Date.now()) / 1000)
                    setMessage({ text: `Too many attempts. Please wait ${secondsLeft} seconds before trying again.`, type: 'error' })
                    setIsLoading(false)
                    return
                }

                console.log('[Login] Attempting sign in for:', email)

                // Add a timeout for the authentication attempt
                const loginPromise = supabase.auth.signInWithPassword({ email, password })
                const timeoutPromise = new Promise<{ data: any, error: any }>((_, reject) =>
                    setTimeout(() => reject(new Error('Login attempt timed out. Please check your connection.')), 30000)
                )

                try {
                    const { data, error } = await Promise.race([loginPromise, timeoutPromise])

                    if (error) {
                        console.error('[Login] Sign in error:', error)
                        const newAttempts = failedAttempts + 1
                        setFailedAttempts(newAttempts)

                        if (newAttempts >= 5) {
                            const lockout = Date.now() + 60000 // 60 second lockout
                            setLockoutUntil(lockout)
                            setMessage({ text: 'Too many failed attempts. Your account has been temporarily locked for 60 seconds for security.', type: 'error' })
                            setTimeout(() => { setLockoutUntil(null); setFailedAttempts(0) }, 60000)
                        } else {
                            setMessage({ text: 'The email or password you entered doesn\'t match our records. Please double-check both and try again.', type: 'error' })
                        }
                    } else {
                        setFailedAttempts(0)
                        setLockoutUntil(null)
                        console.log('[Login] Sign in successful for:', data.user?.email)
                        setMessage({ text: 'Welcome back! Redirecting...', type: 'success' })

                        if (rememberMe) {
                            localStorage.setItem('sst_saved_email', email)
                        } else {
                            localStorage.removeItem('sst_saved_email')
                        }

                        // The database trigger "handle_user_login" on auth.users already updates the profiles table.
                        // We don't need to do it here anymore, which avoids potential race conditions.

                        setTimeout(() => {
                            console.log('[Login] Executing hard redirect to:', redirectPath)
                            window.location.href = redirectPath
                        }, 500)
                    }
                } catch (err: any) {
                    console.error('[Login] Exception during login:', err)
                    setMessage({ text: err.message || 'An unexpected error occurred during login.', type: 'error' })
                }
            } else {
                // Pre-signup checks for existing email or phone
                const { data: existingEmail } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('email', email)
                    .single()

                if (existingEmail) {
                    setMessage({ text: 'An account with this email already exists. Please log in instead.', type: 'error' })
                    setIsLoading(false)
                    return
                }

                const { data: existingPhone } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('phone', phone.trim())
                    .maybeSingle()

                if (existingPhone && !acknowledgePhone) {
                    setPhoneExists(true)
                    setIsLoading(false)
                    return
                }

                // Call our custom sign-up API
                const response = await fetch('/api/auth/sign-up', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        password,
                        firstName,
                        lastName,
                        phone,
                    }),
                })

                const result = await response.json()

                if (!response.ok) {
                    setMessage({ text: result.error || 'Failed to create account.', type: 'error' })
                } else {
                    setMessage({ text: result.message || 'Account created! Please check your email.', type: 'success' })
                    // Clear form
                    setIsLogin(true)
                    setPassword('')
                }
            }
        } catch (err) {
            setMessage({ text: 'An unexpected error occurred. Please try again.', type: 'error' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-kb-bg min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-10 rounded-[2rem] shadow-2xl space-y-8">
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-6">
                        <Link href="/">
                            <img
                                src="/assets/images/logo.svg"
                                alt="SmartSass Tech"
                                className="h-24 w-auto"
                            />
                        </Link>
                    </div>
                    <h1 className="text-h1 mb-2">
                        {isLogin ? 'Welcome Back' : 'Create an Account'}
                    </h1>
                    <p className="text-kb-muted">
                        {isLogin ? 'Log in to manage your sessions' : 'Start your tech journey with us'}
                    </p>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl text-center text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    {!isLogin && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-sst-primary ml-1">First Name</label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => { setFirstName(e.target.value); if (formErrors.firstName) setFormErrors(p => { const n = {...p}; delete n.firstName; return n }) }}
                                        className={`w-full px-5 py-4 bg-kb-bg rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all ${formErrors.firstName ? 'border-2 border-red-400' : 'border-none'}`}
                                        placeholder="Renee"
                                    />
                                    {formErrors.firstName && <p className="text-xs text-red-600 font-medium ml-1">{formErrors.firstName}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-sst-primary ml-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => { setLastName(e.target.value); if (formErrors.lastName) setFormErrors(p => { const n = {...p}; delete n.lastName; return n }) }}
                                        className={`w-full px-5 py-4 bg-kb-bg rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all ${formErrors.lastName ? 'border-2 border-red-400' : 'border-none'}`}
                                        placeholder="Smith"
                                    />
                                    {formErrors.lastName && <p className="text-xs text-red-600 font-medium ml-1">{formErrors.lastName}</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-sst-primary ml-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => {
                                        setPhone(e.target.value)
                                        if (phoneExists) setPhoneExists(false)
                                        if (acknowledgePhone) setAcknowledgePhone(false)
                                    }}
                                    className={`w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all ${phoneExists ? 'ring-2 ring-red-400' : ''}`}
                                    placeholder="(585) 555-0100"
                                />
                                {phoneExists && (
                                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl space-y-3 mt-2">
                                        <p className="text-xs text-red-700 font-medium">
                                            This phone number is already connected to an account. You may proceed, but be aware the phone number will be connected to both accounts.
                                        </p>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="acknowledgePhone"
                                                checked={acknowledgePhone}
                                                onChange={(e) => setAcknowledgePhone(e.target.checked)}
                                                className="w-4 h-4 text-red-600 rounded focus:ring-red-500 bg-white border-red-300"
                                            />
                                            <label htmlFor="acknowledgePhone" className="text-xs font-bold text-red-700 cursor-pointer select-none">
                                                I want to proceed anyway
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-sst-primary ml-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); if (formErrors.email) setFormErrors(p => { const n = {...p}; delete n.email; return n }) }}
                            className={`w-full px-5 py-4 bg-kb-bg rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all ${formErrors.email ? 'border-2 border-red-400' : 'border-none'}`}
                            placeholder="your@email.com"
                        />
                        {formErrors.email && <p className="text-xs text-red-600 font-medium ml-1">{formErrors.email}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-sst-primary ml-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); if (formErrors.password) setFormErrors(p => { const n = {...p}; delete n.password; return n }) }}
                                className={`w-full px-5 py-4 bg-kb-bg rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all pr-12 ${formErrors.password ? 'border-2 border-red-400' : 'border-none'}`}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-sst-primary hover:text-sst-secondary transition-colors focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {formErrors.password && <p className="text-xs text-red-600 font-medium ml-1">{formErrors.password}</p>}
                    </div>

                    {/* Password Strength Indicator (Registration only) */}
                    {!isLogin && password.length > 0 && (
                        <div className="space-y-2 -mt-2">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div
                                        key={i}
                                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                            i <= getPasswordStrength(password).score
                                                ? getPasswordStrength(password).color
                                                : 'bg-gray-200'
                                        }`}
                                    />
                                ))}
                            </div>
                            <p className={`text-xs font-medium ${
                                getPasswordStrength(password).score <= 1 ? 'text-red-600' :
                                getPasswordStrength(password).score <= 2 ? 'text-orange-600' :
                                getPasswordStrength(password).score <= 3 ? 'text-yellow-600' :
                                'text-green-600'
                            }`}>
                                Password strength: {getPasswordStrength(password).label}
                            </p>
                            <ul className="text-[11px] text-gray-500 space-y-0.5 ml-1">
                                <li className={password.length >= 8 ? 'text-green-600' : ''}>• At least 8 characters</li>
                                <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>• One uppercase letter</li>
                                <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>• One number</li>
                                <li className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : ''}>• One special character (!@#$...)</li>
                            </ul>
                        </div>
                    )}

                    {isLogin && (
                        <div className="flex items-center space-x-2 ml-1">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 text-sst-primary rounded focus:ring-sst-primary bg-kb-bg border-sst-primary"
                            />
                            <label htmlFor="rememberMe" className="text-sm font-medium text-sst-primary cursor-pointer select-none">
                                Remember me on this device
                            </label>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-5 bg-sst-primary text-white font-bold rounded-2xl hover:bg-sst-secondary transition-all shadow-xl text-lg flex items-center justify-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? (
                            <span className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            isLogin ? 'Log In' : 'Create Account'
                        )}
                    </button>
                </form>

                <div className="text-center pt-4">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin)
                            setMessage(null)
                        }}
                        className="text-sst-primary font-bold hover:underline transition-all"
                    >
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                    </button>
                </div>
            </div>
        </div>
    )
}
