import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { X, Calendar, Clock, MapPin, Users, FileText, AlertCircle, Check } from 'lucide-react';
import { Match } from '../../types';
import { createMatch, updateMatch } from '../../services/matchService';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchToEdit?: Match | null;
  onSuccess?: () => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({
  isOpen,
  onClose,
  matchToEdit,
  onSuccess,
}) => {
  const { user, isOwner, isAdmin } = useAuth();
  const { t, isRTL } = useLanguage();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('20:00');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [maxPlayers, setMaxPlayers] = useState(12);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form
  useEffect(() => {
    if (matchToEdit) {
      setTitle(matchToEdit.title);
      setLocation(matchToEdit.location);
      setMaxPlayers(matchToEdit.maxPlayers || 12);
      setNotes(matchToEdit.notes || '');

      const start = new Date(matchToEdit.scheduledStartTime);
      const yyyy = start.getFullYear();
      const mm = String(start.getMonth() + 1).padStart(2, '0');
      const dd = String(start.getDate()).padStart(2, '0');
      setDateStr(`${yyyy}-${mm}-${dd}`);

      const hh = String(start.getHours()).padStart(2, '0');
      const min = String(start.getMinutes()).padStart(2, '0');
      setTimeStr(`${hh}:${min}`);

      if (matchToEdit.scheduledEndTime) {
        const end = new Date(matchToEdit.scheduledEndTime);
        const diffMins = Math.round((end.getTime() - start.getTime()) / 60000);
        if (diffMins > 0) setDurationMinutes(diffMins);
      }
    } else {
      // Default to next day 8:00 PM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      setDateStr(`${yyyy}-${mm}-${dd}`);
      setTimeStr('20:00');
      setTitle('6v6 Evening Match');
      setLocation('Pitch 3 • 4G Artificial Turf');
      setMaxPlayers(12);
      setDurationMinutes(90);
      setNotes('Bring dark and white shirts. Kickoff on time, please arrive 15 mins early.');
    }
  }, [matchToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!isOwner && !isAdmin)) {
      setError('Unauthorized: Admin access required.');
      return;
    }

    if (!title.trim()) {
      setError('Please provide a match title.');
      return;
    }
    if (!location.trim()) {
      setError('Please enter the venue / pitch location.');
      return;
    }
    if (!dateStr || !timeStr) {
      setError('Please specify both date and start time.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const scheduledStartTime = new Date(`${dateStr}T${timeStr}:00`).toISOString();
      const scheduledEndTime = new Date(
        new Date(`${dateStr}T${timeStr}:00`).getTime() + durationMinutes * 60000
      ).toISOString();

      if (matchToEdit) {
        await updateMatch(
          matchToEdit.id,
          {
            title,
            location,
            scheduledStartTime,
            scheduledEndTime,
            maxPlayers,
            notes,
          },
          isOwner ? 'owner' : 'admin'
        );
      } else {
        await createMatch(
          {
            title,
            location,
            scheduledStartTime,
            scheduledEndTime,
            maxPlayers,
            notes,
          },
          user,
          isOwner ? 'owner' : 'admin'
        );
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save match.');
    } finally {
      setLoading(false);
    }
  };

  const isEditing = Boolean(matchToEdit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0e161c] border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              ⚽
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                {isEditing ? t.editModalTitle : t.createModalTitle}
              </h3>
              <p className="text-[11px] text-slate-400">
                {t.matchModalSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.fieldTitle}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.fieldTitlePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.fieldVenue}</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t.fieldVenuePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.fieldDateAny}</span>
              </label>
              <input
                type="date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.fieldKickoffTime}</span>
              </label>
              <input
                type="time"
                required
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 font-medium font-mono"
              />
            </div>
          </div>

          {/* Duration & Capacity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.fieldDuration}
              </label>
              <div className="flex gap-1.5">
                {[60, 90, 120].map((mins) => (
                  <button
                    type="button"
                    key={mins}
                    onClick={() => setDurationMinutes(mins)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      durationMinutes === mins
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {mins} {t.minsLabel}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.fieldMaxPlayers}</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase">12</span>
              </label>
              <input
                type="number"
                min={matchToEdit ? matchToEdit.confirmedCount : 2}
                max={50}
                required
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 12)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 font-bold font-mono"
              />
              {matchToEdit && (
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {isRTL ? `الحد الأدنى: ${matchToEdit.confirmedCount} (لا يمكن النزول عن عدد اللاعيبة المؤكدين)` : `Min: ${matchToEdit.confirmedCount} (cannot be lower than confirmed players)`}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.fieldNotes}</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isRTL ? 'مثلاً: جيب تيشيرت أبيض وتيشيرت أسود. النجيل ترتان. الدفع قبل النزول.' : 'e.g. Bring black and white tops. Pitch requires AG or turf boots. Payment handled at desk.'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-medium resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              {t.cancelBtn}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? t.saveMatchBtn : t.scheduleMatchBtn}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
