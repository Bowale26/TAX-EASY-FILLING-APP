import React from 'react';
import { motion } from 'motion/react';
import {
  Lock,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  CreditCard,
  ArrowRight,
  Clock,
  RotateCcw,
} from 'lucide-react';
import {
  AuthUser,
  resetTrialToFresh24Hours,
} from '../services/subscriptionAuthService';

interface TrialExpiredPaywallProps {
  currentUser: AuthUser | null;
  onOpenSubscriptionModal: () => void;
  language: 'en' | 'fr';
  onUserUpdate?: (user: AuthUser | null) => void;
}

export const TrialExpiredPaywall: React.FC<TrialExpiredPaywallProps> = ({
  currentUser,
  onOpenSubscriptionModal,
  language,
  onUserUpdate,
}) => {
  const isFrench = language === 'fr';

  const handleResetForTesting = () => {
    const updated = resetTrialToFresh24Hours();
    if (onUserUpdate) onUserUpdate(updated);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-center p-6 sm:p-8 space-y-6"
      >
        {/* Lock / Expiration Icon */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center rounded-3xl bg-linear-to-br from-rose-500 to-amber-600 text-white shadow-xl shadow-rose-500/20">
          <Lock className="w-10 h-10" />
          <div className="absolute -top-2 -right-2 bg-rose-950 text-rose-300 p-1.5 rounded-full border-2 border-white shadow-xs">
            <Clock className="w-4 h-4 animate-spin" />
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{isFrench ? 'ESSAI GRATUIT 1 JOUR EXPIRÉ' : '1-DAY FREE TRIAL CONCLUDED'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b1f3a] tracking-tight">
            {isFrench
              ? 'Votre accès d’essai de 24 heures est terminé'
              : 'Your 24-Hour Free Trial Has Ended'}
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {isFrench
              ? 'Pour continuer à préparer, optimiser vos déductions et transmettre vos déclarations CRA NETFILE, veuillez sélectionner un forfait et activer votre abonnement.'
              : 'To continue preparing, optimizing deductions, and transmitting your CRA NETFILE return, please select an available subscription plan to restore access.'}
          </p>
        </div>

        {/* Benefits reminder */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            {isFrench ? 'Inclus dans votre abonnement :' : 'Restored with Pro Subscription:'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{isFrench ? 'Transmissions CRA NETFILE' : 'CRA NETFILE Transmissions'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{isFrench ? 'Extraction IA slips T4/Relevé' : 'AI OCR Tax Slip Extraction'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{isFrench ? 'Export PDF officiel & Code QR' : 'Official PDF & Verification QR'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{isFrench ? 'Synchronisation Cloud chiffrée' : 'Encrypted Cloud Sync & Vault'}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-3">
          <button
            onClick={onOpenSubscriptionModal}
            className="w-full py-3.5 px-6 rounded-2xl bg-linear-to-r from-[#064e3b] to-emerald-700 hover:from-emerald-800 hover:to-emerald-900 text-white font-bold text-sm sm:text-base flex items-center justify-center space-x-2 shadow-lg shadow-emerald-900/20 transition-transform active:scale-98 cursor-pointer"
          >
            <CreditCard className="w-5 h-5 text-emerald-300" />
            <span>{isFrench ? 'Choisir un Forfait & Restaurer l’Accès' : 'Select Plan & Restore Access'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Testing shortcut */}
          <div className="pt-2 flex items-center justify-center space-x-3 text-xs text-slate-500">
            <span>{currentUser?.email || 'user@example.ca'}</span>
            <span>•</span>
            <button
              onClick={handleResetForTesting}
              className="text-emerald-700 hover:text-emerald-800 font-semibold underline flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isFrench ? 'Relancer Essai 24h (Test)' : 'Reset 24h Trial (Test)'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
