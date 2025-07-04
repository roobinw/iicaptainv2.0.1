
export type UserRole = "admin" | "member";

// Explicitly define Firestore Timestamp type for clarity
export interface Timestamp {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
}

export interface User {
  id: string; // Firestore document ID, often same as uid
  uid: string; // Firebase Auth UID
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null; // Allow null for avatarUrl
  createdAt?: string; // ISO string from serverTimestamp
  teamId?: string; // ID of the team the user belongs to

  // New boolean role specifiers
  isTrainingMember?: boolean;
  isMatchMember?: boolean;
  isTeamManager?: boolean;
  isTrainer?: boolean;
  isCoach?: boolean;
}

export interface Team {
  id: string; // Firestore document ID (this will be the teamId)
  name: string;
  ownerUid: string; // UID of the user who created/owns the team
  createdAt?: string; // ISO string from serverTimestamp
}

export interface Match {
  id: string;
  date: string; // ISO string "yyyy-MM-dd"
  time: string; // e.g., "14:00"
  opponent: string;
  location?: string; 
  attendance: Record<string, "present" | "absent" | "excused" | "unknown">; // User's Firebase UID: status
  isArchived?: boolean; 
}

export interface Training {
  id: string;
  date: string; // ISO string "yyyy-MM-dd"
  time: string; // e.g., "19:00"
  location: string;
  description?: string;
  attendance: Record<string, "present" | "absent" | "excused" | "unknown">; // User's Firebase UID: status
  isArchived?: boolean; 
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

export interface RefereeingAssignment {
  id: string;
  date: string; // "yyyy-MM-dd"
  time: string; // "HH:mm"
  homeTeam?: string; // Name of the home team for the match being refereed
  assignedPlayerUids?: string[]; 
  notes?: string;
  isArchived?: boolean; 
}

export interface Message {
  id: string;
  content: string;
  authorUid: string;
  authorName: string;
  createdAt: string; // ISO string from serverTimestamp
  teamId: string; 
  isArchived?: boolean; 
}

export interface Location {
  id: string;
  name: string;
  address: string;
  createdAt?: string; // ISO string from serverTimestamp
  // teamId is implicit via subcollection path teams/{teamId}/locations/{locationId}
}

