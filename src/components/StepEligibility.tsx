import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Camera,
  Sparkles,
  HelpCircle,
  FileCheck,
  Calendar,
} from 'lucide-react';
import { AppTaxReturn } from '../types/tax';

interface StepEligibilityProps {
  taxReturn: AppTaxReturn;
  onUpdateTaxReturn: (updated: Partial<AppTaxReturn>) => void;
  onNext: () => void;
  onOpenScanner: () => void;
  onLoadDemo: () => void;
  language: 'en' | 'fr';
}

export const StepEligibility: React.FC<StepEligibilityProps> = ({
  taxReturn,
  onUpdateTaxReturn,
  onNext,
  onOpenScanner,
  onLoadDemo,
  language,
}) => {
  const isFrench = language === 'fr';

  return (
    <div id="step-eligibility-view" className="space-y-6 max-w-4xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="bg-linear-to-br from-[#0b1f3a] via-[#0d2a4f] to-[#064e3b] rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-700/50 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <span>🍁</span>
            <span>{isFrench ? 'Préparation Fiscale Personnelle T1' : 'Canadian Personal T1 Tax Preparation'}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {isFrench ? 'Vos impôts canadiens, simplifiés par l’IA.' : 'File Your Canadian Taxes, Made Simple.'}
          </h2>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            {isFrench
              ? 'Répondez à quelques questions simples, numérisez vos feuillets T4 avec la vision par ordinateur, comprenez votre calcul déterministe et préparez votre transmission NETFILE sécurisée.'
              : 'Answer a few simple questions, organize your tax slips with optical computer vision, understand your calculation, and prepare your return for secure electronic filing.'}
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={onNext}
              className="px-5 py-3 rounded-xl bg-[#064e3b] hover:bg-[#08634c] text-white font-bold text-sm flex items-center space-x-2 shadow-lg shadow-emerald-950/40 border border-emerald-400/40 transition-all cursor-pointer"
            >
              <span>{isFrench ? 'Commencer ma déclaration' : 'Start My Tax Return'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenScanner}
              className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm flex items-center space-x-2 border border-white/20 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 text-emerald-300" />
              <span>{isFrench ? 'Numériser un feuillet T4' : 'Scan Slips (Computer Vision)'}</span>
            </button>

            <button
              onClick={onLoadDemo}
              className="px-4 py-3 rounded-xl bg-slate-900/60 hover:bg-slate-900/80 text-slate-200 font-medium text-sm flex items-center space-x-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isFrench ? 'Charger le profil démo Alex' : 'Load Demo Profile'}</span>
            </button>
          </div>
        </div>

        {/* Decorative Badge */}
        <div className="hidden md:block absolute -right-4 -bottom-4 opacity-15 pointer-events-none">
          <span className="text-[180px]">🍁</span>
        </div>
      </div>

      {/* Eligibility Questionnaire Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isFrench ? 'Vérification d’admissibilité T1' : 'Eligibility & Tax Year Check'}
            </h3>
            <p className="text-xs text-slate-500">
              {isFrench
                ? 'Assurons-nous que votre situation convient à une déclaration personnelle standard T1'
                : 'Confirming your situation qualifies for standard Canadian T1 personal tax preparation'}
            </p>
          </div>
        </div>

        {/* Questions Grid */}
        <div className="space-y-4 text-sm">
          {/* Question 1: Residency */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold text-slate-900">
                {isFrench
                  ? '1. Résidiez-vous au Canada le 31 décembre de l’année d’imposition?'
                  : '1. Did you reside in Canada on December 31 of the tax year?'}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {isFrench
                  ? 'Requis pour établir votre statut de résidence fiscale canadienne.'
                  : 'Required by CRA to establish factual or deemed provincial tax residency.'}
              </p>
            </div>
            <div className="flex space-x-2 shrink-0">
              <button
                onClick={() =>
                  onUpdateTaxReturn({
                    personal: { ...taxReturn.personal, residedInCanadaDec31: true },
                  })
                }
                className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  taxReturn.personal.residedInCanadaDec31
                    ? 'bg-[#064e3b] text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {isFrench ? 'OUI' : 'YES'}
              </button>
              <button
                onClick={() =>
                  onUpdateTaxReturn({
                    personal: { ...taxReturn.personal, residedInCanadaDec31: false },
                  })
                }
                className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  !taxReturn.personal.residedInCanadaDec31
                    ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {isFrench ? 'NON' : 'NO'}
              </button>
            </div>
          </div>

          {/* Question 2: Tax Year */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold text-slate-900">
                {isFrench
                  ? '2. Pour quelle année d’imposition produisez-vous?'
                  : '2. Which tax year are you preparing today?'}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {isFrench
                  ? 'L’application charge automatiquement les barèmes et crédits officiels de l’année sélectionnée.'
                  : 'Loads official CRA tax brackets, basic personal amounts, and maximum CPP/EI limits.'}
              </p>
            </div>
            <div className="flex space-x-2 shrink-0">
              {[2025, 2024].map((year) => (
                <button
                  key={year}
                  onClick={() => onUpdateTaxReturn({ taxYear: year })}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    taxReturn.taxYear === year
                      ? 'bg-[#0b1f3a] text-white border-blue-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {/* Question 3: Complex Situations Check */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-semibold text-slate-900">
              {isFrench
                ? '3. Déclaration de situation personnelle'
                : '3. Personal Situation Criteria'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isFrench ? 'Aucune faillite en cours' : 'No bankruptcy in tax year'}</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isFrench ? 'Contribuable vivant (non décédé)' : 'Living taxpayer (not deceased)'}</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isFrench ? 'Biens étrangers < 100 000 $' : 'Foreign property under $100k'}</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isFrench ? 'Feuillets T4, T4A, T5, T2202, REER' : 'Standard T4, T5, T2202, RRSP slips'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Eligibility Outcome */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                {isFrench ? 'Votre dossier est admissible au parcours guidé Tax Easy!' : 'Eligible for Tax Easy Guided T1 Filing!'}
              </h4>
              <p className="text-xs text-emerald-800">
                {isFrench
                  ? 'Étape suivante : Numérisez vos feuillets T4 ou saisissez vos renseignements personnels.'
                  : 'Next step: Scan your T-slips or review your personal information.'}
              </p>
            </div>
          </div>

          <button
            onClick={onNext}
            className="px-5 py-2.5 rounded-xl bg-[#064e3b] hover:bg-[#08634c] text-white font-bold text-xs flex items-center space-x-1.5 shadow-md transition-all shrink-0 cursor-pointer"
          >
            <span>{isFrench ? 'Étape suivante' : 'Continue to Step 2'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
