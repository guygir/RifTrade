'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase/client';
import { sanitizeDisplayName, sanitizeContactInfo, sanitizeUsername } from '@/lib/sanitize-input';
import { detectCountry, isTradingAllowed, getCountryDisplayText } from '@/lib/geo-utils';
import RegionalWarningModal from '@/components/RegionalWarningModal';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showRegionalWarning, setShowRegionalWarning] = useState(false);
  const [detectedCountryCode, setDetectedCountryCode] = useState<string | null>(null);
  const [detectedCountryName, setDetectedCountryName] = useState<string | null>(null);
  const router = useRouter();

  // Validate username format: alphanumeric, underscore, hyphen, 3-30 chars
  const validateUsername = (value: string): string | null => {
    if (!value) return 'Username is required';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 30) return 'Username must be at most 30 characters';
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return 'Username can only contain letters, numbers, underscores, and hyphens';
    }
    return null;
  };

  // Check username uniqueness
  const checkUsernameAvailability = async (value: string): Promise<boolean> => {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', value.toLowerCase())
      .limit(1);
    
    if (error) {
      console.error('Error checking username:', error);
      return false;
    }
    
    return !data || data.length === 0;
  };

  const handleUsernameChange = async (value: string) => {
    setUsername(value);
    setUsernameError(null);
    
    if (!value) {
      setUsernameError(null);
      return;
    }

    const validationError = validateUsername(value);
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    // Check uniqueness (debounced)
    setCheckingUsername(true);
    const isAvailable = await checkUsernameAvailability(value);
    setCheckingUsername(false);
    
    if (!isAvailable) {
      setUsernameError('This username is already taken');
    }
  };

  // Detect country when switching to signup mode
  useEffect(() => {
    if (isSignUp && !detectedCountryCode) {
      console.log('[LoginPage] Signup mode activated, detecting country...');
      detectUserCountry();
    }
  }, [isSignUp, detectedCountryCode]);

  const detectUserCountry = async () => {
    try {
      console.log('[LoginPage] Calling detectCountry API...');
      const { code, name } = await detectCountry();
      console.log('[LoginPage] Country detected:', { code, name });
      setDetectedCountryCode(code);
      setDetectedCountryName(name);
    } catch (error) {
      console.error('[LoginPage] Error detecting country:', error);
      // Set to null on error (will be treated as non-Israel)
      setDetectedCountryCode(null);
      setDetectedCountryName(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setUsernameError(null);

    const supabase = createSupabaseClient();

    try {
      if (isSignUp) {
        // Validate username
        if (!username) {
          setUsernameError('Username is required');
          setLoading(false);
          return;
        }

        const validationError = validateUsername(username);
        if (validationError) {
          setUsernameError(validationError);
          setLoading(false);
          return;
        }

        // Check username availability one more time
        const isAvailable = await checkUsernameAvailability(username);
        if (!isAvailable) {
          setUsernameError('This username is already taken');
          setLoading(false);
          return;
        }

        // Sign up user
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Detect user's country
          const { code: countryCode, name: countryName } = await detectCountry();
          setDetectedCountryCode(countryCode);
          setDetectedCountryName(countryName);
          const tradingEnabled = isTradingAllowed(countryCode);
          
          // Sanitize inputs before saving
          const sanitizedUsername = sanitizeUsername(username);
          const sanitizedDisplayName = sanitizeDisplayName(username); // Default to username, can be changed later
          const sanitizedContactInfo = sanitizeContactInfo(email); // Default to email, can be changed later
          
          // Create profile with username and geographic info
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: data.user.id,
              display_name: sanitizedDisplayName,
              contact_info: sanitizedContactInfo,
              username: sanitizedUsername,
              country: countryCode,
              is_trading_enabled: tradingEnabled,
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            // If profile creation fails, we should still allow login but show error
            setError('Account created but profile setup failed. Please try logging in.');
            return;
          }

          // Show regional warning for non-trading users
          if (!tradingEnabled) {
            setShowRegionalWarning(true);
            setMessage('Account created! Welcome to Riftle!');
          } else {
            setMessage('Account created! Redirecting to your profile...');
            setTimeout(() => {
              router.push('/profile');
              router.refresh();
            }, 1000);
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          router.push('/profile');
          router.refresh();
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleWarningClose = () => {
    setShowRegionalWarning(false);
    // Redirect to Riftle instead of profile for non-trading users
    router.push('/riftle');
    router.refresh();
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      {showRegionalWarning && <RegionalWarningModal onClose={handleWarningClose} />}
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 shadow-sm">
          <h1 className="text-2xl font-bold mb-2">
            {isSignUp ? 'Sign Up' : 'Login'}
          </h1>
          
          {/* Country Detection Display for Signup */}
          {isSignUp && (detectedCountryCode || detectedCountryName) && (
            <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                📍 You're signing up from: {getCountryDisplayText(detectedCountryCode, detectedCountryName)}
              </p>
            </div>
          )}
          
          {isSignUp && !detectedCountryCode && !detectedCountryName && (
            <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                📍 Detecting your location...
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email (any email format accepted)
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="username@example.com (or any format)"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Email verification is disabled. You can use any email format.
              </p>
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-1">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  required
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
                  3-30 characters, letters, numbers, underscores, and hyphens only
                </p>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded p-3 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded p-3 text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (isSignUp && (!!usernameError || checkingUsername || !username))}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
                setUsername('');
                setUsernameError(null);
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {isSignUp
                ? 'Already have an account? Login'
                : "Don't have an account? Sign up"}
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

