import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { UserProfile, AuthResponse } from '../types';
import { auth } from './firebase';

export const firebaseUserService = {
  register: async (email: string, pass: string): Promise<AuthResponse> => {
    if (!auth) return { success: false, message: 'FIREBASE NOT CONFIGURED' };
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      return { 
        success: true, 
        user: { 
          id: cred.user.email?.split('@')[0] || cred.user.uid, 
          accessKey: '******', 
          role: 'OPERATOR', 
          createdAt: cred.user.metadata.creationTime || new Date().toISOString(), 
          lastLogin: cred.user.metadata.lastSignInTime || new Date().toISOString()
        } 
      };
    } catch (e: any) {
      // Map Firebase errors to user-friendly messages
      let message = 'REGISTRATION FAILED';
      if (e.code === 'auth/email-already-in-use') message = 'OPERATOR ID ALREADY EXISTS';
      if (e.code === 'auth/weak-password') message = 'ACCESS KEY TOO WEAK (MIN 6 CHARS)';
      return { success: false, message: message !== 'REGISTRATION FAILED' ? message : e.message };
    }
  },

  login: async (email: string, pass: string): Promise<AuthResponse> => {
    if (!auth) return { success: false, message: 'FIREBASE NOT CONFIGURED' };
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      return { 
        success: true, 
        user: { 
            id: cred.user.email?.split('@')[0] || cred.user.uid, 
            accessKey: '******', 
            role: 'OPERATOR', 
            createdAt: cred.user.metadata.creationTime || new Date().toISOString(), 
            lastLogin: cred.user.metadata.lastSignInTime || new Date().toISOString()
        } 
      };
    } catch (e: any) {
       return { success: false, message: 'INVALID CREDENTIALS' };
    }
  },

  logout: async () => {
    if (auth) await signOut(auth);
  },

  getSession: (): UserProfile | null => {
    // Firebase auth state needs an observer, getting synchronous session is tricky
    // For now we return null which might force a re-login on refresh if App doesn't handle persistence
    // This is consistent with the MVP plan
    return null; 
  }
};
