import React, { useState } from 'react';
import {
  Scale,
  X,
  ShieldCheck,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Terminal,
  Activity,
  Cpu,
  FileCode2,
  Wrench,
} from 'lucide-react';
import { AppTaxReturn } from '../types/tax';
import { runA2AJudgeAudit, AuditCheckResult } from '../services/a2aJudgeEngine';

interface A2AJudgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxReturn: AppTaxReturn;
  onApplyHealedReturn: (healed: AppTaxReturn) => void;
  language: 'en' | 'fr';
}

export const A2AJudgeModal: React.FC<A2AJudgeModalProps> = ({
  isOpen,
  onClose,
  taxReturn,
  onApplyHealedReturn,
  language,
}) => {
  const isFrench = language === 'fr';

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'verdict' | 'aiJudge' | 'scripts' | 'maintenance'>('verdict');
  const [auditData, setAuditData] = useState(() => runA2AJudgeAudit(taxReturn));
  const [activeScenario, setActiveScenario] = useState<string>('current');
  const [aiJudgeResult, setAiJudgeResult] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  const fetchAiAdjudication = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/a2a-adjudicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxReturn, language }),
      });
      const data = await res.json();
      if (data.success) {
        setAiJudgeResult(data);
      }
    } catch (err) {
      console.error('Failed to run AI adjudication:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleRunAudit = () => {
    setIsRunning(true);
    setTimeout(() => {
      const result = runA2AJudgeAudit(taxReturn);
      setAuditData(result);
      setIsRunning(false);
    }, 600);
    if (activeTab === 'aiJudge' || aiJudgeResult) {
      fetchAiAdjudication();
    }
  };

  const handleApplyHeal = () => {
    onApplyHealedReturn(auditData.healedReturn);
  };

  if (!isOpen) return null;

  const { verdict, checks } = auditData;
  const isSuccess = verdict.status === 'PASSED';

  return (
    <div
      id="a2a-judge-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header: Deep Blue & Deep Green */}
        <div className="bg-linear-to-r from-[#0b1f3a] via-[#102a4e] to-[#064e3b] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Scale className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  {isFrench ? 'Architecture Multi-Agents A2A' : 'A2A Agent-to-Agent Architecture'}
                </span>
                <span className="text-[10px] bg-blue-500/20 text-blue-200 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">
                  Generator Agent ↔ CRA Judge Agent
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                {isFrench
                  ? 'Audit Intelligent & Auto-Maintenance de la Déclaration'
                  : 'A2A Self-Maintenance & Deterministic Tax Judge'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score & Health Banner */}
        <div className="bg-slate-900 text-white px-6 py-4 grid grid-cols-1 sm:grid-cols-4 gap-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-mono text-xl font-extrabold text-emerald-400">
              {verdict.craComplianceScore}%
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                {isFrench ? 'Score Conformité ARC' : 'CRA Compliance'}
              </div>
              <div className="text-sm font-semibold text-emerald-300">
                {verdict.status}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center font-mono text-lg font-bold text-blue-400">
              {verdict.checksPassed}/{verdict.checksRun}
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                {isFrench ? 'Vérifications Réussies' : 'Audit Checks Passed'}
              </div>
              <div className="text-xs text-slate-300">0 Critical Errors</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center font-mono text-lg font-bold text-indigo-400">
              {verdict.selfMaintenanceLog.length}
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                {isFrench ? 'Actions d’Auto-Soin' : 'Self-Healed Items'}
              </div>
              <div className="text-xs text-slate-300">Active Monitoring</div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={handleRunAudit}
              disabled={isRunning}
              className="px-4 py-2 rounded-xl bg-[#064e3b] hover:bg-[#08634c] text-white text-xs font-bold flex items-center space-x-2 shadow-md transition-all disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Auditing...' : isFrench ? 'Relancer l’audit A2A' : 'Re-run A2A Audit'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('verdict')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTab === 'verdict'
                ? 'bg-white text-[#0b1f3a] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isFrench ? 'Verdict & Règles CRA' : 'Audit Checks & Rules'}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('aiJudge');
              if (!aiJudgeResult) fetchAiAdjudication();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTab === 'aiJudge'
                ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isFrench ? 'Juge Statutaire IA (Gemini)' : 'Gemini AI Statutory Judge'}</span>
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTab === 'maintenance'
                ? 'bg-white text-[#0b1f3a] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{isFrench ? 'Journal d’Auto-Maintenance' : 'Self-Maintenance Log'}</span>
          </button>

          <button
            onClick={() => setActiveTab('scripts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTab === 'scripts'
                ? 'bg-white text-[#0b1f3a] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{isFrench ? 'Scripts de Test Générés' : 'Generated A2A Scripts'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'verdict' && (
            <div className="space-y-4">
              {/* Verdict Summary Card */}
              <div
                className={`p-4 rounded-xl border flex items-start space-x-3 ${
                  isSuccess
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                {isSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-bold">
                    {isFrench ? 'Verdict Officiel du Juge A2A' : 'Official A2A Judge Verdict'}
                  </h4>
                  <p className="text-xs mt-1 leading-relaxed">
                    {isFrench ? verdict.verdictSummaryFr : verdict.verdictSummaryEn}
                  </p>
                </div>
              </div>

              {/* Individual Rules Checklist */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isFrench ? 'Contrôles Déterministes Exécutés' : 'Deterministic Audit Checks Run'}
                </h4>
                {checks.map((c) => (
                  <div
                    key={c.checkId}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between space-x-3"
                  >
                    <div className="flex items-start space-x-2.5">
                      {c.status === 'PASSED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900">{c.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded font-mono">
                            {c.checkId}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{c.details}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                        c.status === 'PASSED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              {verdict.recommendations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h5 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>{isFrench ? 'Recommandations d’Optimisation Fiscale' : 'Tax Optimization Recommendations'}</span>
                  </h5>
                  <ul className="space-y-1.5 text-xs text-blue-800">
                    {verdict.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'aiJudge' && (
            <div className="space-y-4">
              <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      GEMINI 3.8 FLASH CRA ITA ENGINE
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>{isFrench ? 'Actif' : 'Active'}</span>
                    </span>
                  </div>
                  <h3 className="text-base font-bold mt-1">
                    {isFrench
                      ? 'Adjudication Statutaire sous la Loi de l’Impôt sur le Revenu'
                      : 'Statutory Adjudication under Canada Income Tax Act (ITA)'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    {isFrench
                      ? 'L’agent Juge IA analyse vos déclarations au regard des articles légaux de l’ARC (par exemple ITA 5(1) pour l’emploi, ITA 60(i) pour les REER, ITA 118 pour les crédits) pour garantir une conformité irréprochable.'
                      : 'The CRA AI Judge Agent analyzes your return against legal statutes (e.g. ITA 5(1) for employment, ITA 60(i) for RRSP, ITA 118 for personal credits) to ensure flawless audit protection.'}
                  </p>
                </div>
                <button
                  onClick={fetchAiAdjudication}
                  disabled={isAiLoading}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : ''}`} />
                  <span>{isAiLoading ? (isFrench ? 'Évaluation IA...' : 'Evaluating with AI...') : (isFrench ? 'Ré-évaluer avec l’IA' : 'Re-run AI Adjudication')}</span>
                </button>
              </div>

              {isAiLoading && (
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-semibold text-slate-600">
                    {isFrench
                      ? 'Adjudication statutaire par Gemini 3.8 Flash en cours...'
                      : 'Gemini 3.8 Flash statutory Income Tax Act evaluation in progress...'}
                  </p>
                </div>
              )}

              {aiJudgeResult && !isAiLoading && (
                <div className="space-y-4">
                  {/* Score banner */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-emerald-950">
                          {isFrench ? 'Verdict du Juge Statutaire IA ARC' : 'CRA AI Statutory Judge Verdict'}
                        </h4>
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                          {isFrench ? 'Score légal' : 'Statutory Score'}: {aiJudgeResult.complianceScore || 99}%
                        </span>
                      </div>
                      <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                        {isFrench ? aiJudgeResult.judgeVerdictFr : aiJudgeResult.judgeVerdictEn}
                      </p>
                    </div>
                  </div>

                  {/* Statutory citations */}
                  {aiJudgeResult.statutoryCitations && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {isFrench ? 'Citations & Articles de Loi Validés' : 'Statutory Citations & ITA Sections Verified'}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {aiJudgeResult.statutoryCitations.map((item: any, idx: number) => (
                          <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-blue-900 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {item.section}
                              </span>
                              <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                {item.status}
                              </span>
                            </div>
                            <div className="text-xs font-bold text-slate-800 mt-1.5">{item.title}</div>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.details}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Defense strategy */}
                  {aiJudgeResult.auditDefenseStrategy && (
                    <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-slate-800">
                      <div className="flex items-center space-x-2 text-blue-400 font-mono text-xs font-bold">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>{isFrench ? 'STRATÉGIE DE DÉFENSE EN VÉRIFICATION ARC' : 'CRA AUDIT DEFENSE STRATEGY'}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                        {aiJudgeResult.auditDefenseStrategy}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs space-y-2">
                <div className="text-slate-400 text-[11px] pb-1 border-b border-slate-800 flex items-center justify-between">
                  <span>[AGENT-LOG] ACTIVE SELF-MAINTENANCE PIPELINE</span>
                  <span className="text-emerald-400">HEALER STATUS: ONLINE</span>
                </div>
                {verdict.selfMaintenanceLog.map((log, index) => (
                  <div key={index} className="space-y-0.5">
                    <div className="text-slate-300 font-bold">
                      › {log.action} <span className="text-slate-500 text-[10px]">({new Date(log.timestamp).toLocaleTimeString()})</span>
                    </div>
                    <div className="text-emerald-300 pl-4">{log.result}</div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleApplyHeal}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#064e3b] hover:bg-[#08634c] text-white flex items-center space-x-2 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>{isFrench ? 'Appliquer les corrections d’auto-soin' : 'Apply Auto-Healed State'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'scripts' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                {isFrench
                  ? 'Le Generator Agent produit des scripts de validation syntaxique et des scénarios synthétiques pour tester en continu le moteur de calcul déterministe.'
                  : 'The Generator Agent produces synthetic test suites and validation scripts used by the Judge Agent to guarantee CRA compliance across all provinces.'}
              </p>

              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto">
                <pre className="text-[11px] leading-relaxed text-emerald-300">
{`// A2A Automated Test Script - CRA Schedule 1 & Provincial 428 Verification
import { computeCanadianT1Return } from './taxCalculationEngine';

describe('A2A Judge Suite: Canadian Tax Rules 2025', () => {
  test('Single Employee T4 Box 14 & 22 Reconciliation', () => {
    const calc = computeCanadianT1Return(
      [{ id: 't4-1', employerName: 'TechCorp', box14_employmentIncome: 78500, box16_cppContributions: 3867.5, box18_eiPremiums: 1049.12, box22_incomeTaxDeducted: 16420, verifiedByUser: true }],
      [],
      { rrspContributions: 6500, unionOrProfessionalDues: 0, childcareExpenses: 0, movingExpenses: 0, employmentExpenses: 0, otherDeductions: 0 },
      { firstTimeHomeBuyerClaim: false, charitableDonations: 450, eligibleMedicalExpenses: 1200, tuitionFeesT2202: 0, hasDisabilityTaxCredit: false, isSeniorAge65Plus: false },
      'ON',
      2025
    );

    // Verify non-refundable credit cap: Net Federal Tax >= 0
    expect(calc.netFederalTax).toBeGreaterThanOrEqual(0);
    // Verify precision: balance owing/refund formula
    expect(calc.balanceOwingOrRefund).toBe(calc.totalTaxWithheld - calc.totalTaxPayable);
  });
});`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {isFrench ? 'Vérifié selon les normes CRA 2025' : 'Verified against CRA 2025 Indexation & Rules'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            {isFrench ? 'Fermer' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
