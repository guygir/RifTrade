// Test script for the enhanced Riftbound deck scraper
// Run with: npx tsx scripts/test-deck-scraper.ts

import { fetchRiftboundDecks } from '../lib/meta-data/sources/riftbound-deck-scraper';

async function main() {
  console.log('='.repeat(60));
  console.log('Testing Enhanced Riftbound Deck Scraper');
  console.log('='.repeat(60));
  console.log();

  try {
    const result = await fetchRiftboundDecks();

    console.log('\n' + '='.repeat(60));
    console.log('RESULTS');
    console.log('='.repeat(60));

    if (result.success && result.data) {
      console.log(`✅ Success! Fetched ${result.data.length} champion decks`);
      console.log();

      // Show breakdown by tier
      const byTier: Record<string, number> = {};
      let totalCards = 0;

      result.data.forEach(deck => {
        byTier[deck.tier] = (byTier[deck.tier] || 0) + 1;
        totalCards += deck.cards.length;
      });

      console.log('Decks by tier:');
      Object.entries(byTier).forEach(([tier, count]) => {
        console.log(`  ${tier}: ${count} decks`);
      });

      console.log();
      console.log(`Total cards extracted: ${totalCards}`);
      console.log(`Average cards per deck: ${(totalCards / result.data.length).toFixed(1)}`);

      // Show first 3 decks as samples
      console.log();
      console.log('Sample decks:');
      result.data.slice(0, 3).forEach((deck, i) => {
        console.log(`\n${i + 1}. ${deck.championName} (${deck.tier} tier)`);
        console.log(`   URL: ${deck.legendUrl}`);
        console.log(`   Cards: ${deck.cards.length}`);
        console.log(`   First 5 cards: ${deck.cards.slice(0, 5).map(c => c.cardId).join(', ')}`);
      });

    } else {
      console.log('❌ Failed:', result.error);
      console.log();
      console.log('This usually means:');
      console.log('1. Network connection issue');
      console.log('2. Riftbound.gg HTML structure changed');
      console.log('3. Rate limiting or blocking');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log();
  console.log('='.repeat(60));
}

main();

// Made with Bob
