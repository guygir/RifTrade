'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card } from '@/lib/supabase/types';
import { createSupabaseClient } from '@/lib/supabase/client';
import { getCardDisplayName } from '@/lib/card-display';

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSet, setSelectedSet] = useState<string>('all');

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('set_code', { ascending: true })
        .order('sort_key', { ascending: true, nullsFirst: false })
        .order('collector_number');

      if (error) throw error;
      setCards(data || []);
    } catch (err) {
      console.error('Error loading cards:', err);
    } finally {
      setLoading(false);
    }
  };

  const sets = Array.from(new Set(cards.map(c => c.set_code))).sort();
  
  const filteredCards = cards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSet = selectedSet === 'all' || card.set_code === selectedSet;
    return matchesSearch && matchesSet;
  });

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-center">Loading cards...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Card Browser</h1>
          
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input
              type="text"
              placeholder="Search cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-md"
            />
            
            <select
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="all">All Sets</option>
              {sets.map(set => (
                <option key={set} value={set}>{set}</option>
              ))}
            </select>
          </div>

          <p className="text-sm text-gray-600">
            Showing {filteredCards.length} of {cards.length} cards
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {card.image_url && (
                <div className="relative w-full aspect-[63/88] mb-2 bg-gray-100 rounded">
                  <Image
                    src={card.image_url}
                    alt={card.name}
                    fill
                    className="object-contain rounded"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
              )}
              <h3 className="font-semibold text-sm mb-1">{getCardDisplayName(card)}</h3>
              {card.rarity && (
                <p className="text-xs text-gray-500 mt-1">{card.rarity}</p>
              )}
            </div>
          ))}
        </div>

        {filteredCards.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No cards found. Try adjusting your search or filter.
          </div>
        )}
      </div>
    </main>
  );
}

