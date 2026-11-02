import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Filter,
  Sparkles,
  Ban,
  MessageCircle,
} from 'lucide-react';
import { Match, Reservation } from '../../types';
import { subscribeToMatches } from '../../services/matchService';
import { subscribeToUserReservations } from '../../services/bookingService';
import { MatchModal } from '../matches/MatchModal';
import { MatchDetailsModal } from '../matches/MatchDetailsModal';

export const UpcomingMatchesView: React.FC = () => {
  const { user, group, isOwner, isAdmin } = useAuth();
  const { t, language } = useLanguage();
  const [matches, setMatches] = useState<Match[]>([]);
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [matchToEdit, setMatchToEdit] = useState<Match | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Real-time Firestore subscription to matches & user reservations
  useEffect(() => {
    setLoading(true);
    const unsubMatches = subscribeToMatches(
      group?.id,
      (list) => {
        setMatches(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching matches:', err);
        setLoading(false);
      }
    );

    let unsubUserRes = () => {};
    if (user?.uid) {
      unsubUserRes = subscribeToUserReservations(user.uid, (list) => {
        setUserReservations(list);
      });
    }

    return () => {
      unsubMatches();
      unsubUserRes();
    };
  }, [group?.id, user?.uid]);

  const now = new Date();

  const upcomingMatches = matches.filter(
    (m) => m.status !== 'cancelled' && new Date(m.scheduledStartTime).getTime() >= now.getTime() - 2 * 3600 * 1000
  );

  const pastMatches = matches.filter(
    (m) => m.status === 'completed' || (m.status !== 'cancelled' && new Date(m.scheduledStartTime).getTime() < now.getTime() - 2 * 3600 * 1000)
  );

  const cancelledMatches = matches.filter((m) => m.status === 'cancelled');

  const displayedMatches =
    filterTab === 'upcoming'
      ? upcomingMatches
      : filterTab === 'past'
      ? pastMatches
      : cancelledMatches;

  const locale = language === 'ar' ? 'ar-EG' : 'en-US';

  const handleShareMatchWhatsApp = (e: React.MouseEvent, match: Match) => {
    e.stopPropagation();
    const inviteCode = group?.inviteCode || 'PITCHPASS-V1';
    const link = `${window.location.origin}?code=${inviteCode}`;
    const spotsLeft = Math.max(0, match.maxPlayers - match.confirmedCount);
    const dateStr = new Date(match.scheduledStartTime).toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = new Date(match.scheduledStartTime).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
    const text = language === 'ar'
      ? `⚽ *تقسيمة جديدة على بيتش باس!*\n\n🏆 *${match.title}*\n📍 *الملعب:* ${match.location}\n📅 *الميعاد:* ${dateStr} الساعة ${timeStr}\n👥 *التشكيلة:* ${match.confirmedCount}/${match.maxPlayers} لاعب ${spotsLeft > 0 ? `(باقي ${spotsLeft} أماكن بس ⏳)` : '(التقسيمة قفلت)'}\n\nاحجز مكانك في التشكيلة الأساسية قبل ما تقفل:\n${link}`
      : `⚽ *Football Match on PitchPass!*\n\n🏆 *${match.title}*\n📍 *Venue:* ${match.location}\n📅 *When:* ${dateStr} at ${timeStr}\n👥 *Roster:* ${match.confirmedCount}/${match.maxPlayers} Players ${spotsLeft > 0 ? `(${spotsLeft} spots left!)` : '(Full)'}\n\nBook your spot:\n${link}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* View Header with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white font-display">{t.matchesHeader}</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {t.scheduledBadge(upcomingMatches.length)}
            </span>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setMatchToEdit(null);
              setIsCreateOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>{t.scheduleMatchBtn}</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setFilterTab('upcoming')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterTab === 'upcoming'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{t.filterUpcoming} ({upcomingMatches.length})</span>
        </button>

        <button
          onClick={() => setFilterTab('past')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterTab === 'past'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{t.filterPast} ({pastMatches.length})</span>
        </button>

        {cancelledMatches.length > 0 && (
          <button
            onClick={() => setFilterTab('cancelled')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === 'cancelled'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <Ban className="w-4 h-4" />
            <span>{t.filterCancelled} ({cancelledMatches.length})</span>
          </button>
        )}
      </div>

      {/* Matches List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          {language === 'ar' ? 'جاري تحميل جدول التقسيمات...' : 'Loading matches...'}
        </div>
      ) : displayedMatches.length === 0 ? (
        <div className="p-10 rounded-3xl bg-[#0d151a] border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">
            ⚽
          </div>
          <h3 className="text-base font-bold text-white font-display">
            {filterTab === 'upcoming'
              ? t.noUpcomingMatches
              : filterTab === 'past'
              ? (language === 'ar' ? 'مفيش تقسيمات سابقة مسجلة' : 'No Past Matches')
              : (language === 'ar' ? 'مفيش تقسيمات ملغية' : 'No Cancelled Matches')}
          </h3>
          {isAdmin && filterTab === 'upcoming' && (
            <button
              onClick={() => {
                setMatchToEdit(null);
                setIsCreateOpen(true);
              }}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.scheduleFirstMatch}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayedMatches.map((match) => {
            const isFull = match.confirmedCount >= match.maxPlayers;
            const isCancelled = match.status === 'cancelled';
            const spotsRemaining = Math.max(0, match.maxPlayers - match.confirmedCount);

            const matchDate = new Date(match.scheduledStartTime);
            const dateStr = matchDate.toLocaleDateString(locale, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            const timeStr = matchDate.toLocaleTimeString(locale, {
              hour: '2-digit',
              minute: '2-digit',
            });

            const isUserBookedInThisMatch = userReservations.some((r) => r.matchId === match.id);

            return (
              <div
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className="group relative rounded-3xl bg-[#0d151a] border border-slate-800/90 hover:border-emerald-500/50 p-5 sm:p-6 transition-all shadow-xl hover:shadow-2xl cursor-pointer overflow-hidden"
              >
                {/* Glow bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/40 via-teal-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Status Bar */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        isCancelled
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : isFull
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isCancelled
                            ? 'bg-rose-400'
                            : isFull
                            ? 'bg-rose-400'
                            : 'bg-emerald-400 animate-pulse'
                        }`}
                      />
                      {isCancelled
                        ? t.matchCancelled
                        : isFull
                        ? t.matchFull
                        : t.matchOpenSpots(spotsRemaining)}
                    </span>

                    {isUserBookedInThisMatch && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                        <CheckCircle2 className="w-3 h-3 text-teal-400" />
                        {t.youAreBooked}
                      </span>
                    )}
                  </div>

                  <div className="text-start sm:text-end">
                    <span className="text-sm font-black text-white font-mono">
                      {match.confirmedCount}/{match.maxPlayers}
                    </span>
                    <span className="text-[10px] text-slate-400 block -mt-0.5">
                      {language === 'ar' ? 'لاعب' : 'Players'}
                    </span>
                  </div>
                </div>

                {/* Match Title & Location */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-black text-white font-display tracking-tight group-hover:text-emerald-300 transition-colors truncate">
                      {match.title}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>
                          {dateStr} • {timeStr}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{match.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center text-slate-500 group-hover:text-emerald-400 transition-colors">
                    <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="mt-4">
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCancelled
                          ? 'bg-slate-600'
                          : isFull
                          ? 'bg-rose-500'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      }`}
                      style={{
                        width: `${Math.min(100, (match.confirmedCount / match.maxPlayers) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Footer notes, WhatsApp share, & view details */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 gap-2">
                  <span className="truncate max-w-[220px] hidden sm:inline">
                    {match.notes || (language === 'ar' ? 'اضغط لعرض التشكيلة وحجز مكانك' : 'Tap to view 12-slot lineup and details')}
                  </span>
                  <div className="flex items-center gap-2 ms-auto">
                    <button
                      onClick={(e) => handleShareMatchWhatsApp(e, match)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title={language === 'ar' ? 'مشاركة التقسيمة على واتساب' : 'Share match on WhatsApp'}
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{language === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
                    </button>
                    <span className="text-emerald-400 font-semibold group-hover:underline flex-shrink-0">
                      {t.viewDetails}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Match Creation/Editing Modal */}
      <MatchModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setMatchToEdit(null);
        }}
        matchToEdit={matchToEdit}
      />

      {/* Match Details Modal */}
      <MatchDetailsModal
        match={selectedMatch}
        isOpen={Boolean(selectedMatch)}
        onClose={() => setSelectedMatch(null)}
        onEdit={(m) => {
          setSelectedMatch(null);
          setMatchToEdit(m);
          setIsCreateOpen(true);
        }}
      />
    </div>
  );
};
