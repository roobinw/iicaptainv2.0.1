
import type { User, Match, Training, Team, UserRole } from "@/types";
import { addDays, format } from "date-fns";

const createUsers = (count: number, role: UserRole = "player"): User[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${role}-${i + 1}`,
    name: `${role === 'admin' ? 'Admin' : 'Player'} ${i + 1}`,
    email: `${role}${i + 1}@example.com`,
    role: role,
    avatarUrl: `https://picsum.photos/seed/user${i + 1}/40/40`,
  }));
};

const mockPlayers = createUsers(15, "player");
const mockAdmins = createUsers(2, "admin");
export const mockUsers: User[] = [...mockAdmins, ...mockPlayers];

const assignAttendance = (participants: User[]): Record<string, "present" | "absent" | "excused" | "unknown"> => {
  const attendance: Record<string, "present" | "absent" | "excused" | "unknown"> = {};
  participants.forEach(user => {
    const rand = Math.random();
    if (rand < 0.7) attendance[user.id] = "present";
    else if (rand < 0.85) attendance[user.id] = "absent";
    else if (rand < 0.95) attendance[user.id] = "excused";
    else attendance[user.id] = "unknown";
  });
  return attendance;
};

export const mockMatches: Match[] = [
  {
    id: "match-1",
    date: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    time: "14:00",
    opponent: "Rival FC",
    location: "Home Ground",
    attendance: assignAttendance(mockPlayers),
  },
  {
    id: "match-2",
    date: format(addDays(new Date(), 14), "yyyy-MM-dd"),
    time: "15:30",
    opponent: "Warriors United",
    location: "Away Stadium",
    attendance: assignAttendance(mockPlayers),
  },
  {
    id: "match-3",
    date: format(addDays(new Date(), 21), "yyyy-MM-dd"),
    time: "11:00",
    opponent: "City Strikers",
    location: "Community Park",
    attendance: assignAttendance(mockPlayers),
  },
];

export const mockTrainings: Training[] = [
  {
    id: "training-1",
    date: format(addDays(new Date(), 3), "yyyy-MM-dd"),
    time: "19:00",
    location: "Training Pitch A",
    description: "Focus on passing drills and set pieces.",
    attendance: assignAttendance(mockPlayers),
  },
  {
    id: "training-2",
    date: format(addDays(new Date(), 10), "yyyy-MM-dd"),
    time: "18:30",
    location: "Indoor Arena",
    description: "Conditioning and tactical review.",
    attendance: assignAttendance(mockPlayers),
  },
  {
    id: "training-3",
    date: format(addDays(new Date(), 17), "yyyy-MM-dd"),
    time: "19:30",
    location: "Training Pitch B",
    description: "Match simulation and defensive strategies.",
    attendance: assignAttendance(mockPlayers),
  },
];

export const mockTeam: Team = {
  id: "team-1",
  name: "The Mighty Ducks",
  members: mockUsers,
  matches: mockMatches,
  trainings: mockTrainings,
};

// Functions to add/update mock data (client-side simulation)
export const addMockMatch = (newMatch: Omit<Match, 'id' | 'attendance'>): Match => {
  const match: Match = {
    ...newMatch,
    id: `match-${Date.now()}`,
    attendance: assignAttendance(mockPlayers), // Or initialize as all unknown
  };
  mockMatches.push(match);
  return match;
};

export const addMockTraining = (newTraining: Omit<Training, 'id' | 'attendance'>): Training => {
 туристических  const training: Training = {
    ...newTraining,
    id: `training-${Date.now()}`,
    attendance: assignAttendance(mockPlayers), // Or initialize as all unknown
  };
  mockTrainings.push(training);
  return training;
};

export const addMockPlayer = (newPlayer: Omit<User, 'id' | 'avatarUrl'>): User => {
  const player: User = {
    ...newPlayer,
    id: `user-${Date.now()}`,
    avatarUrl: `https://picsum.photos/seed/${newPlayer.email}/40/40`,
  };
  mockUsers.push(player);
  mockPlayers.push(player); // Assuming new players are added to the player list
  return player;
};

export const updatePlayerAttendance = (
  eventId: string,
  eventType: 'match' | 'training',
  playerId: string,
  status: "present" | "absent" | "excused" | "unknown"
) => {
  const eventList = eventType === 'match' ? mockMatches : mockTrainings;
  const eventIndex = eventList.findIndex(e => e.id === eventId);
  if (eventIndex !== -1) {
    eventList[eventIndex].attendance[playerId] = status;
  }
};
