import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Building,
  DollarSign,
  Briefcase,
  PiggyBank,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  Save,
} from 'lucide-react';
import { T4Slip, OtherIncomeSlip } from '../types/tax';

export type EditableSlip =
  | { type: 'T4'; slip: T4Slip }
  | { type: 'T4A'; slip: OtherIncomeSlip }
  | { type: 'T5'; slip: OtherIncomeSlip };

interface SlipEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  slipData: EditableSlip | null;
  onSaveT4: (updated: T4Slip) => void;
  onSaveOtherSlip: (updated: OtherIncomeSlip) => void;
  language: 'en' | 'fr';
}

export const SlipEditModal: React.FC<SlipEditModalProps> = ({
  isOpen,
  onClose,
  slipData,
  onSaveT4,
  onSaveOtherSlip,
  language,
}) => {
  const isFrench = language === 'fr';

  const [t4Form, setT4Form] = useState<T4Slip | null>(null);
  const [otherForm, setOtherForm] = useState<OtherIncomeSlip | null>(null);

  useEffect(() => {
    if (!slipData) {
      setT4Form(null);
      setOtherForm(null);
      return;
    }
    if (slipData.type === 'T4') {
      setT4Form({ ...slipData.slip });
      setOtherForm(null);
    } else {
      setOtherForm({
        ...slipData.slip,
        amounts: { ...(slipData.slip.amounts || {}) },
      });
      setT4Form(null);
    }
  }, [slipData]);

  if (!isOpen || !slipData) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (slipData.type === 'T4' && t4Form) {
      onSaveT4(t4Form);
      onClose();
    } else if (
      (slipData.type === 'T4A' || slipData.type === 'T5') &&
      otherForm
    ) {
      onSaveOtherSlip(otherForm);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between text-white ${
            slipData.type === 'T4'
              ? 'bg-linear-to-r from-[#064e3b] to-[#0b1f3a]'
              : slipData.type === 'T4A'
              ? 'bg-linear-to-r from-blue-900 to-indigo-950'
              : 'bg-linear-to-r from-amber-800 to-amber-950'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center font-bold text-white text-sm border border-white/20">
              {slipData.type}
            </div>
            <div>
              <h3 className="text-base font-bold">
                {slipData.type === 'T4'
                  ? isFrench
                    ? 'Modifier le feuillet T4 — Revenus d’emploi'
                    : 'Edit T4 Slip — Statement of Remuneration Paid'
                  : slipData.type === 'T4A'
                  ? isFrench
                    ? 'Modifier le feuillet T4A — Pension, rentes & autres'
                    : 'Edit T4A Slip — Pension, Retirement & Annuity'
                  : isFrench
                  ? 'Modifier le feuillet T5 — Revenus de placements'
                  : 'Edit T5 Slip — Statement of Investment Income'}
              </h3>
              <p className="text-xs text-white/80">
                {isFrench
                  ? 'Mettez à jour les montants des cases officielles de l’Agence du revenu du Canada.'
                  : 'Update official CRA box values to recalculate your T1 return.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* T4 EDIT FORM */}
          {slipData.type === 'T4' && t4Form && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {isFrench ? 'Nom de l’employeur' : 'Employer Name'} *
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={t4Form.employerName}
                    onChange={(e) =>
                      setT4Form({ ...t4Form, employerName: e.target.value })
                    }
                    placeholder="e.g. Shopify, RBC, Canadian Tire"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Box 14 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {isFrench
                      ? 'Case 14 — Revenus d’emploi (Ligne 10100)'
                      : 'Box 14 — Employment Income (Line 10100)'} *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={t4Form.box14_employmentIncome}
                      onChange={(e) =>
                        setT4Form({
                          ...t4Form,
                          box14_employmentIncome: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Box 22 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {isFrench
                      ? 'Case 22 — Impôt sur le revenu retenu (Ligne 43700)'
                      : 'Box 22 — Income Tax Deducted (Line 43700)'} *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={t4Form.box22_incomeTaxDeducted}
                      onChange={(e) =>
                        setT4Form({
                          ...t4Form,
                          box22_incomeTaxDeducted: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Box 16 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {isFrench
                      ? 'Case 16 — Cotisations de l’employé au RPC (Ligne 30800)'
                      : 'Box 16 — CPP Contributions (Line 30800)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={t4Form.box16_cppContributions}
                      onChange={(e) =>
                        setT4Form({
                          ...t4Form,
                          box16_cppContributions: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Box 18 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {isFrench
                      ? 'Case 18 — Cotisations de l’employé à l’AE (Ligne 31200)'
                      : 'Box 18 — EI Premiums (Line 31200)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={t4Form.box18_eiPremiums}
                      onChange={(e) =>
                        setT4Form({
                          ...t4Form,
                          box18_eiPremiums: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Box 20 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {isFrench
                      ? 'Case 20 — Cotisations à un RPA (Ligne 20700)'
                      : 'Box 20 — RPP Contributions (Line 20700)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={t4Form.box20_rppContributions || 0}
                      onChange={(e) =>
                        setT4Form({
                          ...t4Form,
                          box20_rppContributions: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Box 44 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {isFrench
                      ? 'Case 44 — Cotisations syndicales (Ligne 21200)'
                      : 'Box 44 — Union Dues (Line 21200)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={t4Form.box44_unionDues || 0}
                      onChange={(e) =>
                        setT4Form({
                          ...t4Form,
                          box44_unionDues: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* T4A EDIT FORM */}
          {slipData.type === 'T4A' && otherForm && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {isFrench ? 'Émetteur / Régime de retraite' : 'Payer / Pension Administrator'} *
                </label>
                <div className="relative">
                  <PiggyBank className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={otherForm.payerName}
                    onChange={(e) =>
                      setOtherForm({ ...otherForm, payerName: e.target.value })
                    }
                    placeholder="e.g. Ontario Teachers' Pension Plan, Sun Life"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Box 016 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {isFrench
                      ? 'Case 016 — Pension ou allocation de retraite (Ligne 11500)'
                      : 'Box 016 — Pension or Superannuation (Line 11500)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={otherForm.amounts?.box016_pension || 0}
                      onChange={(e) =>
                        setOtherForm({
                          ...otherForm,
                          amounts: {
                            ...otherForm.amounts,
                            box016_pension: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Box 022 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {isFrench
                      ? 'Case 022 — Impôt retenu à la source (Ligne 43700)'
                      : 'Box 022 — Income Tax Deducted (Line 43700)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={otherForm.amounts?.box022_taxDeducted || 0}
                      onChange={(e) =>
                        setOtherForm({
                          ...otherForm,
                          amounts: {
                            ...otherForm.amounts,
                            box022_taxDeducted: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Box 028 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {isFrench
                      ? 'Case 028 — Autres revenus (Ligne 13000)'
                      : 'Box 028 — Other Income (Line 13000)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={otherForm.amounts?.box028_otherIncome || 0}
                      onChange={(e) =>
                        setOtherForm({
                          ...otherForm,
                          amounts: {
                            ...otherForm.amounts,
                            box028_otherIncome: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Box 105 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {isFrench
                      ? 'Case 105 — Bourses d’études ou de perfectionnement'
                      : 'Box 105 — Scholarships, Bursaries & Fellowships'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={otherForm.amounts?.box105_scholarships || 0}
                      onChange={(e) =>
                        setOtherForm({
                          ...otherForm,
                          amounts: {
                            ...otherForm.amounts,
                            box105_scholarships: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* T5 EDIT FORM */}
          {slipData.type === 'T5' && otherForm && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {isFrench ? 'Institution financière / Banque' : 'Financial Institution / Bank'} *
                </label>
                <div className="relative">
                  <TrendingUp className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={otherForm.payerName}
                    onChange={(e) =>
                      setOtherForm({ ...otherForm, payerName: e.target.value })
                    }
                    placeholder="e.g. TD Bank, RBC Direct Investing, Wealthsimple"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Box 13 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {isFrench
                      ? 'Case 13 — Intérêts de sources canadiennes (Ligne 12100)'
                      : 'Box 13 — Interest from Canadian Sources (Line 12100)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={otherForm.amounts?.box13_interest || 0}
                      onChange={(e) =>
                        setOtherForm({
                          ...otherForm,
                          amounts: {
                            ...otherForm.amounts,
                            box13_interest: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Box 10 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {isFrench
                      ? 'Case 10 — Dividendes déterminés réels'
                      : 'Box 10 — Actual Eligible Dividends'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={otherForm.amounts?.box10_eligibleDividends || 0}
                      onChange={(e) =>
                        setOtherForm({
                          ...otherForm,
                          amounts: {
                            ...otherForm.amounts,
                            box10_eligibleDividends: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 text-sm focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Box 11 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {isFrench
                      ? 'Case 11 — Dividendes imposables (Ligne 12000)'
                      : 'Box 11 — Taxable Amount of Dividends (Line 12000)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={otherForm.amounts?.box11_taxableDividends || 0}
                      onChange={(e) =>
                        setOtherForm({
                          ...otherForm,
                          amounts: {
                            ...otherForm.amounts,
                            box11_taxableDividends: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 text-sm focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Box 24 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {isFrench
                      ? 'Case 24 — Gains en capital imposables (Ligne 12700)'
                      : 'Box 24 — Capital Gains (Line 12700)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={otherForm.amounts?.box24_capitalGains || 0}
                      onChange={(e) =>
                        setOtherForm({
                          ...otherForm,
                          amounts: {
                            ...otherForm.amounts,
                            box24_capitalGains: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 text-sm focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {isFrench ? 'Annuler' : 'Cancel'}
            </button>
            <button
              id="save-slip-modal-btn"
              type="submit"
              className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer ${
                slipData.type === 'T4'
                  ? 'bg-[#064e3b] hover:bg-[#08634c]'
                  : slipData.type === 'T4A'
                  ? 'bg-blue-800 hover:bg-blue-900'
                  : 'bg-amber-800 hover:bg-amber-900'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{isFrench ? 'Enregistrer les modifications' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
