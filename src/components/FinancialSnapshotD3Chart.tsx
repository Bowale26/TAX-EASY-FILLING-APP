import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { AppTaxReturn } from '../types/tax';
import { computeCanadianT1Return } from '../services/taxCalculationEngine';
import { BarChart3, TrendingUp, DollarSign, ShieldCheck, HelpCircle } from 'lucide-react';

interface FinancialSnapshotD3ChartProps {
  taxReturn: AppTaxReturn;
  language: 'en' | 'fr';
}

interface FinancialBarData {
  id: string;
  key: string;
  label: string;
  subLabel: string;
  craLine: string;
  value: number;
  displayValue: string;
  color: string;
  gradientStart: string;
  gradientEnd: string;
  badge: string;
  isPositiveBalance?: boolean;
}

export const FinancialSnapshotD3Chart: React.FC<FinancialSnapshotD3ChartProps> = ({
  taxReturn,
  language,
}) => {
  const isFrench = language === 'fr';
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 600,
    height: 320,
  });
  const [activeBar, setActiveBar] = useState<FinancialBarData | null>(null);

  // Compute live tax figures
  const calc = useMemo(() => {
    return (
      taxReturn.calculation ||
      computeCanadianT1Return(
        taxReturn.t4Slips,
        taxReturn.otherSlips,
        taxReturn.deductions,
        taxReturn.credits,
        taxReturn.personal?.province,
        taxReturn.taxYear
      )
    );
  }, [taxReturn]);

  const taxableIncome = calc?.taxableIncome ?? 0;
  const totalCredits =
    (calc?.federalNonRefundableCreditsTotal ?? 0) + (calc?.provincialCreditsTotal ?? 0);
  const balanceOwingOrRefund = calc?.balanceOwingOrRefund ?? 0;
  const isRefund = calc?.isRefund ?? balanceOwingOrRefund >= 0;

  // Chart data structure
  const chartData: FinancialBarData[] = useMemo(() => {
    return [
      {
        id: 'taxable-income',
        key: 'taxableIncome',
        label: isFrench ? 'Revenu Imposable' : 'Taxable Income',
        subLabel: isFrench ? 'Base de calcul d’impôt' : 'Basis of tax brackets',
        craLine: 'CRA Line 26000',
        value: Math.max(0, taxableIncome),
        displayValue: `$${taxableIncome.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        color: '#1e3a8a', // Deep royal blue
        gradientStart: '#2563eb',
        gradientEnd: '#1e3a8a',
        badge: isFrench ? 'Ligne 26000' : 'Line 26000',
      },
      {
        id: 'total-credits',
        key: 'totalCredits',
        label: isFrench ? 'Crédits d’Impôt Totaux' : 'Total Credits',
        subLabel: isFrench ? 'Fédéral + Provincial' : 'Federal + Provincial credits',
        craLine: 'CRA Lines 35000 & 42800',
        value: Math.max(0, totalCredits),
        displayValue: `$${totalCredits.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        color: '#059669', // Emerald
        gradientStart: '#10b981',
        gradientEnd: '#059669',
        badge: isFrench ? 'Annexe 1' : 'Schedule 1',
      },
      {
        id: 'balance-result',
        key: 'balance',
        label: isRefund
          ? isFrench
            ? 'Remboursement Prévu'
            : 'Estimated Refund'
          : isFrench
          ? 'Solde Dû à Payer'
          : 'Balance Owing',
        subLabel: isRefund
          ? isFrench
            ? 'Dépôt direct de l’ARC'
            : 'Payable via direct deposit'
          : isFrench
          ? 'Paiement dû le 30 avril'
          : 'Due by April 30 deadline',
        craLine: isRefund ? 'CRA Line 48400' : 'CRA Line 48500',
        value: Math.abs(balanceOwingOrRefund),
        displayValue: `${isRefund ? '+' : '-'}$${Math.abs(balanceOwingOrRefund).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        color: isRefund ? '#047857' : '#e11d48', // Emerald or Crimson Rose
        gradientStart: isRefund ? '#34d399' : '#f43f5e',
        gradientEnd: isRefund ? '#047857' : '#be123c',
        badge: isRefund ? (isFrench ? 'Remboursement' : 'Refund') : (isFrench ? 'Solde Dû' : 'Owing'),
        isPositiveBalance: isRefund,
      },
    ];
  }, [isFrench, taxableIncome, totalCredits, balanceOwingOrRefund, isRefund]);

  // Handle ResizeObserver for dynamic canvas sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          // Adjust height based on available width
          const newHeight = width < 500 ? 280 : 320;
          setDimensions({ width, height: newHeight });
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Draw D3 Bar Chart
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const margin = {
      top: 35,
      right: 25,
      bottom: 55,
      left: dimensions.width < 500 ? 55 : 75,
    };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define Gradients
    const defs = svg.append('defs');

    chartData.forEach((d) => {
      const gradient = defs
        .append('linearGradient')
        .attr('id', `gradient-${d.id}`)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      gradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d.gradientStart);

      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', d.gradientEnd);
    });

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(chartData.map((d) => d.label))
      .range([0, innerWidth])
      .padding(dimensions.width < 500 ? 0.35 : 0.42);

    const maxValue = d3.max(chartData, (d) => d.value) || 1000;
    // Add 18% headroom for clean label placement
    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue * 1.18])
      .nice()
      .range([innerHeight, 0]);

    // Horizontal Grid Lines
    const yAxisGrid = d3
      .axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickFormat(() => '')
      .ticks(5);

    g.append('g')
      .attr('class', 'grid-lines text-slate-200 opacity-60')
      .call(yAxisGrid)
      .selectAll('line')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '3,3');

    g.select('.grid-lines').select('.domain').remove();

    // X Axis
    const xAxis = d3.axisBottom(xScale).tickSize(6);

    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', '#cbd5e1');
    xAxisGroup.selectAll('.tick line').attr('stroke', '#cbd5e1');
    xAxisGroup
      .selectAll('.tick text')
      .attr('font-size', dimensions.width < 500 ? '10px' : '11px')
      .attr('font-weight', '600')
      .attr('fill', '#334155')
      .attr('dy', '14px');

    // Y Axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => {
        const val = Number(d);
        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
        return `$${val}`;
      });

    const yAxisGroup = g.append('g').call(yAxis);
    yAxisGroup.select('.domain').remove();
    yAxisGroup.selectAll('.tick line').remove();
    yAxisGroup
      .selectAll('.tick text')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('fill', '#64748b')
      .attr('dx', '-6px');

    // Draw Bars
    const barGroups = g
      .selectAll('.bar-group')
      .data(chartData)
      .enter()
      .append('g')
      .attr('class', 'bar-group')
      .attr('cursor', 'pointer')
      .on('mouseenter', (_event, d) => {
        setActiveBar(d);
      })
      .on('mouseleave', () => {
        setActiveBar(null);
      });

    const barWidth = xScale.bandwidth();

    // Rectangles with rounded top corners
    barGroups
      .append('rect')
      .attr('x', (d) => xScale(d.label) || 0)
      .attr('width', barWidth)
      .attr('y', innerHeight)
      .attr('height', 0)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', (d) => `url(#gradient-${d.id})`)
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', 1)
      .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))')
      .transition()
      .duration(700)
      .ease(d3.easeCubicOut)
      .attr('y', (d) => yScale(d.value))
      .attr('height', (d) => Math.max(2, innerHeight - yScale(d.value)));

    // Value Labels on Top of Bars
    barGroups
      .append('text')
      .attr('x', (d) => (xScale(d.label) || 0) + barWidth / 2)
      .attr('y', innerHeight)
      .attr('text-anchor', 'middle')
      .attr('font-size', dimensions.width < 500 ? '10px' : '11px')
      .attr('font-weight', '700')
      .attr('font-family', 'monospace')
      .attr('fill', '#0f172a')
      .transition()
      .duration(700)
      .ease(d3.easeCubicOut)
      .attr('y', (d) => Math.max(14, yScale(d.value) - 8))
      .text((d) => d.displayValue);

    // Line tag badge above value
    barGroups
      .append('text')
      .attr('x', (d) => (xScale(d.label) || 0) + barWidth / 2)
      .attr('y', innerHeight)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('font-weight', '600')
      .attr('fill', '#64748b')
      .transition()
      .duration(700)
      .ease(d3.easeCubicOut)
      .attr('y', (d) => Math.max(0, yScale(d.value) - 22))
      .text((d) => d.badge);

  }, [chartData, dimensions]);

  return (
    <div
      id="financial-snapshot-d3-card"
      className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <BarChart3 className="w-5 h-5 text-indigo-700" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 text-base">
                {isFrench
                  ? 'Aperçu Financier Visuel (Graphique D3)'
                  : 'Financial Snapshot Breakdown (D3 Visualization)'}
              </h3>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                D3.js
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isFrench
                ? 'Comparaison visuelle du revenu imposable, des crédits déduits et du solde final d’impôt.'
                : 'Interactive comparison of Taxable Income vs. Total Tax Credits and final Refund / Owing balance.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-sans">
            {isFrench ? 'Année :' : 'Tax Year:'}
          </span>
          <span className="font-bold text-slate-900">{taxReturn.taxYear}</span>
          <span className="text-slate-300">•</span>
          <span className="font-bold text-slate-900">{taxReturn.personal.province}</span>
        </div>
      </div>

      {/* D3 SVG Container */}
      <div ref={containerRef} className="w-full relative overflow-hidden bg-slate-50/50 rounded-xl border border-slate-100 p-2">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full block overflow-visible"
        />

        {/* Hover / Active Bar Floating Callout */}
        {activeBar && (
          <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-xs text-white px-3 py-2 rounded-xl text-xs shadow-lg border border-slate-700 pointer-events-none transition-all duration-150 animate-in fade-in">
            <div className="flex items-center space-x-1.5 font-bold text-slate-200">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeBar.color }} />
              <span>{activeBar.label}</span>
            </div>
            <div className="font-mono text-base font-black text-white mt-0.5">
              {activeBar.displayValue}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center space-x-1">
              <span>{activeBar.craLine}</span>
              <span>•</span>
              <span>{activeBar.subLabel}</span>
            </div>
          </div>
        )}
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {chartData.map((item) => (
          <div
            key={item.id}
            onMouseEnter={() => setActiveBar(item)}
            onMouseLeave={() => setActiveBar(null)}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeBar?.id === item.id
                ? 'border-indigo-400 bg-indigo-50/40 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold text-slate-700">{item.label}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                {item.badge}
              </span>
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-slate-900">
              {item.displayValue}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">
              {item.subLabel}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
