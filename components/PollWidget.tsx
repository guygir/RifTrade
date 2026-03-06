'use client';

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

interface PollData {
  poll: {
    id: string;
    question: string;
    options: string[];
  };
  results: {
    voteCounts: Record<string, number>;
    totalVotes: number;
  };
}

interface PollWidgetProps {
  pollId: string;
}

export default function PollWidget({ pollId }: PollWidgetProps) {
  const [pollData, setPollData] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUser();
    loadPoll();
  }, [pollId]);

  async function loadUser() {
    try {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Load user's existing vote
        const { data: vote } = await supabase
          .from('poll_votes')
          .select('option')
          .eq('poll_id', pollId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (vote) {
          setUserVote(vote.option);
        }
      }
    } catch (err) {
      console.error('Error loading user:', err);
    }
  }

  async function loadPoll() {
    try {
      setError(null);
      const response = await fetch(`/api/polls/${pollId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load poll');
      }

      const data = await response.json();
      setPollData(data);
    } catch (err: any) {
      console.error('Error loading poll:', err);
      setError(err.message || 'Failed to load poll');
    } finally {
      setLoading(false);
    }
  }

  async function submitVote(option: string) {
    if (!user) {
      alert('Please sign in to vote');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Please sign in to vote');
        return;
      }

      const response = await fetch(`/api/polls/${pollId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ option }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }

      setUserVote(option);
      // Reload poll to get updated results
      await loadPoll();
    } catch (err: any) {
      console.error('Error submitting vote:', err);
      alert(err.message || 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <p className="text-center text-gray-600 dark:text-gray-400">Loading poll...</p>
      </div>
    );
  }

  if (error || !pollData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <p className="text-center text-red-600 dark:text-red-400">{error || 'Failed to load poll'}</p>
      </div>
    );
  }

  const { poll, results } = pollData;
  const maxVotes = Math.max(...Object.values(results.voteCounts), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">
        📊 Community Poll
      </h2>

      <p className="text-center text-sm text-gray-700 dark:text-gray-300 mb-4">
        {poll.question}
      </p>

      {/* Vote count */}
      <div className="text-xs text-gray-600 dark:text-gray-400 text-center mb-3">
        {results.totalVotes} {results.totalVotes === 1 ? 'vote' : 'votes'}
        {!user && ' • Sign in to vote'}
      </div>

      {/* Combined: Button on left, Chart on right */}
      <div className="space-y-2">
        {poll.options.map((option) => {
          const count = results.voteCounts[option] || 0;
          const percentage = results.totalVotes > 0 ? (count / results.totalVotes) * 100 : 0;
          const barWidth = results.totalVotes > 0 ? (count / maxVotes) * 100 : 0;

          return (
            <div key={option} className="flex items-center gap-3">
              {/* Vote button on left (only for signed-in users) */}
              {user ? (
                <button
                  onClick={() => submitVote(option)}
                  disabled={submitting}
                  className={`w-32 flex-shrink-0 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                    userVote === option
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {userVote === option ? '✓ ' : ''}{option}
                </button>
              ) : (
                <div className="w-32 flex-shrink-0 py-2 px-3 text-sm text-gray-600 dark:text-gray-400 text-center">
                  {option}
                </div>
              )}
              
              {/* Chart on right */}
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  >
                    {count > 0 && barWidth > 15 && count}
                  </div>
                </div>
                <div className="w-16 flex-shrink-0 text-xs text-gray-600 dark:text-gray-400">
                  {count} ({percentage.toFixed(0)}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Made with Bob