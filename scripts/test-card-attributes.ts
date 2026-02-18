import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkCard() {
  // Get a Showcase card
  const { data: showcaseCard, error: error1 } = await supabase
    .from('cards')
    .select('*')
    .eq('set_code', 'Showcase')
    .limit(1)
    .single();
  
  if (error1) {
    console.log('Error fetching Showcase card:', error1);
  } else {
    console.log('\n=== SHOWCASE CARD ===');
    console.log('Name:', showcaseCard.name);
    console.log('Set Code:', showcaseCard.set_code);
    console.log('Rarity:', showcaseCard.rarity);
    console.log('Metadata:', JSON.stringify(showcaseCard.metadata, null, 2));
  }
  
  // Get a regular card with stats
  const { data: regularCard, error: error2 } = await supabase
    .from('cards')
    .select('*')
    .eq('set_code', 'OGN')
    .limit(1)
    .single();
  
  if (error2) {
    console.log('Error fetching OGN card:', error2);
  } else {
    console.log('\n=== OGN CARD ===');
    console.log('Name:', regularCard.name);
    console.log('Set Code:', regularCard.set_code);
    console.log('Rarity:', regularCard.rarity);
    console.log('Metadata:', JSON.stringify(regularCard.metadata, null, 2));
  }
}

checkCard().catch(console.error);

// Made with Bob
