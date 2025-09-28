// Client-side Firebase configuration for GigCampus
// SECURE: Uses environment variables for client-side Firebase config

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAPwRLpVHan0U_FiKs7mCTV_Lq7c9ESjtE',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'gigcampusmvp.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gigcampusmvp',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'gigcampusmvp.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '952537954881',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:952537954881:web:6772001ca4d5322b8864c0',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://gigcampusmvp-default-rtdb.firebaseio.com'
};

// Validate required environment variables
const requiredClientEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const missingClientVars = requiredClientEnvVars.filter(varName => !process.env[varName]);
if (missingClientVars.length > 0) {
  console.warn(`Missing Firebase environment variables: ${missingClientVars.join(', ')}`);
  console.warn('Firebase features may not work properly.');
  // Don't throw error in development to allow app to load
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required Firebase client environment variables: ${missingClientVars.join(', ')}`);
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
