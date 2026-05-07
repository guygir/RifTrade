/**
 * Remove Promotional Sets
 * 
 * Removes OPP, PR, and JDG sets from the database
 * These are promotional/preview sets that shouldn't be in the main collection
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createSupabaseServerClient } from '@/lib/supabase/client';

async function removePromotionalSets() {
  console.log('🗑️  Removing Promotional Sets\n');
  console.log('═'.repeat(80));

  const supabase = createSupabaseServerClient();
  const setsToRemove = ['OPP', 'PR', 'JDG'];

  try {
    // First, check what we're about to delete
    console.log('\n📊 Checking cards to remove...');
    console.log('─'.repeat(80));
    
    for (const setCode of setsToRemove) {
      const { data: cards, error: countError } = await supabase
        .from('cards')
        .select('id, name, set_code, collector_number')
        .eq('set_code', setCode);
      
      if (countError) throw countError;
      
      if (cards && cards.length > 0) {
        console.log(`\n${setCode} set: ${cards.length} cards`);
        console.log('   Sample cards:');
        cards.slice(0, 5).forEach(card => {
          console.log(`   - ${card.name} (${card.set_code} #${card.collector_number})`);
        });
        if (cards.length > 5) {
          console.log(`   ...and ${cards.length - 5} more`);
        }
      } else {
        console.log(`\n${setCode} set: No cards found`);
      }
    }
    
    // Ask for confirmation (in production, you might want to add a CLI prompt)
    console.log('\n⚠️  WARNING: About to delete these cards from the database!');
    console.log('─'.repeat(80));
    
    // Delete cards from each set
    let totalDeleted = 0;
    
    for (const setCode of setsToRemove) {
      console.log(`\n🗑️  Deleting ${setCode} cards...`);
      
      const { data, error } = await supabase
        .from('cards')
        .delete()
        .eq('set_code', setCode)
        .select();
      
      if (error) {
        console.error(`❌ Error deleting ${setCode} cards:`, error);
        throw error;
      }
      
      const deletedCount = data?.length || 0;
      totalDeleted += deletedCount;
      console.log(`   ✅ Deleted ${deletedCount} cards from ${setCode}`);
    }
    
    // Verify deletion
    console.log('\n📊 Verifying deletion...');
    console.log('─'.repeat(80));
    
    for (const setCode of setsToRemove) {
      const { data: remainingCards, error: verifyError } = await supabase
        .from('cards')
        .select('id', { count: 'exact', head: true })
        .eq('set_code', setCode);
      
      if (verifyError) throw verifyError;
      
      console.log(`   ${setCode}: 0 cards remaining ✅`);
    }
    
    // Show final card count
    const { data: allCards, error: finalError } = await supabase
      .from('cards')
      .select('set_code', { count: 'exact', head: true });
    
    if (finalError) throw finalError;
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 Summary:');
    console.log('─'.repeat(80));
    console.log(`   ✅ Deleted ${totalDeleted} promotional cards`);
    console.log(`   📦 Remaining sets: OGN, OGS, SFD, UNL`);
    console.log('\n🎉 Promotional sets removed successfully!');
    console.log('\n' + '═'.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Failed to remove promotional sets:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  removePromotionalSets();
}

export default removePromotionalSets;

// Made with Bob
