'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import withAuth from '@/components/withAuth'
import { supabase } from '@/lib/supabase'
import { Plus, Laptop, Smartphone, Monitor, Watch, Printer, ShieldCheck, Wifi, ExternalLink, Trash2, Edit3, X, Check } from 'lucide-react'

// Map device types to icons
const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
        case 'computer':
        case 'laptop':
        case 'desktop':
            return <Laptop className="w-8 h-8 text-sst-primary" />
        case 'phone':
        case 'smartphone':
            return <Smartphone className="w-8 h-8 text-sst-primary" />
        case 'tablet':
            return <Monitor className="w-8 h-8 text-sst-primary" />
        case 'smartwatch':
        case 'watch':
        case 'wearable':
            return <Watch className="w-8 h-8 text-sst-primary" />
        case 'printer':
            return <Printer className="w-8 h-8 text-sst-primary" />
        case 'security camera':
        case 'security':
        case 'camera':
            return <ShieldCheck className="w-8 h-8 text-sst-primary" />
        case 'internet':
        case 'router':
        case 'modem':
            return <Wifi className="w-8 h-8 text-sst-primary" />
        default:
            return <Laptop className="w-8 h-8 text-sst-primary" />
    }
}

function MyDevicesContent() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Data States
    const [ownedDevices, setOwnedDevices] = useState<any[]>([])
    const [recommendations, setRecommendations] = useState<any[]>([])

    // UI States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

    // Form States
    const [newDeviceType, setNewDeviceType] = useState('Computer')
    const [newDeviceName, setNewDeviceName] = useState('')
    const [newDeviceBrand, setNewDeviceBrand] = useState('')
    const [newDeviceYear, setNewDeviceYear] = useState(new Date().getFullYear().toString())
    const [newDeviceNotes, setNewDeviceNotes] = useState('')

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isAddModalOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isAddModalOpen])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            setUser(user)

            // Fetch manually added devices
            const { data: devices, error: devicesError } = await supabase
                .from('user_devices')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (!devicesError && devices) {
                setOwnedDevices(devices)
            }

            // Fetch quiz recommendations
            const { data: recs, error: recsError } = await supabase
                .from('quiz_results')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (!recsError && recs) {
                // Filter to unique quiz IDs, keeping the most recent result for each
                const uniqueRecs = recs.reduce((acc: any[], current: any) => {
                    const x = acc.find(item => item.quiz_id === current.quiz_id);
                    if (!x) {
                        return acc.concat([current]);
                    } else {
                        return acc;
                    }
                }, []);

                setRecommendations(uniqueRecs)
            }
        }
        setLoading(false)
    }

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type })
        setTimeout(() => setMessage(null), 5000)
    }

    const handleAddDevice = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        try {
            const { data, error } = await supabase
                .from('user_devices')
                .insert([
                    {
                        user_id: user.id,
                        device_type: newDeviceType,
                        device_name: newDeviceName,
                        brand: newDeviceBrand,
                        purchase_year: parseInt(newDeviceYear),
                        notes: newDeviceNotes
                    }
                ])
                .select()

            if (error) throw error

            setOwnedDevices([data[0], ...ownedDevices])
            setIsAddModalOpen(false)
            showMessage('Device added successfully!', 'success')

            // Reset form
            setNewDeviceName('')
            setNewDeviceBrand('')
            setNewDeviceNotes('')
            setNewDeviceYear(new Date().getFullYear().toString())

        } catch (err: any) {
            showMessage(err.message, 'error')
        }
    }

    const handleDeleteDevice = async (deviceId: string) => {
        if (!confirm('Are you sure you want to remove this device?')) return

        try {
            const { error } = await supabase
                .from('user_devices')
                .delete()
                .eq('id', deviceId)

            if (error) throw error

            setOwnedDevices(ownedDevices.filter(d => d.id !== deviceId))
            showMessage('Device removed', 'success')
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

    return (
        <div className="bg-kb-bg min-h-screen pt-12 pb-24">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <Link href="/account" className="text-sm font-bold text-sst-primary hover:underline mb-2 inline-block">
                            &larr; Back to Account
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-kb-navy font-heading tracking-tight mt-2">My Devices</h1>
                        <p className="text-lg text-kb-dark mt-2">Manage your current tech and view personalized recommendations.</p>
                    </div>
                </div>

                {message && (
                    <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 animate-fadeIn ${message.type === 'success' ? 'bg-[#EFFFED] text-[#2b6819] border border-[#B3E6A1]' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
                        <p className="font-medium">{message.text}</p>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-10">

                    {/* LEFT COLUMN: OWNED DEVICES */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center justify-between border-b-2 border-kb-pale pb-4">
                            <h2 className="text-2xl font-bold text-kb-navy flex items-center gap-2">
                                <Laptop className="text-sst-primary" /> Owned Devices
                            </h2>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-sst-primary text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-sst-secondary transition-all shadow-sm active:scale-95 text-sm"
                            >
                                <Plus size={18} /> Add Device
                            </button>
                        </div>

                        {ownedDevices.length === 0 ? (
                            <div className="bg-white border-2 border-dashed border-kb-pale rounded-3xl p-12 text-center">
                                <div className="w-20 h-20 bg-kb-bg rounded-full flex items-center justify-center mx-auto mb-4 text-kb-muted">
                                    <Laptop size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-kb-navy mb-2">No devices added yet</h3>
                                <p className="text-kb-dark mb-6 max-w-md mx-auto">Keep track of your computers, phones, and other smart tech in one convenient place.</p>
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="bg-kb-navy text-white px-8 py-3 rounded-xl font-bold hover:bg-kb-slate transition-all shadow-md"
                                >
                                    Add Your First Device
                                </button>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-6">
                                {ownedDevices.map(device => (
                                    <div key={device.id} className="bg-white rounded-2xl border border-kb-pale p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                                        <button
                                            onClick={() => handleDeleteDevice(device.id)}
                                            className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remove device"
                                        >
                                            <Trash2 size={18} />
                                        </button>

                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="p-3 bg-kb-bg rounded-xl">
                                                {getDeviceIcon(device.device_type)}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-kb-muted uppercase tracking-wider mb-1">{device.brand}</div>
                                                <h3 className="text-lg font-bold text-kb-navy leading-tight pr-6">{device.device_name}</h3>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-4 text-sm">
                                            <span className="bg-sst-beige/50 text-kb-dark px-3 py-1 rounded-lg font-medium border border-sst-beige">
                                                Purchased {device.purchase_year}
                                            </span>
                                            <span className="bg-kb-bg text-kb-dark px-3 py-1 rounded-lg font-medium border border-kb-pale">
                                                {device.device_type}
                                            </span>
                                        </div>

                                        {device.notes && (
                                            <p className="mt-4 text-sm text-kb-dark/80 bg-gray-50 p-3 rounded-xl border border-gray-100 line-clamp-2">
                                                "{device.notes}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: QUIZ RECOMMENDATIONS */}
                    <div className="space-y-8">
                        <div className="border-b-2 border-kb-pale pb-4">
                            <h2 className="text-2xl font-bold text-kb-navy flex items-center gap-2">
                                <ShieldCheck className="text-sst-primary" /> Quiz Results
                            </h2>
                        </div>

                        {recommendations.length === 0 ? (
                            <div className="bg-white rounded-3xl p-8 border border-kb-pale text-center">
                                <div className="w-16 h-16 bg-sst-beige/50 rounded-full flex items-center justify-center mx-auto mb-4 text-sst-secondary">
                                    <ShieldCheck size={28} />
                                </div>
                                <h3 className="text-lg font-bold text-kb-navy mb-2">No recommendations yet</h3>
                                <p className="text-kb-dark text-sm mb-6">Take our interactive quizzes to get personalized product recommendations.</p>
                                <Link
                                    href="/#how-it-works"
                                    className="bg-white border-2 border-sst-primary text-sst-primary px-6 py-2 rounded-xl font-bold hover:bg-sst-primary hover:text-white transition-all text-sm block"
                                >
                                    Take a Quiz
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {recommendations.map(rec => {
                                    const topProduct = rec.recommendation?.products?.[0];
                                    if (!topProduct) return null;

                                    return (
                                        <div key={rec.id} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-kb-pale p-6 shadow-sm">
                                            <div className="text-xs font-bold text-sst-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <Check size={14} /> {rec.quiz_id.replace('-', ' ')} Match
                                            </div>

                                            <h3 className="text-xl font-extrabold text-kb-navy mb-1 leading-tight">{topProduct.name}</h3>
                                            <p className="text-lg font-bold text-sst-secondary mb-4">{topProduct.price}</p>

                                            <div className="bg-white p-3 rounded-xl border border-gray-100 mb-4">
                                                <p className="text-sm text-kb-dark line-clamp-3">
                                                    <span className="font-bold text-kb-muted text-xs uppercase block mb-1">Our Expert Take</span>
                                                    {topProduct.why}
                                                </p>
                                            </div>

                                            <a
                                                href={topProduct.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full bg-kb-navy text-white px-4 py-2.5 rounded-xl font-bold hover:bg-kb-slate transition-all text-sm flex items-center justify-center gap-2"
                                            >
                                                View Product <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* ADD DEVICE MODAL */}
            {
                isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-kb-navy/60 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="bg-kb-bg border-b border-kb-pale p-5 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-kb-navy">Add New Device</h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-kb-muted hover:text-red-500 bg-white rounded-full p-1 shadow-sm">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleAddDevice} className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-kb-navy ml-1">Device Type</label>
                                    <select
                                        value={newDeviceType}
                                        onChange={(e) => setNewDeviceType(e.target.value)}
                                        className="w-full px-4 py-3 bg-kb-bg border border-kb-pale rounded-xl focus:border-sst-primary focus:ring-1 focus:ring-sst-primary outline-none"
                                    >
                                        <option value="Computer">Computer / PC</option>
                                        <option value="Laptop">Laptop / MacBook</option>
                                        <option value="Smartphone">Smartphone</option>
                                        <option value="Tablet">Tablet / iPad</option>
                                        <option value="Smartwatch">Smartwatch</option>
                                        <option value="Printer">Printer</option>
                                        <option value="Security Camera">Security Camera</option>
                                        <option value="Internet Router">Internet Router / Modem</option>
                                        <option value="Other">Other Tech</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-kb-navy ml-1">Brand</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Apple, Samsung, Dell..."
                                            value={newDeviceBrand}
                                            onChange={(e) => setNewDeviceBrand(e.target.value)}
                                            className="w-full px-4 py-3 bg-kb-bg border border-kb-pale rounded-xl focus:border-sst-primary focus:ring-1 focus:ring-sst-primary outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-kb-navy ml-1">Purchase Year</label>
                                        <input
                                            required
                                            type="number"
                                            min="1990"
                                            max={new Date().getFullYear()}
                                            value={newDeviceYear}
                                            onChange={(e) => setNewDeviceYear(e.target.value)}
                                            className="w-full px-4 py-3 bg-kb-bg border border-kb-pale rounded-xl focus:border-sst-primary focus:ring-1 focus:ring-sst-primary outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-kb-navy ml-1">Model Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. iPhone 15 Pro, XPS 13"
                                        value={newDeviceName}
                                        onChange={(e) => setNewDeviceName(e.target.value)}
                                        className="w-full px-4 py-3 bg-kb-bg border border-kb-pale rounded-xl focus:border-sst-primary focus:ring-1 focus:ring-sst-primary outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-kb-navy ml-1">Notes (Optional)</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Storage size, color, issues..."
                                        value={newDeviceNotes}
                                        onChange={(e) => setNewDeviceNotes(e.target.value)}
                                        className="w-full px-4 py-3 bg-kb-bg border border-kb-pale rounded-xl focus:border-sst-primary focus:ring-1 focus:ring-sst-primary outline-none resize-none"
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="w-full bg-sst-primary text-white py-4 rounded-xl font-bold hover:bg-sst-secondary transition-all shadow-md text-lg"
                                    >
                                        Save Device
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            <style jsx>{`
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div >
    )
}

export default function MyDevicesPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-kb-bg">
                <div className="w-12 h-12 border-4 border-sst-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <MyDevicesContent />
        </React.Suspense>
    )
}
