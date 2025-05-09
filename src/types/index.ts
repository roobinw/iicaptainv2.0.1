
export type UserRole = "admin" | "player";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Match {
  id: string;
  date: string; // ISO string or Date object
  time: string; // e.g., "14:00"
  opponent: string;
  location?: string; // Optional, for home/away or specific venue
  attendance: Record<string, "present" | "absent" | "excused" | "unknown">; // userId: status
}

export interface Training {
  id: string;
  date: string; // ISO string or Date object
  time: string; // e.g., "19:00"
  location: string;
  description?: string;
  attendance: Record<string, "present" | "absent" | "excused" | "unknown">; // userId: status
}

export interface Team {
  id: string;
  name: string;
  members: User[];
  matches: Match[];
  trainings: Training[];
}
