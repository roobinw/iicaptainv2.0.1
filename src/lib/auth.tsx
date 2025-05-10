
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
  type User as FirebaseUser,
  EmailAuthProvider, // Added for re-authentication
  reauthenticateWithCredential, // Added for re-authentication
  updatePassword // Added for password update
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, collection } from "firebase/firestore";
import { auth, db } from "./firebase"; 
import { useToast } from "@/hooks/use-toast";
import { createTeam, getTeamById } from "@/services/teamService";
import { getUserProfile } from "@/services/userService";

interface AuthContextType {
  user: User | null;
  currentTeam: Team | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>; 
  // loginWithGoogle: () => Promise<void>; // Removed as per user request
  logout: () => Promise<void>;
  signup: (email: string, name: string, teamName: string, password?: string) => Promise<void>; 
  refreshTeamData: () => Promise<void>;
  refreshAuthUser: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>; 
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
      if (!teamData && pathname !== "/onboarding/create-team" && pathname !== "/login" && pathname !== "/signup" && pathname !== "/" && !pathname.startsWith("/(marketing)")) {
        toast({ title: "Team Not Found", description: "Your assigned team could not be loaded.", variant: "destructive" });
        router.replace("/onboarding/create-team");
      }
      return teamData;
    } catch (error: any) {
      console.error("AuthContext: Error fetching team data in fetchAndSetCurrentTeam:", error);
      setCurrentTeam(null);
      toast({ title: "Error Loading Team", description: error.message || "Could not load your team's data.", variant: "destructive" });
      if (pathname !== "/onboarding/create-team" && pathname !== "/login" && pathname !== "/signup" && pathname !== "/" && !pathname.startsWith("/(marketing)")) {
        router.replace("/onboarding/create-team");
      }
      return null;
    }
  }, [pathname, router, toast]);

  const refreshAuthUser = useCallback(async () => {
    if (firebaseUser) {
      setIsLoading(true);
      try {
        const userProfile = await getUserProfile(firebaseUser.uid);
        if (userProfile) {
          setUser(userProfile);
          if (userProfile.teamId) {
            await fetchAndSetCurrentTeam(userProfile.teamId);
          } else {
            setCurrentTeam(null);
          }
        } else {
          setUser(null);
          setCurrentTeam(null);
        }
      } catch (error) {
        console.error("Error refreshing user data:", error);
        toast({ title: "Error Refreshing Data", description: "Could not refresh your profile information.", variant: "destructive"});
      } finally {
        setIsLoading(false);
      }
    }
  }, [firebaseUser, fetchAndSetCurrentTeam, toast]);


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
          const userProfile = await getUserProfile(fbUser.uid);

          if (userProfile) {
            setUser(userProfile);
            if (userProfile.teamId) {
              const fetchedTeam = await fetchAndSetCurrentTeam(userProfile.teamId);
              if (fetchedTeam) {
                 if (pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname.startsWith("/onboarding") || pathname.startsWith("/(marketing)")) {
                   router.replace("/dashboard");
                }
              }
            } else {
              setCurrentTeam(null);
              if (pathname !== "/onboarding/create-team" && pathname !== "/signup" && pathname !== "/" && !pathname.startsWith("/(marketing)") && pathname !== "/login" ) { 
                   router.replace("/onboarding/create-team");
              }
            }
          } else {
            // This case implies a Firebase Auth user exists but no Firestore profile.
            // This could happen if Google Sign-In was used and profile creation wasn't completed,
            // or if a user was created via Firebase console without a corresponding Firestore doc.
            // For new signups via email/password, the signup function handles profile creation.
            // For Google, a profile might need to be created here if it's the first sign-in.
            // However, since Google Sign-In was removed from the UI, this path is less likely for new users.
            // We'll proceed with a default profile creation if name/email are available from fbUser.
            const userDocRef = doc(db, "users", fbUser.uid);
            const newUserData: Omit<User, 'id' | 'createdAt'> & { createdAt: any } = {
              uid: fbUser.uid,
              email: fbUser.email!.toLowerCase(), 
              name: fbUser.displayName || `User-${fbUser.uid.substring(0,5)}`, // Default name
              role: "player", // Default role, user needs to create/join a team
              teamId: undefined, // No teamId initially
              avatarUrl: fbUser.photoURL || `https://picsum.photos/seed/${fbUser.email!.toLowerCase()}/80/80`,
              createdAt: serverTimestamp(),
            };
            await setDoc(userDocRef, newUserData);
            const userForContext = { 
                ...newUserData, 
                id: fbUser.uid, 
                createdAt: new Date().toISOString(), 
                teamId: undefined 
            } as User;
            setUser(userForContext);
            setCurrentTeam(null);
             if (pathname !== "/onboarding/create-team" && pathname !== "/signup" && pathname !== "/" && !pathname.startsWith("/(marketing)") && pathname !== "/login" ) { 
                router.replace("/onboarding/create-team");
            }
          }
        } else { // fbUser is null (user is not authenticated)
          setUser(null);
          setFirebaseUser(null);
          setCurrentTeam(null);
          
          // Define paths accessible to unauthenticated users
          const unauthenticatedAccessiblePaths = [
            "/", // Landing page
            "/login",
            "/signup",
            // Add any other public marketing paths like /privacy, /terms if they exist under /
            // Note: Paths under /app/(marketing) are handled by startsWith below.
          ];
          
          // Check if current path is one of the explicitly accessible paths,
          // or part of the /onboarding flow, or under the (marketing) group.
          const canStay = unauthenticatedAccessiblePaths.includes(pathname) || 
                          pathname.startsWith("/onboarding") || 
                          pathname.startsWith("/(marketing)");

          if (!canStay) {
            router.replace("/"); // Redirect to landing page if not on an accessible page
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
        
        // Define paths accessible to unauthenticated users (same as above)
        const unauthenticatedAccessiblePaths = [
            "/", "/login", "/signup", 
        ];
        const canStayOnError = unauthenticatedAccessiblePaths.includes(pathname) || 
                               pathname.startsWith("/onboarding") || 
                               pathname.startsWith("/(marketing)");
        
        if (!canStayOnError) {
           router.replace("/");
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
      // onAuthStateChanged will handle redirect to /dashboard or /onboarding/create-team
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
    // No setIsLoading(false) here, as onAuthStateChanged will set it.
  };

  // loginWithGoogle function was removed as per user request

  const logout = async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will set user to null and trigger redirect to landing page if necessary
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error: any) {
      console.error("Error signing out: ", error);
      toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
    } finally {
      // setIsLoading(false); // onAuthStateChanged handles this
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
      // onAuthStateChanged will handle redirect to /dashboard
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
    // No setIsLoading(false) here, as onAuthStateChanged will set it.
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!firebaseUser || !firebaseUser.email) {
      toast({ title: "Error", description: "User not authenticated or email missing.", variant: "destructive" });
      throw new Error("User not authenticated or email missing.");
    }
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      // Toast for success is handled in the component calling this.
    } catch (error: any) {
      console.error("Error changing password:", error);
      let errorMessage = "Failed to change password.";
      if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect current password.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "The new password is too weak.";
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = "This operation is sensitive and requires recent authentication. Please log in again before retrying this request.";
      }
      toast({ title: "Password Change Failed", description: errorMessage, variant: "destructive" });
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
    <AuthContext.Provider value={{ user, currentTeam, firebaseUser, isLoading, login, /*loginWithGoogle,*/ logout, signup, refreshTeamData, refreshAuthUser, changePassword }}>
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

