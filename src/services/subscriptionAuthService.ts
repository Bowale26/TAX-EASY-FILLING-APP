/**
 * Subscription & Billing Authentication Service
 * Manages user accounts, passwords (with reset and change capabilities),
 * and the $29.99/Year Pro subscription required for app access.
 */

export interface BillingInvoice {
  id: string;
  date: string;
  amount: number;
  currency: 'CAD';
  planName: string;
  status: 'Paid';
  cardMasked: string;
  pdfUrl?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  isSubscribed: boolean;
  subscriptionPlan: string;
  subscriptionPrice: number; // 29.99
  billingCycle: 'Annual' | 'Trial' | 'Monthly';
  subscriptionStatus: 'active' | 'trial' | 'trial_expired' | 'cancelled' | 'pending';
  subscribedAt: string;
  renewDate: string;
  cardLast4: string;
  cardBrand: string;
  invoices: BillingInvoice[];
  // 1-Day Free Trial Properties
  isTrial?: boolean;
  trialStartedAt?: string;
  trialExpiresAt?: string;
}

export interface TrialStatusInfo {
  isTrial: boolean;
  isExpired: boolean;
  isActiveTrial: boolean;
  hasPaidSubscription: boolean;
  remainingMs: number;
  remainingHours: number;
  remainingMinutes: number;
  remainingSeconds: number;
  formattedRemaining: string;
  progressPercent: number; // 0 to 100 elapsed
  isExpiringSoon: boolean; // < 4 hours remaining
}

const AUTH_USER_STORAGE_KEY = 'tax_easy_active_auth_user_v2';
const REGISTERED_USERS_KEY = 'tax_easy_registered_accounts_v2';

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface StoredAccountRecord {
  user: AuthUser;
  passwordHash: string; // Plaintext or simulated hash
}

// Helper to calculate exact trial status and remaining time
export function getTrialStatus(user: AuthUser | null): TrialStatusInfo {
  if (!user) {
    return {
      isTrial: false,
      isExpired: true,
      isActiveTrial: false,
      hasPaidSubscription: false,
      remainingMs: 0,
      remainingHours: 0,
      remainingMinutes: 0,
      remainingSeconds: 0,
      formattedRemaining: '00h 00m',
      progressPercent: 100,
      isExpiringSoon: false,
    };
  }

  // Active paid subscription has full permanent access
  if (user.isSubscribed && !user.isTrial && user.subscriptionStatus === 'active') {
    return {
      isTrial: false,
      isExpired: false,
      isActiveTrial: false,
      hasPaidSubscription: true,
      remainingMs: Infinity,
      remainingHours: 8760,
      remainingMinutes: 0,
      remainingSeconds: 0,
      formattedRemaining: 'Active Pro Plan',
      progressPercent: 0,
      isExpiringSoon: false,
    };
  }

  // If user is in Trial mode
  if (user.isTrial || user.subscriptionStatus === 'trial' || user.subscriptionStatus === 'trial_expired') {
    const started = user.trialStartedAt ? new Date(user.trialStartedAt).getTime() : Date.now() - ONE_DAY_MS;
    const expires = user.trialExpiresAt ? new Date(user.trialExpiresAt).getTime() : started + ONE_DAY_MS;
    const now = Date.now();
    const remainingMs = Math.max(0, expires - now);
    const isExpired = remainingMs <= 0 || user.subscriptionStatus === 'trial_expired';

    const totalDuration = Math.max(1, expires - started);
    const elapsed = Math.max(0, now - started);
    const progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const remainingSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

    const formattedRemaining = `${String(remainingHours).padStart(2, '0')}h ${String(remainingMinutes).padStart(2, '0')}m ${String(remainingSeconds).padStart(2, '0')}s`;
    const isExpiringSoon = !isExpired && remainingHours < 4;

    return {
      isTrial: true,
      isExpired,
      isActiveTrial: !isExpired,
      hasPaidSubscription: false,
      remainingMs,
      remainingHours,
      remainingMinutes,
      remainingSeconds,
      formattedRemaining,
      progressPercent,
      isExpiringSoon,
    };
  }

  // Unsubscribed/expired account
  return {
    isTrial: false,
    isExpired: true,
    isActiveTrial: false,
    hasPaidSubscription: false,
    remainingMs: 0,
    remainingHours: 0,
    remainingMinutes: 0,
    remainingSeconds: 0,
    formattedRemaining: 'Expired',
    progressPercent: 100,
    isExpiringSoon: false,
  };
}

