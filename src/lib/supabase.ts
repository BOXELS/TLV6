import { createClient } from '@supabase/supabase-js';
import { retryWithBackoff } from '../utils/retry';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Regular client for normal operations
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

// Admin client with service role key for bypassing RLS
export const adminSupabase = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;