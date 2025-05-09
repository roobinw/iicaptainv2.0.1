
'use server'; 

import { db } from '@/lib/firebase';
import type { User, UserRole } from '@/types';
import {
  collection,
  doc,
  setDoc, // Changed from addDoc for specific UID usage
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

const processTimestamp = (timestamp: Timestamp | undefined): string | undefined => {
  return timestamp ? timestamp.toDate().toISOString() : undefined;
};

const fromFirestoreUser = (docSnap: any): User => {
  const data = docSnap.data();
  return {
    id: docSnap.id, 
    uid: data.uid, 
    name: data.name,
    email: data.email,
    role: data.role,
    avatarUrl: data.avatarUrl,
    teamId: data.teamId, // Include teamId
    createdAt: processTimestamp(data.createdAt),
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

// Get all users belonging to a specific team
export const getAllUsersByTeam = async (teamId: string): Promise<User[]> => {
   if (!db) {
    console.error("Firestore not initialized");
    return [];
  }
  if (!teamId) {
    console.warn("getAllUsersByTeam called without teamId");
    return [];
  }
  const usersCol = collection(db, 'users');
  const q = query(usersCol, where('teamId', '==', teamId), orderBy('name', 'asc'));
  const userSnapshot = await getDocs(q);
  return userSnapshot.docs.map(fromFirestoreUser);
};

// Get players (role 'player') for a specific team
export const getPlayersByTeam = async (teamId: string): Promise<User[]> => {
  if (!db) {
    console.error("Firestore not initialized");
    return [];
  }
   if (!teamId) {
    console.warn("getPlayersByTeam called without teamId");
    return [];
  }
  const usersCol = collection(db, 'users');
  const q = query(usersCol, where('teamId', '==', teamId), where('role', '==', 'player'), orderBy('name', 'asc'));
  const playerSnapshot = await getDocs(q);
  return playerSnapshot.docs.map(fromFirestoreUser);
};

// Admin adding a player profile to their team.
// This still creates a profile without auth credentials.
export const addPlayerProfileToTeam = async (
  playerData: Omit<User, 'id' | 'avatarUrl' | 'createdAt' | 'uid' | 'teamId'>, 
  teamId: string
): Promise<string> => {
  if (!db) {
    console.error("Firestore not initialized");
    throw new Error("Firestore not initialized");
  }
  if (!teamId) {
    console.error("TeamId is required to add a player profile.");
    throw new Error("TeamId is required.");
  }
  
  // For manually added profiles, we might generate a UID or expect one.
  // For simplicity, let's use a generated ID for the document and a placeholder for uid.
  // This distinguishes them from auth users.
  const newPlayerUid = `manual-${Date.now()}`;
  const userRef = doc(db, 'users', newPlayerUid); // Use generated UID for doc ID

  await setDoc(userRef, {
    ...playerData,
    uid: newPlayerUid, // Store the generated UID in the document
    teamId: teamId,
    role: 'player' as UserRole, // Default role for manually added profiles
    avatarUrl: playerData.avatarUrl || `https://picsum.photos/seed/${playerData.email}/80/80`,
    createdAt: serverTimestamp(),
  });
  return userRef.id; // This is newPlayerUid
};

export const updateUserProfile = async (uid: string, data: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>): Promise<void> => {
   if (!db) {
    console.error("Firestore not initialized");
    throw new Error("Firestore not initialized");
  }
  const userDocRef = doc(db, 'users', uid);
  const { uid: _uid, email: _email, createdAt: _createdAt, id: _id, ...updateData } = data as any;
  await updateDoc(userDocRef, updateData);
};

export const deleteUserProfile = async (uid: string): Promise<void> => {
   if (!db) {
    console.error("Firestore not initialized");
    throw new Error("Firestore not initialized");
  }
  const userDocRef = doc(db, 'users', uid);
  await deleteDoc(userDocRef);
};