// Initial demo user with Active 1-Day Free Trial
export function createNewTrialUser(name: string, email: string): AuthUser {
  const now = new Date();
  const expires = new Date(now.getTime() + ONE_DAY_MS);

  return {
    id: `usr_${Date.now().toString(36)}`,
    name: name.trim(),
    email: email.trim(),
    isSubscribed: true,
    subscriptionPlan: '1-Day Free Trial (Full App Access)',
    subscriptionPrice: 0,
    billingCycle: 'Trial',
    subscriptionStatus: 'trial',
    subscribedAt: now.toISOString(),
    renewDate: expires.toISOString().split('T')[0],
    cardLast4: 'FREE',
    cardBrand: 'Trial',
    invoices: [
      {
        id: `INV-TRIAL-${Math.floor(1000 + Math.random() * 9000)}`,
        date: now.toISOString().split('T')[0],
        amount: 0,
        currency: 'CAD',
        planName: '1-Day Free Trial Access ($0.00)',
        status: 'Paid',
        cardMasked: 'Free Trial',
      },
    ],
    isTrial: true,
    trialStartedAt: now.toISOString(),
    trialExpiresAt: expires.toISOString(),
  };
}

// Default new user demo configured with active 1-Day Free Trial
const DEFAULT_DEMO_USER: AuthUser = (() => {
  const now = new Date();
  const expires = new Date(now.getTime() + 23.5 * 60 * 60 * 1000); // 23.5 hours left
  return {
    id: 'usr_demo_alex_2025',
    name: 'Alex Morgan',
    email: 'alex.morgan@example.ca',
    isSubscribed: true,
    subscriptionPlan: '1-Day Free Trial (Full App Access)',
    subscriptionPrice: 0,
    billingCycle: 'Trial',
    subscriptionStatus: 'trial',
    subscribedAt: now.toISOString(),
    renewDate: expires.toISOString().split('T')[0],
    cardLast4: 'FREE',
    cardBrand: 'Trial',
    invoices: [
      {
        id: 'INV-TRIAL-2026',
        date: now.toISOString().split('T')[0],
        amount: 0,
        currency: 'CAD',
        planName: '1-Day Free Trial ($0.00 CAD)',
        status: 'Paid',
        cardMasked: 'Free Trial',
      },
    ],
    isTrial: true,
    trialStartedAt: now.toISOString(),
    trialExpiresAt: expires.toISOString(),
  };
})();

function getStoredAccounts(): StoredAccountRecord[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  const initial: StoredAccountRecord[] = [
    {
      user: DEFAULT_DEMO_USER,
      passwordHash: 'Password2025!',
    },
  ];
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(initial));
  return initial;
}

function saveStoredAccounts(accounts: StoredAccountRecord[]): void {
  try {
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.warn('Failed to save accounts:', err);
  }
}

export function getCurrentAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  // Default to demo user for seamless app access, but user can sign out/switch anytime
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_USER));
  return DEFAULT_DEMO_USER;
}

export function setCurrentAuthUser(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    }
  } catch {}
}

