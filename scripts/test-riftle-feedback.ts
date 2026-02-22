/**
 * Test script for Riftle feedback logic
 * Tests Champion Unit type classification and multi-domain faction matching
 */

import { extractCardAttributes, generateFeedback, getCategoricalFeedback } from '../lib/riftle/feedback';

console.log('=== Testing Riftle Feedback Logic ===\n');

// Test 1: Champion Unit Type Classification
console.log('Test 1: Champion Unit Type Classification');
console.log('------------------------------------------');

const regularUnit = {
  name: 'Regular Unit',
  metadata: {
    classification: {
      type: 'Unit',
      supertype: null,
      domain: ['Order']
    }
  }
};

const championUnit = {
  name: 'Champion Unit',
  metadata: {
    classification: {
      type: 'Unit',
      supertype: 'Champion',
      domain: ['Fury']
    }
  }
};

const regularUnitAttrs = extractCardAttributes(regularUnit);
const championUnitAttrs = extractCardAttributes(championUnit);

console.log(`Regular Unit type: "${regularUnitAttrs.type}" (expected: "Unit")`);
console.log(`Champion Unit type: "${championUnitAttrs.type}" (expected: "Champion Unit")`);
console.log(`✓ Test 1 ${regularUnitAttrs.type === 'Unit' && championUnitAttrs.type === 'Champion Unit' ? 'PASSED' : 'FAILED'}\n`);

// Test 2: Single Domain Faction
console.log('Test 2: Single Domain Faction');
console.log('------------------------------');

const singleDomainCard = {
  name: 'Single Domain',
  metadata: {
    classification: {
      type: 'Unit',
      domain: ['Order']
    }
  }
};

const singleDomainAttrs = extractCardAttributes(singleDomainCard);
console.log(`Single domain faction: "${singleDomainAttrs.faction}" (expected: "Order")`);
console.log(`✓ Test 2 ${singleDomainAttrs.faction === 'Order' ? 'PASSED' : 'FAILED'}\n`);

// Test 3: Multi-Domain Faction
console.log('Test 3: Multi-Domain Faction');
console.log('-----------------------------');

const multiDomainCard = {
  name: 'Multi Domain',
  metadata: {
    classification: {
      type: 'Unit',
      domain: ['Fury', 'Order']
    }
  }
};

const multiDomainAttrs = extractCardAttributes(multiDomainCard);
console.log(`Multi-domain faction: "${multiDomainAttrs.faction}" (expected: "Fury, Order")`);
console.log(`✓ Test 3 ${multiDomainAttrs.faction === 'Fury, Order' ? 'PASSED' : 'FAILED'}\n`);

// Test 4: Faction Matching - Exact Match
console.log('Test 4: Faction Matching - Exact Match');
console.log('---------------------------------------');

const exactMatchFeedback = getCategoricalFeedback('Order', 'Order', 'faction');
console.log(`Exact match (Order vs Order): "${exactMatchFeedback}" (expected: "correct")`);
console.log(`✓ Test 4 ${exactMatchFeedback === 'correct' ? 'PASSED' : 'FAILED'}\n`);

// Test 5: Faction Matching - No Match
console.log('Test 5: Faction Matching - No Match');
console.log('------------------------------------');

const noMatchFeedback = getCategoricalFeedback('Order', 'Fury', 'faction');
console.log(`No match (Order vs Fury): "${noMatchFeedback}" (expected: "wrong")`);
console.log(`✓ Test 5 ${noMatchFeedback === 'wrong' ? 'PASSED' : 'FAILED'}\n`);

// Test 6: Faction Matching - Partial Match (Multi vs Single)
console.log('Test 6: Faction Matching - Partial Match (Multi vs Single)');
console.log('-----------------------------------------------------------');

const partialMatch1 = getCategoricalFeedback('Fury, Order', 'Order', 'faction');
console.log(`Partial match (Fury, Order vs Order): "${partialMatch1}" (expected: "partial")`);
console.log(`✓ Test 6 ${partialMatch1 === 'partial' ? 'PASSED' : 'FAILED'}\n`);

