/**
 * Client Files Manager & Multi-Client Session Management
 * Allows accountants/tax preparers to manage multiple different tax returns
 * within the same session with Tax Preparer ID and Client ID tracking
 * without overwriting data.
 */

import { AppTaxReturn, ProvinceCode } from '../types/tax';
import { SAMPLE_TAX_RETURN } from '../services/sampleData';
import { syncClientFilesToFirestore } from '../services/firebaseService';

export interface ClientFileRecord {
  clientId: string;
  preparerId: string;
  clientName: string;
  taxYear: number;
  province: ProvinceCode;
  filingStatus: 'Draft' | 'Review' | 'Filed' | 'Archived';
  lastModified: number;
  estimatedRefundOrOwing: number;
  slipsCount: number;
  notes?: string;
  taxReturn: AppTaxReturn;
}

const STORAGE_KEY = 'tax_easy_saved_client_files_v2';
const ACTIVE_CLIENT_KEY = 'tax_easy_active_client_id_v2';

export const DEFAULT_PREPARER_ID = 'CPA-JENKINS-884920';
export const DEFAULT_PREPARER_NAME = 'Sarah Jenkins, CPA';

export function getInitialSeedClientFiles(): ClientFileRecord[] {
  // Client 1: Alex Morgan (Tech Lead, Toronto ON)
  const client1Return: AppTaxReturn = {
    ...SAMPLE_TAX_RETURN,
    id: 'tr-alex-morgan-001',
    preparerId: DEFAULT_PREPARER_ID,
    preparerName: DEFAULT_PREPARER_NAME,
    clientId: 'CLI-2025-001',
    clientStatus: 'Active',
    clientNotes: 'Tech Lead at Shopify Commerce. Standard T4 with RRSP deductions and charitable donations.',
    filingStatus: 'Draft',
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  };

  // Client 2: Chloe Tremblay (Healthcare Consultant, Ottawa ON)
  const client2Return: AppTaxReturn = {
    ...SAMPLE_TAX_RETURN,
    id: 'tr-chloe-tremblay-002',
    preparerId: DEFAULT_PREPARER_ID,
    preparerName: DEFAULT_PREPARER_NAME,
    clientId: 'CLI-2025-002',
    clientStatus: 'Review',
    clientNotes: 'Senior Consultant at Ottawa Health Sciences. T4 and T4A pension income with union dues.',
    filingStatus: 'Draft',
    personal: {
      ...SAMPLE_TAX_RETURN.personal,
      firstName: 'Chloe',
      lastName: 'Tremblay',
      sin: '048-912-734',
      dateOfBirth: '1987-11-23',
      maritalStatus: 'married',
      hasSpouse: true,
      email: 'chloe.tremblay@example.ca',
      phone: '(613) 555-0144',
      streetAddress: '450 Laurier Avenue West',
      city: 'Ottawa',
      province: 'ON',
      postalCode: 'K1R 7X6',
    },
    t4Slips: [
      {
        id: 't4-ottawa-health-01',
        employerName: 'Ottawa Health Services Network',
        box14_employmentIncome: 94200,
        box16_cppContributions: 3867.5,
        box18_eiPremiums: 1049.12,
        box20_rppContributions: 4200,
        box22_incomeTaxDeducted: 21850,
        box24_eiInsurableEarnings: 63200,
        box26_cppPensionableEarnings: 68500,
        box44_unionDues: 850,
        box52_pensionAdjustment: 7200,
        verifiedByUser: true,
      },
    ],
    otherSlips: [
      {
        id: 't4a-ontario-pension-01',
        type: 'T4A',
        payerName: 'HOOPP Healthcare Pension Plan',
        description: 'Statement of Pension Income',
        amounts: {
          box016_pension: 12000,
          box022_taxDeducted: 1800,
        },
        verifiedByUser: true,
      },
    ],
    deductions: {
      ...SAMPLE_TAX_RETURN.deductions,
      rrspContributions: 4000,
      unionOrProfessionalDues: 850,
    },
    credits: {
      ...SAMPLE_TAX_RETURN.credits,
      charitableDonations: 1200,
      eligibleMedicalExpenses: 940,
    },
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  };

  // Client 3: David Chen (Creative Director & Investor, Vancouver BC)
  const client3Return: AppTaxReturn = {
    ...SAMPLE_TAX_RETURN,
    id: 'tr-david-chen-003',
    preparerId: DEFAULT_PREPARER_ID,
    preparerName: DEFAULT_PREPARER_NAME,
    clientId: 'CLI-2025-003',
    clientStatus: 'Filed',
    clientNotes: 'Pacific Creative Studios director with Canadian dividend and investment interest slips.',
    filingStatus: 'Filed',
    netfileConfirmationCode: 'CRA-BC-2025-992144',
    personal: {
      ...SAMPLE_TAX_RETURN.personal,
      firstName: 'David',
      lastName: 'Chen',
      sin: '071-842-195',
      dateOfBirth: '1990-04-18',
      maritalStatus: 'single',
      email: 'david.chen@example.ca',
      phone: '(604) 555-0182',
      streetAddress: '888 Burrard Street, Apt 1902',
      city: 'Vancouver',
      province: 'BC',
      postalCode: 'V6Z 1X9',
    },
    t4Slips: [
      {
        id: 't4-pacific-creative-01',
        employerName: 'Pacific Creative Studio Inc.',
        box14_employmentIncome: 62000,
        box16_cppContributions: 3867.5,
        box18_eiPremiums: 1049.12,
        box20_rppContributions: 1500,
        box22_incomeTaxDeducted: 11400,
        box24_eiInsurableEarnings: 62000,
        box26_cppPensionableEarnings: 62000,
        box44_unionDues: 0,
        box52_pensionAdjustment: 2400,
        verifiedByUser: true,
      },
    ],
    otherSlips: [
      {
        id: 't5-rbc-invest-01',
        type: 'T5',
        payerName: 'RBC Dominion Securities',
        description: 'Statement of Investment Income',
        amounts: {
          box10_eligibleDividends: 4500,
          box13_interest: 1200,
        },
        verifiedByUser: true,
      },
    ],
    deductions: {
      ...SAMPLE_TAX_RETURN.deductions,
      rrspContributions: 8500,
      employmentExpenses: 800,
    },
    credits: {
      ...SAMPLE_TAX_RETURN.credits,
      eligibleMedicalExpenses: 2100,
      charitableDonations: 450,
    },
    updatedAt: new Date(Date.now() - 14400000).toISOString(),
  };

  return [
    {
      clientId: 'CLI-2025-001',
      preparerId: DEFAULT_PREPARER_ID,
      clientName: 'Alex Morgan',
      taxYear: 2025,
      province: 'ON',
      filingStatus: 'Draft',
      lastModified: Date.now() - 3600000,
      estimatedRefundOrOwing: 3418.5,
      slipsCount: client1Return.t4Slips.length + client1Return.otherSlips.length,
      notes: client1Return.clientNotes,
      taxReturn: client1Return,
    },
    {
      clientId: 'CLI-2025-002',
      preparerId: DEFAULT_PREPARER_ID,
      clientName: 'Chloe Tremblay',
      taxYear: 2025,
      province: 'ON',
      filingStatus: 'Review',
      lastModified: Date.now() - 7200000,
      estimatedRefundOrOwing: 4892.1,
      slipsCount: client2Return.t4Slips.length + client2Return.otherSlips.length,
      notes: client2Return.clientNotes,
      taxReturn: client2Return,
    },
    {
      clientId: 'CLI-2025-003',
      preparerId: DEFAULT_PREPARER_ID,
      clientName: 'David Chen',
      taxYear: 2025,
      province: 'BC',
      filingStatus: 'Filed',
      lastModified: Date.now() - 14400000,
      estimatedRefundOrOwing: 2105.4,
      slipsCount: client3Return.t4Slips.length + client3Return.otherSlips.length,
      notes: client3Return.clientNotes,
      taxReturn: client3Return,
    },
  ];
}

