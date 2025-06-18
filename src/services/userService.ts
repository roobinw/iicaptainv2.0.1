
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
    avatarUrl: data.avatarUrl, // This could be null/undefined from Firestore
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

// Get all users (admins and members) for a specific team
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

// Get only members (role 'member') for a specific team
export const getMembersByTeamWithMemberRole = async (teamId: string): Promise<User[]> => {
  if (!db) {
    console.error("Firestore not initialized in getMembersByTeamWithMemberRole");
    return [];
  }
   if (!teamId) {
    console.warn("getMembersByTeamWithMemberRole called without teamId");
    return [];
  }
  const usersCol = collection(db, 'users');
  const q = query(usersCol, where('teamId', '==', teamId), where('role', '==', 'member'), orderBy('name', 'asc'));
  const memberSnapshot = await getDocs(q);
  return memberSnapshot.docs.map(docSnap => fromFirestoreUser(docSnap)).filter(user => user !== null) as User[];
};

// Admin adding a member profile to their team AND creating a Firebase Auth account.
export const addMemberProfileToTeam = async (
  memberData: { email: string; password?: string; name: string; role: UserRole },
  teamId: string
): Promise<string> => {
  if (!db || !firebaseAuth) {
    console.error("Firebase services not initialized in addMemberProfileToTeam");
    throw new Error("Firebase services not initialized");
  }
  if (!teamId) {
    console.error("TeamId is required to add a member profile.");
    throw new Error("TeamId is required.");
  }
  if (!memberData.email || !memberData.name) {
    throw new Error("Email and Name are required for the new member.");
  }
  if (!memberData.password) {
    throw new Error("Password is required to create an account for the new member.");
  }

  try {
    // 1. Create Firebase Authentication user
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, memberData.email, memberData.password);
    const newAuthUser = userCredential.user;

    // 2. Create Firestore user profile document with the new auth UID
    const userDocRef = doc(db, 'users', newAuthUser.uid); 

    const newProfileData: Omit<User, 'id' | 'createdAt'> & { createdAt: any } = {
      uid: newAuthUser.uid, // Use the Firebase Auth UID
      name: memberData.name,
      email: memberData.email.toLowerCase(),
      role: memberData.role, // This should be "member" or "admin" based on input
      teamId: teamId,
      avatarUrl: `https://picsum.photos/seed/${memberData.email.toLowerCase()}/80/80`,
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
    console.error("Error creating member auth account or Firestore profile:", error);
    throw new Error(error.message || "Failed to add member and create account.");
  }
};


export const updateUserProfile = async (uid: string, data: Partial<Omit<User, 'id' | 'uid' | 'email' | 'createdAt' | 'avatarUrl'> & { avatarUrl?: string | null }>): Promise<void> => {
   if (!db) {
    console.error("Firestore not initialized in updateUserProfile");
    throw new Error("Firestore not initialized");
  }
  if (!uid) {
    throw new Error("User UID is required to update profile.");
  }
  const userDocRef = doc(db, 'users', uid);
  
  // Construct the data object for Firestore update carefully
  // Explicitly typed to allow avatarUrl to be string or null
  const updateData: { [key: string]: any } = {}; 

  if (data.teamId !== undefined) updateData.teamId = data.teamId;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.name !== undefined) updateData.name = data.name;
  
  // Special handling for avatarUrl to allow setting it to null
  if (data.hasOwnProperty('avatarUrl')) { 
    updateData.avatarUrl = data.avatarUrl; // This will correctly pass null to Firestore if data.avatarUrl is null
  }

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

