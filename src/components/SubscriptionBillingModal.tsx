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
} from '../services/subscriptionAuthService';

interface SubscriptionBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'fr';
}

export const SubscriptionBillingModal: React.FC<SubscriptionBillingModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const isFrench = language === 'fr';

  // Mode: 'overview' | 'signin' | 'signup' | 'reset'
  const [activeTab, setActiveTab] = useState<'overview' | 'signin' | 'signup' | 'reset'>('overview');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

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

  useEffect(() => {
    if (isOpen) {
      const user = getCurrentAuthUser();
      setCurrentUser(user);
      if (user && user.isSubscribed) {
        setActiveTab('overview');
      } else {
        setActiveTab('signin');
      }
      setSignInError(null);
      setSignUpError(null);
      setResetError(null);
    }
  }, [isOpen]);

  // Handle Sign In
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);
    const result = signInUser({ email: signInEmail, password: signInPassword });
    if (result.success && result.user) {
      setCurrentUser(result.user);
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
          <div className="flex border-b border-slate-200 bg-slate-50 px-6 py-2.5 gap-2 shrink-0">
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
                {isFrench ? 'Mon Abonnement' : 'Subscription Plan'}
              </button>
            )}

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

            <button
              type="button"
              onClick={() => setActiveTab('signup')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-[#064e3b] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isFrench ? 'Nouvel Abonné (29,99 $)' : 'Sign Up ($29.99/Yr)'}
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
            {activeTab === 'overview' && currentUser && (
              <div className="space-y-4">
                {/* Active Plan Card */}
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
                          required
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
                          required
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
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-submit-signup-payment"
                    disabled={isProcessingPayment}
                    className="w-full py-3 rounded-xl bg-[#064e3b] hover:bg-[#054030] text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 mt-2"
                  >
                    <Lock className="w-4 h-4 text-emerald-300" />
                    <span>
                      {isProcessingPayment
                        ? (isFrench ? 'Traitement du paiement sécurisé...' : 'Processing Payment...')
                        : (isFrench ? 'Payer 29,99 $ & Déverrouiller l’Application' : 'Pay $29.99 CAD & Grant Access')}
                    </span>
                  </button>
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
