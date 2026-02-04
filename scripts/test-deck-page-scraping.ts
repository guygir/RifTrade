// Test scraping individual deck pages
// Run with: npx tsx scripts/test-deck-page-scraping.ts

import * as cheerio from 'cheerio';

const DECK_URL = 'https://riftbound.gg/decks/draven-wins-bologna';
const USER_AGENT = 'RiftboundCardSwap/1.0 (Meta Data Aggregator)';

async function main() {
  console.log('Fetching deck page:', DECK_URL);
  console.log('='.repeat(60));
  console.log();

  try {
    const response = await fetch(DECK_URL, {
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

    // Look for card links
    const cardLinks = $('a[href*="/cards/"]');
    console.log(`Found ${cardLinks.length} card links`);
    console.log();

    if (cardLinks.length > 0) {
      const cards = new Map<string, { name: string; count: number }>();

      cardLinks.each((i, link) => {
        const href = $(link).attr('href');
        if (!href || href === 'https://riftbound.gg/cards/') return;

        // Parse card ID from URL
        const match = href.match(/\/cards\/([a-z0-9]+-\d+)/i);
        if (!match) return;

        const cardId = match[1];
        const cardName = $(link).text().trim() || cardId;

        if (cards.has(cardId)) {
          cards.get(cardId)!.count++;
        } else {
          cards.set(cardId, { name: cardName, count: 1 });
        }
      });

      console.log(`Unique cards found: ${cards.size}`);
      console.log();
      console.log('Card list:');
      console.log('-'.repeat(60));

      let totalCards = 0;
      Array.from(cards.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .forEach(([cardId, data]) => {
          console.log(`${data.count}x ${cardId} - ${data.name}`);
          totalCards += data.count;
        });

      console.log('-'.repeat(60));
      console.log(`Total cards in deck: ${totalCards}`);
    } else {
      console.log('No card links found!');
      console.log();
      console.log('Checking for RootOfEmbeddedDeck...');
      
      const deckElements = $('.RootOfEmbeddedDeck');
      console.log(`Found ${deckElements.length} RootOfEmbeddedDeck elements`);
      
      if (deckElements.length > 0) {
        deckElements.each((i, el) => {
          const $el = $(el);
          console.log(`\nDeck ${i}:`);
          console.log('  data-deck:', $el.attr('data-deck'));
          console.log('  HTML length:', $el.html()?.length || 0);
          console.log('  Text:', $el.text().substring(0, 100));
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main();

// Made with Bob
