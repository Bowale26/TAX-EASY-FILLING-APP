import React from 'react';
import {
  Users,
  Plus,
  Trash2,
  Heart,
  Baby,
  ArrowRight,
  Download,
  Printer,
} from 'lucide-react';
import { AppTaxReturn, Dependant } from '../types/tax';

interface StepFamilyProps {
  taxReturn: AppTaxReturn;
  onUpdateTaxReturn: (updated: Partial<AppTaxReturn>) => void;
  onNext: () => void;
  language: 'en' | 'fr';
}

export const StepFamily: React.FC<StepFamilyProps> = ({
  taxReturn,
  onUpdateTaxReturn,
  onNext,
  language,
}) => {
  const isFrench = language === 'fr';

  const hasSpouse =
    taxReturn.personal.maritalStatus === 'married' ||
    taxReturn.personal.maritalStatus === 'common_law';

  const dependantsList = taxReturn.dependants || [];

  const handleAddDependant = () => {
    const newDep: Dependant = {
      id: `dep-${Date.now()}`,
      firstName: '',
      lastName: '',
      relationship: 'child',
      dateOfBirth: '2018-01-01',
      hasDisability: false,
      childcareExpenseClaimed: 0,
    };
    onUpdateTaxReturn({
      dependants: [...dependantsList, newDep],
    });
  };

  const handleUpdateDependant = (id: string, field: keyof Dependant, val: any) => {
    const updated = dependantsList.map((dep) =>
      dep.id === id ? { ...dep, [field]: val } : dep
    );
    onUpdateTaxReturn({ dependants: updated });
  };

  const handleDeleteDependant = (id: string) => {
    const updated = dependantsList.filter((dep) => dep.id !== id);
    onUpdateTaxReturn({ dependants: updated });
  };

  return (
    <div id="step-family-view" className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#064e3b] text-white flex items-center justify-center font-bold">
              <Users className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isFrench ? 'Famille, Conjoint(e) & Personnes à Charge' : 'Family, Spouse & Dependants'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {isFrench
                  ? 'Permet de calculer le crédit pour conjoint, l’Allocation canadienne pour enfants (ACE) et le crédit pour TPS/TVH.'
                  : 'Unlocks the spousal amount, Canada Child Benefit (CCB), and provincial family credits.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 no-print shrink-0">
            <button
              id="export-family-doc-btn"
              onClick={() => {
                const lines = [
                  `FAMILY & DEPENDANTS SUMMARY (TAX YEAR ${taxReturn.taxYear})`,
                  `Taxpayer: ${taxReturn.personal.firstName} ${taxReturn.personal.lastName}`,
                  `Marital Status: ${taxReturn.personal.maritalStatus}`,
                  hasSpouse ? `Spouse SIN: ${taxReturn.personal.spouseSin || 'N/A'}` : 'No spouse declared',
                  `Dependants Count: ${dependantsList.length}`,
                  ...dependantsList.map(
                    (d, i) =>
                      `#${i + 1}: ${d.firstName} ${d.lastName} (${d.relationship}) - DOB: ${d.dateOfBirth} - Childcare: $${d.childcareExpenseClaimed || 0}`
                  ),
                ];
                const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `TaxEasy_Family_Summary_${taxReturn.taxYear}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>{isFrench ? 'Exporter' : 'Export Docs'}</span>
            </button>
            <button
              id="print-family-summary-btn"
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{isFrench ? 'Imprimer / PDF' : 'Print / PDF'}</span>
            </button>
          </div>
        </div>

        {/* Spouse Section (If Married or Common-law) */}
        {hasSpouse ? (
          <div className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm font-bold text-slate-900">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>{isFrench ? 'Renseignements sur votre conjoint(e)' : 'Spouse / Common-Law Partner Information'}</span>
              </div>
              <div className="flex items-center space-x-2 no-print">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center space-x-1 cursor-pointer"
                  title="Print spouse section"
                >
                  <Printer className="w-3 h-3 text-slate-600" />
                  <span>{isFrench ? 'Imprimer / PDF' : 'Print / PDF'}</span>
                </button>
                {Boolean(taxReturn.personal.spouseSin || taxReturn.personal.spouseNetIncome) && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateTaxReturn({
                        personal: {
                          ...taxReturn.personal,
                          spouseSin: '',
                          spouseNetIncome: 0,
                        },
                      })
                    }
                    className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-lg border border-rose-200 flex items-center space-x-1 cursor-pointer"
                    title="Clear spouse info"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{isFrench ? 'Effacer' : 'Clear / Delete'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isFrench ? 'Numéro d’assurance sociale (NAS) du conjoint' : 'Spouse Social Insurance Number (SIN)'}
                </label>
                <input
                  type="text"
                  value={taxReturn.personal.spouseSin || ''}
                  onChange={(e) =>
                    onUpdateTaxReturn({
                      personal: {
                        ...taxReturn.personal,
                        spouseSin: e.target.value,
                      },
                    })
                  }
                  placeholder="000-000-000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-[#064e3b]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isFrench ? 'Revenu net mondial du conjoint (Ligne 23600) ($)' : 'Spouse Net Income (Line 23600) ($)'}
                </label>
                <input
                  type="number"
                  value={taxReturn.personal.spouseNetIncome || ''}
                  onChange={(e) =>
                    onUpdateTaxReturn({
                      personal: {
                        ...taxReturn.personal,
                        spouseNetIncome: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-[#064e3b]"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-4 pb-2">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
              <span>
                {isFrench
                  ? 'État civil actuel : Célibataire, Divorcé(e), Séparé(e) ou Veuf/Veuve.'
                  : 'Current marital status: Single, Divorced, Separated, or Widowed.'}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold">
                {isFrench ? 'Pas de conjoint requis' : 'No spouse required'}
              </span>
            </div>
          </div>
        )}

        {/* Dependants Section */}
        <div className="pt-6 mt-6 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Baby className="w-5 h-5 text-[#064e3b]" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {isFrench ? 'Enfants et personnes à charge' : 'Children & Eligible Dependants'}
              </h3>
            </div>

            <div className="flex items-center space-x-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center space-x-1 cursor-pointer"
                title="Print dependants"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>{isFrench ? 'Imprimer / PDF' : 'Print / PDF'}</span>
              </button>

              <button
                onClick={handleAddDependant}
                className="px-3 py-1.5 bg-[#064e3b] hover:bg-[#08634c] text-white text-xs font-bold rounded-lg flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isFrench ? '+ Ajouter une personne' : '+ Add Dependant'}</span>
              </button>
            </div>
          </div>

          {dependantsList.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
              {isFrench
                ? 'Aucune personne à charge enregistrée. Si vous avez des enfants mineurs ou un parent âgé à charge, ajoutez-les pour maximiser vos crédits d’impôt.'
                : 'No dependants added. If you support children or care for an elderly relative, add them here for the Canada Caregiver Credit or Child Care deduction.'}
            </div>
          ) : (
            <div className="space-y-3">
              {dependantsList.map((dep) => (
                <div
                  key={dep.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs items-center"
                >
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      {isFrench ? 'Prénom' : 'First Name'}
                    </label>
                    <input
                      type="text"
                      value={dep.firstName}
                      onChange={(e) => handleUpdateDependant(dep.id, 'firstName', e.target.value)}
                      placeholder="e.g. Leo"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      {isFrench ? 'Date de naissance' : 'Date of Birth'}
                    </label>
                    <input
                      type="date"
                      value={dep.dateOfBirth}
                      onChange={(e) => handleUpdateDependant(dep.id, 'dateOfBirth', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      {isFrench ? 'Lien de parenté' : 'Relationship'}
                    </label>
                    <select
                      value={dep.relationship}
                      onChange={(e) =>
                        handleUpdateDependant(dep.id, 'relationship', e.target.value as any)
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                    >
                      <option value="child">{isFrench ? 'Enfant' : 'Child'}</option>
                      <option value="parent">{isFrench ? 'Parent âgé' : 'Parent'}</option>
                      <option value="grandchild">{isFrench ? 'Petit-enfant' : 'Grandchild'}</option>
                      <option value="other">{isFrench ? 'Autre' : 'Other'}</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-3 pt-3 sm:pt-4">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dep.hasDisability}
                        onChange={(e) =>
                          handleUpdateDependant(dep.id, 'hasDisability', e.target.checked)
                        }
                        className="rounded text-[#064e3b]"
                      />
                      <span className="text-[11px] text-slate-700">
                        {isFrench ? 'Handicap (CIPH)' : 'DTC Eligible'}
                      </span>
                    </label>

                    <button
                      onClick={() => handleDeleteDependant(dep.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-[#064e3b] hover:bg-[#08634c] text-white font-bold text-sm flex items-center space-x-2 shadow-md transition-all cursor-pointer"
        >
          <span>{isFrench ? 'Passer aux Revenus' : 'Continue to Income'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
