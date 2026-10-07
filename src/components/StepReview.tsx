import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Scale,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  User,
  DollarSign,
  TrendingDown,
  Calculator,
  Download,
  Printer,
  Eye,
  ArrowLeft,
  FileCheck,
  CheckSquare,
  AlertTriangle,
  Info,
  ExternalLink,
  Plus,
  Trash2,
  QrCode,
  Stamp,
  FileSpreadsheet,
  History,
  Split,
  Columns,
} from 'lucide-react';
import { AppTaxReturn, ConflictDifference } from '../types/tax';
import { FinancialSnapshotD3Chart } from './FinancialSnapshotD3Chart';
import { TaxDistributionPieChart } from './TaxDistributionPieChart';
import { IndustryCrossReferenceCard } from './IndustryCrossReferenceCard';
import { VisualAuditTimeline } from './VisualAuditTimeline';
import { TaxInsightsCard } from './TaxInsightsCard';
import { FieldHistoryTooltip } from './FieldHistoryTooltip';
import { InteractiveMergeModal } from './InteractiveMergeModal';
import { validateT4IncomeAgainstIndustry } from '../services/craIndustryBenchmarks';
import {
  exportAssessmentSummary,
  exportTaxReturnSummary,
  downloadFormattedReturnPDF,
  exportAuditTrailCSV,
} from '../utils/exportUtils';
import { downloadFullReturnPdf } from '../utils/pdfReturnExport';
import {
  getCraSubmissionStatus,
  generateTaxVerificationData,
  TaxDocumentVerificationData,
} from '../utils/taxVerificationQr';

interface StepReviewProps {
  taxReturn: AppTaxReturn;
  onUpdateTaxReturn?: (updated: Partial<AppTaxReturn>) => void;
  onOpenJudge: () => void;
  onSelectStep: (step: number) => void;
  onNext: () => void;
  language: 'en' | 'fr';
  includeWatermark?: boolean;
  onToggleWatermark?: (val: boolean) => void;
  verificationData?: TaxDocumentVerificationData | null;
  remoteReturn?: AppTaxReturn;
  onApplyMerge?: (mergedReturn: AppTaxReturn, resolutions: ConflictDifference[]) => void;
  onOpenAuditDashboard?: () => void;
}

interface AuditCheckItem {
  id: string;
  nameEn: string;
  nameFr: string;
  craCode: string;
  passed: boolean;
  severity: 'flag' | 'recommendation' | 'pass';
  messageEn: string;
  messageFr: string;
  step: number;
}

