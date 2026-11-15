import { AppNotification } from '../types';
import { dbService } from '../services/storage';
import { X, Bell, Check, Clock, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  userId: string;
  onRefreshData: () => void;
  onNavigateToBooking?: (bookingId: string) => void;
}

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  userId,
  onRefreshData,
  onNavigateToBooking,
}: NotificationDrawerProps) {
  if (!isOpen) return null;

  const userNotifs = notifications.filter(n => n.userId === userId);
  const unreadNotifs = userNotifs.filter(n => !n.isRead);

  const handleMarkAllRead = async () => {
    try {
      await dbService.markAllNotificationsRead();
      onRefreshData();
    } catch (reason) {
      alert(reason instanceof Error ? reason.message : 'Notifications could not be updated.');
    }
  };

  const handleMarkSingleRead = async (notifId: string) => {
    try {
      await dbService.markNotificationRead(notifId);
      onRefreshData();
    } catch (reason) {
      alert(reason instanceof Error ? reason.message : 'Notification could not be updated.');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'BOOKING':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'QUOTATION':
        return <FileText className="w-4 h-4 text-[#D6B779]" />;
      case 'STATUS_CHANGE':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'VERIFICATION':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col justify-between border-l border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#173D32] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#D6B779]" />
            <h3 className="font-bold text-sm">Notifications ({unreadNotifs.length})</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action strip */}
        <div className="px-4 py-2 bg-stone-50 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>{userNotifs.length} total updates</span>
          {unreadNotifs.length > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="font-semibold text-[#173D32] hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2 text-xs">
          {userNotifs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No notifications yet.</p>
            </div>
          ) : (
            userNotifs.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkSingleRead(n.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  n.isRead
                    ? 'bg-white border-gray-100 opacity-70'
                    : 'bg-[#F7F5EF] border-[#173D32]/20 font-medium'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white border border-gray-200 shadow-2xs shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900">{n.title}</h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#173D32]" />
                      )}
                    </div>
                    <p className="text-gray-600 mt-0.5 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block font-mono-code">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-stone-50 border-t border-gray-200 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 bg-[#173D32] hover:bg-[#102B25] text-white rounded-xl text-xs font-semibold"
          >
            Close Notifications
          </button>
        </div>
      </div>
    </div>
  );
}
