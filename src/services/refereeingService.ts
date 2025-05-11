
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
  writeBatch, // Keep writeBatch if updateRefereeingAssignmentsOrder is ever re-added
  type Timestamp
} from 'firebase/firestore';
import { format, parseISO } from "date-fns"; 

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
    assignedPlayerUids: data.assignedPlayerUids || [], // Default to empty array
    notes: data.notes,
  } as RefereeingAssignment;
};

// The assignmentData type now reflects that assignedPlayerUids might not be present
export const addRefereeingAssignment = async (teamId: string, assignmentData: Omit<RefereeingAssignment, 'id' | 'assignedPlayerUids'> & { assignedPlayerUids?: string[] }): Promise<string> => {
  const firestorePayload = {
    date: assignmentData.date, 
    time: assignmentData.time,
    assignedPlayerUids: assignmentData.assignedPlayerUids || [], // Default to empty array if not provided
    notes: assignmentData.notes,
  };
  const assignmentsColRef = getRefereeingAssignmentsCollectionRef(teamId);
  const docRef = await addDoc(assignmentsColRef, firestorePayload);
  return docRef.id;
};

export const getRefereeingAssignments = async (teamId: string): Promise<RefereeingAssignment[]> => {
  if (!teamId) return [];
  const assignmentsColRef = getRefereeingAssignmentsCollectionRef(teamId);
  const q = query(assignmentsColRef, orderBy('date', 'asc'), orderBy('time', 'asc'));
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
  // Create a mutable copy of data to work with
  const updateData: { [key: string]: any } = { ...data };
  
  if (data.date && typeof data.date !== 'string') {
     // This case assumes data.date might be a Date object, which should ideally be formatted before calling this service
     console.warn("updateRefereeingAssignment received non-string date, formatting to yyyy-MM-dd", data.date);
     updateData.date = format(data.date as unknown as Date, "yyyy-MM-dd"); 
  } else if (data.date && typeof data.date === 'string') {
    // If it's a string, try to parse and reformat to ensure yyyy-MM-dd
    try {
        updateData.date = format(parseISO(data.date), "yyyy-MM-dd");
    } catch (e) {
        // If parsing fails, it might already be in yyyy-MM-dd or an unparseable format.
        // Log a warning but use the value as-is if it's unparseable, assuming it might be correct.
        console.warn(`Date string "${data.date}" in updateRefereeingAssignment was not in a standard ISO format. Using as is. Error: ${e}`);
        updateData.date = data.date;
    }
  }

  // Ensure assignedPlayerUids is handled correctly (e.g., not set to undefined if not provided)
  if (data.assignedPlayerUids === undefined && !(data.hasOwnProperty('assignedPlayerUids'))) {
    // If assignedPlayerUids is not in the partial update, don't modify it.
    delete updateData.assignedPlayerUids; // Remove from updateData if not explicitly passed
  } else if (data.assignedPlayerUids === null) {
     updateData.assignedPlayerUids = []; // Convert null to empty array
  }
  // If data.assignedPlayerUids is an array (including empty), it will be passed as is.

  await updateDoc(assignmentDocRef, updateData);
};

export const deleteRefereeingAssignment = async (teamId: string, assignmentId: string): Promise<void> => {
  const assignmentDocRef = getRefereeingAssignmentDocRef(teamId, assignmentId);
  await deleteDoc(assignmentDocRef);
};

