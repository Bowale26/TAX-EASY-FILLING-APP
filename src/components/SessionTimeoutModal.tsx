import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShieldAlert, Clock, RefreshCw, Download, Lock, CheckCircle2 } from 'lucide-react';
import { downloadTaxReturnBackup } from '../utils/exportUtils';
import { AppTaxReturn } from '../types/tax';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  onExtendSession: () => void;
  onSaveSession: () => void;
  taxReturn: AppTaxReturn;
  language: 'en' | 'fr';
}

const COUNTDOWN_SECONDS = 60;

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  isOpen,
  onExtendSession,
  onSaveSession,
  taxReturn,
  language,
}) => {
  const isFrench = language === 'fr';
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [isLocked, setIsLocked] = useState(false);
  const [backupDownloaded, setBackupDownloaded] = useState(false);

  // Keep a stable ref to onSaveSession so effect dependencies remain clean
  const onSaveSessionRef = useRef(onSaveSession);
  useEffect(() => {
    onSaveSessionRef.current = onSaveSession;
  }, [onSaveSession]);

  // Reset countdown whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(COUNTDOWN_SECONDS);
      setIsLocked(false);
      setBackupDownloaded(false);
    }
  }, [isOpen]);

  // Countdown timer when warning modal is open - keep updater purely functional with no side-effects
  useEffect(() => {
    if (!isOpen || isLocked) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isLocked]);

  // When timer reaches 0, lock session and invoke save handler cleanly inside an effect
  useEffect(() => {
    if (isOpen && !isLocked && secondsLeft <= 0) {
      setIsLocked(true);
      onSaveSessionRef.current?.();
    }
  }, [isOpen, isLocked, secondsLeft]);

  const handleDownloadBackup = () => {
    downloadTaxReturnBackup(taxReturn);
    setBackupDownloaded(true);
  };

  const handleUnlock = () => {
    setIsLocked(false);
    onExtendSession();
  };

  if (!isOpen) return null;

  return (
    <div
      id="session-timeout-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="session-timeout-modal"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header Bar */}
        <div className="bg-linear-to-r from-amber-600 via-amber-700 to-slate-900 p-5 text-white flex items-center space-x-3.5">
          <div className="p-2.5 bg-amber-500/30 rounded-xl border border-amber-300/30 shrink-0">
            {isLocked ? (
              <Lock className="w-6 h-6 text-amber-200" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-amber-200 animate-pulse" />
            )}
          </div>
          <div>
            <h2 id="session-timeout-title" className="text-lg font-black tracking-tight leading-tight">
              {isLocked
                ? isFrench
                  ? 'Session Verrouillée par Sécurité'
                  : 'Session Locked for Security'
                : isFrench
                ? 'Alerte d’Inactivité : 15 Minutes'
                : 'Inactivity Warning: 15 Minutes'}
            </h2>
            <p className="text-xs text-amber-100/90 font-medium">
              {isFrench
                ? 'Protection des données fiscales personnelles (NAS, T4 & Déductions)'
                : 'Safeguarding personal tax data (SIN, T4 slips & deductions)'}
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {isLocked ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <p className="text-sm font-bold text-slate-900">
                {isFrench
                  ? 'Votre session a été verrouillée automatiquement afin de protéger vos renseignements fiscaux.'
                  : 'Your session has been automatically locked to protect your confidential tax records.'}
              </p>
              <p className="text-xs text-slate-600">
                {isFrench
                  ? 'Vos données ont été sauvegardées dans votre stockage local sécurisé. Cliquez sur Déverrouiller pour reprendre immédiatement votre déclaration.'
                  : 'All your work has been safely preserved in local encrypted storage. Click Unlock to resume right where you left off.'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start space-x-3 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl">
                <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <p className="font-bold">
                    {isFrench
                      ? 'Aucune activité détectée au cours des 15 dernières minutes.'
                      : 'No activity detected in the last 15 minutes.'}
                  </p>
                  <p className="mt-1 text-amber-800">
                    {isFrench
                      ? 'Pour respecter les normes de sécurité de l’ARC (NETFILE et LPRPDE), votre session sera verrouillée dans :'
                      : 'In accordance with CRA NETFILE & PIPEDA security standards, your session will be secured in:'}
                  </p>
                </div>
              </div>

              {/* Countdown Display */}
              <div className="text-center py-2">
                <div className="inline-flex items-baseline space-x-1.5 px-4 py-2 bg-slate-100 rounded-xl border border-slate-200">
                  <span className="text-3xl font-black font-mono text-amber-600">
                    {secondsLeft}
                  </span>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {isFrench ? 'secondes restantes' : 'seconds remaining'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 text-center">
                {isFrench
                  ? 'Souhaitez-vous prolonger votre session ou sauvegarder un fichier de secours de votre déclaration ?'
                  : 'Would you like to extend your active session or download a local backup file of your return?'}
              </p>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-2">
            {isLocked ? (
              <button
                id="session-unlock-btn"
                type="button"
                onClick={handleUnlock}
                className="w-full px-5 py-3 bg-[#064e3b] hover:bg-[#08634c] text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4 text-emerald-200" />
                <span>{isFrench ? 'Déverrouiller & Continuer' : 'Unlock & Resume Session'}</span>
              </button>
            ) : (
              <>
                <button
                  id="session-extend-btn"
                  type="button"
                  onClick={onExtendSession}
                  className="flex-1 px-5 py-3 bg-[#064e3b] hover:bg-[#08634c] text-white font-black text-sm rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-emerald-200" />
                  <span>{isFrench ? 'Prolonger la Session' : 'Extend Session'}</span>
                </button>

                <button
                  id="session-save-backup-btn"
                  type="button"
                  onClick={handleDownloadBackup}
                  className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs"
                  title={isFrench ? 'Télécharger une sauvegarde JSON de votre déclaration' : 'Download tax return backup JSON file'}
                >
                  {backupDownloaded ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-slate-950" />
                      <span>{isFrench ? 'Sauvegardé !' : 'Saved!'}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-slate-950" />
                      <span>{isFrench ? 'Sauvegarder JSON' : 'Save Backup'}</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Security Footer Note */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 text-[11px] text-slate-500 flex items-center justify-between">
          <span>
            {isFrench
              ? 'Conforme aux exigences de confidentialité ARC & NETFILE 2025'
              : 'Compliant with CRA NETFILE & privacy requirements 2025'}
          </span>
          <span className="font-mono text-[10px] text-slate-400">ID: NETFILE-SEC-15M</span>
        </div>
      </div>
    </div>
  );
};
