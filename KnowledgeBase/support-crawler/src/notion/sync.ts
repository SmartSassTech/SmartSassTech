import { Client } from '@notionhq/client';
import type { Article, ArticleStatus } from '../types.js';

export class NotionSync {
    private notion: Client | null = null;
    private databaseId: string;

    constructor(apiKey: string, databaseId: string) {
        this.databaseId = databaseId;
        if (apiKey && apiKey !== 'MOCK') {
            this.notion = new Client({ auth: apiKey });
        }
    }

    async syncArticle(article: Article): Promise<void> {
        if (!this.notion) {
            console.log(`[MOCK NOTION] Syncing article: ${article.title} - ${article.url}`);
            return;
        }

        try {
            const existingPage = await this.findArticleByUrl(article.url);

            if (existingPage) {
                const storedLastUpdated = existingPage.properties['Last Updated']?.date?.start;
                // Update if newer or status changed
                await this.updateArticle(existingPage.id, article);
            } else {
                await this.createArticle(article);
            }
        } catch (error) {
            console.error(`Error syncing article ${article.url}:`, error);
        }
    }

    private async findArticleByUrl(url: string): Promise<any | null> {
        if (!this.notion) return null;
        const response = await (this.notion as any).databases.query({
            database_id: this.databaseId,
            filter: {
                property: 'Article URL',
                url: {
                    equals: url,
                },
            },
        });
        return response.results.length > 0 ? response.results[0] : null;
    }

    private async createArticle(article: Article): Promise<void> {
        if (!this.notion) return;
        await this.notion.pages.create({
            parent: { database_id: this.databaseId },
            properties: this.createProperties(article),
        });
    }

    private async updateArticle(pageId: string, article: Article): Promise<void> {
        if (!this.notion) return;
        await this.notion.pages.update({
            page_id: pageId,
            properties: this.createProperties({ ...article, status: 'Updated' }),
        });
    }

    private createProperties(article: Article): any {
        return {
            'Article Title': { title: [{ text: { content: article.title } }] },
            'Company': { select: { name: article.company } },
            'Category': { select: { name: article.category || 'Support' } },
            'Target Device': { multi_select: article.productService ? [{ name: article.productService }] : [] },
            'Senior-Friendly Title': { rich_text: [{ text: { content: article.solutionSummary || article.title } }] },
            'Article URL': { url: article.url },
            'Last Updated': { date: { start: article.lastUpdated || new Date().toISOString() } },
            'Article Status': { select: { name: article.status } },
            'Last Synced Date': { date: { start: new Date().toISOString() } },
        };
    }
}
