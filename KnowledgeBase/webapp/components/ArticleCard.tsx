'use client'

import Link from 'next/link'
import { ArticleMetadata } from '@/lib/articles'

interface ArticleCardProps {
  article: ArticleMetadata
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const getBadgeColor = (type: string) => {
    const t = type.toLowerCase()
    // Map new CSV types to colors
    if (t.includes('how-to') || t.includes('setup')) return 'bg-kb-navy text-white'
    if (t.includes('tutorial')) return 'bg-kb-teal text-white'
    if (t.includes('safety') || t.includes('security')) return 'bg-kb-orange text-white'
    if (t.includes('troubleshooting')) return 'bg-kb-slate text-white'
    if (t.includes('educational')) return 'bg-kb-purple text-white'
    if (t.includes('consumer decision')) return 'bg-kb-blue text-white'

    // Legacy fallbacks
    if (t === 'guide') return 'bg-kb-teal text-white'
    if (t === 'reference') return 'bg-kb-navy text-white'
    if (t === 'news') return 'bg-kb-purple text-white'

    return 'bg-kb-pale text-kb-navy'
  }

  return (
    <Link href={`/articles/${article.slug}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all h-full p-6 border-l-4 border-kb-navy hover:border-kb-slate cursor-pointer relative">
        <div className="flex justify-between items-start gap-4 mb-3">
          <h3 className="text-lg font-semibold text-kb-navy">{article.title}</h3>
          {article.articleType && (
            <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${getBadgeColor(article.articleType)}`}>
              {article.articleType}
            </span>
          )}
        </div>

        <p className="text-kb-muted text-sm mb-4 line-clamp-2">
          {article.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-xs bg-kb-pale text-kb-navy px-2 py-1 rounded">
            {article.category}
          </span>
        </div>

        {(article.hardware?.length || article.platforms?.length || article.deviceType?.length || article.platformCategory) ? (
          <div className="flex flex-wrap gap-1">
            {[
              ...(article.hardware || []),
              ...(article.platforms || []),
              ...(article.deviceType || []),
              ...(article.platformCategory ? [article.platformCategory] : [])
            ].slice(0, 3).map((item, idx) => (
              <span key={idx} className="text-xs text-kb-muted bg-kb-bg px-2 py-0.5 rounded">
                {item}
              </span>
            ))}
            {([
              ...(article.hardware || []),
              ...(article.platforms || []),
              ...(article.deviceType || []),
              ...(article.platformCategory ? [article.platformCategory] : [])
            ].length) > 3 && (
                <span className="text-xs text-kb-muted bg-kb-bg px-2 py-0.5 rounded">
                  +{[
                    ...(article.hardware || []),
                    ...(article.platforms || []),
                    ...(article.deviceType || []),
                    ...(article.platformCategory ? [article.platformCategory] : [])
                  ].length - 3} more
                </span>
              )}
          </div>
        ) : null}
      </div>
    </Link>
  )
}
