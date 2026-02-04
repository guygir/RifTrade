// Riftbound.gg tier list scraper
// Fetches tier rankings from https://riftbound.gg/tier-list/

import * as cheerio from 'cheerio';
import { RawDeck, FetchResult, TierRank } from '../types';

const RIFTBOUND_TIERLIST_URL = 'https://riftbound.gg/tier-list/';
const USER_AGENT = 'RiftboundCardSwap/1.0 (Meta Data Aggregator)';
const REQUEST_DELAY = 1500; // 1.5 seconds between requests

/**
 * Fetches tier list from Riftbound.gg
 * Returns decks organized by tier (S, 1, 2, 3)
 */
export async function fetchRiftboundTiers(): Promise<FetchResult<RawDeck[]>> {
  try {
    console.log('[Riftbound] Starting fetch from:', RIFTBOUND_TIERLIST_URL);

    // Add delay to respect rate limiting
    await delay(REQUEST_DELAY);

    // Fetch the page
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
    console.log('[Riftbound] HTML fetched, length:', html.length);

    // Parse HTML with Cheerio
    const $ = cheerio.load(html);

    const decks: RawDeck[] = [];

    // Extract last updated date from page
    const lastUpdatedText = $('.last-updated, .updated, [data-updated]').first().text().trim();
    const pageLastUpdated = lastUpdatedText ? new Date(lastUpdatedText) : new Date();

    // Find the LATEST meta accordion (highest ID number)
    // Look for accordion items and get the one with the highest ID
    let latestAccordionId = 0;
    $('[data-wp-context]').each((_i: number, elem: any) => {
      const context = $(elem).attr('data-wp-context');
      if (context && context.includes('accordion-item')) {
        const match = context.match(/accordion-item-(\d+)/);
        if (match) {
          const id = parseInt(match[1]);
          if (id > latestAccordionId) {
            latestAccordionId = id;
          }
        }
      }
    });

    console.log(`[Riftbound] Latest meta accordion ID: ${latestAccordionId}`);

    // Find the panel for the latest accordion
    const latestPanel = $(`#accordion-item-${latestAccordionId}-panel`);
    
    if (latestPanel.length === 0) {
      console.warn(`[Riftbound] Could not find panel for accordion-item-${latestAccordionId}`);
      // Fallback to searching all content if accordion not found
    }

    // Parse tier sections - Riftbound uses WordPress blocks with specific structure
    const tierMappings = [
      { tier: 'S', bgColor: '#ff7f7e', label: 'S Tier' },
      { tier: '1', bgColor: '#ffbe80', label: 'Tier 1' },
      { tier: '2', bgColor: '#ffdf80', label: 'Tier 2' },
      { tier: '3', bgColor: '#fffe80', label: 'Tier 3' },
      { tier: '4', bgColor: '#bfff7f', label: 'Tier 4' },
    ];

    // Search within the latest panel (or entire page if panel not found)
    const searchContext = latestPanel.length > 0 ? latestPanel : $('body');

    for (const { tier, label } of tierMappings) {
      // Find the tier section by looking for the tier label within the latest meta
      const tierSections = searchContext.find('.wp-block-columns').filter((_i: number, el: any) => {
        const text = $(el).text();
        return text.includes(label);
      });

      if (tierSections.length === 0) {
        console.log(`[Riftbound] No section found for ${label} in latest meta`);
        continue;
      }

      console.log(`[Riftbound] Found ${label} section`);

      // Find all champion figures within this tier section
      tierSections.each((_i: number, section: any) => {
        const $section = $(section);
        
        // Find all figure elements with champion links
        $section.find('figure.wp-block-image').each((_j: number, figure: any) => {
          try {
            const $figure = $(figure);
            
            // Extract champion name from figcaption - preserve emojis (🔼 🔽)
            const figcaption = $figure.find('figcaption');
            const championNameRaw = figcaption.text().trim();
            
            // The figcaption may contain: "Champion Name 🔼" or just "Champion Name"
            // We want to keep the emoji but extract the clean name for lookup
            const championName = championNameRaw;
            
            // Extract URL
            const sourceUrl = $figure.find('a').first().attr('href');
            
            // Extract image URL (optional, for metadata)
            const imageUrl = $figure.find('img').attr('src');

            if (championName && championName.length > 0) {
              decks.push({
                name: championName,
                champions: [championName.replace(/[🔼🔽]/g, '').trim()], // Clean name for champion lookup
                tier: tier as TierRank,
                sourceUrl,
                lastUpdated: pageLastUpdated,
                metadata: {
                  source: 'riftbound_tierlist',
                  tierSection: tier,
                  imageUrl,
                  displayName: championName, // Keep emoji for display
                },
              });
            }
          } catch (error) {
            console.error(`[Riftbound] Error parsing champion in ${label}:`, error);
          }
        });
      });
    }

    if (decks.length === 0) {
      console.warn('[Riftbound] No decks found. HTML structure may have changed.');
      console.log('[Riftbound] Sample HTML:', html.substring(0, 500));
    }

    console.log(`[Riftbound] Successfully parsed ${decks.length} decks`);

    return {
      success: true,
      data: decks,
      source: 'riftbound_tierlist',
    };

  } catch (error) {
    console.error('[Riftbound] Fetch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'riftbound_tierlist',
    };
  }
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
export async function testRiftboundScraper() {
  console.log('Testing Riftbound tier list scraper...');
  const result = await fetchRiftboundTiers();
  
  if (result.success && result.data) {
    console.log(`✅ Success! Found ${result.data.length} decks`);
    
    // Group by tier
    const byTier: Record<string, number> = {};
    result.data.forEach(deck => {
      const tier = deck.tier || 'Unknown';
      byTier[tier] = (byTier[tier] || 0) + 1;
    });
    
    console.log('Decks by tier:', byTier);
    console.log('Sample deck:', JSON.stringify(result.data[0], null, 2));
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  return result;
}

// Made with Bob
