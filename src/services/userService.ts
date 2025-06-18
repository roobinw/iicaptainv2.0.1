
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
import { toast } from '@/hooks/use-toast'; // Added for potential info toast

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
    isTrainingMember: data.isTrainingMember ?? false,
    isMatchMember: data.isMatchMember ?? false,
    isTeamManager: data.isTeamManager ?? false,
    isTrainer: data.isTrainer ?? false,
    isCoach: data.isCoach ?? false,
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
  memberData: { 
    email: string; 
    password?: string; 
    name: string; 
    role: UserRole;
    isTrainingMember?: boolean;
    isMatchMember?: boolean;
    isTeamManager?: boolean;
    isTrainer?: boolean;
    isCoach?: boolean;
  },
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
      uid: newAuthUser.uid, 
      name: memberData.name,
      email: memberData.email.toLowerCase(),
      role: memberData.role, 
      teamId: teamId,
      avatarUrl: `https://picsum.photos/seed/${memberData.email.toLowerCase()}/80/80`,
      isTrainingMember: memberData.isTrainingMember ?? true, // Default to true
      isMatchMember: memberData.isMatchMember ?? true,    // Default to true
      isTeamManager: memberData.isTeamManager ?? false,
      isTrainer: memberData.isTrainer ?? false,
      isCoach: memberData.isCoach ?? false,
      createdAt: serverTimestamp(),
    };

    await setDoc(userDocRef, newProfileData);
    return newAuthUser.uid; 

  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email address is already associated with an account.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('The password is too weak. Please use a stronger password.');
    }
    console.error("Error creating member auth account or Firestore profile:", error);
    throw new Error(error.message || "Failed to add member and create account.");
  }
};

export const updateUserProfile = async (uid: string, dataToUpdate: Partial<User>): Promise<void> => {
  if (!db) {
    console.error("Firestore not initialized in updateUserProfile");
    throw new Error("Firestore not initialized");
  }
  if (!uid) {
    console.error("User UID is required to update profile.");
    throw new Error("User UID is required to update profile.");
  }
  const userDocRef = doc(db, 'users', uid);

  // Create a mutable copy to ensure we don't modify the original object,
  // and to strip out fields that should never be updated by this function.
  const finalUpdateData = { ...dataToUpdate };

  // Fields that should never be updated via this specific form/service call by client
  delete finalUpdateData.id; // Firestore ID, not part of user modifiable data
  delete finalUpdateData.uid; // Firebase UID, immutable
  delete finalUpdateData.email; // Email changes require Firebase Auth specific methods
  delete finalUpdateData.createdAt; // Creation timestamp, immutable
  // teamId changes should be handled by a separate, dedicated process if ever needed, not this general profile update.
  // The payload from MembersPage does not include teamId, so this is mostly a safeguard.
  delete finalUpdateData.teamId; 

  // avatarUrl can be string or null (to delete). If it's undefined in finalUpdateData, it won't be sent.
  // If it's explicitly set to null by the form, it will be sent as null.
  
  // Ensure boolean fields are explicitly included, even if false,
  // as 'undefined' would skip them. The payload from MembersPage should always include them.
  if (finalUpdateData.hasOwnProperty('isTrainingMember')) finalUpdateData.isTrainingMember = !!finalUpdateData.isTrainingMember;
  if (finalUpdateData.hasOwnProperty('isMatchMember')) finalUpdateData.isMatchMember = !!finalUpdateData.isMatchMember;
  if (finalUpdateData.hasOwnProperty('isTeamManager')) finalUpdateData.isTeamManager = !!finalUpdateData.isTeamManager;
  if (finalUpdateData.hasOwnProperty('isTrainer')) finalUpdateData.isTrainer = !!finalUpdateData.isTrainer;
  if (finalUpdateData.hasOwnProperty('isCoach')) finalUpdateData.isCoach = !!finalUpdateData.isCoach;


  // Only proceed if there's actually something to update after stripping immutable fields.
  // This is a client-side check; Firestore rules are the authoritative source for what's allowed.
  if (Object.keys(finalUpdateData).length === 0) {
    // console.warn("updateUserProfile called with no effective changes for user:", uid);
    // This situation should ideally be caught by form.isDirty on the client.
    // If isDirty is true but finalUpdateData is empty, it might indicate an issue.
    // However, we'll still proceed to allow Firestore to make the final determination.
    // An empty update to Firestore is a no-op.
  }

  try {
    await updateDoc(userDocRef, finalUpdateData);
  } catch (error) {
    console.error("Firestore updateDoc error in updateUserProfile for UID:", uid, "Data Sent:", finalUpdateData, "Error:", error);
    throw error; // Re-throw to be caught by the calling function
  }
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

