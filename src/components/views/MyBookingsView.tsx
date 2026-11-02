import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Ticket,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  X,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Match, Reservation } from '../../types';
import { subscribeToUserReservations, cancelSpot } from '../../services/bookingService';
import { subscribeToMatches } from '../../services/matchService';

interface MyBookingsViewProps {
  onNavigateToMatches?: () => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({ onNavigateToMatches }) => {
  const { user, group, isOwner, isAdmin } = useAuth();
  const { t, isRTL } = useLanguage();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Subscribe to user's reservations
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsubReservations = subscribeToUserReservations(
      user.uid,
      (list) => {
        setReservations(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error in user reservations:', err);
        setLoading(false);
      }
    );

    const unsubMatches = subscribeToMatches(
      group?.id,
      (list) => {
        setMatches(list);
      }
    );

    return () => {
      unsubReservations();
      unsubMatches();
    };
  }, [user?.uid, group?.id]);

  const handleCancelReservation = async (matchId: string, matchTitle: string) => {
    if (!user) return;
    const confirmPrompt = isRTL
      ? `تأكيد الاعتذار عن "${matchTitle}"؟ مكانك هيفتح فوراً لباقي اللاعيبة.`
      : `Cancel your spot for "${matchTitle}"? It will instantly reopen for other squad members.`;
    if (!window.confirm(confirmPrompt)) {
      return;
    }

    setCancellingId(matchId);
    setError(null);
    setSuccess(null);

    try {
      await cancelSpot(matchId, user.uid, user, isOwner || isAdmin);
      const successMsg = isRTL
        ? `تم الاعتذار عن "${matchTitle}". المكان فتح فوراً للصحاب.`
        : `Spot cancelled for "${matchTitle}". The slot has reopened for the squad.`;
      setSuccess(successMsg);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel spot.');
    } finally {
      setCancellingId(null);
    }
  };

  // Find match for each reservation
  const bookedMatches = reservations
    .map((res) => {
      const match = matches.find((m) => m.id === res.matchId);
      return { reservation: res, match };
    })
    .filter((item): item is { reservation: Reservation; match: Match } => Boolean(item.match));

  return (
    <div className="space-y-6">
      {/* Toast feedback */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white font-display">{t.myBookingsHeader}</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {t.activeSpotsCount(bookedMatches.length)}
            </span>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading your spots...</div>
      ) : bookedMatches.length === 0 ? (
        <div className="p-10 rounded-3xl bg-[#0d151a] border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">
            <Ticket className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white font-display">{t.noActiveBookings}</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {t.noActiveBookingsDesc}
          </p>
          {onNavigateToMatches && (
            <button
              onClick={onNavigateToMatches}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <span>{t.browseMatchesBtn}</span>
              <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {bookedMatches.map(({ reservation, match }) => {
            const startDate = new Date(match.scheduledStartTime);
            const dateStr = startDate.toLocaleDateString(isRTL ? 'ar-EG' : undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            const timeStr = startDate.toLocaleTimeString(isRTL ? 'ar-EG' : undefined, {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={reservation.id}
                className="rounded-2xl bg-[#0d151a] border border-emerald-500/40 p-5 sm:p-6 shadow-xl relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 self-start">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    {t.spotConfirmedBadge}
                  </span>

                  <span className="text-xs font-mono text-slate-400">
                    {match.confirmedCount}/{match.maxPlayers} {t.capacityFilled}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white font-display">{match.title}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>{dateStr} • {timeStr}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span className="truncate">{match.location}</span>
                  </div>
                </div>

                {/* Footer action */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-400">
                    {t.bookedAtPrefix} {new Date(reservation.bookedAt).toLocaleString(isRTL ? 'ar-EG' : undefined, { dateStyle: 'short', timeStyle: 'short' })}
                  </div>

                  <button
                    onClick={() => handleCancelReservation(match.id, match.title)}
                    disabled={cancellingId === match.id}
                    className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer self-end sm:self-auto"
                  >
                    {cancellingId === match.id ? (
                      <div className="w-4 h-4 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <X className="w-3.5 h-3.5" />
                        <span>{t.cancelMySpot}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
