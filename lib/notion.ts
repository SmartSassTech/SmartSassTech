import { Client } from '@notionhq/client'
import { NotionToMarkdown } from 'notion-to-md'
import fs from 'fs'
import path from 'path'
import { Article, ArticleMetadata } from './articles'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_DATABASE_ID = 'da201fe9-c3d7-4ae9-a5f3-662f13e76c46' // Senior Tech Knowledge Base

if (!NOTION_API_KEY) {
    console.warn('NOTION_API_KEY is not set in .env.local')
}

const notion = new Client({ auth: NOTION_API_KEY })
const n2m = new NotionToMarkdown({ notionClient: notion })

// Persistent caching for development to survive hot reloads
interface GlobalNotionCache {
    articles: Article[] | null
    lastFetchTime: number
    contentCache: Record<string, string> // slug -> markdown
}

const globalWithNotion = global as typeof globalThis & {
    notionCache?: GlobalNotionCache
}

const notionCache = globalWithNotion.notionCache || (globalWithNotion.notionCache = {
    articles: null,
    lastFetchTime: 0,
    contentCache: {}
})

const CACHE_TTL = 10 * 60 * 1000 // 10 minutes (increased from 5)

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

    // Check cache
    const now = Date.now()
    if (notionCache.articles && (now - notionCache.lastFetchTime < CACHE_TTL)) {
        console.log(`[NOTION CACHE] Hit for article list (${notionCache.articles.length} articles)`)
        return notionCache.articles
    }

    console.log('[NOTION CACHE] Miss for article list, fetching from API...')

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

        notionCache.articles = articles
        notionCache.lastFetchTime = Date.now()
        console.log(`[NOTION CACHE] Successfully fetched and cached ${articles.length} articles`)
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
    
    // Check file system cache
    const cacheDir = path.join(process.cwd(), '.cache', 'articles')
    const cacheFile = path.join(cacheDir, `${slug}.md`)
    
    if (fs.existsSync(cacheFile)) {
        const cachedContent = fs.readFileSync(cacheFile, 'utf8')
        if (cachedContent) {
            console.log(`[NOTION CACHE] FS Hit: ${slug}`)
            return {
                ...article,
                content: cachedContent
            }
        }
    }

    // Check memory cache
    if (notionCache.contentCache[slug]) {
        console.log(`[NOTION CACHE] Hit for content: ${slug}`)
        return {
            ...article,
            content: notionCache.contentCache[slug]
        }
    }

    console.log(`[NOTION CACHE] Miss for content: ${slug}, fetching blocks...`)

    async function fetchWithRetry(retries: number = 2): Promise<string> {
        try {
            // Fetch content with a 60s timeout
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Notion fetch timed out after 60s')), 60000)
            )
            const mdblocks = await Promise.race([
                n2m.pageToMarkdown(article.id),
                timeoutPromise,
            ])
            const mdString = n2m.toMarkdownString(mdblocks)
            return mdString.parent || ''
        } catch (error) {
            if (retries > 0) {
                console.warn(`[NOTION] Fetch failed for ${slug}, retrying... (${retries} left)`)
                return fetchWithRetry(retries - 1)
            }
            throw error
        }
    }

    try {
        const content = await fetchWithRetry()

        // Update cache
        notionCache.contentCache[slug] = content
        try {
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true })
            fs.writeFileSync(cacheFile, content, 'utf8')
            console.log(`[NOTION CACHE] PS Saved: ${slug}`)
        } catch (e) {
            console.warn(`[NOTION CACHE] Failed to save FS cache for ${slug}:`, e)
        }
        
        console.log(`[NOTION CACHE] Successfully fetched and cached content for: ${slug} (${content.length} chars)`)

        return {
            ...article,
            content
        }
    } catch (error) {
        console.error(`Error fetching content for article ${slug} after retries:`, error)
        return article
    }
}

const TRANSCRIPT_DATABASE_ID = 'efe850c2-e88e-42e9-9ce8-d23b5c9377e5'
const BOT_TRANSCRIPT_DATABASE_ID = '321277d3-df7d-80b5-a181-c8680371076c'

