import React, { Component, ReactNode, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  PieChart as PieIcon,
  BarChart3,
  Shield,
  Briefcase,
  Building2,
  Info,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { AppTaxReturn } from '../types/tax';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ComponentErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded border border-red-200 bg-red-50 text-red-700">
          <p className="font-semibold">Unable to load calculation details.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 text-sm underline"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface TaxBreakdownVisualizationProps {
  taxReturn: AppTaxReturn;
  language: 'en' | 'fr';
}

interface TaxBreakdownItem {
  id: string;
  name: string;
  shortName: string;
  value: number;
  formattedValue?: string;
  weight: number;
  color: string;
  line: string;
  box: string;
  icon: typeof Shield;
  description: string;
}

const CustomTooltip = ({
  active,
  payload,
  isFrench,
}: {
  active?: boolean;
  payload?: any[];
  isFrench: boolean;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as TaxBreakdownItem;
    return (
      <div className="bg-[#0b1f3a] text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 z-50">
        <div className="flex items-center space-x-2">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: data.color }}
          />
          <span className="font-bold text-white text-xs">{data.name}</span>
        </div>
        <div className="text-[11px] text-slate-300 font-mono">
          {data.line} • {data.box}
        </div>
        <div className="flex justify-between items-baseline pt-1 border-t border-slate-700 gap-4">
          <span className="text-slate-400">
            {isFrench ? 'Montant :' : 'Amount:'}
          </span>
          <span className="font-mono font-bold text-emerald-300">
            ${data.value.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-4">
          <span className="text-slate-400">
            {isFrench ? 'Poids relatif :' : 'Relative Weight:'}
          </span>
          <span className="font-mono font-bold text-white">
            {(data?.weight ?? 0).toFixed(1)}%
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const TaxBreakdownVisualizationInner: React.FC<TaxBreakdownVisualizationProps> = ({
  taxReturn,
  language,
}) => {
  const isFrench = language === 'fr';
  const [chartType, setChartType] = useState<'donut' | 'bar'>('donut');

  const calc = taxReturn.calculation;

  // Extract statutory remittance values
  const totalTaxPayable = calc?.totalTaxPayable ?? ((calc?.netFederalTax ?? 0) + (calc?.netProvincialTax ?? 0));
  const totalCpp = taxReturn.t4Slips.reduce(
    (sum, s) => sum + (Number(s.box16_cppContributions) || 0),
    0
  );
  const totalEi = taxReturn.t4Slips.reduce(
    (sum, s) => sum + (Number(s.box18_eiPremiums) || 0),
    0
  );

  const taxData = {
    incomeTax: totalTaxPayable,
    cpp: totalCpp,
    ei: totalEi,
  };

  const incomeTax = taxData?.incomeTax ?? 0;
  const cpp = taxData?.cpp ?? 0;
  const ei = taxData?.ei ?? 0;

  const formattedTax = (Number(incomeTax) || 0).toFixed(2);

  const totalRemittance = incomeTax + cpp + ei;

  const incomeTaxWeight = totalRemittance > 0 ? (incomeTax / totalRemittance) * 100 : 0;
  const cppWeight = totalRemittance > 0 ? (cpp / totalRemittance) * 100 : 0;
  const eiWeight = totalRemittance > 0 ? (ei / totalRemittance) * 100 : 0;

  const breakdownItems: TaxBreakdownItem[] = [
    {
      id: 'income-tax',
      name: isFrench ? 'Impôt sur le Revenu (Fédéral + Provincial)' : 'Income Tax (Federal + Provincial)',
      shortName: isFrench ? 'Impôt sur le revenu' : 'Income Tax',
      value: incomeTax,
      formattedValue: formattedTax,
      weight: incomeTaxWeight,
      color: '#0b1f3a',
      line: 'Line 43500',
      box: isFrench ? 'Grille T1 Générale' : 'T1 Schedule 1 & 428',
      icon: Building2,
      description: isFrench
        ? 'Obligation fiscale nette après application de tous les crédits non remboursables'
        : 'Net tax liability to CRA and province after all non-refundable credits',
    },
    {
      id: 'cpp',
      name: isFrench ? 'Régime de Pensions du Canada (RPC / RRQ)' : 'Canada Pension Plan (CPP / QPP)',
      shortName: 'CPP / RPC',
      value: cpp,
      weight: cppWeight,
      color: '#064e3b',
      line: 'Line 30800',
      box: 'T4 Box 16',
      icon: Briefcase,
      description: isFrench
        ? 'Cotisations de retraite obligatoires aux rentes du Canada (Plafond annuel 2025: 3 867,50 $)'
        : 'Mandatory retirement savings contribution (2025 maximum ceiling: $3,867.50)',
    },
    {
      id: 'ei',
      name: isFrench ? 'Cotisations Assurance-Emploi (AE)' : 'Employment Insurance (EI Premiums)',
      shortName: 'EI / AE',
      value: ei,
      weight: eiWeight,
      color: '#d97706',
      line: 'Line 31200',
      box: 'T4 Box 18',
      icon: Shield,
      description: isFrench
        ? 'Primes de protection pour le chômage et prestations parentales (Plafond annuel 2025: 1 049,12 $)'
        : 'Federal insurance protection against job loss and parental leave (2025 max: $1,049.12)',
    },
  ];

  const hasZeroTotal = totalRemittance === 0;

  return (
    <div
      id="tax-calculation-breakdown-visualization"
      className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5"
    >
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              {isFrench ? 'Répartition Fiscale & Charges Sociales' : 'Statutory Deductions & Tax Weights'}
            </span>
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
            {isFrench
              ? 'Poids relatifs : Impôt sur le revenu, RPC et AE'
              : 'Tax Breakdown: Income Tax vs. CPP vs. EI'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isFrench
              ? 'Visualisation comparative des charges fiscales et cotisations sociales obligatoires prélevées au Canada.'
              : 'Comparative distribution showing relative proportions of income tax liability vs. social contributions.'}
          </p>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto shrink-0">
          <button
            id="view-donut-chart-btn"
            type="button"
            onClick={() => setChartType('donut')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              chartType === 'donut'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5 text-[#064e3b]" />
            <span>{isFrench ? 'Circulaire (Poids)' : 'Donut Chart'}</span>
          </button>
          <button
            id="view-bar-chart-btn"
            type="button"
            onClick={() => setChartType('bar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              chartType === 'bar'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#0b1f3a]" />
            <span>{isFrench ? 'Barres Comparatives' : 'Bar Comparison'}</span>
          </button>
        </div>
      </div>

      {hasZeroTotal ? (
        <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6 space-y-2">
          <Info className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">
            {isFrench ? 'Aucune retenue ou impôt calculé pour le moment' : 'No Tax or Remittances Calculated Yet'}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isFrench
              ? 'Ajoutez un feuillet T4 à l’étape 5 ou chargez les données démo pour visualiser la répartition entre impôt, RPC et assurance-emploi.'
              : 'Add a T4 slip in Step 5 or load sample data to explore the relative distribution of Income Tax, CPP, and EI.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Main Visual Chart */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200">
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'donut' ? (
                  <PieChart>
                    <Tooltip content={<CustomTooltip isFrench={isFrench} />} />
                    <Pie
                      data={breakdownItems}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="#ffffff"
                    >
                      {breakdownItems.map((entry) => (
                        <Cell key={`cell-${entry.id}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                ) : (
                  <BarChart
                    data={breakdownItems}
                    margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
                    layout="horizontal"
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      tick={{ fill: '#475569', fontSize: 11 }}
                      tickFormatter={(val) => `$${Number(val).toLocaleString('en-CA')}`}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip content={<CustomTooltip isFrench={isFrench} />} />
                    <Bar
                      dataKey="value"
                      radius={[8, 8, 0, 0]}
                    >
                      {breakdownItems.map((entry) => (
                        <Cell key={`bar-${entry.id}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Total Remittance Banner */}
            <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
              <div className="flex items-center space-x-2">
                <span className="font-semibold">
                  {isFrench ? 'Total des retenues & obligations fiscales :' : 'Total Combined Tax & Remittances:'}
                </span>
                <span className="font-mono font-extrabold text-slate-900 text-sm">
                  ${totalRemittance.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {isFrench ? 'Impôt net formaté :' : 'Formatted Net Tax:'}{' '}
                <span className="font-bold text-[#0b1f3a]">${formattedTax}</span>
              </div>
            </div>
          </div>

          {/* Detailed Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {breakdownItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="rounded-xl p-4 border transition-all hover:shadow-xs relative overflow-hidden bg-white"
                  style={{ borderColor: `${item.color}30` }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: item.color }}
                  />

                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: item.color }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs leading-tight">
                          {item.shortName}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500">
                          {item.line}
                        </span>
                      </div>
                    </div>

                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono text-white shrink-0"
                      style={{ backgroundColor: item.color }}
                    >
                      {(item.weight ?? 0).toFixed(1)}%
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="text-xl font-mono font-extrabold text-slate-900 tracking-tight">
                      ${item.value.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Progress bar representing weight */}
                  <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(2, item.weight))}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* CRA Non-refundable Tax Credit Interaction Notice */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-950 flex items-start space-x-3">
            <TrendingUp className="w-4 h-4 text-[#064e3b] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>
                {isFrench
                  ? 'Double avantage fiscal des cotisations RPC et AE :'
                  : 'Double benefit of CPP & EI contributions:'}
              </strong>{' '}
              {isFrench
                ? 'Bien que le RPC et l’AE soient des cotisations sociales distinctes de l’impôt sur le revenu, elles génèrent toutes deux un crédit d’impôt non remboursable fédéral de 15 % (Lignes 30800 et 31200) qui réduit directement votre impôt sur le revenu à payer!'
                : 'While CPP and EI are distinct mandatory social safety contributions, every dollar paid also earns a 15% CRA non-refundable tax credit (Lines 30800 & 31200) that directly offsets and reduces your federal income tax!'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export const TaxBreakdownVisualization: React.FC<TaxBreakdownVisualizationProps> = (props) => {
  return (
    <ComponentErrorBoundary>
      <TaxBreakdownVisualizationInner {...props} />
    </ComponentErrorBoundary>
  );
};
