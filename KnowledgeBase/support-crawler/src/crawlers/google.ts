import { BaseCrawler } from '../BaseCrawler.js';
import type { Article } from '../types.js';
import * as cheerio from 'cheerio';

export class GoogleCrawler extends BaseCrawler {
    company = 'Google';
    baseUrl = 'https://support.google.com';

    async crawl(): Promise<Article[]> {
        console.log(`Starting crawl for ${this.company}...`);
        const articles: Article[] = [];

        // Google Support has many sub-domains. For the autonomous crawler, 
        // we might want to target specific common help centers or discovery via links.
        const helpCenters = ['chrome', 'pixelphone', 'youtube', 'gmail', 'accounts'];

        for (const center of helpCenters) {
            const url = `${this.baseUrl}/${center}`;
            try {
                const html = await this.fetchHtml(url);
                const $ = cheerio.load(html);

                // Discover article links in the help center home page
                const urls: string[] = [];
                $('a[href*="/answer/"]').each((_, el) => {
                    let href = $(el).attr('href');
                    if (href && !href.startsWith('http')) {
                        href = this.baseUrl + (href.startsWith('/') ? '' : '/') + href;
                    }
                    if (href && !urls.includes(href)) {
                        urls.push(href);
                    }
                });

                console.log(`Found ${urls.length} potential articles in ${center} help center.`);

                for (const articleUrl of urls.slice(0, 3)) { // Limit for testing
                    try {
                        const articleHtml = await this.fetchHtml(articleUrl);
                        articles.push(this.extract(articleUrl, articleHtml));
                    } catch (e) {
                        console.error(`Error extracting ${articleUrl}:`, e);
                    }
                }
            } catch (e) {
                console.error(`Error crawling help center ${center}:`, e);
            }
        }

        return articles;
    }

    extract(url: string, html: string): Article {
        const $ = cheerio.load(html);

        const title = $('h1').text().trim() || $('title').text().trim().split(' - ')[0];
        const category = $('.breadcrumb').text().trim() || 'Google Help';

        // Google uses JSON-LD or meta tags for many things, but article body is usually in 'article' or specific classes
        const content = $('.article-content').text().trim() || $('article').text().trim() || '';

        return {
            title,
            company: this.company,
            category: category.split('Help')[0].trim() || 'Google Service',
            productService: category.split('Help')[0].trim() || 'Google Service',
            issueDescription: title,
            solutionSummary: content.substring(0, 500) || '',
            url,
            lastUpdated: new Date().toISOString(),
            status: 'Active'
        };
    }
}
