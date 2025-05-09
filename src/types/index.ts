
export type UserRole = "admin" | "player";

export interface User {
  id: string; // Firestore document ID
  uid: string; // Firebase Auth UID
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt?: string; // ISO string from serverTimestamp
  teamId?: string; // ID of the team the user belongs to
}

export interface Team {
  id: string; // Firestore document ID (teamId)
  name: string;
  ownerUid: string; // UID of the user who created the team
  createdAt?: string; // ISO string from serverTimestamp
}

export interface Match {
  id: string;
  // teamId: string; // No longer needed here if it's a subcollection of a team
  date: string; // ISO string "yyyy-MM-dd"
  time: string; // e.g., "14:00"
  opponent: string;
  location?: string; 
  attendance: Record<string, "present" | "absent" | "excused" | "unknown">; // userId (Firebase UID): status
  order?: number; // For DND ordering if implemented with Firestore
}

export interface Training {
  id: string;
  // teamId: string; // No longer needed here if it's a subcollection of a team
  date: string; // ISO string "yyyy-MM-dd"
  time: string; // e.g., "19:00"
  location: string;
  description?: string;
  attendance: Record<string, "present" | "absent" | "excused" | "unknown">; // userId (Firebase UID): status
  order?: number; // For DND ordering if implemented with Firestore
}
