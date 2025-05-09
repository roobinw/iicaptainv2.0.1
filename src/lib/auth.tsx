
"use client";

import type { User, UserRole, Team } from "@/types";
import { useRouter, usePathname } from "next/navigation"; // Added usePathname
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  type User as FirebaseUser 
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase"; 
import { useToast } from "@/hooks/use-toast";
import { createTeam, getTeamById } from "@/services/teamService"; // Import team service

interface AuthContextType {
  user: User | null;
  currentTeam: Team | null; // Added currentTeam
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>; 
  logout: () => Promise<void>;
  // Signup signature changed to include teamName
  signup: (email: string, name: string, teamName: string, password?: string) => Promise<void>; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
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

          if (userData.teamId) {
            const teamData = await getTeamById(userData.teamId);
            setCurrentTeam(teamData);
            if (pathname === "/login" || pathname === "/signup" || pathname === "/onboarding/create-team") {
              router.replace("/dashboard");
            }
          } else {
            // User exists but has no teamId, redirect to create team flow
            setCurrentTeam(null);
            if (pathname !== "/onboarding/create-team") {
                 router.replace("/onboarding/create-team");
            }
          }
        } else {
          // This case implies an issue, e.g., auth user exists but no Firestore doc.
          // This might occur if signup failed midway. For now, redirect to signup or a special onboarding.
          // Or, if they are a new user who hasn't completed team setup.
          console.warn("User document not found in Firestore for UID:", fbUser.uid);
          setCurrentTeam(null);
          setUser(null); // Clear partial user state
          // Redirect to a flow that ensures user profile and team are set up.
          // For a new user, this might be signup. For an existing auth user missing profile, it's an edge case.
          if (pathname !== "/signup" && pathname !== "/onboarding/create-team") {
            router.replace("/signup"); // Or a dedicated onboarding page
          }
        }
      } else {
        setUser(null);
        setCurrentTeam(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe(); 
  }, [router, toast, pathname]);

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
      toast({
        title: "Login Successful",
        description: "Welcome back! Redirecting...",
      });
      // onAuthStateChanged will handle fetching user data, team data, and redirection.
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
      setCurrentTeam(null);
      router.push("/login"); 
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error: any) {
      console.error("Error signing out: ", error);
      toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Updated signup to include teamName and create a team
  const signup = async (email: string, name: string, teamName: string, password?: string) => {
    if (!auth || !db) {
        toast({ title: "Signup Error", description: "Firebase services are not available.", variant: "destructive" });
        throw new Error("Firebase services not initialized");
    }
    if (!password) {
        toast({ title: "Signup Error", description: "Password is required.", variant: "destructive" });
        throw new Error("Password is required for signup.");
    }
    if (!teamName.trim()) {
        toast({ title: "Signup Error", description: "Team name is required.", variant: "destructive" });
        throw new Error("Team name is required.");
    }

    setIsSubmitting(true); // Assuming setIsSubmitting is defined in the component using this
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      // 1. Create the team
      const newTeamId = await createTeam(teamName, fbUser.uid);

      // 2. Create user profile in Firestore, linking to the new team
      const userDocRef = doc(db, "users", fbUser.uid);
      await setDoc(userDocRef, {
        uid: fbUser.uid,
        email: data.email,
        name: data.name,
        role: "admin" as UserRole, // First user is admin of their team
        teamId: newTeamId,
        avatarUrl: `https://picsum.photos/seed/${data.email}/80/80`,
        createdAt: serverTimestamp(),
      });
      
      toast({
        title: "Account & Team Created",
        description: "Welcome to TeamEase! You're now logged in.",
      });
      // onAuthStateChanged will handle setting user state, team state, and redirecting.
    } catch (error: any) {
      console.error("Firebase signup error (AuthContext):", error);
      let errorMessage = "Failed to create account. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email address is already in use.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Please choose a stronger password.";
      } else if (error.message.includes("Team name is required")) {
        errorMessage = "Team name is required.";
      }
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error; 
    } finally {
      // setIsSubmitting(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, currentTeam, firebaseUser, isLoading, login, logout, signup }}>
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

// Helper for components that might use setIsSubmitting
// This is a placeholder, actual setIsSubmitting should be managed by the calling component's state
let setIsSubmittingGl: (isSubmitting: boolean) => void = () => {};
const data = { email: "", name: "" }; // Placeholder, actual data comes from form
export const setSubmitHook = (hook: (isSubmitting: boolean) => void) => {
    setIsSubmittingGl = hook;
}
export const setDataHook = (emailData: string, nameData: string) => {
    data.email = emailData;
    data.name = nameData;
}

