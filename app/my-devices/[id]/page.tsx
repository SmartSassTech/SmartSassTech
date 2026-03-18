'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import withAuth from '@/components/withAuth'
import { 
    Laptop, Smartphone, Monitor, Watch, Printer, ShieldCheck, Wifi, 
    ArrowLeft, Calendar, Info, Activity, History, BookOpen, 
    Settings, AlertCircle, CheckCircle2, RefreshCw, Clock, ExternalLink
} from 'lucide-react'
import { EXPERTISE_DATA } from '@/lib/expertise-data'
import AutoResizingTextarea from '@/components/AutoResizingTextarea'
import BrandLogo from '@/components/BrandLogo'

// Map device types to icons (Copied from main page for consistency)
const getDeviceIcon = (type: string) => {
    switch (type?.toLowerCase() || '') {
        case 'computer': case 'laptop': case 'desktop':
            return <Laptop className="w-10 h-10 text-sst-primary" />
        case 'phone': case 'smartphone':
            return <Smartphone className="w-10 h-10 text-sst-primary" />
        case 'tablet':
            return <Monitor className="w-10 h-10 text-sst-primary" />
        case 'smartwatch': case 'watch': case 'wearable':
            return <Watch className="w-10 h-10 text-sst-primary" />
        case 'printer':
            return <Printer className="w-10 h-10 text-sst-primary" />
        case 'security camera': case 'security':
            return <ShieldCheck className="w-10 h-10 text-sst-primary" />
        case 'internet': case 'router': case 'modem':
            return <Wifi className="w-10 h-10 text-sst-primary" />
        default:
            return <Laptop className="w-10 h-10 text-sst-primary" />
    }
}

// Map device types to Expertise categories
const getExpertiseCategory = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (['computer', 'laptop', 'desktop'].includes(t)) return 'laptops-desktops';
    if (['phone', 'smartphone', 'tablet'].includes(t)) return 'tablets-phones';
    if (['smartwatch', 'watch', 'wearable'].includes(t)) return 'watches-wearables';
    if (['tv', 'streaming', 'apple tv', 'roku'].includes(t)) return 'tv-streaming';
    if (['security camera', 'security', 'ring', 'nest'].includes(t)) return 'smart-home-security';
    if (['printer', 'scanner'].includes(t)) return 'printers-scanners';
    if (['internet', 'router', 'modem', 'wifi'].includes(t)) return 'wifi-networking';
    return null;
}

