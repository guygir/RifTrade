// Champion Legend Card Lookup
// Maps champion names from tier list to their Legend cards in our database
// Then constructs RiftMana deck URLs using set_code and collector_number

import { createSupabaseServerClient } from '@/lib/supabase/client';

export interface ChampionLegendCard {
  championName: string;
  cardName: string;
  setCode: string;
  collectorNumber: string;
  riftManaUrl: string;
  riftboundId: string;
}

/**
 * Look up a champion's Legend card from our database
 * Returns the card details needed to construct RiftMana URLs
 */
export async function lookupChampionLegend(championName: string): Promise<ChampionLegendCard | null> {
  try {
    const supabase = createSupabaseServerClient();
    
    // Query for Legend cards that have this champion in their tags
    // The metadata.tags array contains champion names
    // Exclude overnumbered and alternate art cards
    const { data: cards, error } = await supabase
      .from('cards')
      .select('*')
      .filter('metadata->tags', 'cs', `["${championName}"]`)
      .eq('metadata->classification->>type', 'Legend')
      .eq('metadata->metadata->>overnumbered', 'false')
      .order('collector_number')
      .limit(1);
    
    if (error) {
      console.error(`[ChampionLookup] Error looking up ${championName}:`, error);
      return null;
    }
    
    if (!cards || cards.length === 0) {
      console.warn(`[ChampionLookup] No Legend card found for ${championName}`);
      return null;
    }
    
    const card = cards[0];
    const setCode = card.set_code.toLowerCase();
    const collectorNumber = card.collector_number;
    
    // Construct RiftMana URL: https://www.riftmana.com/cards/{set}-{number}
    const riftManaUrl = `https://www.riftmana.com/cards/${setCode}-${collectorNumber}`;
    
    console.log(`[ChampionLookup] ✅ ${championName} -> ${card.name} (${setCode.toUpperCase()}-${collectorNumber})`);
    
    return {
      championName,
      cardName: card.name,
      setCode: card.set_code,
      collectorNumber: card.collector_number,
      riftManaUrl,
      riftboundId: card.riftbound_id,
    };
    
  } catch (error) {
    console.error(`[ChampionLookup] Exception looking up ${championName}:`, error);
    return null;
  }
}

/**
 * Look up multiple champions at once
 * Returns a map of champion name -> Legend card details
 */
export async function lookupMultipleChampions(championNames: string[]): Promise<Map<string, ChampionLegendCard>> {
  const results = new Map<string, ChampionLegendCard>();
  
  console.log(`[ChampionLookup] Looking up ${championNames.length} champions...`);
  
  for (const championName of championNames) {
    const legendCard = await lookupChampionLegend(championName);
    if (legendCard) {
      results.set(championName, legendCard);
    }
  }
  
  console.log(`[ChampionLookup] Successfully mapped ${results.size}/${championNames.length} champions`);
  
  return results;
}

/**
 * Test function to verify lookup works
 */
export async function testChampionLookup() {
  console.log('Testing champion Legend card lookup...\n');
  
  const testChampions = ['Kai\'Sa', 'Ahri', 'Yasuo'];
  
  for (const champion of testChampions) {
    const result = await lookupChampionLegend(champion);
    if (result) {
      console.log(`✅ ${champion}:`);
      console.log(`   Card: ${result.cardName}`);
      console.log(`   Code: ${result.setCode}-${result.collectorNumber}`);
      console.log(`   URL: ${result.riftManaUrl}\n`);
    } else {
      console.log(`❌ ${champion}: Not found\n`);
    }
  }
}

// Made with Bob