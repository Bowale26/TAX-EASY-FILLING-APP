import React, { useState } from 'react';
import {
  Lock,
  Key,
  Shield,
  X,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  WifiOff,
  User,
  ExternalLink,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { RemoteSyncError, reauthenticateSyncSession, setSimulatedSyncError } from '../services/remoteSyncService';

interface ReauthSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncError: RemoteSyncError | null;
  onReauthSuccess: () => Promise<void> | void;
  language: 'en' | 'fr';
}

export const ReauthSyncModal: React.FC<ReauthSyncModalProps> = ({
  isOpen,
  onClose,
  syncError,
  onReauthSuccess,
  language,
}) => {
  const isFrench = language === 'fr';
  const [accessCode, setAccessCode] = useState('W78K');
  const [taxpayerId, setTaxpayerId] = useState('Alex Morgan');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const is401 = syncError?.type === '401';
  const isNetwork = syncError?.type === 'network';

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!accessCode || accessCode.trim().length < 4) {
      setErrorMessage(
        isFrench
          ? 'Le code d’accès NETFILE doit comporter au moins 4 caractères alphanumériques.'
          : 'NETFILE access code must be at least 4 alphanumeric characters.'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const authResult = await reauthenticateSyncSession(accessCode, taxpayerId);
      if (!authResult.success) {
        setErrorMessage(
          authResult.error ||
            (isFrench ? 'Échec de la réauthentification.' : 'Re-authentication failed. Check credentials.')
        );
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(
        isFrench
          ? 'Session réauthentifiée avec succès ! Synchronisation en cours...'
          : 'Session re-authenticated successfully! Synchronizing return...'
      );

      // Trigger re-sync
      await onReauthSuccess();

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMessage(
        err?.message || (isFrench ? 'Une erreur est survenue lors de la réauthentification.' : 'An error occurred during re-authentication.')
      );
      setIsSubmitting(false);
    }
  };

  const handleSimulateError = (type: '401' | 'network' | null) => {
    setSimulatedSyncError(type);
    setErrorMessage(
      type === '401'
        ? isFrench ? 'Simulation d’erreur 401 activée. Cliquez sur Réessayer.' : 'Simulated 401 Unauthorized activated. Click Retry.'
        : type === 'network'
        ? isFrench ? 'Simulation d’erreur réseau activée. Cliquez sur Réessayer.' : 'Simulated Network Error activated. Click Retry.'
        : isFrench ? 'Simulation réinitialisée à l’état normal.' : 'Simulation reset to normal.'
    );
  };

  return (
    <div
      id="reauth-sync-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reauth-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-[#0b1f3a] via-[#0f2d52] to-[#064e3b] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              {isNetwork ? (
                <WifiOff className="w-5 h-5 text-amber-300" />
              ) : (
                <Lock className="w-5 h-5 text-emerald-300" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  {isFrench ? 'Sécurité ARC & Stockage Distant' : 'CRA Cloud Security & Sync'}
                </span>
                <span className="text-[10px] bg-white/10 text-white px-1.5 py-0.2 rounded font-mono">
                  {is401 ? 'HTTP 401' : isNetwork ? 'Network' : 'Auth'}
                </span>
              </div>
              <h3 id="reauth-modal-title" className="text-base sm:text-lg font-bold text-white">
                {isFrench
                  ? 'Réauthentification de la Synchronisation'
                  : 'Re-authenticate Remote Tax Sync'}
              </h3>
            </div>
          </div>

          <button
            id="close-reauth-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Cause Banner */}
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-950 flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">
              {is401
                ? isFrench
                  ? 'Session expirée (Code 401 Non autorisé)'
                  : 'Session Expired (HTTP 401 Unauthorized)'
                : isNetwork
                ? isFrench
                  ? 'Erreur de connexion réseau détectée'
                  : 'Network Connection Interruption'
                : isFrench
                ? 'Authentification requise pour la synchronisation'
                : 'Authentication Required for Cloud Sync'}
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              {syncError?.message ||
                (isFrench
                  ? 'Vos identifiants de synchronisation doivent être rafraîchis pour enregistrer vos données en toute sécurité sur le serveur distant.'
                  : 'Your cloud sync session token has expired or encountered a network error. Re-enter your credentials to resume uninterrupted synchronization.')}
            </p>
          </div>
        </div>

        {/* Main Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{isFrench ? 'Identifiant contribuable :' : 'Taxpayer Identification:'}</span>
              </label>
              <input
                type="text"
                id="reauth-taxpayer-id"
                value={taxpayerId}
                onChange={(e) => setTaxpayerId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-medium"
                placeholder="Alex Morgan"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-700" />
                  <span>
                    {isFrench
                      ? 'Code d’accès NETFILE de l’ARC (4 caractères) :'
                      : 'CRA NETFILE Access Code (4 characters):'}
                  </span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {isFrench ? 'Ex: Avis de cotisation' : 'From Notice of Assessment'}
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  id="reauth-access-code"
                  maxLength={10}
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-sm font-mono tracking-wider uppercase border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-bold text-slate-900"
                  placeholder="W78K"
                  required
                />
                <button
                  type="button"
                  onClick={() => setAccessCode('W78K')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                  title="Use demo access code"
                >
                  {isFrench ? 'Code démo' : 'Demo Code'}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {isFrench
                  ? 'Ce code à 4 caractères valide vos droits de transmission directe et sécurise la sauvegarde chiffrée.'
                  : 'This 4-character alphanumeric code validates your direct transmission rights and secures cloud backup.'}
              </p>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Quick Simulation Testing Controls */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
              <span className="font-semibold flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>{isFrench ? 'Tester des scénarios d’erreur :' : 'Simulate error scenarios:'}</span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                id="simulate-401-btn"
                onClick={() => handleSimulateError('401')}
                className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors cursor-pointer"
              >
                {isFrench ? 'Simuler 401 Expiré' : 'Simulate 401 Expired'}
              </button>
              <button
                type="button"
                id="simulate-network-btn"
                onClick={() => handleSimulateError('network')}
                className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 transition-colors cursor-pointer"
              >
                {isFrench ? 'Simuler Panne Réseau' : 'Simulate Network Error'}
              </button>
              <button
                type="button"
                id="simulate-clear-btn"
                onClick={() => handleSimulateError(null)}
                className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
              >
                {isFrench ? 'Normal (Pas d’erreur)' : 'Normal (No Error)'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              id="cancel-reauth-btn"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              {isFrench ? 'Annuler' : 'Cancel'}
            </button>

            <button
              type="submit"
              id="confirm-reauth-btn"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-black text-white bg-[#064e3b] hover:bg-[#08634c] active:bg-[#093528] rounded-xl shadow-md shadow-emerald-950/20 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{isFrench ? 'Authentification...' : 'Authenticating...'}</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5 text-emerald-300" />
                  <span>
                    {isFrench
                      ? 'Réauthentifier & Synchroniser'
                      : 'Re-authenticate & Sync'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
