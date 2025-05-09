
export type UserRole = "admin" | "player";

export interface User {
  id: string; // Firestore document ID
  uid: string; // Firebase Auth UID
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt?: string; // ISO string from serverTimestamp
  // order?: number; // If using for player list ordering
}

export interface Match {
  id: string;
  date: string; // ISO string "yyyy-MM-dd"
  time: string; // e.g., "14:00"
  opponent: string;
  location?: string; 
  attendance: Record<string, "present" | "absent" | "excused" | "unknown">; // userId (Firebase UID): status
  order?: number; // For DND ordering if implemented with Firestore
  // createdAt?: string; // ISO string from serverTimestamp
  // updatedAt?: string; // ISO string from serverTimestamp
}

export interface Training {
  id: string;
  date: string; // ISO string "yyyy-MM-dd"
  time: string; // e.g., "19:00"
  location: string;
  description?: string;
  attendance: Record<string, "present" | "absent" | "excused" | "unknown">; // userId (Firebase UID): status
  order?: number; // For DND ordering if implemented with Firestore
  // createdAt?: string;
  // updatedAt?: string;
}

// Team type might be less relevant if data is denormalized or fetched separately.
// It could represent a specific team's metadata if the app supports multiple teams.
export interface Team {
  id: string;
  name: string;
  // members, matches, trainings might be IDs or fetched dynamically rather than stored directly in a team document
}
