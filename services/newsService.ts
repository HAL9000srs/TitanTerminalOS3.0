import { supabase } from './supabase';
import { NewsArticle } from '../types';

export const getLatestNews = async (limit: number = 50): Promise<NewsArticle[]> => {
  try {
    const { data, error } = await supabase
      .from('news_articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching news:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('Failed to fetch news:', e);
    return [];
  }
};
