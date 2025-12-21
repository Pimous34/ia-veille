import axios from 'axios';
import * as cheerio from 'cheerio';
// @ts-ignore
import TurndownService from 'turndown';

const turndownService = new TurndownService();

// Configure turndown to drop script/style tags
turndownService.remove(['script', 'style', 'iframe', 'nav', 'footer', 'header']);

export async function scrapeUrl(url: string): Promise<string> {
    try {
        console.log(`Scraping URL: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000 // 10s timeout
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // Remove clutter before converting
        $('script').remove();
        $('style').remove();
        $('nav').remove();
        $('footer').remove();
        $('header').remove();
        $('.cookie-consent').remove();
        $('.ads').remove();

        // Get the main content (heuristic: look for 'main', 'article', or fallback to body)
        let contentHtml = $('main').html() || $('article').html() || $('body').html() || '';
        
        if (!contentHtml) {
            console.warn(`No content found for ${url}`);
            return '';
        }

        const markdown = turndownService.turndown(contentHtml);
        return markdown;

    } catch (error: any) {
        console.error(`Failed to scrape ${url}: ${error.message}`);
        return ''; // Return empty string on failure to allow process to continue
    }
}
