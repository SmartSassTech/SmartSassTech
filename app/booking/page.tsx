'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Check, MapPin, Laptop, Calendar, Clock, Video, Loader2 } from 'lucide-react'

const ALL_TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
]

// Generate available days starting with Today (if before 5pm)
function getAvailableDates(): Date[] {
  const dates: Date[] = []
  const today = new Date()
  
  // Include Today if it's before 5:00 PM (17:00) and not Sunday
  if (today.getHours() < 17 && today.getDay() !== 0) {
    dates.push(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
  }

  let current = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

  while (dates.length < 10) {
    if (current.getDay() !== 0) { // Skip Sunday
      dates.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }
  return dates
}

// Convert 12h time string like "1:00 PM" to 24h hour number (e.g. 13)
function parseHour(timeStr: string): number {
  const [time, period] = timeStr.split(' ')
  let [hours] = time.split(':').map(Number)
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  return hours
}

function formatPhoneDisplay(phone: string): string {
  if (!phone) return '(585) 645-4549'
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  return phone
}

function BookingContent() {
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type')
  const initialNote = searchParams.get('note')

  const [step, setStep] = useState<1 | 2 | 3>(() => {
    return (initialType === 'in-home' || initialType === 'remote') ? 2 : 1
  })

  const [serviceType, setServiceType] = useState<'in-home' | 'remote' | null>(() => {
    if (initialType === 'in-home') return 'in-home'
    if (initialType === 'remote') return 'remote'
    return null
  })

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availableDates, setAvailableDates] = useState<Date[]>([])

  // Remote support video questions state
  const [remotePlatform, setRemotePlatform] = useState('')
  const [knowsRemoteEmail, setKnowsRemoteEmail] = useState<'yes' | 'no' | ''>('')
  const [remoteEmailDetails, setRemoteEmailDetails] = useState('')

  // Payment preference state
  const [paymentOption, setPaymentOption] = useState<'later' | 'now'>('later')

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: initialNote ? `Topic: ${initialNote}` : ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // PayPal SDK state
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const paypalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setAvailableDates(getAvailableDates())
    // Pre-fill user details if logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setFormData(prev => ({ ...prev, email: session.user.email || '' }))
        supabase.from('profiles').select('first_name, last_name, Phone, address').eq('id', session.user.id).single().then(({ data }) => {
          if (data) {
            setFormData(prev => ({
              ...prev,
              name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
              phone: data.Phone || prev.phone,
              address: data.address || prev.address
            }))
          }
        })
      }
    })
  }, [])

  // Filter time slots for Today (remove past hours)
  const getFilteredTimeSlots = () => {
    if (!selectedDate) return ALL_TIME_SLOTS
    const now = new Date()
    const isToday = selectedDate.toDateString() === now.toDateString()

    if (!isToday) return ALL_TIME_SLOTS

    const currentHour = now.getHours()
    return ALL_TIME_SLOTS.filter(slot => {
      const slotHour = parseHour(slot)
      return slotHour > currentHour
    })
  }

  const priceAmount = 50

  // Load PayPal SDK script when Pay Now is selected on Step 3
  useEffect(() => {
    if (step === 3 && paymentOption === 'now') {
      const scriptId = 'paypal-sdk-script'
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script')
        script.id = scriptId
        script.src = `https://www.paypal.com/sdk/js?client-id=ARhtuqRS37ANHmiyROX4hINDcYfo6ICe9inMbshgQvhqtnQqNQZ52mqyXi-Rg-pzaFw8U2w8SqkEkvHI&currency=USD`
        script.async = true
        script.onload = () => {
          setPaypalLoaded(true)
        }
        document.body.appendChild(script)
      } else {
        setPaypalLoaded(true)
      }
    }
  }, [step, paymentOption])

  // Render PayPal buttons inside container
  useEffect(() => {
    if (step === 3 && paymentOption === 'now' && paypalLoaded && (window as any).paypal && paypalRef.current) {
      paypalRef.current.innerHTML = ''
      try {
        (window as any).paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal'
          },
          createOrder: (_data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{
                description: `SmartSass Tech ${serviceType === 'in-home' ? 'In-Home Visit' : 'Remote Support'} Session`,
                amount: {
                  value: priceAmount.toFixed(2)
                }
              }]
            })
          },
          onApprove: async (_data: any, actions: any) => {
            await actions.order.capture()
            completeBooking('Paid Online via PayPal')
          },
          onError: (err: any) => {
            console.error('PayPal transaction error:', err)
            setErrorMsg('PayPal transaction could not be completed. Please try Pay Later or call us.')
          }
        }).render(paypalRef.current)
      } catch (err) {
        console.error('PayPal render error:', err)
      }
    }
  }, [step, paymentOption, paypalLoaded, serviceType])

  const completeBooking = async (paymentNote: string) => {
    setIsSubmitting(true)
    setErrorMsg('')

    const dateFormatted = selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''
    const serviceName = serviceType === 'in-home' ? 'In-Home Visit ($50/hr)' : 'Remote Support ($50/hr)'

    const remoteInfoFormatted = serviceType === 'remote' ? `
Video Calling Platform: ${remotePlatform || 'Not specified'}
Knows Video Account Email: ${knowsRemoteEmail || 'Not specified'}
Video Account Email: ${remoteEmailDetails || 'Needs help / None provided'}
` : ''

    try {
      // 1. Send email notification via contact API
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          cityZip: formData.address || 'Remote Support',
          serviceType: serviceType,
          remotePlatform,
          knowsRemoteEmail,
          remoteEmailDetails,
          message: `[BOOKING REQUEST]
Service: ${serviceName}
Requested Date: ${dateFormatted} at ${selectedTime}
Payment Method: ${paymentNote}
${remoteInfoFormatted}
Customer Email: ${formData.email || 'N/A'}
Service Address: ${formData.address || 'N/A'}
Notes: ${formData.notes || 'None'}`
        })
      })

      // 2. Insert booking into Supabase
      try {
        const { data: { session } } = await supabase.auth.getSession()
        await supabase.from('bookings').insert([{
          user_id: session?.user?.id || null,
          service_name: serviceName,
          booking_date: selectedDate?.toISOString().split('T')[0],
          booking_time: selectedTime,
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_email: formData.email || 'client@smartsasstech.com',
          customer_address: formData.address || (serviceType === 'in-home' ? 'Rochester, NY' : 'Remote'),
          location_preference: serviceType,
          duration: 60,
          price: priceAmount,
          actual_duration: '60',
          notes: `${formData.notes || ''} | ${paymentNote}`,
          payment_status: paymentOption === 'now' ? 'paid' : 'pending',
          service_status: 'scheduled'
        }])
      } catch (dbErr) {
        console.warn('Database booking save fallback:', dbErr)
      }

      setIsSuccess(true)
    } catch (err: any) {
      console.error(err)
      setErrorMsg('Failed to process request. Please call us at (585) 645-4549 to book directly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serviceType || !selectedDate || !selectedTime || !formData.name || !formData.phone) {
      setErrorMsg('Please complete all required fields.')
      return
    }

    if (serviceType === 'in-home' && !formData.address) {
      setErrorMsg('Please enter your home address for in-home visits.')
      return
    }

    if (paymentOption === 'now') {
      // User is paying online via PayPal button container; return early so they complete PayPal flow
      return
    }

    completeBooking('Pay Later (Cash, Check, or Card in Person)')
  }

  if (isSuccess) {
    return (
      <main id="main-content" className="min-h-screen bg-sst-bg-light py-12 md:py-20 px-4">
        <div className="max-w-2xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={48} strokeWidth={3} />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-sst-primary mb-4">
            Booking Request Received!
          </h1>
          <p className="text-xl text-sst-dark leading-relaxed mb-6">
            Thank you, <strong>{formData.name}</strong>. We have reserved your requested <strong>{serviceType === 'in-home' ? 'In-Home Visit' : 'Remote Support'}</strong> on:
          </p>
          
          <div className="bg-sst-primary/5 p-6 rounded-2xl border border-sst-primary/20 text-center mb-6">
            <p className="text-2xl font-bold text-sst-primary mb-1">
              {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            <p className="text-xl font-semibold text-sst-dark">
              at {selectedTime}
            </p>
          </div>

          {/* Payment & Video Call Reassurance */}
          <div className="space-y-4 text-left bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-8 text-sst-dark text-base leading-relaxed">
            <p>
              <strong>Payment Status:</strong> {paymentOption === 'now' ? 'Paid Online via PayPal' : 'Pay Later (Cash, Check, or Credit Card at the time of service)'}
            </p>
            {serviceType === 'remote' && knowsRemoteEmail === 'no' && (
              <p className="text-sst-primary font-medium">
                💡 <strong>Video Account Note:</strong> Since you're not sure about your video calling account details, don't worry — we will call you directly by phone to help get that set up before our appointment!
              </p>
            )}
            <p>
              📞 <strong>What happens next?</strong> We will call you at <strong>{formatPhoneDisplay(formData.phone)}</strong> to confirm your appointment time and answer any questions.
            </p>
          </div>

          <Link href="/" className="inline-flex items-center justify-center min-h-[56px] px-8 bg-sst-primary hover:bg-sst-primary-dark text-white font-bold text-lg rounded-full hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 shadow-md">
            Return to Homepage
          </Link>
        </div>
      </main>
    )
  }

  const activeSlots = getFilteredTimeSlots()

  return (
    <main id="main-content" className="min-h-screen bg-sst-bg-light py-12 md:py-20 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Title Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-extrabold text-sst-primary mb-3">
            Schedule Your Tech Help
          </h1>
          <p className="text-xl text-sst-dark max-w-xl mx-auto">
            Easy 3-step booking for patient in-home or remote technology support.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 flex items-center justify-between">
          <div className={`flex items-center gap-2 font-bold text-lg ${step === 1 ? 'text-sst-primary' : 'text-gray-500'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-base ${step === 1 ? 'bg-sst-primary text-white' : 'bg-gray-100 text-gray-600'}`}>1</span>
            <span className="hidden sm:inline">Choose Service</span>
          </div>
          <div className="h-0.5 bg-gray-200 flex-1 mx-4"></div>
          <div className={`flex items-center gap-2 font-bold text-lg ${step === 2 ? 'text-sst-primary' : 'text-gray-500'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-base ${step === 2 ? 'bg-sst-primary text-white' : 'bg-gray-100 text-gray-600'}`}>2</span>
            <span className="hidden sm:inline">Date & Time</span>
          </div>
          <div className="h-0.5 bg-gray-200 flex-1 mx-4"></div>
          <div className={`flex items-center gap-2 font-bold text-lg ${step === 3 ? 'text-sst-primary' : 'text-gray-500'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-base ${step === 3 ? 'bg-sst-primary text-white' : 'bg-gray-100 text-gray-600'}`}>3</span>
            <span className="hidden sm:inline">Details & Payment</span>
          </div>
        </div>

        {/* STEP 1: Choose Service */}
        {step === 1 && (
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-md border border-gray-100 space-y-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-sst-primary text-center mb-6">
              Step 1: How would you like to meet?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* In-Home Visit Option */}
              <button
                type="button"
                onClick={() => setServiceType('in-home')}
                aria-pressed={serviceType === 'in-home'}
                className={`p-6 md:p-8 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between hover:-translate-y-1 ${
                  serviceType === 'in-home'
                    ? 'border-sst-primary bg-sst-primary/5 shadow-md ring-2 ring-sst-primary/20'
                    : 'border-gray-200 hover:border-sst-primary/50 bg-white hover:shadow-md'
                }`}
              >
                <div>
                  <div className="w-14 h-14 bg-sst-primary/10 text-sst-primary rounded-xl flex items-center justify-center mb-4">
                    <MapPin size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-sst-primary mb-2">In-Home Visit</h3>
                  <p className="text-sst-dark text-base leading-relaxed mb-4">
                    We come directly to your home in Rochester and Monroe County to help with setup, troubleshooting, and lessons.
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-sst-primary">$50 / hr</span>
                  {serviceType === 'in-home' && <Check className="text-sst-primary" size={28} />}
                </div>
              </button>

              {/* Remote Support Option */}
              <button
                type="button"
                onClick={() => setServiceType('remote')}
                aria-pressed={serviceType === 'remote'}
                className={`p-6 md:p-8 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between hover:-translate-y-1 ${
                  serviceType === 'remote'
                    ? 'border-sst-primary bg-sst-primary/5 shadow-md ring-2 ring-sst-primary/20'
                    : 'border-gray-200 hover:border-sst-primary/50 bg-white hover:shadow-md'
                }`}
              >
                <div>
                  <div className="w-14 h-14 bg-sst-primary/10 text-sst-primary rounded-xl flex items-center justify-center mb-4">
                    <Laptop size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-sst-primary mb-2">Remote Support</h3>
                  <p className="text-sst-dark text-base leading-relaxed mb-4">
                    Technology assistance over the phone or Zoom. Perfect for quick software fixes, email questions, and general guidance.
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-sst-primary">$50 / hr</span>
                  {serviceType === 'remote' && <Check className="text-sst-primary" size={28} />}
                </div>
              </button>
            </div>

            <button
              type="button"
              disabled={!serviceType}
              onClick={() => setStep(2)}
              className="w-full min-h-[56px] mt-6 bg-sst-primary hover:bg-sst-primary-dark text-white font-bold text-xl rounded-xl hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Continue to Step 2 &rarr;
            </button>
          </div>
        )}

        {/* STEP 2: Choose Date & Hourly Time Slot */}
        {step === 2 && (
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-md border border-gray-100 space-y-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-sst-primary text-center mb-6">
              Step 2: Select Date & Hourly Time
            </h2>

            {/* Date Selection */}
            <div>
              <label className="block text-lg font-bold text-sst-dark mb-3 flex items-center gap-2">
                <Calendar size={22} className="text-sst-primary" /> Select a Day:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {availableDates.map((d, i) => {
                  const isSelected = selectedDate?.toDateString() === d.toDateString()
                  const isToday = d.toDateString() === new Date().toDateString()
                  const dayName = isToday ? 'TODAY' : d.toLocaleDateString('en-US', { weekday: 'short' })
                  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedDate(d)
                        setSelectedTime(null)
                      }}
                      aria-pressed={isSelected}
                      className={`p-3 min-h-[48px] rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-sst-primary bg-sst-primary text-white shadow-md font-bold'
                          : isToday
                          ? 'border-sst-primary bg-sst-primary/10 text-sst-primary font-bold hover:bg-sst-primary/20'
                          : 'border-gray-200 bg-white text-sst-dark hover:border-sst-primary/50'
                      }`}
                    >
                      <div className="text-sm uppercase font-semibold">{dayName}</div>
                      <div className="text-lg font-bold">{dateStr}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Hourly Time Slot Selection */}
            {selectedDate && (
              <div>
                <label className="block text-lg font-bold text-sst-dark mb-3 flex items-center gap-2">
                  <Clock size={22} className="text-sst-primary" /> Select an Hour:
                </label>
                {activeSlots.length === 0 ? (
                  <p className="text-red-600 font-bold p-4 bg-red-50 rounded-xl">
                    No remaining time slots available for today. Please select a different day above!
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {activeSlots.map((t, i) => {
                      const isSelected = selectedTime === t
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedTime(t)}
                          aria-pressed={isSelected}
                          className={`p-3 min-h-[48px] rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'border-sst-primary bg-sst-primary text-white shadow-md font-bold'
                              : 'border-gray-200 bg-white text-sst-dark hover:border-sst-primary/50'
                          }`}
                        >
                          <div className="text-base font-bold">{t}</div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 min-h-[56px] bg-gray-100 hover:bg-gray-200 text-sst-dark font-bold text-lg rounded-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
              >
                &larr; Back
              </button>
              <button
                type="button"
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(3)}
                className="flex-1 min-h-[56px] bg-sst-primary hover:bg-sst-primary-dark text-white font-bold text-lg rounded-xl hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Continue to Step 3 &rarr;
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Enter Details & Payment Choice */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-3xl shadow-md border border-gray-100 space-y-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-sst-primary text-center mb-6">
              Step 3: Contact Info & Payment Option
            </h2>

            {/* Summary Box */}
            <div className="bg-sst-primary/5 p-4 rounded-xl border border-sst-primary/20 text-sst-dark text-sm md:text-base flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <strong>Selected:</strong> {serviceType === 'in-home' ? 'In-Home Visit ($50/hr)' : 'Remote Support ($50/hr)'}
                <br />
                <strong>Date & Time:</strong> {selectedDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {selectedTime}
              </div>
              <button type="button" onClick={() => setStep(2)} className="text-sst-primary font-bold hover:underline text-sm">Change</button>
            </div>

            {/* Remote Support Video Call Questions */}
            {serviceType === 'remote' && (
              <div className="p-4 bg-sst-primary/5 rounded-2xl border border-sst-primary/20 space-y-4">
                <h3 className="font-bold text-sst-primary text-lg flex items-center gap-2">
                  <Video size={20} /> Remote Video Call Details
                </h3>
                
                <div>
                  <label className="block text-sm font-bold text-sst-dark mb-1">
                    Which video calling platform do you use?
                  </label>
                  <select
                    value={remotePlatform}
                    onChange={(e) => setRemotePlatform(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 bg-white focus:border-sst-primary focus:ring-2 focus:ring-sst-primary/20 outline-none"
                  >
                    <option value="">Select platform...</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Google Meet">Google Meet</option>
                    <option value="FaceTime">FaceTime (Apple)</option>
                    <option value="Skype">Skype</option>
                    <option value="Not Sure / Need Help">I'm not sure / need help setting up</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-sst-dark mb-2">
                    Do you know the email address associated with your video account?
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sst-dark text-sm">
                      <input
                        type="radio"
                        name="knowsEmailBooking"
                        value="yes"
                        checked={knowsRemoteEmail === 'yes'}
                        onChange={() => setKnowsRemoteEmail('yes')}
                        className="w-4 h-4 text-sst-primary"
                      />
                      <span>Yes, I know my video calling account email</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sst-dark text-sm">
                      <input
                        type="radio"
                        name="knowsEmailBooking"
                        value="no"
                        checked={knowsRemoteEmail === 'no'}
                        onChange={() => setKnowsRemoteEmail('no')}
                        className="w-4 h-4 text-sst-primary"
                      />
                      <span>No, I don't know my email / need help finding it</span>
                    </label>
                  </div>
                </div>

                {knowsRemoteEmail === 'yes' && (
                  <div>
                    <label htmlFor="remoteEmailDetails" className="block text-sm font-bold text-sst-dark mb-1">
                      Video Calling Email Address (if available)
                    </label>
                    <input
                      type="email"
                      id="remoteEmailDetails"
                      value={remoteEmailDetails}
                      onChange={(e) => setRemoteEmailDetails(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 bg-white focus:border-sst-primary focus:ring-2 focus:ring-sst-primary/20 outline-none"
                      placeholder="e.g. mary@gmail.com"
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-base font-bold text-sst-dark mb-1">Your Full Name *</label>
              <input
                type="text"
                id="name"
                required
                autoComplete="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 text-lg rounded-xl border border-gray-300 text-gray-900 bg-white focus:border-sst-primary focus:ring-2 focus:ring-sst-primary/20 outline-none transition-all"
                placeholder="e.g. Mary Smith"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="phone" className="block text-base font-bold text-sst-dark mb-1">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  required
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: formatPhoneDisplay(e.target.value) })}
                  className="w-full px-4 py-3 text-lg rounded-xl border border-gray-300 text-gray-900 bg-white focus:border-sst-primary focus:ring-2 focus:ring-sst-primary/20 outline-none transition-all"
                  placeholder="(585) 645-4549"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-base font-bold text-sst-dark mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  id="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 text-lg rounded-xl border border-gray-300 text-gray-900 bg-white focus:border-sst-primary focus:ring-2 focus:ring-sst-primary/20 outline-none transition-all"
                  placeholder="e.g. mary@gmail.com"
                />
              </div>
            </div>

            {serviceType === 'in-home' && (
              <div>
                <label htmlFor="address" className="block text-base font-bold text-sst-dark mb-1">Street Address for In-Home Visit *</label>
                <input
                  type="text"
                  id="address"
                  required
                  autoComplete="street-address"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 text-lg rounded-xl border border-gray-300 text-gray-900 bg-white focus:border-sst-primary focus:ring-2 focus:ring-sst-primary/20 outline-none transition-all"
                  placeholder="e.g. 123 Main St, Fairport, NY 14450"
                />
              </div>
            )}

            {/* Payment Preference Selection */}
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
              <label className="block text-base font-bold text-sst-dark">
                Payment Method *
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-xl bg-white cursor-pointer hover:bg-sst-bg-light hover:border-sst-primary/40 transition-all duration-200">
                  <input
                    type="radio"
                    name="paymentPref"
                    value="later"
                    checked={paymentOption === 'later'}
                    onChange={() => setPaymentOption('later')}
                    className="w-5 h-5 text-sst-primary"
                  />
                  <div>
                    <span className="font-bold text-sst-dark block text-base">Pay Later (Recommended)</span>
                    <span className="text-xs text-gray-600">Pay in person after session via Cash, Check, or Credit Card</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-xl bg-white cursor-pointer hover:bg-sst-bg-light hover:border-sst-primary/40 transition-all duration-200">
                  <input
                    type="radio"
                    name="paymentPref"
                    value="now"
                    checked={paymentOption === 'now'}
                    onChange={() => setPaymentOption('now')}
                    className="w-5 h-5 text-sst-primary"
                  />
                  <div>
                    <span className="font-bold text-sst-dark block text-base">Pay Now Online (${priceAmount}.00)</span>
                    <span className="text-xs text-gray-600">Pay securely right now via PayPal or Credit Card</span>
                  </div>
                </label>
              </div>

              {/* PayPal Container if Pay Now is selected */}
              {paymentOption === 'now' && (
                <div className="pt-3 border-t border-gray-200">
                  {!paypalLoaded ? (
                    <div className="flex items-center justify-center p-6 text-sst-primary gap-2 font-medium">
                      <Loader2 className="animate-spin" size={24} /> Loading secure PayPal checkout...
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-600 mb-3 text-center font-medium">Click below to pay ${priceAmount}.00 and complete your booking:</p>
                      <div ref={paypalRef} className="min-h-[120px]"></div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="notes" className="block text-base font-bold text-sst-dark mb-1">What would you like help with? (Optional)</label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 text-lg rounded-xl border border-gray-300 text-gray-900 bg-white focus:border-sst-primary focus:ring-2 focus:ring-sst-primary/20 outline-none transition-all resize-none"
                placeholder="e.g. Setting up a new iPad, printer troubleshooting, scam safety..."
              ></textarea>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 font-medium">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 min-h-[56px] bg-gray-100 hover:bg-gray-200 text-sst-dark font-bold text-lg rounded-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
              >
                &larr; Back
              </button>
              
              {paymentOption === 'later' && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 min-h-[56px] bg-sst-primary hover:bg-sst-primary-dark text-white font-bold text-xl rounded-xl hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-200 shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Booking Request'}
                </button>
              )}
            </div>
          </form>
        )}

      </div>
    </main>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-lg font-bold">Loading booking page...</div>}>
      <BookingContent />
    </Suspense>
  )
}
