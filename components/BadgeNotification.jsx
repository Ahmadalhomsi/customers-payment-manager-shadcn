"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, Trash2, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Type configuration
const typeConfig = {
  error: {
    color: "bg-red-100 dark:bg-red-900/30",
    icon: <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />,
  },
  warning: {
    color: "bg-orange-100 dark:bg-orange-900/30",
    icon: <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />,
  },
  success: {
    color: "bg-green-100 dark:bg-green-900/30",
    icon: <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />,
  },
  info: {
    color: "bg-blue-100 dark:bg-blue-900/30",
    icon: <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
  },
};

export const BadgeNotification = ({ initialNotifications, onNotificationsChange }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch notifications on mount and when popover opens
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/notifications');
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data = await response.json();

        const mappedData = data.map(notification => ({
          id: notification.id,
          title: notification.title,
          description: notification.message,
          type: notification.type || 'info',
          read: notification.read || false,
          createdAt: new Date(notification.createdAt),
        }));

        setNotifications(mappedData);
        if (onNotificationsChange) onNotificationsChange(mappedData);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Always fetch when component mounts
    fetchData();
  }, []);

  // Refresh when popover opens
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();

      const mappedData = data.map(notification => ({
        id: notification.id,
        title: notification.title,
        description: notification.message,
        type: notification.type || 'info',
        read: notification.read || false,
        createdAt: new Date(notification.createdAt),
      }));

      setNotifications(mappedData);
      if (onNotificationsChange) onNotificationsChange(mappedData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      await Promise.all(
        notifications.map(n =>
          fetch(`/api/notifications/${n.id}`, { method: 'DELETE' })
        )
      );
      setNotifications([]);
    } catch (err) {
      console.error('Clear all error:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-4 w-4 justify-center p-0"
            >
              {unreadCount}
            </Badge>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        <div className="space-y-2">
          <div className="p-4 border-b flex justify-between items-center">
            <h4 className="font-medium">Notifications</h4>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={notifications.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hepsini Sil
              </Button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4 space-y-2">
                  <Skeleton className="h-4 w-[80%]" />
                  <Skeleton className="h-3 w-[60%]" />
                </div>
              ))
            ) : error ? (
              <div className="p-4 text-destructive text-sm">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-muted-foreground text-sm">
                Bildirim bulunamadı.
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "group flex items-start gap-3 p-4 hover:bg-accent transition-colors border-b relative",
                    typeConfig[notification.type].color,
                    !notification.read && "dark:bg-opacity-30"
                  )}
                >
                  <div className="mt-1">
                    {typeConfig[notification.type].icon}
                  </div>

                  <button
                    onClick={() => handleMarkRead(notification.id)}
                    className="flex-1 text-left"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{notification.title}</h4>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.description}
                    </p>
                  </button>

                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 -mr-2"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>

                  {!notification.read && (
                    <div className="absolute top-4 left-2">
                      <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};