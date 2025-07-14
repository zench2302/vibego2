import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: ReturnType<typeof initializeApp> | null = null;

function getFirebaseApp() {
  if (typeof window === "undefined") {
    throw new Error("getFirebaseApp called on the server");
  }
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return app;
}

export const getDbClient = async () => {
  if (typeof window === "undefined") {
    throw new Error("getDbClient called on the server");
  }
  const { getFirestore } = await import("firebase/firestore");
  return getFirestore(getFirebaseApp());
};

export const getAuthClient = async () => {
  if (typeof window !== "undefined") {
    const { getAuth } = await import("firebase/auth");
    return getAuth(getFirebaseApp());
  }
  return null;
}; 