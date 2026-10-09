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
  const progressPercent = Math.min(100, Math.max(0, trialStatus.progressPercent || 0));

  return (
    <div
      id="header-trial-progress-banner"
      className={`border-b text-white transition-colors shadow-xs ${
        isUrgent
          ? 'bg-amber-950/95 border-amber-800'
          : 'bg-linear-to-r from-[#03231a] via-[#064e3b] to-[#082f49] border-emerald-800/80'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center space-x-3 min-w-0">
          <div
            className={`p-2 rounded-xl shrink-0 shadow-inner ${
              isUrgent ? 'bg-amber-800/90 text-amber-300' : 'bg-emerald-900/90 text-emerald-300'
            }`}
          >
            {isUrgent ? (
              <AlertTriangle className="w-4 h-4 animate-bounce" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border shadow-2xs ${
                  isUrgent
                    ? 'bg-amber-900/90 text-amber-200 border-amber-600'
                    : 'bg-emerald-950/90 text-emerald-200 border-emerald-600'
                }`}
              >
                {isFrench ? 'ESSAI GRATUIT 1 JOUR ACTIF' : '1-DAY FREE TRIAL ACTIVE'}
              </span>
              <span className="text-xs sm:text-sm font-semibold truncate text-white">
                {isUrgent
                  ? isFrench
                    ? 'Attention : votre essai gratuit expire très bientôt !'
                    : 'Urgent: Your free trial access is expiring soon!'
                  : isFrench
                  ? 'Accès complet gratuit à l’application fiscale (24 heures)'
                  : 'Full unrestricted access to Tax Easy Filing (24 hours)'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs opacity-90 mt-0.5">
              <span className="text-white/80">{isFrench ? 'Temps restant :' : 'Remaining trial time:'}</span>
              <span className="font-mono font-bold bg-black/50 px-2.5 py-0.5 rounded-lg text-amber-200 border border-white/10 shadow-inner">
                {trialStatus.formattedRemaining}
              </span>
              <span className="hidden sm:inline text-white/70 font-mono text-[11px]">
                ({progressPercent}% {isFrench ? 'écoulé' : 'elapsed'} • {isFrench ? 'Expire' : 'Expires'}{' '}
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
            className="px-2.5 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-[11px] font-mono text-white/80 border border-white/15 flex items-center space-x-1 cursor-pointer transition-colors"
          >
            <FastForward className="w-3.5 h-3.5 text-amber-400" />
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

      {/* 
        VISUAL TRIAL PROGRESS BAR (Dedicated 24-Hour Progress Tracker)
        Shows user's real-time progress through their 1-day free trial period
      */}
      <div
        id="trial-progress-bar-container"
        className="w-full bg-black/40 border-t border-white/10 px-4 py-1.5 backdrop-blur-xs"
      >
        <div className="max-w-7xl mx-auto space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-white/80">
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>{isFrench ? 'Début de l’essai (0h)' : 'Trial Activated (0h)'}</span>
            </span>
            <span className="font-bold text-amber-300">
              {progressPercent}% {isFrench ? 'utilisé' : 'used'} • {trialStatus.formattedRemaining} {isFrench ? 'restant' : 'remaining'}
            </span>
            <span className="text-white/70">
              {isFrench ? 'Fin des 24 heures (Expiration)' : '24h Expiration'}
            </span>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full h-2 rounded-full bg-slate-950/70 p-0.5 border border-white/15 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out shadow-xs ${
                trialStatus.isExpired
                  ? 'bg-rose-500'
                  : progressPercent > 85
                  ? 'bg-linear-to-r from-amber-500 to-rose-500'
                  : progressPercent > 60
                  ? 'bg-linear-to-r from-emerald-400 via-amber-400 to-amber-500'
                  : 'bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-300'
              }`}
              style={{ width: `${Math.max(2, progressPercent)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
