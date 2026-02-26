import { getArticleBySlug, getArticles } from '@/lib/articles'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'
import ArticleTOC from '@/components/ArticleTOC'

interface ArticlePageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const articles = await getArticles()
  return articles.map(article => ({
    slug: article.slug,
  }))
}

// Simple slug function to generate stable IDs from text
function slugifyText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  // Parse headings from markdown content using regex
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const headings: Array<{ level: number; text: string; id: string }> = []
  let match
  // ensure heading IDs are unique when there are repeated headings
  const idCounts: Record<string, number> = {}
  while ((match = headingRegex.exec(article.content)) !== null) {
    const level = match[1].length
    const text = match[2]
    const baseId = slugifyText(text)
    const count = (idCounts[baseId] || 0) + 1
    idCounts[baseId] = count
    const id = count === 1 ? baseId : `${baseId}-${count}`
    headings.push({ level, text, id })
  }

  // Renderer adds IDs to headings using the same slug function
  // Use the same IDs for rendered headings as were collected for the TOC above.
  let headingRenderIndex = 0
  const renderer = {
    heading(text: string, level: number) {
      const id = headings[headingRenderIndex]?.id ?? slugifyText(text)
      headingRenderIndex += 1
      return `<h${level} id="${id}">${text}</h${level}>`
    }
  }
  marked.use({ renderer })

  // Render markdown to HTML on the server and sanitize the output
  const rawHtml = await marked.parse(article.content || '')
  const cleanHtml = sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'pre', 'code'
    ]),
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      code: ['class'],
      h1: ['id'],
      h2: ['id'],
      h3: ['id'],
      h4: ['id'],
      h5: ['id'],
      h6: ['id']
    },
    allowedSchemesByTag: {
      img: ['http', 'https', 'data']
    }
  })

  return (
    <div className="bg-kb-bg min-h-screen">
      <section className="bg-kb-navy text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/articles" className="inline-flex items-center text-kb-cream hover:text-white mb-6 text-sm font-medium">
            ← Back to Articles
          </Link>
          <h1 className="text-title text-white mb-4">{article.title}</h1>
          <p className="text-lg text-kb-cream mb-6 leading-relaxed">{article.description}</p>
          <div className="flex flex-wrap gap-3 items-center">
            <span className="px-3 py-1 bg-kb-slate rounded-full text-sm font-medium">
              {article.category}
            </span>
            {(article.hardware || article.platforms) && (article.hardware?.length || 0) + (article.platforms?.length || 0) > 0 && (
              <span className="text-sm text-kb-pale">
                {(article.hardware?.length || 0) + (article.platforms?.length || 0)} device{(article.hardware?.length || 0) + (article.platforms?.length || 0) !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {headings.length > 0 && (
            <aside className="lg:col-span-3 lg:sticky lg:top-24 lg:h-fit max-h-[calc(100vh-120px)] overflow-y-auto">
              {/* New client-side TOC component provides collapsible groups */}
              <div className="px-2">
                {/* dynamically import the client TOC component */}
                {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
                {/* render ArticleTOC */}
                <ArticleTOC headings={headings} />
              </div>
            </aside>
          )}

          <div className={headings.length > 0 ? 'lg:col-span-9' : 'lg:col-span-12'}>
            <article className="bg-white rounded-lg shadow-sm p-10 text-base leading-relaxed text-kb-dark space-y-6">
              <div className="article-content" dangerouslySetInnerHTML={{ __html: cleanHtml }} />
            </article>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-kb-navy">
          <h3 className="mb-4">Article Information</h3>

          {(article.hardware || article.platforms) && (article.hardware?.length || 0) + (article.platforms?.length || 0) > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-kb-slate mb-2 text-sm uppercase tracking-wide">Applies to:</h4>
              <div className="flex flex-wrap gap-2">
                {article.hardware?.map((device: string) => (
                  <span key={device} className="px-3 py-1 bg-kb-pale text-kb-navy rounded text-sm">
                    {device}
                  </span>
                ))}
                {article.platforms?.map((platform: string) => (
                  <span key={platform} className="px-3 py-1 bg-kb-pale text-kb-navy rounded text-sm">
                    {platform}
                  </span>
                ))}
              </div>
            </div>
          )}

          {article.tags && article.tags.length > 0 && (
            <div>
              <h4 className="font-semibold text-kb-slate mb-2 text-sm uppercase tracking-wide">Tags:</h4>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 bg-kb-bg text-kb-navy rounded text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/articles" className="inline-flex items-center px-6 py-3 bg-kb-navy text-white rounded-lg hover:bg-kb-slate transition-colors font-semibold">
            ← Back to Articles
          </Link>
        </div>
      </section>
    </div>
  )
}