export function signUpWithSubscription(params: {
  name: string;
  email: string;
  password: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
}): { success: boolean; user?: AuthUser; error?: string } {
  const accounts = getStoredAccounts();
  const existing = accounts.find((a) => a.user.email.toLowerCase() === params.email.toLowerCase().trim());

  if (existing) {
    return {
      success: false,
      error: 'An account with this email address already exists. Please Sign In instead.',
    };
  }

  const cleanLast4 = params.cardNumber.replace(/\s+/g, '').slice(-4) || '8821';
  const now = new Date();
  const renew = new Date(now);
  renew.setFullYear(renew.getFullYear() + 1);

  const newUser: AuthUser = {
    id: `usr_${Date.now().toString(36)}`,
    name: params.name.trim(),
    email: params.email.trim(),
    isSubscribed: true,
    isTrial: false,
    subscriptionPlan: 'Tax Easy Filing Unlimited Pro — $29.99/Year',
    subscriptionPrice: 29.99,
    billingCycle: 'Annual',
    subscriptionStatus: 'active',
    subscribedAt: now.toISOString(),
    renewDate: renew.toISOString().split('T')[0],
    cardLast4: cleanLast4,
    cardBrand: params.cardNumber.startsWith('5') ? 'Mastercard' : 'Visa',
    invoices: [
      {
        id: `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        date: now.toISOString().split('T')[0],
        amount: 29.99,
        currency: 'CAD',
        planName: 'Annual Pro Subscription ($29.99/Year)',
        status: 'Paid',
        cardMasked: `•••• ${cleanLast4}`,
      },
    ],
  };

  accounts.push({
    user: newUser,
    passwordHash: params.password,
  });

  saveStoredAccounts(accounts);
  setCurrentAuthUser(newUser);

  return { success: true, user: newUser };
}

export function signInUser(params: {
  email: string;
  password: string;
}): { success: boolean; user?: AuthUser; error?: string } {
  const accounts = getStoredAccounts();
  const found = accounts.find((a) => a.user.email.toLowerCase() === params.email.toLowerCase().trim());

  if (!found) {
    return {
      success: false,
      error: 'No account registered with this email address. Please Sign Up.',
    };
  }

  if (found.passwordHash !== params.password) {
    return {
      success: false,
      error: 'Incorrect password. Please verify your credentials or use "Reset Password".',
    };
  }

  if (!found.user.isSubscribed) {
    return {
      success: false,
      error: 'Account subscription is inactive. Please renew the $29.99/Year plan to proceed.',
    };
  }

  setCurrentAuthUser(found.user);
  return { success: true, user: found.user };
}

export function resetUserPassword(params: {
  email: string;
  newPassword: string;
}): { success: boolean; error?: string } {
  const accounts = getStoredAccounts();
  const idx = accounts.findIndex((a) => a.user.email.toLowerCase() === params.email.toLowerCase().trim());

  if (idx < 0) {
    return {
      success: false,
      error: 'No account registered with this email address.',
    };
  }

  accounts[idx].passwordHash = params.newPassword;
  saveStoredAccounts(accounts);

  // Update active session if matching
  const current = getCurrentAuthUser();
  if (current && current.email.toLowerCase() === params.email.toLowerCase().trim()) {
    setCurrentAuthUser(accounts[idx].user);
  }

  return { success: true };
}

export function changeUserPassword(params: {
  email: string;
  currentPassword: string;
  newPassword: string;
}): { success: boolean; error?: string } {
  const accounts = getStoredAccounts();
  const idx = accounts.findIndex((a) => a.user.email.toLowerCase() === params.email.toLowerCase().trim());

  if (idx < 0) {
    return { success: false, error: 'User account not found.' };
  }

  if (accounts[idx].passwordHash !== params.currentPassword) {
    return { success: false, error: 'Current password does not match.' };
  }

  accounts[idx].passwordHash = params.newPassword;
  saveStoredAccounts(accounts);
  return { success: true };
}

export function signOutUser(): void {
  setCurrentAuthUser(null);
}

// Register new user with 1-Day Free Trial (No credit card required upfront)
export function registerWithFreeTrial(params: {
  name: string;
  email: string;
  password: string;
}): { success: boolean; user?: AuthUser; error?: string } {
  const accounts = getStoredAccounts();
  const existing = accounts.find((a) => a.user.email.toLowerCase() === params.email.toLowerCase().trim());

  if (existing) {
    return {
      success: false,
      error: 'An account with this email address already exists. Please Sign In to continue.',
    };
  }

  const newTrialUser = createNewTrialUser(params.name, params.email);

  accounts.push({
    user: newTrialUser,
    passwordHash: params.password,
  });

  saveStoredAccounts(accounts);
  setCurrentAuthUser(newTrialUser);

  return { success: true, user: newTrialUser };
}

// Upgrade existing or trial user to paid plan (Card)
export function upgradeUserToPaidSubscription(params: {
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  planName?: string;
  price?: number;
}): { success: boolean; user: AuthUser } {
  const current = getCurrentAuthUser();
  const accounts = getStoredAccounts();
  const email = current?.email.toLowerCase() || 'user@example.ca';
  const name = current?.name || 'Taxpayer';
  const existingIdx = accounts.findIndex((a) => a.user.email.toLowerCase() === email);

  const cleanLast4 = params.cardNumber.replace(/\s+/g, '').slice(-4) || '4242';
  const now = new Date();
  const renew = new Date(now);
  renew.setFullYear(renew.getFullYear() + 1);

  const upgradedUser: AuthUser = {
    id: current?.id || `usr_${Date.now().toString(36)}`,
    name,
    email,
    isSubscribed: true,
    subscriptionPlan: params.planName || 'Tax Easy Filing Unlimited Pro — $29.99/Year',
    subscriptionPrice: params.price || 29.99,
    billingCycle: 'Annual',
    subscriptionStatus: 'active',
    subscribedAt: now.toISOString(),
    renewDate: renew.toISOString().split('T')[0],
    cardLast4: cleanLast4,
    cardBrand: params.cardNumber.startsWith('5') ? 'Mastercard' : 'Visa',
    invoices: [
      {
        id: `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        date: now.toISOString().split('T')[0],
        amount: params.price || 29.99,
        currency: 'CAD',
        planName: params.planName || 'Annual Pro Subscription ($29.99/Year)',
        status: 'Paid',
        cardMasked: `•••• ${cleanLast4}`,
      },
      ...(current?.invoices || []),
    ],
    isTrial: false,
    trialStartedAt: current?.trialStartedAt,
    trialExpiresAt: current?.trialExpiresAt,
  };

  if (existingIdx >= 0) {
    accounts[existingIdx].user = upgradedUser;
  } else {
    accounts.push({
      user: upgradedUser,
      passwordHash: 'Password2025!',
    });
  }

  saveStoredAccounts(accounts);
  setCurrentAuthUser(upgradedUser);

  return { success: true, user: upgradedUser };
}

