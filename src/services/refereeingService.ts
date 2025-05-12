
import { db } from '@/lib/firebase';
import type { RefereeingAssignment } from '@/types';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  getDoc,
  writeBatch, 
  type Timestamp,
  where, // Added for filtering by isArchived
} from 'firebase/firestore';
import { format, parseISO } from "date-fns"; 
// Removed unused import: import type { EventArchiveFilter } from './matchService'; 
import type { EventArchiveFilter } from '@/services/matchService';


const getRefereeingAssignmentsCollectionRef = (teamId: string) => {
  if (!db) {
    console.error("Firestore not initialized in getRefereeingAssignmentsCollectionRef");
    throw new Error("Firestore not initialized");
  }
  if (!teamId) {
    console.error("Team ID is required for refereeing assignment operations.");
    throw new Error("Team ID is required for refereeing assignment operations.");
  }
  return collection(db, 'teams', teamId, 'refereeingAssignments');
};

const getRefereeingAssignmentDocRef = (teamId: string, assignmentId: string) => {
  if (!db) {
    console.error("Firestore not initialized in getRefereeingAssignmentDocRef");
    throw new Error("Firestore not initialized");
  }
  if (!teamId) {
    console.error("Team ID is required for refereeing assignment operations.");
    throw new Error("Team ID is required for refereeing assignment operations.");
  }
  if (!assignmentId) {
    console.error("Assignment ID is required.");
    throw new Error("Assignment ID is required.");
  }
  return doc(db, 'teams', teamId, 'refereeingAssignments', assignmentId);
};

const fromFirestoreRefereeingAssignment = (docSnap: any): RefereeingAssignment => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    date: data.date,
    time: data.time,
    homeTeam: data.homeTeam, 
    assignedPlayerUids: data.assignedPlayerUids || [], 
    notes: data.notes,
    isArchived: data.isArchived || false, // Default to false
  } as RefereeingAssignment;
};

export const addRefereeingAssignment = async (teamId: string, assignmentData: Omit<RefereeingAssignment, 'id' | 'isArchived'>): Promise<string> => {
  const firestorePayload = {
    date: assignmentData.date, 
    time: assignmentData.time,
    homeTeam: assignmentData.homeTeam, 
    assignedPlayerUids: assignmentData.assignedPlayerUids || [], 
    notes: assignmentData.notes,
    isArchived: false, // Default new assignments to not archived
  };
  const assignmentsColRef = getRefereeingAssignmentsCollectionRef(teamId);
  const docRef = await addDoc(assignmentsColRef, firestorePayload);
  return docRef.id;
};

export const getRefereeingAssignments = async (teamId: string, filter: EventArchiveFilter = "active"): Promise<RefereeingAssignment[]> => {
  if (!teamId) return [];
  const assignmentsColRef = getRefereeingAssignmentsCollectionRef(teamId);
  
  let q;
  const baseQueryConstraints = [orderBy('date', 'asc'), orderBy('time', 'asc')];

  if (filter === "active") {
    q = query(assignmentsColRef, where('isArchived', '==', false), ...baseQueryConstraints);
  } else if (filter === "archived") {
    q = query(assignmentsColRef, where('isArchived', '==', true), ...baseQueryConstraints);
  } else { // 'all'
    q = query(assignmentsColRef, ...baseQueryConstraints);
  }
  
  const assignmentSnapshot = await getDocs(q);
  return assignmentSnapshot.docs.map(fromFirestoreRefereeingAssignment);
};

export const getRefereeingAssignmentById = async (teamId: string, assignmentId: string): Promise<RefereeingAssignment | null> => {
  if (!teamId || !assignmentId) return null;
  const assignmentDocRef = getRefereeingAssignmentDocRef(teamId, assignmentId);
  const docSnap = await getDoc(assignmentDocRef);
  return docSnap.exists() ? fromFirestoreRefereeingAssignment(docSnap) : null;
};

export const updateRefereeingAssignment = async (teamId: string, assignmentId: string, data: Partial<Omit<RefereeingAssignment, 'id'>>): Promise<void> => {
  const assignmentDocRef = getRefereeingAssignmentDocRef(teamId, assignmentId);
  const updateData: { [key: string]: any } = { ...data };
  
  if (data.date && typeof data.date !== 'string') {
     if (data.date instanceof Date) {
        console.warn("updateRefereeingAssignment received Date object for date, formatting to yyyy-MM-dd", data.date);
        updateData.date = format(data.date as unknown as Date, "yyyy-MM-dd"); 
     } else {
        try {
          updateData.date = format(parseISO(data.date as unknown as string), "yyyy-MM-dd");
        } catch (e) {
          console.error(`Date string "${String(data.date)}" in updateRefereeingAssignment was not a valid ISO string. Cannot format. Error: ${e}`);
          delete updateData.date;
        }
     }
  } else if (data.date && typeof data.date === 'string') {
    try {
        updateData.date = format(parseISO(data.date), "yyyy-MM-dd");
    } catch (e) {
        console.warn(`Date string "${data.date}" in updateRefereeingAssignment was not in a standard ISO format. Using as is. Error: ${e}`);
        updateData.date = data.date;
    }
  }

  if (data.assignedPlayerUids === undefined && !(data.hasOwnProperty('assignedPlayerUids'))) {
    delete updateData.assignedPlayerUids; 
  } else if (data.assignedPlayerUids === null) {
     updateData.assignedPlayerUids = []; 
  }
  
  if (data.homeTeam !== undefined) {
    updateData.homeTeam = data.homeTeam;
  } else if (data.hasOwnProperty('homeTeam') && data.homeTeam === null) {
    updateData.homeTeam = null; 
  }

  await updateDoc(assignmentDocRef, updateData);
};

export const deleteRefereeingAssignment = async (teamId: string, assignmentId: string): Promise<void> => {
  const assignmentDocRef = getRefereeingAssignmentDocRef(teamId, assignmentId);
  await deleteDoc(assignmentDocRef);
};

export const archiveRefereeingAssignment = async (teamId: string, assignmentId: string): Promise<void> => {
  const assignmentDocRef = getRefereeingAssignmentDocRef(teamId, assignmentId);
  await updateDoc(assignmentDocRef, { isArchived: true });
};

export const unarchiveRefereeingAssignment = async (teamId: string, assignmentId: string): Promise<void> => {
  const assignmentDocRef = getRefereeingAssignmentDocRef(teamId, assignmentId);
  await updateDoc(assignmentDocRef, { isArchived: false });
};

