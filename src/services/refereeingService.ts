

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
  Timestamp, 
  where, 
} from 'firebase/firestore';
import { format, parseISO } from "date-fns"; 
// EventArchiveFilter is now imported from matchService to avoid local declaration issues
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

export const addRefereeingAssignment = async (teamId: string, assignmentData: Omit<RefereeingAssignment, 'id' | 'isArchived' | 'date'> & { date: string | Date }): Promise<string> => {
  let dateString: string;
  if (typeof assignmentData.date === 'string') {
     try {
      dateString = format(parseISO(assignmentData.date), "yyyy-MM-dd");
    } catch (e) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(assignmentData.date)) {
        dateString = assignmentData.date;
      } else {
        console.error("Invalid date string format in addRefereeingAssignment:", assignmentData.date);
        throw new Error("Invalid date format. Please use YYYY-MM-DD or a valid ISO string.");
      }
    }
  } else if (typeof assignmentData.date === 'object' && assignmentData.date instanceof Date) {
    dateString = format(assignmentData.date, "yyyy-MM-dd");
  } else {
    console.error("Invalid date type in addRefereeingAssignment:", assignmentData.date);
    throw new Error("Invalid date type. Date must be a string or Date object.");
  }

  const firestorePayload = {
    ...assignmentData,
    date: dateString, 
    homeTeam: assignmentData.homeTeam || "", 
    assignedPlayerUids: assignmentData.assignedPlayerUids || [], 
    notes: assignmentData.notes || "",
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

export const updateRefereeingAssignment = async (
  teamId: string, 
  assignmentId: string, 
  data: Partial<Omit<RefereeingAssignment, 'id'> & { date?: string | Date | Timestamp | null }>
): Promise<void> => {
  const assignmentDocRef = getRefereeingAssignmentDocRef(teamId, assignmentId);
  const updateData: { [key: string]: any } = {};

  const dateValue = data.date;

  if (typeof dateValue === 'string') {
    try {
      const parsedDate = parseISO(dateValue); 
      updateData.date = format(parsedDate, "yyyy-MM-dd");
    } catch (e) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        updateData.date = dateValue;
      } else {
        console.error(`Date string "${dateValue}" in updateRefereeingAssignment is not a valid ISO string or yyyy-MM-dd format. Date will not be updated. Error: ${e}`);
      }
    }
  } else if (typeof dateValue === 'object' && dateValue !== null) {
    if (dateValue instanceof Date) {
        updateData.date = format(dateValue, "yyyy-MM-dd");
    } else if ('toDate' in dateValue && typeof (dateValue as Timestamp).toDate === 'function') { 
        updateData.date = format((dateValue as Timestamp).toDate(), "yyyy-MM-dd");
    } else {
        console.error(`updateRefereeingAssignment received an unhandled object date type/value. Value:`, dateValue);
    }
  } else if (dateValue === null) {
    console.warn(`updateRefereeingAssignment received null for date. Date will not be updated for assignment: ${assignmentId}`);
  }


  for (const key in data) {
    if (key !== 'date' && Object.prototype.hasOwnProperty.call(data, key)) {
      if (key === 'assignedPlayerUids' && (data as any)[key] === null) {
        (updateData as any)[key] = [];
      } else if (key === 'homeTeam' && ((data as any)[key] === null || (data as any)[key] === undefined)) {
        (updateData as any)[key] = "";
      } else if (key === 'notes' && ((data as any)[key] === null || (data as any)[key] === undefined)) {
        (updateData as any)[key] = "";
      }
      else {
        (updateData as any)[key] = (data as any)[key];
      }
    }
  }
  
  if (Object.keys(updateData).length > 0) {
    await updateDoc(assignmentDocRef, updateData);
  } else {
    console.warn("updateRefereeingAssignment called with no effective changes for assignment:", assignmentId);
  }
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

