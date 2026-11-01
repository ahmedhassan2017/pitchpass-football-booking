import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Shield, Sparkles, User, LogIn, Bell, Languages, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenProfile,
  onOpenNotifications,
  unreadCount = 0,
}) => {
  const { user, profile, isOwner, isAdmin, signIn } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#070b0e]/90 backdrop-blur-md border-b border-emerald-950/40 px-2.5 sm:px-6 py-2 sm:py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Brand & Group */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30 flex-shrink-0">
            <span className="text-white font-black text-base sm:text-lg tracking-tighter">P</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-display font-black text-base sm:text-lg tracking-tight text-white whitespace-nowrap">
                {language === 'ar' ? (
                  <>
                    بيتش<span className="text-emerald-400">باس</span>
                  </>
                ) : (
                  <>
                    Pitch<span className="text-emerald-400">Pass</span>
                  </>
                )}
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {t.live}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden md:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* User controls */}
        <div className="flex items-center gap-1 sm:gap-2.5 flex-shrink-0">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white transition-all cursor-pointer flex-shrink-0"
            title={theme === 'dark' ? (language === 'ar' ? 'تفعيل الوضع الفاتح (Light Mode)' : 'Switch to Light Mode') : (language === 'ar' ? 'تفعيل الوضع الليلي (Dark Mode)' : 'Switch to Dark Mode')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500 transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex-shrink-0"
            title="تبديل اللغة / Switch Language"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="text-[11px] hidden sm:inline">{language === 'ar' ? 'English' : '🇪🇬 مصري'}</span>
            <span className="text-[11px] sm:hidden">{language === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {user ? (
            <>
              {/* Notification icon */}
              <button
                onClick={onOpenNotifications}
                className="relative p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors flex-shrink-0"
                title={t.tabAlerts}
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 px-1 min-w-[14px] h-[14px] rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[9px] font-black shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Profile button */}
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 p-1 sm:p-1.5 sm:px-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/80 transition-all text-start flex-shrink-0 cursor-pointer"
                aria-label="Open profile"
              >
                <div className="hidden sm:block text-start">
                  <div className="text-xs font-semibold text-white leading-tight">
                    {profile?.displayName || user.displayName || (language === 'ar' ? 'لاعب' : 'Player')}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium">
                    {isOwner ? t.roleOwner : isAdmin ? t.roleAdmin : t.roleMember}
                  </div>
                </div>

                <div className="relative flex-shrink-0">
                  {(profile ? profile.photoURL : user.photoURL) ? (
                    <img
                      src={(profile ? profile.photoURL : user.photoURL)!}
                      alt={profile?.displayName || user.displayName || 'User'}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/50 shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-600/40 flex items-center justify-center text-emerald-400 font-bold text-xs ring-2 ring-emerald-500/30">
                      {(profile?.displayName || user.displayName || user.email || 'P')[0].toUpperCase()}
                    </div>
                  )}

                  {isOwner && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-[#070b0e] flex items-center justify-center text-[9px] font-black shadow ring-1 ring-slate-950">
                      ★
                    </span>
                  )}
                </div>
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex-shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{t.signInGoogle}</span>
              <span className="xs:hidden">{language === 'ar' ? 'دخول' : 'Login'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
