"use client";

import type { NotificationWithActor } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  UserPlus, 
  Heart, 
  MessageCircle, 
  Star,
  CheckCircle,
  Trash2,
  Bell
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface NotificationItemProps {
  notification: NotificationWithActor;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const router = useRouter();
  const actor = notification.actor;

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'connection_request':
      case 'connection_accepted':
        return <UserPlus className="h-5 w-5 text-primary-500" />;
      case 'post_like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'post_comment':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'new_review':
        return <Star className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.action_url) {
      router.push(notification.action_url);
    } else {
      switch (notification.type) {
        case 'connection_request':
        case 'connection_accepted':
          router.push('/connections');
          break;
        case 'post_like':
        case 'post_comment':
          router.push('/feed');
          break;
        case 'new_message':
          router.push('/messages');
          break;
        case 'new_review':
          router.push('/doctors');
          break;
      }
    }
  };

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4
        hover:shadow-md transition-all cursor-pointer
        ${!notification.read ? 'border-l-4 border-l-primary-500 bg-primary-50/50 dark:bg-primary-900/10' : ''}
      `}
      onClick={handleClick}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon()}
        </div>

        {/* Avatar */}
        {actor && (
          <Avatar
            src={actor.avatar_url || undefined}
            name={actor.full_name || actor.username}
            size="md"
            className="flex-shrink-0"
          />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 dark:text-white mb-1">
            {notification.title}
          </p>
          {notification.body && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {notification.body}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!notification.read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              title="Mark as read"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            title="Delete notification"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
