import { BaseCrawler } from '../BaseCrawler.js';
import type { Article } from '../types.js';
import * as cheerio from 'cheerio';

export class CanonCrawler extends BaseCrawler {
    company = 'Canon';
    baseUrl = 'https://www.usa.canon.com/support';

    async crawl(): Promise<Article[]> {
        console.log(`Starting crawl for ${this.company}...`);
        const articles: Article[] = [];

        // Canon Support often has strict bot protection.
        // We'll target the support home page and discover links.
        try {
            const html = await this.fetchHtml(this.baseUrl);
            const $ = cheerio.load(html);

            const urls: string[] = [];
            $('a[href*="/support/p/"]').each((_, el) => {
                let href = $(el).attr('href');
                if (href && !href.startsWith('http')) {
                    href = 'https://www.usa.canon.com' + href;
                }
                if (href && !urls.includes(href)) {
                    urls.push(href);
                }
            });

            console.log(`Found ${urls.length} potential product support pages for ${this.company}.`);

            for (const url of urls.slice(0, 3)) {
                try {
                    const pageHtml = await this.fetchHtml(url);
                    const p$ = cheerio.load(pageHtml);

                    // Look for articles linked on the product page
                    p$('a[href*="/kb/"]').each((_, el) => {
                        let articleUrl = p$(el).attr('href');
                        if (articleUrl && !articleUrl.startsWith('http')) {
                            articleUrl = 'https://www.usa.canon.com' + articleUrl;
                        }
                        if (articleUrl && !articles.find(a => a.url === articleUrl)) {
                            // Extract basic info from the link or fetch if needed
                            // For simplicity, we'll try to fetch the first few
                        }
                    });

                    // Simplified: Just extract the product page itself as a "General Info" entry if no articles found
                    articles.push(this.extract(url, pageHtml));
                } catch (e) {
                    console.error(`Error crawling product ${url}:`, e);
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
            title: title || 'Canon Product Support',
            company: this.company,
            category: 'Product Support',
            productService: 'Canon Hardware',
            issueDescription: title,
            solutionSummary: description,
            url,
            lastUpdated: new Date().toISOString(),
            status: 'Active'
        };
    }
}
