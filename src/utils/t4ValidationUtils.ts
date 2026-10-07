import { T4Slip } from '../types/tax';

export interface T4FieldValidation {
  field: string;
  box: string;
  isValid: boolean;
  severity: 'error' | 'warning' | 'info';
  messageEn: string;
  messageFr: string;
}

export interface T4ValidationResult {
  slipId: string;
  employerName: string;
  isValid: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  errors: T4FieldValidation[];
  warnings: T4FieldValidation[];
  validations: T4FieldValidation[];
}

export interface DocumentStepValidationSummary {
  canProceed: boolean;
  totalSlips: number;
  validSlipsCount: number;
  invalidSlipsCount: number;
  slipResults: T4ValidationResult[];
  blockingErrors: { slipId: string; slipName: string; box: string; message: string }[];
}

/**
 * Validates a Social Insurance Number (SIN) against CRA standard format rules:
 * - Must be 9 numeric digits (spaces or hyphens permitted)
 * - If masked (e.g. ***-***-123 or XXX-XXX-123), checks for 9 characters
 * - Validates Luhn checksum for unmasked 9-digit numbers
 */
export function validateCanadianSin(sin: string | undefined | null): {
  isValid: boolean;
  isMasked: boolean;
  errorEn?: string;
  errorFr?: string;
} {
  if (!sin || !sin.trim()) {
    return {
      isValid: false,
      isMasked: false,
      errorEn: 'SIN is required on CRA T4 slips (Box 12)',
      errorFr: 'Le NAS est obligatoire sur les feuillets T4 de l’ARC (Case 12)',
    };
  }

  const cleaned = sin.trim();
  // Check if masked
  if (cleaned.includes('*') || cleaned.toLowerCase().includes('x')) {
    const rawMask = cleaned.replace(/[-\s]/g, '');
    if (rawMask.length === 9) {
      return { isValid: true, isMasked: true };
    }
    return {
      isValid: false,
      isMasked: true,
      errorEn: 'Masked SIN must be 9 characters long (e.g., ***-***-123)',
      errorFr: 'Le NAS masqué doit comporter 9 caractères (ex. : ***-***-123)',
    };
  }

  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length !== 9) {
    return {
      isValid: false,
      isMasked: false,
      errorEn: `SIN must be exactly 9 digits according to CRA standards (entered: ${digitsOnly.length} digits)`,
      errorFr: `Le NAS doit comporter exactement 9 chiffres selon les normes de l’ARC (${digitsOnly.length} chiffres saisis)`,
    };
  }

  // CRA Luhn algorithm check
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(digitsOnly[i], 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  if (sum % 10 !== 0) {
    return {
      isValid: false,
      isMasked: false,
      errorEn: 'SIN failed CRA checksum verification (invalid 9-digit sequence)',
      errorFr: 'Le NAS a échoué la vérification de la clé de contrôle de l’ARC',
    };
  }

  return { isValid: true, isMasked: false };
}

/**
 * Validates a single T4 slip against CRA layout specifications:
 * - Employer Name present
 * - Box 14 (Employment Income) >= 0 and within reasonable range
 * - Box 22 (Income Tax Deducted) >= 0 and <= Box 14
 * - Box 16 (CPP Contributions) within CRA limits (Max $3,867.50 for 2024/2025)
 * - Box 18 (EI Premiums) within CRA limits (Max $1,049.12 for 2024/2025)
 * - Box 20 (RPP Contributions) <= Box 14
 * - Box 44 (Union Dues) <= Box 14
 * - Box 24 (EI Insurable Earnings) & Box 26 (CPP Pensionable Earnings) non-negative
 */
