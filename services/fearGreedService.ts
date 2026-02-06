import { supabase } from './supabase';
import { FearGreedIndex } from '../types';

/**
 * Fetches the Crypto Fear & Greed Index from the system_stats table.
 * This data is populated by an n8n workflow that polls the Alternative.me API.
 */
export async function getFearGreedIndex(): Promise<FearGreedIndex | null> {
  const { data, error } = await supabase
    .from('system_stats')
    .select('*')
    .eq('metric_key', 'CRYPTO_FEAR_GREED')
    .single();
  
  if (error || !data) {
    console.warn('Fear & Greed Index not available:', error?.message);
    return null;
  }
  
  return data as FearGreedIndex;
}

/**
 * Returns color based on Fear & Greed score
 */
export function getFearGreedColor(score: number): string {
  if (score <= 25) return '#ef4444'; // Extreme Fear - red
  if (score <= 45) return '#f97316'; // Fear - orange
  if (score <= 55) return '#eab308'; // Neutral - yellow
  if (score <= 75) return '#84cc16'; // Greed - lime
  return '#22c55e'; // Extreme Greed - green
}
