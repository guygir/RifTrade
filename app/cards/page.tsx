'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card } from '@/lib/supabase/types';
import { createSupabaseClient } from '@/lib/supabase/client';
import { getCardDisplayName } from '@/lib/card-display';

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [userHaveCards, setUserHaveCards] = useState<Set<string>>(new Set());
  const [userWantCards, setUserWantCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSets, setSelectedSets] = useState<Set<string>>(new Set(['OGN'])); // Default: only OGN
  const [showOwned, setShowOwned] = useState(true);
  const [showUnowned, setShowUnowned] = useState(true);

  useEffect(() => {
    loadCards();
    loadUserCards();
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

  const loadUserCards = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profileData) return;

      const [haveResult, wantResult] = await Promise.all([
        supabase
          .from('profile_have_cards')
          .select('card_id')
          .eq('profile_id', profileData.id),
        supabase
          .from('profile_want_cards')
          .select('card_id')
          .eq('profile_id', profileData.id)
      ]);

      if (haveResult.data) {
        setUserHaveCards(new Set(haveResult.data.map(item => item.card_id).filter(Boolean)));
      }
      if (wantResult.data) {
        setUserWantCards(new Set(wantResult.data.map(item => item.card_id).filter(Boolean)));
      }
    } catch (err) {
      console.error('Error loading user cards:', err);
    }
  };

  const sets = Array.from(new Set(cards.map(c => c.set_code))).sort();
  
  const filteredCards = cards.filter(card => {
    // Search by name, collector number, or public_code
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      card.name.toLowerCase().includes(searchLower) ||
      card.collector_number.toLowerCase().includes(searchLower) ||
      (card.public_code && card.public_code.toLowerCase().includes(searchLower)) ||
      getCardDisplayName(card).toLowerCase().includes(searchLower);
    
    // Filter by selected sets
    const matchesSet = selectedSets.size === 0 || selectedSets.has(card.set_code);
    
    // Filter by owned/unowned
    const isOwned = userHaveCards.has(card.id) || userWantCards.has(card.id);
    const matchesOwnership = 
      (showOwned && isOwned) || 
      (showUnowned && !isOwned);
    
    return matchesSearch && matchesSet && matchesOwnership;
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
          
          <div className="flex flex-col gap-4 mb-4">
            <input
              type="text"
              placeholder="Search cards by name or number (e.g., '001' or 'Blazing Scorcher')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
            />
            
            <div className="flex flex-wrap gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Sets:</label>
                <div className="flex flex-wrap gap-2">
                  {sets.map(set => (
                    <label key={set} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSets.has(set)}
                        onChange={(e) => {
                          const newSets = new Set(selectedSets);
                          if (e.target.checked) {
                            newSets.add(set);
                          } else {
                            newSets.delete(set);
                          }
                          setSelectedSets(newSets);
                        }}
                        className="cursor-pointer"
                      />
                      <span className="text-sm">{set}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Ownership:</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOwned}
                      onChange={(e) => setShowOwned(e.target.checked)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm">Owned</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showUnowned}
                      onChange={(e) => setShowUnowned(e.target.checked)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm">Unowned</span>
                  </label>
                </div>
              </div>
            </div>
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

