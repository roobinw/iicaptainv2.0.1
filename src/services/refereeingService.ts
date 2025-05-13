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
import { format, parseISO, isValid } from "date-fns"; 
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
    // Check if the string is already in "yyyy-MM-dd" format or a full ISO string
    if (/^\d{4}-\d{2}-\d{2}$/.test(assignmentData.date)) {
        const parsed = parseISO(assignmentData.date + "T00:00:00Z"); // Treat as local date
        if (isValid(parsed)) {
            dateString = assignmentData.date;
        } else {
            console.error("Invalid date string format (not yyyy-MM-dd or not a valid date):", assignmentData.date);
            throw new Error("Invalid date format. Please use YYYY-MM-DD.");
        }
    } else { 
        // Try parsing as a full ISO string
        const parsedDate = parseISO(assignmentData.date);
        if (isValid(parsedDate)) {
            dateString = format(parsedDate, "yyyy-MM-dd");
        } else {
            console.error("Invalid date string format (not ISO or yyyy-MM-dd):", assignmentData.date);
            throw new Error("Invalid date format. Please use YYYY-MM-DD or a valid ISO string.");
        }
    }
  } else if (assignmentData.date instanceof Date) {
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

  if (dateValue !== undefined && dateValue !== null) {
    if (typeof dateValue === 'string') {
      try {
        let parsedDate;
        // Check for "yyyy-MM-dd" format first
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          // Append time to avoid timezone issues with parseISO for date-only strings
          parsedDate = parseISO(dateValue + "T00:00:00Z"); 
        } else {
          // Try parsing as a full ISO string
          parsedDate = parseISO(dateValue);
        }

        if (isValid(parsedDate)) {
          updateData.date = format(parsedDate, "yyyy-MM-dd");
        } else {
          console.error(`Date string "${dateValue}" in updateRefereeingAssignment is not a valid date format. Date will not be updated. AssignmentId: ${assignmentId}`);
        }
      } catch (e) {
        console.error(`Error parsing date string "${dateValue}" in updateRefereeingAssignment. Date will not be updated. AssignmentId: ${assignmentId}, Error: ${e}`);
      }
    } else if (typeof dateValue === 'object') { // Ensures dateValue is an object, not null (already checked), not string
        if (dateValue instanceof Date) { // Now safe to use instanceof
            updateData.date = format(dateValue, "yyyy-MM-dd");
        } else if ('toDate' in dateValue && typeof (dateValue as Timestamp).toDate === 'function') { // Duck-typing for Firestore Timestamp
            updateData.date = format((dateValue as Timestamp).toDate(), "yyyy-MM-dd");
        } else {
            console.error(`updateRefereeingAssignment received an unhandled object type for date. AssignmentId: ${assignmentId}, Value:`, dateValue);
        }
    } else {
      // This path should ideally not be hit if the type 'string | Date | Timestamp | null | undefined' is accurate for data.date
      console.error(`updateRefereeingAssignment received an unexpected non-object, non-string date type. AssignmentId: ${assignmentId}, Value:`, dateValue, `Type: ${typeof dateValue}`);
    }
  }
  
  // Populate other fields for update, excluding date which is handled above
  for (const key in data) {
    if (key !== 'date' && Object.prototype.hasOwnProperty.call(data, key)) {
      const K = key as keyof typeof data; // Type assertion for key
      // Handle cases where optional fields might be explicitly set to null by a form, convert to Firestore-friendly values (e.g., empty string or remove)
      if (K === 'assignedPlayerUids' && (data as any)[K] === null) {
        updateData[K] = []; // Default to empty array if null
      } else if ((K === 'homeTeam' || K === 'notes') && ((data as any)[K] === null || (data as any)[K] === undefined)) {
        updateData[K] = ""; // Default to empty string
      } else {
        updateData[K] = data[K];
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

