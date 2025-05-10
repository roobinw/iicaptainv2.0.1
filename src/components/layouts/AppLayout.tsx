
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"; // Added SheetHeader, SheetTitle
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Icons } from "@/components/icons";
import { PanelLeft, LogOut, Settings as SettingsIcon, ChevronDown, LifeBuoy } from "lucide-react"; 
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
  // Settings is not a main nav item, accessed via user dropdown
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, currentTeam, logout, isLoading: authIsLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!authIsLoading) { 
      const isMarketingPage = pathname === "/" || pathname.startsWith("/(marketing)");
      const isAuthPage = pathname.startsWith("/(auth)"); // Covers /login, /signup
      const isOnboardingPage = pathname.startsWith("/onboarding");

      if (!user) {
        // If not logged in, and not on a public/auth/onboarding page, redirect to landing.
        if (!isMarketingPage && !isAuthPage && !isOnboardingPage) {
          router.replace("/"); 
        }
      } else if (user && !user.teamId && !isOnboardingPage) {
        // Logged in, but no teamId, and not on onboarding, redirect to create team.
        router.replace("/onboarding/create-team");
      }
      else if (user && user.teamId && (isAuthPage || isOnboardingPage)) {
         // Logged in, has teamId, but on auth/onboarding page, redirect to dashboard.
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
    const isAuthFlowPage = pathname.startsWith("/(auth)");
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
                  "flex items-center justify-center h-12 w-12 rounded-lg transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:h-11 md:w-11", 
                  pathname.startsWith(item.href) 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground"
                )}
              >
                <IconComponent className="h-[1.8rem] w-[1.8rem]" /> 
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
              pathname.startsWith(item.href) 
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground"
            )}
          >
            <IconComponent className="h-5 w-5" />
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
            <SettingsIcon className="mr-2 h-5 w-5" />
            <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/support')} className="hover:bg-accent/50 cursor-pointer">
            <LifeBuoy className="mr-2 h-5 w-5" />
            <span>Support</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border"/>
        <DropdownMenuItem onClick={logout} className="hover:bg-accent/50 cursor-pointer">
            <LogOut className="mr-2 h-5 w-5" />
            <span>Logout</span>
        </DropdownMenuItem>
    </>
  );


  return (
    <div className="grid min-h-screen w-full md:grid-cols-[120px_1fr] lg:grid-cols-[120px_1fr]"> 
      <aside className="hidden border-r bg-sidebar md:flex md:flex-col md:justify-between p-2 shadow-lg sticky top-0 h-screen">
        <div> 
           <div className="flex h-10 items-center justify-center mb-4 mt-2">
             <Link 
                href="/dashboard" 
                className="text-sidebar-foreground hidden md:flex md:justify-center"
            >
              <Icons.TeamLogo className="mt-[10px] h-10 w-10" /> 
              <span className="sr-only">{currentTeam?.name || "iiCaptain"}</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto">
            {sidebarNavigation}
          </div>
        </div>
        
        {user && (
            <div className="mt-auto p-1 flex justify-center"> 
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full w-12 h-12">
                    <Avatar className="h-10 w-10">
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
      
      <main className="flex flex-1 flex-col bg-background overflow-auto">
        <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4 md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0" 
                >
                    <PanelLeft className="h-6 w-6" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col bg-sidebar p-0 text-sidebar-foreground w-[250px] shadow-xl">
                 <SheetHeader className="p-4 border-b border-sidebar-border">
                    <SheetTitle className="text-lg font-semibold text-sidebar-foreground text-center">
                        {currentTeam?.name || "Menu"}
                    </SheetTitle>
                 </SheetHeader>
                {user && ( 
                    <div className="border-b border-sidebar-border p-2">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center justify-between w-full h-auto px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                                <div className="flex items-center gap-2 truncate">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user avatar mobile"/>
                                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col items-start truncate">
                                        <span className="text-sm font-medium truncate">{user.name}</span>
                                        <span className="text-xs text-sidebar-foreground/70 truncate">{user.email}</span>
                                    </div>
                                </div>
                                <ChevronDown className="h-5 w-5 text-sidebar-foreground/70" />
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
                    <Icons.TeamLogo className="mt-[10px] h-10 w-10" /> 
                    <span className="">{currentTeam?.name || "iiCaptain"}</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-auto">{mobileSidebarContent}</div>
                </SheetContent>
            </Sheet>
             {/* This div is now removed to pull content up, no more team name display here */}
        </header>
          <div className="p-4 lg:p-6">
            {children}
          </div>
      </main>
    </div>
  );
}
    
