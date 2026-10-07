import React, { useState, useMemo } from 'react';
import {
  Camera,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  Building,
  Sparkles,
  ArrowRight,
  Search,
  X,
  Filter,
  Check,
  Tag,
  ExternalLink,
  BookOpen,
  Download,
  Printer,
  Pencil,
  Briefcase,
  PiggyBank,
  TrendingUp,
  RotateCcw,
  RefreshCw,
  PenTool,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  Maximize2,
  FolderLock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppTaxReturn, T4Slip, OtherIncomeSlip, ScannedDocumentAssociation, SlipType } from '../types/tax';
import { exportTaxSlipsDocument } from '../utils/exportUtils';
import { SlipEditModal, EditableSlip } from './SlipEditModal';
import { DocuSignModal } from './DocuSignModal';
import { validateAllDocumentSlips } from '../utils/t4ValidationUtils';
import { DocumentScanIndicator } from './DocumentScanIndicator';
import { ALL_19_TAX_SLIPS, TaxSlipDefinition, SlipCategory, getSlipMetadataByCode } from '../services/taxSlipsDirectory';

interface StepDocumentsProps {
  taxReturn: AppTaxReturn;
  onUpdateTaxReturn: (updated: Partial<AppTaxReturn>) => void;
  onOpenScanner: (tab?: 'samples' | 'upload' | 'camera') => void;
  onOpenScannerWithSlip?: (slipCode: SlipType, tab?: 'samples' | 'upload' | 'camera') => void;
  onOpenDMS?: () => void;
  onNext: () => void;
  language: 'en' | 'fr';
}

export interface TaxSlipMeta {
  code: SlipType;
  category: SlipCategory;
  titleEn: string;
  titleFr: string;
  descriptionEn: string;
  descriptionFr: string;
  issuerEn: string;
  issuerFr: string;
  keyBoxes: { box: string; nameEn: string; nameFr: string }[];
  accentColor: string;
}

const ALL_REQUIRED_SLIPS: TaxSlipMeta[] = ALL_19_TAX_SLIPS.map((slip) => ({
  code: slip.code,
  category: slip.category,
  titleEn: slip.titleEn,
  titleFr: slip.titleFr,
  descriptionEn: slip.descriptionEn,
  descriptionFr: slip.descriptionFr,
  issuerEn: slip.issuerEn,
  issuerFr: slip.issuerFr,
  keyBoxes: slip.keyBoxes.map((kb) => ({
    box: kb.box,
    nameEn: kb.nameEn,
    nameFr: kb.nameFr,
  })),
  accentColor: slip.accentColor,
}));

