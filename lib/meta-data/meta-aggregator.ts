// Meta aggregator - orchestrates data fetching, normalization, and storage
// Enhanced version: Champion-per-champion approach with RiftMana deck extraction

import { createClient } from '@supabase/supabase-js';
import { fetchRiftboundTiers } from './sources/riftbound-tiers';
import { fetchChampionDecks } from './sources/riftmana-champion-decks';
import { lookupChampionLegend } from './sources/champion-legend-lookup';
import { normalizeDecks, mergeDuplicateDecks, sortDecksByPopularity } from './transformers/deck-normalizer';
import { matchCardsToDatabase, calculateWeightedUsage } from './transformers/card-matcher';
import { NormalizedDeck, CardUsage } from './types';
import crypto from 'crypto';

interface AggregationResult {
  success: boolean;
  snapshotId?: string;
  decksCount?: number;
  cardsCount?: number;
  errors?: string[];
}

/**
 * Main aggregation function - fetches data from all sources and stores in database
 */
export async function aggregateMetaData(
  supabaseUrl: string,
  supabaseKey: string
): Promise<AggregationResult> {
  
  console.log('[MetaAggregator] Starting meta data aggregation...');
  
  const errors: string[] = [];
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Step 1: Fetch Riftbound tier list (all champions)
    console.log('[MetaAggregator] Step 1: Fetching Riftbound tier list...');
    const riftboundTiersResult = await fetchRiftboundTiers();
    
    if (!riftboundTiersResult.success || !riftboundTiersResult.data) {
      throw new Error(`Riftbound tiers fetch failed: ${riftboundTiersResult.error}`);
    }

    const champions = riftboundTiersResult.data;
    console.log(`[MetaAggregator] Found ${champions.length} champions across all tiers`);

    // Step 2: Fetch top 3 trending decks for each champion from RiftMana
    console.log('[MetaAggregator] Step 2: Fetching top 3 decks per champion from RiftMana...');
    const allCardUsages: CardUsage[] = [];
    let totalDecks = 0;
    let successfulChampions = 0;
    let failedChampions = 0;

    for (const champion of champions) {
      const championName = champion.champions[0];
      const tier = champion.tier || '4';
      
      // Look up champion's Legend card from database
      const legendCard = await lookupChampionLegend(championName);

      if (!legendCard) {
        console.warn(`[MetaAggregator] No Legend card found for ${championName}`);
        failedChampions++;
        continue;
      }

      const championCardId = `${legendCard.setCode.toLowerCase()}-${legendCard.collectorNumber}`;
      const decksResult = await fetchChampionDecks(championName, championCardId, tier as any);
      
      if (!decksResult.success || !decksResult.data || decksResult.data.length === 0) {
        console.warn(`[MetaAggregator] Failed to fetch decks for ${championName}: ${decksResult.error}`);
        failedChampions++;
        continue;
      }

      const decks = decksResult.data;
      decks.forEach(deck => {
        allCardUsages.push(...deck.cards);
      });

      totalDecks += decks.length;
      successfulChampions++;
    }

    console.log(`[MetaAggregator] Champion processing complete:`);
    console.log(`  - Successful: ${successfulChampions}/${champions.length}`);
    console.log(`  - Failed: ${failedChampions}`);
    console.log(`  - Total decks: ${totalDecks}`);
    console.log(`  - Total card instances: ${allCardUsages.length}`);

    if (allCardUsages.length === 0) {
      throw new Error('No cards extracted from any champion decks');
    }

    // Step 3: Normalize tier list for deck display
    console.log('[MetaAggregator] Step 3: Normalizing tier list for deck display...');
    
    const normalizedDecks = normalizeDecks(champions, 'riftbound_tierlist');
    console.log(`[MetaAggregator] Normalized ${normalizedDecks.length} decks for display`);

    // Step 4: Match cards to database
    console.log('[MetaAggregator] Step 4: Matching cards to database...');
    const matchedCards = await matchCardsToDatabase(allCardUsages, supabase);
    console.log(`[MetaAggregator] Matched ${matchedCards.length} card instances to database`);

    // Step 5: Calculate weighted usage statistics
    console.log('[MetaAggregator] Step 5: Calculating weighted usage statistics...');
    const weightedCardStats = calculateWeightedUsage(matchedCards, totalDecks);
    console.log(`[MetaAggregator] Calculated stats for ${weightedCardStats.size} unique cards`);

    // Step 6: Create snapshot and store in database
    console.log('[MetaAggregator] Step 6: Storing in database...');
    
    // Calculate data hash for change detection
    const dataHash = calculateDataHash(normalizedDecks);

    // Create meta snapshot
    const { data: snapshot, error: snapshotError } = await supabase
      .from('meta_snapshots')
      .insert({
        source: 'combined',
        snapshot_date: new Date().toISOString(),
        data_hash: dataHash,
        metadata: {
          sources: ['riftbound_tierlist', 'riftmana_champion_decks'],
          deck_count: normalizedDecks.length,
          card_count: weightedCardStats.size,
          champions_processed: successfulChampions,
          champions_failed: failedChampions,
          total_decks_analyzed: totalDecks,
          errors: errors.length > 0 ? errors : undefined,
        },
      })
      .select()
      .single();

    if (snapshotError || !snapshot) {
      throw new Error(`Failed to create snapshot: ${snapshotError?.message}`);
    }

    console.log(`[MetaAggregator] Created snapshot: ${snapshot.id}`);

    // Store popular decks (for display)
    if (normalizedDecks.length > 0) {
      const decksToInsert = normalizedDecks.map(deck => ({
        snapshot_id: snapshot.id,
        deck_name: deck.deck_name,
        deck_code: deck.deck_code,
        champions: deck.champions,
        archetype: deck.archetype,
        tier_rank: deck.tier_rank,
        popularity_score: deck.popularity_score,
        view_count: deck.view_count,
        win_rate: deck.win_rate,
        price_usd: deck.price_usd,
        source_url: deck.source_url,
        author: deck.author,
        last_updated: deck.last_updated,
        metadata: deck.metadata,
      }));

      const { error: decksError } = await supabase
        .from('popular_decks')
        .insert(decksToInsert);

      if (decksError) {
        throw new Error(`Failed to insert decks: ${decksError.message}`);
      }

      console.log(`[MetaAggregator] Inserted ${decksToInsert.length} decks`);
    }

    // Store popular cards with weighted metrics
    const cardsToInsert = Array.from(weightedCardStats.values()).map(card => ({
      snapshot_id: snapshot.id,
      card_id: card.cardId,
      usage_count: card.rawUsageCount,
      usage_percentage: card.rawUsagePercentage,
      avg_copies: card.avgCopies,
      tier_distribution: card.tierDistribution,
      deck_archetypes: {}, // Not tracking archetypes in new system
      weighted_score: card.weightedScore,
      weighted_percentage: card.weightedPercentage,
      metadata: {},
    }));

    const { error: cardsError } = await supabase
      .from('popular_cards')
      .insert(cardsToInsert);

    if (cardsError) {
      throw new Error(`Failed to insert cards: ${cardsError.message}`);
    }

    console.log(`[MetaAggregator] Inserted ${cardsToInsert.length} cards`);

    // Step 7: Clean up old snapshots (keep last 7 days)
    console.log('[MetaAggregator] Step 7: Cleaning up old snapshots...');
    await cleanupOldSnapshots(supabase);

    console.log('[MetaAggregator] ✅ Aggregation complete!');

    return {
      success: true,
      snapshotId: snapshot.id,
      decksCount: normalizedDecks.length,
      cardsCount: weightedCardStats.size,
      errors: errors.length > 0 ? errors : undefined,
    };

  } catch (error) {
    console.error('[MetaAggregator] ❌ Aggregation failed:', error);
    
    return {
      success: false,
      errors: [
        ...errors,
        error instanceof Error ? error.message : 'Unknown error',
      ],
    };
  }
}

