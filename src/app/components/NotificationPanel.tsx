import { type Dispatch, type SetStateAction } from 'react';
import { formatPHDateShort } from '../../utils/dateHelpers';

export interface Notification {
  id: string;
  type: 'check' | 'alert' | 'info';
  title: string;
  message: string;
  date: string;
  nextCheckDate?: string;
  targetPage?: 'dashboard' | 'analytics' | 'mapping' | 'monitoring' | 'reports' | 'research' | 'settings' | 'addRecord';
  isRead: boolean;
  role?: 'admin' | 'worker';
}

export function NotificationPanel({
  isOpen,
  onClose,
  notifications,
  setNotifications,
  onNotificationClick,
}: {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  setNotifications: Dispatch<SetStateAction<Notification[]>>;
  onNotificationClick: (page: string) => void;
}) {
  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const getPageForNotification = (notification: Notification) => {
    return notification.targetPage ?? 'dashboard';
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'check':
        return (
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case 'alert':
        return (
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-[72px] right-6 w-96 bg-card rounded-xl shadow-2xl border border-border z-[1400] max-h-[480px] flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
          )}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 border-b border-border hover:bg-secondary/30 cursor-pointer transition-colors ${
              !notification.isRead ? 'bg-primary/5' : ''
            }`}
            onClick={() => {
              markAsRead(notification.id);
              onNotificationClick(getPageForNotification(notification));
            }}
          >
            <div className="flex gap-3">
              <div className={`size-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                notification.type === 'check' ? 'bg-primary/10 text-primary' :
                notification.type === 'alert' ? 'bg-destructive/10 text-destructive' :
                'bg-muted text-muted-foreground'
              }`}>
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-medium text-sm">{notification.title}</h4>
                  {!notification.isRead && (
                    <div className="size-2 bg-primary rounded-full flex-shrink-0 mt-1"></div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatPHDateShort(notification.date)}</span>
                  {notification.nextCheckDate && (
                    <>
                      <span>•</span>
                      <span className="text-primary">Next: {formatPHDateShort(notification.nextCheckDate)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-border">
        <button className="w-full text-sm text-primary hover:text-primary/80 transition-colors">
          View all notifications
        </button>
      </div>
    </div>
  );
}
