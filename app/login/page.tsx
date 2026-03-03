'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff } from 'lucide-react'

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
    const router = useRouter()

    useEffect(() => {
        const savedEmail = localStorage.getItem('sst_saved_email')
        if (savedEmail) {
            setEmail(savedEmail)
            setRememberMe(true)
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage(null)

        // Capture redirect parameter if it exists
        const searchParams = new URLSearchParams(window.location.search)
        const redirectPath = searchParams.get('redirect') || '/'

        try {
            if (isLogin) {
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
                        setMessage({ text: error.message, type: 'error' })
                    } else {
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
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            first_name: firstName.trim(),
                            last_name: lastName.trim(),
                            phone: phone.trim(),
                        }
                    }
                })
                if (error) {
                    setMessage({ text: error.message, type: 'error' })
                } else {
                    // Also write profile immediately (the trigger handles it but let's be safe)
                    if (data.user) {
                        await supabase.from('profiles').upsert({
                            id: data.user.id,
                            email,
                            'First Name': firstName.trim(),
                            'Last Name': lastName.trim(),
                            'Phone': phone.trim() || null,
                            'Last Login': new Date().toISOString(),
                        })
                    }
                    setMessage({ text: 'Account created! Please check your email to confirm your address.', type: 'success' })
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
                                src="/assets/images/SST Logo Black & Taupe No Background.svg"
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

                <form onSubmit={handleSubmit} className="space-y-5">
                    {!isLogin && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-sst-primary ml-1">First Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all"
                                        placeholder="Renee"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-sst-primary ml-1">Last Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all"
                                        placeholder="Smith"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-sst-primary ml-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all"
                                    placeholder="(585) 555-0100"
                                />
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-sst-primary ml-1">Email Address</label>
                        <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all"
                            placeholder="your@email.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-sst-primary ml-1">Password</label>
                        <div className="relative">
                            <input
                                required
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all pr-12"
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
                    </div>

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
                                Remember my email
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