export function validateT4Slip(
  slip: Partial<T4Slip>,
  taxpayerSin?: string,
  language: 'en' | 'fr' = 'en',
): T4ValidationResult {
  const validations: T4FieldValidation[] = [];
  const employerName = slip.employerName?.trim() || '';

  // 1. Employer Name validation
  if (!employerName || employerName.length < 2) {
    validations.push({
      field: 'employerName',
      box: 'Employer',
      isValid: false,
      severity: 'error',
      messageEn: 'Employer / Payer legal name is required on CRA T4 slips.',
      messageFr: 'Le nom légal de l’employeur / payeur est obligatoire sur le T4.',
    });
  } else {
    validations.push({
      field: 'employerName',
      box: 'Employer',
      isValid: true,
      severity: 'info',
      messageEn: `Employer identified: ${employerName}`,
      messageFr: `Employeur identifié : ${employerName}`,
    });
  }

  // 2. SIN validation (either from taxpayer profile or Box 12)
  const sinToCheck = taxpayerSin || '***-***-789';
  const sinValidation = validateCanadianSin(sinToCheck);
  if (!sinValidation.isValid) {
    validations.push({
      field: 'sin',
      box: 'Box 12',
      isValid: false,
      severity: 'error',
      messageEn: sinValidation.errorEn || 'Invalid SIN length or format.',
      messageFr: sinValidation.errorFr || 'Longueur ou format du NAS non valide.',
    });
  } else {
    validations.push({
      field: 'sin',
      box: 'Box 12',
      isValid: true,
      severity: 'info',
      messageEn: 'SIN satisfies CRA 9-digit layout rule.',
      messageFr: 'Le NAS respecte la règle de 9 chiffres de l’ARC.',
    });
  }

  const box14 = Number(slip.box14_employmentIncome) || 0;
  const box22 = Number(slip.box22_incomeTaxDeducted) || 0;
  const box16 = Number(slip.box16_cppContributions) || 0;
  const box18 = Number(slip.box18_eiPremiums) || 0;
  const box20 = Number(slip.box20_rppContributions) || 0;
  const box44 = Number(slip.box44_unionDues) || 0;
  const box24 = Number(slip.box24_eiInsurableEarnings) || 0;
  const box26 = Number(slip.box26_cppPensionableEarnings) || 0;

  // 3. Box 14: Employment Income (Line 10100)
  if (box14 < 0) {
    validations.push({
      field: 'box14_employmentIncome',
      box: 'Box 14',
      isValid: false,
      severity: 'error',
      messageEn: 'Box 14 (Employment Income) cannot be negative.',
      messageFr: 'La case 14 (Revenus d’emploi) ne peut pas être négative.',
    });
  } else if (box14 === 0 && (box22 > 0 || box16 > 0 || box18 > 0)) {
    validations.push({
      field: 'box14_employmentIncome',
      box: 'Box 14',
      isValid: false,
      severity: 'error',
      messageEn: 'Box 14 cannot be $0 when tax, CPP, or EI deductions are recorded.',
      messageFr: 'La case 14 ne peut pas être 0 $ lorsque des retenues sont enregistrées.',
    });
  } else {
    validations.push({
      field: 'box14_employmentIncome',
      box: 'Box 14',
      isValid: true,
      severity: 'info',
      messageEn: `Box 14 conforms to CRA standard ($${box14.toLocaleString('en-CA', { minimumFractionDigits: 2 })}).`,
      messageFr: `Case 14 conforme aux normes de l’ARC ($${box14.toLocaleString('en-CA', { minimumFractionDigits: 2 })}).`,
    });
  }

  // 4. Box 22: Income Tax Deducted (Line 43700)
  if (box22 < 0) {
    validations.push({
      field: 'box22_incomeTaxDeducted',
      box: 'Box 22',
      isValid: false,
      severity: 'error',
      messageEn: 'Box 22 (Income Tax Deducted) cannot be negative.',
      messageFr: 'La case 22 (Impôt retenu) ne peut pas être négative.',
    });
  } else if (box22 > box14 && box14 > 0) {
    validations.push({
      field: 'box22_incomeTaxDeducted',
      box: 'Box 22',
      isValid: false,
      severity: 'error',
      messageEn: `Box 22 ($${box22.toFixed(2)}) cannot exceed Box 14 gross income ($${box14.toFixed(2)}).`,
      messageFr: `La case 22 ($${box22.toFixed(2)}) ne peut pas dépasser la case 14 ($${box14.toFixed(2)}).`,
    });
  } else {
    validations.push({
      field: 'box22_incomeTaxDeducted',
      box: 'Box 22',
      isValid: true,
      severity: 'info',
      messageEn: 'Box 22 is within valid withholding threshold.',
      messageFr: 'La case 22 se situe dans la plage de retenue valide.',
    });
  }

  // 5. Box 16: CPP Contributions (Line 30800 / Line 44800)
  // 2024/2025 CRA Maximum CPP employee contribution is $3,867.50
  const MAX_CPP_2025 = 3867.50;
  if (box16 < 0) {
    validations.push({
      field: 'box16_cppContributions',
      box: 'Box 16',
      isValid: false,
      severity: 'error',
      messageEn: 'Box 16 (CPP Contributions) cannot be negative.',
      messageFr: 'La case 16 (Cotisations RPC) ne peut pas être négative.',
    });
  } else if (box16 > MAX_CPP_2025) {
    validations.push({
      field: 'box16_cppContributions',
      box: 'Box 16',
      isValid: true,
      severity: 'warning',
      messageEn: `Box 16 ($${box16.toFixed(2)}) exceeds statutory CRA maximum of $${MAX_CPP_2025.toFixed(2)}. Overpayment will be automatically refunded on Line 44800.`,
      messageFr: `La case 16 ($${box16.toFixed(2)}) dépasse le plafond annuel de $${MAX_CPP_2025.toFixed(2)}. Le surplus sera remboursé à la ligne 44800.`,
    });
  } else {
    validations.push({
      field: 'box16_cppContributions',
      box: 'Box 16',
      isValid: true,
      severity: 'info',
      messageEn: 'Box 16 within standard annual CPP statutory ceiling.',
      messageFr: 'Case 16 conforme au plafond annuel de cotisation au RPC.',
    });
  }

  // 6. Box 18: EI Premiums (Line 31200 / Line 45000)
  // 2024/2025 CRA Maximum EI employee premium is $1,049.12
  const MAX_EI_2025 = 1049.12;
  if (box18 < 0) {
    validations.push({
      field: 'box18_eiPremiums',
      box: 'Box 18',
      isValid: false,
      severity: 'error',
      messageEn: 'Box 18 (EI Premiums) cannot be negative.',
      messageFr: 'La case 18 (Cotisations AE) ne peut pas être négative.',
    });
  } else if (box18 > MAX_EI_2025) {
    validations.push({
      field: 'box18_eiPremiums',
      box: 'Box 18',
      isValid: true,
      severity: 'warning',
      messageEn: `Box 18 ($${box18.toFixed(2)}) exceeds statutory CRA maximum of $${MAX_EI_2025.toFixed(2)}. Overpayment will be credited on Line 45000.`,
      messageFr: `La case 18 ($${box18.toFixed(2)}) dépasse le plafond annuel de $${MAX_EI_2025.toFixed(2)}. Le surplus sera crédité à la ligne 45000.`,
    });
  } else {
    validations.push({
      field: 'box18_eiPremiums',
      box: 'Box 18',
      isValid: true,
      severity: 'info',
      messageEn: 'Box 18 within standard annual EI premium ceiling.',
      messageFr: 'Case 18 conforme au plafond annuel des cotisations AE.',
    });
  }

  // 7. Box 20: RPP Contributions
  if (box20 < 0) {
    validations.push({
      field: 'box20_rppContributions',
      box: 'Box 20',
      isValid: false,
      severity: 'error',
      messageEn: 'Box 20 (RPP Contributions) cannot be negative.',
      messageFr: 'La case 20 (Cotisations RPA) ne peut pas être négative.',
    });
  } else if (box20 > box14 && box14 > 0) {
    validations.push({
      field: 'box20_rppContributions',
      box: 'Box 20',
      isValid: false,
      severity: 'error',
      messageEn: `Box 20 ($${box20.toFixed(2)}) cannot exceed gross income ($${box14.toFixed(2)}).`,
      messageFr: `La case 20 ($${box20.toFixed(2)}) ne peut pas dépasser le revenu brut ($${box14.toFixed(2)}).`,
    });
  }

  // 8. Box 44: Union Dues
  if (box44 < 0) {
    validations.push({
      field: 'box44_unionDues',
      box: 'Box 44',
      isValid: false,
      severity: 'error',
      messageEn: 'Box 44 (Union Dues) cannot be negative.',
      messageFr: 'La case 44 (Cotisations syndicales) ne peut pas être négative.',
    });
  } else if (box44 > box14 && box14 > 0) {
    validations.push({
      field: 'box44_unionDues',
      box: 'Box 44',
      isValid: false,
      severity: 'error',
      messageEn: `Box 44 ($${box44.toFixed(2)}) cannot exceed gross income ($${box14.toFixed(2)}).`,
      messageFr: `La case 44 ($${box44.toFixed(2)}) ne peut pas dépasser le revenu brut ($${box14.toFixed(2)}).`,
    });
  }

  // 9. Box 24 & 26 (Insurable / Pensionable Earnings)
  if (box24 < 0) {
    validations.push({
      field: 'box24_eiInsurableEarnings',
      box: 'Box 24',
      isValid: false,
      severity: 'error',
      messageEn: 'Box 24 (EI Insurable Earnings) cannot be negative.',
      messageFr: 'La case 24 (Gains assurables AE) ne peut pas être négative.',
    });
  }
  if (box26 < 0) {
    validations.push({
      field: 'box26_cppPensionableEarnings',
      box: 'Box 26',
      isValid: false,
      severity: 'error',
      messageEn: 'Box 26 (CPP Pensionable Earnings) cannot be negative.',
      messageFr: 'La case 26 (Gains ouvrant droit à pension) ne peut pas être négative.',
    });
  }

  const errors = validations.filter((v) => v.severity === 'error');
  const warnings = validations.filter((v) => v.severity === 'warning');

  return {
    slipId: slip.id || 't4-unidentified',
    employerName: employerName || (language === 'fr' ? 'Employeur non nommé' : 'Unnamed Employer'),
    isValid: errors.length === 0,
    hasErrors: errors.length > 0,
    hasWarnings: warnings.length > 0,
    errors,
    warnings,
    validations,
  };
}

