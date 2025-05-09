
"use client";

import type { User, UserRole, Team } from "@/types";
import { useRouter, usePathname } from "next/navigation";
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
import { createTeam, getTeamById } from "@/services/teamService";

interface AuthContextType {
  user: User | null;
  currentTeam: Team | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>; 
  logout: () => Promise<void>;
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
    if (!auth || !db) { 
      setIsLoading(false); 
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true); 
      setFirebaseUser(fbUser);

      if (fbUser) {
        const userDocRef = doc(db, "users", fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = { id: userDocSnap.id, ...userDocSnap.data() } as User;
          setUser(userData);

          if (userData.teamId) {
            try {
              const teamData = await getTeamById(userData.teamId); // Server Action Call
              setCurrentTeam(teamData);

              if (!teamData) {
                // Team ID exists in user profile, but team document not found in Firestore
                console.warn(`AuthContext: User ${userData.uid} has teamId ${userData.teamId}, but team document was not found.`);
                toast({ title: "Team Not Found", description: "Your assigned team could not be loaded. Please contact support or try re-joining/creating a team.", variant: "destructive" });
                setCurrentTeam(null); // Ensure it's null
                if (pathname !== "/onboarding/create-team" && pathname !== "/login" && pathname !== "/signup") {
                  router.replace("/onboarding/create-team"); // Redirect to allow re-onboarding
                }
              } else if (pathname === "/login" || pathname === "/signup" || pathname === "/onboarding/create-team") {
                router.replace("/dashboard");
              }
            } catch (error: any) { // Catches errors from getTeamById server action
              console.error("AuthContext: Error fetching team data via getTeamById. Raw error:", error);
              let errorMessage = "Could not load your team's data due to a server issue.";
              if (error && error.message) {
                errorMessage = error.message;
              } else if (typeof error === 'string') {
                errorMessage = error;
              }
              try { 
                console.error("AuthContext: teamError details (stringified):", JSON.stringify(error, Object.getOwnPropertyNames(error)));
              } catch (stringifyError) {
                console.error("AuthContext: Could not stringify teamError:", stringifyError);
              }

              setCurrentTeam(null);
              toast({
                title: "Error Loading Team",
                description: errorMessage,
                variant: "destructive"
              });
              if (pathname !== "/onboarding/create-team" && pathname !== "/login" && pathname !== "/signup") {
                  router.replace("/onboarding/create-team");
              }
            }
          } else {
            // User profile exists but no teamId
            setCurrentTeam(null);
            if (pathname !== "/onboarding/create-team" && pathname !== "/signup") { 
                 router.replace("/onboarding/create-team");
            }
          }
        } else {
          // Firebase Auth user exists, but no Firestore user profile
          setUser(null);
          setCurrentTeam(null);
          if (pathname !== "/signup" && pathname !== "/onboarding/create-team") {
            router.replace("/signup");
          }
        }
      } else {
        // No Firebase Auth user (logged out)
        setUser(null);
        setFirebaseUser(null);
        setCurrentTeam(null);
        const nonAuthRoutes = ["/login", "/signup"];
        if (!nonAuthRoutes.includes(pathname) && !pathname.startsWith("/onboarding")) { 
          router.replace("/login");
        }
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
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setIsLoading(false);
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
      router.push("/login"); 
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error: any) {
      console.error("Error signing out: ", error);
      toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false); 
    }
  };
  
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
    if (!name.trim()) {
        toast({ title: "Signup Error", description: "Your name is required.", variant: "destructive" });
        throw new Error("Your name is required.");
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      const newTeamId = await createTeam(teamName, fbUser.uid);

      const userDocRef = doc(db, "users", fbUser.uid);
      await setDoc(userDocRef, {
        uid: fbUser.uid,
        email: email.toLowerCase(), 
        name: name,
        role: "admin" as UserRole, 
        teamId: newTeamId,
        avatarUrl: `https://picsum.photos/seed/${email.toLowerCase()}/80/80`,
        createdAt: serverTimestamp(),
      });
      
      toast({
        title: "Account & Team Created!",
        description: "Welcome to TeamEase! Redirecting...",
      });

    } catch (error: any) {
      setIsLoading(false);
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
