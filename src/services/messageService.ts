
import { db } from '@/lib/firebase';
import type { Message } from '@/types';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import { format } from 'date-fns';

const getMessagesCollectionRef = (teamId: string) => {
  if (!db) {
    console.error("Firestore not initialized in getMessagesCollectionRef");
    throw new Error("Firestore not initialized");
  }
  if (!teamId) {
    console.error("Team ID is required for message operations.");
    throw new Error("Team ID is required for message operations.");
  }
  // This creates a reference to the subcollection `messages` under a specific team
  return collection(db, 'teams', teamId, 'messages');
};

const getMessageDocRef = (teamId: string, messageId: string) => {
   if (!db) {
    console.error("Firestore not initialized in getMessageDocRef");
    throw new Error("Firestore not initialized");
  }
  if (!teamId) {
    console.error("Team ID is required for message operations.");
    throw new Error("Team ID is required for message operations.");
  }
  if (!messageId) {
    console.error("Message ID is required.");
    throw new Error("Message ID is required.");
  }
  return doc(db, 'teams', teamId, 'messages', messageId);
};

const fromFirestoreMessage = (docSnap: any): Message => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    content: data.content,
    authorUid: data.authorUid,
    authorName: data.authorName,
    createdAt: data.createdAt instanceof Timestamp ? format(data.createdAt.toDate(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : data.createdAt,
    teamId: data.teamId,
  } as Message;
};

export const addMessage = async (
  teamId: string,
  content: string,
  authorUid: string,
  authorName: string
): Promise<string> => {
  const firestorePayload = {
    content,
    authorUid,
    authorName,
    teamId, // Store teamId for potential collection group queries if ever needed
    createdAt: serverTimestamp(),
  };
  const messagesColRef = getMessagesCollectionRef(teamId);
  const docRef = await addDoc(messagesColRef, firestorePayload);
  return docRef.id;
};

export const getMessages = async (teamId: string): Promise<Message[]> => {
  if (!teamId) return [];
  const messagesColRef = getMessagesCollectionRef(teamId);
  const q = query(messagesColRef, orderBy('createdAt', 'desc'));
  const messageSnapshot = await getDocs(q);
  return messageSnapshot.docs.map(fromFirestoreMessage);
};

export const deleteMessage = async (teamId: string, messageId: string): Promise<void> => {
  const messageDocRef = getMessageDocRef(teamId, messageId);
  await deleteDoc(messageDocRef);
};

// updateMessage (e.g., for pinning) can be added later if needed
// export const updateMessage = async (teamId: string, messageId: string, data: Partial<Message>): Promise<void> => {
//   const messageDocRef = getMessageDocRef(teamId, messageId);
//   await updateDoc(messageDocRef, data);
// };
