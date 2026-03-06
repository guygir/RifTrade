'use client';

import { useState, useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

const MAX_LENGTH = 100;

interface SuggestionBoxProps {
  user: any;
}

export default function SuggestionBox({ user }: SuggestionBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [issueUrl, setIssueUrl] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && status !== 'sending') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, status]);

  const handleSubmit = async () => {
    setStatus('sending');
    setErrorMessage('');
    
    try {
      // Get the current session token
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: text.trim() }),
        credentials: 'include',
      });
      
      const json = await res.json();

      if (json.success) {
        setIssueUrl(json.issueUrl ?? '');
        setStatus('success');
      } else {
        setErrorMessage(json.error || 'Failed to submit suggestion.');
        setStatus('error');
      }
    } catch (err) {
      console.error('Suggestion error:', err);
      setErrorMessage('Network error. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          💡 Suggest a Feature
        </h2>
      </div>

      {!user ? (
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
          Sign in to submit suggestions and help improve Riftle!
        </p>
      ) : (
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
          Have an idea? Let us know!
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          if (!user) {
            alert('Please sign in to submit suggestions');
            return;
          }
          setIsOpen(true);
          setStatus('idle');
          setText('');
          setErrorMessage('');
          setIssueUrl('');
        }}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
      >
        {user ? 'Submit Suggestion' : 'Sign In to Suggest'}
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            if (status !== 'sending') setIsOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="suggestion-title"
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 
              id="suggestion-title" 
              className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3"
            >
              💡 Suggest a Feature
            </h2>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Share your idea or report a bug (max {MAX_LENGTH} characters). We'll create a GitHub issue.
            </p>

            {status === 'success' ? (
              <div className="space-y-3">
                <p className="text-green-700 dark:text-green-400 font-medium">
                  ✅ Success! Your suggestion was submitted.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
                  >
                    Close
                  </button>
                  {issueUrl && (
                    <a
                      href={issueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-center"
                    >
                      View Issue
                    </a>
                  )}
                </div>
              </div>
            ) : status === 'error' ? (
              <div className="space-y-3">
                <p className="text-red-700 dark:text-red-400 font-medium">
                  {errorMessage || 'Failed to submit. Please try again later.'}
                </p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
                  placeholder="Describe your feature idea or bug report..."
                  maxLength={MAX_LENGTH}
                  rows={5}
                  disabled={status === 'sending'}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  {text.length}/{MAX_LENGTH}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={status === 'sending'}
                    className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={status === 'sending' || text.trim().length === 0}
                    onClick={handleSubmit}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'sending' ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Made with Bob