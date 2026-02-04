// Test how to get champion card IDs for RiftMana filtering
// Run with: npx tsx scripts/test-champion-id-mapping.ts

import * as cheerio from 'cheerio';

const USER_AGENT = 'RiftboundCardSwap/1.0 (Meta Data Aggregator)';

async function testRiftboundChampionData() {
  console.log('Testing Riftbound Tier List for Champion IDs');
  console.log('='.repeat(60));
  console.log();

  const response = await fetch('https://riftbound.gg/tier-list/', {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html',
    },
  });

  const html = await response.text();
  const $ = cheerio.load(html);

  console.log('Checking if Riftbound provides champion card IDs...');
  console.log('-'.repeat(60));

  // Find champion figures
  const championFigures = $('figure.wp-block-image').slice(0, 5);
  
  championFigures.each((i, figure) => {
    const $figure = $(figure);
    const championName = $figure.find('figcaption a').first().text().trim();
    const legendUrl = $figure.find('figcaption a').first().attr('href');
    const imageUrl = $figure.find('img').attr('src');
    const imageAlt = $figure.find('img').attr('alt');
    
    console.log(`\nChampion ${i + 1}: ${championName}`);
    console.log(`  Legend URL: ${legendUrl}`);
    console.log(`  Image URL: ${imageUrl}`);
    console.log(`  Image Alt: ${imageAlt}`);
    
    // Try to extract card ID from image URL or alt text
    const cardIdMatch = imageUrl?.match(/ogn-\d+/i) || imageAlt?.match(/ogn-\d+/i);
    if (cardIdMatch) {
      console.log(`  ✅ Card ID found: ${cardIdMatch[0]}`);
    } else {
      console.log(`  ❌ No card ID found`);
    }
  });

  console.log();
  console.log('='.repeat(60));
  console.log('Alternative: Check our database for champion cards');
  console.log('='.repeat(60));
  console.log();
  console.log('We can query our cards table:');
  console.log('  SELECT id, name, set_code, collector_number');
  console.log('  FROM cards');
  console.log('  WHERE card_type = \'Champion\'');
  console.log('  ORDER BY name;');
  console.log();
  console.log('Then create a mapping:');
  console.log('  championNameToId = {');
  console.log('    "Draven": "ogn-034",');
  console.log('    "Kai\'Sa": "ogn-247",');
  console.log('    "Jinx": "ogn-035",');
  console.log('    // etc...');
  console.log('  }');
}

testRiftboundChampionData().catch(console.error);

// Made with Bob
