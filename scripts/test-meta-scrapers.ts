// Test script for meta data scrapers
// Run with: npx tsx scripts/test-meta-scrapers.ts

import { testRiftManaScraper } from '../lib/meta-data/sources/riftmana';
import { testRiftboundScraper } from '../lib/meta-data/sources/riftbound-tiers';

async function main() {
  console.log('='.repeat(60));
  console.log('Testing Meta Data Scrapers');
  console.log('='.repeat(60));
  console.log('');

  // Test RiftMana
  console.log('1️⃣  Testing RiftMana.com scraper...');
  console.log('-'.repeat(60));
  try {
    const riftManaResult = await testRiftManaScraper();
    if (riftManaResult.success && riftManaResult.data) {
      console.log(`✅ RiftMana: Found ${riftManaResult.data.length} decks`);
      if (riftManaResult.data.length > 0) {
        console.log('Sample deck:', JSON.stringify(riftManaResult.data[0], null, 2));
      }
    } else {
      console.log(`❌ RiftMana failed: ${riftManaResult.error}`);
    }
  } catch (error) {
    console.log(`❌ RiftMana error:`, error);
  }
  console.log('');

  // Test Riftbound
  console.log('2️⃣  Testing Riftbound.gg tier list scraper...');
  console.log('-'.repeat(60));
  try {
    const riftboundResult = await testRiftboundScraper();
    if (riftboundResult.success && riftboundResult.data) {
      console.log(`✅ Riftbound: Found ${riftboundResult.data.length} decks`);
      
      // Group by tier
      const byTier: Record<string, number> = {};
      riftboundResult.data.forEach(deck => {
        const tier = deck.tier || 'Unknown';
        byTier[tier] = (byTier[tier] || 0) + 1;
      });
      console.log('Decks by tier:', byTier);
      
      if (riftboundResult.data.length > 0) {
        console.log('Sample deck:', JSON.stringify(riftboundResult.data[0], null, 2));
      }
    } else {
      console.log(`❌ Riftbound failed: ${riftboundResult.error}`);
    }
  } catch (error) {
    console.log(`❌ Riftbound error:`, error);
  }
  console.log('');

  console.log('='.repeat(60));
  console.log('Testing Complete');
  console.log('='.repeat(60));
  console.log('');
  console.log('⚠️  If scrapers failed or returned 0 decks:');
  console.log('   1. Check if websites are accessible');
  console.log('   2. Inspect actual HTML structure in browser dev tools');
  console.log('   3. Update CSS selectors in scraper files');
  console.log('   4. Check robots.txt compliance');
}

main().catch(console.error);

// Made with Bob
