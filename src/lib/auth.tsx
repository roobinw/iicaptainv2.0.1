
"use client";

import type { User, UserRole } from "@/types";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  type User as FirebaseUser 
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase"; // Import Firebase instances
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  login: (email: string, password_unused?: string) => Promise<void>; // Password now used by Firebase
  logout: () => Promise<void>;
  signup: (email: string, name: string, password_unused?: string, role?: UserRole) => Promise<void>; // Password now used by Firebase
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!auth) { // Ensure auth is initialized (client-side)
      setIsLoading(false); // Potentially handle this state differently if auth isn't ready
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // User is signed in, get their profile from Firestore
        const userDocRef = doc(db, "users", fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUser({ id: userDocSnap.id, ...userDocSnap.data() } as User);
        } else {
          // This case should ideally not happen if user profile is created on signup
          // Or, it could mean we need to create a profile if it's missing
          console.warn("User document not found in Firestore for UID:", fbUser.uid);
          setUser(null); // Or handle profile creation
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [router]);

  const login = async (email: string, password_unused?: string) => {
    // This is a mock login as Firebase requires a password.
    // The actual Firebase login will happen on the login page.
    // This function is now mostly for updating local state IF a user object is passed directly
    // or could be removed/refactored if login page handles all Firebase auth calls.

    // For the demo, we simulate a direct login with pre-defined user details for non-Firebase flow
    // This part will be superseded by Firebase login page logic
    if (!password_unused && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) { // Fallback to old mock if no Firebase
        const mockUser: User = {
          id: Date.now().toString(),
          email,
          name: email.split('@')[0],
          role: email.startsWith('admin') ? 'admin' : 'player',
          avatarUrl: `https://picsum.photos/seed/${email}/40/40`,
        };
        setUser(mockUser);
        // localStorage.setItem("currentUser", JSON.stringify(mockUser)); // No longer using localStorage for session
        router.push("/dashboard");
        return;
    }
    // If password_unused or Firebase is configured, it implies Firebase login is handled elsewhere (e.g. login page)
    // This function might not be directly called with email/password anymore if login page uses signInWithEmailAndPassword directly.
    // If it is, it should call Firebase here. For now, assume login page handles it.
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
      // localStorage.removeItem("currentUser"); // No longer using localStorage
      router.push("/login");
    } catch (error: any) {
      console.error("Error signing out: ", error);
      toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Signup now creates user in Firebase Auth and Firestore
  const signup = async (email: string, name: string, password_unused?: string, role: UserRole = "player") => {
     // This is a mock signup as Firebase requires a password.
    // The actual Firebase signup will happen on the signup page.
    if (!password_unused && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) { // Fallback to old mock if no Firebase
        const mockUser: User = {
          id: Date.now().toString(),
          email,
          name,
          role,
          avatarUrl: `https://picsum.photos/seed/${email}/40/40`,
        };
        setUser(mockUser);
        router.push("/dashboard");
        return;
    }
    // If password_unused or Firebase is configured, actual signup is handled on signup page.
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, isLoading, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
