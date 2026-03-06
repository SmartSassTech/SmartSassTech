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
        // Fetch content with a 15s timeout to prevent hanging requests
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Notion fetch timed out after 15s')), 15000)
        )
        const mdblocks = await Promise.race([
            n2m.pageToMarkdown(article.id),
            timeoutPromise,
        ])
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

const TRANSCRIPT_DATABASE_ID = 'efe850c2-e88e-42e9-9ce8-d23b5c9377e5'

export async function saveChatTranscript(session: any) {
    if (!NOTION_API_KEY) {
        console.error('Notion API key not set')
        return null
    }

    try {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[NOTION DEBUG] Session: ${session.id}, Messages: ${session.messages?.length}, Time: ${timestamp}`);

        const messageBlocks: any[] = [];
        if (Array.isArray(session.messages)) {
            session.messages.forEach((m: any, idx: number) => {
                const role = m.role === 'assistant' ? 'AGENT' : 'CLIENT';
                const prefix = `[${role}]: `;
                let content = prefix + (m.content || '');

                // Chunk the content if it's too long
                while (content.length > 0) {
                    const chunk = content.substring(0, 1500); // Very conservative limit
                    messageBlocks.push({
                        object: 'block',
                        type: 'paragraph',
                        paragraph: {
                            rich_text: [{ type: 'text', text: { content: chunk } }]
                        }
                    });
                    content = content.substring(1500);
                }
            });
        }

        if (messageBlocks.length === 0) {
            messageBlocks.push({
                object: 'block',
                type: 'paragraph',
                paragraph: {
                    rich_text: [{ type: 'text', text: { content: 'No messages in transcript' } }]
                }
            });
        }

        const response = await notion.pages.create({
            parent: { database_id: TRANSCRIPT_DATABASE_ID },
            properties: {
                'Conversation': {
                    title: [{ text: { content: `[${timestamp}] Transcript: ${session.transcript_id || session.id.substring(0, 8)}` } }]
                },
                'Visitor (name/email)': {
                    rich_text: [{ type: 'text', text: { content: `${session.user_name} (${session.user_email || 'No email'})` } }]
                },
                'Agent': {
                    rich_text: [{ type: 'text', text: { content: session.agent_id ? `Agent: ${session.agent_id}` : 'Unassigned' } }]
                },
                'Status': {
                    rich_text: [{ type: 'text', text: { content: session.status } }]
                },
                'Summary': {
                    rich_text: [{ type: 'text', text: { content: session.initial_issue || 'No issue described' } }]
                },
                'Started at': {
                    date: { start: session.created_at }
                },
                'Ended at': {
                    date: { start: new Date().toISOString() }
                },
                'Channel': {
                    select: { name: 'Live agent' }
                }
            },
            children: [
                {
                    object: 'block',
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [{ type: 'text', text: { content: 'Chat Details' } }]
                    }
                },
                {
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [
                            { type: 'text', text: { content: `Session ID: ${session.id}\n` }, annotations: { bold: true } },
                            { type: 'text', text: { content: `Transcript ID: ${session.transcript_id}\n` }, annotations: { bold: true } },
                            { type: 'text', text: { content: `Device: ${session.user_device || 'Not specified'}\n` }, annotations: { bold: true } }
                        ]
                    }
                },
                {
                    object: 'block',
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [{ type: 'text', text: { content: 'Full Transcript' } }]
                    }
                },
                ...messageBlocks
            ]
        })

        return response
    } catch (error) {
        console.error('Error saving transcript to Notion:', error)
        throw error
    }
}
