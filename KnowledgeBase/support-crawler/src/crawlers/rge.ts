import { BaseCrawler } from '../BaseCrawler.js';
import type { Article } from '../types.js';
import * as cheerio from 'cheerio';

export class RGECrawler extends BaseCrawler {
    company = 'RGE';
    baseUrl = 'https://www.rge.com/support';

    async crawl(): Promise<Article[]> {
        console.log(`Starting crawl for ${this.company}...`);
        const articles: Article[] = [];

        // RGE (Rochester Gas and Electric) has a relatively simple structure.
        // We'll crawl some key support pages.
        const supportPaths = [
            'https://www.rge.com/support/contact-us',
            'https://www.rge.com/support/outages',
            'https://www.rge.com/account/billing'
        ];

        for (const url of supportPaths) {
            try {
                const html = await this.fetchHtml(url);
                articles.push(this.extract(url, html));
            } catch (e) {
                console.error(`Error crawling ${url}:`, e);
            }
        }

        return articles;
    }

    extract(url: string, html: string): Article {
        const $ = cheerio.load(html);

        const title = $('h1').first().text().trim() || $('title').text().trim();
        const description = $('meta[name="description"]').attr('content') || '';

        return {
            title: title || 'RGE Support Page',
            company: this.company,
            category: 'Customer Support',
            productService: 'Utility Services',
            issueDescription: title,
            solutionSummary: description,
            url,
            lastUpdated: new Date().toISOString(),
            status: 'Active'
        };
    }
}
