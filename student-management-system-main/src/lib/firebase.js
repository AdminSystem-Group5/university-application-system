/**
 * Firebase Configuration
 */

import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app;
let auth;
let db;
let storage;

function initializeFirebase() {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  return app;
}

export function getFirebaseAuth() {
  if (!auth) {
    const appInstance = initializeFirebase();
    auth = getAuth(appInstance);

    if (
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_USE_EMULATORS === "true"
    ) {
      connectAuthEmulator(auth, "http://localhost:9099", {
        disableWarnings: true,
      });
    }
  }

  return auth;
}

export function getFirestoreDb() {
  if (!db) {
    const appInstance = initializeFirebase();
    db = getFirestore(appInstance);

    if (
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_USE_EMULATORS === "true"
    ) {
      connectFirestoreEmulator(db, "localhost", 8080);
    }
  }

  return db;
}

export function getFirebaseStorage() {
  if (!storage) {
    const appInstance = initializeFirebase();
    storage = getStorage(appInstance);

    if (
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_USE_EMULATORS === "true"
    ) {
      connectStorageEmulator(storage, "localhost", 9199);
    }
  }

  return storage;
}

export { app, auth, db, storage };

export default initializeFirebase;