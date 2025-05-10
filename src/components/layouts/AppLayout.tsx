
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
import { useEffect } from "react";

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

  useEffect(() => {
    if (!authIsLoading) { 
      const isMarketingPage = pathname === "/" || pathname.startsWith("/(marketing)");
      const isAuthPage = pathname === "/login" || pathname === "/signup";
      const isOnboardingPage = pathname.startsWith("/onboarding");

      if (!user) {
        if (!isMarketingPage && !isAuthPage && !isOnboardingPage) {
          router.replace("/"); 
        }
      } else if (user && !user.teamId && !isOnboardingPage) {
        router.replace("/onboarding/create-team");
      }
      else if (user && user.teamId && (isMarketingPage || isAuthPage || isOnboardingPage)) {
        router.replace("/dashboard");
      }
    }
  }, [user, authIsLoading, router, pathname]);


  if (authIsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Icons.TeamLogo className="h-12 w-12 animate-spin text-primary" />
         <p className="ml-4 text-lg text-foreground">Loading Application...</p>
      </div>
    );
  }

  if (!authIsLoading) {
    const isPublicPage = pathname === "/" || pathname.startsWith("/(marketing)");
    const isAuthFlowPage = pathname === "/login" || pathname === "/signup";
    const isOnboardingPage = pathname.startsWith("/onboarding");

    if (!user && !isPublicPage && !isAuthFlowPage && !isOnboardingPage) {
       return ( 
           <div className="flex h-screen items-center justify-center bg-background">
               <Icons.TeamLogo className="h-12 w-12 animate-spin text-primary" />
               <p className="ml-4 text-lg text-foreground">Redirecting...</p>
           </div>
       );
    }
    if (user && !user.teamId && !isOnboardingPage) {
      return (
          <div className="flex h-screen items-center justify-center bg-background">
              <Icons.TeamLogo className="h-12 w-12 animate-spin text-primary" />
              <p className="ml-4 text-lg text-foreground">Finalizing setup or redirecting...</p>
          </div>
      );
    }
  }


  const getInitials = (name: string | undefined) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const sidebarNavigation = (
    <nav className="grid items-start justify-items-center gap-3 px-2 py-4"> 
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
            <TooltipContent side="right" className="bg-card text-card-foreground border-border">
              {item.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );

  const mobileSidebarContent = (
     <nav className="grid items-start gap-2 px-2 py-4 text-sm font-medium">
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

  const userProfileDropdownContent = (
    <>
        <DropdownMenuLabel className="truncate">
            <div className="font-semibold">{user?.name}</div>
            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem onClick={() => router.push('/settings')} className="hover:bg-accent/50 cursor-pointer">
            <SettingsIcon className="mr-2 h-4 w-4" />
            <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="opacity-50">
            Support (soon)
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border"/>
        <DropdownMenuItem onClick={logout} className="hover:bg-accent/50 cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
        </DropdownMenuItem>
    </>
  );


  return (
    <div className="grid min-h-screen w-full md:grid-cols-[70px_1fr] lg:grid-cols-[70px_1fr]">
      {/* Desktop Sidebar */}
      <aside className="hidden border-r bg-sidebar md:flex md:flex-col md:justify-between p-2 shadow-lg sticky top-0 h-screen">
        <div> {/* Top part: logo and nav items */}
           <div className="flex h-10 items-center justify-center mb-4"> {/* Added SheetTrigger here for mobile */}
             <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 md:hidden h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" // Ensure visibility on sidebar bg
                >
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col bg-sidebar p-0 text-sidebar-foreground w-[250px] shadow-xl">
                 {user && ( 
                  <div className="border-b border-sidebar-border p-2">
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
                      <DropdownMenuContent side="bottom" align="start" className="w-56 mt-1 bg-card text-card-foreground border-border shadow-xl">
                          {userProfileDropdownContent}
                      </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
                  )}
                 <div className="flex h-10 items-center justify-center mt-2 mb-2">
                  <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
                    <Icons.TeamLogo />
                    <span className="">{currentTeam?.name || "iiCaptain"}</span>
                  </Link>
                </div>
                <div className="flex-1 overflow-auto">{mobileSidebarContent}</div>
              </SheetContent>
            </Sheet>
            <Link href="/dashboard" className="text-sidebar-foreground hidden md:block"> {/* Hide logo on mobile if PanelLeft is shown */}
              <Icons.TeamLogo />
              <span className="sr-only">{currentTeam?.name || "iiCaptain"}</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto">
            {sidebarNavigation}
          </div>
        </div>
        
        {/* User Profile Dropdown for Desktop Sidebar - AT THE BOTTOM */}
        {user && (
            <div className="mt-auto p-1 flex justify-center"> 
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full w-10 h-10">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user avatar desktop"/>
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="sr-only">User Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="center" className="w-56 mb-1 bg-card text-card-foreground border-border shadow-xl">
                  {userProfileDropdownContent}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
      </aside>
      
      {/* Main Content Area - Header Removed */}
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background overflow-auto">
         {/* Mobile Sheet Trigger - moved to top of main content if header is gone */}
        <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden fixed top-4 left-4 z-50 bg-card text-card-foreground" // Example fixed positioning
              >
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-sidebar p-0 text-sidebar-foreground w-[250px] shadow-xl">
               {user && ( 
                <div className="border-b border-sidebar-border p-2">
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
                    <DropdownMenuContent side="bottom" align="start" className="w-56 mt-1 bg-card text-card-foreground border-border shadow-xl">
                        {userProfileDropdownContent}
                    </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                )}
               <div className="flex h-10 items-center justify-center mt-2 mb-2">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
                  <Icons.TeamLogo />
                  <span className="">{currentTeam?.name || "iiCaptain"}</span>
                </Link>
              </div>
              <div className="flex-1 overflow-auto">{mobileSidebarContent}</div>
            </SheetContent>
          </Sheet>
        {children}
      </main>
    </div>
  );
}

