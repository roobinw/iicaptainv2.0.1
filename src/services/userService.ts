// 'use server';  // Removed to run client-side

import { db, auth as firebaseAuth } from '@/lib/firebase'; // Import auth as firebaseAuth
import type { User, UserRole } from '@/types';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  type Timestamp, 
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Import for creating auth user

const processTimestamp = (timestamp: Timestamp | undefined): string | undefined => {
  return timestamp ? timestamp.toDate().toISOString() : undefined;
};

const fromFirestoreUser = (docSnap: any): User | null => {
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id, 
    uid: data.uid, 
    name: data.name,
    email: data.email,
    role: data.role,
    avatarUrl: data.avatarUrl,
    teamId: data.teamId,
    createdAt: processTimestamp(data.createdAt as Timestamp | undefined),
  } as User;
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
  if (!db) {
    console.error("Firestore not initialized in getUserProfile");
    return null;
  }
  if (!uid) {
    console.warn("getUserProfile called with no UID");
    return null;
  }
  const userDocRef = doc(db, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);
  return fromFirestoreUser(userDocSnap);
};

// Get all users (admins and players) for a specific team
export const getAllUsersByTeam = async (teamId: string): Promise<User[]> => {
   if (!db) {
    console.error("Firestore not initialized in getAllUsersByTeam");
    return [];
  }
  if (!teamId) {
    console.warn("getAllUsersByTeam called without teamId");
    return [];
  }
  const usersCol = collection(db, 'users');
  const q = query(usersCol, where('teamId', '==', teamId), orderBy('name', 'asc'));
  const userSnapshot = await getDocs(q);
  return userSnapshot.docs.map(docSnap => fromFirestoreUser(docSnap)).filter(user => user !== null) as User[];
};

// Get only players (role 'player') for a specific team
export const getPlayersByTeam = async (teamId: string): Promise<User[]> => {
  if (!db) {
    console.error("Firestore not initialized in getPlayersByTeam");
    return [];
  }
   if (!teamId) {
    console.warn("getPlayersByTeam called without teamId");
    return [];
  }
  const usersCol = collection(db, 'users');
  const q = query(usersCol, where('teamId', '==', teamId), where('role', '==', 'player'), orderBy('name', 'asc'));
  const playerSnapshot = await getDocs(q);
  return playerSnapshot.docs.map(docSnap => fromFirestoreUser(docSnap)).filter(user => user !== null) as User[];
};

// Admin adding a player profile to their team AND creating a Firebase Auth account.
export const addPlayerProfileToTeam = async (
  playerData: { email: string; password?: string; name: string; role: UserRole },
  teamId: string
): Promise<string> => {
  if (!db || !firebaseAuth) {
    console.error("Firebase services not initialized in addPlayerProfileToTeam");
    throw new Error("Firebase services not initialized");
  }
  if (!teamId) {
    console.error("TeamId is required to add a player profile.");
    throw new Error("TeamId is required.");
  }
  if (!playerData.email || !playerData.name) {
    throw new Error("Email and Name are required for the new player.");
  }
  if (!playerData.password) {
    throw new Error("Password is required to create an account for the new player.");
  }

  try {
    // 1. Create Firebase Authentication user
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, playerData.email, playerData.password);
    const newAuthUser = userCredential.user;

    // 2. Create Firestore user profile document with the new auth UID
    const userDocRef = doc(db, 'users', newAuthUser.uid); 

    const newProfileData: Omit<User, 'id' | 'createdAt'> & { createdAt: any } = {
      uid: newAuthUser.uid, // Use the Firebase Auth UID
      name: playerData.name,
      email: playerData.email.toLowerCase(),
      role: playerData.role,
      teamId: teamId,
      avatarUrl: `https://picsum.photos/seed/${playerData.email.toLowerCase()}/80/80`,
      createdAt: serverTimestamp(),
    };

    await setDoc(userDocRef, newProfileData);
    return newAuthUser.uid; // Return the new Firebase Auth UID

  } catch (error: any) {
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email address is already associated with an account.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('The password is too weak. Please use a stronger password.');
    }
    console.error("Error creating player auth account or Firestore profile:", error);
    throw new Error(error.message || "Failed to add player and create account.");
  }
};


export const updateUserProfile = async (uid: string, data: Partial<Omit<User, 'id' | 'uid' | 'email' | 'createdAt'>>): Promise<void> => {
   if (!db) {
    console.error("Firestore not initialized in updateUserProfile");
    throw new Error("Firestore not initialized");
  }
  if (!uid) {
    throw new Error("User UID is required to update profile.");
  }
  const userDocRef = doc(db, 'users', uid);
  
  const { teamId, role, name, avatarUrl } = data; 
  const updateData: Partial<User> = {};
  if (teamId !== undefined) updateData.teamId = teamId;
  if (role !== undefined) updateData.role = role;
  if (name !== undefined) updateData.name = name;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

  if (Object.keys(updateData).length === 0) {
    console.warn("updateUserProfile called with no data to update for UID:", uid);
    return;
  }
  
  await updateDoc(userDocRef, updateData);
};

export const deleteUserProfile = async (uid: string): Promise<void> => {
   if (!db) {
    console.error("Firestore not initialized in deleteUserProfile");
    throw new Error("Firestore not initialized");
  }
  if (!uid) {
    throw new Error("User UID is required to delete profile.");
  }
  // This only deletes the Firestore user profile.
  // Deleting the Firebase Auth user is a separate, more complex operation,
  // typically requiring admin privileges or re-authentication of the user.
  const userDocRef = doc(db, 'users', uid);
  await deleteDoc(userDocRef);
};