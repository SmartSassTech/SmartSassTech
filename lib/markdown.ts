export interface ContentElement {
  type: 'heading' | 'paragraph' | 'list'
  level?: number
  content?: string
  items?: string[]
}

export function parseMarkdown(content: string): ContentElement[] {
  const lines = content.split('\n')
  const elements: ContentElement[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      elements.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2],
      })
      i++
      continue
    }

    // Lists
    const listMatch = line.match(/^[-*]\s+(.+)$/)
    if (listMatch) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[-*]\s+(.+)$/)) {
        const m = lines[i].match(/^[-*]\s+(.+)$/)
        if (m) items.push(m[1])
        i++
      }
      if (items.length > 0) {
        elements.push({ type: 'list', items })
      }
      continue
    }

    // Paragraphs
    if (line.trim()) {
      elements.push({ type: 'paragraph', content: line })
    }

    i++
  }

  return elements
}

export function renderMarkdownInline(text: string): string {
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/__(.+?)__/g, '<strong>$1</strong>')

  // Italic
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>')
  text = text.replace(/_(.+?)_/g, '<em>$1</em>')

  // Links
  text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-kb-navy hover:text-kb-slate underline">$1</a>')

  return text
}
