'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import withAuth from '@/components/withAuth'
import { User, Shield, Mail, Key, Phone, Check, X, AlertCircle, MapPin, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'

function AccountSettingsContent() {
    const [profile, setProfile] = useState<any>(null)
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

    // Editing states
    const [isEditingName, setIsEditingName] = useState(false)
    const [isEditingPhone, setIsEditingPhone] = useState(false)
    const [isEditingAddress, setIsEditingAddress] = useState(false)
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

    // Form states
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
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
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error) console.error('Profile fetch error:', error)

            if (profile) {
                setProfile(profile)
                // DB columns are snake_case: first_name, last_name, Phone, address
                setFirstName(profile.first_name || '')
                setLastName(profile.last_name || '')
                setPhone(profile.Phone || '')
                setAddress(profile.address || '')
            }
        }
        setLoading(false)
    }

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type })
        setTimeout(() => setMessage(null), 5000)
    }

    const handleUpdateName = async () => {
        if (!user) return
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                })
                .eq('id', user.id)

            if (error) throw error

            setProfile({ ...profile, first_name: firstName.trim(), last_name: lastName.trim() })
            setIsEditingName(false)
            showMessage('Name updated successfully!', 'success')
        } catch (err: any) {
            showMessage(err.message, 'error')
        }
    }

    const handleUpdatePhone = async () => {
        if (!user) return
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ Phone: phone.trim() })
                .eq('id', user.id)

            if (error) throw error

            setProfile({ ...profile, Phone: phone.trim() })
            setIsEditingPhone(false)
            showMessage('Phone number updated successfully!', 'success')
        } catch (err: any) {
            showMessage(err.message, 'error')
        }
    }

    const handleUpdateAddress = async () => {
        if (!user) return
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ address: address.trim() })
                .eq('id', user.id)

            if (error) throw error

            setProfile({ ...profile, address: address.trim() })
            setIsEditingAddress(false)
            showMessage('Address updated successfully!', 'success')
        } catch (err: any) {
            showMessage(err.message, 'error')
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
            showMessage('Check your new email to confirm the change.', 'success')
            setIsUpdatingEmail(false)
        } catch (err: any) {
            showMessage(err.message, 'error')
        }
    }

    const handleUpdatePassword = async () => {
        if (newPassword !== confirmPassword) {
            showMessage('Passwords do not match.', 'error')
            return
        }
        if (newPassword.length < 6) {
            showMessage('Password must be at least 6 characters.', 'error')
            return
        }
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword })
            if (error) throw error
            showMessage('Password updated successfully!', 'success')
            setIsUpdatingPassword(false)
            setNewPassword('')
            setConfirmPassword('')
        } catch (err: any) {
            showMessage(err.message, 'error')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-kb-bg">
                <div className="w-12 h-12 border-4 border-sst-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    const displayName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Not set'

    return (
        <div className="bg-kb-bg min-h-screen py-16 md:py-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {message && (
                    <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                        <p className="font-medium text-sm">{message.text}</p>
                        <button onClick={() => setMessage(null)} className="ml-auto opacity-70 hover:opacity-100">
                            <X size={18} />
                        </button>
                    </div>
                )}

                <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-kb-navy to-[#1a233b] p-8 md:p-12 text-white flex items-center gap-6">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white ring-4 ring-white/5">
                            <User size={40} />
                        </div>
                        <div>
                            <h1 className="text-h1 text-white mb-2">Account Settings</h1>
                            <p className="text-white/70">Manage your profile and security preferences.</p>
                        </div>
                    </div>

                    <div className="p-8 md:p-12 space-y-12">

                        {/* ── Personal Information ── */}
                        <div className="space-y-6">
                            <h2 className="flex items-center gap-3 text-h2 text-kb-navy border-b border-gray-100 pb-4">
                                <User size={24} className="text-sst-primary" />
                                Personal Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Name Card */}
                                <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 hover:bg-gray-50 transition-all group">
                                    <p className="text-xs font-bold text-kb-muted uppercase tracking-widest mb-2">Full Name</p>
                                    {isEditingName ? (
                                        <div className="space-y-3 mt-2">
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
                                                <button onClick={() => { setIsEditingName(false); setFirstName(profile?.first_name || ''); setLastName(profile?.last_name || '') }} className="px-4 py-2 bg-gray-200 text-kb-muted text-xs font-bold rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center">
                                            <p className="text-lg font-heading text-kb-dark">{displayName}</p>
                                            <button onClick={() => setIsEditingName(true)} className="p-2 text-sst-primary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white rounded-lg shadow-sm text-sm font-bold">Edit</button>
                                        </div>
                                    )}
                                </div>

                                {/* Phone Card */}
                                <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 hover:bg-gray-50 transition-all group">
                                    <p className="text-xs font-bold text-kb-muted uppercase tracking-widest mb-2 flex items-center gap-1.5"><Phone size={12} /> Phone</p>
                                    {isEditingPhone ? (
                                        <div className="space-y-3 mt-2">
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-sst-primary outline-none text-sm"
                                                placeholder="(585) 555-0100"
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={handleUpdatePhone} className="px-4 py-2 bg-sst-primary text-white text-xs font-bold rounded-lg hover:bg-sst-secondary transition-colors">Save</button>
                                                <button onClick={() => { setIsEditingPhone(false); setPhone(profile?.Phone || '') }} className="px-4 py-2 bg-gray-200 text-kb-muted text-xs font-bold rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center">
                                            <p className="text-lg font-heading text-kb-dark">{profile?.Phone || 'Not provided'}</p>
                                            <button onClick={() => setIsEditingPhone(true)} className="p-2 text-sst-primary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white rounded-lg shadow-sm text-sm font-bold">{profile?.Phone ? 'Edit' : 'Add'}</button>
                                        </div>
                                    )}
                                </div>

                                {/* Address Card — full width */}
                                <div className="md:col-span-2 p-6 bg-gray-50/50 rounded-3xl border border-gray-100 hover:bg-gray-50 transition-all group">
                                    <p className="text-xs font-bold text-kb-muted uppercase tracking-widest mb-2 flex items-center gap-1.5"><MapPin size={12} /> Address</p>
                                    {isEditingAddress ? (
                                        <div className="space-y-3 mt-2">
                                            <input
                                                type="text"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-sst-primary outline-none text-sm"
                                                placeholder="123 Main St, Rochester, NY 14604"
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={handleUpdateAddress} className="px-4 py-2 bg-sst-primary text-white text-xs font-bold rounded-lg hover:bg-sst-secondary transition-colors">Save</button>
                                                <button onClick={() => { setIsEditingAddress(false); setAddress(profile?.address || '') }} className="px-4 py-2 bg-gray-200 text-kb-muted text-xs font-bold rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center">
                                            <p className="text-lg font-heading text-kb-dark">{profile?.address || 'Not provided'}</p>
                                            <button onClick={() => setIsEditingAddress(true)} className="p-2 text-sst-primary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white rounded-lg shadow-sm text-sm font-bold">{profile?.address ? 'Edit' : 'Add'}</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Security ── */}
                        <div className="space-y-6">
                            <h2 className="flex items-center gap-3 text-h2 text-kb-navy border-b border-gray-100 pb-4">
                                <Shield size={24} className="text-sst-primary" />
                                Security Details
                            </h2>
                            <div className="space-y-4">
                                {/* Email Row */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
                                    <div className="mb-4 sm:mb-0 space-y-1">
                                        <p className="text-xs font-bold text-kb-muted uppercase tracking-widest flex items-center gap-2 mb-1">
                                            <Mail size={14} /> Email Address
                                        </p>
                                        <p className="text-lg font-medium text-kb-dark">{user?.email}</p>
                                    </div>
                                    {isUpdatingEmail ? (
                                        <div className="flex flex-col gap-2 w-full sm:w-64">
                                            <input
                                                type="email"
                                                value={newEmail}
                                                onChange={(e) => setNewEmail(e.target.value)}
                                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-sst-primary outline-none text-sm"
                                                placeholder="New email address"
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={handleUpdateEmail} className="px-4 py-2 bg-sst-primary text-white text-xs font-bold rounded-lg flex-1">Update</button>
                                                <button onClick={() => setIsUpdatingEmail(false)} className="px-4 py-2 bg-gray-200 text-kb-muted text-xs font-bold rounded-lg flex-1">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { setIsUpdatingEmail(true); setNewEmail(user.email) }}
                                            className="px-6 py-3 bg-white border border-gray-200 text-sst-primary font-bold rounded-2xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                                        >
                                            Change Email
                                        </button>
                                    )}
                                </div>

                                {/* Password Row */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
                                    <div className="mb-4 sm:mb-0 space-y-1">
                                        <p className="text-xs font-bold text-kb-muted uppercase tracking-widest flex items-center gap-2 mb-1">
                                            <Key size={14} /> Password
                                        </p>
                                        <p className="text-lg font-medium text-kb-dark">••••••••</p>
                                    </div>
                                    {isUpdatingPassword ? (
                                        <div className="flex flex-col gap-2 w-full sm:w-64">
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-sst-primary outline-none text-sm"
                                                placeholder="New password (min 6 chars)"
                                            />
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-sst-primary outline-none text-sm"
                                                placeholder="Confirm new password"
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={handleUpdatePassword} className="px-4 py-2 bg-sst-primary text-white text-xs font-bold rounded-lg flex-1">Update</button>
                                                <button onClick={() => { setIsUpdatingPassword(false); setNewPassword(''); setConfirmPassword('') }} className="px-4 py-2 bg-gray-200 text-kb-muted text-xs font-bold rounded-lg flex-1">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsUpdatingPassword(true)}
                                            className="px-6 py-3 bg-white border border-gray-200 text-sst-primary font-bold rounded-2xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                                        >
                                            Update Password
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── My Bookings ── */}
                        <div className="space-y-6">
                            <h2 className="flex items-center gap-3 text-h2 text-kb-navy border-b border-gray-100 pb-4">
                                <Calendar size={24} className="text-sst-primary" />
                                My Bookings
                            </h2>
                            <div className="p-8 bg-gray-50/50 rounded-3xl border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div>
                                    <p className="font-bold text-kb-navy mb-1">View your appointments</p>
                                    <p className="text-sm text-kb-muted">See upcoming, past, and canceled tech support sessions.</p>
                                </div>
                                <Link
                                    href="/my-bookings"
                                    className="flex-shrink-0 px-8 py-3 bg-sst-primary text-white font-bold rounded-2xl hover:bg-sst-secondary transition-all shadow-md active:scale-95"
                                >
                                    Go to My Bookings →
                                </Link>
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
