
'use server';

import { db } from '@/lib/firebase';
import type { Team } from '@/types';
import {
  doc,
  addDoc,
  getDoc,
  serverTimestamp,
  collection,
  Timestamp,
} from 'firebase/firestore';

const fromFirestoreTeam = (docSnap: any): Team => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    ownerUid: data.ownerUid,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : undefined,
  } as Team;
};

export const createTeam = async (teamName: string, ownerUid: string): Promise<string> => {
  if (!db) throw new Error("Firestore not initialized");
  const teamData = {
    name: teamName,
    ownerUid: ownerUid,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, 'teams'), teamData);
  return docRef.id;
};

export const getTeamById = async (teamId: string): Promise<Team | null> => {
  if (!db) return null;
  const teamDocRef = doc(db, 'teams', teamId);
  const docSnap = await getDoc(teamDocRef);
  return docSnap.exists() ? fromFirestoreTeam(docSnap) : null;
};
