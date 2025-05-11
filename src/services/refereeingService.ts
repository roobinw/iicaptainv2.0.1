
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
    assignedPlayerUids: data.assignedPlayerUids || [],
    notes: data.notes,
    // order: data.order, // Order field removed
  } as RefereeingAssignment;
};

export const addRefereeingAssignment = async (teamId: string, assignmentData: Omit<RefereeingAssignment, 'id'>): Promise<string> => {
  const firestorePayload = {
    date: assignmentData.date, 
    time: assignmentData.time,
    assignedPlayerUids: assignmentData.assignedPlayerUids || [],
    notes: assignmentData.notes,
    // order: (await getRefereeingAssignments(teamId)).length, // Order field removed
  };
  const assignmentsColRef = getRefereeingAssignmentsCollectionRef(teamId);
  const docRef = await addDoc(assignmentsColRef, firestorePayload);
  return docRef.id;
};

export const getRefereeingAssignments = async (teamId: string): Promise<RefereeingAssignment[]> => {
  if (!teamId) return [];
  const assignmentsColRef = getRefereeingAssignmentsCollectionRef(teamId);
  // Sort by date ascending (soonest first), then by time ascending
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
  const updateData: Partial<RefereeingAssignment> = { ...data };
  
  if (data.date && typeof data.date !== 'string') {
     console.warn("updateRefereeingAssignment received non-string date, formatting to yyyy-MM-dd", data.date);
     updateData.date = format(parseISO(data.date as unknown as string), "yyyy-MM-dd"); // Assuming it might be Date
  } else if (data.date && typeof data.date === 'string') {
    try {
        updateData.date = format(parseISO(data.date), "yyyy-MM-dd");
    } catch (e) {
        console.warn(`Date string "${data.date}" in updateRefereeingAssignment was not in a standard ISO format. Using as is. Error: ${e}`);
        updateData.date = data.date;
    }
  }


  if (data.assignedPlayerUids === undefined && !(data.hasOwnProperty('assignedPlayerUids'))) {
    // If assignedPlayerUids is not in the partial update, don't modify it.
  } else if (data.assignedPlayerUids === null || data.assignedPlayerUids === undefined) {
     updateData.assignedPlayerUids = [];
  }
  await updateDoc(assignmentDocRef, updateData);
};

export const deleteRefereeingAssignment = async (teamId: string, assignmentId: string): Promise<void> => {
  const assignmentDocRef = getRefereeingAssignmentDocRef(teamId, assignmentId);
  await deleteDoc(assignmentDocRef);
};

// updateRefereeingAssignmentsOrder function removed as DND is removed
// export const updateRefereeingAssignmentsOrder = async (teamId: string, orderedAssignments: Array<{ id: string; order: number }>): Promise<void> => { ... };

