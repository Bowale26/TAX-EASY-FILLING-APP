import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { LeftButtonPanel } from './components/LeftButtonPanel';
import { ComputerVisionModal } from './components/ComputerVisionModal';
import { A2AJudgeModal } from './components/A2AJudgeModal';
import { TaxAssistantModal } from './components/TaxAssistantModal';
import { AppTourModal } from './components/AppTourModal';
import { PwaInstallModal } from './components/PwaInstallModal';
import { CRAOfficialResourcesModal } from './components/CRAOfficialResourcesModal';
import { ClearDataModal } from './components/ClearDataModal';
import { DocumentManagementModal } from './components/DocumentManagementModal';
import { SyncStatusIndicator, SyncToast } from './components/SyncStatusIndicator';
import { HeaderTaxProgress } from './components/HeaderTaxProgress';
import { SessionTimeoutModal } from './components/SessionTimeoutModal';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { initServiceWorker, notifyTaxDataSynced } from './services/serviceWorkerService';

import { StepEligibility } from './components/StepEligibility';
import { StepDocuments } from './components/StepDocuments';
import { StepPersonal } from './components/StepPersonal';
import { StepFamily } from './components/StepFamily';
import { StepIncome } from './components/StepIncome';
import { StepDeductions } from './components/StepDeductions';
import { StepReview } from './components/StepReview';
import { StepCalculation } from './components/StepCalculation';
import { StepFiling } from './components/StepFiling';
import { StepHistory } from './components/StepHistory';
import { ErrorBoundary } from 'react-error-boundary';
import { motion, AnimatePresence } from 'motion/react';

import { AppTaxReturn, T4Slip, ConflictDifference, AuditEntry, SlipType, ExtractedSlipResultPayload } from './types/tax';
import { computeCanadianT1Return } from './services/taxCalculationEngine';
import { INITIAL_TAX_RETURN, SAMPLE_ALEX_RETURN } from './services/sampleData';
import { detectTaxReturnChanges, getInitialAuditHistory } from './utils/auditLogger';
import { RemoteSyncError, syncTaxReturnToRemote } from './services/remoteSyncService';
import { downloadTaxReturnBackup, shareTaxSummary, copyVerificationUrlToClipboard } from './utils/exportUtils';
import {
  generateTaxVerificationData,
  applyPrintVerificationStyles,
  TaxDocumentVerificationData,
} from './utils/taxVerificationQr';
import {
  getStoredShareLogs,
  recordShareLog,
  clearStoredShareLogs,
  ShareLogEntry,
} from './utils/shareAuditLog';
import { PrintableQrCodeModal } from './components/PrintableQrCodeModal';
import { AuditTrailDashboardModal } from './components/AuditTrailDashboardModal';
import { ClientFileManagerModal } from './components/ClientFileManagerModal';
import { SubscriptionBillingModal } from './components/SubscriptionBillingModal';
import { FirebaseModal } from './components/FirebaseModal';
import { TrialBanner } from './components/TrialBanner';
import { TrialExpiredPaywall } from './components/TrialExpiredPaywall';
import {
  AuthUser,
  getCurrentAuthUser,
  getTrialStatus,
  TrialStatusInfo,
} from './services/subscriptionAuthService';
import { downloadFullReturnPdf } from './utils/pdfReturnExport';
import {
  Menu,
  Camera,
  Scale,
  Bot,
  Sparkles,
  Download,
  HelpCircle,
  RotateCcw,
  FolderLock,
  Printer,
  Share2,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  FileText,
  ShieldCheck,
  RefreshCw,
  QrCode,
  History,
  Clock,
  Trash2,
  UserCheck,
  CreditCard,
  FileDown,
} from 'lucide-react';

const STORAGE_KEY = 'tax_easy_filling_app_return_v1';

