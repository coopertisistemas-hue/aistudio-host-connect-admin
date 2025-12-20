import { useState } from 'react';
import { Bell, CheckCircle2, XCircle, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const NotificationBell = () => {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'task_due':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'payment_due':
        return <Info className="h-4 w-4 text-primary" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync();
  };

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead.mutateAsync(notificationId);
    // Optionally navigate to a relevant page based on notification type
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4">
          <h4 className="font-semibold">Notificações</h4>
          {unreadCount > 0 && (
            <Button variant="link" size="sm" onClick={handleMarkAllAsRead} disabled={markAllAsRead.isPending}>
              {markAllAsRead.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Marcar todas como lidas"}
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Carregando notificações...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">Nenhuma notificação.</div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                    !notification.is_read && "bg-accent/10"
                  )}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p className={cn("text-sm", !notification.is_read && "font-medium")}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(parseISO(notification.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;