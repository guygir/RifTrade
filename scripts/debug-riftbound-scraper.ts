// Debug script to test Riftbound deck scraper
// Run: npx tsx scripts/debug-riftbound-scraper.ts

import { testRiftboundDeckScraper } from '../lib/meta-data/sources/riftbound-deck-scraper';

async function main() {
  console.log('Testing Riftbound deck scraper...\n');
  
  try {
    const result = await testRiftboundDeckScraper();
    
    if (result.success && result.data) {
      console.log('\n✅ SUCCESS!');
      console.log(`Found ${result.data.length} champion decks`);
      
      if (result.data.length > 0) {
        console.log('\nFirst deck sample:');
        console.log(JSON.stringify(result.data[0], null, 2));
      }
    } else {
      console.log('\n❌ FAILED');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('\n❌ EXCEPTION:', error);
  }
}

main();

// Made with Bob