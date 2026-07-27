"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function isConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
}

function getFirebaseApp() {
  if (!isConfigured()) return null;
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

// Scopes needed to create + write spreadsheets directly from the browser.
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";

export type GoogleSession = {
  user: User;
  accessToken: string;
};

export async function signInWithGoogle(): Promise<GoogleSession> {
  const app = getFirebaseApp();
  if (!app) {
    throw new Error(
      "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* environment variables — see README."
    );
  }
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  provider.addScope(SHEETS_SCOPE);
  provider.addScope(DRIVE_FILE_SCOPE);
  provider.setCustomParameters({ prompt: "consent" });

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken;
  if (!accessToken) {
    throw new Error("Google sign-in succeeded but no access token was returned — check requested scopes.");
  }
  return { user: result.user, accessToken };
}

export async function signOutOfGoogle() {
  const app = getFirebaseApp();
  if (!app) return;
  await signOut(getAuth(app));
}

export { isConfigured as isFirebaseConfigured };
