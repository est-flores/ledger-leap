"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Singleton pattern for Firebase App
let firebaseApp: FirebaseApp | null = null;
let analyticsInstance: Analytics | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  // Only initialize on client side
  if (typeof window === "undefined") {
    return null;
  }

  // Return existing app if already initialized
  if (firebaseApp) {
    return firebaseApp;
  }

  // Check if Firebase is already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0];
    return firebaseApp;
  }

  // Only initialize if we have the required config
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn(
      "Firebase config missing. Analytics events will be logged to console."
    );
    return null;
  }

  // Initialize Firebase
  firebaseApp = initializeApp(firebaseConfig);
  return firebaseApp;
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  // Only initialize on client side
  if (typeof window === "undefined") {
    return null;
  }

  // Return existing instance
  if (analyticsInstance) {
    return analyticsInstance;
  }

  const app = getFirebaseApp();
  if (!app) {
    return null;
  }

  try {
    // Lazy load analytics
    analyticsInstance = getAnalytics(app);
    return analyticsInstance;
  } catch (error) {
    console.warn("Failed to initialize Firebase Analytics:", error);
    return null;
  }
}
