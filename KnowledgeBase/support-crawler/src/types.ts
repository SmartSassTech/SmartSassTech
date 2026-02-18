export type ArticleStatus = 'Active' | 'Updated' | 'Removed/Deleted';

export interface Article {
    title: string;
    company: string;
    category: string;
    productService: string;
    issueDescription: string;
    solutionSummary: string;
    url: string;
    lastUpdated?: string;
    status: ArticleStatus;
    contentHash?: string;
}

export interface CrawlResult {
    totalFound: number;
    newArticles: number;
    updatedArticles: number;
    removedArticles: number;
    errors: string[];
}
