/**
 * Document Management System Types for TAX EASY FILLING APP
 * Supports W-2s, 1099s, Receipts (Medical, Donations, Childcare), T-Slips, and CRA Notices.
 */

export type DocumentCategory =
  | 'all'
  | 'income_slips'
  | 'deductions_rrsp'
  | 'credits_receipts'
  | 'business_expenses'
  | 'notices_legal'
  | 'identification';

export type TaxDocumentType =
  | 'W-2'
  | '1099-NEC'
  | '1099-MISC'
  | '1099-INT'
  | '1099-DIV'
  | '1099-B'
  | '1099-R'
  | 'T4'
  | 'T4A'
  | 'T5'
  | 'T3'
  | 'T2202'
  | 'RRSP'
  | 'FHSA'
  | 'RECEIPT_MEDICAL'
  | 'RECEIPT_DONATION'
  | 'RECEIPT_CHILDCARE'
  | 'RECEIPT_MOVING'
  | 'T2200'
  | 'T2125_RECEIPT'
  | 'NOA'
  | 'CRA_LETTER'
  | 'IDENTIFICATION'
  | 'OTHER';

export interface DocumentSecurityMeta {
  encryptionAlgorithm: 'AES-256-GCM';
  isEncryptedAtRest: boolean;
  sha256Checksum: string;
  ivHex: string;
  encryptedPayloadSize: number;
  retentionExpirationDate: string; // CRA 6-Year rule (Dec 31 of Tax Year + 6 years)
  tamperVerified: boolean;
  lastIntegrityCheck: string;
}

export interface ExtractedFinancialData {
  issuerName?: string;
  amountTotal?: number;
  currency?: 'CAD' | 'USD';
  foreignExchangeRate?: number; // e.g. BoC average 1.37 for USD to CAD
  amountCadEquivalent?: number;
  sinOrSsnMasked?: string;
  dateOfIssue?: string;
  accountOrIdNumber?: string;
  keyValues?: Record<string, string | number>;
}

export interface ManagedTaxDocument {
  id: string;
  name: string;
  fileName: string;
  fileType: 'pdf' | 'image' | 'spreadsheet' | 'document';
  fileSize: string;
  category: DocumentCategory;
  documentType: TaxDocumentType;
  taxYear: number;
  tags: string[];
  uploadedAt: string;
  updatedAt: string;
  status: 'encrypted' | 'verified' | 'needs_review' | 'archived';
  previewUrl?: string;
  notes?: string;
  extractedData?: ExtractedFinancialData;
  security: DocumentSecurityMeta;
  linkedReturnSection?: {
    stepTarget: number;
    sectionNameEn: string;
    sectionNameFr: string;
    formLineTarget?: string;
  };
}

export interface DocumentFilterState {
  searchQuery: string;
  category: DocumentCategory;
  documentType?: string;
  taxYear: number | 'all';
  selectedTags: string[];
  statusFilter: 'all' | 'verified' | 'needs_review' | 'encrypted';
  sortBy: 'date_desc' | 'date_asc' | 'name_asc' | 'amount_desc';
}

export interface DmsVaultStatistics {
  totalDocuments: number;
  totalEncrypted: number;
  totalStorageBytes: number;
  categoryCounts: Record<DocumentCategory, number>;
  crossBorderCount: number; // W-2 and 1099s
  receiptsCount: number; // Medical, Donations, Childcare
  verifiedCount: number;
  needsReviewCount: number;
  integrityPassed: boolean;
}
