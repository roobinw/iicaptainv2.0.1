
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
      setIsLoading(true); // Start loading when auth state might change
      setFirebaseUser(fbUser);

      if (fbUser) {
        const userDocRef = doc(db, "users", fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = { id: userDocSnap.id, ...userDocSnap.data() } as User;
          setUser(userData);

          if (userData.teamId) {
            try {
              const teamData = await getTeamById(userData.teamId);
              setCurrentTeam(teamData);
              if (pathname === "/login" || pathname === "/signup" || pathname === "/onboarding/create-team") {
                router.replace("/dashboard");
              }
            } catch (teamError) {
              console.error("Error fetching team data:", teamError);
              setCurrentTeam(null); // Ensure team is null if fetch fails
              toast({ title: "Error", description: "Could not load your team's data.", variant: "destructive" });
              // Potentially redirect to an error page or /onboarding/create-team if team is crucial
              if (pathname !== "/onboarding/create-team") {
                  router.replace("/onboarding/create-team");
              }
            }
          } else {
            // User profile exists but no teamId
            setCurrentTeam(null);
            if (pathname !== "/onboarding/create-team" && pathname !== "/signup") { // Allow signup if they somehow got here
                 router.replace("/onboarding/create-team");
            }
          }
        } else {
          // Firebase Auth user exists, but no Firestore user profile
          setUser(null);
          setCurrentTeam(null);
          // This state suggests incomplete signup or an issue.
          // Redirect to signup to ensure profile creation.
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
        if (!nonAuthRoutes.includes(pathname) && !pathname.startsWith("/onboarding")) { // Allow onboarding if somehow accessed
          router.replace("/login");
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe(); 
  }, [router, toast, pathname]); // pathname dependency ensures re-evaluation on route change

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
      // onAuthStateChanged will handle fetching user data, team data, and redirection.
      // Toasting success here might be premature if onAuthStateChanged fails to load user data.
      // Let onAuthStateChanged complete fully.
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
    // setIsLoading(false) will be handled by onAuthStateChanged completing
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      // State updates (user, firebaseUser, currentTeam to null) are handled by onAuthStateChanged
      router.push("/login"); 
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error: any) {
      console.error("Error signing out: ", error);
      toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false); // Explicitly set loading false after logout attempt
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
        email: email, // Use lowercase email for consistency
        name: name,
        role: "admin" as UserRole, 
        teamId: newTeamId,
        avatarUrl: `https://picsum.photos/seed/${email.toLowerCase()}/80/80`,
        createdAt: serverTimestamp(),
      });
      
      // onAuthStateChanged will handle setting user state, team state, and redirecting to dashboard.
      // Toast can be shown here or wait for onAuthStateChanged to fully resolve.
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
    // setIsLoading(false) will be handled by onAuthStateChanged
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

// Removed setSubmitHook and setDataHook as they are anti-patterns.
// Signup data should be passed directly to the signup function.
