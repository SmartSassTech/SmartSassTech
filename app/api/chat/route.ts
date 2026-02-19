import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getArticles } from '@/lib/articles'

export async function POST(req: NextRequest) {
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

4. **Use Internal Knowledge Base Articles**: You have access to these articles:
${articleContext}

When relevant, share them: "[Article Title](/articles/slug)"

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


        const model = genAI.getGenerativeModel({
            model: 'gemini-flash-latest',
            systemInstruction: systemPrompt
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

        const result = await chat.sendMessage(lastMessage)
        const response = await result.response
        const text = response.text()
        console.log('Chat API: Response generated successfully')

        return NextResponse.json({ role: 'assistant', content: text })
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
