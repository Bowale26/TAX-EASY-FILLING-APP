/**
 * Canadian Tax Filing App - Type Definitions
 * Covers T1 Personal Tax, all 13 Provinces/Territories, Slips, Deductions,
 * Credits, Computer Vision analysis, and A2A Judge Agent.
 */

export type ProvinceCode =
  | 'AB'
  | 'BC'
  | 'MB'
  | 'NB'
  | 'NL'
  | 'NT'
  | 'NS'
  | 'NU'
  | 'ON'
  | 'PE'
  | 'QC'
  | 'SK'
  | 'YT';

export interface ProvinceInfo {
  code: ProvinceCode;
  nameEn: string;
  nameFr: string;
  taxRateDescription: string;
}

export type MaritalStatus =
  | 'single'
  | 'married'
  | 'common_law'
  | 'separated'
  | 'divorced'
  | 'widowed';

export interface Dependant {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  relationship: 'child' | 'parent' | 'grandchild' | 'other';
  hasDisability: boolean;
  childcareExpenseClaimed: number;
}

export interface PersonalInformation {
  firstName: string;
  lastName: string;
  sin: string; // Stored masked/encrypted in production
  dateOfBirth: string;
  maritalStatus: MaritalStatus;
  hasSpouse: boolean;
  spouseSin?: string;
  spouseNetIncome?: number;
  email: string;
  phone: string;
  streetAddress: string;
  city: string;
  province: ProvinceCode;
  postalCode: string;
  residedInCanadaDec31: boolean;
  isCanadianCitizen: boolean;
  electionsCanadaConsent: boolean;
  firstTimeFiler: boolean;
  directDeposit: {
    enabled: boolean;
    transitNumber: string;
    institutionNumber: string;
    accountNumber: string;
  };
  employmentIndustryCode?: string;
}

export type SlipType =
  | 'T4'
  | 'T4A'
  | 'T4A(OAS)'
  | 'T4A(P)'
  | 'T4E'
  | 'T4FHSA'
  | 'T4RIF'
  | 'T4RSP'
  | 'T5'
  | 'T5007'
  | 'T5008'
  | 'T5013'
  | 'T5018'
  | 'T3'
  | 'T2202'
  | 'T1204'
  | 'RC62'
  | 'RRSP'
  | 'PRPP'
  | 'RECEIPT_DONATION'
  | 'RECEIPT_MEDICAL'
  | 'RECEIPT_CHILDCARE'
  | 'RECEIPT_RRSP';

export interface BoundingBox {
  label: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
  value: string;
  confidence: number;
}

export interface ComputerVisionResult {
  detectedSlipType: SlipType;
  issuerName: string;
  taxYear: number;
  confidenceScore: number;
  extractedBoxes: Record<string, number | string>;
  boundingBoxes: BoundingBox[];
  rawSummary: string;
  verificationRequired: boolean;
}

export interface ExtractedSlipResultPayload {
  slipType: SlipType;
  issuerName: string;
  taxYear: number;
  extractedBoxes: Record<string, number | string>;
  fileType: 'pdf' | 'image';
  fileName: string;
  previewUrl?: string;
  ocrConfidence: number;
  rawSummary?: string;
  t4Slip?: T4Slip;
  otherSlip?: OtherIncomeSlip;
  documentAssociation?: ScannedDocumentAssociation;
}

export interface T4Slip {
  id: string;
  employerName: string;
  box14_employmentIncome: number; // Line 10100
  box16_cppContributions: number; // Line 30800
  box17_qppContributions?: number;
  box18_eiPremiums: number; // Line 31200
  box20_rppContributions?: number; // Line 20700
  box22_incomeTaxDeducted: number; // Line 43700
  box24_eiInsurableEarnings?: number;
  box26_cppPensionableEarnings?: number;
  box44_unionDues?: number; // Line 21200
  box52_pensionAdjustment?: number; // Line 20600
  otherBoxes?: Record<string, number>;
  sourceDocumentId?: string;
  verifiedByUser: boolean;
}

