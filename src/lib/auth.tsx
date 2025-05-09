
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
  login: (email: string, password?: string) => Promise<void>; 
  logout: () => Promise<void>;
  signup: (email: string, name: string, password?: string, role?: UserRole) => Promise<void>; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!auth) { 
      setIsLoading(false); 
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userDocRef = doc(db, "users", fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = { id: userDocSnap.id, ...userDocSnap.data() } as User;
          setUser(userData);
          // Check if current path is login or signup, then redirect to dashboard
          // This handles redirect after successful login/signup
          if (window.location.pathname === "/login" || window.location.pathname === "/signup") {
            router.replace("/dashboard");
          }
        } else {
          console.warn("User document not found in Firestore for UID:", fbUser.uid);
          // This case might happen if a user is authenticated with Firebase Auth
          // but their Firestore document was deleted or not created.
          // Log them out to prevent inconsistent state.
          await firebaseSignOut(auth);
          setUser(null);
          router.replace("/login"); // Or an error page
        }
      } else {
        setUser(null);
        // If user is not logged in and trying to access a protected route,
        // AppLayout will handle redirect. If on /, page.tsx handles it.
      }
      setIsLoading(false);
    });

    return () => unsubscribe(); 
  }, [router, toast]); // Added router and toast to dependencies

  const login = async (email: string, password?: string) => {
    if (!auth) {
      toast({ title: "Login Error", description: "Firebase authentication is not available.", variant: "destructive" });
      throw new Error("Firebase auth not initialized");
    }
    if (!password) {
      toast({ title: "Login Error", description: "Password is required.", variant: "destructive" });
      throw new Error("Password is required for login.");
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will pick this up, set user, and redirect.
      // Toast for success can be shown here or after user state is confirmed.
      // Showing it here for immediate feedback.
      toast({
        title: "Login Successful",
        description: "Welcome back! Redirecting...",
      });
    } catch (error: any) {
      console.error("Firebase login error (AuthContext):", error);
      let errorMessage = "Failed to login. Please check your credentials.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential" || error.code === "auth/invalid-email") {
        errorMessage = "Invalid email or password.";
      }
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error; 
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
      router.push("/login"); // Explicitly redirect to login after logout
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error: any) {
      console.error("Error signing out: ", error);
      toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const signup = async (email: string, name: string, password?: string, role: UserRole = "player") => {
    if (!auth || !db) {
        toast({ title: "Signup Error", description: "Firebase services are not available.", variant: "destructive" });
        throw new Error("Firebase services not initialized");
    }
    if (!password) {
        toast({ title: "Signup Error", description: "Password is required.", variant: "destructive" });
        throw new Error("Password is required for signup.");
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      const userDocRef = doc(db, "users", fbUser.uid);
      await setDoc(userDocRef, {
        uid: fbUser.uid,
        email: email,
        name: name,
        role: role,
        avatarUrl: `https://picsum.photos/seed/${email}/80/80`,
        createdAt: serverTimestamp(),
      });
      
      // onAuthStateChanged will pick this up, set user, and redirect.
      toast({
        title: "Account Created",
        description: "Welcome to TeamEase! Redirecting...",
      });
    } catch (error: any) {
      console.error("Firebase signup error (AuthContext):", error);
      let errorMessage = "Failed to create account. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email address is already in use.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Please choose a stronger password.";
      }
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error; 
    }
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

