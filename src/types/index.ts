
export type UserRole = "admin" | "player";

export interface User {
  id: string; // Firestore document ID, often same as uid
  uid: string; // Firebase Auth UID
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt?: string; // ISO string from serverTimestamp
  teamId?: string; // ID of the team the user belongs to
}

export interface Team {
  id: string; // Firestore document ID (this will be the teamId)
  name: string;
  ownerUid: string; // UID of the user who created/owns the team
  createdAt?: string; // ISO string from serverTimestamp
}

export interface Match {
  id: string;
  // teamId: string; // Removed as it's implicit from the subcollection path /teams/{teamId}/matches
  date: string; // ISO string "yyyy-MM-dd"
  time: string; // e.g., "14:00"
  opponent: string;
  location?: string; 
  attendance: Record<string, "present" | "absent" | "excused" | "unknown">; // User's Firebase UID: status
  order?: number; // For DND ordering
}

export interface Training {
  id: string;
  // teamId: string; // Removed as it's implicit from the subcollection path /teams/{teamId}/trainings
  date: string; // ISO string "yyyy-MM-dd"
  time: string; // e.g., "19:00"
  location: string;
  description?: string;
  attendance: Record<string, "present" | "absent" | "excused" | "unknown">; // User's Firebase UID: status
  order?: number; // For DND ordering
}

export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  teamId?: string; // Optional, if user is part of a team
  subject: string;
  message: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
}
