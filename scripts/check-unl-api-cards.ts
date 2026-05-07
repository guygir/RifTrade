/**
 * Check UNL Cards from Riftcodex API
 * Shows the actual API calls and responses
 */

const RIFTCODEX_API_URL = 'https://api.riftcodex.com';

async function checkUNLCards() {
  console.log('🔍 Checking UNL Cards from Riftcodex API\n');
  console.log('═'.repeat(80));
  
  // Method 1: Get all cards and filter by set
  console.log('\n📡 Method 1: GET /cards (paginated)\n');
  console.log('curl command:');
  console.log(`curl -H "Accept: application/json" "${RIFTCODEX_API_URL}/cards?page=1"\n`);
  
  let allCards: any[] = [];
  let page = 1;
  let totalPages = 1;
  
  // Fetch first page
  const firstResponse = await fetch(`${RIFTCODEX_API_URL}/cards?page=${page}`, {
    headers: { 'Accept': 'application/json' },
  });
  
  const firstData = await firstResponse.json();
  console.log('First page response structure:');
  console.log(`  - items: ${firstData.items?.length || 0} cards`);
  console.log(`  - page: ${firstData.page}`);
  console.log(`  - pages: ${firstData.pages}`);
  console.log(`  - total: ${firstData.total}`);
  
  if (firstData.items && Array.isArray(firstData.items)) {
    allCards.push(...firstData.items);
    totalPages = firstData.pages || 1;
    
    console.log(`\n📥 Fetching all ${totalPages} pages...`);
    
    // Fetch remaining pages
    for (page = 2; page <= totalPages; page++) {
      const response = await fetch(`${RIFTCODEX_API_URL}/cards?page=${page}`, {
        headers: { 'Accept': 'application/json' },
      });
      const pageData = await response.json();
      if (pageData.items) {
        allCards.push(...pageData.items);
      }
      process.stdout.write(`\r   Progress: ${page}/${totalPages} pages`);
    }
    console.log('\n');
  }
  
  // Filter UNL cards
  const unlCards = allCards.filter(card => {
    const setCode = card.set?.set_id || card.set_code || card.set || '';
    return setCode === 'UNL';
  });
  
  console.log(`✅ Total cards fetched: ${allCards.length}`);
  console.log(`🆕 UNL cards found: ${unlCards.length}\n`);
  
  if (unlCards.length > 0) {
    console.log('Sample UNL cards:');
    unlCards.slice(0, 5).forEach((card, i) => {
      const collectorNum = card.collector_number || card.number || 'N/A';
      console.log(`  ${i + 1}. ${card.name} (${collectorNum})`);
    });
    
    // Check collector number range
    const collectorNumbers = unlCards
      .map(c => parseInt(c.collector_number || c.number || '0'))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);
    
    if (collectorNumbers.length > 0) {
      console.log(`\nCollector number range: ${collectorNumbers[0]} - ${collectorNumbers[collectorNumbers.length - 1]}`);
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n💡 To manually check:');
  console.log(`   curl -H "Accept: application/json" "${RIFTCODEX_API_URL}/cards?page=1" | jq '.items[] | select(.set.set_id == "UNL") | {name, collector_number}'`);
  console.log('\n   Or visit: https://riftcodex.com/cards?set=UNL');
}

checkUNLCards();

// Made with Bob
