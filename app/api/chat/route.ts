import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { getArticles, searchArticles, getArticleBySlug } from '@/lib/articles'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
    // Rate limit: 30 requests per minute per IP
    const ip = getClientIp(req)
    const { success, remaining, resetAt } = rateLimit(ip, { limit: 30, windowSeconds: 60 })
    if (!success) {
        return NextResponse.json(
            { error: 'Too many requests. Please wait a moment before trying again.' },
            {
                status: 429,
                headers: {
                    'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
                    'X-RateLimit-Remaining': '0',
                },
            }
        )
    }

    try {
        console.log('Chat API: Received request')
        const body = await req.json()
        console.log('Chat API: Body:', JSON.stringify(body))

        const messages = body.messages
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            console.error('Chat API: messages array is missing or empty')
            return NextResponse.json({ error: 'Invalid request: messages array is required' }, { status: 400 })
        }

        const lastMessage = messages[messages.length - 1].content

        const apiKey = process.env.GOOGLE_API_KEY
        if (!apiKey) {
            console.error('Chat API: GOOGLE_API_KEY is missing')
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
        }

        const genAI = new GoogleGenerativeAI(apiKey)

        // Fetch articles for context
        console.log('Chat API: Fetching articles...')
        const articles = await getArticles()
        // Provide slug so the AI can build clickable links
        const articleContext = articles.map(a => `- ${a.title} (Link: /articles/${a.slug}): ${a.description}`).join('\n')
        console.log(`Chat API: Found ${articles.length} articles`)

        const systemPrompt = `You are a friendly and patient tech support assistant helping people with their technology questions. Your goal is to have a helpful conversation and guide users to solutions step-by-step.

### Your Personality:
- **Direct & Concise**: Keep responses as short as possible while still being helpful. Avoid unnecessary filler or overly long explanations.
- **Warm & Approachable**: Use a friendly, conversational tone. Think of yourself as a helpful neighbor, not a robot.
- **Patient & Understanding**: Many users aren't tech-savvy. Use simple, everyday language. Avoid jargon unless you explain it.
- **Empathetic**: Acknowledge frustration briefly ("I understand!") and celebrate successes ("Great!").

### How to Help:
1. **Be Concise**: Prioritize brevity. If a solution can be explained in two sentences, don't use five.
2. **Ask Questions First**: Before jumping to solutions, ask one or two key clarifying questions:
   - What device are they using?
   - What have they already tried?

3. **Provide Simple Step-by-Step Guidance**: 
   - Break down solutions into small steps
   - Use numbered lists
   - Check in briefly ("Did that work?")

4. **Use Internal Knowledge Base Articles**:
You have access to a list of articles:
${articleContext}

When a user asks a question, use the \`search_knowledge_base\` tool to retrieve the exact content from full articles for your reference. When relevant to the user, share the link: "[Article Title](/articles/slug)"

5. **Link to Official External Support**: Provide direct links only when necessary:
   - **Apple**: https://support.apple.com
   - **Microsoft**: https://support.microsoft.com
   - **Google**: https://support.google.com

### Formatting:
- Use **bold** for important terms
- Use numbered lists for steps
- Keep paragraphs very short

### Remember:
Your mission is to be as helpful as possible while respecting the user's time. Gather info quickly, provide clear guidance, and stay concise.`

        const searchTool: any = {
            functionDeclarations: [
                {
                    name: 'search_knowledge_base',
                    description: 'Search the internal knowledge base for solutions and retrieve the full content of relevant articles. Always use this tool when a user asks for troubleshooting help.',
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            query: {
                                type: SchemaType.STRING,
                                description: `The search query to find the best articles (e.g. "laptop won't turn on", "reset password")`
                            }
                        },
                        required: ["query"]
                    }
                }
            ]
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-flash-latest',
            systemInstruction: systemPrompt,
            tools: [searchTool]
        })

        console.log('Chat API: Generating response...')
        // Use chat interface for history
        // Ensure history starts with a user message (skip initial assistant greeting)
        const history = messages.slice(0, -1).map((m: any) => ({
            role: (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user',
            parts: [{ text: m.content }],
        }))

        // If history exists but first message is model, remove it
        if (history.length > 0 && history[0].role === 'model') {
            console.log('Chat API: Removing initial model message from history')
            history.shift()
        }

        const chat = model.startChat({
            history: history,
        })

        let result = await chat.sendMessage([{ text: lastMessage }])
        let response = await result.response

        const functionCalls = response.functionCalls()
        if (functionCalls) {
            console.log('Chat API: Function call requested by model')
            for (const call of functionCalls) {
                if (call.name === 'search_knowledge_base') {
                    const query = (call.args as any).query
                    console.log('Chat API: Searching knowledge base for:', query)
                    
                    const searchResults = await searchArticles(query)
                    const topResults = searchResults.slice(0, 2)
                    
                    const fullArticles = []
                    for (const article of topResults) {
                        try {
                            const full = await getArticleBySlug(article.slug)
                            if (full) fullArticles.push(full)
                        } catch (e) {
                            console.error('Error fetching full article for RAG:', e)
                        }
                    }
                    
                    const toolResponseContent = fullArticles.map(a => `Title: ${a.title}\nSlug: ${a.slug}\nContent: ${a.content}`).join('\n\n---\n\n') || 'No detailed articles found for this query.'
                    
                    // Send function response back to the model
                    result = await chat.sendMessage([{
                        functionResponse: {
                            name: 'search_knowledge_base',
                            response: { content: toolResponseContent }
                        }
                    }])
                    response = await result.response
                }
            }
        }

        const text = response.text()
        console.log('Chat API: Response generated successfully')

        return NextResponse.json({ role: 'assistant', content: text }, {
            headers: { 'X-RateLimit-Remaining': String(remaining) }
        })
    } catch (error: any) {
        console.error('Chat API Error:', error)

        // Extract status code if available from Google SDK
        const statusCode = error.status || (error.message?.includes('429') ? 429 : 500)
        const isQuotaError = statusCode === 429 || error.message?.toLowerCase().includes('quota')

        return NextResponse.json({
            error: isQuotaError ? 'Daily limit reached' : 'Failed to get response from AI',
            details: error.message,
            code: statusCode
        }, { status: statusCode })
    }
}
