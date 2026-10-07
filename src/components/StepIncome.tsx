import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Trash2,
  Camera,
  Building,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Download,
  Printer,
  FileText,
  BookOpen,
  Info,
  HelpCircle,
  PiggyBank,
  Briefcase,
  Layers,
  ChevronDown,
  ChevronUp,
  Pencil,
} from 'lucide-react';
import { AppTaxReturn, T4Slip, OtherIncomeSlip, SlipType } from '../types/tax';
import { TaxTipsSection } from './TaxTipsSection';
import { exportTaxSlipsDocument } from '../utils/exportUtils';
import { SlipEditModal, EditableSlip } from './SlipEditModal';
import { CRAFieldTooltip } from './CRAFieldTooltip';
import { INCOME_TOOLTIPS } from '../utils/craTooltipsData';
import { IncomeDiscrepancyAlert } from './IncomeDiscrepancyAlert';

interface StepIncomeProps {
  taxReturn: AppTaxReturn;
  onUpdateTaxReturn: (updated: Partial<AppTaxReturn>) => void;
  onOpenScanner: () => void;
  onOpenScannerWithSlip?: (slipCode: SlipType) => void;
  onNext: () => void;
  language: 'en' | 'fr';
}

export const StepIncome: React.FC<StepIncomeProps> = ({
  taxReturn,
  onUpdateTaxReturn,
  onOpenScanner,
  onOpenScannerWithSlip,
  onNext,
  language,
}) => {
  const isFrench = language === 'fr';
  const [expandedSlipGuide, setExpandedSlipGuide] = useState<'all' | 'T4' | 'T4A' | 'T5' | 'none'>('all');
  const [editingSlip, setEditingSlip] = useState<EditableSlip | null>(null);

  const t4List = taxReturn.t4Slips || [];
  const otherSlips = taxReturn.otherSlips || [];
  const t4aList = otherSlips.filter((s) => s.type === 'T4A');
  const t5List = otherSlips.filter((s) => s.type === 'T5');

  const handleSaveModalT4 = (updated: T4Slip) => {
    const nextList = t4List.map((s) => (s.id === updated.id ? updated : s));
    onUpdateTaxReturn({ t4Slips: nextList });
  };

  const handleSaveModalOtherSlip = (updated: OtherIncomeSlip) => {
    const nextList = otherSlips.map((s) => (s.id === updated.id ? updated : s));
    onUpdateTaxReturn({ otherSlips: nextList });
  };

  // --- T4 Handlers ---
  const handleAddManualT4 = () => {
    const newT4: T4Slip = {
      id: `t4-${Date.now()}`,
      employerName: isFrench ? 'Nouvel Employeur' : 'New Employer',
      box14_employmentIncome: 50000,
      box16_cppContributions: 3000,
      box18_eiPremiums: 900,
      box20_rppContributions: 0,
      box22_incomeTaxDeducted: 7500,
      box24_eiInsurableEarnings: 50000,
      box26_cppPensionableEarnings: 50000,
      box44_unionDues: 0,
      box52_pensionAdjustment: 0,
      verifiedByUser: true,
    };
    onUpdateTaxReturn({
      t4Slips: [...t4List, newT4],
    });
  };

  const handleUpdateT4 = (id: string, field: keyof T4Slip, val: any) => {
    const updated = t4List.map((slip) =>
      slip.id === id ? { ...slip, [field]: val } : slip
    );
    onUpdateTaxReturn({ t4Slips: updated });
  };

  const handleDeleteT4 = (id: string) => {
    const updated = t4List.filter((slip) => slip.id !== id);
    onUpdateTaxReturn({ t4Slips: updated });
  };

  // --- T4A Handlers ---
  const handleAddT4A = () => {
    const newT4A: OtherIncomeSlip = {
      id: `t4a-${Date.now()}`,
      type: 'T4A',
      payerName: isFrench ? 'Régime de retraite / Payer T4A' : 'Pension Plan / Annuity Payer',
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

  const handleUpdateT4ABox = (id: string, boxKey: string, val: number) => {
    const updated = otherSlips.map((s) => {
      if (s.id !== id) return s;
      return {
        ...s,
        amounts: {
          ...s.amounts,
          [boxKey]: val,
        },
      };
    });
    onUpdateTaxReturn({ otherSlips: updated });
  };

  const handleUpdateSlipPayer = (id: string, name: string) => {
    const updated = otherSlips.map((s) => (s.id === id ? { ...s, payerName: name } : s));
    onUpdateTaxReturn({ otherSlips: updated });
  };

  const handleDeleteSlip = (id: string) => {
    const updated = otherSlips.filter((s) => s.id !== id);
    onUpdateTaxReturn({ otherSlips: updated });
  };

  // --- T5 Handlers ---
  const handleAddT5 = () => {
    const newT5: OtherIncomeSlip = {
      id: `t5-${Date.now()}`,
      type: 'T5',
      payerName: isFrench ? 'Banque / Émetteur T5' : 'Royal Bank / Wealth Investment',
      description: isFrench ? 'État des revenus de placements' : 'Statement of Investment Income',
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

  const handleUpdateT5Box = (id: string, boxKey: string, val: number) => {
    const updated = otherSlips.map((s) => {
      if (s.id !== id) return s;
      return {
        ...s,
        amounts: {
          ...s.amounts,
          [boxKey]: val,
        },
      };
    });
    onUpdateTaxReturn({ otherSlips: updated });
  };

  // Income Aggregations
  const totalT4Income = t4List.reduce(
    (sum, s) => sum + (s.box14_employmentIncome || 0),
    0
  );

  const totalT4AIncome = t4aList.reduce((sum, s) => {
    let sub = 0;
    for (const [k, v] of Object.entries(s.amounts || {})) {
      if (!k.toLowerCase().includes('tax') && !k.toLowerCase().includes('box022')) {
        sub += Number(v) || 0;
      }
    }
    return sum + sub;
  }, 0);

  const totalT5Income = t5List.reduce((sum, s) => {
    let sub = 0;
    for (const [k, v] of Object.entries(s.amounts || {})) {
      if (!k.toLowerCase().includes('tax')) sub += Number(v) || 0;
    }
    return sum + sub;
  }, 0);

  const otherIncome = taxReturn.otherIncome?.amount || 0;
  const grandTotalIncome = totalT4Income + totalT4AIncome + totalT5Income + otherIncome;

  return (
    <div id="step-income-view" className="space-y-6 max-w-4xl mx-auto">
      {/* Total Income Banner */}
      <div className="bg-linear-to-r from-[#064e3b] via-[#093a2c] to-[#0b1f3a] rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
            {isFrench ? 'Ligne 15000 de l’ARC' : 'CRA Line 15000'}
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-0.5">
            {isFrench ? 'Revenu Total Déclaré' : 'Total Canadian Income'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {isFrench
              ? 'Somme de tous les salaires (T4), rentes & pensions (T4A), placements (T5) et autres sources.'
              : 'Sum of all employment wages (T4), pensions & retirement (T4A), investment earnings (T5), and other sources.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <div className="text-left sm:text-right bg-black/20 px-5 py-3 rounded-xl border border-white/10 shrink-0">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white">
              ${grandTotalIncome.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-300 font-medium">
              {t4List.length} T4 • {t4aList.length} T4A • {t5List.length} T5
            </div>
          </div>

          <div className="flex sm:flex-col gap-2 no-print">
            <button
              id="export-income-statement-btn"
              onClick={() => exportTaxSlipsDocument(taxReturn)}
              title={isFrench ? 'Exporter le relevé des revenus' : 'Export income slips statement'}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>{isFrench ? 'Exporter' : 'Export Docs'}</span>
            </button>
            <button
              id="print-income-statement-btn"
              onClick={() => window.print()}
              title={isFrench ? 'Imprimer le relevé des revenus' : 'Print income summary'}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-300" />
              <span>{isFrench ? 'Imprimer / PDF' : 'Print / PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Income Discrepancy Alert: Compares manually entered slip data against uploaded T4 scans or historical records */}
      <IncomeDiscrepancyAlert
        taxReturn={taxReturn}
        onUpdateTaxReturn={onUpdateTaxReturn}
        onOpenScanner={onOpenScanner}
        language={language}
      />

      {/* 
        EDUCATIONAL FEATURE CARD:
        The Three Most Common Tax Slips in Canada
      */}
      <div className="bg-linear-to-br from-slate-900 via-slate-800 to-[#064e3b] rounded-2xl p-6 sm:p-7 text-white shadow-lg space-y-5 border border-emerald-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-950/70 px-2.5 py-1 rounded-md border border-emerald-500/30">
              {isFrench ? 'Guide Officiel des Feuillets Fiscaux de l’ARC' : 'Official CRA Information Slips Guide'}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isFrench
                ? 'Les trois feuillets fiscaux les plus courants au Canada'
                : 'The Three Most Common Tax Slips in Canada'}
            </h3>
          </div>
          <div className="flex items-center space-x-2 no-print shrink-0">
            <button
              id="print-slip-guide-btn"
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Print slip guide"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-300" />
              <span>{isFrench ? 'Imprimer le guide' : 'Print Guide / PDF'}</span>
            </button>
          </div>
        </div>

        {/* Prompt Mandatory Text & Explanation */}
        <div className="text-sm sm:text-base leading-relaxed text-slate-100 space-y-3 font-medium bg-black/25 p-4 rounded-xl border border-white/10">
          <p className="font-semibold text-white">
            The three most common tax slips in Canada are:
          </p>
          <ul className="space-y-2 pl-2 text-emerald-300 font-semibold list-none">
            <li className="flex items-start space-x-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span>
                <strong className="text-white">T4 Slip</strong> – Statement of Remuneration Paid
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span>
                <strong className="text-white">T4A Slip</strong> – Statement of Pension, Retirement, Annuity, and Other Income
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span>
                <strong className="text-white">T5 Slip</strong> – Statement of Investment Income
              </span>
            </li>
          </ul>
          <p className="text-xs sm:text-sm text-slate-200 pt-1">
            Each of these slips reports different types of income, so let’s take a closer look at what they mean and how they affect your tax filing.
          </p>
        </div>

        {/* Deep Dive Breakdown Cards for the 3 Slips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* T4 Detail Card */}
          <div className="bg-white/5 hover:bg-white/10 border border-emerald-400/20 rounded-xl p-4 space-y-3 transition-colors">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-400/30">
                T4
              </div>
              <h4 className="font-bold text-white text-sm">
                Statement of Remuneration Paid
              </h4>
            </div>
            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                <strong className="text-emerald-200">What it means:</strong> Issued by employers for standard employment income, salaries, wages, bonuses, and taxable benefits.
              </p>
              <p>
                <strong className="text-emerald-200">Tax filing impact:</strong> Reported on <strong>Line 10100</strong> and <strong>Line 15000</strong>. Income tax deducted (Box 22) directly reduces your balance owing on <strong>Line 43700</strong>. CPP and EI paid generate federal non-refundable tax credits on Lines 30800 & 31200.
              </p>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span>Key: Box 14, 22, 16, 18, 20</span>
              <span className="text-emerald-300 font-semibold">{t4List.length} filed</span>
            </div>
          </div>

          {/* T4A Detail Card */}
          <div className="bg-white/5 hover:bg-white/10 border border-emerald-400/20 rounded-xl p-4 space-y-3 transition-colors">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-xs border border-blue-400/30">
                T4A
              </div>
              <h4 className="font-bold text-white text-sm">
                Pension, Retirement & Other Income
              </h4>
            </div>
            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                <strong className="text-blue-200">What it means:</strong> Issued for company pensions, annuities, scholarships, fellowships, research grants, or self-employed commissions.
              </p>
              <p>
                <strong className="text-blue-200">Tax filing impact:</strong> Reported on <strong>Line 11500</strong> (Pensions) or <strong>Line 13000</strong> (Other income). Unlocks up to <strong>$2,000 Pension Income Amount</strong> (Line 31400) and eligibility for pension income-splitting with a spouse on Form T1032.
              </p>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span>Key: Box 016, 020, 022, 028</span>
              <span className="text-blue-300 font-semibold">{t4aList.length} filed</span>
            </div>
          </div>

          {/* T5 Detail Card */}
          <div className="bg-white/5 hover:bg-white/10 border border-emerald-400/20 rounded-xl p-4 space-y-3 transition-colors">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-400/30">
                T5
              </div>
              <h4 className="font-bold text-white text-sm">
                Statement of Investment Income
              </h4>
            </div>
            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                <strong className="text-amber-200">What it means:</strong> Issued by Canadian banks, credit unions, and mutual fund trusts reporting non-registered interest, GIC gains, and dividends.
              </p>
              <p>
                <strong className="text-amber-200">Tax filing impact:</strong> Interest is taxed at 100% of marginal rate on <strong>Line 12100</strong>. Eligible dividends receive the 38% gross-up on <strong>Line 12000</strong> and qualify for the federal <strong>Dividend Tax Credit</strong> (Line 40425) to avoid double taxation.
              </p>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span>Key: Box 13, 10, 11, 24</span>
              <span className="text-amber-300 font-semibold">{t5List.length} filed</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. T4 SLIPS SECTION (Statement of Remuneration Paid) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#064e3b] flex items-center justify-center font-bold text-xs">
              T4
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isFrench ? 'Feuillets T4 — Revenus d’emploi' : 'T4 Slips — Statement of Remuneration Paid'}
              </h3>
              <p className="text-xs text-slate-500">
                {isFrench
                  ? 'Salaires, commissions et retenues à la source de vos employeurs canadiens.'
                  : 'Employment wages, tips, and employer source withholdings for Line 10100 & 43700.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            <button
              id="print-t4-slips-btn"
              onClick={() => window.print()}
              title={isFrench ? 'Imprimer la section T4' : 'Print T4 summary'}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{isFrench ? 'Imprimer / PDF' : 'Print / PDF'}</span>
            </button>

            <button
              id="income-scan-cv-btn"
              onClick={onOpenScanner}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] font-bold text-xs rounded-xl border border-emerald-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>{isFrench ? 'Vision IA' : 'Scan with CV'}</span>
            </button>

            <button
              id="income-add-t4-btn"
              onClick={handleAddManualT4}
              className="px-3.5 py-2 bg-[#064e3b] hover:bg-[#08634c] text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isFrench ? '+ Ajouter un feuillet T4' : '+ Add T4 Slip'}</span>
            </button>
          </div>
        </div>

        {/* T4 List */}
        {t4List.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
            <Briefcase className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500">
              {isFrench
                ? 'Aucun feuillet T4 enregistré. Cliquez sur « + Ajouter un feuillet T4 » ou utilisez la caméra.'
                : 'No T4 slips recorded yet. Click "+ Add T4 Slip" or scan with AI Vision.'}
            </p>
            <button
              onClick={handleAddManualT4}
              className="text-xs font-bold text-[#064e3b] hover:underline cursor-pointer"
            >
              + {isFrench ? 'Ajouter mon premier T4' : 'Add your first T4 slip'}
            </button>
          </div>
        ) : (
          t4List.map((slip, idx) => (
            <div
              key={slip.id}
              className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-lg bg-[#064e3b] text-white text-xs font-bold flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={slip.employerName}
                    onChange={(e) => handleUpdateT4(slip.id, 'employerName', e.target.value)}
                    placeholder="Employer Name (e.g. Shopify, TD Bank)"
                    className="font-bold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-400 focus:border-[#064e3b] focus:outline-hidden px-1"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    id={`income-edit-t4-${slip.id}`}
                    type="button"
                    onClick={() => setEditingSlip({ type: 'T4', slip })}
                    className="px-2.5 py-1 text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                    title={isFrench ? 'Modifier ce feuillet T4' : 'Edit this T4 slip'}
                  >
                    <Pencil className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{isFrench ? 'Modifier' : 'Edit'}</span>
                  </button>

                  <button
                    id={`income-delete-t4-${slip.id}`}
                    onClick={() => handleDeleteT4(slip.id)}
                    className="px-2 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                    title={isFrench ? 'Supprimer ce feuillet T4' : 'Delete this T4 slip'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isFrench ? 'Supprimer' : 'Delete'}</span>
                  </button>
                </div>
              </div>

              {/* Boxes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 flex items-center">
                    <span>Case 14 — {isFrench ? 'Revenu d’emploi' : 'Box 14: Income'} *</span>
                    <CRAFieldTooltip content={INCOME_TOOLTIPS.box14_employmentIncome} language={language} />
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={slip.box14_employmentIncome || ''}
                      onChange={(e) =>
                        handleUpdateT4(slip.id, 'box14_employmentIncome', parseFloat(e.target.value) || 0)
                      }
                      className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#064e3b]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 flex items-center">
                    <span>Case 22 — {isFrench ? 'Impôt retenu' : 'Box 22: Tax Deducted'} *</span>
                    <CRAFieldTooltip content={INCOME_TOOLTIPS.box22_incomeTaxDeducted} language={language} />
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={slip.box22_incomeTaxDeducted || ''}
                      onChange={(e) =>
                        handleUpdateT4(slip.id, 'box22_incomeTaxDeducted', parseFloat(e.target.value) || 0)
                      }
                      className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#064e3b]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 flex items-center">
                    <span>Case 16 — {isFrench ? 'RPC/RRQ' : 'Box 16: CPP/QPP'}</span>
                    <CRAFieldTooltip content={INCOME_TOOLTIPS.box16_cppContributions} language={language} />
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={slip.box16_cppContributions || ''}
                      onChange={(e) =>
                        handleUpdateT4(slip.id, 'box16_cppContributions', parseFloat(e.target.value) || 0)
                      }
                      className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-[#064e3b]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 flex items-center">
                    <span>Case 18 — {isFrench ? 'AE (Chômage)' : 'Box 18: EI Premiums'}</span>
                    <CRAFieldTooltip content={INCOME_TOOLTIPS.box18_eiPremiums} language={language} />
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={slip.box18_eiPremiums || ''}
                      onChange={(e) =>
                        handleUpdateT4(slip.id, 'box18_eiPremiums', parseFloat(e.target.value) || 0)
                      }
                      className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-[#064e3b]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 flex items-center">
                    <span>Case 20 — {isFrench ? 'RPA (Pension)' : 'Box 20: RPP'}</span>
                    <CRAFieldTooltip content={INCOME_TOOLTIPS.box20_rppContributions} language={language} />
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={slip.box20_rppContributions || ''}
                      onChange={(e) =>
                        handleUpdateT4(slip.id, 'box20_rppContributions', parseFloat(e.target.value) || 0)
                      }
                      className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-[#064e3b]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 flex items-center">
                    <span>Case 44 — {isFrench ? 'Cotisations syndicales' : 'Box 44: Union Dues'}</span>
                    <CRAFieldTooltip content={INCOME_TOOLTIPS.box44_unionDues} language={language} />
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={slip.box44_unionDues || ''}
                      onChange={(e) =>
                        handleUpdateT4(slip.id, 'box44_unionDues', parseFloat(e.target.value) || 0)
                      }
                      className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-[#064e3b]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 flex items-center">
                    <span>Case 52 — {isFrench ? 'Facteur d’équiv.' : 'Box 52: Pension Adj.'}</span>
                    <CRAFieldTooltip content={INCOME_TOOLTIPS.box52_pensionAdjustment} language={language} />
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={slip.box52_pensionAdjustment || ''}
                      onChange={(e) =>
                        handleUpdateT4(slip.id, 'box52_pensionAdjustment', parseFloat(e.target.value) || 0)
                      }
                      className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-[#064e3b]"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. T4A SLIPS SECTION (Pension, Retirement, Annuity, and Other Income) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
              T4A
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isFrench ? 'Feuillets T4A — Revenus de pension, rentes & autres' : 'T4A Slips — Statement of Pension, Retirement, Annuity, and Other Income'}
              </h3>
              <p className="text-xs text-slate-500">
                {isFrench
                  ? 'Revenus de pension privée, rentes, bourses d’études ou commissions de pigiste.'
                  : 'Pension benefits, annuities, research grants, scholarships, and contractor commissions.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            <button
              id="print-t4a-slips-btn"
              onClick={() => window.print()}
              title={isFrench ? 'Imprimer la section T4A' : 'Print T4A summary'}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{isFrench ? 'Imprimer / PDF' : 'Print / PDF'}</span>
            </button>

            <button
              id="income-add-t4a-btn"
              onClick={handleAddT4A}
              className="px-3.5 py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isFrench ? '+ Ajouter un feuillet T4A' : '+ Add T4A Slip'}</span>
            </button>
          </div>
        </div>

        {/* T4A List */}
        {t4aList.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
            <PiggyBank className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500">
              {isFrench
                ? 'Aucun feuillet T4A enregistré. Si vous avez reçu des revenus de retraite, une rente ou des bourses, ajoutez-le ici.'
                : 'No T4A slips recorded. If you received retirement pension, annuity payouts, or bursaries, record them here.'}
            </p>
            <button
              onClick={handleAddT4A}
              className="text-xs font-bold text-blue-800 hover:underline cursor-pointer"
            >
              + {isFrench ? 'Ajouter un feuillet T4A' : 'Add a T4A slip'}
            </button>
          </div>
        ) : (
          t4aList.map((slip, idx) => (
            <div
              key={slip.id}
              className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-lg bg-blue-900 text-white text-xs font-bold flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={slip.payerName}
                    onChange={(e) => handleUpdateSlipPayer(slip.id, e.target.value)}
                    placeholder="Payer Name (e.g. Ontario Teachers' Pension, Sun Life)"
                    className="font-bold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-400 focus:border-blue-700 focus:outline-hidden px-1"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    id={`income-edit-t4a-${slip.id}`}
                    type="button"
                    onClick={() => setEditingSlip({ type: 'T4A', slip })}
                    className="px-2.5 py-1 text-blue-800 hover:text-blue-950 hover:bg-blue-100 border border-blue-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                    title={isFrench ? 'Modifier ce feuillet T4A' : 'Edit this T4A slip'}
                  >
                    <Pencil className="w-3.5 h-3.5 text-blue-700" />
                    <span>{isFrench ? 'Modifier' : 'Edit'}</span>
                  </button>

                  <button
                    id={`income-delete-t4a-${slip.id}`}
                    onClick={() => handleDeleteSlip(slip.id)}
                    className="px-2 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                    title={isFrench ? 'Supprimer ce feuillet T4A' : 'Delete this T4A slip'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isFrench ? 'Supprimer' : 'Delete'}</span>
                  </button>
                </div>
              </div>

              {/* T4A Boxes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 flex items-center">
                    <span>Case 016 — {isFrench ? 'Pension ou rente' : 'Box 016: Pension / Annuity'}</span>
                    <CRAFieldTooltip content={INCOME_TOOLTIPS.box016_pension} language={language} />
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={slip.amounts?.box016_pension || ''}
                      onChange={(e) =>
                        handleUpdateT4ABox(slip.id, 'box016_pension', parseFloat(e.target.value) || 0)
                      }
                      className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 flex items-center">
                    <span>Case 022 — {isFrench ? 'Impôt retenu' : 'Box 022: Income Tax Deducted'}</span>
                    <CRAFieldTooltip content={INCOME_TOOLTIPS.box022_taxDeducted} language={language} />
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={slip.amounts?.box022_taxDeducted || ''}
                      onChange={(e) =>
                        handleUpdateT4ABox(slip.id, 'box022_taxDeducted', parseFloat(e.target.value) || 0)
                      }
                      className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 flex items-center">
                    <span>Case 020 — {isFrench ? 'Commissions (indép.)' : 'Box 020: Self-Employed Comm.'}</span>
                    <CRAFieldTooltip content={INCOME_TOOLTIPS.box020_commissions} language={language} />
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={slip.amounts?.box020_commissions || ''}
                      onChange={(e) =>
                        handleUpdateT4ABox(slip.id, 'box020_commissions', parseFloat(e.target.value) || 0)
                      }
                      className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-blue-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 flex items-center">
                    <span>Case 028 — {isFrench ? 'Autres revenus' : 'Box 028: Other Income'}</span>
                    <CRAFieldTooltip content={INCOME_TOOLTIPS.box028_otherIncome} language={language} />
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={slip.amounts?.box028_otherIncome || ''}
                      onChange={(e) =>
                        handleUpdateT4ABox(slip.id, 'box028_otherIncome', parseFloat(e.target.value) || 0)
                      }
                      className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-blue-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. T5 SLIPS SECTION (Statement of Investment Income) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
              T5
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isFrench ? 'Feuillets T5 — Revenus de placements' : 'T5 Slips — Statement of Investment Income'}
              </h3>
              <p className="text-xs text-slate-500">
                {isFrench
                  ? 'Intérêts bancaires (CPG, comptes épargne) et dividendes de sociétés canadiennes.'
                  : 'Bank interest (GICs, high-interest savings) and eligible Canadian corporate dividends.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            <button
              id="print-t5-slips-btn"
              onClick={() => window.print()}
              title={isFrench ? 'Imprimer la section T5' : 'Print T5 summary'}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{isFrench ? 'Imprimer / PDF' : 'Print / PDF'}</span>
            </button>

            <button
              id="income-add-t5-btn"
              onClick={handleAddT5}
              className="px-3.5 py-2 bg-[#92400e] hover:bg-[#78350f] text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isFrench ? '+ Ajouter un feuillet T5' : '+ Add T5 Slip'}</span>
            </button>
          </div>
        </div>

        {/* T5 List */}
        {t5List.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
            <TrendingUp className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500">
              {isFrench
                ? 'Aucun feuillet T5 enregistré. Les banques émettent un T5 si vos intérêts non enregistrés dépassent 50 $.'
                : 'No T5 slips recorded. Canadian financial institutions issue a T5 when non-registered interest exceeds $50.'}
            </p>
            <button
              onClick={handleAddT5}
              className="text-xs font-bold text-[#92400e] hover:underline cursor-pointer"
            >
              + {isFrench ? 'Ajouter un feuillet T5' : 'Add a T5 slip'}
            </button>
          </div>
        ) : (
          t5List.map((slip, idx) => (
            <div
              key={slip.id}
              className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-lg bg-[#92400e] text-white text-xs font-bold flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={slip.payerName}
                    onChange={(e) => handleUpdateSlipPayer(slip.id, e.target.value)}
                    placeholder="Bank / Brokerage (e.g. RBC, TD Direct Investing, Wealthsimple)"
                    className="font-bold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-400 focus:border-amber-700 focus:outline-hidden px-1"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    id={`income-edit-t5-${slip.id}`}
                    type="button"
                    onClick={() => setEditingSlip({ type: 'T5', slip })}
                    className="px-2.5 py-1 text-amber-800 hover:text-amber-950 hover:bg-amber-100 border border-amber-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                    title={isFrench ? 'Modifier ce feuillet T5' : 'Edit this T5 slip'}
                  >
                    <Pencil className="w-3.5 h-3.5 text-amber-700" />
                    <span>{isFrench ? 'Modifier' : 'Edit'}</span>
                  </button>

                  <button
                    id={`income-delete-t5-${slip.id}`}
                    onClick={() => handleDeleteSlip(slip.id)}
                    className="px-2 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                    title={isFrench ? 'Supprimer ce feuillet T5' : 'Delete this T5 slip'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isFrench ? 'Supprimer' : 'Delete'}</span>
                  </button>
                </div>
              </div>

              {/* T5 Boxes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 flex items-center">
                    <span>Case 13 — {isFrench ? 'Intérêts canadiens' : 'Box 13: Canadian Interest'}</span>
                    <CRAFieldTooltip content={INCOME_TOOLTIPS.box13_interest} language={language} />
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={slip.amounts?.box13_interest || ''}
                      onChange={(e) =>
                        handleUpdateT5Box(slip.id, 'box13_interest', parseFloat(e.target.value) || 0)
                      }
                      className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 flex items-center">
                    <span>Case 10 — {isFrench ? 'Dividendes admissibles' : 'Box 10: Actual Dividends'}</span>
                    <CRAFieldTooltip content={INCOME_TOOLTIPS.box10_eligibleDividends} language={language} />
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={slip.amounts?.box10_eligibleDividends || ''}
                      onChange={(e) =>
                        handleUpdateT5Box(slip.id, 'box10_eligibleDividends', parseFloat(e.target.value) || 0)
                      }
                      className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-amber-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 flex items-center">
                    <span>Case 11 — {isFrench ? 'Montant imposable' : 'Box 11: Taxable Dividends'}</span>
                    <CRAFieldTooltip content={INCOME_TOOLTIPS.box11_taxableDividends} language={language} />
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={slip.amounts?.box11_taxableDividends || ''}
                      onChange={(e) =>
                        handleUpdateT5Box(slip.id, 'box11_taxableDividends', parseFloat(e.target.value) || 0)
                      }
                      className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-amber-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 flex items-center">
                    <span>Case 24 — {isFrench ? 'Gains en capital' : 'Box 24: Capital Gains Div.'}</span>
                    <CRAFieldTooltip content={INCOME_TOOLTIPS.box24_capitalGains} language={language} />
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={slip.amounts?.box24_capitalGains || ''}
                      onChange={(e) =>
                        handleUpdateT5Box(slip.id, 'box24_capitalGains', parseFloat(e.target.value) || 0)
                      }
                      className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-amber-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. OTHER CANADIAN INCOME SECTION */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {isFrench ? 'Autres revenus canadiens (Ligne 13000)' : 'Other Canadian Income (CRA Line 13000)'}
            </h3>
            <p className="text-xs text-slate-500">
              {isFrench
                ? 'Revenus d’appoint, pourboires non déclarés sur T4, bourses ou activités occasionnelles.'
                : 'Side gigs, freelance work without a slip, tips not included on T4, and occasional earnings.'}
            </p>
          </div>

          <div className="flex items-center space-x-2 no-print">
            <button
              id="print-other-income-btn"
              onClick={() => window.print()}
              title={isFrench ? 'Imprimer cette section' : 'Print other income summary'}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{isFrench ? 'Imprimer / PDF' : 'Print / PDF'}</span>
            </button>

            {otherIncome > 0 && (
              <button
                onClick={() =>
                  onUpdateTaxReturn({
                    otherIncome: { description: '', amount: 0 },
                  })
                }
                className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isFrench ? 'Effacer' : 'Clear / Delete'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {isFrench ? 'Description de la source' : 'Source Description'}
            </label>
            <input
              type="text"
              value={taxReturn.otherIncome?.description || ''}
              onChange={(e) =>
                onUpdateTaxReturn({
                  otherIncome: {
                    description: e.target.value,
                    amount: taxReturn.otherIncome?.amount || 0,
                  },
                })
              }
              placeholder="e.g. Freelance Graphic Design, Tutoring"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#064e3b]"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 mb-1 flex items-center">
              <span>{isFrench ? 'Montant annuel brut ($ CAD)' : 'Gross Annual Amount ($ CAD)'}</span>
              <CRAFieldTooltip content={INCOME_TOOLTIPS.otherIncome} language={language} />
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
              <input
                type="number"
                value={taxReturn.otherIncome?.amount || ''}
                onChange={(e) =>
                  onUpdateTaxReturn({
                    otherIncome: {
                      description: taxReturn.otherIncome?.description || 'Other Income',
                      amount: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-[#064e3b]"
              />
            </div>
          </div>
        </div>

        {/* Quick Add Presets for Other Income */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 font-medium">
            {isFrench ? 'Ajout rapide :' : 'Quick Add Presets:'}
          </span>
          <button
            type="button"
            onClick={() =>
              onUpdateTaxReturn({
                otherIncome: {
                  description: isFrench ? 'Intérêts bancaires d’épargne' : 'High-Interest Bank Account',
                  amount: 245.5,
                },
              })
            }
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            + {isFrench ? 'Intérêts bancaires ($245.50)' : 'Bank Interest ($245.50)'}
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdateTaxReturn({
                otherIncome: {
                  description: isFrench ? 'Contrats indépendants / piges' : 'Freelance Consulting',
                  amount: 1500,
                },
              })
            }
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            + {isFrench ? 'Pige / Contrat ($1 500)' : 'Freelance Contract ($1,500)'}
          </button>
        </div>
      </div>

      {/* Tax Tips for Income */}
      <TaxTipsSection
        category="income"
        taxYear={taxReturn.taxYear || 2025}
        language={language}
      />

      {/* Navigation */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-[#064e3b] hover:bg-[#08634c] text-white font-bold text-sm flex items-center space-x-2 shadow-md transition-all cursor-pointer"
        >
          <span>{isFrench ? 'Passer aux Déductions & Crédits' : 'Continue to Deductions & Credits'}</span>
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
    </div>
  );
};
