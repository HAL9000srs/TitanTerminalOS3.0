import { UserProfile, AuthResponse } from '../types';

const DB_KEY = 'titan_user_db';
const SESSION_KEY = 'titan_active_session';

const initDB = () => {
  if (!localStorage.getItem(DB_KEY)) {
    localStorage.setItem(DB_KEY, JSON.stringify([]));
  }
};

export const userService = {
  // SIMULATE: POST /api/register
  register: async (operatorId: string, accessKey: string): Promise<AuthResponse> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        initDB();
        const users: UserProfile[] = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
        
        // 1. Check for Duplicate ID
        if (users.find(u => u.id === operatorId)) {
          resolve({ 
            success: false, 
            // This is the specific message we want to see
            message: `ERROR: OPERATOR ID '${operatorId}' IS ALREADY REGISTERED` 
          });
          return;
        }

        // 2. Check for Weak Credentials (Optional robustness)
        if (accessKey.length < 6) {
             resolve({ success: false, message: 'ERROR: ACCESS KEY MUST BE > 6 CHARACTERS' });
             return;
        }

        const newUser: UserProfile = {
          id: operatorId,
          accessKey: accessKey,
          createdAt: new Date().toISOString(),
          role: 'OPERATOR',
          lastLogin: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem(DB_KEY, JSON.stringify(users));
        resolve({ success: true, user: newUser });
      }, 800);
    });
  },

  // POST /api/login
  login: async (operatorId: string, accessKey: string): Promise<AuthResponse> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        initDB();
        const users: UserProfile[] = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
        const user = users.find(u => u.id === operatorId && u.accessKey === accessKey);

        if (user) {
          user.lastLogin = new Date().toISOString();
          localStorage.setItem(DB_KEY, JSON.stringify(users));
          localStorage.setItem(SESSION_KEY, JSON.stringify(user));
          resolve({ success: true, user });
        } else {
          resolve({ success: false, message: 'ACCESS DENIED: INVALID CREDENTIALS' });
        }
      }, 1000);
    });
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getSession: (): UserProfile | null => {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  }
};