export interface OtherIncomeSlip {
  id: string;
  type: SlipType;
  payerName: string;
  description: string;
  amounts: Record<string, number>;
  verifiedByUser: boolean;
  sourceDocumentId?: string;
  taxYear?: number;
  category?: 't4_slips' | 't5_slips' | 'more_slips';
  persona?: 'individual' | 'freelancer' | 'business';
}

export interface DeductionsData {
  rrspContributions: number; // Line 20800
  unionOrProfessionalDues: number; // Line 21200
  childcareExpenses: number; // Line 21400
  movingExpenses: number; // Line 21900
  employmentExpenses: number; // Line 22900 (e.g. work from home)
  otherDeductions: number;
}

export interface CreditsData {
  firstTimeHomeBuyerClaim: boolean; // Line 31270 ($10,000 credit)
  charitableDonations: number; // Line 34900
  eligibleMedicalExpenses: number; // Line 33099
  tuitionFeesT2202: number; // Line 32300
  hasDisabilityTaxCredit: boolean; // Line 31600
  isSeniorAge65Plus: boolean; // Line 30100
}

export interface TaxBracketStep {
  from: number;
  to: number | null;
  rate: number;
  taxInBracket: number;
}

export interface TaxCalculationResult {
  taxYear: number;
  province: ProvinceCode;
  
  // Income
  totalEmploymentIncome: number;
  otherIncome: number;
  totalIncome: number; // Line 15000
  
  // Deductions
  totalDeductions: number;
  netIncome: number; // Line 23600
  taxableIncome: number; // Line 26000
  
  // Federal
  federalGrossTax: number;
  federalBracketSteps: TaxBracketStep[];
  federalBasicPersonalAmount: number;
  federalNonRefundableCreditsTotal: number;
  federalCreditsBreakdown: {
    basicPersonalAmountCredit: number;
    cppCredit: number;
    eiCredit: number;
    canadaEmploymentCredit: number;
    tuitionCredit: number;
    donationsCredit: number;
    medicalExpensesCredit: number;
    firstTimeHomeBuyerCredit: number;
    ageAmountCredit: number;
  };
  netFederalTax: number; // Line 42000
  
  // Provincial
  provincialGrossTax: number;
  provincialBracketSteps: TaxBracketStep[];
  provincialCreditsTotal: number;
  provincialBasicPersonalAmount: number;
  netProvincialTax: number; // Line 42800
  
  // Totals & Refund
  totalTaxPayable: number; // Line 43500
  totalTaxWithheld: number; // Line 43700
  balanceOwingOrRefund: number; // Positive = refund (Line 48400), negative = owing (Line 48500)
  isRefund: boolean;
  
  // Benefits
  estimatedCanadaWorkersBenefit: number;
  estimatedGstHstCreditQuarterly: number;
  estimatedCanadaChildBenefitMonthly: number;
  
  // Rates & Diagnostics
  effectiveTaxRate?: number;
  marginalTaxRate?: number;

  // Deadlines
  filingDeadline: string;
  paymentDeadline: string;
  calculatedAt: string;
}

export interface DiagnosticIssue {
  id: string;
  type: 'error' | 'warning' | 'tip';
  field: string;
  messageEn: string;
  messageFr: string;
  stepTarget: number;
}

export interface A2AJudgeVerdict {
  status: 'PASSED' | 'WARNINGS' | 'FAILED';
  overallScore: number; // 0-100
  craComplianceScore: number; // 0-100
  auditedAt: string;
  checksRun: number;
  checksPassed: number;
  anomaliesDetected: string[];
  selfMaintenanceLog: {
    action: string;
    timestamp: string;
    result: string;
  }[];
  verdictSummaryEn: string;
  verdictSummaryFr: string;
  recommendations: string[];
}

