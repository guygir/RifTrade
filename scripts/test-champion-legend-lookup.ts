// Test script for champion Legend card lookup
import * as dotenv from 'dotenv';
import * as path from 'path';
import { lookupChampionLegend } from '../lib/meta-data/sources/champion-legend-lookup';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function test() {
  console.log('Testing champion Legend card lookup...\n');
  
  const testChampions = ['Kai\'Sa', 'Ahri', 'Yasuo'];
  
  for (const champion of testChampions) {
    console.log('Looking up:', champion);
    const result = await lookupChampionLegend(champion);
    if (result) {
      console.log('✅ Found:');
      console.log('   Card:', result.cardName);
      console.log('   Code:', result.setCode + '-' + result.collectorNumber);
      console.log('   RiftMana URL:', result.riftManaUrl);
      console.log('');
    } else {
      console.log('❌ Not found\n');
    }
  }
}

test().catch(console.error);

// Made with Bob