/**
 * Find Missing UNL Cards
 * Compare API cards vs Database cards to find what's missing
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { fetchAllCards } from '../lib/riftcodex';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function findMissingCards() {
  console.log('🔍 Finding Missing UNL Cards\n');
  console.log('═'.repeat(80));

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get UNL cards from API
    console.log('\n📡 Fetching cards from Riftcodex API...');
    const apiCards = await fetchAllCards();
    const unlApiCards = apiCards.filter(card => {
      const setCode = (card as any).set?.set_id || card.set_code || card.set || '';
      return setCode === 'UNL';
    });
    console.log(`✅ Found ${unlApiCards.length} UNL cards in API`);

    // Get UNL cards from database
    console.log('\n💾 Fetching cards from database...');
    const { data: dbCards, error } = await supabase
      .from('cards')
      .select('name, collector_number, set_code')
      .eq('set_code', 'UNL');

    if (error) throw error;
    console.log(`✅ Found ${dbCards?.length || 0} UNL cards in database`);

    // Create sets for comparison
    const dbCardKeys = new Set(
      dbCards?.map(c => `${c.collector_number}`) || []
    );

    const apiCardKeys = new Map(
      unlApiCards.map(card => {
        const collectorNum = (card as any).collector_number || (card as any).number || '';
        return [collectorNum, card.name];
      })
    );

    // Find missing cards
    const missingCards: Array<{num: string, name: string}> = [];
    apiCardKeys.forEach((name, num) => {
      if (!dbCardKeys.has(num) && !dbCardKeys.has(`${num}-foil`)) {
        missingCards.push({ num, name });
      }
    });

    console.log(`\n🔎 Missing cards: ${missingCards.length}`);
    console.log('─'.repeat(80));

    if (missingCards.length > 0) {
      console.log('Sample missing cards:');
      missingCards.slice(0, 10).forEach(({num, name}) => {
        console.log(`  ${String(num).padStart(4)}: ${name}`);
      });

      if (missingCards.length > 10) {
        console.log(`  ...and ${missingCards.length - 10} more`);
      }
    }

    // Check collector number ranges
    const apiNumbers = Array.from(apiCardKeys.keys())
      .map(n => parseInt(n))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);

    const dbNumbers = Array.from(dbCardKeys)
      .map(n => parseInt(n.replace('-foil', '')))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);

    console.log('\n📊 Collector Number Ranges:');
    console.log(`  API:    ${apiNumbers[0]} - ${apiNumbers[apiNumbers.length - 1]}`);
    console.log(`  DB:     ${dbNumbers[0]} - ${dbNumbers[dbNumbers.length - 1]}`);
    console.log(`  Count:  ${apiNumbers.length} (API) vs ${dbNumbers.length} (DB)`);

    // Check if there are gaps in the database
    const missingNumbers: number[] = [];
    for (let i = apiNumbers[0]; i <= apiNumbers[apiNumbers.length - 1]; i++) {
      if (!dbNumbers.includes(i)) {
        missingNumbers.push(i);
      }
    }

    console.log(`\n🔢 Missing collector numbers: ${missingNumbers.length}`);
    if (missingNumbers.length > 0) {
      console.log(`  First 10: ${missingNumbers.slice(0, 10).join(', ')}`);
      if (missingNumbers.length > 10) {
        console.log(`  Last 10: ${missingNumbers.slice(-10).join(', ')}`);
      }
    }

    console.log('\n' + '═'.repeat(80));

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

findMissingCards();

// Made with Bob
