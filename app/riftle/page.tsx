'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { createSupabaseClient } from '@/lib/supabase/client';
import { ATTRIBUTE_LABELS, ATTRIBUTE_TYPES, type AttributeFeedback, extractCardAttributes, generateFeedback, isCorrectGuess } from '@/lib/riftle/feedback';
import { RIFTLE_CONFIG } from '@/lib/riftle/config';
import { getCountryFlag } from '@/lib/geo-utils';
import RiftleTutorial from '@/components/RiftleTutorial';
import RiftleDailyPlaysChart from '@/components/RiftleDailyPlaysChart';

interface Card {
  id: string;
  name: string;
  set_code: string;
  collector_number: string;
  rarity: string | null;
}

interface GuessHistoryItem {
  card_id: string;
  card_name: string;
  set_code?: string;
  collector_number?: string;
  attributes: any;
  feedback: AttributeFeedback;
  timestamp: string;
}

interface Stats {
  totalGames: number;
  wins: number;
  failedGames: number;
  winPercent: number;
  currentStreak: number;
  maxStreak: number;
  averageGuesses: number;
  solvedDistribution: Record<string, number>;
  recentGames: Array<{
    date: string;
    guessesUsed: number;
    isSolved: boolean;
    timeInSeconds: number;
  }>;
}

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  countryFlag: string;
  isSolved?: boolean;
  guessesUsed?: number;
  timeInSeconds?: number;
  totalGames?: number;
  wins?: number;
  winPercent?: number;
  averageGuesses?: number;
  totalScore?: number;
}

