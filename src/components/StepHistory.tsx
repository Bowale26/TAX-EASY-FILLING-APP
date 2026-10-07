import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  History,
  Printer,
  FileCheck,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Download,
  Shield,
  HelpCircle,
  FileText,
  Clock,
  Sparkles,
  Award,
  Upload,
  Database,
  Save,
  Check,
  AlertCircle,
  RotateCcw,
  FileSpreadsheet,
  Search,
  Filter,
  ArrowRight,
  Activity,
  ShieldCheck,
  Layers,
  ArrowRightLeft,
  FileDown,
  Table,
} from 'lucide-react';
import { AppTaxReturn, AuditEntry } from '../types/tax';
import {
  downloadTaxReturnBackup,
  exportTaxReturnSummary,
  exportTaxYearCSV,
} from '../utils/exportUtils';
import { exportTaxSlipsExcel } from '../utils/excelExport';
import { getInitialAuditHistory } from '../utils/auditLogger';

interface StepHistoryProps {
  taxReturn: AppTaxReturn;
  onRestoreTaxReturn?: (restored: AppTaxReturn) => void;
  onResetReturn?: () => void;
  language: 'en' | 'fr';
}

export const StepHistory: React.FC<StepHistoryProps> = ({
  taxReturn,
  onRestoreTaxReturn,
  onResetReturn,
  language,
}) => {
  const isFrench = language === 'fr';
  const [isPrintTriggered, setIsPrintTriggered] = useState<boolean>(false);
  const [backupSuccessMsg, setBackupSuccessMsg] = useState<string | null>(null);
  const [restoreErrorMsg, setRestoreErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audit Trail filtering and search state
  const [auditSearchTerm, setAuditSearchTerm] = useState<string>('');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<
    'all' | 'personal' | 'slips' | 'deductions' | 'credits' | 'system'
  >('all');

  const calc = taxReturn.calculation;
  const isRefund = (calc?.balanceOwingOrRefund ?? 0) >= 0;
  const isFiled = taxReturn.filingStatus === 'Filed';

  // Memoized audit trail records (falls back to initial history if none recorded yet)
  const auditEntries: AuditEntry[] = useMemo(() => {
    if (taxReturn.auditTrail && taxReturn.auditTrail.length > 0) {
      return taxReturn.auditTrail;
    }
    return getInitialAuditHistory(taxReturn, language);
  }, [taxReturn.auditTrail, taxReturn, language]);

  // Filtered audit entries
  const filteredAuditEntries = useMemo(() => {
    return auditEntries.filter((entry) => {
      if (auditCategoryFilter !== 'all' && entry.category !== auditCategoryFilter) {
        return false;
      }
      if (auditSearchTerm.trim()) {
        const q = auditSearchTerm.toLowerCase();
        const label = isFrench ? entry.fieldLabelFr.toLowerCase() : entry.fieldLabelEn.toLowerCase();
        const prevVal = String(entry.previousValue || '').toLowerCase();
        const currVal = String(entry.currentValue || '').toLowerCase();
        const field = (entry.field || '').toLowerCase();
        const notes = (entry.notes || '').toLowerCase();
        return (
          label.includes(q) ||
          prevVal.includes(q) ||
          currVal.includes(q) ||
          field.includes(q) ||
          notes.includes(q)
        );
      }
      return true;
    });
  }, [auditEntries, auditCategoryFilter, auditSearchTerm, isFrench]);

  // Count slips for display
  const t4Count = taxReturn.t4Slips?.length || 0;
  const t4aCount = taxReturn.otherSlips?.filter((s) => s.type === 'T4A').length || 0;
  const t5Count = taxReturn.otherSlips?.filter((s) => s.type === 'T5').length || 0;
  const totalSlipsCount = t4Count + t4aCount + t5Count;

  // RRSP deduction limit for next year (approx 18% of earned income up to max)
  const nextYearRrspLimit = Math.min(
    Math.round((calc?.totalEmploymentIncome ?? 0) * 0.18),
    32490
  );

  const handlePrint = () => {
    setIsPrintTriggered(true);
    // Trigger browser print dialog specifically for PDF saving / printing
    setTimeout(() => {
      window.print();
      setIsPrintTriggered(false);
    }, 150);
  };

  // Trigger Excel (.xlsx) download of T4, T4A, T5 slips
  const handleExportExcel = () => {
    const res = exportTaxSlipsExcel(taxReturn, language);
    if (res.success) {
      setBackupSuccessMsg(
        isFrench
          ? `Cahier de travail Excel exporté avec succès : ${res.filename} (${res.t4Count} T4, ${res.t4aCount} T4A, ${res.t5Count} T5 inclus)`
          : `Excel slips workbook exported successfully: ${res.filename} (${res.t4Count} T4, ${res.t4aCount} T4A, ${res.t5Count} T5 included)`
      );
      setTimeout(() => setBackupSuccessMsg(null), 6000);
    }
  };

  // Trigger JSON backup download
  const handleBackupData = () => {
    const res = downloadTaxReturnBackup(taxReturn);
    if (res.success) {
      setBackupSuccessMsg(
        isFrench
          ? `Sauvegarde téléchargée avec succès : ${res.filename}`
          : `Backup downloaded successfully: ${res.filename}`
      );
      setTimeout(() => setBackupSuccessMsg(null), 5000);
    }
  };

  // Trigger official text summary report download
  const handleExportSummary = () => {
    const res = exportTaxReturnSummary(taxReturn);
    if (res.success) {
      setBackupSuccessMsg(
        isFrench
          ? `Sommaire T1 exporté : ${res.filename}`
          : `T1 Summary document exported: ${res.filename}`
      );
      setTimeout(() => setBackupSuccessMsg(null), 5000);
    }
  };

  // Trigger comprehensive CSV export of tax year data and calculation results
  const handleExportCSV = () => {
    const res = exportTaxYearCSV(taxReturn, language);
    if (res.success) {
      setBackupSuccessMsg(
        isFrench
          ? `Données et calculs fiscaux exportés en CSV avec succès : ${res.filename}`
          : `Tax year data & calculation results exported to CSV: ${res.filename}`
      );
      setTimeout(() => setBackupSuccessMsg(null), 5000);
    }
  };

  // Trigger JSON download of the audit trail ledger
  const handleExportAuditTrailJson = () => {
    const jsonStr = JSON.stringify(auditEntries, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax_audit_trail_${taxReturn.taxYear}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBackupSuccessMsg(
      isFrench
        ? `Journal d’audit téléchargé (${auditEntries.length} modifications enregistrées)`
        : `Audit trail downloaded (${auditEntries.length} recorded modifications)`
    );
    setTimeout(() => setBackupSuccessMsg(null), 5000);
  };

  // Handle restoring a backup JSON file
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON format');
        }

        if (onRestoreTaxReturn) {
          onRestoreTaxReturn(parsed);
          setBackupSuccessMsg(
            isFrench
              ? 'Déclaration restaurée avec succès depuis le fichier de sauvegarde!'
              : 'Tax return successfully restored from backup file!'
          );
          setRestoreErrorMsg(null);
          setTimeout(() => setBackupSuccessMsg(null), 5000);
        }
      } catch (err) {
        console.error('Error parsing backup file:', err);
        setRestoreErrorMsg(
          isFrench
            ? 'Fichier de sauvegarde invalide. Assurez-vous qu’il s’agit d’un fichier JSON généré par TaxEasy.'
            : 'Invalid backup file. Please select a valid TaxEasy taxReturn JSON file.'
        );
        setTimeout(() => setRestoreErrorMsg(null), 5000);
      }
    };
    reader.readAsText(file);
    // Reset file input so user can re-select same file if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Keyboard shortcut support (Ctrl+P / Cmd+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentDateFormatted = new Date().toLocaleDateString(
    isFrench ? 'fr-CA' : 'en-CA',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  return (
    <div id="step-history-view" className="space-y-6 max-w-4xl mx-auto">
      {/* 
        Print-Only Official Government Header
        Visible exclusively when printing / saving as PDF
      */}
      <div className="hidden print-only mb-6 pb-4 border-b-2 border-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🇨🇦</span>
            <div>
              <div className="text-[10pt] font-extrabold uppercase tracking-wider text-slate-800">
                {isFrench
                  ? 'GOUVERNEMENT DU CANADA • AGENCE DU REVENU DU CANADA'
                  : 'GOVERNMENT OF CANADA • CANADA REVENUE AGENCY'}
              </div>
              <div className="text-[12pt] font-black tracking-tight text-slate-900">
                {isFrench
                  ? `SOMMAIRE OFFICIEL DE COTISATION T1 — ANNÉE D’IMPOSITION ${taxReturn.taxYear}`
                  : `OFFICIAL T1 ASSESSMENT & TAX RETURN SUMMARY — TAX YEAR ${taxReturn.taxYear}`}
              </div>
            </div>
          </div>
          <div className="text-right text-[9pt] font-mono text-slate-600">
            <div>
              Ref: {taxReturn.netfileConfirmationCode || 'CRA-2025-884219'}
            </div>
            <div>Date: {currentDateFormatted}</div>
          </div>
        </div>
      </div>

      {/* Top Action Header & PDF Save / Backup Banner (Hidden during Print) */}
      <div className="bg-linear-to-br from-[#0b1f3a] via-[#0f2d52] to-[#064e3b] rounded-2xl p-6 text-white shadow-md border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-5 no-print">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
              {isFrench ? 'Étape Finale • Archivage' : 'Final Step • PDF & Backup'}
            </span>
            <span className="text-xs text-emerald-300 font-medium">
              {taxReturn.taxYear} T1 Return
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {isFrench
              ? 'Avis de Cotisation & Sauvegarde Hors-Ligne'
              : 'Notice of Assessment & Data Backup'}
          </h2>

          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            {isFrench
              ? 'Téléchargez une copie de sauvegarde JSON complète de votre déclaration ou imprimez une copie PDF propre du sommaire officiel de l’ARC.'
              : 'Download a full JSON backup of your tax return state for offline safety or save a clean, unblemished PDF of your official CRA assessment.'}
          </p>
        </div>

        {/* Primary Action Buttons: Export to Excel, Backup Data, Export CSV & Print */}
        <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Export to Excel (.xlsx) Button */}
          <button
            id="export-tax-excel-btn"
            onClick={handleExportExcel}
            title={
              isFrench
                ? 'Télécharger le classeur Excel professionnel avec tous les feuillets T4, T4A et T5 structurés'
                : 'Download structured professional Excel workbook (.xlsx) containing T4, T4A, and T5 slips'
            }
            className="px-4 py-3 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg hover:shadow-emerald-400/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-950" />
            <span>{isFrench ? 'Exporter en Excel (.xlsx)' : 'Export to Excel (.xlsx)'}</span>
          </button>

          {/* Export CSV Button */}
          <button
            id="export-tax-csv-btn"
            onClick={handleExportCSV}
            title={isFrench ? 'Exporter toutes les données et calculs de l’année au format CSV' : 'Export complete tax year data and calculation results to CSV for your records'}
            className="px-4 py-3 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg hover:shadow-amber-400/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <Table className="w-4 h-4 text-slate-950" />
            <span>{isFrench ? 'Exporter en CSV' : 'Export to CSV'}</span>
          </button>

          {/* Export JSON (Offline Backup) Button */}
          <button
            id="export-json-btn"
            onClick={handleBackupData}
            title={isFrench ? 'Télécharger l’état actuel de la déclaration en fichier JSON pour une sauvegarde hors-ligne' : 'Download your current tax return state as a local JSON file, ensuring you have an offline backup of your data'}
            className="px-4 py-3 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg hover:shadow-sky-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4 text-slate-950" />
            <span>{isFrench ? 'Exporter en JSON' : 'Export JSON'}</span>
          </button>

          {/* Print / PDF Button */}
          <button
            id="print-tax-return-btn"
            onClick={handlePrint}
            disabled={isPrintTriggered}
            className="px-4 py-3 bg-teal-400 hover:bg-teal-300 active:bg-teal-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg hover:shadow-teal-400/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            {isPrintTriggered ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
                <span>
                  {isFrench
                    ? 'Impression...'
                    : 'Opening Print...'}
                </span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4 text-slate-950" />
                <span>
                  {isFrench ? 'Imprimer / PDF' : 'Save as PDF / Print'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success / Error Feedback Toast Alerts */}
      {backupSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900 shadow-xs no-print animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{backupSuccessMsg}</span>
          </div>
          <button
            onClick={() => setBackupSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {restoreErrorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-between text-xs text-rose-900 shadow-xs no-print animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{restoreErrorMsg}</span>
          </div>
          <button
            onClick={() => setRestoreErrorMsg(null)}
            className="text-rose-700 hover:text-rose-900 font-bold px-2 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Offline Data Portability & Backup Suite Card (Hidden in print) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
              <Database className="w-5 h-5 text-sky-700" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isFrench ? 'Portabilité des Données & Sauvegarde Hors-Ligne' : 'Data Portability & Offline Backup Suite'}
              </h3>
              <p className="text-xs text-slate-500">
                {isFrench
                  ? 'Conservez un enregistrement hors-ligne infalsifiable de votre déclaration pour respecter la règle des 6 ans de l’ARC.'
                  : 'Keep an offline, tamper-proof record of your filing progress to satisfy CRA 6-year retention rules.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Export to Excel (.xlsx) Button */}
            <button
              id="portability-export-excel-btn"
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
              title={isFrench ? 'Télécharger classeur Excel structuré (.xlsx)' : 'Download structured Excel workbook (.xlsx) with T4, T4A, and T5 sheets'}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>{isFrench ? 'Exporter en Excel (.xlsx)' : 'Export to Excel (.xlsx)'}</span>
            </button>

            {/* Export CSV Button */}
            <button
              id="portability-export-csv-btn"
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 border border-amber-300 transition-colors cursor-pointer"
              title={isFrench ? 'Exporter toutes les données de l’année et le calcul au format CSV' : 'Export tax year records and calculation results to CSV for Excel/Numbers'}
            >
              <Table className="w-4 h-4 text-amber-700" />
              <span>{isFrench ? 'Exporter en CSV' : 'Export to CSV'}</span>
            </button>

            {/* Download JSON Backup Button */}
            <button
              id="export-json-card-btn"
              onClick={handleBackupData}
              className="px-3.5 py-2 bg-[#0b1f3a] hover:bg-[#132d4e] text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
              title={isFrench ? 'Télécharger l’état actuel de la déclaration en format JSON (sauvegarde hors-ligne)' : 'Download current tax return state as a local JSON file for offline backup'}
            >
              <Download className="w-4 h-4 text-sky-300" />
              <span>{isFrench ? 'Exporter JSON (Sauvegarde)' : 'Export JSON Backup'}</span>
            </button>

            {/* Export Summary Document */}
            <button
              id="export-tax-summary-btn"
              onClick={handleExportSummary}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 border border-slate-300 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span>{isFrench ? 'Exporter Sommaire (.txt)' : 'Export Docs'}</span>
            </button>

            {/* Clear Data Reset Button */}
            {onResetReturn && (
              <button
                id="history-clear-data-btn"
                onClick={onResetReturn}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs rounded-xl flex items-center space-x-1.5 border border-rose-200 transition-colors cursor-pointer"
                title={isFrench ? 'Réinitialiser la déclaration' : 'Clear and reset tax return data'}
              >
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>{isFrench ? 'Effacer les données' : 'Clear Data'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Backup details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-slate-500 block text-[11px]">
              {isFrench ? 'Feuillets fiscaux' : 'Tax Slips'}:
            </span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">
              {totalSlipsCount} {isFrench ? 'au total' : 'total'} ({t4Count} T4, {t4aCount} T4A, {t5Count} T5)
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-slate-500 block text-[11px]">
              {isFrench ? 'Modifications auditées' : 'Audited Changes'}:
            </span>
            <span className="font-bold text-blue-700 text-sm mt-0.5 block">
              {auditEntries.length} {isFrench ? 'entrées tracées' : 'tracked events'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-slate-500 block text-[11px]">
              {isFrench ? 'Statut de transmission' : 'Transmission Status'}:
            </span>
            <span className="font-bold text-emerald-700 text-sm mt-0.5 block">
              {isFiled ? '✓ NETFILE Filed' : 'Draft Prepared'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-slate-500 block text-[11px]">
                {isFrench ? 'Restaurer une sauvegarde' : 'Restore from Offline File'}:
              </span>
              <span className="text-[10px] text-slate-400">
                {isFrench ? 'Rechargez un fichier .json antérieur' : 'Import a previous .json backup'}
              </span>
            </div>

            <div className="pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileRestore}
                className="hidden"
                id="restore-backup-file-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-1 px-2.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-[11px] rounded-lg border border-slate-300 flex items-center justify-center space-x-1 transition-colors cursor-pointer"
              >
                <Upload className="w-3 h-3 text-slate-500" />
                <span>{isFrench ? 'Restaurer Fichier JSON' : 'Restore Backup File'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED SECTION 1: EXCEL SLIP EXPORTER (T4, T4A, T5) */}
      <div
        id="excel-slip-export-section"
        className="bg-white rounded-2xl p-6 sm:p-7 border border-emerald-200 shadow-sm space-y-5 no-print"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-slate-900 text-lg">
                  {isFrench ? 'Exportation Excel Professionnelle (Feuillets T4, T4A & T5)' : 'Professional Excel Slip Export (T4, T4A & T5)'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black border border-emerald-300">
                  .XLSX
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {isFrench
                  ? 'Générez un classeur Excel structuré multi-onglets contenant chaque feuillet fiscal avec ses codes de cases officielles de l’ARC, idéal pour votre comptable ou vos dossiers permanents.'
                  : 'Generate a structured, multi-worksheet Excel workbook with separate tabs for T4, T4A, and T5 slips, formatted numbers, and CRA official box codes.'}
              </p>
            </div>
          </div>

          <button
            id="download-excel-slips-main-btn"
            type="button"
            onClick={handleExportExcel}
            className="shrink-0 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center space-x-2 shadow-md hover:shadow-emerald-600/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>{isFrench ? 'Télécharger Excel (.xlsx)' : 'Download Excel (.xlsx)'}</span>
          </button>
        </div>

        {/* 3 Worksheets Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* T4 Tab Card */}
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-600" />
                <span className="font-bold text-xs text-slate-900">
                  {isFrench ? 'Feuille 1 : Feuillets T4' : 'Sheet 1: T4 Slips'}
                </span>
              </div>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-200/70 text-emerald-900">
                {t4Count} {isFrench ? 'feuillet(s)' : 'slip(s)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              {isFrench
                ? 'Revenus d’emploi (case 14), impôt retenu (case 22), RPC/RRQ (case 16), AE (case 18), RPAC et déductions syndicales.'
                : 'Employment income (Box 14), tax deducted (Box 22), CPP/QPP (Box 16), EI (Box 18), RPP and union dues.'}
            </p>
            <div className="text-[10px] text-slate-500 font-mono bg-white p-2 rounded border border-emerald-100">
              {t4Count > 0 ? (
                <span>
                  {isFrench ? 'Total case 14 :' : 'Total Box 14:'} ${calc?.totalEmploymentIncome?.toLocaleString('en-CA', { minimumFractionDigits: 2 }) ?? '0.00'}
                </span>
              ) : (
                <span className="italic">{isFrench ? 'Aucun feuillet saisi' : 'No slips entered'}</span>
              )}
            </div>
          </div>

          {/* T4A Tab Card */}
          <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-teal-600" />
                <span className="font-bold text-xs text-slate-900">
                  {isFrench ? 'Feuille 2 : Feuillets T4A' : 'Sheet 2: T4A Slips'}
                </span>
              </div>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-teal-200/70 text-teal-900">
                {t4aCount} {isFrench ? 'feuillet(s)' : 'slip(s)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              {isFrench
                ? 'Pensions, rentes (case 016), bourses d’études (case 105), commissions et autres revenus avec impôt retenu.'
                : 'Pension/superannuation (Box 016), scholarships/grants (Box 105), commissions, and income tax deducted.'}
            </p>
            <div className="text-[10px] text-slate-500 font-mono bg-white p-2 rounded border border-teal-100">
              {t4aCount > 0 ? (
                <span>
                  {t4aCount} {isFrench ? 'feuillet(s) prêt(s) à exporter' : 'slip(s) ready for export'}
                </span>
              ) : (
                <span className="italic">{isFrench ? 'Aucun feuillet T4A' : 'No T4A slips recorded'}</span>
              )}
            </div>
          </div>

          {/* T5 Tab Card */}
          <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-sky-600" />
                <span className="font-bold text-xs text-slate-900">
                  {isFrench ? 'Feuille 3 : Feuillets T5' : 'Sheet 3: T5 Slips'}
                </span>
              </div>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-sky-200/70 text-sky-900">
                {t5Count} {isFrench ? 'feuillet(s)' : 'slip(s)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              {isFrench
                ? 'Intérêts bancaires (case 13), dividendes déterminés et non déterminés, crédit d’impôt pour dividendes.'
                : 'Bank interest (Box 13), eligible dividends (Box 24/25), non-eligible dividends, and foreign income.'}
            </p>
            <div className="text-[10px] text-slate-500 font-mono bg-white p-2 rounded border border-sky-100">
              {t5Count > 0 ? (
                <span>
                  {t5Count} {isFrench ? 'feuillet(s) prêt(s) à exporter' : 'slip(s) ready for export'}
                </span>
              ) : (
                <span className="italic">{isFrench ? 'Aucun feuillet T5' : 'No T5 slips recorded'}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED SECTION 2: COMPREHENSIVE AUDIT TRAIL & CHANGE LEDGER */}
      <div
        id="tax-data-audit-trail-section"
        className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5 no-print"
      >
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-slate-900 text-lg">
                  {isFrench ? 'Piste d’Audit des Données Fiscales & Historique' : 'Tax Data Audit Trail & Change Ledger'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-extrabold border border-blue-200 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-blue-700" />
                  <span>{isFrench ? 'Traçabilité Intégrale' : 'Full Transparency'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {isFrench
                  ? 'Historique complet et chronologique de toutes les modifications apportées aux données fiscales, avec horodatages précis et comparaison des valeurs antérieures vs actuelles.'
                  : 'Complete chronological record of all changes made to your tax return, including timestamps and previous vs. current values for full audit transparency.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              id="export-audit-trail-json-btn"
              type="button"
              onClick={handleExportAuditTrailJson}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center space-x-1.5 border border-slate-300 transition-colors cursor-pointer"
              title={isFrench ? 'Exporter le journal d’audit en JSON' : 'Export audit log in JSON format'}
            >
              <FileDown className="w-3.5 h-3.5 text-slate-600" />
              <span>{isFrench ? 'Exporter Journal (.json)' : 'Export Audit Log'}</span>
            </button>
          </div>
        </div>

        {/* Audit Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs">
            <span className="text-blue-700 font-medium block text-[11px]">
              {isFrench ? 'Total Événements' : 'Total Events'}
            </span>
            <span className="text-lg font-black text-blue-950 mt-0.5 block">
              {auditEntries.length}
            </span>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs">
            <span className="text-emerald-700 font-medium block text-[11px]">
              {isFrench ? 'Feuillets Modifiés' : 'Slips Modified'}
            </span>
            <span className="text-lg font-black text-emerald-950 mt-0.5 block">
              {auditEntries.filter((e) => e.category === 'slips').length}
            </span>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-xs">
            <span className="text-amber-800 font-medium block text-[11px]">
              {isFrench ? 'Fusions / Conflits' : 'Merges & Conflicts'}
            </span>
            <span className="text-lg font-black text-amber-950 mt-0.5 block">
              {auditEntries.filter((e) => e.action === 'merged').length}
            </span>
          </div>

          <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs">
            <span className="text-purple-700 font-medium block text-[11px]">
              {isFrench ? 'Conformité ARC' : 'CRA Compliance'}
            </span>
            <span className="text-xs font-bold text-purple-950 mt-1 block">
              {isFrench ? 'Conservation 6 ans' : '6-Year Retention Ready'}
            </span>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', labelEn: 'All Changes', labelFr: 'Toutes' },
                { id: 'personal', labelEn: 'Personal Info', labelFr: 'Infos Perso' },
                { id: 'slips', labelEn: 'Tax Slips', labelFr: 'Feuillets' },
                { id: 'deductions', labelEn: 'Deductions', labelFr: 'Déductions' },
                { id: 'credits', labelEn: 'Credits', labelFr: 'Crédits' },
                { id: 'system', labelEn: 'System/Sync', labelFr: 'Système/Sync' },
              ] as const
            ).map((tab) => {
              const isActive = auditCategoryFilter === tab.id;
              const count =
                tab.id === 'all'
                  ? auditEntries.length
                  : auditEntries.filter((e) => e.category === tab.id).length;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAuditCategoryFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{isFrench ? tab.labelFr : tab.labelEn}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Field */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={auditSearchTerm}
              onChange={(e) => setAuditSearchTerm(e.target.value)}
              placeholder={isFrench ? 'Filtrer par champ ou valeur...' : 'Filter by field or value...'}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
            />
            {auditSearchTerm && (
              <button
                type="button"
                onClick={() => setAuditSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Audit Log Entries List */}
        <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
          {filteredAuditEntries.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
              <History className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700">
                {isFrench ? 'Aucune modification correspondante trouvée' : 'No matching audit records found'}
              </p>
              <p className="text-[11px] text-slate-500">
                {isFrench
                  ? 'Modifiez les données dans les étapes précédentes pour voir apparaître de nouveaux enregistrements horodatés.'
                  : 'Modify data in any previous step to see new timestamped entries appear in this ledger.'}
              </p>
            </div>
          ) : (
            filteredAuditEntries.map((entry) => {
              const dateObj = new Date(entry.timestamp);
              const formattedDate = dateObj.toLocaleDateString(isFrench ? 'fr-CA' : 'en-CA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });
              const formattedTime = dateObj.toLocaleTimeString(isFrench ? 'fr-CA' : 'en-CA', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              // Action pill color
              const actionColors = {
                modified: 'bg-amber-100 text-amber-900 border-amber-300',
                added: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                deleted: 'bg-rose-100 text-rose-900 border-rose-300',
                merged: 'bg-indigo-100 text-indigo-900 border-indigo-300',
                imported: 'bg-sky-100 text-sky-900 border-sky-300',
              }[entry.action] || 'bg-slate-100 text-slate-800 border-slate-300';

              // Category pill
              const categoryLabels = {
                personal: isFrench ? 'Profil' : 'Profile',
                slips: isFrench ? 'Feuillet' : 'Slip',
                deductions: isFrench ? 'Déduction' : 'Deduction',
                credits: isFrench ? 'Crédit' : 'Credit',
                system: isFrench ? 'Système' : 'System',
              }[entry.category] || entry.category;

              return (
                <div
                  key={entry.id}
                  className="p-3.5 bg-slate-50/70 hover:bg-slate-100/70 rounded-xl border border-slate-200 transition-colors space-y-2.5"
                >
                  {/* Top row: Timestamp, category, action */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px] text-slate-700">
                        {formattedDate} • {formattedTime}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        {categoryLabels}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${actionColors}`}
                      >
                        {entry.action}
                      </span>
                    </div>

                    <span className="font-mono text-[10px] text-slate-400">
                      ID: {entry.id.slice(-8)}
                    </span>
                  </div>

                  {/* Field Label & Comparison */}
                  <div className="space-y-1.5">
                    <div className="font-bold text-slate-900 text-xs">
                      {isFrench ? entry.fieldLabelFr : entry.fieldLabelEn}
                    </div>

                    {/* Previous vs Current Value Comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Previous Value */}
                      <div className="p-2 rounded-lg bg-rose-50/80 border border-rose-200/80 space-y-0.5">
                        <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wide flex items-center space-x-1">
                          <span>{isFrench ? 'Valeur Précédente' : 'Previous Value'}</span>
                        </span>
                        <div className="font-mono text-xs font-semibold text-rose-950 break-words line-through decoration-rose-400">
                          {entry.previousValue || <span className="italic font-normal text-rose-400">{isFrench ? '(vide)' : '(empty)'}</span>}
                        </div>
                      </div>

                      {/* Current Value */}
                      <div className="p-2 rounded-lg bg-emerald-50/80 border border-emerald-200/80 space-y-0.5">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide flex items-center space-x-1">
                          <Check className="w-3 h-3 text-emerald-600 inline" />
                          <span>{isFrench ? 'Valeur Actuelle' : 'Current Value'}</span>
                        </span>
                        <div className="font-mono text-xs font-bold text-emerald-950 break-words">
                          {entry.currentValue || <span className="italic font-normal text-emerald-400">{isFrench ? '(vide)' : '(empty)'}</span>}
                        </div>
                      </div>
                    </div>

                    {entry.notes && (
                      <p className="text-[11px] text-slate-500 italic pt-0.5">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* PDF Generation Guide Callout (Hidden in print) */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start space-x-3 no-print">
        <Award className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block">
            {isFrench
              ? 'Astuce : Comment sauvegarder en document PDF'
              : 'How to save as a PDF document on your device:'}
          </span>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            {isFrench
              ? 'Lorsque la boîte de dialogue d’impression de votre navigateur s’ouvre, choisissez « Enregistrer au format PDF » ou « Save as PDF » dans le menu déroulant de l’imprimante. Notre feuille de style élimine automatiquement le panneau de gauche et les boutons pour un rendu parfait.'
              : 'When the browser print dialog opens, set Destination to "Save as PDF". The print styles automatically hide the sidebar, navigation, and buttons, generating a crisp, audit-ready CRA tax return document.'}
          </p>
        </div>
      </div>

      {/* Official Simulated CRA Notice of Assessment Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-slate-300 shadow-md space-y-6 print:border-none print:shadow-none print:p-0 print-avoid-break">
        {/* CRA Header Branding */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="text-3xl" role="img" aria-label="Canadian Flag">
              🇨🇦
            </span>
            <div>
              <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                {isFrench ? 'Gouvernement du Canada' : 'Government of Canada'}
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                {isFrench
                  ? 'Agence du revenu du Canada'
                  : 'Canada Revenue Agency'}
              </h3>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="font-extrabold text-slate-900 block text-sm sm:text-base">
              {isFrench ? 'AVIS DE COTISATION' : 'NOTICE OF ASSESSMENT'}
            </span>
            <span className="text-slate-500 font-mono">
              T1 — {taxReturn.taxYear}
            </span>
          </div>
        </div>

        {/* Filer Metadata Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl text-xs print:bg-slate-100/50">
          <div>
            <span className="text-slate-500 block">
              {isFrench ? 'Nom du déclarant' : 'Taxpayer Name'}:
            </span>
            <span className="font-bold text-slate-900">
              {taxReturn.personal.firstName || 'Alex'}{' '}
              {taxReturn.personal.lastName || 'Morgan'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block">
              {isFrench ? 'Numéro de NAS' : 'Social Insurance No.'}:
            </span>
            <span className="font-mono font-bold text-slate-900">
              {taxReturn.personal.sin
                ? `***-***-${taxReturn.personal.sin.slice(-3)}`
                : '***-***-789'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block">
              {isFrench ? 'Province' : 'Tax Jurisdiction'}:
            </span>
            <span className="font-bold text-slate-900">
              {taxReturn.personal.province}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block">
              {isFrench ? 'Code NETFILE' : 'NETFILE Reference'}:
            </span>
            <span className="font-mono font-bold text-emerald-700">
              {taxReturn.netfileConfirmationCode || 'CRA-2025-884219'}
            </span>
          </div>
        </div>

        {/* Assessment Outcome Box */}
        <div
          className={`p-6 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isRefund
              ? 'bg-emerald-50 border-emerald-300'
              : 'bg-blue-50 border-blue-300'
          }`}
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              {isRefund
                ? isFrench
                  ? 'Résultat : Remboursement à vous verser'
                  : 'Assessment Result: Refund Payable to You'
                : isFrench
                ? 'Résultat : Solde d’impôt à payer'
                : 'Assessment Result: Balance Owing'}
            </span>
            <h4 className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 mt-1">
              $
              {Math.abs(calc?.balanceOwingOrRefund ?? 0).toLocaleString(
                'en-CA',
                { minimumFractionDigits: 2 }
              )}{' '}
              CAD
            </h4>
            <p className="text-xs text-slate-600 mt-1">
              {isRefund
                ? isFrench
                  ? 'Ce montant sera déposé directement dans votre compte bancaire enregistré auprès de l’ARC sous 8 jours ouvrables.'
                  : 'Direct deposit will be credited to your authorized financial institution in approx. 8 business days.'
                : isFrench
                ? 'Veuillez effectuer votre paiement auprès de l’ARC au plus tard le 30 avril pour éviter les frais d’intérêt.'
                : 'Please submit payment to CRA by April 30 to avoid daily compound interest.'}
            </p>
          </div>

          <div className="shrink-0">
            <span className="px-3.5 py-1.5 rounded-full bg-white font-bold text-xs shadow-xs text-slate-800 border border-slate-200">
              {isFiled
                ? isFrench
                  ? '✓ Déclaration Transmise'
                  : '✓ Assessed as Filed'
                : isFrench
                ? 'Brouillon Prêt'
                : 'Draft Ready'}
            </span>
          </div>
        </div>

        {/* Summary Lines */}
        <div className="space-y-2 text-xs divide-y divide-slate-100">
          <div className="flex justify-between py-2">
            <span className="text-slate-600">
              {isFrench
                ? 'Revenu total (Ligne 15000)'
                : 'Total Income (Line 15000)'}
            </span>
            <span className="font-mono font-bold">
              $
              {calc?.totalIncome.toLocaleString('en-CA', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex justify-between py-2">
            <span className="text-slate-600">
              {isFrench
                ? 'Revenu net (Ligne 23600)'
                : 'Net Income (Line 23600)'}
            </span>
            <span className="font-mono font-bold">
              $
              {calc?.netIncome.toLocaleString('en-CA', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex justify-between py-2">
            <span className="text-slate-600">
              {isFrench
                ? 'Revenu imposable (Ligne 26000)'
                : 'Taxable Income (Line 26000)'}
            </span>
            <span className="font-mono font-bold">
              $
              {calc?.taxableIncome.toLocaleString('en-CA', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex justify-between py-2">
            <span className="text-slate-600">
              {isFrench
                ? 'Impôt total à payer (Ligne 43500)'
                : 'Total Tax Payable (Line 43500)'}
            </span>
            <span className="font-mono font-bold">
              $
              {calc?.totalTaxPayable.toLocaleString('en-CA', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex justify-between py-2">
            <span className="text-slate-600">
              {isFrench
                ? 'Total des crédits et retenues (Ligne 43700)'
                : 'Total Credits and Tax Deducted (Line 43700)'}
            </span>
            <span className="font-mono font-bold text-emerald-700">
              $
              {calc?.totalTaxWithheld.toLocaleString('en-CA', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Next Year RRSP Statement */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs print:bg-slate-100/50">
          <div className="font-bold text-slate-900 flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-[#064e3b]" />
            <span>
              {isFrench
                ? `État de votre maximum déductible au titre des REER pour ${
                    taxReturn.taxYear + 1
                  }`
                : `Your RRSP Deduction Limit Statement for ${
                    taxReturn.taxYear + 1
                  }`}
            </span>
          </div>
          <p className="text-slate-600">
            {isFrench
              ? `Votre plafond estimatif de cotisation REER pour ${
                  taxReturn.taxYear + 1
                } est d’environ ${nextYearRrspLimit.toLocaleString('en-CA')} $.`
              : `Your estimated RRSP deduction limit for ${
                  taxReturn.taxYear + 1
                } is approximately $${nextYearRrspLimit.toLocaleString(
                  'en-CA'
                )}.`}
          </p>
        </div>

        {/* CRA Legal Notice */}
        <div className="pt-2 text-[10px] text-slate-400 leading-normal border-t border-slate-200">
          {isFrench
            ? 'Ceci est un sommaire généré par ordinateur à des fins de planification et de consultation fiscale personnelle. L’avis officiel officiel de l’ARC sera disponible dans votre dossier « Mon dossier pour les particuliers » sur Canada.ca.'
            : 'This is an electronic summary prepared for taxpayer records. Your official Notice of Assessment will also be stored in your secure CRA "My Account" portal on Canada.ca. Keep this document and supporting tax slips for at least 6 years from the date of assessment.'}
        </div>

        {/* Bottom Action Buttons (Hidden during print) */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex flex-wrap items-center gap-2">
            {/* Export CSV Button */}
            <button
              id="bottom-export-csv-btn"
              onClick={handleExportCSV}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
              title={isFrench ? 'Exporter les données fiscales et résultats en CSV' : 'Export tax year data and calculation results to CSV'}
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-950" />
              <span>{isFrench ? 'Exporter en CSV' : 'Export to CSV'}</span>
            </button>

            {/* Backup Data Button */}
            <button
              id="bottom-backup-btn"
              onClick={handleBackupData}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4 text-sky-200" />
              <span>{isFrench ? 'Sauvegarder Données (JSON)' : 'Backup Data (JSON)'}</span>
            </button>

            {/* Export docs Button */}
            <button
              id="bottom-export-btn"
              onClick={handleExportSummary}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 border border-slate-300 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span>{isFrench ? 'Exporter Sommaire' : 'Export Docs'}</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-2 transition-colors cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4 text-emerald-200" />
            <span>
              {isFrench
                ? 'Imprimer / Sauvegarder ce sommaire'
                : 'Print / Save this Assessment PDF'}
            </span>
          </button>
        </div>
      </div>

      {/* Print-Only Official Footer */}
      <div className="hidden print-only pt-8 text-[8pt] text-slate-500 border-t border-slate-300 text-center">
        <span>
          {isFrench
            ? 'Page 1 de 1 • Sommaire de déclaration T1 de l’ARC • Conservez tous vos reçus et feuillets pendant 6 ans.'
            : 'Page 1 of 1 • Canada Revenue Agency T1 Personal Tax Assessment Summary • Retain all records and slips for 6 years.'}
        </span>
      </div>
    </div>
  );
};

