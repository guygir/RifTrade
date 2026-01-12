'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Card, Profile, ProfileHaveCard, ProfileWantCard } from '@/lib/supabase/types';
import { getCardDisplayName } from '@/lib/card-display';
import { detectAndStoreMatches } from '@/lib/match-storage';

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
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
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

    // Don't redirect - /profile is the editing page, stay here
    // The [username] route is for viewing other users' profiles

    // Load profile and cards for editing
    await loadProfile(user.id);
    await loadCards();
    
    // Note: Don't recalculate matches on every profile page load - too expensive
    // Matches will be recalculated when:
    // 1. User changes their cards (in onSelectionChange)
    // 2. User views another profile (in [username]/page.tsx)
    // 3. User opens notification bell (in NotificationBell.tsx)
  };

  const loadProfile = async (userId: string): Promise<Profile | null> => {
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
      setUsername(profileData.username || '');

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
    return profileData || null;
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

  // Validate username format
  const validateUsername = (value: string): string | null => {
    if (!value) {
      // Username is required for existing users without one
      if (profile && !profile.username) {
        return 'Username is required';
      }
      return null; // Allow empty for new profiles (will be set during signup)
    }
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 30) return 'Username must be at most 30 characters';
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return 'Username can only contain letters, numbers, underscores, and hyphens';
    }
    return null;
  };

  // Check username uniqueness (excluding current user)
  const checkUsernameAvailability = async (value: string): Promise<boolean> => {
    const supabase = createSupabaseClient();
    
    // Build query to find profiles with matching username (case-insensitive)
    // Note: ilike will only match non-NULL values, so we don't need to explicitly exclude NULLs
    let query = supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', value.toLowerCase());
    
    // Exclude current profile if we have one
    if (profile?.id) {
      query = query.neq('id', profile.id);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error checking username:', error);
      // On error, assume unavailable to be safe
      return false;
    }
    
    // Filter out any NULL or empty usernames and ensure exact match
    // Also double-check we're not matching the current profile
    const matchingProfiles = (data || []).filter(p => {
      if (!p.username || p.username.trim() === '') return false;
      if (p.username.toLowerCase() !== value.toLowerCase()) return false;
      if (profile?.id && p.id === profile.id) return false;  // Extra safety check
      return true;
    });
    
    const isAvailable = matchingProfiles.length === 0;
    console.log('Username availability check:', { 
      username: value, 
      currentProfileId: profile?.id, 
      currentProfileUsername: profile?.username,
      matchingProfiles: matchingProfiles.length, 
      isAvailable 
    });
    
    return isAvailable;
  };

  const handleUsernameChange = async (value: string) => {
    setUsername(value);
    setUsernameError(null);
    
    if (!value) {
      // Only require username if profile exists and doesn't have one
      if (profile && !profile.username) {
        setUsernameError('Username is required');
      } else {
        setUsernameError(null);
      }
      return;
    }

    const validationError = validateUsername(value);
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    // Check uniqueness
    setCheckingUsername(true);
    const isAvailable = await checkUsernameAvailability(value);
    setCheckingUsername(false);
    
    if (!isAvailable) {
      setUsernameError('This username is already taken');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setUsernameError(null);
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    try {
      // Validate username if required
      if (profile && !profile.username && !username) {
        setUsernameError('Username is required');
        setSaving(false);
        return;
      }

      if (username) {
        const validationError = validateUsername(username);
        if (validationError) {
          setUsernameError(validationError);
          setSaving(false);
          return;
        }

        // Check availability one more time
        const isAvailable = await checkUsernameAvailability(username);
        if (!isAvailable) {
          setUsernameError('This username is already taken');
          setSaving(false);
          return;
        }
      }

      let newUsername: string | null = null;
      
      if (profile) {
        // Update existing profile
        const updateData: any = {
          display_name: displayName,
          contact_info: contactInfo,
          trading_locations: tradingLocations || null,
          updated_at: new Date().toISOString(),
        };
        
        // Only update username if it changed or if profile doesn't have one
        if (username && (username.toLowerCase() !== profile.username?.toLowerCase() || !profile.username)) {
          updateData.username = username.toLowerCase();
          newUsername = updateData.username;
        }

        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', profile.id);

        if (error) throw error;
      } else {
        // Create new profile (shouldn't happen if signup flow works, but handle it)
        if (!username) {
          setUsernameError('Username is required');
          setSaving(false);
          return;
        }

        newUsername = username.toLowerCase();
        const { data: newProfile, error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            display_name: displayName,
            contact_info: contactInfo,
            trading_locations: tradingLocations || null,
            username: newUsername,
          })
          .select()
          .single();

        if (error) throw error;
        if (newProfile) setProfile(newProfile);
      }

      alert('Profile saved!');
      // Reload profile to get updated data
      await loadProfile(user.id);
      
      // If username was set/changed, redirect to new username URL
      if (newUsername && newUsername !== profile?.username?.toLowerCase()) {
        router.push(`/${newUsername}`);
        router.refresh();
      }
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
            {(profile && !profile.username) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Username Required:</strong> Please set a username to enable your public profile page.
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Username {profile && !profile.username && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                required={!!(profile && !profile.username)}
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_-]+"
                className={`w-full px-3 py-2 border rounded-md ${
                  usernameError ? 'border-red-500' : ''
                }`}
                placeholder="username"
              />
              {checkingUsername && (
                <p className="text-xs text-gray-500 mt-1">Checking availability...</p>
              )}
              {usernameError && (
                <p className="text-xs text-red-600 mt-1">{usernameError}</p>
              )}
              {!usernameError && username && !checkingUsername && (
                <p className="text-xs text-green-600 mt-1">✓ Username available</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                3-30 characters, letters, numbers, underscores, and hyphens only. This will be your public profile URL.
              </p>
            </div>

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
              disabled={saving || !displayName || !contactInfo || (profile && !profile.username && !username) || !!usernameError || checkingUsername}
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
                    // Note: Matches will be recalculated on next page load
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
                  
                  // Optimistically update local state immediately (no DB refresh)
                  const updatedCards = cardSelections.map(({ cardId, quantity }) => {
                    const card = allCards.find(c => c.id === cardId);
                    return card ? { ...card, quantity: quantity || 1, relationId: cardId } : null;
                  }).filter(Boolean) as Array<Card & { quantity: number; relationId: string }>;
                  
                  // Sort updated cards
                  updatedCards.sort((a: any, b: any) => {
                    if (a.set_code !== b.set_code) {
                      return (a.set_code || '').localeCompare(b.set_code || '');
                    }
                    if (!a.sort_key && !b.sort_key) return 0;
                    if (!a.sort_key) return 1;
                    if (!b.sort_key) return -1;
                    return a.sort_key.localeCompare(b.sort_key, undefined, { numeric: true, sensitivity: 'base' });
                  });
                  
                  setHaveCards(updatedCards);
                  
                  // Save to DB in background, then recalculate matches
                  (async () => {
                    try {
                      // Remove all existing
                      const { error: deleteError } = await supabase
                        .from('profile_have_cards')
                        .delete()
                        .eq('profile_id', profile.id);
                      
                      if (deleteError) {
                        console.error('Error deleting cards:', deleteError);
                        // On error, refresh from DB to sync
                        await loadProfile(profile.user_id);
                        return;
                      }
                      
                      // Add new ones with quantities
                      if (cardSelections.length > 0) {
                        const { error: insertError } = await supabase
                          .from('profile_have_cards')
                          .insert(cardSelections.map(({ cardId, quantity }) => ({
                            profile_id: profile.id,
                            card_id: cardId,
                            quantity: quantity || 1,
                          })));
                        
                        if (insertError) {
                          console.error('Error inserting cards:', insertError);
                          // On error, refresh from DB to sync
                          await loadProfile(profile.user_id);
                          return;
                        }
                      }
                      
                      // Note: Matches will be recalculated on next page load
                      // This avoids timing issues and keeps the logic simple
                    } catch (err) {
                      console.error('Error saving cards:', err);
                      // On error, refresh from DB to sync
                      await loadProfile(profile.user_id);
                    }
                  })();
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
                  // Note: Matches will be recalculated on next page load
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
                
                // Optimistically update local state immediately (no DB refresh)
                const updatedCards = cardSelections.map(({ cardId, quantity }) => {
                  const card = allCards.find(c => c.id === cardId);
                  return card ? { ...card, quantity: quantity || 1, relationId: cardId } : null;
                }).filter(Boolean) as Array<Card & { quantity: number; relationId: string }>;
                
                // Sort updated cards
                updatedCards.sort((a: any, b: any) => {
                  if (a.set_code !== b.set_code) {
                    return (a.set_code || '').localeCompare(b.set_code || '');
                  }
                  if (!a.sort_key && !b.sort_key) return 0;
                  if (!a.sort_key) return 1;
                  if (!b.sort_key) return -1;
                  return a.sort_key.localeCompare(b.sort_key, undefined, { numeric: true, sensitivity: 'base' });
                });
                
                setWantCards(updatedCards);
                
                // Save to DB in background (don't wait or refresh)
                (async () => {
                  try {
                    // Remove all existing
                    const { error: deleteError } = await supabase
                      .from('profile_want_cards')
                      .delete()
                      .eq('profile_id', profile.id);
                    
                    if (deleteError) {
                      console.error('Error deleting cards:', deleteError);
                      // On error, refresh from DB to sync
                      await loadProfile(profile.user_id);
                      return;
                    }
                    
                    // Add new ones with quantities
                    if (cardSelections.length > 0) {
                      const { error: insertError } = await supabase
                        .from('profile_want_cards')
                        .insert(cardSelections.map(({ cardId, quantity }) => ({
                          profile_id: profile.id,
                          card_id: cardId,
                          quantity: quantity || 1,
                        })));
                      
                      if (insertError) {
                        console.error('Error inserting cards:', insertError);
                        // On error, refresh from DB to sync
                        await loadProfile(profile.user_id);
                        return;
                      }
                    }
                    
                      // Note: Matches will be recalculated on next page load
                      // This avoids timing issues and keeps the logic simple
                  } catch (err) {
                    console.error('Error saving cards:', err);
                    // On error, refresh from DB to sync
                    await loadProfile(profile.user_id);
                  }
                })();
              }}
            />
            </div>
          </>
        )}

        {profile && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-red-900 mb-2">Danger Zone</h3>
            <p className="text-xs text-red-700 mb-3">
              Deleting your account will permanently remove your profile, cards, and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={async () => {
                if (!confirm('Are you sure you want to delete your account? This action cannot be undone and will delete all your profile data, cards, and matches.')) {
                  return;
                }
                
                const supabase = createSupabaseClient();
                try {
                  // Delete profile (cascade will handle related data)
                  const { error } = await supabase
                    .from('profiles')
                    .delete()
                    .eq('id', profile.id);

                  if (error) throw error;

                  // Sign out
                  await supabase.auth.signOut();
                  
                  // Redirect to home
                  router.push('/');
                  router.refresh();
                } catch (err: any) {
                  alert('Error deleting account: ' + err.message);
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
            >
              Delete Account
            </button>
          </div>
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

