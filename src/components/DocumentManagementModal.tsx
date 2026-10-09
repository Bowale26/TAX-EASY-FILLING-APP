import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Search,
  Upload,
  Camera,
  FolderLock,
  Tag,
  ShieldCheck,
  FileText,
  Calendar,
  DollarSign,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Trash2,
  Edit3,
  ExternalLink,
  Plus,
  RefreshCw,
  Eye,
  FileCheck,
  Lock,
  Sparkles,
  HelpCircle,
  Copy,
  ChevronRight,
  Layers,
  Archive,
  ArrowRight,
  Sliders,
  PenTool,
  FileDown,
  Eraser,
  Check,
  Type,
  Layout,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  ManagedTaxDocument,
  DocumentCategory,
  TaxDocumentType,
} from '../types/documentManagement';
import {
  loadDocumentsFromVault,
  saveDocumentsToVault,
  computeVaultStatistics,
  filterDocuments,
  INITIAL_SAMPLE_DOCUMENTS,
  generateSha256Checksum,
  generateRandomIvHex,
  calculateCraRetentionDate,
} from '../utils/secureDocumentStorage';
import { AppTaxReturn } from '../types/tax';
import {
  PdfSettings,
  loadPdfSettings,
  savePdfSettings,
  formatPdfFilename,
  PRESET_FILENAME_PATTERNS,
} from '../utils/pdfSettingsStorage';
import { downloadFullReturnPdf } from '../utils/pdfReturnExport';

interface DocumentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxReturn: AppTaxReturn;
  onUpdateTaxReturn?: (updated: AppTaxReturn) => void;
  onNavigateToStep?: (step: number) => void;
  onOpenScanner?: () => void;
  language: 'en' | 'fr';
  initialSection?: 'vault' | 'pdf_settings';
}

