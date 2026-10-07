import React, { useState, useEffect } from 'react';
import {
  Database,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Server,
  ShieldCheck,
  Zap,
  Lock,
  ArrowDownCircle,
  ArrowUpCircle,
  X,
  User,
  LogIn,
  LogOut,
  Layers,
  AlertCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import {
  FIREBASE_CONFIG,
  testFirebaseConnection,
  saveTaxReturnToFirestore,
  loadTaxReturnFromFirestore,
  firebaseSignInWithGoogle,
  firebaseSignOut,
  auth,
} from '../services/firebaseService';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { AppTaxReturn } from '../types/tax';

interface FirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxReturn: AppTaxReturn;
  onUpdateTaxReturn?: (updated: AppTaxReturn) => void;
  language: 'en' | 'fr';
}

export const FirebaseModal: React.FC<FirebaseModalProps> = ({
  isOpen,
  onClose,
  taxReturn,
  onUpdateTaxReturn,
  language,
}) => {
  const isFrench = language === 'fr';

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    connected: boolean;
    latencyMs: number;
    message: string;
    testedAt: string;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    timestamp?: string;
    id?: string;
    error?: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadResult, setLoadResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen && !testResult && !isTesting) {
      handleTestConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const res = await testFirebaseConnection();
      setTestResult({
        connected: res.connected,
        latencyMs: res.latencyMs,
        message: res.message,
        testedAt: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      setTestResult({
        connected: false,
        latencyMs: 0,
        message: err?.message || 'Connection test failed',
        testedAt: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveToFirestore = async () => {
    setIsSaving(true);
    setSaveResult(null);
    try {
      const res = await saveTaxReturnToFirestore(taxReturn);
      setSaveResult(res);
      if (res.success && res.timestamp) {
        onUpdateTaxReturn?.({
          ...taxReturn,
          cloudSyncedAt: res.timestamp,
        });
      }
    } catch (err: any) {
      setSaveResult({
        success: false,
        error: err?.message || 'Failed to save to Firestore',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadFromFirestore = async () => {
    const recordId = taxReturn.id || `tr-${taxReturn.clientId || 'default'}-${taxReturn.taxYear || 2025}`;
    setIsLoading(true);
    setLoadResult(null);
    try {
      const res = await loadTaxReturnFromFirestore(recordId);
      if (res.success && res.data) {
        onUpdateTaxReturn?.(res.data);
        setLoadResult({
          success: true,
          message: isFrench
            ? 'Déclaration T1 synchronisée avec succès depuis Cloud Firestore'
            : 'T1 tax return successfully restored from Cloud Firestore',
        });
      } else {
        setLoadResult({
          success: false,
          error: res.error || 'Record not found in Firestore',
        });
      }
    } catch (err: any) {
      setLoadResult({
        success: false,
        error: err?.message || 'Failed to retrieve tax return',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await firebaseSignInWithGoogle();
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseSignOut();
    } catch (err: any) {
      console.warn('Sign-out error:', err);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#091b30] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-linear-to-r from-[#064e3b] via-[#082a47] to-[#091b30] border-b border-emerald-500/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shadow-inner">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">
                  {isFrench ? 'Google Cloud Firebase & Firestore' : 'Google Cloud Firebase & Firestore'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  LIVE CONNECTED
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                {isFrench
                  ? 'Base de données cloud haute disponibilité avec synchronisation temps réel'
                  : 'High-availability enterprise cloud database with real-time replication'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200">
          {/* Status Banner */}
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">
                  {isFrench ? 'État de Connexion' : 'Connection Status'}
                </div>
                <div className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>{testResult ? testResult.message : (isFrench ? 'Vérification en cours...' : 'Verifying connection...')}</span>
                  {testResult?.latencyMs ? (
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      {testResult.latencyMs} ms
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-md transition-colors shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? (isFrench ? 'Test...' : 'Testing...') : (isFrench ? 'Tester Latence' : 'Ping Test')}</span>
            </button>
          </div>

          {/* Database Specs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#0c2238] border border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Server className="w-3.5 h-3.5 text-blue-400" />
                  <span>Google Cloud Project</span>
                </span>
                <button
                  onClick={() => copyToClipboard(FIREBASE_CONFIG.projectId, 'project')}
                  className="text-[10px] text-blue-400 hover:underline flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedField === 'project' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-sm font-mono font-bold text-white truncate bg-[#061424] px-2.5 py-1.5 rounded border border-slate-800">
                {FIREBASE_CONFIG.projectId}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0c2238] border border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Firestore Database ID</span>
                </span>
                <button
                  onClick={() => copyToClipboard(FIREBASE_CONFIG.firestoreDatabaseId || 'default', 'db')}
                  className="text-[10px] text-emerald-400 hover:underline flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedField === 'db' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-xs font-mono font-bold text-emerald-300 truncate bg-[#061424] px-2.5 py-1.5 rounded border border-slate-800">
                {FIREBASE_CONFIG.firestoreDatabaseId || '(default)'}
              </div>
            </div>
          </div>

          {/* User Auth Section */}
          <div className="p-4 rounded-xl bg-[#0c2238] border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  {isFrench ? 'Authentification Firebase' : 'Firebase Authentication'}
                </div>
                <div className="text-sm font-bold text-white">
                  {currentUser ? (
                    <span className="flex items-center space-x-1.5 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{currentUser.email || currentUser.displayName || 'Authenticated User'}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      {isFrench ? 'Non connecté (accès anonyme/local autorisé)' : 'Not signed in (Local/Anonymous authorized)'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              {currentUser ? (
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 border border-slate-600 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isFrench ? 'Déconnexion' : 'Sign Out'}</span>
                </button>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isFrench ? 'Connexion Google' : 'Sign in with Google'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Firestore Collections Overview */}
          <div className="p-4 rounded-xl bg-[#07192d] border border-slate-700/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>{isFrench ? 'Collections Firestore Synchronisées' : 'Synchronized Firestore Collections'}</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">rules_version = '2'</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#0a233c] border border-slate-800 flex flex-col">
                <span className="font-mono text-emerald-400 font-bold">/taxReturns</span>
                <span className="text-[11px] text-slate-400">T1 return records</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0a233c] border border-slate-800 flex flex-col">
                <span className="font-mono text-blue-400 font-bold">/clientFiles</span>
                <span className="text-[11px] text-slate-400">CPA client profiles</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0a233c] border border-slate-800 flex flex-col">
                <span className="font-mono text-purple-400 font-bold">/documents</span>
                <span className="text-[11px] text-slate-400">Vault slip metadata</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0a233c] border border-slate-800 flex flex-col">
                <span className="font-mono text-amber-400 font-bold">/system</span>
                <span className="text-[11px] text-slate-400">Health & ping stats</span>
              </div>
            </div>
          </div>

          {/* Sync Actions */}
          <div className="p-4 rounded-xl bg-[#0c2238] border border-emerald-500/30 space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isFrench ? 'Actions de Synchronisation T1' : 'T1 Return Cloud Replication'}</span>
            </div>

            <p className="text-xs text-slate-300">
              {isFrench
                ? `Sauvegardez l'état actuel de votre déclaration d'impôt ${taxReturn.taxYear || 2025} sur Google Cloud Firestore pour la retrouver depuis n'importe quel poste ou appareil.`
                : `Save your active ${taxReturn.taxYear || 2025} tax return directly to Google Cloud Firestore for instant persistence and multi-device access.`}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={handleSaveToFirestore}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center space-x-2 shadow-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                <ArrowUpCircle className={`w-4 h-4 ${isSaving ? 'animate-bounce' : ''}`} />
                <span>
                  {isSaving
                    ? (isFrench ? 'Sauvegarde dans Firestore...' : 'Saving to Firestore...')
                    : (isFrench ? 'Sauvegarder dans Firestore' : 'Save Return to Firestore')}
                </span>
              </button>

              <button
                onClick={handleLoadFromFirestore}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-[#143254] hover:bg-[#1a406c] text-emerald-200 border border-emerald-500/40 font-semibold text-xs flex items-center space-x-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <ArrowDownCircle className={`w-4 h-4 ${isLoading ? 'animate-bounce' : ''}`} />
                <span>
                  {isLoading
                    ? (isFrench ? 'Chargement...' : 'Loading...')
                    : (isFrench ? 'Restaurer depuis Firestore' : 'Restore from Firestore')}
                </span>
              </button>
            </div>

            {saveResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
                  saveResult.success
                    ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-950/70 border border-rose-500/50 text-rose-300'
                }`}
              >
                {saveResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>
                  {saveResult.success
                    ? isFrench
                      ? `Enregistré avec succès dans Firestore sous la clé [${saveResult.id}] à ${saveResult.timestamp}`
                      : `Successfully persisted to Firestore record [${saveResult.id}] at ${saveResult.timestamp}`
                    : saveResult.error}
                </span>
              </div>
            )}

            {loadResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
                  loadResult.success
                    ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-950/70 border border-rose-500/50 text-rose-300'
                }`}
              >
                {loadResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{loadResult.success ? loadResult.message : loadResult.error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#061424] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Cloud Firestore Online</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            {isFrench ? 'Fermer' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
