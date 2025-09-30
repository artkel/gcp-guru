import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAg2ExJplYF40HnhgVK4ktswa91wdVNtog",
  authDomain: "gcp-guru-473011.firebaseapp.com",
  projectId: "gcp-guru-473011",
};

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };