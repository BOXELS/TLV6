import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { buildTitleQuery, buildKeywordQuery } from '../utils/queryBuilder';
import type { DesignFile, DesignMockup } from '../types/database';
import type { DesignFilters } from '../types/filters';
import { retryWithBackoff } from '../utils/retry';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const DEFAULT_FILTERS: DesignFilters = {
  titleSearch: '',
  keywordSearch: '',
  sku: '',
  mockupStatus: 'all',
  janeStatus: 'all'
};

export function useDesigns(limit: number = 25) {
  const [designs, setDesigns] = useState<DesignFile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DesignFilters>(DEFAULT_FILTERS);
  const { user } = useAuth();

  useEffect(() => {
    loadDesigns();
  }, [filters, limit, currentPage]);

  const loadDesigns = async () => {
    setLoading(true);
    try {
      if (!limit || limit < 1) {
        console.warn('Invalid limit:', limit);
        setDesigns([]);
        setTotalCount(0);
        return;
      }

      const result = await retryWithBackoff(async () => {
        let query = supabase
          .from('design_files')
          .select(`
          id,
          sku,
          title,
          uploaded_by,
          print_file_url,
          web_file_url,
          created_at,
          updated_at,
          jane_designs_listed!left (
            id,
            status
          ),
          design_mockups!left (
            id,
            url,
            thumb_url,
            is_main,
            sort_order
          ),
          design_keyword_links!left (
            keywords!inner (
              keyword
            )
          ),
          categories:design_categories!left (
            category_id,
            categories!inner (
              id,
              name
             )
           )`, { count: 'exact' });

        // Apply filters
        if (filters.titleSearch) {
          query = buildTitleQuery(query, filters.titleSearch);
        }

        if (filters.keywordSearch) {
          query = buildKeywordQuery(query, filters.keywordSearch);
        }

        if (filters.sku) {
          query = query.ilike('sku', `%${filters.sku}%`);
        }
        
        // Apply mockup status filter
        if (filters.mockupStatus === 'with') {
          query = query.not('design_mockups', 'is', null);
        } else if (filters.mockupStatus === 'without') {
          query = query.is('design_mockups', null);
        }
        
        // Apply Jane status filter
        if (filters.janeStatus === 'yes') {
          query = query.not('jane_designs_listed', 'is', null);
        } else if (filters.janeStatus === 'no') {
          query = query.is('jane_designs_listed', null);
        }

        // Filter by user unless they are admin/super_admin
        if (user && user.type?.code !== 'admin' && user.type?.code !== 'super_admin') {
          query = query.eq('uploaded_by', user.id);
        }

        // Apply ordering and limit
        return query
          .order('created_at', { ascending: false })
          .range((currentPage - 1) * limit, currentPage * limit - 1)
          .limit(limit);
      }, {
        maxAttempts: 3,
        onError: (error, attempt) => {
          console.warn(`Attempt ${attempt} failed:`, error);
          if (attempt < 3) {
            toast.loading('Retrying connection...');
          }
        }
      });

      if (!result) throw new Error('Failed to load designs after retries');
      const { data, count, error } = result;
      if (error) throw error;
      
      console.log('Raw design data:', data);

      // Transform the data
      const transformedData = (data || []).map(design => {
        const mockups = (design.design_mockups || [])
          .sort((a, b) => {
            if (a.is_main) return -1;
            if (b.is_main) return 1;
            return (a.sort_order || 0) - (b.sort_order || 0);
          })
          .map(mockup => ({
            id: mockup.id,
            url: mockup.url,
            thumb_url: mockup.thumb_url,
            is_main: mockup.is_main,
            sort_order: mockup.sort_order,
            design_id: design.id,
            created_at: design.created_at
          }));

        const keywords = (design.design_keyword_links || [])
          .map(link => ({
            keyword: link.keywords?.keyword || ''
          }))
          .filter(k => k.keyword);

        const categories = (design.categories || [])
          .map(cat => ({
            category_id: cat.category_id,
            name: cat.categories?.name || ''
          }))
          .filter(c => c.name);

        return {
          id: design.id,
          sku: design.sku,
          title: design.title,
          uploaded_by: design.uploaded_by,
          print_file_url: design.print_file_url,
          web_file_url: design.web_file_url,
          created_at: design.created_at,
          updated_at: design.updated_at,
          mockups,
          keywords,
          categories,
          jane_designs_listed: design.jane_designs_listed || []
        };
      });

      console.log('Transformed design data:', transformedData);

      setDesigns(transformedData);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading designs:', error);
      toast.error(
        error instanceof Error && error.message === 'Network request failed'
          ? 'Connection error. Please check your network and try again.'
          : 'Failed to load designs. Please try refreshing the page.'
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    designs,
    totalCount,
    loading,
    filters,
    setFilters,
    loadDesigns,
    currentPage,
    setCurrentPage
  };
}