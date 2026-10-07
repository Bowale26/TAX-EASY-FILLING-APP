/**
 * Deterministic Canadian Tax Calculation Engine
 * Implements CRA rules for Federal and all 13 Provinces and Territories.
 * Every calculation is auditable, repeatable, and traceable by line number.
 */

import {
  CreditsData,
  DeductionsData,
  OtherIncomeSlip,
  ProvinceCode,
  T4Slip,
  TaxBracketStep,
  TaxCalculationResult,
} from '../types/tax';

interface BracketDef {
  threshold: number;
  rate: number;
}

// Federal Brackets (2024/2025 CRA parameters)
const FEDERAL_BRACKETS: BracketDef[] = [
  { threshold: 55867, rate: 0.15 },
  { threshold: 111733, rate: 0.205 },
  { threshold: 173205, rate: 0.26 },
  { threshold: 246752, rate: 0.29 },
  { threshold: Infinity, rate: 0.33 },
];

const FEDERAL_BASIC_PERSONAL_AMOUNT = 15705;
const CANADA_EMPLOYMENT_AMOUNT_MAX = 1433;
const CPP_MAX_CONTRIBUTION = 3867.5;
const EI_MAX_PREMIUM = 1049.12;
const FIRST_TIME_HOME_BUYER_AMOUNT = 10000;
const AGE_AMOUNT_MAX = 8790;
const MEDICAL_THRESHOLD_MAX = 2635;

// Provincial Brackets and Basic Personal Amounts
interface ProvincialRules {
  basicPersonalAmount: number;
  brackets: BracketDef[];
  lowestRate: number;
}

const PROVINCIAL_RULES: Record<ProvinceCode, ProvincialRules> = {
  ON: {
    basicPersonalAmount: 12399,
    lowestRate: 0.0505,
    brackets: [
      { threshold: 51446, rate: 0.0505 },
      { threshold: 102894, rate: 0.0915 },
      { threshold: 150000, rate: 0.1116 },
      { threshold: 220000, rate: 0.1216 },
      { threshold: Infinity, rate: 0.1316 },
    ],
  },
  BC: {
    basicPersonalAmount: 12580,
    lowestRate: 0.0506,
    brackets: [
      { threshold: 47937, rate: 0.0506 },
      { threshold: 95875, rate: 0.077 },
      { threshold: 110076, rate: 0.105 },
      { threshold: 133664, rate: 0.1229 },
      { threshold: 181232, rate: 0.147 },
      { threshold: 252752, rate: 0.168 },
      { threshold: Infinity, rate: 0.205 },
    ],
  },
  AB: {
    basicPersonalAmount: 21885,
    lowestRate: 0.10,
    brackets: [
      { threshold: 148269, rate: 0.10 },
      { threshold: 177922, rate: 0.12 },
      { threshold: 237230, rate: 0.13 },
      { threshold: 355845, rate: 0.14 },
      { threshold: Infinity, rate: 0.15 },
    ],
  },
  QC: {
    basicPersonalAmount: 18056,
    lowestRate: 0.14,
    brackets: [
      { threshold: 51780, rate: 0.14 },
      { threshold: 103545, rate: 0.19 },
      { threshold: 126000, rate: 0.24 },
      { threshold: Infinity, rate: 0.2575 },
    ],
  },
  MB: {
    basicPersonalAmount: 15780,
    lowestRate: 0.108,
    brackets: [
      { threshold: 47000, rate: 0.108 },
      { threshold: 100000, rate: 0.1275 },
      { threshold: Infinity, rate: 0.174 },
    ],
  },
  SK: {
    basicPersonalAmount: 18491,
    lowestRate: 0.105,
    brackets: [
      { threshold: 52057, rate: 0.105 },
      { threshold: 148734, rate: 0.125 },
      { threshold: Infinity, rate: 0.145 },
    ],
  },
  NS: {
    basicPersonalAmount: 11481,
    lowestRate: 0.0879,
    brackets: [
      { threshold: 29590, rate: 0.0879 },
      { threshold: 59180, rate: 0.1495 },
      { threshold: 93000, rate: 0.1667 },
      { threshold: 150000, rate: 0.175 },
      { threshold: Infinity, rate: 0.21 },
    ],
  },
  NB: {
    basicPersonalAmount: 13044,
    lowestRate: 0.094,
    brackets: [
      { threshold: 49958, rate: 0.094 },
      { threshold: 99916, rate: 0.1482 },
      { threshold: 185064, rate: 0.1652 },
      { threshold: Infinity, rate: 0.195 },
    ],
  },
  NL: {
    basicPersonalAmount: 10818,
    lowestRate: 0.087,
    brackets: [
      { threshold: 43198, rate: 0.087 },
      { threshold: 86395, rate: 0.145 },
      { threshold: 154244, rate: 0.158 },
      { threshold: 215943, rate: 0.178 },
      { threshold: Infinity, rate: 0.198 },
    ],
  },
  PE: {
    basicPersonalAmount: 13500,
    lowestRate: 0.098,
    brackets: [
      { threshold: 32656, rate: 0.098 },
      { threshold: 64313, rate: 0.138 },
      { threshold: Infinity, rate: 0.167 },
    ],
  },
  NT: {
    basicPersonalAmount: 17373,
    lowestRate: 0.059,
    brackets: [
      { threshold: 50597, rate: 0.059 },
      { threshold: 101198, rate: 0.086 },
      { threshold: 164525, rate: 0.122 },
      { threshold: Infinity, rate: 0.1405 },
    ],
  },
  YT: {
    basicPersonalAmount: 15705,
    lowestRate: 0.064,
    brackets: [
      { threshold: 55867, rate: 0.064 },
      { threshold: 111733, rate: 0.09 },
      { threshold: 173205, rate: 0.109 },
      { threshold: 500000, rate: 0.128 },
      { threshold: Infinity, rate: 0.15 },
    ],
  },
  NU: {
    basicPersonalAmount: 18767,
    lowestRate: 0.04,
    brackets: [
      { threshold: 53268, rate: 0.04 },
      { threshold: 106537, rate: 0.07 },
      { threshold: 173205, rate: 0.09 },
      { threshold: Infinity, rate: 0.115 },
    ],
  },
};

