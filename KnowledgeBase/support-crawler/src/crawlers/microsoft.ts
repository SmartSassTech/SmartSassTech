import { BaseCrawler } from '../BaseCrawler.js';
import type { Article } from '../types.js';
import * as cheerio from 'cheerio';
import axios from 'axios';

export class MicrosoftCrawler extends BaseCrawler {
    company = 'Microsoft';
    baseUrl = 'https://support.microsoft.com';
    sitemapUrl = 'https://support.microsoft.com/sitemap/collection.xml';

    async crawl(): Promise<Article[]> {
        console.log(`Starting crawl for ${this.company}...`);
        const articles: Article[] = [];

        try {
            const response = await axios.get(this.sitemapUrl);
            const $ = cheerio.load(response.data, { xmlMode: true });

            // Microsoft has sitemap collections. Pick the first en-us one.
            const sitemaps: string[] = [];
            $('loc').each((_, el) => {
                const loc = $(el).text();
                if (loc.includes('en-us')) {
                    sitemaps.push(loc);
                }
            });

            if (sitemaps.length > 0) {
                const sitemapResponse = await axios.get(sitemaps[0]);
                const s$ = cheerio.load(sitemapResponse.data, { xmlMode: true });
                const urls: string[] = [];
                s$('loc').each((_, el) => {
                    urls.push(s$(el).text());
                });

                console.log(`Found ${urls.length} potential articles for ${this.company}.`);

                for (const url of urls.slice(0, 5)) {
                    try {
                        const html = await this.fetchHtml(url);
                        articles.push(this.extract(url, html));
                    } catch (e) {
                        console.error(`Error extracting ${url}:`, e);
                    }
                }
            }
        } catch (error) {
            console.error(`Crawl failed for ${this.company}:`, error);
        }

        return articles;
    }

    extract(url: string, html: string): Article {
        const $ = cheerio.load(html);

        const title = $('h1').first().text().trim() || $('title').text().trim();
        const description = $('meta[name="description"]').attr('content') || '';

        return {
            title,
            company: this.company,
            category: 'Support',
            productService: 'Microsoft',
            issueDescription: title,
            solutionSummary: description,
            url,
            lastUpdated: new Date().toISOString(),
            status: 'Active'
        };
    }
}
