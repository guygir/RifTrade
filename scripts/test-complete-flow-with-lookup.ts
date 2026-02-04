// Test the complete flow with database-driven champion lookup
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fetchRiftboundTiers } from '../lib/meta-data/sources/riftbound-tiers';
import { lookupChampionLegend } from '../lib/meta-data/sources/champion-legend-lookup';
import { fetchChampionDecks } from '../lib/meta-data/sources/riftmana-champion-decks';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function test() {
  console.log('Testing complete flow with database-driven champion lookup...\n');
  
  // Step 1: Fetch tier list
  console.log('Step 1: Fetching Riftbound tier list...');
  const tiersResult = await fetchRiftboundTiers();
  
  if (!tiersResult.success || !tiersResult.data) {
    console.error('Failed to fetch tier list:', tiersResult.error);
    return;
  }
  
  console.log(`✅ Found ${tiersResult.data.length} champions\n`);
  
  // Step 2: Test with first 3 champions
  const testChampions = tiersResult.data.slice(0, 3);
  
  for (const champion of testChampions) {
    const championName = champion.champions[0];
    const tier = champion.tier || '4';
    
    console.log(`\nProcessing: ${championName} (${tier} tier)`);
    console.log('='.repeat(80));
    
    // Look up Legend card
    const legendCard = await lookupChampionLegend(championName);
    
    if (!legendCard) {
      console.log(`❌ No Legend card found for ${championName}`);
      continue;
    }
    
    console.log(`✅ Legend card: ${legendCard.cardName}`);
    console.log(`   Card ID: ${legendCard.setCode}-${legendCard.collectorNumber}`);
    console.log(`   RiftMana URL: ${legendCard.riftManaUrl}`);
    
    // Fetch decks from RiftMana
    const championCardId = `${legendCard.setCode.toLowerCase()}-${legendCard.collectorNumber}`;
    const decksResult = await fetchChampionDecks(championName, championCardId, tier as any);
    
    if (!decksResult.success || !decksResult.data) {
      console.log(`❌ Failed to fetch decks: ${decksResult.error}`);
      continue;
    }
    
    console.log(`✅ Found ${decksResult.data.length} decks`);
    
    // Show card counts
    let totalCards = 0;
    decksResult.data.forEach(deck => {
      totalCards += deck.cards.length;
      console.log(`   - ${deck.deckName}: ${deck.cards.length} cards`);
    });
    
    console.log(`   Total card instances: ${totalCards}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Test complete!');
}

test().catch(console.error);

// Made with Bob