
import type { User, Match, Training, Team, UserRole } from "@/types";
import { addDays, format } from "date-fns";

// The mock data arrays below are no longer actively used by the application for dynamic data.
// They can serve as a reference for data structure or for one-time database seeding.
// The application will fetch and manage data using Firestore services.

const createUsers = (count: number, role: UserRole = "member"): User[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${role}-${i + 1}`, // This ID might differ from Firebase UID
    uid: `firebase-uid-${role}-${i + 1}`, // Example Firebase UID
    name: `${role === 'admin' ? 'Admin' : 'Member'} ${i + 1}`,
    email: `${role}${i + 1}@example.com`,
    role: role,
    avatarUrl: `https://picsum.photos/seed/user${i + 1}/40/40`,
    createdAt: new Date().toISOString(),
    isTrainingMember: role === 'admin' ? true : Math.random() > 0.3,
    isMatchMember: role === 'admin' ? true : Math.random() > 0.3,
    isTeamManager: role === 'admin' ? true : false,
    isTrainer: false,
    isCoach: false,
  }));
};

// Example: mockPlayers and mockAdmins can be used for structure reference
const _mockMembers_reference = createUsers(15, "member");
const _mockAdmins_reference = createUsers(2, "admin");
export const _mockUsers_reference: User[] = [..._mockAdmins_reference, ..._mockMembers_reference];

const assignAttendance = (participants: User[]): Record<string, "present" | "absent" | "excused" | "unknown"> => {
  const attendance: Record<string, "present" | "absent" | "excused" | "unknown"> = {};
  participants.forEach(user => {
    // Use user.uid if participants are Firebase users, or user.id for old mock structure
    const keyId = user.uid || user.id; 
    const rand = Math.random();
    if (rand < 0.7) attendance[keyId] = "present";
    else if (rand < 0.85) attendance[keyId] = "absent";
    else if (rand < 0.95) attendance[keyId] = "excused";
    else attendance[keyId] = "unknown";
  });
  return attendance;
};


export const _mockMatches_reference: Match[] = [
  {
    id: "match-1",
    date: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    time: "14:00",
    opponent: "Rival FC",
    location: "Home Ground",
    attendance: assignAttendance(_mockMembers_reference.filter(m => m.isMatchMember)),
    isArchived: false,
    // order: 0, // If using order field
  },
  // ... more match examples
];

export const _mockTrainings_reference: Training[] = [
  {
    id: "training-1",
    date: format(addDays(new Date(), 3), "yyyy-MM-dd"),
    time: "19:00",
    location: "Training Pitch A",
    description: "Focus on passing drills and set pieces.",
    attendance: assignAttendance(_mockMembers_reference.filter(m => m.isTrainingMember)),
    isArchived: false,
    // order: 0, // If using order field
  },
  // ... more training examples
];

// mockTeam is no longer relevant as data is in separate Firestore collections
// export const mockTeam: Team = { ... };

// Functions that modified mock data arrays are removed as Firestore is the source of truth.
// export const addMockMatch = ...
// export const addMockTraining = ...
// export const addMockPlayer = ...
// export const updatePlayerAttendance = ...

