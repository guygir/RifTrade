// Script to find embedded deck data in legend page HTML
// Run with: npx tsx scripts/find-deck-data.ts

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

    console.log('='.repeat(60));
    console.log('Looking for embedded deck data...');
    console.log('='.repeat(60));
    console.log();

    // Check for script tags with JSON data
    $('script').each((i, script) => {
      const content = $(script).html() || '';
      
      // Look for deck-related data
      if (content.includes('deck') || content.includes('Deck') || 
          content.includes('card') || content.includes('Card')) {
        
        // Check if it contains JSON
        if (content.includes('{') && content.includes('}')) {
          console.log(`Script tag ${i}:`);
          console.log('Length:', content.length);
          console.log('Contains "deck":', content.toLowerCase().includes('deck'));
          console.log('Contains "card":', content.toLowerCase().includes('card'));
          console.log('Sample:', content.substring(0, 200));
          console.log('-'.repeat(60));
        }
      }
    });

    console.log();
    console.log('='.repeat(60));
    console.log('Checking RootOfEmbeddedDeck elements...');
    console.log('='.repeat(60));
    console.log();

    $('.RootOfEmbeddedDeck').each((i, el) => {
      const $el = $(el);
      console.log(`Deck ${i}:`);
      console.log('HTML length:', $el.html()?.length || 0);
      console.log('Text:', $el.text().substring(0, 100));
      console.log('Attributes:', Object.keys($el.attr() || {}));
      
      // Check for data attributes
      const attrs = $el.attr();
      if (attrs) {
        Object.entries(attrs).forEach(([key, value]) => {
          if (key.startsWith('data-')) {
            console.log(`  ${key}: ${value}`);
          }
        });
      }
      console.log('-'.repeat(60));
    });

    console.log();
    console.log('='.repeat(60));
    console.log('Searching for deck codes or IDs...');
    console.log('='.repeat(60));
    console.log();

    // Look for common deck code patterns
    const deckCodePatterns = [
      /deck[_-]?code/i,
      /deck[_-]?id/i,
      /deck[_-]?string/i,
      /CQBQCBQH/i, // Example deck code pattern
    ];

    for (const pattern of deckCodePatterns) {
      const matches = html.match(pattern);
      if (matches) {
        console.log(`Found pattern ${pattern}:`, matches[0]);
        // Show context
        const index = html.indexOf(matches[0]);
        console.log('Context:', html.substring(index - 50, index + 150));
        console.log('-'.repeat(60));
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main();

// Made with Bob
