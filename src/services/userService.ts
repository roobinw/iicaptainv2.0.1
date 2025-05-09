
'use server'; 

import { db } from '@/lib/firebase';
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
  type Timestamp, // Explicitly import Timestamp
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';

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

// Admin adding a player profile to their team.
// This creates a user profile document, distinct from Firebase Auth users.
export const addPlayerProfileToTeam = async (
  playerData: Pick<User, 'name' | 'email' | 'role'>, // Role is now explicit
  teamId: string
): Promise<string> => {
  if (!db) {
    console.error("Firestore not initialized in addPlayerProfileToTeam");
    throw new Error("Firestore not initialized");
  }
  if (!teamId) {
    console.error("TeamId is required to add a player profile.");
    throw new Error("TeamId is required.");
  }
  
  // For manually added profiles, create a unique ID.
  // Using Firestore's auto-generated ID for the document.
  const usersCollectionRef = collection(db, 'users');
  const newPlayerDocRef = doc(usersCollectionRef); // Creates a ref with a new auto-generated ID

  const newProfileData: Omit<User, 'id' | 'createdAt'> & { createdAt: any } = {
    uid: newPlayerDocRef.id, // Use the Firestore document ID as the UID for these non-auth profiles
    name: playerData.name,
    email: playerData.email.toLowerCase(), // Store email in lowercase
    role: playerData.role || 'player', // Default to player if not specified, but form should provide it
    teamId: teamId,
    avatarUrl: `https://picsum.photos/seed/${playerData.email.toLowerCase()}/80/80`,
    createdAt: serverTimestamp(),
  };

  await setDoc(newPlayerDocRef, newProfileData);
  return newPlayerDocRef.id; 
};

// Allows updating user profile fields. Email is usually not updated here if it's linked to Firebase Auth.
// UID (document ID) should not be changed.
export const updateUserProfile = async (uid: string, data: Partial<Omit<User, 'id' | 'uid' | 'email' | 'createdAt'>>): Promise<void> => {
   if (!db) {
    console.error("Firestore not initialized in updateUserProfile");
    throw new Error("Firestore not initialized");
  }
  if (!uid) {
    throw new Error("User UID is required to update profile.");
  }
  const userDocRef = doc(db, 'users', uid);
  // Ensure sensitive fields like email (if auth linked), uid, id, createdAt are not directly updatable by client like this.
  // The 'data' param should only contain fields that are safe to update.
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
  const userDocRef = doc(db, 'users', uid);
  await deleteDoc(userDocRef);
};
