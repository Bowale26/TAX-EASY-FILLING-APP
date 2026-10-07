import React, { useState, useMemo, useRef, useEffect } from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { CheckCircle2, Circle, ChevronDown, Award } from 'lucide-react';
import { AppTaxReturn } from '../types/tax';

interface HeaderTaxProgressProps {
  currentStep: number;
  taxReturn: AppTaxReturn;
  onSelectStep: (step: number) => void;
  language: 'en' | 'fr';
}

interface StepStatus {
  step: number;
  titleEn: string;
  titleFr: string;
  isCompleted: boolean;
}

export const HeaderTaxProgress: React.FC<HeaderTaxProgressProps> = ({
  currentStep,
  taxReturn,
  onSelectStep,
  language,
}) => {
  const isFrench = language === 'fr';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute status for all 10 tax sections
  const sections: StepStatus[] = useMemo(() => {
    const p = taxReturn.personal;
    const slips = taxReturn.t4Slips || [];
    const otherSlips = taxReturn.otherSlips || [];
    const calc = taxReturn.calculation;

    return [
      {
        step: 1,
        titleEn: 'Eligibility & Welcome',
        titleFr: 'Admissibilité & Préparation',
        isCompleted: true, // Step 1 is always completed once loaded
      },
      {
        step: 2,
        titleEn: 'Slip Scanner & Checklist',
        titleFr: 'Numérisation Visuelle & Feuillets',
        isCompleted: slips.length > 0 || otherSlips.length > 0 || currentStep > 2,
      },
      {
        step: 3,
        titleEn: 'Personal Information',
        titleFr: 'Renseignements Personnels',
        isCompleted: Boolean(p?.firstName?.trim() && p?.lastName?.trim() && p?.sin?.replace(/\D/g, '').length === 9),
      },
      {
        step: 4,
        titleEn: 'Family & Dependants',
        titleFr: 'Famille & Personnes à Charge',
        isCompleted: Boolean(p?.maritalStatus) || currentStep > 4,
      },
      {
        step: 5,
        titleEn: 'Employment & Other Income',
        titleFr: 'Revenus d’Emploi & Autres Sources',
        isCompleted: slips.length > 0 || (calc?.totalIncome ?? 0) > 0 || currentStep > 5,
      },
      {
        step: 6,
        titleEn: 'Deductions & Tax Credits',
        titleFr: 'Déductions & Crédits d’Impôt',
        isCompleted: currentStep >= 6,
      },
      {
        step: 7,
        titleEn: 'Review & Pre-Filing Diagnostics',
        titleFr: 'Révision & Contrôle d’Audit',
        isCompleted: currentStep >= 7,
      },
      {
        step: 8,
        titleEn: 'Deterministic CRA Calculation',
        titleFr: 'Moteur de Calcul Déterministe',
        isCompleted: Boolean(calc && calc.totalTaxPayable !== undefined && currentStep >= 8),
      },
      {
        step: 9,
        titleEn: 'CRA NETFILE Transmission',
        titleFr: 'Transmission NETFILE ARC',
        isCompleted: taxReturn.filingStatus === 'Filed' || currentStep >= 9,
      },
      {
        step: 10,
        titleEn: 'Notice of Assessment & History',
        titleFr: 'Avis de Cotisation & Sauvegarde',
        isCompleted: taxReturn.filingStatus === 'Filed' || currentStep === 10,
      },
    ];
  }, [taxReturn, currentStep]);

  const completedCount = useMemo(() => {
    return sections.filter((s) => s.isCompleted).length;
  }, [sections]);

  const percentage = Math.round((completedCount / 10) * 100);

  // Dynamic progress color based on completion
  const progressColor =
    percentage >= 90
      ? '#059669' // Emerald
      : percentage >= 60
      ? '#0d9488' // Teal
      : percentage >= 30
      ? '#0284c7' // Sky
      : '#64748b'; // Slate

  const chartData = useMemo(
    () => [{ name: 'Progress', value: percentage, fill: progressColor }],
    [percentage, progressColor]
  );

  return (
    <div className="relative inline-block" ref={dropdownRef} id="header-tax-progress-container">
      <button
        id="header-progress-indicator-btn"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center space-x-2.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100/90 active:bg-slate-200/80 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs group"
        title={
          isFrench
            ? `${completedCount} sur 10 sections complétées (${percentage}%). Cliquez pour voir le détail.`
            : `${completedCount} of 10 sections completed (${percentage}%). Click to inspect sections.`
        }
      >
        {/* Recharts Radial Chart */}
        <div className="w-8 h-8 relative flex items-center justify-center shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="100%"
              barSize={4}
              data={chartData}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background={{ fill: '#e2e8f0' }}
                dataKey="value"
                cornerRadius={2}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <span className="absolute text-[9px] font-black text-slate-700 select-none">
            {completedCount}
          </span>
        </div>

        {/* Textual progress label */}
        <div className="text-left hidden sm:block">
          <div className="flex items-center space-x-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              {isFrench ? 'Progression' : 'Progress'}
            </span>
            <span className="text-[11px] font-extrabold" style={{ color: progressColor }}>
              {percentage}%
            </span>
          </div>
          <div className="text-[11px] font-bold text-slate-800 leading-tight">
            {completedCount}/10 {isFrench ? 'sections' : 'sections'}
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Section Progress Menu */}
      {isOpen && (
        <div
          id="header-progress-dropdown"
          className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 px-3.5 z-50 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <div className="flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900">
                {isFrench ? 'Progression des 10 Sections' : 'Tax Return Progress (0–10)'}
              </span>
            </div>
            <span
              className="text-xs font-extrabold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${progressColor}15`, color: progressColor }}
            >
              {completedCount}/10 • {percentage}%
            </span>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${percentage}%`, backgroundColor: progressColor }}
            />
          </div>

          {/* Section Checklist (Clickable to jump) */}
          <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {sections.map((sec) => {
              const isCurrent = currentStep === sec.step;
              return (
                <button
                  key={sec.step}
                  type="button"
                  onClick={() => {
                    onSelectStep(sec.step);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                    isCurrent
                      ? 'bg-emerald-50 text-[#064e3b] font-bold border border-emerald-200'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    {sec.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span className="truncate">
                      <span className="font-semibold text-slate-400 mr-1.5">
                        {sec.step}.
                      </span>
                      {isFrench ? sec.titleFr : sec.titleEn}
                    </span>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md shrink-0 ml-1">
                      {isFrench ? 'Actuel' : 'Current'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center">
            {isFrench
              ? 'Toutes les sections sont sauvegardées automatiquement.'
              : 'All sections auto-save locally in encrypted storage.'}
          </div>
        </div>
      )}
    </div>
  );
};
