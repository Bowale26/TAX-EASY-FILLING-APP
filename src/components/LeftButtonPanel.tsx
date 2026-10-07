import React from 'react';
import {
  FileText,
  Camera,
  Bot,
  Scale,
  Download,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Smartphone,
  Globe,
  User,
  Users,
  DollarSign,
  TrendingDown,
  Calculator,
  Send,
  History,
  ShieldCheck,
  Database,
  Printer,
  FolderLock,
  UserCheck,
  CreditCard,
  FileDown,
  Sliders,
  PenTool,
} from 'lucide-react';
import { AppTaxReturn } from '../types/tax';
import { downloadTaxReturnBackup } from '../utils/exportUtils';

interface LeftButtonPanelProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onOpenScanner: () => void;
  onOpenAssistant: () => void;
  onOpenTour: () => void;
  onOpenJudge: () => void;
  onOpenDMS: () => void;
  onOpenAuditDashboard?: () => void;
  onOpenClientFiles?: () => void;
  onOpenSubscription?: () => void;
  onOpenFirebase?: () => void;
  onDownloadFullPdf?: () => void;
  onOpenPdfSettings?: () => void;
  onOpenInstallModal: () => void;
  onOpenResources: () => void;
  onLoadDemoData: () => void;
  onResetReturn: () => void;
  taxReturn: AppTaxReturn;
  language: 'en' | 'fr';
  onToggleLanguage: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const LeftButtonPanel: React.FC<LeftButtonPanelProps> = ({
  currentStep,
  onSelectStep,
  onNextStep,
  onPrevStep,
  onOpenScanner,
  onOpenAssistant,
  onOpenTour,
  onOpenJudge,
  onOpenDMS,
  onOpenAuditDashboard,
  onOpenClientFiles,
  onOpenSubscription,
  onOpenFirebase,
  onDownloadFullPdf,
  onOpenPdfSettings,
  onOpenInstallModal,
  onOpenResources,
  onLoadDemoData,
  onResetReturn,
  taxReturn,
  language,
  onToggleLanguage,
  isOpenMobile,
  onCloseMobile,
}) => {
  const isFrench = language === 'fr';

  const steps = [
    { num: 1, titleEn: 'Eligibility', titleFr: 'Admissibilité', icon: ShieldCheck },
    { num: 2, titleEn: 'CV Scan & Slips', titleFr: 'Numérisation CV', icon: Camera },
    { num: 3, titleEn: 'Personal Info', titleFr: 'Infos personnelles', icon: User },
    { num: 4, titleEn: 'Family & Dependants', titleFr: 'Famille & Personnes', icon: Users },
    { num: 5, titleEn: 'Income (T4/T5)', titleFr: 'Revenus (T4/T5)', icon: DollarSign },
    { num: 6, titleEn: 'Deductions & Credits', titleFr: 'Déductions & Crédits', icon: TrendingDown },
    { num: 7, titleEn: 'Review & Audit', titleFr: 'Révision & Audit', icon: AlertCircle },
    { num: 8, titleEn: 'Tax Calculation', titleFr: 'Calcul d’impôt', icon: Calculator },
    { num: 9, titleEn: 'CRA NETFILE Filing', titleFr: 'Transmission NETFILE', icon: Send },
    { num: 10, titleEn: 'Notice of Assessment', titleFr: 'Avis de cotisation', icon: History },
  ];

  const estimatedRefund = taxReturn.calculation?.balanceOwingOrRefund ?? 0;
  const isRefund = estimatedRefund >= 0;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          id="left-panel-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Main Single Left-Hand Button Panel */}
      <aside
        id="single-left-button-panel"
        className={`fixed inset-y-0 left-0 z-50 w-80 lg:w-84 bg-[#0b1f3a] text-white flex flex-col border-r border-[#1a365d] shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 bg-[#064e3b] border-b border-[#0e4d34] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md">
              <span className="text-2xl" role="img" aria-label="Canadian Maple Leaf">🍁</span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  {isFrench ? 'Impôt Canada' : 'Canada Tax'}
                </span>
                <span className="text-[10px] bg-emerald-700 text-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold">
                  2025
                </span>
              </div>
              <h1 className="text-base font-extrabold tracking-tight text-white leading-tight">
                TAX EASY APP
              </h1>
            </div>
          </div>

          <button
            id="lang-toggle-btn"
            onClick={onToggleLanguage}
            title={isFrench ? 'Switch to English' : 'Passer au Français'}
            className="flex items-center space-x-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-medium text-white transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-300" />
            <span>{isFrench ? 'EN' : 'FR'}</span>
          </button>
        </div>

        {/* Live Calculation Badge in Panel */}
        <div className="px-4 py-3 bg-[#0d274c] border-b border-[#163663]">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
            <span>{isFrench ? 'Estimation en temps réel' : 'Real-Time Estimate'}</span>
            <span className="font-semibold text-emerald-400">
              {isRefund ? (isFrench ? 'Remboursement' : 'Estimated Refund') : (isFrench ? 'Solde dû' : 'Balance Owing')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold tracking-tight text-white">
              {isRefund ? '+' : '-'}${Math.abs(estimatedRefund).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {taxReturn.personal.province || 'ON'} • {isFrench ? 'Prov/Féd' : 'Fed/Prov'}
            </div>
          </div>
        </div>

        {/* Step Navigation Button Group */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 text-sm custom-scrollbar">
          <div className="px-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{isFrench ? 'Étapes de déclaration' : 'Workflow Steps'}</span>
            <span className="text-emerald-400 font-mono">{currentStep} / {steps.length}</span>
          </div>

          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;

            return (
              <button
                key={step.num}
                id={`step-nav-btn-${step.num}`}
                onClick={() => {
                  onSelectStep(step.num);
                  if (isOpenMobile) onCloseMobile();
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-all group ${
                  isActive
                    ? 'bg-[#064e3b] text-white shadow-md shadow-emerald-950/40 border border-emerald-500/40 font-semibold'
                    : isCompleted
                    ? 'text-slate-200 hover:bg-[#132c4f] hover:text-white'
                    : 'text-slate-400 hover:bg-[#10243e] hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-white text-[#064e3b]'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : step.num}
                  </span>
                  <span className="truncate">{isFrench ? step.titleFr : step.titleEn}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-emerald-300 shrink-0" />}
              </button>
            );
          })}

          <div className="pt-3 pb-1 px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {isFrench ? 'Outils Intelligents' : 'Smart Tax Tools'}
          </div>

          {/* Quick Action Button: Secure Document Manager Vault */}
          <button
            id="panel-btn-open-dms"
            onClick={() => {
              onOpenDMS();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl bg-linear-to-r from-emerald-950 via-[#0b2942] to-[#0c2340] hover:from-emerald-900 hover:to-[#13365e] text-emerald-100 border border-emerald-500/40 flex items-center justify-between shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center space-x-2.5">
              <FolderLock className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-white">
                  {isFrench ? 'Coffre & Gestionnaire Docs' : 'Document Vault & DMS'}
                </span>
                <span className="text-[10px] text-emerald-300/80 font-mono">
                  {isFrench ? 'W-2, 1099, Reçus (AES-256)' : 'W-2, 1099, Receipts (AES-256)'}
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono font-bold">
              VAULT
            </span>
          </button>

          {/* Quick Action Button: Audit Trail Dashboard (For Accountants & Taxpayers) */}
          <button
            id="panel-btn-open-audit-dashboard"
            onClick={() => {
              onOpenAuditDashboard?.();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl bg-linear-to-r from-emerald-950 via-[#0a233a] to-[#0c2340] hover:from-emerald-900 hover:to-[#13365e] text-emerald-100 border border-emerald-500/40 flex items-center justify-between shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center space-x-2.5">
              <History className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-white">
                  {isFrench ? 'Journal d’Audit (CPA)' : 'Audit Trail Dashboard'}
                </span>
                <span className="text-[10px] text-emerald-300/80 font-mono">
                  {isFrench ? 'Traçabilité Sec 230(4)' : 'Sec 230(4) Compliance'}
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono font-bold">
              CPA
            </span>
          </button>

          {/* Quick Action Button: Client File Manager & Preparer ID (CPA Multi-Client) */}
          <button
            id="panel-btn-open-client-files"
            onClick={() => {
              onOpenClientFiles?.();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl bg-linear-to-r from-emerald-950 via-[#0a233a] to-[#0c2340] hover:from-emerald-900 hover:to-[#13365e] text-emerald-100 border border-emerald-500/40 flex items-center justify-between shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center space-x-2.5">
              <UserCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-white">
                  {isFrench ? 'Dossiers Clients & No Préparateur' : 'Client Files & Preparer ID'}
                </span>
                <span className="text-[10px] text-emerald-300/80 font-mono">
                  {taxReturn.clientId || 'CLI-2025-001'} • {taxReturn.taxPreparerId || 'EFILE-99281'}
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono font-bold">
              SWITCH
            </span>
          </button>

          {/* Quick Action Button: Subscription & Billing */}
          <button
            id="panel-btn-open-subscription"
            onClick={() => {
              onOpenSubscription?.();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl bg-linear-to-r from-[#0b2447] via-[#0d2a52] to-[#064e3b] hover:from-[#103363] hover:to-[#08634c] text-white border border-emerald-500/40 flex items-center justify-between shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center space-x-2.5">
              <CreditCard className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-white">
                  {isFrench ? 'Abonnement & Facturation' : 'Subscription & Billing'}
                </span>
                <span className="text-[10px] text-emerald-300/80 font-mono">
                  $29.99/yr • {isFrench ? 'Accès Illimité' : 'Unlimited Pro Access'}
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-500/50 px-1.5 py-0.5 rounded font-mono font-bold">
              PRO
            </span>
          </button>

          {/* Quick Action Button: Google Cloud Firebase & Firestore */}
          <button
            id="panel-btn-open-firebase"
            onClick={() => {
              onOpenFirebase?.();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl bg-linear-to-r from-[#0b2447] via-[#091b30] to-[#043327] hover:from-[#113567] hover:to-[#074737] text-white border border-emerald-500/50 flex items-center justify-between shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center space-x-2.5">
              <Database className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-white">
                  {isFrench ? 'Base Cloud Firebase' : 'Firebase Cloud Database'}
                </span>
                <span className="text-[10px] text-emerald-300/80 font-mono">
                  Firestore • {isFrench ? 'Sync Temps Réel' : 'Live Cloud Sync'}
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 px-1.5 py-0.5 rounded font-mono font-bold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>LIVE</span>
            </span>
          </button>

          {/* Quick Action Button: Computer Vision Scanner */}
          <button
            id="panel-btn-open-scanner"
            onClick={() => {
              onOpenScanner();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl bg-linear-to-r from-emerald-900/60 to-emerald-800/40 hover:from-emerald-800/80 hover:to-emerald-700/60 text-emerald-100 border border-emerald-500/30 flex items-center justify-between shadow-xs transition-all"
          >
            <div className="flex items-center space-x-2.5">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span className="font-medium">{isFrench ? 'Numériseur Vision IA' : 'Computer Vision Scan'}</span>
            </div>
            <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.5 rounded font-mono">
              OCR
            </span>
          </button>

          {/* Quick Action Button: A2A Judge Agent */}
          <button
            id="panel-btn-open-judge"
            onClick={() => {
              onOpenJudge();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl bg-linear-to-r from-blue-900/60 to-indigo-900/40 hover:from-blue-800/80 hover:to-indigo-800/60 text-blue-100 border border-blue-500/30 flex items-center justify-between shadow-xs transition-all"
          >
            <div className="flex items-center space-x-2.5">
              <Scale className="w-4 h-4 text-blue-400" />
              <span className="font-medium">{isFrench ? 'Agent Juge A2A' : 'A2A Judge Agent'}</span>
            </div>
            <span className="text-[10px] bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded font-mono">
              AUDIT
            </span>
          </button>

          {/* Quick Action Button: Guided App Tour */}
          <button
            id="panel-btn-open-tour"
            onClick={() => {
              onOpenTour();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl bg-linear-to-r from-teal-900/60 to-blue-900/40 hover:from-teal-800/80 hover:to-blue-800/60 text-teal-100 border border-teal-500/30 flex items-center justify-between shadow-xs transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-4 h-4 text-teal-300" />
              <span className="font-medium">{isFrench ? 'Visite Guidée de l’App' : 'Guided App Tour'}</span>
            </div>
            <span className="text-[10px] bg-teal-500/30 text-teal-200 px-1.5 py-0.5 rounded font-mono">
              TOUR
            </span>
          </button>

          {/* Quick Action Button: AI Assistant TaxFile */}
          <button
            id="panel-btn-open-assistant"
            onClick={() => {
              onOpenAssistant();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl bg-[#132c4f] hover:bg-[#1a3a66] text-slate-200 border border-slate-700 flex items-center justify-between transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>{isFrench ? 'Assistant TaxFile IA' : 'TaxFile AI Assistant'}</span>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </button>

          {/* Quick Action Button: Backup Data */}
          <button
            id="panel-btn-backup-data"
            onClick={() => {
              downloadTaxReturnBackup(taxReturn);
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl bg-[#132c4f] hover:bg-[#1a3a66] text-slate-200 border border-slate-700 flex items-center justify-between transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <Database className="w-4 h-4 text-sky-400" />
              <span>{isFrench ? 'Sauvegarder Données' : 'Backup Data (JSON)'}</span>
            </div>
            <Download className="w-3.5 h-3.5 text-sky-300" />
          </button>

          {/* Primary Action Button: Download Full Return as PDF (jsPDF Generated Formatted CRA Return with Watermark) */}
          <button
            id="panel-btn-download-full-pdf"
            onClick={() => {
              if (onDownloadFullPdf) {
                onDownloadFullPdf();
              }
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl bg-linear-to-r from-[#064e3b] to-[#047857] hover:from-[#08634c] hover:to-[#059669] text-white border border-emerald-400/50 flex items-center justify-between shadow-md transition-all cursor-pointer group font-semibold"
          >
            <div className="flex items-center space-x-2.5">
              <FileDown className="w-4 h-4 text-emerald-200 group-hover:translate-y-0.5 transition-transform" />
              <div className="flex flex-col">
                <span className="text-xs text-white">
                  {isFrench ? 'Télécharger PDF Complet' : 'Download Full Return (PDF)'}
                </span>
                <span className="text-[10px] text-emerald-200 font-mono font-normal">
                  {isFrench ? 'T1 officiel avec filigrane' : 'Formatted CRA T1 with watermark'}
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded font-mono font-bold">
              PDF
            </span>
          </button>

          {/* Quick Action Button: Configure PDF Settings & Signature */}
          <button
            id="panel-btn-open-pdf-settings"
            onClick={() => {
              if (onOpenPdfSettings) {
                onOpenPdfSettings();
              } else {
                onOpenDMS();
              }
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full text-left px-3 py-2 rounded-xl bg-[#0e2744] hover:bg-[#143760] text-emerald-200 border border-emerald-500/30 flex items-center justify-between transition-all cursor-pointer text-xs"
          >
            <div className="flex items-center space-x-2">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isFrench ? 'Paramètres PDF & Signature' : 'PDF Settings & Signature'}</span>
            </div>
            <PenTool className="w-3 h-3 text-emerald-300" />
          </button>

          {/* Quick Action Button: Print / PDF */}
          <button
            id="panel-btn-print-view"
            onClick={() => {
              window.print();
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl bg-[#132c4f] hover:bg-[#1a3a66] text-slate-200 border border-slate-700 flex items-center justify-between transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>{isFrench ? 'Imprimer / PDF' : 'Print / Save PDF'}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-black/40 px-1.5 py-0.5 rounded">⌘P</span>
          </button>

          {/* Quick Action Button: Download App for Android & iOS */}
          <button
            id="panel-btn-open-install"
            onClick={() => {
              onOpenInstallModal();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl bg-[#132c4f] hover:bg-[#1a3a66] text-slate-200 border border-slate-700 flex items-center justify-between transition-all"
          >
            <div className="flex items-center space-x-2.5">
              <Smartphone className="w-4 h-4 text-sky-400" />
              <span>{isFrench ? 'Installer App (iOS / Android)' : 'Get App (iOS / Android)'}</span>
            </div>
            <Download className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Official Resources */}
          <button
            id="panel-btn-open-resources"
            onClick={() => {
              onOpenResources();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full text-left px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[#10243e] flex items-center space-x-2.5 transition-all text-xs"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>{isFrench ? 'Liens Officiels de l’ARC & FAQ' : 'Official CRA Links & FAQ'}</span>
          </button>
        </div>

        {/* Panel Action Bar: Next / Previous & Demo Buttons */}
        <div className="p-3 bg-[#08172c] border-t border-[#163663] space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              id="panel-btn-prev"
              disabled={currentStep <= 1}
              onClick={onPrevStep}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 border transition-all ${
                currentStep <= 1
                  ? 'opacity-40 cursor-not-allowed bg-slate-900/40 text-slate-500 border-slate-800'
                  : 'bg-[#10243e] hover:bg-[#163052] text-slate-200 border-slate-700'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{isFrench ? 'Précédent' : 'Back'}</span>
            </button>

            <button
              id="panel-btn-next"
              onClick={onNextStep}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-[#064e3b] hover:bg-[#08634c] text-white flex items-center justify-center space-x-1 shadow-md shadow-emerald-950/40 border border-emerald-500/50 transition-all"
            >
              <span>{currentStep === 9 ? (isFrench ? 'Confirmer' : 'Finish') : (isFrench ? 'Continuer' : 'Continue')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <button
              id="panel-btn-demo-load"
              onClick={onLoadDemoData}
              title={isFrench ? 'Charger les données de démonstration' : 'Load Synthetic Demo Tax Return'}
              className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-medium border border-white/10 flex items-center justify-center space-x-1 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>{isFrench ? 'Profil Démo' : 'Demo Profile'}</span>
            </button>

            <button
              id="panel-btn-reset"
              onClick={onResetReturn}
              title={isFrench ? 'Réinitialiser la déclaration' : 'Reset Tax Return'}
              className="py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-[11px] font-medium border border-white/10 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <p className="text-[10px] text-slate-400 text-center leading-tight">
            {isFrench
              ? 'Logiciel d’aide fiscale canadienne • NETFILE simulé'
              : 'Canadian Personal Tax Prep • Simulated NETFILE'}
          </p>
        </div>
      </aside>
    </>
  );
};
