'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Card, Profile, ProfileHaveCard, ProfileWantCard } from '@/lib/supabase/types';
import { getCardDisplayName } from '@/lib/card-display';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [haveCards, setHaveCards] = useState<Array<Card & { quantity: number; relationId: string }>>([]);
  const [wantCards, setWantCards] = useState<Array<Card & { quantity: number; relationId: string }>>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [tradingLocations, setTradingLocations] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    await loadProfile(user.id);
    await loadCards();
  };

  const loadProfile = async (userId: string) => {
    const supabase = createSupabaseClient();
    
    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileData) {
      setProfile(profileData);
      setDisplayName(profileData.display_name);
      setContactInfo(profileData.contact_info);
      setTradingLocations(profileData.trading_locations || '');

      // Load have cards with quantities, sorted by set_code then sort_key
      const { data: haveData } = await supabase
        .from('profile_have_cards')
        .select('id, quantity, cards(*)')
        .eq('profile_id', profileData.id);

      if (haveData) {
        const cardsWithQuantity = haveData
          .map((item: any) => ({
            ...item.cards,
            quantity: item.quantity || 1,
            relationId: item.id,
          }))
          .filter((item: any) => item.id) // Filter out null cards
          .sort((a: any, b: any) => {
            // Sort by set_code first
            if (a.set_code !== b.set_code) {
              return (a.set_code || '').localeCompare(b.set_code || '');
            }
            // Then by sort_key
            if (!a.sort_key && !b.sort_key) return 0;
            if (!a.sort_key) return 1;
            if (!b.sort_key) return -1;
            return a.sort_key.localeCompare(b.sort_key, undefined, { numeric: true, sensitivity: 'base' });
          });
        setHaveCards(cardsWithQuantity);
      }

      // Load want cards with quantities, sorted by set_code then sort_key
      const { data: wantData } = await supabase
        .from('profile_want_cards')
        .select('id, quantity, cards(*)')
        .eq('profile_id', profileData.id);

      if (wantData) {
        const cardsWithQuantity = wantData
          .map((item: any) => ({
            ...item.cards,
            quantity: item.quantity || 1,
            relationId: item.id,
          }))
          .filter((item: any) => item.id) // Filter out null cards
          .sort((a: any, b: any) => {
            // Sort by set_code first
            if (a.set_code !== b.set_code) {
              return (a.set_code || '').localeCompare(b.set_code || '');
            }
            // Then by sort_key
            if (!a.sort_key && !b.sort_key) return 0;
            if (!a.sort_key) return 1;
            if (!b.sort_key) return -1;
            return a.sort_key.localeCompare(b.sort_key, undefined, { numeric: true, sensitivity: 'base' });
          });
        setWantCards(cardsWithQuantity);
      }
    }

    setLoading(false);
  };

  const loadCards = async () => {
    const supabase = createSupabaseClient();
    const { data } = await supabase
      .from('cards')
      .select('*')
      .order('set_code', { ascending: true })
      .order('sort_key', { ascending: true, nullsFirst: false })
      .order('collector_number');
    setAllCards(data || []);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    try {
      if (profile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update({
            display_name: displayName,
            contact_info: contactInfo,
            trading_locations: tradingLocations || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { data: newProfile, error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            display_name: displayName,
            contact_info: contactInfo,
            trading_locations: tradingLocations || null,
          })
          .select()
          .single();

        if (error) throw error;
        if (newProfile) setProfile(newProfile);
      }

      alert('Profile saved!');
    } catch (err: any) {
      alert('Error saving profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <div className="flex gap-2">
            <Link href="/" className="px-4 py-2 border rounded-md hover:bg-gray-50">
              Home
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Your name or username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contact Info</label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Telegram, Discord, email, phone, etc."
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be visible to other users who want to trade with you.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Trading Locations</label>
              <input
                type="text"
                value={tradingLocations}
                onChange={(e) => setTradingLocations(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Tel Aviv, Jerusalem, etc."
              />
              <p className="text-xs text-gray-500 mt-1">
                List cities or areas where you're available for in-person trades (optional).
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !displayName || !contactInfo}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        {profile && (
          <>
            <div className="bg-white border rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Cards I Have ({haveCards.length})</h2>
                <button
                  onClick={async () => {
                    const supabase = createSupabaseClient();
                    await supabase
                      .from('profile_have_cards')
                      .delete()
                      .eq('profile_id', profile.id);
                    await loadProfile(profile.user_id);
                  }}
                  className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Select cards from your collection that you're willing to trade.
              </p>
              <CardSelectorWithQuantity
                allCards={allCards}
                selectedCards={haveCards}
                onSelectionChange={async (cardSelections: Array<{ cardId: string; quantity: number }>) => {
                  const supabase = createSupabaseClient();
                  try {
                    // Get current selections from database
                    const { data: currentData } = await supabase
                      .from('profile_have_cards')
                      .select('card_id, quantity')
                      .eq('profile_id', profile.id);
                    
                    const currentMap = new Map<string, number>();
                    (currentData || []).forEach((item: any) => {
                      currentMap.set(item.card_id, item.quantity || 1);
                    });
                    
                    const newMap = new Map<string, number>();
                    cardSelections.forEach(({ cardId, quantity }) => {
                      newMap.set(cardId, quantity);
                    });
                    
                    // Find cards to add and remove
                    const toAdd: Array<{ profile_id: string; card_id: string; quantity: number }> = [];
                    const toRemove: string[] = [];
                    
                    newMap.forEach((quantity, cardId) => {
                      if (!currentMap.has(cardId) || currentMap.get(cardId) !== quantity) {
                        toAdd.push({ profile_id: profile.id, card_id: cardId, quantity });
                      }
                    });
                    
                    currentMap.forEach((_, cardId) => {
                      if (!newMap.has(cardId)) {
                        toRemove.push(cardId);
                      }
                    });
                    
                    // Batch operations
                    const promises: Promise<any>[] = [];
                    
                    if (toRemove.length > 0) {
                      promises.push(
                        supabase
                          .from('profile_have_cards')
                          .delete()
                          .eq('profile_id', profile.id)
                          .in('card_id', toRemove)
                          .then(({ error }) => {
                            if (error) throw error;
                            return null;
                          })
                      );
                    }
                    
                    if (toAdd.length > 0) {
                      // Use upsert to handle updates efficiently
                      promises.push(
                        supabase
                          .from('profile_have_cards')
                          .upsert(toAdd, { onConflict: 'profile_id,card_id' })
                          .then(({ error }) => {
                            if (error) throw error;
                            return null;
                          })
                      );
                    }
                    
                    await Promise.all(promises);
                    await loadProfile(profile.user_id);
                  } catch (err) {
                    console.error('Error updating cards:', err);
                    // Reload on error to sync state
                    await loadProfile(profile.user_id);
                  }
                }}
              />
            </div>

            <div className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Cards I Want ({wantCards.length})</h2>
                <button
                  onClick={async () => {
                    const supabase = createSupabaseClient();
                    await supabase
                      .from('profile_want_cards')
                      .delete()
                      .eq('profile_id', profile.id);
                    await loadProfile(profile.user_id);
                  }}
                  className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Select cards you're looking to acquire.
              </p>
              <CardSelectorWithQuantity
                allCards={allCards}
                selectedCards={wantCards}
                onSelectionChange={async (cardSelections: Array<{ cardId: string; quantity: number }>) => {
                  const supabase = createSupabaseClient();
                  try {
                    // Get current selections from database
                    const { data: currentData } = await supabase
                      .from('profile_want_cards')
                      .select('card_id, quantity')
                      .eq('profile_id', profile.id);
                    
                    const currentMap = new Map<string, number>();
                    (currentData || []).forEach((item: any) => {
                      currentMap.set(item.card_id, item.quantity || 1);
                    });
                    
                    const newMap = new Map<string, number>();
                    cardSelections.forEach(({ cardId, quantity }) => {
                      newMap.set(cardId, quantity);
                    });
                    
                    // Find cards to add and remove
                    const toAdd: Array<{ profile_id: string; card_id: string; quantity: number }> = [];
                    const toRemove: string[] = [];
                    
                    newMap.forEach((quantity, cardId) => {
                      if (!currentMap.has(cardId) || currentMap.get(cardId) !== quantity) {
                        toAdd.push({ profile_id: profile.id, card_id: cardId, quantity });
                      }
                    });
                    
                    currentMap.forEach((_, cardId) => {
                      if (!newMap.has(cardId)) {
                        toRemove.push(cardId);
                      }
                    });
                    
                    // Batch operations
                    const promises: Promise<any>[] = [];
                    
                    if (toRemove.length > 0) {
                      promises.push(
                        supabase
                          .from('profile_want_cards')
                          .delete()
                          .eq('profile_id', profile.id)
                          .in('card_id', toRemove)
                          .then(({ error }) => {
                            if (error) throw error;
                            return null;
                          })
                      );
                    }
                    
                    if (toAdd.length > 0) {
                      // Use upsert to handle updates efficiently
                      promises.push(
                        supabase
                          .from('profile_want_cards')
                          .upsert(toAdd, { onConflict: 'profile_id,card_id' })
                          .then(({ error }) => {
                            if (error) throw error;
                            return null;
                          })
                      );
                    }
                    
                    await Promise.all(promises);
                    await loadProfile(profile.user_id);
                  } catch (err) {
                    console.error('Error updating cards:', err);
                    // Reload on error to sync state
                    await loadProfile(profile.user_id);
                  }
                }}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function CardSelectorWithQuantity({
  allCards,
  selectedCards,
  onSelectionChange,
}: {
  allCards: Card[];
  selectedCards: Array<Card & { quantity: number; relationId?: string }>;
  onSelectionChange: (selections: Array<{ cardId: string; quantity: number }>) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [localSelections, setLocalSelections] = useState<Map<string, number>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize local selections from props
  useEffect(() => {
    const map = new Map<string, number>();
    selectedCards.forEach(card => {
      map.set(card.id, card.quantity || 1);
    });
    setLocalSelections(map);
  }, [selectedCards]);

  // Create a map of selected cards with their quantities (use local state for immediate UI updates)
  const selectedMap = localSelections;

  let filteredCards = allCards.filter(card =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCardDisplayName(card).toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter to show only selected cards if toggle is on
  if (showOnlySelected) {
    filteredCards = filteredCards.filter(card => selectedMap.has(card.id));
  }

  // Debounced save function
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const updateCardSelection = (cardId: string, quantity: number) => {
    // Optimistic UI update - update local state immediately
    const newSelections = new Map(selectedMap);
    if (quantity > 0) {
      newSelections.set(cardId, quantity);
    } else {
      newSelections.delete(cardId);
    }
    setLocalSelections(newSelections);
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce the database save (wait 500ms after last change)
    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      const selectionsArray: Array<{ cardId: string; quantity: number }> = [];
      newSelections.forEach((qty, id) => {
        selectionsArray.push({ cardId: id, quantity: qty });
      });
      
      await onSelectionChange(selectionsArray);
      setIsSaving(false);
    }, 500);
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search cards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <label className="flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={showOnlySelected}
            onChange={(e) => setShowOnlySelected(e.target.checked)}
            className="cursor-pointer"
          />
          <span className="text-sm">Show only selected</span>
        </label>
      </div>
      
      <div className="max-h-96 overflow-y-auto border rounded-md p-2">
        {filteredCards.map((card) => {
          const isSelected = selectedMap.has(card.id);
          const quantity = selectedMap.get(card.id) || 1;
          
          return (
            <div
              key={card.id}
              className={`flex items-center gap-2 p-2 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateCardSelection(card.id, 1);
                  } else {
                    updateCardSelection(card.id, 0);
                  }
                }}
                className="cursor-pointer"
              />
              <span className="text-sm flex-1">{getCardDisplayName(card)}</span>
              {isSelected && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">Qty:</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      const newQty = parseInt(e.target.value) || 1;
                      updateCardSelection(card.id, newQty);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-16 px-2 py-1 border rounded text-sm"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <p className="text-xs text-gray-500">
          {selectedMap.size} card(s) selected
        </p>
        {isSaving && (
          <p className="text-xs text-blue-500">Saving...</p>
        )}
      </div>
    </div>
  );
}

