
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Dumbbell,
  Gavel,
  MessagesSquare,
  Shield, // For TeamLogo
  AlertTriangle, // General fallback, also used by AppLayout directly
  // For other components that might rely on the full Icons object,
  // this simplification will cause errors. This is a temporary diagnostic step.
  // If this works, we know the issue is with one of the REMOVED icons/exports in the original icons.tsx
  // Other icons like LogOut, PlusCircle, Edit, Trash2, etc., are temporarily removed.
  // Components needing them will either fail or need temporary adjustments if this diagnostic step is prolonged.
  Settings,
  LifeBuoy,
  UserCircle,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Search,
  MoreVertical,
  KeyRound,
  Archive,
  ArchiveX,
  Send,
  AlertCircle, // for AttendanceToggler
} from "lucide-react";

export const Icons = {
  // Icons used by AppLayout navItems
  Dashboard: LayoutDashboard,
  MessagesSquare: MessagesSquare,
  Matches: CalendarDays,
  Trainings: Dumbbell,
  Refereeing: Gavel,
  Users: Users,

  // TeamLogo
  TeamLogo: Shield,

  // Common fallback, also used by AppLayout directly if its own dynamic loading fails
  AlertTriangle: AlertTriangle,

  // Icons needed by other components that would break if not present
  // These were identified as potentially used by components visible in the authenticated part of the app
  Settings: Settings,
  Support: LifeBuoy, // Used in AppLayout user dropdown, but imported directly there. Kept for other uses.
  User: UserCircle,
  Attendance: ClipboardList, // For marketing page, but keeping as it's a general icon
  CheckCircle2: CheckCircle2,
  XCircle: XCircle,
  AlertCircle: AlertCircle,
  Search: Search,
  MoreVertical: MoreVertical, // Used in cards
  KeyRound: KeyRound, // Settings page
  Archive: Archive,
  ArchiveX: ArchiveX,
  Send: Send,
  Edit: Edit, // Common action
  Delete: Trash2, // Common action
  Add: PlusCircle, // Common action
  LogOut: LogOut, // Used in AppLayout user dropdown, but imported directly there. Kept for other uses.
};
