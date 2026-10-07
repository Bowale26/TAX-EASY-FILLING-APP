import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  History,
  Search,
  Filter,
  User,
  ShieldCheck,
  Building,
  Camera,
  Bot,
  Calendar,
  Clock,
  ArrowRight,
  Download,
  Printer,
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingDown,
  Sparkles,
  Layers,
  Settings,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { AppTaxReturn, AuditEntry } from '../types/tax';
import { getInitialAuditHistory, createAccountantAuditEntry } from '../utils/auditLogger';

interface AuditTrailDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxReturn: AppTaxReturn;
  onUpdateTaxReturn?: (updated: Partial<AppTaxReturn>) => void;
  language: 'en' | 'fr';
}

export const AuditTrailDashboardModal: React.FC<AuditTrailDashboardModalProps> = ({
  isOpen,
  onClose,
  taxReturn,
  onUpdateTaxReturn,
  language,
}) => {
  const isFrench = language === 'fr';

  // State filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'personal' | 'slips' | 'deductions' | 'credits' | 'filing' | 'system'
  >('all');
  const [authorFilter, setAuthorFilter] = useState<
    'all' | 'taxpayer' | 'accountant' | 'cra_system' | 'ocr_scanner'
  >('all');
  const [actionFilter, setActionFilter] = useState<
    'all' | 'added' | 'modified' | 'deleted' | 'imported' | 'merged'
  >('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // New CPA adjustment form state
  const [showAddAdjustment, setShowAddAdjustment] = useState<boolean>(false);
  const [newAdjField, setNewAdjField] = useState<string>('t4Slips[0].box14_employmentIncome');
  const [newAdjLabel, setNewAdjLabel] = useState<string>('T4 Employment Income (Box 14)');
  const [newAdjCategory, setNewAdjCategory] = useState<AuditEntry['category']>('slips');
  const [newAdjPrevVal, setNewAdjPrevVal] = useState<string>('$78,500.00');
  const [newAdjCurrVal, setNewAdjCurrVal] = useState<string>('$78,500.00');
  const [newAdjAuthor, setNewAdjAuthor] = useState<string>('Sarah Jenkins, CPA (Senior Tax Auditor)');
  const [newAdjNotes, setNewAdjNotes] = useState<string>('CPA reconciliation of employer payroll summary and T4 slips.');
  const [newAdjCompliance, setNewAdjCompliance] = useState<string>('CRA Section 230(4) source record reconciliation');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Retrieve all audit trail records
  const allEntries: AuditEntry[] = useMemo(() => {
    if (taxReturn.auditTrail && taxReturn.auditTrail.length > 0) {
      return taxReturn.auditTrail;
    }
    return getInitialAuditHistory(taxReturn, language);
  }, [taxReturn.auditTrail, taxReturn, language]);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    return allEntries
      .filter((entry) => {
        // Category filter
        if (categoryFilter !== 'all' && entry.category !== categoryFilter) {
          return false;
        }

        // Author/Role filter
        if (authorFilter !== 'all') {
          const role = entry.authorRole || 'taxpayer';
          if (role !== authorFilter) return false;
        }

        // Action filter
        if (actionFilter !== 'all' && entry.action !== actionFilter) {
          return false;
        }

        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const labelEn = (entry.fieldLabelEn || '').toLowerCase();
          const labelFr = (entry.fieldLabelFr || '').toLowerCase();
          const author = (entry.author || '').toLowerCase();
          const prev = String(entry.previousValue || '').toLowerCase();
          const curr = String(entry.currentValue || '').toLowerCase();
          const notes = (entry.notes || '').toLowerCase();
          const comp = (entry.complianceReason || '').toLowerCase();
          const field = (entry.field || '').toLowerCase();

          return (
            labelEn.includes(q) ||
            labelFr.includes(q) ||
            author.includes(q) ||
            prev.includes(q) ||
            curr.includes(q) ||
            notes.includes(q) ||
            comp.includes(q) ||
            field.includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        return sortOrder === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
      });
  }, [allEntries, categoryFilter, authorFilter, actionFilter, searchTerm, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const total = allEntries.length;
    const accountantModifications = allEntries.filter((e) => e.authorRole === 'accountant').length;
    const ocrImports = allEntries.filter((e) => e.authorRole === 'ocr_scanner' || e.authorRole === 'cra_system').length;
    const taxpayerChanges = allEntries.filter((e) => !e.authorRole || e.authorRole === 'taxpayer').length;
    return { total, accountantModifications, ocrImports, taxpayerChanges };
  }, [allEntries]);

  // Helper for Author Avatar & Role Badge
  const renderAuthorBadge = (entry: AuditEntry) => {
    const role = entry.authorRole || 'taxpayer';
    const authorName = entry.author || (isFrench ? 'Alex Morgan (Contribuable)' : 'Alex Morgan (Taxpayer)');

    switch (role) {
      case 'accountant':
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="truncate max-w-[200px]">{authorName}</span>
            <span className="text-[10px] uppercase font-mono px-1 rounded bg-emerald-200 text-emerald-800">
              CPA
            </span>
          </div>
        );
      case 'cra_system':
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-300 text-xs font-semibold">
            <Building className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span className="truncate max-w-[200px]">{authorName}</span>
            <span className="text-[10px] uppercase font-mono px-1 rounded bg-blue-200 text-blue-800">
              CRA AFR
            </span>
          </div>
        );
      case 'ocr_scanner':
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-teal-100 text-teal-900 border border-teal-300 text-xs font-semibold">
            <Camera className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span className="truncate max-w-[200px]">{authorName}</span>
            <span className="text-[10px] uppercase font-mono px-1 rounded bg-teal-200 text-teal-800">
              OCR
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold">
            <User className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="truncate max-w-[200px]">{authorName}</span>
            <span className="text-[10px] uppercase font-mono px-1 rounded bg-slate-200 text-slate-700">
              USER
            </span>
          </div>
        );
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'added':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
            {isFrench ? 'Ajouté' : 'Added'}
          </span>
        );
      case 'modified':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase">
            {isFrench ? 'Modifié' : 'Modified'}
          </span>
        );
      case 'deleted':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 uppercase">
            {isFrench ? 'Supprimé' : 'Deleted'}
          </span>
        );
      case 'imported':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 uppercase">
            {isFrench ? 'Importé' : 'Imported'}
          </span>
        );
      case 'merged':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 uppercase">
            {isFrench ? 'Fusionné' : 'Merged'}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300 uppercase">
            {action}
          </span>
        );
    }
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    const dateStr = d.toLocaleDateString(isFrench ? 'fr-CA' : 'en-CA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = d.toLocaleTimeString(isFrench ? 'fr-CA' : 'en-CA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const diffMins = Math.round((Date.now() - ts) / 60000);
    let relative = `${diffMins} min ago`;
    if (diffMins < 1) relative = isFrench ? 'À l’instant' : 'Just now';
    else if (diffMins >= 60 && diffMins < 1440) {
      relative = `${Math.round(diffMins / 60)}h ago`;
    } else if (diffMins >= 1440) {
      relative = `${Math.round(diffMins / 1440)}d ago`;
    }

    return { dateStr, timeStr, relative };
  };

  // Submit accountant adjustment
  const handleAddAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry = createAccountantAuditEntry({
      category: newAdjCategory,
      field: newAdjField,
      fieldLabelEn: newAdjLabel,
      fieldLabelFr: newAdjLabel,
      previousValue: newAdjPrevVal,
      currentValue: newAdjCurrVal,
      authorName: newAdjAuthor,
      notes: newAdjNotes,
      complianceReason: newAdjCompliance,
    });

    const updatedTrail = [entry, ...(taxReturn.auditTrail || allEntries)];
    onUpdateTaxReturn?.({ auditTrail: updatedTrail });
    setShowAddAdjustment(false);
    setExportNotice(
      isFrench
        ? 'Ajustement comptable enregistré avec succès dans le grand livre d’audit.'
        : 'Accountant adjustment recorded successfully in the audit ledger.'
    );
    setTimeout(() => setExportNotice(null), 4000);
  };

  // Export as CSV
  const handleExportCsv = () => {
    const headers = [
      'Timestamp (ISO)',
      'Date',
      'Time',
      'Category',
      'Field',
      'Field Label',
      'Action',
      'Author',
      'Author Role',
      'Previous Value',
      'Current Value',
      'Compliance Reason',
      'Notes',
    ];

    const rows = filteredEntries.map((e) => {
      const d = new Date(e.timestamp);
      return [
        d.toISOString(),
        d.toLocaleDateString('en-CA'),
        d.toLocaleTimeString('en-CA'),
        e.category,
        `"${e.field.replace(/"/g, '""')}"`,
        `"${(isFrench ? e.fieldLabelFr : e.fieldLabelEn).replace(/"/g, '""')}"`,
        e.action,
        `"${(e.author || 'Taxpayer').replace(/"/g, '""')}"`,
        e.authorRole || 'taxpayer',
        `"${String(e.previousValue).replace(/"/g, '""')}"`,
        `"${String(e.currentValue).replace(/"/g, '""')}"`,
        `"${(e.complianceReason || '').replace(/"/g, '""')}"`,
        `"${(e.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CRA-T1-Audit-Trail-Ledger-${taxReturn.taxYear || 2025}-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(
      isFrench
        ? 'Grand livre d’audit exporté au format CSV pour les dossiers CPA.'
        : 'Audit trail exported as CSV for CPA working papers.'
    );
    setTimeout(() => setExportNotice(null), 4000);
  };

  // Export as JSON
  const handleExportJson = () => {
    const data = {
      taxYear: taxReturn.taxYear || 2025,
      taxpayer: `${taxReturn.personal?.firstName || 'Alex'} ${taxReturn.personal?.lastName || 'Morgan'}`,
      exportedAt: new Date().toISOString(),
      complianceStandard: 'Income Tax Act Section 230(4)',
      totalEntries: filteredEntries.length,
      auditTrail: filteredEntries,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CRA-T1-Audit-Trail-${taxReturn.taxYear || 2025}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print audit ledger
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-xs overflow-y-auto"
        id="audit-trail-dashboard-backdrop"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden relative my-4"
          id="audit-trail-dashboard-modal-container"
        >
          {/* Header Bar */}
          <div className="bg-linear-to-r from-[#064e3b] via-[#0b1f3a] to-[#043327] px-6 py-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300 border border-white/20 shadow-inner">
                <History className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                    CRA SEC 230(4) COMPLIANCE
                  </span>
                  <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                    {isFrench ? 'GRAND LIVRE D’AUDIT CPA' : 'CPA AUDIT TRAIL LEDGER'}
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-white mt-0.5 flex items-center space-x-2">
                  <span>
                    {isFrench ? 'Tableau de Bord du Journal d’Audit' : 'Audit Trail Dashboard'}
                  </span>
                  <span className="text-xs font-normal text-emerald-200 font-mono">
                    ({taxReturn.taxYear || 2025} T1 General)
                  </span>
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                title={isFrench ? 'Fermer' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Subheader & Stats Metric Row */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">
                {isFrench ? 'Total des Modifications' : 'Total Changes'}
              </div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5 font-mono">
                {stats.total}
              </div>
            </div>

            <div className="bg-white border border-emerald-200 rounded-xl p-2.5 shadow-2xs">
              <div className="text-[11px] font-semibold text-emerald-700 uppercase flex items-center justify-between">
                <span>{isFrench ? 'Revues & Ajustements CPA' : 'CPA Review Entries'}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-xl font-extrabold text-emerald-800 mt-0.5 font-mono">
                {stats.accountantModifications}
              </div>
            </div>

            <div className="bg-white border border-teal-200 rounded-xl p-2.5 shadow-2xs">
              <div className="text-[11px] font-semibold text-teal-700 uppercase flex items-center justify-between">
                <span>{isFrench ? 'Imports OCR & ARC' : 'OCR / AFR Imports'}</span>
                <Camera className="w-3.5 h-3.5 text-teal-600" />
              </div>
              <div className="text-xl font-extrabold text-teal-800 mt-0.5 font-mono">
                {stats.ocrImports}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center justify-between">
                <span>{isFrench ? 'Entrées Contribuable' : 'Taxpayer Entries'}</span>
                <User className="w-3.5 h-3.5 text-slate-600" />
              </div>
              <div className="text-xl font-extrabold text-[#0b1f3a] mt-0.5 font-mono">
                {stats.taxpayerChanges}
              </div>
            </div>
          </div>

          {/* Filter & Search Controls Bar */}
          <div className="p-4 bg-white border-b border-slate-200 space-y-3 shrink-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    isFrench
                      ? 'Rechercher par champ, auteur (qui), valeur (quoi) ou note de conformité...'
                      : 'Search by field, author (who), value (what), or compliance note...'
                  }
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 bg-slate-50 focus:bg-white transition-all"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Action Buttons: Add Adjustment, Sort, Export */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  id="btn-sort-chronological"
                  onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
                  title={isFrench ? 'Inverser l’ordre chronologique' : 'Toggle chronological sorting order'}
                >
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{sortOrder === 'newest' ? (isFrench ? 'Plus récents' : 'Newest First') : (isFrench ? 'Plus anciens' : 'Oldest First')}</span>
                </button>

                <button
                  type="button"
                  id="btn-toggle-add-cpa-adjustment"
                  onClick={() => setShowAddAdjustment(!showAddAdjustment)}
                  className="px-3 py-2 rounded-xl bg-[#064e3b] hover:bg-[#054030] text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isFrench ? 'Ajouter Note CPA' : 'Log CPA Adjustment'}</span>
                </button>
              </div>
            </div>

            {/* Filter Pills Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex items-center space-x-1 text-xs text-slate-500 font-semibold mr-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>{isFrench ? 'Filtres :' : 'Filters:'}</span>
              </div>

              {/* Actor / Who Changed What Filter */}
              <select
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white hover:border-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">{isFrench ? 'Tous les Auteurs (Qui)' : 'All Actors (Who Changed)'}</option>
                <option value="taxpayer">{isFrench ? 'Contribuable (Alex Morgan)' : 'Taxpayer (Alex Morgan)'}</option>
                <option value="accountant">{isFrench ? 'Comptable / Auditeur CPA' : 'CPA / Accountant'}</option>
                <option value="cra_system">{isFrench ? 'Passerelle ARC (AFR)' : 'CRA AFR Gateway'}</option>
                <option value="ocr_scanner">{isFrench ? 'Numériseur Vision IA (OCR)' : 'Computer Vision OCR'}</option>
              </select>

              {/* Section / Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white hover:border-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">{isFrench ? 'Toutes les Catégories' : 'All Sections'}</option>
                <option value="personal">{isFrench ? 'Renseignements personnels' : 'Personal Info'}</option>
                <option value="slips">{isFrench ? 'Feuillets de revenu (T4/T5)' : 'Income Slips (T4/T5)'}</option>
                <option value="deductions">{isFrench ? 'Déductions (REER)' : 'Deductions (RRSP)'}</option>
                <option value="credits">{isFrench ? 'Crédits d’impôt' : 'Tax Credits'}</option>
                <option value="filing">{isFrench ? 'Transmission & Statut' : 'Filing & NETFILE'}</option>
                <option value="system">{isFrench ? 'Système & Initialisation' : 'System & Setup'}</option>
              </select>

              {/* Action Filter */}
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white hover:border-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">{isFrench ? 'Toutes les Actions' : 'All Actions'}</option>
                <option value="modified">{isFrench ? 'Modifié' : 'Modified'}</option>
                <option value="added">{isFrench ? 'Ajouté' : 'Added'}</option>
                <option value="deleted">{isFrench ? 'Supprimé' : 'Deleted'}</option>
                <option value="imported">{isFrench ? 'Importé' : 'Imported'}</option>
                <option value="merged">{isFrench ? 'Fusionné' : 'Merged'}</option>
              </select>

              {(categoryFilter !== 'all' || authorFilter !== 'all' || actionFilter !== 'all' || searchTerm) && (
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('all');
                    setAuthorFilter('all');
                    setActionFilter('all');
                    setSearchTerm('');
                  }}
                  className="px-2 py-1 text-[11px] text-rose-600 hover:text-rose-800 font-semibold hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isFrench ? 'Réinitialiser filtres' : 'Reset filters'}</span>
                </button>
              )}

              <span className="ml-auto text-xs text-slate-500 font-mono">
                {isFrench
                  ? `${filteredEntries.length} sur ${allEntries.length} entrées affichées`
                  : `${filteredEntries.length} of ${allEntries.length} changes shown`}
              </span>
            </div>
          </div>

          {/* Feedback banner */}
          {exportNotice && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportNotice}</span>
            </div>
          )}

          {/* Form to log formal CPA adjustment */}
          {showAddAdjustment && (
            <div className="bg-emerald-50/50 border-b border-emerald-200 p-5 shrink-0">
              <form onSubmit={handleAddAdjustmentSubmit} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-900 uppercase">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>{isFrench ? 'Enregistrer une entrée d’audit comptable officielle' : 'Record Official Accountant Audit Log Entry'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddAdjustment(false)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    {isFrench ? 'Annuler' : 'Cancel'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isFrench ? 'Section fiscale' : 'Tax Section / Category'}
                    </label>
                    <select
                      value={newAdjCategory}
                      onChange={(e) => setNewAdjCategory(e.target.value as any)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="slips">{isFrench ? 'Feuillets de revenus (T4/T5)' : 'Income Slips (T4/T5)'}</option>
                      <option value="deductions">{isFrench ? 'Déductions (REER, frais)' : 'Deductions (RRSP, dues)'}</option>
                      <option value="credits">{isFrench ? 'Crédits d’impôt' : 'Tax Credits'}</option>
                      <option value="personal">{isFrench ? 'Infos personnelles' : 'Personal Info'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isFrench ? 'Nom du champ ou ligne ARC' : 'Field / CRA Line Target'}
                    </label>
                    <input
                      type="text"
                      value={newAdjLabel}
                      onChange={(e) => setNewAdjLabel(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                      placeholder="e.g., T4 Employment Income (Box 14)"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isFrench ? 'Comptable / Auditeur (Qui)' : 'Accountant / Auditor (Who)'}
                    </label>
                    <input
                      type="text"
                      value={newAdjAuthor}
                      onChange={(e) => setNewAdjAuthor(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                      placeholder="e.g., Sarah Jenkins, CPA"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isFrench ? 'Valeur antérieure (Avant)' : 'Previous Value (Before)'}
                    </label>
                    <input
                      type="text"
                      value={newAdjPrevVal}
                      onChange={(e) => setNewAdjPrevVal(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isFrench ? 'Valeur ajustée (Après)' : 'Adjusted Value (After)'}
                    </label>
                    <input
                      type="text"
                      value={newAdjCurrVal}
                      onChange={(e) => setNewAdjCurrVal(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white font-mono text-emerald-800 font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isFrench ? 'Motif de conformité (Loi de l’impôt)' : 'Compliance Justification (Income Tax Act)'}
                    </label>
                    <input
                      type="text"
                      value={newAdjCompliance}
                      onChange={(e) => setNewAdjCompliance(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isFrench ? 'Notes de vérification' : 'Working Paper Notes'}
                    </label>
                    <input
                      type="text"
                      value={newAdjNotes}
                      onChange={(e) => setNewAdjNotes(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {isFrench ? 'Enregistrer dans le grand livre' : 'Save Entry to Audit Ledger'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Chronological List of Audit Changes */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3.5 bg-slate-100/60 custom-scrollbar">
            {filteredEntries.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-700">
                  {isFrench ? 'Aucune modification correspondante' : 'No matching audit records found'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {isFrench
                    ? 'Aucun changement ne correspond à vos critères de recherche ou de filtre. Essayez de réinitialiser les filtres pour afficher l’historique complet.'
                    : 'No changes match your search or filter criteria. Try resetting the filters to view the complete tax return history.'}
                </p>
              </div>
            ) : (
              filteredEntries.map((entry, idx) => {
                const { dateStr, timeStr, relative } = formatTimestamp(entry.timestamp);

                return (
                  <div
                    key={entry.id || `entry-${idx}`}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-emerald-300 transition-all space-y-2.5"
                  >
                    {/* Top Row: Who & When */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        {renderAuthorBadge(entry)}
                        {getActionBadge(entry.action)}
                        <span className="text-[11px] font-mono text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-100">
                          {entry.category}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono shrink-0">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700">{dateStr}</span>
                        <span>•</span>
                        <span>{timeStr}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600">
                          {relative}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: What changed (Field and Before/After Diff) */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-5">
                        <div className="text-xs font-bold text-slate-900">
                          {isFrench ? entry.fieldLabelFr : entry.fieldLabelEn}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                          {entry.field}
                        </div>
                      </div>

                      {/* Before / After Diff comparison */}
                      <div className="md:col-span-7 bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                            {isFrench ? 'Avant :' : 'Before:'}
                          </span>
                          <span className="font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 line-through truncate inline-block max-w-full">
                            {String(entry.previousValue || '(none)')}
                          </span>
                        </div>

                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

                        <div className="flex-1 min-w-0 text-right sm:text-left">
                          <span className="text-[10px] uppercase font-bold text-emerald-600 block mb-0.5">
                            {isFrench ? 'Après :' : 'After:'}
                          </span>
                          <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 font-bold truncate inline-block max-w-full">
                            {String(entry.currentValue || '(none)')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Compliance Context and Auditor Notes */}
                    {(entry.complianceReason || entry.notes) && (
                      <div className="bg-slate-50/70 rounded-xl p-2.5 text-xs border border-slate-200/60 space-y-1">
                        {entry.complianceReason && (
                          <div className="flex items-start space-x-1.5 text-slate-700">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="text-[11px] leading-tight">
                              <strong>{isFrench ? 'Justification de conformité :' : 'Compliance Rationale:'}</strong>{' '}
                              {entry.complianceReason}
                            </span>
                          </div>
                        )}
                        {entry.notes && (
                          <div className="text-[11px] text-slate-500 pl-5 leading-tight">
                            {entry.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <button
                type="button"
                id="btn-export-audit-csv"
                onClick={handleExportCsv}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
                title={isFrench ? 'Exporter la piste d’audit au format CSV' : 'Export audit trail as CSV for spreadsheet analysis'}
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>{isFrench ? 'Exporter CSV' : 'Export CSV'}</span>
              </button>

              <button
                type="button"
                id="btn-export-audit-json"
                onClick={handleExportJson}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-blue-700" />
                <span>{isFrench ? 'Exporter JSON' : 'Export JSON'}</span>
              </button>

              <button
                type="button"
                id="btn-print-audit-ledger"
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>{isFrench ? 'Imprimer Grand Livre' : 'Print Ledger'}</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                {isFrench ? 'Fermer' : 'Close'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
