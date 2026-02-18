import dotenv from 'dotenv';
import { RokuCrawler } from './crawlers/roku.js';
import { GoogleCrawler } from './crawlers/google.js';
import { AppleCrawler } from './crawlers/apple.js';
import { MetaCrawler } from './crawlers/meta.js';
import { MicrosoftCrawler } from './crawlers/microsoft.js';
import { SpectrumCrawler } from './crawlers/spectrum.js';
import { WMCrawler } from './crawlers/wm.js';
import { CanonCrawler } from './crawlers/canon.js';
import { RGECrawler } from './crawlers/rge.js';
import { NotionSync } from './notion/sync.js';
import type { Article } from './types.js';

dotenv.config();

async function main() {
    const notionApiKey = process.env.NOTION_API_KEY || 'MOCK';
    const databaseId = process.env.NOTION_DATABASE_ID || '2fb277d3df7d80128d86caef08997d39';

    const sync = new NotionSync(notionApiKey, databaseId);

    const crawlers = [
        new RokuCrawler(),
        new GoogleCrawler(),
        new AppleCrawler(),
        new MetaCrawler(),
        new MicrosoftCrawler(),
        new SpectrumCrawler(),
        new WMCrawler(),
        new CanonCrawler(),
        new RGECrawler()
    ];

    console.log('--- Starting Support Article Crawl ---');

    for (const crawler of crawlers) {
        try {
            const articles = await crawler.crawl();
            console.log(`Crawl completed for ${crawler.company}. Found ${articles.length} articles.`);

            for (const article of articles) {
                await sync.syncArticle(article);
            }
        } catch (error) {
            console.error(`Error during crawl for ${crawler.company}:`, error);
        }
    }

    console.log('--- Crawl Finished ---');
}

main();
