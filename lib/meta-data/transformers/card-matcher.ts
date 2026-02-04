// Card matcher - matches Riftbound card IDs to database cards
// Converts "ogn-036" format to set_code + collector_number lookups

import { createSupabaseServerClient } from '@/lib/supabase/client';
import { CardUsage } from '../types';
import type { SupabaseClient } from '@supabase/supabase-js';

interface DatabaseCard {
  id: string;
  name: string;
  set_code: string;
  collector_number: string;
  rarity: string | null;
}

interface MatchedCard extends CardUsage {
  databaseCardId: string;
  databaseCardName: string;
  rarity: string | null;
}

/**
 * Matches Riftbound card IDs to database cards
 * Input: "ogn-036" -> Output: database card UUID
 */
export async function matchCardsToDatabase(
  cardUsages: CardUsage[],
  supabaseClient?: SupabaseClient
): Promise<MatchedCard[]> {
  const supabase = supabaseClient || createSupabaseServerClient();
  const matchedCards: MatchedCard[] = [];
  const unmatchedCards: string[] = [];

  // Extract unique card IDs to minimize database queries
  const uniqueCardIds = new Set(
    cardUsages
      .map(c => c.cardId)
      .filter((id): id is string => id !== undefined)
  );

  console.log(`[Card Matcher] Matching ${uniqueCardIds.size} unique cards...`);

  // Parse all card IDs into set_code and collector_number
  const parsedCards = Array.from(uniqueCardIds).map(cardId => {
    const parsed = parseRiftboundCardId(cardId);
    return { cardId, ...parsed };
  });

  // Fetch all matching cards from database in one query
  const setCollectorPairs = parsedCards
    .filter(p => p.setCode && p.collectorNumber)
    .map(p => ({ set_code: p.setCode!, collector_number: p.collectorNumber! }));

  if (setCollectorPairs.length === 0) {
    console.warn('[Card Matcher] No valid card IDs to match');
    return matchedCards;
  }

  // Build a query to fetch all cards at once
  // We'll use an OR condition for each set_code + collector_number pair
  let query = supabase
    .from('cards')
    .select('id, name, set_code, collector_number, rarity');

  // Build the filter: (set_code = 'ogn' AND collector_number = '036') OR (set_code = 'ogn' AND collector_number = '037') ...
  const orConditions = setCollectorPairs.map(
    pair => `set_code.eq.${pair.set_code},collector_number.eq.${pair.collector_number}`
  );

  // Supabase doesn't support complex OR queries easily, so we'll fetch all cards
  // from the relevant sets and filter in memory
  // Convert to uppercase since database stores set codes in uppercase
  const relevantSets = [...new Set(setCollectorPairs.map(p => p.set_code.toUpperCase()))];
  
  const { data: dbCards, error } = await query.in('set_code', relevantSets);

  if (error) {
    console.error('[Card Matcher] Database error:', error);
    return matchedCards;
  }

  if (!dbCards || dbCards.length === 0) {
    console.warn('[Card Matcher] No cards found in database');
    return matchedCards;
  }

  // Create a lookup map: "ogn-036" -> database card
  // Database stores set_code in uppercase, but we need lowercase keys for matching
  const cardLookup = new Map<string, DatabaseCard>();
  dbCards.forEach(card => {
    const key = `${card.set_code.toLowerCase()}-${card.collector_number}`;
    cardLookup.set(key, card);
  });

  console.log(`[Card Matcher] Found ${cardLookup.size} cards in database`);

  // Match each card usage to a database card
  for (const usage of cardUsages) {
    if (!usage.cardId) {
      unmatchedCards.push('(no card ID)');
      continue;
    }

    const dbCard = cardLookup.get(usage.cardId.toLowerCase());
    
    if (dbCard) {
      matchedCards.push({
        ...usage,
        databaseCardId: dbCard.id,
        databaseCardName: dbCard.name,
        rarity: dbCard.rarity,
      });
    } else {
      unmatchedCards.push(usage.cardId);
    }
  }

  console.log(`[Card Matcher] Matched: ${matchedCards.length}, Unmatched: ${unmatchedCards.length}`);
  
  if (unmatchedCards.length > 0 && unmatchedCards.length <= 10) {
    console.log('[Card Matcher] Unmatched cards:', unmatchedCards);
  } else if (unmatchedCards.length > 10) {
    console.log('[Card Matcher] Unmatched cards (first 10):', unmatchedCards.slice(0, 10));
  }

  return matchedCards;
}

/**
 * Parses a Riftbound card ID into set_code and collector_number
 * Example: "ogn-036" -> { setCode: "ogn", collectorNumber: "036" }
 */
