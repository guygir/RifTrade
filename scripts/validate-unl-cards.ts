/**
 * Validate UNL (Unleashed) Cards from Riftcodex API
 * 
 * This script fetches and validates the UNL set to ensure:
 * - Cards are available and accessible
 * - Expected card count is correct (280 cards)
 * - Card structure matches expected format
 * - All required fields are present
 * - No unexpected issues or quirks
 * 
 * Run with: npx tsx scripts/validate-unl-cards.ts
 */

const RIFTCODEX_API_URL = 'https://api.riftcodex.com';
const UNL_SET_ID = '69bc5bf6e195be3e561d1eae';
const EXPECTED_CARD_COUNT = 280;

interface RiftcodexCard {
  id?: string;
  name: string;
  set?: any;
  set_code?: string;
  collector_number?: string;
  number?: string;
  image_url?: string;
  image?: string;
  rarity?: string;
  classification?: any;
  metadata?: any;
  public_code?: string;
  riftbound_id?: string;
  media?: any;
  [key: string]: any;
}

interface ValidationResult {
  success: boolean;
  cardCount: number;
  issues: string[];
  warnings: string[];
  stats: {
    rarityDistribution: Record<string, number>;
    typeDistribution: Record<string, number>;
    cardsWithImages: number;
    cardsWithMetadata: number;
    showcaseCards: number;
    overnumberedCards: number;
  };
}

async function validateUNLCards(): Promise<ValidationResult> {
  console.log('🔍 Validating UNL (Unleashed) Cards from Riftcodex API\n');
  console.log('═'.repeat(80));
  
  const result: ValidationResult = {
    success: true,
    cardCount: 0,
    issues: [],
    warnings: [],
    stats: {
      rarityDistribution: {},
      typeDistribution: {},
      cardsWithImages: 0,
      cardsWithMetadata: 0,
      showcaseCards: 0,
      overnumberedCards: 0,
    },
  };

  try {
    // Fetch UNL set data
    console.log(`📡 Fetching UNL set from: ${RIFTCODEX_API_URL}/sets/${UNL_SET_ID}`);
    const response = await fetch(`${RIFTCODEX_API_URL}/sets/${UNL_SET_ID}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      result.success = false;
      result.issues.push(`API request failed: ${response.status} ${response.statusText}`);
      return result;
    }

    const data = await response.json();
    console.log('✅ API request successful\n');

    // Extract cards from response
    let cards: RiftcodexCard[] = [];
    if (data.cards && Array.isArray(data.cards)) {
      cards = data.cards;
    } else if (Array.isArray(data)) {
      cards = data;
    } else {
      result.success = false;
      result.issues.push('Unexpected API response structure - no cards array found');
      return result;
    }

    result.cardCount = cards.length;
    console.log(`📊 Card Count: ${cards.length} cards`);
    
    // Check expected count
    if (cards.length !== EXPECTED_CARD_COUNT) {
      result.warnings.push(
        `Card count mismatch: Expected ${EXPECTED_CARD_COUNT}, got ${cards.length}`
      );
    }

    // Validate each card
    console.log('\n🔎 Validating card structure...\n');
    
    cards.forEach((card, index) => {
      // Check required fields
      if (!card.name) {
        result.issues.push(`Card ${index + 1}: Missing name field`);
      }

      // Extract set code
      const setCode = card.set?.set_id || card.set_code || card.set || '';
      if (setCode !== 'UNL') {
        result.warnings.push(
          `Card ${index + 1} (${card.name}): Set code is "${setCode}", expected "UNL"`
        );
      }

      // Check collector number
      const collectorNumber = card.collector_number || card.number || '';
      if (!collectorNumber) {
        result.issues.push(`Card ${index + 1} (${card.name}): Missing collector number`);
      }

      // Check image URL
      const imageUrl = card.media?.image_url || card.image_url || card.image || null;
      if (imageUrl) {
        result.stats.cardsWithImages++;
      } else {
        result.warnings.push(`Card ${index + 1} (${card.name}): Missing image URL`);
      }

      // Check metadata
      if (card.classification || card.metadata) {
        result.stats.cardsWithMetadata++;
      }

      // Extract rarity
      const rarity = card.classification?.rarity || card.rarity || 'Unknown';
      result.stats.rarityDistribution[rarity] = 
        (result.stats.rarityDistribution[rarity] || 0) + 1;

      // Check for Showcase cards
      if (rarity === 'Showcase') {
        result.stats.showcaseCards++;
      }

      // Check for overnumbered cards
      const isOvernumbered = card.metadata?.overnumbered === true ||
                            card.metadata?.overnumbered === 'true';
      if (isOvernumbered) {
        result.stats.overnumberedCards++;
      }

      // Extract card type
      const cardType = card.classification?.type || card.type || 'Unknown';
      result.stats.typeDistribution[cardType] = 
        (result.stats.typeDistribution[cardType] || 0) + 1;
    });

    // Print statistics
    console.log('📈 Statistics:');
    console.log('─'.repeat(80));
    
    console.log('\n  Rarity Distribution:');
    Object.entries(result.stats.rarityDistribution)
      .sort(([, a], [, b]) => b - a)
      .forEach(([rarity, count]) => {
        console.log(`    ${rarity.padEnd(15)} ${count} cards`);
      });

    console.log('\n  Card Type Distribution:');
    Object.entries(result.stats.typeDistribution)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`    ${type.padEnd(15)} ${count} cards`);
      });

    console.log(`\n  Cards with Images:    ${result.stats.cardsWithImages}/${cards.length}`);
    console.log(`  Cards with Metadata:  ${result.stats.cardsWithMetadata}/${cards.length}`);
    console.log(`  Showcase Cards:       ${result.stats.showcaseCards}`);
    console.log(`  Overnumbered Cards:   ${result.stats.overnumberedCards}`);

    // Sample cards
    console.log('\n📋 Sample Cards (first 5):');
    console.log('─'.repeat(80));
    cards.slice(0, 5).forEach((card, index) => {
      const setCode = card.set?.set_id || card.set_code || 'N/A';
      const collectorNum = card.collector_number || card.number || 'N/A';
      const rarity = card.classification?.rarity || card.rarity || 'N/A';
      console.log(`  ${index + 1}. ${card.name}`);
      console.log(`     Set: ${setCode} | Number: ${collectorNum} | Rarity: ${rarity}`);
    });

  } catch (error) {
    result.success = false;
    result.issues.push(`Error during validation: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

// Run validation and print results
async function main() {
  const result = await validateUNLCards();

  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 VALIDATION RESULTS\n');

  if (result.issues.length > 0) {
    console.log('❌ ISSUES FOUND:');
    result.issues.forEach(issue => console.log(`   - ${issue}`));
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    result.warnings.forEach(warning => console.log(`   - ${warning}`));
    console.log('');
  }

  if (result.success && result.issues.length === 0) {
    console.log('✅ VALIDATION SUCCESSFUL!');
    console.log(`   ${result.cardCount} UNL cards are ready to be seeded`);
    console.log('');
    console.log('Next steps:');
    console.log('   1. Run: npm run seed');
    console.log('   2. Verify cards in database');
    console.log('   3. Test in card browser and Riftle');
  } else {
    console.log('❌ VALIDATION FAILED');
    console.log('   Please review issues above before proceeding');
    process.exit(1);
  }

  console.log('\n' + '═'.repeat(80));
}

main();

// Made with Bob
