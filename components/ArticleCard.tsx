'use client'

import Link from 'next/link'
import { ArticleMetadata } from '@/lib/articles'

interface ArticleCardProps {
  article: ArticleMetadata
}

const TYPE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  'how-to': { bg: '#EEF2FF', text: '#3730A3', dot: '#4F46E5' },
  'setup': { bg: '#EEF2FF', text: '#3730A3', dot: '#4F46E5' },
  'tutorial': { bg: '#F0FDF4', text: '#166534', dot: '#16A34A' },
  'safety': { bg: '#FFF7ED', text: '#9A3412', dot: '#EA580C' },
  'security': { bg: '#FFF7ED', text: '#9A3412', dot: '#EA580C' },
  'troubleshooting': { bg: '#F0F9FF', text: '#075985', dot: '#0284C7' },
  'educational': { bg: '#FAF5FF', text: '#6B21A8', dot: '#9333EA' },
  'consumer decision': { bg: '#FDF4FF', text: '#701A75', dot: '#C026D3' },
  'guide': { bg: '#F0FDF4', text: '#166534', dot: '#16A34A' },
  'reference': { bg: '#EEF2FF', text: '#3730A3', dot: '#4F46E5' },
  'news': { bg: '#FAF5FF', text: '#6B21A8', dot: '#9333EA' },
}

function getTypeStyle(type: string) {
  const key = Object.keys(TYPE_STYLES).find(k => type.toLowerCase().includes(k))
  return key ? TYPE_STYLES[key] : { bg: '#F3F4F6', text: '#374151', dot: '#6B7280' }
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const typeStyle = article.articleType ? getTypeStyle(article.articleType) : null
  const tags = [
    ...(article.hardware || []),
    ...(article.platforms || []),
    ...(article.deviceType || []),
    ...(article.platformCategory ? [article.platformCategory] : []),
  ].slice(0, 3)

  return (
    <Link href={`/articles/${article.slug}`} className="article-card-link">
      <div className="article-card">
        {/* Type Badge Row */}
        {typeStyle && article.articleType && (
          <div className="article-card-badge-row">
            <span
              className="article-card-badge"
              style={{ background: typeStyle.bg, color: typeStyle.text }}
            >
              <span className="badge-dot" style={{ background: typeStyle.dot }} />
              {article.articleType}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="article-card-title">{article.title}</h3>

        {/* Description */}
        {article.description && (
          <p className="article-card-desc">{article.description}</p>
        )}

        {/* Category + Tags */}
        <div className="article-card-footer">
          <span className="article-card-category">{article.category}</span>
          {tags.map((tag, idx) => (
            <span key={idx} className="article-card-tag">{tag}</span>
          ))}
        </div>

        {/* Read arrow */}
        <div className="article-card-read">
          Read article
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      </div>
    </Link>
  )
}
