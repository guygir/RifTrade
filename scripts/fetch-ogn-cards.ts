/**
 * Debug Script: Fetch all OGN (Origins) cards with full attributes
 * 
 * Run with: npx tsx scripts/fetch-ogn-cards.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { writeFileSync } from 'fs';

async function fetchOGNCards() {
  console.log('🔍 Fetching all OGN (Origins) cards from Riftcodex API...');
  
  try {
    const baseUrl = 'https://api.riftcodex.com';
    const allCards: any[] = [];
    let page = 1;
    let totalPages = 1;
    
    // Fetch first page
    const firstResponse = await fetch(`${baseUrl}/cards?page=${page}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!firstResponse.ok) {
      throw new Error(`API error: ${firstResponse.status} ${firstResponse.statusText}`);
    }

    const firstData = await firstResponse.json();
    
    if (firstData.items && Array.isArray(firstData.items)) {
      // Filter for OGN set
      const ognCards = firstData.items.filter((card: any) => 
        card.set?.set_id === 'OGN' || card.set?.label === 'Origins'
      );
      allCards.push(...ognCards);
      
      totalPages = firstData.pages || 1;
      
      // Fetch remaining pages
      for (page = 2; page <= totalPages; page++) {
        const response = await fetch(`${baseUrl}/cards?page=${page}`, {
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (response.ok) {
          const pageData = await response.json();
          if (pageData.items && Array.isArray(pageData.items)) {
            const ognCards = pageData.items.filter((card: any) => 
              card.set?.set_id === 'OGN' || card.set?.label === 'Origins'
            );
            allCards.push(...ognCards);
          }
        }
      }
    }
    
    // Sort by collector_number
    allCards.sort((a, b) => {
      const numA = a.collector_number || 0;
      const numB = b.collector_number || 0;
      return numA - numB;
    });
    
    console.log(`✅ Found ${allCards.length} OGN cards`);
    
    // Save to JSON file with all attributes
    const outputPath = resolve(process.cwd(), 'debug-ogn-cards.json');
    writeFileSync(outputPath, JSON.stringify(allCards, null, 2), 'utf-8');
    console.log(`💾 Saved to: ${outputPath}`);
    
    // Also create a human-readable text file
    const textOutput: string[] = [];
    textOutput.push('OGN (Origins) Cards - All Attributes\n');
    textOutput.push('=' .repeat(80) + '\n\n');
    
    allCards.forEach((card, index) => {
      textOutput.push(`Card #${index + 1}: #${card.collector_number || 'N/A'} - ${card.name || 'Unnamed'}\n`);
      textOutput.push('-'.repeat(80) + '\n');
      textOutput.push(JSON.stringify(card, null, 2));
      textOutput.push('\n\n' + '='.repeat(80) + '\n\n');
    });
    
    const textPath = resolve(process.cwd(), 'debug-ogn-cards.txt');
    writeFileSync(textPath, textOutput.join(''), 'utf-8');
    console.log(`💾 Saved text version to: ${textPath}`);
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Total OGN cards: ${allCards.length}`);
    console.log(`   Collector number range: #${allCards[0]?.collector_number || 'N/A'} - #${allCards[allCards.length - 1]?.collector_number || 'N/A'}`);
    
    // Show first card as example
    if (allCards.length > 0) {
      console.log('\n📋 First card attributes (sample):');
      console.log(JSON.stringify(allCards[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  fetchOGNCards();
}

export default fetchOGNCards;

