
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Icons } from "@/components/icons";
import { PanelLeft, LogOut, Settings as SettingsIcon, ChevronDown } from "lucide-react"; 

interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof Icons;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "Dashboard" },
  { href: "/matches", label: "Matches", icon: "Matches" },
  { href: "/trainings", label: "Trainings", icon: "Trainings" },
  { href: "/players", label: "Players", icon: "Players" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, currentTeam, logout, isLoading: authIsLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();


  if (authIsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Icons.Dashboard className="h-12 w-12 animate-spin text-primary" />
         <p className="ml-4 text-lg text-foreground">Loading Application...</p>
      </div>
    );
  }

  if (!user || (user && !user.teamId && pathname !== "/onboarding/create-team" && pathname !== "/signup" )) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Icons.Dashboard className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-foreground">Verifying access or redirecting...</p>
        </div>
    );
  }
  
  const getInitials = (name: string | undefined) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const sidebarNavigation = (
    <nav className="grid items-start justify-items-center gap-3 px-2"> {/* Increased gap from 1 to 3 */}
      {navItems.map((item) => {
        if (item.adminOnly && user?.role !== "admin") {
          return null;
        }
        const IconComponent = Icons[item.icon];
        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-lg transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:h-9 md:w-9",
                  pathname === item.href
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground"
                )}
              >
                <IconComponent className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-sidebar text-sidebar-foreground border-sidebar-border">
              {item.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );

  const mobileSidebarContent = (
     <nav className="grid items-start gap-2 px-2 text-sm font-medium">
      {navItems.map((item) => {
        if (item.adminOnly && user?.role !== "admin") {
          return null;
        }
        const IconComponent = Icons[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              pathname === item.href
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground"
            )}
          >
            <IconComponent className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );


  return (
    <div className="grid min-h-screen w-full md:grid-cols-[70px_1fr] lg:grid-cols-[70px_1fr]">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-sidebar md:flex md:flex-col md:justify-between">
        <div>
          <div className="flex h-14 items-center justify-center border-b border-sidebar-border px-2 lg:h-[60px]">
            <Link href="/dashboard" className="text-sidebar-foreground">
              <Icons.TeamLogo />
              <span className="sr-only">{currentTeam?.name || "iiCaptain"}</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            {sidebarNavigation}
          </div>
        </div>
        {/* User profile section at the bottom of sidebar */}
        {user && (
          <div className="mt-auto border-t border-sidebar-border p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full h-auto justify-center p-1">
                   <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user avatar"/>
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">User Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="ml-1 w-56">
                <DropdownMenuLabel className="truncate">
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  Support (soon)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      
      <div className="flex flex-col">
        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-sidebar p-0 text-sidebar-foreground w-[250px]">
               <div className="flex h-14 items-center border-b border-sidebar-border px-4">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
                  <Icons.TeamLogo />
                  <span className="">{currentTeam?.name || "iiCaptain"}</span>
                </Link>
              </div>
              <div className="flex-1 overflow-auto py-2">{mobileSidebarContent}</div>
                {/* User profile section at the bottom of mobile sidebar */}
                {user && (
                <div className="mt-auto border-t border-sidebar-border p-2">
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center justify-between w-full h-auto px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                            <div className="flex items-center gap-2 truncate">
                                <Avatar className="h-7 w-7">
                                    <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user avatar mobile"/>
                                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start truncate">
                                    <span className="text-sm font-medium truncate">{user.name}</span>
                                    <span className="text-xs text-sidebar-foreground/70 truncate">{user.email}</span>
                                </div>
                            </div>
                            <ChevronDown className="h-4 w-4 text-sidebar-foreground/70" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start" className="w-56 mb-1">
                        <DropdownMenuLabel className="truncate">
                            <div className="font-semibold">{user.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/settings')}>
                            <SettingsIcon className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>Support (soon)</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                )}
            </SheetContent>
          </Sheet>
          {/* Team Name in Header */}
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">{currentTeam?.name || "Team Dashboard"}</h1>
          </div>
          {/* Optional: Add search or other header elements here - keeping user menu in sidebar */}
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

