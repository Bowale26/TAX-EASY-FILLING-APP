import React, { useMemo } from 'react';
import {
  X,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  FileText,
  User,
  DollarSign,
  Layers,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import { AppTaxReturn } from '../types/tax';
import { computeCanadianT1Return } from '../services/taxCalculationEngine';

export interface DiffRow {
  category: 'summary' | 'personal' | 'slips' | 'deductions' | 'credits';
  id: string;
  labelEn: string;
  labelFr: string;
  draftValue: string | number;
  remoteValue: string | number;
  isDifferent: boolean;
  diffType?: 'modified' | 'added' | 'removed';
  detailEn?: string;
  detailFr?: string;
}

interface DraftVsRemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftReturn: AppTaxReturn;
  remoteReturn: AppTaxReturn | null;
  lastSavedDraftTime: number | null;
  remoteSyncedTime: number | null;
  hasPendingChanges: boolean;
  onSyncDraft: () => void;
  onRevertToRemote: () => void;
  language: 'en' | 'fr';
}

export const DraftVsRemoteModal: React.FC<DraftVsRemoteModalProps> = ({
  isOpen,
  onClose,
  draftReturn,
  remoteReturn,
  lastSavedDraftTime,
  remoteSyncedTime,
  hasPendingChanges,
  onSyncDraft,
  onRevertToRemote,
  language,
}) => {
  const isFrench = language === 'fr';

  // Calculate taxes for both draft and remote if remote exists
  const draftCalc = useMemo(() => {
    return (
      draftReturn.calculation ||
      computeCanadianT1Return(
        draftReturn.t4Slips || [],
        draftReturn.otherSlips || [],
        draftReturn.deductions,
        draftReturn.credits,
        draftReturn.personal?.province || 'ON',
        draftReturn.taxYear || 2025
      )
    );
  }, [draftReturn]);

  const remoteCalc = useMemo(() => {
    if (!remoteReturn) return null;
    return (
      remoteReturn.calculation ||
      computeCanadianT1Return(
        remoteReturn.t4Slips || [],
        remoteReturn.otherSlips || [],
        remoteReturn.deductions,
        remoteReturn.credits,
        remoteReturn.personal?.province || 'ON',
        remoteReturn.taxYear || 2025
      )
    );
  }, [remoteReturn]);

  // Generate structured comparison rows
  const diffRows = useMemo<DiffRow[]>(() => {
    const rows: DiffRow[] = [];
    const r = remoteReturn;
    const d = draftReturn;

    const formatCur = (val?: number) =>
      `$${(val ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`;

    // === 1. SUMMARY / CALCULATION OUTCOME ===
    const draftRefund = draftCalc.balanceOwingOrRefund;
    const remoteRefund = remoteCalc ? remoteCalc.balanceOwingOrRefund : draftRefund;
    rows.push({
      category: 'summary',
      id: 'refund_balance',
      labelEn: draftCalc.isRefund ? 'Estimated Refund (Line 48400)' : 'Balance Owing (Line 48500)',
      labelFr: draftCalc.isRefund ? 'Remboursement estimé (Ligne 48400)' : 'Solde à payer (Ligne 48500)',
      draftValue: formatCur(Math.abs(draftRefund)),
      remoteValue: remoteCalc ? formatCur(Math.abs(remoteRefund)) : isFrench ? 'Aucun instantané' : 'No snapshot',
      isDifferent: remoteCalc ? Math.abs(draftRefund - remoteRefund) > 0.01 : false,
      diffType: 'modified',
    });

    const draftTotalTax = draftCalc.totalTaxPayable;
    const remoteTotalTax = remoteCalc ? remoteCalc.totalTaxPayable : draftTotalTax;
    rows.push({
      category: 'summary',
      id: 'total_tax',
      labelEn: 'Total Payable Tax (Line 43500)',
      labelFr: 'Impôt total à payer (Ligne 43500)',
      draftValue: formatCur(draftTotalTax),
      remoteValue: remoteCalc ? formatCur(remoteTotalTax) : '—',
      isDifferent: remoteCalc ? Math.abs(draftTotalTax - remoteTotalTax) > 0.01 : false,
      diffType: 'modified',
    });

    const draftTotalIncome = draftCalc.totalIncome;
    const remoteTotalIncome = remoteCalc ? remoteCalc.totalIncome : draftTotalIncome;
    rows.push({
      category: 'summary',
      id: 'total_income',
      labelEn: 'Total Income (Line 15000)',
      labelFr: 'Revenu total (Ligne 15000)',
      draftValue: formatCur(draftTotalIncome),
      remoteValue: remoteCalc ? formatCur(remoteTotalIncome) : '—',
      isDifferent: remoteCalc ? Math.abs(draftTotalIncome - remoteTotalIncome) > 0.01 : false,
      diffType: 'modified',
    });

    const draftTaxableIncome = draftCalc.taxableIncome;
    const remoteTaxableIncome = remoteCalc ? remoteCalc.taxableIncome : draftTaxableIncome;
    rows.push({
      category: 'summary',
      id: 'taxable_income',
      labelEn: 'Taxable Income (Line 26000)',
      labelFr: 'Revenu imposable (Ligne 26000)',
      draftValue: formatCur(draftTaxableIncome),
      remoteValue: remoteCalc ? formatCur(remoteTaxableIncome) : '—',
      isDifferent: remoteCalc ? Math.abs(draftTaxableIncome - remoteTaxableIncome) > 0.01 : false,
      diffType: 'modified',
    });

    // === 2. PERSONAL INFO ===
    const draftName = `${d.personal.firstName || ''} ${d.personal.lastName || ''}`.trim() || (isFrench ? 'Non renseigné' : 'Unspecified');
    const remoteName = r ? `${r.personal.firstName || ''} ${r.personal.lastName || ''}`.trim() || (isFrench ? 'Non renseigné' : 'Unspecified') : '—';
    rows.push({
      category: 'personal',
      id: 'taxpayer_name',
      labelEn: 'Taxpayer Legal Name',
      labelFr: 'Nom légal du contribuable',
      draftValue: draftName,
      remoteValue: remoteName,
      isDifferent: r ? draftName !== remoteName : false,
      diffType: 'modified',
    });

    const draftSin = d.personal.sin ? `••• ••• ${d.personal.sin.slice(-3)}` : (isFrench ? 'Non saisi' : 'Not entered');
    const remoteSin = r ? (r.personal.sin ? `••• ••• ${r.personal.sin.slice(-3)}` : (isFrench ? 'Non saisi' : 'Not entered')) : '—';
    rows.push({
      category: 'personal',
      id: 'taxpayer_sin',
      labelEn: 'Social Insurance Number (SIN)',
      labelFr: 'Numéro d’assurance sociale (NAS)',
      draftValue: draftSin,
      remoteValue: remoteSin,
      isDifferent: r ? (d.personal.sin || '') !== (r.personal.sin || '') : false,
      diffType: 'modified',
    });

    rows.push({
      category: 'personal',
      id: 'taxpayer_province',
      labelEn: 'Province of Residence',
      labelFr: 'Province de résidence',
      draftValue: d.personal.province,
      remoteValue: r ? r.personal.province : '—',
      isDifferent: r ? d.personal.province !== r.personal.province : false,
      diffType: 'modified',
    });

    rows.push({
      category: 'personal',
      id: 'marital_status',
      labelEn: 'Marital Status',
      labelFr: 'État civil',
      draftValue: d.personal.maritalStatus,
      remoteValue: r ? r.personal.maritalStatus : '—',
      isDifferent: r ? d.personal.maritalStatus !== r.personal.maritalStatus : false,
      diffType: 'modified',
    });

    // === 3. T4 SLIPS ===
    const draftT4Count = d.t4Slips.length;
    const remoteT4Count = r ? r.t4Slips.length : 0;
    rows.push({
      category: 'slips',
      id: 't4_count',
      labelEn: 'T4 Tax Slips Count',
      labelFr: 'Nombre de feuillets T4',
      draftValue: `${draftT4Count} ${isFrench ? 'feuillet(s)' : 'slip(s)'}`,
      remoteValue: r ? `${remoteT4Count} ${isFrench ? 'feuillet(s)' : 'slip(s)'}` : '—',
      isDifferent: r ? draftT4Count !== remoteT4Count : false,
      diffType: draftT4Count > remoteT4Count ? 'added' : 'modified',
    });

    const draftT4Income = d.t4Slips.reduce((sum, s) => sum + (s.box14_employmentIncome || 0), 0);
    const remoteT4Income = r ? r.t4Slips.reduce((sum, s) => sum + (s.box14_employmentIncome || 0), 0) : 0;
    rows.push({
      category: 'slips',
      id: 't4_box14',
      labelEn: 'Box 14 Employment Income',
      labelFr: 'Case 14 Revenus d’emploi',
      draftValue: formatCur(draftT4Income),
      remoteValue: r ? formatCur(remoteT4Income) : '—',
      isDifferent: r ? Math.abs(draftT4Income - remoteT4Income) > 0.01 : false,
      diffType: 'modified',
    });

    const draftT4Tax = d.t4Slips.reduce((sum, s) => sum + (s.box22_incomeTaxDeducted || 0), 0);
    const remoteT4Tax = r ? r.t4Slips.reduce((sum, s) => sum + (s.box22_incomeTaxDeducted || 0), 0) : 0;
    rows.push({
      category: 'slips',
      id: 't4_box22',
      labelEn: 'Box 22 Income Tax Deducted',
      labelFr: 'Case 22 Impôt sur le revenu retenu',
      draftValue: formatCur(draftT4Tax),
      remoteValue: r ? formatCur(remoteT4Tax) : '—',
      isDifferent: r ? Math.abs(draftT4Tax - remoteT4Tax) > 0.01 : false,
      diffType: 'modified',
    });

    const draftCpp = d.t4Slips.reduce((sum, s) => sum + (s.box16_cppContributions || 0), 0);
    const remoteCpp = r ? r.t4Slips.reduce((sum, s) => sum + (s.box16_cppContributions || 0), 0) : 0;
    rows.push({
      category: 'slips',
      id: 't4_box16',
      labelEn: 'Box 16 CPP Contributions',
      labelFr: 'Case 16 Cotisations au RPC',
      draftValue: formatCur(draftCpp),
      remoteValue: r ? formatCur(remoteCpp) : '—',
      isDifferent: r ? Math.abs(draftCpp - remoteCpp) > 0.01 : false,
      diffType: 'modified',
    });

    const draftEi = d.t4Slips.reduce((sum, s) => sum + (s.box18_eiPremiums || 0), 0);
    const remoteEi = r ? r.t4Slips.reduce((sum, s) => sum + (s.box18_eiPremiums || 0), 0) : 0;
    rows.push({
      category: 'slips',
      id: 't4_box18',
      labelEn: 'Box 18 EI Premiums',
      labelFr: 'Case 18 Cotisations à l’AE',
      draftValue: formatCur(draftEi),
      remoteValue: r ? formatCur(remoteEi) : '—',
      isDifferent: r ? Math.abs(draftEi - remoteEi) > 0.01 : false,
      diffType: 'modified',
    });

    // Other Slips (T4A, T5)
    const draftOtherCount = (d.otherSlips || []).length;
    const remoteOtherCount = r ? (r.otherSlips || []).length : 0;
    rows.push({
      category: 'slips',
      id: 'other_slips_count',
      labelEn: 'Other Slips (T4A Pension / T5 Investments)',
      labelFr: 'Autres feuillets (T4A Pension / T5 Placements)',
      draftValue: `${draftOtherCount} ${isFrench ? 'feuillet(s)' : 'slip(s)'}`,
      remoteValue: r ? `${remoteOtherCount} ${isFrench ? 'feuillet(s)' : 'slip(s)'}` : '—',
      isDifferent: r ? draftOtherCount !== remoteOtherCount : false,
      diffType: draftOtherCount > remoteOtherCount ? 'added' : 'modified',
    });

    // === 4. DEDUCTIONS ===
    const draftRrsp = d.deductions?.rrspContributions || 0;
    const remoteRrsp = r?.deductions?.rrspContributions || 0;
    rows.push({
      category: 'deductions',
      id: 'rrsp_deduction',
      labelEn: 'RRSP Deduction (Line 20800)',
      labelFr: 'Déduction pour REER (Ligne 20800)',
      draftValue: formatCur(draftRrsp),
      remoteValue: r ? formatCur(remoteRrsp) : '—',
      isDifferent: r ? Math.abs(draftRrsp - remoteRrsp) > 0.01 : false,
      diffType: 'modified',
    });

    const draftDues = d.deductions?.unionOrProfessionalDues || 0;
    const remoteDues = r?.deductions?.unionOrProfessionalDues || 0;
    rows.push({
      category: 'deductions',
      id: 'union_dues',
      labelEn: 'Union & Professional Dues (Line 21200)',
      labelFr: 'Cotisations syndicales ou professionnelles (Ligne 21200)',
      draftValue: formatCur(draftDues),
      remoteValue: r ? formatCur(remoteDues) : '—',
      isDifferent: r ? Math.abs(draftDues - remoteDues) > 0.01 : false,
      diffType: 'modified',
    });

    // === 5. CREDITS ===
    const draftDonations = d.credits?.charitableDonations || 0;
    const remoteDonations = r?.credits?.charitableDonations || 0;
    rows.push({
      category: 'credits',
      id: 'donations_credit',
      labelEn: 'Charitable Donations (Line 34900)',
      labelFr: 'Dons de bienfaisance (Ligne 34900)',
      draftValue: formatCur(draftDonations),
      remoteValue: r ? formatCur(remoteDonations) : '—',
      isDifferent: r ? Math.abs(draftDonations - remoteDonations) > 0.01 : false,
      diffType: 'modified',
    });

    const draftMedical = d.credits?.eligibleMedicalExpenses || 0;
    const remoteMedical = r?.credits?.eligibleMedicalExpenses || 0;
    rows.push({
      category: 'credits',
      id: 'medical_expenses',
      labelEn: 'Medical Expenses (Line 33099)',
      labelFr: 'Frais médicaux admissibles (Ligne 33099)',
      draftValue: formatCur(draftMedical),
      remoteValue: r ? formatCur(remoteMedical) : '—',
      isDifferent: r ? Math.abs(draftMedical - remoteMedical) > 0.01 : false,
      diffType: 'modified',
    });

    return rows;
  }, [draftReturn, remoteReturn, draftCalc, remoteCalc, isFrench]);

  const changedRows = useMemo(() => diffRows.filter((r) => r.isDifferent), [diffRows]);
  const hasChanges = changedRows.length > 0 || hasPendingChanges;

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="draft-vs-remote-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#064e3b] text-white flex items-center justify-center shadow-sm shrink-0">
              <ArrowRightLeft className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="draft-vs-remote-title" className="text-lg font-extrabold text-slate-900">
                  {isFrench ? 'Comparaison : Brouillon Actif vs Instantané Distant' : 'Draft vs. Remote Comparison'}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    hasChanges
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}
                >
                  {hasChanges
                    ? isFrench
                      ? `${changedRows.length} différence(s)`
                      : `${changedRows.length} change(s) pending`
                    : isFrench
                    ? 'Identique'
                    : 'In Sync'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isFrench
                  ? 'Vérifiez les modifications locales en attente par rapport au dernier état synchronisé via le Service Worker.'
                  : 'Review pending local modifications compared to the last state synchronized via the Service Worker.'}
              </p>
            </div>
          </div>

          <button
            id="close-draft-remote-modal-btn"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200/50 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Callout Banner */}
        <div className="px-5 pt-4">
          {hasChanges ? (
            <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 flex items-start space-x-3 text-xs text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-sm text-amber-950">
                  {isFrench
                    ? 'Modifications locales en attente de synchronisation'
                    : 'Pending Local Modifications Detected'}
                </p>
                <p className="mt-0.5 text-amber-900/90 leading-relaxed">
                  {isFrench
                    ? `Votre copie de travail contient ${changedRows.length} valeur(s) modifiée(s) qui n’ont pas encore été acquittées par le Service Worker. Cliquez sur « Synchroniser maintenant » pour enregistrer votre état actif.`
                    : `Your local draft contains ${changedRows.length} modified value(s) that have not yet been acknowledged by the Service Worker. Click "Sync Draft via Service Worker" to lock in your active progress.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 flex items-center space-x-3 text-xs text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm text-emerald-950">
                  {isFrench ? 'Brouillon et copie distante synchronisés' : 'Draft and Remote Are In Perfect Sync'}
                </p>
                <p className="text-emerald-800">
                  {isFrench
                    ? 'Toutes vos données fiscales et calculs correspondent exactement au dernier instantané du Service Worker.'
                    : 'All tax numbers, personal information, and calculations match the latest Service Worker snapshot.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Side-by-side Meta Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-5 pt-3 pb-2">
          {/* Draft Column Header */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-[#064e3b]" />
                <span>{isFrench ? 'Brouillon Local Actif' : 'Active Local Draft'}</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                {isFrench ? 'Copie de travail' : 'Working Copy'}
              </span>
            </div>
            <div className="flex items-center text-[11px] text-slate-500 space-x-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>
                {lastSavedDraftTime
                  ? `${isFrench ? 'Mis à jour :' : 'Updated:'} ${new Date(lastSavedDraftTime).toLocaleTimeString()}`
                  : isFrench
                  ? 'En attente'
                  : 'Pending'}
              </span>
            </div>
          </div>

          {/* Remote Column Header */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0b1f3a]" />
                <span>{isFrench ? 'Instantané Distant / SW' : 'Remote / Service Worker Synced'}</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                {isFrench ? 'Acquitté par SW' : 'SW Confirmed'}
              </span>
            </div>
            <div className="flex items-center text-[11px] text-slate-500 space-x-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>
                {remoteSyncedTime
                  ? `${isFrench ? 'Dernière synchro :' : 'Last synced:'} ${new Date(remoteSyncedTime).toLocaleTimeString()}`
                  : isFrench
                  ? 'Non synchronisé'
                  : 'Not yet synced'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Diff Table */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-2.5 w-2/5">{isFrench ? 'Élément fiscal' : 'Tax Return Item'}</th>
                  <th className="p-2.5 w-1/4 border-l border-slate-200">
                    {isFrench ? 'Brouillon (Actif)' : 'Draft (Active)'}
                  </th>
                  <th className="p-2.5 w-1/4 border-l border-slate-200">
                    {isFrench ? 'Distant (Service Worker)' : 'Remote (Service Worker)'}
                  </th>
                  <th className="p-2.5 w-24 text-center border-l border-slate-200">
                    {isFrench ? 'Statut' : 'Status'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {diffRows.map((row) => (
                  <tr
                    key={row.id}
                    className={`transition-colors ${
                      row.isDifferent
                        ? 'bg-amber-50/70 hover:bg-amber-100/60 font-medium text-amber-950'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <td className="p-2.5">
                      <div className="flex items-center space-x-2">
                        {row.isDifferent && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        <span className={row.isDifferent ? 'font-bold text-slate-900' : 'text-slate-700'}>
                          {isFrench ? row.labelFr : row.labelEn}
                        </span>
                      </div>
                    </td>

                    <td className="p-2.5 font-mono border-l border-slate-200">
                      <span className={row.isDifferent ? 'font-bold text-amber-900' : 'text-slate-900'}>
                        {row.draftValue}
                      </span>
                    </td>

                    <td className="p-2.5 font-mono border-l border-slate-200 text-slate-600">
                      <span>{row.remoteValue}</span>
                    </td>

                    <td className="p-2.5 text-center border-l border-slate-200">
                      {row.isDifferent ? (
                        <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900">
                          {isFrench ? 'Modifié' : 'Changed'}
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                          {isFrench ? 'Identique' : 'Match'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {remoteReturn && hasChanges && (
              <button
                id="revert-draft-btn"
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      isFrench
                        ? 'Êtes-vous sûr de vouloir annuler vos modifications locales et restaurer la version synchronisée distante ?'
                        : 'Are you sure you want to discard your local draft changes and revert to the last remote synced snapshot?'
                    )
                  ) {
                    onRevertToRemote();
                    onClose();
                  }
                }}
                className="py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>{isFrench ? 'Restaurer la copie distante' : 'Revert Draft to Remote'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              id="close-draft-modal-secondary-btn"
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              {isFrench ? 'Fermer' : 'Close'}
            </button>

            <button
              id="sync-draft-to-remote-btn"
              type="button"
              onClick={() => {
                onSyncDraft();
                onClose();
              }}
              className="py-2 px-4 rounded-xl bg-[#064e3b] hover:bg-[#08634c] text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-300" />
              <span>
                {isFrench ? 'Synchroniser via Service Worker' : 'Sync Draft via Service Worker'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
