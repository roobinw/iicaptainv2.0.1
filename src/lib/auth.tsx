"use client";

import type { User, UserRole, Team } from "@/types";
import { useRouter, usePathname } from "next/navigation";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser 
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, collection } from "firebase/firestore";
import { auth, db } from "./firebase"; 
import { useToast } from "@/hooks/use-toast";
import { createTeam, getTeamById } from "@/services/teamService";

interface AuthContextType {
  user: User | null;
  currentTeam: Team | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>; 
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, name: string, teamName: string, password?: string) => Promise<void>; 
  refreshTeamData: () => Promise<void>;
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

  const fetchAndSetCurrentTeam = useCallback(async (teamId: string): Promise<Team | null> => {
    if (!teamId) {
      setCurrentTeam(null);
      return null;
    }
    try {
      const teamData = await getTeamById(teamId);
      setCurrentTeam(teamData);
      if (!teamData && pathname !== "/onboarding/create-team" && pathname !== "/login" && pathname !== "/signup") {
        toast({ title: "Team Not Found", description: "Your assigned team could not be loaded.", variant: "destructive" });
        router.replace("/onboarding/create-team");
      }
      return teamData;
    } catch (error: any) {
      console.error("AuthContext: Error fetching team data in fetchAndSetCurrentTeam:", error);
      setCurrentTeam(null);
      toast({ title: "Error Loading Team", description: error.message || "Could not load your team's data.", variant: "destructive" });
      if (pathname !== "/onboarding/create-team" && pathname !== "/login" && pathname !== "/signup") {
        router.replace("/onboarding/create-team");
      }
      return null;
    }
  }, [pathname, router, toast]);


  useEffect(() => {
    if (!auth || !db) { 
      setIsLoading(false); 
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true); 
      try {
        setFirebaseUser(fbUser);

        if (fbUser) {
          const userDocRef = doc(db, "users", fbUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = { id: userDocSnap.id, ...userDocSnap.data() } as User;
            setUser(userData);

            if (userData.teamId) {
              const fetchedTeam = await fetchAndSetCurrentTeam(userData.teamId);
              if (fetchedTeam) {
                if (pathname === "/login" || pathname === "/signup" || pathname === "/onboarding/create-team") {
                   router.replace("/dashboard");
                }
              } else { // Team not found or error, fetchAndSetCurrentTeam handles redirection if needed
                // setCurrentTeam(null) already handled by fetchAndSetCurrentTeam
              }
            } else {
              // User profile exists but no teamId
              setCurrentTeam(null);
              if (pathname !== "/onboarding/create-team" && pathname !== "/signup") { 
                   router.replace("/onboarding/create-team");
              }
            }
          } else {
            // Firebase Auth user exists (e.g. new Google sign-in), but no Firestore user profile. Create one.
            const newUserData: Omit<User, 'id' | 'createdAt'> & { createdAt: any } = {
              uid: fbUser.uid,
              email: fbUser.email!.toLowerCase(), 
              name: fbUser.displayName || "New User", 
              role: "player", // Default role, will be updated if they create a team
              teamId: undefined, // No teamId yet
              avatarUrl: fbUser.photoURL || `https://picsum.photos/seed/${fbUser.email!.toLowerCase()}/80/80`,
              createdAt: serverTimestamp(),
            };
            await setDoc(userDocRef, newUserData);
             // Simulate the structure of a fetched user for context, createdAt will be properly set on next full read
            const userForContext = { 
                ...newUserData, 
                id: fbUser.uid, 
                createdAt: new Date().toISOString(), // Approximate for immediate context
                teamId: undefined // Explicitly undefined
            } as User;
            setUser(userForContext);
            setCurrentTeam(null);
            if (pathname !== "/onboarding/create-team" && pathname !== "/signup") { 
                 router.replace("/onboarding/create-team");
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
      } catch (error: any) {
        console.error("AuthProvider: Critical error during auth state change processing:", error);
        setUser(null); 
        setCurrentTeam(null);
        setFirebaseUser(null); 
        
        let errorMessage = "An error occurred while loading your session.";
        if (error.message?.includes("client is offline") || error.code?.includes("unavailable")) {
            errorMessage = "You appear to be offline. Please check your connection and try again.";
        } else if (error.code === "permission-denied") {
            errorMessage = "You do not have permission to access some resources. Please contact support."
        }
        toast({
          title: "Session Error",
          description: errorMessage,
          variant: "destructive",
        });
        
        const nonAuthRoutes = ["/login", "/signup"];
        if (!nonAuthRoutes.includes(pathname) && !pathname.startsWith("/onboarding")) {
           router.replace("/login");
        }
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe(); 
  }, [router, toast, pathname, fetchAndSetCurrentTeam]);

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
      console.error("Firebase login error (AuthContext):", error);
      let errorMessage = "Failed to login. Please check your credentials.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential" || error.code === "auth/invalid-email") {
        errorMessage = "Invalid email or password.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.";
      }
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false); 
      throw error; 
    }
  };

  const loginWithGoogle = async () => {
    if (!auth) {
      toast({ title: "Google Sign-In Error", description: "Firebase authentication is not available.", variant: "destructive" });
      throw new Error("Firebase auth not initialized");
    }
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      // IMPORTANT: For "auth/unauthorized-domain" errors, you MUST add the domain
      // (e.g., localhost, or your deployed app's domain) to the list of authorized domains
      // in your Firebase project settings: Firebase Console -> Authentication -> Settings -> Authorized domains.
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle user creation/update and redirection.
    } catch (error: any) {
      console.error("Google Sign-In error (AuthContext):", error);
      let errorMessage = "Failed to sign in with Google. Please try again.";
      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Google Sign-In popup was closed. Please try again.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = "Multiple Google Sign-In popups were opened. Please try again.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "This domain is not authorized for Google Sign-In. Please add it to your Firebase project's Authentication settings (Sign-in method > Authorized domains).";
        console.error("IMPORTANT: To fix 'auth/unauthorized-domain', add the current domain (e.g., localhost or your app's domain) to the Firebase console: Authentication -> Settings -> Authorized domains.");
      }
      toast({
        title: "Google Sign-In Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
      throw error;
    }
  };


  const logout = async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error: any) {
      console.error("Error signing out: ", error);
      toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
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
        description: "Welcome to iiCaptain! Redirecting...",
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
      setIsLoading(false); 
      throw error; 
    }
  };

  const refreshTeamData = useCallback(async () => {
    if (user?.teamId) {
      setIsLoading(true);
      await fetchAndSetCurrentTeam(user.teamId);
      setIsLoading(false);
    }
  }, [user, fetchAndSetCurrentTeam]); 

  return (
    <AuthContext.Provider value={{ user, currentTeam, firebaseUser, isLoading, login, loginWithGoogle, logout, signup, refreshTeamData }}>
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

