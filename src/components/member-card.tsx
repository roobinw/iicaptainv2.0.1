
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import type { User } from "@/types";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MemberCardProps {
  member: User; 
  onEdit?: (member: User) => void; 
  onDelete?: (member: User) => void; 
}

export function MemberCard({ member, onEdit, onDelete }: MemberCardProps) {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin"; 
  
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const booleanRoleLabels: Record<keyof User, string> = {
      isTrainingMember: "Training Member",
      isMatchMember: "Match Member",
      isTeamManager: "Team Manager",
      isTrainer: "Trainer",
      isCoach: "Coach",
      // Add other User fields that are not boolean roles here if needed for type completeness,
      // but they won't be iterated over for badges.
      id: "", uid: "", name: "", email: "", role: "member", avatarUrl: "", createdAt: "", teamId: ""
  };
  const activeBooleanRoles = (Object.keys(booleanRoleLabels) as Array<keyof User>)
    .filter(key => 
        typeof member[key] === 'boolean' && 
        member[key] === true && 
        key !== 'id' && key !== 'uid' && key !== 'name' && key !== 'email' && key !== 'role' && key !== 'avatarUrl' && key !== 'createdAt' && key !== 'teamId' // Ensure only boolean role keys
    );


  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="items-center text-center pb-3">
        <Avatar className="h-20 w-20 mb-2 border-2 border-primary">
          <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint="member photo"/>
          <AvatarFallback className="text-2xl">{getInitials(member.name)}</AvatarFallback>
        </Avatar>
        <CardTitle>{member.name}</CardTitle>
        <CardDescription>{member.email}</CardDescription>
         <Badge 
            variant={member.role === "admin" ? "default" : "secondary"} 
            className="mt-1 text-xs"
          >
          Auth: {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
        </Badge>
      </CardHeader>
      <CardContent className="text-center flex-grow pt-2">
        {activeBooleanRoles.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-muted-foreground font-medium mb-1">Responsibilities:</p>
            <div className="flex flex-wrap justify-center gap-1">
              {activeBooleanRoles.map(roleKey => (
                <Badge key={roleKey} variant="outline" className="text-xs px-1.5 py-0.5">
                  {booleanRoleLabels[roleKey]}
                </Badge>
              ))}
            </div>
          </div>
        )}
         {activeBooleanRoles.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2 italic">No specific responsibilities assigned.</p>
        )}
      </CardContent>
      {isAdmin && (onEdit || onDelete) && (
        <CardFooter className="border-t pt-4 flex justify-center gap-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(member)}>
              <Icons.Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={() => onDelete(member)} disabled={member.uid === currentUser?.uid}>
              <Icons.Delete className="mr-2 h-4 w-4" /> Delete
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
