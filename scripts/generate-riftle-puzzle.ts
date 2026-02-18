/**
 * Generate Riftle Puzzle Script
 * 
 * Generates a daily puzzle for a specific date or today
 * 
 * Usage:
 *   npx tsx scripts/generate-riftle-puzzle.ts
 *   npx tsx scripts/generate-riftle-puzzle.ts 2026-02-17
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { selectRandomCard } from '../lib/riftle/puzzle';

// Create admin client
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials in .env.local');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

async function generatePuzzle(targetDate?: string) {
  console.log('🎮 Riftle Puzzle Generator\n');
  
  // Calculate target date
  let puzzleDate: Date;
  if (targetDate) {
    puzzleDate = new Date(targetDate);
    console.log(`📅 Generating puzzle for: ${targetDate}`);
  } else {
    puzzleDate = new Date();
    console.log(`📅 Generating puzzle for today: ${puzzleDate.toISOString().split('T')[0]}`);
  }
  
  const puzzleDateStr = puzzleDate.toISOString().split('T')[0];
  
  const adminClient = createAdminClient();
  
  try {
    // Select random card
    console.log('🎲 Selecting random card...');
    const cardId = await selectRandomCard(adminClient, 30);
    
    if (!cardId) {
      console.error('❌ Failed to select random card');
      process.exit(1);
    }
    
    // Get card details
    const { data: card, error: cardError } = await adminClient
      .from('cards')
      .select('id, name, set_code, collector_number, rarity')
      .eq('id', cardId)
      .single();
    
    if (cardError || !card) {
      console.error('❌ Failed to fetch card details:', cardError);
      process.exit(1);
    }
    
    console.log(`✅ Selected card: ${card.name} (${card.set_code} #${card.collector_number})`);
    
    // Check if puzzle already exists for this date
    const { data: existing } = await adminClient
      .from('daily_cards')
      .select('id')
      .eq('puzzle_date', puzzleDateStr)
      .single();
    
    if (existing) {
      console.log(`⚠️  Puzzle already exists for ${puzzleDateStr}, deleting...`);
      const { error: deleteError } = await adminClient
        .from('daily_cards')
        .delete()
        .eq('puzzle_date', puzzleDateStr);
      
      if (deleteError) {
        console.error('❌ Failed to delete existing puzzle:', deleteError);
        process.exit(1);
      }
    }
    
    // Insert new puzzle
    console.log('💾 Creating puzzle...');
    const { data: newPuzzle, error: insertError } = await adminClient
      .from('daily_cards')
      .insert({
        puzzle_date: puzzleDateStr,
        card_id: cardId,
      })
      .select('id, puzzle_date, card_id')
      .single();
    
    if (insertError) {
      console.error('❌ Failed to create puzzle:', insertError);
      process.exit(1);
    }
    
    console.log('\n✅ Puzzle created successfully!');
    console.log(`   Puzzle ID: ${newPuzzle.id}`);
    console.log(`   Date: ${newPuzzle.puzzle_date}`);
    console.log(`   Card: ${card.name}`);
    console.log(`   Set: ${card.set_code} #${card.collector_number}`);
    console.log(`   Rarity: ${card.rarity}`);
    
  } catch (error) {
    console.error('❌ Error generating puzzle:', error);
    process.exit(1);
  }
}

// Get date from command line argument
const targetDate = process.argv[2];

generatePuzzle(targetDate).then(() => {
  console.log('\n🎉 Done!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

// Made with Bob
