import { supabase } from './supabase';
import { UserProfile, AuthResponse } from '../types';

export const supabaseUserService = {
  register: async (email: string, pass: string): Promise<AuthResponse> => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: pass,
      });

      if (error) throw error;
      
      return { 
        success: true, 
        user: { 
          id: data.user?.id || '', 
          accessKey: '******',
          role: 'OPERATOR', 
          createdAt: data.user?.created_at || new Date().toISOString(), 
          lastLogin: data.user?.last_sign_in_at || new Date().toISOString(),
          displayName: 'OPERATOR' // Default for fresh registration
        } 
      };
    } catch (e: any) {
      let message = 'REGISTRATION FAILED';
      if (e.message?.includes('already registered')) message = 'OPERATOR ID ALREADY EXISTS';
      if (e.message?.includes('password')) message = 'ACCESS KEY TOO WEAK';
      return { success: false, message: message !== 'REGISTRATION FAILED' ? message : e.message };
    }
  },

  login: async (email: string, pass: string): Promise<AuthResponse> => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: pass,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      return { 
        success: true, 
        user: { 
            id: authData.user.id,
            accessKey: profile?.access_key || '******', 
            role: profile?.role || 'OPERATOR', 
            createdAt: authData.user.created_at, 
            lastLogin: authData.user.last_sign_in_at || new Date().toISOString(),
            displayName: profile?.display_name || 'OPERATOR'
        } 
      };
    } catch (e: any) {
       console.error("Login Error:", e);
       return { success: false, message: 'INVALID CREDENTIALS' };
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  getSession: async (): Promise<UserProfile | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return {
      id: session.user.id,
      accessKey: profile?.access_key || '******',
      role: profile?.role || 'OPERATOR',
      createdAt: session.user.created_at,
      lastLogin: session.user.last_sign_in_at || new Date().toISOString(),
      displayName: profile?.display_name || 'OPERATOR'
    };
  },

  updateDisplayName: async (userId: string, displayName: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error updating display name:', e);
      return false;
    }
  },

  provisionUser: async (email: string, pass: string, displayName: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email, password: pass, displayName }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return { success: true, message: 'OPERATOR PROVISIONED SUCESSFULLY' };
    } catch (e: any) {
      console.error('Provisioning Error:', e);
      return { success: false, message: e.message || 'PROVISIONING FAILED' };
    }
  }
};
