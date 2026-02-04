// Script to inspect a champion legend page HTML structure
// Run with: npx tsx scripts/inspect-legend-page.ts

import * as cheerio from 'cheerio';

const CHAMPION_URL = 'https://riftbound.gg/legends/draven/';
const USER_AGENT = 'RiftboundCardSwap/1.0 (Meta Data Aggregator)';

async function main() {
  console.log('Fetching:', CHAMPION_URL);
  console.log();

  try {
    const response = await fetch(CHAMPION_URL, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    console.log('HTML length:', html.length);
    console.log();

    // Check for various possible deck container classes
    const possibleSelectors = [
      '.RootOfEmbeddedDeck',
      '[class*="Deck"]',
      '[class*="deck"]',
      '[class*="Card"]',
      '[class*="card"]',
      'a[href*="/cards/"]',
    ];

    console.log('Searching for deck elements:');
    console.log('='.repeat(60));

    for (const selector of possibleSelectors) {
      const elements = $(selector);
      console.log(`${selector}: ${elements.length} found`);
      
      if (elements.length > 0 && elements.length < 100) {
        elements.slice(0, 3).each((i, el) => {
          const $el = $(el);
          const classes = $el.attr('class') || 'no-class';
          const text = $el.text().trim().substring(0, 50);
          console.log(`  [${i}] class="${classes}" text="${text}"`);
        });
      }
    }

    console.log();
    console.log('='.repeat(60));
    console.log('Looking for card links:');
    console.log('='.repeat(60));

    const cardLinks = $('a[href*="/cards/"]');
    console.log(`Found ${cardLinks.length} card links`);

    if (cardLinks.length > 0) {
      cardLinks.slice(0, 10).each((i, link) => {
        const href = $(link).attr('href');
        const text = $(link).text().trim();
        const parent = $(link).parent().attr('class') || 'no-class';
        console.log(`  [${i}] ${href}`);
        console.log(`      text: "${text}"`);
        console.log(`      parent class: "${parent}"`);
      });
    }

    console.log();
    console.log('='.repeat(60));
    console.log('Sample HTML around first card link:');
    console.log('='.repeat(60));

    if (cardLinks.length > 0) {
      const firstLink = cardLinks.first();
      const parent = firstLink.parent();
      const grandparent = parent.parent();
      
      console.log('Grandparent HTML:');
      console.log(grandparent.html()?.substring(0, 500));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main();

// Made with Bob
