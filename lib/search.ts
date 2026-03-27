import { querySearchIndex } from './search-index'

export type SearchResultType = 'Article' | 'Troubleshooting' | 'Device Support' | 'Service' | 'External Resource'

export interface SearchResult {
  id: string
  title: string
  description: string
  url: string
  type: SearchResultType
  badge?: string
  /** If true, the link should open in a new tab (for external URLs) */
  external?: boolean
}

export interface GroupedSearchResults {
  articles: SearchResult[]
  troubleshooting: SearchResult[]
  deviceSupport: SearchResult[]
  services: SearchResult[]
  externalResources: SearchResult[]
  total: number
}

/**
 * Global search — delegates to the pre-built search index.
 * No Notion API calls happen here; the index was built at startup.
 */
export async function globalSearch(query: string): Promise<GroupedSearchResults> {
  return querySearchIndex(query)
}
