import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Article, FilterState } from '../types';

export function useArticles(filters: FilterState) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticles() {
      try {
        setLoading(true);
        
        let query = supabase
          .from('articles')
          .select('*')
          .order('published_at', { ascending: false });
        
        if (filters.vendor !== 'All') {
          query = query.eq('vendor', filters.vendor);
        }
        
        if (filters.category !== 'All') {
          query = query.contains('categories', [filters.category]);
        }
        
        if (filters.searchQuery) {
          query = query.ilike('title', `%${filters.searchQuery}%`);
        }
        
        const { data, error: supabaseError } = await query;
        
        if (supabaseError) {
          throw supabaseError;
        }
        
        setArticles(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, [filters]);

  return { articles, loading, error };
}