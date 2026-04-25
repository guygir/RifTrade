/**
 * Check which sets are available in the Riftcodex API
 * This script fetches all sets and displays their information
 */

const RIFTCODEX_API_URL = 'https://api.riftcodex.com';

interface RiftcodexSet {
  id: string;
  name: string;
  code: string;
  set_id?: string;
  release_date?: string;
  card_count?: number;
  [key: string]: any;
}

async function fetchAvailableSets(): Promise<void> {
  console.log('🔍 Fetching available sets from Riftcodex API...\n');
  
  try {
    const response = await fetch(`${RIFTCODEX_API_URL}/sets`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle different response formats
    let sets: RiftcodexSet[] = [];
    if (Array.isArray(data)) {
      sets = data;
    } else if (data.items && Array.isArray(data.items)) {
      sets = data.items;
    } else if (data.sets && Array.isArray(data.sets)) {
      sets = data.sets;
    } else if (data.data && Array.isArray(data.data)) {
      sets = data.data;
    } else {
      console.error('Unexpected response format:', JSON.stringify(data, null, 2));
      throw new Error('Unexpected API response structure');
    }

    if (sets.length === 0) {
      console.log('⚠️  No sets found in API response');
      return;
    }

    console.log(`✅ Found ${sets.length} sets:\n`);
    console.log('═'.repeat(80));
    
    // Sort sets by code for better readability
    sets.sort((a, b) => {
      const codeA = a.code || a.set_id || '';
      const codeB = b.code || b.set_id || '';
      return codeA.localeCompare(codeB);
    });

    sets.forEach((set, index) => {
      const setCode = set.code || set.set_id || 'N/A';
      const setName = set.name || 'Unknown';
      const setId = set.id || 'N/A';
      const releaseDate = set.release_date || 'N/A';
      const cardCount = set.card_count || 'N/A';
      
      console.log(`${index + 1}. ${setCode} - ${setName}`);
      console.log(`   ID: ${setId}`);
      console.log(`   Release Date: ${releaseDate}`);
      console.log(`   Card Count: ${cardCount}`);
      console.log('─'.repeat(80));
    });

    console.log('\n📊 Summary:');
    console.log(`   Total Sets: ${sets.length}`);
    console.log(`   Set Codes: ${sets.map(s => s.code || s.set_id).filter(Boolean).join(', ')}`);
    
    // Check for specific sets we know about
    const knownSets = ['OGN', 'SFD', 'FRO'];
    console.log('\n🔎 Known Sets Status:');
    knownSets.forEach(code => {
      const found = sets.find(s => (s.code || s.set_id) === code);
      console.log(`   ${code}: ${found ? '✅ Available' : '❌ Not found'}`);
    });

  } catch (error) {
    console.error('❌ Error fetching sets:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
}

// Run the script
fetchAvailableSets();

// Made with Bob
