import React, { useState } from 'react';
import {
  TrendingDown,
  Sparkles,
  HelpCircle,
  Home,
  Heart,
  BookOpen,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Download,
  Printer,
  Plus,
  Trash2,
  FileCheck,
} from 'lucide-react';
import { AppTaxReturn } from '../types/tax';
import { TaxTipsSection } from './TaxTipsSection';
import { CRAFieldTooltip } from './CRAFieldTooltip';
import { DEDUCTION_TOOLTIPS, CREDIT_TOOLTIPS } from '../utils/craTooltipsData';

interface StepDeductionsProps {
  taxReturn: AppTaxReturn;
  onUpdateTaxReturn: (updated: Partial<AppTaxReturn>) => void;
  onNext: () => void;
  language: 'en' | 'fr';
}

interface ItemizedReceipt {
  id: string;
  category: 'donation' | 'medical' | 'childcare';
  organization: string;
  amount: number;
  date: string;
}

export const StepDeductions: React.FC<StepDeductionsProps> = ({
  taxReturn,
  onUpdateTaxReturn,
  onNext,
  language,
}) => {
  const isFrench = language === 'fr';

  const deductions = taxReturn.deductions;
  const credits = taxReturn.credits;

  // Initial itemized receipts to power add/delete functionality
  const [receipts, setReceipts] = useState<ItemizedReceipt[]>([
    {
      id: 'rcpt-1',
      category: 'donation',
      organization: isFrench ? 'Croix-Rouge canadienne' : 'Canadian Red Cross',
      amount: credits.charitableDonations > 0 ? credits.charitableDonations : 350,
      date: '2025-11-14',
    },
    {
      id: 'rcpt-2',
      category: 'medical',
      organization: isFrench ? 'Clinique Dentaire & Optométrie' : 'Dental & Vision Clinic Care',
      amount: credits.eligibleMedicalExpenses > 0 ? credits.eligibleMedicalExpenses : 420,
      date: '2025-08-22',
    },
  ]);

  const handleUpdateDeductions = (field: keyof typeof deductions, val: number) => {
    onUpdateTaxReturn({
      deductions: {
        ...deductions,
        [field]: val,
      },
    });
  };

  const handleUpdateCredits = (field: keyof typeof credits, val: any) => {
    onUpdateTaxReturn({
      credits: {
        ...credits,
        [field]: val,
      },
    });
  };

  const handleAddReceipt = () => {
    const newReceipt: ItemizedReceipt = {
      id: `rcpt-${Date.now()}`,
      category: 'donation',
      organization: isFrench ? 'Organisme de bienfaisance enregistré' : 'Registered Canadian Charity',
      amount: 150,
      date: new Date().toISOString().slice(0, 10),
    };
    const updated = [...receipts, newReceipt];
    setReceipts(updated);

    // Sync donations
    const donationTotal = updated
      .filter((r) => r.category === 'donation')
      .reduce((sum, r) => sum + r.amount, 0);
    handleUpdateCredits('charitableDonations', donationTotal);
  };

  const handleDeleteReceipt = (id: string) => {
    const updated = receipts.filter((r) => r.id !== id);
    setReceipts(updated);

    const donationTotal = updated
      .filter((r) => r.category === 'donation')
      .reduce((sum, r) => sum + r.amount, 0);
    const medicalTotal = updated
      .filter((r) => r.category === 'medical')
      .reduce((sum, r) => sum + r.amount, 0);

    onUpdateTaxReturn({
      credits: {
        ...credits,
        charitableDonations: donationTotal,
        eligibleMedicalExpenses: medicalTotal,
      },
    });
  };

  const handleExportDeductions = () => {
    const lines = [
      '========================================================================',
      `   CRA T1 DEDUCTIONS & CREDITS STATEMENT (TAX YEAR ${taxReturn.taxYear})`,
      '========================================================================',
      `Taxpayer: ${taxReturn.personal?.firstName || 'Alex'} ${taxReturn.personal?.lastName || 'Morgan'}`,
      `Date:     ${new Date().toLocaleDateString('en-CA')}`,
      '------------------------------------------------------------------------',
      'CLAIMED DEDUCTIONS (AGAINST TOTAL INCOME):',
      `• Line 20800 (RRSP / PRPP):            $${(deductions.rrspContributions ?? 0).toFixed(2)} CAD`,
      `• Line 21200 (Union / Pro Dues):       $${(deductions.unionOrProfessionalDues ?? 0).toFixed(2)} CAD`,
      `• Line 21400 (Child Care Expenses):    $${(deductions.childcareExpenses ?? 0).toFixed(2)} CAD`,
      `• Line 21900 (Moving Expenses):        $${(deductions.movingExpenses ?? 0).toFixed(2)} CAD`,
      `• Line 22900 (Employment Expenses):    $${(deductions.employmentExpenses ?? 0).toFixed(2)} CAD`,
      '------------------------------------------------------------------------',
      'CLAIMED NON-REFUNDABLE TAX CREDITS:',
      `• Line 34900 (Charitable Donations):   $${(credits.charitableDonations ?? 0).toFixed(2)} CAD`,
      `• Line 33099 (Medical Expenses):       $${(credits.eligibleMedicalExpenses ?? 0).toFixed(2)} CAD`,
      `• Line 32300 (Tuition Fees T2202):     $${(credits.tuitionFeesT2202 ?? 0).toFixed(2)} CAD`,
      `• Line 31270 (First-Time Home Buyers): ${credits.firstTimeHomeBuyerClaim ? 'CLAIMED ($10,000)' : 'NO'}`,
      '========================================================================',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TaxEasy_Deductions_Statement_${taxReturn.taxYear}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalDeductions =
    deductions.rrspContributions +
    deductions.unionOrProfessionalDues +
    deductions.childcareExpenses +
    deductions.movingExpenses +
    deductions.employmentExpenses +
    deductions.otherDeductions;

  return (
    <div id="step-deductions-view" className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-linear-to-r from-[#064e3b] via-[#094030] to-[#0b1f3a] rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
            {isFrench ? 'Optimisation Fiscale Légale' : 'Tax Reduction Strategies'}
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-0.5">
            {isFrench ? 'Déductions & Crédits d’Impôt' : 'Deductions & Tax Credits'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {isFrench
              ? 'Les déductions (REER) réduisent votre revenu imposable. Les crédits (dons, scolarité) réduisent directement votre impôt à payer.'
              : 'Deductions (RRSP) lower your taxable income. Credits (charity, tuition) directly wipe out tax payable.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <div className="text-left sm:text-right bg-black/20 px-5 py-3 rounded-xl border border-white/10 shrink-0">
            <div className="text-xs text-slate-300">
              {isFrench ? 'Total des déductions' : 'Total Deductions Claimed'}
            </div>
            <div className="text-2xl font-mono font-bold text-emerald-300">
              ${totalDeductions.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="flex sm:flex-col gap-2 no-print">
            <button
              id="export-deductions-doc-btn"
              onClick={handleExportDeductions}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>{isFrench ? 'Exporter' : 'Export Docs'}</span>
            </button>
            <button
              id="print-deductions-btn"
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-300" />
              <span>{isFrench ? 'Imprimer / PDF' : 'Print / PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Itemized Receipts & Claims Tracker (With Add / Delete) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-[#064e3b]" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isFrench ? 'Reçus officiels et pièces justificatives' : 'Itemized Receipts & Proof of Claims'}
              </h3>
              <p className="text-xs text-slate-500">
                {isFrench
                  ? 'Ajoutez vos reçus de dons ou médicaux pour appuyer votre déclaration en cas de vérification de l’ARC.'
                  : 'Track itemized charitable donation receipts and medical bills for CRA audit compliance.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 no-print">
            <button
              id="print-receipts-section-btn"
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Print receipts"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{isFrench ? 'Imprimer / PDF' : 'Print / PDF'}</span>
            </button>

            <button
              id="add-deduction-receipt-btn"
              onClick={handleAddReceipt}
              className="px-3.5 py-2 bg-[#064e3b] hover:bg-[#08634c] text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isFrench ? '+ Ajouter un reçu' : '+ Add Receipt'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {receipts.map((receipt) => (
            <div
              key={receipt.id}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#064e3b] flex items-center justify-center font-bold">
                  {receipt.category === 'donation' ? <Heart className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{receipt.organization}</div>
                  <div className="text-slate-500 text-[11px]">
                    {receipt.category === 'donation'
                      ? (isFrench ? 'Don de bienfaisance' : 'Charitable Donation')
                      : (isFrench ? 'Frais médicaux' : 'Medical Expense')}{' '}
                    • {receipt.date}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end space-x-3">
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ${(receipt.amount ?? 0).toFixed(2)} CAD
                </span>
                <button
                  id={`delete-receipt-${receipt.id}`}
                  onClick={() => handleDeleteReceipt(receipt.id)}
                  title={isFrench ? 'Supprimer ce reçu' : 'Delete receipt'}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Part 1: Deductions from Net Income */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-5 h-5 text-[#064e3b]" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isFrench ? '1. Déductions réduisant le revenu imposable' : '1. Deductions that Lower Taxable Income'}
              </h3>
              <p className="text-xs text-slate-500">
                {isFrench
                  ? 'Ces montants sont soustraits directement de votre revenu total (Ligne 15000) pour établir le revenu net.'
                  : 'Subtracted dollar-for-dollar from Total Income (Line 15000) before tax brackets are applied.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 no-print shrink-0">
            <button
              id="print-part1-deductions-btn"
              type="button"
              onClick={() => window.print()}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center space-x-1 cursor-pointer"
              title="Print Part 1 Deductions"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{isFrench ? 'Imprimer / PDF' : 'Print / PDF'}</span>
            </button>
            {totalDeductions > 0 && (
              <button
                type="button"
                onClick={() =>
                  onUpdateTaxReturn({
                    deductions: {
                      rrspContributions: 0,
                      unionOrProfessionalDues: 0,
                      childcareExpenses: 0,
                      movingExpenses: 0,
                      employmentExpenses: 0,
                      otherDeductions: 0,
                    },
                  })
                }
                className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-lg border border-rose-200 flex items-center space-x-1 cursor-pointer"
                title="Clear all deductions"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isFrench ? 'Effacer' : 'Clear / Delete'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          {/* RRSP */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-900 flex items-center">
                <span>{isFrench ? 'Cotisations REER / RPAC (Ligne 20800)' : 'RRSP / PRPP Contributions (Line 20800)'}</span>
                <CRAFieldTooltip content={DEDUCTION_TOOLTIPS.rrspContributions} language={language} />
              </label>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                High Impact
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {isFrench
                ? 'Cotisations versées pour l’année fiscale ou les 60 premiers jours de l’année suivante.'
                : 'Contributions made in the tax year or first 60 days of the following year.'}
            </p>
            <div className="relative pt-1">
              <span className="absolute left-3 top-3 text-slate-400 font-bold">$</span>
              <input
                type="number"
                value={deductions.rrspContributions || ''}
                onChange={(e) => handleUpdateDeductions('rrspContributions', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-[#064e3b]"
              />
            </div>
          </div>

          {/* Child Care Expenses */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <label className="font-semibold text-slate-900 flex items-center">
              <span>{isFrench ? 'Frais de garde d’enfants (Ligne 21400 / T778)' : 'Child Care Expenses (Line 21400 / T778)'}</span>
              <CRAFieldTooltip content={DEDUCTION_TOOLTIPS.childcareExpenses} language={language} />
            </label>
            <p className="text-[11px] text-slate-500">
              {isFrench
                ? 'Garderies, camps de jour admissibles et nounous pour vos personnes à charge.'
                : 'Daycares, after-school care, and day camps enabling employment or study.'}
            </p>
            <div className="relative pt-1">
              <span className="absolute left-3 top-3 text-slate-400 font-bold">$</span>
              <input
                type="number"
                value={deductions.childcareExpenses || ''}
                onChange={(e) => handleUpdateDeductions('childcareExpenses', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-[#064e3b]"
              />
            </div>
          </div>

          {/* Union or Professional Dues */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <label className="font-semibold text-slate-900 flex items-center">
              <span>{isFrench ? 'Cotisations syndicales ou prof. (Ligne 21200)' : 'Union or Professional Dues (Line 21200)'}</span>
              <CRAFieldTooltip content={DEDUCTION_TOOLTIPS.unionOrProfessionalDues} language={language} />
            </label>
            <p className="text-[11px] text-slate-500">
              {isFrench
                ? 'Ordres professionnels obligatoires (ex. ingénieurs, infirmières) ou syndicats.'
                : 'Annual mandatory dues for professional licensing or collective bargaining.'}
            </p>
            <div className="relative pt-1">
              <span className="absolute left-3 top-3 text-slate-400 font-bold">$</span>
              <input
                type="number"
                value={deductions.unionOrProfessionalDues || ''}
                onChange={(e) => handleUpdateDeductions('unionOrProfessionalDues', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-[#064e3b]"
              />
            </div>
          </div>

          {/* Moving Expenses */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <label className="font-semibold text-slate-900 flex items-center">
              <span>{isFrench ? 'Frais de déménagement (Ligne 21900 / T1-M)' : 'Moving Expenses (Line 21900 / T1-M)'}</span>
              <CRAFieldTooltip content={DEDUCTION_TOOLTIPS.movingExpenses} language={language} />
            </label>
            <p className="text-[11px] text-slate-500">
              {isFrench
                ? 'Si vous avez déménagé d’au moins 40 km plus près d’un nouvel emploi ou d’une université.'
                : 'If you moved at least 40 km closer to a new job or full-time post-secondary study.'}
            </p>
            <div className="relative pt-1">
              <span className="absolute left-3 top-3 text-slate-400 font-bold">$</span>
              <input
                type="number"
                value={deductions.movingExpenses || ''}
                onChange={(e) => handleUpdateDeductions('movingExpenses', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-[#064e3b]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Part 2: Non-Refundable Tax Credits */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#0b1f3a]" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isFrench ? '2. Crédits d’impôt non remboursables (Annexe 1)' : '2. Non-Refundable Tax Credits (Schedule 1)'}
              </h3>
              <p className="text-xs text-slate-500">
                {isFrench
                  ? 'Calculés au taux fédéral de 15 % pour réduire directement l’impôt exigible.'
                  : 'Applied at 15% federally to eliminate taxes owed dollar-for-dollar.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 no-print shrink-0">
            <button
              id="print-part2-credits-btn"
              type="button"
              onClick={() => window.print()}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center space-x-1 cursor-pointer"
              title="Print Part 2 Credits"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{isFrench ? 'Imprimer / PDF' : 'Print / PDF'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          {/* First Time Home Buyer */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={credits.firstTimeHomeBuyerClaim}
                onChange={(e) => handleUpdateCredits('firstTimeHomeBuyerClaim', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#064e3b] focus:ring-[#064e3b]"
              />
              <div>
                <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                  <Home className="w-4 h-4 text-emerald-600" />
                  <span>{isFrench ? 'Montant pour l’achat d’une habitation (HBTC)' : 'First-Time Home Buyers’ Amount (HBTC)'}</span>
                  <CRAFieldTooltip content={CREDIT_TOOLTIPS.firstTimeHomeBuyerClaim} language={language} />
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  {isFrench
                    ? 'Crédit de 10 000 $ (Ligne 31270), procurant une réduction d’impôt directe de 1 500 $ pour l’achat d’une première maison.'
                    : 'Claim up to $10,000 (Line 31270), yielding a direct $1,500 federal tax reduction on qualifying homes.'}
                </p>
              </div>
            </label>
          </div>

          {/* Charitable Donations */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="font-semibold text-slate-900 flex items-center space-x-1.5">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>{isFrench ? 'Dons de bienfaisance admissibles (Ligne 34900)' : 'Charitable Donations (Line 34900)'}</span>
              <CRAFieldTooltip content={CREDIT_TOOLTIPS.charitableDonations} language={language} />
            </label>
            <p className="text-[11px] text-slate-500">
              {isFrench
                ? 'Dons versés à des organismes de bienfaisance enregistrés (15 % sur les premiers 200 $, 29 % au-delà).'
                : 'Official Canadian charity receipts (15% on first $200, 29% on balance).'}
            </p>
            <div className="relative pt-1">
              <span className="absolute left-3 top-3 text-slate-400 font-bold">$</span>
              <input
                type="number"
                value={credits.charitableDonations || ''}
                onChange={(e) => handleUpdateCredits('charitableDonations', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-[#064e3b]"
              />
            </div>
          </div>

          {/* Eligible Medical Expenses */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="font-semibold text-slate-900 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>{isFrench ? 'Frais médicaux admissibles (Ligne 33099)' : 'Eligible Medical Expenses (Line 33099)'}</span>
              <CRAFieldTooltip content={CREDIT_TOOLTIPS.eligibleMedicalExpenses} language={language} />
            </label>
            <p className="text-[11px] text-slate-500">
              {isFrench
                ? 'Frais non remboursés par une assurance au-delà de 3 % de votre revenu net ou 2 759 $.'
                : 'Out-of-pocket health costs exceeding 3% of net income or $2,759 threshold.'}
            </p>
            <div className="relative pt-1">
              <span className="absolute left-3 top-3 text-slate-400 font-bold">$</span>
              <input
                type="number"
                value={credits.eligibleMedicalExpenses || ''}
                onChange={(e) => handleUpdateCredits('eligibleMedicalExpenses', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-[#064e3b]"
              />
            </div>
          </div>

          {/* Tuition Fees T2202 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="font-semibold text-slate-900 flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>{isFrench ? 'Frais de scolarité admissibles (T2202)' : 'Eligible Tuition Fees (T2202 Slip)'}</span>
              <CRAFieldTooltip content={CREDIT_TOOLTIPS.tuitionFeesT2202} language={language} />
            </label>
            <p className="text-[11px] text-slate-500">
              {isFrench
                ? 'Montant de scolarité admissible de votre certificat T2202 délivré par votre université ou cégep.'
                : 'Tuition certificate amounts eligible for transfer or carry-forward.'}
            </p>
            <div className="relative pt-1">
              <span className="absolute left-3 top-3 text-slate-400 font-bold">$</span>
              <input
                type="number"
                value={credits.tuitionFeesT2202 || ''}
                onChange={(e) => handleUpdateCredits('tuitionFeesT2202', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-[#064e3b]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tax Tips for Deductions & Credits */}
      <TaxTipsSection
        category="deductions"
        taxYear={taxReturn.taxYear || 2025}
        language={language}
      />

      {/* Navigation */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-[#064e3b] hover:bg-[#08634c] text-white font-bold text-sm flex items-center space-x-2 shadow-md transition-all cursor-pointer"
        >
          <span>{isFrench ? 'Passer à la Révision & Audit' : 'Continue to Review & Audit'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