export function parseRiftboundCardId(cardId: string): {
  setCode: string | null;
  collectorNumber: string | null;
} {
  // Expected format: "ogn-036" or "OGN-036"
  const match = cardId.match(/^([a-z0-9]+)-(\d+)/i);
  
  if (!match) {
    console.warn(`[Card Matcher] Invalid card ID format: ${cardId}`);
    return { setCode: null, collectorNumber: null };
  }

  return {
    setCode: match[1].toLowerCase(),
    collectorNumber: match[2], // Keep leading zeros
  };
}

/**
 * Calculates weighted usage statistics for matched cards
 * Tier weights: S=32, A=16, B=8, C=4, D=2
 */
export function calculateWeightedUsage(
  matchedCards: MatchedCard[],
  totalDecks: number
): Map<string, {
  cardId: string;
  cardName: string;
  rarity: string | null;
  rawUsageCount: number;
  rawUsagePercentage: number;
  weightedScore: number;
  weightedPercentage: number;
  tierDistribution: Record<string, number>;
  avgCopies: number;
}> {
  const tierWeights: Record<string, number> = {
    'S': 32,
    '1': 16, // A tier
    '2': 8,  // B tier
    '3': 4,  // C tier
    '4': 2,  // D tier
  };

  // Calculate max possible weighted score (if a card appeared in all S-tier decks)
  const maxWeightedScore = totalDecks * tierWeights['S'];

  // Group cards by database card ID
  const cardStats = new Map<string, {
    cardId: string;
    cardName: string;
    rarity: string | null;
    deckCount: number;
    totalCopies: number;
    weightedScore: number;
    tierCounts: Record<string, number>;
    championsByTier: Record<string, Set<string>>; // Track unique champions per tier
  }>();

  for (const card of matchedCards) {
    const existing = cardStats.get(card.databaseCardId);
    const weight = tierWeights[card.deckTier] || 1;
    const championName = card.championName || 'Unknown';

    if (existing) {
      existing.deckCount++;
      existing.totalCopies += card.copies;
      existing.weightedScore += weight * card.copies;
      
      // Track unique champions per tier
      if (!existing.championsByTier[card.deckTier]) {
        existing.championsByTier[card.deckTier] = new Set();
      }
      existing.championsByTier[card.deckTier].add(championName);
      
      // Update tier counts to reflect unique champions
      existing.tierCounts[card.deckTier] = existing.championsByTier[card.deckTier].size;
    } else {
      const championsByTier: Record<string, Set<string>> = {
        [card.deckTier]: new Set([championName])
      };
      
      cardStats.set(card.databaseCardId, {
        cardId: card.databaseCardId,
        cardName: card.databaseCardName,
        rarity: card.rarity,
        deckCount: 1,
        totalCopies: card.copies,
        weightedScore: weight * card.copies,
        tierCounts: { [card.deckTier]: 1 },
        championsByTier,
      });
    }
  }

  // Convert to final format with percentages
  const result = new Map<string, {
    cardId: string;
    cardName: string;
    rarity: string | null;
    rawUsageCount: number;
    rawUsagePercentage: number;
    weightedScore: number;
    weightedPercentage: number;
    tierDistribution: Record<string, number>;
    avgCopies: number;
  }>();

  for (const [cardId, stats] of cardStats) {
    result.set(cardId, {
      cardId: stats.cardId,
      cardName: stats.cardName,
      rarity: stats.rarity,
      rawUsageCount: stats.deckCount,
      rawUsagePercentage: (stats.deckCount / totalDecks) * 100,
      weightedScore: stats.weightedScore,
      weightedPercentage: (stats.weightedScore / maxWeightedScore) * 100,
      tierDistribution: stats.tierCounts,
      avgCopies: stats.totalCopies / stats.deckCount,
    });
  }

  return result;
}

/**
 * Test function
 */
export async function testCardMatcher() {
  console.log('Testing card matcher...');
  
  // Test parsing
  const testIds = ['ogn-036', 'OGN-001', 'set-123', 'invalid'];
  console.log('\nParsing tests:');
  testIds.forEach(id => {
    const parsed = parseRiftboundCardId(id);
    console.log(`  ${id} -> set: ${parsed.setCode}, num: ${parsed.collectorNumber}`);
  });

  // Test matching (requires database)
  const testUsages: CardUsage[] = [
    { cardName: 'Vi', cardId: 'ogn-036', copies: 3, deckTier: 'S', deckArchetype: 'Aggro' },
    { cardName: 'Jinx', cardId: 'ogn-001', copies: 2, deckTier: '1', deckArchetype: 'Control' },
  ];

  console.log('\nMatching test:');
  const matched = await matchCardsToDatabase(testUsages);
  console.log(`Matched ${matched.length} cards`);
  if (matched.length > 0) {
    console.log('Sample:', matched[0]);
  }

  // Test weighted calculation
  console.log('\nWeighted calculation test:');
  const weighted = calculateWeightedUsage(matched, 10);
  console.log(`Calculated stats for ${weighted.size} unique cards`);
  if (weighted.size > 0) {
    const first = Array.from(weighted.values())[0];
    console.log('Sample:', first);
  }
}

// Made with Bob