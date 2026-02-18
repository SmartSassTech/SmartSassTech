import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { fetchArticlesFromNotion, fetchArticleBySlugFromNotion } from './notion'

export interface ArticleMetadata {
  title: string
  description: string
  category: string
  deviceType: string[]
  specificDevices: string[]
  platformCategory: string[]

  // Legacy fields (Optional, will be phased out)
  hardware?: string[]
  platforms?: string[]
  topic?: string
  tags?: string[]
  articleType?: string
  actionTags?: string[]
  slug: string
  id?: string
}

export interface Article extends ArticleMetadata {
  content: string
}

function mapToArticle(slug: string, data: any, content: string): Article {
  const category = data.category || data.primaryTaskCategory || 'Technology Basics'
  return {
    title: data.title || 'Untitled',
    description: data.description || '',
    category,
    deviceType: data.deviceType || [],
    specificDevices: data.specificDevices || data.hardware || [],
    platformCategory: Array.isArray(data.platformCategory) ? data.platformCategory : (data.platforms || []),

    // Keep legacy for compatibility
    hardware: data.hardware || [],
    platforms: data.platforms || [],
    topic: data.topic || '',
    tags: data.tags || [],
    slug,
    content,
  } as Article
}

export async function getArticles(): Promise<Article[]> {
  try {
    const notionArticles = await fetchArticlesFromNotion()
    if (notionArticles.length > 0) {
      return notionArticles
    }

    // Fallback to local for now if Notion is empty (to prevent breaking UI during transition)
    if (!fs.existsSync(articlesDirectory)) {
      console.warn('Articles directory not found at:', articlesDirectory)
      return []
    }

    const fileNames = fs.readdirSync(articlesDirectory)
    return fileNames
      .filter(fileName => fileName.endsWith('.md'))
      .map(fileName => {
        const filePath = path.join(articlesDirectory, fileName)
        const fileContent = fs.readFileSync(filePath, 'utf8')
        const { data, content } = matter(fileContent)
        return mapToArticle(fileName.replace('.md', ''), data, content)
      })
  } catch (error) {
    console.error('Error loading articles:', error)
    return []
  }
}

const articlesDirectory = path.join(process.cwd(), '..', 'articles')

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const notionArticle = await fetchArticleBySlugFromNotion(slug)
    if (notionArticle) return notionArticle

    const filePath = path.join(articlesDirectory, `${slug}.md`)
    if (!fs.existsSync(filePath)) return null

    const fileContent = fs.readFileSync(filePath, 'utf8')
    const { data, content } = matter(fileContent)
    return mapToArticle(slug, data, content)
  } catch (error) {
    console.error('Error loading article:', error)
    return null
  }
}


export async function getArticlesByCategory(category: string): Promise<Article[]> {
  const articles = await getArticles()
  return articles.filter(a => a.category === category)
}

export function getDailyFeaturedArticles(articles: Article[], count: number = 6): Article[] {
  if (articles.length === 0) return []

  // Sort by slug to ensure a stable order
  const sortedArticles = [...articles].sort((a, b) => a.slug.localeCompare(b.slug))

  // Create a seed based on the current date (YYYYMMDD)
  const now = new Date()
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()

  // Use the seed to pick a starting index
  const startIndex = seed % sortedArticles.length

  // Select 'count' articles, wrapping around if needed
  const selected = []
  for (let i = 0; i < count && i < sortedArticles.length; i++) {
    selected.push(sortedArticles[(startIndex + i) % sortedArticles.length])
  }

  return selected
}

export async function searchArticles(query: string): Promise<Article[]> {
  const articles = await getArticles()
  const lowerQuery = query.toLowerCase()

  return articles.filter(
    a =>
      a.title.toLowerCase().includes(lowerQuery) ||
      a.description.toLowerCase().includes(lowerQuery) ||
      a.tags?.some(t => t.toLowerCase().includes(lowerQuery)) ||
      a.category.toLowerCase().includes(lowerQuery)
  )
}
