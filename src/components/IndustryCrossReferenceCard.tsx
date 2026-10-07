import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Search,
  Building,
} from 'lucide-react';
import { AppTaxReturn } from '../types/tax';
import {
  CRA_INDUSTRY_BENCHMARKS,
  validateT4IncomeAgainstIndustry,
  getIndustryBenchmark,
} from '../services/craIndustryBenchmarks';

interface IndustryCrossReferenceCardProps {
  taxReturn: AppTaxReturn;
  onUpdateTaxReturn?: (updated: Partial<AppTaxReturn>) => void;
  onSelectStep?: (step: number) => void;
  language: 'en' | 'fr';
}

export const IndustryCrossReferenceCard: React.FC<IndustryCrossReferenceCardProps> = ({
  taxReturn,
  onUpdateTaxReturn,
  onSelectStep,
  language,
}) => {
  const isFrench = language === 'fr';

  // Calculate total employment income across all T4 slips
  const totalT4Income = useMemo(() => {
    return (taxReturn.t4Slips || []).reduce(
      (sum, slip) => sum + (Number(slip.box14_employmentIncome) || 0),
      0
    );
  }, [taxReturn.t4Slips]);

  // Current industry code
  const currentIndustryCode =
    taxReturn.employmentIndustryCode ||
    taxReturn.personal?.employmentIndustryCode ||
    '541514'; // Default to Computer Systems Design for tech filers

  const [selectedCode, setSelectedCode] = useState<string>(currentIndustryCode);

  // Run validation
  const validationResult = useMemo(() => {
    return validateT4IncomeAgainstIndustry(totalT4Income, selectedCode, language);
  }, [totalT4Income, selectedCode, language]);

  const handleIndustryChange = (newCode: string) => {
    setSelectedCode(newCode);
    if (onUpdateTaxReturn) {
      onUpdateTaxReturn({
        employmentIndustryCode: newCode,
        personal: {
          ...taxReturn.personal,
          employmentIndustryCode: newCode,
        },
      });
    }
  };

  const currentBenchmark = validationResult.benchmark;

  // Compute position on the benchmark visual bar (0 to 100%)
  const barPosition = useMemo(() => {
    if (!currentBenchmark) return 50;
    const min = currentBenchmark.typicalMinIncome * 0.7;
    const max = currentBenchmark.typicalMaxIncome * 1.25;
    const clamped = Math.max(min, Math.min(max, totalT4Income));
    return Math.round(((clamped - min) / (max - min)) * 100);
  }, [currentBenchmark, totalT4Income]);

  const medianPosition = useMemo(() => {
    if (!currentBenchmark) return 50;
    const min = currentBenchmark.typicalMinIncome * 0.7;
    const max = currentBenchmark.typicalMaxIncome * 1.25;
    return Math.round(((currentBenchmark.craMedianIncome - min) / (max - min)) * 100);
  }, [currentBenchmark]);

  return (
    <div
      id="industry-cross-reference-card"
      className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 shadow-2xs">
            <Briefcase className="w-5 h-5 text-[#064e3b]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                {isFrench
                  ? 'Validation croisée sectorielle de l’ARC'
                  : 'CRA Industry Benchmark Cross-Reference'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                SCIAN / NAICS
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isFrench
                ? 'Vérifie si le revenu total des T4 correspond à la fourchette sectorielle attendue par l’ARC'
                : 'Cross-checks total reported T4 employment income against CRA & Statistics Canada compliant salary ranges'}
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {isFrench ? 'Total T4 déclaré' : 'Total Reported T4'}
          </span>
          <span
            id="reported-t4-income-stat"
            className="text-lg sm:text-xl font-black text-slate-900 font-mono"
          >
            {totalT4Income.toLocaleString(isFrench ? 'fr-CA' : 'en-CA', {
              style: 'currency',
              currency: 'CAD',
            })}
          </span>
        </div>
      </div>

      {/* Industry Code Selector */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label
            htmlFor="industry-code-select"
            className="text-xs font-bold text-slate-800 flex items-center space-x-1.5"
          >
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <span>{isFrench ? 'Secteur d’emploi / Code SCIAN :' : 'Employment Industry / NAICS Code:'}</span>
          </label>
          <span className="text-[11px] text-slate-500">
            {isFrench
              ? 'Classification officielle des industries du Canada'
              : 'Statistics Canada / CRA standard classifications'}
          </span>
        </div>

        <div className="relative">
          <select
            id="industry-code-select"
            value={selectedCode}
            onChange={(e) => handleIndustryChange(e.target.value)}
            className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#064e3b] focus:border-transparent cursor-pointer shadow-2xs"
          >
            {CRA_INDUSTRY_BENCHMARKS.map((b) => (
              <option key={b.code} value={b.code}>
                {b.code} — {isFrench ? b.nameFr : b.nameEn} ({b.category})
              </option>
            ))}
          </select>
        </div>

        {currentBenchmark && (
          <p className="text-[11px] text-slate-600 italic">
            {isFrench ? currentBenchmark.descriptionFr : currentBenchmark.descriptionEn}
          </p>
        )}
      </div>

      {/* Visual Benchmark Comparison Bar / Gauge */}
      {currentBenchmark && (
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>{isFrench ? 'Échelle des salaires sectoriels' : 'Industry Salary Range Scale'}</span>
            <span className="text-slate-500 font-mono text-[11px]">
              {isFrench ? 'Médiane ARC : ' : 'CRA Median: '}
              {currentBenchmark.craMedianIncome.toLocaleString(isFrench ? 'fr-CA' : 'en-CA', {
                style: 'currency',
                currency: 'CAD',
              })}
            </span>
          </div>

          {/* Graphical Bar */}
          <div className="space-y-2">
            <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden">
              {/* Highlight expected range */}
              <div
                className="absolute top-0 bottom-0 bg-emerald-200/90 border-x border-emerald-400"
                style={{
                  left: '20%',
                  right: '20%',
                }}
                title={isFrench ? 'Fourchette normale attendue' : 'Expected CRA benchmark range'}
              />

              {/* CRA Median Line */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-slate-700 z-10"
                style={{ left: `${medianPosition}%` }}
                title={isFrench ? 'Médiane sectorielle' : 'Industry median'}
              />
            </div>

            {/* Current Taxpayer Indicator Pin */}
            <div className="relative h-6">
              <div
                className="absolute -top-1 -translate-x-1/2 flex flex-col items-center z-20 transition-all duration-500"
                style={{ left: `${barPosition}%` }}
              >
                <div className="w-3 h-3 bg-[#064e3b] rotate-45 border-2 border-white shadow-xs" />
                <span
                  id="user-t4-position-badge"
                  className="mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#064e3b] text-white whitespace-nowrap shadow-xs"
                >
                  {isFrench ? 'Votre T4 : ' : 'Your T4: '}
                  {totalT4Income.toLocaleString(isFrench ? 'fr-CA' : 'en-CA', {
                    style: 'currency',
                    currency: 'CAD',
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>

            {/* Scale Labels */}
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1">
              <span>
                Min:{' '}
                {currentBenchmark.typicalMinIncome.toLocaleString(isFrench ? 'fr-CA' : 'en-CA', {
                  style: 'currency',
                  currency: 'CAD',
                  maximumFractionDigits: 0,
                })}
              </span>
              <span className="font-bold text-slate-700">
                Med:{' '}
                {currentBenchmark.craMedianIncome.toLocaleString(isFrench ? 'fr-CA' : 'en-CA', {
                  style: 'currency',
                  currency: 'CAD',
                  maximumFractionDigits: 0,
                })}
              </span>
              <span>
                Max:{' '}
                {currentBenchmark.typicalMaxIncome.toLocaleString(isFrench ? 'fr-CA' : 'en-CA', {
                  style: 'currency',
                  currency: 'CAD',
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Validation Result Status Card */}
      <div
        id="industry-validation-status-box"
        className={`rounded-xl p-4 border transition-all ${
          validationResult.status === 'compliant'
            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
            : validationResult.status === 'underreported_risk'
            ? 'bg-amber-50/90 border-amber-300 text-amber-950'
            : 'bg-blue-50/90 border-blue-300 text-blue-950'
        }`}
      >
        <div className="flex items-start space-x-3">
          <div className="shrink-0 mt-0.5">
            {validationResult.status === 'compliant' ? (
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            ) : validationResult.status === 'underreported_risk' ? (
              <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-bold text-sm sm:text-base">{validationResult.title}</h4>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${
                  validationResult.status === 'compliant'
                    ? 'bg-emerald-200/80 text-emerald-900 border border-emerald-300'
                    : validationResult.status === 'underreported_risk'
                    ? 'bg-amber-200/80 text-amber-900 border border-amber-300'
                    : 'bg-blue-200/80 text-blue-900 border border-blue-300'
                }`}
              >
                {validationResult.status === 'compliant'
                  ? isFrench
                    ? 'CONFORME ARC'
                    : 'CRA COMPLIANT'
                  : validationResult.status === 'underreported_risk'
                  ? isFrench
                    ? 'ÉCART DÉTECTÉ'
                    : 'VARIANCE FLAGGED'
                  : isFrench
                  ? 'SALAIRE ÉLEVÉ'
                  : 'HIGH EARNER'}
              </span>
            </div>

            <p className="text-xs leading-relaxed opacity-95">{validationResult.message}</p>

            <div className="pt-1 flex items-center space-x-2 text-[11px] font-medium opacity-90">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>{validationResult.craGuidance}</span>
            </div>
          </div>
        </div>

        {/* Action Link if Underreported Risk */}
        {validationResult.status === 'underreported_risk' && onSelectStep && (
          <div className="mt-3 pt-3 border-t border-amber-200/80 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-900">
              {isFrench
                ? 'Un feuillet T4 manque-t-il à votre déclaration?'
                : 'Did you have another employer or slip during the year?'}
            </span>
            <button
              type="button"
              id="goto-documents-from-industry-check-btn"
              onClick={() => onSelectStep(2)}
              className="inline-flex items-center space-x-1 text-xs font-bold text-amber-900 hover:text-amber-950 underline cursor-pointer"
            >
              <span>{isFrench ? 'Aller aux documents' : 'Review Documents'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
