import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  Edit,
  Ban,
  RotateCcw,
  CheckCircle,
  FileText,
  Shield,
  Sparkles,
  Zap,
  Trash2,
  TestTube,
  MessageCircle,
  Share2,
} from 'lucide-react';
import { Match, Reservation } from '../../types';
import { cancelMatch, reopenMatch } from '../../services/matchService';
import {
  reserveSpot,
  cancelSpot,
  subscribeToMatchReservations,
} from '../../services/bookingService';
import { subscribeToGroupMemberships } from '../../services/groupService';
import { DEFAULT_GROUP_ID } from '../../firebase/config';

interface MatchDetailsModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (match: Match) => void;
}

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({
  match,
  isOpen,
  onClose,
  onEdit,
}) => {
  const { user, profile, group, isOwner, isAdmin } = useAuth();
  const { t, language } = useLanguage();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [membersMap, setMembersMap] = useState<
    Record<string, { photoURL?: string | null; displayName?: string }>
  >({});

  // Subscribe to group members to always have real-time profile photos and names
  useEffect(() => {
    if (!isOpen || !match?.id) return;
    const unsub = subscribeToGroupMemberships(
      match.groupId || DEFAULT_GROUP_ID,
      (members) => {
        const map: Record<string, { photoURL?: string | null; displayName?: string }> = {};
        members.forEach((m) => {
          map[m.userId] = { photoURL: m.photoURL, displayName: m.displayName };
        });
        setMembersMap(map);
      },
      (err) => console.warn('Squad membership map notice:', err)
    );
    return () => unsub();
  }, [isOpen, match?.id, match?.groupId]);

  // Subscribe to confirmed bookings for this match in real time
  useEffect(() => {
    if (!match?.id || !isOpen) return;

    const unsubscribe = subscribeToMatchReservations(
      match.id,
      (list) => {
        setReservations(list);
      },
      (err) => {
        console.error('Error fetching reservations:', err);
      }
    );

    return () => unsubscribe();
  }, [match?.id, isOpen]);

  if (!isOpen || !match) return null;

  const locale = language === 'ar' ? 'ar-EG' : 'en-US';

  // Real-time confirmed count from live reservations
  const confirmedCount = reservations.length;
  const isFull = confirmedCount >= match.maxPlayers;
  const isCancelled = match.status === 'cancelled';
  const isStarted = new Date(match.scheduledStartTime) <= new Date();
  const spotsLeft = Math.max(0, match.maxPlayers - confirmedCount);

  // Current user's booking status
  const userReservation = reservations.find((r) => r.userId === user?.uid);
  const isUserBooked = Boolean(userReservation);

  // Time formatters
  const startDate = new Date(match.scheduledStartTime);
  const dateStr = startDate.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = startDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  let endTimeStr = '';
  if (match.scheduledEndTime) {
    endTimeStr = new Date(match.scheduledEndTime).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Handle spot claim (Phase 4 atomic transaction)
  const handleClaimSpot = async () => {
    if (!user) return;
    setActionLoading('claim');
    setError(null);
    setSuccess(null);

    try {
      await reserveSpot(match.id, user, profile);
      setSuccess(language === 'ar' ? 'مكانك اتحجز خلاص! هتنزل التشكيلة الأساسية ⚽' : 'Spot confirmed! You are on the roster.');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to claim spot.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle spot cancellation (Phase 4 auto-reopen)
  const handleCancelSpot = async (targetUserId?: string, targetUserName?: string) => {
    if (!user) return;
    const isSelf = !targetUserId || targetUserId === user.uid;
    const name = targetUserName || (language === 'ar' ? 'حسابك' : 'your spot');

    const confirmMsg = isSelf
      ? (language === 'ar' ? 'متأكد انك عايز تعتذر عن التقسيمة دي؟ المكان هيفتح فوراً لباقي الصحاب في الجروب.' : 'Are you sure you want to cancel your spot? It will immediately reopen for other squad members.')
      : (language === 'ar' ? `حذف اللاعب ${name} من تشكيلة التقسيمة؟` : `Remove ${name} from this match?`);

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setActionLoading(isSelf ? 'cancel_self' : `cancel_${targetUserId}`);
    setError(null);
    setSuccess(null);

    try {
      await cancelSpot(match.id, targetUserId || user.uid, user, isOwner || isAdmin);
      setSuccess(isSelf ? (language === 'ar' ? 'تم إلغاء حجزك والمكان فضي لباقي اللاعيبة.' : 'Spot cancelled. Slot reopened for the squad.') : `Removed ${name} from roster.`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel spot.');
    } finally {
      setActionLoading(null);
    }
  };

  // WhatsApp Share with Pre-filled match details
  const handleWhatsAppShareMatch = () => {
    const inviteCode = group?.inviteCode || 'PITCHPASS-V1';
    const link = `${window.location.origin}?code=${inviteCode}`;
    const text = language === 'ar'
      ? `⚽ *تقسيمة جديدة على بيتش باس!*\n\n🏆 *${match.title}*\n📍 *الملعب:* ${match.location}\n📅 *الميعاد:* ${dateStr} الساعة ${timeStr}\n👥 *التشكيلة:* ${confirmedCount}/${match.maxPlayers} لاعب ${spotsLeft > 0 ? `(باقي ${spotsLeft} أماكن بس ⏳)` : '(التقسيمة قفلت)'}\n\nاحجز مكانك في التشكيلة الأساسية قبل ما تقفل:\n${link}`
      : `⚽ *New Football Match on PitchPass!*\n\n🏆 *${match.title}*\n📍 *Pitch:* ${match.location}\n📅 *When:* ${dateStr} at ${timeStr}\n👥 *Roster:* ${confirmedCount}/${match.maxPlayers} Players ${spotsLeft > 0 ? `(${spotsLeft} spots left!)` : '(Full)'}\n\nClaim your spot on the pitch:\n${link}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Concurrency Race Condition Test
  const handleRunConcurrencyTest = async () => {
    if (!user || !isAdmin) return;
    setTestResult(null);
    setError(null);
    setActionLoading('test_race');

    try {
      const dummyUserA: any = { uid: `sim_user_A_${Date.now()}`, displayName: 'Simulated Player A' };
      const dummyUserB: any = { uid: `sim_user_B_${Date.now()}`, displayName: 'Simulated Player B' };

      const promises = [
        reserveSpot(match.id, dummyUserA, { id: dummyUserA.uid, displayName: 'Simulated Player A', email: 'a@sim.local', createdAt: '' }),
        reserveSpot(match.id, dummyUserB, { id: dummyUserB.uid, displayName: 'Simulated Player B', email: 'b@sim.local', createdAt: '' }),
      ];

      const results = await Promise.allSettled(promises);
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      setTestResult(
        language === 'ar'
          ? `نتيجة اختبار التزامن الذري:\n• نجح في الحجز: ${fulfilled.length}\n• اترفض عشان العدد قفل: ${rejected.length}\n${
              rejected[0] ? `• سبب الرفض السيرفر: ${(rejected[0] as PromiseRejectedResult).reason?.message}` : ''
            }`
          : `Concurrency Test Complete:\n• Successful: ${fulfilled.length}\n• Blocked/Rejected: ${rejected.length}\n${
              rejected[0] ? `• Error Reason: ${(rejected[0] as PromiseRejectedResult).reason?.message}` : ''
            }`
      );
    } catch (err: any) {
      setError(`Concurrency test failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelMatch = async () => {
    if (!isAdmin) return;
    const reason = window.prompt(language === 'ar' ? 'سبب إلغاء التقسيمة؟ (مثال: صيانة الملعب أو ظروف جوية)' : 'Reason for cancelling this match? (Optional: e.g. Pitch Maintenance)');
    if (reason === null) return;

    setActionLoading('cancel_match');
    setError(null);
    try {
      await cancelMatch(match.id, isOwner ? 'owner' : 'admin', reason);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel match.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReopenMatch = async () => {
    if (!isAdmin) return;
    if (!window.confirm(language === 'ar' ? 'إعادة فتح التقسيمة دي للحجز من تاني؟' : 'Reopen this match for booking?')) return;

    setActionLoading('reopen_match');
    setError(null);
    try {
      await reopenMatch(match.id, isOwner ? 'owner' : 'admin');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to reopen match.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0e161c] border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isCancelled
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : isFull
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : isStarted
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCancelled
                    ? 'bg-rose-400'
                    : isFull
                    ? 'bg-rose-400'
                    : isStarted
                    ? 'bg-slate-400'
                    : 'bg-emerald-400 animate-pulse'
                }`}
              />
              {isCancelled
                ? t.matchCancelled
                : isStarted
                ? t.matchStarted
                : isFull
                ? t.matchFull
                : t.matchOpenSpots(spotsLeft)}
            </span>

            {isUserBooked && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                {t.youAreBooked}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{success}</span>
              </div>
              <button onClick={() => setSuccess(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
          )}

          {/* Title & Info */}
          <div>
            <h2 className="text-2xl font-black text-white font-display tracking-tight">
              {match.title}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs text-slate-300">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-white">{dateStr}</div>
                  <div className="text-[11px] text-slate-400">
                    {timeStr} {endTimeStr ? `– ${endTimeStr}` : ''}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">{match.location}</div>
                  <div className="text-[11px] text-slate-400">
                    {language === 'ar' ? 'ملعب نجيل صناعي / ترتان' : 'Pitch Location'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Capacity Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                {language === 'ar' ? 'سعة التقسيمة (مقفولة بالظبط)' : 'Roster Capacity (Strict Cap)'}
              </span>
              <span className="font-mono font-bold text-white text-sm">
                {confirmedCount} / {match.maxPlayers} {language === 'ar' ? 'لاعب مؤكد' : 'Confirmed'}
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isCancelled
                    ? 'bg-slate-600'
                    : isFull
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${Math.min(100, (confirmedCount / match.maxPlayers) * 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-500">
              <span>{t.modalFirstComeNotice}</span>
              <span className="text-emerald-400 font-semibold">
                {spotsLeft > 0 ? (language === 'ar' ? `باقي ${spotsLeft} أماكن بس` : `${spotsLeft} spots available`) : (language === 'ar' ? 'التقسيمة قفلت' : 'Capacity Locked')}
              </span>
            </div>
          </div>

          {/* Primary Action Button (Claim / Cancel Spot) */}
          <div className="pt-1">
            {isUserBooked ? (
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">{t.modalYouAreBooked}</div>
                    <div className="text-[11px] text-slate-400">
                      {language === 'ar' ? 'تم الحجز: ' : 'Booked at '}
                      {userReservation?.bookedAt
                        ? new Date(userReservation.bookedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
                        : 'مؤكد'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleCancelSpot()}
                  disabled={actionLoading === 'cancel_self'}
                  className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {actionLoading === 'cancel_self' ? (
                    <div className="w-4 h-4 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>{t.modalCancelSpotBtn}</span>
                    </>
                  )}
                </button>
              </div>
            ) : isCancelled ? (
              <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs text-center font-semibold">
                {language === 'ar' ? 'التقسيمة دي اتلغت من المنظم. الحجز مقفول.' : 'This match was cancelled by an admin. Reservations are closed.'}
              </div>
            ) : isStarted ? (
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs text-center font-semibold">
                {t.modalMatchStarted}
              </div>
            ) : isFull ? (
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs text-center font-semibold flex items-center justify-center gap-2">
                <span>{language === 'ar' ? 'التقسيمة كاملة ١٢/١٢ • أول ما حد يعتذر مكانه هيفتح فوراً' : 'Match Full (12/12) • Awaiting Dropouts'}</span>
              </div>
            ) : (
              <button
                onClick={handleClaimSpot}
                disabled={actionLoading === 'claim'}
                className="w-full py-3.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
              >
                {actionLoading === 'claim' ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>{t.modalClaimSpotBtn(confirmedCount + 1, match.maxPlayers)}</span>
                  </>
                )}
              </button>
            )}

            {/* Quick WhatsApp Share Button */}
            <button
              onClick={handleWhatsAppShareMatch}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>{language === 'ar' ? 'شير التقسيمة على جروب الواتساب' : 'Share Match to WhatsApp Group'}</span>
            </button>
          </div>

          {/* Notes */}
          {match.notes && (
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.modalMatchNotes}</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {match.notes}
              </p>
            </div>
          )}

          {/* 12-Slot Lineup Visualizer */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t.modalSquadLineup(match.maxPlayers)}
              </h4>
              <span className="text-[10px] text-emerald-400 font-mono">
                {t.modalSpotsInfo(confirmedCount, spotsLeft)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Array.from({ length: match.maxPlayers }).map((_, idx) => {
                const slotNumber = idx + 1;
                const reservation = reservations[idx];
                const isBooked = Boolean(reservation);
                const isCurrentUserSlot = reservation?.userId === user?.uid;
                const memberInfo = reservation ? membersMap[reservation.userId] : null;

                // Priority: Current user profile photo > squad member photo > reservation saved userAvatar > Google photo
                const playerPhoto = isCurrentUserSlot
                  ? (profile?.photoURL || memberInfo?.photoURL || reservation?.userAvatar || user?.photoURL || null)
                  : (memberInfo?.photoURL || reservation?.userAvatar || null);

                const playerName = isCurrentUserSlot
                  ? (profile?.displayName || memberInfo?.displayName || reservation?.userName || user?.displayName || (language === 'ar' ? 'لاعب' : 'Player'))
                  : (memberInfo?.displayName || reservation?.userName || (language === 'ar' ? 'لاعب' : 'Player'));

                return (
                  <div
                    key={idx}
                    className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isCurrentUserSlot
                        ? 'bg-emerald-950/40 border-emerald-500/80 text-white shadow-md shadow-emerald-950/20'
                        : isBooked
                        ? 'bg-slate-900/80 border-slate-800 text-slate-200'
                        : 'bg-slate-950/40 border-dashed border-slate-800/80 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Slot Hash Number */}
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-xs flex-shrink-0 ${
                          isCurrentUserSlot
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : isBooked
                            ? 'bg-slate-800 text-emerald-400 border border-slate-700/60'
                            : 'bg-slate-900/90 text-slate-600 border border-slate-800/60'
                        }`}
                      >
                        #{slotNumber}
                      </span>

                      {isBooked ? (
                        <>
                          {/* Player Profile Photo */}
                          <div className="relative flex-shrink-0">
                            {playerPhoto ? (
                              <img
                                src={playerPhoto}
                                alt={playerName}
                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shadow-sm ${
                                  isCurrentUserSlot
                                    ? 'ring-2 ring-emerald-400 shadow-emerald-500/20'
                                    : 'ring-1.5 ring-slate-700'
                                }`}
                              />
                            ) : (
                              <div
                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                                  isCurrentUserSlot
                                    ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400'
                                    : 'bg-slate-800 text-emerald-400 border border-slate-700 ring-1 ring-slate-700/50'
                                }`}
                              >
                                {playerName ? playerName[0].toUpperCase() : 'P'}
                              </div>
                            )}

                            {isCurrentUserSlot && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[8px] font-black shadow ring-1 ring-slate-950">
                                ✓
                              </span>
                            )}
                          </div>

                          {/* Player Info */}
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                              <span className="truncate">{playerName}</span>
                              {isCurrentUserSlot && (
                                <span className="text-[10px] text-emerald-400 font-semibold px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0">
                                  {language === 'ar' ? '(أنت)' : '(You)'}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-slate-500 flex-shrink-0" />
                              <span className="truncate">
                                {language === 'ar' ? 'حجز: ' : 'Confirmed '}
                                {new Date(reservation.bookedAt).toLocaleTimeString(locale, {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-500 min-w-0">
                          <div className="w-8 h-8 rounded-full border border-dashed border-slate-800 flex items-center justify-center text-slate-600 text-xs flex-shrink-0">
                            +
                          </div>
                          <span className="text-xs font-medium text-slate-600 italic truncate">
                            {t.openSlotVisual}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Admin kick control */}
                    {isBooked && isAdmin && !isCurrentUserSlot && (
                      <button
                        onClick={() => handleCancelSpot(reservation.userId, playerName)}
                        disabled={actionLoading === `cancel_${reservation.userId}`}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                        title={language === 'ar' ? 'إزالة اللاعب من الماتش' : 'Remove player'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Concurrency Verification Tool (Admin / Dev Test) */}
          {isAdmin && (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <TestTube className="w-4 h-4 text-emerald-400" />
                  <span>{language === 'ar' ? 'اختبار التزامن الذري اللحظي' : 'Phase 4 Concurrency Race Test'}</span>
                </span>
                <button
                  onClick={handleRunConcurrencyTest}
                  disabled={actionLoading === 'test_race' || isFull || isCancelled}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
                >
                  {actionLoading === 'test_race'
                    ? (language === 'ar' ? 'جاري المحاكاة...' : 'Simulating Race...')
                    : (language === 'ar' ? 'محاكاة حجزين في نفس اللحظة' : 'Simulate 2 Simultaneous Taps')}
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                {language === 'ar'
                  ? 'يرسل حجزين ذريين متزامنين على آخر مكان للتأكد أن واحد فقط ينجح والثاني يُرفض حماية للحد الأقصى (١٢).'
                  : 'Fires 2 simultaneous atomic transactions targeting the last spot to verify that exactly 1 succeeds and the other is safely rejected.'}
              </p>

              {testResult && (
                <pre className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 whitespace-pre-wrap">
                  {testResult}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer Admin Controls */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/40 flex flex-wrap items-center justify-between gap-3">
          {isAdmin ? (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  onClose();
                  onEdit(match);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.modalEditMatch}</span>
              </button>

              {isCancelled ? (
                <button
                  onClick={handleReopenMatch}
                  disabled={actionLoading === 'reopen_match'}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.modalReopenMatch}</span>
                </button>
              ) : (
                <button
                  onClick={handleCancelMatch}
                  disabled={actionLoading === 'cancel_match'}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-800/60 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>{t.modalCancelMatch}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              {language === 'ar' ? 'مكان واحد فقط لكل لاعب في الماتش' : 'One spot per player per match.'}
            </div>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            {t.modalClose}
          </button>
        </div>
      </div>
    </div>
  );
};
