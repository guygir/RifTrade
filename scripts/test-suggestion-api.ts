import { createClient } from '@supabase/supabase-js';

async function testSuggestionAPI() {
  console.log('Testing Suggestion API...\n');

  // Test 1: GitHub API directly
  console.log('1. Testing GitHub API directly...');
  const githubToken = process.env.GITHUB_TOKEN;
  const owner = 'guygir';
  const repo = 'RifTrade';

  if (!githubToken) {
    console.error('❌ GITHUB_TOKEN not found in environment');
    return;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Issue from Script',
        body: 'This is a test issue created by the test script.',
        labels: ['user-suggestion', 'test'],
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ GitHub API works!');
      console.log('   Issue URL:', data.html_url);
      console.log('   Issue Number:', data.number);
    } else {
      console.error('❌ GitHub API failed:', response.status);
      console.error('   Error:', data.message || JSON.stringify(data));
    }
  } catch (err) {
    console.error('❌ GitHub API error:', err);
  }

  // Test 2: Supabase Auth
  console.log('\n2. Testing Supabase client creation...');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase env vars not found');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase client created');

  // Test 3: Check if we can get user (should fail without auth)
  console.log('\n3. Testing auth.getUser() without session...');
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.log('✅ Expected: No user without session');
    console.log('   Error:', error.message);
  } else if (!user) {
    console.log('✅ Expected: user is null without session');
  } else {
    console.log('❌ Unexpected: Got user without session:', user.id);
  }

  console.log('\n✅ Test complete!');
  console.log('\nTo test with actual auth:');
  console.log('1. Sign in to your app');
  console.log('2. Open browser console');
  console.log('3. Run: document.cookie');
  console.log('4. Copy the sb-* cookie values');
  console.log('5. Test the API endpoint with those cookies');
}

testSuggestionAPI().catch(console.error);

// Made with Bob