// Test 7: Faction Matching - Partial Match (Single vs Multi)
console.log('Test 7: Faction Matching - Partial Match (Single vs Multi)');
console.log('-----------------------------------------------------------');

const partialMatch2 = getCategoricalFeedback('Order', 'Fury, Order', 'faction');
console.log(`Partial match (Order vs Fury, Order): "${partialMatch2}" (expected: "partial")`);
console.log(`✓ Test 7 ${partialMatch2 === 'partial' ? 'PASSED' : 'FAILED'}\n`);

// Test 8: Faction Matching - Exact Match (Both Multi)
console.log('Test 8: Faction Matching - Exact Match (Both Multi)');
console.log('----------------------------------------------------');

const exactMultiMatch = getCategoricalFeedback('Fury, Order', 'Fury, Order', 'faction');
console.log(`Exact multi match (Fury, Order vs Fury, Order): "${exactMultiMatch}" (expected: "correct")`);
console.log(`✓ Test 8 ${exactMultiMatch === 'correct' ? 'PASSED' : 'FAILED'}\n`);

// Test 9: Faction Matching - No Match (Multi vs Multi, different)
console.log('Test 9: Faction Matching - No Match (Multi vs Multi, different)');
console.log('----------------------------------------------------------------');

const noMultiMatch = getCategoricalFeedback('Fury, Order', 'Chaos, Intellect', 'faction');
console.log(`No multi match (Fury, Order vs Chaos, Intellect): "${noMultiMatch}" (expected: "wrong")`);
console.log(`✓ Test 9 ${noMultiMatch === 'wrong' ? 'PASSED' : 'FAILED'}\n`);

// Test 10: Faction Matching - Partial Match (Multi vs Multi, one overlap)
console.log('Test 10: Faction Matching - Partial Match (Multi vs Multi, one overlap)');
console.log('------------------------------------------------------------------------');

const partialMultiMatch = getCategoricalFeedback('Fury, Order', 'Order, Chaos', 'faction');
console.log(`Partial multi match (Fury, Order vs Order, Chaos): "${partialMultiMatch}" (expected: "partial")`);
console.log(`✓ Test 10 ${partialMultiMatch === 'partial' ? 'PASSED' : 'FAILED'}\n`);

// Test 11: Full Feedback Generation
console.log('Test 11: Full Feedback Generation');
console.log('----------------------------------');

const guessCard = {
  name: 'Guess Card',
  rarity: 'Common',
  collector_number: '001',
  metadata: {
    classification: {
      type: 'Unit',
      supertype: 'Champion',
      domain: ['Fury', 'Order']
    },
    attributes: {
      energy: 3,
      might: 2,
      power: 4
    }
  }
};

const targetCard = {
  name: 'Target Card',
  rarity: 'Rare',
  collector_number: '002',
  metadata: {
    classification: {
      type: 'Unit',
      supertype: 'Champion',
      domain: ['Order']
    },
    attributes: {
      energy: 3,
      might: 3,
      power: 4
    }
  }
};

const feedback = generateFeedback(guessCard, targetCard);
console.log('Feedback for guess vs target:');
console.log(`  Type: ${feedback.type} (expected: "correct" - both Champion Unit)`);
console.log(`  Faction: ${feedback.faction} (expected: "partial" - Fury,Order vs Order)`);
console.log(`  Rarity: ${feedback.rarity} (expected: "wrong" - Common vs Rare)`);
console.log(`  Energy: ${feedback.energy} (expected: "exact" - 3 vs 3)`);
console.log(`  Might: ${feedback.might} (expected: "low" - 2 vs 3)`);
console.log(`  Power: ${feedback.power} (expected: "exact" - 4 vs 4)`);

const test11Pass = 
  feedback.type === 'correct' &&
  feedback.faction === 'partial' &&
  feedback.rarity === 'wrong' &&
  feedback.energy === 'exact' &&
  feedback.might === 'low' &&
  feedback.power === 'exact';

console.log(`✓ Test 11 ${test11Pass ? 'PASSED' : 'FAILED'}\n`);

console.log('=== All Tests Complete ===');

// Made with Bob
