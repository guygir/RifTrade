/**
 * Debug UNL API Response
 * Check what the actual API response structure looks like
 */

const RIFTCODEX_API_URL = 'https://api.riftcodex.com';
const UNL_SET_ID = '69bc5bf6e195be3e561d1eae';

async function debugResponse() {
  console.log('Fetching UNL set...\n');
  
  const response = await fetch(`${RIFTCODEX_API_URL}/sets/${UNL_SET_ID}`, {
    headers: { 'Accept': 'application/json' },
  });

  const data = await response.json();
  
  console.log('Response keys:', Object.keys(data));
  console.log('\nFull response structure:');
  console.log(JSON.stringify(data, null, 2).substring(0, 2000));
  console.log('\n...(truncated)');
}

debugResponse();

// Made with Bob
