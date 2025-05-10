
import { db } from '@/lib/firebase';
import type { Ticket } from '@/types';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

const ticketsCollectionRef = collection(db, 'tickets');

export interface NewTicketData {
  userId: string;
  userName: string;
  userEmail: string;
  teamId?: string;
  subject: string;
  message: string;
}

export const addTicket = async (ticketData: NewTicketData): Promise<string> => {
  if (!db) {
    console.error("Firestore not initialized in addTicket");
    throw new Error("Firestore not initialized");
  }

  const newTicketPayload = {
    ...ticketData,
    status: "open" as const, // Ensure status is correctly typed
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(ticketsCollectionRef, newTicketPayload);
  return docRef.id;
};
