"use client";

import { useState, useEffect } from "react";
import { notificationService } from "@/services/notification.service";
import type { NotificationWithActor } from "@/types";
import { NotificationItem } from "./NotificationItem";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoader } from "@/components/common/LoadingSpinner";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";

export function NotificationsView() {
  const [notifications, setNotifications] = useState<NotificationWithActor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { success, error } = useToast();

  useEffect(() => {
    loadNotifications();

    // Subscribe to new notifications
    const unsubscribe = notificationService.subscribeToNotifications((newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      error( 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      success( 'All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      error( 'Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      success( 'Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      error( 'Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all notifications?')) return;

    try {
      await notificationService.clearAllNotifications();
      setNotifications([]);
      success( 'All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      error( 'Failed to clear notifications');
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return <PageLoader message="Loading notifications..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
              </p>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all as read
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
          <TabsList>
            <TabsTrigger value="all">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            {filteredNotifications.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Bell className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {filter === 'unread' 
                    ? "You're all caught up!" 
                    : "You'll see notifications here when you get them"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
