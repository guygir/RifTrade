// Complete test of champion-per-champion card extraction
// Tests: Riftbound tiers → RiftMana decks → Card extraction → Database matching → Weighted metrics
// Run with: npx tsx scripts/test-complete-champion-flow.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fetchRiftboundTiers } from '../lib/meta-data/sources/riftbound-tiers';
import { fetchChampionDecks } from '../lib/meta-data/sources/riftmana-champion-decks';
import { getChampionCardId } from '../lib/meta-data/champion-mapping';
import { matchCardsToDatabase, calculateWeightedUsage } from '../lib/meta-data/transformers/card-matcher';
import type { CardUsage } from '../lib/meta-data/types';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteFlow() {
  console.log('='.repeat(70));
  console.log('COMPLETE CHAMPION-PER-CHAMPION CARD EXTRACTION TEST');
  console.log('='.repeat(70));
  console.log();

  // Step 1: Fetch Riftbound tier list
  console.log('Step 1: Fetching Riftbound tier list...');
  console.log('-'.repeat(70));
  
  const riftboundResult = await fetchRiftboundTiers();
  
  if (!riftboundResult.success || !riftboundResult.data) {
    console.error('❌ Failed to fetch Riftbound tiers:', riftboundResult.error);
    return;
  }

  const champions = riftboundResult.data;
  console.log(`✅ Found ${champions.length} champions across all tiers`);
  
  // Group by tier
  const byTier: Record<string, number> = {};
  champions.forEach(c => {
    const tier = c.tier || 'Unknown';
    byTier[tier] = (byTier[tier] || 0) + 1;
  });
  console.log('Tier distribution:', byTier);
  console.log();

  // Step 2: Fetch decks for ALL champions
  console.log('Step 2: Fetching decks for ALL 44 champions...');
  console.log('-'.repeat(70));
  console.log('⚠️  This will take several minutes due to rate limiting...\n');
  
  const testChampions = champions; // Process ALL champions
  const allCardUsages: CardUsage[] = [];
  let totalDecks = 0;
  let successfulChampions = 0;
  let failedChampions = 0;

  for (const champion of testChampions) {
    const championName = champion.champions[0];
    const tier = champion.tier || '4';
    const championCardId = getChampionCardId(championName);

    if (!championCardId) {
      console.log(`⚠️  ${championName}: No card ID mapping found`);
      failedChampions++;
      continue;
    }

    console.log(`\nFetching ${championName} (${tier} tier, ID: ${championCardId})...`);
    
    const decksResult = await fetchChampionDecks(championName, championCardId, tier as any);
    
    if (!decksResult.success || !decksResult.data || decksResult.data.length === 0) {
      console.log(`  ❌ Failed: ${decksResult.error || 'No decks found'}`);
      failedChampions++;
      continue;
    }

    const decks = decksResult.data;
    console.log(`  ✅ Got ${decks.length} decks`);
    
    decks.forEach(deck => {
      console.log(`    - ${deck.deckName}: ${deck.cards.length} cards`);
      allCardUsages.push(...deck.cards);
    });

    totalDecks += decks.length;
    successfulChampions++;
  }

  console.log();
  console.log('='.repeat(70));
  console.log('Step 2 Summary:');
  console.log(`  Champions processed: ${testChampions.length}`);
  console.log(`  Successful: ${successfulChampions}`);
  console.log(`  Failed: ${failedChampions}`);
  console.log(`  Total decks: ${totalDecks}`);
  console.log(`  Total card instances: ${allCardUsages.length}`);
  console.log();

  if (allCardUsages.length === 0) {
    console.error('❌ No cards extracted. Cannot continue.');
    return;
  }

  // Step 3: Match cards to database
  console.log('Step 3: Matching cards to database...');
  console.log('-'.repeat(70));
  
  const matchedCards = await matchCardsToDatabase(allCardUsages, supabase);
  
  const matchRate = (matchedCards.length / allCardUsages.length) * 100;
  console.log(`✅ Matched ${matchedCards.length} / ${allCardUsages.length} cards (${matchRate.toFixed(1)}%)`);
  
  if (matchedCards.length < allCardUsages.length) {
    const unmatched = allCardUsages.length - matchedCards.length;
    console.log(`⚠️  ${unmatched} cards could not be matched to database`);
  }
  console.log();

  // Step 4: Calculate weighted metrics
  console.log('Step 4: Calculating weighted usage metrics...');
  console.log('-'.repeat(70));
  
  const weightedStats = calculateWeightedUsage(matchedCards, totalDecks);
  console.log(`✅ Calculated stats for ${weightedStats.size} unique cards`);
  console.log();

  // Step 5: Show top 10 cards
  console.log('Step 5: TOP 10 CARDS (by weighted percentage)');
  console.log('='.repeat(70));
  
  const sortedCards = Array.from(weightedStats.values())
    .sort((a, b) => b.weightedPercentage - a.weightedPercentage)
    .slice(0, 10);

  sortedCards.forEach((card, index) => {
    console.log(`\n${index + 1}. Card ID: ${card.cardId}`);
    console.log(`   Raw Usage: ${card.rawUsageCount} decks (${card.rawUsagePercentage.toFixed(1)}%)`);
    console.log(`   Weighted Score: ${card.weightedScore.toFixed(1)} points`);
    console.log(`   Weighted %: ${card.weightedPercentage.toFixed(1)}%`);
    console.log(`   Avg Copies: ${card.avgCopies.toFixed(1)}`);
    console.log(`   Tier Distribution:`, card.tierDistribution);
  });

  console.log();
  console.log('='.repeat(70));
  console.log('TEST COMPLETE');
  console.log('='.repeat(70));
  console.log();
  console.log('Success Criteria:');
  console.log(`  ✅ Champions fetched: ${champions.length}`);
  console.log(`  ${successfulChampions > 0 ? '✅' : '❌'} Decks extracted: ${totalDecks}`);
  console.log(`  ${allCardUsages.length > 0 ? '✅' : '❌'} Cards extracted: ${allCardUsages.length}`);
  console.log(`  ${matchRate >= 95 ? '✅' : '⚠️ '} Match rate: ${matchRate.toFixed(1)}%`);
  console.log(`  ${weightedStats.size > 0 ? '✅' : '❌'} Unique cards: ${weightedStats.size}`);
  console.log();
  
  if (successfulChampions > 0 && matchRate >= 95 && weightedStats.size > 0) {
    console.log('🎉 ALL TESTS PASSED! Ready for full implementation.');
  } else {
    console.log('⚠️  Some issues detected. Review above for details.');
  }
}

testCompleteFlow().catch(console.error);

// Made with Bob
