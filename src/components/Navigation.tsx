import React from 'react';
import { ActiveTab } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Calendar, Ticket, Users, Bell } from 'lucide-react';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  unreadCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  unreadCount = 0,
}) => {
  const { t } = useLanguage();

  const tabs = [
    { id: 'matches' as ActiveTab, label: t.tabMatches, icon: Calendar },
    { id: 'bookings' as ActiveTab, label: t.tabMySpots, icon: Ticket },
    { id: 'squad' as ActiveTab, label: t.tabSquad, icon: Users },
    { id: 'notifications' as ActiveTab, label: t.tabAlerts, icon: Bell, badge: unreadCount },
  ];

  return (
    <>
      {/* Desktop Navigation Tabs */}
      <div className="hidden sm:block border-b border-slate-800 bg-[#070b0e]/70">
        <div className="w-full mx-auto px-0">
          <nav className="flex gap-1" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 py-3.5 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                    isActive
                      ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {Boolean(tab.badge && tab.badge > 0) && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#070b0e]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 safe-area-pb">
        <div className="grid grid-cols-4 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative cursor-pointer ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-950/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {Boolean(tab.badge && tab.badge > 0) && (
                    <span className="absolute -top-1 -right-2.5 px-1 py-0.2 min-w-[14px] text-center rounded-full text-[9px] font-black bg-emerald-500 text-slate-950 shadow-sm">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold mt-1 tracking-tight">
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
