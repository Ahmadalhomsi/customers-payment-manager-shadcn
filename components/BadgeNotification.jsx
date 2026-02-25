"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, Trash2, AlertTriangle, CheckCircle2, AlertCircle, Clock, CalendarClock } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Type configuration
const typeConfig = {
  error: {
    color: "bg-red-100 dark:bg-red-900/30 border-l-4 border-l-red-500",
    icon: <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />,
    badgeColor: "bg-red-500 text-white",
    badgeLabel: "Bugün",
  },
  warning: {
    color: "bg-orange-100 dark:bg-orange-900/30 border-l-4 border-l-orange-500",
    icon: <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />,
    badgeColor: "bg-orange-500 text-white",
    badgeLabel: "Yarın",
  },
  upcoming: {
    color: "bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-l-yellow-500",
    icon: <CalendarClock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />,
    badgeColor: "bg-yellow-500 text-white",
    badgeLabel: "Yaklaşan",
  },
  success: {
    color: "bg-green-100 dark:bg-green-900/30 border-l-4 border-l-green-500",
    icon: <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />,
    badgeColor: "bg-green-500 text-white",
    badgeLabel: null,
  },
  info: {
    color: "bg-blue-100 dark:bg-blue-900/30 border-l-4 border-l-blue-500",
    icon: <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
    badgeColor: "bg-blue-500 text-white",
    badgeLabel: null,
  },
};

// Extract customer name from message like "COŞKUN PASTANECİLİK müşterisine ait ..."
function extractCustomerName(description) {
  if (!description) return null;
  const match = description.match(/^(.+?)\s+müşterisine/);
  return match ? match[1] : null;
}

// Detect urgency from notification title
function getEffectiveType(notification) {
  const title = notification.title || '';
  if (title.includes('Bugün Sona Eriyor') || title.includes('Süresi Doldu')) return 'error';
  if (title.includes('Yarın Sona Eriyor')) return 'warning';
  if (title.includes('2 Gün Kaldı')) return 'warning';
  if (title.includes('Yaklaşan Hizmet')) return 'upcoming';
  return notification.type || 'info';
}

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

      <PopoverContent className="w-[480px] p-0" align="end">
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
              notifications.map((notification) => {
                const effectiveType = getEffectiveType(notification);
                const config = typeConfig[effectiveType] || typeConfig.info;
                return (
                <div
                  key={notification.id}
                  className={cn(
                    "group flex items-start gap-3 p-4 hover:bg-accent/50 transition-colors border-b relative",
                    config.color,
                    !notification.read && "font-medium"
                  )}
                >
                  <div className="mt-1 shrink-0">
                    {config.icon}
                  </div>

                  <button
                    onClick={() => handleMarkRead(notification.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {config.badgeLabel && (
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-semibold",
                            config.badgeColor
                          )}>
                            {config.badgeLabel}
                          </span>
                        )}
                        <h4 className="font-semibold truncate">{notification.title}</h4>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: tr })}
                      </span>
                    </div>
                    {extractCustomerName(notification.description) && (
                      <p className="text-sm font-medium text-foreground mt-0.5">
                        🏢 {extractCustomerName(notification.description)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {notification.description}
                    </p>
                  </button>

                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 -mr-2 shrink-0"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>

                  {!notification.read && (
                    <div className="absolute top-4 left-1">
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                      </span>
                    </div>
                  )}
                </div>
                );
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};