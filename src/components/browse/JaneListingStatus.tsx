import React, { useState, useEffect } from 'react';
import { ShoppingBag, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { retryWithBackoff } from '../../utils/retry';
import toast from 'react-hot-toast';

type JaneListingStatusProps = {
  designId: string;
  onUpdate?: () => void;
};

export default function JaneListingStatus({ designId, onUpdate }: JaneListingStatusProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'active' | 'inactive' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = React.useRef(true);

  // Load initial status
  React.useEffect(() => {
    if (!designId) return;

    mounted.current = true;
    const loadStatus = async () => {
      try {
        const result = await retryWithBackoff(async () => {
          const { data, error } = await supabase
            .from('jane_designs_listed')
            .select('status')
            .eq('design_id', designId)
            .maybeSingle();

          if (error) {
            // Handle "not found" case silently
            if (error.code === 'PGRST116') {
              return { data: null, error: null };
            }
            throw error;
          }

          return { data, error: null };
        }, {
          maxAttempts: 3,
          baseDelay: 500,
          maxDelay: 2000,
          onError: (error, attempt) => {
            console.warn(`Attempt ${attempt} failed:`, error);
            if (mounted.current) {
              setError('Connection error');
            }
          }
        });

        if (result && mounted.current) {
          setStatus(result.data?.status || null);
          setError(null);
        }
      } catch (error) {
        console.error('Error loading Jane listing status:', error);
        if (mounted.current) {
          setError('Failed to load status');
        }
      }
    };

    loadStatus();
    return () => { mounted.current = false; };
  }, [designId]);

  const handleToggle = async () => {
    if (!designId) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!status) {
        // Create new listing
        const result = await retryWithBackoff(async () => {
          const { error } = await supabase
            .from('jane_designs_listed')
            .insert({
              design_id: designId,
              status: 'active',
              listed_by: user.id
            })
            .select();
          return { error };
        });

        if (result?.error) throw result.error;
        setStatus('active');
        toast.success('Design marked as listed on Jane');
      } else {
        // Toggle status
        const newStatus = status === 'active' ? 'inactive' : 'active';
        const result = await retryWithBackoff(async () => {
          const { error } = await supabase
            .from('jane_designs_listed')
            .update({ 
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('design_id', designId)
            .select();
          return { error };
        });

        if (result?.error) throw result.error;
        setStatus(newStatus);
        toast.success(`Design marked as ${newStatus} on Jane`);
      }

      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating Jane listing status:', error);
      setError('Failed to update');
      toast.error('Failed to update listing status');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-1 px-2 py-1 rounded text-sm bg-red-100 text-red-800 hover:bg-red-200"
        title="Click to retry"
      >
        <X className="w-4 h-4" />
        Retry
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
        status === 'active'
          ? 'bg-green-100 text-green-800 hover:bg-green-200'
          : status === 'inactive'
          ? 'bg-red-100 text-red-800 hover:bg-red-200'
          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      }`}
      title={
        status === 'active'
          ? 'Listed on Jane (click to mark inactive)'
          : status === 'inactive'
          ? 'Inactive on Jane (click to mark active)'
          : 'Not listed on Jane (click to mark as listed)'
      }
    >
      {loading ? (
        <span className="animate-spin">⌛</span>
      ) : status === 'active' ? (
        <Check className="w-4 h-4" />
      ) : status === 'inactive' ? (
        <X className="w-4 h-4" />
      ) : (
        <ShoppingBag className="w-4 h-4" />
      )}
      Jane
    </button>
  );
}