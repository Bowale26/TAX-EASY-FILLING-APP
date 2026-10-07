import React, { useState, useMemo } from 'react';
import {
  User,
  Shield,
  MapPin,
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Vote,
  HelpCircle,
} from 'lucide-react';
import { AppTaxReturn, ProvinceCode, MaritalStatus } from '../types/tax';
import { PROVINCES_LIST } from '../services/taxRules';
import { validatePersonalInfo } from '../utils/personalValidationUtils';

interface StepPersonalProps {
  taxReturn: AppTaxReturn;
  onUpdateTaxReturn: (updated: Partial<AppTaxReturn>) => void;
  onNext: () => void;
  language: 'en' | 'fr';
}

export const StepPersonal: React.FC<StepPersonalProps> = ({
  taxReturn,
  onUpdateTaxReturn,
  onNext,
  language,
}) => {
  const isFrench = language === 'fr';
  const [showSin, setShowSin] = useState(false);

  const personal = taxReturn.personal;

  // Helper validation for required CRA fields (SIN format, province presence, etc.)
  const validation = useMemo(() => validatePersonalInfo(personal), [personal]);

  const handleChange = (field: keyof typeof personal, value: any) => {
    onUpdateTaxReturn({
      personal: {
        ...personal,
        [field]: value,
      },
    });
  };

  const isQuebec = personal.province === 'QC';

  const renderFieldWarning = (fieldKey: string) => {
    const warning = validation.warningsByField[fieldKey];
    if (!warning) return null;

    return (
      <div
        id={`personal-warning-${fieldKey}`}
        className="flex items-center space-x-1.5 text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-[11px] font-medium mt-1.5 shadow-2xs"
        role="alert"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>{isFrench ? warning.messageFr : warning.messageEn}</span>
      </div>
    );
  };

  return (
    <div id="step-personal-view" className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-[#0b1f3a] text-white flex items-center justify-center font-bold">
            <User className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isFrench ? 'Renseignements Personnels du Déclarant' : 'Taxpayer Personal Information'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {isFrench
                ? 'Ces informations identifient votre déclaration auprès de l’Agence du revenu du Canada (ARC).'
                : 'Identifies your T1 return with the Canada Revenue Agency (CRA).'}
            </p>
          </div>
        </div>

        {/* Non-blocking Validation Status Banner */}
        <div className="pt-4">
          {validation.hasWarnings ? (
            <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold">
                    {isFrench ? 'Vérification non bloquante des renseignements :' : 'Non-Blocking Personal Info Review:'}
                  </span>
                  <span className="bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {validation.warningCount} {isFrench ? 'champ(s) à vérifier' : 'item(s) flagged'}
                  </span>
                </div>
                <p className="mt-0.5 text-amber-800 leading-snug">
                  {isFrench
                    ? 'Certains champs obligatoires de l’ARC nécessitent votre attention (ex. : format du NAS ou province). Vous pouvez continuer librement, mais ils devront être valides pour la transmission Netfile finale.'
                    : 'Some required CRA identification fields are missing or need format correction (e.g. SIN format or province). You can continue through your return freely, but these must be completed prior to Netfile transmission.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">
                {isFrench
                  ? 'Tous les renseignements d’identification du déclarant respectent les normes de l’ARC (NAS et province validés).'
                  : 'All taxpayer identification fields meet CRA standards (SIN and province validated).'}
              </span>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          {/* First Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <span>{isFrench ? 'Prénom légal' : 'Legal First Name'} *</span>
                {validation.warningsByField.firstName && (
                  <span
                    title={isFrench ? validation.warningsByField.firstName.messageFr : validation.warningsByField.firstName.messageEn}
                    className="inline-flex items-center text-amber-600 hover:text-amber-700 cursor-help"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  </span>
                )}
              </span>
            </label>
            <input
              type="text"
              value={personal.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              placeholder="e.g. Alex"
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 focus:ring-2 focus:ring-[#064e3b] focus:outline-hidden transition-colors ${
                validation.warningsByField.firstName
                  ? 'border-amber-300 bg-amber-50/30'
                  : 'border-slate-300'
              }`}
            />
            {renderFieldWarning('firstName')}
          </div>

          {/* Last Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <span>{isFrench ? 'Nom de famille' : 'Legal Last Name'} *</span>
                {validation.warningsByField.lastName && (
                  <span
                    title={isFrench ? validation.warningsByField.lastName.messageFr : validation.warningsByField.lastName.messageEn}
                    className="inline-flex items-center text-amber-600 hover:text-amber-700 cursor-help"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  </span>
                )}
              </span>
            </label>
            <input
              type="text"
              value={personal.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder="e.g. Morgan"
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 focus:ring-2 focus:ring-[#064e3b] focus:outline-hidden transition-colors ${
                validation.warningsByField.lastName
                  ? 'border-amber-300 bg-amber-50/30'
                  : 'border-slate-300'
              }`}
            />
            {renderFieldWarning('lastName')}
          </div>

          {/* SIN */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <span>{isFrench ? 'Numéro d’assurance sociale (NAS)' : 'Social Insurance Number (SIN)'} *</span>
                {validation.warningsByField.sin && (
                  <span
                    title={isFrench ? validation.warningsByField.sin.messageFr : validation.warningsByField.sin.messageEn}
                    className="inline-flex items-center text-amber-600 hover:text-amber-700 cursor-help"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setShowSin(!showSin)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center space-x-1"
              >
                {showSin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showSin ? (isFrench ? 'Masquer' : 'Hide') : (isFrench ? 'Afficher' : 'Show')}</span>
              </button>
            </label>
            <div className="relative">
              <input
                type={showSin ? 'text' : 'password'}
                value={personal.sin}
                onChange={(e) => handleChange('sin', e.target.value)}
                placeholder="000-000-000"
                maxLength={11}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-[#064e3b] focus:outline-hidden transition-colors ${
                  validation.warningsByField.sin
                    ? 'border-amber-300 bg-amber-50/30'
                    : 'border-slate-300'
                }`}
              />
              <Shield className="w-4 h-4 text-emerald-600 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
              <span>{isFrench ? 'Chiffré de bout en bout • Masqué' : 'Encrypted • Format: 9 digits'}</span>
              <span>CRA Luhn Validated</span>
            </div>
            {renderFieldWarning('sin')}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <span>{isFrench ? 'Date de naissance' : 'Date of Birth'} *</span>
                {validation.warningsByField.dateOfBirth && (
                  <span
                    title={isFrench ? validation.warningsByField.dateOfBirth.messageFr : validation.warningsByField.dateOfBirth.messageEn}
                    className="inline-flex items-center text-amber-600 hover:text-amber-700 cursor-help"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  </span>
                )}
              </span>
            </label>
            <input
              type="date"
              value={personal.dateOfBirth}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 focus:ring-2 focus:ring-[#064e3b] focus:outline-hidden transition-colors ${
                validation.warningsByField.dateOfBirth
                  ? 'border-amber-300 bg-amber-50/30'
                  : 'border-slate-300'
              }`}
            />
            {renderFieldWarning('dateOfBirth')}
          </div>

          {/* Marital Status */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {isFrench ? 'État civil au 31 décembre' : 'Marital Status on Dec 31'} *
            </label>
            <select
              value={personal.maritalStatus}
              onChange={(e) => handleChange('maritalStatus', e.target.value as MaritalStatus)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#064e3b] focus:outline-hidden"
            >
              <option value="single">{isFrench ? 'Célibataire' : 'Single'}</option>
              <option value="married">{isFrench ? 'Marié(e)' : 'Married'}</option>
              <option value="common_law">{isFrench ? 'Conjoint(e) de fait' : 'Common-Law'}</option>
              <option value="separated">{isFrench ? 'Séparé(e)' : 'Separated'}</option>
              <option value="divorced">{isFrench ? 'Divorcé(e)' : 'Divorced'}</option>
              <option value="widowed">{isFrench ? 'Veuf/Veuve' : 'Widowed'}</option>
            </select>
          </div>

          {/* Province of Residence */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <span>{isFrench ? 'Province ou territoire de résidence (au 31 déc.)' : 'Province / Territory of Residence (Dec 31)'} *</span>
                {validation.warningsByField.province && (
                  <span
                    title={isFrench ? validation.warningsByField.province.messageFr : validation.warningsByField.province.messageEn}
                    className="inline-flex items-center text-amber-600 hover:text-amber-700 cursor-help"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  </span>
                )}
              </span>
            </label>
            <select
              value={personal.province}
              onChange={(e) => handleChange('province', e.target.value as ProvinceCode)}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 focus:ring-2 focus:ring-[#064e3b] focus:outline-hidden font-semibold transition-colors ${
                validation.warningsByField.province
                  ? 'border-amber-300 bg-amber-50/30'
                  : 'border-slate-300'
              }`}
            >
              {PROVINCES_LIST.map((prov) => (
                <option key={prov.code} value={prov.code}>
                  {prov.code} — {isFrench ? prov.nameFr : prov.nameEn}
                </option>
              ))}
            </select>
            {renderFieldWarning('province')}
          </div>
        </div>

        {/* Quebec Notice if Selected */}
        {isQuebec && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold">
                {isFrench ? 'Avis particulier pour les résidents du Québec :' : 'Special Notice for Quebec Residents:'}
              </h5>
              <p className="mt-0.5 leading-relaxed">
                {isFrench
                  ? 'Le Québec perçoit son propre impôt provincial via Revenu Québec (déclaration TP-1). Cette application calcule l’impôt fédéral T1 avec l’abattement du Québec de 16,5 %. Une déclaration provinciale distincte auprès de Revenu Québec est requise.'
                  : 'Quebec administers its own provincial tax return through Revenu Québec (TP-1). This application calculates your Federal T1 return including the 16.5% Quebec Abatement. A separate provincial filing with Revenu Québec is required.'}
              </p>
            </div>
          </div>
        )}

        {/* Address */}
        <div className="pt-4 mt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              {isFrench ? 'Adresse postale' : 'Mailing Street Address'}
            </label>
            <input
              type="text"
              value={personal.streetAddress}
              onChange={(e) => handleChange('streetAddress', e.target.value)}
              placeholder="e.g. 123 University Avenue, Apt 4B"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#064e3b] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {isFrench ? 'Ville' : 'City'}
            </label>
            <input
              type="text"
              value={personal.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="e.g. Toronto"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#064e3b] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <span>{isFrench ? 'Code postal' : 'Postal Code'}</span>
                {validation.warningsByField.postalCode && (
                  <span
                    title={isFrench ? validation.warningsByField.postalCode.messageFr : validation.warningsByField.postalCode.messageEn}
                    className="inline-flex items-center text-amber-600 hover:text-amber-700 cursor-help"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  </span>
                )}
              </span>
            </label>
            <input
              type="text"
              value={personal.postalCode}
              onChange={(e) => handleChange('postalCode', e.target.value.toUpperCase())}
              placeholder="e.g. M5H 2M9"
              maxLength={7}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl uppercase font-mono text-slate-900 focus:ring-2 focus:ring-[#064e3b] focus:outline-hidden transition-colors ${
                validation.warningsByField.postalCode
                  ? 'border-amber-300 bg-amber-50/30'
                  : 'border-slate-300'
              }`}
            />
            {renderFieldWarning('postalCode')}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {isFrench ? 'Numéro de téléphone' : 'Contact Phone'}
            </label>
            <input
              type="tel"
              value={personal.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="(416) 555-0199"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#064e3b] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <span>{isFrench ? 'Courriel' : 'Email Address'}</span>
                {validation.warningsByField.email && (
                  <span
                    title={isFrench ? validation.warningsByField.email.messageFr : validation.warningsByField.email.messageEn}
                    className="inline-flex items-center text-amber-600 hover:text-amber-700 cursor-help"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  </span>
                )}
              </span>
            </label>
            <input
              type="email"
              value={personal.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="alex.morgan@example.ca"
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 focus:ring-2 focus:ring-[#064e3b] focus:outline-hidden transition-colors ${
                validation.warningsByField.email
                  ? 'border-amber-300 bg-amber-50/30'
                  : 'border-slate-300'
              }`}
            />
            {renderFieldWarning('email')}
          </div>
        </div>

        {/* Elections Canada Checkbox */}
        <div className="pt-4 mt-4 border-t border-slate-200">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={personal.electionsCanadaConsent}
              onChange={(e) => handleChange('electionsCanadaConsent', e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-[#064e3b] focus:ring-[#064e3b]"
            />
            <div className="text-xs text-slate-700">
              <span className="font-semibold flex items-center space-x-1">
                <Vote className="w-3.5 h-3.5 text-blue-600 inline" />
                <span>{isFrench ? 'Élections Canada — Autorisation' : 'Elections Canada Consent'}</span>
              </span>
              <p className="text-slate-500 mt-0.5">
                {isFrench
                  ? 'Comme citoyen canadien, j’autorise l’Agence du revenu du Canada à transmettre mon nom, mon adresse et ma date de naissance à Élections Canada pour la mise à jour du Registre national des électeurs.'
                  : 'As a Canadian citizen, I authorize the CRA to provide my name, address, and date of birth to Elections Canada to update the National Register of Electors.'}
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Navigation (Non-blocking: Always allows progression) */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-slate-500">
          {validation.hasWarnings ? (
            <span className="text-amber-700 font-medium flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                {isFrench
                  ? 'Avertissements non bloquants : vous pouvez avancer et corriger ces champs plus tard.'
                  : 'Non-blocking notice: You can proceed and update these fields anytime before Netfile.'}
              </span>
            </span>
          ) : (
            <span className="text-emerald-700 font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{isFrench ? 'Renseignements complets' : 'Identification complete'}</span>
            </span>
          )}
        </div>

        <button
          onClick={onNext}
          id="personal-continue-btn"
          className="px-6 py-3 rounded-xl bg-[#064e3b] hover:bg-[#08634c] text-white font-bold text-sm flex items-center space-x-2 shadow-md transition-all cursor-pointer"
        >
          <span>{isFrench ? 'Passer à la Famille & Personnes à Charge' : 'Continue to Family & Dependants'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


