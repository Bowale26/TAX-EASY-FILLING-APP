/**
 * CRA Personal Information Validation Utilities
 * Validates required taxpayer identification fields for Canadian T1 returns:
 * - SIN format (9 digits, CRA Luhn algorithm checksum, masked formats)
 * - Province of residence presence (Dec 31 tax jurisdiction)
 * - Legal First Name and Last Name
 * - Date of Birth (valid date in the past, reasonable age)
 * - Canadian Postal Code format (A1A 1A1)
 * 
 * Provides non-blocking warning metadata with bilingual messages (EN/FR).
 */

import { PersonalInformation, ProvinceCode } from '../types/tax';
import { validateCanadianSin } from './t4ValidationUtils';

export interface PersonalFieldWarning {
  field: keyof PersonalInformation | 'sin' | 'province' | 'firstName' | 'lastName' | 'dateOfBirth' | 'postalCode' | 'email' | 'phone';
  hasWarning: boolean;
  messageEn: string;
  messageFr: string;
  isFormatError?: boolean;
  isMissingError?: boolean;
}

export interface PersonalValidationSummary {
  isValid: boolean;
  hasWarnings: boolean;
  warningCount: number;
  warningsByField: Record<string, PersonalFieldWarning>;
  warningList: PersonalFieldWarning[];
}

const VALID_PROVINCES: ProvinceCode[] = [
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
];

// Canadian Postal Code regex: Letter-Digit-Letter space/optional Digit-Letter-Digit
// Valid starting letters: A, B, C, E, G, H, J, K, L, M, N, P, R, S, T, V, X, Y (no D, F, I, O, Q, U)
const CANADIAN_POSTAL_CODE_REGEX = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i;

/**
 * Validates required and optional personal information fields for Canadian T1 returns.
 * Returns non-blocking field warnings and bilingual messages.
 */
