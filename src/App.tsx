import React, { useState, useEffect, useRef } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { ProfileModal } from './components/ProfileModal';
import { GuestGate } from './components/GuestGate';
import { UpcomingMatchesView } from './components/views/UpcomingMatchesView';
import { MyBookingsView } from './components/views/MyBookingsView';
import { SquadView } from './components/views/SquadView';
import { AlertsView } from './components/views/AlertsView';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { subscribeToGroupNotifications, triggerDeviceNotification } from './services/notificationService';
import { ActiveTab, AppNotification } from './types';
import { Bell, Zap, X, ChevronRight, Sparkles } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, group, loading, isApproved } = useAuth();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [activeTab, setActiveTab] = useState<ActiveTab>('matches');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [liveAlert, setLiveAlert] = useState<AppNotification | null>(null);
  const dismissedAlertsRef = useRef<Set<string>>(new Set());

  // Real-time group notifications subscription with instant live alert dispatch
  useEffect(() => {
    if (!group?.id || !user) return;

    const unsubscribe = subscribeToGroupNotifications(group.id, (list) => {
      setNotifications(list);

      // Check for incoming cancellation or urgent notifications
      const recentCancellation = list.find((n) => {
        if (n.type !== 'cancellation_opened') return false;
        if (n.actorId === user.uid) return false; // don't notify the person who cancelled
        if (dismissedAlertsRef.current.has(n.id)) return false;

        const ageMs = Date.now() - new Date(n.createdAt).getTime();
        return ageMs < 1000 * 60 * 15; // Within last 15 minutes
      });

      if (recentCancellation && (!liveAlert || liveAlert.id !== recentCancellation.id)) {
        setLiveAlert(recentCancellation);
        // Fire native push alert
        triggerDeviceNotification(recentCancellation.title, recentCancellation.message);
        // Haptic pulse if supported
        if ('vibrate' in navigator) {
          try {
            navigator.vibrate([100, 50, 100]);
          } catch (e) {
            // ignore
          }
        }
      }
    });

    return () => unsubscribe();
  }, [group?.id, user?.uid]);

  const dismissLiveAlert = (id: string) => {
    dismissedAlertsRef.current.add(id);
    setLiveAlert(null);
  };

  const handleOpenAlertMatch = () => {
    if (liveAlert) {
      dismissLiveAlert(liveAlert.id);
    }
    setActiveTab('matches');
  };

  const unreadCount = user
    ? notifications.filter((n) => !n.readBy.includes(user.uid)).length
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b0e] flex flex-col items-center justify-center text-slate-400">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-xl shadow-emerald-500/20 animate-pulse">
            <span className="text-white font-black text-2xl font-display">P</span>
          </div>
          <div className="w-3 h-3 rounded-full bg-emerald-400 absolute -top-1 -right-1 animate-ping" />
        </div>
        <p className="text-xs font-semibold tracking-wider uppercase text-emerald-400/80 mt-4 font-display">
          {language === 'ar' ? 'جاري فتح بيتش باس...' : 'PitchPass Initializing...'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b0e] text-slate-100 flex flex-col pb-20 sm:pb-8 pitch-gradient">
      {/* Top Header */}
      <Header
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenNotifications={() => setActiveTab('notifications')}
        unreadCount={unreadCount}
      />

      {/* Floating Real-Time Cancellation Alert Toast */}
      {liveAlert && (
        <aside 
          aria-label={isRTL ? "تنبيه فوري لفتح مكان" : "Live Spot Opened Alert"}
          className="sticky top-16 z-50 px-4 py-2 w-full animate-in slide-in-from-top-4 duration-300"
        >
          <div className="bg-gradient-to-r from-emerald-950/95 via-slate-900/95 to-teal-950/95 border-2 border-emerald-500/80 rounded-2xl p-3.5 sm:p-4 shadow-2xl shadow-emerald-950/80 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0 mt-0.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center text-emerald-400">
                  <Zap className="w-5 h-5 text-emerald-400 animate-bounce" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black text-emerald-300 font-display">
                    {liveAlert.title}
                  </h4>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-400 text-slate-950">
                    {isRTL ? 'متاح الآن' : 'LIVE'}
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-0.5 leading-relaxed font-medium">
                  {liveAlert.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
              <button
                onClick={handleOpenAlertMatch}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
              >
                <span>{isRTL ? 'الحق احجز مكانك' : 'Claim Spot Now'}</span>
                <ChevronRight className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => dismissLiveAlert(liveAlert.id)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                title={isRTL ? 'إغلاق' : 'Dismiss'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main Container */}
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-7">
        {/* PWA Install Banner */}
        <PwaInstallBanner />

        {!user || !isApproved ? (
          <GuestGate />
        ) : (
          <>
            {/* Desktop Tabs */}
            <Navigation activeTab={activeTab} onTabChange={setActiveTab} unreadCount={unreadCount} />

            <div className="mt-6">
              {/* View Router */}
              {activeTab === 'matches' && <UpcomingMatchesView />}
              {activeTab === 'bookings' && <MyBookingsView onNavigateToMatches={() => setActiveTab('matches')} />}
              {activeTab === 'squad' && <SquadView />}
              {activeTab === 'notifications' && <AlertsView />}
            </div>
          </>
        )}
      </main>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainAppContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
