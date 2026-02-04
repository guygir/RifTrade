// Quick verification script for enhanced card extraction results
// Run after data refresh to see what was extracted
// Usage: npx tsx scripts/verify-enhanced-extraction.ts [port]
// Example: npx tsx scripts/verify-enhanced-extraction.ts 3001

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('   Make sure .env.local exists with:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Get port from command line argument, default to 3000
const port = process.argv[2] || '3000';

async function main() {
  const supabase = createClient(supabaseUrl!, supabaseKey!);

  console.log('='.repeat(70));
  console.log('ENHANCED CARD EXTRACTION VERIFICATION');
  console.log('='.repeat(70));
  console.log('');

  // Check latest snapshot
  const { data: snapshot } = await supabase
    .from('meta_snapshots')
    .select('*')
    .eq('source', 'combined')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();

  if (snapshot) {
    console.log('📊 Latest Snapshot:');
    console.log(`   ID: ${snapshot.id}`);
    console.log(`   Date: ${new Date(snapshot.snapshot_date).toLocaleString()}`);
    console.log(`   Metadata:`, JSON.stringify(snapshot.metadata, null, 2));
    console.log('');
  }

  // Check popular cards count
  const { data: cards, count } = await supabase
    .from('popular_cards')
    .select('*, cards(name, rarity)', { count: 'exact' })
    .order('weighted_percentage', { ascending: false });

  console.log('🃏 Popular Cards:');
  console.log(`   Total cards in database: ${count}`);
  console.log('');

  if (cards && cards.length > 0) {
    // Count by type
    const champions = cards.filter((c: any) => 
      c.cards.rarity?.toLowerCase() === 'champion'
    );
    const runes = cards.filter((c: any) => 
      c.cards.name?.toLowerCase().includes('rune') || 
      c.cards.rarity?.toLowerCase().includes('rune')
    );
    const others = cards.filter((c: any) => 
      c.cards.rarity?.toLowerCase() !== 'champion' &&
      !c.cards.name?.toLowerCase().includes('rune') &&
      !c.cards.rarity?.toLowerCase().includes('rune')
    );

    console.log('   Breakdown:');
    console.log(`   - Champions: ${champions.length}`);
    console.log(`   - Runes: ${runes.length} (will be filtered in UI)`);
    console.log(`   - Other cards: ${others.length}`);
    console.log('');

    // Show top 10 by weighted percentage
    console.log('   Top 10 Cards (by weighted %):');
    console.log('   ' + '-'.repeat(66));
    console.log('   Rank | Card Name                    | Raw %  | Weighted % | Rarity');
    console.log('   ' + '-'.repeat(66));
    
    cards.slice(0, 10).forEach((card: any, i: number) => {
      const name = card.cards.name.padEnd(28).substring(0, 28);
      const rawPct = card.usage_percentage?.toFixed(1).padStart(5) || 'N/A';
      const weightedPct = card.weighted_percentage?.toFixed(1).padStart(5) || 'N/A';
      const rarity = card.cards.rarity || 'Unknown';
      console.log(`   ${(i + 1).toString().padStart(4)} | ${name} | ${rawPct}% | ${weightedPct}%     | ${rarity}`);
    });
    console.log('   ' + '-'.repeat(66));
    console.log('');

    // Check if weighted metrics exist
    const hasWeighted = cards.some((c: any) => 
      c.weighted_percentage !== null && c.weighted_percentage !== undefined
    );
    
    if (hasWeighted) {
      console.log('   ✅ Weighted metrics present');
    } else {
      console.log('   ⚠️  Weighted metrics missing - check migration');
    }
    console.log('');

    // Show cards that will be displayed (non-runes)
    const displayCards = cards.filter((c: any) => 
      !c.cards.name?.toLowerCase().includes('rune') &&
      !c.cards.rarity?.toLowerCase().includes('rune')
    );
    
    console.log(`   Cards visible in UI: ${displayCards.length} (runes filtered out)`);
    console.log('');
  }

  // Check popular decks
  const { data: decks, count: deckCount } = await supabase
    .from('popular_decks')
    .select('*', { count: 'exact' })
    .order('popularity_score', { ascending: false });

  console.log('🎴 Popular Decks:');
  console.log(`   Total decks: ${deckCount}`);
  
  if (decks && decks.length > 0) {
    const byTier: Record<string, number> = {};
    decks.forEach((d: any) => {
      const tier = d.tier_rank || 'Unknown';
      byTier[tier] = (byTier[tier] || 0) + 1;
    });
    
    console.log('   By tier:', byTier);
  }
  console.log('');

  console.log('='.repeat(70));
  console.log('VERIFICATION COMPLETE');
  console.log('='.repeat(70));
  console.log('');
  
  if (cards && cards.length > 7) {
    console.log('✅ SUCCESS! Enhanced extraction working:');
    console.log(`   - Got ${cards.length} total cards (vs 7 before)`);
    console.log(`   - ${cards.filter((c: any) => !c.cards.name?.toLowerCase().includes('rune')).length} non-rune cards will display`);
    console.log(`   - Weighted metrics ${cards.some((c: any) => c.weighted_percentage) ? 'present' : 'missing'}`);
  } else {
    console.log('⚠️  WARNING: Only got', cards?.length || 0, 'cards');
    console.log('   Expected 30-40+ cards. Check:');
    console.log('   1. Did the scraper run successfully?');
    console.log('   2. Check terminal logs for errors');
    console.log('   3. Verify Riftbound.gg is accessible');
  }
  console.log('');
  console.log(`Next: Visit http://localhost:${port}/cards to see the UI`);
}

main().catch(console.error);

// Made with Bob