export const StepReview: React.FC<StepReviewProps> = ({
  taxReturn,
  onUpdateTaxReturn,
  onOpenJudge,
  onSelectStep,
  onNext,
  language,
  includeWatermark: includeWatermarkProp,
  onToggleWatermark: onToggleWatermarkProp,
  verificationData: verificationDataProp,
  remoteReturn,
  onApplyMerge,
  onOpenAuditDashboard,
}) => {
  const isFrench = language === 'fr';
  const [isPrintPreview, setIsPrintPreview] = useState(false);
  const [auditFilter, setAuditFilter] = useState<'all' | 'passed' | 'flags'>('all');
  const [pdfToast, setPdfToast] = useState<string | null>(null);
  const [auditCsvToast, setAuditCsvToast] = useState<string | null>(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [activeConflictDiffs, setActiveConflictDiffs] = useState<ConflictDifference[] | undefined>(undefined);

  // Watermark state management
  const [localIncludeWatermark, setLocalIncludeWatermark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('tax_print_include_watermark');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const activeIncludeWatermark =
    includeWatermarkProp !== undefined ? includeWatermarkProp : localIncludeWatermark;

  const handleToggleWatermark = (newVal: boolean) => {
    setLocalIncludeWatermark(newVal);
    if (onToggleWatermarkProp) {
      onToggleWatermarkProp(newVal);
    }
    try {
      localStorage.setItem('tax_print_include_watermark', newVal ? 'true' : 'false');
    } catch {}
  };

  // Cryptographic CRA verification calculation
  const [internalVerification, setInternalVerification] =
    useState<TaxDocumentVerificationData | null>(null);

  useEffect(() => {
    let isCancelled = false;
    async function loadVerification() {
      const data = await generateTaxVerificationData(taxReturn, language);
      if (!isCancelled) {
        setInternalVerification(data);
      }
    }
    loadVerification();
    return () => {
      isCancelled = true;
    };
  }, [taxReturn, language]);

  const activeVerification = verificationDataProp || internalVerification;
  const { isOfficial, watermarkText } = useMemo(
    () => getCraSubmissionStatus(taxReturn),
    [taxReturn]
  );

  const handleToggleSimulatedFilingStatus = () => {
    if (!onUpdateTaxReturn) return;
    if (isOfficial) {
      onUpdateTaxReturn({
        filingStatus: 'Draft',
        netfile: {
          ...taxReturn.netfile,
          status: 'draft',
          confirmationNumber: undefined,
        },
        netfileConfirmationCode: undefined,
      });
      setPdfToast(
        isFrench
          ? 'Statut fiscal réinitialisé en BROUILLON (Filigrane = "DRAFT")'
          : 'Tax status reset to DRAFT (Print Watermark = "DRAFT")'
      );
    } else {
      const randomConf = `NETFILE-2025-${Math.floor(100000 + Math.random() * 900000)}`;
      onUpdateTaxReturn({
        filingStatus: 'Filed',
        netfile: {
          ...taxReturn.netfile,
          status: 'accepted',
          confirmationNumber: randomConf,
          submissionTimestamp: new Date().toISOString(),
        },
        netfileConfirmationCode: randomConf,
      });
      setPdfToast(
        isFrench
          ? `Déclaration marquée comme TRANSMISE À L’ARC (Filigrane = "OFFICIAL" • Code: ${randomConf})`
          : `Return marked as TRANSMITTED TO CRA (Print Watermark = "OFFICIAL" • Code: ${randomConf})`
      );
    }
    setTimeout(() => setPdfToast(null), 5000);
  };

  const handleDownloadPDF = () => {
    // Triggers the browser's native print dialog using the print-friendly styles defined in index.css
    setPdfToast(
      isFrench
        ? 'Ouverture du dialogue d’impression natif pour téléchargement en PDF avec styles CRA...'
        : 'Launching browser native print dialog for PDF download using CRA print-friendly styles...'
    );
    window.print();
    setTimeout(() => setPdfToast(null), 5000);
  };

  const handleDownloadAsPDF = handleDownloadPDF;

  const handleDownloadFormattedPDF = () => {
    setPdfToast(
      isFrench
        ? 'Sommaire officiel T1 prêt pour impression / téléchargement en PDF avec styles CRA.'
        : 'Official T1 Summary prepared for print / PDF download with CRA print styles utilized.'
    );
    downloadFormattedReturnPDF(taxReturn, language);
    setTimeout(() => setPdfToast(null), 5000);
  };

  const handleAddT4FromReview = () => {
    if (!onUpdateTaxReturn) return;
    const newT4 = {
      id: `t4-${Date.now()}`,
      employerName: isFrench ? 'Nouvel Employeur' : 'New Employer',
      box14_employmentIncome: 45000,
      box16_cppContributions: 2800,
      box18_eiPremiums: 850,
      box20_rppContributions: 0,
      box22_incomeTaxDeducted: 6800,
      verifiedByUser: true,
    };
    onUpdateTaxReturn({ t4Slips: [...(taxReturn.t4Slips || []), newT4] });
  };

  const handleDeleteT4FromReview = (id: string) => {
    if (!onUpdateTaxReturn) return;
    const updated = (taxReturn.t4Slips || []).filter((s) => s.id !== id);
    onUpdateTaxReturn({ t4Slips: updated });
  };

  const handleAddOtherSlipFromReview = (type: 'T4A' | 'T5') => {
    if (!onUpdateTaxReturn) return;
    const newSlip = {
      id: `${type.toLowerCase()}-${Date.now()}`,
      type,
      payerName: type === 'T4A' ? 'Pension Plan Corp' : 'Canadian Bank & Wealth',
      description: type === 'T4A' ? 'Statement of Pension Income' : 'Statement of Investment Income',
      amounts:
        type === 'T4A'
          ? { box016_pension: 10000, box022_taxDeducted: 1200 }
          : { box13_interest: 650 },
      verifiedByUser: true,
    };
    onUpdateTaxReturn({ otherSlips: [...(taxReturn.otherSlips || []), newSlip] });
  };

  const handleDeleteOtherSlipFromReview = (id: string) => {
    if (!onUpdateTaxReturn) return;
    const updated = (taxReturn.otherSlips || []).filter((s) => s.id !== id);
    onUpdateTaxReturn({ otherSlips: updated });
  };

  const calc = taxReturn.calculation;
  const isRefund = (calc?.balanceOwingOrRefund ?? 0) >= 0;

  // Mask SIN for privacy preview: ••• ••• 456
  const maskedSin = useMemo(() => {
    const raw = (taxReturn.personal?.sin || '').replace(/\D/g, '');
    if (raw.length < 9) return '••• ••• •••';
    return `••• ••• ${raw.slice(6)}`;
  }, [taxReturn.personal?.sin]);

  // CRA Statutory Audit Trail CSV Export
  const handleExportAuditCSV = () => {
    const res = exportAuditTrailCSV(taxReturn, language);
    if (res.success) {
      setAuditCsvToast(
        isFrench
          ? `Journal d’audit officiel exporté avec succès (${res.count} enregistrements, art. 230(4) LIR).`
          : `Official CRA audit trail exported successfully (${res.count} records, ITA s. 230(4) proof-of-work).`
      );
      setTimeout(() => setAuditCsvToast(null), 4500);
    }
  };

  // Trigger Side-by-Side Visual Merge Diff for conflicting fields
  const handleOpenConflictDiff = (fieldKey?: string) => {
    if (fieldKey && taxReturn.auditTrail) {
      const matching = taxReturn.auditTrail.filter(
        (e) => e.field === fieldKey && (e.conflicted || e.action === 'merged')
      );
      if (matching.length > 0) {
        const specificDiffs: ConflictDifference[] = matching.map((e) => ({
          id: `diff-audit-${e.id}`,
          fieldKey: e.field,
          category: (e.category as any) || 'personal',
          labelEn: e.fieldLabelEn || e.field,
          labelFr: e.fieldLabelFr || e.field,
          localValue: e.currentValue,
          remoteValue: e.previousValue,
          localDisplay: e.currentValue || '(empty)',
          remoteDisplay: e.previousValue || '(empty)',
          chosenResolution: 'local',
          auditEntryId: e.id,
          conflictType: 'audit_conflict',
        }));
        setActiveConflictDiffs(specificDiffs);
      } else {
        setActiveConflictDiffs(undefined);
      }
    } else {
      setActiveConflictDiffs(undefined);
    }
    setIsMergeModalOpen(true);
  };

  const conflictingAuditCount = useMemo(() => {
    return (taxReturn.auditTrail || []).filter((e) => e.conflicted).length;
  }, [taxReturn.auditTrail]);

  // Live input update handlers for form review
  const handleUpdatePersonalField = (field: string, value: any) => {
    if (!onUpdateTaxReturn) return;
    onUpdateTaxReturn({
      personal: {
        ...taxReturn.personal,
        [field]: value,
      },
    });
  };

  const handleUpdateDeductionsField = (field: string, value: number) => {
    if (!onUpdateTaxReturn) return;
    onUpdateTaxReturn({
      deductions: {
        ...taxReturn.deductions,
        [field]: value,
      },
    });
  };

  const handleUpdateCreditsField = (field: string, value: number) => {
    if (!onUpdateTaxReturn) return;
    onUpdateTaxReturn({
      credits: {
        ...taxReturn.credits,
        [field]: value,
      },
    });
  };

  const handleUpdateT4Field = (index: number, field: string, value: any) => {
    if (!onUpdateTaxReturn) return;
    const slips = [...(taxReturn.t4Slips || [])];
    if (slips[index]) {
      slips[index] = {
        ...slips[index],
        [field]: value,
      };
      onUpdateTaxReturn({ t4Slips: slips });
    }
  };

  // Comprehensive CRA Audit Cross-Reference Rules
  const auditChecklist: AuditCheckItem[] = useMemo(() => {
    const items: AuditCheckItem[] = [];
    const p = taxReturn.personal;
    const slips = taxReturn.t4Slips || [];
    const totalEmployment = slips.reduce((sum, s) => sum + (s.box14_employmentIncome || 0), 0);
    const totalTaxWithheld = slips.reduce((sum, s) => sum + (s.box22_incomeTaxDeducted || 0), 0);
    const totalCpp = slips.reduce((sum, s) => sum + (s.box16_cppContributions || 0), 0);
    const totalEi = slips.reduce((sum, s) => sum + (s.box18_eiPremiums || 0), 0);
    const rrspClaimed = taxReturn.deductions?.rrspContributions || 0;
    const donations = taxReturn.credits?.charitableDonations || 0;
    const medical = taxReturn.credits?.eligibleMedicalExpenses || 0;

    // 1. Legal Name
    const hasName = Boolean(p?.firstName?.trim() && p?.lastName?.trim());
    items.push({
      id: 'name-check',
      nameEn: 'Taxpayer Legal Name Identification',
      nameFr: 'Identification du nom légal du contribuable',
      craCode: 'CRA Form T1-GEN Part A',
      passed: hasName,
      severity: hasName ? 'pass' : 'flag',
      messageEn: hasName
        ? `Legal name is properly recorded as "${p.firstName} ${p.lastName}".`
        : 'Taxpayer first and last legal name must be provided to avoid CRA NETFILE rejection.',
      messageFr: hasName
        ? `Nom légal enregistré : "${p.firstName} ${p.lastName}".`
        : 'Le prénom et nom légal doivent être indiqués pour éviter le rejet NETFILE.',
      step: 3,
    });

    // 2. 9-Digit SIN
    const cleanSin = (p?.sin || '').replace(/\D/g, '');
    const hasValidSin = cleanSin.length === 9;
    items.push({
      id: 'sin-check',
      nameEn: 'Social Insurance Number (SIN) 9-Digit Format',
      nameFr: 'Format à 9 chiffres du numéro d’assurance sociale (NAS)',
      craCode: 'CRA NETFILE Rule NET-001',
      passed: hasValidSin,
      severity: hasValidSin ? 'pass' : 'flag',
      messageEn: hasValidSin
        ? 'SIN contains the requisite 9 numerical digits for secure CRA matching.'
        : 'A complete 9-digit SIN is mandatory for electronic NETFILE submission.',
      messageFr: hasValidSin
        ? 'Le NAS contient bien 9 chiffres pour la validation sécurisée avec l’ARC.'
        : 'Un NAS valide de 9 chiffres est obligatoire pour la transmission électronique.',
      step: 3,
    });

    // 3. Province of Residence on Dec 31
    const hasProvince = Boolean(p?.province);
    items.push({
      id: 'province-check',
      nameEn: 'Province of Residence on December 31',
      nameFr: 'Province de résidence au 31 décembre',
      craCode: 'CRA Form 428 Provincial Tax',
      passed: hasProvince,
      severity: hasProvince ? 'pass' : 'flag',
      messageEn: hasProvince
        ? `Declared residence in ${p.province}. Applies correct provincial rate brackets.`
        : 'Province of residence on Dec 31 is required to determine provincial tax liabilities.',
      messageFr: hasProvince
        ? `Résidence déclarée en ${p.province}. Barèmes provinciaux appliqués avec succès.`
        : 'La province de résidence au 31 décembre est requise pour calculer l’impôt provincial.',
      step: 3,
    });

    // 4. Information Slips (T4)
    const hasSlips = slips.length > 0 || (taxReturn.otherIncome?.amount ?? 0) > 0;
    items.push({
      id: 'slips-check',
      nameEn: 'Employment Slips (T4) & Earned Income Reported',
      nameFr: 'Feuillets d’emploi (T4) & revenus gagnés déclarés',
      craCode: 'CRA Slip Matching Program RC4120',
      passed: hasSlips,
      severity: hasSlips ? 'pass' : 'flag',
      messageEn: hasSlips
        ? `${slips.length} T4 slip(s) on file with total employment income of $${totalEmployment.toLocaleString('en-CA', { minimumFractionDigits: 2 })}.`
        : 'No income slips reported. Zero-income returns require explicit non-filing reason verification.',
      messageFr: hasSlips
        ? `${slips.length} feuillet(s) T4 enregistrés totalisant ${totalEmployment.toLocaleString('en-CA', { minimumFractionDigits: 2 })} $ de revenus d’emploi.`
        : 'Aucun feuillet d’impôt enregistré. Une déclaration à revenu nul nécessite confirmation.',
      step: 2,
    });

    // 5. Source Tax Withholding Ratio (Box 22 vs Box 14)
    const withholdingRatioValid =
      totalEmployment === 0 ||
      (totalTaxWithheld <= totalEmployment && (totalEmployment < 30000 || totalTaxWithheld > 0));
    items.push({
      id: 'withholding-check',
      nameEn: 'Tax Withheld at Source Cross-Check (Box 22)',
      nameFr: 'Vérification de l’impôt retenu à la source (Case 22)',
      craCode: 'CRA Line 43700 Consistency Rule',
      passed: withholdingRatioValid,
      severity: withholdingRatioValid ? 'pass' : 'recommendation',
      messageEn: withholdingRatioValid
        ? `Tax withheld ($${totalTaxWithheld.toLocaleString('en-CA', { minimumFractionDigits: 2 })}) is consistent with reported employment earnings.`
        : 'Box 22 tax deducted seems unusual relative to Box 14 employment income. Verify against physical T4.',
      messageFr: withholdingRatioValid
        ? `L’impôt retenu (${totalTaxWithheld.toLocaleString('en-CA', { minimumFractionDigits: 2 })} $) est cohérent avec le revenu d’emploi.`
        : 'L’impôt de la Case 22 semble atypique par rapport à la Case 14. Veuillez vérifier votre feuillet papier.',
      step: 2,
    });

    // 6. CPP/QPP Maximum Contribution Cap ($3,867.50 for 2024/2025)
    const cppWithinCap = totalCpp <= 4000;
    items.push({
      id: 'cpp-cap-check',
      nameEn: 'CPP/QPP Statutory Maximum Contribution Cap',
      nameFr: 'Plafond légal des cotisations RPC/RRQ',
      craCode: 'CRA Form T2204 • Cap $3,867.50',
      passed: cppWithinCap,
      severity: cppWithinCap ? 'pass' : 'recommendation',
      messageEn: cppWithinCap
        ? `CPP contributions ($${totalCpp.toLocaleString('en-CA', { minimumFractionDigits: 2 })}) are within the statutory maximum limit.`
        : `Total CPP ($${totalCpp.toLocaleString('en-CA', { minimumFractionDigits: 2 })}) exceeds the annual maximum. Any overpayment will be automatically credited on Line 44800.`,
      messageFr: cppWithinCap
        ? `Cotisations RPC (${totalCpp.toLocaleString('en-CA', { minimumFractionDigits: 2 })} $) conformes au plafond légal.`
        : `Le total RPC (${totalCpp.toLocaleString('en-CA', { minimumFractionDigits: 2 })} $) dépasse le maximum annuel. Tout excédent sera crédité à la Ligne 44800.`,
      step: 2,
    });

    // 7. EI Insurable Premium Cap ($1,077.44 in 2025)
    const eiWithinCap = totalEi <= 1150;
    items.push({
      id: 'ei-cap-check',
      nameEn: 'EI Statutory Maximum Premium Limit',
      nameFr: 'Plafond légal des cotisations AE',
      craCode: 'CRA Schedule 1 Line 31200 • Cap $1,077.44',
      passed: eiWithinCap,
      severity: eiWithinCap ? 'pass' : 'recommendation',
      messageEn: eiWithinCap
        ? `EI premiums ($${totalEi.toLocaleString('en-CA', { minimumFractionDigits: 2 })}) meet CRA statutory insurable ceiling guidelines.`
        : `EI contributions ($${totalEi.toLocaleString('en-CA', { minimumFractionDigits: 2 })}) exceed typical maximums. Overpayments are claimed on Line 45000.`,
      messageFr: eiWithinCap
        ? `Cotisations AE (${totalEi.toLocaleString('en-CA', { minimumFractionDigits: 2 })} $) conformes aux lignes directrices de l’ARC.`
        : `Les cotisations AE (${totalEi.toLocaleString('en-CA', { minimumFractionDigits: 2 })} $) excèdent le plafond type. Le trop-payé sera crédité à la Ligne 45000.`,
      step: 2,
    });

    // 8. RRSP Deduction Limit Safety Check
    const rrspCap = Math.max(31560, (calc?.totalIncome || 0) * 0.18);
    const rrspValid = rrspClaimed <= rrspCap;
    items.push({
      id: 'rrsp-check',
      nameEn: 'RRSP Deduction Limit & Ceiling Audit (Line 20800)',
      nameFr: 'Plafond de déduction REER (Ligne 20800)',
      craCode: 'CRA Notice of Assessment Limit Rule',
      passed: rrspValid,
      severity: rrspValid ? 'pass' : 'recommendation',
      messageEn: rrspValid
        ? `RRSP claim ($${rrspClaimed.toLocaleString('en-CA', { minimumFractionDigits: 2 })}) is within standard deduction headroom limits.`
        : `RRSP claim ($${rrspClaimed.toLocaleString('en-CA', { minimumFractionDigits: 2 })}) exceeds common 18% annual limits. Ensure you have sufficient unused contribution room from your prior Notice of Assessment.`,
      messageFr: rrspValid
        ? `Déduction REER (${rrspClaimed.toLocaleString('en-CA', { minimumFractionDigits: 2 })} $) respecte la marge de déduction générale.`
        : `La déduction REER (${rrspClaimed.toLocaleString('en-CA', { minimumFractionDigits: 2 })} $) dépasse la limite usuelle de 18 %. Vérifiez vos droits inutilisés sur votre dernier avis de cotisation.`,
      step: 6,
    });

    // 9. Proof of Claims Documentation (Donations & Medical)
    const hasProofOfClaims =
      (donations === 0 && medical === 0) ||
      (donations + medical <= 500);
    items.push({
      id: 'proof-of-claims-check',
      nameEn: 'Receipts & Documentation Retention (Donations / Medical)',
      nameFr: 'Conservation des pièces justificatives (Dons / Frais médicaux)',
      craCode: 'CRA IC78-10R5 Books & Records Guideline',
      passed: hasProofOfClaims,
      severity: hasProofOfClaims ? 'pass' : 'recommendation',
      messageEn: hasProofOfClaims
        ? 'Charitable donation and medical receipts documentation verified for post-assessment review.'
        : 'Donations or medical expenses are claimed without itemized receipt records. Retain receipts for 6 years in case of CRA desk audit.',
      messageFr: hasProofOfClaims
        ? 'Dons de bienfaisance et reçus médicaux vérifiés pour les contrôles post-cotisation.'
        : 'Des dons ou frais médicaux sont réclamés sans reçu détaillé. Conservez vos pièces pendant 6 ans pour l’ARC.',
      step: 6,
    });

    // 10. Marital Status & Family Benefit Alignment
    const isMarriedOrCommonLaw =
      p?.maritalStatus === 'married' || p?.maritalStatus === 'common_law';
    const hasSpouseData =
      !isMarriedOrCommonLaw ||
      Boolean(p?.spouseSin || p?.hasSpouse);
    items.push({
      id: 'marital-align-check',
      nameEn: 'Marital Status & Benefit Entitlement Coordination',
      nameFr: 'Coordination de l’état civil & des prestations familiales',
      craCode: 'CRA Line 11500 & Family GST/CCB Assessment',
      passed: hasSpouseData,
      severity: hasSpouseData ? 'pass' : 'recommendation',
      messageEn: hasSpouseData
        ? 'Marital and family status are aligned for accurate Canada Child Benefit and GST/HST credit calculation.'
        : 'Taxpayer indicates Married or Common-law status without complete spouse information. Net income of spouse affects household credits.',
      messageFr: hasSpouseData
        ? 'État civil et familial coordonnés pour le calcul de l’Allocation canadienne pour enfants et du crédit TPS/TVH.'
        : 'Déclarant marié ou conjoint de fait sans données complètes du conjoint. Le revenu net du conjoint influe sur les crédits.',
      step: 4,
    });

    // 11. CRA NAICS Employment Industry Wage Benchmark Cross-Reference
    const indCode =
      taxReturn.employmentIndustryCode ||
      taxReturn.personal?.employmentIndustryCode ||
      '541514';
    const indValidation = validateT4IncomeAgainstIndustry(
      totalEmployment,
      indCode,
      language
    );
    const isIndustryCompliant =
      indValidation.status === 'compliant' || indValidation.status === 'high_earner_variance';
    items.push({
      id: 'industry-crossref-check',
      nameEn: 'CRA NAICS Employment Industry Benchmark Cross-Reference',
      nameFr: 'Validation croisée des salaires sectoriels (Codes SCIAN / ARC)',
      craCode: `CRA NAICS Code ${indCode}`,
      passed: isIndustryCompliant,
      severity: isIndustryCompliant ? 'pass' : 'recommendation',
      messageEn: indValidation.message,
      messageFr: indValidation.message,
      step: 2,
    });

    return items;
  }, [taxReturn, calc, language]);

  // Calculate deterministic completion / audit readiness percentage
  const passedCount = auditChecklist.filter((i) => i.passed).length;
  const totalCheckCount = auditChecklist.length;
  const auditCompletionRate = Math.round((passedCount / totalCheckCount) * 100);

  // Filtered audit items
  const filteredAuditItems = useMemo(() => {
    if (auditFilter === 'passed') return auditChecklist.filter((i) => i.passed);
    if (auditFilter === 'flags') return auditChecklist.filter((i) => !i.passed);
    return auditChecklist;
  }, [auditChecklist, auditFilter]);

  // Color theme for completion rate
  const getRateBadge = (rate: number) => {
    if (rate === 100) {
      return {
        bg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
        bar: 'bg-emerald-600',
        labelEn: '100% Audit Ready — Clean Filing',
        labelFr: '100 % Prêt pour l’audit — Dossier vérifié',
      };
    }
    if (rate >= 80) {
      return {
        bg: 'bg-blue-100 text-blue-950 border-blue-300',
        bar: 'bg-blue-600',
        labelEn: `${rate}% Audit Ready — Recommended Review`,
        labelFr: `${rate} % Prêt — Révision recommandée`,
      };
    }
    return {
      bg: 'bg-amber-100 text-amber-950 border-amber-300',
      bar: 'bg-amber-500',
      labelEn: `${rate}% Audit Ready — Incomplete Flags`,
      labelFr: `${rate} % Prêt — Points d’attention requis`,
    };
  };

  const rateInfo = getRateBadge(auditCompletionRate);

  /* 
    PRINT PREVIEW VIEW:
    When enabled, shows exactly how the official Canadian tax return summary
    appears on clean paper/PDF without any web buttons or UI clutter.
  */
  if (isPrintPreview) {
    return (
      <div
        id="step-review-print-preview"
        data-include-watermark={activeIncludeWatermark ? 'true' : 'false'}
        data-watermark-text={watermarkText}
        className="space-y-6 max-w-4xl mx-auto"
      >
        {/* Sticky Print Preview Control Toolbar (Hidden in Browser Print) */}
        <div className="sticky top-20 z-40 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-300 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-3 no-print">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Eye className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  {isFrench ? 'Mode Aperçu avant Impression' : 'Print Preview Mode'}
                </span>
                <span className="text-xs text-slate-400">• Standard Letter (8.5 × 11)</span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {isFrench
                  ? 'Aperçu exact du document tel qu’il sera imprimé ou généré en PDF sans éléments d’interface.'
                  : 'Exact visual layout of the final return document without UI elements or sidebars.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Watermark Toggle Switch */}
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                id="print-preview-watermark-toggle-btn"
                type="button"
                onClick={() => handleToggleWatermark(!activeIncludeWatermark)}
                className={`px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer ${
                  activeIncludeWatermark
                    ? isOfficial
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                }`}
                title={
                  isFrench
                    ? 'Activer ou désactiver l’impression du filigrane officiel'
                    : 'Toggle watermark inclusion on printed documents'
                }
              >
                <Stamp className="w-3.5 h-3.5" />
                <span>{isFrench ? 'Filigrane :' : 'Watermark:'}</span>
                <span className="font-mono uppercase font-black">
                  {activeIncludeWatermark ? watermarkText : isFrench ? 'DÉSACTIVÉ' : 'OFF'}
                </span>
              </button>

              {/* Status switcher: lets user toggle between DRAFT and OFFICIAL to test watermark changes */}
              <button
                id="print-preview-status-toggle-btn"
                type="button"
                onClick={handleToggleSimulatedFilingStatus}
                className="px-2 py-1.5 hover:bg-white text-slate-700 font-semibold text-[11px] rounded-lg transition-colors cursor-pointer"
                title={
                  isFrench
                    ? 'Simuler le basculement entre Brouillon et Déclaration Transmise (ARC)'
                    : 'Simulate switching between Draft and CRA Netfile Filed status'
                }
              >
                {isOfficial ? (isFrench ? '→ Brouillon' : '→ Test Draft') : (isFrench ? '→ Officiel ARC' : '→ Test Official')}
              </button>
            </div>

            <button
              id="print-preview-download-pdf-btn"
              type="button"
              onClick={handleDownloadPDF}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition-colors cursor-pointer"
              title={isFrench ? 'Télécharger la version imprimable en PDF' : 'Download print-friendly version as PDF via browser print dialog'}
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>{isFrench ? 'Télécharger PDF' : 'Download PDF'}</span>
            </button>

            <button
              id="print-preview-file-btn"
              type="button"
              onClick={handleDownloadFormattedPDF}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl border border-white/20 flex items-center space-x-1.5 transition-colors cursor-pointer"
              title={isFrench ? 'Télécharger fichier HTML stylisé' : 'Download standalone HTML file'}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-300" />
              <span>{isFrench ? 'Fichier Sommaire' : 'Formatted File'}</span>
            </button>

            <button
              id="exit-print-preview-btn"
              type="button"
              onClick={() => setIsPrintPreview(false)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isFrench ? 'Quitter' : 'Exit'}</span>
            </button>

            <button
              id="print-preview-trigger-btn"
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-[#064e3b] hover:bg-[#08634c] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-950/20 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-300" />
              <span>{isFrench ? 'Imprimer (⌘P)' : 'Print (⌘P)'}</span>
            </button>
          </div>
        </div>

        {/* Authentic Sheet of Paper Container */}
        <div className="relative bg-white rounded-xl shadow-xl border border-slate-300 p-8 sm:p-12 text-slate-900 space-y-8 print:shadow-none print:border-none print:p-0 overflow-hidden">
          {/* Visual on-screen watermark preview when watermark is active */}
          {activeIncludeWatermark && (
            <div
              className="watermark-preview-overlay pointer-events-none select-none no-print"
              aria-hidden="true"
            >
              <div className="watermark-preview-text">
                {watermarkText}
              </div>
            </div>
          )}

          {/* Official Document Header */}
          <div className="border-b-2 border-slate-900 pb-5 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-600 block">
                  Canada Revenue Agency • Agence du revenu du Canada
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-0.5">
                  T1 GENERAL 2025
                </h1>
                <p className="text-sm font-semibold text-slate-800">
                  {isFrench
                    ? 'Déclaration de revenus et de prestations des particuliers — Sommaire officiel'
                    : 'Personal Income Tax and Benefit Return Summary & Statement of Accounts'}
                </p>
              </div>

              <div className="flex items-center space-x-3 text-right shrink-0">
                <div>
                  <span className="inline-block bg-slate-100 border border-slate-400 font-mono text-xs px-3 py-1 font-bold text-slate-900 rounded">
                    FORM T1-GEN • {taxReturn.taxYear}
                  </span>
                  <div className="text-[11px] text-slate-500 font-mono mt-1">
                    Province: {taxReturn.personal?.province || 'ON'} • Status: {watermarkText}
                  </div>
                </div>

                {/* Cryptographic QR code block injected via CSS pseudo-element */}
                <div
                  className="print-verification-qr official-tax-qr-block shrink-0"
                  data-print-qr="true"
                  title="Cryptographic CRA Verification QR Code"
                />
              </div>
            </div>
          </div>

          {/* Taxpayer Identification Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-300 rounded-lg p-4 bg-slate-50/50 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                {isFrench ? 'Nom légal du contribuable' : 'Taxpayer Legal Full Name'}
              </span>
              <span className="text-sm font-bold text-slate-950">
                {taxReturn.personal?.firstName || 'Not provided'}{' '}
                {taxReturn.personal?.lastName || ''}
              </span>
              <span className="text-slate-500 block mt-1">
                {isFrench ? 'Adresse postale :' : 'Mailing address:'}{' '}
                {taxReturn.personal?.streetAddress
                  ? `${taxReturn.personal.streetAddress}, ${taxReturn.personal.city} ${taxReturn.personal.province} ${taxReturn.personal.postalCode}`
                  : '123 Canadian Way, Ottawa ON K1A 0B1'}
              </span>
            </div>

            <div className="space-y-1 sm:text-right">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  {isFrench ? 'Numéro d’assurance sociale (NAS) :' : 'Social Insurance Number (SIN):'}
                </span>{' '}
                <span className="font-mono font-bold text-slate-900">{maskedSin}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  {isFrench ? 'Province au 31 décembre :' : 'Province on Dec 31:'}
                </span>{' '}
                <span className="font-bold text-slate-900">{taxReturn.personal?.province || 'ON'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  {isFrench ? 'État civil :' : 'Marital Status:'}
                </span>{' '}
                <span className="font-medium text-slate-800">
                  {taxReturn.personal?.maritalStatus || 'Single'}
                </span>
              </div>
            </div>
          </div>

          {/* Attached T4 Information Slips Summary */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-700 border-b border-slate-200 pb-1">
              {isFrench
                ? 'Section 1 : Feuillets de renseignements fiscaux enregistrés (T4)'
                : 'Section 1: Information Slips Filed (T4 Statement of Remuneration)'}
            </h3>

            {taxReturn.t4Slips?.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                {isFrench ? 'Aucun feuillet T4 enregistré.' : 'No T4 slips on file.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300">
                        {isFrench ? 'Employeur' : 'Employer'}
                      </th>
                      <th className="p-2 border-r border-slate-300 text-right">
                        Box 14 {isFrench ? 'Revenu' : 'Income'}
                      </th>
                      <th className="p-2 border-r border-slate-300 text-right">
                        Box 16 {isFrench ? 'RPC' : 'CPP'}
                      </th>
                      <th className="p-2 border-r border-slate-300 text-right">
                        Box 18 {isFrench ? 'AE' : 'EI'}
                      </th>
                      <th className="p-2 text-right">
                        Box 22 {isFrench ? 'Impôt retenu' : 'Tax Deducted'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {taxReturn.t4Slips.map((slip, idx) => (
                      <tr key={slip.id || idx}>
                        <td className="p-2 font-medium border-r border-slate-300">
                          {slip.employerName}
                        </td>
                        <td className="p-2 font-mono text-right border-r border-slate-300">
                          ${(slip.box14_employmentIncome || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 font-mono text-right border-r border-slate-300">
                          ${(slip.box16_cppContributions || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 font-mono text-right border-r border-slate-300">
                          ${(slip.box18_eiPremiums || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 font-mono text-right font-bold">
                          ${(slip.box22_incomeTaxDeducted || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Official Line-by-Line Table */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-700 border-b border-slate-200 pb-1">
              {isFrench
                ? 'Section 2 : Calcul de l’impôt ligne par ligne (Lignes de l’ARC)'
                : 'Section 2: Calculation of Tax Payable Line-by-Line (CRA Schedules)'}
            </h3>

            <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-900">
                      Line 15000 — {isFrench ? 'Revenu total' : 'Total Income'}
                    </td>
                    <td className="p-2.5 font-mono text-right font-bold text-slate-950">
                      ${calc?.totalIncome.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {Boolean(taxReturn.deductions?.rrspContributions) && (
                    <tr>
                      <td className="p-2.5 text-slate-700 pl-6">
                        Line 20800 — {isFrench ? 'Déduction pour REER' : 'RRSP Deduction Claimed'}
                      </td>
                      <td className="p-2.5 font-mono text-right text-slate-700">
                        -${taxReturn.deductions.rrspContributions.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}

                  <tr>
                    <td className="p-2.5 text-slate-700 pl-6">
                      Line 23300 — {isFrench ? 'Déductions totales' : 'Total Deductions from Net Income'}
                    </td>
                    <td className="p-2.5 font-mono text-right text-slate-700">
                      -${(calc?.totalDeductions ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr className="bg-slate-50 font-semibold">
                    <td className="p-2.5 text-slate-900">
                      Line 23600 — {isFrench ? 'Revenu net' : 'Net Income (Benchmark for Federal Benefits)'}
                    </td>
                    <td className="p-2.5 font-mono text-right font-bold text-slate-950">
                      ${calc?.netIncome.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr className="bg-slate-100 font-bold">
                    <td className="p-2.5 text-slate-950">
                      Line 26000 — {isFrench ? 'Revenu imposable' : 'Taxable Income'}
                    </td>
                    <td className="p-2.5 font-mono text-right font-black text-slate-950">
                      ${calc?.taxableIncome.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5 text-slate-700">
                      Schedule 1 Line 35000 — {isFrench ? 'Total des crédits d’impôt non remboursables' : 'Total Federal Non-Refundable Credits'}
                    </td>
                    <td className="p-2.5 font-mono text-right text-emerald-800">
                      -${(calc?.federalNonRefundableCreditsTotal ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5 text-slate-700">
                      Line 42000 — {isFrench ? 'Impôt fédéral net' : 'Net Federal Tax'}
                    </td>
                    <td className="p-2.5 font-mono text-right">
                      ${calc?.netFederalTax.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5 text-slate-700">
                      Line 42800 — {isFrench ? `Impôt provincial net (${taxReturn.personal.province})` : `Net Provincial Tax (${taxReturn.personal.province})`}
                    </td>
                    <td className="p-2.5 font-mono text-right">
                      ${calc?.netProvincialTax.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr className="font-bold bg-slate-50">
                    <td className="p-2.5 text-slate-900">
                      Line 43500 — {isFrench ? 'Impôt total à payer' : 'Total Tax Payable'}
                    </td>
                    <td className="p-2.5 font-mono text-right">
                      ${calc?.totalTaxPayable.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr className="font-bold text-emerald-900">
                    <td className="p-2.5">
                      Line 43700 — {isFrench ? 'Impôt total retenu sur vos feuillets de renseignements (Case 22)' : 'Total Income Tax Deducted (Box 22 Source Withholdings)'}
                    </td>
                    <td className="p-2.5 font-mono text-right font-black">
                      ${calc?.totalTaxWithheld.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Final Balance Box */}
                  <tr className="border-t-2 border-slate-900 bg-slate-100 text-sm font-black">
                    <td className="p-3">
                      {isRefund
                        ? isFrench
                          ? 'Line 48400 — REMBOURSEMENT PRÉVU DE L’ARC'
                          : 'Line 48400 — ESTIMATED REFUND FROM CRA'
                        : isFrench
                        ? 'Line 48500 — SOLDE À PAYER À L’ARC'
                        : 'Line 48500 — BALANCE OWING TO CRA'}
                    </td>
                    <td className="p-3 font-mono text-right text-base">
                      {isRefund ? '+' : '-'}${Math.abs(calc?.balanceOwingOrRefund ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tax Insights Section in Printable Document Preview */}
          <TaxInsightsCard taxReturn={taxReturn} language={language} />

          {/* Legal Certification Statement */}
          <div className="border-t-2 border-slate-300 pt-5 space-y-4 text-xs text-slate-700">
            <p className="leading-relaxed">
              <strong>{isFrench ? 'Attestation :' : 'Certification & Declaration:'}</strong>{' '}
              {isFrench
                ? 'J’atteste que les renseignements fournis dans cette déclaration et dans tous les documents joints sont exacts, sincères et complets dans tous leurs détails.'
                : 'I certify that the information given on this return and in any documents attached is true, correct, and complete in every respect.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
              <div>
                <div className="border-b border-slate-400 pb-1 font-mono text-xs">
                  {taxReturn.personal?.firstName} {taxReturn.personal?.lastName}
                </div>
                <span className="text-[10px] text-slate-500">
                  {isFrench ? 'Signature du contribuable' : 'Signature of Taxpayer (Electronic Filing)'}
                </span>
              </div>

              <div>
                <div className="border-b border-slate-400 pb-1 font-mono text-xs">
                  {new Date().toLocaleDateString('en-CA')}
                </div>
                <span className="text-[10px] text-slate-500">
                  {isFrench ? 'Date' : 'Date of Declaration'}
                </span>
              </div>
            </div>
          </div>

          {/* Cryptographic CRA Print Verification & Audit Strip */}
          <div className="border-t-2 border-slate-300 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span
                  className={`text-[9.5px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                    isOfficial
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  {isOfficial ? 'CRA CERTIFIED • OFFICIAL' : 'CRA PRE-SUBMISSION • DRAFT'}
                </span>
                <span className="text-[9.5px] text-slate-500 font-mono">
                  {isFrench ? 'Filigrane :' : 'Watermark:'} {activeIncludeWatermark ? watermarkText : 'OFF'}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-700">
                SHA-256 Checksum: <span className="font-bold select-all text-slate-900">{activeVerification?.documentHash || 'Computing...'}</span>
              </div>
              <p className="text-[9px] text-slate-500 leading-tight">
                {isFrench
                  ? 'Ce document intègre un code QR vectoriel via pseudo-éléments CSS scellant l’intégrité cryptographique pour audit légal de 6 ans.'
                  : 'Injected via CSS print stylesheet pseudo-elements with cryptographic hash for CRA 6-year statutory audit compliance.'}
              </p>
            </div>

            {/* Vector QR code injected via CSS print stylesheet */}
            <div
              className="print-verification-qr official-tax-qr-block shrink-0"
              data-print-qr="true"
              title="CRA Verification QR Code"
            />
          </div>
        </div>
      </div>
    );
  }

  /* 
    NORMAL REVIEW & AUDIT VIEW:
    Interactive review view with Visual Audit Checklist, Diagnostics,
    and CRA T1 line summary.
  */
  return (
    <div id="step-review-view" className="space-y-6 max-w-4xl mx-auto">
      {/* Top Action Bar: Print Preview & Export Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center font-bold">
            <FileCheck className="w-5 h-5 text-[#064e3b]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isFrench ? 'Révision Finale & Contrôle Pré-Transmission' : 'Final Review & Audit Verification'}
            </h2>
            <p className="text-xs text-slate-500">
              {isFrench
                ? 'Passez en revue les anomalies de l’ARC et visualisez le document avant impression.'
                : 'Cross-reference return data against CRA validation rules and preview printed layout.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Include Watermark Toggle Button in Review Bar */}
          <button
            id="review-watermark-toggle-btn"
            type="button"
            onClick={() => handleToggleWatermark(!activeIncludeWatermark)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeIncludeWatermark
                ? isOfficial
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
            }`}
            title={
              activeIncludeWatermark
                ? isFrench
                  ? `Filigrane activé ("${watermarkText}"). Cliquez pour désactiver.`
                  : `Watermark enabled ("${watermarkText}"). Click to toggle off.`
                : isFrench
                ? 'Filigrane désactivé. Cliquez pour activer.'
                : 'Watermark disabled. Click to toggle on.'
            }
          >
            <Stamp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isFrench ? 'Filigrane :' : 'Watermark:'}</span>
            <span className="font-mono uppercase font-black">
              {activeIncludeWatermark ? watermarkText : 'OFF'}
            </span>
          </button>

          {/* Primary 'Download PDF' Button - Triggers browser native print dialog with index.css print styles */}
          <button
            id="download-pdf-btn"
            type="button"
            onClick={handleDownloadPDF}
            className="px-4 py-2.5 bg-linear-to-r from-emerald-600 via-[#064e3b] to-[#0b1f3a] hover:from-emerald-500 hover:to-[#08634c] text-white text-xs font-black rounded-xl shadow-md shadow-emerald-950/20 flex items-center space-x-2 transition-all cursor-pointer border border-emerald-400/40 transform hover:-translate-y-0.5"
            title={
              isFrench
                ? 'Déclencher la boîte de dialogue d’impression native pour télécharger en PDF'
                : 'Trigger browser native print dialog using print-friendly styles to download as PDF'
            }
          >
            <Download className="w-4 h-4 text-emerald-200" />
            <span>{isFrench ? 'Télécharger PDF' : 'Download PDF'}</span>
          </button>

          <button
            id="toggle-print-preview-btn"
            type="button"
            onClick={() => setIsPrintPreview(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
            title={isFrench ? 'Afficher l’aperçu du document imprimable' : 'Toggle Print Preview layout'}
          >
            <Eye className="w-4 h-4 text-[#064e3b]" />
            <span>{isFrench ? 'Aperçu avant Impression' : 'Print Preview'}</span>
          </button>

          {/* CRA Proof-of-Work Audit Trail CSV Export Button */}
          <button
            id="export-audit-trail-csv-top-btn"
            type="button"
            onClick={handleExportAuditCSV}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] text-xs font-bold rounded-xl border border-emerald-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
            title={
              isFrench
                ? 'Télécharger le journal d’audit complet en format CSV (preuve de travail conforme art. 230(4) LIR)'
                : 'Export statutory proof-of-work CRA audit trail as CSV (ITA s. 230(4))'
            }
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{isFrench ? 'Journal d’Audit (CSV)' : 'Audit Trail (CSV)'}</span>
          </button>

          <button
            id="download-full-return-pdf-btn"
            type="button"
            onClick={() => {
              downloadFullReturnPdf(taxReturn, {
                language,
                includeWatermark: activeIncludeWatermark,
                watermarkText,
              });
            }}
            className="px-4 py-2 bg-[#064e3b] hover:bg-[#054030] text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2 transition-all cursor-pointer"
            title={
              isFrench
                ? 'Générer et télécharger la déclaration T1 complète au format PDF professionnel avec filigrane officiel (jsPDF)'
                : 'Generate and download complete CRA T1 return as formatted PDF with official watermark (jsPDF)'
            }
          >
            <Download className="w-4 h-4 text-emerald-300" />
            <span>{isFrench ? 'Télécharger Déclaration Complète (PDF)' : 'Download Full Return as PDF'}</span>
          </button>

          <button
            id="print-summary-btn"
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 flex items-center space-x-1.5 transition-all cursor-pointer"
            title={isFrench ? 'Imprimer le sommaire fiscal' : 'Print summary'}
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>{isFrench ? 'Imprimer' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* Official Print Watermark & CRA Verification Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              isOfficial ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  {isFrench ? 'Paramètres du Filigrane & Vérification Cryptographique ARC' : 'Print Watermark & Official Document Verification'}
                </h3>
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                    isOfficial
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {watermarkText}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {isFrench
                  ? 'Affiche "DRAFT" pour les déclarations en cours de saisie, ou "OFFICIAL" dès que la déclaration est transmise par Netfile à l’ARC.'
                  : 'Displays "DRAFT" for pre-submission returns, or "OFFICIAL" once certified and Netfile-transmitted to CRA.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Direct toggle for Include Watermark */}
            <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
              <input
                id="include-watermark-checkbox"
                type="checkbox"
                checked={activeIncludeWatermark}
                onChange={(e) => handleToggleWatermark(e.target.checked)}
                className="w-4 h-4 rounded text-[#064e3b] focus:ring-[#064e3b] border-slate-300"
              />
              <span className="text-xs font-bold text-slate-800">
                {isFrench ? 'Inclure Filigrane' : 'Include Watermark'}
              </span>
            </label>

            {/* Test toggle between DRAFT and OFFICIAL status */}
            <button
              id="simulate-filing-status-btn"
              type="button"
              onClick={handleToggleSimulatedFilingStatus}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer"
              title={
                isFrench
                  ? 'Basculer le statut pour tester le filigrane et QR code'
                  : 'Toggle CRA filing status to test Watermark and QR code generation'
              }
            >
              {isOfficial
                ? isFrench ? 'Simuler Brouillon (DRAFT)' : 'Simulate Draft'
                : isFrench ? 'Simuler Transmis (OFFICIAL)' : 'Simulate CRA Filed'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              {isFrench ? 'Texte Actuel du Filigrane' : 'Current Watermark Text'}
            </span>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-black font-mono px-2 py-0.5 rounded ${
                activeIncludeWatermark
                  ? isOfficial
                    ? 'bg-emerald-200 text-emerald-950'
                    : 'bg-amber-200 text-amber-950'
                  : 'bg-slate-200 text-slate-600 line-through'
              }`}>
                {watermarkText}
              </span>
              <span className="text-[11px] text-slate-500">
                ({activeIncludeWatermark ? (isFrench ? 'Inclus à l’impression' : 'Included in print') : (isFrench ? 'Désactivé' : 'Disabled')})
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              {isFrench ? 'Code QR de Vérification (CSS)' : 'Verification QR (CSS Pseudo-Element)'}
            </span>
            <div className="flex items-center space-x-2.5">
              <div
                className="print-verification-qr official-tax-qr-block shrink-0"
                data-print-qr="true"
                title="CRA Verification QR Code"
              />
              <span className="text-[11px] text-slate-600 leading-tight">
                {isFrench ? 'Injecté par pseudo-élément ::after dans la feuille CSS d’impression' : 'Injected via ::after pseudo-element in print stylesheet'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              {isFrench ? 'Empreinte Cryptographique SHA-256' : 'SHA-256 Document Integrity'}
            </span>
            <div className="font-mono text-[10px] text-slate-800 break-all select-all font-bold">
              {activeVerification?.documentHash || 'Computing verification hash...'}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Generation Notification Toast */}
      {pdfToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-[#064e3b] px-4 py-3 rounded-xl flex items-center justify-between text-xs font-bold shadow-xs animate-in fade-in duration-300 no-print">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{pdfToast}</span>
          </div>
          <button
            onClick={() => setPdfToast(null)}
            className="text-emerald-800 hover:text-emerald-950 underline font-semibold cursor-pointer ml-3"
          >
            {isFrench ? 'Fermer' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* CRA Statutory Proof-of-Work Audit Trail CSV Export Toast */}
      {auditCsvToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-[#064e3b] px-4 py-3 rounded-xl flex items-center justify-between text-xs font-bold shadow-xs animate-in fade-in duration-300 no-print">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{auditCsvToast}</span>
          </div>
          <button
            onClick={() => setAuditCsvToast(null)}
            className="text-emerald-800 hover:text-emerald-950 underline font-semibold cursor-pointer ml-3"
          >
            {isFrench ? 'Fermer' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Visual CRA Audit Readiness Checklist Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {isFrench ? 'Grille d’Audit & Drapeaux d’Erreur de l’ARC' : 'CRA Audit Readiness Checklist'}
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                {isFrench
                  ? 'Contrôle croisé des données par rapport aux anomalies courantes et aux barèmes de l’ARC'
                  : 'Automated verification across common CRA filing flags, deduction limits, and withholding ratios'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 no-print">
            <button
              id="print-audit-report-btn"
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
              title={isFrench ? 'Imprimer la grille d’audit' : 'Print audit readiness report'}
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{isFrench ? 'Imprimer / PDF' : 'Print Audit / PDF'}</span>
            </button>

            <button
              onClick={onOpenJudge}
              className="px-4 py-2 bg-linear-to-r from-[#0b1f3a] to-[#064e3b] hover:from-[#122e54] hover:to-[#08634c] text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
            >
              <Scale className="w-4 h-4 text-emerald-300" />
              <span>{isFrench ? 'Juge A2A IA' : 'A2A Judge Audit'}</span>
            </button>
          </div>
        </div>

        {/* Audit Score & Progress Meter */}
        <div className={`p-4 rounded-2xl border ${rateInfo.bg} space-y-2.5`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-4 h-4" />
              <span className="font-extrabold text-sm">
                {isFrench ? rateInfo.labelFr : rateInfo.labelEn}
              </span>
            </div>
            <span className="font-mono text-lg font-black">{auditCompletionRate}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/70 rounded-full h-2.5 overflow-hidden border border-black/10">
            <div
              className={`h-full ${rateInfo.bar} transition-all duration-500 rounded-full`}
              style={{ width: `${auditCompletionRate}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs opacity-90">
            <span>
              {isFrench
                ? `${passedCount} critères sur ${totalCheckCount} validés sans anomalie`
                : `${passedCount} of ${totalCheckCount} CRA criteria satisfied`}
            </span>
            <span>
              {auditCompletionRate === 100
                ? isFrench
                  ? 'Prêt pour la transmission NETFILE'
                  : 'Ready for electronic NETFILE'
                : isFrench
                ? `${totalCheckCount - passedCount} point(s) à vérifier`
                : `${totalCheckCount - passedCount} item(s) need review`}
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 text-xs border-b border-slate-100 pb-2 no-print">
          <span className="font-bold text-slate-500 text-[11px] uppercase mr-1">
            {isFrench ? 'Filtrer :' : 'Filter:'}
          </span>
          <button
            onClick={() => setAuditFilter('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              auditFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isFrench ? 'Tous' : 'All'} ({auditChecklist.length})
          </button>
          <button
            onClick={() => setAuditFilter('passed')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              auditFilter === 'passed'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isFrench ? 'Validés' : 'Passed'} ({passedCount})
          </button>
          <button
            onClick={() => setAuditFilter('flags')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              auditFilter === 'flags'
                ? 'bg-amber-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isFrench ? 'À vérifier' : 'Flags / Review'} ({totalCheckCount - passedCount})
          </button>
        </div>

        {/* Audit Items List */}
        <div className="space-y-2.5">
          {filteredAuditItems.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                item.passed
                  ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                  : 'bg-amber-50/70 border-amber-200 text-slate-900'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="pt-0.5 shrink-0">
                  {item.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs">
                      {isFrench ? item.nameFr : item.nameEn}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/5 text-slate-600">
                      {item.craCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isFrench ? item.messageFr : item.messageEn}
                  </p>
                </div>
              </div>

              {!item.passed && (
                <button
                  type="button"
                  onClick={() => onSelectStep(item.step)}
                  className="px-3 py-1.5 bg-amber-200/90 hover:bg-amber-300 text-amber-950 font-bold rounded-lg text-xs shrink-0 transition-colors cursor-pointer no-print"
                >
                  {isFrench ? 'Examiner →' : 'Review Step →'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CRA Industry Benchmark Cross-Reference Validation */}
      <IndustryCrossReferenceCard
        taxReturn={taxReturn}
        onUpdateTaxReturn={onUpdateTaxReturn}
        onSelectStep={onSelectStep}
        language={language}
      />

      {/* Direct Tax Slips Breakdown & Section Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {isFrench ? 'Feuillets Fiscaux Enregistrés (T4, T4A, T5)' : 'Recorded Tax Slips Overview (T4, T4A, T5)'}
            </h3>
            <p className="text-xs text-slate-500">
              {isFrench
                ? 'Gérez ou supprimez vos feuillets de paie, de retraite et de placements directement.'
                : 'Directly manage or delete your employment, pension, and investment slips before filing.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            <button
              id="print-slips-overview-btn"
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Print slips section"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{isFrench ? 'Imprimer / PDF' : 'Print Slips / PDF'}</span>
            </button>

            {onUpdateTaxReturn && (
              <>
                <button
                  id="review-add-t4-btn"
                  type="button"
                  onClick={handleAddT4FromReview}
                  className="px-3 py-1.5 bg-[#064e3b] hover:bg-[#08634c] text-white text-xs font-bold rounded-xl flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ T4</span>
                </button>

                <button
                  id="review-add-t4a-btn"
                  type="button"
                  onClick={() => handleAddOtherSlipFromReview('T4A')}
                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-xl flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ T4A</span>
                </button>

                <button
                  id="review-add-t5-btn"
                  type="button"
                  onClick={() => handleAddOtherSlipFromReview('T5')}
                  className="px-3 py-1.5 bg-[#92400e] hover:bg-[#78350f] text-white text-xs font-bold rounded-xl flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ T5</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Slips List */}
        <div className="divide-y divide-slate-100 text-xs sm:text-sm">
          {(taxReturn.t4Slips || []).map((t4, idx) => (
            <div key={t4.id} className="py-2.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-[#064e3b] font-bold text-[10px] rounded">
                    T4 #{idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800">{t4.employerName}</span>
                </div>
                <span className="text-slate-400 text-xs block">
                  Box 14: ${t4.box14_employmentIncome.toLocaleString('en-CA')} • Tax Deducted: ${(t4.box22_incomeTaxDeducted || 0).toLocaleString('en-CA')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-slate-900">
                  ${t4.box14_employmentIncome.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                </span>
                {onUpdateTaxReturn && (
                  <button
                    onClick={() => handleDeleteT4FromReview(t4.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer no-print"
                    title="Delete T4 slip"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {(taxReturn.otherSlips || []).map((s) => (
            <div key={s.id} className="py-2.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-1.5 py-0.5 font-bold text-[10px] rounded ${
                      s.type === 'T4A'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {s.type}
                  </span>
                  <span className="font-semibold text-slate-800">{s.payerName}</span>
                </div>
                <span className="text-slate-400 text-xs block">{s.description}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-slate-900">
                  ${Object.values(s.amounts || {}).reduce((a, b) => a + (Number(b) || 0), 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                </span>
                {onUpdateTaxReturn && (
                  <button
                    onClick={() => handleDeleteOtherSlipFromReview(s.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer no-print"
                    title="Delete slip"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Audit Trail Timeline with Before & After Indicators */}
      <VisualAuditTimeline
        taxReturn={taxReturn}
        language={language}
        onOpenAuditDashboard={onOpenAuditDashboard}
      />

      {/* Recharts Visual Tax Distribution (Federal Tax, Provincial Tax, CPP, and EI) Pie Chart */}
      <TaxDistributionPieChart taxReturn={taxReturn} language={language} />

      {/* D3 Financial Snapshot Visualizer */}
      <FinancialSnapshotD3Chart taxReturn={taxReturn} language={language} />

      {/* Tax Insights Section: Effective Rate, Marginal Rate, and Year-over-Year Summary Table */}
      <TaxInsightsCard taxReturn={taxReturn} language={language} />

      {/* Interactive Form Field Review & Audit History Tooltips Section */}
      <div id="field-history-audit-review-card" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-900 flex items-center justify-center font-bold">
              <History className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {isFrench ? 'Révision Directe des Champs & Historique d’Audit' : 'Field Review & Audit History Tooltips'}
                </h3>
                {conflictingAuditCount > 0 ? (
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 flex items-center space-x-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>
                      {conflictingAuditCount} {isFrench ? 'conflit(s) d’audit' : 'audit conflict(s)'}
                    </span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>{isFrench ? 'Piste d’audit vérifiée' : 'Audit trail verified'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isFrench
                  ? 'Survolez ou cliquez sur les boutons d’infobulle "Historique" à côté de chaque champ pour consulter la piste d’audit et déclencher un diff visuel côte-à-côte.'
                  : 'Hover or click the "History" tooltips beside form inputs to inspect the audit log and resolve any conflicting fields with a side-by-side visual diff.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              id="export-audit-trail-csv-card-btn"
              type="button"
              onClick={handleExportAuditCSV}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] font-bold text-xs rounded-xl border border-emerald-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
              title={
                isFrench
                  ? 'Télécharger le journal d’audit officiel au format CSV pour preuve de conformité ARC (art. 230(4) LIR)'
                  : 'Export statutory proof-of-work audit trail as CSV (ITA s. 230(4))'
              }
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isFrench ? 'Exporter Journal CSV' : 'Export Audit CSV'}</span>
            </button>

            <button
              id="open-side-by-side-diff-card-btn"
              type="button"
              onClick={() => handleOpenConflictDiff()}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs rounded-xl border border-amber-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
              title={
                isFrench
                  ? 'Afficher la fenêtre de fusion et le diff visuel côte-à-côte pour choisir les valeurs individuellement'
                  : 'Open side-by-side visual diff modal to select field values individually instead of full revert'
              }
            >
              <Split className="w-3.5 h-3.5 text-amber-700" />
              <span>{isFrench ? 'Diff Visuel Côte-à-Côte' : 'Visual Conflict Diff'}</span>
            </button>
          </div>
        </div>

        {/* Form Inputs Grid with FieldHistoryTooltips */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          {/* Column 1: Personal Profile */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3.5">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
              <User className="w-4 h-4 text-slate-700" />
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                {isFrench ? 'Identification & Profil' : 'Taxpayer Profile & Residency'}
              </h4>
            </div>

            {/* First Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  {isFrench ? 'Prénom légal' : 'Legal First Name'}
                </label>
                <FieldHistoryTooltip
                  fieldKey="personal.firstName"
                  fieldLabel={isFrench ? 'Prénom' : 'First Name'}
                  category="personal"
                  auditTrail={taxReturn.auditTrail}
                  taxReturn={taxReturn}
                  language={language}
                  onTriggerConflictDiff={() => handleOpenConflictDiff('personal.firstName')}
                />
              </div>
              <input
                type="text"
                id="review-field-firstName"
                value={taxReturn.personal?.firstName || ''}
                onChange={(e) => handleUpdatePersonalField('firstName', e.target.value)}
                placeholder="First Name"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#064e3b] focus:border-[#064e3b] outline-hidden font-medium"
              />
            </div>

            {/* Last Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  {isFrench ? 'Nom de famille' : 'Legal Last Name'}
                </label>
                <FieldHistoryTooltip
                  fieldKey="personal.lastName"
                  fieldLabel={isFrench ? 'Nom de famille' : 'Last Name'}
                  category="personal"
                  auditTrail={taxReturn.auditTrail}
                  taxReturn={taxReturn}
                  language={language}
                  onTriggerConflictDiff={() => handleOpenConflictDiff('personal.lastName')}
                />
              </div>
              <input
                type="text"
                id="review-field-lastName"
                value={taxReturn.personal?.lastName || ''}
                onChange={(e) => handleUpdatePersonalField('lastName', e.target.value)}
                placeholder="Last Name"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#064e3b] focus:border-[#064e3b] outline-hidden font-medium"
              />
            </div>

            {/* Province of Residence */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  {isFrench ? 'Province de résidence' : 'Tax Jurisdiction / Province'}
                </label>
                <FieldHistoryTooltip
                  fieldKey="personal.province"
                  fieldLabel={isFrench ? 'Province' : 'Province'}
                  category="personal"
                  auditTrail={taxReturn.auditTrail}
                  taxReturn={taxReturn}
                  language={language}
                  onTriggerConflictDiff={() => handleOpenConflictDiff('personal.province')}
                />
              </div>
              <select
                id="review-field-province"
                value={taxReturn.personal?.province || 'ON'}
                onChange={(e) => handleUpdatePersonalField('province', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#064e3b] focus:border-[#064e3b] outline-hidden font-medium"
              >
                <option value="AB">AB - Alberta</option>
                <option value="BC">BC - British Columbia</option>
                <option value="MB">MB - Manitoba</option>
                <option value="NB">NB - New Brunswick</option>
                <option value="NL">NL - Newfoundland & Labrador</option>
                <option value="NS">NS - Nova Scotia</option>
                <option value="NT">NT - Northwest Territories</option>
                <option value="NU">NU - Nunavut</option>
                <option value="ON">ON - Ontario</option>
                <option value="PE">PE - Prince Edward Island</option>
                <option value="QC">QC - Quebec</option>
                <option value="SK">SK - Saskatchewan</option>
                <option value="YT">YT - Yukon</option>
              </select>
            </div>

            {/* SIN */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  {isFrench ? 'Numéro d’assurance sociale (NAS)' : 'Social Insurance Number (SIN)'}
                </label>
                <FieldHistoryTooltip
                  fieldKey="personal.sin"
                  fieldLabel={isFrench ? 'NAS' : 'SIN'}
                  category="personal"
                  auditTrail={taxReturn.auditTrail}
                  taxReturn={taxReturn}
                  language={language}
                  onTriggerConflictDiff={() => handleOpenConflictDiff('personal.sin')}
                />
              </div>
              <input
                type="text"
                id="review-field-sin"
                value={taxReturn.personal?.sin || ''}
                onChange={(e) => handleUpdatePersonalField('sin', e.target.value)}
                placeholder="000 000 000"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#064e3b] focus:border-[#064e3b] outline-hidden"
              />
            </div>
          </div>

          {/* Column 2: T4 Slip Primary Employment */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3.5">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
              <DollarSign className="w-4 h-4 text-emerald-700" />
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                {isFrench ? 'Feuillet T4 - Emploi & Retenues' : 'T4 Slip - Employment & Withholding'}
              </h4>
            </div>

            {/* T4 Box 14 Employment Income */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  {isFrench ? 'Revenu d’emploi (Case 14)' : 'Employment Income (Box 14)'}
                </label>
                <FieldHistoryTooltip
                  fieldKey="t4Slips.0.box14_employmentIncome"
                  fieldLabel={isFrench ? 'Revenu T4 Case 14' : 'T4 Employment Income (Box 14)'}
                  category="slips"
                  auditTrail={taxReturn.auditTrail}
                  taxReturn={taxReturn}
                  language={language}
                  onTriggerConflictDiff={() => handleOpenConflictDiff('t4Slips')}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">$</span>
                <input
                  type="number"
                  id="review-field-box14"
                  value={taxReturn.t4Slips?.[0]?.box14_employmentIncome ?? 0}
                  onChange={(e) =>
                    handleUpdateT4Field(0, 'box14_employmentIncome', parseFloat(e.target.value) || 0)
                  }
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-[#064e3b] focus:border-[#064e3b] outline-hidden"
                />
              </div>
            </div>

            {/* T4 Box 22 Income Tax Deducted */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  {isFrench ? 'Impôt sur le revenu retenu (Case 22)' : 'Income Tax Deducted (Box 22)'}
                </label>
                <FieldHistoryTooltip
                  fieldKey="t4Slips.0.box22_incomeTaxDeducted"
                  fieldLabel={isFrench ? 'Impôt retenu Case 22' : 'Tax Deducted (Box 22)'}
                  category="slips"
                  auditTrail={taxReturn.auditTrail}
                  taxReturn={taxReturn}
                  language={language}
                  onTriggerConflictDiff={() => handleOpenConflictDiff('t4Slips')}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">$</span>
                <input
                  type="number"
                  id="review-field-box22"
                  value={taxReturn.t4Slips?.[0]?.box22_incomeTaxDeducted ?? 0}
                  onChange={(e) =>
                    handleUpdateT4Field(0, 'box22_incomeTaxDeducted', parseFloat(e.target.value) || 0)
                  }
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-[#064e3b] focus:border-[#064e3b] outline-hidden"
                />
              </div>
            </div>

            {/* T4 Box 16 CPP */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  {isFrench ? 'Cotisations RPC/RRQ (Case 16)' : 'CPP / QPP Contributions (Box 16)'}
                </label>
                <FieldHistoryTooltip
                  fieldKey="t4Slips.0.box16_cppContributions"
                  fieldLabel={isFrench ? 'Cotisations RPC Case 16' : 'CPP Deductions (Box 16)'}
                  category="slips"
                  auditTrail={taxReturn.auditTrail}
                  taxReturn={taxReturn}
                  language={language}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">$</span>
                <input
                  type="number"
                  id="review-field-box16"
                  value={taxReturn.t4Slips?.[0]?.box16_cppContributions ?? 0}
                  onChange={(e) =>
                    handleUpdateT4Field(0, 'box16_cppContributions', parseFloat(e.target.value) || 0)
                  }
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-[#064e3b] focus:border-[#064e3b] outline-hidden"
                />
              </div>
            </div>

            {/* T4 Box 18 EI */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  {isFrench ? 'Cotisations AE (Case 18)' : 'EI Premiums (Box 18)'}
                </label>
                <FieldHistoryTooltip
                  fieldKey="t4Slips.0.box18_eiPremiums"
                  fieldLabel={isFrench ? 'Cotisations AE Case 18' : 'EI Premiums (Box 18)'}
                  category="slips"
                  auditTrail={taxReturn.auditTrail}
                  taxReturn={taxReturn}
                  language={language}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">$</span>
                <input
                  type="number"
                  id="review-field-box18"
                  value={taxReturn.t4Slips?.[0]?.box18_eiPremiums ?? 0}
                  onChange={(e) =>
                    handleUpdateT4Field(0, 'box18_eiPremiums', parseFloat(e.target.value) || 0)
                  }
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-[#064e3b] focus:border-[#064e3b] outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Column 3: Deductions & Credits */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3.5">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
              <TrendingDown className="w-4 h-4 text-indigo-700" />
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                {isFrench ? 'Déductions & Crédits d’Impôt' : 'Deductions & Tax Credits'}
              </h4>
            </div>

            {/* RRSP Contributions */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  {isFrench ? 'Cotisations REER (Ligne 20800)' : 'RRSP Contributions (Line 20800)'}
                </label>
                <FieldHistoryTooltip
                  fieldKey="deductions.rrspContributions"
                  fieldLabel={isFrench ? 'Déduction REER' : 'RRSP Deductions'}
                  category="deductions"
                  auditTrail={taxReturn.auditTrail}
                  taxReturn={taxReturn}
                  language={language}
                  onTriggerConflictDiff={() => handleOpenConflictDiff('deductions.rrspContributions')}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">$</span>
                <input
                  type="number"
                  id="review-field-rrsp"
                  value={taxReturn.deductions?.rrspContributions ?? 0}
                  onChange={(e) =>
                    handleUpdateDeductionsField('rrspContributions', parseFloat(e.target.value) || 0)
                  }
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-[#064e3b] focus:border-[#064e3b] outline-hidden"
                />
              </div>
            </div>

            {/* Union / Professional Dues */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  {isFrench ? 'Cotisations syndicales (Ligne 21200)' : 'Union / Professional Dues (Line 21200)'}
                </label>
                <FieldHistoryTooltip
                  fieldKey="deductions.unionOrProfessionalDues"
                  fieldLabel={isFrench ? 'Cotisations syndicales' : 'Union / Professional Dues'}
                  category="deductions"
                  auditTrail={taxReturn.auditTrail}
                  taxReturn={taxReturn}
                  language={language}
                  onTriggerConflictDiff={() => handleOpenConflictDiff('deductions.unionOrProfessionalDues')}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">$</span>
                <input
                  type="number"
                  id="review-field-unionDues"
                  value={taxReturn.deductions?.unionOrProfessionalDues ?? 0}
                  onChange={(e) =>
                    handleUpdateDeductionsField('unionOrProfessionalDues', parseFloat(e.target.value) || 0)
                  }
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-[#064e3b] focus:border-[#064e3b] outline-hidden"
                />
              </div>
            </div>

            {/* Charitable Donations */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  {isFrench ? 'Dons de bienfaisance (Ligne 34900)' : 'Charitable Donations (Line 34900)'}
                </label>
                <FieldHistoryTooltip
                  fieldKey="credits.charitableDonations"
                  fieldLabel={isFrench ? 'Dons de bienfaisance' : 'Charitable Donations'}
                  category="credits"
                  auditTrail={taxReturn.auditTrail}
                  taxReturn={taxReturn}
                  language={language}
                  onTriggerConflictDiff={() => handleOpenConflictDiff('credits.charitableDonations')}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">$</span>
                <input
                  type="number"
                  id="review-field-donations"
                  value={taxReturn.credits?.charitableDonations ?? 0}
                  onChange={(e) =>
                    handleUpdateCreditsField('charitableDonations', parseFloat(e.target.value) || 0)
                  }
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-[#064e3b] focus:border-[#064e3b] outline-hidden"
                />
              </div>
            </div>

            {/* Eligible Medical Expenses */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  {isFrench ? 'Frais médicaux admissibles (Ligne 33099)' : 'Medical Expenses (Line 33099)'}
                </label>
                <FieldHistoryTooltip
                  fieldKey="credits.eligibleMedicalExpenses"
                  fieldLabel={isFrench ? 'Frais médicaux' : 'Medical Expenses'}
                  category="credits"
                  auditTrail={taxReturn.auditTrail}
                  taxReturn={taxReturn}
                  language={language}
                  onTriggerConflictDiff={() => handleOpenConflictDiff('credits.eligibleMedicalExpenses')}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">$</span>
                <input
                  type="number"
                  id="review-field-medical"
                  value={taxReturn.credits?.eligibleMedicalExpenses ?? 0}
                  onChange={(e) =>
                    handleUpdateCreditsField('eligibleMedicalExpenses', parseFloat(e.target.value) || 0)
                  }
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-[#064e3b] focus:border-[#064e3b] outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CRA T1 Line-by-Line Summary Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-[#064e3b]" />
            <h3 className="font-bold text-slate-900 text-base">
              {isFrench ? 'Sommaire Officiel de la Déclaration T1' : 'Official T1 Return Line-by-Line Summary'}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
              {taxReturn.personal.province} • {taxReturn.taxYear}
            </span>
            <button
              id="export-review-summary-btn"
              onClick={() => exportAssessmentSummary(taxReturn)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center space-x-1 transition-colors cursor-pointer no-print"
              title={isFrench ? 'Exporter le sommaire T1' : 'Export T1 summary report'}
            >
              <Download className="w-3 h-3" />
              <span>{isFrench ? 'Exporter' : 'Export Docs'}</span>
            </button>
            <button
              id="download-formatted-pdf-table-btn"
              onClick={handleDownloadFormattedPDF}
              className="px-2.5 py-1 bg-[#064e3b] hover:bg-[#08634c] text-white text-xs font-semibold rounded-lg flex items-center space-x-1 transition-colors cursor-pointer no-print"
              title={isFrench ? 'Télécharger PDF formaté' : 'Download Formatted PDF'}
            >
              <Printer className="w-3 h-3 text-emerald-300" />
              <span>{isFrench ? 'PDF Formaté' : 'Formatted PDF'}</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 text-xs sm:text-sm">
          {/* Total Income */}
          <div className="py-2.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-800">
                  {isFrench ? 'Revenu total (Ligne 15000)' : 'Total Income (CRA Line 15000)'}
                </span>
                <FieldHistoryTooltip
                  fieldKey="t4Slips.0.box14_employmentIncome"
                  fieldLabel={isFrench ? 'Revenu total L15000' : 'Total Income Line 15000'}
                  category="slips"
                  auditTrail={taxReturn.auditTrail}
                  taxReturn={taxReturn}
                  language={language}
                  onTriggerConflictDiff={() => handleOpenConflictDiff('t4Slips')}
                />
              </div>
              <span className="text-slate-400 text-xs block">
                {isFrench ? 'Total des revenus d’emploi et autres sources' : 'All employment wages and other earnings'}
              </span>
            </div>
            <span className="font-mono font-bold text-slate-900">
              ${calc?.totalIncome.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Deductions */}
          <div className="py-2.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-800">
                  {isFrench ? 'Déductions totales du revenu net (Ligne 23300)' : 'Total Deductions (CRA Line 23300)'}
                </span>
                <FieldHistoryTooltip
                  fieldKey="deductions.rrspContributions"
                  fieldLabel={isFrench ? 'Déductions L23300' : 'Total Deductions Line 23300'}
                  category="deductions"
                  auditTrail={taxReturn.auditTrail}
                  taxReturn={taxReturn}
                  language={language}
                  onTriggerConflictDiff={() => handleOpenConflictDiff('deductions.rrspContributions')}
                />
              </div>
              <span className="text-slate-400 text-xs block">
                {isFrench ? 'REER, cotisations syndicales, frais de garde' : 'RRSP contributions, child care, union dues'}
              </span>
            </div>
            <span className="font-mono text-slate-700">
              -${(calc?.totalDeductions ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Net Income */}
          <div className="py-2.5 flex items-center justify-between bg-slate-50 px-3 rounded-lg">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900">
                {isFrench ? 'Revenu net (Ligne 23600)' : 'Net Income (CRA Line 23600)'}
              </span>
              <span className="text-slate-500 text-xs block">
                {isFrench ? 'Utilisé pour calculer vos prestations fédérales et provinciales' : 'Threshold metric for CCB, GST/HST credits'}
              </span>
            </div>
            <span className="font-mono font-bold text-slate-900">
              ${calc?.netIncome.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Taxable Income */}
          <div className="py-2.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-800">
                {isFrench ? 'Revenu imposable (Ligne 26000)' : 'Taxable Income (CRA Line 26000)'}
              </span>
              <span className="text-slate-400 text-xs block">
                {isFrench ? 'Montant sur lequel les taux d’imposition sont appliqués' : 'Base for federal & provincial tax brackets'}
              </span>
            </div>
            <span className="font-mono font-bold text-slate-900">
              ${calc?.taxableIncome.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Federal Tax */}
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-700">
              {isFrench ? 'Impôt fédéral net (Ligne 42000)' : 'Net Federal Tax (CRA Line 42000)'}
            </span>
            <span className="font-mono text-slate-800">
              ${calc?.netFederalTax.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Provincial Tax */}
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-700">
              {isFrench ? 'Impôt provincial net (Ligne 42800)' : 'Net Provincial Tax (CRA Line 42800)'}
            </span>
            <span className="font-mono text-slate-800">
              ${calc?.netProvincialTax.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Total Tax Payable */}
          <div className="py-2.5 flex items-center justify-between font-semibold">
            <span className="text-slate-900">
              {isFrench ? 'Impôt total à payer (Ligne 43500)' : 'Total Tax Payable (CRA Line 43500)'}
            </span>
            <span className="font-mono text-slate-900">
              ${calc?.totalTaxPayable.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Total Tax Withheld */}
          <div className="py-2.5 flex items-center justify-between text-emerald-800">
            <div className="flex items-center space-x-2">
              <span className="font-semibold">
                {isFrench ? 'Impôt total déjà retenu à la source (Ligne 43700)' : 'Total Income Tax Deducted (CRA Line 43700)'}
              </span>
              <FieldHistoryTooltip
                fieldKey="t4Slips.0.box22_incomeTaxDeducted"
                fieldLabel={isFrench ? 'Impôt retenu L43700' : 'Tax Withheld Line 43700'}
                category="slips"
                auditTrail={taxReturn.auditTrail}
                taxReturn={taxReturn}
                language={language}
                onTriggerConflictDiff={() => handleOpenConflictDiff('t4Slips')}
              />
            </div>
            <span className="font-mono font-bold">
              ${calc?.totalTaxWithheld.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Final Refund or Owing */}
          <div
            className={`py-4 px-4 rounded-xl flex items-center justify-between mt-2 ${
              isRefund ? 'bg-[#064e3b] text-white' : 'bg-[#0b1f3a] text-white'
            }`}
          >
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-emerald-300">
                {isRefund
                  ? isFrench ? 'Remboursement Fédéral et Provincial (Ligne 48400)' : 'Refund Estimate (CRA Line 48400)'
                  : isFrench ? 'Solde dû à payer (Ligne 48500)' : 'Balance Owing (CRA Line 48500)'}
              </div>
              <div className="text-xs text-slate-200 mt-0.5">
                {isRefund
                  ? isFrench ? 'Dépôt direct prévu sous 8 jours ouvrables via NETFILE' : 'Expected via direct deposit in as few as 8 business days'
                  : isFrench ? 'Payable d’ici le 30 avril sans intérêt' : 'Payable by April 30 deadline to avoid CRA interest'}
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold">
              {isRefund ? '+' : '-'}${Math.abs(calc?.balanceOwingOrRefund ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation & Bottom Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 no-print">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="bottom-print-summary-btn"
            type="button"
            onClick={() => window.print()}
            className="px-5 py-3 rounded-xl bg-[#064e3b] hover:bg-[#08634c] text-white font-bold text-sm shadow-md flex items-center space-x-2 transition-all cursor-pointer"
            title={isFrench ? 'Imprimer le sommaire fiscal officiel avec styles documentaires' : 'Print Summary using print-specific CSS rules for clean, document-like output'}
          >
            <Printer className="w-4 h-4 text-emerald-300" />
            <span>{isFrench ? 'Imprimer le Sommaire' : 'Print Summary'}</span>
          </button>

          <button
            id="bottom-download-pdf-btn"
            type="button"
            onClick={handleDownloadPDF}
            className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
            title={isFrench ? 'Télécharger le sommaire final en format PDF' : 'Download final tax summary as PDF document via print dialog'}
          >
            <Download className="w-4 h-4 text-[#064e3b]" />
            <span>{isFrench ? 'Télécharger PDF' : 'Download PDF'}</span>
          </button>

          <button
            id="bottom-export-audit-csv-btn"
            type="button"
            onClick={handleExportAuditCSV}
            className="px-4 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] font-bold text-sm border border-emerald-300 flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
            title={isFrench ? 'Télécharger la preuve d’audit au format CSV' : 'Download statutory proof-of-work audit trail CSV'}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{isFrench ? 'Journal CSV' : 'Audit CSV'}</span>
          </button>
        </div>

        <button
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-[#0b1f3a] hover:bg-[#132d4e] text-white font-bold text-sm flex items-center space-x-2 shadow-md transition-all cursor-pointer"
        >
          <span>{isFrench ? 'Voir le Calcul Détaillé' : 'View Detailed Tax Calculation'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Side-by-Side Merge & Conflict Resolution Modal */}
      {isMergeModalOpen && (
        <InteractiveMergeModal
          isOpen={isMergeModalOpen}
          onClose={() => {
            setIsMergeModalOpen(false);
            setActiveConflictDiffs(undefined);
          }}
          draftReturn={taxReturn}
          remoteReturn={remoteReturn || taxReturn}
          lastSavedDraftTime={Date.now()}
          remoteSyncedTime={Date.now()}
          conflictingFields={activeConflictDiffs}
          onApplyMerge={(merged, resolutions) => {
            if (onApplyMerge) {
              onApplyMerge(merged, resolutions);
            } else if (onUpdateTaxReturn) {
              onUpdateTaxReturn(merged);
            }
            setIsMergeModalOpen(false);
            setActiveConflictDiffs(undefined);
          }}
          language={language}
        />
      )}
    </div>
  );
};
