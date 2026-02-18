/**
 * GET /api/riftle/debug-card
 * 
 * Debug endpoint to inspect card metadata structure
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cardName = searchParams.get('name') || 'Irelia';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get a card to inspect
    const { data: card, error } = await supabase
      .from('cards')
      .select('*')
      .ilike('name', `%${cardName}%`)
      .limit(1)
      .single();
    
    if (error || !card) {
      return NextResponse.json(
        { error: 'Card not found', details: error },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      card: {
        id: card.id,
        name: card.name,
        set_code: card.set_code,
        collector_number: card.collector_number,
        rarity: card.rarity,
        metadata: card.metadata,
      },
      metadataKeys: Object.keys(card.metadata || {}),
      classificationKeys: Object.keys(card.metadata?.classification || {}),
      statsKeys: Object.keys(card.metadata?.stats || {}),
    });
  } catch (error) {
    console.error('Error in /api/riftle/debug-card:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// Made with Bob
