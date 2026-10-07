import React from 'react';
import {
  Calculator,
  HelpCircle,
  TrendingUp,
  Percent,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  Info,
  Download,
  Printer,
} from 'lucide-react';
import { AppTaxReturn } from '../types/tax';
import { exportAssessmentSummary } from '../utils/exportUtils';
import { TaxBreakdownVisualization } from './TaxBreakdownVisualization';

interface StepCalculationProps {
  taxReturn: AppTaxReturn;
  onNext: () => void;
  language: 'en' | 'fr';
}

export const StepCalculation: React.FC<StepCalculationProps> = ({
  taxReturn,
  onNext,
  language,
}) => {
  const isFrench = language === 'fr';

  const calc = taxReturn.calculation;
  const isRefund = (calc?.balanceOwingOrRefund ?? 0) >= 0;

  return (
    <div id="step-calculation-view" className="space-y-6 max-w-4xl mx-auto">
      {/* Visual Metric Hero */}
      <div className="bg-linear-to-r from-[#0b1f3a] via-[#0d2a4f] to-[#064e3b] rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              {isFrench ? 'Moteur de Calcul Déterministe' : 'Deterministic Calculation Engine'}
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-0.5">
              {isFrench ? 'Comprendre votre calcul d’impôt' : 'How Your Tax Return Was Calculated'}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              {isFrench
                ? 'Explication en langage clair : taux marginaux, crédits et rapprochement des retenues à la source.'
                : 'Clear, transparent breakdown of marginal brackets, non-refundable credits, and tax withheld.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="flex items-center space-x-3 bg-black/20 p-3 rounded-xl border border-white/10 shrink-0">
              <div>
                <div className="text-[10px] text-slate-300 uppercase font-bold">
                  {isFrench ? 'Taux d’impôt effectif' : 'Effective Tax Rate'}
                </div>
                <div className="text-xl font-mono font-bold text-emerald-300">
                  {(calc?.effectiveTaxRate ?? 0).toFixed(1)}%
                </div>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <div className="text-[10px] text-slate-300 uppercase font-bold">
                  {isFrench ? 'Taux marginal' : 'Marginal Rate'}
                </div>
                <div className="text-xl font-mono font-bold text-blue-300">
                  {(calc?.marginalTaxRate ?? 0).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col gap-2 no-print">
              <button
                id="export-calc-summary-btn"
                onClick={() => exportAssessmentSummary(taxReturn)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                title={isFrench ? 'Exporter le sommaire de calcul' : 'Export calculation summary text'}
              >
                <Download className="w-3.5 h-3.5 text-emerald-300" />
                <span>{isFrench ? 'Exporter' : 'Export Docs'}</span>
              </button>
              <button
                id="print-calc-summary-btn"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                title={isFrench ? 'Imprimer ou enregistrer en PDF' : 'Print or save as PDF'}
              >
                <Printer className="w-3.5 h-3.5 text-emerald-300" />
                <span>{isFrench ? 'Imprimer / PDF' : 'Print / PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* The Core Plain-Language Explanation */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-200">
          <HelpCircle className="w-5 h-5 text-[#064e3b]" />
          <h3 className="font-bold text-slate-900 text-base">
            {isFrench ? 'Pourquoi obtenez-vous ce résultat?' : 'Why Do You Get This Exact Refund or Balance?'}
          </h3>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <div className="flex items-start space-x-3">
            <span className="w-6 h-6 rounded-full bg-[#064e3b] text-white flex items-center justify-center font-bold text-xs shrink-0">
              1
            </span>
            <p>
              <strong>{isFrench ? 'Revenu et tranches progressives :' : 'Progressive tax brackets:'}</strong>{' '}
              {isFrench
                ? `Sur un revenu imposable de ${(calc?.taxableIncome ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}$, votre impôt fédéral brut avant crédits est de ${(calc?.federalGrossTax ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}$. Le Canada utilise un barème progressif (15 % sur la première tranche, puis 20,5 %, 26 %, 29 %, 33 %).`
                : `On your taxable income of $${(calc?.taxableIncome ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}, your gross federal tax before credits is $${(calc?.federalGrossTax ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}. Canada uses a progressive tax bracket system.`}
            </p>
          </div>

          <div className="flex items-start space-x-3">
            <span className="w-6 h-6 rounded-full bg-[#0b1f3a] text-white flex items-center justify-center font-bold text-xs shrink-0">
              2
            </span>
            <p>
              <strong>{isFrench ? 'Crédits non remboursables appliqués :' : 'Non-refundable tax credits applied:'}</strong>{' '}
              {isFrench
                ? `Vos crédits (Montant personnel de base de 15 705 $, montant canadien pour emploi, cotisations RPC et AE) ont généré une économie d’impôt directe de ${(calc?.federalNonRefundableCreditsTotal ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}$, réduisant votre impôt fédéral net à ${(calc?.netFederalTax ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}.`
                : `Your non-refundable credits (Basic Personal Amount of $15,705, Canada Employment Amount, CPP & EI) provided a direct tax reduction of $${(calc?.federalNonRefundableCreditsTotal ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}, bringing net federal tax down to $${(calc?.netFederalTax ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}.`}
            </p>
          </div>

          <div className="flex items-start space-x-3">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              3
            </span>
            <p>
              <strong>{isFrench ? 'Rapprochement des retenues à la source :' : 'Tax withheld vs Tax owed:'}</strong>{' '}
              {isFrench
                ? `Votre employeur a déjà prélevé ${(calc?.totalTaxWithheld ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })} $ sur vos chèques de paie (Case 22). Votre impôt total réel combiné est de ${(calc?.totalTaxPayable ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })} $. ${
                    isRefund
                      ? `Comme vous avez payé plus que nécessaire, l’ARC vous rembourse l’excédent de +$${(calc?.balanceOwingOrRefund ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}!`
                      : `Il reste un solde de -${Math.abs(calc?.balanceOwingOrRefund ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })} $ à payer d’ici le 30 avril.`
                  }`
                : `Your employer deducted $${(calc?.totalTaxWithheld ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })} at source (Box 22). Your actual combined tax liability is $${(calc?.totalTaxPayable ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}. ${
                    isRefund
                      ? `Because you paid more than you owe, CRA returns the difference as a refund of +$${(calc?.balanceOwingOrRefund ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}!`
                      : `A remaining balance of -$${Math.abs(calc?.balanceOwingOrRefund ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })} is due to CRA by April 30.`
                  }`}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Recharts Tax Breakdown: Income Tax vs. CPP vs. EI */}
      <TaxBreakdownVisualization taxReturn={taxReturn} language={language} />

      {/* Side-by-Side Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Federal Tax Pillar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-900 text-sm">
              {isFrench ? 'Impôt Fédéral (Canada)' : 'Federal Tax (Canada)'}
            </span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
              Schedule 1
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>{isFrench ? 'Impôt brut sur revenu' : 'Gross Federal Tax'}:</span>
              <span className="font-mono text-slate-900 font-medium">
                ${(calc?.federalGrossTax ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>{isFrench ? 'Moins : Crédits non remboursables' : 'Less: Non-Refundable Credits'}:</span>
              <span className="font-mono font-medium">
                -${(calc?.federalNonRefundableCreditsTotal ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900">
              <span>{isFrench ? 'Impôt fédéral net' : 'Net Federal Tax'}:</span>
              <span className="font-mono">
                ${(calc?.netFederalTax ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Provincial Tax Pillar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-900 text-sm">
              {isFrench ? `Impôt Provincial (${taxReturn.personal.province})` : `Provincial Tax (${taxReturn.personal.province})`}
            </span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
              Form 428
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>{isFrench ? 'Impôt provincial brut' : 'Gross Provincial Tax'}:</span>
              <span className="font-mono text-slate-900 font-medium">
                ${(calc?.provincialGrossTax ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>{isFrench ? 'Moins : Crédits provinciaux' : 'Less: Provincial Credits'}:</span>
              <span className="font-mono font-medium">
                -${(calc?.provincialCreditsTotal ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900">
              <span>{isFrench ? 'Impôt provincial net' : 'Net Provincial Tax'}:</span>
              <span className="font-mono">
                ${(calc?.netProvincialTax ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-2 no-print">
        <button
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-[#064e3b] hover:bg-[#08634c] text-white font-bold text-sm flex items-center space-x-2 shadow-md transition-all cursor-pointer"
        >
          <span>{isFrench ? 'Passer à la Transmission NETFILE' : 'Continue to CRA NETFILE Filing'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
