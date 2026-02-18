import { BaseCrawler } from '../BaseCrawler.js';
import type { Article } from '../types.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class AppleCrawler extends BaseCrawler {
    company = 'Apple';
    baseUrl = 'https://support.apple.com';
    sitemapUrl = 'https://support.apple.com/en-us/sitemaps/sitemap-index-en-us.xml';

    async crawl(): Promise<Article[]> {
        console.log(`Starting crawl for ${this.company}...`);
        const articles: Article[] = [];

        try {
            // Apple has sitemap index. We'll pick the first article sitemap if possible.
            const response = await axios.get(this.sitemapUrl);
            const $ = cheerio.load(response.data, { xmlMode: true });

            // For Apple, sitemap-kb-en-us-1.xml or similar usually contains articles
            const kbSitemaps: string[] = [];
            $('loc').each((_, el) => {
                const loc = $(el).text();
                if (loc.includes('sitemap-kb')) {
                    kbSitemaps.push(loc);
                }
            });

            if (kbSitemaps.length > 0) {
                const sitemapResponse = await axios.get(kbSitemaps[0]);
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

        const title = $('h1').first().text().trim() || $('title').text().trim().split(' - ')[0];
        const description = $('meta[name="description"]').attr('content') || '';

        return {
            title,
            company: this.company,
            category: 'Support',
            productService: 'Apple',
            issueDescription: title,
            solutionSummary: description,
            url,
            lastUpdated: new Date().toISOString(),
            status: 'Active'
        };
    }
}
