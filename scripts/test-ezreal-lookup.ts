// Test Ezreal lookup to verify it excludes overnumbered cards
import * as dotenv from 'dotenv';
import * as path from 'path';
import { lookupChampionLegend } from '../lib/meta-data/sources/champion-legend-lookup';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function test() {
  console.log('Testing Ezreal and Miss Fortune lookups...\n');
  
  const champions = ['Ezreal', 'Miss Fortune'];
  
  for (const champion of champions) {
    const result = await lookupChampionLegend(champion);
    if (result) {
      console.log(`✅ ${champion}:`);
      console.log(`   Card: ${result.cardName}`);
      console.log(`   Code: ${result.setCode}-${result.collectorNumber}`);
      console.log(`   RiftMana URL: ${result.riftManaUrl}\n`);
    } else {
      console.log(`❌ ${champion}: Not found\n`);
    }
  }
}

test().catch(console.error);

// Made with Bob