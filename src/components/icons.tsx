
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Dumbbell,
  Gavel,
  Shield, 
  MessagesSquare,
  Archive,
  ArchiveX,
  Trash2, // Using Trash2 and aliasing as Delete
  MoreVertical,
  Edit,
  PlusCircle,
  LogOut as LucideLogOut, // Alias to avoid conflict if LogOut is used as a component name
  Settings as LucideSettings, // Alias for settings
  LifeBuoy,
  UserCircle,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Search,
  KeyRound,
  Send,
  AlertCircle,
  // Other icons might be needed by components not immediately visible/checked
  // Add them here if errors point to them.
} from "lucide-react";

// This is the central Icons export.
// Ensure all icons used throughout the app via `Icons.Something` are defined here.
export const Icons = {
  Dashboard: LayoutDashboard,
  MessagesSquare: MessagesSquare,
  Matches: CalendarDays,
  Trainings: Dumbbell,
  Refereeing: Gavel,
  Users: Users,
  TeamLogo: Shield, // TeamLogo is now Shield, used by AppLayout and Dashboard loading
  
  // Icons used on Dashboard and its child MessageCard
  Archive: Archive,
  ArchiveX: ArchiveX,
  Delete: Trash2, // Aliased from Trash2
  MoreVertical: MoreVertical,

  // Icons used by other components (ensure these are covered if used in SSR paths)
  Settings: LucideSettings,
  Support: LifeBuoy,
  User: UserCircle,
  Attendance: ClipboardList,
  CheckCircle2: CheckCircle2,
  XCircle: XCircle,
  AlertCircle: AlertCircle, // Used by AttendanceToggler, which is part of SSR'd cards
  Search: Search, // Used in Members page
  KeyRound: KeyRound, // Used in Settings page
  Send: Send, // Used in MessageInputForm (on Messages page)
  Edit: Edit, // Common action, e.g., MemberCard, EventCardBase
  Add: PlusCircle, // Common action
  LogOut: LucideLogOut, // Common action
};

// FallbackIcon for AppLayout's robust rendering - not part of the main Icons export
// This is imported directly in AppLayout.
// export const FallbackIcon = AlertTriangle;
