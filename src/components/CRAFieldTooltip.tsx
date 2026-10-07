import React, { useState, useRef, useEffect } from 'react';
import { Info, AlertTriangle, ExternalLink, X, ShieldAlert } from 'lucide-react';

export interface CRATooltipContent {
  lineCode: string;
  formCode?: string;
  titleEn: string;
  titleFr: string;
  explanationEn: string;
  explanationFr: string;
  commonErrorsEn?: string;
  commonErrorsFr?: string;
  statutoryLimitEn?: string;
  statutoryLimitFr?: string;
}

interface CRAFieldTooltipProps {
  content: CRATooltipContent;
  language: 'en' | 'fr';
  position?: 'top' | 'bottom' | 'right' | 'left';
  id?: string;
}

export const CRAFieldTooltip: React.FC<CRAFieldTooltipProps> = ({
  content,
  language,
  position = 'top',
  id,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const isFrench = language === 'fr';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible]);

  const title = isFrench ? content.titleFr : content.titleEn;
  const explanation = isFrench ? content.explanationFr : content.explanationEn;
  const commonErrors = isFrench ? content.commonErrorsFr : content.commonErrorsEn;
  const limit = isFrench ? content.statutoryLimitFr : content.statutoryLimitEn;

  const tooltipId = id || `cra-info-${content.lineCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  return (
    <div className="relative inline-flex items-center ml-1.5 align-middle">
      <button
        ref={triggerRef}
        id={tooltipId}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible((prev) => !prev);
        }}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        aria-label={`${isFrench ? 'Directives et erreurs fréquentes ARC pour' : 'CRA guidelines & common errors for'} ${title}`}
        className="w-4 h-4 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-500 hover:text-[#064e3b] focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors cursor-pointer inline-flex items-center justify-center border border-slate-200 hover:border-emerald-300 shadow-2xs"
        title={isFrench ? 'Cliquez ou survolez pour voir les règles ARC' : 'Click or hover for CRA rules & tips'}
      >
        <Info className="w-2.5 h-2.5" />
      </button>

      {isVisible && (
        <div
          ref={popoverRef}
          role="tooltip"
          className={`absolute z-50 w-76 sm:w-84 p-3.5 bg-slate-900 text-slate-100 rounded-xl shadow-2xl border border-slate-700 text-xs pointer-events-auto transition-opacity animate-in fade-in-0 zoom-in-95 duration-150 ${
            position === 'top'
              ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
              : position === 'bottom'
              ? 'top-full left-1/2 -translate-x-1/2 mt-2'
              : 'bottom-full right-0 mb-2 sm:left-1/2 sm:-translate-x-1/2'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-1.5 mb-2 border-b border-slate-800 gap-2">
            <div className="flex items-center space-x-1.5">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-700/50">
                {content.lineCode}
              </span>
              {content.formCode && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300">
                  {content.formCode}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
              aria-label={isFrench ? 'Fermer' : 'Close'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Title */}
          <div className="font-bold text-white text-[12px] mb-1.5 leading-snug">
            {title}
          </div>

          {/* CRA Guidelines & Explanation */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {isFrench ? 'Directives de l’ARC :' : 'CRA Guidelines:'}
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {explanation}
            </p>
          </div>

          {/* Common Filing Errors to Avoid */}
          {commonErrors && (
            <div className="mt-2.5 p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200">
              <div className="flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-0.5">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                <span>{isFrench ? 'Erreurs fréquentes à éviter :' : 'Common Filing Errors to Avoid:'}</span>
              </div>
              <p className="text-[10.5px] leading-relaxed text-amber-100/90">
                {commonErrors}
              </p>
            </div>
          )}

          {/* Statutory Limit / Rule */}
          {limit && (
            <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-emerald-300 font-medium flex items-start space-x-1">
              <span className="font-bold text-emerald-400 shrink-0">
                {isFrench ? 'Règle légale :' : 'Statutory Rule:'}
              </span>
              <span className="leading-tight">{limit}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
