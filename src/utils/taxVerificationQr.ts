import QRCode from 'qrcode';
import { AppTaxReturn } from '../types/tax';
import { generateSha256Checksum } from './secureDocumentStorage';

export interface TaxDocumentVerificationData {
  documentHash: string;
  verificationUrl: string;
  qrSvg: string;
  qrDataUri: string;
  isOfficial: boolean;
  watermarkText: 'DRAFT' | 'OFFICIAL';
  statusLabel: string;
}

/**
 * Computes the CRA status and whether the tax document qualifies as OFFICIAL or DRAFT
 */
export function getCraSubmissionStatus(taxReturn: Partial<AppTaxReturn>): {
  isOfficial: boolean;
  watermarkText: 'DRAFT' | 'OFFICIAL';
  statusLabel: string;
} {
  const netfileStatus = taxReturn.netfile?.status;
  const isFiled =
    taxReturn.filingStatus === 'Filed' ||
    netfileStatus === 'accepted' ||
    Boolean(taxReturn.netfile?.confirmationNumber) ||
    Boolean(taxReturn.netfileConfirmationCode);

  if (isFiled) {
    return {
      isOfficial: true,
      watermarkText: 'OFFICIAL',
      statusLabel: 'CRA Certified / Transmitted',
    };
  }

  return {
    isOfficial: false,
    watermarkText: 'DRAFT',
    statusLabel: 'Draft / Pre-Submission',
  };
}

/**
 * Generates an official cryptographic verification payload, SHA-256 hash,
 * verification URL, and vector QR code for the given tax return.
 */
export async function generateTaxVerificationData(
  taxReturn: Partial<AppTaxReturn>,
  language: 'en' | 'fr' = 'en'
): Promise<TaxDocumentVerificationData> {
  const { isOfficial, watermarkText, statusLabel } = getCraSubmissionStatus(taxReturn);

  const taxYear = taxReturn.taxYear || 2025;
  const sin = taxReturn.personal?.sin || '000000000';
  const maskedSin = sin.length >= 4 ? `***-***-${sin.slice(-3)}` : '***-***-***';
  const lastName = (taxReturn.personal?.lastName || 'TAXPAYER').toUpperCase();
  const firstName = (taxReturn.personal?.firstName || '').toUpperCase();
  const province = taxReturn.personal?.province || 'ON';
  const totalIncome = Math.round(taxReturn.calculation?.totalIncome || 0);
  const netTax = Math.round(taxReturn.calculation?.totalTaxPayable ?? 0);
  const refCode =
    taxReturn.netfile?.confirmationNumber ||
    taxReturn.netfileConfirmationCode ||
    `T1-${taxYear}-${(taxReturn.id || 'RET').slice(-6).toUpperCase()}`;

  // Deterministic canonical payload for SHA-256 hashing
  const canonicalPayload = JSON.stringify({
    craForm: 'T1-GENERAL-CAN',
    taxYear,
    lastName,
    firstName,
    maskedSin,
    province,
    totalIncome,
    netTax,
    status: watermarkText,
    refCode,
  });

  const documentHash = await generateSha256Checksum(canonicalPayload);

  // Official verification URL encoding the document hash, tax year, and status
  const verificationUrl = `https://cra-arc.gc.ca/eservices/verify-t1?docHash=${documentHash.slice(
    0,
    32
  )}&year=${taxYear}&status=${watermarkText}&ref=${encodeURIComponent(refCode)}&lang=${language}`;

  // Generate crisp vector SVG QR code with CRA deep emerald / slate contrast
  let qrSvg = '';
  try {
    qrSvg = await QRCode.toString(verificationUrl, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: isOfficial ? '#064e3b' : '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generating QR code SVG:', err);
    qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25"><rect width="25" height="25" fill="#ffffff"/><rect x="2" y="2" width="7" height="7" fill="#064e3b"/><rect x="16" y="2" width="7" height="7" fill="#064e3b"/><rect x="2" y="16" width="7" height="7" fill="#064e3b"/><rect x="4" y="4" width="3" height="3" fill="#ffffff"/><rect x="18" y="4" width="3" height="3" fill="#ffffff"/><rect x="4" y="18" width="3" height="3" fill="#ffffff"/></svg>`;
  }

  const qrDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(qrSvg)}`;

  return {
    documentHash,
    verificationUrl,
    qrSvg,
    qrDataUri,
    isOfficial,
    watermarkText,
    statusLabel,
  };
}

/**
 * Synchronizes the print stylesheet environment with watermark settings and QR code CSS custom properties
 */
export function applyPrintVerificationStyles(params: {
  includeWatermark: boolean;
  watermarkText: 'DRAFT' | 'OFFICIAL';
  documentHash: string;
  verificationUrl: string;
  qrDataUri: string;
}) {
  if (typeof document === 'undefined') return;

  const { includeWatermark, watermarkText, documentHash, verificationUrl, qrDataUri } = params;

  // Set CSS custom property for pseudo-elements
  const root = document.documentElement;
  root.style.setProperty('--tax-document-qr', `url("${qrDataUri}")`);
  root.style.setProperty('--tax-document-hash', `"${documentHash}"`);
  root.style.setProperty('--tax-verification-url', `"${verificationUrl}"`);
  root.style.setProperty('--tax-watermark-text', `"${watermarkText}"`);

  // Set data attributes on body and document element
  document.body.setAttribute('data-include-watermark', includeWatermark ? 'true' : 'false');
  document.body.setAttribute('data-watermark-text', watermarkText);
  document.body.setAttribute('data-document-hash', documentHash);
  document.body.setAttribute('data-verification-url', verificationUrl);

  root.setAttribute('data-include-watermark', includeWatermark ? 'true' : 'false');
  root.setAttribute('data-watermark-text', watermarkText);

  // Sync to printable targets
  const printContainers = document.querySelectorAll(
    '#step-review-view, #step-review-print-preview, #step-calculation-view, #print-official-tax-summary-header, #print-official-tax-summary-footer'
  );
  printContainers.forEach((el) => {
    el.setAttribute('data-include-watermark', includeWatermark ? 'true' : 'false');
    el.setAttribute('data-watermark-text', watermarkText);
    el.setAttribute('data-document-hash', documentHash);
    (el as HTMLElement).style.setProperty('--tax-document-qr', `url("${qrDataUri}")`);
  });
}
