import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  X,
  LogOut,
  ShieldCheck,
  Mail,
  UserCheck,
  Sparkles,
  Camera,
  Edit2,
  Check,
  Upload,
  Link,
  Trash2,
  Loader2,
} from 'lucide-react';
import { DESIGNATED_OWNER_EMAIL } from '../firebase/config';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Bundled portraits keep preset avatars available on every deployed origin.
const FOOTBALL_PRESETS = [
  {
    nameAr: 'الهداف',
    nameEn: 'Striker',
    url: '/assets/avatars/striker.jpg',
    glow: '#10b981',
  },
  {
    nameAr: 'الكابتن',
    nameEn: 'Captain',
    url: '/assets/avatars/captain.jpg',
    glow: '#3b82f6',
  },
  {
    nameAr: 'الحارس',
    nameEn: 'Keeper',
    url: '/assets/avatars/keeper.jpg',
    glow: '#f43f5e',
  },
  {
    nameAr: 'صانع اللعب',
    nameEn: 'Playmaker',
    url: '/assets/avatars/playmaker.jpg',
    glow: '#f59e0b',
  },
  {
    nameAr: 'الجناح',
    nameEn: 'Winger',
    url: '/assets/avatars/winger.jpg',
    glow: '#a855f7',
  },
  {
    nameAr: 'المدافع',
    nameEn: 'Defender',
    url: '/assets/avatars/defender.jpg',
    glow: '#94a3b8',
  },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, isOwner, isAdmin, isApproved, signOut, updateProfileData } = useAuth();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(profile?.displayName || user.displayName || '');
      setPhotoURL(profile ? (profile.photoURL ?? null) : (user.photoURL || null));
    }
    setIsEditing(false);
    setFeedback(null);
    setShowUrlInput(false);
  }, [user, profile, isOpen]);

  if (!isOpen || !user) return null;

  const isDesignatedOwner =
    user.email?.toLowerCase() === DESIGNATED_OWNER_EMAIL.toLowerCase();

  // Compress & resize uploaded image on canvas to avoid size limits
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFeedback({
        type: 'error',
        message: isRTL ? 'يرجى اختيار ملف صورة صالح (PNG أو JPG)' : 'Please select a valid image file',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 240;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setPhotoURL(dataUrl);
          setFeedback(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setFeedback({
        type: 'error',
        message: isRTL ? 'يرجى إدخال اسم اللاعب' : 'Please enter your player name',
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await updateProfileData(displayName.trim(), photoURL);
      setFeedback({
        type: 'success',
        message: isRTL ? 'تم حفظ التعديلات بنجاح! ⚽' : 'Profile updated successfully!',
      });
      setTimeout(() => {
        setIsEditing(false);
        setFeedback(null);
      }, 1500);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || (isRTL ? 'فشل حفظ التعديلات' : 'Failed to update profile'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0e161c] border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white font-display">
              {language === 'ar' ? 'بيانات اللاعب' : 'Player Profile'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isRTL ? 'تعديل البيانات' : 'Edit Profile'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Feedback messages */}
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
              }`}
            >
              {feedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {isEditing ? (
            /* EDIT FORM */
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  {isRTL ? 'صورة اللاعب' : 'Profile Picture'}
                </label>

                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="relative group flex-shrink-0">
                    {photoURL ? (
                      <img
                        src={photoURL}
                        alt="Preview"
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500/50 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-600/40 flex items-center justify-center text-emerald-400 font-extrabold text-2xl shadow-md">
                        {(displayName || user.email || 'P')[0].toUpperCase()}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity cursor-pointer"
                    >
                      <Camera className="w-4 h-4 mb-0.5" />
                      <span>{isRTL ? 'تغيير' : 'Change'}</span>
                    </button>
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isRTL ? 'رفع من الجهاز' : 'Upload File'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                      >
                        <Link className="w-3.5 h-3.5 text-blue-400" />
                        <span>{isRTL ? 'رابط مباشر' : 'Image URL'}</span>
                      </button>

                      {photoURL && (
                        <button
                          type="button"
                          onClick={() => setPhotoURL(null)}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-rose-400 hover:bg-rose-950/40 text-xs font-semibold transition-colors cursor-pointer"
                          title={isRTL ? 'حذف الصورة' : 'Remove photo'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {showUrlInput && (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="url"
                          placeholder={isRTL ? 'https://example.com/avatar.jpg' : 'Paste image URL...'}
                          value={customUrlInput}
                          onChange={(e) => setCustomUrlInput(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customUrlInput.trim()) {
                              setPhotoURL(customUrlInput.trim());
                              setCustomUrlInput('');
                              setShowUrlInput(false);
                            }
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
                        >
                          {isRTL ? 'تطبيق' : 'Apply'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Football legend portraits */}
                <div className="mt-4">
                  <span className="text-xs font-bold text-slate-300 block mb-2">
                    {isRTL ? 'اختر نجمك في الملعب' : 'Choose your pitch legend'}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {FOOTBALL_PRESETS.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setPhotoURL(preset.url)}
                        aria-label={`${isRTL ? preset.nameAr : preset.nameEn} ${isRTL ? 'صورة شخصية' : 'avatar'}`}
                        aria-pressed={photoURL === preset.url}
                        className={`min-w-0 p-2 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                          photoURL === preset.url
                            ? 'border-emerald-400 bg-emerald-500/15 ring-2 ring-emerald-500/40'
                            : 'border-slate-800 bg-slate-900/60 hover:border-emerald-500/50 hover:bg-slate-800'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt=""
                          width={80}
                          height={80}
                          className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-full object-cover border-2"
                          style={{ borderColor: preset.glow, boxShadow: `0 0 18px ${preset.glow}55` }}
                        />
                        <span className="text-[11px] font-bold text-slate-200 truncate max-w-full">
                          {isRTL ? preset.nameAr : preset.nameEn}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Display Name Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {isRTL ? 'اسم اللاعب (يظهر في تشكيلة الماتش)' : 'Player Name (Shown on Match Roster)'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={35}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={isRTL ? 'مثلاً: محمد صلاح أو كابتن أحمد' : 'e.g. Mo Salah or Captain Ahmed'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isRTL ? 'جاري الحفظ...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{isRTL ? 'حفظ التغييرات' : 'Save Changes'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          ) : (
            /* VIEW MODE */
            <>
              {/* Avatar and Main Info */}
              <div className="flex items-center gap-4">
                {(profile ? profile.photoURL : user.photoURL) ? (
                  <img
                    src={(profile ? profile.photoURL : user.photoURL)!}
                    alt={profile?.displayName || user.displayName || 'Avatar'}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500/40 shadow-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-600/40 flex items-center justify-center text-emerald-400 font-extrabold text-2xl shadow-lg flex-shrink-0">
                    {(profile?.displayName || user.email || 'P')[0].toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-white font-display truncate">
                      {profile?.displayName || user.displayName || (isRTL ? 'لاعب' : 'Player')}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate mt-0.5">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold tracking-wide ${
                        isOwner
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                          : isAdmin
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-500/40'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {isOwner ? t.roleOwnerFull : isAdmin ? t.roleAdminFull : t.roleMemberFull}
                    </span>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        isApproved
                          ? 'bg-emerald-950 text-emerald-400'
                          : 'bg-amber-950 text-amber-400'
                      }`}
                    >
                      {isApproved
                        ? isRTL ? 'معتمد' : 'Approved'
                        : isRTL ? 'قيد المراجعة' : 'Pending Review'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification / Owner Bootstrap Status */}
              {isDesignatedOwner && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-emerald-300">
                      {isRTL ? 'أدمن رئيسي معتمد (Master Owner)' : 'Verified System Owner'}
                    </p>
                    <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                      {isRTL
                        ? 'تم توثيق هويتك كأدمن ومالك رئيسي لتقسيمات بيتش باس. جميع صلاحيات تنظيم التقسيمات واعتماد اللاعيبة مفعلة.'
                        : 'Your Google identity is authenticated as the primary group creator. Full RBAC permissions and match administrative powers are unlocked.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Account Details Box */}
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span>{isRTL ? 'الفرقة' : 'Group'}</span>
                  <span className="font-semibold text-slate-200">PitchPass FC</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>{isRTL ? 'طريقة الدخول' : 'Auth Provider'}</span>
                  <span className="font-semibold text-slate-200">Google OAuth (مستمر)</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>{isRTL ? 'حالة الحساب' : 'Status'}</span>
                  <span className="font-semibold text-emerald-400">
                    {isRTL ? 'جلسة نشطة ومؤكدة' : 'Session Verified'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
          <button
            onClick={() => {
              signOut();
              onClose();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-900/40 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isRTL ? 'تسجيل الخروج' : 'Sign Out'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {t.modalClose}
          </button>
        </div>
      </div>
    </div>
  );
};
