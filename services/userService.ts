import { supabaseUserService } from './supabaseUserService';

// We now exclusively use Supabase. 
// The complex switching logic is no longer needed.
export const userService = supabaseUserService;

console.log('[SYSTEM] Auth Provider: SUPABASE (Production)');
