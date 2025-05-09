
'use server'; // Can be used by Server Components/Actions if needed, but primarily client below

import { db } from '@/lib/firebase';
import type { User, UserRole } from '@/types';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';

// Helper to convert Firestore Timestamps to JS Date objects or ISO strings
const processTimestamp = (timestamp: Timestamp | undefined): string | undefined => {
  return timestamp ? timestamp.toDate().toISOString() : undefined;
};

const fromFirestoreUser = (docSnap: any): User => {
  const data = docSnap.data();
  return {
    id: docSnap.id, // Firestore document ID
    uid: data.uid, // Firebase Auth UID
    name: data.name,
    email: data.email,
    role: data.role,
    avatarUrl: data.avatarUrl,
    createdAt: processTimestamp(data.createdAt),
    // lastLoginAt: processTimestamp(data.lastLoginAt), // Example if you add more fields
  } as User;
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
  if (!db) {
    console.error("Firestore not initialized");
    return null;
  }
  const userDocRef = doc(db, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);
  if (userDocSnap.exists()) {
    return fromFirestoreUser(userDocSnap);
  }
  return null;
};

export const getAllUsers = async (): Promise<User[]> => {
   if (!db) {
    console.error("Firestore not initialized");
    return [];
  }
  const usersCol = collection(db, 'users');
  const q = query(usersCol, orderBy('name', 'asc'));
  const userSnapshot = await getDocs(q);
  return userSnapshot.docs.map(fromFirestoreUser);
};


export const getPlayers = async (): Promise<User[]> => {
  if (!db) {
    console.error("Firestore not initialized");
    return [];
  }
  const usersCol = collection(db, 'users');
  const q = query(usersCol, where('role', '==', 'player'), orderBy('name', 'asc'));
  const playerSnapshot = await getDocs(q);
  return playerSnapshot.docs.map(fromFirestoreUser);
};

// Add player is typically handled during signup or by an admin action
// This function assumes an admin is adding a player manually (not through typical auth flow)
// Note: This doesn't create Firebase Auth credentials, only a Firestore profile.
// For a full user creation, you'd need to use Firebase Admin SDK or have the user sign up.
export const addPlayerProfile = async (playerData: Omit<User, 'id' | 'avatarUrl' | 'createdAt'> & { avatarUrl?: string }): Promise<string> => {
  if (!db) {
    console.error("Firestore not initialized");
    throw new Error("Firestore not initialized");
  }
  // A placeholder UID is needed if not creating auth user. This is not ideal for actual players.
  // Consider if this function is truly needed or if all players must come via auth signup.
  const uidForNonAuthPlayer = `manual-${Date.now()}`; 
  const userRef = doc(db, 'users', playerData.uid || uidForNonAuthPlayer); // Use provided UID or generate one
  await setDoc(userRef, {
    ...playerData,
    avatarUrl: playerData.avatarUrl || `https://picsum.photos/seed/${playerData.email}/80/80`,
    createdAt: serverTimestamp(),
  });
  return userRef.id;
};

export const updateUserProfile = async (uid: string, data: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>): Promise<void> => {
   if (!db) {
    console.error("Firestore not initialized");
    throw new Error("Firestore not initialized");
  }
  const userDocRef = doc(db, 'users', uid);
  // Filter out uid, email, createdAt from data to prevent accidental updates by client
  const { uid: _uid, email: _email, createdAt: _createdAt, ...updateData } = data as any;
  await updateDoc(userDocRef, updateData);
};

export const deleteUserProfile = async (uid: string): Promise<void> => {
   if (!db) {
    console.error("Firestore not initialized");
    throw new Error("Firestore not initialized");
  }
  // Note: This only deletes the Firestore profile, not the Firebase Auth user.
  // Deleting Firebase Auth user requires Admin SDK or reauthentication.
  const userDocRef = doc(db, 'users', uid);
  await deleteDoc(userDocRef);
};
