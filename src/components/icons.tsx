
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
  KeyRound, 
  LifeBuoy,
  Gavel, 
  MessageSquare,
  MessagesSquare, 
  Archive, 
  ArchiveX, 
  Send,
  MapPin, // Added for Locations
  type LucideProps,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamLogoProps extends Omit<LucideProps, 'className'> {
  className?: string;
}

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
  User: UserCircle, // For My Profile
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
  KeyRound: KeyRound, 
  Support: LifeBuoy,
  Refereeing: Gavel,
  MessageSquare: MessageSquare, 
  MessagesSquare: MessagesSquare, 
  Archive: Archive, 
  ArchiveX: ArchiveX, 
  Send: Send, 
  ClipboardList: ClipboardList, 
  MapPin: MapPin, // Added for Locations
  TeamLogo: ({ className, ...props }: TeamLogoProps) => ( 
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-6 w-6", className)} 
      {...props} 
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  ),
  CalendarDays: CalendarDays,
};
