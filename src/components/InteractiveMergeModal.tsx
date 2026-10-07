import React, { useState, useMemo } from 'react';
import {
  X,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Layers,
  FileText,
  User,
  Check,
  RefreshCw,
  Columns,
  Split,
  History,
} from 'lucide-react';
import { AppTaxReturn, ConflictDifference } from '../types/tax';

interface InteractiveMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftReturn: AppTaxReturn;
  remoteReturn: AppTaxReturn;
  lastSavedDraftTime: number | null;
  remoteSyncedTime: number | null;
  onApplyMerge: (mergedReturn: AppTaxReturn, resolutions: ConflictDifference[]) => void;
  language: 'en' | 'fr';
  conflictingFields?: ConflictDifference[];
}

export const InteractiveMergeModal: React.FC<InteractiveMergeModalProps> = ({
  isOpen,
  onClose,
  draftReturn,
  remoteReturn,
  lastSavedDraftTime,
  remoteSyncedTime,
  onApplyMerge,
  language,
  conflictingFields,
}) => {
  const isFrench = language === 'fr';

  // Compute list of differences between local draft and remote return
  const initialDifferences = useMemo<ConflictDifference[]>(() => {
    const diffs: ConflictDifference[] = [];
    const d = draftReturn;
    const r = remoteReturn;

    const formatCur = (val?: number) =>
      `$${(val ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`;

    // 1. Explicit conflictingFields passed in from auditTrail
    if (conflictingFields && conflictingFields.length > 0) {
      conflictingFields.forEach((cf) => {
        if (!diffs.some((existing) => existing.fieldKey === cf.fieldKey)) {
          diffs.push({ ...cf });
        }
      });
    }

    // 2. Scan auditTrail for marked conflicting entries
    if (d.auditTrail && d.auditTrail.length > 0) {
      d.auditTrail.forEach((entry) => {
        const isConflict =
          entry.conflicted ||
          entry.action === 'merged' ||
          (entry.notes && (entry.notes.toLowerCase().includes('conflit') || entry.notes.toLowerCase().includes('conflict')));

        if (isConflict) {
          const exists = diffs.some((existing) => existing.fieldKey === entry.field);
          if (!exists) {
            diffs.push({
              id: `diff-audit-${entry.id}`,
              fieldKey: entry.field,
              category: (entry.category as any) || 'personal',
              labelEn: entry.fieldLabelEn || entry.field,
              labelFr: entry.fieldLabelFr || entry.field,
              localValue: entry.currentValue,
              remoteValue: entry.previousValue,
              localDisplay: entry.currentValue || '(empty)',
              remoteDisplay: entry.previousValue || '(empty)',
              chosenResolution: 'local',
              auditEntryId: entry.id,
              conflictType: 'audit_conflict',
            });
          }
        }
      });
    }

    // 3. Personal: Province
    if (d.personal?.province !== r.personal?.province && !diffs.some((x) => x.fieldKey === 'personal.province')) {
      diffs.push({
        id: 'diff-province',
        fieldKey: 'personal.province',
        category: 'personal',
        labelEn: 'Tax Jurisdiction (Province of Residence)',
        labelFr: 'Province de résidence fiscale (au 31 déc.)',
        localValue: d.personal?.province,
        remoteValue: r.personal?.province,
        localDisplay: d.personal?.province || 'Unspecified',
        remoteDisplay: r.personal?.province || 'Unspecified',
        chosenResolution: 'local',
        conflictType: 'sync_divergence',
      });
    }

    // 4. Personal: Name
    const dName = `${d.personal?.firstName || ''} ${d.personal?.lastName || ''}`.trim();
    const rName = `${r.personal?.firstName || ''} ${r.personal?.lastName || ''}`.trim();
    if (dName !== rName && !diffs.some((x) => x.fieldKey === 'personal.name')) {
      diffs.push({
        id: 'diff-name',
        fieldKey: 'personal.name',
        category: 'personal',
        labelEn: 'Taxpayer Legal Name',
        labelFr: 'Nom légal du contribuable',
        localValue: { firstName: d.personal?.firstName, lastName: d.personal?.lastName },
        remoteValue: { firstName: r.personal?.firstName, lastName: r.personal?.lastName },
        localDisplay: dName || '(Empty)',
        remoteDisplay: rName || '(Empty)',
        chosenResolution: 'local',
        conflictType: 'sync_divergence',
      });
    }

    // 5. Personal: SIN
    if ((d.personal?.sin || '') !== (r.personal?.sin || '') && !diffs.some((x) => x.fieldKey === 'personal.sin')) {
      const mask = (sin?: string) => (sin ? `***-***-${sin.slice(-3)}` : '(Not set)');
      diffs.push({
        id: 'diff-sin',
        fieldKey: 'personal.sin',
        category: 'personal',
        labelEn: 'Social Insurance Number (SIN)',
        labelFr: 'Numéro d’assurance sociale (NAS)',
        localValue: d.personal?.sin,
        remoteValue: r.personal?.sin,
        localDisplay: mask(d.personal?.sin),
        remoteDisplay: mask(r.personal?.sin),
        chosenResolution: 'local',
        conflictType: 'sync_divergence',
      });
    }

    // 6. Personal: Marital Status
    if (d.personal?.maritalStatus !== r.personal?.maritalStatus && !diffs.some((x) => x.fieldKey === 'personal.maritalStatus')) {
      diffs.push({
        id: 'diff-marital',
        fieldKey: 'personal.maritalStatus',
        category: 'personal',
        labelEn: 'Marital Status',
        labelFr: 'État civil',
        localValue: d.personal?.maritalStatus,
        remoteValue: r.personal?.maritalStatus,
        localDisplay: d.personal?.maritalStatus || 'single',
        remoteDisplay: r.personal?.maritalStatus || 'single',
        chosenResolution: 'local',
        conflictType: 'sync_divergence',
      });
    }

    // 7. T4 Slips: Count & Totals
    const dIncome = d.t4Slips.reduce((s, x) => s + (x.box14_employmentIncome || 0), 0);
    const rIncome = r.t4Slips.reduce((s, x) => s + (x.box14_employmentIncome || 0), 0);
    if ((d.t4Slips.length !== r.t4Slips.length || Math.abs(dIncome - rIncome) > 0.01) && !diffs.some((x) => x.fieldKey === 't4Slips')) {
      diffs.push({
        id: 'diff-t4-slips',
        fieldKey: 't4Slips',
        category: 'slips',
        labelEn: 'T4 Employment Slips & Income (Box 14)',
        labelFr: 'Feuillets d’emploi T4 & Revenus (Case 14)',
        localValue: d.t4Slips,
        remoteValue: r.t4Slips,
        localDisplay: `${d.t4Slips.length} slip(s) • Total ${formatCur(dIncome)}`,
        remoteDisplay: `${r.t4Slips.length} slip(s) • Total ${formatCur(rIncome)}`,
        chosenResolution: 'local',
        conflictType: 'sync_divergence',
      });
    }

    // 8. Other Slips (T4A & T5)
    const dOther = d.otherSlips || [];
    const rOther = r.otherSlips || [];
    if ((dOther.length !== rOther.length || JSON.stringify(dOther) !== JSON.stringify(rOther)) && !diffs.some((x) => x.fieldKey === 'otherSlips')) {
      diffs.push({
        id: 'diff-other-slips',
        fieldKey: 'otherSlips',
        category: 'slips',
        labelEn: 'Other Slips (T4A Pension & T5 Investments)',
        labelFr: 'Autres feuillets (T4A Pension & T5 Placements)',
        localValue: dOther,
        remoteValue: rOther,
        localDisplay: `${dOther.length} slip(s) (${dOther.map((s) => s.type).join(', ') || 'None'})`,
        remoteDisplay: `${rOther.length} slip(s) (${rOther.map((s) => s.type).join(', ') || 'None'})`,
        chosenResolution: 'local',
        conflictType: 'sync_divergence',
      });
    }

    // 9. RRSP Deductions
    const dRrsp = d.deductions?.rrspContributions || 0;
    const rRrsp = r.deductions?.rrspContributions || 0;
    if (Math.abs(dRrsp - rRrsp) > 0.01 && !diffs.some((x) => x.fieldKey === 'deductions.rrspContributions')) {
      diffs.push({
        id: 'diff-rrsp',
        fieldKey: 'deductions.rrspContributions',
        category: 'deductions',
        labelEn: 'RRSP / PRPP Deduction (Line 20800)',
        labelFr: 'Déduction REER / RPAC (Ligne 20800)',
        localValue: dRrsp,
        remoteValue: rRrsp,
        localDisplay: formatCur(dRrsp),
        remoteDisplay: formatCur(rRrsp),
        chosenResolution: 'local',
        conflictType: 'sync_divergence',
      });
    }

    // 10. Union & Professional Dues
    const dUnion = d.deductions?.unionOrProfessionalDues || 0;
    const rUnion = r.deductions?.unionOrProfessionalDues || 0;
    if (Math.abs(dUnion - rUnion) > 0.01 && !diffs.some((x) => x.fieldKey === 'deductions.unionOrProfessionalDues')) {
      diffs.push({
        id: 'diff-union-dues',
        fieldKey: 'deductions.unionOrProfessionalDues',
        category: 'deductions',
        labelEn: 'Union & Professional Dues (Line 21200)',
        labelFr: 'Cotisations syndicales ou professionnelles (Ligne 21200)',
        localValue: dUnion,
        remoteValue: rUnion,
        localDisplay: formatCur(dUnion),
        remoteDisplay: formatCur(rUnion),
        chosenResolution: 'local',
        conflictType: 'sync_divergence',
      });
    }

    // 11. Charitable Donations
    const dDonations = d.credits?.charitableDonations || 0;
    const rDonations = r.credits?.charitableDonations || 0;
    if (Math.abs(dDonations - rDonations) > 0.01 && !diffs.some((x) => x.fieldKey === 'credits.charitableDonations')) {
      diffs.push({
        id: 'diff-charitable-donations',
        fieldKey: 'credits.charitableDonations',
        category: 'credits',
        labelEn: 'Charitable Donations (Line 34900)',
        labelFr: 'Dons de bienfaisance (Ligne 34900)',
        localValue: dDonations,
        remoteValue: rDonations,
        localDisplay: formatCur(dDonations),
        remoteDisplay: formatCur(rDonations),
        chosenResolution: 'local',
        conflictType: 'sync_divergence',
      });
    }

    // 12. Medical Expenses
    const dMedical = d.credits?.eligibleMedicalExpenses || 0;
    const rMedical = r.credits?.eligibleMedicalExpenses || 0;
    if (Math.abs(dMedical - rMedical) > 0.01 && !diffs.some((x) => x.fieldKey === 'credits.eligibleMedicalExpenses')) {
      diffs.push({
        id: 'diff-medical',
        fieldKey: 'credits.eligibleMedicalExpenses',
        category: 'credits',
        labelEn: 'Medical Expenses (Line 33099)',
        labelFr: 'Frais médicaux admissibles (Ligne 33099)',
        localValue: dMedical,
        remoteValue: rMedical,
        localDisplay: formatCur(dMedical),
        remoteDisplay: formatCur(rMedical),
        chosenResolution: 'local',
        conflictType: 'sync_divergence',
      });
    }

    // Fallback if full JSON differs but above didn't catch specific fields
    if (diffs.length === 0 && JSON.stringify(d) !== JSON.stringify(r)) {
      diffs.push({
        id: 'diff-general',
        fieldKey: 'general',
        category: 'personal',
        labelEn: 'Tax Return General Settings & Slips',
        labelFr: 'Paramètres généraux et feuillets fiscaux',
        localValue: d,
        remoteValue: r,
        localDisplay: isFrench ? 'Brouillon local complet' : 'Full Local Draft',
        remoteDisplay: isFrench ? 'Instantané distant complet' : 'Full Remote Snapshot',
        chosenResolution: 'local',
        conflictType: 'sync_divergence',
      });
    }

    return diffs;
  }, [draftReturn, remoteReturn, isFrench, conflictingFields]);

  const [resolutions, setResolutions] = useState<Record<string, 'local' | 'remote'>>({});
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'sideBySide' | 'stepByStep' | 'summary'>('sideBySide');

  // Initialize or reset resolutions when modal opens or differences change
  React.useEffect(() => {
    const initial: Record<string, 'local' | 'remote'> = {};
    initialDifferences.forEach((d) => {
      initial[d.id] = 'local';
    });
    setResolutions(initial);
    setCurrentStepIdx(0);
    setActiveTab('sideBySide');
  }, [initialDifferences, isOpen]);

  if (!isOpen) return null;

  const totalSteps = initialDifferences.length;
  const currentDiff = initialDifferences[currentStepIdx] || initialDifferences[0];

  const handleSelectResolution = (diffId: string, choice: 'local' | 'remote') => {
    setResolutions((prev) => ({
      ...prev,
      [diffId]: choice,
    }));
  };

  const handleSelectAll = (choice: 'local' | 'remote') => {
    const updated: Record<string, 'local' | 'remote'> = {};
    initialDifferences.forEach((d) => {
      updated[d.id] = choice;
    });
    setResolutions(updated);
  };

  const handleApply = () => {
    // Construct merged return object without performing a blind full revert
    let merged: AppTaxReturn = JSON.parse(JSON.stringify(draftReturn));

    initialDifferences.forEach((diff) => {
      const choice = resolutions[diff.id] || 'local';
      if (choice === 'remote') {
        if (diff.fieldKey === 'personal.province') {
          merged.personal = { ...merged.personal, province: remoteReturn.personal?.province };
        } else if (diff.fieldKey === 'personal.name') {
          merged.personal = {
            ...merged.personal,
            firstName: remoteReturn.personal?.firstName,
            lastName: remoteReturn.personal?.lastName,
          };
        } else if (diff.fieldKey === 'personal.sin') {
          merged.personal = { ...merged.personal, sin: remoteReturn.personal?.sin };
        } else if (diff.fieldKey === 'personal.maritalStatus') {
          merged.personal = { ...merged.personal, maritalStatus: remoteReturn.personal?.maritalStatus };
        } else if (diff.fieldKey === 't4Slips') {
          merged.t4Slips = remoteReturn.t4Slips;
        } else if (diff.fieldKey === 'otherSlips') {
          merged.otherSlips = remoteReturn.otherSlips;
        } else if (diff.fieldKey === 'deductions.rrspContributions') {
          merged.deductions = {
            ...merged.deductions,
            rrspContributions: remoteReturn.deductions?.rrspContributions || 0,
          };
        } else if (diff.fieldKey === 'deductions.unionOrProfessionalDues') {
          merged.deductions = {
            ...merged.deductions,
            unionOrProfessionalDues: remoteReturn.deductions?.unionOrProfessionalDues || 0,
          };
        } else if (diff.fieldKey === 'credits.charitableDonations') {
          merged.credits = {
            ...merged.credits,
            charitableDonations: remoteReturn.credits?.charitableDonations || 0,
          };
        } else if (diff.fieldKey === 'credits.eligibleMedicalExpenses') {
          merged.credits = {
            ...merged.credits,
            eligibleMedicalExpenses: remoteReturn.credits?.eligibleMedicalExpenses || 0,
          };
        } else if (diff.fieldKey.startsWith('personal.')) {
          const prop = diff.fieldKey.split('.')[1];
          if (merged.personal && prop) {
            (merged.personal as any)[prop] = diff.remoteValue;
          }
        } else if (diff.fieldKey.startsWith('deductions.')) {
          const prop = diff.fieldKey.split('.')[1];
          if (merged.deductions && prop) {
            (merged.deductions as any)[prop] = Number(diff.remoteValue) || 0;
          }
        } else if (diff.fieldKey.startsWith('credits.')) {
          const prop = diff.fieldKey.split('.')[1];
          if (merged.credits && prop) {
            (merged.credits as any)[prop] = Number(diff.remoteValue) || 0;
          }
        } else if (diff.fieldKey === 'general') {
          merged = { ...remoteReturn };
        }
      }
    });

    const diffListWithResolutions: ConflictDifference[] = initialDifferences.map((d) => ({
      ...d,
      chosenResolution: resolutions[d.id] || 'local',
    }));

    onApplyMerge(merged, diffListWithResolutions);
    onClose();
  };

  const localChosenCount = Object.values(resolutions).filter((r) => r === 'local').length;
  const remoteChosenCount = Object.values(resolutions).filter((r) => r === 'remote').length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="interactive-merge-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-linear-to-r from-amber-500/10 via-amber-50 to-emerald-50/60 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs shrink-0">
              <Split className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="interactive-merge-title" className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {isFrench ? 'Fusion et Résolution Visuelle des Conflits' : 'Visual Conflict Merge & Individual Diff'}
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 border border-amber-300 uppercase tracking-wider">
                  {totalSteps} {isFrench ? 'champ(s) en conflit' : 'conflicting field(s)'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {isFrench
                  ? 'Comparez les valeurs côte-à-côte et sélectionnez individuellement les valeurs à conserver sans réinitialisation complète.'
                  : 'Compare conflicting fields side-by-side and select values individually without an unwanted full revert.'}
              </p>
            </div>
          </div>

          <button
            id="close-merge-modal-btn"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close merge dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Tabs & Quick Select */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/60">
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('sideBySide')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'sideBySide'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>{isFrench ? 'Diff Côte-à-Côte' : 'Side-by-Side Visual Diff'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stepByStep')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'stepByStep'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <span>{isFrench ? 'Étape par Étape' : 'Step-by-Step Resolver'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'summary'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <span>{isFrench ? 'Tableau Récapitulatif' : 'Summary Matrix'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              {isFrench ? 'Sélection rapide :' : 'Quick bulk choice:'}
            </span>
            <button
              type="button"
              onClick={() => handleSelectAll('local')}
              className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white hover:bg-slate-100 text-emerald-800 border border-emerald-300 transition-colors cursor-pointer"
            >
              {isFrench ? 'Tout Local' : 'Keep All Local'}
            </button>
            <button
              type="button"
              onClick={() => handleSelectAll('remote')}
              className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white hover:bg-slate-100 text-blue-800 border border-blue-300 transition-colors cursor-pointer"
            >
              {isFrench ? 'Tout Distant / Précédent' : 'Accept All Remote / Audit'}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {totalSteps === 0 ? (
            <div className="py-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-slate-900 text-base">
                {isFrench ? 'Aucun conflit de champ détecté !' : 'No Conflicting Fields Found!'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isFrench
                  ? 'Toutes les données de votre déclaration sont synchronisées et sans conflit dans la piste d’audit.'
                  : 'All fields across your working return and audit history are in alignment.'}
              </p>
            </div>
          ) : activeTab === 'sideBySide' ? (
            /* First-Class Side-by-Side Visual Diff */
            <div className="space-y-4">
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs flex items-start space-x-2.5">
                <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-amber-950 block">
                    {isFrench
                      ? 'Différence Visuelle Côte-à-Côte — Sélection Individuelle par Champ'
                      : 'Side-by-Side Visual Diff — Individual Field Selection'}
                  </span>
                  <p className="text-amber-800 text-[11px]">
                    {isFrench
                      ? 'Sélectionnez individuellement la valeur souhaitée pour chaque champ en conflit. Cela fusionne précisément vos choix sans imposer de réinitialisation complète de votre déclaration.'
                      : 'Select your preferred value for each conflicting field below. This performs a selective field merge, preventing a full return revert.'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {initialDifferences.map((diff, idx) => {
                  const choice = resolutions[diff.id] || 'local';
                  const isFromAudit = diff.conflictType === 'audit_conflict';

                  return (
                    <div
                      key={diff.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs space-y-3 transition-all"
                    >
                      {/* Field Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                            #{idx + 1} • {diff.category}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                            {isFrench ? diff.labelFr : diff.labelEn}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400">
                            ({diff.fieldKey})
                          </span>
                        </div>

                        {isFromAudit ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 flex items-center space-x-1">
                            <History className="w-3 h-3 text-amber-700" />
                            <span>{isFrench ? 'Piste d’Audit' : 'Audit Trail Conflict'}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-sky-100 text-sky-900 border border-sky-200 flex items-center space-x-1">
                            <ArrowRightLeft className="w-3 h-3 text-sky-700" />
                            <span>{isFrench ? 'Synchro Cloud' : 'Sync Variance'}</span>
                          </span>
                        )}
                      </div>

                      {/* Side-by-Side Comparison Columns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Left Column: Local / Current Working Draft */}
                        <div
                          onClick={() => handleSelectResolution(diff.id, 'local')}
                          className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                            choice === 'local'
                              ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-400/20'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                                {isFrench ? 'Valeur Locale / Brouillon' : 'Local / Current Draft'}
                              </span>
                              {choice === 'local' && (
                                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                            <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs font-bold text-emerald-950 break-words">
                              {diff.localDisplay}
                            </div>
                          </div>

                          <div className="pt-2 text-[11px] text-emerald-800 font-bold flex items-center justify-between border-t border-emerald-100/60 mt-2">
                            <span>{choice === 'local' ? (isFrench ? '✓ Retenu' : '✓ Selected') : (isFrench ? 'Cliquer pour choisir' : 'Click to select')}</span>
                            <span className="text-slate-400 font-normal text-[10px]">{isFrench ? 'Brouillon actif' : 'Active working copy'}</span>
                          </div>
                        </div>

                        {/* Right Column: Remote / Conflicting Audit Value */}
                        <div
                          onClick={() => handleSelectResolution(diff.id, 'remote')}
                          className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                            choice === 'remote'
                              ? 'border-blue-500 bg-blue-50/70 shadow-xs ring-2 ring-blue-400/20'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                                {isFrench ? 'Valeur Conflit / Piste d’Audit' : 'Conflicting / Audit Value'}
                              </span>
                              {choice === 'remote' && (
                                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                            <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs font-bold text-blue-950 break-words">
                              {diff.remoteDisplay}
                            </div>
                          </div>

                          <div className="pt-2 text-[11px] text-blue-800 font-bold flex items-center justify-between border-t border-blue-100/60 mt-2">
                            <span>{choice === 'remote' ? (isFrench ? '✓ Retenu' : '✓ Selected') : (isFrench ? 'Cliquer pour choisir' : 'Click to select')}</span>
                            <span className="text-slate-400 font-normal text-[10px]">{isFrench ? 'Version concurrente' : 'Concurrent version'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'stepByStep' && currentDiff ? (
            <div className="space-y-4">
              {/* Step Tracker Header */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700">
                    {isFrench ? 'Différence' : 'Conflict Item'} {currentStepIdx + 1} / {totalSteps}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                    {isFrench ? currentDiff.labelFr : currentDiff.labelEn}
                  </h3>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-slate-500">
                    {Math.round(((currentStepIdx + 1) / totalSteps) * 100)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${((currentStepIdx + 1) / totalSteps) * 100}%` }}
                />
              </div>

              {/* Step Navigation Dots */}
              <div className="flex items-center justify-center space-x-1 py-1 overflow-x-auto">
                {initialDifferences.map((d, idx) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setCurrentStepIdx(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                      idx === currentStepIdx
                        ? 'bg-slate-900 text-white ring-2 ring-amber-400'
                        : resolutions[d.id] === 'remote'
                        ? 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                        : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                    }`}
                    title={isFrench ? d.labelFr : d.labelEn}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {/* Resolution Cards: Local vs Remote */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Option 1: Keep Local Draft */}
                <div
                  onClick={() => handleSelectResolution(currentDiff.id, 'local')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    resolutions[currentDiff.id] === 'local'
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-md ring-2 ring-emerald-400/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                        {isFrench ? 'Option A • Brouillon Local' : 'Option A • Local Working Draft'}
                      </span>
                      {resolutions[currentDiff.id] === 'local' && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-slate-500">
                      {isFrench ? 'Modifié sur cet appareil :' : 'Device working copy:'}
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-sm font-bold text-emerald-950 break-words">
                      {currentDiff.localDisplay}
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 mt-3">
                    <span>
                      {lastSavedDraftTime
                        ? `${isFrench ? 'Enregistré :' : 'Saved:'} ${new Date(lastSavedDraftTime).toLocaleTimeString()}`
                        : isFrench
                        ? 'En attente'
                        : 'Active Draft'}
                    </span>
                    <span className="font-bold text-emerald-700">
                      {resolutions[currentDiff.id] === 'local'
                        ? isFrench
                          ? '✓ Retenu'
                          : '✓ Selected'
                        : isFrench
                        ? 'Cliquer pour choisir'
                        : 'Click to select'}
                    </span>
                  </div>
                </div>

                {/* Option 2: Accept Remote Snapshot */}
                <div
                  onClick={() => handleSelectResolution(currentDiff.id, 'remote')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    resolutions[currentDiff.id] === 'remote'
                      ? 'border-blue-500 bg-blue-50/70 shadow-md ring-2 ring-blue-400/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                        {isFrench ? 'Option B • Instantané Distant' : 'Option B • Remote / Service Worker'}
                      </span>
                      {resolutions[currentDiff.id] === 'remote' && (
                        <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-slate-500">
                      {isFrench ? 'Dernier instantané synchronisé :' : 'Last synced snapshot:'}
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-sm font-bold text-blue-950 break-words">
                      {currentDiff.remoteDisplay}
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 mt-3">
                    <span>
                      {remoteSyncedTime
                        ? `${isFrench ? 'Synchro :' : 'Synced:'} ${new Date(remoteSyncedTime).toLocaleTimeString()}`
                        : isFrench
                        ? 'Non synchro'
                        : 'Remote Snapshot'}
                    </span>
                    <span className="font-bold text-blue-700">
                      {resolutions[currentDiff.id] === 'remote'
                        ? isFrench
                          ? '✓ Retenu'
                          : '✓ Selected'
                        : isFrench
                        ? 'Cliquer pour choisir'
                        : 'Click to select'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Prev / Next Step Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled={currentStepIdx === 0}
                  onClick={() => setCurrentStepIdx((p) => Math.max(0, p - 1))}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{isFrench ? 'Précédent' : 'Previous Item'}</span>
                </button>

                {currentStepIdx < totalSteps - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStepIdx((p) => Math.min(totalSteps - 1, p + 1))}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
                  >
                    <span>{isFrench ? 'Suivant' : 'Next Item'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveTab('sideBySide')}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
                  >
                    <span>{isFrench ? 'Voir le Diff Visuel' : 'View Side-by-Side'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Summary Matrix Mode */
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">
                    {isFrench ? 'Plan de fusion configuré' : 'Configured Merge Plan'}
                  </span>
                  <span className="text-slate-500">
                    {localChosenCount} {isFrench ? 'valeur(s) locales conservées' : 'local value(s) kept'} • {remoteChosenCount}{' '}
                    {isFrench ? 'valeur(s) distantes adoptées' : 'remote value(s) accepted'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('sideBySide')}
                  className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
                >
                  {isFrench ? 'Voir le diff complet' : 'View complete diff'}
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2.5">{isFrench ? 'Élément' : 'Item'}</th>
                      <th className="p-2.5 border-l border-slate-200">{isFrench ? 'Brouillon Local' : 'Local Draft'}</th>
                      <th className="p-2.5 border-l border-slate-200">{isFrench ? 'Instantané Distant' : 'Remote Snapshot'}</th>
                      <th className="p-2.5 border-l border-slate-200 text-center">{isFrench ? 'Résolution' : 'Resolution'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {initialDifferences.map((d) => {
                      const res = resolutions[d.id] || 'local';
                      return (
                        <tr key={d.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-semibold text-slate-800">
                            {isFrench ? d.labelFr : d.labelEn}
                          </td>
                          <td
                            className={`p-2.5 font-mono border-l border-slate-200 ${
                              res === 'local' ? 'font-bold text-emerald-900 bg-emerald-50/50' : 'text-slate-500'
                            }`}
                          >
                            {d.localDisplay}
                          </td>
                          <td
                            className={`p-2.5 font-mono border-l border-slate-200 ${
                              res === 'remote' ? 'font-bold text-blue-900 bg-blue-50/50' : 'text-slate-500'
                            }`}
                          >
                            {d.remoteDisplay}
                          </td>
                          <td className="p-2.5 border-l border-slate-200 text-center">
                            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
                              <button
                                type="button"
                                onClick={() => handleSelectResolution(d.id, 'local')}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-colors cursor-pointer ${
                                  res === 'local' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {isFrench ? 'Local' : 'Local'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSelectResolution(d.id, 'remote')}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-colors cursor-pointer ${
                                  res === 'remote' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {isFrench ? 'Distant' : 'Remote'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-[#064e3b]" />
            <span>
              {isFrench
                ? 'Sélection individuelle appliquée : aucune réinitialisation complète des autres champs.'
                : 'Individual values applied: non-conflicting fields remain completely intact.'}
            </span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              id="cancel-merge-btn"
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              {isFrench ? 'Annuler' : 'Cancel'}
            </button>

            <button
              id="apply-interactive-merge-btn"
              type="button"
              onClick={handleApply}
              className="py-2.5 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 shadow-md hover:shadow-amber-400/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 text-slate-950" />
              <span>{isFrench ? 'Appliquer les Valeurs Individuelles' : 'Apply Individual Merge Selections'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
