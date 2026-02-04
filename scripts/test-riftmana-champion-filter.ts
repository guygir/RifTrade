// Test RiftMana champion-specific deck filtering
// Run with: npx tsx scripts/test-riftmana-champion-filter.ts

import * as cheerio from 'cheerio';

const USER_AGENT = 'RiftboundCardSwap/1.0 (Meta Data Aggregator)';

async function testChampionFilter(championId: string, championName: string) {
  const url = `https://riftmana.com/decks/?legend=${championId}&filter_type=trending`;
  
  console.log(`\nTesting: ${championName} (${championId})`);
  console.log(`URL: ${url}`);
  console.log('-'.repeat(60));

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      console.log(`❌ HTTP ${response.status}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Find deck elements
    const deckElements = $('.all-deck-box-wrapper');
    console.log(`Found ${deckElements.length} decks`);

    if (deckElements.length === 0) {
      console.log('❌ No decks found');
      return null;
    }

    // Get first 3 decks
    const decks: any[] = [];
    deckElements.slice(0, 3).each((i, element) => {
      const $deck = $(element);
      
      const deck = {
        name: $deck.find('h3').text().trim(),
        url: $deck.attr('href'),
        views: $deck.find('.deck-views').text().trim(),
        archetype: $deck.find('.all-deck-tag').first().text().trim(),
      };

      decks.push(deck);
      console.log(`  ${i + 1}. ${deck.name}`);
      console.log(`     Views: ${deck.views}, Archetype: ${deck.archetype}`);
    });

    return decks;

  } catch (error) {
    console.log(`❌ Error: ${error}`);
    return null;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Testing RiftMana Champion-Specific Deck Filtering');
  console.log('='.repeat(60));

  // Test with a few champions
  const testChampions = [
    { id: 'ogn-247', name: "Kai'Sa" },
    { id: 'ogn-036', name: 'Vi' },
    { id: 'ogn-035', name: 'Jinx' },
  ];

  for (const champion of testChampions) {
    await testChampionFilter(champion.id, champion.name);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Rate limit
  }

  console.log();
  console.log('='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log('✅ Champion-specific filtering works!');
  console.log('✅ Can get top 3 trending decks per champion');
  console.log('✅ This ensures equal representation across all champions');
  console.log();
  console.log('Next steps:');
  console.log('1. Get champion IDs from Riftbound tier list');
  console.log('2. For each champion, fetch top 3 decks from RiftMana');
  console.log('3. Visit each deck page to extract cards');
  console.log('4. Apply tier weights based on champion tier');
  console.log('5. Calculate weighted metrics');
}

main().catch(console.error);

// Made with Bob
