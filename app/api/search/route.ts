import { NextRequest, NextResponse } from 'next/server'
import { globalSearch } from '@/lib/search'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''

    if (!query.trim()) {
        return NextResponse.json({ articles: [], troubleshooting: [], deviceSupport: [], services: [], total: 0 })
    }

    try {
        const results = await globalSearch(query)
        return NextResponse.json(results)
    } catch (error: any) {
        console.error('Search API error:', error)
        return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }
}
