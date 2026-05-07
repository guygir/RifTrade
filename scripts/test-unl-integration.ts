/**
 * Test UNL Integration End-to-End
 * 
 * Verifies that UNL cards are properly integrated into:
 * 1. Database (all 403 cards present)
 * 2. Card browser (searchable)
 * 3. Riftle autocomplete (available for guessing)
 * 4. Daily puzzle selection (eligible for puzzles)
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createSupabaseServerClient } from '@/lib/supabase/client';
import { selectRandomCard } from '@/lib/riftle/puzzle';

async function testUnlIntegration() {
  console.log('🧪 Testing UNL Integration End-to-End\n');
  console.log('═'.repeat(80));

  const supabase = createSupabaseServerClient();
  let allTestsPassed = true;

  try {
    // Test 1: Database - Verify all 403 UNL cards are present
    console.log('\n📊 Test 1: Database Verification');
    console.log('─'.repeat(80));
    
    const { data: unlCards, error: unlError } = await supabase
      .from('cards')
      .select('id, name, set_code, collector_number, rarity, metadata')
      .eq('set_code', 'UNL');
    
    if (unlError) throw unlError;
    
    const expectedCount = 403; // 280 base + 123 foil variants
    const actualCount = unlCards?.length || 0;
    
    if (actualCount === expectedCount) {
      console.log(`✅ Database has ${actualCount} UNL cards (expected ${expectedCount})`);
    } else {
      console.log(`❌ Database has ${actualCount} UNL cards (expected ${expectedCount})`);
      allTestsPassed = false;
    }
    
    // Test 2: Card Browser - Verify cards are searchable
    console.log('\n🔍 Test 2: Card Browser Search');
    console.log('─'.repeat(80));
    
    // Test searching for a specific UNL card
    const testCardName = 'Jhin';
    const { data: searchResults, error: searchError } = await supabase
      .from('cards')
      .select('id, name, set_code')
      .eq('set_code', 'UNL')
      .ilike('name', `%${testCardName}%`);
    
    if (searchError) throw searchError;
    
    if (searchResults && searchResults.length > 0) {
      console.log(`✅ Search for "${testCardName}" found ${searchResults.length} UNL cards:`);
      searchResults.slice(0, 3).forEach(card => {
        console.log(`   - ${card.name} (${card.set_code})`);
      });
    } else {
      console.log(`❌ Search for "${testCardName}" found no UNL cards`);
      allTestsPassed = false;
    }
    
    // Test 3: Riftle Autocomplete - Verify cards are available for guessing
    console.log('\n🎮 Test 3: Riftle Autocomplete (Guessing)');
    console.log('─'.repeat(80));
    
    const { data: guessableCards, error: guessError } = await supabase
      .from('cards')
      .select('id, name, set_code, metadata')
      .eq('set_code', 'UNL')
      .neq('metadata->classification->>type', 'Battlefield')
      .neq('metadata->>variant', 'foil')
      .neq('metadata->metadata->>signature', 'true');
    
    if (guessError) throw guessError;
    
    if (guessableCards && guessableCards.length > 0) {
      console.log(`✅ Found ${guessableCards.length} UNL cards eligible for guessing`);
      console.log('   Sample guessable cards:');
      guessableCards.slice(0, 5).forEach(card => {
        console.log(`   - ${card.name} (${card.set_code})`);
      });
    } else {
      console.log('❌ No UNL cards found eligible for guessing');
      allTestsPassed = false;
    }
    
    // Test 4: Daily Puzzle Selection - Verify UNL cards can be selected
    console.log('\n🎲 Test 4: Daily Puzzle Selection');
    console.log('─'.repeat(80));
    
    // Try selecting a random card (which should include UNL cards)
    const randomCardId = await selectRandomCard(supabase, 0); // excludeDays=0 to include all
    
    if (randomCardId) {
      const { data: selectedCard, error: cardError } = await supabase
        .from('cards')
        .select('id, name, set_code, collector_number')
        .eq('id', randomCardId)
        .single();
      
      if (cardError) throw cardError;
      
      console.log(`✅ Random card selection works`);
      console.log(`   Selected: ${selectedCard.name} (${selectedCard.set_code} #${selectedCard.collector_number})`);
      
      // Check if any UNL cards are in the eligible pool
      const { data: eligibleUnlCards, error: eligibleError } = await supabase
        .from('cards')
        .select('id')
        .eq('set_code', 'UNL')
        .neq('metadata->classification->>type', 'Battlefield')
        .neq('metadata->>variant', 'foil')
        .neq('metadata->metadata->>signature', 'true');
      
      if (eligibleError) throw eligibleError;
      
      if (eligibleUnlCards && eligibleUnlCards.length > 0) {
        console.log(`✅ ${eligibleUnlCards.length} UNL cards are eligible for daily puzzles`);
      } else {
        console.log('❌ No UNL cards are eligible for daily puzzles');
        allTestsPassed = false;
      }
    } else {
      console.log('❌ Failed to select random card');
      allTestsPassed = false;
    }
    
    // Test 5: Verify card metadata structure
    console.log('\n📋 Test 5: Card Metadata Structure');
    console.log('─'.repeat(80));
    
    const { data: sampleCard, error: sampleError } = await supabase
      .from('cards')
      .select('*')
      .eq('set_code', 'UNL')
      .limit(1)
      .single();
    
    if (sampleError) throw sampleError;
    
    const hasImageUrl = !!sampleCard.image_url;
    const hasRarity = !!sampleCard.rarity;
    const hasMetadata = !!sampleCard.metadata;
    const hasCollectorNumber = !!sampleCard.collector_number;
    
    console.log(`   Image URL: ${hasImageUrl ? '✅' : '❌'}`);
    console.log(`   Rarity: ${hasRarity ? '✅' : '❌'}`);
    console.log(`   Metadata: ${hasMetadata ? '✅' : '❌'}`);
    console.log(`   Collector Number: ${hasCollectorNumber ? '✅' : '❌'}`);
    
    if (!hasImageUrl || !hasRarity || !hasMetadata || !hasCollectorNumber) {
      allTestsPassed = false;
    }
    
    // Summary
    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 Test Summary:');
    console.log('─'.repeat(80));
    
    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED!');
      console.log('\n🎉 UNL cards are fully integrated and ready to use!');
      console.log('\nNext steps:');
      console.log('   1. Visit /cards to browse UNL cards');
      console.log('   2. Play Riftle and try guessing UNL cards');
      console.log('   3. Wait for a UNL card to appear as a daily puzzle');
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('\nPlease review the failed tests above and fix any issues.');
      process.exit(1);
    }
    
    console.log('\n' + '═'.repeat(80));
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testUnlIntegration();
}

export default testUnlIntegration;

// Made with Bob
