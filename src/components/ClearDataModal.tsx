import React, { useState } from 'react';
import {
  AlertTriangle,
  Download,
  Trash2,
  X,
  ShieldAlert,
  CheckCircle2,
  HardDriveDownload,
} from 'lucide-react';
import { AppTaxReturn } from '../types/tax';
import { downloadTaxReturnBackup } from '../utils/exportUtils';

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
  taxReturn: AppTaxReturn;
  language: 'en' | 'fr';
}

export const ClearDataModal: React.FC<ClearDataModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
  taxReturn,
  language,
}) => {
  const isFrench = language === 'fr';
  const [backupDownloaded, setBackupDownloaded] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    const res = downloadTaxReturnBackup(taxReturn);
    if (res.success) {
      setBackupDownloaded(res.filename);
    }
  };

  const slipsCount = taxReturn.t4Slips?.length || 0;
  const taxpayerName = taxReturn.personal?.firstName
    ? `${taxReturn.personal.firstName} ${taxReturn.personal.lastName}`
    : isFrench
    ? 'Dossier actuel'
    : 'Current return';

  return (
    <div
      id="clear-data-confirmation-modal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        {/* Header Ribbon */}
        <div className="bg-rose-50 border-b border-rose-100 p-6 flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/30 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 block">
                {isFrench ? 'Zone de Danger • Réinitialisation' : 'Danger Zone • State Reset'}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-950 leading-tight mt-0.5">
                {isFrench ? 'Effacer toutes les données fiscales ?' : 'Clear All Tax Return Data?'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-white/80 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            {isFrench
              ? 'Cette action effacera définitivement tous les feuillets T4 saisis ou numérisés, les informations personnelles, les déductions et l’état de transmission de votre appareil. Cette opération est irréversible.'
              : 'This action will permanently erase all scanned T4 slips, personal details, dependants, deductions, and calculation state stored on this device. This cannot be undone.'}
          </p>

          {/* Current Return Snapshot Pill */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-700 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-900 block">{taxpayerName}</span>
              <span className="text-slate-500">
                {isFrench ? 'Année d’imposition' : 'Tax Year'} {taxReturn.taxYear} • {slipsCount}{' '}
                {isFrench ? 'feuillets enregistrés' : 'slips on file'}
              </span>
            </div>
            <span className="px-2 py-1 rounded-md bg-rose-100 text-rose-800 font-mono text-[11px] font-bold">
              {isFrench ? 'Données locales' : 'Local Storage'}
            </span>
          </div>

          {/* Secondary Option: Backup First */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
              <HardDriveDownload className="w-4 h-4 text-[#064e3b]" />
              <span>
                {isFrench
                  ? 'Recommandation : Téléchargez une copie de sauvegarde d’abord'
                  : 'Recommended: Download a Backup Copy First'}
              </span>
            </div>
            <p className="text-xs text-emerald-800">
              {isFrench
                ? 'Sauvegardez un fichier JSON sur votre ordinateur. Vous pourrez le restaurer à tout moment depuis l’onglet Historique.'
                : 'Export a JSON file to your device. You can restore this exact state at any time via the History step.'}
            </p>

            <button
              id="clear-data-backup-btn"
              type="button"
              onClick={handleDownloadBackup}
              className="w-full py-2.5 px-4 bg-white hover:bg-emerald-100/60 text-[#064e3b] font-bold text-xs rounded-xl border border-emerald-300 shadow-2xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#064e3b]" />
              <span>
                {isFrench ? 'Télécharger la sauvegarde JSON' : 'Download JSON Backup (.json)'}
              </span>
            </button>

            {backupDownloaded && (
              <div className="flex items-center space-x-2 text-[11px] font-semibold text-emerald-900 bg-emerald-100/80 p-2 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#064e3b] shrink-0" />
                <span className="truncate">
                  {isFrench ? 'Fichier exporté avec succès :' : 'Saved to Downloads:'}{' '}
                  {backupDownloaded}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5">
          <button
            id="clear-data-cancel-btn"
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            {isFrench ? 'Annuler et conserver mes données' : 'Cancel & Keep My Data'}
          </button>

          <button
            id="clear-data-confirm-btn"
            type="button"
            onClick={() => {
              onConfirmReset();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isFrench ? 'Confirmer et Tout Effacer' : 'Yes, Clear All Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
