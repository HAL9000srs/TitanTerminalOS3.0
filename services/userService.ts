import { userService as mockService } from './mockUserService';
import { firebaseUserService as realService } from './firebaseUserService';

// Logic: Use Mock if the Env Variable says so, OR if no API key is found
const useMock = import.meta.env.VITE_USE_MOCK === 'true' || !import.meta.env.VITE_FIREBASE_API_KEY;

// Export the chosen service
export const userService = useMock ? mockService : realService;

// Log active mode for debugging
console.log(`[SYSTEM] Auth Provider Initialized: ${useMock ? 'MOCK (Local)' : 'FIREBASE (Cloud)'}`);
