
export type UserRole = "admin" | "member"; // Reverted for current request, was boolean flags

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
  role: UserRole; // Reverted to string role
  // isAdmin: boolean; // Was: true if the user is an admin for their team
  // canParticipateInMatches: boolean; // Was: true if the member is eligible for matches
  // canParticipateInTrainings: boolean; // Was: true if the member is eligible for trainings
  // canBeAssignedRefereeing: boolean; // Was: true if the member can be assigned refereeing duties
  // isCoach: boolean; // Was: true if the member has coaching responsibilities
  // isTrainer: boolean; // Was: true if the member has trainer/physio responsibilities
  avatarUrl?: string;
  createdAt?: string; // ISO string from serverTimestamp
  teamId?: string; // ID of the team the user belongs to
  jerseyNumber?: number;
  position?: string;
  dateOfBirth?: string; // "yyyy-MM-dd"
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
}

export interface Team {
  id: string; // Firestore document ID (this will be the teamId)
  name: string;
  ownerUid: string; // UID of the user who created/owns the team
  createdAt?: string; // ISO string from serverTimestamp
  // inviteCode?: string; // Removed as per user request to simplify
}

export type AttendanceStatus = "present" | "absent" | "excused" | "unknown";
export type AvailabilityStatus = "available" | "unavailable" | "maybe" | "unknown";

export interface PlayerAvailability {
  playerId: string;
  status: AvailabilityStatus;
  notes?: string;
  updatedAt?: string; // ISO string from serverTimestamp
}

export interface Match {
  id: string;
  date: string; // ISO string "yyyy-MM-dd"
  time: string; // e.g., "14:00"
  opponent: string;
  location?: string; 
  attendance: Record<string, AttendanceStatus>; 
  isArchived?: boolean; 
  // availability is now a subcollection
}

export interface Training {
  id: string;
  date: string; // ISO string "yyyy-MM-dd"
  time: string; // e.g., "19:00"
  location: string;
  description?: string;
  attendance: Record<string, AttendanceStatus>; 
  isArchived?: boolean; 
  // availability is now a subcollection
}

export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  teamId?: string; 
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
  homeTeam?: string; 
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

export interface Opponent {
  id: string;
  name: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  homeGround?: string;
  createdAt?: string; // ISO string from serverTimestamp
  // teamId is implicit as it's a subcollection of team
}

export type EquipmentCondition = "new" | "good" | "fair" | "poor";

export interface Equipment {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  condition: EquipmentCondition;
  createdAt?: string; // ISO string from serverTimestamp
  // teamId is implicit as it's a subcollection of team
}

export interface PlayerStat {
  id: string; // Will be the player's UID
  playerId: string; // Firebase Auth UID of the player
  goals: number;
  assists: number;
  saves: number;
  yellowCards: number;
  redCards: number;
  updatedAt?: string; // ISO string from serverTimestamp
}

export interface PlayerAggregatedStats {
  playerId: string;
  name: string; // For display
  avatarUrl?: string; // For display
  matchesPlayed: number;
  totalGoals: number;
  totalAssists: number;
  totalSaves: number;
  totalYellowCards: number;
  totalRedCards: number;
}

export interface PlayerTrainingAttendanceStats {
    playerId: string;
    name: string;
    avatarUrl?: string;
    trainingsAttended: number;
    // totalTeamTrainings will be fetched separately for percentage calculation
}


export type EventArchiveFilter = "all" | "active" | "archived";

