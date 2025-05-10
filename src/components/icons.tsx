
import {
  LayoutDashboard,
  CalendarDays, 
  Users,
  LogOut,
  PlusCircle,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Settings,
  UserCircle,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Sun,
  Moon,
  Search,
  ArrowLeft,
  GripVertical,
  Dumbbell, 
  MoreVertical, 
  KeyRound, // Added for password change
} from "lucide-react";

export const Icons = {
  Dashboard: LayoutDashboard,
  Matches: CalendarDays, 
  Trainings: Dumbbell, 
  Players: Users,
  Logout: LogOut,
  Add: PlusCircle,
  Edit: Edit,
  Delete: Trash2,
  ChevronDown: ChevronDown,
  ChevronRight: ChevronRight,
  MoreHorizontal: MoreHorizontal,
  Settings: Settings,
  User: UserCircle,
  Attendance: ClipboardList, 
  AlertCircle: AlertCircle,
  CheckCircle2: CheckCircle2,
  XCircle: XCircle,
  Sun: Sun,
  Moon: Moon,
  Search: Search,
  ArrowLeft: ArrowLeft,
  GripVertical: GripVertical,
  MoreVertical: MoreVertical,
  KeyRound: KeyRound, // Added
  TeamLogo: () => ( 
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  ),
  CalendarDays: CalendarDays,
  Google: () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
      <title>Google</title>
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.08-2.58 2.26-4.8 2.26-5.72 0-10.32-4.58-10.32-10.32s4.6-10.32 10.32-10.32c3.32 0 5.18 1.34 6.38 2.48l2.84-2.78C19.58 1.18 16.62 0 12.48 0 5.88 0 .02 5.88.02 12.48s5.86 12.48 12.46 12.48c3.24 0 6.08-1.08 8.1-3.24s3.12-5.64 3.12-8.76c0-.72-.08-1.36-.2-2.04h-11.02Z" fill="currentColor"/>
    </svg>
  ),
};