export function getSavedClientFiles(): ClientFileRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialSeedClientFiles();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load saved client files:', err);
  }
  const initial = getInitialSeedClientFiles();
  return initial;
}

export function saveClientFile(record: ClientFileRecord): void {
  try {
    const all = getSavedClientFiles();
    const idx = all.findIndex((c) => c.clientId === record.clientId);
    if (idx >= 0) {
      all[idx] = {
        ...record,
        lastModified: Date.now(),
      };
    } else {
      all.unshift({
        ...record,
        lastModified: Date.now(),
      });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    // Asynchronous background backup to Firebase Cloud Firestore
    syncClientFilesToFirestore(all).catch((err) =>
      console.warn('Background Firestore client files backup notice:', err)
    );
  } catch (err) {
    console.warn('Failed to save client file:', err);
  }
}

export function deleteClientFile(clientId: string): void {
  try {
    const all = getSavedClientFiles();
    const filtered = all.filter((c) => c.clientId !== clientId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    syncClientFilesToFirestore(filtered).catch((err) =>
      console.warn('Background Firestore client delete notice:', err)
    );
  } catch (err) {
    console.warn('Failed to delete client file:', err);
  }
}

export function getActiveClientId(): string {
  try {
    const active = localStorage.getItem(ACTIVE_CLIENT_KEY);
    if (active) return active;
  } catch {}
  return 'CLI-2025-001';
}

export function setActiveClientId(clientId: string): void {
  try {
    localStorage.setItem(ACTIVE_CLIENT_KEY, clientId);
  } catch {}
}

export function createNewClientFile(
  preparerId: string = DEFAULT_PREPARER_ID,
  clientName: string = 'New Taxpayer',
  province: ProvinceCode = 'ON'
): ClientFileRecord {
  const all = getSavedClientFiles();
  const nextNum = (all.length + 1).toString().padStart(3, '0');
  const clientId = `CLI-2025-${nextNum}`;

  const names = clientName.trim().split(' ');
  const firstName = names[0] || 'New';
  const lastName = names.slice(1).join(' ') || 'Taxpayer';

  const newReturn: AppTaxReturn = {
    ...SAMPLE_TAX_RETURN,
    id: `tr-${clientId.toLowerCase()}`,
    preparerId,
    preparerName: DEFAULT_PREPARER_NAME,
    clientId,
    clientStatus: 'Active',
    clientNotes: `Initial intake file for ${clientName}`,
    filingStatus: 'Draft',
    personal: {
      ...SAMPLE_TAX_RETURN.personal,
      firstName,
      lastName,
      province,
      sin: '000-000-000',
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.ca`,
    },
    t4Slips: [],
    otherSlips: [],
    deductions: {
      rrspContributions: 0,
      unionOrProfessionalDues: 0,
      childcareExpenses: 0,
      movingExpenses: 0,
      employmentExpenses: 0,
      otherDeductions: 0,
    },
    credits: {
      firstTimeHomeBuyerClaim: false,
      eligibleMedicalExpenses: 0,
      charitableDonations: 0,
      tuitionFeesT2202: 0,
      hasDisabilityTaxCredit: false,
      isSeniorAge65Plus: false,
    },
    updatedAt: new Date().toISOString(),
  };

  const newRecord: ClientFileRecord = {
    clientId,
    preparerId,
    clientName,
    taxYear: 2025,
    province,
    filingStatus: 'Draft',
    lastModified: Date.now(),
    estimatedRefundOrOwing: 0,
    slipsCount: 0,
    notes: newReturn.clientNotes,
    taxReturn: newReturn,
  };

  saveClientFile(newRecord);
  setActiveClientId(clientId);
  return newRecord;
}
