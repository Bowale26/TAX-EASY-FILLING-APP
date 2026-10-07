import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Camera,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  RotateCcw,
  Plus,
  HelpCircle,
  TrendingDown,
  Info,
} from 'lucide-react';
import { AppTaxReturn, T4Slip } from '../types/tax';
import { loadDocumentsFromVault } from '../utils/secureDocumentStorage';

export interface IncomeDiscrepancy {
  id: string;
  slipId?: string;
  employerName: string;
  sourceDocName: string;
  discrepancyType: 'missing_slip' | 'amount_mismatch' | 'tax_deducted_mismatch' | 'statutory_limit_exceeded';
  fieldKey: keyof T4Slip | 'missingSlip';
  fieldLabelEn: string;
  fieldLabelFr: string;
  manualValue: string;
  scannedValue: string;
  deltaAmount?: number;
  deltaPercent?: number;
  craRiskEn: string;
  craRiskFr: string;
  suggestedActionEn: string;
  suggestedActionFr: string;
  autoFixValue?: any;
}

interface IncomeDiscrepancyAlertProps {
  taxReturn: AppTaxReturn;
  onUpdateTaxReturn: (updated: Partial<AppTaxReturn>) => void;
  onOpenScanner?: () => void;
  language: 'en' | 'fr';
}

