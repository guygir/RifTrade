/**
 * Debug UNL Seeding Issues
 * 
 * Investigates why UNL cards are failing to seed with duplicate key errors
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createSupabaseServerClient } from '@/lib/supabase/client';
import { fetchAllCards, transformCard } from '@/lib/riftcodex';

async function debugUnlSeeding() {
  console.log('🔍 Debugging UNL Seeding Issues\n');
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

    // Check for duplicate collector numbers in transformed cards
    console.log('\n🔍 Checking for duplicate collector numbers in transformed cards...');
    const collectorNumberMap = new Map<string, number>();
    transformedCards.forEach(card => {
      const key = `${card.set_code}|${card.collector_number}`;
      collectorNumberMap.set(key, (collectorNumberMap.get(key) || 0) + 1);
    });
    
    const duplicates = Array.from(collectorNumberMap.entries())
      .filter(([_, count]) => count > 1);
    
    if (duplicates.length > 0) {
      console.log(`❌ Found ${duplicates.length} duplicate collector numbers in transformed cards:`);
      duplicates.slice(0, 10).forEach(([key, count]) => {
        const [setCode, collectorNum] = key.split('|');
        const cards = transformedCards.filter(c => 
          c.set_code === setCode && c.collector_number === collectorNum
        );
        console.log(`   ${key}: ${count} occurrences`);
        cards.forEach(c => console.log(`      - ${c.name}`));
      });
      if (duplicates.length > 10) {
        console.log(`   ...and ${duplicates.length - 10} more`);
      }
    } else {
      console.log('✅ No duplicate collector numbers in transformed cards');
    }

    // Check what's in the database
    console.log('\n💾 Checking existing cards in database...');
    const { data: existingCards, error: fetchError } = await supabase
      .from('cards')
      .select('id, name, set_code, collector_number')
      .eq('set_code', 'UNL');
    
    if (fetchError) throw fetchError;
    
    console.log(`   Found ${existingCards?.length || 0} UNL cards in database`);
    
    if (existingCards && existingCards.length > 0) {
      console.log('\n   Sample existing cards:');
      existingCards.slice(0, 10).forEach(card => {
        console.log(`      ${card.collector_number}: ${card.name}`);
      });
    }

    // Check for conflicts between transformed and existing
    console.log('\n🔍 Checking for conflicts between API and database...');
    const existingMap = new Map<string, string>();
    (existingCards || []).forEach(card => {
      const key = `${card.set_code}|${card.collector_number}`;
      existingMap.set(key, card.name);
    });
    
    const toInsert = transformedCards.filter(card => {
      const key = `${card.set_code}|${card.collector_number}`;
      return !existingMap.has(key);
    });
    
    const toUpdate = transformedCards.filter(card => {
      const key = `${card.set_code}|${card.collector_number}`;
      return existingMap.has(key);
    });
    
    console.log(`   📝 ${toInsert.length} new cards to insert`);
    console.log(`   🔄 ${toUpdate.length} existing cards to update`);
    
    if (toInsert.length > 0) {
      console.log('\n   Sample cards to insert:');
      toInsert.slice(0, 10).forEach(card => {
        console.log(`      ${card.collector_number}: ${card.name}`);
      });
    }

    // Check collector number ranges
    console.log('\n📊 Collector Number Analysis:');
    const apiCollectorNumbers = transformedCards.map(c => c.collector_number).sort();
    const dbCollectorNumbers = (existingCards || []).map(c => c.collector_number).sort();
    
    console.log(`   API collector numbers: ${apiCollectorNumbers[0]} to ${apiCollectorNumbers[apiCollectorNumbers.length - 1]}`);
    console.log(`   DB collector numbers: ${dbCollectorNumbers[0] || 'none'} to ${dbCollectorNumbers[dbCollectorNumbers.length - 1] || 'none'}`);
    
    // Check for any non-UNL cards that might conflict
    console.log('\n🔍 Checking for potential conflicts with other sets...');
    const { data: allDbCards, error: allFetchError } = await supabase
      .from('cards')
      .select('set_code, collector_number, name')
      .neq('set_code', 'UNL');
    
    if (allFetchError) throw allFetchError;
    
    const otherSetsMap = new Map<string, { set_code: string; name: string }>();
    (allDbCards || []).forEach(card => {
      const key = `${card.set_code}|${card.collector_number}`;
      otherSetsMap.set(key, { set_code: card.set_code, name: card.name });
    });
    
    const conflicts = toInsert.filter(card => {
      const key = `${card.set_code}|${card.collector_number}`;
      return otherSetsMap.has(key);
    });
    
    if (conflicts.length > 0) {
      console.log(`❌ Found ${conflicts.length} conflicts with other sets!`);
      conflicts.slice(0, 10).forEach(card => {
        const key = `${card.set_code}|${card.collector_number}`;
        const existing = otherSetsMap.get(key);
        console.log(`   ${key}: ${card.name} conflicts with ${existing?.set_code} - ${existing?.name}`);
      });
    } else {
      console.log('✅ No conflicts with other sets');
    }

    console.log('\n' + '═'.repeat(80));
  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  debugUnlSeeding();
}

export default debugUnlSeeding;

// Made with Bob
