
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
  Timestamp, // Corrected import type Timestamp
  where, 
} from 'firebase/firestore';
import { format, parseISO } from "date-fns"; 
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
    isArchived: data.isArchived || false, 
  } as RefereeingAssignment;
};

export const addRefereeingAssignment = async (teamId: string, assignmentData: Omit<RefereeingAssignment, 'id' | 'isArchived'>): Promise<string> => {
  const firestorePayload = {
    date: assignmentData.date, 
    time: assignmentData.time,
    homeTeam: assignmentData.homeTeam, 
    assignedPlayerUids: assignmentData.assignedPlayerUids || [], 
    notes: assignmentData.notes,
    isArchived: false, 
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
  } else { 
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
  
  if (data.date !== undefined && data.date !== null) {
    if (typeof data.date === 'string') {
        try {
            const parsed = parseISO(data.date);
            updateData.date = format(parsed, "yyyy-MM-dd");
        } catch (e) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
                 console.warn(`Date string "${data.date}" in updateRefereeingAssignment is not ISO but matches yyyy-MM-dd. Using as is.`);
                 updateData.date = data.date;
            } else {
                console.error(`Date string "${data.date}" in updateRefereeingAssignment is not a valid ISO string nor yyyy-MM-dd. Date will not be updated. Error: ${e}`);
                delete updateData.date;
            }
        }
    } else if (typeof data.date === 'object' && data.date instanceof Date) {
        console.warn("updateRefereeingAssignment received Date object for date, formatting to yyyy-MM-dd", data.date);
        updateData.date = format(data.date, "yyyy-MM-dd");
    } else if (typeof data.date === 'object' && typeof (data.date as any).toDate === 'function') {
        console.warn("updateRefereeingAssignment received Timestamp-like object for date, formatting to yyyy-MM-dd", data.date);
        updateData.date = format((data.date as Timestamp).toDate(), "yyyy-MM-dd");
    } else {
        console.error(`updateRefereeingAssignment received unhandled date type: ${typeof data.date}. Date will not be updated.`);
        delete updateData.date;
    }
  } else if (data.hasOwnProperty('date') && data.date === null) {
    updateData.date = null;
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

