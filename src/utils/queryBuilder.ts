import { SupabaseClient } from '@supabase/supabase-js';

export function buildTitleQuery(query: SupabaseClient<any, 'public'>['from'], search: string) {
  if (!search) return query;
  const searchTerm = search.trim().replace(/'/g, "''");
  return query.ilike('title', `%${searchTerm}%`);
}

export function buildKeywordQuery(query: SupabaseClient<any, 'public'>['from'], search: string) {
  if (!search) return query;
  const searchTerm = search.trim().replace(/'/g, "''");
  return query.ilike('design_keyword_links.keywords.keyword', `%${searchTerm}%`);
}

export function buildCategoryQuery(query: SupabaseClient<any, 'public'>['from'], categoryId: string) {
  if (!categoryId) return query;
    
  if (categoryId === 'none') {
    // Return designs with no categories
    return query.not('categories.category_id', 'is', null);
  }
  
  // Return designs with the specific category
  return query.eq('categories.category_id', categoryId);
}