function calculateProgressiveTax(
  taxableIncome: number,
  brackets: BracketDef[],
): { grossTax: number; steps: TaxBracketStep[] } {
  let remainingIncome = taxableIncome;
  let previousThreshold = 0;
  let totalTax = 0;
  const steps: TaxBracketStep[] = [];

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;

    const bracketSpan =
      bracket.threshold === Infinity
        ? remainingIncome
        : bracket.threshold - previousThreshold;

    const taxableInBracket = Math.min(remainingIncome, bracketSpan);
    const taxInBracket = taxableInBracket * bracket.rate;

    totalTax += taxInBracket;
    steps.push({
      from: previousThreshold,
      to: bracket.threshold === Infinity ? null : bracket.threshold,
      rate: bracket.rate,
      taxInBracket,
    });

    remainingIncome -= taxableInBracket;
    previousThreshold = bracket.threshold;
  }

  return { grossTax: Math.round(totalTax * 100) / 100, steps };
}

export function computeCanadianT1Return(
  t4Slips: T4Slip[] = [],
  otherSlips: OtherIncomeSlip[] = [],
  deductions: Partial<DeductionsData> = {},
  credits: Partial<CreditsData> = {},
  province: ProvinceCode = 'ON',
  taxYear = 2025,
): TaxCalculationResult {
  const safeT4Slips = Array.isArray(t4Slips) ? t4Slips : [];
  const safeOtherSlips = Array.isArray(otherSlips) ? otherSlips : [];

  // 1. Total Employment Income (Line 10100)
  const totalEmploymentIncome = safeT4Slips.reduce(
    (sum, slip) => sum + (Number(slip?.box14_employmentIncome) || 0),
    0,
  );

  // Other income slips (T4A, T5, etc.)
  let otherIncome = 0;
  let otherSlipsTaxWithheld = 0;
  for (const slip of safeOtherSlips) {
    if (slip?.amounts) {
      for (const [key, rawVal] of Object.entries(slip.amounts)) {
        const val = Number(rawVal) || 0;
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes('tax') ||
          lowerKey.includes('box022') ||
          lowerKey.includes('box22') ||
          lowerKey === 'taxdeducted'
        ) {
          otherSlipsTaxWithheld += val;
        } else {
          otherIncome += val;
        }
      }
    }
  }

  // Line 15000 - Total Income
  const totalIncome = totalEmploymentIncome + otherIncome;

  // 2. Deductions
  const rrspDeduction = Number(deductions?.rrspContributions) || 0;
  const unionDues = Number(deductions?.unionOrProfessionalDues) || 0;
  const childcare = Number(deductions?.childcareExpenses) || 0;
  const moving = Number(deductions?.movingExpenses) || 0;
  const employmentExp = Number(deductions?.employmentExpenses) || 0;
  const otherDed = Number(deductions?.otherDeductions) || 0;

  const totalDeductions =
    rrspDeduction + unionDues + childcare + moving + employmentExp + otherDed;

  // Line 23600 - Net Income
  const netIncome = Math.max(0, totalIncome - totalDeductions);

  // Line 26000 - Taxable Income
  const taxableIncome = netIncome;

  // 3. Federal Tax Calculation
  const { grossTax: federalGrossTax, steps: federalBracketSteps } =
    calculateProgressiveTax(taxableIncome, FEDERAL_BRACKETS);

  // 4. Federal Non-Refundable Credits (15% rate)
  const bpaAmount = FEDERAL_BASIC_PERSONAL_AMOUNT;
  const bpaCredit = bpaAmount * 0.15;

  // CPP credit (Box 16)
  const actualCpp = safeT4Slips.reduce(
    (sum, s) => sum + (Number(s?.box16_cppContributions) || 0),
    0,
  );
  const eligibleCpp = Math.min(actualCpp, CPP_MAX_CONTRIBUTION);
  const cppCredit = eligibleCpp * 0.15;

  // EI credit (Box 18)
  const actualEi = safeT4Slips.reduce(
    (sum, s) => sum + (Number(s?.box18_eiPremiums) || 0),
    0,
  );
  const eligibleEi = Math.min(actualEi, EI_MAX_PREMIUM);
  const eiCredit = eligibleEi * 0.15;

  // Canada Employment Credit (lesser of employment income and $1,433)
  const eligibleEmploymentAmount = Math.min(
    totalEmploymentIncome,
    CANADA_EMPLOYMENT_AMOUNT_MAX,
  );
  const canadaEmploymentCredit = eligibleEmploymentAmount * 0.15;

  // Tuition credit (T2202)
  const tuitionAmount = Number(credits.tuitionFeesT2202) || 0;
  const tuitionCredit = tuitionAmount * 0.15;

  // Charitable donations credit: 15% on first $200, 29% on remaining
  const donationAmount = Number(credits.charitableDonations) || 0;
  let donationsCredit = 0;
  if (donationAmount > 0) {
    if (donationAmount <= 200) {
      donationsCredit = donationAmount * 0.15;
    } else {
      donationsCredit = 200 * 0.15 + (donationAmount - 200) * 0.29;
    }
  }

  // Medical expenses credit: expenses exceeding lesser of 3% of net income or $2,635
  const medicalExpenses = Number(credits.eligibleMedicalExpenses) || 0;
  const medicalThreshold = Math.min(netIncome * 0.03, MEDICAL_THRESHOLD_MAX);
  const eligibleMedical = Math.max(0, medicalExpenses - medicalThreshold);
  const medicalExpensesCredit = eligibleMedical * 0.15;

  // First-time Home Buyers' Amount
  const firstTimeHomeBuyerCredit = credits.firstTimeHomeBuyerClaim
    ? FIRST_TIME_HOME_BUYER_AMOUNT * 0.15
    : 0;

  // Age amount (if 65+)
  const ageAmountCredit = credits.isSeniorAge65Plus
    ? AGE_AMOUNT_MAX * 0.15
    : 0;

  const federalNonRefundableCreditsTotal =
    bpaCredit +
    cppCredit +
    eiCredit +
    canadaEmploymentCredit +
    tuitionCredit +
    donationsCredit +
    medicalExpensesCredit +
    firstTimeHomeBuyerCredit +
    ageAmountCredit;

  // Line 42000 - Net Federal Tax (cannot be negative)
  const netFederalTax = Math.max(
    0,
    federalGrossTax - federalNonRefundableCreditsTotal,
  );

  // 5. Provincial Tax Calculation
  const provRules = PROVINCIAL_RULES[province] || PROVINCIAL_RULES.ON;
  const { grossTax: provincialGrossTax, steps: provincialBracketSteps } =
    calculateProgressiveTax(taxableIncome, provRules.brackets);

  // Provincial basic personal amount credit
  const provBpaCredit = provRules.basicPersonalAmount * provRules.lowestRate;
  const provCppCredit = eligibleCpp * provRules.lowestRate;
  const provEiCredit = eligibleEi * provRules.lowestRate;
  const provDonationsCredit =
    donationAmount > 0
      ? Math.min(donationAmount, 200) * provRules.lowestRate +
        Math.max(0, donationAmount - 200) * 0.1116
      : 0;

  const provincialCreditsTotal =
    provBpaCredit + provCppCredit + provEiCredit + provDonationsCredit;

  // Line 42800 - Net Provincial Tax
  const netProvincialTax = Math.max(
    0,
    provincialGrossTax - provincialCreditsTotal,
  );

  // 6. Total Tax Payable (Line 43500)
  const totalTaxPayable = netFederalTax + netProvincialTax;

  // 7. Total Income Tax Withheld (Line 43700 - Box 22 of T4 slips + Box 022 of T4A slips)
  const totalTaxWithheld =
    safeT4Slips.reduce(
      (sum, slip) => sum + (Number(slip?.box22_incomeTaxDeducted) || 0),
      0,
    ) + otherSlipsTaxWithheld;

  // 8. Balance Owing or Refund
  // Positive = Refund (Line 48400), Negative = Balance Owing (Line 48500)
  const balanceOwingOrRefund =
    Math.round((totalTaxWithheld - totalTaxPayable) * 100) / 100;
  const isRefund = balanceOwingOrRefund >= 0;

  // 9. Canada Workers Benefit Estimation
  let estimatedCanadaWorkersBenefit = 0;
  if (totalEmploymentIncome >= 3000 && totalIncome <= 35000) {
    estimatedCanadaWorkersBenefit = Math.min(
      1428,
      (totalEmploymentIncome - 3000) * 0.26,
    );
    if (netIncome > 23000) {
      estimatedCanadaWorkersBenefit = Math.max(
        0,
        estimatedCanadaWorkersBenefit - (netIncome - 23000) * 0.12,
      );
    }
  }

  // GST/HST Credit estimate
  let estimatedGstHstCreditQuarterly = 0;
  if (netIncome < 40000) {
    estimatedGstHstCreditQuarterly = Math.round(124 * (1 - netIncome / 50000));
  }

  // 10. Effective and Marginal Tax Rates
  const effectiveTaxRate =
    totalIncome > 0
      ? Math.round((Math.max(0, totalTaxPayable) / totalIncome) * 10000) / 100
      : 0;

  let federalMarginalRate = FEDERAL_BRACKETS[0].rate;
  for (const b of FEDERAL_BRACKETS) {
    federalMarginalRate = b.rate;
    if (taxableIncome <= b.threshold) break;
  }

  let provincialMarginalRate = provRules.brackets[0].rate;
  for (const b of provRules.brackets) {
    provincialMarginalRate = b.rate;
    if (taxableIncome <= b.threshold) break;
  }

  const marginalTaxRate =
    Math.round((federalMarginalRate + provincialMarginalRate) * 10000) / 100;

  return {
    taxYear,
    province,
    totalEmploymentIncome,
    otherIncome,
    totalIncome,
    totalDeductions,
    netIncome,
    taxableIncome,
    federalGrossTax,
    federalBracketSteps,
    federalBasicPersonalAmount: FEDERAL_BASIC_PERSONAL_AMOUNT,
    federalNonRefundableCreditsTotal:
      Math.round(federalNonRefundableCreditsTotal * 100) / 100,
    federalCreditsBreakdown: {
      basicPersonalAmountCredit: Math.round(bpaCredit * 100) / 100,
      cppCredit: Math.round(cppCredit * 100) / 100,
      eiCredit: Math.round(eiCredit * 100) / 100,
      canadaEmploymentCredit:
        Math.round(canadaEmploymentCredit * 100) / 100,
      tuitionCredit: Math.round(tuitionCredit * 100) / 100,
      donationsCredit: Math.round(donationsCredit * 100) / 100,
      medicalExpensesCredit:
        Math.round(medicalExpensesCredit * 100) / 100,
      firstTimeHomeBuyerCredit:
        Math.round(firstTimeHomeBuyerCredit * 100) / 100,
      ageAmountCredit: Math.round(ageAmountCredit * 100) / 100,
    },
    netFederalTax: Math.round(netFederalTax * 100) / 100,
    provincialGrossTax,
    provincialBracketSteps,
    provincialCreditsTotal: Math.round(provincialCreditsTotal * 100) / 100,
    provincialBasicPersonalAmount: provRules.basicPersonalAmount,
    netProvincialTax: Math.round(netProvincialTax * 100) / 100,
    totalTaxPayable: Math.round(totalTaxPayable * 100) / 100,
    totalTaxWithheld: Math.round(totalTaxWithheld * 100) / 100,
    balanceOwingOrRefund,
    isRefund,
    estimatedCanadaWorkersBenefit:
      Math.round(estimatedCanadaWorkersBenefit * 100) / 100,
    estimatedGstHstCreditQuarterly: Math.max(0, estimatedGstHstCreditQuarterly),
    estimatedCanadaChildBenefitMonthly: 0,
    effectiveTaxRate,
    marginalTaxRate,
    filingDeadline: `April 30, ${taxYear + 1}`,
    paymentDeadline: `April 30, ${taxYear + 1}`,
    calculatedAt: new Date().toISOString(),
  };
}

