// components/BadgeNotification.jsx
"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";

// Sample notifications data
const notifications = [
  {
    id: 1,
    title: "Payment Reminder",
    description: "Customer XYZ has an upcoming payment",
    type: "alert",
    author: "System",
    date: new Date("2024-03-15"),
  },
  {
    id: 2,
    title: "Service Renewal",
    description: "Service ABC needs renewal in 3 days",
    type: "warning",
    author: "Billing Dept",
    date: new Date("2024-03-14"),
  },
  // Add more notifications as needed
];

export const BadgeNotification = () => {
  const [open, setOpen] = useState(false);

  // Style configuration based on type
  const typeColors = {
    alert: "bg-destructive/15 text-destructive",
    warning: "bg-primary/15 text-primary",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative cursor-pointer">
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
            {notifications.length}
          </Badge>
        </div>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="space-y-2">
          <div className="p-4 border-b">
            <h4 className="font-medium">Notifications</h4>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex flex-col gap-1 p-4 hover:bg-accent transition-colors",
                  typeColors[notification.type]
                )}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{notification.title}</h4>
                  <span className="text-xs text-muted-foreground">
                    {format(notification.date, "MMM dd")}
                  </span>
                </div>
                <p className="text-sm">{notification.description}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-muted-foreground">
                    {notification.author}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-current" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};