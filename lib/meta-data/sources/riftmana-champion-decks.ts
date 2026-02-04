// RiftMana champion-specific deck scraper
// Fetches top 3 trending decks for each champion

import * as cheerio from 'cheerio';
import { CardUsage, FetchResult, TierRank } from '../types';

const USER_AGENT = 'RiftboundCardSwap/1.0 (Meta Data Aggregator)';
const REQUEST_DELAY = 1500; // 1.5 seconds between requests

interface ChampionDeck {
  championName: string;
  championCardId: string;
  tier: TierRank;
  deckName: string;
  deckUrl: string;
  cards: CardUsage[];
}

/**
 * Fetch top 3 trending decks for a specific champion
 */
export async function fetchChampionDecks(
  championName: string,
  championCardId: string,
  tier: TierRank
): Promise<FetchResult<ChampionDeck[]>> {
  try {
    const url = `https://riftmana.com/decks/?legend=${championCardId}&filter_type=trending`;
    console.log(`[RiftMana] Fetching decks for ${championName} (${championCardId}, ${tier} tier)`);

    await delay(REQUEST_DELAY);

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Find deck elements
    const deckElements = $('.all-deck-box-wrapper');
    
    if (deckElements.length === 0) {
      console.warn(`[RiftMana] No decks found for ${championName}`);
      return {
        success: true,
        data: [],
        source: 'riftmana_champion',
      };
    }

    // Get top 3 decks
    const deckPromises: Promise<ChampionDeck | null>[] = [];
    
    deckElements.slice(0, 3).each((_i, element) => {
      const $deck = $(element);
      const deckName = $deck.find('h3').text().trim();
      const deckUrl = $deck.attr('href');

      if (deckUrl) {
        deckPromises.push(
          fetchDeckCards(championName, championCardId, tier, deckName, deckUrl)
        );
      }
    });

    const decks = (await Promise.all(deckPromises)).filter((d): d is ChampionDeck => d !== null);

    console.log(`[RiftMana] Fetched ${decks.length} decks for ${championName}`);

    return {
      success: true,
      data: decks,
      source: 'riftmana_champion',
    };

  } catch (error) {
    console.error(`[RiftMana] Error fetching ${championName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'riftmana_champion',
    };
  }
}

/**
 * Fetch cards from a specific deck page
 */
async function fetchDeckCards(
  championName: string,
  championCardId: string,
  tier: TierRank,
  deckName: string,
  deckUrl: string
): Promise<ChampionDeck | null> {
  try {
    await delay(REQUEST_DELAY);

    const fullUrl = deckUrl.startsWith('http') ? deckUrl : `https://riftmana.com${deckUrl}`;
    
    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      console.warn(`[RiftMana] Failed to fetch deck ${deckName}: ${response.status}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract card list from textarea
    const deckCodeElement = $('textarea').first();
    const deckCodeText = deckCodeElement.val() as string || '';

    if (!deckCodeText) {
      console.warn(`[RiftMana] No deck code found for ${deckName}`);
      return null;
    }

    // Parse card list
    // Format: "1xOGN-251" or "3xOGN-036"
    const cardLines = deckCodeText.split('\n').filter(line => line.trim());
    const cards: CardUsage[] = [];

    for (const line of cardLines) {
      const match = line.match(/(\d+)x([A-Z]+)-(\d+)/i);
      if (match) {
        const quantity = parseInt(match[1]);
        const setCode = match[2].toLowerCase();
        const collectorNumber = match[3].padStart(3, '0');
        const cardId = `${setCode}-${collectorNumber}`;

        cards.push({
          cardName: '', // Will be filled by database lookup
          cardId,
          copies: quantity,
          deckTier: tier,
          championName,
          deckArchetype: 'Unknown',
        });
      }
    }

    console.log(`[RiftMana]   ${deckName}: ${cards.length} cards`);

    return {
      championName,
      championCardId,
      tier,
      deckName,
      deckUrl: fullUrl,
      cards,
    };

  } catch (error) {
    console.error(`[RiftMana] Error fetching deck ${deckName}:`, error);
    return null;
  }
}

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Made with Bob
