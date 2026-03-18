'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, Check, MapPin, Loader2, Ticket, XCircle, Laptop, Smartphone, Tablet, Monitor } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import AutoResizingTextarea from '@/components/AutoResizingTextarea'

// Define types for booking
interface Service {
    id: string
    name: string
    price: number
    duration: number
    description: string
    category: string
}

const SERVICES: Service[] = [
    { id: 'standard', name: 'Standard Tech Support', price: 75, duration: 60, description: 'One-on-one help with troubleshooting, setup, and general tech questions.', category: 'Standard Support' },
    { id: 'membership-1', name: '1 Session / Month', price: 69, duration: 60, description: 'Regular tech maintenance and support. Most popular for proactive care.', category: 'Monthly Memberships' },
    { id: 'membership-2', name: '2 Sessions / Month', price: 135, duration: 120, description: 'More frequent support for active users and multi-device households.', category: 'Monthly Memberships' },
    { id: 'membership-3', name: '3 Sessions / Month', price: 195, duration: 180, description: 'Comprehensive support for small businesses or complex setups.', category: 'Monthly Memberships' },
    { id: 'pack-3', name: '3 Session Pack', price: 210, duration: 180, description: 'Flexible support whenever you need it. Perfect for ongoing learning.', category: 'Session Packs' },
    { id: 'pack-5', name: '5 Session Pack', price: 325, duration: 300, description: 'Save more on multiple sessions. Our best value for tech training.', category: 'Session Packs' },
    { id: 'pack-10', name: '10 Session Pack', price: 600, duration: 600, description: 'The ultimate peace of mind. Deeply discounted for long-term support.', category: 'Session Packs' },
]

const TIME_SLOTS = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
]

