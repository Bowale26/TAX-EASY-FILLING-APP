import React, { useState } from 'react';
import {
  Percent,
  TrendingUp,
  TrendingDown,
  Minus,
  Calculator,
  HelpCircle,
  Sparkles,
  Calendar,
  Layers,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { AppTaxReturn } from '../types/tax';
import { getTaxInsightsYearOverYear, TaxInsightsComparison } from '../services/taxCalculationEngine';

interface TaxInsightsCardProps {
  taxReturn: AppTaxReturn;
  language: 'en' | 'fr';
}

export const TaxInsightsCard: React.FC<TaxInsightsCardProps> = ({ taxReturn, language }) => {
  const isFrench = language === 'fr';
  const calc = taxReturn.calculation;

  const [optimizerData, setOptimizerData] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  const handleRunAiOptimizer = async () => {
    setIsOptimizing(true);
    try {
      const res = await fetch('/api/ai/tax-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxReturn, language }),
      });
      const data = await res.json();
      if (data.success) {
        setOptimizerData(data);
      }
    } catch (err) {
      console.error('Failed to run AI tax optimizer:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const insights: TaxInsightsComparison = getTaxInsightsYearOverYear(
    calc,
    taxReturn.taxYear || 2025
  );

  const formatCurrency = (val: number) => {
    return `$${Math.abs(val).toLocaleString('en-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const renderYoYDeltaBadge = (
    delta: number,
    isPercentage = false,
    invertColor = false // e.g. for tax rates, a decrease in tax rate is generally positive for filer
  ) => {
    if (Math.abs(delta) < 0.01) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-700">
          <Minus className="w-3 h-3 text-slate-500" />
          <span>0.0{isPercentage ? '%' : ''}</span>
        </span>
      );
    }

    const isPositive = delta > 0;
    // If invertColor is true: positive delta (higher tax) is amber/slate, negative delta (lower tax) is emerald
    const isFavorable = invertColor ? !isPositive : isPositive;

    const bgClass = isFavorable ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200';
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
      <span
        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${bgClass}`}
      >
        <Icon className="w-3 h-3" />
        <span>
          {isPositive ? '+' : '-'}
          {Math.abs(delta).toFixed(isPercentage ? 2 : 2)}
          {isPercentage ? '%' : ''}
        </span>
      </span>
    );
  };

  return (
    <div
      id="tax-insights-section"
      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#064e3b] to-[#0b1f3a] text-white flex items-center justify-center font-bold shadow-xs">
            <Percent className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {isFrench ? 'Aperçus Fiscaux & Analyse des Taux' : 'Tax Insights & Rate Analytics'}
              </h3>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-[#064e3b] border border-emerald-200">
                {isFrench ? 'ARC Déterministe' : 'CRA Deterministic'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isFrench
                ? 'Sommaire calculé du taux d’imposition effectif, du taux marginal combiné et de l’évolution comparative d’une année sur l’autre.'
                : 'Summary analysis of your calculated effective tax rate, combined marginal tax rate, and year-over-year comparative progress.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-semibold border border-slate-200 flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {insights.priorTaxYear} → {insights.currentTaxYear}
            </span>
          </span>
        </div>
      </div>

      {/* Top 3 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Effective Tax Rate Card */}
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
              {isFrench ? 'Taux Effectif d’Impôt' : 'Effective Tax Rate'}
            </span>
            <div
              className="p-1 rounded-md bg-emerald-200/50 text-[#064e3b]"
              title={
                isFrench
                  ? 'Pourcentage réel de votre revenu total payé en impôt (Ligne 43500 / Ligne 15000)'
                  : 'Actual percentage of your total income paid in taxes (Line 43500 / Line 15000)'
              }
            >
              <Calculator className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-[#064e3b]">
              {insights.effectiveTaxRate.toFixed(2)}%
            </div>
            <div className="text-xs text-slate-600 mt-1 flex items-center justify-between">
              <span>{isFrench ? `Année ${insights.priorTaxYear} :` : `${insights.priorTaxYear} Baseline:`}</span>
              <span className="font-mono font-semibold">{insights.priorEffectiveTaxRate.toFixed(2)}%</span>
            </div>
          </div>
          <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              {isFrench ? 'Évolution annuelle :' : 'YoY Change:'}
            </span>
            {renderYoYDeltaBadge(insights.effectiveTaxRateYoYChange, true, true)}
          </div>
        </div>

        {/* Marginal Tax Rate Card */}
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">
              {isFrench ? 'Taux Marginal Combiné' : 'Marginal Tax Rate'}
            </span>
            <div
              className="p-1 rounded-md bg-blue-200/50 text-[#0b1f3a]"
              title={
                isFrench
                  ? 'Taux d’impôt combiné fédéral + provincial appliqué sur votre prochain dollar gagné'
                  : 'Combined federal + provincial tax rate applied to your next dollar earned'
              }
            >
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-[#0b1f3a]">
              {insights.marginalTaxRate.toFixed(2)}%
            </div>
            <div className="text-xs text-slate-600 mt-1 flex items-center justify-between">
              <span>
                {isFrench
                  ? `Fédéral ${insights.federalMarginalRate}% + Prov. ${insights.provincialMarginalRate}%`
                  : `Fed ${insights.federalMarginalRate}% + Prov ${insights.provincialMarginalRate}%`}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              {isFrench ? 'Évolution annuelle :' : 'YoY Change:'}
            </span>
            {renderYoYDeltaBadge(insights.marginalTaxRateYoYChange, true, true)}
          </div>
        </div>

        {/* Bracket Proximity / Headroom Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {isFrench ? 'Marge avant Palier Suivant' : 'Next Bracket Headroom'}
            </span>
            <div
              className="p-1 rounded-md bg-slate-200 text-slate-700"
              title={
                isFrench
                  ? 'Revenu imposable restant avant de passer au palier d’imposition supérieur'
                  : 'Remaining taxable income before entering the next higher tax bracket'
              }
            >
              <Info className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-slate-900">
              {insights.headroomToNextBracket !== null
                ? `$${Math.round(insights.headroomToNextBracket).toLocaleString('en-CA')}`
                : isFrench
                ? 'Palier Max'
                : 'Top Bracket'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {insights.nextFederalBracketThreshold !== null
                ? isFrench
                  ? `Prochain seuil fédéral : $${insights.nextFederalBracketThreshold.toLocaleString('en-CA')}`
                  : `Next Federal threshold: $${insights.nextFederalBracketThreshold.toLocaleString('en-CA')}`
                : isFrench
                ? 'Vous êtes au palier marginal supérieur de l’ARC (33%).'
                : 'Currently in highest CRA federal bracket (33%).'}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              {isFrench ? 'Revenu imposable :' : 'Taxable Income:'}
            </span>
            <span className="font-mono font-bold text-slate-800">
              ${Math.round(insights.taxableIncome).toLocaleString('en-CA')}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Table: Effective Tax Rate, Marginal Tax Rate, and Year-over-Year Change */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
              <th className="py-3 px-4 font-bold text-slate-800">
                {isFrench ? 'Indicateur Fiscal / Ligne ARC' : 'Tax Indicator / CRA Metric'}
              </th>
              <th className="py-3 px-4 font-bold text-slate-700 font-mono text-right">
                {insights.priorTaxYear} {isFrench ? '(Référence)' : '(Prior Baseline)'}
              </th>
              <th className="py-3 px-4 font-bold text-[#064e3b] font-mono text-right bg-emerald-50/30">
                {insights.currentTaxYear} {isFrench ? '(Déclaration)' : '(Current Return)'}
              </th>
              <th className="py-3 px-4 font-bold text-slate-800 font-mono text-center">
                {isFrench ? 'Variation Annuelle (YoY)' : 'Year-over-Year Change (YoY)'}
              </th>
              <th className="py-3 px-4 font-semibold text-slate-500 hidden md:table-cell">
                {isFrench ? 'Explication & Règle ARC' : 'CRA Context & Interpretation'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* 1. Effective Tax Rate Row */}
            <tr className="hover:bg-slate-50/60 transition-colors bg-emerald-50/10">
              <td className="py-3 px-4">
                <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span>{isFrench ? 'Taux d’imposition effectif' : 'Effective Tax Rate'}</span>
                </div>
                <span className="text-[11px] text-slate-400 block ml-3.5">
                  {isFrench ? 'Impôt payable ÷ Revenu total' : 'Total Tax Payable ÷ Total Income'}
                </span>
              </td>
              <td className="py-3 px-4 font-mono text-right font-medium text-slate-600">
                {insights.priorEffectiveTaxRate.toFixed(2)}%
              </td>
              <td className="py-3 px-4 font-mono text-right font-bold text-[#064e3b] bg-emerald-50/30 text-base">
                {insights.effectiveTaxRate.toFixed(2)}%
              </td>
              <td className="py-3 px-4 text-center">
                {renderYoYDeltaBadge(insights.effectiveTaxRateYoYChange, true, true)}
              </td>
              <td className="py-3 px-4 text-xs text-slate-500 hidden md:table-cell">
                {isFrench
                  ? 'Pourcentage réel payé sur l’ensemble des revenus déclarés après déductions et crédits.'
                  : 'True overall tax percentage paid across all earnings after federal & provincial credits.'}
              </td>
            </tr>

            {/* 2. Marginal Tax Rate Row */}
            <tr className="hover:bg-slate-50/60 transition-colors bg-blue-50/10">
              <td className="py-3 px-4">
                <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span>{isFrench ? 'Taux d’imposition marginal' : 'Marginal Tax Rate'}</span>
                </div>
                <span className="text-[11px] text-slate-400 block ml-3.5">
                  {isFrench ? 'Fédéral + Provincial combiné' : 'Combined Federal + Provincial bracket'}
                </span>
              </td>
              <td className="py-3 px-4 font-mono text-right font-medium text-slate-600">
                {insights.priorMarginalTaxRate.toFixed(2)}%
              </td>
              <td className="py-3 px-4 font-mono text-right font-bold text-[#0b1f3a] bg-emerald-50/30 text-base">
                {insights.marginalTaxRate.toFixed(2)}%
              </td>
              <td className="py-3 px-4 text-center">
                {renderYoYDeltaBadge(insights.marginalTaxRateYoYChange, true, true)}
              </td>
              <td className="py-3 px-4 text-xs text-slate-500 hidden md:table-cell">
                {isFrench
                  ? 'Taux d’imposition appliqué sur chaque dollar additionnel gagné ou économisé en REER.'
                  : 'Rate levied on your next dollar earned, or saved per dollar of RRSP contribution.'}
              </td>
            </tr>

            {/* 3. Total Tax Payable Row */}
            <tr className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3 px-4">
                <span className="font-semibold text-slate-900">
                  {isFrench ? 'Impôt total payable (Ligne 43500)' : 'Total Tax Payable (CRA Line 43500)'}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {isFrench ? 'Impôt fédéral net + impôt provincial net' : 'Net Federal Tax + Net Provincial Tax'}
                </span>
              </td>
              <td className="py-3 px-4 font-mono text-right font-medium text-slate-600">
                {formatCurrency(insights.priorTotalTaxPayable)}
              </td>
              <td className="py-3 px-4 font-mono text-right font-bold text-slate-900 bg-emerald-50/30">
                {formatCurrency(insights.totalTaxPayable)}
              </td>
              <td className="py-3 px-4 text-center">
                {renderYoYDeltaBadge(insights.totalTaxPayableYoYChange, false, true)}
              </td>
              <td className="py-3 px-4 text-xs text-slate-500 hidden md:table-cell">
                {isFrench
                  ? 'Obligation fiscale brute totale avant application des retenues à la source.'
                  : 'Total tax liability before deducting withholding tax already paid at source.'}
              </td>
            </tr>

            {/* 4. Total Income Row */}
            <tr className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3 px-4">
                <span className="font-semibold text-slate-900">
                  {isFrench ? 'Revenu total (Ligne 15000)' : 'Total Income (CRA Line 15000)'}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {isFrench ? 'Total des feuillets T4, T4A, T5 et autres' : 'Sum of all T4, T4A, T5 and other earnings'}
                </span>
              </td>
              <td className="py-3 px-4 font-mono text-right font-medium text-slate-600">
                {formatCurrency(insights.priorTotalIncome)}
              </td>
              <td className="py-3 px-4 font-mono text-right font-bold text-slate-900 bg-emerald-50/30">
                {formatCurrency(insights.totalIncome)}
              </td>
              <td className="py-3 px-4 text-center">
                {renderYoYDeltaBadge(insights.totalIncomeYoYChange, false, false)}
              </td>
              <td className="py-3 px-4 text-xs text-slate-500 hidden md:table-cell">
                {isFrench
                  ? 'Gains bruts d’emploi et revenus de placements déclarés à l’ARC.'
                  : 'Gross employment compensation and investment returns reported to CRA.'}
              </td>
            </tr>

            {/* 5. Taxable Net Income Row */}
            <tr className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3 px-4">
                <span className="font-semibold text-slate-900">
                  {isFrench ? 'Revenu imposable (Ligne 26000)' : 'Taxable Income (CRA Line 26000)'}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {isFrench ? 'Revenu net après déductions REER et FHSA' : 'Net income after RRSP & FHSA deductions'}
                </span>
              </td>
              <td className="py-3 px-4 font-mono text-right font-medium text-slate-600">
                {formatCurrency(insights.priorTaxableIncome)}
              </td>
              <td className="py-3 px-4 font-mono text-right font-bold text-slate-900 bg-emerald-50/30">
                {formatCurrency(insights.taxableIncome)}
              </td>
              <td className="py-3 px-4 text-center">
                {renderYoYDeltaBadge(insights.taxableIncomeYoYChange, false, false)}
              </td>
              <td className="py-3 px-4 text-xs text-slate-500 hidden md:table-cell">
                {isFrench
                  ? 'Assiette fiscale finale soumise aux barèmes d’imposition de l’ARC.'
                  : 'Base amount on which federal and provincial tax rates are calculated.'}
              </td>
            </tr>

            {/* 6. Refund or Owing Row */}
            <tr className="hover:bg-slate-50/60 transition-colors font-semibold">
              <td className="py-3 px-4">
                <span className="font-bold text-slate-900">
                  {calc?.balanceOwingOrRefund !== undefined && calc.balanceOwingOrRefund >= 0
                    ? isFrench
                      ? 'Remboursement estimé (Ligne 48400)'
                      : 'Estimated Refund (CRA Line 48400)'
                    : isFrench
                    ? 'Solde dû (Ligne 48500)'
                    : 'Balance Owing (CRA Line 48500)'}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {isFrench ? 'Retenues d’impôt (Ligne 43700) - Impôt payable' : 'Tax Withheld (Line 43700) minus Tax Payable'}
                </span>
              </td>
              <td className="py-3 px-4 font-mono text-right text-slate-600">
                {insights.priorRefundOrOwing >= 0 ? '+' : '-'}
                {formatCurrency(insights.priorRefundOrOwing)}
              </td>
              <td
                className={`py-3 px-4 font-mono text-right font-black bg-emerald-50/30 ${
                  insights.refundOrOwing >= 0 ? 'text-[#064e3b]' : 'text-[#0b1f3a]'
                }`}
              >
                {insights.refundOrOwing >= 0 ? '+' : '-'}
                {formatCurrency(insights.refundOrOwing)}
              </td>
              <td className="py-3 px-4 text-center">
                {renderYoYDeltaBadge(insights.refundOrOwingYoYChange, false, false)}
              </td>
              <td className="py-3 px-4 text-xs text-slate-500 hidden md:table-cell">
                {isFrench
                  ? 'Montant final à recevoir de l’ARC ou à payer au Receveur général du Canada.'
                  : 'Final amount payable or refundable directly via CRA direct deposit.'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Note explaining CRA indexing and marginal value of deductions */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start space-x-2.5">
        <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">
            {isFrench ? 'Optimisation Stratégique du Taux Marginal :' : 'Marginal Tax Rate Optimization Insight:'}
          </span>{' '}
          {isFrench
            ? `Chaque tranche de 1 000 $ de cotisation REER additionnelle réduit votre impôt à payer de ${Math.round(
                insights.marginalTaxRate * 10
              )} $ selon votre taux marginal actuel de ${insights.marginalTaxRate.toFixed(1)} %.`
            : `Every additional $1,000 contributed to your RRSP yields an immediate tax reduction of approximately $${Math.round(
                insights.marginalTaxRate * 10
              )} based on your current marginal bracket of ${insights.marginalTaxRate.toFixed(1)}%.`}
        </div>
      </div>

      {/* AI Tax Optimizer Section */}
      <div className="border-t border-slate-200 pt-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-linear-to-r from-emerald-900 via-teal-900 to-[#0b1f3a] p-4 sm:p-5 rounded-2xl text-white shadow-sm">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                GEMINI 3.8 FLASH
              </span>
              <span className="text-xs font-semibold text-emerald-300">
                {isFrench ? 'Optimiseur Fiscal Intelligent' : 'AI Tax Deduction Optimizer'}
              </span>
            </div>
            <h4 className="text-base font-bold mt-1">
              {isFrench
                ? 'Maximisez votre Remboursement & Réduisez le Risque d’Audit'
                : 'Maximize Your Tax Refund & Audit Shield'}
            </h4>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {isFrench
                ? 'L’intelligence artificielle passe au crible votre revenu, vos crédits et vos déductions pour identifier des stratégies d’économie d’impôt concrètes.'
                : 'AI scans your T1 return across deductions, RRSP/FHSA limits, medical expenses, and charitable donations to detect potential tax savings.'}
            </p>
          </div>

          <button
            onClick={handleRunAiOptimizer}
            disabled={isOptimizing}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center justify-center space-x-2 shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>
              {isOptimizing
                ? isFrench
                  ? 'Analyse IA...'
                  : 'Optimizing...'
                : isFrench
                ? 'Lancer l’optimiseur IA'
                : 'Run AI Tax Optimizer'}
            </span>
          </button>
        </div>

        {isOptimizing && (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center space-y-2">
            <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-slate-600">
              {isFrench
                ? 'Calcul des stratégies d’optimisation fiscale par Gemini 3.8 Flash...'
                : 'Generating personalized tax optimization strategies via Gemini 3.8 Flash...'}
            </p>
          </div>
        )}

        {optimizerData && !isOptimizing && (
          <div className="space-y-4">
            {/* Optimizer Result Header */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="text-[11px] font-bold text-emerald-800 uppercase">
                  {isFrench ? 'Économies Potentielles' : 'Estimated Tax Savings'}
                </div>
                <div className="text-lg font-black text-emerald-950 font-mono mt-0.5">
                  +${(optimizerData.estimatedPotentialSavings || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD
                </div>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="text-[11px] font-bold text-blue-800 uppercase">
                  {isFrench ? 'Score Sécurité Vérification' : 'CRA Audit Shield Score'}
                </div>
                <div className="text-lg font-black text-blue-950 font-mono mt-0.5 flex items-center space-x-1.5">
                  <ShieldCheck className="w-5 h-5 text-blue-600 inline" />
                  <span>{optimizerData.auditRisk?.score || 98}/100 ({optimizerData.auditRisk?.level || 'LOW'})</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[11px] font-bold text-slate-700 uppercase">
                  {isFrench ? 'Stratégies Trouvées' : 'Identified Strategies'}
                </div>
                <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                  {optimizerData.strategies?.length || 0} {isFrench ? 'Actions ciblées' : 'Actionable items'}
                </div>
              </div>
            </div>

            {/* Evaluation Summary */}
            {optimizerData.summary && (
              <div className="p-3.5 bg-slate-100 rounded-xl text-xs text-slate-700 border border-slate-200 leading-relaxed">
                <span className="font-bold text-slate-900">{isFrench ? 'Synthèse de l’optimiseur : ' : 'Optimizer Evaluation: '}</span>
                {optimizerData.summary}
              </div>
            )}

            {/* List of Strategies */}
            {optimizerData.strategies && optimizerData.strategies.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {optimizerData.strategies.map((strat: any) => (
                  <div key={strat.id} className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center space-x-1">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>{strat.title}</span>
                      </span>
                      <span className="text-xs font-black font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        +${strat.impactCad} CAD
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{strat.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
