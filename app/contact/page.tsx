'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ContactRedirect() {
    const router = useRouter()

    useEffect(() => {
        router.replace('/support')
    }, [router])

    return (
        <div className="bg-kb-bg min-h-screen flex items-center justify-center">
            <p className="text-kb-muted">Redirecting to Help Center...</p>
        </div>
    )
}
