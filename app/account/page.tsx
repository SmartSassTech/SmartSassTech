'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import withAuth from '@/components/withAuth'
import { User, Shield, Mail, Key, Phone, Check, X, AlertCircle, Laptop, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'

function AccountSettingsContent() {
    const searchParams = useSearchParams()
    const activeTab = searchParams.get('tab')

    const [profile, setProfile] = useState<any>(null)
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

    // Editing states
    const [isEditingName, setIsEditingName] = useState(false)
    const [isEditingPhone, setIsEditingPhone] = useState(false)
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

    // Form states
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [phone, setPhone] = useState('')
    const [newEmail, setNewEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            setUser(user)
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (profile) {
                setProfile(profile)
                setFirstName(profile['First Name'] || '')
                setLastName(profile['Last Name'] || '')
                setPhone(profile['Phone'] || '')
            }
        }
        setLoading(false)

        // Scroll to sessions if tab is active
        if (activeTab === 'sessions') {
            setTimeout(() => {
                document.getElementById('sessions-section')?.scrollIntoView({ behavior: 'smooth' })
            }, 500)
        }
    }

    const handleUpdateName = async () => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    'First Name': firstName.trim(),
                    'Last Name': lastName.trim()
                })
                .eq('id', user.id)

            if (error) throw error

            setProfile({ ...profile, 'First Name': firstName, 'Last Name': lastName })
            setIsEditingName(false)
            setMessage({ text: 'Name updated successfully!', type: 'success' })
        } catch (err: any) {
            setMessage({ text: err.message, type: 'error' })
        }
    }

    const handleUpdatePhone = async () => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ Phone: phone.trim() })
                .eq('id', user.id)

            if (error) throw error

            setProfile({ ...profile, Phone: phone })
            setIsEditingPhone(false)
            setMessage({ text: 'Phone number updated successfully!', type: 'success' })
        } catch (err: any) {
            setMessage({ text: err.message, type: 'error' })
        }
    }

    const handleUpdateEmail = async () => {
        if (!newEmail || newEmail === user.email) {
            setIsUpdatingEmail(false)
            return
        }
        try {
            const { error } = await supabase.auth.updateUser({ email: newEmail })
            if (error) throw error
            setMessage({ text: 'Check your new email to confirm the change.', type: 'success' })
            setIsUpdatingEmail(false)
        } catch (err: any) {
            setMessage({ text: err.message, type: 'error' })
        }
    }

    const handleUpdatePassword = async () => {
        if (newPassword !== confirmPassword) {
            setMessage({ text: 'Passwords do not match.', type: 'error' })
            return
        }
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword })
            if (error) throw error
            setMessage({ text: 'Password updated successfully!', type: 'success' })
            setIsUpdatingPassword(false)
            setNewPassword('')
            setConfirmPassword('')
        } catch (err: any) {
            setMessage({ text: err.message, type: 'error' })
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-kb-bg">
                <div className="w-12 h-12 border-4 border-sst-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="bg-kb-bg min-h-screen py-16 md:py-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {message && (
                    <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                        {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                        <p className="font-medium text-sm">{message.text}</p>
                        <button onClick={() => setMessage(null)} className="ml-auto opacity-70 hover:opacity-100">
                            <X size={18} />
                        </button>
                    </div>
                )}

                <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-br from-kb-navy to-[#1a233b] p-8 md:p-12 text-white flex items-center gap-6">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white ring-4 ring-white/5">
                            <User size={40} />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-heading text-white mb-2">Account Settings</h1>
                            <p className="text-white/70">Manage your profile and security preferences.</p>
                        </div>
                    </div>

                    <div className="p-8 md:p-12 space-y-12">
                        {/* Profile Info Section */}
                        <div className="space-y-8">
                            <h2 className="flex items-center gap-3 text-2xl font-heading text-kb-navy border-b border-gray-100 pb-4">
                                <User size={24} className="text-sst-primary" />
                                Personal Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Name Card */}
                                <div className="p-8 bg-gray-50/50 rounded-3xl border border-gray-100 transition-all hover:bg-gray-50 group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-kb-muted uppercase tracking-widest">Full Name</p>
                                            {isEditingName ? (
                                                <div className="space-y-3 mt-4">
                                                    <input
                                                        type="text"
                                                        value={firstName}
                                                        onChange={(e) => setFirstName(e.target.value)}
                                                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-sst-primary outline-none text-sm"
                                                        placeholder="First Name"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={lastName}
                                                        onChange={(e) => setLastName(e.target.value)}
                                                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-sst-primary outline-none text-sm"
                                                        placeholder="Last Name"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button onClick={handleUpdateName} className="px-4 py-2 bg-sst-primary text-white text-xs font-bold rounded-lg hover:bg-sst-secondary transition-colors">Save</button>
                                                        <button onClick={() => setIsEditingName(false)} className="px-4 py-2 bg-gray-200 text-kb-muted text-xs font-bold rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xl font-heading text-kb-dark">{profile?.['First Name'] || 'Non'} {profile?.['Last Name'] || 'User'}</p>
                                            )}
                                        </div>
                                        {!isEditingName && (
                                            <button
                                                onClick={() => setIsEditingName(true)}
                                                className="p-2 text-sst-primary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white rounded-lg shadow-sm"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Phone Card */}
                                <div className="p-8 bg-gray-50/50 rounded-3xl border border-gray-100 transition-all hover:bg-gray-50 group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-kb-muted uppercase tracking-widest">Phone</p>
                                            {isEditingPhone ? (
                                                <div className="space-y-3 mt-4">
                                                    <input
                                                        type="tel"
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value)}
                                                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-sst-primary outline-none text-sm"
                                                        placeholder="(585) 555-0100"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button onClick={handleUpdatePhone} className="px-4 py-2 bg-sst-primary text-white text-xs font-bold rounded-lg hover:bg-sst-secondary transition-colors">Save</button>
                                                        <button onClick={() => setIsEditingPhone(false)} className="px-4 py-2 bg-gray-200 text-kb-muted text-xs font-bold rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xl font-heading text-kb-dark">{profile?.Phone || 'Not provided'}</p>
                                            )}
                                        </div>
                                        {!isEditingPhone && (
                                            <button
                                                onClick={() => setIsEditingPhone(true)}
                                                className="p-2 text-sst-primary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white rounded-lg shadow-sm"
                                            >
                                                {profile?.Phone ? 'Edit' : 'Add'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Security Section */}
                        <div className="space-y-8">
                            <h2 className="flex items-center gap-3 text-2xl font-heading text-kb-navy border-b border-gray-100 pb-4">
                                <Shield size={24} className="text-sst-primary" />
                                Security Details
                            </h2>
                            <div className="space-y-4">
                                {/* Email Row */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-8 bg-gray-50/50 rounded-3xl border border-gray-100">
                                    <div className="mb-6 sm:mb-0 space-y-1">
                                        <p className="text-xs font-bold text-kb-muted uppercase tracking-widest flex items-center gap-2 mb-1">
                                            <Mail size={14} /> Email Address
                                        </p>
                                        <p className="text-lg font-medium text-kb-dark">{user?.email}</p>
                                    </div>
                                    {isUpdatingEmail ? (
                                        <div className="flex flex-col gap-2 w-full sm:w-auto">
                                            <input
                                                type="email"
                                                value={newEmail}
                                                onChange={(e) => setNewEmail(e.target.value)}
                                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-sst-primary outline-none text-sm"
                                                placeholder="New Email"
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={handleUpdateEmail} className="px-4 py-2 bg-sst-primary text-white text-xs font-bold rounded-lg flex-1">Update</button>
                                                <button onClick={() => setIsUpdatingEmail(false)} className="px-4 py-2 bg-gray-200 text-kb-muted text-xs font-bold rounded-lg flex-1">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { setIsUpdatingEmail(true); setNewEmail(user.email); }}
                                            className="px-8 py-3 bg-white border border-gray-200 text-sst-primary font-bold rounded-2xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                                        >
                                            Change Email
                                        </button>
                                    )}
                                </div>

                                {/* Password Row */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-8 bg-gray-50/50 rounded-3xl border border-gray-100">
                                    <div className="mb-6 sm:mb-0 space-y-1">
                                        <p className="text-xs font-bold text-kb-muted uppercase tracking-widest flex items-center gap-2 mb-1">
                                            <Key size={14} /> Password
                                        </p>
                                        <p className="text-lg font-medium text-kb-dark">••••••••</p>
                                    </div>
                                    {isUpdatingPassword ? (
                                        <div className="flex flex-col gap-2 w-full sm:w-auto">
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-sst-primary outline-none text-sm"
                                                placeholder="New Password"
                                            />
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-sst-primary outline-none text-sm"
                                                placeholder="Confirm Password"
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={handleUpdatePassword} className="px-4 py-2 bg-sst-primary text-white text-xs font-bold rounded-lg flex-1">Update</button>
                                                <button onClick={() => setIsUpdatingPassword(false)} className="px-4 py-2 bg-gray-200 text-kb-muted text-xs font-bold rounded-lg flex-1">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsUpdatingPassword(true)}
                                            className="px-8 py-3 bg-white border border-gray-200 text-sst-primary font-bold rounded-2xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                                        >
                                            Update Password
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sessions Section */}
                        <div id="sessions-section" className={`space-y-8 scroll-mt-24 ${activeTab === 'sessions' ? 'ring-2 ring-sst-primary/20 bg-sst-primary/5 -mx-4 px-4 py-8 rounded-[2.5rem]' : ''}`}>
                            <h2 className="flex items-center gap-3 text-2xl font-heading text-kb-navy border-b border-gray-100 pb-4">
                                <Laptop size={24} className="text-sst-primary" />
                                Active Sessions
                            </h2>
                            <div className="space-y-4">
                                <div className="p-8 bg-white rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                                            <Laptop size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-kb-navy">Current Browser Session</p>
                                            <p className="text-sm text-kb-muted flex items-center gap-1.5">
                                                <Clock size={12} /> Last active: Just now
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-4 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider">Active Now</span>
                                </div>
                                <p className="text-sm text-kb-muted text-center italic">Session management is restricted to the current device for your security.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-kb-muted text-sm">Need to close your account? <button className="text-red-600 font-bold hover:underline">Contact Support</button></p>
                </div>
            </div>
        </div>
    )
}

function AccountSettings() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-kb-bg">
                <div className="w-12 h-12 border-4 border-sst-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <AccountSettingsContent />
        </Suspense>
    )
}

export default withAuth(AccountSettings)