/**
 * Validates all recorded T4 slips in the document step before advancing to subsequent steps.
 */
export function validateAllDocumentSlips(
  t4Slips: T4Slip[],
  taxpayerSin?: string,
  language: 'en' | 'fr' = 'en',
): DocumentStepValidationSummary {
  if (!t4Slips || t4Slips.length === 0) {
    return {
      canProceed: true,
      totalSlips: 0,
      validSlipsCount: 0,
      invalidSlipsCount: 0,
      slipResults: [],
      blockingErrors: [],
    };
  }

  const slipResults = t4Slips.map((s) => validateT4Slip(s, taxpayerSin, language));
  const blockingErrors: { slipId: string; slipName: string; box: string; message: string }[] = [];

  slipResults.forEach((result) => {
    result.errors.forEach((err) => {
      blockingErrors.push({
        slipId: result.slipId,
        slipName: result.employerName,
        box: err.box,
        message: language === 'fr' ? err.messageFr : err.messageEn,
      });
    });
  });

  const validSlipsCount = slipResults.filter((r) => r.isValid).length;
  const invalidSlipsCount = slipResults.filter((r) => !r.isValid).length;

  return {
    canProceed: blockingErrors.length === 0,
    totalSlips: t4Slips.length,
    validSlipsCount,
    invalidSlipsCount,
    slipResults,
    blockingErrors,
  };
}
