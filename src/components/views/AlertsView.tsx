import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Bell,
  Zap,
  Calendar,
  UserX,
  CheckCheck,
  Smartphone,
  ShieldAlert,
  ArrowRight,
  Info,
  Check,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { AppNotification, Match } from '../../types';
import {
  subscribeToGroupNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  requestPushPermission,
  deleteNotification,
  deleteAllNotifications,
} from '../../services/notificationService';
import { subscribeToMatches } from '../../services/matchService';
import { MatchDetailsModal } from '../matches/MatchDetailsModal';

export const AlertsView: React.FC = () => {
  const { user, group } = useAuth();
  const { t, language } = useLanguage();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushStatus, setPushStatus] = useState<NotificationPermission>('default');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Check device push permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPushStatus(Notification.permission);
    }
  }, []);

  // Real-time notifications and matches subscription
  useEffect(() => {
    setLoading(true);
    const unsubNotifs = subscribeToGroupNotifications(
      group?.id,
      (list) => {
        setNotifications(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error in notifications snapshot:', err);
        setLoading(false);
      }
    );

    const unsubMatches = subscribeToMatches(group?.id, (list) => {
      setMatches(list);
    });

    return () => {
      unsubNotifs();
      unsubMatches();
    };
  }, [group?.id]);

  const handleEnablePush = async () => {
    const perm = await requestPushPermission();
    setPushStatus(perm);
  };

  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const handleMarkAsRead = async (notifId: string) => {
    if (!user) return;
    await markNotificationAsRead(notifId, user.uid);
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    const unreadIds = notifications
      .filter((n) => !n.readBy.includes(user.uid))
      .map((n) => n.id);
    if (unreadIds.length > 0) {
      await markAllNotificationsAsRead(unreadIds, user.uid);
    }
  };

  const handleDeleteNotification = async (notifId: string) => {
    try {
      await deleteNotification(notifId);
    } catch (e) {
      console.error('Failed to delete notification:', e);
    }
  };

  const handleDeleteAll = async () => {
    if (notifications.length === 0) return;
    if (!window.confirm(t.confirmDeleteAllAlerts)) return;
    setIsDeletingAll(true);
    try {
      const allIds = notifications.map((n) => n.id);
      await deleteAllNotifications(allIds);
    } catch (e) {
      console.error('Failed to delete all notifications:', e);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleViewMatch = (matchId?: string | null) => {
    if (!matchId) return;
    const target = matches.find((m) => m.id === matchId);
    if (target) {
      setSelectedMatch(target);
    }
  };

  const unreadCount = notifications.filter((n) => user && !n.readBy.includes(user.uid)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white font-display">{t.alertsHeader}</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {t.unreadBadge(unreadCount)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer shadow-sm"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.markAllReadBtn}</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={isDeletingAll}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/40 hover:bg-rose-950/20 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              title={t.deleteAllAlertsBtn}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>{isDeletingAll ? '...' : t.deleteAllAlertsBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* Push Notification Opt-In Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 to-[#0e161c] border border-slate-800/80 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {t.deviceAlertsTitle}
                </h4>
                <span
                  className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                    pushStatus === 'granted'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : pushStatus === 'denied'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {pushStatus === 'granted' ? t.alertsEnabled : pushStatus === 'denied' ? t.alertsBlocked : t.alertsNotEnabled}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                {t.deviceAlertsDesc}
              </p>
            </div>
          </div>

          {pushStatus !== 'granted' && (
            <button
              onClick={handleEnablePush}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{t.enableAlertsBtn}</span>
            </button>
          )}
        </div>

        {/* iPhone / Safari guidance note */}
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-start gap-2 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>{t.iphoneNotice}</span>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          {language === 'ar' ? 'جاري تحميل التنبيهات...' : 'Loading alerts...'}
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-10 rounded-3xl bg-[#0d151a] border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white font-display">{t.noAlertsYet}</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {t.noAlertsYetDesc}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isUnread = user ? !n.readBy.includes(user.uid) : false;
            const isCancellation = n.type === 'cancellation_opened';
            const isMatchCancelled = n.type === 'match_cancelled';

            return (
              <div
                key={n.id}
                onClick={() => handleMarkAsRead(n.id)}
                className={`group relative p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                  isUnread
                    ? isCancellation
                      ? 'bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-[#0e161c] border-emerald-500/60 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                      : isMatchCancelled
                      ? 'bg-gradient-to-r from-rose-950/50 via-slate-900/90 to-[#0e161c] border-rose-500/50 shadow-lg shadow-rose-950/30 ring-1 ring-rose-500/30'
                      : 'bg-slate-900/95 border-emerald-500/40 shadow-md ring-1 ring-emerald-500/20'
                    : 'bg-slate-950/35 border-slate-900/80 opacity-40 hover:opacity-85 transition-opacity'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Icon badge */}
                  <div
                    className={`p-2.5 rounded-xl flex-shrink-0 transition-colors ${
                      isUnread
                        ? isCancellation
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : isMatchCancelled
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-900/80 text-slate-500 border border-slate-800/80'
                    }`}
                  >
                    {isCancellation ? (
                      <Zap className={`w-5 h-5 ${isUnread ? 'animate-pulse text-emerald-400' : 'text-slate-500'}`} />
                    ) : isMatchCancelled ? (
                      <ShieldAlert className="w-5 h-5" />
                    ) : (
                      <Calendar className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4
                          className={`text-sm truncate font-display ${
                            isUnread ? 'font-black text-white' : 'font-medium text-slate-400'
                          }`}
                        >
                          {n.title}
                        </h4>
                        {isUnread ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex-shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            {language === 'ar' ? 'جديد' : 'NEW'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-medium flex-shrink-0">
                            ✓ {language === 'ar' ? 'مقروء' : 'Read'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-[11px] font-mono ${
                            isUnread ? 'text-slate-300' : 'text-slate-600'
                          }`}
                        >
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        {/* Individual Delete Action */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(n.id);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title={t.deleteAlertTooltip}
                          aria-label={t.deleteAlertTooltip}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        isUnread ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      {n.message}
                    </p>

                    {/* Action button if cancellation opened */}
                    {isCancellation && n.matchId && (
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(n.id);
                            handleViewMatch(n.matchId);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                            isUnread
                              ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-emerald-500/20 font-black'
                              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          }`}
                        >
                          <Zap className={`w-3.5 h-3.5 ${isUnread ? 'fill-slate-950' : 'text-slate-400'}`} />
                          <span>{t.claimSpotFromAlert}</span>
                          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Match Details Modal (Direct claim when clicking notification) */}
      <MatchDetailsModal
        match={selectedMatch}
        isOpen={Boolean(selectedMatch)}
        onClose={() => setSelectedMatch(null)}
        onEdit={() => {}}
      />
    </div>
  );
};