/**
 * Calculates a hash of the deck data to detect changes
 */
function calculateDataHash(decks: NormalizedDeck[]): string {
  const dataString = JSON.stringify(
    decks.map(d => ({
      name: d.deck_name,
      champions: d.champions.sort(),
      tier: d.tier_rank,
    }))
  );
  
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

/**
 * Cleans up snapshots older than 7 days
 */
async function cleanupOldSnapshots(supabase: any) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { error } = await supabase
    .from('meta_snapshots')
    .delete()
    .lt('snapshot_date', sevenDaysAgo.toISOString());

  if (error) {
    console.error('[MetaAggregator] Failed to cleanup old snapshots:', error);
  } else {
    console.log('[MetaAggregator] Cleaned up snapshots older than 7 days');
  }
}

/**
 * Gets the latest snapshot info
 */
export async function getLatestSnapshot(
  supabaseUrl: string,
  supabaseKey: string
) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('meta_snapshots')
    .select('*')
    .eq('source', 'combined')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('[MetaAggregator] Failed to get latest snapshot:', error);
    return null;
  }

  return data;
}

/**
 * Checks if meta data is stale (older than configured duration)
 */
export async function isMetaDataStale(
  supabaseUrl: string,
  supabaseKey: string,
  maxAgeHours: number = 24
): Promise<boolean> {
  const snapshot = await getLatestSnapshot(supabaseUrl, supabaseKey);

  if (!snapshot) {
    return true; // No data exists, consider stale
  }

  const snapshotDate = new Date(snapshot.snapshot_date);
  const ageHours = (Date.now() - snapshotDate.getTime()) / (1000 * 60 * 60);

  return ageHours > maxAgeHours;
}

// Made with Bob
