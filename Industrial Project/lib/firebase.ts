/**
 * Firebase Configuration
 * Role 3 - Backend & Database Lead (Firebase Architect)
 * 
 * This file initialises Firebase services for the UAAMS application.
 * Following the twelve-factor app methodology, all configuration
 * is loaded from environment variables.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate required configuration
function validateConfig(): void {
  const missingVars: string[] = [];

  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    missingVars.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  }

  if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
    missingVars.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  }

  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    missingVars.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  }

  if (missingVars.length > 0) {
    console.error(
      `Missing required Firebase environment variables: ${missingVars.join(", ")}`
    );
  }
}

// Initialize Firebase (singleton pattern to prevent multiple initialisations)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

function initializeFirebase(): FirebaseApp {
  if (getApps().length === 0) {
    validateConfig();
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  return app;
}

// Get Firebase Auth instance
export function getFirebaseAuth(): Auth {
  if (!auth) {
    const app = initializeFirebase();
    auth = getAuth(app);

    // Connect to emulator in development
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    }
  }
  return auth;
}

// Get Firestore instance
export function getFirestoreDb(): Firestore {
  if (!db) {
    const app = initializeFirebase();
    db = getFirestore(app);

    // Connect to emulator in development
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
  }
  return db;
}

// Get Firebase Storage instance
export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    const app = initializeFirebase();
    storage = getStorage(app);

    // Connect to emulator in development
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
      connectStorageEmulator(storage, 'localhost', 9199);
    }
  }
  return storage;
}

// Export initialised instances for convenience
export { app, auth, db, storage };

// Default export for the app
export default initializeFirebase;
