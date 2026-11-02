import React, { useState, useEffect } from 'react';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  ShieldCheck,
  Zap,
  Users,
  AlertCircle,
  ArrowRight,
  Send,
  KeyRound,
} from 'lucide-react';

interface GuestGateProps {
  onSignedIn?: () => void;
}

function getGoogleSignInError(error: unknown, language: 'ar' | 'en'): string {
  const code = error instanceof FirebaseError ? error.code : null;
  const hostname = window.location.hostname;

  if (code === 'auth/unauthorized-domain') {
    return language === 'ar'
      ? `العنوان ${hostname} غير مسموح به في Firebase Authentication. أضفه من Settings > Authorized domains.`
      : `${hostname} is not allowed in Firebase Authentication. Add it under Settings > Authorized domains.`;
  }

  if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
    return language === 'ar'
      ? 'المتصفح منع نافذة تسجيل الدخول. افتح التطبيق في Chrome أو Edge واسمح بالنوافذ المنبثقة.'
      : 'The browser blocked Google sign-in. Open the app in Chrome or Edge and allow popups.';
  }

  if (code === 'auth/operation-not-allowed') {
    return language === 'ar'
      ? 'تسجيل الدخول بجوجل غير مفعّل في إعدادات Firebase Authentication.'
      : 'Google sign-in is not enabled in Firebase Authentication.';
  }

  return error instanceof Error ? error.message : 'Could not complete Google sign-in. Please try again.';
}

export const GuestGate: React.FC<GuestGateProps> = ({ onSignedIn }) => {
  const { user, membership, isApproved, signIn, signOut, requestJoinWithCode } = useAuth();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joinSubmitting, setJoinSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code') || params.get('invite');
    if (code) {
      setInviteCodeInput(code.toUpperCase());
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn();
      if (onSignedIn) onSignedIn();
    } catch (err: unknown) {
      console.error(err);
      setError(getGoogleSignInError(err, language));
    } finally {
      setLoading(false);
    }
  };

  const handleManualJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;

    setJoinSubmitting(true);
    setError(null);
    try {
      await requestJoinWithCode(inviteCodeInput.trim().toUpperCase());
    } catch (err: any) {
      setError(err?.message || 'Failed to submit join request. Please verify the invite code.');
    } finally {
      setJoinSubmitting(false);
    }
  };

  // State: Signed in but pending group approval
  if (user && !isApproved) {
    const isPending = membership?.status === 'pending';
    const isRejected = membership?.status === 'rejected';

    return (
      <div className="max-w-md mx-auto my-10 p-6 rounded-3xl bg-[#0e161c] border border-slate-800 shadow-2xl text-center">
        {isPending ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 mb-4 animate-pulse">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-white font-display">{t.pendingTitle}</h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {t.pendingDesc}
            </p>

            <div className="mt-5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-400 space-y-2 text-start">
              <div className="flex justify-between items-center">
                <span>{language === 'ar' ? 'الفرقة' : 'Group'}</span>
                <span className="text-white font-semibold">PitchPass FC</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{language === 'ar' ? 'حالة الطلب' : 'Status'}</span>
                <span className="text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                  {t.pendingStatusBadge}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>{language === 'ar' ? 'الحساب' : 'Account'}</span>
                <span className="text-slate-200 truncate max-w-[190px]">{user.email}</span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-semibold">{t.pendingRealtimeNotice}</span>
            </div>
          </>
        ) : isRejected ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-white font-display">{t.rejectedTitle}</h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {t.rejectedDesc}
            </p>

            <form onSubmit={handleManualJoin} className="mt-4 space-y-2">
              <input
                type="text"
                placeholder={language === 'ar' ? 'اكتب كود الدعوة الجديد...' : 'Enter invite code...'}
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-center tracking-widest uppercase"
              />
              <button
                type="submit"
                disabled={joinSubmitting || !inviteCodeInput.trim()}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                {joinSubmitting ? (language === 'ar' ? 'جاري الإرسال...' : 'Submitting...') : t.reapplyBtn}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 mb-4">
              <KeyRound className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-white font-display">{t.enterInviteCodeTitle}</h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {t.enterInviteCodeDesc}
            </p>

            {error && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleManualJoin} className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="e.g. PITCHPASS-V1"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-center tracking-widest uppercase font-bold"
              />
              <button
                type="submit"
                disabled={joinSubmitting || !inviteCodeInput.trim()}
                className="w-full py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                {joinSubmitting ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{t.submitJoinRequest}</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}

        <button
          onClick={() => signOut()}
          className="mt-6 text-xs text-slate-500 hover:text-slate-300 underline cursor-pointer"
        >
          {t.changeAccount}
        </button>
      </div>
    );
  }

  // State: Not signed in
  const hasInviteParam = Boolean(inviteCodeInput);

  return (
    <div className="max-w-xl mx-auto my-6 sm:my-10 px-4">
      {/* Hero Card */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#0f1b22] to-[#091014] border border-emerald-950/60 p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            {hasInviteParam ? t.invitedBadge : t.privateCircleBadge}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight leading-tight">
            {t.heroTitle1} <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              {t.heroTitleHighlight}
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 mt-4 max-w-md mx-auto leading-relaxed">
            {t.heroSubtitle}
          </p>

          {hasInviteParam && (
            <div className="my-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-xs text-slate-300 font-mono">
              <span className="text-slate-500 font-sans">{language === 'ar' ? 'كود الدعوة:' : 'Code:'}</span>
              <span className="font-bold text-emerald-400 tracking-wider">{inviteCodeInput}</span>
            </div>
          )}

          {/* Core Feature Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-7 text-start">
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">{t.capFeatureTitle}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">{t.capFeatureDesc}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">{t.alertFeatureTitle}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">{t.alertFeatureDesc}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">{t.squadFeatureTitle}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">{t.squadFeatureDesc}</p>
            </div>
          </div>

          {/* Sign In CTA */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 mx-auto cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{t.signInGoogle}</span>
                <ArrowRight className="w-4 h-4 text-slate-900 rtl:rotate-180" />
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400 mt-4">
            {t.noSmsNeeded}
          </p>
        </div>
      </div>
    </div>
  );
};
