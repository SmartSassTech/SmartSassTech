'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
    Users, 
    Search, 
    Trash2, 
    AlertCircle, 
    Shield, 
    User as UserIcon,
    Mail,
    Calendar,
    ChevronRight,
    Loader2,
    ArrowUpCircle,
    ArrowDownCircle,
    UserCheck
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import withAuth from '@/components/withAuth'

interface Profile {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
    role: string
    created_at: string
}

function UserManagementPage() {
    const [users, setUsers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isAgent, setIsAgent] = useState<boolean | null>(null)
    const [currentUserRole, setCurrentUserRole] = useState<string>('client')
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')
    const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null)

    useEffect(() => {
        checkRole()
    }, [])

    const checkRole = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const role = user.app_metadata?.role || 'client'
            setCurrentUserRole(role)
            setIsAgent(role === 'agent' || role === 'admin')
            if (role === 'agent' || role === 'admin') {
                fetchUsers()
            }
        } else {
            setIsAgent(false)
        }
    }

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setUsers(data || [])
        } catch (error: any) {
            console.error('Error fetching users:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteUser = async () => {
        if (!deletingUserId || deleteConfirmText.toUpperCase() !== 'DELETE') return

        setIsDeleting(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('No active session.')

            const response = await fetch('/api/auth/delete-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ userId: deletingUserId })
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Failed to delete user.')

            setUsers(users.filter(u => u.id !== deletingUserId))
            setDeletingUserId(null)
            setDeleteConfirmText('')
        } catch (error: any) {
            alert(error.message)
        } finally {
            setIsDeleting(false)
        }
    }

    const handleUpdateRole = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'agent' ? 'client' : 'agent'
        setUpdatingRoleId(userId)
        
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('No active session.')

            const response = await fetch('/api/auth/update-role', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ userId, role: newRole })
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Failed to update role.')

            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
        } catch (error: any) {
            alert(error.message)
        } finally {
            setUpdatingRoleId(null)
        }
    }

    const filteredUsers = users.filter(user => {
        const searchStr = `${user.first_name} ${user.last_name} ${user.email}`.toLowerCase()
        return searchStr.includes(searchQuery.toLowerCase())
    })

    if (isAgent === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-kb-bg p-4">
                <div className="text-center space-y-4">
                    <Shield size={48} className="mx-auto text-red-500" />
                    <h1 className="text-2xl font-bold text-kb-navy">Access Denied</h1>
                    <p className="text-kb-muted">Only authorized agents can access this area.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-kb-bg pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-kb-navy flex items-center gap-3">
                            <Users className="text-sst-primary" size={40} />
                            User Management
                        </h1>
                        <p className="text-kb-muted mt-2">Manage client accounts and system access.</p>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-kb-muted group-focus-within:text-sst-primary transition-colors" size={20} />
                        <input 
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-3xl w-full md:w-80 shadow-sm focus:ring-2 focus:ring-sst-primary/20 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 space-y-4">
                            <Loader2 className="w-12 h-12 text-sst-primary animate-spin" />
                            <p className="text-kb-muted font-medium animate-pulse">Loading user directory...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="px-8 py-6 text-xs font-bold text-kb-muted uppercase tracking-wider">User</th>
                                        <th className="px-8 py-6 text-xs font-bold text-kb-muted uppercase tracking-wider">Role</th>
                                        <th className="px-8 py-6 text-xs font-bold text-kb-muted uppercase tracking-wider">Joined</th>
                                        <th className="px-8 py-6 text-xs font-bold text-kb-muted uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-sst-primary/10 flex items-center justify-center text-sst-primary">
                                                        <UserIcon size={24} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-kb-navy flex items-center gap-2">
                                                            {user.first_name || 'No'} {user.last_name || 'Name'}
                                                        </div>
                                                        <div className="text-sm text-kb-muted flex items-center gap-2">
                                                            <Mail size={12} />
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit ${
                                                    user.role === 'client' 
                                                        ? 'bg-blue-50 text-blue-600 border-blue-100' 
                                                        : user.role === 'admin'
                                                        ? 'bg-red-50 text-red-600 border-red-100'
                                                        : 'bg-sst-primary/10 text-sst-primary border-sst-primary/20'
                                                }`}>
                                                    {user.role === 'admin' && <Shield size={12} />}
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-sm text-kb-muted flex items-center gap-2">
                                                    <Calendar size={14} />
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Role Toggle Button - Only visible to admins or certain roles if needed */}
                                                    {(currentUserRole === 'admin' || currentUserRole === 'agent') && user.role !== 'admin' && (
                                                        <button 
                                                            onClick={() => handleUpdateRole(user.id, user.role)}
                                                            disabled={updatingRoleId === user.id}
                                                            title={user.role === 'agent' ? 'Demote to Client' : 'Promote to Agent'}
                                                            className={`p-3 rounded-2xl transition-all active:scale-90 ${
                                                                user.role === 'agent'
                                                                    ? 'text-orange-500 hover:bg-orange-50'
                                                                    : 'text-green-500 hover:bg-green-50'
                                                            }`}
                                                        >
                                                            {updatingRoleId === user.id ? (
                                                                <Loader2 size={20} className="animate-spin" />
                                                            ) : user.role === 'agent' ? (
                                                                <ArrowDownCircle size={20} />
                                                            ) : (
                                                                <ArrowUpCircle size={20} />
                                                            )}
                                                        </button>
                                                    )}
                                                    
                                                    <button 
                                                        onClick={() => setDeletingUserId(user.id)}
                                                        disabled={user.role === 'admin'} // Cannot delete admins
                                                        className="p-3 text-red-100 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all active:scale-90 disabled:opacity-0"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-24 text-center">
                                                <div className="max-w-xs mx-auto space-y-4">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mx-auto">
                                                        <Users size={32} />
                                                    </div>
                                                    <p className="text-kb-muted font-medium">No users found matching your search.</p>
                                                    <button 
                                                        onClick={() => setSearchQuery('')}
                                                        className="text-sst-primary font-bold hover:underline"
                                                    >
                                                        Clear Search
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Deletion Modal */}
            <AnimatePresence>
                {deletingUserId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeletingUserId(null)}
                            className="absolute inset-0 bg-kb-navy/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-[2rem] shadow-2xl p-8 max-w-md w-full border border-red-100"
                        >
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-kb-navy text-center mb-2">Delete User Account?</h3>
                            <p className="text-kb-muted text-center text-sm mb-8 leading-relaxed">
                                You are about to delete <strong>{users.find(u => u.id === deletingUserId)?.email}</strong>. This is irreversible.
                            </p>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-kb-muted uppercase tracking-wider text-center">
                                        Type <span className="text-red-600">DELETE</span> below to confirm
                                    </p>
                                    <input 
                                        type="text" 
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        placeholder="DELETE"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-center font-bold tracking-widest focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-gray-300 uppercase"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button 
                                        onClick={() => setDeletingUserId(null)}
                                        className="flex-1 py-4 bg-gray-100 text-kb-navy font-bold rounded-2xl hover:bg-gray-200 transition-all text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleDeleteUser}
                                        disabled={deleteConfirmText.toUpperCase() !== 'DELETE' || isDeleting}
                                        className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95 disabled:opacity-50 text-sm"
                                    >
                                        {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default withAuth(UserManagementPage, { allowedRoles: ['agent', 'admin'] })


