
// 'use server'; // Removed to run client-side

import { db } from '@/lib/firebase';
import type { Team } from '@/types';
import {
  doc,
  addDoc,
  getDoc,
  serverTimestamp,
  collection,
  type Timestamp, // Explicitly import Timestamp
  updateDoc, // Added for updateTeamName
} from 'firebase/firestore';

// Helper to convert Firestore Timestamp to ISO string or return undefined
const processTimestamp = (timestamp: Timestamp | undefined): string | undefined => {
  return timestamp ? timestamp.toDate().toISOString() : undefined;
};


const fromFirestoreTeam = (docSnap: any): Team | null => {
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    ownerUid: data.ownerUid,
    createdAt: processTimestamp(data.createdAt as Timestamp | undefined),
  } as Team;
};

export const createTeam = async (teamName: string, ownerUid: string): Promise<string> => {
  if (!db) {
      console.error("Firestore not initialized in createTeam");
      throw new Error("Firestore not initialized");
  }
  if (!teamName.trim()) {
    throw new Error("Team name cannot be empty.");
  }
  if (!ownerUid) {
    throw new Error("Owner UID is required to create a team.");
  }

  const teamData = {
    name: teamName,
    ownerUid: ownerUid,
    createdAt: serverTimestamp(),
  };
  const teamsCollectionRef = collection(db, 'teams');
  const docRef = await addDoc(teamsCollectionRef, teamData);
  return docRef.id;
};

export const getTeamById = async (teamId: string): Promise<Team | null> => {
  if (!db) {
    console.error("Firestore not initialized in getTeamById. Cannot fetch team.");
    // Instead of throwing, return null or an object indicating error, as AuthProvider expects a Promise<Team | null>
    // Throwing here can lead to unhandled promise rejections if not caught properly by caller.
    return null; 
  }
  if (!teamId) {
    console.warn("getTeamById called with no teamId");
    return null;
  }
  const teamDocRef = doc(db, 'teams', teamId);
  const docSnap = await getDoc(teamDocRef);
  return fromFirestoreTeam(docSnap);
};

export const updateTeamName = async (teamId: string, newName: string): Promise<void> => {
  if (!db) {
    console.error("Firestore not initialized in updateTeamName");
    throw new Error("Firestore not initialized");
  }
  if (!teamId) {
    throw new Error("Team ID is required to update team name.");
  }
  if (!newName.trim()) {
    throw new Error("New team name cannot be empty.");
  }
  const teamDocRef = doc(db, 'teams', teamId);
  await updateDoc(teamDocRef, { name: newName });
};
