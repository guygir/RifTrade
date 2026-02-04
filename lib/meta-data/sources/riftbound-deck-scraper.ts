// Enhanced Riftbound.gg deck scraper
// Visits each champion's legend page and extracts actual deck card lists
// Supports all tiers: S, A, B, C, D

import * as cheerio from 'cheerio';
import { CardUsage, FetchResult, TierRank } from '../types';

const RIFTBOUND_TIERLIST_URL = 'https://riftbound.gg/tier-list/';
const USER_AGENT = 'RiftboundCardSwap/1.0 (Meta Data Aggregator)';
const REQUEST_DELAY = 1500; // 1.5 seconds between requests

interface ChampionDeckData {
  championName: string;
  tier: TierRank;
  legendUrl: string;
  cards: CardUsage[];
}

/**
 * Fetches all champion decks from Riftbound.gg with full card lists
 * Returns card usage data from actual deck lists
 */
export async function fetchRiftboundDecks(): Promise<FetchResult<ChampionDeckData[]>> {
  try {
    console.log('[Riftbound Decks] Starting enhanced fetch from:', RIFTBOUND_TIERLIST_URL);

    // Step 1: Get all champions from tier list
    const champions = await fetchChampionsFromTierList();
    if (champions.length === 0) {
      throw new Error('No champions found in tier list');
    }

    console.log(`[Riftbound Decks] Found ${champions.length} champions across all tiers`);

    // Step 2: Visit each champion's legend page and extract deck cards
    const deckData: ChampionDeckData[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const champion of champions) {
      try {
        await delay(REQUEST_DELAY); // Rate limiting
        
        const cards = await fetchDeckCardsFromLegendPage(champion.legendUrl, champion.tier);
        
        if (cards.length > 0) {
          deckData.push({
            championName: champion.name,
            tier: champion.tier,
            legendUrl: champion.legendUrl,
            cards,
          });
          successCount++;
          console.log(`[Riftbound Decks] ✓ ${champion.name} (${champion.tier}): ${cards.length} cards`);
        } else {
          failCount++;
          console.warn(`[Riftbound Decks] ✗ ${champion.name} (${champion.tier}): No cards found`);
        }
      } catch (error) {
        failCount++;
        console.error(`[Riftbound Decks] Error fetching ${champion.name}:`, error);
      }
    }

    console.log(`[Riftbound Decks] Complete: ${successCount} success, ${failCount} failed`);

    return {
      success: true,
      data: deckData,
      source: 'riftbound_decks',
    };

  } catch (error) {
    console.error('[Riftbound Decks] Fetch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'riftbound_decks',
    };
  }
}

/**
 * Fetches all champions from the tier list page
 */
async function fetchChampionsFromTierList(): Promise<Array<{ name: string; tier: TierRank; legendUrl: string }>> {
  const response = await fetch(RIFTBOUND_TIERLIST_URL, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const champions: Array<{ name: string; tier: TierRank; legendUrl: string }> = [];

  // Parse all tier sections (S, 1, 2, 3, 4)
  // Note: We'll map 1->A, 2->B, 3->C, 4->D for consistency
  const tierMappings = [
    { tier: 'S', label: 'S Tier' },
    { tier: '1', label: 'Tier 1' },
    { tier: '2', label: 'Tier 2' },
    { tier: '3', label: 'Tier 3' },
    { tier: '4', label: 'Tier 4' },
  ];

  for (const { tier, label } of tierMappings) {
    // Find the tier section
    const tierSections = $('.wp-block-columns').filter((_i: number, el: any) => {
      const text = $(el).text();
      return text.includes(label);
    });

    if (tierSections.length === 0) {
      console.log(`[Riftbound Decks] No section found for ${label}`);
      continue;
    }

    // Find all champion figures within this tier section
    tierSections.each((_i: number, section: any) => {
      const $section = $(section);
      
      $section.find('figure.wp-block-image').each((_j: number, figure: any) => {
        try {
          const $figure = $(figure);
          
          // Extract champion name from figcaption link
          const championName = $figure.find('figcaption a').first().text().trim();
          
          // Extract legend page URL
          const legendUrl = $figure.find('figcaption a').first().attr('href');
          
          if (championName && legendUrl) {
            champions.push({
              name: championName,
              tier: tier as TierRank,
              legendUrl,
            });
          }
        } catch (error) {
          console.error(`[Riftbound Decks] Error parsing champion in ${label}:`, error);
        }
      });
    });
  }

  return champions;
}

/**
 * Fetches deck cards from a champion's legend page
 * Looks for the first RootOfEmbeddedDeck element and extracts card hrefs
 */
async function fetchDeckCardsFromLegendPage(legendUrl: string, tier: TierRank): Promise<CardUsage[]> {
  const response = await fetch(legendUrl, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const cards: CardUsage[] = [];

  // Find the first RootOfEmbeddedDeck element
  const deckElement = $('.RootOfEmbeddedDeck').first();
  
  if (deckElement.length === 0) {
    console.warn(`[Riftbound Decks] No RootOfEmbeddedDeck found at ${legendUrl}`);
    return cards;
  }

  // Extract all card links within the deck
  // Format: href="https://riftbound.gg/cards/ogn-036-vi-destructive"
  deckElement.find('a[href*="/cards/"]').each((_i: number, link: any) => {
    try {
      const href = $(link).attr('href');
      if (!href) return;

      // Parse the card ID from the URL
      // Example: https://riftbound.gg/cards/ogn-036-vi-destructive
      // We need: ogn-036
      const match = href.match(/\/cards\/([a-z0-9]+-\d+)/i);
      if (!match) return;

      const cardId = match[1]; // e.g., "ogn-036"
      
      // Extract card name from link text (optional, for debugging)
      const cardName = $(link).text().trim();

      // Check if this card already exists in our list (for counting copies)
      const existingCard = cards.find(c => c.cardId === cardId);
      if (existingCard) {
        existingCard.copies++;
      } else {
        cards.push({
          cardName: cardName || cardId,
          cardId,
          copies: 1,
          deckTier: tier,
          deckArchetype: 'Unknown', // We don't have archetype info from legend pages
        });
      }
    } catch (error) {
      console.error('[Riftbound Decks] Error parsing card link:', error);
    }
  });

  return cards;
}

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test function to verify scraper works
 */
export async function testRiftboundDeckScraper() {
  console.log('Testing Riftbound deck scraper...');
  const result = await fetchRiftboundDecks();
  
  if (result.success && result.data) {
    console.log(`✅ Success! Found ${result.data.length} champion decks`);
    
    // Count total unique cards
    const allCards = new Set<string>();
    let totalCardInstances = 0;
    
    result.data.forEach(deck => {
      deck.cards.forEach(card => {
        if (card.cardId) {
          allCards.add(card.cardId);
          totalCardInstances += card.copies;
        }
      });
    });
    
    console.log(`Total unique cards: ${allCards.size}`);
    console.log(`Total card instances: ${totalCardInstances}`);
    
    // Group by tier
    const byTier: Record<string, number> = {};
    result.data.forEach(deck => {
      byTier[deck.tier] = (byTier[deck.tier] || 0) + 1;
    });
    
    console.log('Decks by tier:', byTier);
    
    // Show sample deck
    if (result.data.length > 0) {
      const sample = result.data[0];
      console.log('\nSample deck:');
      console.log(`Champion: ${sample.championName} (${sample.tier})`);
      console.log(`Cards: ${sample.cards.length}`);
      console.log('First 5 cards:', sample.cards.slice(0, 5));
    }
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  return result;
}

// Made with Bob