export const StepDocuments: React.FC<StepDocumentsProps> = ({
  taxReturn,
  onUpdateTaxReturn,
  onOpenScanner,
  onOpenScannerWithSlip,
  onOpenDMS,
  onNext,
  language,
}) => {
  const isFrench = language === 'fr';

  // Search and filter state for required slips
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedSlipDetail, setSelectedSlipDetail] = useState<TaxSlipMeta | null>(null);

  // Active slip tabs & modal edit state for T4, T4A, and T5
  const [activeSlipsTab, setActiveSlipsTab] = useState<'all' | 'T4' | 'T4A' | 'T5'>('all');
  const [editingSlip, setEditingSlip] = useState<EditableSlip | null>(null);

  // DocuSign E-Signature Pipeline Modal State
  const [selectedDocForSignature, setSelectedDocForSignature] = useState<ScannedDocumentAssociation | null>(null);
  const [isDocuSignOpen, setIsDocuSignOpen] = useState<boolean>(false);
  const quickFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Expandable Thumbnail Preview State for Scanned Documents
  const [expandedDocIds, setExpandedDocIds] = useState<Record<string, boolean>>({});
  const toggleExpandDoc = (id: string) => {
    setExpandedDocIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const t4Slips = taxReturn.t4Slips || [];
  const otherSlips = taxReturn.otherSlips || [];
  const t4aSlips = otherSlips.filter((s) => s.type === 'T4A');
  const t5Slips = otherSlips.filter((s) => s.type === 'T5');
  const totalSlipsCount = t4Slips.length + t4aSlips.length + t5Slips.length;

  // CRA T4 slip layout constraint validation
  const validationSummary = useMemo(() => {
    return validateAllDocumentSlips(t4Slips, taxReturn.personal?.sin, language);
  }, [t4Slips, taxReturn.personal?.sin, language]);

  const [validationAttempted, setValidationAttempted] = useState<boolean>(false);

  const handleAttemptNext = () => {
    setValidationAttempted(true);
    if (!validationSummary.canProceed) {
      const panel = document.getElementById('cra-layout-validation-panel');
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    onNext();
  };

  // Add a new manual T4 slip
  const handleAddManualT4 = () => {
    const newT4: T4Slip = {
      id: `t4-manual-${Date.now()}`,
      employerName: isFrench ? 'Nouvel Employeur T4' : 'New Employer T4',
      box14_employmentIncome: 48000,
      box16_cppContributions: 2800,
      box18_eiPremiums: 850,
      box20_rppContributions: 0,
      box22_incomeTaxDeducted: 7200,
      box24_eiInsurableEarnings: 48000,
      box26_cppPensionableEarnings: 48000,
      box44_unionDues: 0,
      box52_pensionAdjustment: 0,
      verifiedByUser: true,
    };
    onUpdateTaxReturn({
      t4Slips: [...t4Slips, newT4],
    });
  };

  // Add a new manual T4A slip
  const handleAddManualT4A = () => {
    const newT4A: OtherIncomeSlip = {
      id: `t4a-manual-${Date.now()}`,
      type: 'T4A',
      payerName: isFrench ? 'Régime de retraite / Payer T4A' : 'Pension / Annuity Payer T4A',
      description: isFrench
        ? 'État du revenu de pension, de retraite, de rente ou d’autres sources'
        : 'Statement of Pension, Retirement, Annuity, and Other Income',
      amounts: {
        box016_pension: 12000,
        box022_taxDeducted: 1500,
        box020_commissions: 0,
        box028_otherIncome: 0,
        box105_scholarships: 0,
      },
      verifiedByUser: true,
    };
    onUpdateTaxReturn({
      otherSlips: [...otherSlips, newT4A],
    });
  };

  // Add a new manual T5 slip
  const handleAddManualT5 = () => {
    const newT5: OtherIncomeSlip = {
      id: `t5-manual-${Date.now()}`,
      type: 'T5',
      payerName: isFrench ? 'Banque / Émetteur T5' : 'Bank / Investment Issuer T5',
      description: isFrench
        ? 'État des revenus de placements (intérêts et dividendes)'
        : 'Statement of Investment Income',
      amounts: {
        box13_interest: 850,
        box10_eligibleDividends: 0,
        box11_taxableDividends: 0,
        box24_capitalGains: 0,
      },
      verifiedByUser: true,
    };
    onUpdateTaxReturn({
      otherSlips: [...otherSlips, newT5],
    });
  };

  // Delete handlers
  const handleDeleteT4 = (id: string) => {
    const updated = t4Slips.filter((s) => s.id !== id);
    onUpdateTaxReturn({ t4Slips: updated });
  };

  const handleDeleteOtherSlip = (id: string) => {
    const updated = otherSlips.filter((s) => s.id !== id);
    onUpdateTaxReturn({ otherSlips: updated });
  };

  // Save handlers for modal editing
  const handleSaveModalT4 = (updated: T4Slip) => {
    const nextList = t4Slips.map((s) => (s.id === updated.id ? updated : s));
    onUpdateTaxReturn({ t4Slips: nextList });
  };

  const handleSaveModalOtherSlip = (updated: OtherIncomeSlip) => {
    const nextList = otherSlips.map((s) => (s.id === updated.id ? updated : s));
    onUpdateTaxReturn({ otherSlips: nextList });
  };

  const handleExportSlips = () => {
    exportTaxSlipsDocument(taxReturn);
  };

  const handlePrintSlips = () => {
    window.print();
  };

  const getScanForCode = (code: string): ScannedDocumentAssociation | undefined => {
    return (taxReturn.scannedDocuments || []).find(
      (s) => s.documentCode.toUpperCase() === code.toUpperCase()
    );
  };

  const handleUpdateScan = (
    docCode: string,
    docName: string,
    updatedScan: ScannedDocumentAssociation | null
  ) => {
    const currentScans = taxReturn.scannedDocuments || [];
    let newScans: ScannedDocumentAssociation[];
    if (!updatedScan) {
      newScans = currentScans.filter(
        (s) => s.documentCode.toUpperCase() !== docCode.toUpperCase()
      );
    } else {
      const idx = currentScans.findIndex(
        (s) => s.documentCode.toUpperCase() === docCode.toUpperCase()
      );
      if (idx >= 0) {
        newScans = [...currentScans];
        newScans[idx] = updatedScan;
      } else {
        newScans = [...currentScans, updatedScan];
      }
    }
    onUpdateTaxReturn({ scannedDocuments: newScans });
  };

  // Evaluate document validation status and detect missing CRA fields
  const getDocumentValidation = (doc: ScannedDocumentAssociation) => {
    // Check if explicitly marked
    if (doc.missingFields && doc.missingFields.length > 0) {
      return {
        isValidated: false,
        requiresRescan: true,
        missingFields: doc.missingFields,
      };
    }

    const missing: string[] = [];
    const code = doc.documentCode.toUpperCase();

    if (code === 'T4') {
      const t4 =
        taxReturn.t4Slips?.find((s) => s.sourceDocumentId === doc.id) ||
        taxReturn.t4Slips?.[0];

      if (!t4) {
        missing.push(isFrench ? 'Données T4 absentes' : 'T4 Data Missing');
        missing.push(isFrench ? 'Nom de l’employeur' : 'Employer Legal Name');
        missing.push(isFrench ? 'Case 14 (Revenus)' : 'Box 14 (Income)');
      } else {
        if (!t4.employerName || t4.employerName.trim() === '') {
          missing.push(isFrench ? 'Nom employeur manquant' : 'Employer Name Missing');
        }
        if (!t4.box14_employmentIncome || t4.box14_employmentIncome <= 0) {
          missing.push(isFrench ? 'Case 14 (Revenus d’emploi)' : 'Box 14 (Employment Income)');
        }
        if (t4.box18_eiPremiums > 0 && (!t4.box24_eiInsurableEarnings || t4.box24_eiInsurableEarnings <= 0)) {
          missing.push(isFrench ? 'Case 24 (Gains assurables AE)' : 'Box 24 (EI Insurable Earnings)');
        }
      }
    } else if (code === 'T4A') {
      const t4a =
        taxReturn.otherSlips?.find((s) => s.type === 'T4A' && (s.sourceDocumentId === doc.id || true)) ||
        taxReturn.otherSlips?.find((s) => s.type === 'T4A');

      if (!t4a) {
        missing.push(isFrench ? 'Nom du payeur' : 'Payer Legal Name');
        missing.push(isFrench ? 'Montant Case 016/028' : 'Box 016/028 Amount');
      } else {
        if (!t4a.payerName || t4a.payerName.trim() === '') {
          missing.push(isFrench ? 'Nom du payeur' : 'Payer Legal Name');
        }
        const hasAmount = Object.values(t4a.amounts || {}).some(
          (val) => typeof val === 'number' && val > 0
        );
        if (!hasAmount) {
          missing.push(isFrench ? 'Montant de revenu' : 'Income Amount');
        }
      }
    } else if (code === 'T5') {
      const t5 =
        taxReturn.otherSlips?.find((s) => s.type === 'T5' && (s.sourceDocumentId === doc.id || true)) ||
        taxReturn.otherSlips?.find((s) => s.type === 'T5');

      if (!t5) {
        missing.push(isFrench ? 'Institution financière' : 'Financial Institution Payer');
        missing.push(isFrench ? 'Revenus d’intérêts/dividendes' : 'Investment Income Amount');
      } else {
        if (!t5.payerName || t5.payerName.trim() === '') {
          missing.push(isFrench ? 'Nom de l’émetteur' : 'Issuer Legal Name');
        }
        const hasAmount = Object.values(t5.amounts || {}).some(
          (val) => typeof val === 'number' && val > 0
        );
        if (!hasAmount) {
          missing.push(isFrench ? 'Case 13 ou Dividendes' : 'Box 13 Interest / Dividends');
        }
      }
    } else if (code === 'RRSP') {
      if (!taxReturn.deductions?.rrspContributions || taxReturn.deductions.rrspContributions <= 0) {
        missing.push(isFrench ? 'Cotisation REER' : 'RRSP Contribution Amount');
      }
    } else if (code === 'T2202') {
      if (!taxReturn.credits?.tuitionFeesT2202 || taxReturn.credits.tuitionFeesT2202 <= 0) {
        missing.push(isFrench ? 'Frais de scolarité admissibles' : 'Eligible Tuition Fees');
      }
    }

    if (doc.ocrConfidence !== undefined && doc.ocrConfidence < 70) {
      missing.push(isFrench ? 'Qualité OCR faible (<70%)' : 'Low OCR Quality (<70%)');
    }

    const requiresRescan = missing.length > 0;
    return {
      isValidated: !requiresRescan,
      requiresRescan,
      missingFields: missing,
    };
  };

  // Launch DocuSign E-Signature Pipeline Confirmation Modal
  const handleOpenSignature = (doc?: ScannedDocumentAssociation | { code: SlipType; name: string; id?: string }) => {
    if (doc && 'fileName' in doc) {
      setSelectedDocForSignature(doc as ScannedDocumentAssociation);
      setIsDocuSignOpen(true);
      return;
    }

    if (doc && 'code' in doc) {
      const existing = taxReturn.scannedDocuments?.find((s) => s.documentCode === doc.code);
      if (existing) {
        setSelectedDocForSignature(existing);
      } else {
        const syntheticDoc: ScannedDocumentAssociation = {
          id: doc.id || `doc_slip_${doc.code.toLowerCase()}_${Date.now()}`,
          documentCode: doc.code,
          documentName: doc.name,
          fileName: `${doc.code}_Statement_2025.pdf`,
          fileType: 'pdf',
          fileSize: '342 KB',
          scannedAt: new Date().toISOString(),
          status: 'verified',
          ocrConfidence: 98,
        };
        setSelectedDocForSignature(syntheticDoc);
      }
      setIsDocuSignOpen(true);
      return;
    }

    const targetDoc = (taxReturn.scannedDocuments && taxReturn.scannedDocuments[0]) || {
      id: 'doc_slip_default_t4',
      documentCode: 'T4' as SlipType,
      documentName: 'T4 Statement of Remuneration Paid',
      fileName: 'T4_Tax_Slip_2025.pdf',
      fileType: 'pdf' as const,
      fileSize: '342 KB',
      scannedAt: new Date().toISOString(),
      status: 'verified' as const,
      ocrConfidence: 98,
    };
    setSelectedDocForSignature(targetDoc);
    setIsDocuSignOpen(true);
  };

  const handleSignatureCompleted = (envelopeId: string, docId: string) => {
    const currentScans = taxReturn.scannedDocuments || [];
    const updatedScans = currentScans.map((s) =>
      s.id === docId
        ? {
            ...s,
            status: 'verified' as const,
            isValidated: true,
            eSignatureStatus: 'signed' as const,
            signedEnvelopeId: envelopeId,
          }
        : s
    );
    onUpdateTaxReturn({ scannedDocuments: updatedScans });
  };

  // Direct upload for any tax slip document
  const handleDirectFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const detectedType: 'pdf' | 'image' =
      file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';

    const upper = file.name.toUpperCase();
    let code: SlipType = 'T4';
    if (upper.includes('T4A')) code = 'T4A';
    else if (upper.includes('T5008')) code = 'T5008';
    else if (upper.includes('T5')) code = 'T5';
    else if (upper.includes('RRSP') || upper.includes('REER')) code = 'RRSP';
    else if (upper.includes('T3')) code = 'T3';
    else if (upper.includes('T2202')) code = 'T2202';
    else if (upper.includes('T4E')) code = 'T4E';
    else if (upper.includes('FHSA')) code = 'T4FHSA';

    const newScan: ScannedDocumentAssociation = {
      id: `doc_scan_${code.toLowerCase()}_${Date.now()}`,
      documentCode: code,
      documentName: `${code} Slip`,
      fileName: file.name,
      fileType: detectedType,
      fileSize: `${(file.size / 1024).toFixed(0)} KB`,
      scannedAt: new Date().toISOString(),
      status: 'verified',
      ocrConfidence: 97,
    };

    handleUpdateScan(code, `${code} Slip`, newScan);
    e.target.value = '';
  };

  // Filter required slips based on search query and category
  const filteredSlips = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return ALL_REQUIRED_SLIPS.filter((slip) => {
      // Category filter
      if (activeCategory !== 'all' && slip.category !== activeCategory) {
        return false;
      }

      // Search query filter
      if (!q) return true;

      const matchCode = slip.code.toLowerCase().includes(q);
      const matchTitleEn = slip.titleEn.toLowerCase().includes(q);
      const matchTitleFr = slip.titleFr.toLowerCase().includes(q);
      const matchDescEn = slip.descriptionEn.toLowerCase().includes(q);
      const matchDescFr = slip.descriptionFr.toLowerCase().includes(q);
      const matchIssuerEn = slip.issuerEn.toLowerCase().includes(q);
      const matchIssuerFr = slip.issuerFr.toLowerCase().includes(q);
      const matchBoxes = slip.keyBoxes.some(
        (b) =>
          b.box.toLowerCase().includes(q) ||
          b.nameEn.toLowerCase().includes(q) ||
          b.nameFr.toLowerCase().includes(q)
      );

      return (
        matchCode ||
        matchTitleEn ||
        matchTitleFr ||
        matchDescEn ||
        matchDescFr ||
        matchIssuerEn ||
        matchIssuerFr ||
        matchBoxes
      );
    });
  }, [searchQuery, activeCategory]);

  const categories = [
    { id: 'all', labelEn: 'All 19 CRA Slips', labelFr: 'Tous les 19 feuillets', count: ALL_REQUIRED_SLIPS.length },
    { id: 't4_slips', labelEn: 'T4 Slips (8)', labelFr: 'Feuillets T4 (8)', count: 8 },
    { id: 't5_slips', labelEn: 'T5 Slips (5)', labelFr: 'Feuillets T5 (5)', count: 5 },
    { id: 'more_slips', labelEn: 'More Tax Slips (6)', labelFr: 'Autres feuillets (6)', count: 6 },
  ];

  return (
    <div id="step-documents-view" className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner with Action Button */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>{isFrench ? 'Vision par Ordinateur IA' : 'Computer Vision OCR Ready'}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {isFrench ? 'Rassemblez et numérisez vos feuillets d’impôt' : 'Tax Slips & Document Scanner'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isFrench
              ? 'Prenez une photo ou téléversez votre feuillet T4 pour extraire automatiquement les cases de l’ARC avec détection visuelle.'
              : 'Snap a photo or upload your T4 slip to automatically detect and extract CRA box amounts with optical verification.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            id="add-manual-t4-slip-btn"
            onClick={handleAddManualT4}
            className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 border border-slate-300 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-700" />
            <span>{isFrench ? '+ Ajouter un T4 manuellement' : '+ Add T4 Slip Manually'}</span>
          </button>

          <button
            id="launch-cv-scanner-btn"
            onClick={() => onOpenScanner()}
            className="px-5 py-3 rounded-xl bg-[#064e3b] hover:bg-[#08634c] text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/20 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4 text-emerald-300" />
            <span>{isFrench ? 'Numériser avec Vision IA' : 'Launch CV Scanner'}</span>
          </button>
        </div>
      </div>

      {/* Document Management System (DMS) Vault Integration Card */}
      <div
        id="dms-vault-integration-card"
        className="rounded-2xl p-5 bg-linear-to-r from-[#064e3b] via-[#0b2942] to-[#0c2340] text-white border border-emerald-600/30 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-start space-x-3.5">
          <div className="p-3 bg-white/10 rounded-xl border border-white/20 shrink-0">
            <FolderLock className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded border border-emerald-400/30">
                AES-256-GCM SECURE VAULT
              </span>
              <span className="text-[10px] text-emerald-200/80 font-mono">
                CRA 6-Year Retention
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              {isFrench
                ? 'Gestionnaire de Documents Fiscaux & Coffre Sécurisé'
                : 'Tax Document Management System & Secure Vault'}
            </h3>
            <p className="text-xs text-emerald-100/90 mt-0.5 max-w-xl">
              {isFrench
                ? 'Stockez, catégorisez, étiquetez et recherchez en toute sécurité tous vos feuillets W-2, 1099, reçus médicaux ou dons avec hachage SHA-256 inviolable.'
                : 'Upload, categorize, tag, and search tax-related documents (W-2, 1099-MISC/NEC, receipts, notices) with SHA-256 tamper detection and AES-256 encryption.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 sm:self-center">
          <button
            id="open-dms-vault-from-step2-btn"
            onClick={() => onOpenDMS?.()}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-[#0c2340] font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
          >
            <FolderLock className="w-4 h-4 text-[#064e3b]" />
            <span>{isFrench ? 'Ouvrir le Gestionnaire de Documents' : 'Open Document Vault & DMS'}</span>
          </button>
        </div>
      </div>

      {/* Currently Attached Slips in Return (T4, T4A, T5) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-slate-200 gap-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-[#0b1f3a]" />
            <h3 className="font-bold text-slate-900 text-base">
              {isFrench
                ? 'Feuillets fiscaux actifs dans la déclaration (T4, T4A, T5)'
                : 'Active Tax Slips in Return (T4, T4A, T5)'}
            </h3>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
              {totalSlipsCount} {isFrench ? 'feuillet(s)' : 'slip(s)'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            {/* Add T4 Slip Button */}
            <button
              id="docs-add-t4-slip-btn"
              onClick={handleAddManualT4}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-300 flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isFrench ? '+ Ajouter T4' : '+ Add T4 Slip'}</span>
            </button>

            {/* Add T4A Slip Button */}
            <button
              id="docs-add-t4a-slip-btn"
              onClick={handleAddManualT4A}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-lg border border-blue-300 flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-700" />
              <span>{isFrench ? '+ Ajouter T4A' : '+ Add T4A Slip'}</span>
            </button>

            {/* Add T5 Slip Button */}
            <button
              id="docs-add-t5-slip-btn"
              onClick={handleAddManualT5}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-lg border border-amber-300 flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-700" />
              <span>{isFrench ? '+ Ajouter T5' : '+ Add T5 Slip'}</span>
            </button>

            {/* Export Slips Document Button */}
            <button
              id="export-slips-doc-btn"
              onClick={handleExportSlips}
              title={isFrench ? 'Exporter la liste des feuillets' : 'Export tax slips document report'}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg border border-slate-300 flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>{isFrench ? 'Exporter' : 'Export'}</span>
            </button>

            {/* Print / PDF Slips List Button */}
            <button
              id="print-slips-summary-btn"
              onClick={handlePrintSlips}
              title={isFrench ? 'Imprimer ou sauvegarder en PDF' : 'Print slips summary report'}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg border border-slate-300 flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{isFrench ? 'Imprimer / PDF' : 'Print / PDF'}</span>
            </button>
          </div>
        </div>

        {/* Slips Tab Switcher */}
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 overflow-x-auto no-print">
          <button
            onClick={() => setActiveSlipsTab('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeSlipsTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {isFrench ? 'Tous les feuillets' : 'All Slips'} ({totalSlipsCount})
          </button>
          <button
            onClick={() => setActiveSlipsTab('T4')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1 ${
              activeSlipsTab === 'T4'
                ? 'bg-[#064e3b] text-white shadow-xs'
                : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
            }`}
          >
            <span>T4 {isFrench ? 'Emploi' : 'Employment'}</span>
            <span className="text-[10px] bg-emerald-900/40 px-1.5 py-0.2 rounded-full font-mono">
              {t4Slips.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSlipsTab('T4A')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1 ${
              activeSlipsTab === 'T4A'
                ? 'bg-blue-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-blue-50 hover:text-blue-900'
            }`}
          >
            <span>T4A {isFrench ? 'Pension & Autre' : 'Pension & Other'}</span>
            <span className="text-[10px] bg-blue-900/40 px-1.5 py-0.2 rounded-full font-mono">
              {t4aSlips.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSlipsTab('T5')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1 ${
              activeSlipsTab === 'T5'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-amber-50 hover:text-amber-900'
            }`}
          >
            <span>T5 {isFrench ? 'Placements' : 'Investments'}</span>
            <span className="text-[10px] bg-amber-900/40 px-1.5 py-0.2 rounded-full font-mono">
              {t5Slips.length}
            </span>
          </button>
        </div>

        {/* CRA T4 Slip Layout Constraint Validation Card */}
        {t4Slips.length > 0 && (
          <div id="cra-layout-validation-panel" className="transition-all">
            {validationSummary.canProceed ? (
              <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-950">
                      {isFrench
                        ? 'Normes de présentation des feuillets T4 de l’ARC respectées'
                        : 'CRA-Standard T4 Slip Layout Constraints Satisfied'}
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      {isFrench
                        ? `${t4Slips.length} feuillet(s) T4 validé(s) : montants des cases 14, 22, 16, 18 et NAS conformes aux règles de l’ARC.`
                        : `${t4Slips.length} T4 slip(s) verified: box 14, 22, 16, 18 ranges and SIN conform to CRA filing guidelines.`}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center text-[10px] font-mono font-bold text-emerald-800 bg-emerald-200/70 px-2.5 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
                  CRA Validated
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 space-y-2.5 shadow-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4 text-rose-700" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-rose-950">
                      {isFrench
                        ? 'Anomalies de format T4 selon les contraintes de l’ARC'
                        : 'CRA T4 Slip Layout Violations Detected'}
                    </h4>
                    <p className="text-[11px] text-rose-800">
                      {isFrench
                        ? 'Certaines données extraites ou saisies violent les contraintes réglementaires de l’ARC. Vous devez les corriger avant de passer à l’étape suivante.'
                        : 'Extracted OCR or entered T4 slip values violate statutory CRA constraints. You must correct these before proceeding to the next step.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  {validationSummary.blockingErrors.map((err, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-white/90 p-2.5 rounded-lg border border-rose-200 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-start space-x-2">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <div>
                          <span className="font-semibold text-slate-900">{err.slipName}</span>{' '}
                          <span className="font-mono text-rose-700 font-bold bg-rose-100/70 px-1.5 py-0.5 rounded text-[10px]">
                            {err.box}
                          </span>
                          <span className="text-slate-600 block sm:inline sm:ml-1 text-[11px]">
                            {err.message}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const targetSlip = t4Slips.find((s) => s.id === err.slipId);
                          if (targetSlip) {
                            setEditingSlip({ type: 'T4', slip: targetSlip });
                          }
                        }}
                        className="text-[11px] font-bold text-rose-700 hover:text-rose-900 hover:underline shrink-0 cursor-pointer"
                      >
                        {isFrench ? 'Modifier' : 'Fix Slip'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 
          Uploaded & Scanned Tax Documents Hub
          Maps over all uploaded documents, shows CRA validation status badges,
          provides one-click targeted Re-scanning, and DocuSign E-Signature Pipeline
        */}
        <div id="detected-documents-panel" className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <input
            type="file"
            ref={quickFileInputRef}
            onChange={handleDirectFileUpload}
            className="hidden"
            accept=".pdf,image/*"
          />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#064e3b] text-white flex items-center justify-center shadow-xs">
                <Camera className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    {isFrench ? 'Documents & feuillets téléversés' : 'Uploaded & Scanned Tax Documents'}
                  </h4>
                  <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {(taxReturn.scannedDocuments || []).length} {isFrench ? 'document(s)' : 'documents'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {isFrench
                    ? 'Vérification en temps réel de l’état de validation de chaque feuillet, re-numérisation ciblée et signature électronique DocuSign'
                    : 'Real-time validation badge for missing fields, targeted slip re-scanning, and DocuSign e-signature pipeline'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="launch-camera-scan-btn"
                onClick={() => onOpenScanner('camera')}
                className="px-3 py-1.5 bg-[#064e3b] hover:bg-[#08634c] text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer border border-emerald-400/30"
                title={isFrench ? 'Numériser avec la caméra de l’appareil' : 'Scan tax slips using device camera'}
              >
                <Camera className="w-3.5 h-3.5 text-emerald-300" />
                <span>{isFrench ? 'Scanner par Caméra' : 'Camera Scanner'}</span>
              </button>

              <button
                type="button"
                id="prepare-for-signature-global-btn"
                onClick={() => handleOpenSignature()}
                disabled={(taxReturn.scannedDocuments || []).length === 0}
                className="px-3 py-1.5 bg-[#0c2340] hover:bg-[#005cb9] text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title={isFrench ? 'Préparer le document scanné actif pour signature électronique DocuSign' : 'Prepare currently scanned tax document for DocuSign e-signature pipeline'}
              >
                <PenTool className="w-3.5 h-3.5 text-yellow-400" />
                <span>{isFrench ? 'Préparer pour signature' : 'Prepare for Signature'}</span>
              </button>

              <button
                type="button"
                id="quick-upload-doc-btn"
                onClick={() => quickFileInputRef.current?.click()}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
                title={isFrench ? 'Téléverser un nouveau feuillet' : 'Upload tax slip file'}
              >
                <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                <span>{isFrench ? 'Téléverser un feuillet' : 'Upload Slip'}</span>
              </button>

              <button
                type="button"
                id="launch-new-slip-scan-btn"
                onClick={() => onOpenScanner()}
                className="px-3 py-1.5 bg-[#064e3b] hover:bg-[#08634c] text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>{isFrench ? 'Scanner un feuillet' : 'Scan New Slip'}</span>
              </button>
            </div>
          </div>

          {(taxReturn.scannedDocuments || []).length === 0 ? (
            <div className="p-6 bg-white rounded-xl border border-dashed border-slate-300 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileText className="w-5 h-5 text-slate-500" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-800 font-bold">
                  {isFrench ? 'Aucun document téléversé pour l’instant' : 'No uploaded tax documents yet'}
                </p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  {isFrench
                    ? 'Téléversez un feuillet fiscal (PDF ou image) ou lancez le numériseur Vision IA pour extraire vos données et suivre leur état de validation.'
                    : 'Upload your tax slips (PDF or images) or scan them using AI Computer Vision to track validation and initiate DocuSign.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => quickFileInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  {isFrench ? 'Sélectionner un fichier' : 'Browse Files'}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenScanner()}
                  className="px-3.5 py-1.5 bg-[#064e3b] hover:bg-[#08634c] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  {isFrench ? 'Ouvrir le numériseur IA' : 'Launch AI Scanner'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(taxReturn.scannedDocuments || []).map((doc) => {
                const validation = getDocumentValidation(doc);
                const isExpanded = Boolean(expandedDocIds[doc.id || doc.documentCode]);

                return (
                  <div
                    key={doc.id || doc.documentCode}
                    id={`detected-slip-card-${doc.documentCode.toLowerCase()}`}
                    className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 shadow-2xs flex flex-col justify-between space-y-3 transition-all"
                  >
                    {/* Top Row: Document Type, Expand Icon & Small Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                          {doc.documentCode}
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]" title={doc.documentName}>
                          {doc.documentName || `${doc.documentCode} Slip`}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        {/* Expand Icon: toggles thumbnail preview visibility */}
                        <button
                          type="button"
                          id={`toggle-expand-doc-${doc.documentCode.toLowerCase()}-${doc.id}`}
                          onClick={() => toggleExpandDoc(doc.id || doc.documentCode)}
                          className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer flex items-center space-x-0.5 text-[11px]"
                          title={isExpanded ? (isFrench ? "Réduire l'aperçu" : "Collapse preview") : (isFrench ? "Agrandir l'aperçu" : "Expand preview")}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5 text-slate-700" />
                              <span className="text-[10px] font-semibold text-slate-600 hidden sm:inline">{isFrench ? 'Réduire' : 'Collapse'}</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-[10px] font-semibold text-slate-500 hidden sm:inline">{isFrench ? 'Aperçu' : 'Expand'}</span>
                            </>
                          )}
                        </button>

                        {/* Status Badge: Validated vs Needs Review with subtle fade-in animation */}
                        <AnimatePresence mode="wait">
                          {validation.isValidated ? (
                            <motion.span
                              key={`badge-val-${doc.id || doc.documentCode}`}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.35, ease: 'easeOut' }}
                              id={`doc-status-badge-${doc.documentCode.toLowerCase()}-${doc.id}`}
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs shrink-0"
                              title={isFrench ? 'Validé : Tous les champs requis sont conformes' : 'Validated: All required CRA fields verified'}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{isFrench ? 'Validé' : 'Validated'}</span>
                            </motion.span>
                          ) : (
                            <motion.div
                              key={`badge-rev-${doc.id || doc.documentCode}`}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.35, ease: 'easeOut' }}
                              className="flex flex-col items-end shrink-0"
                            >
                              <span
                                id={`doc-status-badge-${doc.documentCode.toLowerCase()}-${doc.id}`}
                                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                                title={
                                  isFrench
                                    ? `À réviser : ${validation.missingFields.join(', ')}`
                                    : `Needs Review: ${validation.missingFields.join(', ')}`
                                }
                              >
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                <span>{isFrench ? 'À réviser' : 'Needs Review'}</span>
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Missing fields alert details if re-scan or review is required */}
                    {validation.requiresRescan && validation.missingFields.length > 0 && (
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 space-y-0.5">
                        <span className="font-semibold block text-[10px] text-amber-900 uppercase">
                          {isFrench ? 'Champs manquants à réviser :' : 'Missing Fields (Needs Review):'}
                        </span>
                        <p className="text-[10px] leading-tight text-amber-800">
                          {validation.missingFields.join(' • ')}
                        </p>
                      </div>
                    )}

                    {/* Metadata & OCR details */}
                    <div className="text-[11px] text-slate-500 space-y-1">
                      <p className="truncate font-mono text-[10px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                        {doc.fileName}
                      </p>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 flex items-center space-x-1">
                          <span className="font-mono uppercase font-semibold text-slate-600 bg-slate-100 px-1 py-0.2 rounded">
                            {doc.fileType}
                          </span>
                          <span>{doc.fileSize || '380 KB'}</span>
                        </span>
                        <span className="text-slate-400">
                          {doc.ocrConfidence ? `${doc.ocrConfidence}% OCR Conf.` : 'Scanned'}
                        </span>
                      </div>

                      {/* DocuSign E-Signature Status Badge if signed */}
                      {doc.eSignatureStatus === 'signed' && (
                        <div className="pt-0.5">
                          <span
                            id={`doc-signed-badge-${doc.documentCode.toLowerCase()}-${doc.id}`}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200"
                            title={`Envelope ID: ${doc.signedEnvelopeId || 'Signed'}`}
                          >
                            <ShieldCheck className="w-3 h-3 text-blue-600" />
                            <span>{isFrench ? 'DocuSign Signé' : 'DocuSign Signed'}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Expandable Preview Thumbnail using document metadata previewUrl */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          id={`doc-preview-expanded-${doc.documentCode.toLowerCase()}-${doc.id}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden rounded-xl border border-slate-200 bg-[#0c2340]/5 p-2.5 space-y-2"
                        >
                          <div className="relative aspect-video max-h-48 rounded-lg overflow-hidden bg-[#0c2340] flex items-center justify-center group shadow-xs">
                            <img
                              src={
                                doc.previewUrl ||
                                getSlipMetadataByCode(doc.documentCode as SlipType)?.sampleDocument.previewUrl ||
                                'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80'
                              }
                              alt={doc.documentName || doc.fileName}
                              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute bottom-1.5 right-1.5 bg-[#0c2340]/80 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded font-mono border border-white/20">
                              {doc.fileType?.toUpperCase() || 'IMAGE'} • {doc.fileSize || '380 KB'}
                            </div>
                            <div className="absolute top-1.5 left-1.5 bg-[#064e3b]/90 text-white text-[9px] px-2 py-0.5 rounded font-bold flex items-center space-x-1 border border-emerald-400/40 shadow-xs">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-300" />
                              <span>{doc.ocrConfidence ? `${doc.ocrConfidence}% OCR Match` : 'Verified Slip'}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-600 px-0.5">
                            <span className="truncate max-w-[160px] font-mono text-slate-700" title={doc.fileName}>
                              {doc.fileName}
                            </span>
                            <span>{new Date(doc.scannedAt || Date.now()).toLocaleDateString(isFrench ? 'fr-CA' : 'en-CA')}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Actions: Re-scan Button, Prepare for Signature Button, & Detach */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                        {/* 'Re-scan' button triggering scanner modal with specific slip type */}
                        <button
                          id={`rescan-uploaded-doc-${doc.documentCode.toLowerCase()}-${doc.id}`}
                          type="button"
                          onClick={() => {
                            if (onOpenScannerWithSlip) {
                              onOpenScannerWithSlip(doc.documentCode as SlipType);
                            } else {
                              onOpenScanner();
                            }
                          }}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-colors cursor-pointer shrink-0"
                          title={isFrench ? `Re-numériser ce feuillet ${doc.documentCode}` : `Re-scan this ${doc.documentCode} document`}
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{isFrench ? 'Re-numériser' : 'Re-scan'}</span>
                        </button>

                        {/* 'Prepare for Signature' button launching DocuSign confirmation modal */}
                        <button
                          id={`prepare-signature-doc-${doc.documentCode.toLowerCase()}-${doc.id}`}
                          type="button"
                          onClick={() => handleOpenSignature(doc)}
                          className="px-2.5 py-1.5 bg-[#0c2340] hover:bg-[#005cb9] text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
                          title={isFrench ? 'Préparer pour signature électronique DocuSign' : 'Prepare for Signature via DocuSign e-signature pipeline'}
                        >
                          <PenTool className="w-3.5 h-3.5 text-yellow-400" />
                          <span>{isFrench ? 'Préparer pour signature' : 'Prepare for Signature'}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUpdateScan(doc.documentCode, doc.documentName, null)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer shrink-0"
                        title={isFrench ? 'Détacher ce document' : 'Detach document'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {totalSlipsCount === 0 ? (
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-700 text-sm">
                {isFrench ? 'Aucun feuillet fiscal ajouté pour le moment' : 'No tax slips added yet'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {isFrench
                  ? 'Ajoutez un feuillet T4, T4A ou T5 manuellement ou utilisez le numériseur Vision IA.'
                  : 'Add a T4, T4A, or T5 slip manually, or scan your document using AI Computer Vision.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                id="empty-add-manual-t4-btn"
                onClick={handleAddManualT4}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-300 transition-colors cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ T4</span>
              </button>
              <button
                id="empty-add-manual-t4a-btn"
                onClick={handleAddManualT4A}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-lg border border-blue-300 transition-colors cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ T4A</span>
              </button>
              <button
                id="empty-add-manual-t5-btn"
                onClick={handleAddManualT5}
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-lg border border-amber-300 transition-colors cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ T5</span>
              </button>
              <button
                onClick={() => onOpenScanner()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{isFrench ? 'Scanner avec Vision IA' : 'Scan with AI Vision'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* T4 Slips */}
            {(activeSlipsTab === 'all' || activeSlipsTab === 'T4') &&
              t4Slips.map((slip) => {
                const isT4Valid = Boolean(
                  slip.employerName && slip.employerName.trim() !== '' && slip.box14_employmentIncome > 0
                );
                return (
                  <div
                    key={slip.id}
                    className="p-4 bg-emerald-50/40 hover:bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-3 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#064e3b] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          T4
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-slate-900 text-sm truncate max-w-[150px] sm:max-w-[190px]">
                              {slip.employerName || (isFrench ? 'Employeur non spécifié' : 'Unspecified Employer')}
                            </h4>
                            <AnimatePresence mode="wait">
                              {isT4Valid ? (
                                <motion.span
                                  key={`t4-valid-${slip.id}`}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.3, ease: 'easeOut' }}
                                  id={`t4-status-badge-${slip.id}`}
                                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0"
                                  title={isFrench ? 'Validé' : 'Validated: CRA required boxes completed'}
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>{isFrench ? 'Validé' : 'Validated'}</span>
                                </motion.span>
                              ) : (
                                <motion.span
                                  key={`t4-review-${slip.id}`}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.3, ease: 'easeOut' }}
                                  id={`t4-status-badge-${slip.id}`}
                                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0"
                                  title={isFrench ? 'À réviser : Nom ou Case 14 manquants' : 'Needs Review: Missing employer or Box 14 amount'}
                                >
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  <span>{isFrench ? 'À réviser' : 'Needs Review'}</span>
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>
                          <span className="text-[10px] text-emerald-700 font-medium flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{isFrench ? 'Emploi / Verified' : 'Employment Income'}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <DocumentScanIndicator
                          documentCode="T4"
                          documentName="T4 Slip"
                          scan={getScanForCode('T4')}
                          language={language}
                          onUpdateScan={(s) => handleUpdateScan('T4', 'T4 Slip', s)}
                          onRescan={() => (onOpenScannerWithSlip ? onOpenScannerWithSlip('T4') : onOpenScanner())}
                          variant="badge"
                          idPrefix={`t4-active-scan-${slip.id}`}
                        />

                        <button
                          id={`prepare-signature-t4-${slip.id}`}
                          type="button"
                          onClick={() => handleOpenSignature({ code: 'T4', name: slip.employerName || 'T4 Slip', id: slip.id })}
                          className="px-2 py-1 bg-[#0c2340] hover:bg-[#005cb9] text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs transition-colors cursor-pointer"
                          title={isFrench ? 'Préparer pour signature électronique DocuSign' : 'Prepare for Signature via DocuSign'}
                        >
                          <PenTool className="w-3.5 h-3.5 text-yellow-400" />
                          <span>{isFrench ? 'Préparer pour signature' : 'Prepare for Signature'}</span>
                        </button>

                        <button
                          id={`docs-rescan-t4-${slip.id}`}
                          type="button"
                          onClick={() => (onOpenScannerWithSlip ? onOpenScannerWithSlip('T4') : onOpenScanner())}
                          className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                          title={isFrench ? 'Re-numériser ce feuillet T4' : 'Re-scan this T4 slip'}
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{isFrench ? 'Re-numériser' : 'Re-scan'}</span>
                        </button>

                        <button
                          id={`docs-edit-t4-${slip.id}`}
                          type="button"
                          onClick={() => setEditingSlip({ type: 'T4', slip })}
                          className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                          title={isFrench ? 'Modifier ce feuillet T4' : 'Edit this T4 slip'}
                        >
                          <Pencil className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{isFrench ? 'Modifier' : 'Edit'}</span>
                        </button>

                        <button
                          id={`docs-delete-t4-${slip.id}`}
                          type="button"
                          onClick={() => handleDeleteT4(slip.id)}
                          className="px-2 py-1 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                          title={isFrench ? 'Supprimer ce feuillet T4' : 'Delete this T4 slip'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isFrench ? 'Supprimer' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/60 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block">
                          Case 14 ({isFrench ? 'Revenu' : 'Income'}):
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          ${slip.box14_employmentIncome.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 text-[10px] block">
                          Case 22 ({isFrench ? 'Impôt retenu' : 'Tax Deducted'}):
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          ${slip.box22_incomeTaxDeducted.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 text-[10px] block">
                          Case 16 (CPP):
                        </span>
                        <span className="font-mono text-slate-700">
                          ${slip.box16_cppContributions.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 text-[10px] block">
                          Case 18 (EI):
                        </span>
                        <span className="font-mono text-slate-700">
                          ${slip.box18_eiPremiums.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* T4A Slips */}
            {(activeSlipsTab === 'all' || activeSlipsTab === 'T4A') &&
              t4aSlips.map((slip) => {
                const hasAmount = Object.values(slip.amounts || {}).some(
                  (val) => typeof val === 'number' && val > 0
                );
                const isT4AValid = Boolean(slip.payerName && slip.payerName.trim() !== '' && hasAmount);

                return (
                  <div
                    key={slip.id}
                    className="p-4 bg-blue-50/40 hover:bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-3 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-800 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          T4A
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-slate-900 text-sm truncate max-w-[150px] sm:max-w-[190px]">
                              {slip.payerName || (isFrench ? 'Payeur non spécifié' : 'Unspecified Payer')}
                            </h4>
                            <AnimatePresence mode="wait">
                              {isT4AValid ? (
                                <motion.span
                                  key={`t4a-valid-${slip.id}`}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.3, ease: 'easeOut' }}
                                  id={`t4a-status-badge-${slip.id}`}
                                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0"
                                  title={isFrench ? 'Validé' : 'Validated: CRA required boxes completed'}
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>{isFrench ? 'Validé' : 'Validated'}</span>
                                </motion.span>
                              ) : (
                                <motion.span
                                  key={`t4a-review-${slip.id}`}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.3, ease: 'easeOut' }}
                                  id={`t4a-status-badge-${slip.id}`}
                                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0"
                                  title={isFrench ? 'À réviser : Nom ou montants manquants' : 'Needs Review: Missing payer or income amounts'}
                                >
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  <span>{isFrench ? 'À réviser' : 'Needs Review'}</span>
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>
                          <span className="text-[10px] text-blue-700 font-medium flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{isFrench ? 'Rente / Pension' : 'Pension / Annuity'}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <DocumentScanIndicator
                          documentCode="T4A"
                          documentName="T4A Slip"
                          scan={getScanForCode('T4A')}
                          language={language}
                          onUpdateScan={(s) => handleUpdateScan('T4A', 'T4A Slip', s)}
                          onRescan={() => (onOpenScannerWithSlip ? onOpenScannerWithSlip('T4A') : onOpenScanner())}
                          variant="badge"
                          idPrefix={`t4a-active-scan-${slip.id}`}
                        />

                        <button
                          id={`prepare-signature-t4a-${slip.id}`}
                          type="button"
                          onClick={() => handleOpenSignature({ code: 'T4A', name: slip.payerName || 'T4A Slip', id: slip.id })}
                          className="px-2 py-1 bg-[#0c2340] hover:bg-[#005cb9] text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs transition-colors cursor-pointer"
                          title={isFrench ? 'Préparer pour signature électronique DocuSign' : 'Prepare for Signature via DocuSign'}
                        >
                          <PenTool className="w-3.5 h-3.5 text-yellow-400" />
                          <span>{isFrench ? 'Préparer pour signature' : 'Prepare for Signature'}</span>
                        </button>

                        <button
                          id={`docs-rescan-t4a-${slip.id}`}
                          type="button"
                          onClick={() => (onOpenScannerWithSlip ? onOpenScannerWithSlip('T4A') : onOpenScanner())}
                          className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-800 border border-blue-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                          title={isFrench ? 'Re-numériser ce feuillet T4A' : 'Re-scan this T4A slip'}
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-blue-700" />
                          <span>{isFrench ? 'Re-numériser' : 'Re-scan'}</span>
                        </button>

                        <button
                          id={`docs-edit-t4a-${slip.id}`}
                          type="button"
                          onClick={() => setEditingSlip({ type: 'T4A', slip })}
                          className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-800 border border-blue-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                          title={isFrench ? 'Modifier ce feuillet T4A' : 'Edit this T4A slip'}
                        >
                          <Pencil className="w-3.5 h-3.5 text-blue-700" />
                          <span>{isFrench ? 'Modifier' : 'Edit'}</span>
                        </button>

                        <button
                          id={`docs-delete-t4a-${slip.id}`}
                          type="button"
                          onClick={() => handleDeleteOtherSlip(slip.id)}
                          className="px-2 py-1 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                          title={isFrench ? 'Supprimer ce feuillet T4A' : 'Delete this T4A slip'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isFrench ? 'Supprimer' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200/60 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block">
                          Case 016 ({isFrench ? 'Pension' : 'Pension'}):
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          ${(slip.amounts?.box016_pension || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 text-[10px] block">
                          Case 022 ({isFrench ? 'Impôt retenu' : 'Tax Deducted'}):
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          ${(slip.amounts?.box022_taxDeducted || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 text-[10px] block">
                          Case 028 ({isFrench ? 'Autre revenu' : 'Other Income'}):
                        </span>
                        <span className="font-mono text-slate-700">
                          ${(slip.amounts?.box028_otherIncome || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 text-[10px] block">
                          Case 105 ({isFrench ? 'Bourse' : 'Scholarship'}):
                        </span>
                        <span className="font-mono text-slate-700">
                          ${(slip.amounts?.box105_scholarships || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* T5 Slips */}
            {(activeSlipsTab === 'all' || activeSlipsTab === 'T5') &&
              t5Slips.map((slip) => {
                const hasAmount = Object.values(slip.amounts || {}).some(
                  (val) => typeof val === 'number' && val > 0
                );
                const isT5Valid = Boolean(slip.payerName && slip.payerName.trim() !== '' && hasAmount);

                return (
                  <div
                    key={slip.id}
                    className="p-4 bg-amber-50/40 hover:bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-3 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          T5
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-slate-900 text-sm truncate max-w-[150px] sm:max-w-[190px]">
                              {slip.payerName || (isFrench ? 'Payeur non spécifié' : 'Unspecified Payer')}
                            </h4>
                            <AnimatePresence mode="wait">
                              {isT5Valid ? (
                                <motion.span
                                  key={`t5-valid-${slip.id}`}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.3, ease: 'easeOut' }}
                                  id={`t5-status-badge-${slip.id}`}
                                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0"
                                  title={isFrench ? 'Validé' : 'Validated: CRA required boxes completed'}
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>{isFrench ? 'Validé' : 'Validated'}</span>
                                </motion.span>
                              ) : (
                                <motion.span
                                  key={`t5-review-${slip.id}`}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.3, ease: 'easeOut' }}
                                  id={`t5-status-badge-${slip.id}`}
                                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0"
                                  title={isFrench ? 'À réviser : Nom ou montants manquants' : 'Needs Review: Missing issuer or investment income'}
                                >
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  <span>{isFrench ? 'À réviser' : 'Needs Review'}</span>
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>
                          <span className="text-[10px] text-amber-700 font-medium flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{isFrench ? 'Placements' : 'Investment Income'}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <DocumentScanIndicator
                          documentCode="T5"
                          documentName="T5 Slip"
                          scan={getScanForCode('T5')}
                          language={language}
                          onUpdateScan={(s) => handleUpdateScan('T5', 'T5 Slip', s)}
                          onRescan={() => (onOpenScannerWithSlip ? onOpenScannerWithSlip('T5') : onOpenScanner())}
                          variant="badge"
                          idPrefix={`t5-active-scan-${slip.id}`}
                        />

                        <button
                          id={`prepare-signature-t5-${slip.id}`}
                          type="button"
                          onClick={() => handleOpenSignature({ code: 'T5', name: slip.payerName || 'T5 Slip', id: slip.id })}
                          className="px-2 py-1 bg-[#0c2340] hover:bg-[#005cb9] text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs transition-colors cursor-pointer"
                          title={isFrench ? 'Préparer pour signature électronique DocuSign' : 'Prepare for Signature via DocuSign'}
                        >
                          <PenTool className="w-3.5 h-3.5 text-yellow-400" />
                          <span>{isFrench ? 'Préparer pour signature' : 'Prepare for Signature'}</span>
                        </button>

                        <button
                          id={`docs-rescan-t5-${slip.id}`}
                          type="button"
                          onClick={() => (onOpenScannerWithSlip ? onOpenScannerWithSlip('T5') : onOpenScanner())}
                          className="px-2 py-1 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                          title={isFrench ? 'Re-numériser ce feuillet T5' : 'Re-scan this T5 slip'}
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                          <span>{isFrench ? 'Re-numériser' : 'Re-scan'}</span>
                        </button>

                        <button
                          id={`docs-edit-t5-${slip.id}`}
                          type="button"
                          onClick={() => setEditingSlip({ type: 'T5', slip })}
                          className="px-2 py-1 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                          title={isFrench ? 'Modifier ce feuillet T5' : 'Edit this T5 slip'}
                        >
                          <Pencil className="w-3.5 h-3.5 text-amber-700" />
                          <span>{isFrench ? 'Modifier' : 'Edit'}</span>
                        </button>

                        <button
                          id={`docs-delete-t5-${slip.id}`}
                          type="button"
                          onClick={() => handleDeleteOtherSlip(slip.id)}
                          className="px-2 py-1 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                          title={isFrench ? 'Supprimer ce feuillet T5' : 'Delete this T5 slip'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isFrench ? 'Supprimer' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/60 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block">
                          Case 13 ({isFrench ? 'Intérêts' : 'Interest'}):
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          ${(slip.amounts?.box13_interest || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 text-[10px] block">
                          Case 24 ({isFrench ? 'Gains en capital' : 'Capital Gains'}):
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          ${(slip.amounts?.box24_capitalGains || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 text-[10px] block">
                          Case 10 ({isFrench ? 'Dividendes dét.' : 'Eligible Div.'}):
                        </span>
                        <span className="font-mono text-slate-700">
                          ${(slip.amounts?.box10_eligibleDividends || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 text-[10px] block">
                          Case 11 ({isFrench ? 'Dividendes imposables' : 'Taxable Div.'}):
                        </span>
                        <span className="font-mono text-slate-700">
                          ${(slip.amounts?.box11_taxableDividends || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Educational Guide: The Three Most Common Tax Slips in Canada */}
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white rounded-2xl p-6 border border-emerald-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-emerald-200/60">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-1.5">
              CRA Taxpayer Guide • Guide du contribuable
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              The three most common tax slips in Canada are:
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Each of these slips reports different types of income, so let’s take a closer look at what they mean and how they affect your tax filing.
            </p>
          </div>
          <div className="flex items-center space-x-2 no-print shrink-0">
            <button
              onClick={() => window.print()}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center space-x-1 shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{isFrench ? 'Imprimer / PDF' : 'Print / PDF'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="p-4 bg-white rounded-xl border border-emerald-200/70 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-emerald-100 text-emerald-800 rounded">
                  T4 Slip
                </span>
                <DocumentScanIndicator
                  documentCode="T4"
                  documentName="T4 Slip"
                  scan={getScanForCode('T4')}
                  language={language}
                  onUpdateScan={(s) => handleUpdateScan('T4', 'T4 Slip', s)}
                  variant="compact"
                  idPrefix="summary-scan-t4"
                />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Employment</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              Statement of Remuneration Paid
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Reports wages, salaries, bonuses, and statutory deductions like CPP/QPP (Box 16), EI premiums (Box 18), and income tax deducted at source (Box 22).
            </p>
            <div className="pt-1.5 flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => (onOpenScannerWithSlip ? onOpenScannerWithSlip('T4') : onOpenScanner())}
                className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                title={isFrench ? 'Numériser T4 avec l’IA' : 'Scan T4 with AI'}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span>{isFrench ? 'Scanner T4' : 'Scan T4'}</span>
              </button>
              <button
                type="button"
                onClick={handleAddManualT4}
                className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isFrench ? '+ Ajouter' : '+ Add'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-purple-200/70 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-purple-100 text-purple-800 rounded">
                  T4A Slip
                </span>
                <DocumentScanIndicator
                  documentCode="T4A"
                  documentName="T4A Slip"
                  scan={getScanForCode('T4A')}
                  language={language}
                  onUpdateScan={(s) => handleUpdateScan('T4A', 'T4A Slip', s)}
                  variant="compact"
                  idPrefix="summary-scan-t4a"
                />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Pension & Other</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              Statement of Pension, Retirement, Annuity, and Other Income
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Issued for retirement pensions, annuities, scholarships/fellowships, COVID/maternity support, or fees for self-employed contract work (Box 048).
            </p>
            <div className="pt-1.5 flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => (onOpenScannerWithSlip ? onOpenScannerWithSlip('T4A') : onOpenScanner())}
                className="px-2.5 py-1 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                title={isFrench ? 'Numériser T4A avec l’IA' : 'Scan T4A with AI'}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                <span>{isFrench ? 'Scanner T4A' : 'Scan T4A'}</span>
              </button>
              <button
                type="button"
                onClick={handleAddManualT4A}
                className="px-2.5 py-1 text-xs font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isFrench ? '+ Ajouter' : '+ Add'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-blue-200/70 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-blue-100 text-blue-800 rounded">
                  T5 Slip
                </span>
                <DocumentScanIndicator
                  documentCode="T5"
                  documentName="T5 Slip"
                  scan={getScanForCode('T5')}
                  language={language}
                  onUpdateScan={(s) => handleUpdateScan('T5', 'T5 Slip', s)}
                  variant="compact"
                  idPrefix="summary-scan-t5"
                />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Investments</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              Statement of Investment Income
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Reports investment yields outside registered accounts, including bank account interest (Box 13), bond returns, and Canadian corporate dividends (Box 24).
            </p>
            <div className="pt-1.5 flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => (onOpenScannerWithSlip ? onOpenScannerWithSlip('T5') : onOpenScanner())}
                className="px-2.5 py-1 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                title={isFrench ? 'Numériser T5 avec l’IA' : 'Scan T5 with AI'}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>{isFrench ? 'Scanner T5' : 'Scan T5'}</span>
              </button>
              <button
                type="button"
                onClick={handleAddManualT5}
                className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isFrench ? '+ Ajouter' : '+ Add'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 
        Required & Common Tax Slips Directory with Search Input
        Allows users to quickly locate, filter, and understand required CRA tax forms.
      */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-[#064e3b]" />
              <h3 className="font-extrabold text-slate-900 text-base">
                {isFrench ? 'Répertoire des feuillets fiscaux requis de l’ARC' : 'Required & Common Tax Slips Directory'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isFrench
                ? 'Recherchez par nom, numéro de feuillet ou type de revenu pour vérifier les documents requis.'
                : 'Search by slip name, code, or keyword to verify forms required for your Canadian tax return.'}
            </p>
          </div>

          <span className="text-xs text-slate-500 font-mono">
            {filteredSlips.length} / {ALL_REQUIRED_SLIPS.length}{' '}
            {isFrench ? 'feuillets trouvés' : 'slips'}
          </span>
        </div>

        {/* Search Input Bar */}
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-slate-400" />
            </div>

            <input
              id="slip-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isFrench
                  ? 'Rechercher un feuillet par nom ou code (ex. T4, T5, Scolarité, REER, CELIAPP, T4A, Freelance)...'
                  : 'Search slips by name or code (e.g. T4, T5, Tuition, RRSP, T4A, Freelance, FHSA)...'
              }
              className="w-full pl-10 pr-10 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-[#064e3b] rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 shadow-2xs focus:ring-2 focus:ring-[#064e3b]/20 transition-all outline-none"
            />

            {searchQuery && (
              <button
                id="clear-slip-search-btn"
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                title={isFrench ? 'Effacer la recherche' : 'Clear search'}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pr-1 flex items-center space-x-1 shrink-0">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>{isFrench ? 'Catégorie :' : 'Category:'}</span>
            </span>

            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[#064e3b] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {isFrench ? cat.labelFr : cat.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Slips Cards Grid */}
        {filteredSlips.length === 0 ? (
          <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">
              {isFrench ? 'Aucun feuillet trouvé' : 'No matching slips found'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isFrench
                ? `Aucun formulaire ne correspond à « ${searchQuery} ». Essayez de chercher par numéro (ex. T4, T5) ou réinitialisez le filtre.`
                : `No tax slips matched "${searchQuery}". Try searching by slip number (e.g., T4, T5, T2202) or clear your filter.`}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="mt-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {isFrench ? 'Réinitialiser la recherche' : 'Reset Search'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredSlips.map((slip) => {
              const isT4Active = slip.code === 'T4' && taxReturn.t4Slips.length > 0;
              const matchingOtherSlips = (taxReturn.otherSlips || []).filter((s) => s.type === slip.code);
              const isOtherActive = matchingOtherSlips.length > 0;
              const isAnyActive = isT4Active || isOtherActive;
              const activeCount = isT4Active ? taxReturn.t4Slips.length : matchingOtherSlips.length;

              return (
                <div
                  key={slip.code}
                  className={`p-4 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                    isAnyActive
                      ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
                      : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header: Code & Category */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-10 h-6 rounded-md bg-[#0b1f3a] text-white font-extrabold text-[11px] flex items-center justify-center font-mono">
                          {slip.code}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                          {slip.category.replace('_', ' ')}
                        </span>
                        <DocumentScanIndicator
                          documentCode={slip.code}
                          documentName={isFrench ? slip.titleFr : slip.titleEn}
                          scan={getScanForCode(slip.code)}
                          language={language}
                          onUpdateScan={(s) => handleUpdateScan(slip.code, isFrench ? slip.titleFr : slip.titleEn, s)}
                          variant="compact"
                          idPrefix={`dir-scan-hdr-${slip.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                        />
                      </div>

                      {isAnyActive ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>
                            {activeCount} {isFrench ? 'actif(s)' : 'in return'}
                          </span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {isFrench ? 'Émis par :' : 'Issuer:'} {isFrench ? slip.issuerFr : slip.issuerEn}
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">
                        {isFrench ? slip.titleFr : slip.titleEn}
                      </h4>
                      <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                        {isFrench ? slip.descriptionFr : slip.descriptionEn}
                      </p>
                    </div>

                    {/* Common Box Numbers */}
                    <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-1.5">
                      {slip.keyBoxes.map((kb) => (
                        <span
                          key={kb.box}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] text-slate-700"
                        >
                          <span className="font-mono font-bold text-[#064e3b]">
                            {kb.box.length <= 4 && !kb.box.startsWith('Part') ? `Box ${kb.box}:` : ''}
                          </span>
                          <span className="truncate max-w-[150px]">
                            {isFrench ? kb.nameFr : kb.nameEn}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="pt-3 mt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    <DocumentScanIndicator
                      documentCode={slip.code}
                      documentName={isFrench ? slip.titleFr : slip.titleEn}
                      scan={getScanForCode(slip.code)}
                      language={language}
                      onUpdateScan={(s) => handleUpdateScan(slip.code, isFrench ? slip.titleFr : slip.titleEn, s)}
                      variant="badge"
                      idPrefix={`dir-scan-act-${slip.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    />

                    <button
                      type="button"
                      id={`scan-slip-btn-${slip.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      onClick={() => {
                        if (onOpenScannerWithSlip) {
                          onOpenScannerWithSlip(slip.code as SlipType);
                        } else {
                          onOpenScanner();
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#064e3b] hover:bg-[#08634c] text-white font-bold text-[11px] flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                      title={isFrench ? `Scanner ${slip.code} avec l'IA` : `Scan ${slip.code} with AI`}
                    >
                      <Sparkles className="w-3 h-3 text-emerald-300" />
                      <span>{isFrench ? `Scanner ${slip.code}` : `Scan ${slip.code}`}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex flex-col items-end space-y-2 pt-2">
        {validationAttempted && !validationSummary.canProceed && (
          <div className="flex items-center space-x-1.5 text-xs text-rose-600 font-semibold bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>
              {isFrench
                ? 'Impossible de continuer : veuillez corriger les erreurs de format T4 ci-dessus.'
                : 'Cannot proceed: please resolve the CRA T4 slip layout errors above first.'}
            </span>
          </div>
        )}
        <button
          id="docs-continue-next-btn"
          onClick={handleAttemptNext}
          className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center space-x-2 shadow-md transition-all ${
            validationSummary.canProceed
              ? 'bg-[#064e3b] hover:bg-[#08634c] text-white cursor-pointer'
              : 'bg-slate-300 text-slate-600 cursor-not-allowed hover:bg-slate-300'
          }`}
        >
          <span>{isFrench ? 'Passer aux Renseignements Personnels' : 'Continue to Personal Info'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Reusable Slip Edit Modal for CRA T4, T4A, and T5 Slips */}
      <SlipEditModal
        isOpen={editingSlip !== null}
        onClose={() => setEditingSlip(null)}
        slipData={editingSlip}
        onSaveT4={handleSaveModalT4}
        onSaveOtherSlip={handleSaveModalOtherSlip}
        language={language}
      />

      {/* DocuSign E-Signature Pipeline Confirmation Modal */}
      <DocuSignModal
        isOpen={isDocuSignOpen}
        onClose={() => setIsDocuSignOpen(false)}
        document={selectedDocForSignature}
        taxReturn={taxReturn}
        language={language}
        onSignatureCompleted={handleSignatureCompleted}
      />
    </div>
  );
};
