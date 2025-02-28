import { createClient } from '@supabase/supabase-js';
import { retryWithBackoff } from '../utils/retry';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: async (...args) => {
      const result = await retryWithBackoff(
        () => fetch(...args),
        {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 5000,
          onError: (error, attempt) => {
            console.warn(`Fetch attempt ${attempt} failed:`, error);
          }
        }
      );
      if (!result) throw new Error('Network request failed after retries');
      return result;
    }
  }
});