/**
 * Check which cards should be excluded from Riftle daily puzzles
 *
 * Exclusion criteria:
 * 1. Battlefield type cards
 * 2. Foil cards (cards with "(Foil)" in the name)
 * 3. Variant cards (cards with #x* format)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface Card {
  id: string;
  name: string;
  type: string;
  card_number: string;
  rarity: string;
  cost?: number;
  attack?: number;
  health?: number;
}

async function checkExcludedCards() {
  console.log('🔍 Checking cards that should be excluded from Riftle puzzles...\n');

  // 1. Check Battlefield type cards
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1️⃣  BATTLEFIELD TYPE CARDS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const { data: battlefieldCards, error: battlefieldError } = await supabase
    .from('cards')
    .select('id, name, metadata')
    .eq('metadata->classification->>type', 'Battlefield')
    .order('name');

  if (battlefieldError) {
    console.error('Error fetching battlefield cards:', battlefieldError);
  } else {
    console.log(`Found ${battlefieldCards?.length || 0} Battlefield cards:\n`);
    battlefieldCards?.forEach((card: any) => {
      const meta = card.metadata;
      console.log(`  • ${card.name} (${meta.public_code})`);
      console.log(`    Type: ${meta.classification.type}, Rarity: ${meta.classification.rarity}`);
      console.log(`    Stats: Cost=${meta.attributes.energy}, Might=${meta.attributes.might}, Power=${meta.attributes.power}\n`);
    });
  }

  // 2. Check Foil cards
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2️⃣  FOIL CARDS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const { data: foilCards, error: foilError } = await supabase
    .from('cards')
    .select('id, name, metadata')
    .eq('metadata->>variant', 'foil')
    .order('name');

  if (foilError) {
    console.error('Error fetching foil cards:', foilError);
  } else {
    console.log(`Found ${foilCards?.length || 0} Foil cards:\n`);
    foilCards?.forEach((card: any) => {
      const meta = card.metadata;
      console.log(`  • ${card.name} (${meta.public_code})`);
      console.log(`    Type: ${meta.classification.type}, Rarity: ${meta.classification.rarity}, Variant: ${meta.variant}\n`);
    });
  }

  // 3. Check Signature cards (special variants)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3️⃣  SIGNATURE CARDS (Special Variants)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const { data: signatureCards, error: signatureError } = await supabase
    .from('cards')
    .select('id, name, metadata')
    .eq('metadata->metadata->>signature', 'true')
    .order('name');

  if (signatureError) {
    console.error('Error fetching signature cards:', signatureError);
  } else {
    console.log(`Found ${signatureCards?.length || 0} Signature cards:\n`);
    signatureCards?.forEach((card: any) => {
      const meta = card.metadata;
      console.log(`  • ${card.name} (${meta.public_code})`);
      console.log(`    Type: ${meta.classification.type}, Rarity: ${meta.classification.rarity}, Signature: ${meta.metadata.signature}\n`);
    });
  }

  // 4. Get total counts
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Total excluded - need to count manually since we can't use OR with JSONB
  const battlefieldCount = battlefieldCards?.length || 0;
  const foilCount = foilCards?.length || 0;
  const signatureCount = signatureCards?.length || 0;
  
  // Note: Some cards might be in multiple categories (e.g., foil battlefield)
  // So we need to get unique count
  const allExcludedIds = new Set([
    ...(battlefieldCards?.map(c => c.id) || []),
    ...(foilCards?.map(c => c.id) || []),
    ...(signatureCards?.map(c => c.id) || [])
  ]);
  
  console.log(`❌ Total cards to EXCLUDE: ${allExcludedIds.size}`);
  console.log(`   - Battlefield: ${battlefieldCount}`);
  console.log(`   - Foil: ${foilCount}`);
  console.log(`   - Signature: ${signatureCount}`);

  // Total eligible - cards that are NOT in any exclusion category
  const { count: eligibleCount, error: eligibleError } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .neq('metadata->classification->>type', 'Battlefield')
    .neq('metadata->>variant', 'foil')
    .neq('metadata->metadata->>signature', 'true');

  if (!eligibleError) {
    console.log(`✅ Total cards ELIGIBLE for puzzles: ${eligibleCount}`);
  }

  // Total cards
  const { count: totalCount, error: totalError } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true });

  if (!totalError) {
    console.log(`📦 Total cards in database: ${totalCount}\n`);
  }

  // 5. Show sample of eligible cards
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SAMPLE ELIGIBLE CARDS (Random 10)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const { data: sampleCards, error: sampleError } = await supabase
    .from('cards')
    .select('id, name, metadata')
    .neq('metadata->classification->>type', 'Battlefield')
    .neq('metadata->>variant', 'foil')
    .neq('metadata->metadata->>signature', 'true')
    .limit(10);

  if (sampleError) {
    console.error('Error fetching sample cards:', sampleError);
  } else {
    sampleCards?.forEach((card: any) => {
      const meta = card.metadata;
      console.log(`  • ${card.name} (${meta.public_code})`);
      console.log(`    Type: ${meta.classification.type}, Rarity: ${meta.classification.rarity}`);
      console.log(`    Stats: Cost=${meta.attributes.energy}, Might=${meta.attributes.might}, Power=${meta.attributes.power}\n`);
    });
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ EXCLUSION CRITERIA FOR RIFTLE PUZZLES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Cards will be EXCLUDED if they match ANY of:');
  console.log('  1. metadata->classification->type = "Battlefield"');
  console.log('  2. metadata->variant = "foil"');
  console.log('  3. metadata->metadata->signature = true (signature cards)\n');
  console.log('This ensures puzzles use only standard, playable unit/spell cards.\n');
}

checkExcludedCards().catch(console.error);

// Made with Bob