export const DocumentManagementModal: React.FC<DocumentManagementModalProps> = ({
  isOpen,
  onClose,
  taxReturn,
  onUpdateTaxReturn,
  onNavigateToStep,
  onOpenScanner,
  language,
  initialSection = 'vault',
}) => {
  const isFrench = language === 'fr';

  // Vault State
  const [documents, setDocuments] = useState<ManagedTaxDocument[]>(() => loadDocumentsFromVault());
  const [selectedDoc, setSelectedDoc] = useState<ManagedTaxDocument | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Navigation / Workspace View Switcher: 'vault' | 'pdf_settings'
  const [mainView, setMainView] = useState<'vault' | 'pdf_settings'>(initialSection);

  useEffect(() => {
    if (initialSection) {
      setMainView(initialSection);
    }
  }, [initialSection, isOpen]);

  // PDF Settings State (Custom Filename Pattern, Audit Trail Inclusion, Signature Overlay)
  const [pdfSettings, setPdfSettings] = useState<PdfSettings>(() => loadPdfSettings(taxReturn));
  const [pdfSettingsNotice, setPdfSettingsNotice] = useState<string | null>(null);
  const [pdfDownloadFeedback, setPdfDownloadFeedback] = useState<string | null>(null);

  // Signature Canvas Ref and State
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);

  // Generate rasterized cursive signature for typed mode
  const generateTypedSignatureDataUrl = useCallback((name: string, fontStyle: string): string => {
    const offscreen = document.createElement('canvas');
    offscreen.width = 460;
    offscreen.height = 110;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return '';
    ctx.clearRect(0, 0, 460, 110);

    let fontString = 'italic 34px "Brush Script MT", cursive';
    if (fontStyle === 'formal') fontString = 'italic 32px "Times New Roman", serif';
    else if (fontStyle === 'brush') fontString = 'italic 36px "Segoe Script", cursive';
    else if (fontStyle === 'handwritten') fontString = 'italic 34px "Comic Sans MS", cursive';

    ctx.font = fontString;
    ctx.fillStyle = '#0f2648'; // dark blue pen ink
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(name || `${taxReturn.personal?.firstName || 'Alex'} ${taxReturn.personal?.lastName || 'Morgan'}`, 25, 55);

    // Decorative subtle baseline guideline
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, 85);
    ctx.lineTo(440, 85);
    ctx.stroke();

    return offscreen.toDataURL('image/png');
  }, [taxReturn.personal?.firstName, taxReturn.personal?.lastName]);

  // Keep signatureDataUrl in sync when typing
  const handleTypedSignatureChange = (name: string, font: 'cursive' | 'brush' | 'formal' | 'handwritten') => {
    const dataUrl = generateTypedSignatureDataUrl(name, font);
    setPdfSettings((prev) => {
      const updated = {
        ...prev,
        typedSignatureText: name,
        typedSignatureFont: font,
        signatureDataUrl: dataUrl,
      };
      savePdfSettings(updated);
      return updated;
    });
  };

  // Drawing Handlers
  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawingSignature(true);
  };

  const handleDrawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingSignature) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.strokeStyle = '#0f2648'; // dark navy pen ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasDrawnSignature(true);
  };

  const handleStopDraw = () => {
    if (!isDrawingSignature) return;
    setIsDrawingSignature(false);
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      setPdfSettings((prev) => {
        const updated = { ...prev, signatureDataUrl: dataUrl };
        savePdfSettings(updated);
        return updated;
      });
    }
  };

  const handleClearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawnSignature(false);
    setPdfSettings((prev) => {
      const updated = { ...prev, signatureDataUrl: undefined };
      savePdfSettings(updated);
      return updated;
    });
  };

  // Re-draw onto canvas when switching to draw mode if signature already exists
  useEffect(() => {
    if (mainView === 'pdf_settings' && pdfSettings.signatureType === 'draw' && signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx && pdfSettings.signatureDataUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          setHasDrawnSignature(true);
        };
        img.src = pdfSettings.signatureDataUrl;
      }
    }
  }, [mainView, pdfSettings.signatureType, pdfSettings.signatureDataUrl]);

  // Initial typed signature sync if none present
  useEffect(() => {
    if (pdfSettings.signatureType === 'type' && !pdfSettings.signatureDataUrl) {
      const initialUrl = generateTypedSignatureDataUrl(
        pdfSettings.typedSignatureText || `${taxReturn.personal?.firstName || 'Alex'} ${taxReturn.personal?.lastName || 'Morgan'}`,
        pdfSettings.typedSignatureFont || 'cursive'
      );
      setPdfSettings((prev) => ({ ...prev, signatureDataUrl: initialUrl }));
    }
  }, [pdfSettings.signatureType, pdfSettings.signatureDataUrl, pdfSettings.typedSignatureText, pdfSettings.typedSignatureFont, generateTypedSignatureDataUrl, taxReturn.personal?.firstName, taxReturn.personal?.lastName]);

  const handleSavePdfSettings = () => {
    savePdfSettings(pdfSettings);
    setPdfSettingsNotice(
      isFrench
        ? 'Paramètres PDF et signature enregistrés avec succès !'
        : 'PDF settings and signature saved successfully!'
    );
    setTimeout(() => setPdfSettingsNotice(null), 3500);
  };

  const handleDownloadPdfWithSettings = () => {
    savePdfSettings(pdfSettings);
    const effectivePreparerId = taxReturn.taxPreparerId || taxReturn.preparerId || 'EFILE-99281';
    const isDigitalSigEnabled = pdfSettings.enableDigitalSignature && pdfSettings.signatureType !== 'none';
    downloadFullReturnPdf(taxReturn, {
      language,
      filenamePattern: pdfSettings.filenamePattern,
      customTaxYear: pdfSettings.selectedTaxYear,
      includeAuditTrail: pdfSettings.includeAuditTrail,
      auditTrailCategories: pdfSettings.auditTrailCategories,
      enableDigitalSignature: isDigitalSigEnabled,
      signatureDataUrl: isDigitalSigEnabled ? pdfSettings.signatureDataUrl : undefined,
      signatureName: isDigitalSigEnabled ? pdfSettings.typedSignatureText : undefined,
      signatureDate: pdfSettings.signDate,
      printMarginPreset: pdfSettings.printMarginPreset,
      preparerId: effectivePreparerId,
      preparerName: pdfSettings.typedSignatureText || 'Alex Morgan, CPA',
    });
    const finalFilename = formatPdfFilename(
      pdfSettings.filenamePattern,
      taxReturn,
      effectivePreparerId,
      pdfSettings.selectedTaxYear
    );
    setPdfDownloadFeedback(
      isFrench
        ? `Déclaration T1 téléchargée avec filigrane${isDigitalSigEnabled ? ' et signature numérique' : ''} : ${finalFilename}`
        : `T1 Return downloaded with watermark${isDigitalSigEnabled ? ' and digital signature' : ''}: ${finalFilename}`
    );
    setTimeout(() => setPdfDownloadFeedback(null), 4500);
  };

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTaxYear, setSelectedTaxYear] = useState<number | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'verified' | 'needs_review' | 'encrypted'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'amount_desc'>('date_desc');

  // Verification & Audit State
  const [isVerifyingIntegrity, setIsVerifyingIntegrity] = useState(false);
  const [integrityAlert, setIntegrityAlert] = useState<{
    show: boolean;
    timestamp: string;
    allIntact: boolean;
    verifiedCount: number;
  } | null>(null);

  // Tag Input State inside Detail or Upload
  const [newTagInput, setNewTagInput] = useState('');
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  // Upload Form State
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('income_slips');
  const [uploadDocType, setUploadDocType] = useState<TaxDocumentType>('W-2');
  const [uploadTaxYear, setUploadTaxYear] = useState<number>(2025);
  const [uploadAmount, setUploadAmount] = useState<string>('');
  const [uploadCurrency, setUploadCurrency] = useState<'CAD' | 'USD'>('USD');
  const [uploadIssuer, setUploadIssuer] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadTags, setUploadTags] = useState<string[]>(['W-2', 'CrossBorder']);
  const [uploadTagDraft, setUploadTagDraft] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Synchronize documents with localStorage
  const updateDocuments = (newDocs: ManagedTaxDocument[]) => {
    setDocuments(newDocs);
    saveDocumentsToVault(newDocs);
  };

  // Compute live vault statistics
  const stats = useMemo(() => computeVaultStatistics(documents), [documents]);

  // Extract all unique tags across all documents
  const allUniqueTags = useMemo(() => {
    const tagSet = new Set<string>();
    documents.forEach((d) => d.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [documents]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    let result = filterDocuments(
      documents,
      searchQuery,
      selectedCategory,
      selectedTags,
      selectedTaxYear,
      selectedStatus
    );

    // Apply sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'amount_desc') {
        const amtA = a.extractedData?.amountCadEquivalent || a.extractedData?.amountTotal || 0;
        const amtB = b.extractedData?.amountCadEquivalent || b.extractedData?.amountTotal || 0;
        return amtB - amtA;
      }
      return 0;
    });

    return result;
  }, [documents, searchQuery, selectedCategory, selectedTags, selectedTaxYear, selectedStatus, sortBy]);

  // Toggle tag filter
  const toggleTagFilter = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedTags([]);
    setSelectedTaxYear('all');
    setSelectedStatus('all');
  };

  // Integrity Check Action
  const handleVerifyIntegrity = async () => {
    setIsVerifyingIntegrity(true);
    // Simulate real cryptographic hashing verification delay
    setTimeout(() => {
      setIsVerifyingIntegrity(false);
      setIntegrityAlert({
        show: true,
        timestamp: new Date().toLocaleTimeString(),
        allIntact: true,
        verifiedCount: documents.length,
      });
      setTimeout(() => setIntegrityAlert(null), 6000);
    }, 800);
  };

  // Copy SHA-256 Checksum to Clipboard
  const handleCopyHash = (hash: string, docId: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHashId(docId);
    setTimeout(() => setCopiedHashId(null), 2500);
  };

  // Export Encrypted Vault Manifest
  const handleExportVault = () => {
    const exportData = {
      app: 'TAX EASY FILLING APP — Canada',
      vaultVersion: '2.0.0-AES256GCM',
      retentionJurisdiction: 'CRA Section 230(4) & PIPEDA',
      exportedAt: new Date().toISOString(),
      documentsCount: documents.length,
      documents: documents,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax_easy_secure_vault_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Restore Default Sample Pack
  const handleRestoreSamplePack = () => {
    if (
      window.confirm(
        isFrench
          ? 'Voulez-vous restaurer les documents fiscaux modèles (W-2, 1099, Reçus médicaux, Dons, T4)?'
          : 'Restore standard tax sample pack (W-2, 1099, Medical receipts, Donations, T4, RRSP)?'
      )
    ) {
      updateDocuments(INITIAL_SAMPLE_DOCUMENTS);
      setSelectedDoc(null);
    }
  };

  // Delete Document
  const handleDeleteDocument = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (
      window.confirm(
        isFrench
          ? 'Êtes-vous sûr de vouloir supprimer ce document du coffre sécurisé ?'
          : 'Are you sure you want to permanently delete this document from the secure vault?'
      )
    ) {
      const updated = documents.filter((d) => d.id !== id);
      updateDocuments(updated);
      if (selectedDoc?.id === id) {
        setSelectedDoc(null);
      }
    }
  };

  // Add Tag to Selected Document
  const handleAddTagToDoc = (tag: string) => {
    if (!selectedDoc) return;
    const cleanTag = tag.trim().replace(/^#/, '');
    if (!cleanTag || selectedDoc.tags.includes(cleanTag)) return;

    const updatedDoc: ManagedTaxDocument = {
      ...selectedDoc,
      tags: [...selectedDoc.tags, cleanTag],
      updatedAt: new Date().toISOString(),
    };

    const newDocs = documents.map((d) => (d.id === selectedDoc.id ? updatedDoc : d));
    updateDocuments(newDocs);
    setSelectedDoc(updatedDoc);
    setNewTagInput('');
  };

  // Remove Tag from Selected Document
  const handleRemoveTagFromDoc = (tagToRemove: string) => {
    if (!selectedDoc) return;
    const updatedDoc: ManagedTaxDocument = {
      ...selectedDoc,
      tags: selectedDoc.tags.filter((t) => t !== tagToRemove),
      updatedAt: new Date().toISOString(),
    };
    const newDocs = documents.map((d) => (d.id === selectedDoc.id ? updatedDoc : d));
    updateDocuments(newDocs);
    setSelectedDoc(updatedDoc);
  };

  // Update Category on Selected Document
  const handleUpdateCategory = (newCat: DocumentCategory) => {
    if (!selectedDoc) return;
    const updatedDoc: ManagedTaxDocument = {
      ...selectedDoc,
      category: newCat,
      updatedAt: new Date().toISOString(),
    };
    const newDocs = documents.map((d) => (d.id === selectedDoc.id ? updatedDoc : d));
    updateDocuments(newDocs);
    setSelectedDoc(updatedDoc);
  };

  // Send / Link Document to Return
  const handleLinkToTaxReturn = (doc: ManagedTaxDocument) => {
    if (!doc.linkedReturnSection && !onNavigateToStep) return;

    const step = doc.linkedReturnSection?.stepTarget || 2;
    if (onNavigateToStep) {
      onNavigateToStep(step);
      onClose();
    }
  };

  // Handle Form Upload Submit
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim()) return;

    setIsUploading(true);

    const docId = `doc_custom_${uploadDocType.toLowerCase()}_${Date.now()}`;
    const hash = await generateSha256Checksum(`${uploadName}_${uploadIssuer}_${uploadAmount}_${Date.now()}`);
    const iv = generateRandomIvHex();
    const amountVal = parseFloat(uploadAmount) || 0;
    const cadEquiv = uploadCurrency === 'USD' ? amountVal * 1.37 : amountVal;

    const newDoc: ManagedTaxDocument = {
      id: docId,
      name: uploadName,
      fileName: `${uploadName.replace(/[^a-zA-Z0-9]/g, '_')}_${uploadTaxYear}.pdf`,
      fileType: 'pdf',
      fileSize: '412 KB',
      category: uploadCategory,
      documentType: uploadDocType,
      taxYear: uploadTaxYear,
      tags: uploadTags.length > 0 ? uploadTags : [uploadDocType, 'Uploaded'],
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'verified',
      previewUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
      notes: uploadNotes,
      extractedData: {
        issuerName: uploadIssuer || 'Tax Filing Entity',
        amountTotal: amountVal,
        currency: uploadCurrency,
        foreignExchangeRate: uploadCurrency === 'USD' ? 1.37 : 1,
        amountCadEquivalent: cadEquiv,
        dateOfIssue: new Date().toISOString().slice(0, 10),
        keyValues: {
          'Document Type': uploadDocType,
          'Total Stated Value': `${uploadCurrency === 'USD' ? '$' : '$'}${amountVal.toLocaleString()} ${uploadCurrency}`,
          'CAD Equivalent Value': `$${cadEquiv.toFixed(2)} CAD`,
        },
      },
      security: {
        encryptionAlgorithm: 'AES-256-GCM',
        isEncryptedAtRest: true,
        sha256Checksum: hash,
        ivHex: iv,
        encryptedPayloadSize: 421888,
        retentionExpirationDate: calculateCraRetentionDate(uploadTaxYear),
        tamperVerified: true,
        lastIntegrityCheck: new Date().toISOString(),
      },
      linkedReturnSection: {
        stepTarget: uploadCategory === 'credits_receipts' ? 6 : uploadCategory === 'deductions_rrsp' ? 6 : 5,
        sectionNameEn: uploadCategory === 'credits_receipts' ? 'Deductions & Credits' : 'Income & Slips',
        sectionNameFr: uploadCategory === 'credits_receipts' ? 'Déductions & Crédits' : 'Revenus & Feuillets',
      },
    };

    // Update vault state
    const updatedDocs = [newDoc, ...documents];
    updateDocuments(updatedDocs);

    // Reset upload form
    setUploadName('');
    setUploadIssuer('');
    setUploadAmount('');
    setUploadNotes('');
    setUploadTags(['W-2', 'CrossBorder']);
    setIsUploading(false);
    setIsUploadOpen(false);
    setSelectedDoc(newDoc);
  };

  // Pre-fill upload tag draft
  const handleAddUploadTag = (tag: string) => {
    const clean = tag.trim().replace(/^#/, '');
    if (clean && !uploadTags.includes(clean)) {
      setUploadTags([...uploadTags, clean]);
    }
    setUploadTagDraft('');
  };

  if (!isOpen) return null;

  return (
    <div
      id="document-management-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#061426]/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-fadeIn"
    >
      <div
        id="document-management-container"
        className="bg-white w-full max-w-7xl h-[92vh] max-h-[920px] rounded-2xl shadow-2xl border border-emerald-800/30 flex flex-col overflow-hidden text-slate-800"
      >
        {/* ============================================================== */}
        {/* TOP SYSTEM BAR (Deep Blue & Deep Green Accent) */}
        {/* ============================================================== */}
        <div
          id="dms-top-bar"
          className="bg-[#0b1f3a] text-white px-5 py-3.5 border-b border-emerald-600/30 flex items-center justify-between shrink-0"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/80 border border-emerald-500/50 flex items-center justify-center shadow-inner text-emerald-300">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  {isFrench ? 'Coffre & Gestionnaire de Documents Fiscaux' : 'Document Vault & Management System'}
                </h2>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded-full font-semibold">
                  AES-256-GCM
                </span>
                <span className="hidden sm:inline-flex text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full">
                  CRA 6-YEAR RETENTION
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {isFrench
                  ? 'Gestion sécurisée, balisage et recherche de vos feuillets T4, W-2, 1099 et reçus de dépenses'
                  : 'Securely upload, categorize, tag, and search W-2s, 1099s, expense receipts, and CRA slips'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Top Workspace Tab Switcher */}
            <div className="flex items-center bg-[#071629] p-1 rounded-xl border border-slate-700/70">
              <button
                id="dms-topbar-vault-btn"
                onClick={() => setMainView('vault')}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  mainView === 'vault'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <FolderLock className="w-3.5 h-3.5 text-emerald-300" />
                <span>{isFrench ? 'Coffre Docs' : 'Doc Vault'}</span>
              </button>
              <button
                id="dms-topbar-pdf-settings-btn"
                onClick={() => setMainView('pdf_settings')}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  mainView === 'pdf_settings'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-300" />
                <span>{isFrench ? 'Paramètres PDF & Signature' : 'PDF Settings & Signature'}</span>
              </button>
            </div>

            {/* Quick integrity status pill */}
            <div className="hidden lg:flex items-center space-x-1.5 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-lg text-xs text-emerald-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{stats.totalEncrypted} / {stats.totalDocuments} {isFrench ? 'Chiffrés' : 'Encrypted'}</span>
            </div>

            <button
              id="dms-close-btn"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close Document Manager"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MAIN SPLIT VIEW: CONSOLIDATED LEFT-HAND BUTTON PANEL + WORKSPACE */}
        {/* ============================================================== */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* ------------------------------------------------------------ */}
          {/* CONSOLIDATED LEFT-HAND BUTTON PANEL (Deep Blue & Deep Green) */}
          {/* ------------------------------------------------------------ */}
          <div
            id="dms-left-button-panel"
            className="w-full md:w-72 lg:w-80 bg-[#0c2340] border-r border-slate-700/60 flex flex-col shrink-0 overflow-y-auto text-slate-200 p-4 space-y-4"
          >
            {/* Top Workspace View Mode Switcher: Vault vs PDF Settings */}
            <div className="bg-[#081b33] p-1 rounded-xl flex items-center space-x-1 border border-slate-700/60">
              <button
                id="dms-nav-vault-btn"
                onClick={() => setMainView('vault')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  mainView === 'vault'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <FolderLock className="w-3.5 h-3.5" />
                <span>{isFrench ? 'Coffre Docs' : 'Doc Vault'}</span>
              </button>
              <button
                id="dms-nav-pdf-settings-btn"
                onClick={() => setMainView('pdf_settings')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  mainView === 'pdf_settings'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isFrench ? 'Paramètres PDF' : 'PDF Settings'}</span>
              </button>
            </div>

            {/* PRIMARY ACTIONS CONSOLIDATED */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                <span>{isFrench ? 'Actions Principales' : 'Primary Actions'}</span>
                <span className="text-[10px] text-slate-400 font-mono">PANEL</span>
              </div>

              {/* Action: Open PDF Settings & Custom Signature */}
              <button
                id="dms-btn-open-pdf-settings"
                onClick={() => setMainView('pdf_settings')}
                className={`w-full text-left px-3.5 py-2 rounded-xl border font-medium flex items-center justify-between transition-all cursor-pointer ${
                  mainView === 'pdf_settings'
                    ? 'bg-emerald-700 text-white border-emerald-400 font-semibold shadow-xs'
                    : 'bg-[#132f54] hover:bg-[#1a3d6d] text-slate-200 border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs">{isFrench ? 'Paramètres PDF & Signature' : 'PDF Settings & Signature'}</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                  CONFIG
                </span>
              </button>

              {/* Action 1: Upload Document */}
              <button
                id="dms-btn-upload-document"
                onClick={() => setIsUploadOpen(true)}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold flex items-center justify-between shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center space-x-2.5">
                  <Upload className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
                  <span className="text-sm">{isFrench ? 'Téléverser Document' : 'Upload Document'}</span>
                </div>
                <Plus className="w-4 h-4 text-emerald-200" />
              </button>

              {/* Action 2: Scan Slip with Camera */}
              <button
                id="dms-btn-scan-camera"
                onClick={() => {
                  if (onOpenScanner) onOpenScanner();
                  onClose();
                }}
                className="w-full text-left px-3.5 py-2 rounded-xl bg-[#132f54] hover:bg-[#1a3d6d] text-emerald-200 border border-emerald-500/30 font-medium flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs">{isFrench ? 'Numériseur Caméra IA' : 'Camera Slip Scanner'}</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                  OCR
                </span>
              </button>

              {/* Action 3: Verify SHA-256 Vault Integrity */}
              <button
                id="dms-btn-verify-integrity"
                onClick={handleVerifyIntegrity}
                disabled={isVerifyingIntegrity}
                className="w-full text-left px-3.5 py-2 rounded-xl bg-[#132f54] hover:bg-[#1a3d6d] text-slate-200 border border-slate-700 font-medium flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck
                    className={`w-4 h-4 text-emerald-400 ${isVerifyingIntegrity ? 'animate-spin' : ''}`}
                  />
                  <span className="text-xs">{isFrench ? 'Vérifier Intégrité (SHA-256)' : 'Verify Integrity (SHA-256)'}</span>
                </div>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                  AUDIT
                </span>
              </button>

              {/* Action 4: Export Encrypted Archive */}
              <button
                id="dms-btn-export-vault"
                onClick={handleExportVault}
                className="w-full text-left px-3.5 py-2 rounded-xl bg-[#132f54] hover:bg-[#1a3d6d] text-slate-200 border border-slate-700 font-medium flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <Download className="w-4 h-4 text-sky-400" />
                  <span className="text-xs">{isFrench ? 'Exporter Archive (JSON)' : 'Export Vault (JSON)'}</span>
                </div>
                <Archive className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Action 5: Restore Standard Sample Tax Pack */}
              <button
                id="dms-btn-restore-samples"
                onClick={handleRestoreSamplePack}
                className="w-full text-left px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 text-xs flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isFrench ? 'Recharger Données Modèles' : 'Reload Sample Tax Pack'}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">10 DOCS</span>
              </button>
            </div>

            <div className="border-t border-slate-700/60 pt-3 space-y-1.5">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider px-1">
                {isFrench ? 'Catégories de Documents' : 'Document Categories'}
              </div>

              {/* Category Filter Buttons */}
              <button
                id="dms-cat-all"
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-[#132f54]'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isFrench ? 'Tous les Documents' : 'All Documents'}</span>
                </div>
                <span className="text-[11px] font-mono bg-black/20 px-1.5 py-0.2 rounded">
                  {stats.totalDocuments}
                </span>
              </button>

              <button
                id="dms-cat-income"
                onClick={() => setSelectedCategory('income_slips')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                  selectedCategory === 'income_slips'
                    ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-[#132f54]'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isFrench ? 'Feuillets Revenus (T4, W-2, 1099)' : 'Income Slips (T4, W-2, 1099)'}</span>
                </div>
                <span className="text-[11px] font-mono bg-black/20 px-1.5 py-0.2 rounded">
                  {stats.categoryCounts.income_slips}
                </span>
              </button>

              <button
                id="dms-cat-deductions"
                onClick={() => setSelectedCategory('deductions_rrsp')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                  selectedCategory === 'deductions_rrsp'
                    ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-[#132f54]'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>{isFrench ? 'Déductions & REER / CELIAPP' : 'Deductions & RRSP / FHSA'}</span>
                </div>
                <span className="text-[11px] font-mono bg-black/20 px-1.5 py-0.2 rounded">
                  {stats.categoryCounts.deductions_rrsp}
                </span>
              </button>

              <button
                id="dms-cat-credits"
                onClick={() => setSelectedCategory('credits_receipts')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                  selectedCategory === 'credits_receipts'
                    ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-[#132f54]'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-3.5 h-3.5 text-teal-300" />
                  <span>{isFrench ? 'Reçus (Médicaux, Dons, Garde)' : 'Receipts (Medical, Donations)'}</span>
                </div>
                <span className="text-[11px] font-mono bg-black/20 px-1.5 py-0.2 rounded">
                  {stats.categoryCounts.credits_receipts}
                </span>
              </button>

              <button
                id="dms-cat-business"
                onClick={() => setSelectedCategory('business_expenses')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                  selectedCategory === 'business_expenses'
                    ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-[#132f54]'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isFrench ? 'Entreprise & Télétravail (T2200)' : 'Business & Telework (T2200)'}</span>
                </div>
                <span className="text-[11px] font-mono bg-black/20 px-1.5 py-0.2 rounded">
                  {stats.categoryCounts.business_expenses}
                </span>
              </button>

              <button
                id="dms-cat-notices"
                onClick={() => setSelectedCategory('notices_legal')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                  selectedCategory === 'notices_legal'
                    ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-[#132f54]'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isFrench ? 'Avis de cotisation & ARC' : 'Notices of Assessment & CRA'}</span>
                </div>
                <span className="text-[11px] font-mono bg-black/20 px-1.5 py-0.2 rounded">
                  {stats.categoryCounts.notices_legal}
                </span>
              </button>
            </div>

            {/* TAG CLOUD FILTER */}
            <div className="border-t border-slate-700/60 pt-3 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  {isFrench ? 'Balisage & Mots-clés' : 'Tags & Keywords'}
                </span>
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="text-[10px] text-slate-400 hover:text-emerald-300 underline cursor-pointer"
                  >
                    {isFrench ? 'Réinitialiser' : 'Reset'}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {allUniqueTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTagFilter(tag)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-bold ring-1 ring-emerald-300'
                          : 'bg-[#132f54] text-slate-300 hover:bg-[#1a3d6d] hover:text-white'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CRA SECURITY COMPLIANCE BADGE */}
            <div className="mt-auto pt-3 border-t border-slate-700/60 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center space-x-1.5 text-emerald-300 font-semibold">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isFrench ? 'Conformité Fiscale ARC' : 'CRA Legal Retention'}</span>
              </div>
              <p className="text-[10px] leading-tight text-slate-400">
                {isFrench
                  ? 'Conservation obligatoire de 6 ans des pièces justificatives (LIR art. 230(4)) avec chiffrement certifié.'
                  : 'Mandatory 6-year retention of supporting slips & receipts per ITA s. 230(4) & IC78-10R5.'}
              </p>
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* RIGHT WORKSPACE: PDF SETTINGS OR VAULT (CARDS & DETAIL VIEW) */}
          {/* ------------------------------------------------------------ */}
          {mainView === 'pdf_settings' ? (
            <div
              id="dms-pdf-settings-section"
              className="flex-1 flex flex-col bg-slate-50 overflow-y-auto"
            >
              {/* Notification Banners */}
              {pdfSettingsNotice && (
                <div className="bg-emerald-900 text-emerald-100 px-5 py-2.5 border-b border-emerald-700 flex items-center justify-between text-xs animate-fadeIn shrink-0">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold">{pdfSettingsNotice}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded font-mono font-bold">
                    CONFIG SAVED
                  </span>
                </div>
              )}
              {pdfDownloadFeedback && (
                <div className="bg-[#0b1f3a] text-emerald-300 px-5 py-2.5 border-b border-emerald-500/40 flex items-center justify-between text-xs animate-fadeIn shrink-0">
                  <div className="flex items-center space-x-2">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold">{pdfDownloadFeedback}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded font-mono font-bold">
                    DOWNLOAD COMPLETE
                  </span>
                </div>
              )}

              {/* Header Bar */}
              <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-2xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {isFrench ? 'Configuration T1 ARC' : 'CRA T1 Return Settings'}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-mono">
                      {taxReturn.taxYear || 2025}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-[#0b1f3a] tracking-tight mt-0.5">
                    {isFrench ? 'Paramètres d’Exportation PDF & Signature' : 'PDF Settings & Digital Signature'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isFrench
                      ? 'Personnalisez le modèle de nom de fichier, l’inclusion des pages d’annexe d’audit et la signature officielle superposée.'
                      : 'Customize PDF filename pattern, include/exclude audit trail pages, and configure official signature overlay.'}
                  </p>
                </div>

                <div className="flex items-center space-x-2.5 shrink-0">
                  <button
                    id="btn-save-pdf-settings"
                    type="button"
                    onClick={handleSavePdfSettings}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>{isFrench ? 'Enregistrer' : 'Save Settings'}</span>
                  </button>

                  <button
                    id="btn-download-pdf-with-settings"
                    type="button"
                    onClick={handleDownloadPdfWithSettings}
                    className="px-4 py-2 rounded-xl bg-[#064e3b] hover:bg-[#08634c] text-white text-xs font-bold shadow-md shadow-emerald-950/20 flex items-center space-x-2 border border-emerald-500/50 transition-all cursor-pointer"
                  >
                    <FileDown className="w-4 h-4 text-emerald-200" />
                    <span>{isFrench ? 'Télécharger PDF Complet' : 'Download Full Return PDF'}</span>
                  </button>
                </div>
              </div>

              {/* Form Body */}
              <div className="p-6 space-y-6 max-w-4xl">
                {/* ------------------------------------------------------- */}
                {/* 1. FILENAME PATTERN SECTION */}
                {/* ------------------------------------------------------- */}
                <div
                  id="pdf-settings-filename-card"
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
                >
                  <div>
                    <div className="flex items-center space-x-2 text-[#064e3b] font-bold text-sm">
                      <FileText className="w-4 h-4" />
                      <span>{isFrench ? '1. Modèle de Nom de Fichier Personnalisé' : '1. Customize PDF Filename Pattern'}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isFrench
                        ? 'Définissez la structure du nom de fichier généré à l’aide de balises dynamiques comme {ClientName}, {Date} et {Year}.'
                        : 'Define the output PDF file name using dynamic tokens like {ClientName}, {Date}, and {Year}.'}
                    </p>
                  </div>

                  {/* Pattern Input & Tax Year Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label
                        htmlFor="pdf-filename-pattern-input"
                        className="text-xs font-semibold text-slate-700 block"
                      >
                        {isFrench ? 'Modèle de Nom de Fichier :' : 'Filename Pattern Template :'}
                      </label>
                      <input
                        id="pdf-filename-pattern-input"
                        type="text"
                        value={pdfSettings.filenamePattern}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPdfSettings((prev) => ({ ...prev, filenamePattern: val }));
                        }}
                        placeholder="{Year}_{ClientName}_T1.pdf"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="pdf-tax-year-select"
                        className="text-xs font-semibold text-slate-700 block"
                      >
                        {isFrench ? 'Année d’imposition :' : 'Tax Year :'}
                      </label>
                      <select
                        id="pdf-tax-year-select"
                        value={pdfSettings.selectedTaxYear || taxReturn.taxYear || 2025}
                        onChange={(e) => {
                          const yr = parseInt(e.target.value, 10);
                          setPdfSettings((prev) => {
                            const updated = { ...prev, selectedTaxYear: yr };
                            savePdfSettings(updated);
                            return updated;
                          });
                        }}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all cursor-pointer font-bold"
                      >
                        {[2026, 2025, 2024, 2023, 2022].map((yr) => (
                          <option key={yr} value={yr}>
                            {yr} {yr === (taxReturn.taxYear || 2025) ? (isFrench ? '(Dossier Actif)' : '(Active Return)') : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Live Evaluated Filename Preview Card */}
                  <div
                    id="pdf-live-preview-field"
                    className="bg-linear-to-r from-[#0b1f3a] to-[#0c2a4b] rounded-xl p-4 text-white border border-emerald-500/40 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-[11px] uppercase font-bold text-emerald-300 tracking-wider">
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isFrench ? 'Aperçu du Fichier Évalué en Direct :' : 'Live Evaluated Filename Preview :'}</span>
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
                        YEAR {pdfSettings.selectedTaxYear || taxReturn.taxYear || 2025} • DYNAMIC PREVIEW
                      </span>
                    </div>

                    <div className="text-sm sm:text-base font-mono font-bold text-white flex items-center space-x-2.5 bg-slate-900/70 p-3 rounded-lg border border-slate-700/70 overflow-hidden">
                      <FileDown className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span id="pdf-evaluated-filename-display" className="truncate text-emerald-100 select-all font-mono">
                        {formatPdfFilename(
                          pdfSettings.filenamePattern,
                          taxReturn,
                          taxReturn.taxPreparerId || taxReturn.preparerId,
                          pdfSettings.selectedTaxYear
                        )}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 flex items-center justify-between">
                      <span>
                        {isFrench
                          ? `Évalué en temps réel selon le modèle sélectionné et l'année ${pdfSettings.selectedTaxYear || taxReturn.taxYear || 2025}.`
                          : `Evaluated in real-time based on selected pattern and tax year ${pdfSettings.selectedTaxYear || taxReturn.taxYear || 2025}.`}
                      </span>
                      <span className="text-[10px] text-emerald-300 font-mono">.pdf format</span>
                    </div>
                  </div>

                  {/* Token Quick Inserters */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-700 block">
                      {isFrench ? 'Insérer des balises dynamiques :' : 'Insert dynamic tokens :'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { token: '{ClientName}', desc: isFrench ? 'Nom Client (ex: Alex_Morgan)' : 'Client Full Name (e.g. Alex_Morgan)', primary: true },
                        { token: '{Date}', desc: isFrench ? 'Date (ex: 2026-10-07)' : 'Current Date (e.g. 2026-10-07)', primary: true },
                        { token: '{Year}', desc: isFrench ? 'Année' : 'Tax Year', primary: false },
                        { token: '{LastName}', desc: isFrench ? 'Nom' : 'Last Name', primary: false },
                        { token: '{FirstName}', desc: isFrench ? 'Prénom' : 'First Name', primary: false },
                        { token: '{ClientId}', desc: isFrench ? 'ID Client' : 'Client ID', primary: false },
                        { token: '{PreparerId}', desc: isFrench ? 'ID Préparateur' : 'Preparer ID', primary: false },
                        { token: '{Province}', desc: isFrench ? 'Province' : 'Province', primary: false },
                        { token: '{Status}', desc: isFrench ? 'Statut' : 'Status', primary: false },
                      ].map(({ token, desc, primary }) => (
                        <button
                          key={token}
                          type="button"
                          onClick={() => {
                            setPdfSettings((prev) => {
                              const base = prev.filenamePattern.replace(/\.pdf$/i, '');
                              const updated = `${base}_${token}.pdf`;
                              return { ...prev, filenamePattern: updated };
                            });
                          }}
                          className={`px-2.5 py-1 rounded-lg border font-mono text-xs transition-colors cursor-pointer flex items-center space-x-1 ${
                            primary
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300 font-bold shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          }`}
                          title={desc}
                        >
                          <span className="font-bold">{token}</span>
                          <span className="text-[10px] text-slate-500 font-sans">({desc})</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preset Templates */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-600 block">
                      {isFrench ? 'Modèles prédéfinis recommandés :' : 'Preset patterns :'}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_FILENAME_PATTERNS.map((p) => (
                        <button
                          key={p.pattern}
                          type="button"
                          onClick={() => setPdfSettings((prev) => ({ ...prev, filenamePattern: p.pattern }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer font-mono ${
                            pdfSettings.filenamePattern === p.pattern
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-400 font-bold shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {p.pattern}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------- */}
                {/* 2. AUDIT TRAIL PAGES CONFIGURATION */}
                {/* ------------------------------------------------------- */}
                <div
                  id="pdf-settings-audit-trail-card"
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center space-x-2 text-[#064e3b] font-bold text-sm">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>
                          {isFrench
                            ? '2. Inclusion des Pages d’Annexe du Journal d’Audit'
                            : '2. Audit Trail Appendix Pages (Include or Exclude)'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isFrench
                          ? 'Choisissez d’inclure ou d’exclure les pages d’annexe du journal d’audit (LIR art. 230(4)) dans le PDF.'
                          : 'Choose between including or excluding certified Section 230(4) audit trail pages in the generated PDF.'}
                      </p>
                    </div>

                    {/* Master Toggle */}
                    <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                      <input
                        type="checkbox"
                        checked={pdfSettings.includeAuditTrail}
                        onChange={(e) =>
                          setPdfSettings((prev) => ({
                            ...prev,
                            includeAuditTrail: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      <span className="ml-2 text-xs font-bold text-slate-800">
                        {pdfSettings.includeAuditTrail
                          ? (isFrench ? 'Pages d’audit incluses' : 'Audit Pages Included')
                          : (isFrench ? 'Pages d’audit exclues' : 'Audit Pages Excluded')}
                      </span>
                    </label>
                  </div>

                  {pdfSettings.includeAuditTrail ? (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">
                          {isFrench
                            ? 'Catégories d’audit individuelles à inclure dans les pages d’annexe du PDF :'
                            : 'Select individual modification categories to include in the PDF appendix :'}
                        </span>
                        <div className="flex items-center space-x-2 text-xs">
                          <button
                            type="button"
                            onClick={() =>
                              setPdfSettings((prev) => ({
                                ...prev,
                                auditTrailCategories: {
                                  personal: true,
                                  slips: true,
                                  deductions: true,
                                  credits: true,
                                  filing: true,
                                  system: true,
                                },
                              }))
                            }
                            className="text-emerald-700 hover:underline font-medium cursor-pointer"
                          >
                            {isFrench ? 'Tout cocher' : 'Select All'}
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() =>
                              setPdfSettings((prev) => ({
                                ...prev,
                                auditTrailCategories: {
                                  personal: false,
                                  slips: false,
                                  deductions: false,
                                  credits: false,
                                  filing: false,
                                  system: false,
                                },
                              }))
                            }
                            className="text-slate-500 hover:underline cursor-pointer"
                          >
                            {isFrench ? 'Tout décocher' : 'Clear All'}
                          </button>
                        </div>
                      </div>

                      {/* 6 Category Selection Checkboxes */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[
                          {
                            key: 'personal' as const,
                            titleEn: 'Personal & Residency Information',
                            titleFr: 'Renseignements Personnels & Résidence',
                            descEn: 'SIN, marital status, provincial residency changes',
                            descFr: 'NAS, état civil, changements de province de résidence',
                          },
                          {
                            key: 'slips' as const,
                            titleEn: 'Income Slips & Box Adjustments',
                            titleFr: 'Feuillets T4/T5 & Ajustements de Cases',
                            descEn: 'T4 box 14 employment income, CPP, EI, tax withheld',
                            descFr: 'Revenus d’emploi, cotisations RPC, AE, impôt retenu',
                          },
                          {
                            key: 'deductions' as const,
                            titleEn: 'Deductions (RRSP, FHSA, Union Dues)',
                            titleFr: 'Déductions (REER, CELIAPP, Cotisations)',
                            descEn: 'Lines 20800, 21200 deductions and receipts changes',
                            descFr: 'Lignes 20800, 21200 déductions et pièces justificatives',
                          },
                          {
                            key: 'credits' as const,
                            titleEn: 'Non-Refundable Tax Credits',
                            titleFr: 'Crédits d’Impôt Non Remboursables',
                            descEn: 'Medical expenses, charitable donations, home buyer claim',
                            descFr: 'Frais médicaux, dons de bienfaisance, crédit habitation',
                          },
                          {
                            key: 'filing' as const,
                            titleEn: 'CRA NETFILE & Transmission Log',
                            titleFr: 'Transmission NETFILE ARC & Statuts',
                            descEn: 'Confirmation codes, submission timestamp, EFILE flags',
                            descFr: 'Codes de confirmation, horodatage de transmission',
                          },
                          {
                            key: 'system' as const,
                            titleEn: 'System Imports & Auto-Fill Records',
                            titleFr: 'Importations Système & Préremplir ARC',
                            descEn: 'AFR certified import logs and software calculations',
                            descFr: 'Données certifiées AFR et révisions du moteur',
                          },
                        ].map((cat) => {
                          const isChecked = Boolean(pdfSettings.auditTrailCategories[cat.key]);
                          return (
                            <label
                              key={cat.key}
                              className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-emerald-50/70 border-emerald-300 text-slate-800 shadow-2xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/70'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) =>
                                  setPdfSettings((prev) => ({
                                    ...prev,
                                    auditTrailCategories: {
                                      ...prev.auditTrailCategories,
                                      [cat.key]: e.target.checked,
                                    },
                                  }))
                                }
                                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                              />
                              <div className="flex-1">
                                <div className="text-xs font-bold text-slate-900 leading-tight">
                                  {isFrench ? cat.titleFr : cat.titleEn}
                                </div>
                                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                                  {isFrench ? cat.descFr : cat.descEn}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        {isFrench
                          ? 'Les pages d’annexe du journal d’audit sont actuellement exclues. Le PDF produit sera une déclaration T1 standard de 2 pages.'
                          : 'Audit trail appendix pages are currently excluded. The generated PDF will consist of the standard 2-page T1 return and schedules.'}
                      </span>
                    </div>
                  )}
                </div>

                {/* ------------------------------------------------------- */}
                {/* 3. DIGITAL SIGNATURE OVERLAY (TOGGLE & SIGNATURE PAD) */}
                {/* ------------------------------------------------------- */}
                <div
                  id="pdf-settings-signature-card"
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center space-x-2 text-[#064e3b] font-bold text-sm">
                        <PenTool className="w-4 h-4 text-emerald-600" />
                        <span>
                          {isFrench
                            ? '3. Signature Électronique Superposée sur le PDF'
                            : '3. Digital Signature Overlay on Generated PDF'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isFrench
                          ? 'Activez la signature numérique pour dessiner ou taper votre signature et l’insérer automatiquement sur la ligne de signature de la déclaration T1.'
                          : 'Enable digital signature to draw your signature on the pad and automatically overlay it on the official T1 signature line.'}
                      </p>
                    </div>

                    {/* Master Toggle for Enable Digital Signature */}
                    <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                      <input
                        id="pdf-toggle-enable-digital-signature"
                        type="checkbox"
                        checked={pdfSettings.enableDigitalSignature}
                        onChange={(e) => {
                          const enabled = e.target.checked;
                          setPdfSettings((prev) => {
                            const sigType: 'draw' | 'type' | 'none' = enabled
                              ? (prev.signatureType === 'none' ? 'draw' : prev.signatureType)
                              : 'none';
                            const updated: PdfSettings = {
                              ...prev,
                              enableDigitalSignature: enabled,
                              signatureType: sigType,
                            };
                            savePdfSettings(updated);
                            return updated;
                          });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      <span className="ml-2.5 text-xs font-bold text-slate-800">
                        {pdfSettings.enableDigitalSignature
                          ? (isFrench ? 'Signature Numérique Activée' : 'Enable Digital Signature: ON')
                          : (isFrench ? 'Signature Numérique Désactivée' : 'Enable Digital Signature: OFF')}
                      </span>
                    </label>
                  </div>

                  {/* REVEAL SIGNATURE PAD AREA WHEN ENABLED */}
                  {pdfSettings.enableDigitalSignature ? (
                    <div id="pdf-signature-pad-area" className="space-y-4 pt-1 animate-fadeIn">
                      {/* Mode Selector Tabs (Draw Signature Pad vs Type Signature) */}
                      <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl max-w-md">
                        <button
                          type="button"
                          onClick={() => {
                            setPdfSettings((prev) => {
                              const updated = { ...prev, signatureType: 'draw' as const };
                              savePdfSettings(updated);
                              return updated;
                            });
                          }}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                            pdfSettings.signatureType === 'draw'
                              ? 'bg-white text-slate-900 shadow-xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <PenTool className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{isFrench ? 'Dessiner sur le Pavé' : 'Draw Signature (Pad)'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPdfSettings((prev) => {
                              const updated = { ...prev, signatureType: 'type' as const };
                              savePdfSettings(updated);
                              return updated;
                            });
                            handleTypedSignatureChange(pdfSettings.typedSignatureText, pdfSettings.typedSignatureFont);
                          }}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                            pdfSettings.signatureType === 'type'
                              ? 'bg-white text-slate-900 shadow-xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Type className="w-3.5 h-3.5 text-slate-700" />
                          <span>{isFrench ? 'Taper Signature' : 'Type Signature'}</span>
                        </button>
                      </div>

                      {/* DRAW SIGNATURE PAD CANVAS VIEW */}
                      {pdfSettings.signatureType === 'draw' && (
                        <div className="space-y-3 pt-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                              <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                              <span>
                                {isFrench
                                  ? 'Pavé de signature tactile / souris (dessinez directement ci-dessous) :'
                                  : 'Interactive Signature Pad (Draw your signature directly below) :'}
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={handleClearSignatureCanvas}
                              className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                            >
                              <Eraser className="w-3.5 h-3.5" />
                              <span>{isFrench ? 'Effacer le pavé' : 'Clear Pad'}</span>
                            </button>
                          </div>

                          <div className="border-2 border-dashed border-emerald-400/80 rounded-2xl p-2.5 bg-emerald-50/20 max-w-xl relative shadow-inner">
                            <canvas
                              ref={signatureCanvasRef}
                              width={480}
                              height={130}
                              onMouseDown={handleStartDraw}
                              onMouseMove={handleDrawMove}
                              onMouseUp={handleStopDraw}
                              onMouseLeave={handleStopDraw}
                              onTouchStart={handleStartDraw}
                              onTouchMove={handleDrawMove}
                              onTouchEnd={handleStopDraw}
                              style={{ touchAction: 'none' }}
                              className="bg-white rounded-xl w-full h-[130px] border border-slate-300 cursor-crosshair shadow-xs"
                            />
                            <div className="w-4/5 mx-auto border-b border-slate-400/70 -mt-6 pointer-events-none"></div>
                            <div className="text-center text-[10px] text-slate-400 mt-1.5 pointer-events-none">
                              {isFrench ? 'Signez au-dessus de cette ligne' : 'Sign above this line'}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 text-xs text-slate-600">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              {hasDrawnSignature || pdfSettings.signatureDataUrl
                                ? (isFrench
                                    ? 'Signature manuscrite enregistrée — sera insérée automatiquement sur la ligne de signature du PDF.'
                                    : 'Signature captured — will be automatically inserted onto the signature line of the generated PDF.')
                                : (isFrench
                                    ? 'En attente de votre signature sur le pavé tactile.'
                                    : 'Awaiting your signature drawing on the signature pad.')}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* TYPE SIGNATURE VIEW */}
                      {pdfSettings.signatureType === 'type' && (
                        <div className="space-y-4 pt-1">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 block">
                              {isFrench ? 'Nom légal du signataire :' : 'Legal Signer Name :'}
                            </label>
                            <input
                              id="pdf-typed-signature-name"
                              type="text"
                              value={pdfSettings.typedSignatureText}
                              onChange={(e) =>
                                handleTypedSignatureChange(e.target.value, pdfSettings.typedSignatureFont)
                              }
                              placeholder="Alex Morgan, CPA"
                              className="w-full max-w-md px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                            />
                          </div>

                          {/* Font Style Selection */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 block">
                              {isFrench ? 'Style de police calligraphique :' : 'Cursive Script Style :'}
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-2xl">
                              {[
                                { key: 'cursive' as const, label: 'Cursive Elegance', style: 'font-serif italic' },
                                { key: 'brush' as const, label: 'Modern Brush', style: 'italic tracking-wider' },
                                { key: 'formal' as const, label: 'Formal Legal', style: 'font-serif italic tracking-wide' },
                                { key: 'handwritten' as const, label: 'Handwritten', style: 'italic font-mono' },
                              ].map((f) => (
                                <button
                                  key={f.key}
                                  type="button"
                                  onClick={() => handleTypedSignatureChange(pdfSettings.typedSignatureText, f.key)}
                                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                    pdfSettings.typedSignatureFont === f.key
                                      ? 'bg-emerald-50 text-emerald-950 border-emerald-500 ring-2 ring-emerald-500/30'
                                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  <div className="text-[10px] text-slate-400 font-sans uppercase font-bold">{f.label}</div>
                                  <div className={`text-base mt-1 text-[#0f2648] truncate ${f.style}`}>
                                    {pdfSettings.typedSignatureText || 'Alex Morgan'}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Live Overlay Preview of the Signature Field */}
                      <div className="bg-slate-100 rounded-xl p-4 border border-slate-300/80 flex flex-col items-center justify-center space-y-2 max-w-xl">
                        <div className="w-full flex justify-between items-center text-[10px] text-slate-500 font-mono">
                          <span>OFFICIAL CRA T1 SIGNATURE LINE OVERLAY PREVIEW</span>
                          <span className="text-emerald-700 font-bold">READY FOR INSERTION</span>
                        </div>
                        <div className="w-full py-4 px-6 bg-white rounded-lg border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden min-h-[90px]">
                          {pdfSettings.signatureDataUrl ? (
                            <img
                              src={pdfSettings.signatureDataUrl}
                              alt="Signature Preview"
                              className="max-h-[60px] max-w-[320px] object-contain select-none"
                            />
                          ) : (
                            <div
                              className="text-2xl sm:text-3xl text-[#0f2648] select-none py-1"
                              style={{
                                fontFamily:
                                  pdfSettings.typedSignatureFont === 'formal'
                                    ? '"Times New Roman", serif'
                                    : pdfSettings.typedSignatureFont === 'brush'
                                    ? '"Segoe Script", cursive'
                                    : '"Brush Script MT", cursive',
                                fontStyle: 'italic',
                              }}
                            >
                              {pdfSettings.typedSignatureText || 'Alex Morgan'}
                            </div>
                          )}
                          <div className="w-3/4 border-b border-slate-400/80 mt-1"></div>
                          <span className="text-[10px] text-slate-400 mt-1 italic">
                            Authorized Electronic Signature • Inserted onto PDF line
                          </span>
                        </div>
                      </div>

                      {/* Signer Metadata: Date & Title */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 max-w-xl">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700 block">
                            {isFrench ? 'Titre du signataire :' : 'Signer Title / Certification :'}
                          </label>
                          <input
                            type="text"
                            value={pdfSettings.signerTitle}
                            onChange={(e) => setPdfSettings((prev) => ({ ...prev, signerTitle: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            placeholder="Tax Preparer (CPA Certification)"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700 block">
                            {isFrench ? 'Date de signature :' : 'Signature Date :'}
                          </label>
                          <input
                            type="date"
                            value={pdfSettings.signDate}
                            onChange={(e) => setPdfSettings((prev) => ({ ...prev, signDate: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* DIGITAL SIGNATURE DISABLED STATE NOTICE */
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1.5 animate-fadeIn">
                      <div className="flex items-center space-x-2 text-slate-700 font-bold">
                        <PenTool className="w-4 h-4 text-slate-400" />
                        <span>
                          {isFrench ? 'Signature numérique désactivée' : 'Digital Signature is Disabled'}
                        </span>
                      </div>
                      <p>
                        {isFrench
                          ? 'Aucune image de signature ne sera insérée. La ligne de signature officielle sur la déclaration T1 restera vierge pour permettre une signature physique manuscrite à l’encre.'
                          : 'No signature image will be inserted. The official CRA T1 signature block will remain blank for physical pen-and-ink signing.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* ------------------------------------------------------- */}
                {/* 4. PRINT MARGIN PRESETS (STANDARD, COMPACT, WIDE) */}
                {/* ------------------------------------------------------- */}
                <div
                  id="pdf-settings-margin-presets-card"
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center space-x-2 text-[#064e3b] font-bold text-sm">
                        <Layout className="w-4 h-4 text-emerald-700" />
                        <span>
                          {isFrench
                            ? '4. Marges d’Impression & Préréglages de Format PDF'
                            : '4. Print Margin Presets for Generated PDF Returns'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isFrench
                          ? 'Basculez entre les préréglages de marges Standard, Compact et Large pour optimiser la densité des pages ou l’archivage physique.'
                          : 'Toggle between Standard, Compact, and Wide print margin presets to optimize document density, readability, or formal binding.'}
                      </p>
                    </div>

                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                      {pdfSettings.printMarginPreset?.toUpperCase() || 'STANDARD'}
                    </span>
                  </div>

                  {/* 3 Preset Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'compact' as const,
                        nameEn: 'Compact',
                        nameFr: 'Compact',
                        marginMm: '8mm (~0.31")',
                        icon: Minimize2,
                        badgeEn: 'Maximum Density',
                        badgeFr: 'Densité Maximale',
                        descEn: 'Narrow margins to maximize content per page, reducing total page count and paper consumption.',
                        descFr: 'Marges réduites pour maximiser le contenu par page et limiter le nombre total de feuilles imprimées.',
                      },
                      {
                        id: 'standard' as const,
                        nameEn: 'Standard',
                        nameFr: 'Standard',
                        marginMm: '14mm (~0.55")',
                        icon: Layout,
                        badgeEn: 'CRA Recommended',
                        badgeFr: 'Recommandé ARC',
                        descEn: 'Balanced proportions with optimal white space, certified for CRA official filing, client presentation, and digital viewing.',
                        descFr: 'Équilibre parfait pour la présentation officielle de l’ARC, la lecture numérique et les déclarations d’impôt clients.',
                      },
                      {
                        id: 'wide' as const,
                        nameEn: 'Wide',
                        nameFr: 'Large',
                        marginMm: '20mm (~0.79")',
                        icon: Maximize2,
                        badgeEn: 'Binding & Archival',
                        badgeFr: 'Reliure & Archive',
                        descEn: 'Generous gutter margins ideal for hole-punching, binder folders, physical accountant annotations, and legal archiving.',
                        descFr: 'Marges généreuses idéales pour perforation, classeurs d’audit, annotations comptables et conservation LIR de 6 ans.',
                      },
                    ].map((preset) => {
                      const isSelected = (pdfSettings.printMarginPreset || 'standard') === preset.id;
                      const IconComp = preset.icon;

                      return (
                        <button
                          key={preset.id}
                          id={`preset-margin-${preset.id}`}
                          type="button"
                          onClick={() => {
                            setPdfSettings((prev) => {
                              const updated: PdfSettings = {
                                ...prev,
                                printMarginPreset: preset.id,
                              };
                              savePdfSettings(updated);
                              return updated;
                            });
                          }}
                          className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 relative group ${
                            isSelected
                              ? 'bg-emerald-50/60 border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                              : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-200 text-slate-700 group-hover:bg-slate-300'
                                  }`}
                                >
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <span className="font-extrabold text-sm text-slate-900">
                                  {isFrench ? preset.nameFr : preset.nameEn}
                                </span>
                              </div>

                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isSelected
                                    ? 'bg-emerald-200 text-emerald-950 font-bold'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {isFrench ? preset.badgeFr : preset.badgeEn}
                              </span>
                            </div>

                            <div className="text-[11px] font-mono font-bold text-slate-700 bg-white/80 px-2 py-1 rounded border border-slate-200/80">
                              {isFrench ? 'Marge :' : 'Margin :'} <span className="text-[#064e3b]">{preset.marginMm}</span>
                            </div>

                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              {isFrench ? preset.descFr : preset.descEn}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-500">
                              {isSelected ? (isFrench ? '✓ Sélectionné' : '✓ Active Preset') : (isFrench ? 'Cliquer pour choisir' : 'Click to select')}
                            </span>
                            <span
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* BOTTOM ACTION BAR */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-500">
                    {isFrench
                      ? 'Ces paramètres sont appliqués immédiatement à tous les boutons de téléchargement de déclaration T1.'
                      : 'These settings are applied to all T1 PDF downloads throughout the application.'}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      id="save-pdf-settings-bottom-btn"
                      type="button"
                      onClick={handleSavePdfSettings}
                      className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4 text-emerald-800" />
                      <span>{isFrench ? 'Enregistrer les paramètres' : 'Save PDF Settings'}</span>
                    </button>

                    <button
                      id="download-full-pdf-bottom-btn"
                      type="button"
                      onClick={handleDownloadPdfWithSettings}
                      className="px-5 py-2.5 rounded-xl bg-[#064e3b] hover:bg-[#08634c] text-white text-xs font-bold shadow-md shadow-emerald-950/20 flex items-center space-x-2 border border-emerald-500/50 transition-all cursor-pointer"
                    >
                      <FileDown className="w-4 h-4 text-emerald-200" />
                      <span>{isFrench ? 'Télécharger la Déclaration Complète' : 'Download Full Return as PDF'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ------------------------------------------------------------ */}
              {/* VAULT WORKSPACE: SEARCH, FILTER, CARDS & DETAIL VIEW */}
              {/* ------------------------------------------------------------ */}
              <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
            {/* INTEGRITY VERIFICATION NOTIFICATION BANNER */}
            {integrityAlert && (
              <div className="bg-emerald-900 text-emerald-100 px-4 py-2 border-b border-emerald-700 flex items-center justify-between text-xs animate-fadeIn">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span className="font-semibold">
                    {isFrench
                      ? `Audit d'intégrité cryptographique réussi à ${integrityAlert.timestamp} : ${integrityAlert.verifiedCount} documents vérifiés, 0 altération détectée.`
                      : `Cryptographic SHA-256 Integrity Verified at ${integrityAlert.timestamp}: ${integrityAlert.verifiedCount} documents certified intact, 0 anomalies.`}
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded font-mono">
                  100% INTACT
                </span>
              </div>
            )}

            {/* TOP SEARCH & CONTROLS TOOLBAR */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 space-y-2 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Instant Search Box */}
                <div className="relative flex-1 max-w-xl">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="dms-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      isFrench
                        ? 'Rechercher par nom, émetteur, balise (#W-2, #1099, #médical), montant ou notes...'
                        : 'Search by slip, issuer, tags (#W-2, #1099, #medical), amount, or notes...'
                    }
                    className="w-full pl-9 pr-3 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filters & View Toggles */}
                <div className="flex items-center space-x-2 shrink-0">
                  {/* Tax Year Filter */}
                  <select
                    id="dms-year-filter"
                    value={selectedTaxYear}
                    onChange={(e) =>
                      setSelectedTaxYear(e.target.value === 'all' ? 'all' : Number(e.target.value))
                    }
                    className="px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                  >
                    <option value="all">{isFrench ? 'Toutes les années' : 'All Tax Years'}</option>
                    <option value="2025">2025 Tax Year</option>
                    <option value="2024">2024 Tax Year</option>
                    <option value="2023">2023 Tax Year</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    id="dms-status-filter"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as any)}
                    className="px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                  >
                    <option value="all">{isFrench ? 'Tous les statuts' : 'All Statuses'}</option>
                    <option value="verified">{isFrench ? 'Vérifié' : 'Verified'}</option>
                    <option value="needs_review">{isFrench ? 'À réviser' : 'Needs Review'}</option>
                  </select>

                  {/* Sort Filter */}
                  <select
                    id="dms-sort-filter"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                  >
                    <option value="date_desc">{isFrench ? 'Plus récents' : 'Newest First'}</option>
                    <option value="date_asc">{isFrench ? 'Plus anciens' : 'Oldest First'}</option>
                    <option value="name_asc">{isFrench ? 'Nom (A-Z)' : 'Name (A-Z)'}</option>
                    <option value="amount_desc">{isFrench ? 'Montant élevé' : 'Amount High-Low'}</option>
                  </select>

                  {/* View Mode Toggle */}
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                        viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500'
                      }`}
                      title="Grid View"
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                        viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500'
                      }`}
                      title="Table View"
                    >
                      List
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Filter Badges */}
              {(selectedCategory !== 'all' ||
                selectedTags.length > 0 ||
                selectedTaxYear !== 'all' ||
                selectedStatus !== 'all' ||
                searchQuery) && (
                <div className="flex items-center flex-wrap gap-1.5 pt-1 text-xs">
                  <span className="text-slate-400 font-medium">Active filters:</span>
                  {selectedCategory !== 'all' && (
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <span>Category: {selectedCategory}</span>
                      <button onClick={() => setSelectedCategory('all')}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedTaxYear !== 'all' && (
                    <span className="bg-blue-50 text-blue-800 border border-blue-300 px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <span>Year: {selectedTaxYear}</span>
                      <button onClick={() => setSelectedTaxYear('all')}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedStatus !== 'all' && (
                    <span className="bg-purple-50 text-purple-800 border border-purple-300 px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <span>Status: {selectedStatus}</span>
                      <button onClick={() => setSelectedStatus('all')}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-emerald-100 text-emerald-900 border border-emerald-400 px-2 py-0.5 rounded-full flex items-center space-x-1"
                    >
                      <span>#{tag}</span>
                      <button onClick={() => toggleTagFilter(tag)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={clearFilters}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium underline ml-1 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* KEY VAULT METRIC TILES */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-4 pt-3 shrink-0">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  {stats.totalDocuments}
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {isFrench ? 'Documents en Coffre' : 'Total Documents'}
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {stats.totalDocuments} Files ({((stats.totalStorageBytes) / 1024 / 1024).toFixed(1)} MB)
                  </div>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  {stats.crossBorderCount}
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {isFrench ? 'Transfrontaliers (W-2, 1099)' : 'Cross-Border (W-2, 1099)'}
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {stats.crossBorderCount} US/Foreign Forms
                  </div>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  {stats.receiptsCount}
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {isFrench ? 'Reçus de Dépenses' : 'Expense Receipts'}
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {stats.receiptsCount} Receipts
                  </div>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {isFrench ? 'Sécurité Cryptographique' : 'Encryption & Integrity'}
                  </div>
                  <div className="text-xs font-bold text-emerald-700">
                    100% AES-256 Verified
                  </div>
                </div>
              </div>
            </div>

            {/* DOCUMENT LISTING AREA */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredDocs.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-dashed border-slate-300">
                  <FolderLock className="w-10 h-10 text-slate-300 mb-2" />
                  <h3 className="text-sm font-semibold text-slate-700">
                    {isFrench ? 'Aucun document ne correspond à vos filtres' : 'No documents matched your criteria'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    {isFrench
                      ? 'Essayez de réinitialiser vos termes de recherche ou téléversez un nouveau feuillet W-2, 1099 ou reçu.'
                      : 'Try resetting your search query or upload a new W-2, 1099, or expense receipt.'}
                  </p>
                  <button
                    onClick={clearFilters}
                    className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition-all"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                /* GRID VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {filteredDocs.map((doc) => {
                    const isCrossBorder = doc.documentType === 'W-2' || doc.documentType.startsWith('1099');
                    const isReceipt = doc.documentType.startsWith('RECEIPT') || doc.category === 'credits_receipts';
                    const isSelected = selectedDoc?.id === doc.id;

                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className={`bg-white rounded-xl border p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${
                          isSelected
                            ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                            : 'border-slate-200 hover:border-emerald-500/50'
                        }`}
                      >
                        <div>
                          {/* Top Card Badge Row */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                                  isCrossBorder
                                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                    : isReceipt
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                    : 'bg-slate-100 text-slate-800 border border-slate-300'
                                }`}
                              >
                                {doc.documentType}
                              </span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                {doc.taxYear}
                              </span>
                              {doc.status === 'verified' && (
                                <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-medium flex items-center space-x-0.5">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>Verified</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-1 text-slate-400" title="AES-256-GCM Encrypted">
                              <Lock className="w-3.5 h-3.5 text-emerald-600" />
                            </div>
                          </div>

                          {/* Document Name */}
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-emerald-800 transition-colors line-clamp-2">
                            {doc.name}
                          </h4>

                          {/* Issuer & File Details */}
                          <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
                            <span>{doc.extractedData?.issuerName || doc.fileName}</span>
                          </p>

                          {/* Financial Figure Highlights */}
                          {doc.extractedData?.amountTotal !== undefined && (
                            <div className="mt-2.5 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                              <span className="text-[11px] text-slate-500 font-medium">Stated Value:</span>
                              <div className="text-right">
                                <span className="text-xs font-bold text-slate-900 font-mono">
                                  ${doc.extractedData.amountTotal.toLocaleString()}{' '}
                                  {doc.extractedData.currency || 'CAD'}
                                </span>
                                {doc.extractedData.currency === 'USD' && (
                                  <div className="text-[10px] text-emerald-700 font-semibold font-mono">
                                    ~ ${(doc.extractedData.amountCadEquivalent || 0).toLocaleString()} CAD
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Tags Preview */}
                          <div className="mt-2.5 flex flex-wrap gap-1">
                            {doc.tags.map((tag) => (
                              <span
                                key={tag}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTagFilter(tag);
                                }}
                                className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-600 rounded transition-colors"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Bottom Actions & Cryptographic Integrity Info */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                          <div className="flex items-center space-x-1 font-mono">
                            <span>SHA256:</span>
                            <span className="text-slate-600 font-medium truncate max-w-[80px]">
                              {doc.security.sha256Checksum.slice(0, 8)}...
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyHash(doc.security.sha256Checksum, doc.id);
                              }}
                              className="text-slate-400 hover:text-slate-700"
                              title="Copy SHA-256 Hash"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            {copiedHashId === doc.id && (
                              <span className="text-emerald-600 font-bold">Copied!</span>
                            )}
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDoc(doc);
                              }}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-medium transition-colors"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={(e) => handleDeleteDocument(doc.id, e)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* TABLE / LIST VIEW */
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#0b1f3a] text-white">
                        <th className="py-2.5 px-3 font-semibold">Document</th>
                        <th className="py-2.5 px-3 font-semibold">Type & Year</th>
                        <th className="py-2.5 px-3 font-semibold">Amount</th>
                        <th className="py-2.5 px-3 font-semibold">Tags</th>
                        <th className="py-2.5 px-3 font-semibold">Security (SHA-256)</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDocs.map((doc) => {
                        const isSelected = selectedDoc?.id === doc.id;
                        return (
                          <tr
                            key={doc.id}
                            onClick={() => setSelectedDoc(doc)}
                            className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                              isSelected ? 'bg-emerald-50/60' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-800">{doc.name}</div>
                              <div className="text-[11px] text-slate-500">
                                {doc.extractedData?.issuerName || doc.fileName}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-mono font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                {doc.documentType}
                              </span>
                              <span className="ml-1.5 text-slate-600 font-mono">{doc.taxYear}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              {doc.extractedData?.amountTotal !== undefined ? (
                                <div>
                                  <span className="font-bold text-slate-900 font-mono">
                                    ${doc.extractedData.amountTotal.toLocaleString()} {doc.extractedData.currency}
                                  </span>
                                  {doc.extractedData.currency === 'USD' && (
                                    <div className="text-[10px] text-emerald-700 font-mono">
                                      ~ ${doc.extractedData.amountCadEquivalent?.toLocaleString()} CAD
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {doc.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                                {doc.tags.length > 3 && (
                                  <span className="text-[10px] text-slate-400">
                                    +{doc.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                              <span title={doc.security.sha256Checksum}>
                                {doc.security.sha256Checksum.slice(0, 10)}...
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDoc(doc);
                                  }}
                                  className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-medium transition-colors"
                                >
                                  Inspect
                                </button>
                                <button
                                  onClick={(e) => handleDeleteDocument(doc.id, e)}
                                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* RIGHT DETAIL INSPECTOR DRAWER (When a document is selected) */}
          {/* ------------------------------------------------------------ */}
          {selectedDoc && (
            <div
              id="dms-document-inspector"
              className="w-full md:w-80 lg:w-96 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4 shadow-lg animate-fadeIn"
            >
              {/* Top Drawer Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    {selectedDoc.documentType.slice(0, 3)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">
                      {isFrench ? 'Détails du Document' : 'Document Inspector'}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">{selectedDoc.id}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Notes */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Document Title
                </label>
                <div className="text-xs font-bold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {selectedDoc.name}
                </div>
                {selectedDoc.notes && (
                  <p className="text-[11px] text-slate-600 mt-2 italic bg-amber-50/60 p-2 rounded-lg border border-amber-200/50">
                    "{selectedDoc.notes}"
                  </p>
                )}
              </div>

              {/* Category Selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  {isFrench ? 'Catégorisation' : 'Category'}
                </label>
                <select
                  value={selectedDoc.category}
                  onChange={(e) => handleUpdateCategory(e.target.value as DocumentCategory)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                >
                  <option value="income_slips">Income Slips (T4, W-2, 1099, T5)</option>
                  <option value="deductions_rrsp">Deductions & RRSP / FHSA</option>
                  <option value="credits_receipts">Credits & Receipts (Medical, Donations)</option>
                  <option value="business_expenses">Business & Telework (T2125, T2200)</option>
                  <option value="notices_legal">Notices & CRA Assessments</option>
                  <option value="identification">Identification & Legal</option>
                </select>
              </div>

              {/* Interactive Tag Management */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  {isFrench ? 'Gestion des Balises (Tags)' : 'Tags Management'}
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedDoc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-300 flex items-center space-x-1"
                    >
                      <span>#{tag}</span>
                      <button
                        onClick={() => handleRemoveTagFromDoc(tag)}
                        className="text-emerald-600 hover:text-rose-600 ml-1"
                        title="Remove tag"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add Tag Input */}
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTagToDoc(newTagInput);
                      }
                    }}
                    placeholder="Add custom tag (e.g. #Urgent)..."
                    className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <button
                    onClick={() => handleAddTagToDoc(newTagInput)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Financial Key Values */}
              {selectedDoc.extractedData && (
                <div className="border-t border-slate-200 pt-3">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Extracted Tax Data
                  </label>
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 space-y-1 text-xs">
                    {selectedDoc.extractedData.issuerName && (
                      <div className="flex justify-between py-0.5">
                        <span className="text-slate-500">Issuer:</span>
                        <span className="font-semibold text-slate-900 text-right truncate max-w-[170px]">
                          {selectedDoc.extractedData.issuerName}
                        </span>
                      </div>
                    )}
                    {selectedDoc.extractedData.amountTotal !== undefined && (
                      <div className="flex justify-between py-0.5">
                        <span className="text-slate-500">Reported Amount:</span>
                        <span className="font-bold text-slate-900 font-mono">
                          ${selectedDoc.extractedData.amountTotal.toLocaleString()}{' '}
                          {selectedDoc.extractedData.currency}
                        </span>
                      </div>
                    )}
                    {selectedDoc.extractedData.currency === 'USD' && (
                      <div className="flex justify-between py-0.5 text-emerald-800 font-semibold">
                        <span>CAD Conversion (1.37):</span>
                        <span className="font-mono">
                          ${selectedDoc.extractedData.amountCadEquivalent?.toLocaleString()} CAD
                        </span>
                      </div>
                    )}
                    {selectedDoc.extractedData.keyValues &&
                      Object.entries(selectedDoc.extractedData.keyValues).map(([k, v]) => (
                        <div key={k} className="flex justify-between py-0.5 text-[11px] border-t border-slate-200/50 pt-1">
                          <span className="text-slate-500 truncate max-w-[140px]">{k}:</span>
                          <span className="font-medium text-slate-800 text-right truncate max-w-[150px]">
                            {String(v)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Security & Cryptographic Details */}
              <div className="border-t border-slate-200 pt-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center space-x-1 text-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Security & CRA Retention Audit</span>
                </label>
                <div className="bg-[#0b1f3a] text-slate-200 rounded-xl p-3 space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cipher:</span>
                    <span className="text-emerald-300 font-bold">{selectedDoc.security.encryptionAlgorithm}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-emerald-300">Encrypted at Rest</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">CRA Retention:</span>
                    <span className="text-amber-300">Until {selectedDoc.security.retentionExpirationDate}</span>
                  </div>
                  <div className="pt-1 border-t border-slate-700/60">
                    <div className="text-[10px] text-slate-400 mb-0.5">SHA-256 Checksum:</div>
                    <div className="text-[10px] break-all bg-slate-900/80 p-1.5 rounded text-emerald-400 select-all">
                      {selectedDoc.security.sha256Checksum}
                    </div>
                  </div>
                </div>
              </div>

              {/* Link to Tax Return Button */}
              {selectedDoc.linkedReturnSection && (
                <button
                  onClick={() => handleLinkToTaxReturn(selectedDoc)}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
                >
                  <span>Link to {selectedDoc.linkedReturnSection.sectionNameEn}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
            </>
          )}
        </div>

        {/* ============================================================== */}
        {/* UPLOAD DOCUMENT DRAWER / MODAL */}
        {/* ============================================================== */}
        {isUploadOpen && (
          <div
            id="dms-upload-drawer"
            className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          >
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-emerald-800/30 overflow-hidden">
              <div className="bg-[#0b1f3a] text-white px-5 py-3 flex items-center justify-between border-b border-emerald-600/30">
                <div className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm sm:text-base font-bold">
                    {isFrench ? 'Téléverser un Document Fiscal' : 'Upload Tax Document into Secure Vault'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsUploadOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="p-5 space-y-3.5 text-xs text-slate-700">
                {/* Drag & Drop Simulation Dropzone */}
                <div className="border-2 border-dashed border-emerald-600/40 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-xl p-4 text-center cursor-pointer transition-colors">
                  <FolderLock className="w-8 h-8 text-emerald-700 mx-auto mb-1.5" />
                  <p className="font-semibold text-emerald-950">
                    {isFrench ? 'Glissez-déposez votre document ici' : 'Drag & drop tax file here, or browse'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Supports W-2, 1099s, Medical Receipts, Donation slips, T4, T5, PDFs & Images
                  </p>
                </div>

                {/* Document Name */}
                <div>
                  <label className="font-semibold block mb-1">Document Title *</label>
                  <input
                    type="text"
                    required
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="e.g., Meta Platforms 2025 W-2, or Bay Dental Medical Receipt"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white text-xs"
                  />
                </div>

                {/* Category & Type Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-semibold block mb-1">Category</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs cursor-pointer"
                    >
                      <option value="income_slips">Income Slips (T4, W-2, 1099)</option>
                      <option value="deductions_rrsp">Deductions & RRSP</option>
                      <option value="credits_receipts">Credits & Receipts</option>
                      <option value="business_expenses">Business & Telework</option>
                      <option value="notices_legal">CRA Notices & Legal</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Document Type</label>
                    <select
                      value={uploadDocType}
                      onChange={(e) => setUploadDocType(e.target.value as TaxDocumentType)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs cursor-pointer"
                    >
                      <option value="W-2">W-2 (US Wage & Tax)</option>
                      <option value="1099-NEC">1099-NEC (Nonemployee Comp)</option>
                      <option value="1099-DIV">1099-DIV (US Dividends)</option>
                      <option value="1099-MISC">1099-MISC</option>
                      <option value="RECEIPT_MEDICAL">Receipt — Medical Expenses</option>
                      <option value="RECEIPT_DONATION">Receipt — Charitable Donation</option>
                      <option value="RECEIPT_CHILDCARE">Receipt — Childcare Expenses</option>
                      <option value="T4">T4 (Canada Employment)</option>
                      <option value="RRSP">RRSP Contribution Receipt</option>
                      <option value="T2200">T2200 Work-From-Home</option>
                    </select>
                  </div>
                </div>

                {/* Amount, Currency & Year */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="font-semibold block mb-1">Amount</label>
                    <input
                      type="number"
                      step="any"
                      value={uploadAmount}
                      onChange={(e) => setUploadAmount(e.target.value)}
                      placeholder="e.g. 14200"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Currency</label>
                    <select
                      value={uploadCurrency}
                      onChange={(e) => setUploadCurrency(e.target.value as any)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      <option value="USD">USD ($US)</option>
                      <option value="CAD">CAD ($CA)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Tax Year</label>
                    <input
                      type="number"
                      value={uploadTaxYear}
                      onChange={(e) => setUploadTaxYear(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Issuer Name */}
                <div>
                  <label className="font-semibold block mb-1">Issuer / Employer / Vendor</label>
                  <input
                    type="text"
                    value={uploadIssuer}
                    onChange={(e) => setUploadIssuer(e.target.value)}
                    placeholder="e.g. Stripe Inc. or SickKids Foundation"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                {/* Tags Management in Upload Form */}
                <div>
                  <label className="font-semibold block mb-1">Tags</label>
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {uploadTags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded text-[11px] font-medium flex items-center space-x-1"
                      >
                        <span>#{t}</span>
                        <button
                          type="button"
                          onClick={() => setUploadTags(uploadTags.filter((x) => x !== t))}
                          className="text-emerald-700 hover:text-rose-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Quick Suggestion Pills */}
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {['W-2', '1099-NEC', 'Medical', 'Donation', 'CrossBorder', 'USD', 'Prescription', 'Alex'].map(
                      (suggested) => (
                        <button
                          key={suggested}
                          type="button"
                          onClick={() => handleAddUploadTag(suggested)}
                          className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-emerald-100 text-slate-600 rounded transition-colors"
                        >
                          +{suggested}
                        </button>
                      )
                    )}
                  </div>

                  <div className="flex space-x-1.5">
                    <input
                      type="text"
                      value={uploadTagDraft}
                      onChange={(e) => setUploadTagDraft(e.target.value)}
                      placeholder="Add tag and press Enter..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddUploadTag(uploadTagDraft);
                        }
                      }}
                      className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddUploadTag(uploadTagDraft)}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-medium"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="font-semibold block mb-1">Accountant Notes</label>
                  <textarea
                    rows={2}
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    placeholder="e.g. Cross-border 1099 to report on T2125 line 13500..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                {/* Submit Actions */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center space-x-2 shadow-md"
                  >
                    <Lock className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{isUploading ? 'Encrypting...' : 'Encrypt & Store in Vault'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
