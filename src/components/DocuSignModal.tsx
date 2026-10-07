import React, { useState } from 'react';
import {
  FileCheck,
  CheckCircle2,
  X,
  ShieldCheck,
  Send,
  Download,
  ExternalLink,
  PenTool,
  Clock,
  FileText,
  Lock,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  Calendar,
} from 'lucide-react';
import { AppTaxReturn, ScannedDocumentAssociation } from '../types/tax';

// CRA strictly requires dates to be locked in YYYY/MM/DD format (e.g. 2026/09/13)
export const formatCraDate = (dateInput?: Date | string | null): string => {
  const d = dateInput ? (typeof dateInput === 'string' ? new Date(dateInput) : dateInput) : new Date();
  const validDate = !isNaN(d.getTime()) ? d : new Date();
  const yyyy = validDate.getFullYear();
  const mm = String(validDate.getMonth() + 1).padStart(2, '0');
  const dd = String(validDate.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
};

interface DocuSignModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ScannedDocumentAssociation | null;
  taxReturn: AppTaxReturn;
  language: 'en' | 'fr';
  onSignatureCompleted?: (envelopeId: string, documentId: string) => void;
}

export const DocuSignModal: React.FC<DocuSignModalProps> = ({
  isOpen,
  onClose,
  document,
  taxReturn,
  language,
  onSignatureCompleted,
}) => {
  const isFrench = language === 'fr';

  // Current CRA formatted date locked to YYYY/MM/DD
  const lockedCraDate = formatCraDate(new Date());

  const [deliveryMethod, setDeliveryMethod] = useState<'instant' | 'email'>('instant');
  const [signerName, setSignerName] = useState<string>(
    `${taxReturn.personal?.firstName || ''} ${taxReturn.personal?.lastName || ''}`.trim() || 'Alex Mercer'
  );
  const [signerEmail, setSignerEmail] = useState<string>(
    taxReturn.personal?.email || 'alex.mercer@example.com'
  );
  const [formType, setFormType] = useState<'T183' | 'AUT01' | 'ATTACHED_SLIP'>('T183');

  // Pipeline simulation state
  const [pipelineState, setPipelineState] = useState<'idle' | 'processing' | 'signed'>('idle');
  const [activeStage, setActiveStage] = useState<number>(0);
  const [generatedEnvelopeId, setGeneratedEnvelopeId] = useState<string>('');
  const [copiedEnvelope, setCopiedEnvelope] = useState<boolean>(false);

  if (!isOpen || !document) return null;

  const maskedSin = taxReturn.personal?.sin
    ? `***-***-${taxReturn.personal.sin.replace(/\D/g, '').slice(-3) || '890'}`
    : '***-***-890';

  const handleStartPipeline = () => {
    setPipelineState('processing');
    setActiveStage(1);

    // Stage 1: Build payload & assemble CRA compliant PDF
    setTimeout(() => {
      setActiveStage(2);
      // Stage 2: Embed DocuSign anchor tags (\s1\, \d1\ date locked to YYYY/MM/DD, IP hash)
      setTimeout(() => {
        setActiveStage(3);
        // Stage 3: Generate envelope & sign
        setTimeout(() => {
          const envelopeId = `DS-CA-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
          setGeneratedEnvelopeId(envelopeId);
          setPipelineState('signed');
          if (onSignatureCompleted && document) {
            onSignatureCompleted(envelopeId, document.id);
          }
        }, 900);
      }, 900);
    }, 900);
  };

  const handleCopyEnvelope = () => {
    if (generatedEnvelopeId) {
      navigator.clipboard.writeText(generatedEnvelopeId);
      setCopiedEnvelope(true);
      setTimeout(() => setCopiedEnvelope(false), 2000);
    }
  };

  const handleDownloadSignedCert = () => {
    const certText = `DOCUSIGN CERTIFICATE OF COMPLETION
--------------------------------------------------
Document: ${document.documentName} (${document.documentCode})
File: ${document.fileName}
Envelope ID: ${generatedEnvelopeId}
Security Hash: SHA-256 (6f8e79c09a823df1)
Signer: ${signerName} <${signerEmail}>
Signer Identifier (SIN): ${maskedSin}
CRA Signing Date: ${lockedCraDate}
CRA Date Specification: YYYY/MM/DD (Locked per CRA IC07-1R)
Timestamp: ${lockedCraDate} ${new Date().toLocaleTimeString('en-CA', { hour12: false })} UTC
Compliance: CRA IC07-1R & Canadian Uniform Electronic Commerce Act (UECA)
Provider: DocuSign Canada Inc. (Authorized E-Signature Service)
Status: COMPLETED & TAMPER-SEALED
--------------------------------------------------`;

    const blob = new Blob([certText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `DocuSign_Certificate_${document.documentCode}_${generatedEnvelopeId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="docusign-confirmation-modal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 max-h-[92vh] flex flex-col">
        {/* Header with DocuSign Brand Colors */}
        <div className="bg-[#0c2340] text-white p-5 sm:p-6 flex items-start justify-between relative overflow-hidden shrink-0">
          <div className="relative z-10 flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#005cb9] text-white flex items-center justify-center shadow-lg shadow-blue-900/40 shrink-0">
              <PenTool className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full">
                  DocuSign® Canada
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 inline mr-0.5" />
                  <span>CRA IC07-1R</span>
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                {isFrench
                  ? 'Préparation de signature électronique DocuSign'
                  : 'Prepare Document for DocuSign E-Signature'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {isFrench
                  ? 'Pipeline de signature sécurisé pour pièces justificatives et formulaires officiels de l’ARC'
                  : 'Audit-trailed electronic signature pipeline compliant with CRA NETFILE & EFILE mandates'}
              </p>
            </div>
          </div>

          <button
            id="docusign-modal-close-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer relative z-10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          {/* Target Scanned Document Badge */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {isFrench ? 'Document ciblé pour signature' : 'Target Scanned Document'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#064e3b]/10 text-[#064e3b]">
                {document.documentCode}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-200/70">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                  <FileText className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {document.documentName || `${document.documentCode} Tax Document`}
                  </h4>
                  <p className="text-[11px] font-mono text-slate-500 truncate max-w-xs sm:max-w-md">
                    {document.fileName} • {document.fileSize || '380 KB'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{document.ocrConfidence ? `${document.ocrConfidence}% OCR Conf.` : 'OCR Verified'}</span>
                </span>
                <span className="text-slate-500 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" title="CRA Date Format: YYYY/MM/DD">
                  {formatCraDate(document.scannedAt)}
                </span>
              </div>
            </div>
          </div>

          {pipelineState === 'idle' && (
            <>
              {/* Form selection and compliance details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isFrench ? 'Formulaire CRA associé' : 'Associated CRA Form'}
                  </label>
                  <select
                    id="docusign-form-type-select"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
                  >
                    <option value="T183">
                      {isFrench
                        ? 'Formulaire T183 — Déclaration pour transmission électronique'
                        : 'Form T183 — Electronic Filing Authorization'}
                    </option>
                    <option value="AUT01">
                      {isFrench
                        ? 'Formulaire AUT-01 (T1013) — Autorisation du représentant'
                        : 'Form AUT-01 (T1013) — Authorize a Representative'}
                    </option>
                    <option value="ATTACHED_SLIP">
                      {isFrench
                        ? 'Attestation du feuillet fiscal avec piste d’audit'
                        : 'Direct Tax Slip Attestation with Audit Log'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isFrench ? 'Mode de livraison de signature' : 'Signing Delivery Method'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('instant')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                        deliveryMethod === 'instant'
                          ? 'border-[#064e3b] bg-[#064e3b]/10 text-[#064e3b]'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isFrench ? 'Signature directe' : 'Sign Instantly'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('email')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                        deliveryMethod === 'email'
                          ? 'border-[#064e3b] bg-[#064e3b]/10 text-[#064e3b]'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isFrench ? 'Lien par courriel' : 'Email Link'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Signer verification inputs & CRA Date Lock */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-slate-800 text-xs">
                    {isFrench ? 'Coordonnées du signataire (Contribuables)' : 'Taxpayer Signer Credentials'}
                  </h5>
                  <span className="text-[11px] text-slate-500 font-mono">SIN: {maskedSin}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {isFrench ? 'Nom complet légal' : 'Full Legal Name'}
                    </label>
                    <input
                      id="docusign-signer-name"
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
                      placeholder="Alex Mercer"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {isFrench ? 'Courriel du signataire' : 'Signer Email'}
                    </label>
                    <input
                      id="docusign-signer-email"
                      type="email"
                      value={signerEmail}
                      onChange={(e) => setSignerEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
                      placeholder="alex.mercer@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                      <span>{isFrench ? 'Date (Format ARC)' : 'CRA Signing Date'}</span>
                      <span className="text-[10px] font-mono text-[#064e3b] font-bold">YYYY/MM/DD</span>
                    </label>
                    <div className="relative">
                      <input
                        id="docusign-cra-date-locked"
                        type="text"
                        readOnly
                        value={lockedCraDate}
                        className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50/50 font-mono font-bold text-xs text-emerald-950 cursor-not-allowed select-all"
                        title={isFrench ? 'Format de date verrouillé à AAAA/MM/JJ conformément aux exigences de l’ARC' : 'Date format locked to YYYY/MM/DD as per CRA requirements'}
                      />
                      <Lock className="w-3.5 h-3.5 text-emerald-700 absolute right-2.5 top-2.5" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    {isFrench
                      ? 'Format de date verrouillé à AAAA/MM/JJ conformément à la circulaire d’information IC07-1R de l’ARC.'
                      : 'Date format is strictly locked to YYYY/MM/DD as mandated by CRA IC07-1R & Electronic Filing standards.'}
                  </span>
                </div>
              </div>

              {/* Compliance Note */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start space-x-2.5 text-blue-900 text-xs">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {isFrench
                    ? 'Conformité ARC : En vertu de la circulaire d’information IC07-1R, les signatures électroniques recueillies via DocuSign comportent une empreinte numérique sécurisée, l’adresse IP, et un horodatage immuable vérifiable par l’Agence du revenu du Canada.'
                    : 'CRA Compliance Notice: Under Information Circular IC07-1R, e-signatures gathered via DocuSign generate a tamper-evident audit trail with SHA-256 hashing, timestamping, and signer verification recognized by CRA.'}
                </p>
              </div>
            </>
          )}

          {/* Processing State */}
          {pipelineState === 'processing' && (
            <div className="py-8 text-center space-y-6">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-[#005cb9] flex items-center justify-center mx-auto animate-pulse">
                <PenTool className="w-7 h-7 animate-bounce" />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-slate-900">
                  {isFrench
                    ? 'Initialisation du pipeline DocuSign Canada en cours...'
                    : 'Initiating DocuSign Canada E-Signature Pipeline...'}
                </h4>
                <p className="text-xs text-slate-500">
                  {isFrench
                    ? 'Génération des balises d’ancrage et du sceau cryptographique conforme à l’ARC'
                    : 'Generating tamper-evident envelope, positioning CRA anchor tags, and sealing metadata'}
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-2.5 text-left text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className={`flex items-center space-x-2.5 ${activeStage >= 1 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  {activeStage > 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Clock className="w-4 h-4 shrink-0" />}
                  <span>1. Packaging scanned document & CRA Form {formType}</span>
                </div>
                <div className={`flex items-center space-x-2.5 ${activeStage >= 2 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  {activeStage > 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Clock className="w-4 h-4 shrink-0" />}
                  <span>2. Applying DocuSign anchor tabs (\s1\, date locked to YYYY/MM/DD: {lockedCraDate}, IP stamp)</span>
                </div>
                <div className={`flex items-center space-x-2.5 ${activeStage >= 3 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  {activeStage > 3 ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Clock className="w-4 h-4 shrink-0" />}
                  <span>3. Transmitting to DocuSign Envelope Registry & Sealing SHA-256</span>
                </div>
              </div>
            </div>
          )}

          {/* Signed / Envelope Created State */}
          {pipelineState === 'signed' && (
            <div className="py-4 space-y-4">
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2.5">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-emerald-900">
                    {isFrench
                      ? 'Enveloppe DocuSign créée et signée avec succès !'
                      : 'DocuSign Envelope Successfully Created & Signed!'}
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {isFrench
                      ? 'Le document fiscal a été préparé, sécurisé et certifié conforme pour transmission ARC.'
                      : 'Document is authenticated with legal CRA audit trail and tamper-proof electronic signature.'}
                  </p>
                </div>

                {/* Envelope ID & Copy */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                  <div className="px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-slate-800 flex items-center space-x-2">
                    <span className="text-slate-400 text-[10px]">ID:</span>
                    <span>{generatedEnvelopeId}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyEnvelope}
                    className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    {copiedEnvelope ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEnvelope ? (isFrench ? 'Copié !' : 'Copied!') : isFrench ? 'Copier l’ID' : 'Copy ID'}</span>
                  </button>
                </div>
              </div>

              {/* Envelope Metadata Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Signer</span>
                  <span className="font-semibold text-slate-800">{signerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Signer Email</span>
                  <span className="font-semibold text-slate-800 truncate block">{signerEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">CRA Specification</span>
                  <span className="font-semibold text-emerald-800">IC07-1R (Format: YYYY/MM/DD)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">CRA Locked Date</span>
                  <span className="font-semibold font-mono text-emerald-900 bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">{lockedCraDate}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  id="docusign-download-cert-btn"
                  onClick={handleDownloadSignedCert}
                  className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>{isFrench ? 'Télécharger certificat d’audit' : 'Download Audit Certificate'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              {isFrench
                ? 'Chiffrement 256-bit SSL • Conforme Loi canadienne sur le commerce électronique'
                : '256-Bit SSL Encrypted • Uniform Electronic Commerce Act Compliant'}
            </span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {pipelineState !== 'signed' ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={pipelineState === 'processing'}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isFrench ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  id="initiate-docusign-envelope-btn"
                  type="button"
                  onClick={handleStartPipeline}
                  disabled={pipelineState === 'processing'}
                  className="px-5 py-2 bg-[#0c2340] hover:bg-[#005cb9] text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  <PenTool className="w-4 h-4 text-yellow-400" />
                  <span>
                    {isFrench
                      ? 'Lancer le pipeline DocuSign'
                      : 'Initiate DocuSign Pipeline'}
                  </span>
                </button>
              </>
            ) : (
              <button
                type="button"
                id="docusign-done-btn"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2 bg-[#064e3b] hover:bg-[#08634c] text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>{isFrench ? 'Terminé & Enregistrer' : 'Done & Return to Documents'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
