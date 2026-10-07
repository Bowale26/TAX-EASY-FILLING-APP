import React, { useState, useMemo } from 'react';
import {
  History,
  ArrowRight,
  Filter,
  Search,
  CheckCircle2,
  Calendar,
  FileText,
  User,
  DollarSign,
  TrendingDown,
  Layers,
  Settings,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuditEntry, AppTaxReturn } from '../types/tax';
import { getInitialAuditHistory } from '../utils/auditLogger';

interface VisualAuditTimelineProps {
  taxReturn: AppTaxReturn;
  language: 'en' | 'fr';
  onOpenAuditDashboard?: () => void;
}

export const VisualAuditTimeline: React.FC<VisualAuditTimelineProps> = ({
  taxReturn,
  language,
  onOpenAuditDashboard,
}) => {
  const isFrench = language === 'fr';
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'personal' | 'slips' | 'deductions' | 'credits' | 'filing' | 'system'
  >('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [visibleLimit, setVisibleLimit] = useState<number>(6);

  // Retrieve actual audit trail or initial synthetic trail
  const entries: AuditEntry[] = useMemo(() => {
    if (taxReturn.auditTrail && taxReturn.auditTrail.length > 0) {
      return taxReturn.auditTrail;
    }
    return getInitialAuditHistory(taxReturn, language);
  }, [taxReturn.auditTrail, taxReturn, language]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (categoryFilter !== 'all' && entry.category !== categoryFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const label = (isFrench ? entry.fieldLabelFr : entry.fieldLabelEn).toLowerCase();
        const prev = String(entry.previousValue || '').toLowerCase();
        const curr = String(entry.currentValue || '').toLowerCase();
        const field = (entry.field || '').toLowerCase();
        const notes = (entry.notes || '').toLowerCase();
        return (
          label.includes(q) ||
          prev.includes(q) ||
          curr.includes(q) ||
          field.includes(q) ||
          notes.includes(q)
        );
      }
      return true;
    });
  }, [entries, categoryFilter, searchTerm, isFrench]);

  const displayedEntries = useMemo(() => {
    return filteredEntries.slice(0, visibleLimit);
  }, [filteredEntries, visibleLimit]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'personal':
        return <User className="w-3.5 h-3.5 text-blue-600" />;
      case 'slips':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-600" />;
      case 'deductions':
        return <TrendingDown className="w-3.5 h-3.5 text-purple-600" />;
      case 'credits':
        return <Sparkles className="w-3.5 h-3.5 text-amber-600" />;
      case 'filing':
        return <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <Settings className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'added':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            {isFrench ? 'Ajouté' : 'Added'}
          </span>
        );
      case 'modified':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            {isFrench ? 'Modifié' : 'Modified'}
          </span>
        );
      case 'deleted':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            {isFrench ? 'Supprimé' : 'Deleted'}
          </span>
        );
      case 'imported':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            {isFrench ? 'Importé OCR' : 'Imported OCR'}
          </span>
        );
      case 'merged':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            {isFrench ? 'Fusionné' : 'Merged Sync'}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            {action}
          </span>
        );
    }
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return {
      date: d.toLocaleDateString(isFrench ? 'fr-CA' : 'en-CA', {
        month: 'short',
        day: 'numeric',
      }),
      time: d.toLocaleTimeString(isFrench ? 'fr-CA' : 'en-CA', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
  };

  return (
    <div
      id="visual-audit-timeline-card"
      className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5"
    >
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-2xs">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                {isFrench ? 'Chronologie de l’audit visuel' : 'Visual Audit Trail Timeline'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                {entries.length} {isFrench ? 'modifications' : 'events'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isFrench
                ? 'Historique complet des valeurs avec indicateurs précis « Avant » et « Après »'
                : 'Complete chronological history of tax return values with explicit "Before" and "After" indicators'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {onOpenAuditDashboard && (
            <button
              type="button"
              id="open-audit-dashboard-modal-btn"
              onClick={onOpenAuditDashboard}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#064e3b] hover:bg-[#054030] shadow-2xs transition-colors cursor-pointer"
              title={isFrench ? 'Ouvrir le tableau de bord d’audit complet avec filtres avancés' : 'Open full chronological filterable audit dashboard'}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>{isFrench ? 'Tableau d’audit complet' : 'Full Audit Dashboard'}</span>
            </button>
          )}

          <button
            type="button"
            id="toggle-audit-timeline-expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <span>{isExpanded ? (isFrench ? 'Masquer' : 'Collapse') : (isFrench ? 'Afficher' : 'Expand')}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Controls: Category Filter + Search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { key: 'all', labelEn: 'All Changes', labelFr: 'Toutes' },
                  { key: 'slips', labelEn: 'Slips (T4/T5)', labelFr: 'Feuillets' },
                  { key: 'deductions', labelEn: 'Deductions', labelFr: 'Déductions' },
                  { key: 'personal', labelEn: 'Personal', labelFr: 'Personnel' },
                  { key: 'credits', labelEn: 'Credits', labelFr: 'Crédits' },
                  { key: 'system', labelEn: 'System/Sync', labelFr: 'Système' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.key}
                  id={`audit-cat-${cat.key}`}
                  type="button"
                  onClick={() => setCategoryFilter(cat.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    categoryFilter === cat.key
                      ? 'bg-[#064e3b] text-white shadow-2xs font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isFrench ? cat.labelFr : cat.labelEn}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative min-w-[200px] md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="audit-timeline-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isFrench ? 'Filtrer les champs ou valeurs...' : 'Search field or value...'}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#064e3b] focus:border-transparent bg-white"
              />
            </div>
          </div>

          {/* Timeline View */}
          {displayedEntries.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
              <p className="font-semibold">
                {isFrench ? 'Aucune entrée ne correspond aux filtres' : 'No audit trail entries found'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {isFrench ? 'Essayez de réinitialiser vos termes de recherche.' : 'Try clearing your search term or selecting another category.'}
              </p>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 space-y-4 pt-2">
              {/* Vertical connecting spine */}
              <div className="absolute left-2.5 sm:left-3.5 top-3 bottom-3 w-0.5 bg-slate-200 -translate-x-1/2" />

              {displayedEntries.map((entry, idx) => {
                const ts = formatTimestamp(entry.timestamp);
                const fieldLabel = isFrench ? entry.fieldLabelFr : entry.fieldLabelEn;

                return (
                  <motion.div
                    key={entry.id || `audit-${idx}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                    id={`timeline-entry-${entry.id || idx}`}
                    className="relative bg-slate-50 hover:bg-slate-100/80 rounded-xl p-3.5 sm:p-4 border border-slate-200 transition-colors shadow-2xs"
                  >
                    {/* Node on vertical line */}
                    <div className="absolute -left-[23px] sm:-left-[31px] top-4 w-5 h-5 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center shadow-2xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {/* Top bar: Field name, category, action badge, timestamp */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <div className="p-1 rounded-md bg-white border border-slate-200">
                            {getCategoryIcon(entry.category)}
                          </div>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {fieldLabel}
                          </span>
                          {getActionBadge(entry.action)}
                        </div>

                        <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{ts.date}</span>
                          <span>•</span>
                          <span>{ts.time}</span>
                        </div>
                      </div>

                      {/* CLEAR BEFORE AND AFTER VALUE INDICATORS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {/* BEFORE INDICATOR */}
                        <div
                          id={`before-indicator-${entry.id || idx}`}
                          className="bg-white rounded-lg p-2.5 border border-rose-200 shadow-2xs flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              {isFrench ? 'Valeur antérieure (Avant)' : 'Before (Previous Value)'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {entry.previousValue ? 'Recorded' : 'Empty'}
                            </span>
                          </div>
                          <div className="font-semibold text-slate-700 text-xs sm:text-sm truncate">
                            {entry.previousValue && entry.previousValue.trim() !== '' ? (
                              <span className="text-slate-800 line-through decoration-rose-400 font-mono">
                                {entry.previousValue}
                              </span>
                            ) : (
                              <span className="italic text-slate-400 text-xs">
                                {isFrench ? '[Aucune valeur / Initial]' : '[None / Not set]'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* AFTER INDICATOR */}
                        <div
                          id={`after-indicator-${entry.id || idx}`}
                          className="bg-white rounded-lg p-2.5 border border-emerald-200 shadow-2xs flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{isFrench ? 'Nouvelle valeur (Après)' : 'After (Updated Value)'}</span>
                            </span>
                            <span className="text-[10px] text-emerald-700 font-mono font-bold">
                              {isFrench ? 'Actuel' : 'Active'}
                            </span>
                          </div>
                          <div className="font-bold text-emerald-950 text-xs sm:text-sm truncate font-mono">
                            {entry.currentValue && entry.currentValue.trim() !== '' ? (
                              <span>{entry.currentValue}</span>
                            ) : (
                              <span className="italic text-slate-400 text-xs">
                                {isFrench ? '[Supprimé]' : '[Removed]'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Notes / Reason */}
                      {entry.notes && (
                        <div className="text-[11px] text-slate-500 bg-white/70 px-2.5 py-1.5 rounded-lg border border-slate-200/80 flex items-center space-x-1.5">
                          <span className="font-semibold text-slate-700">
                            {isFrench ? 'Contexte :' : 'Context:'}
                          </span>
                          <span className="truncate">{entry.notes}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination / View More */}
          {filteredEntries.length > displayedEntries.length && (
            <div className="text-center pt-2">
              <button
                type="button"
                id="audit-timeline-load-more-btn"
                onClick={() => setVisibleLimit((prev) => prev + 6)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                {isFrench
                  ? `Afficher plus d'entrées (${filteredEntries.length - displayedEntries.length} restantes)`
                  : `Show more events (${filteredEntries.length - displayedEntries.length} remaining)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