export async function saveBotChatTranscript(session: any) {
    if (!NOTION_API_KEY) {
        console.error('Notion API key not set')
        return null
    }

    try {
        const timestamp = new Date().toLocaleTimeString();
        
        // chunk messages to avoid Notion's 100 block limit. Take only last 50.
        const msgBlocks = (session.messages || []).slice(-50).map((m: any) => ({
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [
                    { 
                        type: 'text', 
                        text: { content: `${m.role.toUpperCase()}:\n` },
                        annotations: { bold: true }
                    },
                    { 
                        type: 'text', 
                        text: { content: m.content.substring(0, 1500) } // Notion text limit
                    }
                ]
            }
        }))

        const response = await notion.pages.create({
            parent: { database_id: BOT_TRANSCRIPT_DATABASE_ID },
            properties: {
                'Conversation': {
                    title: [{ text: { content: `[${timestamp}] AI Chat Session` } }]
                },
                'Visitor Name': {
                    rich_text: [{ type: 'text', text: { content: session.user_name || 'Anonymous User' } }]
                },
                ...(session.user_email ? {
                    'Visitor Email': {
                        rich_text: [{ type: 'text', text: { content: session.user_email } }]
                    }
                } : {}),
                'Channel': {
                    select: { name: 'AI chatbot' }
                },
                'Tags': {
                    multi_select: []
                },
                'Agent': {
                    rich_text: [{ type: 'text', text: { content: 'Tech Assistant Bot' } }]
                },
                'Summary': {
                    rich_text: [{ type: 'text', text: { content: session.summary || 'No summary available' } }]
                },
                'Started at': {
                    date: { start: session.created_at || new Date().toISOString() }
                },
                'Ended at': {
                    date: { start: new Date().toISOString() }
                }
            },
            children: [
                {
                    object: 'block',
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [{ type: 'text', text: { content: 'AI Resolution Summary' } }]
                    }
                },
                {
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [{ type: 'text', text: { content: session.summary || 'No summary available.' } }]
                    }
                },
                {
                    object: 'block',
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [{ type: 'text', text: { content: 'Full Transcript' } }]
                    }
                },
                ...msgBlocks
            ]
        })

        return response
    } catch (error) {
        console.error('Error saving bot transcript to Notion:', error)
        throw error
    }
}

export async function saveChatTranscript(session: any) {
    if (!NOTION_API_KEY) {
        console.error('Notion API key not set')
        return null
    }

    try {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[NOTION DEBUG] Saving Ticket: ${session.id}, Time: ${timestamp}`);

        // Link to the internal admin dashboard viewer
        const domain = process.env.NEXT_PUBLIC_APP_URL || 'https://www.smartsasstech.com'
        const viewerLink = `${domain}/admin/live-chat/${session.id}?admin=true`

        const response = await notion.pages.create({
            parent: { database_id: TRANSCRIPT_DATABASE_ID },
            properties: {
                'Conversation': {
                    title: [{ text: { content: `[${timestamp}] Ticket: ${session.id.substring(0, 8)}` } }]
                },
                'Visitor Name': {
                    rich_text: [{ type: 'text', text: { content: session.user_name || 'Anonymous' } }]
                },
                ...(session.user_email ? {
                    'Visitor Email': {
                        rich_text: [{ type: 'text', text: { content: session.user_email } }]
                    }
                } : {}),
                'Channel': {
                    select: { name: 'Live Agent' }
                },
                'Tags': {
                    multi_select: []
                },
                ...(session.satisfaction_score ? {
                    'Satisfaction': {
                        number: session.satisfaction_score
                    }
                } : {}),
                'Agent': {
                    rich_text: [{ type: 'text', text: { content: session.agent_name || 'Unassigned' } }]
                },
                'Summary': {
                    rich_text: [{ type: 'text', text: { content: session.initial_issue || 'No issue described' } }]
                },
                'Started at': {
                    date: { start: session.created_at }
                },
                'Ended at': {
                    date: { start: new Date().toISOString() }
                }
            },
            children: [
                {
                    object: 'block',
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [{ type: 'text', text: { content: 'Ticket Details' } }]
                    }
                },
                {
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [
                            { type: 'text', text: { content: `Session ID: ${session.id}\n` }, annotations: { bold: true } },
                            { type: 'text', text: { content: `Device: ${session.user_device || 'Not specified'}\n` }, annotations: { bold: true } },
                            { type: 'text', text: { content: `Status: ${session.status}\n` }, annotations: { bold: true } },
                            { type: 'text', text: { content: `Original Issue: ${session.initial_issue}\n` }, annotations: { bold: true } }
                        ]
                    }
                },
                {
                    object: 'block',
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [{ type: 'text', text: { content: 'AI Resolution Summary' } }]
                    }
                },
                {
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [{ type: 'text', text: { content: session.summary || 'No summary available.' } }]
                    }
                },
                {
                    object: 'block',
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [{ type: 'text', text: { content: 'Full Transcript' } }]
                    }
                },
                {
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [
                            {
                                type: 'text',
                                text: { content: 'View Full Raw Transcript in Admin Dashboard', link: { url: viewerLink } }
                            }
                        ]
                    }
                }
            ]
        })

        return response
    } catch (error) {
        console.error('Error saving ticket to Notion:', error)
        throw error
    }
}

export async function updateChatSatisfaction(pageId: string, score: number) {
    if (!NOTION_API_KEY) {
        console.error('Notion API key not set')
        return null
    }

    try {
        const response = await notion.pages.update({
            page_id: pageId,
            properties: {
                'Satisfaction': {
                    number: score
                }
            }
        })
        return response
    } catch (error) {
        console.error('Error updating satisfaction in Notion:', error)
        throw error
    }
}
