'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Card, Profile, ProfileHaveCard, ProfileWantCard } from '@/lib/supabase/types';
import { getCardDisplayName } from '@/lib/card-display';
import { detectAndStoreMatches } from '@/lib/match-storage';
import { sanitizeDisplayName, sanitizeContactInfo, sanitizeTradingLocations, sanitizeUsername } from '@/lib/sanitize-input';
import { generateCardListPDF, generateCardListPNG, generateCardListTextFile, CardForExport } from '@/lib/pdf-export';

const TAG_OPTIONS = [
  { value: null, label: 'None', emoji: '' },
  { value: '❗', label: 'Important', emoji: '❗' },
  { value: '❓', label: 'Question', emoji: '❓' },
  { value: '⏰', label: 'Urgent', emoji: '⏰' },
  { value: '💰', label: 'Price', emoji: '💰' },
];

const TAG_FILTER_OPTIONS = [
  { value: 'all', label: 'All tags' },
  { value: 'no-tag', label: 'No Tag' },
  ...TAG_OPTIONS.filter(opt => opt.value !== null).map(opt => ({ value: opt.value, label: `${opt.emoji} ${opt.label}` })),
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [haveCards, setHaveCards] = useState<Array<Card & { quantity: number; tag: string | null; relationId: string }>>([]);
  const [wantCards, setWantCards] = useState<Array<Card & { quantity: number; tag: string | null; relationId: string }>>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [selectedHaveTag, setSelectedHaveTag] = useState<string>('all');
  const [selectedWantTag, setSelectedWantTag] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [tradingLocations, setTradingLocations] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [exportingHavePDF, setExportingHavePDF] = useState(false);
  const [exportingWantPDF, setExportingWantPDF] = useState(false);
  const [exportingHavePNG, setExportingHavePNG] = useState(false);
  const [exportingWantPNG, setExportingWantPNG] = useState(false);
  const [downloadingHaveList, setDownloadingHaveList] = useState(false);
  const [downloadingWantList, setDownloadingWantList] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pngProgress, setPngProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      // Ignore AbortError - it's expected in development
      if (authError && (authError.message?.includes('AbortError') || authError.name === 'AbortError')) {
        console.log('[ProfilePage] Auth check aborted (normal in development)');
        setLoading(false);
        return;
      }

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
    } catch (err: any) {
      // Ignore AbortError - it's expected in development
      if (err?.name === 'AbortError' || err?.message?.includes('AbortError')) {
        console.log('[ProfilePage] Request aborted (normal in development)');
        setLoading(false);
        return;
      }
      console.error('[ProfilePage] Error in checkAuthAndLoad:', err);
      setLoading(false);
    }
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

      // Load have cards with quantities and tags, sorted by set_code then sort_key
      let haveQuery = supabase
        .from('profile_have_cards')
        .select('id, quantity, tag, cards(*)')
        .eq('profile_id', profileData.id);

      const { data: haveData, error: haveError } = await haveQuery;

      if (haveError && haveError.code === '42703') { // Column 'tag' does not exist
        console.warn("Column 'tag' not found, retrying query without 'tag' column.");
        const { data: haveDataFallback } = await supabase
          .from('profile_have_cards')
          .select('id, quantity, cards(*)')
          .eq('profile_id', profileData.id);
        
        if (haveDataFallback) {
          const cardsWithQuantity = haveDataFallback
            .map((item: any) => ({
              ...item.cards,
              quantity: item.quantity || 1,
              tag: null, // Default to null if column doesn't exist
              relationId: item.id,
            }))
            .filter((item: any) => item.id)
            .sort((a: any, b: any) => {
              if (a.set_code !== b.set_code) {
                return (a.set_code || '').localeCompare(b.set_code || '');
              }
              if (!a.sort_key && !b.sort_key) return 0;
              if (!a.sort_key) return 1;
              if (!b.sort_key) return -1;
              return a.sort_key.localeCompare(b.sort_key, undefined, { numeric: true, sensitivity: 'base' });
            });
          setHaveCards(cardsWithQuantity);
        }
      } else if (haveData) {

        const cardsWithQuantity = haveData
          .map((item: any) => ({
            ...item.cards,
            quantity: item.quantity || 1,
            tag: item.tag || null,
            relationId: item.id,
          }))
          .filter((item: any) => item.id)
          .sort((a: any, b: any) => {
            if (a.set_code !== b.set_code) {
              return (a.set_code || '').localeCompare(b.set_code || '');
            }
            if (!a.sort_key && !b.sort_key) return 0;
            if (!a.sort_key) return 1;
            if (!b.sort_key) return -1;
            return a.sort_key.localeCompare(b.sort_key, undefined, { numeric: true, sensitivity: 'base' });
          });
        setHaveCards(cardsWithQuantity);
      }

      // Load want cards with quantities and tags, sorted by set_code then sort_key
      let wantQuery = supabase
        .from('profile_want_cards')
        .select('id, quantity, tag, cards(*)')
        .eq('profile_id', profileData.id);

      const { data: wantData, error: wantError } = await wantQuery;

      if (wantError && wantError.code === '42703') { // Column 'tag' does not exist
        console.warn("Column 'tag' not found, retrying query without 'tag' column.");
        const { data: wantDataFallback } = await supabase
          .from('profile_want_cards')
          .select('id, quantity, cards(*)')
          .eq('profile_id', profileData.id);
        
        if (wantDataFallback) {
          const cardsWithQuantity = wantDataFallback
            .map((item: any) => ({
              ...item.cards,
              quantity: item.quantity || 1,
              tag: null, // Default to null if column doesn't exist
              relationId: item.id,
            }))
            .filter((item: any) => item.id)
            .sort((a: any, b: any) => {
              if (a.set_code !== b.set_code) {
                return (a.set_code || '').localeCompare(b.set_code || '');
              }
              if (!a.sort_key && !b.sort_key) return 0;
              if (!a.sort_key) return 1;
              if (!b.sort_key) return -1;
              return a.sort_key.localeCompare(b.sort_key, undefined, { numeric: true, sensitivity: 'base' });
            });
          setWantCards(cardsWithQuantity);
        }
      } else if (wantData) {
        const cardsWithQuantity = wantData
          .map((item: any) => ({
            ...item.cards,
            quantity: item.quantity || 1,
            tag: item.tag || null,
            relationId: item.id,
          }))
          .filter((item: any) => item.id)
          .sort((a: any, b: any) => {
            if (a.set_code !== b.set_code) {
              return (a.set_code || '').localeCompare(b.set_code || '');
            }
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
      
      // Sanitize all inputs before saving
      const sanitizedDisplayName = sanitizeDisplayName(displayName);
      const sanitizedContactInfo = sanitizeContactInfo(contactInfo);
      const sanitizedTradingLocations = sanitizeTradingLocations(tradingLocations);
      
      if (profile) {
        // Update existing profile
        const updateData: any = {
          display_name: sanitizedDisplayName,
          contact_info: sanitizedContactInfo,
          trading_locations: sanitizedTradingLocations || null,
          updated_at: new Date().toISOString(),
        };
        
        // Only update username if it changed or if profile doesn't have one
        if (username && (username.toLowerCase() !== profile.username?.toLowerCase() || !profile.username)) {
          const sanitizedUsername = sanitizeUsername(username);
          if (sanitizedUsername) {
            updateData.username = sanitizedUsername;
            newUsername = updateData.username;
          }
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

        const sanitizedUsername = sanitizeUsername(username);
        if (!sanitizedUsername) {
          setUsernameError('Invalid username');
          setSaving(false);
          return;
        }

        newUsername = sanitizedUsername;
        const { data: newProfile, error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            display_name: sanitizedDisplayName,
            contact_info: sanitizedContactInfo,
            trading_locations: sanitizedTradingLocations || null,
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
            <Link href="/" className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
              Home
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          
          <div className="space-y-4">
            {(profile && !profile.username) && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded p-3 mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
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
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  usernameError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="username"
              />
              {checkingUsername && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Checking availability...</p>
              )}
              {usernameError && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{usernameError}</p>
              )}
              {!usernameError && username && !checkingUsername && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Username available</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                3-30 characters, letters, numbers, underscores, and hyphens only. This will be your public profile URL.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Your name or username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contact Info</label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Telegram, Discord, email, phone, etc."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This will be visible to other users who want to trade with you.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Trading Locations</label>
              <input
                type="text"
                value={tradingLocations}
                onChange={(e) => setTradingLocations(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Can be a city (Tel Aviv, Jerusalem), Store (Sirolynia, Topdeck, Rotemz), Deliveries (Locker Done), etc."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Cards I Have ({haveCards.length})</h2>
                <div className="flex gap-2 items-center">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Filter by tag:</label>
                  <select
                    value={selectedHaveTag}
                    onChange={(e) => setSelectedHaveTag(e.target.value)}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {TAG_FILTER_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 items-center mb-4">
                <div className="flex gap-2 items-center">
                  <button
                    onClick={async () => {
                      const filteredCards = selectedHaveTag === 'all' 
                        ? haveCards 
                        : selectedHaveTag === 'no-tag'
                        ? haveCards.filter(card => !card.tag || card.tag === null)
                        : haveCards.filter(card => card.tag === selectedHaveTag);
                      
                      if (filteredCards.length === 0) {
                        alert('No cards to download');
                        return;
                      }
                      setDownloadingHaveList(true);
                      try {
                        const cardsForExport: CardForExport[] = filteredCards.map(card => ({
                          id: card.id,
                          name: card.name,
                          image_url: card.image_url,
                          rarity: card.rarity,
                          quantity: card.quantity,
                          tag: card.tag,
                          public_code: card.public_code,
                          set_code: card.set_code,
                          collector_number: card.collector_number,
                          metadata: card.metadata,
                        }));
                        generateCardListTextFile(cardsForExport, 'Cards I Have', (card) => getCardDisplayName(card as Card));
                      } catch (error) {
                        console.error('Error generating text file:', error);
                        alert('Error generating text file. Please try again.');
                      } finally {
                        setDownloadingHaveList(false);
                      }
                    }}
                    disabled={downloadingHaveList || haveCards.length === 0}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {downloadingHaveList ? 'Downloading...' : 'Download List'}
                  </button>
                  <button
                    onClick={async () => {
                      const filteredCards = selectedHaveTag === 'all' 
                        ? haveCards 
                        : selectedHaveTag === 'no-tag'
                        ? haveCards.filter(card => !card.tag || card.tag === null)
                        : haveCards.filter(card => card.tag === selectedHaveTag);
                      
                      if (filteredCards.length === 0) {
                        alert('No cards to export');
                        return;
                      }
                      setExportingHavePDF(true);
                      try {
                        const cardsForExport: CardForExport[] = filteredCards.map(card => ({
                          id: card.id,
                          name: card.name,
                          image_url: card.image_url,
                          rarity: card.rarity,
                          quantity: card.quantity,
                          tag: card.tag,
                          public_code: card.public_code,
                          set_code: card.set_code,
                          collector_number: card.collector_number,
                          metadata: card.metadata,
                        }));
                        setPdfProgress(0);
                        await generateCardListPDF(cardsForExport, 'Cards I Have', (progress) => {
                          setPdfProgress(progress);
                        }, selectedHaveTag === 'all' || selectedHaveTag === 'no-tag' ? null : selectedHaveTag);
                      } catch (error) {
                        console.error('Error generating PDF:', error);
                        alert('Error generating PDF. Please try again.');
                      } finally {
                        setExportingHavePDF(false);
                        setPdfProgress(0);
                      }
                    }}
                    disabled={exportingHavePDF || haveCards.length === 0}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {exportingHavePDF ? `Generating... ${pdfProgress}%` : 'Export PDF'}
                  </button>
                  <button
                    onClick={async () => {
                      const filteredCards = selectedHaveTag === 'all' 
                        ? haveCards 
                        : selectedHaveTag === 'no-tag'
                        ? haveCards.filter(card => !card.tag || card.tag === null)
                        : haveCards.filter(card => card.tag === selectedHaveTag);
                      
                      if (filteredCards.length === 0) {
                        alert('No cards to export');
                        return;
                      }
                      setExportingHavePNG(true);
                      try {
                        const cardsForExport: CardForExport[] = filteredCards.map(card => ({
                          id: card.id,
                          name: card.name,
                          image_url: card.image_url,
                          rarity: card.rarity,
                          quantity: card.quantity,
                          tag: card.tag,
                          public_code: card.public_code,
                          set_code: card.set_code,
                          collector_number: card.collector_number,
                          metadata: card.metadata,
                        }));
                        setPngProgress(0);
                        await generateCardListPNG(cardsForExport, 'Cards I Have', (progress) => {
                          setPngProgress(progress);
                        }, selectedHaveTag === 'all' || selectedHaveTag === 'no-tag' ? null : selectedHaveTag);
                      } catch (error) {
                        console.error('Error generating PNG:', error);
                        alert('Error generating PNG. Please try again.');
                      } finally {
                        setExportingHavePNG(false);
                        setPngProgress(0);
                      }
                    }}
                    disabled={exportingHavePNG || haveCards.length === 0}
                    className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                  >
                    {exportingHavePNG ? `Generating... ${pngProgress}%` : 'Export PNG'}
                  </button>
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
                    className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select cards from your collection that you're willing to trade.
              </p>
              <CardSelectorWithQuantity
                allCards={allCards}
                selectedCards={haveCards}
                onSelectionChange={async (cardSelections: Array<{ cardId: string; quantity: number; tag: string | null }>) => {
                  const supabase = createSupabaseClient();
                  
                  // Optimistically update local state immediately (no DB refresh)
                  const updatedCards = cardSelections.map(({ cardId, quantity, tag }) => {
                    const card = allCards.find(c => c.id === cardId);
                    return card ? { ...card, quantity: quantity || 1, tag: tag || null, relationId: cardId } : null;
                  }).filter(Boolean) as Array<Card & { quantity: number; tag: string | null; relationId: string }>;
                  
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
                      
                      // Add new ones with quantities and tags
                      if (cardSelections.length > 0) {
                        // Explicitly handle null tags - Supabase needs null, not undefined
                        const insertData = cardSelections.map(({ cardId, quantity, tag }) => ({
                          profile_id: profile.id,
                          card_id: cardId,
                          quantity: quantity || 1,
                          tag: tag === null || tag === undefined ? null : tag,
                        }));
                        
                        const { error: insertError } = await supabase
                          .from('profile_have_cards')
                          .insert(insertData);
                        
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

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Cards I Want ({wantCards.length})</h2>
              <div className="flex gap-2 items-center">
                <label className="text-sm text-gray-600 dark:text-gray-400">Filter by tag:</label>
                <select
                  value={selectedWantTag}
                  onChange={(e) => setSelectedWantTag(e.target.value)}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {TAG_FILTER_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 items-center mb-4">
              <div className="flex gap-2 items-center">
                <button
                  onClick={async () => {
                    const filteredCards = selectedWantTag === 'all' 
                      ? wantCards 
                      : selectedWantTag === 'no-tag'
                      ? wantCards.filter(card => !card.tag || card.tag === null)
                      : wantCards.filter(card => card.tag === selectedWantTag);
                    
                    if (filteredCards.length === 0) {
                      alert('No cards to download');
                      return;
                    }
                    setDownloadingWantList(true);
                    try {
                      const cardsForExport: CardForExport[] = filteredCards.map(card => ({
                        id: card.id,
                        name: card.name,
                        image_url: card.image_url,
                        rarity: card.rarity,
                        quantity: card.quantity,
                        tag: card.tag,
                        public_code: card.public_code,
                        set_code: card.set_code,
                        collector_number: card.collector_number,
                        metadata: card.metadata,
                      }));
                      generateCardListTextFile(cardsForExport, 'Cards I Want', (card) => getCardDisplayName(card as Card));
                    } catch (error) {
                      console.error('Error generating text file:', error);
                      alert('Error generating text file. Please try again.');
                    } finally {
                      setDownloadingWantList(false);
                    }
                  }}
                  disabled={downloadingWantList || wantCards.length === 0}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {downloadingWantList ? 'Downloading...' : 'Download List'}
                </button>
                <button
                  onClick={async () => {
                    const filteredCards = selectedWantTag === 'all' 
                      ? wantCards 
                      : selectedWantTag === 'no-tag'
                      ? wantCards.filter(card => !card.tag || card.tag === null)
                      : wantCards.filter(card => card.tag === selectedWantTag);
                    
                    if (filteredCards.length === 0) {
                      alert('No cards to export');
                      return;
                    }
                    setExportingWantPDF(true);
                    try {
                      const cardsForExport: CardForExport[] = filteredCards.map(card => ({
                        id: card.id,
                        name: card.name,
                        image_url: card.image_url,
                        rarity: card.rarity,
                        quantity: card.quantity,
                        tag: card.tag,
                        public_code: card.public_code,
                        set_code: card.set_code,
                        collector_number: card.collector_number,
                        metadata: card.metadata,
                      }));
                      setPdfProgress(0);
                      await generateCardListPDF(cardsForExport, 'Cards I Want', (progress) => {
                        setPdfProgress(progress);
                      }, selectedWantTag === 'all' || selectedWantTag === 'no-tag' ? null : selectedWantTag);
                    } catch (error) {
                      console.error('Error generating PDF:', error);
                      alert('Error generating PDF. Please try again.');
                    } finally {
                      setExportingWantPDF(false);
                      setPdfProgress(0);
                    }
                  }}
                  disabled={exportingWantPDF || wantCards.length === 0}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {exportingWantPDF ? `Generating... ${pdfProgress}%` : 'Export PDF'}
                </button>
                <button
                  onClick={async () => {
                    const filteredCards = selectedWantTag === 'all' 
                      ? wantCards 
                      : selectedWantTag === 'no-tag'
                      ? wantCards.filter(card => !card.tag || card.tag === null)
                      : wantCards.filter(card => card.tag === selectedWantTag);
                    
                    if (filteredCards.length === 0) {
                      alert('No cards to export');
                      return;
                    }
                    setExportingWantPNG(true);
                    try {
                      const cardsForExport: CardForExport[] = filteredCards.map(card => ({
                        id: card.id,
                        name: card.name,
                        image_url: card.image_url,
                        rarity: card.rarity,
                        quantity: card.quantity,
                        tag: card.tag,
                        public_code: card.public_code,
                        set_code: card.set_code,
                        collector_number: card.collector_number,
                        metadata: card.metadata,
                      }));
                      setPngProgress(0);
                      await generateCardListPNG(cardsForExport, 'Cards I Want', (progress) => {
                        setPngProgress(progress);
                      }, selectedWantTag === 'all' || selectedWantTag === 'no-tag' ? null : selectedWantTag);
                    } catch (error) {
                      console.error('Error generating PNG:', error);
                      alert('Error generating PNG. Please try again.');
                    } finally {
                      setExportingWantPNG(false);
                      setPngProgress(0);
                    }
                  }}
                  disabled={exportingWantPNG || wantCards.length === 0}
                  className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {exportingWantPNG ? `Generating... ${pngProgress}%` : 'Export PNG'}
                </button>
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
                  className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select cards you're looking to acquire.
            </p>
            <CardSelectorWithQuantity
              allCards={allCards}
              selectedCards={wantCards}
              onSelectionChange={async (cardSelections: Array<{ cardId: string; quantity: number; tag: string | null }>) => {
                const supabase = createSupabaseClient();
                
                // Optimistically update local state immediately (no DB refresh)
                const updatedCards = cardSelections.map(({ cardId, quantity, tag }) => {
                  const card = allCards.find(c => c.id === cardId);
                  return card ? { ...card, quantity: quantity || 1, tag: tag || null, relationId: cardId } : null;
                }).filter(Boolean) as Array<Card & { quantity: number; tag: string | null; relationId: string }>;
                
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
                    
                    // Add new ones with quantities and tags
                    if (cardSelections.length > 0) {
                      // Explicitly handle null tags - Supabase needs null, not undefined
                      const insertData = cardSelections.map(({ cardId, quantity, tag }) => ({
                        profile_id: profile.id,
                        card_id: cardId,
                        quantity: quantity || 1,
                        tag: tag === null || tag === undefined || tag === '' ? null : tag,
                      }));
                      
                      const { error: insertError } = await supabase
                        .from('profile_want_cards')
                        .insert(insertData);
                      
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
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-2">Danger Zone</h3>
            <p className="text-xs text-red-700 dark:text-red-300 mb-3">
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
  selectedCards: Array<Card & { quantity: number; tag: string | null; relationId?: string }>;
  onSelectionChange: (selections: Array<{ cardId: string; quantity: number; tag: string | null }>) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [localSelections, setLocalSelections] = useState<Map<string, { quantity: number; tag: string | null }>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize local selections from props
  useEffect(() => {
    const map = new Map<string, { quantity: number; tag: string | null }>();
    selectedCards.forEach(card => {
      map.set(card.id, { quantity: card.quantity || 1, tag: card.tag || null });
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
  
  const updateCardSelection = (cardId: string, quantity: number, tag: string | null | undefined = undefined) => {
    // Optimistic UI update - update local state immediately
    const newSelections = new Map(selectedMap);
    if (quantity > 0) {
      const existing = newSelections.get(cardId);
      // If tag is explicitly provided (including null), use it; otherwise preserve existing
      const newTag = tag !== undefined ? tag : (existing?.tag || null);
      newSelections.set(cardId, { quantity, tag: newTag });
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
      const selectionsArray: Array<{ cardId: string; quantity: number; tag: string | null }> = [];
      newSelections.forEach((data, id) => {
        selectionsArray.push({ cardId: id, quantity: data.quantity, tag: data.tag });
      });
      
      await onSelectionChange(selectionsArray);
      setIsSaving(false);
    }, 500);
  };
  
  const updateCardTag = (cardId: string, tag: string | null) => {
    const existing = selectedMap.get(cardId);
    if (existing) {
      // If tag is empty string from select, convert to null
      const normalizedTag = tag === '' ? null : tag;
      updateCardSelection(cardId, existing.quantity, normalizedTag);
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search cards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
        <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
          <input
            type="checkbox"
            checked={showOnlySelected}
            onChange={(e) => setShowOnlySelected(e.target.checked)}
            className="cursor-pointer"
          />
          <span className="text-sm">Show only selected</span>
        </label>
      </div>
      
      <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800">
        {filteredCards.map((card) => {
          const isSelected = selectedMap.has(card.id);
          const selection = selectedMap.get(card.id);
          const quantity = selection?.quantity || 1;
          const tag = selection?.tag || null;
          
          return (
            <div
              key={card.id}
              className={`flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateCardSelection(card.id, 1, null);
                  } else {
                    updateCardSelection(card.id, 0);
                  }
                }}
                className="cursor-pointer"
              />
              <span className="text-sm flex-1">{getCardDisplayName(card)}</span>
              {isSelected && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400">Qty:</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      const newQty = parseInt(e.target.value) || 1;
                      updateCardSelection(card.id, newQty, tag);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <label className="text-xs text-gray-600 dark:text-gray-400">Tag:</label>
                  <select
                    value={tag || ''}
                    onChange={(e) => {
                      const newTag = e.target.value || null;
                      updateCardTag(card.id, newTag);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {TAG_OPTIONS.map(option => (
                      <option key={option.value || 'none'} value={option.value || ''}>
                        {option.emoji} {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {selectedMap.size} card(s) selected
        </p>
        {isSaving && (
          <p className="text-xs text-blue-500 dark:text-blue-400">Saving...</p>
        )}
      </div>
    </div>
  );
}

