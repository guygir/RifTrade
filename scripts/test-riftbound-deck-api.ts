// Test if Riftbound has a deck API endpoint
// Run with: npx tsx scripts/test-riftbound-deck-api.ts

const USER_AGENT = 'RiftboundCardSwap/1.0 (Meta Data Aggregator)';

async function testDeckAPI(deckSlug: string) {
  const possibleEndpoints = [
    `https://riftbound.gg/api/deck/${deckSlug}`,
    `https://riftbound.gg/api/decks/${deckSlug}`,
    `https://riftbound.gg/wp-json/riftbound/v1/deck/${deckSlug}`,
    `https://riftbound.gg/wp-json/wp/v2/deck/${deckSlug}`,
    `https://riftbound.gg/deck/${deckSlug}`,
    `https://riftbound.gg/decks/${deckSlug}`,
  ];

  console.log(`Testing deck slug: ${deckSlug}`);
  console.log('='.repeat(60));

  for (const endpoint of possibleEndpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json,text/html,*/*',
        },
      });

      console.log(`${endpoint}`);
      console.log(`  Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log(`  Content-Type: ${contentType}`);
        
        if (contentType?.includes('json')) {
          const data = await response.json();
          console.log(`  ✅ JSON Response!`);
          console.log(`  Keys: ${Object.keys(data).join(', ')}`);
          console.log(`  Sample:`, JSON.stringify(data).substring(0, 200));
        } else {
          const text = await response.text();
          console.log(`  Response length: ${text.length}`);
          console.log(`  Sample:`, text.substring(0, 100));
        }
      }
      
      console.log();
    } catch (error) {
      console.log(`  Error: ${error}`);
      console.log();
    }
  }
}

async function main() {
  console.log('Testing Riftbound Deck API Endpoints');
  console.log('='.repeat(60));
  console.log();

  // Test with the deck slug we found
  await testDeckAPI('draven-wins-bologna');
  
  console.log();
  console.log('='.repeat(60));
  console.log('Testing second deck...');
  console.log('='.repeat(60));
  console.log();
  
  await testDeckAPI('draven-wins-chengdu-regional');
}

main();

// Made with Bob
