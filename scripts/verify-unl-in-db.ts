/**
 * Verify UNL Cards in Database
 * 
 * Checks that UNL cards were successfully seeded into the database
 * 
 * Run with: npx tsx scripts/verify-unl-in-db.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function verifyUNLCards() {
  console.log('🔍 Verifying UNL Cards in Database\n');
  console.log('═'.repeat(80));

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get all sets and their card counts
    console.log('\n📊 Card Count by Set:\n');
    const { data: allCards, error: allError } = await supabase
      .from('cards')
      .select('set_code');

    if (allError) throw allError;

    const setCounts: Record<string, number> = {};
    allCards?.forEach(card => {
      setCounts[card.set_code] = (setCounts[card.set_code] || 0) + 1;
    });

    Object.entries(setCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([setCode, count]) => {
        const indicator = setCode === 'UNL' ? '🆕' : '  ';
        console.log(`   ${indicator} ${setCode.padEnd(6)} ${count.toString().padStart(4)} cards`);
      });

    // Check UNL specifically
    const { data: unlCards, error: unlError } = await supabase
      .from('cards')
      .select('*')
      .eq('set_code', 'UNL');

    if (unlError) throw unlError;

    console.log('\n' + '─'.repeat(80));
    console.log(`\n✅ UNL Cards Found: ${unlCards?.length || 0} cards\n`);

    if (!unlCards || unlCards.length === 0) {
      console.log('❌ No UNL cards found in database!');
      console.log('   The seeding may have failed or UNL cards are not yet available.');
      process.exit(1);
    }

    // Analyze UNL cards
    const rarityDist: Record<string, number> = {};
    const variantDist: Record<string, number> = {};
    let withImages = 0;

    unlCards.forEach(card => {
      const rarity = card.rarity || 'Unknown';
      rarityDist[rarity] = (rarityDist[rarity] || 0) + 1;

      const variant = card.metadata?.variant || 'normal';
      variantDist[variant] = (variantDist[variant] || 0) + 1;

      if (card.image_url) withImages++;
    });

    console.log('📈 UNL Card Statistics:\n');
    
    console.log('   Rarity Distribution:');
    Object.entries(rarityDist)
      .sort(([, a], [, b]) => b - a)
      .forEach(([rarity, count]) => {
        console.log(`     ${rarity.padEnd(15)} ${count} cards`);
      });

    console.log('\n   Variant Distribution:');
    Object.entries(variantDist)
      .sort(([, a], [, b]) => b - a)
      .forEach(([variant, count]) => {
        console.log(`     ${variant.padEnd(15)} ${count} cards`);
      });

    console.log(`\n   Cards with Images:  ${withImages}/${unlCards.length}`);

    // Sample cards
    console.log('\n📋 Sample UNL Cards (first 5):\n');
    unlCards.slice(0, 5).forEach((card, index) => {
      console.log(`   ${index + 1}. ${card.name}`);
      console.log(`      Number: ${card.collector_number} | Rarity: ${card.rarity || 'N/A'}`);
    });

    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ VERIFICATION SUCCESSFUL!');
    console.log(`   ${unlCards.length} UNL cards are in the database and ready to use\n`);
    console.log('Next steps:');
    console.log('   1. Test card browser at /cards');
    console.log('   2. Test Riftle autocomplete');
    console.log('   3. Generate test puzzle with UNL card\n');
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('\n❌ Error verifying UNL cards:', error);
    process.exit(1);
  }
}

verifyUNLCards();

// Made with Bob
