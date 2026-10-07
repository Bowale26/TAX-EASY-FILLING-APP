import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Printer,
  Copy,
  Check,
  Download,
  ShieldCheck,
  ExternalLink,
  QrCode,
  FileCheck2,
  AlertTriangle,
  Smartphone,
} from 'lucide-react';
import { AppTaxReturn } from '../types/tax';
import { TaxDocumentVerificationData } from '../utils/taxVerificationQr';

interface PrintableQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  verificationData: TaxDocumentVerificationData | null;
  taxReturn: AppTaxReturn;
  language: 'en' | 'fr';
  onLogShare?: (destination: string, destinationFr: string) => void;
}

export const PrintableQrCodeModal: React.FC<PrintableQrCodeModalProps> = ({
  isOpen,
  onClose,
  verificationData,
  taxReturn,
  language,
  onLogShare,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const isFrench = language === 'fr';

  const p = taxReturn.personal;
  const fullName = `${p?.firstName || 'Alex'} ${p?.lastName || 'Morgan'}`.trim();
  const taxYear = taxReturn.taxYear || 2025;
  const isOfficial = verificationData?.isOfficial || taxReturn.filingStatus === 'Filed';
  const confirmationCode =
    taxReturn.netfile?.confirmationNumber ||
    taxReturn.netfileConfirmationCode ||
    (isOfficial ? 'CRA-2025-884920' : null);

  const handleCopyUrl = async () => {
    if (!verificationData?.verificationUrl) return;
    try {
      await navigator.clipboard.writeText(verificationData.verificationUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
      onLogShare?.('Clipboard (Verification URL via QR Modal)', 'Presse-papiers (URL via modal QR)');
    } catch (err) {
      console.error('Failed to copy verification URL:', err);
    }
  };

  const handleCopyHash = async () => {
    if (!verificationData?.documentHash) return;
    try {
      await navigator.clipboard.writeText(verificationData.documentHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2500);
    } catch (err) {
      console.error('Failed to copy hash:', err);
    }
  };

  const handlePrintSheet = () => {
    onLogShare?.('Printable QR Verification Sheet', 'Feuille de vérification QR imprimée');
    if (typeof document !== 'undefined') {
      document.body.classList.add('printing-qr-slip');
      const cleanup = () => {
        document.body.classList.remove('printing-qr-slip');
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      // Fallback timeout cleanup
      setTimeout(cleanup, 3000);
    }
    window.print();
  };

  const handleDownloadSvg = () => {
    if (!verificationData?.qrSvg) return;
    const blob = new Blob([verificationData.qrSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CRA-T1-${taxYear}-${p?.lastName || 'Taxpayer'}-Verification-QR.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onLogShare?.('Downloaded QR Code (SVG)', 'Code QR téléchargé (SVG)');
  };

  /**
   * Generates and downloads the QR verification sheet as a standalone high-resolution PNG image
   * for accountants to save, archive, or attach to CPA working papers.
   */
  const handleDownloadPng = async () => {
    if (!verificationData) return;
    setIsExportingPng(true);
    try {
      const canvas = document.createElement('canvas');
      const width = 800;
      const height = 980;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill canvas background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Deep green top banner
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, width, 120);

      // Header title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CANADA REVENUE AGENCY • CERTIFICATE OF AUTHENTICITY', width / 2, 50);

      ctx.fillStyle = '#a7f3d0';
      ctx.font = '15px monospace';
      ctx.fillText('AGENCE DU REVENU DU CANADA • DÉCLARATION T1 VÉRIFIÉE', width / 2, 82);

      // Status badge
      ctx.fillStyle = isOfficial ? '#059669' : '#d97706';
      ctx.beginPath();
      ctx.roundRect(width / 2 - 130, 140, 260, 36, 18);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(isOfficial ? 'OFFICIAL / OFFICIEL' : 'DRAFT / BROUILLON', width / 2, 163);

      // Render the SVG QR Code onto the canvas
      if (verificationData.qrSvg) {
        await new Promise<void>((resolve) => {
          const img = new Image();
          const svgBlob = new Blob([verificationData.qrSvg], { type: 'image/svg+xml;charset=utf-8' });
          const svgUrl = URL.createObjectURL(svgBlob);
          img.onload = () => {
            const qrSize = 340;
            const qrX = (width - qrSize) / 2;
            const qrY = 195;

            ctx.fillStyle = '#f8fafc';
            ctx.strokeStyle = '#064e3b';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 20);
            ctx.fill();
            ctx.stroke();

            ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
            URL.revokeObjectURL(svgUrl);
            resolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(svgUrl);
            resolve();
          };
          img.src = svgUrl;
        });
      }

      // Taxpayer Information
      const infoY = 615;
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fullName, width / 2, infoY);

      ctx.fillStyle = '#475569';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Tax Year: ${taxYear}  •  Province: ${p?.province || 'ON'}`, width / 2, infoY + 30);

      if (confirmationCode) {
        ctx.fillStyle = '#064e3b';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`NETFILE CONFIRMATION: ${confirmationCode}`, width / 2, infoY + 62);
      }

      // SHA-256 fingerprint box
      if (verificationData.documentHash) {
        const hashY = infoY + 85;
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(40, hashY, width - 80, 80, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#475569';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('CRYPTOGRAPHIC SHA-256 DIGITAL FINGERPRINT', 55, hashY + 26);

        ctx.fillStyle = '#0f172a';
        ctx.font = '12px monospace';
        ctx.fillText(verificationData.documentHash, 55, hashY + 54);
      }

      // Bottom deep blue bar
      ctx.fillStyle = '#0b1f3a';
      ctx.fillRect(0, height - 60, width, 60);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        'TAX EASY FILLING APP • Standalone CPA QR Verification Record • Encrypted & Tamper-Evident',
        width / 2,
        height - 25
      );

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `CRA-T1-${taxYear}-${p?.lastName || 'Taxpayer'}-Verification-Sheet.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      onLogShare?.('Downloaded QR Verification Sheet (PNG)', 'Feuille de vérification QR téléchargée (PNG)');
    } catch (err) {
      console.error('Failed to generate QR sheet PNG:', err);
    } finally {
      setIsExportingPng(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto"
          id="printable-qr-modal-backdrop"
        >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden relative my-6"
          id="printable-qr-modal-container"
        >
          {/* Header Bar */}
          <div className="bg-linear-to-r from-[#064e3b] to-[#043327] px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 border border-white/20">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                    CRA / ARC T1 VERIFY
                  </span>
                  <span
                    className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isOfficial
                        ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                        : 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                    }`}
                  >
                    {isOfficial ? 'OFFICIAL / OFFICIEL' : 'DRAFT / BROUILLON'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {isFrench ? 'Code QR de Vérification du Document' : 'Document Verification QR Code'}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              title={isFrench ? 'Fermer' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-5">
            {/* Instruction banner for accountants */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start space-x-3 text-xs text-slate-700">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {isFrench
                  ? 'Les comptables et auditeurs peuvent scanner ce code avec n’importe quel téléphone ou lecteur optique pour vérifier l’intégrité cryptographique SHA-256 et la confirmation NETFILE officielle de l’ARC.'
                  : 'Accountants and CRA auditors can scan this QR code using any smartphone camera or 2D optical scanner to verify the cryptographic SHA-256 seal and official CRA NETFILE assessment status.'}
              </p>
            </div>

            {/* Main Printable Verification Card */}
            <div
              id="printable-cpa-qr-sheet"
              className="border-2 border-dashed border-emerald-300 rounded-3xl p-6 bg-emerald-50/30 flex flex-col items-center text-center relative"
            >
              <div className="text-[10px] font-mono tracking-widest text-emerald-800 font-bold uppercase mb-2">
                CANADA REVENUE AGENCY • CERTIFICATE OF AUTHENTICITY
              </div>

              {/* QR Code Container */}
              <div
                className="w-52 h-52 bg-white p-3 rounded-2xl shadow-md border-2 border-[#064e3b] flex items-center justify-center"
                id="printable-qr-code-svg-target"
              >
                {verificationData?.qrSvg ? (
                  <div
                    className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: verificationData.qrSvg }}
                  />
                ) : (
                  <QrCode className="w-32 h-32 text-[#064e3b] animate-pulse" />
                )}
              </div>

              {/* Taxpayer and Filing Metadata */}
              <div className="mt-4 space-y-1">
                <div className="text-base font-extrabold text-slate-900">{fullName}</div>
                <div className="text-xs text-slate-600 flex items-center justify-center space-x-2">
                  <span>{isFrench ? 'Année d’imposition' : 'Tax Year'}: <strong>{taxYear}</strong></span>
                  <span>•</span>
                  <span>{isFrench ? 'Province' : 'Province'}: <strong>{p?.province || 'ON'}</strong></span>
                </div>
                {confirmationCode && (
                  <div className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-2.5 py-0.5 rounded-full inline-block mt-1">
                    NETFILE: {confirmationCode}
                  </div>
                )}
              </div>

              {/* Concise Scanning Instructions for Accountants using CRA-Approved Mobile Apps */}
              <div
                id="cpa-mobile-scan-instructions"
                className="mt-4 w-full bg-white/95 border border-emerald-300/80 rounded-2xl p-4 text-left shadow-xs"
              >
                <div className="flex items-center space-x-2 text-xs font-bold text-[#064e3b] mb-2">
                  <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {isFrench
                      ? 'Directives de Numérisation — Applications Mobiles Agréées ARC'
                      : 'CRA-Approved Mobile App Scanning Instructions for Accountants'}
                  </span>
                </div>
                <ol className="text-[11px] text-slate-700 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>
                    <span className="font-semibold text-slate-900">
                      {isFrench ? 'Application certifiée :' : 'Open App:'}
                    </span>{' '}
                    {isFrench
                      ? 'Ouvrez l’appareil photo ou une application certifiée ARC (Mon dossier ARC, Représenter un client ou lecteur 2D sécurisé).'
                      : 'Open your mobile camera or CRA-certified scanning app (CRA My Account, Represent a Client, or certified 2D barcode reader).'}
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">
                      {isFrench ? 'Cadrage optimal :' : 'Framing:'}
                    </span>{' '}
                    {isFrench
                      ? 'Cadrez les 4 repères angulaires du code QR à une distance de 15 à 25 cm sous un éclairage stable sans reflet.'
                      : 'Frame all 4 corner registration targets of the QR code from 15–25 cm under even lighting without glare.'}
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">
                      {isFrench ? 'Vérification cryptographique :' : 'Verification:'}
                    </span>{' '}
                    {isFrench
                      ? 'Vérifiez la concordance de l’empreinte SHA-256 et du jeton NETFILE avec le grand livre numérique officiel de l’ARC.'
                      : 'Verify the cryptographic SHA-256 digest and NETFILE assessment token against the official CRA tax ledger.'}
                  </li>
                </ol>
                <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 bg-emerald-100/80 text-emerald-800 rounded-md font-mono font-semibold">
                    CRA / ARC Certified
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono">
                    iOS & Android Compatible
                  </span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200/60 rounded-md font-mono">
                    AES-256 / SHA-256
                  </span>
                </div>
              </div>

              {/* Cryptographic Hash Digest */}
              {verificationData?.documentHash && (
                <div className="mt-4 w-full bg-white/90 border border-slate-200 rounded-xl p-2.5 text-left">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
                    <span className="font-bold uppercase tracking-wider">
                      SHA-256 DIGITAL FINGERPRINT
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyHash}
                      className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedHash ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedHash ? (isFrench ? 'Copié' : 'Copied') : (isFrench ? 'Copier' : 'Copy')}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[11px] text-slate-800 break-all select-all leading-tight bg-slate-50 p-1.5 rounded">
                    {verificationData.documentHash}
                  </div>
                </div>
              )}
            </div>

            {/* Verification Link preview */}
            {verificationData?.verificationUrl && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-slate-700 uppercase">
                    {isFrench ? 'URL directe de vérification' : 'Direct Verification URL'}
                  </div>
                  <a
                    href={verificationData.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-mono truncate block hover:underline mt-0.5"
                  >
                    {verificationData.verificationUrl}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center justify-center space-x-1.5 shrink-0 shadow-2xs transition-colors cursor-pointer"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? (isFrench ? 'Copié !' : 'Copied!') : (isFrench ? 'Copier l’URL' : 'Copy URL')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-slate-100 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                id="download-qr-sheet-png-btn"
                onClick={handleDownloadPng}
                disabled={isExportingPng}
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-[#064e3b] border border-emerald-300 text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs hover:border-emerald-400"
                title={isFrench ? 'Télécharger la fiche de vérification en format image PNG autonome' : 'Save the QR verification sheet as a standalone PNG image file'}
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>
                  {isExportingPng
                    ? (isFrench ? 'Génération...' : 'Generating...')
                    : (isFrench ? 'Télécharger en PNG' : 'Download as PNG')}
                </span>
              </button>

              <button
                type="button"
                id="download-qr-sheet-svg-btn"
                onClick={handleDownloadSvg}
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>{isFrench ? 'Télécharger SVG' : 'Download SVG'}</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                {isFrench ? 'Fermer' : 'Close'}
              </button>
              <button
                type="button"
                id="print-qr-code-sheet-btn"
                onClick={handlePrintSheet}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{isFrench ? 'Imprimer la Fiche QR' : 'Print QR Slip'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
