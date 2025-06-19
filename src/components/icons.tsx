
import {
  LayoutDashboard,
  CalendarDays,
  Users, // Direct import for "Users"
  LogOut,
  PlusCircle,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Settings, // Direct import for "Settings"
  UserCircle,
  ClipboardList, // Direct import for "Attendance"
  AlertCircle,
  CheckCircle2,
  XCircle,
  Sun,
  Moon,
  Search,
  ArrowLeft,
  GripVertical,
  Dumbbell, // Direct import for "Trainings"
  MoreVertical,
  KeyRound,
  LifeBuoy, // Direct import for "Support"
  Gavel, // Direct import for "Refereeing"
  MessageSquare, // For single message icon
  MessagesSquare, // Direct import for "MessagesSquare"
  Archive,
  ArchiveX,
  Send,
  MapPin,
  Shield, // Added Shield for replacement
  type LucideProps,
  AlertTriangle, // Keep for fallback in AppLayout
} from "lucide-react";
import { cn } from "@/lib/utils";

// interface TeamLogoProps extends Omit<LucideProps, 'className'> {
//   className?: string;
// }

// const TeamLogoComponent = ({ className, ...props }: TeamLogoProps) => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//     className={cn("h-6 w-6", className)}
//     {...props}
//   >
//     <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
//   </svg>
// );

export const Icons = {
  // Icons used by AppLayout navItems
  Dashboard: LayoutDashboard,
  MessagesSquare: MessagesSquare,
  Matches: CalendarDays,
  Trainings: Dumbbell,
  Refereeing: Gavel,
  Users: Users, // For Members nav & marketing

  // Icons used by Marketing pages features
  Attendance: ClipboardList,

  // TeamLogo (custom SVG) - Replaced with Shield for diagnostics
  TeamLogo: Shield, // Was TeamLogoComponent

  // Other icons that might be used directly by other components
  Logout: LogOut,
  Add: PlusCircle,
  Edit: Edit,
  Delete: Trash2,
  ChevronDown: ChevronDown,
  ChevronRight: ChevronRight,
  MoreHorizontal: MoreHorizontal,
  Settings: Settings, // For user dropdown, SettingsPage
  User: UserCircle, // Might be used for default avatar placeholder
  AlertCircle: AlertCircle,
  AlertTriangle: AlertTriangle, // Keep for AppLayout fallback
  CheckCircle2: CheckCircle2,
  XCircle: XCircle,
  Sun: Sun,
  Moon: Moon,
  Search: Search,
  ArrowLeft: ArrowLeft,
  GripVertical: GripVertical,
  MoreVertical: MoreVertical,
  KeyRound: KeyRound, // For SettingsPage
  Support: LifeBuoy, // For user dropdown
  MessageSquare: MessageSquare, // For single message icon in Dashboard
  Archive: Archive,
  ArchiveX: ArchiveX,
  Send: Send,
  MapPin: MapPin, // No longer in nav, but keep for potential future use
};
