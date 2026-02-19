
'use client'

import Link from 'next/link'
import { getCategoryEmoji } from '@/lib/constants'

interface CategoryCardProps {
  title: string
  icon?: string
  count: number
  href: string
}

export default function CategoryCard({ title, icon, count, href }: CategoryCardProps) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-105 p-6 cursor-pointer h-full">
        <div className="text-4xl mb-4">{icon || getCategoryEmoji(title)}</div>
        <h3 className="text-lg font-semibold text-kb-navy mb-2">{title}</h3>
        <p className="text-kb-muted text-sm">{count} article{count !== 1 ? 's' : ''}</p>
      </div>
    </Link>
  )
}