export default function RiftlePage() {
  const [user, setUser] = useState<any>(null);
  const [isTradingEnabled, setIsTradingEnabled] = useState(true);
  const [puzzleId, setPuzzleId] = useState<string | null>(null);
  const [puzzleDate, setPuzzleDate] = useState<string | null>(null);
  const [puzzleCard, setPuzzleCard] = useState<any>(null); // Store the actual puzzle card for comparison
  const [guessHistory, setGuessHistory] = useState<GuessHistoryItem[]>([]);
  const [guessesUsed, setGuessesUsed] = useState(0);
  const [maxGuesses] = useState(RIFTLE_CONFIG.MAX_GUESSES);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [answer, setAnswer] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // Elapsed time in seconds
  const [isTimerActive, setIsTimerActive] = useState(true); // Track if timer should run
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardType, setLeaderboardType] = useState<'daily' | 'alltime-wins' | 'alltime-winpct' | 'alltime-avgguesses' | 'alltime-score'>('daily');
  
  // Track if user just selected from dropdown to prevent reopening
  const [justSelected, setJustSelected] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Track copy button state
  const [copied, setCopied] = useState(false);
  
  // Tutorial state
  const [showTutorial, setShowTutorial] = useState<'intro' | 'feedback' | null>(null);
  const [tutorialSeenIntro, setTutorialSeenIntro] = useState(false);
  const [tutorialSeenFeedback, setTutorialSeenFeedback] = useState(false);
  
  // Load user on mount
  useEffect(() => {
    loadUser();
    // Load tutorial flags from localStorage for anonymous users
    loadTutorialFlags();
  }, []);
  
  // Check tutorial flags when loading finishes
  useEffect(() => {
    if (!loading && !tutorialSeenIntro && guessHistory.length === 0) {
      setShowTutorial('intro');
    }
  }, [loading, tutorialSeenIntro, guessHistory.length]);
  
  // Load puzzle and stats when user changes (or is confirmed as null)
  useEffect(() => {
    loadPuzzle(); // Reload puzzle with user context
    if (user) {
      loadStats();
    }
  }, [user]);
  
  // Load leaderboard when type changes
  useEffect(() => {
    loadLeaderboard();
  }, [leaderboardType]);
  
  // Fetch card suggestions when search query changes
  useEffect(() => {
    // Don't show dropdown if user just selected a card
    if (justSelected) {
      return;
    }
    
    if (searchQuery.length >= 2) {
      fetchSuggestions(searchQuery);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);
  
  // Timer effect - only runs when tab is visible and game not over
  useEffect(() => {
    if (gameOver || loading) {
      // Stop timer if game is over or still loading
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }
    
    // Start timer
    timerIntervalRef.current = setInterval(() => {
      if (isTimerActive) {
        setElapsedTime(prev => prev + 1);
      }
    }, 1000);
    
    // Cleanup on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [gameOver, loading, isTimerActive]);
  
  // Visibility change effect - pause timer when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTimerActive(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  function loadTutorialFlags() {
    // Load tutorial flags from localStorage for anonymous users
    try {
      const seenIntro = localStorage.getItem('riftle_tutorial_seen_intro') === 'true';
      const seenFeedback = localStorage.getItem('riftle_tutorial_seen_feedback') === 'true';
      setTutorialSeenIntro(seenIntro);
      setTutorialSeenFeedback(seenFeedback);
    } catch (error) {
      console.error('Error loading tutorial flags from localStorage:', error);
    }
  }
  
  async function loadUser() {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }
  
  async function loadPuzzle() {
    try {
      const supabase = createSupabaseClient();
      
      // Get today's puzzle
      const today = new Date().toISOString().split('T')[0];
      const { data: puzzle, error: puzzleError } = await supabase
        .from('daily_cards')
        .select(`
          id,
          puzzle_date,
          card_id,
          cards (
            id,
            name,
            set_code,
            collector_number,
            rarity,
            image_url,
            metadata
          )
        `)
        .lte('puzzle_date', today)
        .order('puzzle_date', { ascending: false })
        .limit(1)
        .single();
      
      if (puzzleError || !puzzle) {
        console.error('No puzzle available:', puzzleError);
        setLoading(false);
        return;
      }
      
      setPuzzleId(puzzle.id);
      setPuzzleDate(puzzle.puzzle_date);
      setPuzzleCard((puzzle as any).cards); // Store the actual card for comparison
      
      // Load user's guess state if authenticated
      if (user) {
        const { data: guessData } = await supabase
          .from('guesses')
          .select('*')
          .eq('user_id', user.id)
          .eq('puzzle_id', puzzle.id)
          .maybeSingle();
        
        if (guessData) {
          setGuessHistory(guessData.guess_history || []);
          setGuessesUsed(guessData.guesses_used || 0);
          setElapsedTime(guessData.time_taken_seconds || 0); // Load saved time
          const isComplete = guessData.is_solved || guessData.guesses_used >= maxGuesses;
          setGameOver(isComplete);
          setWon(guessData.is_solved);
          
          // Show answer if game was already completed
          if (isComplete) {
            setAnswer({
              id: (puzzle as any).cards.id,
              name: (puzzle as any).cards.name,
              set_code: (puzzle as any).cards.set_code,
              collector_number: (puzzle as any).cards.collector_number,
              rarity: (puzzle as any).cards.rarity,
              attributes: extractCardAttributes((puzzle as any).cards),
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading puzzle:', error);
    } finally {
      setLoading(false);
    }
  }
  
  async function fetchSuggestions(query: string) {
    try {
      const response = await fetch(`/api/riftle/cards?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSuggestions(data.cards || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  }
  
  async function submitGuess() {
    if (!selectedCard || !puzzleId || !puzzleCard || submitting || gameOver) return;
    
    setSubmitting(true);
    
    try {
      const supabase = createSupabaseClient();
      const timeInSeconds = elapsedTime; // Use elapsed time from timer
      
      // Get full card data for the guessed card
      const { data: guessedCardData, error: cardError } = await supabase
        .from('cards')
        .select('*')
        .eq('id', selectedCard.id)
        .single();
      
      if (cardError || !guessedCardData) {
        console.error('Error fetching guessed card:', cardError);
        setSubmitting(false);
        return;
      }
      
      // Generate feedback by comparing guessed card with puzzle card
      const feedback = generateFeedback(guessedCardData, puzzleCard);
      const correct = isCorrectGuess(guessedCardData, puzzleCard);
      const guessedAttributes = extractCardAttributes(guessedCardData);
      
      // Add guess to history
      const newGuess: GuessHistoryItem = {
        card_id: selectedCard.id,
        card_name: selectedCard.name,
        set_code: selectedCard.set_code,
        collector_number: selectedCard.collector_number,
        attributes: guessedAttributes,
        feedback: feedback,
        timestamp: new Date().toISOString(),
      };
      
      const updatedHistory = [...guessHistory, newGuess];
      const newGuessesUsed = updatedHistory.length;
      const isGameOver = correct || newGuessesUsed >= maxGuesses;
      
      // Update local state
      setGuessHistory(updatedHistory);
      setGuessesUsed(newGuessesUsed);
      setGameOver(isGameOver);
      setWon(correct);
      
      // Show answer if game over
      if (isGameOver) {
        setAnswer({
          id: puzzleCard.id,
          name: puzzleCard.name,
          set_code: puzzleCard.set_code,
          collector_number: puzzleCard.collector_number,
          rarity: puzzleCard.rarity,
          attributes: extractCardAttributes(puzzleCard),
        });
      }
      
      // Save to database if user is authenticated
      if (user) {
        const { error: upsertError } = await supabase
          .from('guesses')
          .upsert({
            user_id: user.id,
            puzzle_id: puzzleId,
            guess_history: updatedHistory,
            guesses_used: newGuessesUsed,
            is_solved: correct,
            time_taken_seconds: timeInSeconds,
            total_score: correct ? (maxGuesses - newGuessesUsed + 1) : 0,
            submitted_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,puzzle_id'
          });
        
        if (upsertError) {
          console.error('Error saving guess:', upsertError);
        }
        
        // Update user stats if game is complete
        if (isGameOver) {
          await updateUserStatsClientSide(user.id, newGuessesUsed, correct);
          setTimeout(() => loadStats(), 500);
        }
      }
      
      // Clear selection
      setSearchQuery('');
      setSelectedCard(null);
      setSuggestions([]);
      
      // Show feedback tutorial after first guess if user hasn't seen it (works for both authenticated and anonymous)
      if (newGuessesUsed === 1 && !tutorialSeenFeedback) {
        setTimeout(() => setShowTutorial('feedback'), 500);
      }
      
      // Reload leaderboard if game over
      if (isGameOver) {
        setTimeout(() => loadLeaderboard(), 500);
      }
    } catch (error) {
      console.error('Error submitting guess:', error);
    } finally {
      setSubmitting(false);
    }
  }
  
  async function updateUserStatsClientSide(userId: string, guessesUsed: number, isSolved: boolean) {
    const supabase = createSupabaseClient();
    
    // Get current stats
    const { data: currentStats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    const totalGames = (currentStats?.total_games || 0) + 1;
    const failedGames = (currentStats?.failed_games || 0) + (isSolved ? 0 : 1);
    const solvedDistribution = currentStats?.solved_distribution || {};
    
    if (isSolved) {
      solvedDistribution[guessesUsed] = (solvedDistribution[guessesUsed] || 0) + 1;
    }
    
    // Calculate streaks
    const lastPlayedDate = currentStats?.last_played_date;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let currentStreak = currentStats?.current_streak || 0;
    if (isSolved) {
      if (!lastPlayedDate || lastPlayedDate === yesterday) {
        currentStreak += 1;
      } else if (lastPlayedDate !== today) {
        currentStreak = 1;
      }
    } else {
      currentStreak = 0;
    }
    
    const maxStreak = Math.max(currentStreak, currentStats?.max_streak || 0);
    
    // Calculate average guesses (only for solved puzzles)
    const totalSolved = totalGames - failedGames;
    const totalGuessesForSolved = Object.entries(solvedDistribution).reduce(
      (sum, [guesses, count]) => sum + (parseInt(guesses) * (count as number)),
      0
    );
    const averageGuesses = totalSolved > 0 ? totalGuessesForSolved / totalSolved : 0;
    
    // Upsert stats
    await supabase
      .from('user_stats')
      .upsert({
        user_id: userId,
        total_games: totalGames,
        failed_games: failedGames,
        solved_distribution: solvedDistribution,
        current_streak: currentStreak,
        max_streak: maxStreak,
        average_guesses: averageGuesses,
        total_score: (currentStats?.total_score || 0) + (isSolved ? (maxGuesses - guessesUsed + 1) : 0),
        last_played_date: today,
      }, {
        onConflict: 'user_id'
      });
  }
  
  async function loadStats() {
    if (!user) return;
    
    try {
      const supabase = createSupabaseClient();
      
      // Get user stats directly from database
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle no results
      
      if (statsError) {
        console.error('Error fetching user stats:', statsError);
        return;
      }
      
      // Load tutorial flags
      if (statsData) {
        setTutorialSeenIntro(statsData.tutorial_seen_intro || false);
        setTutorialSeenFeedback(statsData.tutorial_seen_feedback || false);
        
        // Show intro tutorial if user hasn't seen it and hasn't played yet
        if (!statsData.tutorial_seen_intro && statsData.total_games === 0 && !loading) {
          setShowTutorial('intro');
        }
      } else {
        // New user - show intro tutorial
        setTutorialSeenIntro(false);
        setTutorialSeenFeedback(false);
        if (!loading) {
          setShowTutorial('intro');
        }
      }
      
      // Get recent games
      const { data: recentGames, error: gamesError } = await supabase
        .from('guesses')
        .select(`
          id,
          puzzle_id,
          guesses_used,
          is_solved,
          time_taken_seconds,
          submitted_at,
          daily_cards (
            puzzle_date
          )
        `)
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(10);
      
      if (gamesError) {
        console.error('Error fetching recent games:', gamesError);
      }
      
      // Calculate stats
      const totalGames = statsData?.total_games || 0;
      const failedGames = statsData?.failed_games || 0;
      const wins = totalGames - failedGames;
      const winPercent = totalGames > 0 ? (wins / totalGames) * 100 : 0;
      
      const formattedGames = (recentGames || []).map(game => ({
        date: (game as any).daily_cards?.puzzle_date || null,
        guessesUsed: game.guesses_used,
        isSolved: game.is_solved,
        timeInSeconds: game.time_taken_seconds,
      }));
      
      setStats({
        totalGames,
        wins,
        failedGames,
        winPercent: Math.round(winPercent * 10) / 10,
        solvedDistribution: statsData?.solved_distribution || {},
        currentStreak: statsData?.current_streak || 0,
        maxStreak: statsData?.max_streak || 0,
        averageGuesses: statsData?.average_guesses || 0,
        recentGames: formattedGames,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }
  
  async function loadLeaderboard() {
    try {
      const supabase = createSupabaseClient();
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's puzzle (or most recent if today doesn't exist)
      const { data: todayPuzzle } = await supabase
        .from('daily_cards')
        .select('id, puzzle_date')
        .lte('puzzle_date', today)
        .order('puzzle_date', { ascending: false })
        .limit(1)
        .single();
      
      if (!todayPuzzle) {
        console.log('No puzzle found for leaderboard');
        setLeaderboard([]);
        return;
      }
      
      console.log('Loading leaderboard for puzzle:', todayPuzzle.puzzle_date, 'ID:', todayPuzzle.id);
      
      // Get today's FINISHED games only (solved OR used max guesses)
      const { data: allEntries, error } = await supabase
        .from('guesses')
        .select('user_id, guesses_used, is_solved, time_taken_seconds')
        .eq('puzzle_id', todayPuzzle.id)
        .limit(100);
      
      if (error) {
        console.error('Error loading leaderboard:', error);
        return;
      }
      
      console.log('Raw entries from database:', allEntries?.length || 0, allEntries);
      
      // Filter to only finished games (solved OR max guesses used)
      const entries = (allEntries || []).filter(entry =>
        entry.is_solved || entry.guesses_used >= maxGuesses
      );
      
      console.log('Filtered finished entries (solved OR >= maxGuesses):', entries?.length || 0, 'maxGuesses:', maxGuesses, entries);
      
      if (!entries || entries.length === 0) {
        console.log('No entries found - leaderboard will be empty');
        setLeaderboard([]);
        return;
      }
      
      // Get user IDs
      const userIds = entries.map(e => e.user_id);
      
      // Get profiles for these users (including country for flag)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, username, country')
        .in('user_id', userIds);
      
      // Create a map of user_id to display info (with fallback to username)
      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, {
          displayName: p.display_name,
          username: p.username,
          country: p.country
        }])
      );
      
      // Sort entries: wins first (by guesses, then time), then losses (by time)
      const sortedEntries = [...entries].sort((a, b) => {
        // Wins come before losses
        if (a.is_solved !== b.is_solved) {
          return a.is_solved ? -1 : 1;
        }
        
        // For wins: sort by guesses used, then time
        if (a.is_solved && b.is_solved) {
          if (a.guesses_used !== b.guesses_used) {
            return a.guesses_used - b.guesses_used;
          }
          return a.time_taken_seconds - b.time_taken_seconds;
        }
        
        // For losses: sort by time only
        return a.time_taken_seconds - b.time_taken_seconds;
      });
      
      // Format entries with rank, display names, and country flags
      const formattedEntries = sortedEntries.map((entry, index) => {
        const profile = profileMap.get(entry.user_id);
        const displayName = profile?.displayName || profile?.username || 'Anonymous';
        const countryFlag = getCountryFlag(profile?.country || null);
        
        return {
          rank: index + 1,
          displayName,
          countryFlag,
          guessesUsed: entry.guesses_used,
          timeInSeconds: entry.time_taken_seconds,
          isSolved: entry.is_solved,
        };
      });
      
      setLeaderboard(formattedEntries);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  }
  
  async function handleTutorialClose() {
    if (!showTutorial) {
      setShowTutorial(null);
      return;
    }
    
    try {
      // Update local state
      if (showTutorial === 'intro') {
        setTutorialSeenIntro(true);
        localStorage.setItem('riftle_tutorial_seen_intro', 'true');
      } else if (showTutorial === 'feedback') {
        setTutorialSeenFeedback(true);
        localStorage.setItem('riftle_tutorial_seen_feedback', 'true');
      }
      
      // Also mark in database if user is authenticated
      // Use Supabase client directly instead of API call to avoid auth issues
      if (user) {
        const supabase = createSupabaseClient();
        const updateField = showTutorial === 'intro' ? 'tutorial_seen_intro' : 'tutorial_seen_feedback';
        
        // Check if user_stats exists
        const { data: existingStats } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (existingStats) {
          // Update existing stats
          await supabase
            .from('user_stats')
            .update({
              [updateField]: true,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);
        } else {
          // Create new stats row with defaults
          await supabase
            .from('user_stats')
            .insert({
              user_id: user.id,
              total_games: 0,
              failed_games: 0,
              current_streak: 0,
              max_streak: 0,
              total_score: 0,
              average_guesses: 0,
              solved_distribution: {},
              [updateField]: true,
              updated_at: new Date().toISOString(),
            });
        }
      }
    } catch (error) {
      console.error('Error marking tutorial as seen:', error);
    }
    
    setShowTutorial(null);
  }
  
  function getFeedbackColor(feedback: string, type: 'categorical' | 'numeric'): string {
    if (type === 'categorical') {
      return feedback === 'correct' ? 'bg-green-500' : 'bg-red-500';
    } else {
      if (feedback === 'exact') return 'bg-green-500';
      if (feedback === 'high') return 'bg-orange-500';
      if (feedback === 'low') return 'bg-blue-500';
      return 'bg-gray-500';
    }
  }
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading puzzle...</div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Tutorial Overlay */}
      {showTutorial && (
        <RiftleTutorial
          step={showTutorial}
          onClose={handleTutorialClose}
        />
      )}
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Riftle</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Guess the Riftbound card in {maxGuesses} tries
        </p>
        {puzzleDate && (
          <p className="text-sm text-gray-500 mt-2">
            Puzzle for {new Date(puzzleDate).toLocaleDateString()}
          </p>
        )}
        {!gameOver && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Time: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
          </p>
        )}
        {!user && (
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
            Sign in to save your progress and compete on the leaderboard
          </p>
        )}
      </div>
      
      {/* Regional Banner for International Users */}
      {user && !isTradingEnabled && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Welcome to Riftle!
              </h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                Trading features aren't available in your region, but you can enjoy the daily puzzle and compete on the global leaderboard!
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Game Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        {/* Input */}
        {!gameOver && (
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setJustSelected(false); // User is manually typing, allow dropdown
                }}
                placeholder="Type a card name..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                disabled={submitting}
              />
              
              {/* Suggestions dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => {
                        setSelectedCard(card);
                        setSearchQuery(card.name);
                        setSuggestions([]);
                        setJustSelected(true); // Mark that user just selected from dropdown
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex justify-between items-center"
                    >
                      <span>{card.name}</span>
                      <span className="text-sm text-gray-500">{card.set_code} #{card.collector_number}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={submitGuess}
              disabled={!selectedCard || submitting}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Guess'}
            </button>
            
            <div className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              {guessHistory.length} / {maxGuesses} guesses used
            </div>
          </div>
        )}
        
        {/* Game Over Message */}
        {gameOver && (
          <div className={`mb-6 p-4 rounded-lg ${won ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
            <h2 className="text-2xl font-bold text-center mb-2">
              {won ? '🎉 Congratulations!' : '😔 Game Over'}
            </h2>
            <p className="text-center">
              {won
                ? `You guessed the card in ${guessHistory.length} ${guessHistory.length === 1 ? 'try' : 'tries'}!`
                : `The card was: ${answer?.name}`
              }
            </p>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-1">
              Time: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
            </p>
            {answer && puzzleCard && (
              <div className="mt-4 flex flex-col items-center">
                {/* Card Image */}
                {puzzleCard.image_url && (
                  <div className="relative w-48 aspect-[63/88] mb-3 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                    <Image
                      src={`/api/image-proxy?url=${encodeURIComponent(puzzleCard.image_url)}`}
                      alt={answer.name}
                      fill
                      className="rounded object-contain"
                      sizes="192px"
                      unoptimized
                    />
                  </div>
                )}
                <p className="font-semibold">{answer.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {answer.set_code} #{answer.collector_number} • {answer.rarity}
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Share Button */}
        {gameOver && (
          <div className="mb-6 flex justify-center">
            <button
              onClick={() => {
                const date = puzzleDate || new Date().toISOString().split('T')[0];
                const result = won ? 'Won' : 'Failed';
                const guessCount = guessHistory.length;
                
                // Generate emoji grid for each guess
                // Order: Type, Faction, Rarity, Energy, Might, Power
                const emojiGrid = guessHistory.map((guess, idx) => {
                  const attributeOrder: (keyof AttributeFeedback)[] = ['type', 'faction', 'rarity', 'energy', 'might', 'power'];
                  const emojis = attributeOrder.map((attr) => {
                    const feedback = guess.feedback[attr];
                    const type = ATTRIBUTE_TYPES[attr];
                    
                    if (type === 'categorical') {
                      return feedback === 'correct' ? '🟩' : '🟥';
                    } else {
                      // numeric
                      if (feedback === 'exact') return '🟩';
                      if (feedback === 'high') return '🟧';
                      return '🟦';
                    }
                  });
                  return emojis.join('');
                }).join('\n');
                
                const shareText = `Riftle\n${date}\nI ${result}, using ${guessCount}/${maxGuesses} guesses.\n${emojiGrid}\n\nVisit https://rif-trade.vercel.app/riftle for daily Riftbound puzzles!`;
                
                navigator.clipboard.writeText(shareText).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1000);
                }).catch(() => {
                  alert('Failed to copy to clipboard');
                });
              }}
              className={`px-6 py-2 font-semibold rounded-lg transition-colors w-40 ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
            >
              {copied ? 'Copied!' : 'Share Results'}
            </button>
          </div>
        )}
        
        {/* Guess History */}
        {guessHistory.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Your Guesses:</h3>
            <div className="space-y-3">
              {[...guessHistory].reverse().map((guess, index) => {
                const guessNumber = guessHistory.length - index;
                return (
                  <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                        Guess #{guessNumber}:
                      </span>
                      <span className="font-semibold">
                        {guess.card_name}
                      </span>
                      {guess.set_code && guess.collector_number && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {guess.set_code} #{guess.collector_number}
                        </span>
                      )}
                    </div>
                  <div className="space-y-2">
                    {/* Categorical attributes (top row) */}
                    <div className="grid grid-cols-3 gap-2">
                      {(['type', 'faction', 'rarity'] as const).map((attr) => {
                        const feedback = guess.feedback[attr];
                        const type = ATTRIBUTE_TYPES[attr];
                        const color = getFeedbackColor(feedback as string, type);
                        const displayValue = guess.attributes[attr] ?? 'N/A';
                        
                        return (
                          <div key={attr} className="text-center">
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              {ATTRIBUTE_LABELS[attr]}
                            </div>
                            <div className={`${color} text-white rounded px-2 py-1 text-sm font-semibold`}>
                              {displayValue}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Numerical attributes (bottom row) */}
                    <div className="grid grid-cols-3 gap-2">
                      {(['energy', 'might', 'power'] as const).map((attr) => {
                        const feedback = guess.feedback[attr];
                        const type = ATTRIBUTE_TYPES[attr];
                        const color = getFeedbackColor(feedback as string, type);
                        const displayValue = guess.attributes[attr] ?? 'N/A';
                        
                        return (
                          <div key={attr} className="text-center">
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              {ATTRIBUTE_LABELS[attr]}
                            </div>
                            <div className={`${color} text-white rounded px-2 py-1 text-sm font-semibold`}>
                              {displayValue}
                              {type === 'numeric' && feedback !== 'exact' && (
                                <span className="ml-1">
                                  {feedback === 'high' ? '↓' : '↑'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>
      
      {/* Stats and Leaderboard Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stats Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Your Stats</h2>
          
          {user && stats ? (
            <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.totalGames}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Played</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.winPercent}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.currentStreak}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.maxStreak}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Max Streak</div>
            </div>
          </div>
          
          {/* Guess Distribution - Vertical Bar Chart */}
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Guess Distribution</h3>
            <div className="flex items-end justify-center gap-2 h-32">
              {[
                { label: '1', value: 1 },
                { label: '2', value: 2 },
                { label: '3', value: 3 },
                { label: '4', value: 4 },
                { label: '5', value: 5 },
                { label: '6', value: 6 },
                { label: 'Failed', value: 'X' }
              ].map(({ label, value }) => {
                const count = value === 'X' ? stats.failedGames : (stats.solvedDistribution[value as number] || 0);
                const maxCount = Math.max(
                  ...Object.values(stats.solvedDistribution),
                  stats.failedGames || 0,
                  1 // Ensure at least 1 to avoid division by zero
                );
                // Calculate height in pixels relative to the 128px (h-32) container
                const heightPx = maxCount > 0 ? Math.round((count / maxCount) * 120) : 0; // 120px max to leave room for label
                const bgColor = value === 'X' ? 'bg-red-600' : 'bg-green-600';
                
                return (
                  <div key={label} className="flex flex-col items-center flex-1 min-w-[40px]">
                    {count > 0 && (
                      <div
                        className={`${bgColor} text-white text-xs font-bold rounded-t w-full flex items-center justify-center transition-all`}
                        style={{ height: `${heightPx}px` }}
                      >
                        {count}
                      </div>
                    )}
                    <div className="text-xs font-semibold mt-1">{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                Sign in to track your stats and compete on the leaderboard!
              </p>
              <a
                href="/login"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Sign In
              </a>
            </div>
          )}
        </div>
        
        {/* Leaderboard Section - Top 5 Today */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Today's Top 5</h2>
          
          {/* Leaderboard Table */}
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300 dark:border-gray-600">
                <th className="text-left py-2 px-2">Rank</th>
                <th className="text-center py-2 px-2"></th>
                <th className="text-left py-2 px-2">Player</th>
                <th className="text-center py-2 px-2">Solved</th>
                <th className="text-center py-2 px-2">Guesses</th>
                <th className="text-center py-2 px-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No entries yet. Be the first to play!
                  </td>
                </tr>
              ) : (
                leaderboard.slice(0, 5).map((entry) => (
                  <tr
                    key={entry.rank}
                    className={`border-b border-gray-200 dark:border-gray-700 ${
                      entry.isSolved ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    <td className="py-2 px-2">{entry.rank}</td>
                    <td className="text-center py-2 px-2 text-2xl">{entry.countryFlag}</td>
                    <td className="py-2 px-2 font-semibold">{entry.displayName}</td>
                    <td className="text-center py-2 px-2">
                      <span className={`font-bold ${entry.isSolved ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {entry.isSolved ? '✓ Win' : '✗ Failed'}
                      </span>
                    </td>
                    <td className="text-center py-2 px-2">{entry.guessesUsed || '-'}</td>
                    <td className="text-center py-2 px-2">
                      {entry.timeInSeconds ? `${Math.floor(entry.timeInSeconds / 60)}:${String(entry.timeInSeconds % 60).padStart(2, '0')}` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
      
      {/* Daily Plays Chart - Full Width Below Stats and Leaderboard */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="w-full min-h-[280px] flex justify-center items-center">
          <RiftleDailyPlaysChart />
        </div>
      </div>
    </div>
  );
}

// Made with Bob
