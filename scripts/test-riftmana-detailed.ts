// Test RiftMana scraper to see what data we actually get
// Run with: npx tsx scripts/test-riftmana-detailed.ts

import * as cheerio from 'cheerio';

const RIFTMANA_URL = 'https://riftmana.com/decks/';
const USER_AGENT = 'RiftboundCardSwap/1.0 (Meta Data Aggregator)';

async function testRiftManaDecks() {
  console.log('Fetching RiftMana decks page...');
  console.log('='.repeat(60));

  const response = await fetch(RIFTMANA_URL, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  console.log(`HTML length: ${html.length}`);
  console.log();

  // Find deck elements
  const deckElements = $('.all-deck-box-wrapper');
  console.log(`Found ${deckElements.length} deck elements`);
  console.log();

  if (deckElements.length === 0) {
    console.log('No decks found! Checking HTML structure...');
    console.log('Sample HTML:', html.substring(0, 500));
    return;
  }

  // Parse first 3 decks
  const decks: any[] = [];
  deckElements.slice(0, 3).each((i, element) => {
    const $deck = $(element);
    
    const deck = {
      name: $deck.find('h3').text().trim(),
      champions: [] as string[],
      price: $deck.find('.deck-price-stat').text().trim(),
      views: $deck.find('.deck-views').text().trim(),
      archetype: $deck.find('.all-deck-tag').first().text().trim(),
      url: $deck.attr('href'),
      author: $deck.find('.deck-author').text().trim(),
      date: $deck.find('.deck-date').text().trim(),
    };

    // Extract champions
    $deck.find('.color-dot').each((_j, el) => {
      const champion = $(el).attr('aria-label');
      if (champion) deck.champions.push(champion);
    });

    decks.push(deck);
  });

  console.log('Sample Decks from Main Page:');
  console.log('='.repeat(60));
  decks.forEach((deck, i) => {
    console.log(`\nDeck ${i + 1}:`);
    console.log(`  Name: ${deck.name}`);
    console.log(`  Champions: ${deck.champions.join(', ')}`);
    console.log(`  Archetype: ${deck.archetype}`);
    console.log(`  Price: ${deck.price}`);
    console.log(`  Views: ${deck.views}`);
    console.log(`  Author: ${deck.author}`);
    console.log(`  Date: ${deck.date}`);
    console.log(`  URL: ${deck.url}`);
  });

  // Now test fetching a single deck page to see if we can get cards
  if (decks[0]?.url) {
    console.log('\n' + '='.repeat(60));
    console.log('Testing Individual Deck Page');
    console.log('='.repeat(60));
    
    const deckUrl = decks[0].url.startsWith('http') 
      ? decks[0].url 
      : `https://riftmana.com${decks[0].url}`;
    
    console.log(`\nFetching: ${deckUrl}`);
    
    await new Promise(resolve => setTimeout(resolve, 1500)); // Rate limit
    
    const deckResponse = await fetch(deckUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html',
      },
    });

    if (!deckResponse.ok) {
      console.log(`Failed to fetch deck page: ${deckResponse.status}`);
      return;
    }

    const deckHtml = await deckResponse.text();
    const $deck = cheerio.load(deckHtml);

    console.log(`\nDeck page HTML length: ${deckHtml.length}`);
    console.log();

    // Look for card elements
    const possibleCardSelectors = [
      '.card',
      '.deck-card',
      '[class*="card"]',
      'a[href*="/cards/"]',
      '.card-item',
      '.card-entry',
    ];

    console.log('Searching for cards on deck page:');
    console.log('-'.repeat(60));
    
    for (const selector of possibleCardSelectors) {
      const elements = $deck(selector);
      if (elements.length > 0 && elements.length < 200) {
        console.log(`${selector}: ${elements.length} found`);
        
        // Show first few
        elements.slice(0, 3).each((i, el) => {
          const $el = $deck(el);
          const text = $el.text().trim().substring(0, 50);
          const href = $el.attr('href') || $el.find('a').attr('href');
          console.log(`  [${i}] ${text}${href ? ` (${href})` : ''}`);
        });
      }
    }

    // Check for deck code
    console.log();
    console.log('Looking for deck code...');
    const deckCodeElement = $deck('[class*="deck-code"], [class*="deckcode"], textarea, input[type="text"]');
    if (deckCodeElement.length > 0) {
      console.log(`Found ${deckCodeElement.length} potential deck code elements`);
      deckCodeElement.slice(0, 2).each((i, el) => {
        const $el = $deck(el);
        const value = $el.val() || $el.text();
        console.log(`  [${i}] ${String(value).substring(0, 100)}`);
      });
    }
  }
}

testRiftManaDecks().catch(console.error);

// Made with Bob
