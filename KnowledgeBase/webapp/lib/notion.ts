import { Client } from '@notionhq/client'
import { NotionToMarkdown } from 'notion-to-md'
import { Article, ArticleMetadata } from './articles'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_DATABASE_ID = 'da201fe9-c3d7-4ae9-a5f3-662f13e76c46' // Senior Tech Knowledge Base

if (!NOTION_API_KEY) {
    console.warn('NOTION_API_KEY is not set in .env.local')
}

const notion = new Client({ auth: NOTION_API_KEY })
const n2m = new NotionToMarkdown({ notionClient: notion })

function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-') // Replace multiple - with single -
}

function getPlainText(richText: any[]): string {
    return richText?.map((t: any) => t.plain_text).join('') || ''
}

export async function fetchArticlesFromNotion(): Promise<Article[]> {
    if (!NOTION_API_KEY) return []

    try {
        // Using dataSources.query as discovered in debug
        const response = await (notion as any).dataSources.query({
            data_source_id: NOTION_DATABASE_ID,
        })

        const articles = await Promise.all(
            response.results.map(async (page: any) => {
                const props = page.properties
                const title = getPlainText(props['Article Title']?.title) || 'Untitled'
                const slug = slugify(title)

                // Map properties
                const category = props['Category']?.select?.name || 'Uncategorized'
                const description = getPlainText(props['Senior-Friendly Title']?.rich_text) || ''
                const deviceType = props['Target Device']?.multi_select?.map((s: any) => s.name) || []
                const platformCategory = [getPlainText(props['Sub-Category']?.rich_text)].filter(Boolean)

                // Fetch content - SKIP for list view to improve performance
                // const mdblocks = await n2m.pageToMarkdown(page.id)
                // const mdString = n2m.toMarkdownString(mdblocks)

                return {
                    id: page.id,
                    title,
                    description,
                    category,
                    deviceType,
                    specificDevices: [], // Will populate if needed
                    platformCategory,
                    slug,
                    content: '', // Load content only when needed via fetchArticleBySlugFromNotion
                    // Legacy fields for compatibility
                    tags: [],
                    hardware: [],
                    platforms: [],
                } as Article
            })
        )

        return articles
    } catch (error) {
        console.error('Error fetching articles from Notion:', error)
        return []
    }
}

export async function fetchArticleBySlugFromNotion(slug: string): Promise<Article | null> {
    const articles = await fetchArticlesFromNotion()
    const article = articles.find(a => a.slug === slug)

    if (!article || !article.id) return null

    try {
        // Fetch content specifically for this article
        const mdblocks = await n2m.pageToMarkdown(article.id)
        const mdString = n2m.toMarkdownString(mdblocks)

        return {
            ...article,
            content: mdString.parent || ''
        }
    } catch (error) {
        console.error(`Error fetching content for article ${slug}:`, error)
        return article
    }
}