export interface NetfileSubmission {
  status: 'draft' | 'validating' | 'ready' | 'transmitting' | 'accepted' | 'rejected';
  netfileAccessCode: string;
  confirmationNumber?: string;
  submissionTimestamp?: string;
  craTransactionId?: string;
  noticeOfAssessment?: {
    assessmentDate: string;
    refundOrBalanceOwing: number;
    assessedTaxYear: number;
    rrspDeductionLimitForNextYear: number;
    explanationOfChanges: string;
  };
}

export interface ScannedDocumentAssociation {
  id: string;
  documentCode: string; // e.g. 'T4', 'RRSP', 'T5', 'T4A', 'T2202', 'FHSA', 'T3', 'T4E', 'T2200', 'T5007'
  documentName: string;
  fileName: string;
  fileType: 'pdf' | 'image';
  fileSize?: string;
  scannedAt: string;
  status: 'scanned' | 'verified';
  previewUrl?: string;
  ocrConfidence?: number;
  missingFields?: string[];
  isValidated?: boolean;
  eSignatureStatus?: 'pending' | 'prepared' | 'signed';
  signedEnvelopeId?: string;
}

export interface AppTaxReturn {
  id: string;
  userId: string;
  taxYear: number;
  step: number; // 1 to 8
  isEligible: boolean;
  personal: PersonalInformation;
  dependants: Dependant[];
  t4Slips: T4Slip[];
  otherSlips: OtherIncomeSlip[];
  scannedDocuments?: ScannedDocumentAssociation[];
  deductions: DeductionsData;
  credits: CreditsData;
  otherIncome?: { amount: number; description: string };
  filingStatus?: 'Draft' | 'Filed' | string;
  netfileConfirmationCode?: string;
  filedAt?: string;
  calculation?: TaxCalculationResult;
  netfile: NetfileSubmission;
  auditTrail?: AuditEntry[];
  employmentIndustryCode?: string;
  preparerId?: string;
  taxPreparerId?: string;
  preparerName?: string;
  clientId?: string;
  clientNotes?: string;
  clientStatus?: 'Active' | 'Review' | 'Filed' | 'Archived';
  cloudSyncedAt?: string;
  updatedAt: string;
}

export interface IndustryBenchmark {
  code: string;
  nameEn: string;
  nameFr: string;
  category: string;
  typicalMinIncome: number;
  typicalMaxIncome: number;
  craMedianIncome: number;
  descriptionEn: string;
  descriptionFr: string;
}

export interface IndustryCrossReferenceResult {
  status: 'compliant' | 'underreported_risk' | 'high_earner_variance' | 'unspecified_code';
  benchmark: IndustryBenchmark | null;
  reportedIncome: number;
  minExpected: number;
  maxExpected: number;
  medianExpected: number;
  differenceFromMedian: number;
  percentageVariance: number;
  title: string;
  message: string;
  craGuidance: string;
  craAuditRiskScore: 'low' | 'medium' | 'flag';
}

export interface AuditEntry {
  id: string;
  timestamp: number;
  category: 'personal' | 'slips' | 'deductions' | 'credits' | 'filing' | 'system';
  field: string;
  fieldLabelEn: string;
  fieldLabelFr: string;
  previousValue: string;
  currentValue: string;
  action: 'added' | 'modified' | 'deleted' | 'imported' | 'merged';
  author?: string;
  authorRole?: 'taxpayer' | 'accountant' | 'cra_system' | 'ocr_scanner' | 'system';
  complianceReason?: string;
  notes?: string;
  conflicted?: boolean;
  conflictDetails?: {
    localValue?: any;
    remoteValue?: any;
    localDisplay?: string;
    remoteDisplay?: string;
    chosenResolution?: 'local' | 'remote';
  };
}

export interface ConflictDifference {
  id: string;
  fieldKey: string;
  category: 'personal' | 'slips' | 'deductions' | 'credits' | 'filing';
  labelEn: string;
  labelFr: string;
  localValue: any;
  remoteValue: any;
  localDisplay: string;
  remoteDisplay: string;
  chosenResolution: 'local' | 'remote';
  auditEntryId?: string;
  conflictType?: 'audit_conflict' | 'sync_divergence';
}
