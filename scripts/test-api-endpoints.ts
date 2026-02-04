// Test script for meta API endpoints
// Run with: npx tsx scripts/test-api-endpoints.ts [port]
// Example: npx tsx scripts/test-api-endpoints.ts 3001

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cronSecret = process.env.CRON_SECRET;

// Get port from command line argument or environment variable or default to 3000
const port = process.argv[2] || process.env.PORT || '3000';
const BASE_URL = process.env.BASE_URL || `http://localhost:${port}`;

// Validate required environment variables
if (!supabaseUrl || !supabaseKey || !cronSecret) {
  console.error('❌ Missing required environment variables!');
  console.error('Please ensure .env.local contains:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('  - CRON_SECRET');
  process.exit(1);
}

async function testRefreshEndpoint() {
  console.log('\n=== Testing POST /api/meta/refresh ===');
  
  try {
    const response = await fetch(`${BASE_URL}/api/meta/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log('✅ Refresh endpoint working');
      return true;
    } else {
      console.log('❌ Refresh endpoint failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing refresh endpoint:', error);
    return false;
  }
}

async function testRefreshStatus() {
  console.log('\n=== Testing GET /api/meta/refresh (status) ===');
  
  try {
    const response = await fetch(`${BASE_URL}/api/meta/refresh`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
      },
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log('✅ Status endpoint working');
      return true;
    } else {
      console.log('❌ Status endpoint failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing status endpoint:', error);
    return false;
  }
}

async function testDecksEndpoint() {
  console.log('\n=== Testing GET /api/meta/decks ===');
  
  try {
    // Test basic fetch
    const response = await fetch(`${BASE_URL}/api/meta/decks?limit=5`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response structure:', {
      success: data.success,
      dataCount: data.data?.length || 0,
      pagination: data.pagination,
      cache: data.cache,
    });

    if (data.data && data.data.length > 0) {
      console.log('\nSample deck:', JSON.stringify(data.data[0], null, 2));
    }

    if (response.ok && data.success) {
      console.log('✅ Decks endpoint working');
      return true;
    } else {
      console.log('❌ Decks endpoint failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing decks endpoint:', error);
    return false;
  }
}

async function testDecksFiltering() {
  console.log('\n=== Testing GET /api/meta/decks with filters ===');
  
  try {
    // Test with tier filter
    const response = await fetch(`${BASE_URL}/api/meta/decks?tier=S&limit=3`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Filtered results:', {
      success: data.success,
      dataCount: data.data?.length || 0,
      filters: data.filters,
    });

    if (response.ok && data.success) {
      console.log('✅ Decks filtering working');
      return true;
    } else {
      console.log('❌ Decks filtering failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing decks filtering:', error);
    return false;
  }
}

async function testCardsEndpoint() {
  console.log('\n=== Testing GET /api/meta/cards ===');
  
  try {
    const response = await fetch(`${BASE_URL}/api/meta/cards?limit=10`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response structure:', {
      success: data.success,
      dataCount: data.data?.length || 0,
      pagination: data.pagination,
      cache: data.cache,
    });

    if (data.data && data.data.length > 0) {
      console.log('\nSample card:', JSON.stringify(data.data[0], null, 2));
    }

    if (response.ok && data.success) {
      console.log('✅ Cards endpoint working');
      return true;
    } else {
      console.log('❌ Cards endpoint failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing cards endpoint:', error);
    return false;
  }
}

async function testCardsFiltering() {
  console.log('\n=== Testing GET /api/meta/cards with filters ===');
  
  try {
    // Test with minimum usage filter
    const response = await fetch(`${BASE_URL}/api/meta/cards?minUsage=20&limit=5`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Filtered results:', {
      success: data.success,
      dataCount: data.data?.length || 0,
      filters: data.filters,
    });

    if (response.ok && data.success) {
      console.log('✅ Cards filtering working');
      return true;
    } else {
      console.log('❌ Cards filtering failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing cards filtering:', error);
    return false;
  }
}

async function checkDatabaseState() {
  console.log('\n=== Checking Database State ===');
  
  try {
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Check snapshots
    const { data: snapshots, error: snapshotError } = await supabase
      .from('meta_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(3);

    if (snapshotError) {
      console.error('❌ Error fetching snapshots:', snapshotError);
      return false;
    }

    console.log(`Found ${snapshots?.length || 0} snapshots`);
    if (snapshots && snapshots.length > 0) {
      console.log('Latest snapshot:', {
        id: snapshots[0].id,
        date: snapshots[0].snapshot_date,
        source: snapshots[0].source,
      });
    }

    // Check decks count
    const { count: decksCount } = await supabase
      .from('popular_decks')
      .select('*', { count: 'exact', head: true });

    console.log(`Total decks in database: ${decksCount || 0}`);

    // Check cards count
    const { count: cardsCount } = await supabase
      .from('popular_cards')
      .select('*', { count: 'exact', head: true });

    console.log(`Total cards in database: ${cardsCount || 0}`);

    console.log('✅ Database state checked');
    return true;

  } catch (error) {
    console.error('❌ Error checking database:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Starting API Endpoint Tests');
  console.log('Base URL:', BASE_URL);
  console.log('=====================================');

  const results = {
    databaseState: await checkDatabaseState(),
    refreshStatus: await testRefreshStatus(),
    refresh: await testRefreshEndpoint(),
    decks: await testDecksEndpoint(),
    decksFiltering: await testDecksFiltering(),
    cards: await testCardsEndpoint(),
    cardsFiltering: await testCardsFiltering(),
  };

  console.log('\n=====================================');
  console.log('📊 Test Results Summary:');
  console.log('=====================================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  });

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log('\n=====================================');
  console.log(`Total: ${passedTests}/${totalTests} tests passed`);
  console.log('=====================================');

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});

// Made with Bob
