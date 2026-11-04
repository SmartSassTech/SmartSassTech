'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  MapPin,
  Laptop,
  Phone,
  Mail,
  Users,
  DollarSign,
  CheckCircle2,
  Clock3,
  Plus,
  RefreshCw,
  LogOut,
  Search,
  Filter,
  Trash2,
  Edit3,
  ChevronRight,
  X,
  MessageSquare,
  FileSpreadsheet,
  UserPlus,
  Sun,
  Moon,
  Sunset,
  AlertCircle,
  Terminal,
  CheckSquare,
  Square,
  Check,
  FileText,
  Printer,
  HardDrive,
  Wifi
} from 'lucide-react'
import {
  formatPhoneNumber,
  validateEmail,
  getAddressSuggestions,
  isAfterSundown
} from '@/lib/admin-ui-helpers'

type TabType = 'bookings' | 'customers' | 'inquiries'
type ThemeMode = 'auto' | 'dark' | 'light'

interface Booking {
  id: string
  created_at: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address?: string
  location_preference?: string
  service_name: string
  booking_date: string
  booking_time: string
  duration?: number
  price?: number
  notes?: string
  payment_status?: string
  service_status?: string
  actual_duration?: string
}

interface CustomerHistory {
  id: string
  serviceName: string
  date: string
  time: string
  status: string
  paymentStatus: string
  price: number
  notes?: string
  location?: string
}

export interface DeviceProfile {
  devices?: string
  printer?: string
  wifi_info?: string
  tech_notes?: string
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  role: string
  registeredAt: string
  totalBookings: number
  completedBookings: number
  totalSpent: number
  lastBookingDate?: string | null
  device_profile?: DeviceProfile
  history: CustomerHistory[]
}

interface ContactSubmission {
  id: string
  name: string
  email: string
  phone?: string
  message: string
  created_at: string
}

interface Stats {
  totalBookings: number
  upcomingVisits: number
  completedJobs: number
  pendingVisits: number
  totalRevenue: number
  inHomeCount: number
  remoteCount: number
  totalCustomers: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto')
  const [effectiveTheme, setEffectiveTheme] = useState<'dark' | 'light'>('dark')
  const [activeTab, setActiveTab] = useState<TabType>('bookings')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [adminUser, setAdminUser] = useState<any>(null)

