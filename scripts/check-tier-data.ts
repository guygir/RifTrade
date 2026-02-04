import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTierData() {
  console.log('Checking tier distribution in popular_decks...\n');
  
  // Get tier counts
  const { data: tierCounts, error: tierError } = await supabase
    .from('popular_decks')
    .select('tier_rank')
    .order('tier_rank');
  
  if (tierError) {
    console.error('Error fetching tiers:', tierError);
    return;
  }
  
  // Count by tier
  const counts: Record<string, number> = {};
  tierCounts?.forEach(deck => {
    counts[deck.tier_rank] = (counts[deck.tier_rank] || 0) + 1;
  });
  
  console.log('Tier Distribution:');
  Object.entries(counts).sort().forEach(([tier, count]) => {
    console.log(`  Tier ${tier}: ${count} decks`);
  });
  
  // Check for decks with emojis in names
  console.log('\nChecking for decks with emoji indicators...\n');
  const { data: decks, error: decksError } = await supabase
    .from('popular_decks')
    .select('deck_name, tier_rank, metadata')
    .limit(10);
  
  if (decksError) {
    console.error('Error fetching decks:', decksError);
    return;
  }
  
  console.log('Sample deck names:');
  decks?.forEach(deck => {
    const displayName = deck.metadata?.displayName || deck.deck_name;
    console.log(`  [${deck.tier_rank}] ${displayName}`);
  });
}

checkTierData().catch(console.error);

// Made with Bob
