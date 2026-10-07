import React, { useRef } from 'react';
import {
  FileText,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Upload,
  Trash2,
  Sparkles,
  FileCheck,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { ScannedDocumentAssociation } from '../types/tax';

interface DocumentScanIndicatorProps {
  documentCode: string; // e.g. 'T4', 'RRSP', 'T5', etc.
  documentName: string; // e.g. 'T4 Slip', 'RRSP Receipt'
  scan?: ScannedDocumentAssociation;
  language: 'en' | 'fr';
  onUpdateScan?: (scan: ScannedDocumentAssociation | null) => void;
  onRescan?: () => void;
  variant?: 'badge' | 'compact' | 'full';
  className?: string;
  idPrefix?: string;
}

export const DocumentScanIndicator: React.FC<DocumentScanIndicatorProps> = ({
  documentCode,
  documentName,
  scan,
  language,
  onUpdateScan,
  onRescan,
  variant = 'badge',
  className = '',
  idPrefix = 'doc-scan',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isFrench = language === 'fr';

  const isPdf = scan?.fileType === 'pdf';
  const isImage = scan?.fileType === 'image';
  const isScanned = !!scan;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateScan) return;

    const detectedType: 'pdf' | 'image' =
      file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')
        ? 'pdf'
        : 'image';

    const newScan: ScannedDocumentAssociation = {
      id: `scan_${documentCode.toLowerCase()}_${Date.now()}`,
      documentCode,
      documentName,
      fileName: file.name,
      fileType: detectedType,
      fileSize: `${(file.size / 1024).toFixed(0)} KB`,
      scannedAt: new Date().toISOString(),
      status: 'verified',
      ocrConfidence: 98,
    };

    onUpdateScan(newScan);
    // Reset input
    e.target.value = '';
  };

  const handleSimulateScan = (type: 'pdf' | 'image') => {
    if (!onUpdateScan) return;

    const sampleFileName =
      type === 'pdf'
        ? `${documentCode.toUpperCase()}_Official_Receipt_${new Date().getFullYear() - 1}.pdf`
        : `${documentCode.toUpperCase()}_Scan_Photo_${new Date().getFullYear() - 1}.png`;

    const newScan: ScannedDocumentAssociation = {
      id: `scan_${documentCode.toLowerCase()}_${Date.now()}`,
      documentCode,
      documentName,
      fileName: sampleFileName,
      fileType: type,
      fileSize: type === 'pdf' ? '380 KB' : '1.2 MB',
      scannedAt: new Date().toISOString(),
      status: 'verified',
      ocrConfidence: 99,
    };

    onUpdateScan(newScan);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateScan) {
      onUpdateScan(null);
    }
  };

  // Color styles based strictly on whether a PDF or Image file was successfully scanned
  const getBadgeStyle = () => {
    if (isPdf) {
      return {
        bg: 'bg-rose-50 hover:bg-rose-100/80',
        border: 'border-rose-300',
        text: 'text-rose-700',
        iconColor: 'text-rose-600',
        ring: 'focus:ring-rose-400',
        dot: 'bg-rose-500',
        label: isFrench ? 'PDF numérisé' : 'PDF Scanned',
        desc: isFrench ? 'Fichier PDF officiel associé' : 'Official PDF file verified & associated',
      };
    }
    if (isImage) {
      return {
        bg: 'bg-emerald-50 hover:bg-emerald-100/80',
        border: 'border-emerald-300',
        text: 'text-emerald-700',
        iconColor: 'text-emerald-600',
        ring: 'focus:ring-emerald-400',
        dot: 'bg-emerald-500',
        label: isFrench ? 'Image numérisée' : 'Image Scanned',
        desc: isFrench ? 'Photo / Image OCR associée' : 'Photo / Image OCR extracted & associated',
      };
    }
    return {
      bg: 'bg-slate-100/80 hover:bg-slate-200/60',
      border: 'border-slate-200',
      text: 'text-slate-500',
      iconColor: 'text-slate-400',
      ring: 'focus:ring-slate-300',
      dot: 'bg-slate-300',
      label: isFrench ? 'Non numérisé' : 'Not Scanned',
      desc: isFrench ? 'Aucun document PDF ou Image associé' : 'No PDF or Image associated yet',
    };
  };

  const style = getBadgeStyle();

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <input
        ref={fileInputRef}
        id={`${idPrefix}-file-${documentCode.toLowerCase()}`}
        type="file"
        accept=".pdf,image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {variant === 'compact' && (
        <div
          title={`${documentName}: ${style.label} - ${style.desc}${
            scan ? ` (${scan.fileName})` : ''
          }`}
          className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium transition-colors ${style.bg} ${style.border} ${style.text}`}
        >
          {isPdf ? (
            <FileText className={`w-3 h-3 ${style.iconColor} shrink-0`} />
          ) : isImage ? (
            <Camera className={`w-3 h-3 ${style.iconColor} shrink-0`} />
          ) : (
            <Upload className={`w-3 h-3 ${style.iconColor} shrink-0`} />
          )}
          <span className="font-semibold">{style.label}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot} shrink-0`} />
        </div>
      )}

      {variant === 'badge' && (
        <div
          id={`${idPrefix}-badge-${documentCode.toLowerCase()}`}
          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all shadow-2xs ${style.bg} ${style.border} ${style.text}`}
          title={`${style.desc}${scan ? ` (${scan.fileName})` : ''}`}
        >
          {isPdf ? (
            <div className="flex items-center space-x-1">
              <FileCheck className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="font-bold text-[11px] uppercase tracking-wider text-rose-700">PDF</span>
            </div>
          ) : isImage ? (
            <div className="flex items-center space-x-1">
              <Camera className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-bold text-[11px] uppercase tracking-wider text-emerald-700">IMG</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <Upload className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] text-slate-500 font-medium">
                {isFrench ? 'À numériser' : 'Unscanned'}
              </span>
            </div>
          )}

          <span className={`w-2 h-2 rounded-full ${style.dot} shrink-0 animate-pulse`} />

          {/* Quick upload, re-scan or remove action */}
          {(onUpdateScan || onRescan) && (
            <div className="flex items-center space-x-1 pl-1 border-l border-slate-300/60 dark:border-slate-600/60">
              {isScanned ? (
                <>
                  {onRescan && (
                    <button
                      id={`${idPrefix}-rescan-${documentCode.toLowerCase()}`}
                      type="button"
                      onClick={onRescan}
                      title={isFrench ? `Re-numériser ${documentName}` : `Re-scan ${documentName}`}
                      className="p-0.5 text-slate-500 hover:text-emerald-700 rounded transition-colors cursor-pointer"
                      aria-label="Re-scan document"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                  {onUpdateScan && (
                    <button
                      id={`${idPrefix}-remove-${documentCode.toLowerCase()}`}
                      type="button"
                      onClick={handleRemove}
                      title={isFrench ? 'Supprimer l’association' : 'Remove document association'}
                      className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      aria-label="Remove scan association"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </>
              ) : (
                onUpdateScan && (
                  <button
                    id={`${idPrefix}-upload-btn-${documentCode.toLowerCase()}`}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title={isFrench ? 'Téléverser un PDF ou une image' : 'Upload PDF or Image'}
                    className="p-0.5 text-slate-500 hover:text-[#064e3b] font-bold text-[10px] rounded transition-colors cursor-pointer"
                  >
                    +
                  </button>
                )
              )}
            </div>
          )}
        </div>
      )}

      {variant === 'full' && (
        <div
          id={`${idPrefix}-full-${documentCode.toLowerCase()}`}
          className={`w-full p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors ${style.bg} ${style.border}`}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isPdf
                  ? 'bg-rose-100 text-rose-700'
                  : isImage
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {isPdf ? (
                <FileText className="w-4 h-4" />
              ) : isImage ? (
                <Camera className="w-4 h-4" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className={`font-bold ${style.text}`}>{style.label}</span>
                <span className={`w-2 h-2 rounded-full ${style.dot}`} />
              </div>
              <p className="text-[11px] text-slate-600 truncate">
                {scan ? scan.fileName : style.desc}
              </p>
            </div>
          </div>

          {onUpdateScan && (
            <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
              {isScanned ? (
                <div className="flex items-center space-x-1.5">
                  {onRescan && (
                    <button
                      id={`${idPrefix}-full-rescan-${documentCode.toLowerCase()}`}
                      type="button"
                      onClick={onRescan}
                      className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                      title={isFrench ? `Re-numériser ${documentName}` : `Re-scan ${documentName}`}
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{isFrench ? 'Re-numériser' : 'Re-scan'}</span>
                    </button>
                  )}
                  <button
                    id={`${idPrefix}-clear-btn-${documentCode.toLowerCase()}`}
                    type="button"
                    onClick={handleRemove}
                    className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{isFrench ? 'Détacher' : 'Detach'}</span>
                  </button>
                </div>
              ) : (
                <>
                  <button
                    id={`${idPrefix}-sim-pdf-${documentCode.toLowerCase()}`}
                    type="button"
                    onClick={() => handleSimulateScan('pdf')}
                    className="px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                    title="Simulate scanning a PDF"
                  >
                    <FileText className="w-3 h-3" />
                    <span>+ PDF</span>
                  </button>

                  <button
                    id={`${idPrefix}-sim-img-${documentCode.toLowerCase()}`}
                    type="button"
                    onClick={() => handleSimulateScan('image')}
                    className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                    title="Simulate scanning an Image/Photo"
                  >
                    <Camera className="w-3 h-3" />
                    <span>+ Image</span>
                  </button>

                  <button
                    id={`${idPrefix}-browse-${documentCode.toLowerCase()}`}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    {isFrench ? 'Parcourir...' : 'Browse file...'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
