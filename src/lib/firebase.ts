
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage"; // Added

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage; // Added

// This block will run on both client and server.
// The Firebase SDK handles ensuring that initializeApp is only effectively called once.

// Explicitly check for the API key first, as it's a common critical error.
if (!firebaseConfig.apiKey) {
  const errorMessage = "CRITICAL: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing or invalid in your environment configuration (.env.local). Firebase services will not be available. Refer to .env.example for required variables.";
  console.error(errorMessage);
  // Throw an error to prevent the application from attempting to start in a broken state.
  throw new Error(errorMessage);
}

try {
  // Initialize Firebase App if it hasn't been already
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp(); // Retrieve the existing app if already initialized
  }

  // Get Auth and Firestore instances
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app); // Added

} catch (e) {
  const error = e as Error; // Cast to Error type for better error message access
  const criticalErrorMessage = `CRITICAL: Firebase initialization failed: ${error.message}. This usually indicates misconfigured Firebase environment variables (NEXT_PUBLIC_FIREBASE_*) or issues with your Firebase project setup. Please review your .env.local file, compare with .env.example, and check your Firebase project console.`;
  console.error(criticalErrorMessage);
  console.error("Original Firebase SDK error:", error); // Log the original error object for more details
  // Re-throw to ensure this critical failure stops the application or relevant part from proceeding without Firebase.
  throw new Error(criticalErrorMessage);
}

export { app, auth, db, storage }; // Added storage
