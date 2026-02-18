import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Article } from './types.js';

export abstract class BaseCrawler {
    abstract company: string;
    abstract baseUrl: string;

    protected async fetchHtml(url: string): Promise<string> {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Failed to fetch ${url}:`, error);
            throw error;
        }
    }

    abstract crawl(): Promise<Article[]>;
    abstract extract(url: string, html: string): Article;
}
