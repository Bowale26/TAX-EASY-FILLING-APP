import React, { useEffect, useState } from 'react';
import {
  Lightbulb,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { fetchTaxTips, TaxTip } from '../services/taxTipsService';

interface TaxTipsSectionProps {
  category: 'income' | 'deductions';
  taxYear: number;
  language: 'en' | 'fr';
  className?: string;
}

export const TaxTipsSection: React.FC<TaxTipsSectionProps> = ({
  category,
  taxYear,
  language,
  className = '',
}) => {
  const isFrench = language === 'fr';
  const [tips, setTips] = useState<TaxTip[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedTipId, setSelectedTipId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchTaxTips(taxYear, category)
      .then((data) => {
        if (isMounted) {
          setTips(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load tax tips:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [category, taxYear]);

  const categoryLabel =
    category === 'income'
      ? isFrench
        ? 'Revenus & Feuillets'
        : 'Income & Slips'
      : isFrench
      ? 'Déductions & Crédits'
      : 'Deductions & Credits';

  return (
    <div
      id={`tax-tips-section-${category}`}
      className={`bg-linear-to-br from-emerald-50/70 via-white to-blue-50/60 border border-emerald-200/80 rounded-2xl p-5 shadow-xs transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-emerald-200/60">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#064e3b] text-emerald-300 flex items-center justify-center shadow-xs">
            <Lightbulb className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">
                {isFrench
                  ? `Conseils Fiscaux de l’ARC — ${taxYear}`
                  : `CRA Tax Tips — ${taxYear} Edition`}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                {categoryLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isFrench
                ? `Stratégies et règles officielles spécifiques à l’année d’imposition ${taxYear}`
                : `Verified tax optimization rules & CRA guidelines for the ${taxYear} tax year`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title={isExpanded ? 'Collapse tips' : 'Expand tips'}
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Body Content */}
      {isExpanded && (
        <div className="pt-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-6 space-x-2 text-xs text-slate-500 font-mono">
              <div className="w-4 h-4 rounded-full border-2 border-[#064e3b] border-t-transparent animate-spin" />
              <span>
                {isFrench
                  ? 'Chargement des conseils fiscaux contextuels...'
                  : 'Retrieving contextual tax tips...'}
              </span>
            </div>
          ) : tips.length === 0 ? (
            <div className="p-4 bg-white/70 rounded-xl text-center text-xs text-slate-500">
              {isFrench
                ? 'Aucun conseil spécifique disponible pour cette sélection.'
                : 'No specific tips found for this tax year category.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tips.map((tip) => {
                const isSelected = selectedTipId === tip.id;
                const isHigh = tip.impactLevel === 'high';

                return (
                  <div
                    key={tip.id}
                    onClick={() =>
                      setSelectedTipId(isSelected ? null : tip.id)
                    }
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-white border-[#064e3b] shadow-sm ring-1 ring-[#064e3b]/20'
                        : 'bg-white/80 hover:bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isHigh
                            ? 'bg-rose-100 text-rose-800 font-extrabold'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isFrench ? tip.tagFr : tip.tag}
                      </span>

                      {tip.craLine && (
                        <span className="text-[10px] font-mono font-semibold text-[#0b1f3a] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                          {tip.craLine}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug">
                      {isFrench ? tip.titleFr : tip.title}
                    </h4>

                    <p className="text-slate-600 mt-1 leading-relaxed text-[11px] sm:text-xs">
                      {isFrench ? tip.descriptionFr : tip.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Context footnote */}
          <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 font-medium">
            <span className="flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-[#064e3b]" />
              <span>
                {isFrench
                  ? 'Mis à jour selon les barèmes officiels de l’ARC'
                  : 'Derived from official CRA income tax guidance'}
              </span>
            </span>
            <span className="font-mono text-slate-400">
              Tax Year: {taxYear}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
