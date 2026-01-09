/**
 * Card Seeding Script
 * 
 * Fetches cards from Riftcodex API and populates the database.
 * 
 * Run with: npm run seed
 * Or: npx tsx scripts/seed-cards.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createSupabaseServerClient } from '@/lib/supabase/client';
import { fetchAllCards, transformCard } from '@/lib/riftcodex';

async function seedCards() {
  console.log('🌱 Starting card seeding process...');

  const supabase = createSupabaseServerClient();

  try {
    // Fetch cards from Riftcodex
    console.log('📡 Fetching cards from Riftcodex API...');
    const riftcodexCards = await fetchAllCards();
    console.log(`✅ Fetched ${riftcodexCards.length} cards from Riftcodex`);

    if (riftcodexCards.length === 0) {
      console.warn('⚠️  No cards fetched. Check Riftcodex API connection.');
      return;
    }

    // Transform all cards and create variations
    console.log('💾 Processing cards and creating variations...');
    const transformedCards: ReturnType<typeof transformCard>[] = [];
    
    riftcodexCards.forEach(card => {
      const rarity = (card as any).classification?.rarity || card.rarity || '';
      const cardType = (card as any).classification?.type || (card as any).type || '';
      const isRune = cardType === 'Rune' || card.name?.includes('Rune');
      const publicCode = (card as any).public_code || null;
      const collectorNumber = (card as any).collector_number || card.number || '';
      
      // Skip cards with * in collector_number (overnumbered variants we don't want)
      if (publicCode && publicCode.includes('*')) {
        return; // Skip this card
      }
      if (String(collectorNumber).includes('*')) {
        return; // Skip this card
      }
      
      // For Showcase cards, just add one card with (Alternate art) or (Overnumbered) name
      if (rarity === 'Showcase') {
        const alternateCard = transformCard(card, 'normal'); // transformCard handles Showcase renaming automatically
        transformedCards.push(alternateCard);
      } else if ((rarity === 'Common' || rarity === 'Uncommon') && !isRune) {
        // For Common/Uncommon (except Rune cards), add both normal and foil variants
        const baseCard = transformCard(card, 'normal');
        transformedCards.push(baseCard);
        const foilCard = transformCard(card, 'foil');
        transformedCards.push(foilCard);
      } else {
        // For other rarities (Rare, Epic, etc.) or Rune cards, just add the base card
        const baseCard = transformCard(card, 'normal');
        transformedCards.push(baseCard);
      }
    });
    
    console.log(`   Processed ${riftcodexCards.length} base cards into ${transformedCards.length} total cards (including variants)`);
    
    // Sort cards by sort_key (extracted from riftbound_id)
    transformedCards.sort((a, b) => {
      if (!a.sort_key && !b.sort_key) return 0;
      if (!a.sort_key) return 1;
      if (!b.sort_key) return -1;
      // Natural sort for alphanumeric sort keys (e.g., "001", "066a", "307")
      return a.sort_key.localeCompare(b.sort_key, undefined, { numeric: true, sensitivity: 'base' });
    });
    
    // Get all existing cards in one query
    console.log('🔍 Checking for existing cards...');
    const { data: existingCards, error: fetchError } = await supabase
      .from('cards')
      .select('id, set_code, collector_number, sort_key, public_code, riftbound_id');
    
    if (fetchError) throw fetchError;
    
    // Create a map of existing cards by set_code + collector_number
    const existingMap = new Map<string, string>();
    (existingCards || []).forEach(card => {
      const key = `${card.set_code}|${card.collector_number}`;
      existingMap.set(key, card.id);
    });
    
    // Separate cards into inserts and updates
    const toInsert: typeof transformedCards = [];
    const toUpdate: Array<{ id: string; data: typeof transformedCards[0] }> = [];
    
    transformedCards.forEach(cardData => {
      const key = `${cardData.set_code}|${cardData.collector_number}`;
      const existingId = existingMap.get(key);
      
      if (existingId) {
        toUpdate.push({ id: existingId, data: cardData });
      } else {
        toInsert.push(cardData);
      }
    });
    
    console.log(`   📝 ${toInsert.length} new cards to insert`);
    console.log(`   🔄 ${toUpdate.length} existing cards to update`);
    
    // Batch insert new cards (Supabase allows up to 1000 per batch)
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    
    if (toInsert.length > 0) {
      console.log('💾 Inserting new cards...');
      const batchSize = 100;
      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize);
        const { error } = await supabase
          .from('cards')
          .insert(batch);
        
        if (error) {
          console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
          errors += batch.length;
        } else {
          inserted += batch.length;
          process.stdout.write(`\r   Progress: ${Math.min(i + batchSize, toInsert.length)}/${toInsert.length} inserted`);
        }
      }
      console.log(''); // New line after progress
    }
    
    // Batch update existing cards
    if (toUpdate.length > 0) {
      console.log('🔄 Updating existing cards...');
      const batchSize = 100;
      for (let i = 0; i < toUpdate.length; i += batchSize) {
        const batch = toUpdate.slice(i, i + batchSize);
        
        // Supabase doesn't support batch updates, so we do them individually but with Promise.all
        const updatePromises = batch.map(({ id, data }) =>
          supabase
            .from('cards')
            .update({
              name: data.name,
              image_url: data.image_url,
              rarity: data.rarity,
              metadata: data.metadata,
              sort_key: data.sort_key,
              public_code: data.public_code,
              riftbound_id: data.riftbound_id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
        );
        
        const results = await Promise.all(updatePromises);
        const batchErrors = results.filter(r => r.error).length;
        
        if (batchErrors > 0) {
          errors += batchErrors;
        } else {
          updated += batch.length;
        }
        
        process.stdout.write(`\r   Progress: ${Math.min(i + batchSize, toUpdate.length)}/${toUpdate.length} updated`);
      }
      console.log(''); // New line after progress
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`   ✅ Inserted: ${inserted} new cards`);
    console.log(`   🔄 Updated: ${updated} existing cards`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('\n🎉 Seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedCards();
}

export default seedCards;

