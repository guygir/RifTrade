import { useState, useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

export function useTradingPermission() {
  const [isLoading, setIsLoading] = useState(true);
  const [isTradingEnabled, setIsTradingEnabled] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkTradingPermission();
  }, []);

  const checkTradingPermission = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        setUser(null);
        setIsTradingEnabled(false);
        setIsLoading(false);
        return;
      }

      setUser(authUser);

      // Fetch trading permission from profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_trading_enabled')
        .eq('user_id', authUser.id)
        .single();

      // Default to true for existing users without the field
      setIsTradingEnabled(profileData?.is_trading_enabled ?? true);
    } catch (error) {
      console.error('Error checking trading permission:', error);
      setIsTradingEnabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, isTradingEnabled, user };
}

// Made with Bob
