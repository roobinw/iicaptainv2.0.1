
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (typeof window !== 'undefined') { // Ensure Firebase is initialized only on the client-side
  if (!firebaseConfig.apiKey) {
    console.error(
      "Firebase API Key is missing or invalid. " +
      "Please set NEXT_PUBLIC_FIREBASE_API_KEY in your .env.local file. " +
      "Refer to .env.example for the required Firebase environment variables."
    );
    // Not throwing an error here to let Firebase SDK attempt initialization and provide its own error,
    // which might be more specific if the key is present but malformed.
  }
  
  // Attempt to initialize Firebase even if API key check fails,
  // to allow Firebase SDK's own error reporting to take precedence.
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
      console.error("Error initializing Firebase. Ensure your Firebase configuration in .env.local is correct:", error);
      // This catch block provides context if initializeApp or getAuth fails.
  }
} else {
    // Server-side: app, auth, db will remain undefined.
    // Server-side Firebase usage (e.g., Admin SDK) would require a different setup
    // and typically not be initialized in this client-focused file.
}


export { app, auth, db };