  // Bulk Selection State for Bookings
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // Invoice / Receipt Modal State
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null)

  // Device Profile Modal State
  const [selectedDeviceCustomer, setSelectedDeviceCustomer] = useState<Customer | null>(null)
  const [deviceProfileForm, setDeviceProfileForm] = useState<DeviceProfile>({
    devices: '',
    printer: '',
    wifi_info: '',
    tech_notes: ''
  })
  const [isSavingDeviceProfile, setIsSavingDeviceProfile] = useState(false)
  const [deviceProfileSuccess, setDeviceProfileSuccess] = useState('')
  const [deviceProfileError, setDeviceProfileError] = useState('')

  // Address suggestion state
  const [activeAddressField, setActiveAddressField] = useState<'newBooking' | 'newCustomer' | 'editCustomer' | null>(null)
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([])

  // Initialize theme from localStorage or auto calculate from sundown
  useEffect(() => {
    const savedMode = localStorage.getItem('sst_admin_theme_mode') as ThemeMode | null
    const mode = savedMode || 'auto'
    setThemeMode(mode)

    if (mode === 'auto') {
      setEffectiveTheme(isAfterSundown() ? 'dark' : 'light')
    } else {
      setEffectiveTheme(mode)
    }

    const interval = setInterval(() => {
      if (themeMode === 'auto') {
        setEffectiveTheme(isAfterSundown() ? 'dark' : 'light')
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [themeMode])

  const handleToggleTheme = () => {
    let nextMode: ThemeMode = 'dark'
    if (themeMode === 'auto') nextMode = effectiveTheme === 'dark' ? 'light' : 'dark'
    else if (themeMode === 'dark') nextMode = 'light'
    else if (themeMode === 'light') nextMode = 'auto'

    setThemeMode(nextMode)
    localStorage.setItem('sst_admin_theme_mode', nextMode)

    if (nextMode === 'auto') {
      setEffectiveTheme(isAfterSundown() ? 'dark' : 'light')
    } else {
      setEffectiveTheme(nextMode)
    }
  }

  // Data states
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    upcomingVisits: 0,
    completedJobs: 0,
    pendingVisits: 0,
    totalRevenue: 0,
    inHomeCount: 0,
    remoteCount: 0,
    totalCustomers: 0
  })
  const [bookings, setBookings] = useState<Booking[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [inquiries, setInquiries] = useState<ContactSubmission[]>([])

  // Filtering and Searching
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false)
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false)
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)

  // New Booking Form State with Existing Client Selection
  const [selectedClientIdForBooking, setSelectedClientIdForBooking] = useState<string>('new')
  const [newBookingForm, setNewBookingForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    location_preference: 'in-home',
    booking_date: new Date().toISOString().split('T')[0],
    booking_time: '10:00 AM',
    notes: '',
    payment_status: 'pending',
    price: 50
  })
  const [isCreatingBooking, setIsCreatingBooking] = useState(false)
  const [createBookingError, setCreateBookingError] = useState('')

  // Customer Edit Form State
  const [customerEditForm, setCustomerEditForm] = useState({
    id: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    originalName: '',
    originalEmail: ''
  })
  const [isUpdatingCustomer, setIsUpdatingCustomer] = useState(false)
  const [customerEditError, setCustomerEditError] = useState('')

  // New Customer Form State
  const [newCustomerForm, setNewCustomerForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  })
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const [createCustomerError, setCreateCustomerError] = useState('')

  // Bulk Import CSV Form State
  const [csvText, setCsvText] = useState('')
  const [isImportingCsv, setIsImportingCsv] = useState(false)
  const [csvImportMessage, setCsvImportMessage] = useState('')
  const [csvImportError, setCsvImportError] = useState('')

  // 1. Fetch Admin Data & Verify Auth Guard
  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const res = await fetch('/api/admin/data')
      if (res.status === 401) {
        router.replace('/admin/login')
        return
      }

      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
        setBookings(data.bookings || [])
        setCustomers(data.customers || [])
        setInquiries(data.contactSubmissions || [])
        setAdminUser(data.admin)
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [router])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // 2. Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' })
      window.location.href = '/'
    } catch (err) {
      console.error('Error logging out:', err)
      window.location.href = '/'
    }
  }

  // 3. Update Booking Status directly
  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setStatusUpdatingId(bookingId)
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookingId, service_status: newStatus })
      })
      if (res.ok) {
        setBookings(prev =>
          prev.map(b => (b.id === bookingId ? { ...b, service_status: newStatus } : b))
        )
        loadDashboardData(true)
      }
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setStatusUpdatingId(null)
    }
  }

  // 4. Update Payment Status directly
  const handlePaymentStatusChange = async (bookingId: string, newPaymentStatus: string) => {
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookingId, payment_status: newPaymentStatus })
      })
      if (res.ok) {
        setBookings(prev =>
          prev.map(b => (b.id === bookingId ? { ...b, payment_status: newPaymentStatus } : b))
        )
        loadDashboardData(true)
      }
    } catch (err) {
      console.error('Failed to update payment status:', err)
    }
  }

  // 5. Delete Single Booking
  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('EXECUTE DELETE: Remove this booking record?')) return

    try {
      const res = await fetch(`/api/admin/bookings?id=${bookingId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setBookings(prev => prev.filter(b => b.id !== bookingId))
        setSelectedBookingIds(prev => prev.filter(id => id !== bookingId))
        loadDashboardData(true)
      }
    } catch (err) {
      console.error('Failed to delete booking:', err)
    }
  }

  // 6. Bulk Delete Selected Bookings
  const handleBulkDeleteBookings = async () => {
    if (selectedBookingIds.length === 0) return
    if (!confirm(`[TERMINAL CMD: BULK_DELETE] Are you sure you want to permanently delete ${selectedBookingIds.length} selected bookings?`)) {
      return
    }

    setIsBulkDeleting(true)
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedBookingIds })
      })

      if (res.ok) {
        setBookings(prev => prev.filter(b => !selectedBookingIds.includes(b.id)))
        setSelectedBookingIds([])
        loadDashboardData(true)
      }
    } catch (err) {
      console.error('Bulk delete error:', err)
    } finally {
      setIsBulkDeleting(false)
    }
  }

  // 7. Bulk Status / Payment Update
  const handleBulkStatusUpdate = async (field: 'service_status' | 'payment_status', value: string) => {
    if (selectedBookingIds.length === 0) return

    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedBookingIds, [field]: value })
      })

      if (res.ok) {
        setSelectedBookingIds([])
        loadDashboardData(true)
      }
    } catch (err) {
      console.error('Bulk update error:', err)
    }
  }

  // 8. Toggle Select All Bookings
  const handleToggleSelectAll = () => {
    if (selectedBookingIds.length === filteredBookings.length) {
      setSelectedBookingIds([])
    } else {
      setSelectedBookingIds(filteredBookings.map(b => b.id))
    }
  }

  const handleToggleSelectOne = (id: string) => {
    setSelectedBookingIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  // 9. Handle Client Dropdown Selection in Booking Modal
  const handleClientSelectInBooking = (clientId: string) => {
    setSelectedClientIdForBooking(clientId)
    if (clientId === 'new') {
      setNewBookingForm(prev => ({
        ...prev,
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        customer_address: ''
      }))
      return
    }

    const foundCustomer = customers.find(c => c.id === clientId || c.name === clientId)
    if (foundCustomer) {
      setNewBookingForm(prev => ({
        ...prev,
        customer_name: foundCustomer.name,
        customer_phone: (foundCustomer.phone && !foundCustomer.phone.includes('Historical')) ? foundCustomer.phone : '',
        customer_email: (foundCustomer.email && !foundCustomer.email.includes('@client.smartsasstech.com')) ? foundCustomer.email : '',
        customer_address: (foundCustomer.address && foundCustomer.address !== 'Rochester, NY') ? foundCustomer.address : (prev.customer_address || '')
      }))
    }
  }

  // 10. Submit New Booking
  const handleCreateBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingBooking(true)
    setCreateBookingError('')

    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBookingForm)
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        setCreateBookingError(data.error || 'Failed to create booking')
        setIsCreatingBooking(false)
        return
      }

      setIsAddModalOpen(false)
      setSelectedClientIdForBooking('new')
      setNewBookingForm({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        customer_address: '',
        location_preference: 'in-home',
        booking_date: new Date().toISOString().split('T')[0],
        booking_time: '10:00 AM',
        notes: '',
        payment_status: 'pending',
        price: 50
      })
      loadDashboardData(true)
    } catch (err: any) {
      setCreateBookingError(err.message || 'Error creating booking')
    } finally {
      setIsCreatingBooking(false)
    }
  }

  // 11. Submit New Customer
  const handleCreateCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingCustomer(true)
    setCreateCustomerError('')

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomerForm)
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        setCreateCustomerError(data.error || 'Failed to create customer')
        setIsCreatingCustomer(false)
        return
      }

      setIsAddCustomerModalOpen(false)
      setNewCustomerForm({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
      })
      loadDashboardData(true)
    } catch (err: any) {
      setCreateCustomerError(err.message || 'Error creating customer')
    } finally {
      setIsCreatingCustomer(false)
    }
  }

  // 12. Open Edit Customer Modal
  const openEditCustomerModal = (customer: Customer) => {
    setCustomerEditForm({
      id: customer.id,
      name: customer.name,
      phone: (customer.phone && !customer.phone.includes('Historical')) ? customer.phone : '',
      email: (customer.email && !customer.email.includes('@client.smartsasstech.com')) ? customer.email : '',
      address: (customer.address && customer.address !== 'Rochester, NY') ? customer.address : '',
      originalName: customer.name,
      originalEmail: customer.email
    })
    setCustomerEditError('')
    setIsEditCustomerModalOpen(true)
  }

  // 13. Submit Update Customer
  const handleUpdateCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingCustomer(true)
    setCustomerEditError('')

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerEditForm)
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        setCustomerEditError(data.error || 'Failed to update customer')
        setIsUpdatingCustomer(false)
        return
      }

      setIsEditCustomerModalOpen(false)
      loadDashboardData(true)
    } catch (err: any) {
      setCustomerEditError(err.message || 'Error updating customer')
    } finally {
      setIsUpdatingCustomer(false)
    }
  }

  // 14. Delete Customer
  const handleDeleteCustomer = async (customer: Customer) => {
    if (!confirm(`[TERMINAL CMD: PURGE_CLIENT] Remove "${customer.name}" and all associated appointment records?`)) {
      return
    }

    try {
      const res = await fetch(
        `/api/admin/customers?id=${encodeURIComponent(customer.id)}&name=${encodeURIComponent(customer.name)}&email=${encodeURIComponent(customer.email || '')}`,
        { method: 'DELETE' }
      )

      if (res.ok) {
        setCustomers(prev => prev.filter(c => c.id !== customer.id && c.name !== customer.name))
        loadDashboardData(true)
      }
    } catch (err) {
      console.error('Failed to delete customer:', err)
    }
  }

  // 15. Open Device & Hardware Profile Modal
  const openDeviceProfileModal = (customer: Customer) => {
    setSelectedDeviceCustomer(customer)
    setDeviceProfileForm({
      devices: customer.device_profile?.devices || '',
      printer: customer.device_profile?.printer || '',
      wifi_info: customer.device_profile?.wifi_info || '',
      tech_notes: customer.device_profile?.tech_notes || ''
    })
    setDeviceProfileSuccess('')
    setDeviceProfileError('')
  }

  // 16. Save Client Hardware & Device Profile
  const handleSaveDeviceProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDeviceCustomer) return

    setIsSavingDeviceProfile(true)
    setDeviceProfileError('')
    setDeviceProfileSuccess('')

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedDeviceCustomer.id,
          name: selectedDeviceCustomer.name,
          originalName: selectedDeviceCustomer.name,
          email: selectedDeviceCustomer.email,
          device_profile: deviceProfileForm
        })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        setDeviceProfileError(data.error || 'Failed to save hardware profile')
        setIsSavingDeviceProfile(false)
        return
      }

      setDeviceProfileSuccess('Hardware profile updated successfully.')
      setCustomers(prev =>
        prev.map(c =>
          c.id === selectedDeviceCustomer.id || c.name === selectedDeviceCustomer.name
            ? { ...c, device_profile: deviceProfileForm }
            : c
        )
      )
      setTimeout(() => {
        setSelectedDeviceCustomer(null)
      }, 1000)
    } catch (err: any) {
      setDeviceProfileError(err.message || 'Error saving device profile')
    } finally {
      setIsSavingDeviceProfile(false)
    }
  }

  // 17. Submit Bulk CSV Import
  const handleBulkImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsImportingCsv(true)
    setCsvImportError('')
    setCsvImportMessage('')

    try {
      const res = await fetch('/api/admin/bookings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        setCsvImportError(data.error || 'Failed to import jobs')
        setIsImportingCsv(false)
        return
      }

      setCsvImportMessage(`[SUCCESS] Imported ${data.insertedCount} records to database.`)
      setCsvText('')
      loadDashboardData(true)
      setTimeout(() => {
        setIsBulkImportModalOpen(false)
        setCsvImportMessage('')
      }, 1500)
    } catch (err: any) {
      setCsvImportError(err.message || 'Error importing CSV data')
    } finally {
      setIsImportingCsv(false)
    }
  }

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    return bookings.filter(b => {
      const matchesSearch =
        !searchQuery ||
        b.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customer_phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customer_address?.toLowerCase().includes(searchQuery.toLowerCase())

      let matchesStatus = true
      if (statusFilter === 'upcoming') {
        matchesStatus = b.booking_date >= todayStr && b.service_status !== 'cancelled' && b.service_status !== 'completed'
      } else if (statusFilter !== 'all') {
        matchesStatus = b.service_status === statusFilter
      }

      let matchesType = true
      if (typeFilter !== 'all') {
        const isHome = b.location_preference === 'in-home' || b.service_name?.toLowerCase().includes('in-home')
        matchesType = typeFilter === 'in-home' ? isHome : !isHome
      }

      return matchesSearch && matchesStatus && matchesType
    })
  }, [bookings, searchQuery, statusFilter, typeFilter])

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      return (
        !searchQuery ||
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.address?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
  }, [customers, searchQuery])

  // Retro Tech Terminal Styling Theme variables
  const isDark = effectiveTheme === 'dark'

  // Retro Palette (Red & Blues, No Green):
  // Dark: Deep Terminal Blue/Black (#060914), Electric Cyber Blue (#3B82F6), Laser Red (#EF4444 / #C43131)
  // Light: Clean White (#FFFFFF), SST Navy (#2E3B69), SST Red (#B24536)
  const terminalRed = isDark ? '#EF4444' : '#B24536'
  const terminalBlue = isDark ? '#3B82F6' : '#2E3B69'
  const logoPath = isDark ? '/assets/images/logoDark.png' : '/assets/images/logo.png'

  if (isLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center font-mono gap-3 transition-colors ${
        isDark ? 'bg-[#060914] text-[#3B82F6]' : 'bg-[#F8FAFC] text-[#2E3B69]'
      }`}>
        <div className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
          <Terminal size={18} className="animate-pulse" style={{ color: terminalRed }} />
          <span>&gt; INITIALIZING_SST_TERMINAL...</span>
        </div>
        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-blue-500/40">
          <div className="w-full h-full bg-gradient-to-r from-blue-600 via-red-500 to-blue-600 animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-[#060914] text-slate-100' : 'bg-[#F4F6FB] text-slate-900'
    } flex flex-col font-sans selection:bg-red-500 selection:text-white`}>
      
      {/* Top Retro Terminal Header Bar */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 sm:px-8 py-3 transition-colors ${
        isDark
          ? 'bg-[#0A0E20]/95 border-blue-900/40 shadow-lg shadow-black/60'
          : 'bg-white/95 border-slate-300 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Terminal Info */}
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="relative">
                <img
                  src={logoPath}
                  onError={(e) => {
                    e.currentTarget.src = isDark ? '/assets/images/darkLogo-horiz.svg' : '/assets/images/logo-horiz.svg'
                  }}
                  alt="SmartSass Tech"
                  className="h-10 sm:h-12 w-auto object-contain transition-all"
                />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className={`font-black tracking-tight text-base block leading-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    SmartSass Tech
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold">
                    v2.4
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-red-500 block leading-tight">
                  &gt; ADMIN_TERMINAL
                </span>
              </div>
            </Link>

            {/* Retro Terminal Prompt Status Indicator */}
            <div className={`hidden md:inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border ml-2 ${
              isDark
                ? 'bg-blue-950/40 border-blue-800/60 text-blue-300'
                : 'bg-blue-50 border-blue-300 text-blue-800'
            }`}>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span>SYS.ONLINE</span>
              <span className="opacity-40">|</span>
              <span className="text-red-400 font-normal">PORT:443</span>
            </div>
          </div>

          {/* Quick Terminal Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Theme Toggle Button (Auto/Sundown Aware / Dark / Light) */}
            <button
              type="button"
              onClick={handleToggleTheme}
              title={`Mode: ${themeMode.toUpperCase()} (${effectiveTheme} active). Click to cycle.`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                isDark
                  ? 'bg-[#101730] hover:bg-[#182245] border-blue-500/40 text-blue-300'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              {themeMode === 'auto' ? (
                <>
                  <Sunset size={14} className="text-amber-400" />
                  <span className="hidden sm:inline">AUTO ({effectiveTheme.toUpperCase()})</span>
                </>
              ) : isDark ? (
                <>
                  <Moon size={14} className="text-blue-400" />
                  <span className="hidden sm:inline">DARK_OS</span>
                </>
              ) : (
                <>
                  <Sun size={14} className="text-amber-500" />
                  <span className="hidden sm:inline">LIGHT_OS</span>
                </>
              )}
            </button>

            {/* Refresh Data */}
            <button
              type="button"
              onClick={() => loadDashboardData(true)}
              disabled={isRefreshing}
              title="Sync Terminal Data"
              className={`p-2 rounded-lg border transition-all disabled:opacity-50 ${
                isDark
                  ? 'bg-[#101730] hover:bg-[#182245] border-blue-500/40 text-blue-400'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-blue-700'
              }`}
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-red-500' : ''} />
            </button>

            {/* Bulk CSV Import */}
            <button
              type="button"
              onClick={() => setIsBulkImportModalOpen(true)}
              title="Import Spreadsheet CSV"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-bold text-xs sm:text-sm transition-all ${
                isDark
                  ? 'bg-[#101730] hover:bg-[#182245] border-blue-500/40 text-blue-200'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-blue-900'
              }`}
            >
              <FileSpreadsheet size={15} className="text-red-500" />
              <span className="hidden lg:inline">&gt; IMPORT_CSV</span>
            </button>

            {/* New Booking */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs sm:text-sm shadow-md shadow-red-600/30 transition-all hover:-translate-y-0.5 border border-red-400"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">&gt; NEW_BOOKING</span>
            </button>

            <div className={`h-6 w-px mx-1 hidden sm:block ${isDark ? 'bg-blue-900/40' : 'bg-slate-300'}`}></div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono font-bold text-xs transition-all border ${
                isDark
                  ? 'bg-red-950/40 hover:bg-red-900/60 border-red-900/60 text-red-300'
                  : 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700'
              }`}
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">EXIT</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Terminal Shell */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* RETRO STATS TERMINAL SUMMARY CARDS */}
        <section aria-label="Business Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Card 1: Total Bookings */}
          <div className={`p-5 rounded-xl border shadow-lg relative overflow-hidden transition-all ${
            isDark
              ? 'bg-[#0A0E20]/90 border-blue-900/60 hover:border-blue-500/80 shadow-black/50'
              : 'bg-white border-blue-200 hover:border-blue-400 shadow-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-3 font-mono">
              <span className={`text-[11px] font-bold tracking-wider uppercase ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
                [01] TOTAL_BOOKINGS
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/30">
                <Calendar size={16} />
              </div>
            </div>
            <div className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {stats.totalBookings}
            </div>
            <div className="mt-2 text-xs font-mono flex items-center gap-2 text-slate-400">
              <span className="text-blue-400 font-bold">{stats.inHomeCount} IN_HOME</span>
              <span>&bull;</span>
              <span className="text-red-400 font-bold">{stats.remoteCount} REMOTE</span>
            </div>
          </div>

          {/* Card 2: Upcoming Scheduled Visits */}
          <div className={`p-5 rounded-xl border shadow-lg relative overflow-hidden transition-all ${
            isDark
              ? 'bg-[#0A0E20]/90 border-blue-900/60 hover:border-red-500/60 shadow-black/50'
              : 'bg-white border-blue-200 hover:border-red-300 shadow-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-3 font-mono">
              <span className={`text-[11px] font-bold tracking-wider uppercase ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                [02] UPCOMING_VISITS
              </span>
              <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/30">
                <Clock3 size={16} />
              </div>
            </div>
            <div className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {stats.upcomingVisits}
            </div>
            <div className="mt-2 text-xs font-mono text-slate-400">
              {stats.pendingVisits > 0 ? (
                <span className="text-red-400 font-bold">&gt; {stats.pendingVisits} PENDING_CONFIRMATION</span>
              ) : (
                <span className="text-blue-400">&gt; ALL_VISITS_CONFIRMED</span>
              )}
            </div>
          </div>

          {/* Card 3: Completed Jobs */}
          <div className={`p-5 rounded-xl border shadow-lg relative overflow-hidden transition-all ${
            isDark
              ? 'bg-[#0A0E20]/90 border-blue-900/60 hover:border-blue-500/80 shadow-black/50'
              : 'bg-white border-blue-200 hover:border-blue-400 shadow-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-3 font-mono">
              <span className={`text-[11px] font-bold tracking-wider uppercase ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
                [03] JOBS_COMPLETED
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/30">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {stats.completedJobs}
            </div>
            <div className="mt-2 text-xs font-mono text-slate-400">
              <span>&gt; SERVICED_CLIENT_VISITS</span>
            </div>
          </div>

          {/* Card 4: Total Revenue Earned */}
          <div className={`p-5 rounded-xl border shadow-lg relative overflow-hidden transition-all ${
            isDark
              ? 'bg-[#0A0E20]/90 border-blue-900/60 hover:border-blue-500/80 shadow-black/50'
              : 'bg-white border-blue-200 hover:border-blue-400 shadow-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-3 font-mono">
              <span className={`text-[11px] font-bold tracking-wider uppercase ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                [04] GROSS_REVENUE
              </span>
              <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/30">
                <DollarSign size={16} />
              </div>
            </div>
            <div className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-xs font-mono flex items-center gap-1.5 text-slate-400">
              <Users size={13} className="text-blue-400" />
              <span>{stats.totalCustomers} UNIQUE_CLIENTS</span>
            </div>
          </div>

        </section>

        {/* TAB CONTROLS & SEARCH BAR */}
        <section className="space-y-4">
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${
            isDark ? 'border-blue-900/40' : 'border-slate-300'
          }`}>
            
            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('bookings')}
                className={`px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-2 border ${
                  activeTab === 'bookings'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                    : isDark
                    ? 'bg-[#0A0E20] border-blue-900/50 text-slate-400 hover:text-white hover:bg-[#101730]'
                    : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Calendar size={15} />
                <span>&gt; BOOKINGS ({bookings.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('customers')}
                className={`px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-2 border ${
                  activeTab === 'customers'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                    : isDark
                    ? 'bg-[#0A0E20] border-blue-900/50 text-slate-400 hover:text-white hover:bg-[#101730]'
                    : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users size={15} />
                <span>&gt; CLIENTS ({customers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('inquiries')}
                className={`px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-2 border ${
                  activeTab === 'inquiries'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                    : isDark
                    ? 'bg-[#0A0E20] border-blue-900/50 text-slate-400 hover:text-white hover:bg-[#101730]'
                    : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <MessageSquare size={15} />
                <span>&gt; INQUIRIES ({inquiries.length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={15} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="grep query name, phone, notes..."
                className={`w-full pl-9 pr-4 py-2 border rounded-lg text-xs font-mono transition-all focus:outline-none focus:ring-1 ${
                  isDark
                    ? 'bg-[#0A0E20] border-blue-900/60 text-white placeholder-slate-500 focus:border-blue-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>

          </div>

          {/* TAB 1: BOOKINGS TABLE WITH BULK DELETE ACTIONS */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              
              {/* Filter Pills & Service Filter */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono font-semibold">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`flex items-center gap-1 mr-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <Filter size={13} /> FILTER:
                  </span>
                  {[
                    { key: 'all', label: 'ALL' },
                    { key: 'upcoming', label: 'UPCOMING' },
                    { key: 'scheduled', label: 'SCHEDULED' },
                    { key: 'in_progress', label: 'IN_PROGRESS' },
                    { key: 'completed', label: 'COMPLETED' },
                    { key: 'cancelled', label: 'CANCELLED' }
                  ].map(f => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setStatusFilter(f.key)}
                      className={`px-2.5 py-1 rounded-md border transition-all ${
                        statusFilter === f.key
                          ? isDark
                            ? 'bg-blue-600 text-white border-blue-400'
                            : 'bg-blue-100 text-blue-900 border-blue-400 font-bold'
                          : isDark
                          ? 'bg-[#0A0E20] border-blue-900/40 text-slate-400 hover:text-slate-200'
                          : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      [{f.label}]
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>SERVICE_TYPE:</span>
                  <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className={`border rounded-md px-2.5 py-1 text-xs font-mono focus:outline-none ${
                      isDark
                        ? 'bg-[#0A0E20] border-blue-900/60 text-slate-300 focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-800 focus:border-blue-600'
                    }`}
                  >
                    <option value="all">ALL_TYPES</option>
                    <option value="in-home">IN-HOME ($50/HR)</option>
                    <option value="remote">REMOTE ($50/HR)</option>
                  </select>
                </div>
              </div>

              {/* BATCH ACTION COMMAND BAR (Appears when 1+ bookings selected) */}
              {selectedBookingIds.length > 0 && (
                <div className={`p-3 sm:p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150 ${
                  isDark
                    ? 'bg-red-950/40 border-red-500/60 text-red-200'
                    : 'bg-red-50 border-red-300 text-red-900'
                }`}>
                  <div className="flex items-center gap-2 font-mono text-xs sm:text-sm font-bold">
                    <Terminal size={16} className="text-red-500 animate-pulse" />
                    <span>&gt; BATCH_SELECTION: [{selectedBookingIds.length} RECORDS SELECTED]</span>
                  </div>

                  <div className="flex items-center flex-wrap gap-2 font-mono text-xs">
                    {/* Bulk Delete Button */}
                    <button
                      type="button"
                      onClick={handleBulkDeleteBookings}
                      disabled={isBulkDeleting}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      <span>{isBulkDeleting ? 'DELETING...' : `BULK DELETE (${selectedBookingIds.length})`}</span>
                    </button>

                    {/* Bulk Mark as Completed */}
                    <button
                      type="button"
                      onClick={() => handleBulkStatusUpdate('service_status', 'completed')}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Check size={14} />
                      <span>MARK COMPLETED</span>
                    </button>

                    {/* Bulk Mark as Paid */}
                    <button
                      type="button"
                      onClick={() => handleBulkStatusUpdate('payment_status', 'paid')}
                      className="px-3 py-1.5 rounded-lg bg-blue-800 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 transition-all"
                    >
                      <DollarSign size={14} />
                      <span>MARK PAID</span>
                    </button>

                    {/* Clear selection */}
                    <button
                      type="button"
                      onClick={() => setSelectedBookingIds([])}
                      className={`px-2.5 py-1.5 rounded-lg border transition-all ${
                        isDark ? 'border-red-500/40 text-red-300 hover:bg-red-900/40' : 'border-red-300 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      DESELECT
                    </button>
                  </div>
                </div>
              )}

              {/* Bookings Terminal Table */}
              <div className={`border rounded-xl overflow-hidden shadow-xl ${
                isDark
                  ? 'bg-[#0A0E20]/90 border-blue-900/60 shadow-black/60'
                  : 'bg-white border-slate-300 shadow-slate-200'
              }`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className={`text-[11px] font-mono font-bold uppercase tracking-wider border-b ${
                      isDark
                        ? 'bg-[#060914] text-blue-400 border-blue-900/60'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      <tr>
                        {/* Select All Checkbox */}
                        <th className="py-3 px-3 sm:px-4 w-10">
                          <button
                            type="button"
                            onClick={handleToggleSelectAll}
                            title="Select / Deselect All Filtered"
                            className="flex items-center text-blue-500 hover:text-red-500 transition-colors"
                          >
                            {selectedBookingIds.length > 0 && selectedBookingIds.length === filteredBookings.length ? (
                              <CheckSquare size={18} className="text-red-500" />
                            ) : (
                              <Square size={18} />
                            )}
                          </button>
                        </th>
                        <th className="py-3 px-4">Client Info</th>
                        <th className="py-3 px-4">Service Type</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Price / Payment</th>
                        <th className="py-3 px-4">Notes & Topic</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y font-mono text-xs ${isDark ? 'divide-blue-950/60 text-slate-300' : 'divide-slate-200 text-slate-800'}`}>
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400">
                            <Terminal size={32} className="mx-auto mb-3 opacity-40 text-blue-500" />
                            <p className="font-bold">&gt; NO_RECORDS_FOUND_MATCHING_FILTER</p>
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery('')
                                setStatusFilter('all')
                                setTypeFilter('all')
                              }}
                              className="mt-2 text-xs text-red-500 hover:underline"
                            >
                              [RESET_FILTERS]
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map(b => {
                          const isHome =
                            b.location_preference === 'in-home' ||
                            b.service_name?.toLowerCase().includes('in-home')
                          const isToday =
                            b.booking_date === new Date().toISOString().split('T')[0]
                          const isSelected = selectedBookingIds.includes(b.id)

                          return (
                            <tr
                              key={b.id}
                              className={`transition-colors group ${
                                isSelected
                                  ? isDark
                                    ? 'bg-red-950/30'
                                    : 'bg-red-50'
                                  : isDark
                                  ? 'hover:bg-[#101730]/70'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              {/* Row Checkbox */}
                              <td className="py-3 px-3 sm:px-4">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSelectOne(b.id)}
                                  className="flex items-center text-blue-500 hover:text-red-500 transition-colors"
                                >
                                  {isSelected ? (
                                    <CheckSquare size={17} className="text-red-500" />
                                  ) : (
                                    <Square size={17} />
                                  )}
                                </button>
                              </td>

                              {/* Client Info */}
                              <td className="py-3 px-4 font-sans">
                                <div className="min-w-0">
                                  <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {b.customer_name}
                                  </div>
                                  {b.customer_address && isHome && (
                                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-[200px] font-sans">
                                      <MapPin size={11} className="shrink-0 text-red-500" />
                                      <span className="truncate">{b.customer_address}</span>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Service Type */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${
                                  isHome
                                    ? isDark ? 'bg-red-950/40 border-red-800/60 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
                                    : isDark ? 'bg-blue-950/40 border-blue-800/60 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'
                                }`}>
                                  {isHome ? 'IN-HOME' : 'REMOTE'}
                                </span>
                              </td>

                              {/* Date & Time */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  <span>{b.booking_date}</span>
                                  {isToday && (
                                    <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-bold text-[10px] border border-red-500/40 animate-pulse">
                                      TODAY
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Clock size={11} />
                                  <span>{b.booking_time}</span>
                                </div>
                              </td>

                              {/* Status */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <select
                                  value={b.service_status || 'scheduled'}
                                  onChange={e => handleStatusChange(b.id, e.target.value)}
                                  disabled={statusUpdatingId === b.id}
                                  className={`text-xs font-bold px-2 py-1 rounded border focus:outline-none cursor-pointer ${
                                    b.service_status === 'completed'
                                      ? isDark ? 'bg-blue-950/70 border-blue-700 text-blue-300' : 'bg-blue-100 border-blue-400 text-blue-900'
                                      : b.service_status === 'cancelled'
                                      ? isDark ? 'bg-red-950/70 border-red-800 text-red-300' : 'bg-red-100 border-red-400 text-red-900'
                                      : isDark ? 'bg-slate-900 border-blue-800 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                                  }`}
                                >
                                  <option value="scheduled">[SCHEDULED]</option>
                                  <option value="in_progress">[IN_PROGRESS]</option>
                                  <option value="completed">[COMPLETED]</option>
                                  <option value="cancelled">[CANCELLED]</option>
                                  <option value="no_show">[NO_SHOW]</option>
                                </select>
                              </td>

                              {/* Payment Status */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    ${Number(b.price || (isHome ? 50 : 40)).toFixed(2)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handlePaymentStatusChange(
                                        b.id,
                                        b.payment_status === 'paid' ? 'pending' : 'paid'
                                      )
                                    }
                                    title="Toggle Paid / Pending"
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all ${
                                      b.payment_status === 'paid'
                                        ? isDark ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-blue-100 border-blue-300 text-blue-800'
                                        : isDark ? 'bg-red-950/40 border-red-900/60 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
                                    }`}
                                  >
                                    {b.payment_status === 'paid' ? 'PAID' : 'PENDING'}
                                  </button>
                                </div>
                              </td>

                              {/* Notes */}
                              <td className="py-3 px-4 max-w-xs font-sans">
                                <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                  {b.notes || '—'}
                                </p>
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5 font-mono">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedInvoiceBooking(b)}
                                    title="Print / Generate Invoice"
                                    className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                                      isDark
                                        ? 'bg-blue-950/50 border-blue-800/80 text-blue-300 hover:bg-blue-900 hover:text-white'
                                        : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100 hover:text-blue-950'
                                    }`}
                                  >
                                    <FileText size={12} />
                                    <span>RECEIPT</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBooking(b.id)}
                                    title="Delete Booking"
                                    className={`p-1.5 rounded transition-colors ${
                                      isDark
                                        ? 'text-slate-500 hover:text-red-400 hover:bg-red-950/40'
                                        : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                    }`}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </td>

                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CUSTOMER DIRECTORY */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              
              {/* Directory Action Bar */}
              <div className={`flex items-center justify-between gap-4 p-4 rounded-xl border font-mono ${
                isDark ? 'bg-[#0A0E20]/90 border-blue-900/60' : 'bg-white border-slate-300 shadow-sm'
              }`}>
                <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  &gt; CLIENT_DIRECTORY: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{filteredCustomers.length}</strong> ACTIVE_RECORDS
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddCustomerModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/30 transition-all border border-red-400"
                >
                  <UserPlus size={15} />
                  <span>+ ADD_CLIENT</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.length === 0 ? (
                  <div className={`col-span-full py-12 text-center rounded-xl border font-mono ${
                    isDark ? 'bg-[#0A0E20]/60 border-blue-900/30 text-slate-500' : 'bg-white border-slate-300 text-slate-400'
                  }`}>
                    <Users size={36} className="mx-auto mb-3 opacity-40 text-blue-500" />
                    <p className="font-bold">&gt; NO_CLIENTS_FOUND</p>
                  </div>
                ) : (
                  filteredCustomers.map(c => (
                    <div
                      key={c.id}
                      className={`p-5 rounded-xl border shadow-md flex flex-col justify-between transition-all ${
                        isDark
                          ? 'bg-[#0A0E20]/90 border-blue-900/60 hover:border-blue-500/80 shadow-black/50'
                          : 'bg-white border-slate-300 hover:border-blue-400 shadow-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg font-mono font-bold flex items-center justify-center text-sm shrink-0 border bg-blue-500/10 border-blue-500/30 text-blue-400">
                              {(c.name || 'C')
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                            <div>
                              <h3 className={`font-bold text-base leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {c.name}
                              </h3>
                              <span className="text-[11px] font-mono text-slate-400">
                                {c.totalBookings} visit{c.totalBookings === 1 ? '' : 's'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Top Card Actions: Edit & Delete */}
                          <div className="flex items-center gap-1 font-mono">
                            {c.totalSpent > 0 && (
                              <span className={`px-2 py-0.5 rounded font-bold text-xs border mr-1 ${
                                isDark
                                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                                  : 'bg-blue-100 border-blue-300 text-blue-900'
                              }`}>
                                ${c.totalSpent.toFixed(2)}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => openEditCustomerModal(c)}
                              title="Edit Client Record"
                              className={`p-1.5 rounded transition-colors ${
                                isDark ? 'text-slate-400 hover:text-white hover:bg-blue-950/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                              }`}
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomer(c)}
                              title="Delete Client Record"
                              className={`p-1.5 rounded transition-colors ${
                                isDark ? 'text-slate-500 hover:text-red-400 hover:bg-red-950/40' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <div className={`space-y-1.5 text-xs my-3 border-t pt-3 font-mono ${
                          isDark ? 'border-blue-950/60 text-slate-300' : 'border-slate-100 text-slate-600'
                        }`}>
                          {c.phone && !c.phone.includes('Historical') && (
                            <div className="flex items-center gap-2">
                              <Phone size={12} className="text-blue-400 shrink-0" />
                              <a href={`tel:${c.phone}`} className="hover:underline">
                                {c.phone}
                              </a>
                            </div>
                          )}
                          {c.email && !c.email.includes('@client.smartsasstech.com') && (
                            <div className="flex items-center gap-2 truncate">
                              <Mail size={12} className="text-slate-400 shrink-0" />
                              <a href={`mailto:${c.email}`} className="hover:underline truncate">
                                {c.email}
                              </a>
                            </div>
                          )}
                          {c.address && (
                            <div className="flex items-start gap-2 text-slate-400 font-sans">
                              <MapPin size={12} className="text-red-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{c.address}</span>
                            </div>
                          )}

                          {/* Hardware / Device Preview if available */}
                          {c.device_profile && (c.device_profile.devices || c.device_profile.printer || c.device_profile.wifi_info) && (
                            <div className={`mt-2 p-2 rounded text-[11px] font-sans border ${
                              isDark ? 'bg-[#060914] border-blue-900/40 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}>
                              {c.device_profile.devices && (
                                <div className="flex items-center gap-1.5 truncate">
                                  <Laptop size={11} className="text-blue-400 shrink-0" />
                                  <span className="truncate">{c.device_profile.devices}</span>
                                </div>
                              )}
                              {c.device_profile.printer && (
                                <div className="flex items-center gap-1.5 truncate mt-0.5">
                                  <Printer size={11} className="text-amber-400 shrink-0" />
                                  <span className="truncate">{c.device_profile.printer}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={`pt-3 border-t flex items-center justify-between text-xs font-mono gap-2 ${
                        isDark ? 'border-blue-950/60' : 'border-slate-100'
                      }`}>
                        <button
                          type="button"
                          onClick={() => openDeviceProfileModal(c)}
                          className="font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors hover:underline"
                        >
                          <Laptop size={13} />
                          <span>&gt; DEVICES</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(c)}
                          className="font-bold text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors hover:underline"
                        >
                          <span>&gt; HISTORY ({c.history.length})</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT INQUIRIES */}
          {activeTab === 'inquiries' && (
            <div className={`border rounded-xl overflow-hidden shadow-xl ${
              isDark ? 'bg-[#0A0E20]/90 border-blue-900/60 shadow-black/60' : 'bg-white border-slate-300 shadow-slate-200'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-mono">
                  <thead className={`text-[11px] font-bold uppercase tracking-wider border-b ${
                    isDark ? 'bg-[#060914] text-blue-400 border-blue-900/60' : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    <tr>
                      <th className="py-3 px-4 sm:px-6">Sender</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Message</th>
                      <th className="py-3 px-4">Received Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-xs ${isDark ? 'divide-blue-950/60 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
                    {inquiries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          <MessageSquare size={32} className="mx-auto mb-3 opacity-40 text-blue-500" />
                          <p className="font-bold">&gt; NO_INQUIRIES_FOUND</p>
                        </td>
                      </tr>
                    ) : (
                      inquiries.map(inq => (
                        <tr key={inq.id} className={`transition-colors ${isDark ? 'hover:bg-[#101730]/70' : 'hover:bg-slate-50'}`}>
                          <td className={`py-4 px-4 sm:px-6 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {inq.name}
                          </td>
                          <td className="py-4 px-4 text-xs space-y-1">
                            {inq.phone && (
                              <a href={`tel:${inq.phone}`} className="flex items-center gap-1 text-blue-400 hover:underline">
                                <Phone size={12} /> {inq.phone}
                              </a>
                            )}
                            <a href={`mailto:${inq.email}`} className="flex items-center gap-1 text-slate-400 hover:underline">
                              <Mail size={12} /> {inq.email}
                            </a>
                          </td>
                          <td className={`py-4 px-4 max-w-md text-xs leading-relaxed font-sans ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {inq.message}
                          </td>
                          <td className="py-4 px-4 text-xs text-slate-400 whitespace-nowrap">
                            {new Date(inq.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setNewBookingForm(prev => ({
                                  ...prev,
                                  customer_name: inq.name,
                                  customer_phone: inq.phone || '',
                                  customer_email: inq.email || '',
                                  notes: `Converted from contact message: ${inq.message}`
                                }))
                                setIsAddModalOpen(true)
                              }}
                              className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all border border-blue-400"
                            >
                              + CREATE_BOOKING
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </section>

      </main>

      {/* MODAL 1: ADD NEW BOOKING (WITH RETRO TERMINAL STYLING & CLIENT AUTOFILL) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border ${
            isDark ? 'bg-[#0A0E20] border-blue-500/50 text-slate-100 shadow-black/80' : 'bg-white border-slate-300 text-slate-800 shadow-slate-900/30'
          }`}>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className={`absolute top-6 right-6 p-2 rounded-lg transition-colors ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-blue-950/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X size={20} />
            </button>

            <div className="mb-6 font-mono">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="text-[10px] text-slate-500 ml-2">EXEC://new_appointment</span>
              </div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                &gt; CREATE_NEW_BOOKING
              </h2>
            </div>

            {createBookingError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs font-mono font-medium">
                [ERROR]: {createBookingError}
              </div>
            )}

            <form onSubmit={handleCreateBookingSubmit} className="space-y-4 text-sm font-mono">
              
              {/* Existing Client Selector */}
              <div className={`p-3 rounded-lg border ${
                isDark ? 'bg-[#060914] border-blue-900/60' : 'bg-slate-50 border-slate-300'
              }`}>
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-400 mb-1.5 flex items-center justify-between">
                  <span>&gt; AUTOFILL_EXISTING_CLIENT</span>
                  <span className="text-[10px] text-slate-400">{customers.length} records</span>
                </label>
                <select
                  value={selectedClientIdForBooking}
                  onChange={e => handleClientSelectInBooking(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md text-xs font-mono focus:outline-none ${
                    isDark ? 'bg-[#101730] border-blue-500/40 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                >
                  <option value="new">+ ADD NEW / ENTER CLIENT MANUALLY</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone && !c.phone.includes('Historical') ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  CLIENT_NAME *
                </label>
                <input
                  type="text"
                  required
                  value={newBookingForm.customer_name}
                  onChange={e => setNewBookingForm({ ...newBookingForm, customer_name: e.target.value })}
                  placeholder="e.g. Mary Higgins"
                  className={`w-full px-3.5 py-2 border rounded-md focus:outline-none ${
                    isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    PHONE_NUMBER *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newBookingForm.customer_phone}
                    onChange={e => setNewBookingForm({ ...newBookingForm, customer_phone: formatPhoneNumber(e.target.value) })}
                    placeholder="(585) 555-0123"
                    className={`w-full px-3.5 py-2 border rounded-md focus:outline-none ${
                      isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    EMAIL_ADDRESS
                  </label>
                  <input
                    type="email"
                    value={newBookingForm.customer_email}
                    onChange={e => setNewBookingForm({ ...newBookingForm, customer_email: e.target.value })}
                    placeholder="mary@gmail.com"
                    className={`w-full px-3.5 py-2 border rounded-md focus:outline-none ${
                      !validateEmail(newBookingForm.customer_email).isValid ? 'border-red-500' : ''
                    } ${
                      isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                  {!validateEmail(newBookingForm.customer_email).isValid && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={11} /> {validateEmail(newBookingForm.customer_email).message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    SERVICE_TYPE
                  </label>
                  <select
                    value={newBookingForm.location_preference}
                    onChange={e => {
                      const val = e.target.value
                      setNewBookingForm({
                        ...newBookingForm,
                        location_preference: val,
                        price: val === 'in-home' ? 50 : 40
                      })
                    }}
                    className={`w-full px-3.5 py-2 border rounded-md focus:outline-none ${
                      isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  >
                    <option value="in-home">IN-HOME VISIT ($50/HR)</option>
                    <option value="remote">REMOTE SUPPORT ($50/HR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    PAYMENT_STATUS
                  </label>
                  <select
                    value={newBookingForm.payment_status}
                    onChange={e => setNewBookingForm({ ...newBookingForm, payment_status: e.target.value })}
                    className={`w-full px-3.5 py-2 border rounded-md focus:outline-none ${
                      isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  >
                    <option value="pending">PENDING (PAY LATER)</option>
                    <option value="paid">PAID</option>
                  </select>
                </div>
              </div>

              {/* Address with Rochester Autocomplete */}
              {newBookingForm.location_preference === 'in-home' && (
                <div className="relative">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    STREET_ADDRESS (ROCHESTER AREA)
                  </label>
                  <input
                    type="text"
                    value={newBookingForm.customer_address}
                    onFocus={() => {
                      setActiveAddressField('newBooking')
                      setAddressSuggestions(getAddressSuggestions(newBookingForm.customer_address))
                    }}
                    onChange={e => {
                      const val = e.target.value
                      setNewBookingForm({ ...newBookingForm, customer_address: val })
                      setAddressSuggestions(getAddressSuggestions(val))
                    }}
                    placeholder="e.g. 123 Main St, Webster NY"
                    className={`w-full px-3.5 py-2 border rounded-md focus:outline-none ${
                      isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                  {activeAddressField === 'newBooking' && addressSuggestions.length > 0 && (
                    <div className={`absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border shadow-xl overflow-hidden ${
                      isDark ? 'bg-[#101730] border-blue-500/60 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                    }`}>
                      <div className="p-1 text-[10px] font-mono text-slate-400 px-3 bg-black/20">
                        &gt; AUTOCOMPLETE_SUGGESTIONS:
                      </div>
                      {addressSuggestions.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setNewBookingForm(prev => ({ ...prev, customer_address: s }))
                            setActiveAddressField(null)
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-sans flex items-center gap-2 transition-colors ${
                            isDark ? 'hover:bg-blue-600/30' : 'hover:bg-slate-100'
                          }`}
                        >
                          <MapPin size={12} className="text-red-500 shrink-0" />
                          <span>{s}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    APPOINTMENT_DATE *
                  </label>
                  <input
                    type="date"
                    required
                    value={newBookingForm.booking_date}
                    onChange={e => setNewBookingForm({ ...newBookingForm, booking_date: e.target.value })}
                    className={`w-full px-3.5 py-2 border rounded-md focus:outline-none ${
                      isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    TIME_SLOT *
                  </label>
                  <select
                    value={newBookingForm.booking_time}
                    onChange={e => setNewBookingForm({ ...newBookingForm, booking_time: e.target.value })}
                    className={`w-full px-3.5 py-2 border rounded-md focus:outline-none ${
                      isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  >
                    {[
                      '9:00 AM',
                      '10:00 AM',
                      '11:00 AM',
                      '12:00 PM',
                      '1:00 PM',
                      '2:00 PM',
                      '3:00 PM',
                      '4:00 PM',
                      '5:00 PM',
                      '6:00 PM'
                    ].map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  SERVICE_NOTES & TOPIC
                </label>
                <textarea
                  rows={2}
                  value={newBookingForm.notes}
                  onChange={e => setNewBookingForm({ ...newBookingForm, notes: e.target.value })}
                  placeholder="e.g. Printer won't connect, iPad photo organization..."
                  className={`w-full px-3.5 py-2 border rounded-md focus:outline-none resize-none font-sans text-xs ${
                    isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                ></textarea>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`flex-1 py-2.5 rounded-lg font-bold transition-all border ${
                    isDark ? 'bg-[#101730] border-blue-900/60 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBooking}
                  className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/30 transition-all border border-red-400 disabled:opacity-50"
                >
                  {isCreatingBooking ? 'SAVING...' : 'SAVE_RECORD'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW CUSTOMER */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border font-mono ${
            isDark ? 'bg-[#0A0E20] border-blue-500/50 text-slate-100 shadow-black/80' : 'bg-white border-slate-300 text-slate-800 shadow-slate-900/30'
          }`}>
            <button
              type="button"
              onClick={() => setIsAddCustomerModalOpen(false)}
              className={`absolute top-6 right-6 p-2 rounded-lg transition-colors ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-blue-950/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <UserPlus size={20} className="text-red-500" />
                &gt; ADD_NEW_CLIENT
              </h2>
            </div>

            {createCustomerError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs">
                [ERROR]: {createCustomerError}
              </div>
            )}

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    FIRST_NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomerForm.first_name}
                    onChange={e => setNewCustomerForm({ ...newCustomerForm, first_name: e.target.value })}
                    placeholder="Mary"
                    className={`w-full px-3.5 py-2 border rounded-md focus:outline-none ${
                      isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    LAST_NAME
                  </label>
                  <input
                    type="text"
                    value={newCustomerForm.last_name}
                    onChange={e => setNewCustomerForm({ ...newCustomerForm, last_name: e.target.value })}
                    placeholder="Smith"
                    className={`w-full px-3.5 py-2 border rounded-md focus:outline-none ${
                      isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    PHONE_NUMBER
                  </label>
                  <input
                    type="tel"
                    value={newCustomerForm.phone}
                    onChange={e => setNewCustomerForm({ ...newCustomerForm, phone: formatPhoneNumber(e.target.value) })}
                    placeholder="(585) 555-0123"
                    className={`w-full px-3.5 py-2 border rounded-md focus:outline-none ${
                      isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    EMAIL_ADDRESS
                  </label>
                  <input
                    type="email"
                    value={newCustomerForm.email}
                    onChange={e => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                    placeholder="mary@gmail.com"
                    className={`w-full px-3.5 py-2 border rounded-md focus:outline-none ${
                      !validateEmail(newCustomerForm.email).isValid ? 'border-red-500' : ''
                    } ${
                      isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                  {!validateEmail(newCustomerForm.email).isValid && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={11} /> {validateEmail(newCustomerForm.email).message}
                    </p>
                  )}
                </div>
              </div>

              {/* Address with Rochester Autocomplete */}
              <div className="relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  STREET_ADDRESS (ROCHESTER AREA)
                </label>
                <input
                  type="text"
                  value={newCustomerForm.address}
                  onFocus={() => {
                    setActiveAddressField('newCustomer')
                    setAddressSuggestions(getAddressSuggestions(newCustomerForm.address))
                  }}
                  onChange={e => {
                    const val = e.target.value
                    setNewCustomerForm({ ...newCustomerForm, address: val })
                    setAddressSuggestions(getAddressSuggestions(val))
                  }}
                  placeholder="e.g. 123 Main St, Fairport NY"
                  className={`w-full px-3.5 py-2 border rounded-md focus:outline-none ${
                    isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
                {activeAddressField === 'newCustomer' && addressSuggestions.length > 0 && (
                  <div className={`absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border shadow-xl overflow-hidden ${
                    isDark ? 'bg-[#101730] border-blue-500/60 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}>
                    <div className="p-1 text-[10px] text-slate-400 px-3 bg-black/20">
                      &gt; AUTOCOMPLETE_SUGGESTIONS:
                    </div>
                    {addressSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setNewCustomerForm(prev => ({ ...prev, address: s }))
                          setActiveAddressField(null)
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-sans flex items-center gap-2 transition-colors ${
                          isDark ? 'hover:bg-blue-600/30' : 'hover:bg-slate-100'
                        }`}
                      >
                        <MapPin size={12} className="text-red-500 shrink-0" />
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  CLIENT_NOTES & HARDWARE SPECS
                </label>
                <textarea
                  rows={3}
                  value={newCustomerForm.notes}
                  onChange={e => setNewCustomerForm({ ...newCustomerForm, notes: e.target.value })}
                  placeholder="e.g. Uses iPad and Windows laptop, preferred morning appointment time..."
                  className={`w-full px-3.5 py-2 border rounded-md focus:outline-none resize-none font-sans text-xs ${
                    isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                ></textarea>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerModalOpen(false)}
                  className={`flex-1 py-2.5 rounded-lg font-bold transition-all border ${
                    isDark ? 'bg-[#101730] border-blue-900/60 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCustomer}
                  className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/30 transition-all border border-red-400 disabled:opacity-50"
                >
                  {isCreatingCustomer ? 'SAVING...' : 'SAVE_CLIENT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT CUSTOMER */}
      {isEditCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border font-mono ${
            isDark ? 'bg-[#0A0E20] border-blue-500/50 text-slate-100 shadow-black/80' : 'bg-white border-slate-300 text-slate-800 shadow-slate-900/30'
          }`}>
            <button
              type="button"
              onClick={() => setIsEditCustomerModalOpen(false)}
              className={`absolute top-6 right-6 p-2 rounded-lg transition-colors ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-blue-950/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Edit3 size={20} className="text-red-500" />
                &gt; EDIT_CLIENT_DETAILS
              </h2>
            </div>

            {customerEditError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs">
                [ERROR]: {customerEditError}
              </div>
            )}

            <form onSubmit={handleUpdateCustomerSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  CLIENT_NAME *
                </label>
                <input
                  type="text"
                  required
                  value={customerEditForm.name}
                  onChange={e => setCustomerEditForm({ ...customerEditForm, name: e.target.value })}
                  placeholder="e.g. Mrs. Struever"
                  className={`w-full px-3.5 py-2 border rounded-md focus:outline-none ${
                    isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    PHONE_NUMBER
                  </label>
                  <input
                    type="tel"
                    value={customerEditForm.phone}
                    onChange={e => setCustomerEditForm({ ...customerEditForm, phone: formatPhoneNumber(e.target.value) })}
                    placeholder="(585) 555-0123"
                    className={`w-full px-3.5 py-2 border rounded-md focus:outline-none ${
                      isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    EMAIL_ADDRESS
                  </label>
                  <input
                    type="email"
                    value={customerEditForm.email}
                    onChange={e => setCustomerEditForm({ ...customerEditForm, email: e.target.value })}
                    placeholder="client@gmail.com"
                    className={`w-full px-3.5 py-2 border rounded-md focus:outline-none ${
                      !validateEmail(customerEditForm.email).isValid ? 'border-red-500' : ''
                    } ${
                      isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                  {!validateEmail(customerEditForm.email).isValid && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={11} /> {validateEmail(customerEditForm.email).message}
                    </p>
                  )}
                </div>
              </div>

              {/* Address with Rochester Autocomplete */}
              <div className="relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  STREET_ADDRESS
                </label>
                <input
                  type="text"
                  value={customerEditForm.address}
                  onFocus={() => {
                    setActiveAddressField('editCustomer')
                    setAddressSuggestions(getAddressSuggestions(customerEditForm.address))
                  }}
                  onChange={e => {
                    const val = e.target.value
                    setCustomerEditForm({ ...customerEditForm, address: val })
                    setAddressSuggestions(getAddressSuggestions(val))
                  }}
                  placeholder="e.g. 123 Main St, Rochester NY"
                  className={`w-full px-3.5 py-2 border rounded-md focus:outline-none ${
                    isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
                {activeAddressField === 'editCustomer' && addressSuggestions.length > 0 && (
                  <div className={`absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border shadow-xl overflow-hidden ${
                    isDark ? 'bg-[#101730] border-blue-500/60 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}>
                    <div className="p-1 text-[10px] text-slate-400 px-3 bg-black/20">
                      &gt; AUTOCOMPLETE_SUGGESTIONS:
                    </div>
                    {addressSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCustomerEditForm(prev => ({ ...prev, address: s }))
                          setActiveAddressField(null)
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-sans flex items-center gap-2 transition-colors ${
                          isDark ? 'hover:bg-blue-600/30' : 'hover:bg-slate-100'
                        }`}
                      >
                        <MapPin size={12} className="text-red-500 shrink-0" />
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditCustomerModalOpen(false)}
                  className={`flex-1 py-2.5 rounded-lg font-bold transition-all border ${
                    isDark ? 'bg-[#101730] border-blue-900/60 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingCustomer}
                  className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/30 transition-all border border-red-400 disabled:opacity-50"
                >
                  {isUpdatingCustomer ? 'SAVING...' : 'SAVE_CHANGES'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: BULK IMPORT JOBS (CSV) */}
      {isBulkImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-2xl rounded-2xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border font-mono ${
            isDark ? 'bg-[#0A0E20] border-blue-500/50 text-slate-100 shadow-black/80' : 'bg-white border-slate-300 text-slate-800 shadow-slate-900/30'
          }`}>
            <button
              type="button"
              onClick={() => setIsBulkImportModalOpen(false)}
              className={`absolute top-6 right-6 p-2 rounded-lg transition-colors ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-blue-950/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <FileSpreadsheet size={20} className="text-red-500" />
                &gt; BULK_IMPORT_DATA_FEED
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Paste spreadsheet rows (Client, Date, Amount) to batch import.
              </p>
            </div>

            {csvImportError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs">
                [ERROR]: {csvImportError}
              </div>
            )}

            {csvImportMessage && (
              <div className="mb-4 p-3 rounded-lg bg-blue-950/60 border border-blue-600 text-blue-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{csvImportMessage}</span>
              </div>
            )}

            <form onSubmit={handleBulkImportSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  CSV_RAW_PAYLOAD
                </label>
                <textarea
                  rows={8}
                  required
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                  placeholder={`Client,Date,Amount
Mr. Mattioli,5/17/2022,$30.00
Mrs. Struever,9/19/2022,$30.00
Jerry Infantino,9/1/2024,$30.00`}
                  className={`w-full font-mono text-xs px-3.5 py-2.5 border rounded-lg focus:outline-none resize-none leading-relaxed ${
                    isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                ></textarea>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsBulkImportModalOpen(false)}
                  className={`flex-1 py-2.5 rounded-lg font-bold transition-all border ${
                    isDark ? 'bg-[#101730] border-blue-900/60 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isImportingCsv || !csvText.trim()}
                  className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/30 transition-all border border-red-400 disabled:opacity-50"
                >
                  {isImportingCsv ? 'IMPORTING...' : 'EXECUTE_IMPORT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: CUSTOMER HISTORY DRILL-DOWN */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-xl rounded-2xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border font-mono ${
            isDark ? 'bg-[#0A0E20] border-blue-500/50 text-slate-100 shadow-black/80' : 'bg-white border-slate-300 text-slate-800 shadow-slate-900/30'
          }`}>
            <button
              type="button"
              onClick={() => setSelectedCustomer(null)}
              className={`absolute top-6 right-6 p-2 rounded-lg transition-colors ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-blue-950/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 rounded-lg font-bold flex items-center justify-center text-lg border bg-blue-500/10 border-blue-500/30 text-blue-400">
                {(selectedCustomer.name || 'C')
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div>
                <h2 className={`text-xl font-bold font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedCustomer.name}
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedCustomer.totalBookings} TOTAL_VISITS &bull; ${selectedCustomer.totalSpent.toFixed(2)} GROSS_SPENT
                </p>
              </div>
            </div>

            {/* Contact details */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border rounded-lg text-xs mb-6 ${
              isDark ? 'bg-[#060914] border-blue-900/60' : 'bg-slate-50 border-slate-300'
            }`}>
              {selectedCustomer.phone && !selectedCustomer.phone.includes('Historical') && (
                <div>
                  <span className="text-slate-400 font-bold block">PHONE</span>
                  <a href={`tel:${selectedCustomer.phone}`} className="font-bold text-blue-400 hover:underline">
                    {selectedCustomer.phone}
                  </a>
                </div>
              )}
              {selectedCustomer.email && !selectedCustomer.email.includes('@client.smartsasstech.com') && (
                <div>
                  <span className="text-slate-400 font-bold block">EMAIL</span>
                  <a href={`mailto:${selectedCustomer.email}`} className="font-bold text-slate-300 hover:underline truncate block">
                    {selectedCustomer.email}
                  </a>
                </div>
              )}
              {selectedCustomer.address && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400 font-bold block">ADDRESS</span>
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{selectedCustomer.address}</span>
                </div>
              )}
            </div>

            {/* Service History List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-500">
                &gt; APPOINTMENT_LOGS ({selectedCustomer.history.length})
              </h3>

              {selectedCustomer.history.length === 0 ? (
                <p className={`text-xs p-4 rounded-lg border text-center ${
                  isDark ? 'bg-[#060914] border-blue-900/40 text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-400'
                }`}>
                  &gt; NO_RECORDED_BOOKINGS_FOR_THIS_CLIENT
                </p>
              ) : (
                selectedCustomer.history.map((h, i) => {
                  const isHistoricalGeneric =
                    h.serviceName === 'Historical completed appointment' ||
                    h.serviceName?.toLowerCase().includes('historical') ||
                    h.serviceName === 'Customer Profile Created' ||
                    !h.serviceName

                  const displayTitle = isHistoricalGeneric
                    ? (h.location === 'in-home' ? 'In-Home Tech Session' : 'Tech Support Session')
                    : h.serviceName

                  const isGenericNote =
                    h.notes === 'Historical completed appointment' ||
                    h.notes === 'Bulk imported record' ||
                    h.notes === 'Bulk imported completed appointment' ||
                    h.notes === 'Customer Profile Created' ||
                    !h.notes

                  return (
                    <div
                      key={h.id || i}
                      className={`p-3 border rounded-lg space-y-1.5 text-xs ${
                        isDark ? 'bg-[#060914] border-blue-900/50' : 'bg-slate-50 border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold font-sans text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {displayTitle}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border bg-blue-500/20 text-blue-300 border-blue-500/40">
                          {h.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-red-400" />
                          {h.date} {h.time && h.time !== '10:00 AM' ? `@ ${h.time}` : ''}
                        </span>
                        <span>&bull;</span>
                        <span className="font-bold text-blue-400">${Number(h.price).toFixed(2)}</span>
                      </div>

                      {!isGenericNote && h.notes && (
                        <p className={`p-2 rounded border font-sans text-xs leading-relaxed ${
                          isDark ? 'bg-[#0A0E20] border-blue-900/40 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                        }`}>
                          {h.notes}
                        </p>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            <div className={`mt-6 pt-4 border-t flex justify-end ${isDark ? 'border-blue-900/40' : 'border-slate-300'}`}>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors border ${
                  isDark ? 'bg-[#101730] border-blue-900/60 text-white hover:bg-[#182245]' : 'bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300'
                }`}
              >
                CLOSE
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 6: INVOICE / SERVICE RECEIPT GENERATOR & PRINT VIEW */}
      {selectedInvoiceBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-2xl rounded-2xl p-6 sm:p-8 shadow-2xl relative max-h-[95vh] overflow-y-auto border ${
            isDark ? 'bg-[#0A0E20] border-blue-500/60 text-slate-100 shadow-black/80' : 'bg-white border-slate-300 text-slate-900 shadow-slate-900/30'
          }`}>
            <button
              type="button"
              onClick={() => setSelectedInvoiceBooking(null)}
              className={`absolute top-6 right-6 p-2 rounded-lg transition-colors print:hidden ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-blue-950/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X size={20} />
            </button>

            {/* Print Action Bar (Top) */}
            <div className="flex items-center justify-between gap-3 pb-4 mb-6 border-b print:hidden font-mono text-xs border-blue-900/40">
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <FileText size={16} />
                <span>&gt; OFFICIAL_SERVICE_RECEIPT</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all border border-blue-400"
                >
                  <Printer size={14} />
                  <span>PRINT / SAVE PDF</span>
                </button>
              </div>
            </div>

            {/* Printable Receipt Container */}
            <div id="sst-invoice-printable" className="p-4 sm:p-6 rounded-xl border font-sans bg-white text-slate-900 border-slate-200 shadow-inner">
              
              {/* Receipt Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                      SMARTSASS TECH
                    </h1>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    Personalized In-Home & Remote Tech Support
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    Rochester, NY &bull; (585) 645-4549 &bull; smartsasstech@gmail.com
                  </p>
                </div>
                <div className="text-left sm:text-right font-mono">
                  <div className="inline-block px-2.5 py-1 rounded text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
                    RECEIPT #{selectedInvoiceBooking.id.replace(/-/g, '').slice(0, 8).toUpperCase()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5 space-y-0.5">
                    <div><strong>Date Issued:</strong> {new Date().toLocaleDateString()}</div>
                    <div><strong>Service Date:</strong> {selectedInvoiceBooking.booking_date}</div>
                    <div><strong>Time:</strong> {selectedInvoiceBooking.booking_time}</div>
                  </div>
                </div>
              </div>

              {/* Bill To & Status Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                    CLIENT INFORMATION
                  </h3>
                  <div className="font-bold text-sm text-slate-900">
                    {selectedInvoiceBooking.customer_name}
                  </div>
                  {selectedInvoiceBooking.customer_phone && selectedInvoiceBooking.customer_phone !== 'N/A' && !selectedInvoiceBooking.customer_phone.includes('Historical') && (
                    <div className="text-slate-600 font-mono mt-0.5">
                      Phone: {selectedInvoiceBooking.customer_phone}
                    </div>
                  )}
                  {selectedInvoiceBooking.customer_email && !selectedInvoiceBooking.customer_email.includes('@client.smartsasstech.com') && (
                    <div className="text-slate-600 font-mono">
                      Email: {selectedInvoiceBooking.customer_email}
                    </div>
                  )}
                  {selectedInvoiceBooking.customer_address && (
                    <div className="text-slate-600 mt-0.5">
                      Location: {selectedInvoiceBooking.customer_address}
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-start sm:items-end">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                    PAYMENT STATUS
                  </h3>
                  <div>
                    {selectedInvoiceBooking.payment_status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                        <Check size={12} /> PAID IN FULL
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                        <Clock size={12} /> PAYMENT PENDING
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-2 font-mono sm:text-right">
                    Method: In-Person / Digital Invoice
                  </div>
                </div>
              </div>

              {/* Service Line Items Table */}
              <div className="py-4">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-600 font-mono text-[11px] uppercase">
                      <th className="py-2">Service Description</th>
                      <th className="py-2 text-center">Type</th>
                      <th className="py-2 text-right">Rate</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    <tr>
                      <td className="py-3 pr-2">
                        <div className="font-bold text-slate-900">
                          {selectedInvoiceBooking.service_name || 'Tech Support & Troubleshooting'}
                        </div>
                        {selectedInvoiceBooking.notes && (
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            {selectedInvoiceBooking.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-center uppercase font-mono text-[11px] font-bold text-slate-700">
                        {selectedInvoiceBooking.location_preference === 'in-home' ? 'In-Home' : 'Remote'}
                      </td>
                      <td className="py-3 text-right font-mono text-slate-700">
                        ${Number(selectedInvoiceBooking.price || (selectedInvoiceBooking.location_preference === 'in-home' ? 50 : 40)).toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900">
                        ${Number(selectedInvoiceBooking.price || (selectedInvoiceBooking.location_preference === 'in-home' ? 50 : 40)).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300 font-mono">
                      <td colSpan={3} className="py-3 text-right font-bold text-slate-800">
                        TOTAL DUE / CHARGED:
                      </td>
                      <td className="py-3 text-right font-bold text-base text-blue-900">
                        ${Number(selectedInvoiceBooking.price || (selectedInvoiceBooking.location_preference === 'in-home' ? 50 : 40)).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Thank You & Follow Up Footer */}
              <div className="mt-4 pt-4 border-t border-slate-200 text-center text-xs text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">
                  Thank you for trusting SmartSass Tech with your technology needs!
                </p>
                <p className="text-[11px]">
                  For questions or next appointments, call (585) 645-4549 or email smartsasstech@gmail.com
                </p>
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="mt-6 pt-4 border-t flex justify-end gap-3 font-mono print:hidden border-blue-900/40">
              <button
                type="button"
                onClick={() => setSelectedInvoiceBooking(null)}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors border ${
                  isDark ? 'bg-[#101730] border-blue-900/60 text-white hover:bg-[#182245]' : 'bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300'
                }`}
              >
                CLOSE
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all border border-blue-400 flex items-center gap-1.5"
              >
                <Printer size={14} />
                <span>PRINT_RECEIPT</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 7: CLIENT HARDWARE & DEVICE PROFILE TRACKER */}
      {selectedDeviceCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-xl rounded-2xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border font-mono ${
            isDark ? 'bg-[#0A0E20] border-blue-500/50 text-slate-100 shadow-black/80' : 'bg-white border-slate-300 text-slate-800 shadow-slate-900/30'
          }`}>
            <button
              type="button"
              onClick={() => setSelectedDeviceCustomer(null)}
              className={`absolute top-6 right-6 p-2 rounded-lg transition-colors ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-blue-950/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="text-[10px] text-slate-500 font-mono">SYS_INVENTORY://hardware_profile</span>
              </div>
              <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Laptop size={20} className="text-blue-400" />
                &gt; HARDWARE_SPECS: {selectedDeviceCustomer.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Log client computers, tablets, printer connection, WiFi router and tech quirks for quick reference during support visits.
              </p>
            </div>

            {deviceProfileError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs font-mono">
                [ERROR]: {deviceProfileError}
              </div>
            )}

            {deviceProfileSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-blue-950/60 border border-blue-600 text-blue-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{deviceProfileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveDeviceProfile} className="space-y-4 text-sm font-mono">
              
              {/* Primary Devices */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-400 mb-1 flex items-center gap-1.5">
                  <Laptop size={13} />
                  <span>PRIMARY_DEVICES & OPERATING SYSTEMS</span>
                </label>
                <input
                  type="text"
                  value={deviceProfileForm.devices}
                  onChange={e => setDeviceProfileForm({ ...deviceProfileForm, devices: e.target.value })}
                  placeholder="e.g. 2022 HP Envy (Windows 11), iPad 9th Gen, iPhone 14"
                  className={`w-full px-3.5 py-2 border rounded-md focus:outline-none text-xs font-sans ${
                    isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
              </div>

              {/* Printer Details */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1.5">
                  <Printer size={13} />
                  <span>PRINTER MODEL & CONNECTION SETUP</span>
                </label>
                <input
                  type="text"
                  value={deviceProfileForm.printer}
                  onChange={e => setDeviceProfileForm({ ...deviceProfileForm, printer: e.target.value })}
                  placeholder="e.g. HP OfficeJet 8022e (Wireless, IP: 192.168.1.55)"
                  className={`w-full px-3.5 py-2 border rounded-md focus:outline-none text-xs font-sans ${
                    isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
              </div>

              {/* WiFi & Router Information */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-400 mb-1 flex items-center gap-1.5">
                  <Wifi size={13} />
                  <span>HOME WIFI / ROUTER CONFIGURATION</span>
                </label>
                <input
                  type="text"
                  value={deviceProfileForm.wifi_info}
                  onChange={e => setDeviceProfileForm({ ...deviceProfileForm, wifi_info: e.target.value })}
                  placeholder="e.g. Spectrum WiFi 6 (Living room router, 5GHz SSID: SST_Home)"
                  className={`w-full px-3.5 py-2 border rounded-md focus:outline-none text-xs font-sans ${
                    isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
              </div>

              {/* Tech Notes & Quirks */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <HardDrive size={13} />
                  <span>TECH QUIRKS, SOFTWARE & NOTES</span>
                </label>
                <textarea
                  rows={3}
                  value={deviceProfileForm.tech_notes}
                  onChange={e => setDeviceProfileForm({ ...deviceProfileForm, tech_notes: e.target.value })}
                  placeholder="e.g. Prefers large display scaling, Bitdefender installed, needs help sorting iCloud photos."
                  className={`w-full px-3.5 py-2 border rounded-md focus:outline-none resize-none font-sans text-xs ${
                    isDark ? 'bg-[#060914] border-blue-900/60 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                ></textarea>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedDeviceCustomer(null)}
                  className={`flex-1 py-2.5 rounded-lg font-bold transition-all border ${
                    isDark ? 'bg-[#101730] border-blue-900/60 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSavingDeviceProfile}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30 transition-all border border-blue-400 disabled:opacity-50"
                >
                  {isSavingDeviceProfile ? 'SAVING...' : 'SAVE_SPECS'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
