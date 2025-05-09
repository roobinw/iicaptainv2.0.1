
"use client";

import type { User, UserRole } from "@/types";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, name?: string, role?: UserRole) => void;
  logout: () => void;
  signup: (email: string, name: string, role?: UserRole) => void; // Added for completeness
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulate checking for an existing session
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, name: string = "Demo User", role: UserRole = "admin") => {
    const mockUser: User = {
      id: Date.now().toString(),
      email,
      name,
      role,
      avatarUrl: `https://picsum.photos/seed/${email}/40/40`,
    };
    setUser(mockUser);
    localStorage.setItem("currentUser", JSON.stringify(mockUser));
    router.push("/dashboard");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
    router.push("/login");
  };
  
  const signup = (email: string, name: string, role: UserRole = "player") => {
    // In a real app, this would hit a backend API
    const mockUser: User = {
      id: Date.now().toString(),
      email,
      name,
      role,
      avatarUrl: `https://picsum.photos/seed/${email}/40/40`,
    };
    setUser(mockUser);
    localStorage.setItem("currentUser", JSON.stringify(mockUser));
    router.push("/dashboard");
  };


  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, signup }}>
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
