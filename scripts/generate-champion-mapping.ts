// Generate champion name to card ID mapping from database
// Run with: npx tsx scripts/generate-champion-mapping.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateChampionMapping() {
  console.log('Generating Champion Name → Card ID Mapping');
  console.log('='.repeat(60));
  console.log();

  // Query all cards
  const { data: allCards, error } = await supabase
    .from('cards')
    .select('id, name, set_code, collector_number, metadata, rarity')
    .order('name');

  if (error) {
    console.error('Error fetching cards:', error);
    return;
  }

  if (!allCards || allCards.length === 0) {
    console.log('No cards found in database');
    return;
  }

  console.log(`Found ${allCards.length} total cards in database`);
  console.log();

  // Filter for champions
  // Champions are typically Legendary rarity or have type in metadata
  const champions = allCards.filter(card => {
    // Check metadata for card type
    const metadata = card.metadata as any;
    const cardType = metadata?.type || metadata?.card_type || metadata?.cardType;
    
    // Check if it's a champion by type or rarity
    const isChampionByType = cardType?.toLowerCase().includes('champion');
    const isLegendary = card.rarity?.toLowerCase() === 'legendary';
    
    // Also check if name matches known champions from Riftbound
    const knownChampions = [
      'draven', 'kaisa', 'kai\'sa', 'annie', 'irelia', 'fiora', 
      'master yi', 'miss fortune', 'sett', 'teemo', 'ezreal', 
      'azir', 'lucian', 'viktor', 'darius', 'yasuo', 'sivir', 
      'rek\'sai', 'ornn', 'ahri', 'leona', 'jax', 'lux', 
      'lee sin', 'volibear', 'jinx', 'renata glasc', 'rumble', 'garen'
    ];
    const isKnownChampion = knownChampions.some(champ => 
      card.name.toLowerCase().includes(champ)
    );
    
    return isChampionByType || isLegendary || isKnownChampion;
  });

  console.log(`Identified ${champions.length} champions`);
  console.log();

  if (champions.length === 0) {
    console.log('No champions identified. Showing sample cards:');
    console.log('-'.repeat(60));
    allCards.slice(0, 10).forEach(card => {
      const cardId = `${card.set_code}-${card.collector_number}`;
      console.log(`  ${card.name} (${cardId})`);
      console.log(`    Rarity: ${card.rarity || 'unknown'}`);
      console.log(`    Metadata: ${JSON.stringify(card.metadata)}`);
      console.log();
    });
    return;
  }

  // Create mapping object
  const mapping: Record<string, string> = {};
  
  console.log('Champion Mapping:');
  console.log('-'.repeat(60));
  
  champions.forEach(champion => {
    const cardId = `${champion.set_code}-${champion.collector_number}`;
    mapping[champion.name] = cardId;
    console.log(`  "${champion.name}": "${cardId}",`);
  });

  console.log();
  console.log('='.repeat(60));
  console.log('TypeScript Code:');
  console.log('='.repeat(60));
  console.log();
  console.log('export const CHAMPION_NAME_TO_CARD_ID: Record<string, string> = {');
  
  champions.forEach((champion, index) => {
    const cardId = `${champion.set_code}-${champion.collector_number}`;
    const comma = index < champions.length - 1 ? ',' : '';
    console.log(`  "${champion.name}": "${cardId}"${comma}`);
  });
  
  console.log('};');
  console.log();
  
  // Also create a case-insensitive lookup helper
  console.log('// Helper function for case-insensitive lookup');
  console.log('export function getChampionCardId(championName: string): string | undefined {');
  console.log('  const normalized = championName.toLowerCase().trim();');
  console.log('  const entry = Object.entries(CHAMPION_NAME_TO_CARD_ID)');
  console.log('    .find(([name]) => name.toLowerCase() === normalized);');
  console.log('  return entry?.[1];');
  console.log('}');
  console.log();

  console.log('='.repeat(60));
  console.log(`Total champions: ${champions.length}`);
  console.log('Mapping generated successfully!');
}

generateChampionMapping().catch(console.error);

// Made with Bob
