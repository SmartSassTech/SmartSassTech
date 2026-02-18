import { BaseCrawler } from '../BaseCrawler.js';
import type { Article } from '../types.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class RokuCrawler extends BaseCrawler {
    company = 'Roku';
    baseUrl = 'https://support.roku.com';
    sitemapUrl = 'https://support.roku.com/sitemap.xml';

    async crawl(): Promise<Article[]> {
        console.log(`Starting crawl for ${this.company}...`);
        const articles: Article[] = [];

        try {
            // Simplified for initial implementation: Fetching sitemap and extracting article URLs
            const response = await axios.get(this.sitemapUrl);
            const $ = cheerio.load(response.data, { xmlMode: true });
            const urls: string[] = [];

            $('loc').each((_, el) => {
                const url = $(el).text();
                // Filter for English articles or generic patterns
                if (url.includes('/en-') || !url.includes('/es-') && !url.includes('/fr-') && !url.includes('/pt-')) {
                    if (url.includes('/article/')) {
                        urls.push(url);
                    }
                }
            });

            console.log(`Found ${urls.length} potential articles for ${this.company}.`);

            // Take first 5 for testing
            for (const url of urls.slice(0, 5)) {
                try {
                    const html = await this.fetchHtml(url);
                    const article = this.extract(url, html);
                    articles.push(article);
                } catch (e) {
                    console.error(`Error extracting ${url}:`, e);
                }
            }
        } catch (error) {
            console.error(`Crawl failed for ${this.company}:`, error);
        }

        return articles;
    }

    extract(url: string, html: string): Article {
        const $ = cheerio.load(html);

        const rawTitle = $('title').text().trim() || $('h1').first().text().trim();
        const title = rawTitle.split('|')[0].split(' - ')[0].trim();

        const description = $('meta[name="description"]').attr('content') ||
            $('meta[property="og:description"]').attr('content') ||
            '';

        return {
            title,
            company: this.company,
            category: 'Support',
            productService: 'Roku',
            issueDescription: title,
            solutionSummary: description,
            url,
            lastUpdated: new Date().toISOString(),
            status: 'Active'
        };
    }
}
