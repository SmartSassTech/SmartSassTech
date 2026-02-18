import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { email, question } = await request.json()

    // Validate input
    if (!email || !question) {
      return NextResponse.json(
        { error: 'Email and question are required' },
        { status: 400 }
      )
    }

    // Create log entry with timestamp
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      email,
      question,
    }

    // Path to store requests
    const logsDir = path.join(process.cwd(), '..', '..', 'article-requests')

    // Create directory if it doesn't exist
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true })
    }

    // Write to a JSON file (one entry per request, append to array)
    const logFile = path.join(logsDir, 'requests.json')
    let existingRequests: typeof logEntry[] = []

    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf-8')
      existingRequests = JSON.parse(content)
    }

    existingRequests.push(logEntry)
    fs.writeFileSync(logFile, JSON.stringify(existingRequests, null, 2))

    return NextResponse.json(
      { success: true, message: 'Article request received' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error handling article request:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
