/**
 * Synthetic Test Profiles and Realistic Sample Documents for Computer Vision
 */

import { AppTaxReturn, ComputerVisionResult } from '../types/tax';
import { ALL_19_TAX_SLIPS } from './taxSlipsDirectory';

export interface SampleProfile {
  id: string;
  name: string;
  personaEn: string;
  personaFr: string;
  data: AppTaxReturn;
}

export const SAMPLE_TAX_RETURN: AppTaxReturn = {
  id: 'tr-synthetic-2025-01',
  userId: 'user-demo-alex',
  taxYear: 2025,
  step: 1,
  isEligible: true,
  personal: {
    firstName: 'Alex',
    lastName: 'Morgan',
    sin: '046-458-921',
    dateOfBirth: '1992-06-14',
    maritalStatus: 'single',
    hasSpouse: false,
    email: 'alex.morgan@example.ca',
    phone: '(416) 555-0198',
    streetAddress: '123 Bay Street, Suite 1400',
    city: 'Toronto',
    province: 'ON',
    postalCode: 'M5J 2R8',
    residedInCanadaDec31: true,
    isCanadianCitizen: true,
    electionsCanadaConsent: true,
    firstTimeFiler: false,
    directDeposit: {
      enabled: true,
      transitNumber: '12345',
      institutionNumber: '004',
      accountNumber: '9876543',
    },
  },
  dependants: [],
  t4Slips: [
    {
      id: 't4-shopify-01',
      employerName: 'Shopify Commerce Canada Inc.',
      box14_employmentIncome: 78500,
      box16_cppContributions: 3867.5,
      box18_eiPremiums: 1049.12,
      box20_rppContributions: 2400,
      box22_incomeTaxDeducted: 16420,
      box24_eiInsurableEarnings: 63200,
      box26_cppPensionableEarnings: 68500,
      box44_unionDues: 0,
      box52_pensionAdjustment: 4800,
      verifiedByUser: true,
      sourceDocumentId: 'doc_scan_t4_shopify_01',
    },
  ],
  otherSlips: [],
  scannedDocuments: [
    {
      id: 'doc_scan_t4_shopify_01',
      documentCode: 'T4',
      documentName: 'T4 Slip',
      fileName: 'Shopify_T4_Tax_Slip_2025.png',
      fileType: 'image',
      fileSize: '1.4 MB',
      scannedAt: '2026-02-14T10:30:00.000Z',
      status: 'verified',
      ocrConfidence: 98,
      previewUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'doc_scan_rrsp_rbc_02',
      documentCode: 'RRSP',
      documentName: 'RRSP Receipt',
      fileName: 'RBC_Direct_Investing_RRSP_Contribution_2025.pdf',
      fileType: 'pdf',
      fileSize: '348 KB',
      scannedAt: '2026-02-15T14:12:00.000Z',
      status: 'verified',
      ocrConfidence: 99,
      previewUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
    },
  ],
  deductions: {
    rrspContributions: 6500,
    unionOrProfessionalDues: 0,
    childcareExpenses: 0,
    movingExpenses: 0,
    employmentExpenses: 500,
    otherDeductions: 0,
  },
  credits: {
    firstTimeHomeBuyerClaim: false,
    charitableDonations: 450,
    eligibleMedicalExpenses: 1200,
    tuitionFeesT2202: 0,
    hasDisabilityTaxCredit: false,
    isSeniorAge65Plus: false,
  },
  netfile: {
    status: 'draft',
    netfileAccessCode: 'K984',
  },
  employmentIndustryCode: '541514',
  updatedAt: new Date().toISOString(),
};

export const SAMPLE_ALEX_RETURN: AppTaxReturn = SAMPLE_TAX_RETURN;

export const INITIAL_TAX_RETURN: AppTaxReturn = {
  id: 'tr-new-user-01',
  userId: 'user-default',
  taxYear: 2025,
  step: 1,
  isEligible: true,
  personal: {
    firstName: '',
    lastName: '',
    sin: '',
    dateOfBirth: '1995-01-01',
    maritalStatus: 'single',
    hasSpouse: false,
    email: '',
    phone: '',
    streetAddress: '',
    city: '',
    province: 'ON',
    postalCode: '',
    residedInCanadaDec31: true,
    isCanadianCitizen: true,
    electionsCanadaConsent: true,
    firstTimeFiler: false,
    directDeposit: {
      enabled: true,
      transitNumber: '',
      institutionNumber: '',
      accountNumber: '',
    },
  },
  dependants: [],
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
    charitableDonations: 0,
    eligibleMedicalExpenses: 0,
    tuitionFeesT2202: 0,
    hasDisabilityTaxCredit: false,
    isSeniorAge65Plus: false,
  },
  netfile: {
    status: 'draft',
    netfileAccessCode: '',
  },
  updatedAt: new Date().toISOString(),
};


export interface SampleDocumentItem {
  id: string;
  nameEn: string;
  nameFr: string;
  type: string;
  previewUrl: string;
  extractedResult: ComputerVisionResult;
}

export const SAMPLE_DOCUMENTS: SampleDocumentItem[] = ALL_19_TAX_SLIPS.map((slip) => ({
  id: slip.sampleDocument.id,
  nameEn: `${slip.code} — ${slip.sampleDocument.extractedResult.issuerName}`,
  nameFr: `Feuillet ${slip.code} — ${slip.sampleDocument.extractedResult.issuerName}`,
  type: slip.code,
  previewUrl: slip.sampleDocument.previewUrl,
  extractedResult: slip.sampleDocument.extractedResult,
}));