function BookingContent() {
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
        const now = new Date()
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        if (now.getHours() >= 17) d.setDate(d.getDate() + 1)
        return d
    })
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate?.getFullYear() || new Date().getFullYear(), selectedDate?.getMonth() || new Date().getMonth(), 1))
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        location: '',
        address: '',
        notes: ''
    })

    // Auth & Rewards State
    const [userId, setUserId] = useState<string | null>(null)
    const [discountCode, setDiscountCode] = useState('')
    const [appliedDiscount, setAppliedDiscount] = useState<{ id: string, code: string, percent: number } | null>(null)
    const [isValidatingDiscount, setIsValidatingDiscount] = useState(false)
    const [discountError, setDiscountError] = useState<string | null>(null)

    // Address Autocomplete State
    const [addressQuery, setAddressQuery] = useState('')
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
    const [isSearchingAddress, setIsSearchingAddress] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const autocompleteRef = useRef<HTMLDivElement>(null)

    const searchParams = useSearchParams()
    const rescheduleId = searchParams.get('reschedule')
    const chatSessionId = searchParams.get('chatSessionId')

    const [isProcessing, setIsProcessing] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [showReview, setShowReview] = useState(false)
    
    // New state for devices and conflicts
    const [userDevices, setUserDevices] = useState<any[]>([])
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
    const [busySlots, setBusySlots] = useState<string[]>([])
    const [isLoadingConflicts, setIsLoadingConflicts] = useState(false)

    // Check for auth session & fetch user data
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUserId(session.user.id)
                setFormData(prev => ({
                    ...prev,
                    email: session.user.email || '',
                }))

                // 1. Fetch profile to get name & address
                supabase.from('profiles').select('first_name, last_name, address, Phone').eq('id', session.user.id).single().then(({ data }) => {
                    if (data) {
                        setFormData(prev => ({
                            ...prev,
                            name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
                            phone: data.Phone || '',
                            address: data.address || ''
                        }))
                        if (data.address) setAddressQuery(data.address)
                    }
                })

                // 2. Fetch user's devices
                supabase.from('user_devices').select('*').eq('user_id', session.user.id).then(({ data }) => {
                    if (data) setUserDevices(data)
                })

                // 3. If rescheduling, fetch original booking
                if (rescheduleId) {
                    supabase.from('bookings').select('*').eq('id', rescheduleId).single().then(({ data }) => {
                        if (data) {
                            setSelectedService(SERVICES.find(s => s.name === data.service_name) || SERVICES[0])
                            setFormData(prev => ({
                                ...prev,
                                location: data.location_preference,
                                address: data.customer_address || '',
                                notes: `(Rescheduling session: ${data.id}) ${data.notes || ''}`
                            }))
                            if (data.customer_address) setAddressQuery(data.customer_address)
                        }
                    })
                }
            }
        })
    }, [rescheduleId])

    // Conflict detection: Fetch occupied slots when date changes
    useEffect(() => {
        if (!selectedDate) return

        const fetchConflicts = async () => {
            setIsLoadingConflicts(true)
            try {
                const dateStr = selectedDate.toISOString().split('T')[0]
                const { data, error } = await supabase
                    .from('bookings')
                    .select('booking_time')
                    .eq('booking_date', dateStr)
                    .neq('service_status', 'cancelled')
                
                if (data) {
                    setBusySlots(data.map(b => b.booking_time))
                }
            } catch (err) {
                console.error("Conflict checking error:", err)
            } finally {
                setIsLoadingConflicts(false)
            }
        }

        fetchConflicts()
    }, [selectedDate])

    // Handle click outside for autocomplete dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Debounced Address Search
    useEffect(() => {
        if (!addressQuery || addressQuery.length < 3) {
            setAddressSuggestions([])
            return
        }

        const fetchAddresses = async () => {
            setIsSearchingAddress(true)
            try {
                // Optimize search with bias towards Rochester, NY (-77.61, 43.15)
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&addressdetails=1&limit=5&countrycodes=us&viewbox=-77.7,43.2,-77.5,43.1`,
                    {
                        headers: {
                            'Accept-Language': 'en-US,en;q=0.9',
                            'User-Agent': 'SmartSassTech-BookingApp/1.0'
                        }
                    }
                )
                const data = await response.json()
                
                // Pre-format and de-duplicate suggestions
                const unique: any[] = []
                const seen = new Set()
                
                data.forEach((item: any) => {
                    const a = item.address || {}
                    const houseNumber = a.house_number || ''
                    const road = a.road || ''
                    const city = a.city || a.town || a.village || a.hamlet || ''
                    const state = a.state || ''
                    const zip = a.postcode || ''
                    
                    // Create a normalized string for comparison
                    const street = [houseNumber, road].filter(Boolean).join(' ')
                    const formatted = [street, city, state, zip].filter(Boolean).join(', ').trim().replace(/, ,/g, ',')
                    
                    if (formatted && !seen.has(formatted.toLowerCase())) {
                        seen.add(formatted.toLowerCase())
                        unique.push({ ...item, formatted })
                    }
                })
                
                setAddressSuggestions(unique)
            } catch (error) {
                console.error("Error fetching addresses:", error)
            } finally {
                setIsSearchingAddress(false)
            }
        }

        const timeoutId = setTimeout(fetchAddresses, 500)
        return () => clearTimeout(timeoutId)
    }, [addressQuery])

    // Load PayPal SDK dynamically
    useEffect(() => {
        if (showReview && !(window as any).paypal) {
            const script = document.createElement('script')
            script.src = `https://www.paypal.com/sdk/js?client-id=ARhtuqRS37ANHmiyROX4hINDcYfo6ICe9inMbshgQvhqtnQqNQZ52mqyXi-Rg-pzaFw8U2w8SqkEkvHI&currency=USD`
            script.async = true
            script.onload = () => {
                renderPayPalButton()
            }
            document.body.appendChild(script)
        } else if (showReview && (window as any).paypal) {
            renderPayPalButton()
        }
    }, [showReview])

    const handleApplyDiscount = async () => {
        if (!discountCode || !userId) return

        setIsValidatingDiscount(true)
        setDiscountError(null)

        try {
            const { data, error } = await supabase
                .from('discounts')
                .select('*')
                .eq('code', discountCode)
                .eq('user_id', userId)
                .eq('is_used', false)
                .single()

            if (error || !data) {
                setDiscountError('Invalid or expired discount code.')
                setAppliedDiscount(null)
            } else {
                setAppliedDiscount({
                    id: data.id,
                    code: data.code,
                    percent: data.percent_off
                })
            }
        } catch (err) {
            console.error('Discount validation error:', err)
            setDiscountError('Error validating discount.')
        } finally {
            setIsValidatingDiscount(false)
        }
    }

    const calculateFinalPrice = () => {
        if (!selectedService) return 0
        const basePrice = selectedService.price
        if (appliedDiscount) {
            return parseFloat((basePrice * (1 - appliedDiscount.percent / 100)).toFixed(2))
        }
        return basePrice
    }

    const renderPayPalButton = () => {
        if (!(window as any).paypal || !selectedService) return

        const finalPrice = calculateFinalPrice()
        const container = document.getElementById('paypal-button-container')
        if (container) container.innerHTML = '';

        (window as any).paypal.Buttons({
            createOrder: (data: any, actions: any) => {
                return actions.order.create({
                    purchase_units: [{
                        amount: { value: finalPrice.toString() },
                        description: `${selectedService.name} - SmartSass Tech ${appliedDiscount ? '(Discount Applied)' : ''}`
                    }]
                })
            },
            onApprove: (data: any, actions: any) => {
                return actions.order.capture().then((details: any) => {
                    finalizeBooking(data.orderID)
                })
            },
            onError: (err: any) => {
                console.error('PayPal Error:', err)
                alert('There was an error with the PayPal payment. Please try again.')
            }
        }).render('#paypal-button-container')
    }

    const finalizeBooking = async (orderId: string) => {
        setIsProcessing(true)
        const finalPrice = calculateFinalPrice()
        const pointsAwarded = Math.floor(finalPrice)

        try {
            // 1. Insert or Update booking
            const bookingData = {
                customer_name: formData.name,
                customer_email: formData.email,
                customer_phone: formData.phone,
                customer_address: formData.address,
                location_preference: formData.location,
                service_name: selectedService?.name,
                booking_date: selectedDate?.toISOString().split('T')[0],
                booking_time: selectedTime,
                duration: selectedService?.duration,
                price: finalPrice,
                notes: formData.notes,
                payment_status: 'completed',
                service_status: 'scheduled',
                paypal_order_id: orderId,
                user_id: userId,
                device_id: selectedDeviceId,
                chat_session_id: chatSessionId
            }

            let bookingError;
            if (rescheduleId) {
                const { error: updateError } = await supabase
                    .from('bookings')
                    .update({ ...bookingData, service_status: 'scheduled' })
                    .eq('id', rescheduleId)
                bookingError = updateError
            } else {
                const { error: insertError } = await supabase
                    .from('bookings')
                    .insert([bookingData])
                bookingError = insertError
            }

            if (bookingError) throw bookingError

            // 2. If discount used, mark it as used
            if (appliedDiscount && userId) {
                await supabase
                    .from('discounts')
                    .update({ is_used: true })
                    .eq('id', appliedDiscount.id)
            }

            // 3. Award points to user profile
            if (userId) {
                // Get current points
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('reward_points')
                    .eq('id', userId)
                    .single()

                const currentPoints = profile?.reward_points || 0

                await supabase
                    .from('profiles')
                    .update({ reward_points: currentPoints + pointsAwarded })
                    .eq('id', userId)
            }

            // 4. Trigger notification
            await fetch('https://zwfsvjvpocpflmkmptji.supabase.co/functions/v1/send-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'booking',
                    ...formData,
                    service: selectedService?.name,
                    date: selectedDate?.toLocaleDateString(),
                    time: selectedTime,
                    duration: selectedService?.duration,
                    price: `$${finalPrice}`,
                    paypalOrderId: orderId
                })
            })

            setIsSuccess(true)
        } catch (err) {
            console.error('Booking finalization error:', err)
            alert('Payment was successful, but there was an error saving your booking. Please contact us at (585) 210-9758.')
        } finally {
            setIsProcessing(false)
        }
    }

    const renderCalendar = () => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        const firstDay = new Date(year, month, 1).getDay()
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const isPast5PMToday = now.getHours() >= 17

        const days = []
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="aspect-square"></div>)
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d)
            const isToday = date.getTime() === todayStart.getTime()
            const isDisabled = date < todayStart || (isToday && isPast5PMToday)
            const isSelected = selectedDate?.getTime() === date.getTime()

            days.push(
                <button
                    key={d}
                    disabled={isDisabled}
                    onClick={() => {
                        setSelectedDate(date)
                        setSelectedTime(null)
                    }}
                    className={`aspect-square flex items-center justify-center rounded-xl font-bold transition-all
            ${isDisabled ? 'text-kb-muted bg-gray-50 cursor-not-allowed opacity-30 shadow-none' : 'hover:bg-sst-primary hover:text-white'}
            ${isSelected ? 'bg-sst-primary text-white shadow-lg' : !isDisabled ? 'bg-white text-sst-primary border-2 border-kb-cream' : ''}
          `}
                >
                    {d}
                </button>
            )
        }
        return days
    }

    if (isSuccess) {
        return (
            <div className="bg-kb-bg min-h-screen py-24 flex items-center justify-center">
                <div className="max-w-2xl w-full mx-4 bg-white p-12 rounded-[2rem] shadow-2xl text-center">
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Check size={48} />
                    </div>
                    <h1 className="text-title mb-6">Booking Confirmed!</h1>
                    <p className="text-kb-dark text-[1.1rem] mb-8">
                        Thank you, <strong>{formData.name}</strong>! Your session for <strong>{selectedService?.name}</strong> is scheduled for <strong>{selectedDate?.toLocaleDateString()}</strong> at <strong>{selectedTime}</strong>.
                    </p>
                    {userId && (
                        <p className="text-sst-primary font-bold mb-8">
                            You've earned {Math.floor(calculateFinalPrice())} reward points from this booking!
                        </p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/" className="px-8 py-4 bg-sst-primary text-white rounded-full font-bold hover:bg-sst-secondary transition-all">
                            Return Home
                        </Link>
                        <button onClick={() => window.location.reload()} className="px-8 py-4 border-2 border-sst-primary text-sst-primary rounded-full font-bold hover:bg-kb-bg transition-all">
                            Book Another
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-kb-bg min-h-screen py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-title text-center mb-16">
                    Book Your Tech Support
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left: Service Selection */}
                    <div className="lg:col-span-4 space-y-6">
                        <h2 className="mb-6">1. Select a Service</h2>
                        {['Standard Support', 'Monthly Memberships', 'Session Packs'].map(category => (
                            <div key={category} className="space-y-4">
                                <h3 className="text-sm font-bold text-kb-muted uppercase tracking-widest">{category}</h3>
                                {SERVICES.filter(s => s.category === category).map(service => (
                                    <button
                                        key={service.id}
                                        onClick={() => setSelectedService(service)}
                                        className={`w-full text-left p-4 md:p-6 rounded-2xl border-2 transition-all group
                      ${selectedService?.id === service.id
                                                ? 'border-sst-primary bg-sst-primary/5 shadow-md'
                                                : 'border-white bg-white hover:border-sst-primary/30'}
                    `}
                                    >
                                        <div className="flex justify-between items-start mb-2 text-sst-primary font-bold">
                                            <span className="text-lg">{service.name}</span>
                                            <span>${service.price}</span>
                                        </div>
                                        <p className="text-sm text-kb-dark leading-relaxed">{service.description}</p>
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Right: Calendar & Details */}
                    <div className="lg:col-span-8">
                        {!selectedService ? (
                            <div className="h-full flex items-center justify-center bg-white/50 rounded-3xl border-2 border-dashed border-kb-cream p-12 text-center">
                                <p className="text-kb-muted text-[1.1rem]">Please select a service to start booking.</p>
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {/* Step 2: Calendar */}
                                <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl">
                                    <h2 className="mb-8">2. Choose Date & Time</h2>

                                    <div className="flex items-center justify-between mb-8">
                                        <button
                                            disabled={currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()}
                                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                                            className="p-2 hover:bg-kb-bg rounded-full transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft size={24} />
                                        </button>
                                        <h3 className="text-h3 font-bold text-sst-primary">
                                            {currentMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                                        </h3>
                                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 hover:bg-kb-bg rounded-full transition-all">
                                            <ChevronRight size={24} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-7 gap-2 mb-8">
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                            <div key={d} className="text-center text-xs font-bold text-kb-muted uppercase pb-4">{d}</div>
                                        ))}
                                        {renderCalendar()}
                                    </div>

                                    {selectedDate && (
                                        <div className="pt-8 border-t border-kb-cream">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="font-bold text-sst-primary">Available Times for {selectedDate.toLocaleDateString()}</h3>
                                                {isLoadingConflicts && (
                                                    <div className="flex items-center gap-2 text-kb-muted text-sm">
                                                        <Loader2 className="animate-spin" size={16} />
                                                        Checking availability...
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                                {TIME_SLOTS.map(time => {
                                                    const [timePart, modifier] = time.split(' ');
                                                    let [hours, minutes] = timePart.split(':').map(Number);
                                                    if (hours === 12 && modifier === 'AM') hours = 0;
                                                    if (hours < 12 && modifier === 'PM') hours += 12;
 
                                                    const slotDate = new Date(selectedDate);
                                                    slotDate.setHours(hours, minutes, 0, 0);
 
                                                    const now = new Date();
                                                    const isPast = slotDate < now;
                                                    const isTaken = busySlots.includes(time);
 
                                                    return (
                                                        <button
                                                            key={time}
                                                            disabled={isPast || isTaken || isLoadingConflicts}
                                                            onClick={() => setSelectedTime(time)}
                                                            className={`py-3 rounded-xl font-bold transition-all border-2 relative
                                                                ${(isPast || isTaken) ? 'text-kb-muted bg-gray-50 border-gray-200 cursor-not-allowed opacity-50' :
                                                                    selectedTime === time ? 'bg-sst-primary text-white border-sst-primary shadow-lg' : 'bg-white text-sst-primary border-kb-cream hover:border-sst-primary/50'}
                                                            `}
                                                        >
                                                            {time}
                                                            {isTaken && !isPast && (
                                                                <span className="absolute -top-2 -right-1 bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full border border-red-200">Taken</span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Step 3: Details & Payment */}
                                {selectedTime && (
                                    <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl">
                                        <h2 className="mb-8">3. Your Information</h2>
                                        {showReview ? (
                                            <div className="space-y-8">
                                                <div className="bg-kb-bg/50 p-8 rounded-3xl space-y-4">
                                                    <h3 className="mb-4">Review Your Booking</h3>
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <span className="text-kb-muted">Service:</span> <span className="font-bold">{selectedService.name}</span>
                                                        <span className="text-kb-muted">Date:</span> <span className="font-bold">{selectedDate?.toLocaleDateString()}</span>
                                                        <span className="text-kb-muted">Time:</span> <span className="font-bold">{selectedTime}</span>
                                                        <span className="text-kb-muted">Location:</span> <span className="font-bold">{formData.location}</span>
                                                        <span className="text-kb-muted">Subtotal:</span> <span className="font-bold">${selectedService.price}</span>
                                                        {appliedDiscount && (
                                                            <>
                                                                <span className="text-green-600 font-bold">Discount ({appliedDiscount.percent}% off):</span>
                                                                <span className="text-green-600 font-bold">-${(selectedService.price * appliedDiscount.percent / 100).toFixed(2)}</span>
                                                            </>
                                                        )}
                                                        <span className="text-kb-muted border-t border-kb-cream pt-4 mt-2">Total:</span>
                                                        <span className="text-xl font-bold text-sst-primary border-t border-kb-cream pt-4 mt-2">
                                                            ${calculateFinalPrice()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div id="paypal-button-container" className="min-h-[150px]"></div>
                                                <button onClick={() => setShowReview(false)} className="w-full py-4 text-kb-muted font-bold hover:text-sst-primary transition-all underline">Edit Details</button>
                                            </div>
                                        ) : (
                                            <form onSubmit={(e) => { e.preventDefault(); setShowReview(true) }} className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sst-primary font-bold mb-2">Name *</label>
                                                        <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sst-primary font-bold mb-2">Email *</label>
                                                        <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sst-primary font-bold mb-2">Phone *</label>
                                                    <input required type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all" />
                                                </div>

                                                {/* Device Selection */}
                                                {userId && userDevices.length > 0 && (
                                                    <div className="bg-kb-bg/30 p-6 rounded-2xl border-2 border-kb-cream">
                                                        <label className="block text-sst-primary font-bold mb-4 flex items-center gap-2">
                                                            <Laptop size={18} /> Which device needs help? *
                                                        </label>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {userDevices.map(device => {
                                                                const isSelected = selectedDeviceId === device.id
                                                                const Icon = device.device_type?.toLowerCase().includes('phone') ? Smartphone 
                                                                           : device.device_type?.toLowerCase().includes('tablet') ? Tablet
                                                                           : device.device_type?.toLowerCase().includes('desktop') ? Monitor
                                                                           : Laptop
                                                                
                                                                return (
                                                                    <button
                                                                        key={device.id}
                                                                        type="button"
                                                                        onClick={() => setSelectedDeviceId(device.id)}
                                                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
                                                                            ${isSelected ? 'border-sst-primary bg-white shadow-md' : 'border-white bg-white hover:border-sst-primary/30'}
                                                                        `}
                                                                    >
                                                                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-sst-primary text-white' : 'bg-kb-bg text-kb-muted'}`}>
                                                                            <Icon size={20} />
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-sm text-kb-navy leading-none mb-1">{device.device_name || device.model}</p>
                                                                            <p className="text-xs text-kb-muted">{device.brand} {device.model}</p>
                                                                        </div>
                                                                        {isSelected && <Check size={16} className="ml-auto text-sst-primary" />}
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                        <Link href="/my-devices" className="inline-block mt-4 text-xs font-bold text-kb-muted hover:text-sst-primary underline transition-all">
                                                            + Add/Manage Devices
                                                        </Link>
                                                    </div>
                                                )}

                                                {/* Discount Code Section */}
                                                {userId && (
                                                    <div className="bg-sst-primary/5 p-6 rounded-2xl border-2 border-dashed border-sst-primary/20">
                                                        <label className="block text-sst-primary font-bold mb-2 flex items-center gap-2">
                                                            <Ticket size={18} /> Have a discount code?
                                                        </label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={discountCode}
                                                                onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                                                                placeholder="Enter code"
                                                                className="flex-1 px-5 py-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-sst-primary transition-all uppercase"
                                                                disabled={!!appliedDiscount}
                                                            />
                                                            {appliedDiscount ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { setAppliedDiscount(null); setDiscountCode('') }}
                                                                    className="px-6 py-3 bg-sst-primary/10 text-sst-primary font-bold rounded-xl hover:bg-sst-primary/20 transition-all flex items-center gap-2"
                                                                >
                                                                    <XCircle size={18} /> Remove
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={handleApplyDiscount}
                                                                    disabled={!discountCode || isValidatingDiscount}
                                                                    className="px-6 py-3 bg-sst-primary text-white font-bold rounded-xl hover:bg-sst-secondary transition-all disabled:opacity-50"
                                                                >
                                                                    {isValidatingDiscount ? <Loader2 className="animate-spin" size={20} /> : 'Apply'}
                                                                </button>
                                                            )}
                                                        </div>
                                                        {appliedDiscount && (
                                                            <p className="text-green-600 text-sm font-bold mt-2 flex items-center gap-1">
                                                                <Check size={16} /> Code applied: {appliedDiscount.percent}% off your session!
                                                            </p>
                                                        )}
                                                        {discountError && (
                                                            <p className="text-red-500 text-sm font-bold mt-2 flex items-center gap-1">
                                                                <XCircle size={16} /> {discountError}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                <div>
                                                    <label className="block text-sst-primary font-bold mb-2">Location Preference *</label>
                                                    <select required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all">
                                                        <option value="">Select...</option>
                                                        <option value="home">At my home (Rochester area)</option>
                                                        <option value="remote">Remote over Zoom</option>
                                                        <option value="public">Local public place</option>
                                                    </select>
                                                </div>
                                                {formData.location === 'home' && (
                                                    <div className="relative" ref={autocompleteRef}>
                                                        <label className="block text-sst-primary font-bold mb-2">Service Address *</label>
                                                        <div className="relative">
                                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-kb-muted" size={20} />
                                                            <input
                                                                required
                                                                type="text"
                                                                value={addressQuery}
                                                                onChange={e => {
                                                                    setAddressQuery(e.target.value)
                                                                    setShowSuggestions(true)
                                                                }}
                                                                onFocus={() => setShowSuggestions(true)}
                                                                placeholder="Enter your street address"
                                                                className="w-full pl-12 pr-12 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all"
                                                                autoComplete="off"
                                                            />
                                                            {addressQuery && (
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setAddressQuery('')
                                                                        setFormData(f => ({ ...f, address: '' }))
                                                                        setAddressSuggestions([])
                                                                    }}
                                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-kb-muted hover:text-red-500 transition-colors"
                                                                >
                                                                    <XCircle size={20} />
                                                                </button>
                                                            )}
                                                        </div>

                                                        {showSuggestions && (addressSuggestions.length > 0 || isSearchingAddress) && (
                                                            <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-kb-cream overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                                {isSearchingAddress ? (
                                                                    <div className="p-4 flex items-center justify-center gap-2 text-kb-muted">
                                                                        <Loader2 className="animate-spin" size={16} />
                                                                        <span>Searching addresses...</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="max-h-64 overflow-y-auto">
                                                                        {addressSuggestions.map((suggestion, index) => (
                                                                            <button
                                                                                key={index}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setAddressQuery(suggestion.formatted)
                                                                                    setFormData({ ...formData, address: suggestion.formatted })
                                                                                    setShowSuggestions(false)
                                                                                }}
                                                                                className="w-full px-5 py-4 text-left hover:bg-gray-50 flex items-start gap-3 transition-colors border-b border-kb-cream last:border-none"
                                                                            >
                                                                                <MapPin className="mt-1 text-sst-primary flex-shrink-0" size={16} />
                                                                                <div>
                                                                                    <p className="text-[1rem] font-bold text-kb-navy leading-tight line-clamp-2">
                                                                                        {suggestion.formatted}
                                                                                    </p>
                                                                                </div>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div>
                                                    <label className="block text-sst-primary font-bold mb-2">Notes</label>
                                                    <AutoResizingTextarea 
                                                        value={formData.notes} 
                                                        onChange={e => setFormData({ ...formData, notes: e.target.value })} 
                                                        className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all" 
                                                        placeholder="Special instructions or additional details..."
                                                    />
                                                </div>
                                                <button type="submit" className="w-full py-5 bg-sst-primary text-white font-bold rounded-2xl hover:bg-sst-secondary transition-all shadow-xl text-lg">
                                                    Continue to Payment
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function BookingPage() {
    return (
        <Suspense fallback={
            <div className="bg-kb-bg min-h-screen py-24 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-sst-primary mb-4" size={48} />
                <p className="text-kb-muted font-bold">Loading booking experience...</p>
            </div>
        }>
            <BookingContent />
        </Suspense>
    )
}
