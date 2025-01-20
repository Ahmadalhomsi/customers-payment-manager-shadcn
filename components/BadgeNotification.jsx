"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

export const BadgeNotification = () => {
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full text-muted-foreground hover:bg-accent"
      >
        <Bell className="h-5 w-5" />
      </Button>
      <Badge 
        variant="destructive" 
        className="absolute -right-1 -top-1 h-4 w-4 justify-center p-0"
      >
        3
      </Badge>
    </div>
  );
};