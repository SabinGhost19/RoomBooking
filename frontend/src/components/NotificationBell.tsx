/**
 * NotificationBell Component
 * Displays notification icon with badge and dropdown for booking invitations
 */
import React, { useEffect, useState } from 'react';
import { Bell, Check, X, RefreshCw, Loader2, Users, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { notificationAPI, BookingInvitationWithDetails } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<BookingInvitationWithDetails[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    fetchCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationAPI.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCount = async () => {
    try {
      const count = await notificationAPI.getCount();
      setUnreadCount(count.unread_count);
      setPendingCount(count.pending_count);
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  };

  const handleAccept = async (invitationId: number, roomName?: string) => {
    try {
      setProcessingId(invitationId);
      await notificationAPI.acceptInvitation(invitationId);
      
      toast({
        title: 'Invitation Accepted',
        description: `You've accepted the invitation${roomName ? ` for ${roomName}` : ''}.`,
      });

      // Refresh notifications
      await fetchNotifications();
      await fetchCount();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to accept invitation',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (invitationId: number, roomName?: string) => {
    try {
      setProcessingId(invitationId);
      await notificationAPI.rejectInvitation(invitationId);
      
      toast({
        title: 'Invitation Rejected',
        description: `You've rejected the invitation${roomName ? ` for ${roomName}` : ''}.`,
      });

      // Refresh notifications
      await fetchNotifications();
      await fetchCount();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to reject invitation',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      await fetchNotifications();
      await fetchCount();
      
      toast({
        title: 'All notifications marked as read',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {pendingCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {pendingCount > 9 ? '9+' : pendingCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Notifications</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchNotifications}
                disabled={loading}
                className="h-8 w-8"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="h-8 text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <ScrollArea className="h-[400px]">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 transition-colors hover:bg-gray-50",
                    !notification.is_read && "bg-blue-50/50"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {notification.inviter_name || notification.inviter_email} invited you
                        </p>
                        {notification.room_name && (
                          <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {notification.room_name}
                          </p>
                        )}
                      </div>
                      {notification.status === 'pending' && !notification.is_read && (
                        <Badge variant="default" className="text-[10px]">
                          New
                        </Badge>
                      )}
                    </div>

                    {notification.booking_date && (
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(notification.booking_date)}
                        </span>
                        {notification.start_time && notification.end_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(notification.start_time)} - {formatTime(notification.end_time)}
                          </span>
                        )}
                      </div>
                    )}

                    {notification.status === 'pending' ? (
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleAccept(notification.id, notification.room_name)}
                          disabled={processingId === notification.id}
                          className="flex-1 h-8 text-xs"
                        >
                          {processingId === notification.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Accept
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(notification.id, notification.room_name)}
                          disabled={processingId === notification.id}
                          className="flex-1 h-8 text-xs"
                        >
                          {processingId === notification.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <X className="h-3 w-3 mr-1" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Badge
                        variant={notification.status === 'accepted' ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {notification.status === 'accepted' ? '✓ Accepted' : '✗ Rejected'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
