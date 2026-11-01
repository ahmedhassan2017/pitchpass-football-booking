import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export const OwnerBootstrapBanner: React.FC = () => {
  const { isOwner, user } = useAuth();
  const { t, language } = useLanguage();

  if (!isOwner || !user) return null;

  return (
    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-[#0d1e22]/80 to-[#0e161c] border border-emerald-500/40 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {t.ownerActiveBannerTitle}
              </h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {language === 'ar' ? 'مؤكد ومعتمد' : 'Verified'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {language === 'ar' ? (
                <>
                  أهلاً يا كابتن أحمد (<span className="text-emerald-300 font-semibold">{user.email}</span>)! حسابك أدمن تقسيمات بيتش باس مفعل بنجاح.
                </>
              ) : (
                t.ownerActiveBannerDesc
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-[11px] text-emerald-400 font-semibold bg-slate-900/80 px-3 py-1.5 rounded-xl border border-emerald-950">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? 'جاهز للماتش الجاي' : 'Ready'}</span>
        </div>
      </div>
    </div>
  );
};