// Development helper to simulate 1-day trial expiration instantly for testing
export function expireCurrentTrialForTesting(): AuthUser | null {
  const current = getCurrentAuthUser();
  if (!current) return null;

  const accounts = getStoredAccounts();
  const idx = accounts.findIndex((a) => a.user.email.toLowerCase() === current.email.toLowerCase());

  const expiredUser: AuthUser = {
    ...current,
    isTrial: true,
    isSubscribed: false,
    subscriptionStatus: 'trial_expired',
    trialExpiresAt: new Date(Date.now() - 1000 * 60).toISOString(), // 1 min ago
  };

  if (idx >= 0) {
    accounts[idx].user = expiredUser;
    saveStoredAccounts(accounts);
  }
  setCurrentAuthUser(expiredUser);
  return expiredUser;
}

// Development helper to reset trial to fresh 24 hours
export function resetTrialToFresh24Hours(): AuthUser | null {
  const current = getCurrentAuthUser();
  if (!current) return null;

  const accounts = getStoredAccounts();
  const idx = accounts.findIndex((a) => a.user.email.toLowerCase() === current.email.toLowerCase());

  const now = new Date();
  const freshTrialUser: AuthUser = {
    ...current,
    isTrial: true,
    isSubscribed: true,
    subscriptionStatus: 'trial',
    trialStartedAt: now.toISOString(),
    trialExpiresAt: new Date(now.getTime() + ONE_DAY_MS).toISOString(),
  };

  if (idx >= 0) {
    accounts[idx].user = freshTrialUser;
    saveStoredAccounts(accounts);
  }
  setCurrentAuthUser(freshTrialUser);
  return freshTrialUser;
}

export function subscribeWithPayPal(params: {
  subscriptionId: string;
  name?: string;
  email?: string;
}): { success: boolean; user: AuthUser } {
  const accounts = getStoredAccounts();
  const email = params.email?.trim().toLowerCase() || getCurrentAuthUser()?.email.toLowerCase() || 'subscriber@example.ca';
  const name = params.name?.trim() || getCurrentAuthUser()?.name || 'PayPal Subscriber';

  const existingIdx = accounts.findIndex((a) => a.user.email.toLowerCase() === email);

  const now = new Date();
  const renew = new Date(now);
  renew.setFullYear(renew.getFullYear() + 1);

  const cleanLast4 = params.subscriptionId.slice(-4) || 'PAYP';

  const userObj: AuthUser = {
    id: existingIdx >= 0 ? accounts[existingIdx].user.id : `usr_${Date.now().toString(36)}`,
    name,
    email,
    isSubscribed: true,
    isTrial: false,
    subscriptionPlan: 'Tax Easy Filing Unlimited Pro — $29.99/Year (PayPal Subscriptions)',
    subscriptionPrice: 29.99,
    billingCycle: 'Annual',
    subscriptionStatus: 'active',
    subscribedAt: now.toISOString(),
    renewDate: renew.toISOString().split('T')[0],
    cardLast4: cleanLast4,
    cardBrand: 'PayPal',
    invoices: [
      {
        id: `PAYPAL-${params.subscriptionId}`,
        date: now.toISOString().split('T')[0],
        amount: 29.99,
        currency: 'CAD',
        planName: 'Annual Pro Subscription ($29.99/Year) via PayPal',
        status: 'Paid',
        cardMasked: `PayPal: ${params.subscriptionId}`,
      },
      ...(existingIdx >= 0 ? accounts[existingIdx].user.invoices || [] : []),
    ],
  };

  if (existingIdx >= 0) {
    accounts[existingIdx].user = userObj;
  } else {
    accounts.push({
      user: userObj,
      passwordHash: 'PayPalAutoPass123!',
    });
  }

  saveStoredAccounts(accounts);
  setCurrentAuthUser(userObj);

  return { success: true, user: userObj };
}

