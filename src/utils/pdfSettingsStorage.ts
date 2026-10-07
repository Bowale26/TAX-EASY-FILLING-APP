import { AppTaxReturn } from '../types/tax';

export interface AuditTrailCategoryOptions {
  personal: boolean;
  slips: boolean;
  deductions: boolean;
  credits: boolean;
  filing: boolean;
  system: boolean;
}

export interface PdfSettings {
  filenamePattern: string;
  selectedTaxYear?: number;
  includeAuditTrail: boolean;
  auditTrailCategories: AuditTrailCategoryOptions;
  enableDigitalSignature: boolean;
  signatureType: 'type' | 'draw' | 'none';
  typedSignatureText: string;
  typedSignatureFont: 'cursive' | 'brush' | 'formal' | 'handwritten';
  signatureDataUrl?: string;
  signDate: string;
  signerTitle: string;
}

export const DEFAULT_PDF_SETTINGS: PdfSettings = {
  filenamePattern: '{Year}_{ClientName}_T1.pdf',
  selectedTaxYear: 2025,
  includeAuditTrail: true,
  auditTrailCategories: {
    personal: true,
    slips: true,
    deductions: true,
    credits: true,
    filing: true,
    system: true,
  },
  enableDigitalSignature: true,
  signatureType: 'draw',
  typedSignatureText: 'Alex Morgan',
  typedSignatureFont: 'cursive',
  signDate: new Date().toISOString().split('T')[0],
  signerTitle: 'Tax Preparer (CPA Certification)',
};

const STORAGE_KEY = 'tax_easy_pdf_custom_settings_v1';

export function loadPdfSettings(taxReturn?: AppTaxReturn): PdfSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PDF_SETTINGS,
        ...parsed,
        enableDigitalSignature:
          parsed.enableDigitalSignature !== undefined
            ? Boolean(parsed.enableDigitalSignature)
            : parsed.signatureType !== 'none',
        auditTrailCategories: {
          ...DEFAULT_PDF_SETTINGS.auditTrailCategories,
          ...(parsed.auditTrailCategories || {}),
        },
      };
    }
  } catch (err) {
    console.warn('Could not load PDF settings:', err);
  }

  // Provide initial typed signature matching taxpayer or preparer
  const initial = { ...DEFAULT_PDF_SETTINGS };
  if (taxReturn?.personal?.firstName && taxReturn?.personal?.lastName) {
    initial.typedSignatureText = `${taxReturn.personal.firstName} ${taxReturn.personal.lastName}`;
  }
  if (taxReturn?.taxYear) {
    initial.selectedTaxYear = taxReturn.taxYear;
  }
  return initial;
}

export function savePdfSettings(settings: PdfSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save PDF settings:', err);
  }
}

/**
 * Replaces tokens in filename pattern with real tax return data
 */
export function formatPdfFilename(
  pattern: string,
  taxReturn: AppTaxReturn,
  preparerId?: string,
  customTaxYear?: number
): string {
  const p = taxReturn.personal;
  const year = String(customTaxYear || taxReturn.taxYear || 2025);
  const lastName = (p?.lastName || 'Taxpayer').replace(/[^a-zA-Z0-9_-]/g, '');
  const firstName = (p?.firstName || 'Alex').replace(/[^a-zA-Z0-9_-]/g, '');
  const clientName = `${firstName}_${lastName}`.replace(/[^a-zA-Z0-9_-]/g, '');
  const todayDate = new Date().toISOString().split('T')[0];
  const clientId = (taxReturn.clientId || 'CLI-001').replace(/[^a-zA-Z0-9_-]/g, '');
  const prepId = (preparerId || taxReturn.taxPreparerId || taxReturn.preparerId || 'EFILE-99281').replace(/[^a-zA-Z0-9_-]/g, '');
  const status = (taxReturn.filingStatus || 'Draft').replace(/[^a-zA-Z0-9_-]/g, '');
  const province = (p?.province || 'ON').replace(/[^a-zA-Z0-9_-]/g, '');

  let result = pattern || '{Year}_{ClientName}_T1.pdf';

  result = result
    .replace(/\{Year\}/gi, year)
    .replace(/\{ClientName\}/gi, clientName)
    .replace(/\{Date\}/gi, todayDate)
    .replace(/\{LastName\}/gi, lastName)
    .replace(/\{FirstName\}/gi, firstName)
    .replace(/\{ClientId\}/gi, clientId)
    .replace(/\{PreparerId\}/gi, prepId)
    .replace(/\{Status\}/gi, status)
    .replace(/\{Province\}/gi, province);

  // Sanitize illegal characters
  result = result.replace(/[/\\?%*:|"<>]/g, '-').trim();

  if (!result.toLowerCase().endsWith('.pdf')) {
    result += '.pdf';
  }

  return result || `CRA-T1-${year}-${clientName}.pdf`;
}

export const PRESET_FILENAME_PATTERNS = [
  { label: '{Year}_{ClientName}_T1.pdf (Recommended)', pattern: '{Year}_{ClientName}_T1.pdf' },
  { label: '{Year}_{LastName}_T1.pdf (Default)', pattern: '{Year}_{LastName}_T1.pdf' },
  { label: '{ClientName}_{Year}_T1_{Date}.pdf', pattern: '{ClientName}_{Year}_T1_{Date}.pdf' },
  { label: 'CRA-T1-{Year}-{ClientName}-{ClientId}.pdf', pattern: 'CRA-T1-{Year}-{ClientName}-{ClientId}.pdf' },
  { label: '{LastName}_{FirstName}_{Year}_Return.pdf', pattern: '{LastName}_{FirstName}_{Year}_Return.pdf' },
  { label: 'T1_{Province}_{Year}_{ClientId}_{Date}.pdf', pattern: 'T1_{Province}_{Year}_{ClientId}_{Date}.pdf' },
  { label: '{Year}_T1_General_{LastName}.pdf', pattern: '{Year}_T1_General_{LastName}.pdf' },
];
