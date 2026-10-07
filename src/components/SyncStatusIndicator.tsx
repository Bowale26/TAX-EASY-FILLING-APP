import React, { useState, useEffect, useRef } from 'react';
import {
  HardDrive,
  CheckCircle2,
  Bell,
  BellRing,
  RefreshCw,
  Clock,
  ShieldCheck,
  ChevronDown,
  X,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  ArrowRightLeft,
  RotateCcw,
  Download,
  Lock,
  WifiOff,
  Key,
  ShieldAlert,
} from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  triggerTestNotification,
} from '../services/serviceWorkerService';
import { AppTaxReturn, ConflictDifference } from '../types/tax';
import { DraftVsRemoteModal } from './DraftVsRemoteModal';
import { InteractiveMergeModal } from './InteractiveMergeModal';
import { ReauthSyncModal } from './ReauthSyncModal';
import { RemoteSyncError, syncTaxReturnToRemote } from '../services/remoteSyncService';
import { downloadTaxReturnBackup } from '../utils/exportUtils';

interface SyncStatusIndicatorProps {
  lastSavedTime: number | null;
  remoteSyncedTime?: number | null;
  isSaving: boolean;
  autoSavePulse?: number;
  hasPendingChanges?: boolean;
  pendingChangesCount?: number;
  draftReturn?: AppTaxReturn;
  remoteReturn?: AppTaxReturn | null;
  itemCounts: {
    slips: number;
    hasPersonalInfo: boolean;
    hasDeductions: boolean;
  };
  onForceSync: () => void;
  onRevertToRemote?: () => void;
  onApplyMerge?: (mergedReturn: AppTaxReturn, resolutions: ConflictDifference[]) => void;
  syncError?: RemoteSyncError | null;
  onRetryRemoteSync?: () => Promise<void> | void;
  onExportJson?: () => void;
  language: 'en' | 'fr';
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  lastSavedTime,
  remoteSyncedTime = null,
  isSaving,
  autoSavePulse,
  hasPendingChanges = false,
  pendingChangesCount = 0,
  draftReturn,
  remoteReturn = null,
  itemCounts,
  onForceSync,
  onRevertToRemote,
  onApplyMerge,
  syncError = null,
  onRetryRemoteSync,
  onExportJson,
  language,
}) => {
  const isFrench = language === 'fr';
  const [isOpen, setIsOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [isReauthOpen, setIsReauthOpen] = useState(false);
  const [isRetryingSync, setIsRetryingSync] = useState(false);
  const [localSyncError, setLocalSyncError] = useState<RemoteSyncError | null>(syncError);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Sync prop changes into localSyncError
  useEffect(() => {
    setLocalSyncError(syncError);
  }, [syncError]);

  const activeSyncError = localSyncError || syncError;
  const is401Error = activeSyncError?.type === '401';
  const isNetworkError = activeSyncError?.type === 'network';

  // Check if remote and local data have conflicting changes
  const hasConflict = Boolean(
    remoteReturn &&
    draftReturn &&
    (hasPendingChanges || JSON.stringify(remoteReturn) !== JSON.stringify(draftReturn))
  );
  const [notificationState, setNotificationState] = useState<NotificationPermission>('default');
  const [testNotificationFeedback, setTestNotificationFeedback] = useState<string | null>(null);
  const [isPulsing, setIsPulsing] = useState(false);
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevSavedTimeRef = useRef<number | null>(lastSavedTime);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Manual Retry Remote Sync Handler
  const handleManualRetryRemoteSync = async () => {
    setIsRetryingSync(true);
    try {
      if (onRetryRemoteSync) {
        await onRetryRemoteSync();
      } else if (draftReturn) {
        const res = await syncTaxReturnToRemote(draftReturn);
        if (!res.success && res.error) {
          setLocalSyncError(res.error);
          // If error is 401 or network, trigger re-authentication flow
          if (res.error.type === '401' || res.error.type === 'network') {
            setIsReauthOpen(true);
          }
          return;
        }
        setLocalSyncError(null);
        onForceSync();
      }
    } catch (err: any) {
      const errObj: RemoteSyncError = {
        type: 'network',
        message: err?.message || 'Remote sync failed',
        timestamp: Date.now(),
      };
      setLocalSyncError(errObj);
      setIsReauthOpen(true);
    } finally {
      setIsRetryingSync(false);
    }
  };

  // Export JSON Handler for offline backup
  const handleExportJson = () => {
    if (onExportJson) {
      onExportJson();
      return;
    }
    if (draftReturn) {
      const res = downloadTaxReturnBackup(draftReturn);
      if (res.success) {
        setExportNotice(
          isFrench
            ? `Sauvegarde JSON exportée : ${res.filename}`
            : `JSON backup exported: ${res.filename}`
        );
        setTimeout(() => setExportNotice(null), 4000);
      }
    }
  };

  // Trigger brief visual pulse animation when auto-save begins or finishes
  useEffect(() => {
    if (isSaving || (lastSavedTime && lastSavedTime !== prevSavedTimeRef.current) || autoSavePulse) {
      setIsPulsing(true);
      if (pulseTimerRef.current) {
        clearTimeout(pulseTimerRef.current);
      }
      pulseTimerRef.current = setTimeout(() => {
        setIsPulsing(false);
      }, 2000);
      prevSavedTimeRef.current = lastSavedTime;
    }
  }, [isSaving, lastSavedTime, autoSavePulse]);

  useEffect(() => {
    return () => {
      if (pulseTimerRef.current) {
        clearTimeout(pulseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setNotificationState(getNotificationPermission());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setNotificationState(perm);
    if (perm === 'granted') {
      await triggerTestNotification();
      setTestNotificationFeedback(
        isFrench ? 'Notification de confirmation envoyée !' : 'Confirmation notification sent!'
      );
      setTimeout(() => setTestNotificationFeedback(null), 3000);
    }
  };

  const handleSendTest = async () => {
    const success = await triggerTestNotification();
    if (success) {
      setTestNotificationFeedback(
        isFrench ? 'Notification test envoyée avec succès' : 'Test notification sent successfully'
      );
    } else {
      setTestNotificationFeedback(
        isFrench ? 'Notifications bloquées par le navigateur' : 'Notifications blocked by browser'
      );
    }
    setTimeout(() => setTestNotificationFeedback(null), 3000);
  };

  const formatSavedTime = (time: number | null) => {
    if (!time) return isFrench ? 'En attente' : 'Pending';
    return new Date(time).toLocaleTimeString(isFrench ? 'fr-CA' : 'en-CA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <>
      <div className="flex items-center space-x-2 no-print">
        {/* Quick Manual 'Retry Remote Sync' Button when 401 or network error is active */}
        {activeSyncError && (
          <button
            id="retry-remote-sync-btn"
            type="button"
            onClick={handleManualRetryRemoteSync}
            disabled={isRetryingSync}
            title={
              isFrench
                ? is401Error
                  ? 'Erreur 401 : Session expirée. Cliquez pour réauthentifier et synchroniser.'
                  : 'Erreur réseau : Cliquez pour réessayer la synchronisation distante.'
                : is401Error
                ? 'HTTP 401: Session expired. Click to re-authenticate and sync.'
                : 'Network error: Click to retry remote cloud sync.'
            }
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs shadow-md border border-rose-400/80 transition-all cursor-pointer transform hover:-translate-y-0.5 animate-pulse"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-white ${isRetryingSync ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {isFrench ? 'Réessayer Synchro Distante' : 'Retry Remote Sync'}
            </span>
            <span className="sm:hidden">
              {isFrench ? 'Réessayer' : 'Retry'}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-rose-200 font-mono font-bold">
              {is401Error ? '401' : isNetworkError ? 'Net' : '!'}
            </span>
          </button>
        )}

        {/* Inline Conflict Alert & Interactive Merge Button when remote & local differ */}
        {hasConflict && remoteReturn && draftReturn && (
          <button
            id="inline-interactive-merge-btn"
            type="button"
            onClick={() => setIsMergeOpen(true)}
            title={
              isFrench
                ? 'Conflit détecté entre local et distant. Cliquez pour fusionner pas à pas.'
                : 'Conflict detected between local and remote data. Click to resolve step-by-step.'
            }
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs shadow-xs border border-amber-400/80 transition-all cursor-pointer transform hover:-translate-y-0.5 animate-pulse"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-950" />
            <span className="hidden sm:inline">
              {isFrench ? 'Fusionner Conflits' : 'Interactive Merge'}
            </span>
            <span className="sm:hidden">
              {isFrench ? 'Fusion' : 'Merge'}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-400 font-black">
              {pendingChangesCount}
            </span>
          </button>
        )}

        <div className="relative inline-block" ref={dropdownRef}>
          {/* Outer Radiating Pulse Wave on Auto-Save or Pending Unsynced Changes */}
          {(isPulsing || isSaving || activeSyncError) && (
            <span
              className={`absolute -inset-1 rounded-full pointer-events-none animate-autosave-wave ${
                activeSyncError
                  ? 'bg-rose-500/50'
                  : hasConflict
                  ? 'bg-amber-500/50'
                  : hasPendingChanges
                  ? 'bg-amber-400/50'
                  : 'bg-emerald-400/50'
              }`}
              aria-hidden="true"
            />
          )}

          {/* Main Pill Button */}
          <button
            id="sync-status-indicator-btn"
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            title={
              activeSyncError
                ? isFrench
                  ? `Erreur de synchronisation (${is401Error ? '401' : 'Réseau'}). Cliquez pour réessayer et réauthentifier.`
                  : `Sync Error (${is401Error ? '401 Unauthorized' : 'Network Error'}). Click to retry and re-authenticate.`
                : hasConflict
                ? isFrench
                  ? `Conflit : ${pendingChangesCount} modification(s) contradictoires. Cliquez pour fusionner.`
                  : `Conflict: ${pendingChangesCount} conflicting change(s). Click to resolve.`
                : hasPendingChanges
                ? isFrench
                  ? `${pendingChangesCount} modification(s) en attente de synchro Service Worker. Cliquez pour comparer le brouillon.`
                  : `${pendingChangesCount} change(s) pending Service Worker sync. Click to compare Draft vs Remote.`
                : isFrench
                ? 'État de la sauvegarde locale & notifications'
                : 'Local storage sync & notification settings'
            }
            className={`relative z-10 flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer select-none ${
              activeSyncError
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-950 border-rose-400 ring-2 ring-rose-400/50 shadow-xs'
                : isSaving
                ? 'bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-400 ring-offset-1 animate-autosave-pulse'
                : hasConflict
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-400 ring-2 ring-amber-400/50 shadow-xs'
                : hasPendingChanges
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
                : isPulsing
                ? 'bg-emerald-100 text-emerald-950 border-emerald-400 ring-2 ring-emerald-400 ring-offset-1 shadow-md shadow-emerald-400/30 animate-autosave-pulse'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300 hover:border-emerald-400 shadow-2xs'
            }`}
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin shrink-0" />
            ) : activeSyncError ? (
              isNetworkError ? (
                <WifiOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              )
            ) : hasConflict ? (
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-amber-500 animate-ping opacity-90" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600" />
              </span>
            ) : hasPendingChanges ? (
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 animate-ping opacity-80" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600" />
              </span>
            ) : (
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 ${
                    isPulsing ? 'animate-ping opacity-100' : 'animate-ping opacity-75'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isPulsing ? 'bg-emerald-500 ring-2 ring-emerald-300' : 'bg-emerald-600'
                  }`}
                />
              </span>
            )}

            <div className="flex items-center space-x-1">
              <span className="hidden md:inline font-bold">
                {activeSyncError
                  ? is401Error
                    ? isFrench ? 'Erreur 401 (Réauthentifier)' : 'Sync Error (401 Re-auth)'
                    : isFrench ? 'Erreur Réseau (Réessayer)' : 'Network Error (Retry)'
                  : isSaving
                  ? isFrench
                    ? 'Sauvegarde...'
                    : 'Saving...'
                  : hasConflict
                  ? isFrench
                    ? `Conflit détecté (${pendingChangesCount})`
                    : `Conflict Alert (${pendingChangesCount})`
                  : hasPendingChanges
                  ? isFrench
                    ? `Brouillon non synchronisé (${pendingChangesCount})`
                    : `Draft Unsynced (${pendingChangesCount})`
                  : isPulsing
                  ? isFrench
                    ? 'Sauvegardé !'
                    : 'Auto-saved!'
                  : isFrench
                  ? 'Sauvegardé localement'
                  : 'Saved to Device'}
              </span>
              <span className="md:hidden font-bold">
                {activeSyncError
                  ? is401Error ? '401' : 'Net'
                  : isSaving
                  ? '...'
                  : hasConflict
                  ? `⚡ ${pendingChangesCount}`
                  : hasPendingChanges
                  ? `⚠️ ${pendingChangesCount}`
                  : isPulsing
                  ? '✓'
                  : isFrench
                  ? 'Sauvegardé'
                  : 'Saved'}
              </span>

              {lastSavedTime && !activeSyncError && (
                <span
                  className={`text-[10px] font-mono opacity-90 hidden lg:inline pl-0.5 ${
                    hasConflict || hasPendingChanges ? 'text-amber-800' : 'text-emerald-700'
                  }`}
                >
                  • {formatSavedTime(lastSavedTime)}
                </span>
              )}
            </div>

            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                activeSyncError
                  ? 'text-rose-800'
                  : hasConflict || hasPendingChanges
                  ? 'text-amber-800'
                  : 'text-emerald-700'
              } ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Popover Card */}
          {isOpen && (
            <div
              id="sync-status-popover"
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 text-xs space-y-3 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      hasConflict
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : hasPendingChanges
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-[#064e3b]'
                    }`}
                  >
                    {hasConflict ? (
                      <AlertTriangle className="w-4 h-4 text-amber-700" />
                    ) : hasPendingChanges ? (
                      <AlertTriangle className="w-4 h-4 text-amber-700" />
                    ) : (
                      <HardDrive className="w-4 h-4 text-[#064e3b]" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      {isFrench ? 'État de Sauvegarde & Service Worker' : 'Storage Sync & Service Worker'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {hasConflict
                        ? isFrench
                          ? 'Conflit de données entre la version locale et distante.'
                          : 'Conflicting changes detected between draft & remote.'
                        : hasPendingChanges
                        ? isFrench
                          ? 'Des modifications locales sont en attente de synchronisation.'
                          : 'Unsynchronized local changes detected in your active draft.'
                        : isFrench
                        ? 'Vos données fiscales sont enregistrées et synchronisées.'
                        : 'Your tax return data is safely preserved on this device.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
                  aria-label="Close popover"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Remote Cloud Sync Error Card (401 Unauthorized or Network Error) */}
              {activeSyncError && (
                <div
                  id="remote-sync-error-alert"
                  className="p-3.5 bg-gradient-to-br from-rose-50 via-rose-50/90 to-amber-50/80 border-2 border-rose-400 rounded-xl space-y-2.5 text-rose-950 shadow-xs animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-rose-950 font-bold">
                      {isNetworkError ? (
                        <WifiOff className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span className="text-xs font-black uppercase tracking-wide">
                        {is401Error
                          ? isFrench
                            ? 'Session Distante Expirée (401)'
                            : 'Remote Session Expired (401)'
                          : isFrench
                          ? 'Erreur Réseau de Synchronisation'
                          : 'Remote Network / Gateway Error'}
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 border border-rose-300 font-mono">
                      {is401Error ? 'HTTP 401' : 'CONN_ERR'}
                    </span>
                  </div>

                  <p className="text-[11px] text-rose-900 leading-normal">
                    {activeSyncError.message ||
                      (isFrench
                        ? 'La synchronisation avec le serveur distant a échoué. Réessayez la synchronisation ou réauthentifiez votre session pour continuer.'
                        : 'Remote cloud synchronization failed. Retry sync or re-authenticate your session to proceed.')}
                  </p>

                  <div className="flex items-center space-x-2 pt-0.5">
                    <button
                      id="popover-retry-remote-sync-btn"
                      type="button"
                      onClick={handleManualRetryRemoteSync}
                      disabled={isRetryingSync}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-white ${isRetryingSync ? 'animate-spin' : ''}`} />
                      <span>{isFrench ? 'Réessayer la synchro' : 'Retry Remote Sync'}</span>
                    </button>

                    <button
                      id="open-reauth-modal-btn"
                      type="button"
                      onClick={() => {
                        setIsReauthOpen(true);
                        setIsOpen(false);
                      }}
                      className="py-2 px-3 rounded-xl bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5 text-rose-700" />
                      <span>{isFrench ? 'Réauthentifier' : 'Re-authenticate'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Conflicting Changes Visual Alert Specifically for Remote vs Local Mismatches */}
              {hasConflict && (
                <div
                  id="conflicting-changes-alert"
                  className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50/80 border-2 border-amber-400 rounded-xl space-y-2.5 text-amber-950 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-amber-950 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-black uppercase tracking-wide">
                        {isFrench ? 'Alerte de Conflit Détectée' : 'Conflict Alert: Remote ≠ Local'}
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                      {pendingChangesCount} {isFrench ? 'conflit(s)' : 'diff(s)'}
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-900 leading-normal">
                    {isFrench
                      ? 'Des modifications contradictoires ont été identifiées entre votre brouillon local et la sauvegarde distante. Résolvez-les champ par champ en toute transparence.'
                      : 'Conflicting modifications exist between your active local draft and the remote storage snapshot. Resolve them step-by-step with full transparency.'}
                  </p>

                  {/* Prominent Interactive Merge Button */}
                  <button
                    id="interactive-merge-btn"
                    type="button"
                    onClick={() => {
                      setIsMergeOpen(true);
                      setIsOpen(false);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-slate-950" />
                    <span>
                      {isFrench ? '⚡ Fusion Interactive (Résoudre pas à pas)' : '⚡ Interactive Merge (Resolve Step-by-Step)'}
                    </span>
                  </button>

                  <div className="flex items-center space-x-2 pt-0.5">
                    <button
                      id="open-compare-modal-from-alert-btn"
                      type="button"
                      onClick={() => {
                        setIsCompareOpen(true);
                        setIsOpen(false);
                      }}
                      className="flex-1 py-1 px-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-[11px] flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                    >
                      <span>{isFrench ? 'Vue comparative' : 'Compare Overview'}</span>
                    </button>

                    <button
                      id="sync-now-from-alert-btn"
                      type="button"
                      onClick={() => {
                        onForceSync();
                        setIsOpen(false);
                      }}
                      className="py-1 px-2.5 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{isFrench ? 'Forcer Sync' : 'Force Sync'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Standard Draft vs Remote Pending Alert Banner (when changes pending but no direct conflict) */}
              {!hasConflict && hasPendingChanges && (
                <div
                  id="pending-changes-alert"
                  className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-amber-950"
                >
                  <div className="flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-bold text-xs">
                      {isFrench
                        ? `Attention : ${pendingChangesCount} modification(s) en attente`
                        : `Alert: ${pendingChangesCount} Pending Change(s)`}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-normal">
                    {isFrench
                      ? 'Votre brouillon local diffère du dernier instantané validé par le Service Worker. Comparez les versions ou synchronisez maintenant.'
                      : 'Your local draft has newer modifications that have not been confirmed by the Service Worker.'}
                  </p>

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      id="open-compare-modal-from-alert-btn"
                      type="button"
                      onClick={() => {
                        setIsCompareOpen(true);
                        setIsOpen(false);
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center justify-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>{isFrench ? 'Comparer Brouillon vs Distant' : 'Compare Draft vs. Remote'}</span>
                    </button>

                    <button
                      id="sync-now-from-alert-btn"
                      type="button"
                      onClick={() => {
                        onForceSync();
                        setIsOpen(false);
                      }}
                      className="py-1.5 px-2.5 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{isFrench ? 'Sync SW' : 'Sync SW'}</span>
                    </button>
                  </div>
                </div>
              )}

            {/* Sync Status Details Card */}
            <div className="space-y-2 bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">
                  {isFrench ? 'Statut du stockage :' : 'Storage status:'}
                </span>
                {hasPendingChanges ? (
                  <span className="inline-flex items-center space-x-1 font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md text-[11px] border border-amber-200">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>{isFrench ? 'Brouillon non synchronisé' : 'Unsynced Local Draft'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#064e3b]" />
                    <span>{isFrench ? 'Actif & Synchronisé' : 'Active & Synced'}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">{isFrench ? 'Brouillon local :' : 'Local draft saved:'}</span>
                <span className="font-mono font-bold text-slate-700">
                  {lastSavedTime ? new Date(lastSavedTime).toLocaleTimeString() : isFrench ? 'En attente' : 'Pending'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">{isFrench ? 'Dernière synchro SW :' : 'Last SW synced:'}</span>
                <span className="font-mono font-bold text-slate-700">
                  {remoteSyncedTime ? new Date(remoteSyncedTime).toLocaleTimeString() : isFrench ? 'En cours' : 'Pending'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">{isFrench ? 'Données protégées :' : 'Items preserved:'}</span>
                <span className="text-slate-700 font-medium">
                  {itemCounts.slips} {isFrench ? 'feuillet(s)' : 'T4 slip(s)'} •{' '}
                  {itemCounts.hasPersonalInfo
                    ? isFrench
                      ? 'Infos saisies'
                      : 'Personal info'
                    : isFrench
                    ? 'Brouillon'
                    : 'Draft'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                <span className="text-slate-500">{isFrench ? 'Service Worker PWA :' : 'PWA Service Worker:'}</span>
                <span className="text-emerald-700 font-medium flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#064e3b]" />
                  <span>{isFrench ? 'Enregistré (hors-ligne prêt)' : 'Registered (offline ready)'}</span>
                </span>
              </div>
            </div>

            {/* Compare Draft vs Remote Button (always accessible) */}
            <div className="space-y-2">
              <button
                id="open-draft-vs-remote-btn"
                type="button"
                onClick={() => {
                  setIsCompareOpen(true);
                  setIsOpen(false);
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center space-x-2 border border-slate-300 transition-colors cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-[#064e3b]" />
                <span>
                  {isFrench ? 'Ouvrir Comparaison Brouillon vs Distant' : 'Open Draft vs. Remote Comparison'}
                </span>
                {hasPendingChanges && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-black">
                    {pendingChangesCount}
                  </span>
                )}
              </button>

              {/* Interactive Merge Quick Action Button */}
              {remoteReturn && (
                <button
                  id="popover-interactive-merge-btn"
                  type="button"
                  onClick={() => {
                    setIsMergeOpen(true);
                    setIsOpen(false);
                  }}
                  className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    hasConflict
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black shadow-xs'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] border border-emerald-200'
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>
                    {isFrench ? 'Outil de Fusion Interactive' : 'Launch Interactive Merge'}
                  </span>
                </button>
              )}
            </div>

            {/* Service Worker Notification Controls */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                  <Bell className="w-3.5 h-3.5 text-[#064e3b]" />
                  <span>
                    {isFrench ? 'Notifications de sauvegarde' : 'Save Sync Notifications'}
                  </span>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    notificationState === 'granted'
                      ? 'bg-emerald-100 text-emerald-800'
                      : notificationState === 'denied'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {notificationState === 'granted'
                    ? isFrench
                      ? 'Activées'
                      : 'Enabled'
                    : notificationState === 'denied'
                    ? isFrench
                      ? 'Bloquées'
                      : 'Blocked'
                    : isFrench
                    ? 'Désactivées'
                    : 'Disabled'}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                {isFrench
                  ? 'Recevez une notification système ou de navigateur à chaque synchronisation réussie de vos données fiscales.'
                  : 'Receive a system or browser notification whenever your tax data is safely synced to local storage.'}
              </p>

              {notificationState !== 'granted' ? (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="w-full py-2 px-3 rounded-xl bg-[#064e3b] hover:bg-[#08634c] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>
                    {isFrench
                      ? 'Activer les alertes de sauvegarde'
                      : 'Enable Save Notifications'}
                  </span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleSendTest}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] border border-slate-300 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-[#064e3b]" />
                    <span>{isFrench ? 'Tester la notification' : 'Test Notification'}</span>
                  </button>

                  <span className="text-[10px] text-emerald-700 font-medium">
                    {isFrench ? '✓ Alertes prêtes' : '✓ Active'}
                  </span>
                </div>
              )}

              {testNotificationFeedback && (
                <p className="text-[11px] text-emerald-700 font-semibold text-center bg-emerald-50 py-1 rounded">
                  {testNotificationFeedback}
                </p>
              )}
            </div>

            {/* Offline Backup & Data Export (JSON) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1.5">
                  <Download className="w-3.5 h-3.5 text-sky-600" />
                  <span>{isFrench ? 'Sauvegarde Hors-Ligne (JSON)' : 'Offline Backup (JSON Export)'}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">.json</span>
              </div>

              <button
                id="export-json-dropdown-btn"
                type="button"
                onClick={handleExportJson}
                className="w-full py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-950 font-bold text-xs flex items-center justify-between border border-sky-200 transition-all cursor-pointer transform hover:-translate-y-0.5 shadow-2xs"
                title={
                  isFrench
                    ? 'Télécharger l’état actuel de votre déclaration d’impôt sous format JSON pour une sauvegarde hors-ligne'
                    : 'Download your current tax return state as a local JSON file, ensuring you have an offline backup'
                }
              >
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4 text-sky-700 shrink-0" />
                  <div className="text-left">
                    <div className="font-bold">{isFrench ? 'Exporter Sauvegarde JSON' : 'Export JSON Backup'}</div>
                    <div className="text-[10px] text-sky-700 font-normal">
                      {isFrench ? 'Sauvegarde locale hors-ligne' : 'Download local backup file'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-200 text-sky-900 font-bold">
                  Export JSON
                </span>
              </button>

              {exportNotice && (
                <p className="text-[10px] text-sky-800 font-semibold bg-sky-100/90 border border-sky-200 px-2 py-1 rounded-lg text-center animate-in fade-in">
                  {exportNotice}
                </p>
              )}
            </div>

            {/* Action Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <button
                  id="force-sync-popover-footer-btn"
                  type="button"
                  onClick={() => {
                    onForceSync();
                    setIsOpen(false);
                  }}
                  className="text-xs font-bold text-[#064e3b] hover:text-emerald-800 flex items-center space-x-1 cursor-pointer"
                  title={isFrench ? 'Forcer la synchronisation locale' : 'Force local sync'}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{isFrench ? 'Forcer synchro' : 'Force Sync'}</span>
                </button>

                <button
                  id="footer-retry-remote-sync-btn"
                  type="button"
                  onClick={handleManualRetryRemoteSync}
                  disabled={isRetryingSync}
                  className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center space-x-1 cursor-pointer"
                  title={
                    isFrench
                      ? 'Réessayer la synchronisation avec le serveur distant et réauthentifier si nécessaire'
                      : 'Retry synchronization with remote cloud and re-authenticate if required'
                  }
                >
                  <RefreshCw className={`w-3 h-3 ${isRetryingSync ? 'animate-spin' : ''}`} />
                  <span>{isFrench ? 'Synchro Distante' : 'Retry Remote Sync'}</span>
                </button>
              </div>

              {hasPendingChanges && onRevertToRemote && remoteReturn && (
                <button
                  id="revert-draft-popover-btn"
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        isFrench
                          ? 'Annuler vos modifications locales et restaurer la version distante ?'
                          : 'Discard local changes and revert to the remote synced version?'
                      )
                    ) {
                      onRevertToRemote();
                      setIsOpen(false);
                    }
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isFrench ? 'Annuler' : 'Discard'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Re-authentication Modal when 401 or network sync error occurs */}
      <ReauthSyncModal
        isOpen={isReauthOpen}
        onClose={() => setIsReauthOpen(false)}
        syncError={activeSyncError}
        onReauthSuccess={async () => {
          await handleManualRetryRemoteSync();
        }}
        language={language}
      />

      {/* Draft vs Remote Comparison Modal */}
      {draftReturn && (
        <DraftVsRemoteModal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          draftReturn={draftReturn}
          remoteReturn={remoteReturn}
          lastSavedDraftTime={lastSavedTime}
          remoteSyncedTime={remoteSyncedTime}
          hasPendingChanges={hasPendingChanges}
          onSyncDraft={onForceSync}
          onRevertToRemote={onRevertToRemote || (() => {})}
          language={language}
        />
      )}

      {/* Interactive Step-by-Step Merge Modal */}
      {draftReturn && remoteReturn && (
        <InteractiveMergeModal
          isOpen={isMergeOpen}
          onClose={() => setIsMergeOpen(false)}
          draftReturn={draftReturn}
          remoteReturn={remoteReturn}
          lastSavedDraftTime={lastSavedTime}
          remoteSyncedTime={remoteSyncedTime}
          onApplyMerge={(mergedReturn, resolutions) => {
            if (onApplyMerge) {
              onApplyMerge(mergedReturn, resolutions);
            } else {
              onForceSync();
            }
            setIsMergeOpen(false);
          }}
          language={language}
        />
      )}
    </>
  );
};

/**
 * Transient floating sync toast notification that confirms save completion.
 */
interface SyncToastProps {
  isVisible: boolean;
  onDismiss: () => void;
  timestamp: number | null;
  language: 'en' | 'fr';
}

export const SyncToast: React.FC<SyncToastProps> = ({
  isVisible,
  onDismiss,
  timestamp,
  language,
}) => {
  const isFrench = language === 'fr';

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 no-print flex items-center space-x-3 bg-[#0b1f3a] text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 max-w-sm transition-all animate-in slide-in-from-bottom-5 duration-200"
    >
      <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white tracking-tight">
          {isFrench ? 'Données d’impôt sauvegardées' : 'Tax Return Progress Synced'}
        </p>
        <p className="text-[11px] text-slate-300 truncate">
          {isFrench
            ? 'Enregistré dans le stockage local à '
            : 'Saved to local storage at '}
          <span className="font-mono text-emerald-300">
            {timestamp ? new Date(timestamp).toLocaleTimeString() : 'now'}
          </span>
        </p>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
