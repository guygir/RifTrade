/**
 * GET /api/riftle/cards
 * 
 * Get all card names for autocomplete
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get eligible cards (excludes Battlefield, Foil, and Signature cards)
    let queryBuilder = supabase
      .from('cards')
      .select('id, name, set_code, collector_number, rarity, metadata')
      .neq('metadata->classification->>type', 'Battlefield')
      .neq('metadata->>variant', 'foil')
      .neq('metadata->metadata->>signature', 'true')
      .order('name');
    
    // If query provided, filter by name
    if (query) {
      queryBuilder = queryBuilder.ilike('name', `%${query}%`);
    }
    
    const { data: cards, error } = await queryBuilder.limit(100);
    
    if (error) {
      console.error('Error fetching cards:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cards' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ cards: cards || [] });
  } catch (error) {
    console.error('Error in /api/riftle/cards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Made with Bob