export default function App() {
  const [language, setLanguage] = useState<'en' | 'fr'>('en');
  const isFrench = language === 'fr';

  // Sync state tracking
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const [remoteSyncedTime, setRemoteSyncedTime] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem('canada_tax_easy_remote_synced_time_v1');
      if (saved) return Number(saved);
    } catch (e) {}
    return null;
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSyncToast, setShowSyncToast] = useState<boolean>(false);
  const [remoteSyncError, setRemoteSyncError] = useState<RemoteSyncError | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef<boolean>(true);

  // Load from local storage or default
  const [taxReturn, setTaxReturn] = useState<AppTaxReturn>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_TAX_RETURN,
          ...parsed,
          personal: { ...INITIAL_TAX_RETURN.personal, ...(parsed.personal || {}) },
          deductions: { ...INITIAL_TAX_RETURN.deductions, ...(parsed.deductions || {}) },
          credits: { ...INITIAL_TAX_RETURN.credits, ...(parsed.credits || {}) },
          t4Slips: Array.isArray(parsed.t4Slips) ? parsed.t4Slips : INITIAL_TAX_RETURN.t4Slips,
          otherSlips: Array.isArray(parsed.otherSlips) ? parsed.otherSlips : [],
          dependants: Array.isArray(parsed.dependants) ? parsed.dependants : [],
        };
      }
    } catch (e) {
      console.warn('Could not load saved tax return:', e);
    }
    return INITIAL_TAX_RETURN;
  });

  // Ref to hold the latest handleForceSync function safely without TDZ issues
  const handleForceSyncRef = useRef<() => void>(() => {});

  // Session Inactivity Timeout tracking (15 minutes inactivity warning to keep tax data secure)
  const { isWarningOpen: isSessionWarningOpen, extendSession } = useSessionTimeout(
    useCallback(() => {
      // Auto-save return state to local storage when timeout triggers
      handleForceSyncRef.current();
    }, []),
    15 * 60 * 1000 // 15 minutes
  );

  // Remote synced snapshot state (persisted baseline for comparison)
  const [remoteSyncedReturn, setRemoteSyncedReturn] = useState<AppTaxReturn | null>(() => {
    try {
      const saved = localStorage.getItem('canada_tax_easy_remote_synced_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not load remote snapshot:', e);
    }
    return null;
  });

  // Compute pending differences between active draft and remote synced return
  const { hasPendingChanges, pendingChangesCount } = useMemo(() => {
    if (!remoteSyncedReturn) {
      return { hasPendingChanges: false, pendingChangesCount: 0 };
    }
    let count = 0;
    // Personal changes
    if (taxReturn.personal?.province !== remoteSyncedReturn.personal?.province) count++;
    if (taxReturn.personal?.firstName !== remoteSyncedReturn.personal?.firstName) count++;
    if (taxReturn.personal?.lastName !== remoteSyncedReturn.personal?.lastName) count++;
    if (taxReturn.personal?.sin !== remoteSyncedReturn.personal?.sin) count++;
    if (taxReturn.personal?.maritalStatus !== remoteSyncedReturn.personal?.maritalStatus) count++;

    // T4 Slips differences
    if (taxReturn.t4Slips.length !== remoteSyncedReturn.t4Slips.length) count++;
    const draftIncome = taxReturn.t4Slips.reduce((s, x) => s + (x.box14_employmentIncome || 0), 0);
    const remoteIncome = remoteSyncedReturn.t4Slips.reduce((s, x) => s + (x.box14_employmentIncome || 0), 0);
    if (Math.abs(draftIncome - remoteIncome) > 0.01) count++;

    const draftTax = taxReturn.t4Slips.reduce((s, x) => s + (x.box22_incomeTaxDeducted || 0), 0);
    const remoteTax = remoteSyncedReturn.t4Slips.reduce((s, x) => s + (x.box22_incomeTaxDeducted || 0), 0);
    if (Math.abs(draftTax - remoteTax) > 0.01) count++;

    // Other Slips (T4A, T5)
    if ((taxReturn.otherSlips || []).length !== (remoteSyncedReturn.otherSlips || []).length) count++;

    // Deductions & credits
    if (Math.abs((taxReturn.deductions?.rrspContributions || 0) - (remoteSyncedReturn.deductions?.rrspContributions || 0)) > 0.01) count++;
    if (Math.abs((taxReturn.deductions?.unionOrProfessionalDues || 0) - (remoteSyncedReturn.deductions?.unionOrProfessionalDues || 0)) > 0.01) count++;
    if (Math.abs((taxReturn.credits?.charitableDonations || 0) - (remoteSyncedReturn.credits?.charitableDonations || 0)) > 0.01) count++;
    if (Math.abs((taxReturn.credits?.eligibleMedicalExpenses || 0) - (remoteSyncedReturn.credits?.eligibleMedicalExpenses || 0)) > 0.01) count++;

    const isDifferent = JSON.stringify(taxReturn) !== JSON.stringify(remoteSyncedReturn);
    if (isDifferent && count === 0) count = 1;

    return {
      hasPendingChanges: count > 0,
      pendingChangesCount: count,
    };
  }, [taxReturn, remoteSyncedReturn]);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState<boolean>(false);

  // Modal States
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [scannerSlipType, setScannerSlipType] = useState<SlipType>('T4');
  const [scannerTab, setScannerTab] = useState<'samples' | 'upload' | 'camera'>('samples');
  const [isJudgeOpen, setIsJudgeOpen] = useState<boolean>(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isDmsOpen, setIsDmsOpen] = useState<boolean>(false);
  const [dmsInitialSection, setDmsInitialSection] = useState<'vault' | 'pdf_settings'>('vault');
  const [isInstallOpen, setIsInstallOpen] = useState<boolean>(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState<boolean>(false);
  const [isClearDataOpen, setIsClearDataOpen] = useState<boolean>(false);
  const [isAuditDashboardOpen, setIsAuditDashboardOpen] = useState<boolean>(false);
  const [isClientFilesOpen, setIsClientFilesOpen] = useState<boolean>(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState<boolean>(false);
  const [subscriptionInitialTab, setSubscriptionInitialTab] = useState<'overview' | 'signin' | 'signup' | 'trial'>('overview');
  const [isFirebaseOpen, setIsFirebaseOpen] = useState<boolean>(false);
  const [autoSavePulse, setAutoSavePulse] = useState<number>(0);

  // Authentication & 1-Day Free Trial State
  const [currentAuthUser, setCurrentAuthUser] = useState<AuthUser | null>(() => getCurrentAuthUser());
  const [trialStatus, setTrialStatus] = useState<TrialStatusInfo>(() => getTrialStatus(getCurrentAuthUser()));

  // Dynamic 1-second interval to keep trial remaining time ticking
  useEffect(() => {
    const checkTrial = () => {
      const user = getCurrentAuthUser();
      setCurrentAuthUser(user);
      const status = getTrialStatus(user);
      setTrialStatus(status);
    };

    checkTrial();
    const interval = setInterval(checkTrial, 1000);
    return () => clearInterval(interval);
  }, []);

  // Recalculate deterministic tax return on any changes
  const computedCalculation = useMemo(() => {
    return computeCanadianT1Return(
      taxReturn.t4Slips || [],
      taxReturn.otherSlips || [],
      taxReturn.deductions,
      taxReturn.credits,
      taxReturn.personal?.province || 'ON',
      taxReturn.taxYear || 2025
    );
  }, [
    taxReturn.t4Slips,
    taxReturn.otherSlips,
    taxReturn.deductions,
    taxReturn.credits,
    taxReturn.personal?.province,
    taxReturn.taxYear,
  ]);

  // Keep calculation synced
  useEffect(() => {
    setTaxReturn((prev) => ({
      ...prev,
      calculation: computedCalculation,
    }));
  }, [computedCalculation]);

  // Formal Print Timestamp & Dynamic Attribute Synchronization for Official Tax Documents
  const [printTimestamp, setPrintTimestamp] = useState<string>(() => {
    const d = new Date();
    return `${d.toLocaleDateString('en-CA')} ${d.toLocaleTimeString('en-CA', { hour12: false })}`;
  });

  // User toggle for watermark on printed tax documents ('DRAFT' vs 'OFFICIAL')
  const [includeWatermark, setIncludeWatermark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('tax_print_include_watermark');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // User toggle for on-screen verification QR block visibility before printing
  const [showOnScreenQr, setShowOnScreenQr] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('tax_show_onscreen_qr');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // Cryptographic tax document verification data (SHA-256 hash, URL, vector QR code)
  const [verificationData, setVerificationData] = useState<TaxDocumentVerificationData | null>(null);

  // Dynamic derivation of Draft vs Official state
  const isOfficial = Boolean(
    taxReturn.filingStatus === 'Filed' ||
    taxReturn.netfile?.status === 'accepted' ||
    taxReturn.netfile?.confirmationNumber ||
    taxReturn.netfileConfirmationCode ||
    verificationData?.isOfficial ||
    verificationData?.watermarkText === 'OFFICIAL'
  );

  // Synchronize on-screen QR visibility attribute with document root
  useEffect(() => {
    document.body.setAttribute('data-screen-qr', showOnScreenQr ? 'visible' : 'hidden');
    try {
      localStorage.setItem('tax_show_onscreen_qr', showOnScreenQr ? 'true' : 'false');
    } catch {}
  }, [showOnScreenQr]);

  // Handler for #header-print-watermark-toggle-btn:
  // Toggles watermark AND also toggles the on-screen visibility of the verification QR block
  const handleToggleWatermarkAndQr = useCallback(() => {
    const nextWatermark = !includeWatermark;
    setIncludeWatermark(nextWatermark);
    try {
      localStorage.setItem('tax_print_include_watermark', nextWatermark ? 'true' : 'false');
    } catch {}

    const nextQr = !showOnScreenQr;
    setShowOnScreenQr(nextQr);
  }, [includeWatermark, showOnScreenQr]);

  // Tooltip explicitly describing current verification QR status, hash, and on-screen visibility
  const qrStatusTooltip = useMemo(() => {
    const qrStatus = verificationData
      ? isOfficial
        ? isFrench
          ? 'OFFICIEL (Transmis Netfile ARC / Certifié)'
          : 'OFFICIAL (Netfile CRA Transmitted & Certified)'
        : isFrench
        ? 'BROUILLON (Authentifié cryptographiquement SHA-256)'
        : 'DRAFT (Cryptographically Authenticated SHA-256)'
      : isFrench
      ? 'Calcul en cours...'
      : 'Computing Verification...';

    const hashShort = verificationData?.documentHash
      ? `${verificationData.documentHash.slice(0, 10)}...`
      : 'Active';

    const qrVisibility = showOnScreenQr
      ? isFrench ? 'Affiché à l’écran' : 'Visible on screen'
      : isFrench ? 'Masqué à l’écran' : 'Hidden on screen';

    const watermarkState = includeWatermark
      ? isFrench ? `Actif ("${verificationData?.watermarkText || (isOfficial ? 'OFFICIAL' : 'DRAFT')}")` : `Active ("${verificationData?.watermarkText || (isOfficial ? 'OFFICIAL' : 'DRAFT')}")`
      : isFrench ? 'Désactivé' : 'Disabled';

    if (isFrench) {
      return `Statut QR de vérification : ${qrStatus} (Empreinte: ${hashShort}) • Bloc QR à l'écran : ${qrVisibility} • Filigrane d’impression : ${watermarkState}. Cliquez sur l'icône QR pour ouvrir le code imprimable en haute résolution, ou cliquez sur le bouton pour basculer le filigrane et la visibilité à l'écran.`;
    }
    return `Verification QR Status: ${qrStatus} (Hash: ${hashShort}) • On-Screen QR: ${qrVisibility} • Print Watermark: ${watermarkState}. Click the QR icon directly to open full-resolution printable modal, or click button to toggle watermark & screen visibility.`;
  }, [verificationData, isOfficial, isFrench, showOnScreenQr, includeWatermark]);

  // Synchronize document verification data, QR codes, and CSS print variables
  useEffect(() => {
    let isCancelled = false;

    async function syncVerification() {
      try {
        const data = await generateTaxVerificationData(taxReturn, language);
        if (isCancelled) return;
        setVerificationData(data);
        applyPrintVerificationStyles({
          includeWatermark,
          watermarkText: data.watermarkText,
          documentHash: data.documentHash,
          verificationUrl: data.verificationUrl,
          qrDataUri: data.qrDataUri,
        });
      } catch (err) {
        console.error('Failed to generate tax verification data:', err);
      }
    }

    syncVerification();

    try {
      localStorage.setItem('tax_print_include_watermark', includeWatermark ? 'true' : 'false');
    } catch {}

    return () => {
      isCancelled = true;
    };
  }, [taxReturn, includeWatermark, language]);

  // Share Tax Summary feedback toast state
  const [shareFeedback, setShareFeedback] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState<boolean>(false);
  const [hasCopiedUrl, setHasCopiedUrl] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [shareLogs, setShareLogs] = useState<ShareLogEntry[]>(() => getStoredShareLogs());
  const [isShareLogCollapsed, setIsShareLogCollapsed] = useState<boolean>(false);
  const shareMenuRef = useRef<HTMLDivElement | null>(null);

  const logShareEvent = (destination: string, destinationFr: string) => {
    const updated = recordShareLog({
      destination,
      destinationFr,
      documentState: isOfficial ? 'Official' : 'Draft',
      taxYear: taxReturn.taxYear || 2025,
      taxpayerName: `${taxReturn.personal?.firstName || 'Alex'} ${taxReturn.personal?.lastName || 'Morgan'}`,
      documentHash: verificationData?.documentHash,
    });
    setShareLogs(updated);
  };

  const handleClearShareLogs = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearStoredShareLogs();
    setShareLogs([]);
    setShareFeedback({
      show: true,
      message: isFrench ? 'Journal de partage effacé.' : 'Share audit log cleared.',
      type: 'info',
    });
    setTimeout(() => setShareFeedback(null), 3000);
  };

  const handleOpenQrModal = () => {
    setIsShareMenuOpen(false);
    setIsQrModalOpen(true);
    logShareEvent('Printable QR Verification Sheet', 'Fiche de code QR imprimable');
  };

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setIsShareMenuOpen(false);
      }
    };
    if (isShareMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isShareMenuOpen]);

  const handleShareTaxSummary = async () => {
    try {
      setIsShareMenuOpen(false);
      const res = await shareTaxSummary(taxReturn, language);
      if (
        res.message &&
        !res.message.includes('Partage annulé') &&
        !res.message.includes('Share cancelled')
      ) {
        logShareEvent('Native Web Share (CRA T1 Summary)', 'Partage Web natif (Sommaire T1 ARC)');
        setShareFeedback({
          show: true,
          message: res.message,
          type: res.shared ? 'success' : res.copied ? 'info' : 'error',
        });
        setTimeout(() => {
          setShareFeedback(null);
        }, 4000);
      }
    } catch (err) {
      console.error('Failed to trigger share dialog:', err);
    }
  };

  const handleCopyVerificationUrl = async () => {
    try {
      setIsShareMenuOpen(false);
      const res = await copyVerificationUrlToClipboard(taxReturn, language);
      if (res.success) {
        setHasCopiedUrl(true);
        setTimeout(() => setHasCopiedUrl(false), 2500);
        logShareEvent('Clipboard (Verification URL)', 'Presse-papiers (URL de vérification)');
        setShareFeedback({
          show: true,
          message: res.message,
          type: 'success',
        });
        setTimeout(() => {
          setShareFeedback(null);
        }, 4000);
      } else {
        setShareFeedback({
          show: true,
          message: res.message,
          type: 'error',
        });
        setTimeout(() => {
          setShareFeedback(null);
        }, 4000);
      }
    } catch (err) {
      console.error('Failed to copy verification URL:', err);
    }
  };

  const handleCopyPlainTextSummary = async () => {
    try {
      setIsShareMenuOpen(false);
      const calc = taxReturn.calculation;
      const p = taxReturn.personal;
      const isRefund = (calc?.balanceOwingOrRefund ?? 0) >= 0;
      const summaryText = [
        `============================================================`,
        `CRA T1 TAX RETURN SUMMARY — ${taxReturn.taxYear || 2025}`,
        `TAXPAYER: ${p?.firstName || 'Alex'} ${p?.lastName || 'Morgan'}`,
        `STATUS: ${verificationData?.watermarkText || 'DRAFT'}`,
        `------------------------------------------------------------`,
        `Line 15000 (Total Income):     $${(calc?.totalIncome ?? 0).toFixed(2)} CAD`,
        `Line 23600 (Net Income):       $${(calc?.netIncome ?? 0).toFixed(2)} CAD`,
        `Line 26000 (Taxable Income):   $${(calc?.taxableIncome ?? 0).toFixed(2)} CAD`,
        `Line 43500 (Total Tax):        $${(calc?.totalTaxPayable ?? 0).toFixed(2)} CAD`,
        `Line 43700 (Total Withheld):   $${(calc?.totalTaxWithheld ?? 0).toFixed(2)} CAD`,
        isRefund
          ? `Line 48400 (Assessed Refund):  +$${Math.abs(calc?.balanceOwingOrRefund ?? 0).toFixed(2)} CAD`
          : `Line 48500 (Assessed Owing):   -$${Math.abs(calc?.balanceOwingOrRefund ?? 0).toFixed(2)} CAD`,
        `------------------------------------------------------------`,
        `Verification Link: ${verificationData?.verificationUrl || ''}`,
        `============================================================`,
      ].join('\n');

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(summaryText);
        logShareEvent('Clipboard (Plain Text T1 Summary)', 'Presse-papiers (Sommaire T1 texte brut)');
        setShareFeedback({
          show: true,
          message: isFrench
            ? 'Sommaire T1 en texte brut copié dans le presse-papiers !'
            : 'Plain text T1 summary copied to clipboard!',
          type: 'info',
        });
        setTimeout(() => setShareFeedback(null), 4000);
      }
    } catch (err) {
      console.error('Failed to copy text summary:', err);
    }
  };

  const handleDownloadFullReturnPdf = useCallback(() => {
    downloadFullReturnPdf(taxReturn, {
      language,
      watermarkText: includeWatermark ? (verificationData?.watermarkText || 'DRAFT') : undefined,
      preparerId: taxReturn.taxPreparerId || 'EFILE-99281',
      preparerName: 'Alex Morgan, CPA',
    });
    logShareEvent('Download Full Return PDF (CRA T1)', 'Téléchargement Déclaration Complète PDF (T1 ARC)');
    setShareFeedback({
      show: true,
      message: isFrench
        ? 'Déclaration T1 complète téléchargée en PDF avec filigrane officiel !'
        : 'Full T1 Tax Return downloaded as PDF with official watermark!',
      type: 'success',
    });
    setTimeout(() => setShareFeedback(null), 4000);
  }, [taxReturn, language, includeWatermark, verificationData, isFrench]);

  const handleToggleFilingState = () => {
    const isCurrentlyOfficial =
      taxReturn.filingStatus === 'Filed' ||
      taxReturn.netfile?.status === 'accepted' ||
      Boolean(taxReturn.netfile?.confirmationNumber) ||
      verificationData?.watermarkText === 'OFFICIAL';

    const newFilingStatus: 'Draft' | 'Filed' = isCurrentlyOfficial ? 'Draft' : 'Filed';
    const newNetfileStatus: 'draft' | 'accepted' = isCurrentlyOfficial ? 'draft' : 'accepted';
    const newConfirmationNumber = isCurrentlyOfficial
      ? undefined
      : `CRA-2025-${Math.floor(100000 + Math.random() * 900000)}`;

    setTaxReturn((prev) => ({
      ...prev,
      filingStatus: newFilingStatus,
      netfileConfirmationCode: newConfirmationNumber,
      netfile: {
        ...prev.netfile,
        status: newNetfileStatus,
        confirmationNumber: newConfirmationNumber,
      },
    }));

    setShareFeedback({
      show: true,
      message: isFrench
        ? `État basculé vers : ${newFilingStatus === 'Filed' ? 'OFFICIEL (Transmis ARC)' : 'BROUILLON'}`
        : `Return state toggled to: ${newFilingStatus === 'Filed' ? 'OFFICIAL (CRA Filed)' : 'DRAFT'}`,
      type: 'info',
    });
    setTimeout(() => setShareFeedback(null), 3000);
    setIsShareMenuOpen(false);
  };

  useEffect(() => {
    const updatePrintTimestamp = () => {
      const d = new Date();
      const formatted = `${d.toLocaleDateString('en-CA')} ${d.toLocaleTimeString('en-CA', { hour12: false })}`;
      setPrintTimestamp(formatted);
      document.body.setAttribute('data-timestamp', formatted);
      document.documentElement.setAttribute('data-timestamp', formatted);
      const targets = document.querySelectorAll(
        '#root, #step-review-view, #step-review-print-preview, #step-calculation-view, #step-history-view'
      );
      targets.forEach((t) => t.setAttribute('data-timestamp', formatted));
    };

    updatePrintTimestamp();
    window.addEventListener('beforeprint', updatePrintTimestamp);
    return () => window.removeEventListener('beforeprint', updatePrintTimestamp);
  }, []);

  // Initialize Service Worker and establish initial sync state
  useEffect(() => {
    initServiceWorker();
    try {
      if (localStorage.getItem(STORAGE_KEY)) {
        setLastSavedTime(Date.now());
      }
      // Initialize remote baseline snapshot if not yet set
      const savedRemote = localStorage.getItem('canada_tax_easy_remote_synced_v1');
      if (!savedRemote) {
        const now = Date.now();
        setRemoteSyncedReturn(taxReturn);
        setRemoteSyncedTime(now);
        localStorage.setItem('canada_tax_easy_remote_synced_v1', JSON.stringify(taxReturn));
        localStorage.setItem('canada_tax_easy_remote_synced_time_v1', String(now));
      }
    } catch (e) {
      console.warn('Could not read initial localStorage:', e);
    }
  }, []);

  // Listen to Service Worker message confirmations for remote sync state
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    const handleSwMsg = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_CONFIRMED' || event.data?.type === 'REMOTE_SYNC_STATUS_RESPONSE') {
        const ts = event.data.timestamp || Date.now();
        setRemoteSyncedTime(ts);
        if (event.data.syncedData) {
          setRemoteSyncedReturn(event.data.syncedData);
          try {
            localStorage.setItem('canada_tax_easy_remote_synced_v1', JSON.stringify(event.data.syncedData));
            localStorage.setItem('canada_tax_easy_remote_synced_time_v1', String(ts));
          } catch (e) {}
        }
      }
    };
    navigator.serviceWorker.addEventListener('message', handleSwMsg);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSwMsg);
    };
  }, []);

  // Save to local storage with real-time sync notification
  useEffect(() => {
    // If it's the initial mount, skip showing the toast alert
    if (isInitialMount.current) {
      isInitialMount.current = false;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(taxReturn));
        setLastSavedTime(Date.now());
      } catch (e) {
        console.warn('Initial localStorage save failed:', e);
      }
      return;
    }

    setIsSaving(true);
    setAutoSavePulse(Date.now());
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(taxReturn));
        const now = Date.now();
        setLastSavedTime(now);
        setIsSaving(false);

        // Show brief UI Toast indicator
        setShowSyncToast(true);
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }
        toastTimeoutRef.current = setTimeout(() => {
          setShowSyncToast(false);
        }, 2500);
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
        setIsSaving(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [taxReturn]);

  const handleForceSync = useCallback(() => {
    try {
      setIsSaving(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(taxReturn));
      const now = Date.now();
      setLastSavedTime(now);
      setRemoteSyncedTime(now);
      setRemoteSyncedReturn(taxReturn);
      localStorage.setItem('canada_tax_easy_remote_synced_v1', JSON.stringify(taxReturn));
      localStorage.setItem('canada_tax_easy_remote_synced_time_v1', String(now));
      setIsSaving(false);

      notifyTaxDataSynced({
        timestamp: now,
        taxYear: taxReturn.taxYear,
        t4Count: taxReturn.t4Slips.length,
        key: STORAGE_KEY,
        taxReturn: taxReturn,
      });

      setShowSyncToast(true);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = setTimeout(() => {
        setShowSyncToast(false);
      }, 2500);
    } catch (e) {
      console.warn('Force sync error:', e);
      setIsSaving(false);
    }
  }, [taxReturn]);

  // Keep handleForceSyncRef current for timeout callbacks
  useEffect(() => {
    handleForceSyncRef.current = handleForceSync;
  }, [handleForceSync]);

  const handleRevertToRemote = () => {
    if (remoteSyncedReturn) {
      setTaxReturn(remoteSyncedReturn);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteSyncedReturn));
        setLastSavedTime(Date.now());
      } catch (e) {
        console.warn('Revert failed:', e);
      }
    }
  };

  // Manual Retry Remote Sync (triggers re-authentication flow if 401 or network error occurs)
  const handleRetryRemoteSync = async () => {
    try {
      setIsSaving(true);
      const result = await syncTaxReturnToRemote(taxReturn);
      if (!result.success && result.error) {
        setRemoteSyncError(result.error);
        throw new Error(result.error.message);
      }
      // Successful remote sync clears error and updates baseline
      setRemoteSyncError(null);
      const now = Date.now();
      setLastSavedTime(now);
      setRemoteSyncedTime(now);
      setRemoteSyncedReturn(taxReturn);
      localStorage.setItem('canada_tax_easy_remote_synced_v1', JSON.stringify(taxReturn));
      localStorage.setItem('canada_tax_easy_remote_synced_time_v1', String(now));
      notifyTaxDataSynced({
        timestamp: now,
        taxYear: taxReturn.taxYear,
        t4Count: taxReturn.t4Slips.length,
        key: STORAGE_KEY,
        taxReturn: taxReturn,
      });
      setShowSyncToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Export current tax return state as offline backup JSON file
  const handleExportJson = () => {
    downloadTaxReturnBackup(taxReturn);
  };

  const handleUpdateTaxReturn = (updated: Partial<AppTaxReturn>) => {
    setTaxReturn((prev) => {
      const next: AppTaxReturn = {
        ...prev,
        ...updated,
      };
      // Track detected changes in auditTrail for transparent audit logging
      const changes = detectTaxReturnChanges(prev, next, language);
      if (changes.length > 0) {
        const existingAudit = prev.auditTrail && prev.auditTrail.length > 0
          ? prev.auditTrail
          : getInitialAuditHistory(prev, language);
        next.auditTrail = [...changes, ...existingAudit];
      }
      return next;
    });
  };

  const handleApplyMerge = (mergedReturn: AppTaxReturn, resolutions: ConflictDifference[]) => {
    const now = Date.now();
    const mergeAuditEntries: AuditEntry[] = resolutions.map((diff) => ({
      id: `audit-merge-${now}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      category: diff.category,
      field: diff.fieldKey,
      fieldLabelEn: `[Merge Resolved] ${diff.labelEn}`,
      fieldLabelFr: `[Résolu par fusion] ${diff.labelFr}`,
      previousValue: diff.chosenResolution === 'local' ? diff.remoteDisplay : diff.localDisplay,
      currentValue: diff.chosenResolution === 'local' ? diff.localDisplay : diff.remoteDisplay,
      action: 'merged',
      conflicted: false,
      conflictDetails: {
        localValue: diff.localValue,
        remoteValue: diff.remoteValue,
        chosen: diff.chosenResolution,
        resolvedAt: now,
      },
      notes: isFrench
        ? `Conflit résolu individuellement en sélectionnant la valeur ${diff.chosenResolution === 'local' ? 'locale (brouillon)' : 'distante (serveur)'}. Données non-conflictuelles préservées sans réinitialisation complète.`
        : `Conflict individually resolved by selecting ${diff.chosenResolution === 'local' ? 'local draft' : 'remote snapshot'} value. Non-conflicting fields preserved without full revert.`,
    }));

    setTaxReturn((prev) => {
      const existingAudit = prev.auditTrail && prev.auditTrail.length > 0
        ? prev.auditTrail.map((entry) => {
            // If this entry was previously conflicted and resolved in this merge, clear the conflicted flag
            const resolvedDiff = resolutions.find((r) => r.fieldKey === entry.field);
            if (resolvedDiff && entry.conflicted) {
              return { ...entry, conflicted: false };
            }
            return entry;
          })
        : getInitialAuditHistory(prev, language);
      const updated: AppTaxReturn = {
        ...mergedReturn,
        auditTrail: [...mergeAuditEntries, ...existingAudit],
      };
      setRemoteSyncedReturn(updated);
      setRemoteSyncedTime(now);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem('canada_tax_easy_remote_synced_v1', JSON.stringify(updated));
        localStorage.setItem('canada_tax_easy_remote_synced_time_v1', String(now));
      } catch (e) {
        console.warn('Persist merged return failed:', e);
      }
      return updated;
    });

    setShowSyncToast(true);
  };

  const handleApplyExtractedT4 = (newT4: T4Slip) => {
    setTaxReturn((prev) => {
      // Check if employer already exists, replace or append
      const existingIdx = prev.t4Slips.findIndex((s) => s.employerName === newT4.employerName);
      let updatedSlips: T4Slip[];
      if (existingIdx >= 0) {
        updatedSlips = [...prev.t4Slips];
        updatedSlips[existingIdx] = newT4;
      } else {
        updatedSlips = [...prev.t4Slips, newT4];
      }
      return {
        ...prev,
        t4Slips: updatedSlips,
      };
    });
  };

  const handleApplyExtractedSlip = (payload: ExtractedSlipResultPayload) => {
    setTaxReturn((prev) => {
      let updated = { ...prev };

      // Apply T4 if available
      if (payload.slipType === 'T4' && payload.t4Slip) {
        const newT4 = payload.t4Slip;
        const existingIdx = prev.t4Slips.findIndex((s) => s.employerName === newT4.employerName);
        let updatedSlips: T4Slip[];
        if (existingIdx >= 0) {
          updatedSlips = [...prev.t4Slips];
          updatedSlips[existingIdx] = newT4;
        } else {
          updatedSlips = [...prev.t4Slips, newT4];
        }
        updated = { ...updated, t4Slips: updatedSlips };
      } else if (payload.otherSlip) {
        // Apply Other Slip (T4A, T5, etc.)
        const newOther = payload.otherSlip;
        const prevOther = prev.otherSlips || [];
        const existingIdx = prevOther.findIndex(
          (s) => s.type === newOther.type && s.payerName === newOther.payerName
        );
        let updatedOther: typeof prevOther;
        if (existingIdx >= 0) {
          updatedOther = [...prevOther];
          updatedOther[existingIdx] = newOther;
        } else {
          updatedOther = [...prevOther, newOther];
        }
        updated = { ...updated, otherSlips: updatedOther };
      }

      // Associate scanned document with color indicator metadata
      if (payload.documentAssociation) {
        const prevDocs = prev.scannedDocuments || [];
        const existingDocIdx = prevDocs.findIndex((d) => d.documentCode === payload.slipType);
        let updatedDocs = [...prevDocs];
        if (existingDocIdx >= 0) {
          updatedDocs[existingDocIdx] = payload.documentAssociation;
        } else {
          updatedDocs.push(payload.documentAssociation);
        }
        updated = { ...updated, scannedDocuments: updatedDocs };
      }

      return updated;
    });
  };

  const handleLoadDemo = () => {
    setTaxReturn(SAMPLE_ALEX_RETURN);
    setCurrentStep(1);
  };

  const handleResetReturn = () => {
    setIsClearDataOpen(true);
  };

  const handleExecuteReset = () => {
    setTaxReturn(INITIAL_TAX_RETURN);
    setCurrentStep(1);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear localStorage on reset:', e);
    }
    setShowSyncToast(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setShowSyncToast(false);
    }, 2500);
  };

  const handleNextStep = () => {
    if (currentStep < 10) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const estimatedRefund = computedCalculation.balanceOwingOrRefund;
  const isRefund = estimatedRefund >= 0;

  return (
    <div
      className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col antialiased font-sans selection:bg-emerald-500 selection:text-white"
      data-screen-qr={showOnScreenQr ? 'visible' : 'hidden'}
    >
      {/* 
        Mandated Single Left-Hand Button Panel 
        All navigation and tool buttons are consolidated into this dedicated panel on the left.
      */}
      <LeftButtonPanel
        currentStep={currentStep}
        onSelectStep={(step) => {
          setCurrentStep(step);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNextStep={handleNextStep}
        onPrevStep={handlePrevStep}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenTour={() => setIsTourOpen(true)}
        onOpenJudge={() => setIsJudgeOpen(true)}
        onOpenDMS={() => {
          setDmsInitialSection('vault');
          setIsDmsOpen(true);
        }}
        onOpenAuditDashboard={() => setIsAuditDashboardOpen(true)}
        onOpenClientFiles={() => setIsClientFilesOpen(true)}
        onOpenSubscription={() => setIsSubscriptionOpen(true)}
        onOpenFirebase={() => setIsFirebaseOpen(true)}
        onDownloadFullPdf={handleDownloadFullReturnPdf}
        onOpenPdfSettings={() => {
          setDmsInitialSection('pdf_settings');
          setIsDmsOpen(true);
        }}
        onOpenInstallModal={() => setIsInstallOpen(true)}
        onOpenResources={() => setIsResourcesOpen(true)}
        onLoadDemoData={handleLoadDemo}
        onResetReturn={handleResetReturn}
        taxReturn={taxReturn}
        language={language}
        onToggleLanguage={() => setLanguage((l) => (l === 'en' ? 'fr' : 'en'))}
        isOpenMobile={isMobilePanelOpen}
        onCloseMobile={() => setIsMobilePanelOpen(false)}
      />

      {/* Main Canvas (offset to the right on desktop to accommodate the fixed left panel) */}
      <div className="lg:pl-84 flex-1 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between no-print">
          <div className="flex items-center space-x-3">
            {/* Mobile Panel Toggle Button */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setIsMobilePanelOpen(true)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 lg:hidden transition-colors"
              aria-label="Open navigation panel"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#064e3b]">
                  {isFrench ? 'Étape' : 'Step'} {currentStep} / 10
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  {taxReturn.taxYear} {isFrench ? 'Impôt des particuliers T1' : 'Personal T1 Return'}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-extrabold text-[#0b1f3a] tracking-tight">
                {currentStep === 1 && (isFrench ? 'Admissibilité & Préparation' : 'Eligibility & Welcome')}
                {currentStep === 2 && (isFrench ? 'Numérisation Visuelle & Feuillets' : 'Slip Scanner & Document Checklist')}
                {currentStep === 3 && (isFrench ? 'Renseignements Personnels' : 'Personal & Residency Information')}
                {currentStep === 4 && (isFrench ? 'Famille & Personnes à Charge' : 'Family, Spouse & Dependants')}
                {currentStep === 5 && (isFrench ? 'Revenus T4 & Autres Sources' : 'Employment & Other Income')}
                {currentStep === 6 && (isFrench ? 'Déductions & Crédits d’Impôt' : 'Deductions & Tax Credits')}
                {currentStep === 7 && (isFrench ? 'Révision & Contrôle d’Audit' : 'Review & Pre-Filing Diagnostics')}
                {currentStep === 8 && (isFrench ? 'Moteur de Calcul Déterministe' : 'Detailed Tax Calculation & Plain Why')}
                {currentStep === 9 && (isFrench ? 'Transmission NETFILE ARC' : 'CRA NETFILE Transmission')}
                {currentStep === 10 && (isFrench ? 'Avis de Cotisation' : 'Notice of Assessment & History')}
              </h1>
            </div>
          </div>

          {/* Top-Right Quick Status Pill & Local Storage Sync Indicator */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Visual Progress Radial Chart tracking 10 tax return sections */}
            <HeaderTaxProgress
              currentStep={currentStep}
              taxReturn={taxReturn}
              onSelectStep={(step) => {
                setCurrentStep(step);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              language={language}
            />

            <SyncStatusIndicator
              lastSavedTime={lastSavedTime}
              remoteSyncedTime={remoteSyncedTime}
              isSaving={isSaving}
              autoSavePulse={autoSavePulse}
              hasPendingChanges={hasPendingChanges}
              pendingChangesCount={pendingChangesCount}
              draftReturn={taxReturn}
              remoteReturn={remoteSyncedReturn}
              itemCounts={{
                slips: taxReturn.t4Slips.length,
                hasPersonalInfo: Boolean(taxReturn.personal.firstName && taxReturn.personal.lastName),
                hasDeductions: Boolean(taxReturn.deductions.rrspContributions || taxReturn.deductions.unionOrProfessionalDues),
              }}
              onForceSync={handleForceSync}
              onRevertToRemote={handleRevertToRemote}
              onApplyMerge={handleApplyMerge}
              syncError={remoteSyncError}
              onRetryRemoteSync={handleRetryRemoteSync}
              onExportJson={handleExportJson}
              language={language}
            />

            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                {isRefund ? (isFrench ? 'Remboursement estimé' : 'Estimated Refund') : (isFrench ? 'Solde à payer' : 'Balance Owing')}
              </span>
              <span className={`text-base font-mono font-black ${isRefund ? 'text-[#064e3b]' : 'text-[#0b1f3a]'}`}>
                {isRefund ? '+' : '-'}${Math.abs(estimatedRefund).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Quick Access: Guided App Tour */}
            <button
              id="header-app-tour-btn"
              onClick={() => setIsTourOpen(true)}
              title={isFrench ? 'Lancer la visite guidée' : 'Start App Tour'}
              className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0b1f3a] border border-blue-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-bold hidden md:inline">
                {isFrench ? 'Visite' : 'App Tour'}
              </span>
            </button>

            {/* Quick Access: Document Management Vault */}
            <button
              id="header-doc-vault-btn"
              onClick={() => setIsDmsOpen(true)}
              title={isFrench ? 'Ouvrir le coffre sécurisé de documents fiscaux' : 'Open Secure Tax Document Vault'}
              className="p-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0c2340] border border-teal-300 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <FolderLock className="w-4 h-4 text-[#064e3b]" />
              <span className="text-xs font-bold hidden md:inline">
                {isFrench ? 'Coffre Docs' : 'Doc Vault'}
              </span>
            </button>

            {/* Quick Access: TaxFile AI Assistant */}
            <button
              id="header-taxfile-assistant-btn"
              onClick={() => setIsAssistantOpen(true)}
              title={isFrench ? 'Discuter avec l’assistant TaxFile' : 'Ask TaxFile AI Assistant'}
              className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] border border-emerald-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Bot className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold hidden md:inline">
                TaxFile
              </span>
            </button>

            {/* Quick Access: Audit Trail Dashboard (For Accountants & Compliance) */}
            <button
              id="header-audit-dashboard-btn"
              onClick={() => setIsAuditDashboardOpen(true)}
              title={isFrench ? 'Ouvrir le tableau de bord du journal d’audit (CPA)' : 'Open Audit Trail Dashboard (CPA Compliance)'}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0b1f3a] border border-slate-300 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <History className="w-4 h-4 text-emerald-800" />
              <span className="text-xs font-bold hidden md:inline">
                {isFrench ? 'Journal d’Audit' : 'Audit Trail'}
              </span>
            </button>

            {/* Quick Access: Client Files Switcher & Preparer ID (CPA Multi-Client) */}
            <button
              id="header-client-files-btn"
              onClick={() => setIsClientFilesOpen(true)}
              title={isFrench ? 'Gérer les dossiers clients et no préparateur (CPA)' : 'Switch Client Files & Preparer ID'}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0b1f3a] border border-slate-300 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <UserCheck className="w-4 h-4 text-emerald-800" />
              <span className="text-xs font-bold hidden md:inline">
                {isFrench ? 'Clients' : 'Clients'}
              </span>
            </button>

            {/* Quick Access: Subscription & Billing with dynamic Trial Status badge */}
            <button
              id="header-subscription-btn"
              onClick={() => {
                setSubscriptionInitialTab(trialStatus.isExpired ? 'signup' : 'overview');
                setIsSubscriptionOpen(true);
              }}
              title={
                trialStatus.hasPaidSubscription
                  ? (isFrench ? 'Abonnement Pro Actif (29,99 $/an)' : 'Pro Subscription Active ($29.99/yr)')
                  : trialStatus.isExpired
                  ? (isFrench ? 'Essai expiré — Choisir un forfait' : 'Trial Expired — Select Plan')
                  : (isFrench ? `Essai gratuit actif (${trialStatus.formattedRemaining})` : `Free Trial Active (${trialStatus.formattedRemaining})`)
              }
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs ${
                trialStatus.hasPaidSubscription
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] border-emerald-300'
                  : trialStatus.isExpired
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                  : trialStatus.isExpiringSoon
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] border-emerald-300'
              }`}
            >
              <CreditCard className={`w-4 h-4 ${
                trialStatus.hasPaidSubscription
                  ? 'text-[#064e3b]'
                  : trialStatus.isExpired
                  ? 'text-rose-600'
                  : trialStatus.isExpiringSoon
                  ? 'text-amber-600'
                  : 'text-[#064e3b]'
              }`} />
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold leading-tight">
                  {trialStatus.hasPaidSubscription
                    ? (isFrench ? 'Pro Actif' : 'Pro Active')
                    : trialStatus.isExpired
                    ? (isFrench ? 'Essai Expiré' : 'Trial Expired')
                    : (isFrench ? 'Essai 1-Jour' : '1-Day Trial')}
                </span>
                {!trialStatus.hasPaidSubscription && (
                  <span className={`text-[9px] font-mono font-bold leading-none ${
                    trialStatus.isExpired
                      ? 'text-rose-700'
                      : trialStatus.isExpiringSoon
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}>
                    {trialStatus.isExpired
                      ? (isFrench ? 'Renouveler' : 'Upgrade')
                      : trialStatus.formattedRemaining.slice(0, 7)}
                  </span>
                )}
              </div>
            </button>

            {/* Print Tax Summary Button (Native Print / PDF Generation) with Watermark & QR Indicator */}
            <div className="flex items-center space-x-1">
              <button
                id="header-print-watermark-toggle-btn"
                onClick={handleToggleWatermarkAndQr}
                data-qr-visible={showOnScreenQr ? 'true' : 'false'}
                title={qrStatusTooltip}
                aria-label={qrStatusTooltip}
                className={`p-2 rounded-xl text-xs font-bold border transition-colors flex items-center space-x-1.5 cursor-pointer ${
                  includeWatermark
                    ? verificationData?.watermarkText === 'OFFICIAL'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-xs'
                      : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 shadow-xs'
                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsQrModalOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsQrModalOpen(true);
                    }
                  }}
                  title={
                    isFrench
                      ? 'Ouvrir le code QR grand format imprimable'
                      : 'Open full-resolution printable QR code modal'
                  }
                  aria-label={
                    isFrench
                      ? 'Ouvrir le code QR grand format imprimable'
                      : 'Open full-resolution printable QR code modal'
                  }
                  className="header-qr-icon-btn p-1 -m-1 rounded-lg hover:bg-black/10 active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 cursor-pointer flex items-center justify-center transition-all"
                >
                  <QrCode
                    className={`header-qr-icon w-3.5 h-3.5 transition-transform duration-500 ease-in-out transform ${
                      showOnScreenQr
                        ? verificationData?.watermarkText === 'OFFICIAL'
                          ? 'text-emerald-700 rotate-0 scale-110'
                          : 'text-amber-700 rotate-0 scale-110'
                        : 'text-slate-400 rotate-180 opacity-60 scale-95'
                    }`}
                  />
                </span>
                <span className="text-[10px] uppercase font-mono">
                  {includeWatermark ? verificationData?.watermarkText || 'DRAFT' : 'NO WM'}
                </span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold tracking-tight ${
                    showOnScreenQr
                      ? verificationData?.watermarkText === 'OFFICIAL'
                        ? 'bg-emerald-200/90 text-emerald-900 border border-emerald-300'
                        : 'bg-amber-200/90 text-amber-950 border border-amber-300'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                  title={
                    showOnScreenQr
                      ? isFrench ? 'Bloc QR visible à l’écran' : 'QR block visible on screen'
                      : isFrench ? 'Bloc QR masqué à l’écran' : 'QR block hidden on screen'
                  }
                >
                  {showOnScreenQr ? 'QR:ON' : 'QR:OFF'}
                </span>
              </button>

              <button
                id="header-print-tax-summary-btn"
                onClick={() => window.print()}
                title={
                  isFrench
                    ? 'Imprimer ou enregistrer en PDF le sommaire fiscal actuel'
                    : 'Print or save current tax summary as PDF via browser print dialog'
                }
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-bold hidden md:inline">
                  {isFrench ? 'Imprimer' : 'Print'}
                </span>
              </button>

              {/* Download Full Return as PDF (jsPDF Generated Formatted CRA T1 with Official Watermark) */}
              <button
                id="header-download-full-pdf-btn"
                onClick={handleDownloadFullReturnPdf}
                title={
                  isFrench
                    ? 'Télécharger la déclaration complète T1 en PDF officiel (jsPDF)'
                    : 'Download Full Formatted T1 Return as PDF with Official Watermark (jsPDF)'
                }
                className="p-2.5 rounded-xl bg-[#064e3b] hover:bg-[#08634c] text-white border border-emerald-500 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs font-bold"
              >
                <FileDown className="w-4 h-4 text-emerald-200" />
                <span className="text-xs font-bold hidden md:inline">
                  {isFrench ? 'PDF Complet' : 'Full Return PDF'}
                </span>
              </button>

              {/* Enhanced Share Button with Quick-Copy & Dynamic Draft/Official State */}
              <div className="relative inline-flex items-center" ref={shareMenuRef} id="header-share-group">
                {/* 1-Click Quick Copy Verification URL Button */}
                <button
                  id="header-quick-copy-verification-url-btn"
                  onClick={handleCopyVerificationUrl}
                  title={
                    isFrench
                      ? "Copier l'URL de vérification officielle dans le presse-papiers (accès rapide sans dialogue)"
                      : "Copy official CRA verification URL to clipboard (quick access without full dialog)"
                  }
                  className={`p-2.5 rounded-l-xl border-y border-l transition-colors cursor-pointer flex items-center justify-center ${
                    isOfficial
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  {hasCopiedUrl ? (
                    <Check className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-700" />
                  )}
                </button>

                {/* Main Dynamic Share Button */}
                <button
                  id="header-share-tax-summary-btn"
                  onClick={() => setIsShareMenuOpen((prev) => !prev)}
                  title={
                    isFrench
                      ? `Partager le sommaire fiscal (${isOfficial ? 'Officiel' : 'Brouillon'}) — Options de partage & copie d'URL`
                      : `Share tax summary (${isOfficial ? 'Official' : 'Draft'}) — Click for share & copy options`
                  }
                  className={`p-2.5 rounded-r-xl border transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs ${
                    isOfficial
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  {/* Distinct Icon Animation based on Draft vs Official state */}
                  <motion.span
                    className="inline-flex items-center justify-center relative"
                    animate={
                      isOfficial
                        ? {
                            rotate: [0, 15, -15, 0],
                            scale: [1, 1.18, 1],
                          }
                        : {
                            scale: [1, 1.12, 1],
                            y: [0, -2, 0],
                          }
                    }
                    transition={{
                      duration: isOfficial ? 2.4 : 2.0,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    {isOfficial ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <Share2 className="w-4 h-4 text-amber-800" />
                    )}
                    <span
                      className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white ${
                        isOfficial ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
                      }`}
                    />
                  </motion.span>

                  {/* Dynamic Text Label Toggle: Draft vs Official */}
                  <span className="text-xs font-bold hidden md:inline">
                    {isOfficial
                      ? isFrench
                        ? 'Partager (Officiel)'
                        : 'Share (Official)'
                      : isFrench
                      ? 'Partager (Brouillon)'
                      : 'Share (Draft)'}
                  </span>

                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isShareMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Rich Share & Quick Access Dropdown Menu */}
                <AnimatePresence>
                  {isShareMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      id="header-share-dropdown-menu"
                      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 px-2.5 z-50 overflow-hidden"
                    >
                      {/* State & Verification URL Header */}
                      <div className="px-3 py-2 border-b border-slate-100 mb-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                              isOfficial
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {isOfficial ? 'CRA OFFICIAL / FILED' : 'DRAFT PRE-SUBMISSION'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">T1-{taxReturn.taxYear || 2025}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 truncate font-mono">
                          {verificationData?.verificationUrl || 'https://cra-arc.gc.ca/eservices/verify-t1...'}
                        </p>
                      </div>

                      {/* Primary Actions Group */}
                      <div className="space-y-1">
                        {/* Option 1: Copy Verification URL directly */}
                        <button
                          type="button"
                          id="header-copy-verification-url-btn"
                          onClick={handleCopyVerificationUrl}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 text-slate-800 hover:text-emerald-950 transition-colors flex items-start space-x-2.5 cursor-pointer group"
                        >
                          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200 shrink-0 mt-0.5">
                            <Copy className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold flex items-center justify-between">
                              <span>{isFrench ? 'Copier l’URL de vérification' : 'Copy Verification URL'}</span>
                              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                                {isFrench ? 'DIRECT' : 'FAST'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                              {isFrench
                                ? 'Copie l’URL officielle directement dans le presse-papiers'
                                : 'Copies cryptographic CRA verify link without native share sheet'}
                            </p>
                          </div>
                        </button>

                        {/* Option 2: Printable Verification QR Code Modal (For Accountants) */}
                        <button
                          type="button"
                          id="header-open-printable-qr-modal-btn"
                          onClick={handleOpenQrModal}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-teal-50 text-slate-800 hover:text-teal-950 transition-colors flex items-start space-x-2.5 cursor-pointer group"
                        >
                          <div className="p-1.5 rounded-lg bg-teal-100 text-teal-800 group-hover:bg-teal-200 shrink-0 mt-0.5">
                            <QrCode className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold flex items-center justify-between">
                              <span>{isFrench ? 'Code QR de vérification imprimable' : 'Printable QR Verification Code'}</span>
                              <span className="text-[9px] font-bold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-mono">
                                {isFrench ? 'COMPTABLE' : 'CPA / AUDIT'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                              {isFrench
                                ? 'Fiche haute résolution prête à imprimer ou scanner physiquement'
                                : 'High-res slip for easy physical scanning by accountants'}
                            </p>
                          </div>
                        </button>

                        {/* Option 3: Native Share Dialog */}
                        <button
                          type="button"
                          id="header-share-native-dialog-btn"
                          onClick={handleShareTaxSummary}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-800 transition-colors flex items-start space-x-2.5 cursor-pointer group"
                        >
                          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-800 group-hover:bg-blue-200 shrink-0 mt-0.5">
                            <Share2 className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold">
                              {isFrench ? 'Ouvrir le partage natif' : 'Open Native Share Dialog'}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                              {isFrench
                                ? 'Partage système avec texte fiscal, lien et fichier TXT'
                                : 'System share sheet with financial details & link'}
                            </p>
                          </div>
                        </button>

                        {/* Option 4: Copy Plain Text Summary */}
                        <button
                          type="button"
                          id="header-copy-plain-text-summary-btn"
                          onClick={handleCopyPlainTextSummary}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-800 transition-colors flex items-start space-x-2.5 cursor-pointer group"
                        >
                          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-200 shrink-0 mt-0.5">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold">
                              {isFrench ? 'Copier le sommaire brut' : 'Copy Plain Text Summary'}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                              {isFrench
                                ? 'Lignes 15000, 23600, 43500 et solde dû/remboursement'
                                : 'Formatted T1 financial summary ready to paste'}
                            </p>
                          </div>
                        </button>
                      </div>

                      {/* State Toggle Section */}
                      <div className="pt-2 mt-2 border-t border-slate-100">
                        <button
                          type="button"
                          id="header-toggle-filing-state-btn"
                          onClick={handleToggleFilingState}
                          className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-between text-[11px] font-semibold cursor-pointer"
                        >
                          <span className="flex items-center space-x-1.5">
                            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                            <span>{isFrench ? 'Basculer état (Brouillon ↔ Officiel)' : 'Toggle State (Draft ↔ Official)'}</span>
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 font-bold">
                            {isOfficial ? '→ Draft' : '→ Official'}
                          </span>
                        </button>
                      </div>

                      {/* Share Log Section (For Auditing Transparency) */}
                      <div className="pt-2 mt-2 border-t border-slate-100" id="header-share-audit-log-section">
                        <div className="flex items-center justify-between px-2 pb-1.5">
                          <div className="flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                              {isFrench ? 'Journal de Partage' : 'Share Log'}
                            </span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {shareLogs.length}
                            </span>
                          </div>

                          {shareLogs.length > 0 && (
                            <button
                              type="button"
                              id="header-clear-share-logs-btn"
                              onClick={handleClearShareLogs}
                              title={isFrench ? 'Effacer l’historique des partages' : 'Clear share history'}
                              className="text-[10px] text-slate-400 hover:text-rose-600 flex items-center space-x-1 transition-colors cursor-pointer px-1 py-0.5 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>{isFrench ? 'Effacer' : 'Clear'}</span>
                            </button>
                          )}
                        </div>

                        {shareLogs.length === 0 ? (
                          <div className="px-3 py-2 text-[11px] text-slate-400 italic bg-slate-50 rounded-xl text-center border border-dashed border-slate-200">
                            {isFrench
                              ? 'Aucun partage enregistré pour cette déclaration'
                              : 'No previous shares recorded for this return'}
                          </div>
                        ) : (
                          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-0.5 mt-1" id="header-share-logs-list">
                            {shareLogs.map((log) => (
                              <div
                                key={log.id}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 text-[11px] transition-colors flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-slate-800 truncate">
                                    {isFrench ? log.destinationFr : log.destination}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-500">
                                    {log.formattedTime}
                                  </div>
                                </div>
                                <span
                                  className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                    log.documentState === 'Official'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {log.documentState}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* 1-Day Free Trial Active or Expired Top Banner */}
        <TrialBanner
          currentUser={currentAuthUser}
          onOpenSubscription={() => {
            setSubscriptionInitialTab(trialStatus.isExpired ? 'signup' : 'overview');
            setIsSubscriptionOpen(true);
          }}
          language={language}
          onUserUpdate={(updated) => {
            setCurrentAuthUser(updated);
            setTrialStatus(getTrialStatus(updated));
          }}
        />

        {/* Step Body Content with Trial Restriction Paywall */}
        <main
          className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto"
          data-include-watermark={includeWatermark ? 'true' : 'false'}
          data-watermark-text={verificationData?.watermarkText || 'DRAFT'}
        >
          {/* If the 1-Day Free Trial has expired and user lacks paid subscription, restrict access */}
          {trialStatus.isExpired && !trialStatus.hasPaidSubscription ? (
            <TrialExpiredPaywall
              currentUser={currentAuthUser}
              onOpenSubscriptionModal={() => {
                setSubscriptionInitialTab('signup');
                setIsSubscriptionOpen(true);
              }}
              language={language}
              onUserUpdate={(updated) => {
                setCurrentAuthUser(updated);
                setTrialStatus(getTrialStatus(updated));
              }}
            />
          ) : (
            <>
              {/* Professional 'Official Tax Summary' Header (Injected exclusively in print/PDF output) */}
              <div
                id="print-official-tax-summary-header"
                className="hidden print-only print-official-header print-official-tax-summary-header mb-6 pb-3 border-b-2 border-[#064e3b]"
              >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-[#064e3b] text-white flex items-center justify-center font-bold text-xs shrink-0">
                CRA
              </div>
              <div>
                <div className="header-badge text-[7.5pt] font-mono uppercase tracking-widest text-slate-600 font-bold">
                  {isFrench
                    ? 'GOUVERNEMENT DU CANADA • AGENCE DU REVENU DU CANADA'
                    : 'GOVERNMENT OF CANADA • CANADA REVENUE AGENCY'}
                </div>
                <div className="header-title text-[13pt] font-black tracking-tight text-slate-900">
                  {isFrench ? 'Sommaire Officiel de Déclaration de Revenus' : 'Official Tax Summary'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right text-[8pt] font-mono text-slate-600 shrink-0">
                <div className="font-bold text-[#064e3b]">FORM T1 GENERAL • {taxReturn.taxYear || 2025}</div>
                <div className="text-slate-500">
                  {taxReturn.personal?.province || 'ON'} • {taxReturn.personal?.firstName} {taxReturn.personal?.lastName}
                </div>
                {verificationData?.documentHash && (
                  <div className="text-[6.5pt] text-slate-500 truncate max-w-[150px]">
                    SHA: {verificationData.documentHash.slice(0, 16)}...
                  </div>
                )}
              </div>

              {/* Vector QR code injected via CSS print stylesheet pseudo-element */}
              <div
                className={`print-verification-qr official-tax-qr-block shrink-0 ${!showOnScreenQr ? 'screen-qr-hidden' : ''}`}
                data-print-qr="true"
                data-screen-qr={showOnScreenQr ? 'visible' : 'hidden'}
                title={
                  isFrench
                    ? `Code QR de vérification cryptographique ARC • Statut : ${showOnScreenQr ? 'Affiché à l’écran' : 'Masqué à l’écran'}`
                    : `CRA Cryptographic Document Verification QR Code • Status: ${showOnScreenQr ? 'Visible on screen' : 'Hidden on screen'}`
                }
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-full"
            >
              {currentStep === 1 && (
                <StepEligibility
                  taxReturn={taxReturn}
                  onUpdateTaxReturn={handleUpdateTaxReturn}
                  onNext={handleNextStep}
                  onOpenScanner={() => setIsScannerOpen(true)}
                  onLoadDemo={handleLoadDemo}
                  language={language}
                />
              )}

              {currentStep === 2 && (
                <StepDocuments
                  taxReturn={taxReturn}
                  onUpdateTaxReturn={handleUpdateTaxReturn}
                  onOpenScanner={(tab) => {
                    setScannerTab(tab || 'samples');
                    setScannerSlipType('T4');
                    setIsScannerOpen(true);
                  }}
                  onOpenScannerWithSlip={(slipCode, tab) => {
                    setScannerTab(tab || 'samples');
                    setScannerSlipType(slipCode);
                    setIsScannerOpen(true);
                  }}
                  onOpenDMS={() => setIsDmsOpen(true)}
                  onNext={handleNextStep}
                  language={language}
                />
              )}

              {currentStep === 3 && (
                <StepPersonal
                  taxReturn={taxReturn}
                  onUpdateTaxReturn={handleUpdateTaxReturn}
                  onNext={handleNextStep}
                  language={language}
                />
              )}

              {currentStep === 4 && (
                <StepFamily
                  taxReturn={taxReturn}
                  onUpdateTaxReturn={handleUpdateTaxReturn}
                  onNext={handleNextStep}
                  language={language}
                />
              )}

              {currentStep === 5 && (
                <StepIncome
                  taxReturn={taxReturn}
                  onUpdateTaxReturn={handleUpdateTaxReturn}
                  onOpenScanner={() => {
                    setScannerSlipType('T4');
                    setIsScannerOpen(true);
                  }}
                  onOpenScannerWithSlip={(slipCode) => {
                    setScannerSlipType(slipCode);
                    setIsScannerOpen(true);
                  }}
                  onNext={handleNextStep}
                  language={language}
                />
              )}

              {currentStep === 6 && (
                <StepDeductions
                  taxReturn={taxReturn}
                  onUpdateTaxReturn={handleUpdateTaxReturn}
                  onNext={handleNextStep}
                  language={language}
                />
              )}

              {currentStep === 7 && (
                <StepReview
                  taxReturn={taxReturn}
                  onUpdateTaxReturn={handleUpdateTaxReturn}
                  onOpenJudge={() => setIsJudgeOpen(true)}
                  onSelectStep={(step) => {
                    setCurrentStep(step);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onNext={handleNextStep}
                  language={language}
                  includeWatermark={includeWatermark}
                  onToggleWatermark={setIncludeWatermark}
                  verificationData={verificationData}
                  remoteReturn={remoteSyncedReturn || undefined}
                  onApplyMerge={handleApplyMerge}
                  onOpenAuditDashboard={() => setIsAuditDashboardOpen(true)}
                />
              )}

              {currentStep === 8 && (
                <ErrorBoundary
                  fallback={
                    <div id="step-calc-error-boundary" className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-center font-medium my-6 shadow-sm">
                      An error occurred in calculation steps.
                    </div>
                  }
                >
                  <StepCalculation
                    taxReturn={taxReturn}
                    onNext={handleNextStep}
                    language={language}
                  />
                </ErrorBoundary>
              )}

              {currentStep === 9 && (
                <StepFiling
                  taxReturn={taxReturn}
                  onUpdateTaxReturn={handleUpdateTaxReturn}
                  onSelectStep={(step) => {
                    setCurrentStep(step);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  language={language}
                />
              )}

              {currentStep === 10 && (
                <StepHistory
                  taxReturn={taxReturn}
                  onRestoreTaxReturn={(restored) => setTaxReturn(restored)}
                  onResetReturn={handleResetReturn}
                  language={language}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Professional Formal Timestamp & Pagination Footer (Injected exclusively in print/PDF output) */}
          <div
            id="print-official-tax-summary-footer"
            className="hidden print:flex print-official-footer print-official-tax-summary-footer mt-8 pt-4 border-t border-slate-300 flex items-center justify-between text-[7.5pt] font-mono text-slate-600"
          >
            <div className="footer-legal flex items-center space-x-2">
              <span>
                {isFrench
                  ? 'Sommaire Officiel • Conservez pour vérification de l’ARC (période légale de 6 ans)'
                  : 'Official Tax Summary • Certified T1 Return • Retain all records for 6-year CRA statutory audit trail'}
              </span>
              {verificationData?.documentHash && (
                <span className="text-[6.5pt] text-slate-500 font-mono">
                  • SHA: {verificationData.documentHash.slice(0, 16)}...
                </span>
              )}
            </div>
            <div className="footer-meta flex items-center space-x-4">
              <span className="text-[7pt] text-slate-500 font-bold uppercase">
                {verificationData?.watermarkText === 'OFFICIAL' ? 'STATUS: OFFICIAL (CRA FILED)' : 'STATUS: DRAFT (PRE-SUBMISSION)'}
              </span>
              <span className="print-timestamp font-medium">
                {isFrench ? 'Horodatage : ' : 'Timestamp: '}
                {printTimestamp}
              </span>
              <span className="print-page-counter font-bold text-slate-900 border-l border-slate-300 pl-3">
                {/* Handled via CSS counter-increment: page-number; content: "Page " counter(page-number) */}
              </span>
            </div>
          </div>
          </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 no-print">
          <div className="flex flex-col sm:flex-row items-center justify-between max-w-5xl mx-auto gap-2">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[#064e3b]">TAX EASY FILLING APP</span>
              <span>•</span>
              <span>{isFrench ? 'Édition Fiscale 2025' : '2025 Canadian Tax Edition'}</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsResourcesOpen(true)}
                className="hover:text-[#064e3b] transition-colors"
              >
                {isFrench ? 'Avis Juridique & ARC' : 'CRA Legal Disclaimer'}
              </button>
              <span>•</span>
              <button
                onClick={() => setIsInstallOpen(true)}
                className="hover:text-[#064e3b] transition-colors"
              >
                {isFrench ? 'Installer sur Mobile' : 'Download for Android & iOS'}
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Computer Vision Scanner Modal */}
      <ComputerVisionModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onApplyExtractedT4={handleApplyExtractedT4}
        onApplyExtractedSlip={handleApplyExtractedSlip}
        initialSlipType={scannerSlipType}
        initialTab={scannerTab}
        language={language}
      />

      {/* Floating A2A Multi-Agent Judge Modal */}
      <A2AJudgeModal
        isOpen={isJudgeOpen}
        onClose={() => setIsJudgeOpen(false)}
        taxReturn={taxReturn}
        onApplyHealedReturn={(healed) => {
          setTaxReturn(healed);
          setIsJudgeOpen(false);
        }}
        language={language}
      />

      {/* Floating AI Tax Assistant Modal */}
      <TaxAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        taxReturn={taxReturn}
        language={language}
      />

      {/* Secure Tax Document Management System Vault */}
      <DocumentManagementModal
        isOpen={isDmsOpen}
        onClose={() => setIsDmsOpen(false)}
        taxReturn={taxReturn}
        onUpdateTaxReturn={setTaxReturn}
        onNavigateToStep={(step) => {
          setCurrentStep(step);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenScanner={() => setIsScannerOpen(true)}
        language={language}
        initialSection={dmsInitialSection}
      />

      {/* Interactive App Tour Modal */}
      <AppTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        language={language}
        onNavigateToStep={(step) => {
          setCurrentStep(step);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenDMS={() => setIsDmsOpen(true)}
      />

      {/* Floating PWA Install Modal */}
      <PwaInstallModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
        language={language}
      />

      {/* Printable High-Resolution QR Code Modal for Accountants */}
      <PrintableQrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        verificationData={verificationData}
        taxReturn={taxReturn}
        language={language}
        onLogShare={logShareEvent}
      />

      {/* Chronological, Filterable CPA Audit Trail Dashboard Modal */}
      <AuditTrailDashboardModal
        isOpen={isAuditDashboardOpen}
        onClose={() => setIsAuditDashboardOpen(false)}
        taxReturn={taxReturn}
        onUpdateTaxReturn={(updated) => setTaxReturn((prev) => ({ ...prev, ...updated }))}
        language={language}
      />

      {/* Client File Manager & Preparer ID Modal for Accountants */}
      <ClientFileManagerModal
        isOpen={isClientFilesOpen}
        onClose={() => setIsClientFilesOpen(false)}
        currentTaxReturn={taxReturn}
        onSwitchClient={(loadedReturn) => {
          setTaxReturn(loadedReturn);
          setShareFeedback({
            show: true,
            message: isFrench
              ? `Dossier client chargé : ${loadedReturn.personal.firstName} ${loadedReturn.personal.lastName}`
              : `Switched to client: ${loadedReturn.personal.firstName} ${loadedReturn.personal.lastName} (${loadedReturn.clientId})`,
            type: 'success',
          });
          setTimeout(() => setShareFeedback(null), 4000);
        }}
        language={language}
      />

      {/* Subscription & Billing Modal ($29.99/Year Pro Access, Sign Up & Sign In, 1-Day Trial, Password Reset) */}
      <SubscriptionBillingModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
        language={language}
        initialTab={subscriptionInitialTab}
        onUserUpdate={(updated) => {
          setCurrentAuthUser(updated);
          setTrialStatus(getTrialStatus(updated));
        }}
      />

      {/* Google Cloud Firebase Firestore Live Sync & Database Modal */}
      <FirebaseModal
        isOpen={isFirebaseOpen}
        onClose={() => setIsFirebaseOpen(false)}
        taxReturn={taxReturn}
        onUpdateTaxReturn={setTaxReturn}
        language={language}
      />

      {/* Floating CRA Resources & FAQ Modal */}
      <CRAOfficialResourcesModal
        isOpen={isResourcesOpen}
        onClose={() => setIsResourcesOpen(false)}
        language={language}
      />

      {/* Clear Data Confirmation & Backup Modal */}
      <ClearDataModal
        isOpen={isClearDataOpen}
        onClose={() => setIsClearDataOpen(false)}
        onConfirmReset={handleExecuteReset}
        taxReturn={taxReturn}
        language={language}
      />

      {/* Real-Time Local Storage Sync Confirmation Toast */}
      <SyncToast
        isVisible={showSyncToast}
        onDismiss={() => setShowSyncToast(false)}
        timestamp={lastSavedTime}
        language={language}
      />

      {/* 15-Minute Inactivity Session Timeout Warning Modal */}
      <SessionTimeoutModal
        isOpen={isSessionWarningOpen}
        onExtendSession={extendSession}
        onSaveSession={handleForceSync}
        taxReturn={taxReturn}
        language={language}
      />

      {/* Share Tax Summary Feedback Toast */}
      <AnimatePresence>
        {shareFeedback?.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            id="share-feedback-toast"
            className="fixed top-20 right-4 z-50 max-w-sm p-4 rounded-xl shadow-xl border bg-white border-slate-200 flex items-start space-x-3"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#064e3b] flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4 text-[#064e3b]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900">
                {isFrench ? 'Sommaire fiscal partagé' : 'Tax Summary Share'}
              </div>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {shareFeedback.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShareFeedback(null)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <span className="sr-only">Close</span>
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
