'use client'

import React from 'react'
import withAuth from '@/components/withAuth'
import { User, Shield, Mail, Key } from 'lucide-react'

function AccountSettings() {
    return (
        <div className="bg-kb-bg min-h-screen py-16 md:py-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden">
                    <div className="bg-kb-navy p-8 md:p-12 text-white flex items-center gap-6">
                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-white">
                            <User size={40} />
                        </div>
                        <div>
                            <h1 className="text-title text-white mb-2">Account Settings</h1>
                            <p className="text-white/80">Manage your personal information and security preferences.</p>
                        </div>
                    </div>

                    <div className="p-8 md:p-12 space-y-8">
                        {/* Profile Info Section */}
                        <div className="space-y-6">
                            <h2 className="flex items-center gap-2 border-b border-kb-cream pb-4">
                                <User size={20} className="text-kb-muted" />
                                Personal Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-sm font-bold text-kb-muted uppercase tracking-wider mb-2">Full Name</p>
                                    <p className="text-lg font-medium text-kb-dark">SmartSass User</p>
                                    <button className="text-sst-primary text-sm font-bold mt-4 hover:underline">Edit Name</button>
                                </div>
                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-sm font-bold text-kb-muted uppercase tracking-wider mb-2">Phone</p>
                                    <p className="text-lg font-medium text-kb-dark">Not provided</p>
                                    <button className="text-sst-primary text-sm font-bold mt-4 hover:underline">Add Phone</button>
                                </div>
                            </div>
                        </div>

                        {/* Security Section */}
                        <div className="space-y-6">
                            <h2 className="flex items-center gap-2 border-b border-kb-cream pb-4">
                                <Shield size={20} className="text-kb-muted" />
                                Security Details
                            </h2>
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="mb-4 sm:mb-0">
                                        <p className="text-sm font-bold text-kb-muted uppercase tracking-wider flex items-center gap-2 mb-1"><Mail size={16} /> Email Address</p>
                                        <p className="text-lg font-medium text-kb-dark">user@smartsasstech.com</p>
                                    </div>
                                    <button className="px-6 py-3 bg-white border border-gray-200 text-sst-primary font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                                        Change Email
                                    </button>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="mb-4 sm:mb-0">
                                        <p className="text-sm font-bold text-kb-muted uppercase tracking-wider flex items-center gap-2 mb-1"><Key size={16} /> Password</p>
                                        <p className="text-lg font-medium text-kb-dark">••••••••</p>
                                    </div>
                                    <button className="px-6 py-3 bg-white border border-gray-200 text-sst-primary font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                                        Update Password
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default withAuth(AccountSettings)
