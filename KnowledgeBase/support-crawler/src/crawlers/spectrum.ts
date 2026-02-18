import { BaseCrawler } from '../BaseCrawler.js';
import type { Article } from '../types.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class SpectrumCrawler extends BaseCrawler {
    company = 'Spectrum';
    baseUrl = 'https://www.spectrum.net';
    sitemapUrl = 'https://www.spectrum.net/sitemap.xml';

    async crawl(): Promise<Article[]> {
        console.log(`Starting crawl for ${this.company}...`);
        const articles: Article[] = [];

        try {
            const response = await axios.get(this.sitemapUrl);
            const $ = cheerio.load(response.data, { xmlMode: true });

            const urls: string[] = [];
            $('loc').each((_, el) => {
                const loc = $(el).text();
                if (loc.includes('/support/')) {
                    urls.push(loc);
                }
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
            productService: 'Spectrum Services',
            issueDescription: title,
            solutionSummary: description,
            url,
            lastUpdated: new Date().toISOString(),
            status: 'Active'
        };
    }
}
