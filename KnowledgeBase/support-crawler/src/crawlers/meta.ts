import { BaseCrawler } from '../BaseCrawler.js';
import type { Article } from '../types.js';
import * as cheerio from 'cheerio';

export class MetaCrawler extends BaseCrawler {
    company = 'Meta';
    baseUrl = 'https://www.meta.com/help';

    async crawl(): Promise<Article[]> {
        console.log(`Starting crawl for ${this.company}...`);
        const articles: Article[] = [];

        // Meta Help center often blocks bots, but we can try common paths or meta-tags
        const platforms = ['quest', 'meridian', 'meta-ai'];

        for (const platform of platforms) {
            const url = `${this.baseUrl}/${platform}`;
            try {
                const html = await this.fetchHtml(url);
                const $ = cheerio.load(html);

                const urls: string[] = [];
                $('a[href*="/help/"]').each((_, el) => {
                    let href = $(el).attr('href');
                    if (href && !href.startsWith('http')) {
                        href = 'https://www.meta.com' + (href.startsWith('/') ? '' : '/') + href;
                    }
                    if (href && !urls.includes(href) && href.includes('/help/') && !href.endsWith('/help')) {
                        urls.push(href);
                    }
                });

                console.log(`Found ${urls.length} potential articles for Meta/${platform}.`);

                for (const articleUrl of urls.slice(0, 3)) {
                    try {
                        const articleHtml = await this.fetchHtml(articleUrl);
                        articles.push(this.extract(articleUrl, articleHtml));
                    } catch (e) {
                        console.error(`Error extracting ${articleUrl}:`, e);
                    }
                }
            } catch (e) {
                console.error(`Error crawling platform ${platform}:`, e);
            }
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
            category: 'Help Center',
            productService: 'Meta',
            issueDescription: title,
            solutionSummary: description,
            url,
            lastUpdated: new Date().toISOString(),
            status: 'Active'
        };
    }
}
