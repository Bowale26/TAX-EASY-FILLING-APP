import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CreditCard,
  CheckCircle2,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Download,
  AlertTriangle,
  KeyRound,
  LogOut,
  Sparkles,
  ArrowRight,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import {
  AuthUser,
  getCurrentAuthUser,
  signUpWithSubscription,
  signInUser,
  resetUserPassword,
  changeUserPassword,
  signOutUser,
  subscribeWithPayPal,
  registerWithFreeTrial,
  upgradeUserToPaidSubscription,
  getTrialStatus,
  TrialStatusInfo,
  resetTrialToFresh24Hours,
  expireCurrentTrialForTesting,
} from '../services/subscriptionAuthService';

interface SubscriptionBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'fr';
  onUserUpdate?: (user: AuthUser | null) => void;
  initialTab?: 'overview' | 'signin' | 'signup' | 'reset' | 'plans' | 'trial';
}

export const SubscriptionBillingModal: React.FC<SubscriptionBillingModalProps> = ({
  isOpen,
  onClose,
  language,
  onUserUpdate,
  initialTab,
}) => {
  const isFrench = language === 'fr';

  // Mode: 'overview' | 'signin' | 'signup' | 'reset' | 'trial' | 'plans'
  const [activeTab, setActiveTab] = useState<'overview' | 'signin' | 'signup' | 'reset' | 'trial' | 'plans'>('overview');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // 1-Day Free Trial Registration State
  const [trialName, setTrialName] = useState<string>('');
  const [trialEmail, setTrialEmail] = useState<string>('');
  const [trialPassword, setTrialPassword] = useState<string>('');
  const [trialConfirmPassword, setTrialConfirmPassword] = useState<string>('');
  const [trialError, setTrialError] = useState<string | null>(null);

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState<string>('alex.morgan@example.ca');
  const [signInPassword, setSignInPassword] = useState<string>('Password2025!');
  const [signInError, setSignInError] = useState<string | null>(null);

  // Sign Up Form State (Includes Name, Email, Password, and Required $29.99 Payment)
  const [signUpName, setSignUpName] = useState<string>('');
  const [signUpEmail, setSignUpEmail] = useState<string>('');
  const [signUpPassword, setSignUpPassword] = useState<string>('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvc, setCardCvc] = useState<string>('842');
  const [cardName, setCardName] = useState<string>('');
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Reset Password State
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetNewPassword, setResetNewPassword] = useState<string>('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState<string>('');
  const [resetSuccessNotice, setResetSuccessNotice] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Change Password State (when logged in)
  const [showChangePasswordForm, setShowChangePasswordForm] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [changePasswordNotice, setChangePasswordNotice] = useState<string | null>(null);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

  // Success Feedback
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [paypalButtonLoaded, setPaypalButtonLoaded] = useState<boolean>(false);
  const [paypalNotice, setPaypalNotice] = useState<string | null>(null);

  // Payment Method: 'card' | 'paypal'
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('paypal');
  const [paypalPlanType, setPaypalPlanType] = useState<'monthly' | 'yearly'>('yearly');
  const [paypalConfig, setPaypalConfig] = useState<{
    isConfigured: boolean;
    clientId?: string;
    monthlyPlanId?: string;
    yearlyPlanId?: string;
    productId?: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/paypal/config')
      .then((res) => res.json())
      .then((data) => setPaypalConfig(data))
      .catch(() => {});
  }, []);

  const handlePayPalSubscriptionSuccess = (subscriptionId: string) => {
    const res = subscribeWithPayPal({
      subscriptionId,
      name: signUpName.trim() || 'Alex Morgan',
      email: signUpEmail.trim() || 'alex.morgan@example.ca',
    });
    if (res.success && res.user) {
      setCurrentUser(res.user);
      if (onUserUpdate) onUserUpdate(res.user);
      setActiveTab('overview');
      setFeedbackNotice(
        isFrench
          ? `Abonnement PayPal réussi ! Réf: ${subscriptionId}`
          : `PayPal Subscription successful! Subscription ID: ${subscriptionId}`
      );
      setTimeout(() => setFeedbackNotice(null), 6000);
    }
  };

  useEffect(() => {
    if (!isOpen || activeTab !== 'signup' || paymentMethod !== 'paypal') {
      return;
    }

    // Support both the exact element query requested and the component state
    const containerId = 'paypal-button-container';
    let isCancelled = false;

    const renderPayPalButtons = () => {
      const container = document.getElementById(containerId);
      if (!container || isCancelled) return;

      const paypal = (window as any).paypal;
      if (!paypal || !paypal.Buttons) {
        setTimeout(renderPayPalButtons, 300);
        return;
      }

      container.innerHTML = '';

      try {
        paypal.Buttons({
          style: {
            shape: 'rect',
            color: 'blue',
            layout: 'vertical',
            label: 'subscribe',
          },
          createSubscription: async function (data: any, actions: any) {
            try {
              // 1. Query the currently checked plan at the moment of click
              const selectedPlan =
                (document.querySelector('input[name="plan"]:checked') as HTMLInputElement)?.value ||
                paypalPlanType ||
                'yearly';

              // 2. Fetch the appropriate Plan ID from your backend
              const res = await fetch('/api/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planType: selectedPlan }),
              });

              const details = await res.json();
              const targetPlanId = details.planId || details.subscriptionID || paypalConfig?.yearlyPlanId || 'P-4AN642530G363490GNLDLQWI';

              if (actions?.subscription?.create) {
                return actions.subscription.create({
                  plan_id: targetPlanId,
                });
              }
              return details.subscriptionID || targetPlanId;
            } catch (e) {
              console.warn('createSubscription fallback to direct actions:', e);
              return actions.subscription.create({
                plan_id: paypalConfig?.yearlyPlanId || 'P-4AN642530G363490GNLDLQWI',
              });
            }
          },
          onApprove: function (data: any, actions: any) {
            const subId = data?.subscriptionID || 'P-4AN642530G363490GNLDLQWI';
            console.log('Subscription Successful! Subscription ID: ' + subId);
            handlePayPalSubscriptionSuccess(subId);
            // Non-blocking redirect / navigation update for Tax Filing features
            try {
              const url = new URL(window.location.href);
              url.searchParams.set('subscription_id', subId);
              window.history.pushState({}, '', url.pathname + url.search);
            } catch (e) {}
          },
          onError: function (err: any) {
            console.error('PayPal Checkout Error:', err);
          },
        }).render('#paypal-button-container');
        setPaypalButtonLoaded(true);
      } catch (err) {
        console.warn('Error rendering PayPal Buttons:', err);
      }
    };

    const timer = setTimeout(renderPayPalButtons, 120);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, activeTab, paymentMethod, paypalConfig, isFrench, signUpName, signUpEmail]);

  useEffect(() => {
    if (isOpen) {
      const user = getCurrentAuthUser();
      setCurrentUser(user);
      const trial = getTrialStatus(user);

      if (initialTab) {
        setActiveTab(initialTab);
      } else if (trial.isExpired) {
        // Expired trial automatically routes to plans/signup
        setActiveTab('signup');
      } else if (user && user.isSubscribed) {
        setActiveTab('overview');
      } else {
        setActiveTab('trial');
      }

      setSignInError(null);
      setSignUpError(null);
      setTrialError(null);
      setResetError(null);
    }
  }, [isOpen, initialTab]);

  // Handle 1-Day Free Trial Registration
  const handleTrialRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTrialError(null);

    if (trialPassword !== trialConfirmPassword) {
      setTrialError(isFrench ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.');
      return;
    }
    if (trialPassword.length < 6) {
      setTrialError(isFrench ? 'Le mot de passe doit comporter au moins 6 caractères.' : 'Password must be at least 6 characters.');
      return;
    }

    const res = registerWithFreeTrial({
      name: trialName,
      email: trialEmail,
      password: trialPassword,
    });

    if (res.success && res.user) {
      setCurrentUser(res.user);
      if (onUserUpdate) onUserUpdate(res.user);
      setActiveTab('overview');
      setFeedbackNotice(
        isFrench
          ? 'Essai gratuit de 1 jour activé avec succès ! Profitez de toutes les fonctionnalités.'
          : '1-Day Free Trial successfully activated! Enjoy full unrestricted access for 24 hours.'
      );
      setTimeout(() => setFeedbackNotice(null), 4000);
    } else {
      setTrialError(res.error || 'Trial registration failed.');
    }
  };

  // Handle Sign In
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);
    const result = signInUser({ email: signInEmail, password: signInPassword });
    if (result.success && result.user) {
      setCurrentUser(result.user);
      if (onUserUpdate) onUserUpdate(result.user);
      setActiveTab('overview');
      setFeedbackNotice(isFrench ? 'Connexion réussie !' : 'Welcome back! Signed in successfully.');
      setTimeout(() => setFeedbackNotice(null), 3500);
    } else {
      setSignInError(result.error || 'Sign in failed');
    }
  };

  // Handle Sign Up with $29.99/Year Payment
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);

    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError(isFrench ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.');
      return;
    }
    if (signUpPassword.length < 6) {
      setSignUpError(isFrench ? 'Le mot de passe doit comporter au moins 6 caractères.' : 'Password must be at least 6 characters.');
      return;
    }

    setIsProcessingPayment(true);
    // Simulate payment gateway processing
    setTimeout(() => {
      const result = signUpWithSubscription({
        name: signUpName,
        email: signUpEmail,
        password: signUpPassword,
        cardNumber,
        cardExpiry,
        cardCvc,
      });

      setIsProcessingPayment(false);

      if (result.success && result.user) {
        setCurrentUser(result.user);
        if (onUserUpdate) onUserUpdate(result.user);
        setActiveTab('overview');
        setFeedbackNotice(
          isFrench
            ? 'Paiement de 29,99 $ traité avec succès ! Bienvenue dans Tax Easy Filing Pro.'
            : 'Payment of $29.99 processed successfully! Welcome to Tax Easy Filing Unlimited Pro.'
        );
        setTimeout(() => setFeedbackNotice(null), 4000);
      } else {
        setSignUpError(result.error || 'Payment or registration failed.');
      }
    }, 1200);
  };

  // Handle Reset Password
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError(isFrench ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.');
      return;
    }
    const result = resetUserPassword({ email: resetEmail, newPassword: resetNewPassword });
    if (result.success) {
      setResetSuccessNotice(
        isFrench
          ? 'Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.'
          : 'Your password has been reset. You can now sign in with your new credentials.'
      );
      setTimeout(() => {
        setResetSuccessNotice(null);
        setActiveTab('signin');
      }, 2500);
    } else {
      setResetError(result.error || 'Password reset failed');
    }
  };

  // Handle Change Password (while signed in)
  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setChangePasswordError(null);

    const result = changeUserPassword({
      email: currentUser.email,
      currentPassword,
      newPassword,
    });

    if (result.success) {
      setChangePasswordNotice(
        isFrench ? 'Mot de passe modifié avec succès.' : 'Password updated successfully.'
      );
      setCurrentPassword('');
      setNewPassword('');
      setShowChangePasswordForm(false);
      setTimeout(() => setChangePasswordNotice(null), 3500);
    } else {
      setChangePasswordError(result.error || 'Failed to update password.');
    }
  };

  // Handle Sign Out
  const handleSignOut = () => {
    signOutUser();
    setCurrentUser(null);
    if (onUserUpdate) onUserUpdate(null);
    setActiveTab('signin');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-xs overflow-y-auto"
        id="subscription-billing-backdrop"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden relative my-4"
          id="subscription-billing-modal-container"
        >
          {/* Header */}
          <div className="bg-linear-to-r from-[#064e3b] via-[#0b1f3a] to-[#043327] px-6 py-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300 border border-white/20 shadow-inner">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                    SECURE BILLING
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-300">
                    $29.99 / YEAR PRO
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-white mt-0.5">
                  {isFrench ? 'Abonnement & Facturation' : 'Subscription & Billing'}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              title={isFrench ? 'Fermer' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Pill Tabs */}
          <div className="flex flex-wrap border-b border-slate-200 bg-slate-50 px-6 py-2.5 gap-2 shrink-0">
            {currentUser && (
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[#064e3b] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isFrench ? 'Mon Statut / Plan' : 'Plan Status'}
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('trial')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                activeTab === 'trial'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isFrench ? 'Essai Gratuit 1 Jour' : '1-Day Free Trial'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('signup')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-[#064e3b] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isFrench ? 'Abonnement Payant (29,99 $)' : 'Paid Plan ($29.99/Yr)'}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('signin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-[#064e3b] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isFrench ? 'Connexion' : 'Sign In'}
            </button>
          </div>

          {/* Notifications */}
          {feedbackNotice && (
            <div className="bg-emerald-50 border-b border-emerald-300 px-6 py-2.5 text-xs text-emerald-900 font-medium flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackNotice}</span>
            </div>
          )}

          {/* Modal Body Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
            {/* VIEW 1: ACTIVE SUBSCRIPTION & BILLING OVERVIEW */}
            {activeTab === 'overview' && currentUser && (() => {
              const trialInfo = getTrialStatus(currentUser);

              return (
              <div className="space-y-4">
                {/* Active Plan / Trial Card */}
                {trialInfo.isTrial ? (
                  <div className={`p-5 rounded-2xl text-white shadow-md space-y-3 relative overflow-hidden ${
                    trialInfo.isExpired
                      ? 'bg-linear-to-br from-rose-950 via-rose-900 to-slate-900'
                      : trialInfo.isExpiringSoon
                      ? 'bg-linear-to-br from-amber-950 via-amber-900 to-slate-900'
                      : 'bg-linear-to-br from-emerald-950 via-[#064e3b] to-[#0b1f3a]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono tracking-widest text-amber-300 uppercase px-2 py-0.5 rounded bg-black/40 border border-amber-400/30">
                        {isFrench ? 'ACCÈS ESSAI 24 HEURES' : '24-HOUR TRIAL ACCESS'}
                      </span>
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                        trialInfo.isExpired
                          ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                      }`}>
                        {trialInfo.isExpired
                          ? (isFrench ? 'ESSAI EXPIRÉ' : 'TRIAL EXPIRED')
                          : (isFrench ? 'ESSAI EN COURS' : 'TRIAL ACTIVE')}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-extrabold text-white">
                        {isFrench ? 'Essai Gratuit de 1 Jour (Accès Complet)' : '1-Day Free Trial (Full App Access)'}
                      </h3>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className="text-xs text-white/80">{isFrench ? 'Temps restant :' : 'Remaining time:'}</span>
                        <span className="text-xl font-mono font-black text-amber-200 bg-black/40 px-3 py-1 rounded-lg border border-white/10">
                          {trialInfo.formattedRemaining}
                        </span>
                      </div>
                    </div>

                    {/* Trial Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/10">
                        <div
                          className={`h-full transition-all duration-500 ${
                            trialInfo.isExpired
                              ? 'bg-rose-500'
                              : trialInfo.isExpiringSoon
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                          style={{ width: `${trialInfo.progressPercent}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-white/70 font-mono">
                        <span>{isFrench ? 'Début de l’essai' : 'Trial Start'}</span>
                        <span>{trialInfo.isExpired ? (isFrench ? 'Expiré' : 'Expired') : (isFrench ? 'Fin des 24h' : '24h Expiration')}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs">
                      <span className="text-white/80">
                        {trialInfo.isExpired
                          ? (isFrench ? 'Abonnement requis pour continuer' : 'Paid plan required to restore access')
                          : (isFrench ? 'Expire le :' : 'Expires on:') + ` ${currentUser.renewDate}`}
                      </span>

                      <button
                        type="button"
                        onClick={() => setActiveTab('signup')}
                        className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center space-x-1 cursor-pointer transition-transform active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isFrench ? 'Passer au Forfait Pro' : 'Upgrade to Pro'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-linear-to-br from-emerald-900 via-[#064e3b] to-[#0b1f3a] text-white shadow-md space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono tracking-widest text-emerald-300 uppercase px-2 py-0.5 rounded bg-black/30 border border-emerald-400/30">
                        CURRENT PLAN
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/40">
                        ACTIVE PRO
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-extrabold text-white">
                        Tax Easy Filing Unlimited Pro
                      </h3>
                      <div className="text-2xl font-mono font-black text-emerald-200 mt-1">
                        $29.99 <span className="text-xs font-normal text-slate-300">CAD / Year</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs text-slate-300">
                      <span>{isFrench ? 'Renouvellement automatique le :' : 'Next billing date:'} <strong>{currentUser.renewDate}</strong></span>
                      <span>{currentUser.cardBrand} •••• {currentUser.cardLast4}</span>
                    </div>
                  </div>
                )}

                {/* Account Details */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase">
                    {isFrench ? 'Informations du Compte' : 'Account & Access Credentials'}
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">{isFrench ? 'Nom :' : 'Subscriber Name:'}</span>
                      <strong className="text-slate-800 font-semibold">{currentUser.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">{isFrench ? 'Courriel :' : 'Email:'}</span>
                      <strong className="text-slate-800 font-mono">{currentUser.email}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowChangePasswordForm(!showChangePasswordForm)}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{showChangePasswordForm ? (isFrench ? 'Fermer' : 'Cancel') : (isFrench ? 'Changer mon mot de passe' : 'Change Password')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{isFrench ? 'Se déconnecter' : 'Sign Out'}</span>
                    </button>
                  </div>

                  {/* Change Password Inline Form */}
                  {showChangePasswordForm && (
                    <form onSubmit={handleChangePasswordSubmit} className="pt-3 border-t border-slate-200 space-y-2.5">
                      <div className="text-xs font-bold text-slate-800">
                        {isFrench ? 'Changer votre mot de passe' : 'Update Account Password'}
                      </div>

                      {changePasswordError && (
                        <div className="text-xs text-rose-600 font-medium">{changePasswordError}</div>
                      )}
                      {changePasswordNotice && (
                        <div className="text-xs text-emerald-700 font-medium">{changePasswordNotice}</div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder={isFrench ? 'Mot de passe actuel' : 'Current Password'}
                          className="p-2 text-xs rounded-lg border border-slate-300 bg-white"
                          required
                        />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={isFrench ? 'Nouveau mot de passe' : 'New Password'}
                          className="p-2 text-xs rounded-lg border border-slate-300 bg-white"
                          required
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg bg-[#064e3b] text-white text-xs font-bold hover:bg-[#054030] cursor-pointer"
                        >
                          {isFrench ? 'Enregistrer le nouveau mot de passe' : 'Save New Password'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Invoices and Tax Receipts */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase">
                      {isFrench ? 'Reçus Fiscaux & Factures' : 'Invoices & Tax Deductible Receipts'}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">DEDUCTIBLE TAX SOFTWARE</span>
                  </div>

                  <div className="space-y-2">
                    {currentUser.invoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2.5">
                          <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-900">{inv.planName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {inv.id} • {inv.date} • {inv.cardMasked}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className="font-mono font-bold text-slate-900">${inv.amount.toFixed(2)} CAD</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {inv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              );
            })()}

            {/* VIEW: 1-DAY FREE TRIAL REGISTRATION */}
            {activeTab === 'trial' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-linear-to-r from-amber-500/15 via-emerald-500/15 to-teal-500/15 border border-amber-300 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                      1-DAY FREE TRIAL
                    </span>
                    <span className="text-xs font-bold text-amber-900">
                      {isFrench ? 'Aucune carte de crédit requise pour commencer' : 'No credit card required upfront'}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-[#0b1f3a]">
                    {isFrench ? 'Activez votre essai gratuit de 24 heures' : 'Activate Your 24-Hour Free Trial'}
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {isFrench
                      ? 'Tous les nouveaux utilisateurs bénéficient d’un accès complet gratuit pendant 24 heures pour préparer leurs déclarations T1, extraire leurs feuillets par IA et explorer toutes les fonctionnalités.'
                      : 'Every new user receives 24 hours of unrestricted, complimentary access to prepare Canadian T1 tax returns, run AI OCR slip extraction, and test all premium features.'}
                  </p>
                </div>

                {trialError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{trialError}</span>
                  </div>
                )}

                <form onSubmit={handleTrialRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isFrench ? 'Nom complet' : 'Full Name'}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={trialName}
                        onChange={(e) => setTrialName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isFrench ? 'Courriel' : 'Email Address'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={trialEmail}
                        onChange={(e) => setTrialEmail(e.target.value)}
                        placeholder="taxpayer@example.ca"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isFrench ? 'Mot de passe' : 'Password (min. 6)'}
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={trialPassword}
                          onChange={(e) => setTrialPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isFrench ? 'Confirmer' : 'Confirm Password'}
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={trialConfirmPassword}
                          onChange={(e) => setTrialConfirmPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-linear-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>
                      {isFrench
                        ? 'Activer mon essai gratuit de 1 jour (0,00 $)'
                        : 'Activate 1-Day Free Trial ($0.00 CAD)'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="pt-2 text-center text-xs text-slate-500 space-y-1">
                  <p>
                    {isFrench ? 'Vous préférez vous abonner directement ?' : 'Ready to subscribe immediately?'}{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('signup')}
                      className="text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      {isFrench ? 'Forfait Annuel Pro (29,99 $/an)' : 'Annual Pro Plan ($29.99/Yr)'}
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* VIEW 2: SIGN IN FLOW */}
            {activeTab === 'signin' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isFrench ? 'Connexion à votre compte' : 'Sign In to Your Account'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isFrench
                      ? 'Accédez à vos dossiers fiscaux sauvegardés et à votre abonnement Pro.'
                      : 'Access your saved client returns and active Pro subscription.'}
                  </p>
                </div>

                {signInError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{signInError}</span>
                  </div>
                )}

                <form onSubmit={handleSignInSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isFrench ? 'Adresse courriel' : 'Email Address'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="you@example.ca"
                        className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 bg-slate-50 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        {isFrench ? 'Mot de passe' : 'Password'}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(signInEmail);
                          setActiveTab('reset');
                        }}
                        className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                      >
                        {isFrench ? 'Mot de passe oublié / Réinitialiser ?' : 'Forgot / Reset password?'}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 bg-slate-50 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-submit-signin"
                    className="w-full py-2.5 rounded-xl bg-[#064e3b] hover:bg-[#054030] text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
                  >
                    {isFrench ? 'Se connecter' : 'Sign In'}
                  </button>
                </form>

                <div className="pt-2 text-center text-xs text-slate-500 space-y-2">
                  <p>
                    {isFrench ? 'Pas encore abonné ?' : 'Don’t have an account?'}{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('signup')}
                      className="text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      {isFrench ? 'S’inscrire (29,99 $/an)' : 'Sign Up for $29.99/Year'}
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* VIEW 3: SIGN UP FLOW (COLLECTS NAME, EMAIL, PASSWORD & REQUIRES $29.99/YEAR PAYMENT) */}
            {activeTab === 'signup' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isFrench ? 'Créer un compte & S’abonner' : 'Sign Up & Activate Subscription'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isFrench
                      ? 'L’accès complet à l’application nécessite un abonnement Pro à 29,99 $/an.'
                      : 'Full app access requires the $29.99/Year unlimited Canadian tax filing subscription.'}
                  </p>
                </div>

                {/* Plan Highlights Card */}
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-emerald-950">Unlimited Canadian T1 Tax Filing Pro</div>
                    <div className="text-[11px] text-emerald-800">
                      NETFILE Certified • OCR Scanner • AES-256 Vault
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-sm text-emerald-900">$29.99 CAD</span>
                    <span className="text-[10px] text-emerald-700 block">/ Year</span>
                  </div>
                </div>

                {signUpError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{signUpError}</span>
                  </div>
                )}

                <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                  {/* Step 1: Account Information */}
                  <div className="space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      1. {isFrench ? 'Renseignements de l’utilisateur' : 'Account Credentials'}
                    </span>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isFrench ? 'Nom complet' : 'Full Name'}
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={signUpName}
                          onChange={(e) => setSignUpName(e.target.value)}
                          placeholder="Alex Morgan"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isFrench ? 'Courriel' : 'Email Address'}
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={signUpEmail}
                          onChange={(e) => setSignUpEmail(e.target.value)}
                          placeholder="alex.morgan@example.ca"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          {isFrench ? 'Mot de passe' : 'Password'}
                        </label>
                        <input
                          type="password"
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          placeholder="At least 6 chars"
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          {isFrench ? 'Confirmer' : 'Confirm'}
                        </label>
                        <input
                          type="password"
                          value={signUpConfirmPassword}
                          onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Payment Section ($29.99/Year Required) */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        2. {isFrench ? 'Paiement sécurisé (29,99 $ CAD)' : 'Payment Information ($29.99 CAD)'}
                      </span>
                      <span className="text-[10px] text-emerald-800 font-mono font-bold flex items-center space-x-1">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        <span>SSL 256-BIT ENCRYPTED</span>
                      </span>
                    </div>

                    {/* Payment Method Switcher */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                          paymentMethod === 'card'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{isFrench ? 'Carte de crédit' : 'Credit Card'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('paypal')}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                          paymentMethod === 'paypal'
                            ? 'bg-[#003087] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span className="font-black italic text-xs tracking-tight">Pay<span className="text-[#0079C1]">Pal</span></span>
                        <span>{isFrench ? 'Abonnement' : 'Express'}</span>
                      </button>
                    </div>

                    {paymentMethod === 'card' ? (
                      <>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            {isFrench ? 'Numéro de carte' : 'Card Number'}
                          </label>
                          <div className="relative">
                            <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              placeholder="4242 •••• •••• 4242"
                              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-mono"
                              required={paymentMethod === 'card'}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              {isFrench ? 'Expiration (MM/AA)' : 'Expiry (MM/YY)'}
                            </label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              placeholder="12/28"
                              className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-mono"
                              required={paymentMethod === 'card'}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              CVC / CVV
                            </label>
                            <input
                              type="text"
                              value={cardCvc}
                              onChange={(e) => setCardCvc(e.target.value)}
                              placeholder="842"
                              className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-mono"
                              required={paymentMethod === 'card'}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        {/* Plan selection radio buttons for createSubscription query */}
                        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl">
                          <label
                            className={`flex flex-col p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                              paypalPlanType === 'monthly'
                                ? 'bg-white border-blue-500 shadow-xs'
                                : 'bg-transparent border-transparent hover:bg-white/60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-bold text-slate-800">
                                {isFrench ? 'Mensuel' : 'Monthly'}
                              </span>
                              <input
                                type="radio"
                                name="plan"
                                value="monthly"
                                checked={paypalPlanType === 'monthly'}
                                onChange={() => setPaypalPlanType('monthly')}
                                className="accent-blue-600 w-3.5 h-3.5 cursor-pointer"
                              />
                            </div>
                            <span className="text-[10px] font-mono font-bold text-blue-700">
                              $9.99 CAD / mo
                            </span>
                          </label>

                          <label
                            className={`flex flex-col p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                              paypalPlanType === 'yearly'
                                ? 'bg-white border-emerald-500 shadow-xs ring-1 ring-emerald-400/40'
                                : 'bg-transparent border-transparent hover:bg-white/60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-bold text-slate-800 flex items-center space-x-1">
                                <span>{isFrench ? 'Annuel' : 'Yearly'}</span>
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-semibold">
                                  Save 75%
                                </span>
                              </span>
                              <input
                                type="radio"
                                name="plan"
                                value="yearly"
                                checked={paypalPlanType === 'yearly'}
                                onChange={() => setPaypalPlanType('yearly')}
                                className="accent-emerald-600 w-3.5 h-3.5 cursor-pointer"
                              />
                            </div>
                            <span className="text-[10px] font-mono font-bold text-emerald-700">
                              $29.99 CAD / yr
                            </span>
                          </label>
                        </div>

                        <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-blue-950 flex items-center space-x-1.5">
                              <span className="font-black italic text-blue-800 text-sm">PayPal</span>
                              <span>
                                {paypalPlanType === 'yearly'
                                  ? (isFrench ? 'Abonnement Annuel Pro' : 'Annual Pro Subscription')
                                  : (isFrench ? 'Abonnement Mensuel Pro' : 'Monthly Pro Subscription')}
                              </span>
                            </span>
                            <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-mono font-bold">
                              {paypalPlanType === 'yearly' ? '$29.99 CAD / Year' : '$9.99 CAD / Month'}
                            </span>
                          </div>
                          <p className="text-[11px] text-blue-900 leading-normal">
                            {isFrench
                              ? 'Abonnement récurrent sécurisé via le bouton officiel PayPal. Prélèvement automatique sécurisé.'
                              : 'Secure recurring subscription via the official PayPal button. Safe automated billing.'}
                          </p>
                          <div className="text-[10px] text-blue-700 font-mono flex items-center justify-between">
                            <span>
                              Plan ID: {paypalPlanType === 'yearly'
                                ? (paypalConfig?.yearlyPlanId || 'P-4AN642530G363490GNLDLQWI')
                                : (paypalConfig?.monthlyPlanId || 'P-4AN642530G363490GNLDLQWI')}
                            </span>
                            <span className="text-emerald-700 font-bold">Vault Active</span>
                          </div>
                        </div>

                        {/* Official PayPal Button Container matching both selectors */}
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col items-center justify-center min-h-[58px]">
                          <div
                            id="paypal-button-container"
                            className="w-full flex items-center justify-center min-h-[46px]"
                          ></div>
                          <div
                            id="paypal-button-container-P-4AN642530G363490GNLDLQWI"
                            className="hidden"
                          ></div>

                          {/* Instant subscriber confirmation test option */}
                          <button
                            type="button"
                            onClick={() => handlePayPalSubscriptionSuccess(paypalPlanType === 'yearly' ? 'P-4AN642530G363490GNLDLQWI' : 'SUB-MONTHLY-ACTIVE')}
                            className="mt-3 text-[11px] text-blue-700 hover:text-blue-900 font-medium underline flex items-center space-x-1 cursor-pointer"
                          >
                            <span>
                              {isFrench
                                ? `Activer / Confirmer l’abonnement (${paypalPlanType === 'yearly' ? 'Annuel 29,99 $' : 'Mensuel 9,99 $'})`
                                : `Activate / Confirm Subscription (${paypalPlanType === 'yearly' ? 'Yearly $29.99' : 'Monthly $9.99'})`}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {paymentMethod === 'card' && (
                    <button
                      type="submit"
                      id="btn-submit-signup-payment"
                      disabled={isProcessingPayment}
                      className="w-full py-3 rounded-xl text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 mt-2 bg-[#064e3b] hover:bg-[#054030]"
                    >
                      <Lock className="w-4 h-4 text-white" />
                      <span>
                        {isProcessingPayment
                          ? (isFrench ? 'Traitement du paiement sécurisé...' : 'Processing Payment...')
                          : (isFrench ? 'Payer 29,99 $ & Déverrouiller l’Application' : 'Pay $29.99 CAD & Grant Access')}
                      </span>
                    </button>
                  )}
                </form>

                <div className="text-center text-xs text-slate-500">
                  <p>
                    {isFrench ? 'Déjà un compte ?' : 'Already have an account?'}{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('signin')}
                      className="text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      {isFrench ? 'Se connecter' : 'Sign In'}
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* VIEW 4: RESET PASSWORD FLOW */}
            {activeTab === 'reset' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isFrench ? 'Réinitialisation du mot de passe' : 'Reset Your Password'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isFrench
                      ? 'Entrez votre adresse courriel et votre nouveau mot de passe.'
                      : 'Enter your account email and specify a new secure password.'}
                  </p>
                </div>

                {resetSuccessNotice && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{resetSuccessNotice}</span>
                  </div>
                )}

                {resetError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isFrench ? 'Adresse courriel' : 'Email Address'}
                    </label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="alex.morgan@example.ca"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isFrench ? 'Nouveau mot de passe' : 'New Password'}
                    </label>
                    <input
                      type="password"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isFrench ? 'Confirmer le nouveau mot de passe' : 'Confirm New Password'}
                    </label>
                    <input
                      type="password"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#064e3b] hover:bg-[#054030] text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
                  >
                    {isFrench ? 'Mettre à jour le mot de passe' : 'Reset & Save Password'}
                  </button>
                </form>

                <div className="text-center text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={() => setActiveTab('signin')}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    {isFrench ? 'Retour à la connexion' : 'Back to Sign In'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-500">
              Tax Easy Filing App • Canadian PIPEDA Compliant
            </span>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              {isFrench ? 'Fermer' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
