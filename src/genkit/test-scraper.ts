import { scrapeUrl } from './scraper';

async function main() {
    console.log('Testing scraper...');
    const url = 'https://oreegami.com/ressources/faq/';
    console.log(`Fetching ${url}...`);
    try {
        const md = await scrapeUrl(url);
        console.log('--- Result ---');
        console.log(md.slice(0, 500) + '...');
        console.log('--- End ---');
    } catch (e) {
        console.error('Scraper failed:', e);
    }
}

main();