export function validatePersonalInfo(
  personal: Partial<PersonalInformation> | undefined
): PersonalValidationSummary {
  const warningsByField: Record<string, PersonalFieldWarning> = {};
  const warningList: PersonalFieldWarning[] = [];

  if (!personal) {
    return {
      isValid: false,
      hasWarnings: true,
      warningCount: 1,
      warningsByField: {
        general: {
          field: 'firstName',
          hasWarning: true,
          isMissingError: true,
          messageEn: 'Taxpayer personal information has not been entered yet.',
          messageFr: 'Les renseignements personnels du déclarant ne sont pas encore saisis.',
        },
      },
      warningList: [],
    };
  }

  // 1. Legal First Name Validation (Required)
  const firstName = (personal.firstName || '').trim();
  if (!firstName) {
    const warning: PersonalFieldWarning = {
      field: 'firstName',
      hasWarning: true,
      isMissingError: true,
      messageEn: 'Legal first name is required by the CRA for tax return identification.',
      messageFr: 'Le prénom légal est exigé par l’ARC pour identifier la déclaration.',
    };
    warningsByField.firstName = warning;
    warningList.push(warning);
  }

  // 2. Legal Last Name Validation (Required)
  const lastName = (personal.lastName || '').trim();
  if (!lastName) {
    const warning: PersonalFieldWarning = {
      field: 'lastName',
      hasWarning: true,
      isMissingError: true,
      messageEn: 'Legal last name is required by the CRA for tax return identification.',
      messageFr: 'Le nom de famille légal est exigé par l’ARC pour identifier la déclaration.',
    };
    warningsByField.lastName = warning;
    warningList.push(warning);
  }

  // 3. Social Insurance Number (SIN) Format & Checksum Validation (Required)
  const rawSin = (personal.sin || '').trim();
  if (!rawSin) {
    const warning: PersonalFieldWarning = {
      field: 'sin',
      hasWarning: true,
      isMissingError: true,
      messageEn: 'Social Insurance Number (SIN) is required to file a Canadian tax return.',
      messageFr: 'Le numéro d’assurance sociale (NAS) est obligatoire pour transmettre une déclaration canadienne.',
    };
    warningsByField.sin = warning;
    warningList.push(warning);
  } else {
    const sinResult = validateCanadianSin(rawSin);
    if (!sinResult.isValid) {
      const warning: PersonalFieldWarning = {
        field: 'sin',
        hasWarning: true,
        isFormatError: true,
        messageEn: sinResult.errorEn || 'Invalid SIN format (must be 9 numeric digits, e.g., 000-000-000).',
        messageFr: sinResult.errorFr || 'Format de NAS invalide (doit comporter 9 chiffres, ex. : 000-000-000).',
      };
      warningsByField.sin = warning;
      warningList.push(warning);
    }
  }

  // 4. Province of Residence Presence (Required)
  const province = personal.province;
  if (!province || !VALID_PROVINCES.includes(province)) {
    const warning: PersonalFieldWarning = {
      field: 'province',
      hasWarning: true,
      isMissingError: true,
      messageEn: 'Province or territory of residence on Dec 31 is required to determine provincial tax brackets.',
      messageFr: 'La province ou le territoire de résidence au 31 décembre est requis pour le calcul de l’impôt provincial.',
    };
    warningsByField.province = warning;
    warningList.push(warning);
  }

  // 5. Date of Birth Validation (Required & Validity)
  const dob = (personal.dateOfBirth || '').trim();
  if (!dob) {
    const warning: PersonalFieldWarning = {
      field: 'dateOfBirth',
      hasWarning: true,
      isMissingError: true,
      messageEn: 'Date of birth is required by the CRA to calculate age amount, credits, and OAS/CPP thresholds.',
      messageFr: 'La date de naissance est requise par l’ARC pour calculer le montant en raison de l’âge et les crédits.',
    };
    warningsByField.dateOfBirth = warning;
    warningList.push(warning);
  } else {
    const birthDate = new Date(dob);
    const now = new Date();
    if (isNaN(birthDate.getTime())) {
      const warning: PersonalFieldWarning = {
        field: 'dateOfBirth',
        hasWarning: true,
        isFormatError: true,
        messageEn: 'Invalid date format for Date of Birth.',
        messageFr: 'Format de date de naissance invalide.',
      };
      warningsByField.dateOfBirth = warning;
      warningList.push(warning);
    } else if (birthDate > now) {
      const warning: PersonalFieldWarning = {
        field: 'dateOfBirth',
        hasWarning: true,
        isFormatError: true,
        messageEn: 'Date of birth cannot be in the future.',
        messageFr: 'La date de naissance ne peut pas être dans le futur.',
      };
      warningsByField.dateOfBirth = warning;
      warningList.push(warning);
    } else {
      const age = now.getFullYear() - birthDate.getFullYear();
      if (age > 125) {
        const warning: PersonalFieldWarning = {
          field: 'dateOfBirth',
          hasWarning: true,
          isFormatError: true,
          messageEn: 'Date of birth indicates an age over 125. Please verify the year entered.',
          messageFr: 'La date de naissance indique un âge supérieur à 125 ans. Veuillez vérifier l’année saisie.',
        };
        warningsByField.dateOfBirth = warning;
        warningList.push(warning);
      }
    }
  }

  // 6. Postal Code Format Validation (Optional but must be valid if provided)
  const postalCode = (personal.postalCode || '').trim().toUpperCase();
  if (postalCode && !CANADIAN_POSTAL_CODE_REGEX.test(postalCode)) {
    const warning: PersonalFieldWarning = {
      field: 'postalCode',
      hasWarning: true,
      isFormatError: true,
      messageEn: 'Canadian postal codes follow the A1A 1A1 format (e.g. M5H 2M9).',
      messageFr: 'Le code postal canadien doit respecter le format A1A 1A1 (ex. : M5H 2M9).',
    };
    warningsByField.postalCode = warning;
    warningList.push(warning);
  }

  // 7. Email Format Validation (If provided)
  const email = (personal.email || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const warning: PersonalFieldWarning = {
      field: 'email',
      hasWarning: true,
      isFormatError: true,
      messageEn: 'Please enter a valid email address (e.g., alex.morgan@example.ca).',
      messageFr: 'Veuillez saisir une adresse courriel valide (ex. : alex.morgan@example.ca).',
    };
    warningsByField.email = warning;
    warningList.push(warning);
  }

  return {
    isValid: warningList.length === 0,
    hasWarnings: warningList.length > 0,
    warningCount: warningList.length,
    warningsByField,
    warningList,
  };
}
