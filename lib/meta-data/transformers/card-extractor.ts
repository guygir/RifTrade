// Card extractor - extracts card usage statistics from deck lists
// Note: This is a placeholder implementation since we don't have actual deck lists yet
// In a real implementation, this would parse deck codes or deck lists to extract cards

import { NormalizedDeck, AggregatedCardUsage, CardUsage } from '../types';
import { createClient } from '@supabase/supabase-js';

/**
 * Extracts card usage statistics from a collection of decks
 * 
 * Note: This is a simplified implementation. In production, you would:
 * 1. Parse deck codes to get actual card lists
 * 2. Match card names to card IDs in the database
 * 3. Calculate accurate usage statistics
 * 
 * For now, this returns placeholder data based on deck metadata
 */
export async function extractCardUsage(
  decks: NormalizedDeck[],
  supabaseUrl: string,
  supabaseKey: string
): Promise<AggregatedCardUsage[]> {
  
  console.log(`[CardExtractor] Analyzing ${decks.length} decks for card usage...`);

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // In a real implementation, we would:
  // 1. Parse each deck's deck_code to get the card list
  // 2. Count how many times each card appears
  // 3. Calculate usage percentages and tier distributions

  // For now, we'll create a placeholder implementation that:
  // - Extracts champion cards from deck data
  // - Estimates usage based on deck popularity

  const cardUsageMap = new Map<string, CardUsage[]>();

  // Process each deck
  for (const deck of decks) {
    // Extract cards from champions (simplified)
    for (const champion of deck.champions) {
      if (champion === 'Unknown') continue;

      // Try to find this champion card in the database
      const { data: cards } = await supabase
        .from('cards')
        .select('id, name')
        .ilike('name', `%${champion}%`)
        .limit(1);

      if (cards && cards.length > 0) {
        const card = cards[0];
        const cardId = card.id;

        if (!cardUsageMap.has(cardId)) {
          cardUsageMap.set(cardId, []);
        }

        cardUsageMap.get(cardId)!.push({
          cardName: card.name,
          cardId: cardId,
          copies: 1, // Simplified - would be actual count from deck list
          deckTier: deck.tier_rank || 'Unknown',
          deckArchetype: deck.archetype || 'Unknown',
        });
      }
    }
  }

  // Aggregate the usage data
  const aggregated: AggregatedCardUsage[] = [];
  const totalDecks = decks.length;

  for (const [cardId, usages] of cardUsageMap.entries()) {
    const usageCount = usages.length;
    const usagePercentage = (usageCount / totalDecks) * 100;

    // Calculate average copies
    const avgCopies = usages.reduce((sum, u) => sum + u.copies, 0) / usageCount;

    // Calculate tier distribution
    const tierDistribution: Record<string, number> = {};
    for (const usage of usages) {
      const tier = usage.deckTier;
      tierDistribution[tier] = (tierDistribution[tier] || 0) + 1;
    }

    // Calculate archetype distribution
    const deckArchetypes: Record<string, number> = {};
    for (const usage of usages) {
      const archetype = usage.deckArchetype;
      deckArchetypes[archetype] = (deckArchetypes[archetype] || 0) + 1;
    }

    aggregated.push({
      card_id: cardId,
      usage_count: usageCount,
      usage_percentage: Math.round(usagePercentage * 100) / 100,
      avg_copies: Math.round(avgCopies * 10) / 10,
      tier_distribution: tierDistribution,
      deck_archetypes: deckArchetypes,
    });
  }

  // Sort by usage percentage (descending)
  aggregated.sort((a, b) => b.usage_percentage - a.usage_percentage);

  console.log(`[CardExtractor] Found ${aggregated.length} unique cards in meta`);

  return aggregated;
}

/**
 * Parses a deck code to extract card information
 * This is a placeholder - actual implementation would depend on deck code format
 */
export function parseDeckCode(deckCode: string): CardUsage[] {
  // TODO: Implement actual deck code parsing
  // Deck codes typically encode:
  // - Card IDs
  // - Quantities
  // - Format version
  
  console.warn('[CardExtractor] Deck code parsing not yet implemented');
  return [];
}

/**
 * Matches a card name to a card ID in the database
 */
export async function matchCardNameToId(
  cardName: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<string | null> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: cards } = await supabase
    .from('cards')
    .select('id')
    .ilike('name', cardName)
    .limit(1);

  return cards && cards.length > 0 ? cards[0].id : null;
}

/**
 * Filters card usage by minimum usage percentage
 */
export function filterByMinUsage(
  cardUsage: AggregatedCardUsage[],
  minPercentage: number
): AggregatedCardUsage[] {
  return cardUsage.filter(card => card.usage_percentage >= minPercentage);
}

/**
 * Filters card usage by tier
 */
export function filterByTier(
  cardUsage: AggregatedCardUsage[],
  tier: string
): AggregatedCardUsage[] {
  return cardUsage.filter(card => {
    return card.tier_distribution[tier] && card.tier_distribution[tier] > 0;
  });
}

/**
 * Gets top N most used cards
 */
export function getTopCards(
  cardUsage: AggregatedCardUsage[],
  limit: number
): AggregatedCardUsage[] {
  return cardUsage.slice(0, limit);
}

/**
 * NOTE: Enhanced Implementation Needed
 * 
 * To make this fully functional, you need to:
 * 
 * 1. Implement deck code parsing:
 *    - Research Riftbound's deck code format
 *    - Parse encoded card IDs and quantities
 *    - Handle different format versions
 * 
 * 2. Scrape actual deck lists:
 *    - If deck codes aren't available, scrape full deck lists from source sites
 *    - Parse card names from HTML
 *    - Match to database cards
 * 
 * 3. Handle card variations:
 *    - Different printings of same card
 *    - Alternate art versions
 *    - Foil vs non-foil
 * 
 * 4. Optimize database queries:
 *    - Batch card lookups
 *    - Cache card name -> ID mappings
 *    - Use database joins instead of multiple queries
 * 
 * 5. Add error handling:
 *    - Handle missing cards
 *    - Handle invalid deck codes
 *    - Log parsing failures
 */

// Made with Bob
