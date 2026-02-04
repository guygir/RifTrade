// Test full meta data aggregation with database-driven champion lookup
import * as dotenv from 'dotenv';
import * as path from 'path';
import { aggregateMetaData } from '../lib/meta-data/meta-aggregator';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function test() {
  console.log('Testing full meta data aggregation...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    return;
  }
  
  console.log('Starting aggregation...');
  console.log('This will:');
  console.log('1. Fetch all champions from Riftbound tier list');
  console.log('2. Look up each champion\'s Legend card in database');
  console.log('3. Fetch top 3 decks per champion from RiftMana');
  console.log('4. Extract and match all cards');
  console.log('5. Calculate tier-weighted usage metrics');
  console.log('6. Store results in database\n');
  
  const result = await aggregateMetaData(supabaseUrl, supabaseKey);
  
  console.log('\n' + '='.repeat(80));
  console.log('AGGREGATION RESULT:');
  console.log('='.repeat(80));
  console.log(JSON.stringify(result, null, 2));
  
  if (result.success) {
    console.log('\n✅ Aggregation successful!');
    console.log(`   Snapshot ID: ${result.snapshotId}`);
    console.log(`   Decks: ${result.decksCount}`);
    console.log(`   Cards: ${result.cardsCount}`);
  } else {
    console.log('\n❌ Aggregation failed');
    if (result.errors) {
      console.log('Errors:', result.errors);
    }
  }
}

test().catch(console.error);

// Made with Bob