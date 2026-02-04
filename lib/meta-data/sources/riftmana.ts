// RiftMana.com deck scraper
// Fetches trending decks from https://riftmana.com/decks/

import * as cheerio from 'cheerio';
import { RawDeck, FetchResult } from '../types';

const RIFTMANA_URL = 'https://riftmana.com/decks/';
const USER_AGENT = 'RiftboundCardSwap/1.0 (Meta Data Aggregator)';
const REQUEST_DELAY = 1500; // 1.5 seconds between requests

/**
 * Fetches trending decks from RiftMana.com
 * Note: RiftMana blocks AI bots but allows general scraping
 */
export async function fetchRiftManaDecks(): Promise<FetchResult<RawDeck[]>> {
  try {
    console.log('[RiftMana] Starting fetch from:', RIFTMANA_URL);

    // Add delay to respect rate limiting
    await delay(REQUEST_DELAY);

    // Fetch the page
    const response = await fetch(RIFTMANA_URL, {
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
    console.log('[RiftMana] HTML fetched, length:', html.length);

    // Parse HTML with Cheerio
    const $ = cheerio.load(html);

    // Extract deck data
    // Note: These selectors are placeholders and need to be updated based on actual HTML structure
    const decks: RawDeck[] = [];

    // Use the correct selector for RiftMana deck cards
    const deckElements = $('.all-deck-box-wrapper');

    if (deckElements.length === 0) {
      console.warn('[RiftMana] No deck elements found. HTML structure may have changed.');
      console.log('[RiftMana] Sample HTML:', html.substring(0, 500));
      
      // Return empty result instead of error to allow other sources to work
      return {
        success: true,
        data: [],
        source: 'riftmana',
      };
    }

    console.log(`[RiftMana] Found ${deckElements.length} decks`);

    // Parse each deck
    deckElements.each((_index: number, element: any) => {
      try {
        const $deck = $(element);

        // Extract deck name from h3
        const name = $deck.find('h3').text().trim();

        // Extract champions from color indicators (aria-label)
        const champions: string[] = [];
        $deck.find('.color-dot').each((_i: number, el: any) => {
          const championName = $(el).attr('aria-label');
          if (championName) {
            champions.push(championName);
          }
        });

        // Extract price from .deck-price-stat
        const priceText = $deck.find('.deck-price-stat').text().trim();
        const priceMatch = priceText.match(/\$?([\d,]+\.?\d*)/);
        const priceUsd = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : undefined;

        // Extract view count from .deck-views
        const viewText = $deck.find('.deck-views').text().trim();
        const viewMatch = viewText.match(/([\d,]+)/);
        const viewCount = viewMatch ? parseInt(viewMatch[1].replace(/,/g, '')) : undefined;

        // Extract archetype/tags from .all-deck-tag
        const archetype = $deck.find('.all-deck-tag').first().text().trim() || undefined;

        // Extract URL from the <a> tag's href
        const sourceUrl = $deck.attr('href');

        // Extract author from .deck-author
        const author = $deck.find('.deck-author').text().trim() || undefined;

        // Extract last updated from .deck-date
        const dateText = $deck.find('.deck-date').text().trim();
        const lastUpdated = dateText ? parseDateString(dateText) : undefined;

        // Only add deck if it has a name
        if (name && name.length > 0) {
          decks.push({
            name,
            champions: champions.length > 0 ? champions : ['Unknown'],
            archetype,
            viewCount,
            priceUsd,
            sourceUrl,
            author,
            lastUpdated,
            metadata: {
              rawPriceText: priceText,
              rawViewText: viewText,
              rawDateText: dateText,
            },
          });
        }
      } catch (error) {
        console.error('[RiftMana] Error parsing deck:', error);
        // Continue with next deck
      }
    });

    console.log(`[RiftMana] Successfully parsed ${decks.length} decks`);

    return {
      success: true,
      data: decks,
      source: 'riftmana',
    };

  } catch (error) {
    console.error('[RiftMana] Fetch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'riftmana',
    };
  }
}

/**
 * Parse date strings like "1 week ago", "6 days ago", etc.
 */
function parseDateString(dateStr: string): Date | undefined {
  const now = new Date();
  
  // Match patterns like "X days ago", "X weeks ago", etc.
  const match = dateStr.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/i);
  
  if (match) {
    const amount = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    switch (unit) {
      case 'second':
        return new Date(now.getTime() - amount * 1000);
      case 'minute':
        return new Date(now.getTime() - amount * 60 * 1000);
      case 'hour':
        return new Date(now.getTime() - amount * 60 * 60 * 1000);
      case 'day':
        return new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - amount * 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - amount * 30 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - amount * 365 * 24 * 60 * 60 * 1000);
    }
  }
  
  // Try parsing as ISO date
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? undefined : parsed;
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
export async function testRiftManaScraper() {
  console.log('Testing RiftMana scraper...');
  const result = await fetchRiftManaDecks();
  
  if (result.success && result.data) {
    console.log(`✅ Success! Found ${result.data.length} decks`);
    console.log('Sample deck:', JSON.stringify(result.data[0], null, 2));
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  return result;
}

// Made with Bob
