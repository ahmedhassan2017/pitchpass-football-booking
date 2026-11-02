import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Users,
  Shield,
  ShieldAlert,
  Share2,
  Copy,
  Check,
  UserCheck,
  UserX,
  Sparkles,
  RefreshCw,
  Crown,
  ChevronRight,
  UserMinus,
  MessageCircle,
  Clock,
  AlertTriangle,
  Edit3,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import {
  subscribeToGroupMemberships,
  approveMembership,
  rejectMembership,
  changeMemberRole,
  removeMember,
  regenerateInviteCode,
  setCustomInviteCode,
} from '../../services/groupService';
import { Membership, UserRole } from '../../types';

export const SquadView: React.FC = () => {
  const { user, group, isOwner, isAdmin, refreshGroup } = useAuth();
  const { t, isRTL } = useLanguage();
  const [members, setMembers] = useState<Membership[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'pending' | 'invite'>('roster');
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [customCodeInput, setCustomCodeInput] = useState('');

  // Real-time listener for group memberships
  useEffect(() => {
    setLoadingMembers(true);
    const unsubscribe = subscribeToGroupMemberships(
      group?.id,
      (list) => {
        setMembers(list);
        setLoadingMembers(false);
      },
      (err) => {
        console.error('Error fetching memberships:', err);
        setErrorMsg(
          isRTL
            ? `تعذر تحميل طلبات الانضمام: ${err.message}`
            : `Could not load join requests: ${err.message}`
        );
        setLoadingMembers(false);
      }
    );

    return () => unsubscribe();
  }, [group?.id, isRTL]);

  const approvedMembers = members.filter((m) => m.status === 'approved');
  const pendingMembers = members.filter((m) => m.status === 'pending');
  const rejectedMembers = members.filter((m) => m.status === 'rejected');

  const inviteCode = group?.inviteCode || 'PITCHPASS-V1';
  const inviteUrl = `${window.location.origin}?code=${inviteCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const inviteMsg = isRTL
      ? `⚽ انضم لجروب تقسيمة الكورة *${group?.name || 'بيتش باس'}* على التطبيق عشان تحجز الماتشات الجاية:\n${inviteUrl}`
      : `⚽ Join our private football circle *${group?.name || 'PitchPass FC'}* on PitchPass to book upcoming matches:\n${inviteUrl}`;
    const text = encodeURIComponent(inviteMsg);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleRegenerateCode = async () => {
    if (!isOwner) return;
    const confirmPrompt = isRTL
      ? 'تأكيد توليد كود دعوة جديد؟ الروابط القديمة هتتوقف فوراً.'
      : 'Regenerate invite code? Existing links will become invalid.';
    if (!window.confirm(confirmPrompt)) return;
    setActionLoading('regen_code');
    try {
      await regenerateInviteCode(group?.id);
      await refreshGroup();
      setSuccessMsg(isRTL ? 'تم توليد كود دعوة جديد بنجاح!' : 'New invite code generated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to regenerate invite code');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveCustomCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    if (!customCodeInput.trim()) return;
    setActionLoading('save_code');
    setErrorMsg(null);
    try {
      await setCustomInviteCode(customCodeInput, group?.id);
      await refreshGroup();
      setSuccessMsg(isRTL ? 'تم حفظ كود الدعوة المخصص بنجاح!' : 'Custom invite code saved successfully!');
      setIsEditingCode(false);
      setCustomCodeInput('');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update invite code');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (membershipId: string, memberName: string) => {
    if (!isAdmin) return;
    setActionLoading(`approve_${membershipId}`);
    setErrorMsg(null);
    try {
      await approveMembership(membershipId, user?.uid || '');
      setSuccessMsg(isRTL ? `تم اعتماد اللاعب ${memberName} في الفرقة!` : `Approved ${memberName} into the squad!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Approval failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (membershipId: string, memberName: string) => {
    if (!isAdmin) return;
    const confirmPrompt = isRTL
      ? `رفض طلب انضمام اللاعب ${memberName}؟`
      : `Reject access request for ${memberName}?`;
    if (!window.confirm(confirmPrompt)) return;
    setActionLoading(`reject_${membershipId}`);
    setErrorMsg(null);
    try {
      await rejectMembership(membershipId, user?.uid || '');
      setSuccessMsg(isRTL ? `تم رفض طلب ${memberName}.` : `Rejected ${memberName}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Rejection failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (membershipId: string, newRole: 'admin' | 'member', memberName: string) => {
    if (!isOwner) {
      setErrorMsg(isRTL ? 'غير مصرح: أدمن الفرقة (المالك) فقط هو من يعدل الصلاحيات.' : 'Unauthorized: Only the Group Owner can promote or demote squad roles.');
      return;
    }
    setActionLoading(`role_${membershipId}`);
    setErrorMsg(null);
    try {
      await changeMemberRole(membershipId, newRole, 'owner');
      const roleLabel = newRole === 'admin' ? t.roleAdmin : t.roleMember;
      setSuccessMsg(isRTL ? `تم تغيير رتبة ${memberName} إلى ${roleLabel}.` : `Updated ${memberName}'s role to ${newRole.toUpperCase()}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Role change failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (membershipId: string, memberName: string) => {
    if (!isAdmin) return;
    const confirmPrompt = isRTL
      ? `تأكيد إزالة اللاعب ${memberName} من الفرقة؟`
      : `Are you sure you want to remove ${memberName} from the group?`;
    if (!window.confirm(confirmPrompt)) return;
    setActionLoading(`remove_${membershipId}`);
    setErrorMsg(null);
    try {
      await removeMember(membershipId, isOwner ? 'owner' : 'admin');
      setSuccessMsg(isRTL ? `تم حذف ${memberName} من الفرقة.` : `Removed ${memberName} from squad.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Remove failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast feedback */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-slate-400 hover:text-white ml-2">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white font-display">{t.squadHeader}</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {t.activePlayersCount(approvedMembers.length)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t.squadSubheader}
          </p>
        </div>

        {/* WhatsApp Invite Quick CTA */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t.shareWhatsAppBtn}</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 flex-wrap sm:flex-nowrap">
        <button
          onClick={() => setActiveSubTab('roster')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'roster'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t.tabRoster(approvedMembers.length)}</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveSubTab('pending')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
              activeSubTab === 'pending'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{t.tabPending(pendingMembers.length)}</span>
            {pendingMembers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                {pendingMembers.length}
              </span>
            )}
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setActiveSubTab('invite')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'invite'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>{t.tabInviteSettings}</span>
          </button>
        )}
      </div>

      {/* Tab 1: Squad Roster */}
      {activeSubTab === 'roster' && (
        <div className="rounded-2xl bg-[#0d151a] border border-slate-800/80 overflow-hidden shadow-xl">
          <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>{t.playerCol}</span>
            <span>{t.roleCol}</span>
          </div>

          {loadingMembers ? (
            <div className="p-8 text-center text-xs text-slate-400">{isRTL ? 'جاري تحميل اللاعيبة...' : 'Loading squad...'}</div>
          ) : approvedMembers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">{isRTL ? 'مفيش لاعيبة معتمدين حتى الآن.' : 'No approved squad members yet.'}</div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {approvedMembers.map((m) => {
                const isTargetOwner = m.role === 'owner';
                const isTargetAdmin = m.role === 'admin';
                const isCurrentUser = m.userId === user?.uid;

                return (
                  <div
                    key={m.id}
                    className="p-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
                  >
                    {/* Player Info */}
                    <div className="flex items-center gap-3.5">
                      {m.photoURL ? (
                        <img
                          src={m.photoURL}
                          alt={m.displayName}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-extrabold text-sm text-emerald-400">
                          {m.displayName ? m.displayName[0].toUpperCase() : 'P'}
                        </div>
                      )}

                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{m.displayName}</span>
                          {isCurrentUser && (
                            <span className="text-[10px] text-emerald-400 font-normal">{t.youTag}</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">{m.email}</div>
                      </div>
                    </div>

                    {/* Role & Actions */}
                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
                      {/* Role Pill */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${
                          isTargetOwner
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                            : isTargetAdmin
                            ? 'bg-blue-500/15 text-blue-300 border border-blue-500/40'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {isTargetOwner && <Crown className="w-3 h-3 text-emerald-400" />}
                        {isTargetAdmin && <Shield className="w-3 h-3 text-blue-400" />}
                        {isTargetOwner ? t.roleOwner : isTargetAdmin ? t.roleAdmin : t.roleMember}
                      </span>

                      {/* Role Management (Owner Only) */}
                      {isOwner && !isTargetOwner && (
                        <div className="flex items-center gap-1.5">
                          {isTargetAdmin ? (
                            <button
                              onClick={() => handleRoleChange(m.id, 'member', m.displayName)}
                              disabled={actionLoading === `role_${m.id}`}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition-colors cursor-pointer"
                              title={t.demoteBtn}
                            >
                              {t.demoteBtn}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRoleChange(m.id, 'admin', m.displayName)}
                              disabled={actionLoading === `role_${m.id}`}
                              className="px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 text-[11px] font-semibold border border-blue-800/60 transition-colors cursor-pointer"
                              title={t.makeAdminBtn}
                            >
                              {t.makeAdminBtn}
                            </button>
                          )}

                          <button
                            onClick={() => handleRemove(m.id, m.displayName)}
                            disabled={actionLoading === `remove_${m.id}`}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title={t.removeTooltip}
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Pending Approvals Queue */}
      {activeSubTab === 'pending' && isAdmin && (
        <div className="rounded-2xl bg-[#0d151a] border border-amber-500/30 overflow-hidden shadow-xl">
          <div className="px-5 py-3.5 border-b border-slate-800 bg-amber-950/20 flex items-center justify-between text-xs text-amber-300 font-semibold uppercase tracking-wider">
            <span>{t.pendingHeader(pendingMembers.length)}</span>
            <span className="text-[11px] text-slate-400 lowercase font-normal">
              {t.pendingSubNotice}
            </span>
          </div>

          {loadingMembers ? (
            <div className="p-8 text-center text-xs text-slate-400">
              {isRTL ? 'جاري تحميل طلبات الانضمام...' : 'Loading join requests...'}
            </div>
          ) : pendingMembers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <UserCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              {t.allRequestsReviewed}
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {pendingMembers.map((p) => (
                <div
                  key={p.id}
                  className="p-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    {p.photoURL ? (
                      <img
                        src={p.photoURL}
                        alt={p.displayName}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-amber-500/40"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-600/40 flex items-center justify-center font-bold text-amber-400 text-sm">
                        {p.displayName ? p.displayName[0].toUpperCase() : 'P'}
                      </div>
                    )}

                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{p.displayName}</span>
                        <span className="text-[10px] text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-500/30">
                          {t.awaitingReview}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">{p.email}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {t.requestedAtPrefix} {new Date(p.requestedAt).toLocaleString(isRTL ? 'ar-EG' : undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleReject(p.id, p.displayName)}
                      disabled={actionLoading === `reject_${p.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-800 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>{t.rejectBtn}</span>
                    </button>

                    <button
                      onClick={() => handleApprove(p.id, p.displayName)}
                      disabled={actionLoading === `approve_${p.id}`}
                      className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{t.approveBtn}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: WhatsApp Invite & Group Settings */}
      {activeSubTab === 'invite' && isAdmin && (
        <div className="rounded-2xl bg-[#0d151a] border border-slate-800 p-6 space-y-6 shadow-xl">
          <div>
            <h3 className="text-base font-bold text-white font-display">{t.whatsappInviteTitle}</h3>
            <p className="text-xs text-slate-400 mt-1">
              {t.whatsappInviteDesc}
            </p>
          </div>

          {/* Security Guarantee Notice */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed space-y-1">
              <span className="font-bold text-white block">
                {isRTL ? '🔒 أمان الفرقة: معرفة الكود لا تمنح الدخول التلقائي للماتشات' : '🔒 Squad Security: Code knowledge does not grant instant access'}
              </span>
              <p className="text-slate-400 text-[11px]">
                {isRTL
                  ? 'أي شخص يسجل بالكود يصل كـ (طلب معلّق Pending) في تبويب "طلبات الانضمام". لن يتمكن من رؤية الماتشات أو حجز أي مكان في التشكيلة حتى يقوم الأدمن بمراجعته وقبوله يدوياً. كما يمكنك تغيير الكود أو توليد كود جديد فوراً في أي وقت.'
                  : 'Anyone who enters the invite code is registered as a Pending Request. They cannot see matches or book spots until approved by an admin. You can also regenerate or customize the code at any time.'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-semibold">{t.activeCodeLabel}</span>
                <div className="text-xl font-mono font-black text-emerald-400 tracking-wider flex items-center gap-2 mt-0.5">
                  <span>{inviteCode}</span>
                  {inviteCode === 'PITCHPASS-V1' && (
                    <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      {isRTL ? 'الكود الافتراضي الأولي' : 'Default Seed Code'}
                    </span>
                  )}
                </div>
              </div>

              {isOwner && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setCustomCodeInput(inviteCode);
                      setIsEditingCode(!isEditingCode);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isRTL ? 'تعديل الكود يدويًا' : 'Edit Code'}</span>
                  </button>

                  <button
                    onClick={handleRegenerateCode}
                    disabled={actionLoading === 'regen_code'}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === 'regen_code' ? 'animate-spin' : ''}`} />
                    <span>{t.regenerateCodeBtn}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Custom Code Edit Form */}
            {isEditingCode && isOwner && (
              <form onSubmit={handleSaveCustomCode} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 animate-in fade-in">
                <label className="text-xs font-bold text-slate-300 block">
                  {isRTL ? 'أدخل كود دعوة سري مخصص لفرقتك:' : 'Enter custom secret invite code:'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customCodeInput}
                    onChange={(e) => setCustomCodeInput(e.target.value)}
                    placeholder="e.g. AHMED-FC-2026"
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm tracking-wider uppercase focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={actionLoading === 'save_code' || !customCodeInput.trim()}
                    className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading === 'save_code' ? '...' : (isRTL ? 'حفظ' : 'Save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingCode(false)}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  {isRTL
                    ? 'نصيحة: يمكنك كتابة أي كود سهل الحفظ لزملائك (مثل: AHMAD-FRIDAY)'
                    : 'Tip: You can use any easy-to-remember phrase for your teammates'}
                </p>
              </form>
            )}

            <div>
              <span className="text-[11px] text-slate-500 uppercase font-semibold">{t.shareableLinkLabel}</span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? t.copiedBtn : t.copyBtn}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleWhatsAppShare}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t.shareDirectWhatsapp}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