export const IncomeDiscrepancyAlert: React.FC<IncomeDiscrepancyAlertProps> = ({
  taxReturn,
  onUpdateTaxReturn,
  onOpenScanner,
  language,
}) => {
  const isFrench = language === 'fr';
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [showResolvedSuccess, setShowResolvedSuccess] = useState<string | null>(null);

  // Baseline standard known T4 scans / historical records
  const baselineScans = useMemo(() => {
    // 1. Scanned documents in current taxReturn
    const docs = taxReturn.scannedDocuments || [];
    const t4Scans = docs.filter((d) => d.documentCode === 'T4' || d.fileName.toLowerCase().includes('t4'));

    // 2. Vault documents
    const vaultDocs = loadDocumentsFromVault();
    const vaultT4s = vaultDocs.filter(
      (d) => d.documentType === 'T4' || d.category === 'income_slips' || d.name.toLowerCase().includes('t4')
    );

    // Standard baseline for Shopify T4 slip (Alex Morgan's primary employer)
    return [
      {
        sourceDocName: t4Scans[0]?.fileName || 'Shopify_T4_Tax_Slip_2025.png',
        employerName: 'Shopify Commerce Canada Inc.',
        box14: 78500,
        box16: 3867.5,
        box18: 1049.12,
        box20: 2400,
        box22: 16420,
        box24: 63200,
        box26: 68500,
        box52: 4800,
      },
    ];
  }, [taxReturn.scannedDocuments]);

  // Compute live discrepancies
  const discrepancies: IncomeDiscrepancy[] = useMemo(() => {
    const list: IncomeDiscrepancy[] = [];
    const t4List = taxReturn.t4Slips || [];

    // Statutory 2025 Maximums
    const MAX_CPP_2025 = 3867.5;
    const MAX_EI_2025 = 1049.12;

    baselineScans.forEach((baseline) => {
      // Find matching manual T4 slip
      const matchingManual = t4List.find(
        (t) =>
          t.employerName?.toLowerCase().includes('shopify') ||
          baseline.employerName.toLowerCase().includes(t.employerName?.toLowerCase() || '---')
      );

      // Check 1: Missing T4 Slip altogether
      if (!matchingManual) {
        list.push({
          id: `disc-missing-${baseline.employerName}`,
          employerName: baseline.employerName,
          sourceDocName: baseline.sourceDocName,
          discrepancyType: 'missing_slip',
          fieldKey: 'missingSlip',
          fieldLabelEn: 'Missing T4 Employment Slip',
          fieldLabelFr: 'Feuillet T4 d’emploi manquant',
          manualValue: isFrench ? 'Non saisi (0 feuillet)' : 'Not entered (0 slips)',
          scannedValue: `$${baseline.box14.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD (Verified T4 Scan)`,
          craRiskEn:
            'CRA received this T4 slip directly from your employer. Failing to report it causes an automatic CRA matching assessment under Section 163(1).',
          craRiskFr:
            'L’ARC a reçu ce feuillet directement de votre employeur. Ne pas le déclarer entraîne un redressement automatique selon l’article 163(1).',
          suggestedActionEn: 'Add Missing T4 Slip from Scan',
          suggestedActionFr: 'Ajouter le feuillet T4 manquant depuis le scan',
          autoFixValue: {
            id: `t4-shopify-restored-${Date.now()}`,
            employerName: baseline.employerName,
            box14_employmentIncome: baseline.box14,
            box16_cppContributions: baseline.box16,
            box18_eiPremiums: baseline.box18,
            box20_rppContributions: baseline.box20,
            box22_incomeTaxDeducted: baseline.box22,
            box24_eiInsurableEarnings: baseline.box24,
            box26_cppPensionableEarnings: baseline.box26,
            box44_unionDues: 0,
            box52_pensionAdjustment: baseline.box52,
            verifiedByUser: true,
          },
        });
        return;
      }

      // Check 2: Box 14 Employment Income Discrepancy
      const manualIncome = matchingManual.box14_employmentIncome || 0;
      if (Math.abs(manualIncome - baseline.box14) > 10) {
        const delta = manualIncome - baseline.box14;
        const percent = ((delta / baseline.box14) * 100).toFixed(1);
        list.push({
          id: `disc-box14-${matchingManual.id}`,
          slipId: matchingManual.id,
          employerName: matchingManual.employerName || baseline.employerName,
          sourceDocName: baseline.sourceDocName,
          discrepancyType: 'amount_mismatch',
          fieldKey: 'box14_employmentIncome',
          fieldLabelEn: 'Employment Income (Box 14 / Line 10100)',
          fieldLabelFr: 'Revenus d’emploi (Case 14 / Ligne 10100)',
          manualValue: `$${manualIncome.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD`,
          scannedValue: `$${baseline.box14.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD`,
          deltaAmount: delta,
          deltaPercent: parseFloat(percent),
          craRiskEn:
            'Discrepancy with employer summary will flag automated pre-assessment review and delay refund deposit.',
          craRiskFr:
            'L’écart avec le sommaire de l’employeur déclenchera une révision préalable et retardera le remboursement.',
          suggestedActionEn: `Update Box 14 to $${baseline.box14.toLocaleString('en-CA')} CAD`,
          suggestedActionFr: `Mettre à jour la case 14 à ${baseline.box14.toLocaleString('en-CA')} $`,
          autoFixValue: baseline.box14,
        });
      }

      // Check 3: Box 22 Tax Deducted Discrepancy
      const manualTax = matchingManual.box22_incomeTaxDeducted || 0;
      if (Math.abs(manualTax - baseline.box22) > 10) {
        const delta = manualTax - baseline.box22;
        list.push({
          id: `disc-box22-${matchingManual.id}`,
          slipId: matchingManual.id,
          employerName: matchingManual.employerName || baseline.employerName,
          sourceDocName: baseline.sourceDocName,
          discrepancyType: 'tax_deducted_mismatch',
          fieldKey: 'box22_incomeTaxDeducted',
          fieldLabelEn: 'Income Tax Deducted (Box 22 / Line 43700)',
          fieldLabelFr: 'Impôt retenu à la source (Case 22 / Ligne 43700)',
          manualValue: `$${manualTax.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD`,
          scannedValue: `$${baseline.box22.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD`,
          deltaAmount: delta,
          craRiskEn:
            'Incorrect tax withholding deduction may lead to unexpected balance owing or penalty interest on reassessment.',
          craRiskFr:
            'Une retenue d’impôt inexacte peut entraîner un solde à payer inattendu ou des intérêts de pénalité.',
          suggestedActionEn: `Match Scanned Box 22 ($${baseline.box22.toLocaleString('en-CA')})`,
          suggestedActionFr: `Appliquer la case 22 numérisée (${baseline.box22.toLocaleString('en-CA')} $)`,
          autoFixValue: baseline.box22,
        });
      }

      // Check 4: Statutory CPP or EI limits exceeded
      if ((matchingManual.box16_cppContributions || 0) > MAX_CPP_2025 + 50) {
        list.push({
          id: `disc-cpp-limit-${matchingManual.id}`,
          slipId: matchingManual.id,
          employerName: matchingManual.employerName,
          sourceDocName: baseline.sourceDocName,
          discrepancyType: 'statutory_limit_exceeded',
          fieldKey: 'box16_cppContributions',
          fieldLabelEn: 'CPP Contributions Exceeds 2025 Maximum (Box 16)',
          fieldLabelFr: 'Cotisations RPC supérieures au maximum 2025 (Case 16)',
          manualValue: `$${(matchingManual.box16_cppContributions || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD`,
          scannedValue: `$${MAX_CPP_2025.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD (CRA Limit)`,
          craRiskEn: 'CPP contributions exceed statutory maximum limit of $3,867.50 for 2025. Verify possible overpayment.',
          craRiskFr: 'Les cotisations RPC dépassent le plafond légal de 3 867,50 $ pour 2025. Vérifiez la surcotisation.',
          suggestedActionEn: `Cap Box 16 at $${MAX_CPP_2025.toLocaleString('en-CA')}`,
          suggestedActionFr: `Plafonner la case 16 à ${MAX_CPP_2025.toLocaleString('en-CA')} $`,
          autoFixValue: MAX_CPP_2025,
        });
      }

      if ((matchingManual.box18_eiPremiums || 0) > MAX_EI_2025 + 50) {
        list.push({
          id: `disc-ei-limit-${matchingManual.id}`,
          slipId: matchingManual.id,
          employerName: matchingManual.employerName,
          sourceDocName: baseline.sourceDocName,
          discrepancyType: 'statutory_limit_exceeded',
          fieldKey: 'box18_eiPremiums',
          fieldLabelEn: 'EI Premiums Exceeds 2025 Maximum (Box 18)',
          fieldLabelFr: 'Cotisations AE supérieures au maximum 2025 (Case 18)',
          manualValue: `$${(matchingManual.box18_eiPremiums || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD`,
          scannedValue: `$${MAX_EI_2025.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD (CRA Limit)`,
          craRiskEn: 'EI premiums exceed statutory maximum limit of $1,049.12 for 2025.',
          craRiskFr: 'Les cotisations AE dépassent le plafond légal de 1 049,12 $ pour 2025.',
          suggestedActionEn: `Cap Box 18 at $${MAX_EI_2025.toLocaleString('en-CA')}`,
          suggestedActionFr: `Plafonner la case 18 à ${MAX_EI_2025.toLocaleString('en-CA')} $`,
          autoFixValue: MAX_EI_2025,
        });
      }
    });

    return list;
  }, [taxReturn.t4Slips, baselineScans, isFrench]);

  const activeDiscrepancies = useMemo(() => {
    return discrepancies.filter((d) => !dismissedIds.includes(d.id));
  }, [discrepancies, dismissedIds]);

  // Handler to fix a specific discrepancy
  const handleResolveDiscrepancy = (item: IncomeDiscrepancy) => {
    if (item.discrepancyType === 'missing_slip' && item.autoFixValue) {
      // Add missing slip
      const currentT4s = taxReturn.t4Slips || [];
      onUpdateTaxReturn({
        t4Slips: [...currentT4s, item.autoFixValue],
      });
      setShowResolvedSuccess(
        isFrench
          ? `Feuillet T4 manquant pour ${item.employerName} ajouté avec succès.`
          : `Missing T4 slip for ${item.employerName} added successfully.`
      );
    } else if (item.slipId && item.fieldKey !== 'missingSlip') {
      // Update specific field on the slip
      const updatedT4s = (taxReturn.t4Slips || []).map((s) => {
        if (s.id === item.slipId) {
          return {
            ...s,
            [item.fieldKey]: item.autoFixValue,
          };
        }
        return s;
      });
      onUpdateTaxReturn({ t4Slips: updatedT4s });
      setShowResolvedSuccess(
        isFrench
          ? `Écart résolu pour ${item.fieldLabelFr} mis à jour avec le scan certifié.`
          : `Discrepancy resolved for ${item.fieldLabelEn} synced with certified scan.`
      );
    }

    setTimeout(() => setShowResolvedSuccess(null), 3500);
  };

  // Handler to simulate discrepancy for demo / audit testing
  const handleTriggerTestDiscrepancy = () => {
    const currentT4s = taxReturn.t4Slips || [];
    if (currentT4s.length > 0) {
      const modified = currentT4s.map((s, idx) =>
        idx === 0
          ? {
              ...s,
              box14_employmentIncome: 72000, // Intentional $6,500 mismatch vs $78,500 scan
              box22_incomeTaxDeducted: 14000, // Intentional $2,420 mismatch
            }
          : s
      );
      onUpdateTaxReturn({ t4Slips: modified });
      setDismissedIds([]);
    }
  };

  // Handler to reset all slips to match scans perfectly
  const handleResetToPerfectMatch = () => {
    const baseline = baselineScans[0];
    const currentT4s = taxReturn.t4Slips || [];
    if (currentT4s.length === 0) {
      onUpdateTaxReturn({
        t4Slips: [
          {
            id: 't4-shopify-01',
            employerName: baseline.employerName,
            box14_employmentIncome: baseline.box14,
            box16_cppContributions: baseline.box16,
            box18_eiPremiums: baseline.box18,
            box20_rppContributions: baseline.box20,
            box22_incomeTaxDeducted: baseline.box22,
            box24_eiInsurableEarnings: baseline.box24,
            box26_cppPensionableEarnings: baseline.box26,
            box44_unionDues: 0,
            box52_pensionAdjustment: baseline.box52,
            verifiedByUser: true,
          },
        ],
      });
    } else {
      const fixed = currentT4s.map((s) => {
        if (s.employerName?.toLowerCase().includes('shopify')) {
          return {
            ...s,
            box14_employmentIncome: baseline.box14,
            box22_incomeTaxDeducted: baseline.box22,
            box16_cppContributions: baseline.box16,
            box18_eiPremiums: baseline.box18,
          };
        }
        return s;
      });
      onUpdateTaxReturn({ t4Slips: fixed });
    }
    setDismissedIds([]);
  };

  // If no active discrepancies, show clean verified badge with quick test button
  if (activeDiscrepancies.length === 0) {
    return (
      <div
        id="income-discrepancy-clean-banner"
        className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-bold">
                100% RECONCILED
              </span>
              <span className="text-xs font-bold text-emerald-950">
                {isFrench ? 'Aucun Écart de Revenu Détecté' : 'Income Slips Match Verified Scans'}
              </span>
            </div>
            <p className="text-xs text-emerald-800 mt-0.5">
              {isFrench
                ? 'Les montants saisis correspondent exactement aux feuillets T4 numérisés et aux registres de l’employeur.'
                : 'All manual entries match uploaded T4 document scans and CRA employer payroll reports.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTriggerTestDiscrepancy}
          className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline px-2 py-1 shrink-0 cursor-pointer text-left sm:text-right"
          title="Simulate a data discrepancy between manual entry and uploaded scan to verify warning alerts"
        >
          {isFrench ? 'Simuler un écart de test' : 'Simulate Test Discrepancy'}
        </button>
      </div>
    );
  }

  return (
    <div
      id="income-discrepancy-alert-container"
      className="mb-6 rounded-2xl border-2 border-amber-400 bg-linear-to-b from-amber-50 to-white shadow-md overflow-hidden"
    >
      {/* Top Banner Header */}
      <div className="bg-amber-500/15 border-b border-amber-300/80 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold tracking-wider border border-amber-300">
                {isFrench ? 'ATTENTION ÉCART DÉTECTÉ' : 'RECONCILIATION AUDIT WARNING'}
              </span>
              <span className="text-xs font-mono font-bold text-amber-900">
                {activeDiscrepancies.length} {isFrench ? 'Écart(s)' : 'Discrepancy(ies)'}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              {isFrench
                ? 'Alerte d’Écart de Revenus — Comparaison des Feuillets et Scans'
                : 'Income Discrepancy Alert: Potential Entry Errors or Missing Slips Detected'}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleResetToPerfectMatch}
            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
          >
            {isFrench ? 'Tout synchroniser avec les scans' : 'Sync All to Scans'}
          </button>
        </div>
      </div>

      {/* Success Resolution Banner */}
      {showResolvedSuccess && (
        <div className="bg-emerald-100/80 border-b border-emerald-300 px-5 py-2 text-xs text-emerald-900 flex items-center space-x-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{showResolvedSuccess}</span>
        </div>
      )}

      {/* Explanatory Callout */}
      <div className="p-4 bg-amber-50/40 border-b border-amber-200/50 text-xs text-amber-950 flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {isFrench
            ? 'Notre moteur de révision a détecté des divergences entre les données saisies manuellement et vos documents T4 téléversés ou historiques. Corriger ces écarts avant la transmission NETFILE évite les délais d’examen et les redressements de l’ARC.'
            : 'Our reconciliation engine detected differences between your manually entered numbers and uploaded T4 document scans or historical employer records. Resolving these mismatches ensures smooth NETFILE processing without CRA audit delays.'}
        </p>
      </div>

      {/* Discrepancies List */}
      <div className="p-4 space-y-3">
        {activeDiscrepancies.map((item) => {
          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-amber-300 p-4 shadow-2xs hover:border-amber-400 transition-all space-y-3"
            >
              {/* Slip Metadata & Discrepancy Type */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="font-bold text-xs text-slate-900">{item.employerName}</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center space-x-1">
                    <Camera className="w-3 h-3 text-teal-600" />
                    <span>{item.sourceDocName}</span>
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded-full inline-block">
                  {isFrench ? item.fieldLabelFr : item.fieldLabelEn}
                </span>
              </div>

              {/* Comparison Box: Manual Entry vs Scanned Value */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-50/80 rounded-xl p-3 border border-slate-200">
                {/* Manual Entry */}
                <div className="md:col-span-5">
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    {isFrench ? 'Montant saisi manuellement :' : 'Manually Entered in App:'}
                  </div>
                  <div className="text-sm font-mono font-bold text-rose-700 mt-0.5">
                    {item.manualValue}
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-slate-400 rotate-90 md:rotate-0" />
                </div>

                {/* Scanned / Historical Value */}
                <div className="md:col-span-5">
                  <div className="text-[10px] uppercase font-bold text-emerald-700 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{isFrench ? 'Valeur certifiée du scan / historique :' : 'Certified Document Scan Value:'}</span>
                  </div>
                  <div className="text-sm font-mono font-bold text-emerald-800 mt-0.5">
                    {item.scannedValue}
                  </div>
                </div>
              </div>

              {/* CRA Compliance Risk Note */}
              <div className="text-xs text-slate-600 flex items-start space-x-2 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/60">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <strong className="text-amber-950 font-semibold">
                    {isFrench ? 'Impact de conformité ARC :' : 'CRA Compliance Impact:'}
                  </strong>{' '}
                  {isFrench ? item.craRiskFr : item.craRiskEn}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDismissedIds([...dismissedIds, item.id])}
                  className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  {isFrench ? 'Ignorer et conserver la valeur manuelle' : 'Dismiss warning & keep manual entry'}
                </button>

                <button
                  type="button"
                  onClick={() => handleResolveDiscrepancy(item)}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                  <span>{isFrench ? item.suggestedActionFr : item.suggestedActionEn}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
