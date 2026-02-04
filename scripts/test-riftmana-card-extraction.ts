// Test extracting actual card lists from RiftMana deck pages
// Run with: npx tsx scripts/test-riftmana-card-extraction.ts

import * as cheerio from 'cheerio';

const USER_AGENT = 'RiftboundCardSwap/1.0 (Meta Data Aggregator)';

async function testCardExtraction() {
  console.log('Testing RiftMana Card Extraction');
  console.log('='.repeat(60));
  console.log();

  // Test with a known deck URL
  const deckUrl = 'https://riftmana.com/decks/jinx-adjusted-ecg03p/';
  
  console.log(`Fetching: ${deckUrl}`);
  console.log();

  const response = await fetch(deckUrl, {
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

  // Extract deck info
  const deckName = $('h1').first().text().trim();
  const champions: string[] = [];
  $('.color-dot').each((_i, el) => {
    const champion = $(el).attr('aria-label');
    if (champion) champions.push(champion);
  });

  console.log('Deck Information:');
  console.log('-'.repeat(60));
  console.log(`Name: ${deckName}`);
  console.log(`Champions: ${champions.join(', ')}`);
  console.log();

  // Find the deck code/card list textarea
  const deckCodeElement = $('textarea').first();
  const deckCodeText = deckCodeElement.val() as string || '';

  if (!deckCodeText) {
    console.log('❌ No deck code found!');
    return;
  }

  console.log('Raw Deck Code:');
  console.log('-'.repeat(60));
  console.log(deckCodeText.substring(0, 200));
  console.log();

  // Parse the card list
  // Format: "1xOGN-251" or "3xOGN-036"
  const cardLines = deckCodeText.split('\n').filter(line => line.trim());
  const cards: Array<{ quantity: number; cardId: string; setCode: string; collectorNumber: string }> = [];

  console.log('Parsed Cards:');
  console.log('-'.repeat(60));

  for (const line of cardLines) {
    const match = line.match(/(\d+)x([A-Z]+)-(\d+)/i);
    if (match) {
      const quantity = parseInt(match[1]);
      const setCode = match[2].toLowerCase();
      const collectorNumber = match[3].padStart(3, '0');
      const cardId = `${setCode}-${collectorNumber}`;

      cards.push({
        quantity,
        cardId,
        setCode,
        collectorNumber,
      });

      console.log(`${quantity}x ${cardId} (set: ${setCode}, number: ${collectorNumber})`);
    }
  }

  console.log();
  console.log('Summary:');
  console.log('-'.repeat(60));
  console.log(`Total unique cards: ${cards.length}`);
  console.log(`Total card count: ${cards.reduce((sum, c) => sum + c.quantity, 0)}`);
  console.log();

  // Show how this maps to our database
  console.log('Database Matching:');
  console.log('-'.repeat(60));
  console.log('These card IDs can be matched to our database using:');
  console.log('  - set_code (e.g., "ogn")');
  console.log('  - collector_number (e.g., "036")');
  console.log();
  console.log('Example SQL query:');
  console.log(`  SELECT * FROM cards WHERE set_code = 'ogn' AND collector_number = '036'`);
  console.log();

  // Show tier mapping concept
  console.log('Tier Mapping Concept:');
  console.log('-'.repeat(60));
  console.log(`1. Deck champions: ${champions.join(', ')}`);
  console.log(`2. Look up champion tier from Riftbound (e.g., "Jinx" → Tier S)`);
  console.log(`3. Assign tier to all cards in this deck`);
  console.log(`4. Calculate weighted score: S=32, A=16, B=8, C=4, D=2`);
  console.log();

  return { deckName, champions, cards };
}

testCardExtraction().catch(console.error);

// Made with Bob
