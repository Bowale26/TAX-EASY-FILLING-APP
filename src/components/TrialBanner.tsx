import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  FastForward,
} from 'lucide-react';
import {
  AuthUser,
  TrialStatusInfo,
  getTrialStatus,
  expireCurrentTrialForTesting,
  resetTrialToFresh24Hours,
} from '../services/subscriptionAuthService';

interface TrialBannerProps {
  currentUser: AuthUser | null;
  onOpenSubscription: () => void;
  language: 'en' | 'fr';
  onUserUpdate?: (user: AuthUser | null) => void;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({
  currentUser,
  onOpenSubscription,
  language,
  onUserUpdate,
}) => {
  const isFrench = language === 'fr';
  const [trialStatus, setTrialStatus] = useState<TrialStatusInfo>(() =>
    getTrialStatus(currentUser)
  );

  // Update trial ticker every second
  useEffect(() => {
    const update = () => {
      setTrialStatus(getTrialStatus(currentUser));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // If user has a paid subscription, hide the trial banner
  if (trialStatus.hasPaidSubscription) {
    return null;
  }

  const handleSimulateExpire = () => {
    const updated = expireCurrentTrialForTesting();
    if (onUserUpdate) onUserUpdate(updated);
  };

  const handleResetTrial = () => {
    const updated = resetTrialToFresh24Hours();
    if (onUserUpdate) onUserUpdate(updated);
  };

  // State: Expired Trial
  if (trialStatus.isExpired) {
    return (
      <div className="bg-rose-900 border-b border-rose-700 text-white px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-800 rounded-lg shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider bg-rose-950 px-2 py-0.5 rounded text-rose-300 border border-rose-800">
                  {isFrench ? 'ESSAI 1 JOUR EXPIRÉ' : '1-DAY TRIAL EXPIRED'}
                </span>
                <span className="text-sm font-bold text-rose-100">
                  {isFrench
                    ? 'Votre période d’essai gratuit de 24 heures est terminée'
                    : 'Your 24-hour free trial period has concluded'}
                </span>
              </div>
              <p className="text-xs text-rose-200 mt-0.5">
                {isFrench
                  ? 'L’accès aux calculs et exports fiscaux nécessite l’activation d’un forfait d’abonnement.'
                  : 'Full access to tax calculations and NETFILE transmissions requires an active subscription.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Quick Testing Control */}
            <button
              onClick={handleResetTrial}
              title={isFrench ? 'Réinitialiser essai (24h)' : 'Reset test trial (24h)'}
              className="px-2.5 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-xs font-medium text-rose-200 flex items-center space-x-1 border border-rose-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isFrench ? 'Relancer 24h' : 'Reset 24h'}</span>
            </button>

            <button
              onClick={onOpenSubscription}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-sm transition-transform active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-900" />
              <span>{isFrench ? 'Choisir un Forfait' : 'Select Subscription Plan'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State: Active 1-Day Trial
  const isUrgent = trialStatus.isExpiringSoon;

  return (
    <div
      className={`border-b text-white px-4 py-2.5 transition-colors shadow-xs ${
        isUrgent
          ? 'bg-amber-900 border-amber-700'
          : 'bg-linear-to-r from-emerald-950 via-[#064e3b] to-teal-950 border-emerald-800'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center space-x-3">
          <div
            className={`p-1.5 rounded-lg shrink-0 ${
              isUrgent ? 'bg-amber-800 text-amber-300' : 'bg-emerald-900 text-emerald-300'
            }`}
          >
            {isUrgent ? (
              <AlertTriangle className="w-4 h-4 animate-bounce" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  isUrgent
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                }`}
              >
                {isFrench ? 'ESSAI GRATUIT 1 JOUR ACTIF' : '1-DAY FREE TRIAL ACTIVE'}
              </span>
              <span className="text-xs sm:text-sm font-semibold">
                {isUrgent
                  ? isFrench
                    ? 'Attention : votre essai gratuit expire très bientôt !'
                    : 'Urgent: Your free trial access is expiring soon!'
                  : isFrench
                  ? 'Accès complet gratuit à l’application fiscale'
                  : 'Full complimentary access to Tax Easy Filing'}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs opacity-90 mt-0.5">
              <span>{isFrench ? 'Temps restant :' : 'Remaining trial time:'}</span>
              <span className="font-mono font-bold bg-black/40 px-2 py-0.5 rounded text-amber-200 border border-white/10">
                {trialStatus.formattedRemaining}
              </span>
              <span className="hidden sm:inline text-white/70">
                ({isFrench ? 'Expire le' : 'Expires'}{' '}
                {currentUser?.trialExpiresAt
                  ? new Date(currentUser.trialExpiresAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '24h'}
                )
              </span>
            </div>
          </div>
        </div>

        {/* Action Button & Test Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Quick Sandbox Tester */}
          <button
            onClick={handleSimulateExpire}
            title={isFrench ? 'Simuler expiration pour test' : 'Simulate trial expiration for testing'}
            className="px-2 py-1 rounded bg-black/30 hover:bg-black/50 text-[11px] font-mono text-white/80 border border-white/10 flex items-center space-x-1"
          >
            <FastForward className="w-3 h-3 text-amber-400" />
            <span className="hidden md:inline">{isFrench ? 'Tester Expiration' : 'Test Expiration'}</span>
          </button>

          <button
            onClick={onOpenSubscription}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
              isUrgent
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isFrench ? 'Activer Forfait Annuel' : 'Upgrade to Annual Pro'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