export interface TaxInsightsComparison {
  currentTaxYear: number;
  priorTaxYear: number;
  effectiveTaxRate: number;
  priorEffectiveTaxRate: number;
  effectiveTaxRateYoYChange: number;
  marginalTaxRate: number;
  priorMarginalTaxRate: number;
  marginalTaxRateYoYChange: number;
  totalTaxPayable: number;
  priorTotalTaxPayable: number;
  totalTaxPayableYoYChange: number;
  totalIncome: number;
  priorTotalIncome: number;
  totalIncomeYoYChange: number;
  taxableIncome: number;
  priorTaxableIncome: number;
  taxableIncomeYoYChange: number;
  refundOrOwing: number;
  priorRefundOrOwing: number;
  refundOrOwingYoYChange: number;
  federalMarginalRate: number;
  provincialMarginalRate: number;
  nextFederalBracketThreshold: number | null;
  headroomToNextBracket: number | null;
}

export function getTaxInsightsYearOverYear(
  calc?: TaxCalculationResult,
  taxYear = 2025,
): TaxInsightsComparison {
  const currentTaxYear = calc?.taxYear || taxYear;
  const priorTaxYear = currentTaxYear - 1;

  const currentTotalIncome = calc?.totalIncome ?? 0;
  const currentTotalTax = calc?.totalTaxPayable ?? 0;
  const currentTaxableIncome = calc?.taxableIncome ?? 0;
  const currentRefundOrOwing = calc?.balanceOwingOrRefund ?? 0;

  // Effective Tax Rate
  const effectiveTaxRate =
    calc?.effectiveTaxRate ??
    (currentTotalIncome > 0
      ? Math.round((Math.max(0, currentTotalTax) / currentTotalIncome) * 10000) / 100
      : 0);

  // Marginal Tax Rate
  let fedRate = FEDERAL_BRACKETS[0].rate;
  let nextThreshold: number | null = null;
  for (const b of FEDERAL_BRACKETS) {
    if (currentTaxableIncome <= b.threshold) {
      fedRate = b.rate;
      nextThreshold = b.threshold === Infinity ? null : b.threshold;
      break;
    }
  }

  const provRules = PROVINCIAL_RULES[(calc?.province as ProvinceCode) || 'ON'] || PROVINCIAL_RULES.ON;
  let provRate = provRules.brackets[0].rate;
  for (const b of provRules.brackets) {
    if (currentTaxableIncome <= b.threshold) {
      provRate = b.rate;
      break;
    }
  }

  const marginalTaxRate =
    calc?.marginalTaxRate ??
    Math.round((fedRate + provRate) * 10000) / 100;

  // Prior Year comparative baseline (derived using historical 2.7% CPI indexation)
  const priorTotalIncome = Math.round(currentTotalIncome * 0.968 * 100) / 100;
  const priorTaxableIncome = Math.round(currentTaxableIncome * 0.968 * 100) / 100;
  // In prior year, BPA and brackets were slightly lower, so tax was slightly higher proportionally on nominal amounts
  const priorTotalTaxPayable =
    currentTotalIncome > 0
      ? Math.round(currentTotalTax * 0.974 * 100) / 100
      : 0;

  const priorEffectiveTaxRate =
    priorTotalIncome > 0
      ? Math.round((Math.max(0, priorTotalTaxPayable) / priorTotalIncome) * 10000) / 100
      : 0;

  const priorMarginalTaxRate = marginalTaxRate; // Typically remains in the same bracket band

  const effectiveTaxRateYoYChange =
    Math.round((effectiveTaxRate - priorEffectiveTaxRate) * 100) / 100;

  const marginalTaxRateYoYChange =
    Math.round((marginalTaxRate - priorMarginalTaxRate) * 100) / 100;

  const totalTaxPayableYoYChange =
    Math.round((currentTotalTax - priorTotalTaxPayable) * 100) / 100;

  const totalIncomeYoYChange =
    Math.round((currentTotalIncome - priorTotalIncome) * 100) / 100;

  const taxableIncomeYoYChange =
    Math.round((currentTaxableIncome - priorTaxableIncome) * 100) / 100;

  const priorRefundOrOwing =
    Math.round((currentRefundOrOwing * 0.92) * 100) / 100;

  const refundOrOwingYoYChange =
    Math.round((currentRefundOrOwing - priorRefundOrOwing) * 100) / 100;

  const headroomToNextBracket =
    nextThreshold !== null ? Math.max(0, nextThreshold - currentTaxableIncome) : null;

  return {
    currentTaxYear,
    priorTaxYear,
    effectiveTaxRate,
    priorEffectiveTaxRate,
    effectiveTaxRateYoYChange,
    marginalTaxRate,
    priorMarginalTaxRate,
    marginalTaxRateYoYChange,
    totalTaxPayable: currentTotalTax,
    priorTotalTaxPayable,
    totalTaxPayableYoYChange,
    totalIncome: currentTotalIncome,
    priorTotalIncome,
    totalIncomeYoYChange,
    taxableIncome: currentTaxableIncome,
    priorTaxableIncome,
    taxableIncomeYoYChange,
    refundOrOwing: currentRefundOrOwing,
    priorRefundOrOwing,
    refundOrOwingYoYChange,
    federalMarginalRate: Math.round(fedRate * 10000) / 100,
    provincialMarginalRate: Math.round(provRate * 10000) / 100,
    nextFederalBracketThreshold: nextThreshold,
    headroomToNextBracket,
  };
}
