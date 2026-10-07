import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  PieChart as PieIcon,
  HelpCircle,
  Shield,
  Briefcase,
  Building,
  Landmark,
  Info,
  DollarSign,
  BookOpen,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { AppTaxReturn } from '../types/tax';

interface TaxDistributionPieChartProps {
  taxReturn: AppTaxReturn;
  language: 'en' | 'fr';
}

export interface TaxSliceItem {
  id: string;
  name: string;
  shortName: string;
  value: number;
  weight: number;
  color: string;
  craLine: string;
  craBox?: string;
  purposeEn: string;
  purposeFr: string;
  explanationEn: string;
  explanationFr: string;
  icon: typeof Landmark;
}

export const TaxDistributionPieChart: React.FC<TaxDistributionPieChartProps> = ({
  taxReturn,
  language,
}) => {
  const isFrench = language === 'fr';
  const [activeSliceIndex, setActiveSliceIndex] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const calc = taxReturn.calculation;

  // Extract the 4 required tax distribution values:
  // 1. Federal Tax
  const federalTax = Math.max(0, calc?.netFederalTax ?? 0);

  // 2. Provincial Tax
  const provincialTax = Math.max(0, calc?.netProvincialTax ?? 0);

  // 3. CPP (Canada Pension Plan / QPP)
  const cppContributions = Math.max(
    0,
    (taxReturn.t4Slips || []).reduce(
      (sum, s) => sum + (Number(s.box16_cppContributions) || 0),
      0
    )
  );

  // 4. EI (Employment Insurance)
  const eiPremiums = Math.max(
    0,
    (taxReturn.t4Slips || []).reduce(
      (sum, s) => sum + (Number(s.box18_eiPremiums) || 0),
      0
    )
  );

  const totalDistribution = federalTax + provincialTax + cppContributions + eiPremiums;

  // Build the 4 slice items
  const data: TaxSliceItem[] = useMemo(() => {
    const total = totalDistribution > 0 ? totalDistribution : 1;

    return [
      {
        id: 'federal-tax',
        name: isFrench ? 'Impôt Fédéral Net' : 'Net Federal Tax',
        shortName: isFrench ? 'Fédéral' : 'Federal Tax',
        value: federalTax,
        weight: (federalTax / total) * 100,
        color: '#064e3b', // Deep forest green
        craLine: 'Line 42000',
        craBox: 'T1 Schedule 1',
        purposeEn: 'National Healthcare Transfers, Infrastructure & Federal Programs',
        purposeFr: 'Transferts nationaux en santé, infrastructures et programmes fédéraux',
        explanationEn:
          'Your federal income tax is calculated on taxable income using Canada’s progressive marginal brackets (15% to 33%). It finances the Canada Health Transfer (CHT), defense, federal courts, and national economic development.',
        explanationFr:
          'Votre impôt fédéral sur le revenu est calculé selon les tranches d’imposition progressives canadiennes (15 % à 33 %). Il finance le Transfert canadien en matière de santé, la défense et les programmes nationaux.',
        icon: Landmark,
      },
      {
        id: 'provincial-tax',
        name: isFrench ? `Impôt Provincial Net (${taxReturn.personal?.province || 'ON'})` : `Net Provincial Tax (${taxReturn.personal?.province || 'ON'})`,
        shortName: isFrench ? 'Provincial' : 'Provincial Tax',
        value: provincialTax,
        weight: (provincialTax / total) * 100,
        color: '#1e3a8a', // Deep blue
        craLine: 'Line 42800',
        craBox: `Form 428 (${taxReturn.personal?.province || 'ON'})`,
        purposeEn: 'Hospitals, Primary Healthcare, K-12 Education & Regional Transit',
        purposeFr: 'Hôpitaux, soins de santé directs, éducation primaire/secondaire et transports régionaux',
        explanationEn:
          'Paid to your province of residence as of December 31. Provincial tax funds direct local public services including public hospitals, universities, schools, municipal policing, and provincial highways.',
        explanationFr:
          'Payé à votre province de résidence au 31 décembre. L’impôt provincial finance directement les hôpitaux locaux, les universités, les écoles primaires/secondaires et le réseau routier.',
        icon: Building,
      },
      {
        id: 'cpp',
        name: isFrench ? 'Cotisations RPC / RRQ' : 'Canada Pension Plan (CPP / QPP)',
        shortName: 'CPP / RPC',
        value: cppContributions,
        weight: (cppContributions / total) * 100,
        color: '#d97706', // Amber / Gold
        craLine: 'Line 30800',
        craBox: 'T4 Box 16',
        purposeEn: 'Guaranteed Inflation-Protected Retirement & Disability Pension',
        purposeFr: 'Rente de retraite et d’invalidité garantie et indexée au coût de la vie',
        explanationEn:
          'Mandatory pension security contributions (matched dollar-for-dollar by your employer up to the YMPE ceiling). This capital builds your permanent retirement nest egg and long-term disability benefits.',
        explanationFr:
          'Cotisations obligatoires de retraite (jumelées à parts égales par l’employeur jusqu’au plafond du MGAP). Ce capital garantit votre rente de retraite et vos prestations d’invalidité.',
        icon: Briefcase,
      },
      {
        id: 'ei',
        name: isFrench ? 'Cotisations Assurance-Emploi (AE)' : 'Employment Insurance (EI Premiums)',
        shortName: 'EI / AE',
        value: eiPremiums,
        weight: (eiPremiums / total) * 100,
        color: '#7c3aed', // Royal purple
        craLine: 'Line 31200',
        craBox: 'T4 Box 18',
        purposeEn: 'Safety Net for Involuntary Job Loss, Parental Leave & Sickness',
        purposeFr: 'Filet de sécurité en cas de chômage, congé parental et maladie',
        explanationEn:
          'Premiums pooled into Canada’s Employment Insurance account. EI provides temporary financial relief if you lose your employment, take parental or maternity leave, or require sickness benefits.',
        explanationFr:
          'Primes versées au compte de l’Assurance-emploi du Canada. L’AE assure un soutien temporaire en cas de perte involontaire d’emploi, congé parental/maternité ou maladie.',
        icon: Shield,
      },
    ];
  }, [federalTax, provincialTax, cppContributions, eiPremiums, totalDistribution, isFrench, taxReturn.personal?.province]);

  const activeItem = activeSliceIndex !== null ? data[activeSliceIndex] : null;

  // Custom Pie Chart Tooltip
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as TaxSliceItem;
      return (
        <div className="bg-[#0c2340] text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-1.5 z-50 max-w-xs backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-white/20"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-bold text-sm text-white">{item.name}</span>
          </div>
          <div className="text-[11px] font-mono text-emerald-300 font-semibold">
            {item.craLine} {item.craBox ? `• ${item.craBox}` : ''}
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-700 text-xs">
            <span className="text-slate-300">{isFrench ? 'Montant :' : 'Amount:'}</span>
            <span className="font-mono font-bold text-white text-sm">
              ${item.value.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">{isFrench ? 'Part du total :' : 'Share of Total:'}</span>
            <span className="font-mono font-bold text-amber-300">{item.weight.toFixed(1)}%</span>
          </div>
          <p className="text-[10px] text-slate-300 leading-tight pt-1 border-t border-slate-700/60">
            {isFrench ? item.purposeFr : item.purposeEn}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="tax-distribution-literacy-card"
      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center font-bold">
            <PieIcon className="w-5 h-5 text-[#064e3b]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {isFrench
                  ? 'Répartition Fiscale & Éducation Financière'
                  : 'Tax Distribution & Literacy Breakdown'}
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Recharts Visualizer
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isFrench
                ? 'Visualisation interactive de chaque dollar versé : Impôt fédéral, provincial, RPC/RRQ et AE.'
                : 'Interactive pie chart showing where your tax dollars go across Federal Tax, Provincial Tax, CPP, and EI.'}
            </p>
          </div>
        </div>

        {/* Total Summary Metric */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {isFrench ? 'Total des Prélèvements' : 'Total Tax & Remittances'}
            </span>
            <span className="text-sm font-extrabold font-mono text-slate-900">
              ${totalDistribution.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recharts Pie Chart on Left, Interactive Literacy Cards on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Recharts Pie Chart Visualizer */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80">
          <div className="w-full h-[280px] sm:h-[300px]">
            {totalDistribution > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={900}
                    onMouseEnter={(_, index) => setActiveSliceIndex(index)}
                    onMouseLeave={() => setActiveSliceIndex(null)}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="#ffffff"
                        strokeWidth={2}
                        className="transition-transform duration-200 cursor-pointer outline-hidden"
                        style={{
                          transform: activeSliceIndex === index ? 'scale(1.04)' : 'scale(1)',
                          transformOrigin: 'center center',
                          filter: activeSliceIndex === index ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' : 'none',
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <Info className="w-6 h-6 mb-1 text-slate-300" />
                <span>{isFrench ? 'Aucun prélèvement à afficher pour l’instant' : 'No tax remittances recorded yet'}</span>
              </div>
            )}
          </div>

          {/* Centered Donut Label */}
          {totalDistribution > 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {activeItem ? activeItem.shortName : (isFrench ? 'Total Répartition' : 'Tax & Remittance')}
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-slate-900">
                {activeItem
                  ? `${activeItem.weight.toFixed(1)}%`
                  : `$${totalDistribution.toLocaleString('en-CA', { maximumFractionDigits: 0 })}`}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {activeItem
                  ? `$${activeItem.value.toLocaleString('en-CA', { maximumFractionDigits: 0 })}`
                  : (isFrench ? '4 Composantes' : '4 Pillars')}
              </span>
            </div>
          )}

          {/* Quick Legend under Pie */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full pt-3 border-t border-slate-200 mt-2 text-xs">
            {data.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedTopic(item.id)}
                onMouseEnter={() => setActiveSliceIndex(idx)}
                onMouseLeave={() => setActiveSliceIndex(null)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  activeSliceIndex === idx || selectedTopic === item.id
                    ? 'bg-white shadow-xs border-slate-400 ring-2 ring-slate-900/10'
                    : 'bg-white/80 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-bold text-[11px] truncate text-slate-800">
                    {item.shortName}
                  </span>
                </div>
                <div className="font-mono font-extrabold text-slate-900 text-xs">
                  ${item.value.toLocaleString('en-CA', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold">
                  {item.weight.toFixed(1)}%
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Educational Tax Literacy Cards */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 pb-1">
            <BookOpen className="w-4 h-4 text-[#064e3b]" />
            <span>
              {isFrench
                ? 'Comprendre où vont vos impôts (Éducation Civique & Fiscale)'
                : 'Tax Literacy: Where Your Canadian Tax Dollars Go'}
            </span>
          </div>

          <div className="space-y-2.5">
            {data.map((item, idx) => {
              const isSelected = selectedTopic === item.id || activeSliceIndex === idx;
              const IconComp = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedTopic(item.id)}
                  onMouseEnter={() => setActiveSliceIndex(idx)}
                  onMouseLeave={() => setActiveSliceIndex(null)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-50 border-slate-400 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-white"
                        style={{ backgroundColor: item.color }}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                            {item.name}
                          </h4>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                            {item.craLine}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                          {isFrench ? item.purposeFr : item.purposeEn}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                        ${item.value.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">
                        {item.weight.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Expanded literacy explanation */}
                  {isSelected && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-200 text-xs text-slate-600 leading-relaxed bg-white/70 p-2.5 rounded-lg">
                      <p>{isFrench ? item.explanationFr : item.explanationEn}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tax Literacy Pro Tip */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start space-x-2.5 text-xs text-emerald-950">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold">
                {isFrench ? 'Le saviez-vous ?' : 'Tax Literacy Fact:'}
              </span>{' '}
              {isFrench
                ? 'Les cotisations RPC (Ligne 30800) et AE (Ligne 31200) ne sont pas des impôts perdus : elles génèrent un crédit d’impôt non remboursable fédéral de 15 % qui réduit directement votre impôt à payer !'
                : 'CPP contributions (Line 30800) and EI premiums (Line 31200) qualify for federal non-refundable tax credits at 15%, reducing your net income tax bill dollar-for-dollar!'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
