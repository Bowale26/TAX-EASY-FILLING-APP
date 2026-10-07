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
  billingCycle: 'Annual';
  subscriptionStatus: 'active' | 'cancelled' | 'pending';
  subscribedAt: string;
  renewDate: string;
  cardLast4: string;
  cardBrand: string;
  invoices: BillingInvoice[];
}

const AUTH_USER_STORAGE_KEY = 'tax_easy_active_auth_user_v2';
const REGISTERED_USERS_KEY = 'tax_easy_registered_accounts_v2';

interface StoredAccountRecord {
  user: AuthUser;
  passwordHash: string; // Plaintext or simulated hash
}

// Initial demo user with Active $29.99/Year subscription
const DEFAULT_DEMO_USER: AuthUser = {
  id: 'usr_demo_alex_2025',
  name: 'Alex Morgan',
  email: 'alex.morgan@example.ca',
  isSubscribed: true,
  subscriptionPlan: 'Tax Easy Filing Unlimited Pro — $29.99/Year',
  subscriptionPrice: 29.99,
  billingCycle: 'Annual',
  subscriptionStatus: 'active',
  subscribedAt: '2026-01-15T10:00:00.000Z',
  renewDate: '2027-01-15',
  cardLast4: '4242',
  cardBrand: 'Visa',
  invoices: [
    {
      id: 'INV-2026-0881',
      date: '2026-01-15',
      amount: 29.99,
      currency: 'CAD',
      planName: 'Annual Pro Subscription ($29.99/Year)',
      status: 'Paid',
      cardMasked: '•••• 4242',
    },
  ],
};

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
