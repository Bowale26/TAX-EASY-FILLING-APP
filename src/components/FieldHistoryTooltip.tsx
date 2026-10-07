import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  History,
  Clock,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  X,
  ExternalLink,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { AuditEntry, AppTaxReturn } from '../types/tax';
import { exportAuditTrailCSV } from '../utils/exportUtils';

export interface FieldHistoryTooltipProps {
  fieldKey: string;
  fieldLabel: string;
  category?: 'personal' | 'slips' | 'deductions' | 'credits' | 'filing' | 'system';
  auditTrail?: AuditEntry[];
  taxReturn?: AppTaxReturn;
  language?: 'en' | 'fr';
  onTriggerConflictDiff?: () => void;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

export const FieldHistoryTooltip: React.FC<FieldHistoryTooltipProps> = ({
  fieldKey,
  fieldLabel,
  category = 'personal',
  auditTrail = [],
  taxReturn,
  language = 'en',
  onTriggerConflictDiff,
  className = '',
  align = 'right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFrench = language === 'fr';

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Find matching audit trail entries for this specific field
  const matchingEntries = useMemo(() => {
    if (!auditTrail || auditTrail.length === 0) return [];

    return auditTrail
      .filter((entry) => {
        // Direct match on exact field key
        if (entry.field === fieldKey) return true;

        // Prefix match (e.g. personal.province or deductions.rrspContributions)
        if (entry.field.startsWith(`${fieldKey}.`)) return true;
        if (fieldKey.startsWith(`${entry.field}.`)) return true;

        // Substring / leaf key match
        const parts = fieldKey.split('.');
        const leaf = parts[parts.length - 1];
        if (leaf && leaf.length > 2) {
          if (entry.field.endsWith(`.${leaf}`) || entry.field === leaf) return true;
        }

        // Slips index or ID match (e.g. t4Slips or otherSlips)
        if (fieldKey.startsWith('t4Slips') && entry.field.startsWith('t4Slips')) return true;
        if (fieldKey.startsWith('otherSlips') && entry.field.startsWith('otherSlips')) return true;

        return false;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [auditTrail, fieldKey]);

  const hasChanges = matchingEntries.length > 0;
  const hasConflicts = matchingEntries.some((e) => e.conflicted || e.action === 'merged');

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (taxReturn) {
      exportAuditTrailCSV(taxReturn, language);
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Tooltip trigger button */}
      <button
        id={`history-tooltip-trigger-${fieldKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`group inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer border ${
          hasConflicts
            ? 'bg-amber-100/90 hover:bg-amber-200 text-amber-900 border-amber-300 ring-1 ring-amber-400/40'
            : hasChanges
            ? 'bg-indigo-50/80 hover:bg-indigo-100 text-indigo-800 border-indigo-200 shadow-2xs'
            : 'bg-slate-100/70 hover:bg-slate-200/80 text-slate-500 border-slate-200'
        }`}
        title={
          hasChanges
            ? `${matchingEntries.length} ${isFrench ? 'modification(s) enregistrée(s)' : 'audit record(s) logged'}`
            : isFrench
            ? 'Historique d’audit de ce champ'
            : 'Field audit history'
        }
        aria-label={isFrench ? `Historique pour ${fieldLabel}` : `History for ${fieldLabel}`}
      >
        <History
          className={`w-3.5 h-3.5 transition-transform group-hover:rotate-[-20deg] ${
            hasConflicts ? 'text-amber-700 animate-pulse' : hasChanges ? 'text-indigo-600' : 'text-slate-400'
          }`}
        />
        <span className="text-[10px] uppercase font-bold tracking-tight">
          {hasConflicts
            ? isFrench
              ? 'Conflit'
              : 'Conflict'
            : hasChanges
            ? `${matchingEntries.length} ${isFrench ? 'Modif.' : 'Edit'}`
            : isFrench
            ? 'Hist.'
            : 'History'}
        </span>
      </button>

      {/* Floating Popover Tooltip */}
      {isOpen && (
        <div
          id={`history-popover-${fieldKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
          className={`absolute z-50 mt-1.5 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200/90 text-slate-800 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150 ${
            align === 'left' ? 'left-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-0'
          }`}
          style={{ minWidth: '300px' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {category}
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  {fieldKey}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 leading-tight">
                {fieldLabel}
              </h4>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close history tooltip"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Audit Count and Conflict Summary */}
          <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-100">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-700">
                {matchingEntries.length}{' '}
                {isFrench ? 'enregistrement(s) d’audit' : 'audit record(s)'}
              </span>
            </div>
            {taxReturn && (
              <button
                type="button"
                onClick={handleExport}
                className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center space-x-1 bg-white hover:bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                title={isFrench ? 'Exporter la piste d’audit en CSV' : 'Export CRA audit log to CSV'}
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                <span>{isFrench ? 'CSV' : 'Export CSV'}</span>
              </button>
            )}
          </div>

          {/* Entries Timeline List */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {!hasChanges ? (
              <div className="p-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto" />
                <p className="text-[11px] font-bold text-slate-700">
                  {isFrench ? 'Valeur initiale enregistrée' : 'Initial baseline value'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {isFrench
                    ? 'Aucune modification manuelle supplémentaire n’a été apportée à ce champ.'
                    : 'No manual edits or merge modifications have been made to this field.'}
                </p>
              </div>
            ) : (
              matchingEntries.map((entry, idx) => {
                const dateObj = new Date(entry.timestamp);
                const formattedTime = dateObj.toLocaleTimeString(isFrench ? 'fr-CA' : 'en-CA', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                const formattedDate = dateObj.toLocaleDateString(isFrench ? 'fr-CA' : 'en-CA', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                const isConflicted = entry.conflicted || entry.action === 'merged';

                return (
                  <div
                    key={entry.id || idx}
                    className={`p-2.5 rounded-xl border transition-all text-xs space-y-1.5 ${
                      isConflicted
                        ? 'bg-amber-50/80 border-amber-200 ring-1 ring-amber-300/30'
                        : 'bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    {/* Entry Top Row: Tag, date, action */}
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`font-black uppercase px-1.5 py-0.5 rounded text-[9px] border ${
                            entry.action === 'modified'
                              ? 'bg-amber-100 text-amber-900 border-amber-200'
                              : entry.action === 'merged'
                              ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                              : entry.action === 'added'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {entry.action}
                        </span>
                        {isConflicted && (
                          <span className="font-extrabold uppercase px-1.5 py-0.5 rounded text-[9px] bg-rose-100 text-rose-900 border border-rose-200 flex items-center space-x-0.5">
                            <AlertTriangle className="w-2.5 h-2.5 inline text-rose-600" />
                            <span>{isFrench ? 'Conflit' : 'Conflict'}</span>
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-slate-500 text-[10px]">
                        {formattedDate} • {formattedTime}
                      </span>
                    </div>

                    {/* Before / After comparison */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
                      <div className="p-1.5 rounded-lg bg-rose-50/70 border border-rose-200/70 space-y-0.5">
                        <span className="text-[9px] font-bold text-rose-700 uppercase block">
                          {isFrench ? 'Précédente' : 'Previous'}
                        </span>
                        <div className="font-mono text-[11px] text-rose-950 break-all line-through decoration-rose-400">
                          {entry.previousValue || '(empty)'}
                        </div>
                      </div>

                      <div className="p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-200/70 space-y-0.5">
                        <span className="text-[9px] font-bold text-emerald-800 uppercase flex items-center space-x-0.5">
                          <Check className="w-2.5 h-2.5 text-emerald-600 inline" />
                          <span>{isFrench ? 'Nouvelle' : 'Current'}</span>
                        </span>
                        <div className="font-mono text-[11px] font-bold text-emerald-950 break-all">
                          {entry.currentValue || '(empty)'}
                        </div>
                      </div>
                    </div>

                    {/* Notes / Reason */}
                    {entry.notes && (
                      <p className="text-[10px] text-slate-600 italic bg-slate-50 p-1.5 rounded-md border border-slate-100">
                        {entry.notes}
                      </p>
                    )}

                    {/* Conflict Diff CTA if applicable */}
                    {isConflicted && onTriggerConflictDiff && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            onTriggerConflictDiff();
                          }}
                          className="w-full py-1 px-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center justify-center space-x-1 shadow-2xs cursor-pointer transition-colors"
                        >
                          <ArrowRight className="w-3 h-3" />
                          <span>
                            {isFrench ? 'Résoudre avec Diff Côte-à-Côte' : 'Resolve with Side-by-Side Diff'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Notice */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>{isFrench ? 'Conforme ARC 6 ans' : 'CRA 6-Yr Compliant'}</span>
            </span>
            {taxReturn && (
              <button
                type="button"
                onClick={handleExport}
                className="text-indigo-700 hover:underline font-bold flex items-center space-x-0.5 cursor-pointer"
              >
                <span>{isFrench ? 'Télécharger journal complet' : 'Download full log'}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default FieldHistoryTooltip;
