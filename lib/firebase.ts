import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('FIREBASE CONFIG', firebaseConfig);

let app: ReturnType<typeof initializeApp> | null = null;

function getFirebaseApp() {
  console.log('getFirebaseApp called, typeof window:', typeof window);
  if (typeof window === "undefined") {
    throw new Error("getFirebaseApp called on the server");
  }
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    console.log('Firebase app initialized:', app);
  }
  return app;
}

export const getDbClient = async () => {
  console.log('getDbClient called, typeof window:', typeof window);
  if (typeof window === "undefined") {
    throw new Error("getDbClient called on the server");
  }
  const { getFirestore } = await import("firebase/firestore");
  const db = getFirestore(getFirebaseApp());
  console.log('getDbClient returning db:', db);
  return db;
};

export const getAuthClient = async () => {
  console.log('getAuthClient called, typeof window:', typeof window);
  if (typeof window !== "undefined") {
    const { getAuth } = await import("firebase/auth");
    const app = getFirebaseApp();
    console.log('getAuthClient: getAuth', app);
    const auth = getAuth(app);
    console.log('getAuthClient returning auth:', auth);
    return auth;
  }
  return null;
}; 