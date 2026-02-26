'use client'

import React from 'react'
import withAuth from '@/components/withAuth'
import { Calendar, Clock, Video, MapPin, Search } from 'lucide-react'

function MyBookings() {
    return (
        <div className="bg-kb-bg min-h-screen py-16 md:py-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-title mb-2">My Bookings</h1>
                        <p className="text-kb-dark text-lg">Manage your upcoming tech sessions and view past appointments.</p>
                    </div>
                    <a href="/booking" className="px-6 py-3 bg-sst-primary text-white font-bold rounded-xl hover:bg-sst-secondary transition-all shadow-md flex items-center gap-2">
                        <Calendar size={18} />
                        Book New Session
                    </a>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-kb-cream">
                    {/* Tabs / Filters */}
                    <div className="flex border-b border-kb-cream p-4 gap-4 bg-gray-50/50">
                        <button className="px-6 py-2 bg-kb-navy text-white font-bold rounded-xl text-sm shadow-sm transition-all">Upcoming</button>
                        <button className="px-6 py-2 text-kb-muted hover:bg-gray-100 font-bold rounded-xl text-sm transition-all">Past</button>
                        <button className="px-6 py-2 text-kb-muted hover:bg-gray-100 font-bold rounded-xl text-sm transition-all">Canceled</button>
                    </div>

                    <div className="p-8 md:p-12">
                        {/* Empty State placeholder - assuming no bookings for demo */}
                        <div className="text-center py-16 px-4 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-kb-navy/5 text-kb-navy rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search size={24} />
                            </div>
                            <h3 className="mb-2">No upcoming sessions</h3>
                            <p className="text-kb-muted mb-6 max-w-md mx-auto">You don't have any appointments scheduled right now. Ready to learn something new?</p>
                            <a href="/booking" className="inline-flex px-8 py-3 bg-white border-2 border-sst-primary text-sst-primary font-bold rounded-xl hover:bg-gray-50 transition-all">
                                Explore Services
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default withAuth(MyBookings)
