// Test script for enhanced card extraction
// Tests the new deep deck scraping and weighted metrics

import { testRiftboundDeckScraper } from '../lib/meta-data/sources/riftbound-deck-scraper';
import { testCardMatcher } from '../lib/meta-data/transformers/card-matcher';

async function main() {
  console.log('='.repeat(60));
  console.log('ENHANCED CARD EXTRACTION TEST');
  console.log('='.repeat(60));
  console.log('');

  // Test 1: Riftbound Deck Scraper
  console.log('TEST 1: Riftbound Deck Scraper');
  console.log('-'.repeat(60));
  try {
    await testRiftboundDeckScraper();
    console.log('✅ Deck scraper test passed\n');
  } catch (error) {
    console.error('❌ Deck scraper test failed:', error);
    console.log('');
  }

  // Test 2: Card Matcher
  console.log('TEST 2: Card Matcher');
  console.log('-'.repeat(60));
  try {
    await testCardMatcher();
    console.log('✅ Card matcher test passed\n');
  } catch (error) {
    console.error('❌ Card matcher test failed:', error);
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
  console.log('');
  console.log('Next steps:');
  console.log('1. If tests passed, run: npm run dev');
  console.log('2. Visit: http://localhost:3000/api/meta/refresh (POST)');
  console.log('3. Check: http://localhost:3000 (homepage)');
  console.log('4. Check: http://localhost:3000/cards (cards page)');
  console.log('');
  console.log('Expected results:');
  console.log('- 30-40+ cards instead of 7');
  console.log('- Dual percentages (raw + weighted)');
  console.log('- Yellow ⚡ icon for weighted %');
}

main().catch(console.error);

// Made with Bob