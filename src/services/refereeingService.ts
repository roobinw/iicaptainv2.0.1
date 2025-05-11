
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
import { format, parseISO } from "date-fns"; // Added for toast message formatting

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
    order: data.order,
    // homeTeam, awayTeam, location are removed
  } as RefereeingAssignment;
};

export const addRefereeingAssignment = async (teamId: string, assignmentData: Omit<RefereeingAssignment, 'id' | 'order'>): Promise<string> => {
  const firestorePayload = {
    date: assignmentData.date, // Already string "yyyy-MM-dd"
    time: assignmentData.time,
    assignedPlayerUids: assignmentData.assignedPlayerUids || [],
    notes: assignmentData.notes,
    order: (await getRefereeingAssignments(teamId)).length,
  };
  const assignmentsColRef = getRefereeingAssignmentsCollectionRef(teamId);
  const docRef = await addDoc(assignmentsColRef, firestorePayload);
  return docRef.id;
};

export const getRefereeingAssignments = async (teamId: string): Promise<RefereeingAssignment[]> => {
  if (!teamId) return [];
  const assignmentsColRef = getRefereeingAssignmentsCollectionRef(teamId);
  const q = query(assignmentsColRef, orderBy('order', 'asc'), orderBy('date', 'desc'), orderBy('time', 'desc'));
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
  // data will not contain homeTeam, awayTeam, location. date is string "yyyy-MM-dd"
  const updateData: Partial<RefereeingAssignment> = { ...data };
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

export const updateRefereeingAssignmentsOrder = async (teamId: string, orderedAssignments: Array<{ id: string; order: number }>): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  if (!teamId) throw new Error("Team ID is required for updating assignments order.");
  const batch = writeBatch(db);
  
  orderedAssignments.forEach(assignment => {
    const assignmentRef = getRefereeingAssignmentDocRef(teamId, assignment.id); 
    batch.update(assignmentRef, { order: assignment.order });
  });
  await batch.commit();
};
