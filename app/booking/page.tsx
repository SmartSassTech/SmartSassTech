'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, Check, MapPin, Loader2 } from 'lucide-react'

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

export default function BookingPage() {
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        location: '',
        address: '',
        notes: ''
    })

    // Address Autocomplete State
    const [addressQuery, setAddressQuery] = useState('')
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
    const [isSearchingAddress, setIsSearchingAddress] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const autocompleteRef = useRef<HTMLDivElement>(null)

    const [isProcessing, setIsProcessing] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [showReview, setShowReview] = useState(false)

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
                // Nominatim API: https://nominatim.org/release-docs/develop/api/Search/
                // We use addressdetails=1 and format=json. 
                // Using countrycodes=us limits to US, remove or change if needed.
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&addressdetails=1&limit=5&countrycodes=us`,
                    {
                        headers: {
                            'Accept-Language': 'en-US,en;q=0.9',
                            // It's good practice to provide a User-Agent identifying your app
                            'User-Agent': 'SmartSassTech-BookingApp/1.0'
                        }
                    }
                )
                const data = await response.json()
                setAddressSuggestions(data)
            } catch (error) {
                console.error("Error fetching addresses:", error)
            } finally {
                setIsSearchingAddress(false)
            }
        }

        const timeoutId = setTimeout(fetchAddresses, 500) // 500ms debounce
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

    const renderPayPalButton = () => {
        if (!(window as any).paypal || !selectedService) return

        // Clear previous button if any
        const container = document.getElementById('paypal-button-container')
        if (container) container.innerHTML = '';

        (window as any).paypal.Buttons({
            createOrder: (data: any, actions: any) => {
                return actions.order.create({
                    purchase_units: [{
                        amount: { value: selectedService.price.toString() },
                        description: `${selectedService.name} - SmartSass Tech`
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
        try {
            const { error } = await supabase
                .from('bookings')
                .insert([{
                    customer_name: formData.name,
                    customer_email: formData.email,
                    customer_phone: formData.phone,
                    customer_address: formData.address,
                    location_preference: formData.location,
                    service_name: selectedService?.name,
                    booking_date: selectedDate?.toISOString().split('T')[0],
                    booking_time: selectedTime,
                    duration: selectedService?.duration,
                    price: selectedService?.price,
                    notes: formData.notes,
                    payment_status: 'completed',
                    paypal_order_id: orderId
                }])

            if (error) throw error

            // Trigger notification (Optional: in a real app, use a server component or Edge function)
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
                    price: `$${selectedService?.price}`,
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
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const days = []
        // Empty cells
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="aspect-square"></div>)
        }
        // Month days
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d)
            const isDisabled = date < today
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
            ${isDisabled ? 'text-kb-muted bg-gray-50 cursor-not-allowed' : 'hover:bg-sst-primary hover:text-white'}
            ${isSelected ? 'bg-sst-primary text-white shadow-lg' : 'bg-white text-sst-primary border-2 border-kb-cream'}
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
                                        className={`w-full text-left p-6 rounded-2xl border-2 transition-all group
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
                                        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-2 hover:bg-kb-bg rounded-full transition-all">
                                            <ChevronLeft size={24} />
                                        </button>
                                        <h3 className="text-h3 font-bold text-sst-primary">
                                            {currentMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                                        </h3>
                                        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-2 hover:bg-kb-bg rounded-full transition-all">
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
                                            <h3 className="font-bold text-sst-primary mb-6">Available Times for {selectedDate.toLocaleDateString()}</h3>
                                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                                {TIME_SLOTS.map(time => {
                                                    // Parse the time slot string (e.g., "9:00 AM") into a Date object for today
                                                    const [timePart, modifier] = time.split(' ');
                                                    let [hours, minutes] = timePart.split(':').map(Number);
                                                    if (hours === 12 && modifier === 'AM') hours = 0;
                                                    if (hours < 12 && modifier === 'PM') hours += 12;

                                                    const slotDate = new Date(selectedDate);
                                                    slotDate.setHours(hours, minutes, 0, 0);

                                                    const now = new Date();
                                                    // Add a 1-hour buffer (optional: if you want them to book at least 1 hour in advance)
                                                    // now.setHours(now.getHours() + 1); 

                                                    const isPast = slotDate < now;

                                                    return (
                                                        <button
                                                            key={time}
                                                            disabled={isPast}
                                                            onClick={() => setSelectedTime(time)}
                                                            className={`py-3 rounded-xl font-bold transition-all border-2
                                                                ${isPast ? 'text-kb-muted bg-gray-50 border-gray-200 cursor-not-allowed opacity-50' :
                                                                    selectedTime === time ? 'bg-sst-primary text-white border-sst-primary shadow-lg' : 'bg-white text-sst-primary border-kb-cream hover:border-sst-primary/50'}
                                                            `}
                                                        >
                                                            {time}
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
                                                        <span className="text-kb-muted">Total:</span> <span className="text-lg font-bold text-sst-primary">${selectedService.price}</span>
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
                                                        <label className="block text-sst-primary font-bold mb-2">Address *</label>
                                                        <div className="relative">
                                                            <input
                                                                required
                                                                type="text"
                                                                value={addressQuery}
                                                                onChange={e => {
                                                                    setAddressQuery(e.target.value)
                                                                    setFormData({ ...formData, address: e.target.value })
                                                                    setShowSuggestions(true)
                                                                }}
                                                                onFocus={() => setShowSuggestions(true)}
                                                                className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all pr-12"
                                                                placeholder="Start typing your address..."
                                                                autoComplete="off"
                                                            />
                                                            {isSearchingAddress && (
                                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sst-primary">
                                                                    <Loader2 className="animate-spin" size={20} />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Autocomplete Dropdown */}
                                                        {showSuggestions && addressSuggestions.length > 0 && (
                                                            <div className="absolute z-50 w-full mt-2 bg-white border border-kb-cream rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                                                {addressSuggestions.map((place: any) => (
                                                                    <button
                                                                        key={place.place_id}
                                                                        type="button"
                                                                        className="w-full text-left px-5 py-3 hover:bg-kb-bg transition-colors flex items-start gap-3 border-b border-kb-cream last:border-none"
                                                                        onClick={() => {
                                                                            const formattedAddress = place.display_name;
                                                                            setAddressQuery(formattedAddress)
                                                                            setFormData({ ...formData, address: formattedAddress })
                                                                            setShowSuggestions(false)
                                                                        }}
                                                                    >
                                                                        <MapPin className="text-sst-primary shrink-0 mt-0.5" size={18} />
                                                                        <div>
                                                                            <span className="text-kb-dark font-medium block">{place.address?.road || place.name} {place.address?.house_number}</span>
                                                                            <span className="text-xs text-kb-muted">{place.address?.city || place.address?.town}, {place.address?.state} {place.address?.postcode}</span>
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                                <div className="px-5 py-2 text-[10px] text-right text-kb-muted bg-gray-50 rounded-b-2xl border-t border-kb-cream">
                                                                    Results by OpenStreetMap
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div>
                                                    <label className="block text-sst-primary font-bold mb-2">Notes</label>
                                                    <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all" rows={3}></textarea>
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
