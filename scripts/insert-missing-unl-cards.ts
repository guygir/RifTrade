/**
 * Insert Missing UNL Cards
 * 
 * Inserts the 317 missing UNL cards into the database
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createSupabaseServerClient } from '@/lib/supabase/client';
import { fetchAllCards, transformCard } from '@/lib/riftcodex';

async function insertMissingUnlCards() {
  console.log('🌱 Inserting Missing UNL Cards\n');
  console.log('═'.repeat(80));

  const supabase = createSupabaseServerClient();

  try {
    // Fetch all cards from API
    console.log('\n📡 Fetching cards from Riftcodex API...');
    const allCards = await fetchAllCards();
    const unlCards = allCards.filter(card => (card as any).set?.set_id === 'UNL');
    console.log(`✅ Found ${unlCards.length} UNL cards in API`);

    // Transform UNL cards
    console.log('\n💾 Transforming UNL cards...');
    const transformedCards: ReturnType<typeof transformCard>[] = [];
    
    unlCards.forEach(card => {
      const rarity = (card as any).classification?.rarity || card.rarity || '';
      const cardType = (card as any).classification?.type || (card as any).type || '';
      const isRune = cardType === 'Rune' || card.name?.includes('Rune');
      
      if (rarity === 'Showcase') {
        const alternateCard = transformCard(card, 'normal');
        transformedCards.push(alternateCard);
      } else if ((rarity === 'Common' || rarity === 'Uncommon') && !isRune) {
        const baseCard = transformCard(card, 'normal');
        transformedCards.push(baseCard);
        const foilCard = transformCard(card, 'foil');
        transformedCards.push(foilCard);
      } else {
        const baseCard = transformCard(card, 'normal');
        transformedCards.push(baseCard);
      }
    });
    
    console.log(`   Transformed into ${transformedCards.length} total cards (including variants)`);

    // Get existing UNL cards
    console.log('\n🔍 Checking for existing cards...');
    const { data: existingCards, error: fetchError } = await supabase
      .from('cards')
      .select('id, set_code, collector_number')
      .eq('set_code', 'UNL');
    
    if (fetchError) throw fetchError;
    
    console.log(`   Found ${existingCards?.length || 0} existing UNL cards in database`);

    // Create a map of existing cards
    const existingMap = new Map<string, string>();
    (existingCards || []).forEach(card => {
      const key = `${card.set_code}|${card.collector_number}`;
      existingMap.set(key, card.id);
    });
    
    // Filter to only new cards
    const toInsert = transformedCards.filter(card => {
      const key = `${card.set_code}|${card.collector_number}`;
      return !existingMap.has(key);
    });
    
    console.log(`\n📝 ${toInsert.length} new cards to insert`);
    
    if (toInsert.length === 0) {
      console.log('✅ All UNL cards are already in the database!');
      return;
    }

    // Insert in smaller batches to avoid issues
    console.log('\n💾 Inserting new cards...');
    let inserted = 0;
    let errors = 0;
    const batchSize = 50; // Smaller batches for better error handling
    
    for (let i = 0; i < toInsert.length; i += batchSize) {
      const batch = toInsert.slice(i, i + batchSize);
      const { error } = await supabase
        .from('cards')
        .insert(batch);
      
      if (error) {
        console.error(`\n❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        console.error('   First card in failed batch:', batch[0].name, batch[0].collector_number);
        errors += batch.length;
      } else {
        inserted += batch.length;
        process.stdout.write(`\r   Progress: ${Math.min(i + batchSize, toInsert.length)}/${toInsert.length} inserted`);
      }
    }
    
    console.log('\n\n📊 Insertion Summary:');
    console.log(`   ✅ Inserted: ${inserted} new cards`);
    console.log(`   ❌ Errors: ${errors}`);
    
    if (inserted > 0) {
      // Verify final count
      const { data: finalCards, error: finalError } = await supabase
        .from('cards')
        .select('id', { count: 'exact', head: true })
        .eq('set_code', 'UNL');
      
      if (!finalError && finalCards !== null) {
        console.log(`\n✅ Total UNL cards in database: ${(existingCards?.length || 0) + inserted}`);
      }
    }
    
    console.log('\n' + '═'.repeat(80));
    
    if (errors > 0) {
      console.log('\n⚠️  Some cards failed to insert. Check the error messages above.');
      process.exit(1);
    } else {
      console.log('\n🎉 All missing UNL cards inserted successfully!');
    }
  } catch (error) {
    console.error('❌ Insertion failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  insertMissingUnlCards();
}

export default insertMissingUnlCards;

// Made with Bob