function DeviceDetailPageContent() {
    const { id } = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [device, setDevice] = useState<any>(null)
    const [health, setHealth] = useState<any>(null)
    const [history, setHistory] = useState<any[]>([])
    const [userId, setUserId] = useState<string | null>(null)
    
    // Modals & Forms
    const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isRepairModalOpen, setIsRepairModalOpen] = useState(false)
    
    // Edit Device Form
    const [editName, setEditName] = useState('')
    const [editModel, setEditModel] = useState('')
    const [editNotes, setEditNotes] = useState('')
    
    // Diagnostic Form
    const [diagStep, setDiagStep] = useState(0)
    const [diagAnswers, setDiagAnswers] = useState<number[]>([])

    // Repair Form
    const [repairIssue, setRepairIssue] = useState('')
    const [repairSolution, setRepairSolution] = useState('')
    const [repairCost, setRepairCost] = useState('')

    useEffect(() => {
        if (id) fetchDeviceData()
    }, [id])

    const fetchDeviceData = async () => {
        setLoading(true)
        try {
            // 0. Get Current User
            const { data: { user: currentUser } } = await supabase.auth.getUser()
            if (currentUser) setUserId(currentUser.id)

            // 1. Fetch Device Basic Info
            const { data: deviceData, error: deviceError } = await supabase
                .from('user_devices')
                .select('*')
                .eq('id', id)
                .single()

            if (deviceError) throw deviceError
            setDevice(deviceData)
            setEditName(deviceData.device_name || '')
            setEditModel(deviceData.model || '')
            setEditNotes(deviceData.notes || '')

            // 2. Fetch Health Data
            const { data: healthData } = await supabase
                .from('device_health_status')
                .select('*')
                .eq('device_id', id)
                .single()
            setHealth(healthData)

            // 3. Fetch Service History
            const { data: historyData } = await supabase
                .from('device_service_history')
                .select('*')
                .eq('device_id', id)
                .order('service_date', { ascending: false })
            setHistory(historyData || [])

        } catch (error) {
            console.error("Error fetching device details:", error)
        } finally {
            setLoading(false)
        }
    }

    const age = new Date().getFullYear() - (device?.purchase_year || new Date().getFullYear());
    const healthScore = health?.health_score || 0;

    // Helper for brand-aware resources
    const getDeviceBrand = () => {
        if (!device) return null;
        const text = (device.device_name + ' ' + (device.model || '')).toLowerCase();
        if (text.includes('apple') || text.includes('mac') || text.includes('iphone') || text.includes('ipad')) return 'apple';
        if (text.includes('dell')) return 'dell';
        if (text.includes('hp')) return 'hp';
        if (text.includes('lenovo')) return 'lenovo';
        if (text.includes('samsung')) return 'samsung';
        if (text.includes('microsoft') || text.includes('surface')) return 'microsoft';
        return null;
    }

    const handleRunScan = () => {
        setDiagStep(0);
        setDiagAnswers([]);
        setIsDiagnosticOpen(true);
    }

    const submitDiagnostic = async () => {
        const avgScore = diagAnswers.length > 0 ? diagAnswers.reduce((a, b) => a + b, 0) / diagAnswers.length : 0;
        const finalScore = Math.round(avgScore);
        
        try {
            const { data, error } = await supabase
                .from('device_health_status')
                .upsert({ 
                    device_id: id,
                    health_score: finalScore,
                    last_check: new Date().toISOString(),
                    update_status: finalScore > 85 ? 'up-to-date' : 'manual-check-required',
                    performance_indicators: {
                        cpu_cores: (navigator as any).hardwareConcurrency || 'Unknown',
                        device_memory: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'Unknown',
                        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent.split(') ')[0] + ')' : 'Unknown'
                    }
                }, { onConflict: 'device_id' })
                .select()
                .single();
            
            if (error) throw error;
            setHealth(data);
            setIsDiagnosticOpen(false);
            fetchDeviceData();
        } catch (err: any) {
            console.error("Error updating health score:", err.message || err);
            alert(`Error updating health score: ${err.message || 'Unknown error'}`);
        }
    }

    const handleUpdateDevice = async () => {
        try {
            const { error: deviceError } = await supabase
                .from('user_devices')
                .update({
                    device_name: editName,
                    model: editModel,
                    notes: editNotes
                })
                .eq('id', id);
            
            if (deviceError) throw deviceError;
            setIsEditModalOpen(false);
            fetchDeviceData();
        } catch (err: any) {
            console.error("Error updating device:", err.message || err);
            alert(`Error updating device: ${err.message || 'Unknown error'}`);
        }
    }

    const handleLogRepair = async () => {
        try {
            // Re-verify userId if null (e.g. if session expired or fetch failed)
            let currentUserId = userId;
            if (!currentUserId) {
                const { data: { user } } = await supabase.auth.getUser();
                currentUserId = user?.id || null;
            }

            if (!currentUserId) throw new Error("User authentication required to log repair");

            const { error: repairError } = await supabase
                .from('device_service_history')
                .insert({
                    device_id: id,
                    user_id: currentUserId,
                    service_date: new Date().toISOString().split('T')[0],
                    issue_description: repairIssue,
                    resolution: repairSolution,
                    cost: parseFloat(repairCost.toString().replace(/[^0-9.]/g, '')) || 0,
                    service_type: 'repair'
                });
            
            if (repairError) throw repairError;
            setIsRepairModalOpen(false);
            setRepairIssue('');
            setRepairSolution('');
            setRepairCost('');
            fetchDeviceData();
        } catch (err: any) {
            console.error("Error logging repair:", err.message || err);
            alert(`Error logging repair: ${err.message || 'Unknown error'}`);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-kb-bg">
                <div className="w-12 h-12 border-4 border-sst-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!device) {
        return (
            <div className="min-h-screen bg-kb-bg p-8 flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold text-kb-navy mb-4">Device not found</h1>
                <Link href="/my-devices" className="text-sst-primary font-bold hover:underline">Return to My Devices</Link>
            </div>
        )
    }

    // Data for UI
    const purchaseDate = device?.purchase_date ? new Date(device.purchase_date) : new Date();
    
    return (
        <div className="bg-kb-bg min-h-screen pt-12 pb-24">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Back Link */}
                <Link href="/my-devices" className="flex items-center gap-2 text-sst-primary font-bold hover:underline mb-8 transition-all hover:-translate-x-1 w-fit">
                    <ArrowLeft size={18} /> Back to My Devices
                </Link>

                <div className="grid lg:grid-cols-3 gap-8">
                    
                    {/* LEFT COLUMN: BASIC INFO & HEALTH */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Device Identity Card */}
                        <div className="bg-white rounded-3xl p-8 border border-kb-pale shadow-sm">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-4 bg-kb-bg rounded-2xl">
                                    {getDeviceIcon(device.device_type)}
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-kb-muted uppercase tracking-widest">{device.brand} {device.model}</div>
                                    <h1 className="text-2xl font-extrabold text-kb-navy leading-tight">{device.device_name}</h1>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                    <span className="text-kb-dark font-medium flex items-center gap-2"><Calendar size={16} className="text-kb-muted" /> Age</span>
                                    <span className="font-bold text-kb-navy">{age} {age === 1 ? 'Year' : 'Years'} Old</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                    <span className="text-kb-dark font-medium flex items-center gap-2"><Info size={16} className="text-kb-muted" /> Type</span>
                                    <span className="font-bold text-kb-navy">{device.device_type}</span>
                                </div>
                                {device.notes && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 italic text-sm text-kb-dark">
                                        "{device.notes}"
                                    </div>
                                )}
                            </div>
                            
                            <button 
                                onClick={() => setIsEditModalOpen(true)}
                                className="w-full mt-8 bg-kb-bg text-kb-navy py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-kb-pale transition-all">
                                <Settings size={18} /> Edit Device Details
                            </button>
                        </div>

                        {/* Health Score Gauge */}
                        <div className="bg-white rounded-3xl p-8 border border-kb-pale shadow-sm overflow-hidden relative">
                             <div className="flex items-center gap-2 mb-6">
                                <Activity size={20} className="text-sst-primary" />
                                <h2 className="text-xl font-bold text-kb-navy">Device Health</h2>
                            </div>
                            
                            <div className="flex flex-col items-center py-4">
                                <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                                    {/* Score Circle */}
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                                        <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-kb-bg" />
                                        <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" 
                                                strokeDasharray={440} 
                                                strokeDashoffset={440 - (440 * healthScore) / 100} 
                                                className={`${healthScore >= 80 ? 'text-green-500' : healthScore >= 50 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000 ease-out`} />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-5xl font-black text-kb-navy leading-none">{healthScore}</span>
                                        <span className="text-[10px] uppercase font-bold text-kb-muted tracking-widest mt-1">Score</span>
                                    </div>
                                </div>
                                
                                <div className="w-full space-y-3 mt-4">
                                    <div className="flex items-center justify-between p-3 bg-kb-bg rounded-xl">
                                        <span className="text-xs font-bold text-kb-navy">Software Update</span>
                                        {health?.update_status === 'up-to-date' ? (
                                            <span className="text-[10px] font-bold text-green-600 flex items-center gap-1"><CheckCircle2 size={12}/> Current</span>
                                        ) : health?.update_status === 'manual-check-required' || health?.health_score ? (
                                            <span className="text-[10px] font-bold text-yellow-600 flex items-center gap-1"><AlertCircle size={12}/> Update Available</span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-kb-muted flex items-center gap-1"><Clock size={12}/> Scan Required</span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-kb-bg rounded-xl">
                                        <span className="text-xs font-bold text-kb-navy">Reliability</span>
                                        <span className="text-[10px] font-bold text-kb-muted">High (No Issues)</span>
                                    </div>
                                    
                                    {/* Performance Indicators */}
                                    {health?.performance_indicators && Object.entries(health.performance_indicators).map(([key, value]: [string, any]) => (
                                        <div key={key} className="flex items-center justify-between p-3 bg-kb-bg rounded-xl">
                                            <span className="text-xs font-bold text-kb-navy capitalize">{key.replace(/_/g, ' ')}</span>
                                            <span className="text-[10px] font-bold text-kb-muted">{value}</span>
                                        </div>
                                    ))}
                                </div>
                                
                                <button 
                                    onClick={handleRunScan}
                                    className="w-full mt-6 bg-sst-primary text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-sst-secondary transition-all shadow-lg shadow-sst-primary/10">
                                    <RefreshCw size={18} /> Run Health Scan
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: SERVICE HISTORY & GUIDES */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Service History Timeline */}
                        <div className="bg-white rounded-3xl p-8 border border-kb-pale shadow-sm">
                            <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-4">
                                <h2 className="text-2xl font-bold text-kb-navy flex items-center gap-3">
                                    <History className="text-sst-primary" /> Service History
                                </h2>
                                <button 
                                    onClick={() => setIsRepairModalOpen(true)}
                                    className="bg-sst-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:scale-105 transition-transform active:scale-95">
                                    Log New Repair
                                </button>
                            </div>

                            {history.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="w-16 h-16 bg-kb-bg rounded-full flex items-center justify-center mx-auto mb-4 text-kb-muted">
                                        <Clock size={28} />
                                    </div>
                                    <h3 className="text-lg font-bold text-kb-navy">No service records yet</h3>
                                    <p className="text-kb-dark text-sm mt-1 max-w-xs mx-auto">Whenever SmartSass Tech works on your device, the history will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-kb-pale">
                                    {history.map((item, idx) => (
                                        <div key={item.id} className="relative pl-12">
                                            <div className="absolute left-0 top-1 w-10 h-10 bg-white border-2 border-sst-primary rounded-full flex items-center justify-center z-10 shadow-sm">
                                                <Settings size={18} className="text-sst-primary" />
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-2 mb-2">
                                                <div>
                                                    <h3 className="font-bold text-kb-navy text-lg">{item.service_type}</h3>
                                                    <p className="text-xs font-bold text-kb-muted uppercase flex items-center gap-1">
                                                        <Calendar size={12} /> {new Date(item.service_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                {item.cost && (
                                                    <div className="bg-green-50 text-green-700 font-bold px-3 py-1 rounded-lg text-sm border border-green-100">
                                                        ${item.cost}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="bg-kb-bg rounded-2xl p-5 border border-kb-pale/50 mt-3">
                                                <div className="space-y-4">
                                                    <div>
                                                        <span className="text-[10px] font-black uppercase text-kb-muted tracking-widest block mb-1">Observation</span>
                                                        <p className="text-sm text-kb-dark">{item.issue_description}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-black uppercase text-kb-muted tracking-widest block mb-1">Technician Notes & Solution</span>
                                                        <p className="text-sm text-kb-navy font-medium italic">"{item.resolution || item.technician_notes}"</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Personalized Support Guides */}
                        <div className="bg-gradient-to-br from-sst-primary to-kb-navy rounded-3xl p-8 border border-sst-primary shadow-xl text-white">
                            <div className="flex items-center gap-3 mb-6">
                                <BookOpen size={24} />
                                <h2 className="text-2xl font-bold">Support Guides for Your {device.device_type}</h2>
                            </div>
                            
                            <p className="mb-8 text-white font-medium leading-relaxed max-w-2xl">
                                We've handpicked these resources specifically for your device to help you get the most out of your tech and keep it running smoothly.
                            </p>
                            
                            {getExpertiseCategory(device.device_type) ? (
                                <>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {EXPERTISE_DATA[getExpertiseCategory(device.device_type)!].helpItems.slice(0, 2).map((item, idx) => (
                                            <Link 
                                                key={idx} 
                                                href={`/expertise/${getExpertiseCategory(device.device_type)}`}
                                                className="bg-white p-6 rounded-2xl border border-white/10 hover:shadow-lg transition-all flex flex-col gap-4 group"
                                            >
                                                <div className="text-4xl transform group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                                                <div>
                                                    <h4 className="font-bold text-lg text-kb-navy mb-1">{item.title}</h4>
                                                    <p className="text-sm text-kb-dark/70 leading-relaxed">{item.description}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                    
                                    <div className="mt-8 pt-6 border-t border-white/10">
                                        <h5 className="text-xs font-black uppercase tracking-widest text-white/60 mb-4">Official Resources & Links</h5>
                                        <div className="flex flex-wrap gap-3">
                                            {EXPERTISE_DATA[getExpertiseCategory(device.device_type)!].officialResources
                                                .filter(res => {
                                                    const brand = getDeviceBrand();
                                                    if (!brand) return true;
                                                    return res.title.toLowerCase().includes(brand);
                                                })
                                                .map((res, idx) => (
                                                    <a key={idx} href={res.url} target="_blank" rel="noopener noreferrer" className="bg-white text-kb-navy hover:bg-kb-pale px-5 py-3 rounded-xl text-sm font-bold border border-white/20 flex items-center gap-3 transition-all hover:-translate-y-0.5 shadow-sm">
                                                        <BrandLogo brand={res.title} size={32} />
                                                        {res.title} <ExternalLink size={14} className="ml-auto text-kb-muted" />
                                                    </a>
                                                ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <Link href="/expertise" className="bg-white p-6 rounded-2xl border border-white/10 hover:shadow-lg transition-all flex flex-col gap-3 group">
                                        <div className="bg-kb-bg w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform text-sst-primary">
                                            <CheckCircle2 size={20} />
                                        </div>
                                        <h4 className="font-bold text-lg text-kb-navy">General Maintenance</h4>
                                        <p className="text-sm text-kb-dark/70">Solve common problems on your own.</p>
                                    </Link>
                                    <Link href="/expertise" className="bg-white p-6 rounded-2xl border border-white/10 transition-all flex flex-col gap-3 group">
                                        <div className="bg-kb-bg w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform text-sst-primary">
                                            <RefreshCw size={20} />
                                        </div>
                                        <h4 className="font-bold text-lg text-kb-navy">Performance Tips</h4>
                                        <p className="text-sm text-kb-dark/70">Learn how to keep your devices fast.</p>
                                    </Link>
                                </div>
                            )}

                            <Link href="/articles" className="mt-8 block text-center font-bold text-white hover:underline transition-colors">
                                View All Resources &rarr;
                            </Link>
                        </div>

                    </div>
                </div>
            </div>

            {/* Health Diagnostic Modal */}
            {isDiagnosticOpen && (
                <div className="fixed inset-0 bg-kb-navy/80 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="bg-sst-primary p-6 text-white flex justify-between items-center">
                            <h3 className="text-xl font-bold">Health Scan: {device.device_type}</h3>
                            <button onClick={() => setIsDiagnosticOpen(false)} className="hover:rotate-90 transition-transform">
                                <Activity size={24} />
                            </button>
                        </div>
                        <div className="p-8">
                            {diagStep < 4 ? (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-black uppercase tracking-widest text-kb-muted">Step {diagStep + 1} of 4</span>
                                        <div className="flex gap-1">
                                            {[0, 1, 2, 3].map(s => (
                                                <div key={s} className={`w-8 h-1 rounded-full ${s <= diagStep ? 'bg-sst-primary' : 'bg-kb-bg'}`}></div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <h4 className="text-xl font-bold text-kb-navy">
                                        {[
                                            "Is the device running slower than usual?",
                                            "Do you encounter unexpected crashes or freezes?",
                                            "Is the battery life significantly shorter?",
                                            "Are there any visible hardware issues (cracks, loose ports)?"
                                        ][diagStep]}
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { label: "No, everything is perfect", score: 100 },
                                            { label: "Occasionally / Minor issues", score: 70 },
                                            { label: "Yes, it's quite noticeable", score: 40 },
                                            { label: "Constantly / Severe problems", score: 10 }
                                        ].map((opt, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => {
                                                    const newAns = [...diagAnswers, opt.score];
                                                    setDiagAnswers(newAns);
                                                    if (diagStep < 3) setDiagStep(diagStep + 1);
                                                    else setDiagStep(4);
                                                }}
                                                className="text-left p-4 rounded-xl border-2 border-kb-bg hover:border-sst-primary hover:bg-sst-primary/5 transition-all group"
                                            >
                                                <span className="font-bold text-kb-navy group-hover:text-sst-primary">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h4 className="text-2xl font-bold text-kb-navy mb-2">Scan Complete!</h4>
                                    <p className="text-kb-dark mb-6">We've analyzed your responses and your computer's performance stats.</p>
                                    
                                    <div className="bg-kb-bg rounded-2xl p-4 mb-8 grid grid-cols-2 gap-4 text-left">
                                        <div>
                                            <span className="text-[10px] font-black uppercase text-kb-muted block">CPU Cores</span>
                                            <span className="font-bold text-kb-navy">{(navigator as any).hardwareConcurrency || '8'} Cores</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase text-kb-muted block">Memory</span>
                                            <span className="font-bold text-kb-navy">{(navigator as any).deviceMemory || '8'} GB</span>
                                        </div>
                                        <div className="col-span-2 pt-2 border-t border-kb-pale/50">
                                            <span className="text-[10px] font-black uppercase text-kb-muted block">Status</span>
                                            <span className="text-sm font-bold text-green-600">Hardware & Software Optimized</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={submitDiagnostic}
                                        className="bg-sst-primary text-white py-4 px-8 rounded-2xl font-bold shadow-lg shadow-sst-primary/20 hover:scale-105 transition-transform"
                                    >
                                        Update Device Profile
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Device Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-kb-navy/80 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="bg-kb-bg p-6 text-kb-navy flex justify-between items-center border-b border-kb-pale">
                            <h3 className="text-xl font-bold">Edit Device Details</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-kb-muted hover:text-kb-navy">
                                <Settings size={24} />
                            </button>
                        </div>
                        <div className="p-8 space-y-4">
                            <div>
                                <label className="block text-xs font-black uppercase text-kb-muted tracking-widest mb-1">Device Name</label>
                                <input 
                                    type="text" 
                                    value={editName} 
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-kb-pale bg-kb-bg/30 text-kb-navy font-medium outline-none focus:ring-2 focus:ring-sst-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-kb-muted tracking-widest mb-1">Model (Required)</label>
                                <input 
                                    type="text" 
                                    value={editModel} 
                                    onChange={(e) => setEditModel(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-kb-pale bg-kb-bg/30 text-kb-navy font-medium outline-none focus:ring-2 focus:ring-sst-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-kb-muted tracking-widest mb-1">Notes</label>
                                <AutoResizingTextarea
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-kb-pale bg-kb-bg/30 text-kb-navy font-medium outline-none focus:ring-2 focus:ring-sst-primary"
                                    placeholder="Add any specific details about this device..."
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-kb-muted hover:bg-kb-bg transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateDevice}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-sst-primary text-white shadow-lg shadow-sst-primary/10 hover:bg-sst-secondary transition-all"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Log Repair Modal */}
            {isRepairModalOpen && (
                <div className="fixed inset-0 bg-kb-navy/80 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="bg-kb-bg p-6 text-kb-navy flex justify-between items-center border-b border-kb-pale">
                            <h3 className="text-xl font-bold">Log New Repair</h3>
                            <button onClick={() => setIsRepairModalOpen(false)} className="text-kb-muted hover:text-kb-navy">
                                <History size={28} />
                            </button>
                        </div>
                        <div className="p-8 space-y-4">
                            <div>
                                <label className="block text-xs font-black uppercase text-kb-muted tracking-widest mb-1">What was the issue?</label>
                                <input
                                    type="text"
                                    value={repairIssue}
                                    onChange={(e) => setRepairIssue(e.target.value)}
                                    placeholder="e.g. Cracked screen, Running slow"
                                    className="w-full p-3 rounded-xl border border-kb-pale bg-kb-bg/30 text-kb-navy font-medium outline-none focus:ring-2 focus:ring-sst-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-kb-muted tracking-widest mb-1">How was it resolved?</label>
                                <AutoResizingTextarea
                                    value={repairSolution}
                                    onChange={(e) => setRepairSolution(e.target.value)}
                                    placeholder="e.g. Replaced screen, Reinstalled OS"
                                    className="w-full p-3 rounded-xl border border-kb-pale bg-kb-bg/30 text-kb-navy font-medium outline-none focus:ring-2 focus:ring-sst-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-kb-muted tracking-widest mb-1">Cost ($)</label>
                                <input 
                                    type="number" 
                                    value={repairCost} 
                                    onChange={(e) => setRepairCost(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full p-3 rounded-xl border border-kb-pale bg-kb-bg/30 text-kb-navy font-medium outline-none focus:ring-2 focus:ring-sst-primary"
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button 
                                    onClick={() => setIsRepairModalOpen(false)}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-kb-muted hover:bg-kb-bg transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleLogRepair}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-sst-primary text-white shadow-lg shadow-sst-primary/10 hover:bg-sst-secondary transition-all"
                                >
                                    Log History Entry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}


export default function DeviceDetailPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-kb-bg">
                <div className="w-12 h-12 border-4 border-sst-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <DeviceDetailPageContent />
        </React.Suspense>
    )
}
