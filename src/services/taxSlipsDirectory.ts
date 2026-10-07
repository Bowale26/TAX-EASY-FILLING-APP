/**
 * Official CRA Tax Slips Directory & Specifications
 * Covers all 19 required Canadian tax slips:
 * - T4 slips (8 slips)
 * - T5 slips (5 slips)
 * - More tax slips (6 slips)
 * Tailored for Individual Filers, Freelancers, and Small Business Owners.
 */

import { ComputerVisionResult, SlipType } from '../types/tax';

export type SlipCategory = 't4_slips' | 't5_slips' | 'more_slips';
export type SlipPersona = 'individual' | 'freelancer' | 'business';

export interface TaxSlipBoxDef {
  box: string;
  nameEn: string;
  nameFr: string;
  t1Line?: string;
  descriptionEn: string;
  descriptionFr: string;
}

export interface TaxSlipDefinition {
  code: SlipType;
  category: SlipCategory;
  personas: SlipPersona[];
  titleEn: string;
  titleFr: string;
  subtitleEn: string;
  subtitleFr: string;
  descriptionEn: string;
  descriptionFr: string;
  issuerEn: string;
  issuerFr: string;
  keyBoxes: TaxSlipBoxDef[];
  accentColor: string;
  bgLinear: string;
  officialCraUrl: string;
  sampleDocument: {
    id: string;
    fileName: string;
    fileSize: string;
    previewUrl: string;
    extractedResult: ComputerVisionResult;
  };
}

export const ALL_19_TAX_SLIPS: TaxSlipDefinition[] = [
  // -------------------------------------------------------------
  // GROUP 1: T4 SLIPS (8 SLIPS)
  // -------------------------------------------------------------
  {
    code: 'T4',
    category: 't4_slips',
    personas: ['individual', 'freelancer', 'business'],
    titleEn: 'Statement of Remuneration Paid (T4)',
    titleFr: 'État de la rémunération payée (T4)',
    subtitleEn: 'Standard employment income, payroll deductions & pensions',
    subtitleFr: 'Revenus d’emploi, retenues à la source et cotisations',
    descriptionEn: 'Issued by your Canadian employer. Reports gross salary, wages, bonuses, tips, income tax deducted, CPP/QPP contributions, and EI premiums.',
    descriptionFr: 'Remis par votre employeur canadien. Indique le salaire brut imposable, les retenues d’impôt, le RPC/RRQ et l’assurance-emploi.',
    issuerEn: 'Employers / Payroll administrators',
    issuerFr: 'Employeurs et gestionnaires de paie',
    accentColor: 'emerald',
    bgLinear: 'from-emerald-700 to-teal-900',
    officialCraUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/tax-slips/a-t4-slip.html',
    keyBoxes: [
      { box: '14', nameEn: 'Employment income', nameFr: 'Revenus d’emploi', t1Line: 'Line 10100', descriptionEn: 'Gross salary and taxable allowances', descriptionFr: 'Salaire brut et allocations imposables' },
      { box: '16', nameEn: 'Employee’s CPP contributions', nameFr: 'Cotisations RPC de l’employé', t1Line: 'Line 30800', descriptionEn: 'Canada Pension Plan contributions withheld', descriptionFr: 'Cotisations au RPC retenues sur la paie' },
      { box: '18', nameEn: 'Employee’s EI premiums', nameFr: 'Cotisations AE de l’employé', t1Line: 'Line 31200', descriptionEn: 'Employment Insurance premiums withheld', descriptionFr: 'Primes d’assurance-emploi retenues' },
      { box: '22', nameEn: 'Income tax deducted', nameFr: 'Impôt sur le revenu retenu', t1Line: 'Line 43700', descriptionEn: 'Federal and provincial income tax withheld at source', descriptionFr: 'Impôt total retenu à la source' },
      { box: '20', nameEn: 'RPP contributions', nameFr: 'Cotisations à un RPA', t1Line: 'Line 20700', descriptionEn: 'Registered Pension Plan contributions', descriptionFr: 'Cotisations au régime de pension agréé' },
      { box: '44', nameEn: 'Union dues', nameFr: 'Cotisations syndicales', t1Line: 'Line 21200', descriptionEn: 'Annual union or professional dues', descriptionFr: 'Cotisations syndicales ou professionnelles' },
    ],
    sampleDocument: {
      id: 'sample-t4-shopify',
      fileName: 'Shopify_T4_Slip_2025.png',
      fileSize: '1.4 MB',
      previewUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      extractedResult: {
        detectedSlipType: 'T4',
        issuerName: 'Shopify Commerce Canada Inc.',
        taxYear: 2025,
        confidenceScore: 0.98,
        extractedBoxes: {
          '14': 78500,
          '16': 3867.5,
          '18': 1049.12,
          '20': 2400,
          '22': 16420,
          '24': 63200,
          '26': 68500,
          '44': 0,
          '52': 4800,
        },
        boundingBoxes: [
          { label: 'Employer Name', box_2d: [110, 80, 180, 480], value: 'Shopify Commerce Canada Inc.', confidence: 0.99 },
          { label: 'Box 14: Employment Income', box_2d: [300, 520, 380, 880], value: '$78,500.00', confidence: 0.98 },
          { label: 'Box 16: Employee CPP', box_2d: [400, 100, 480, 480], value: '$3,867.50', confidence: 0.97 },
          { label: 'Box 18: Employee EI', box_2d: [400, 520, 480, 880], value: '$1,049.12', confidence: 0.97 },
          { label: 'Box 22: Income Tax Deducted', box_2d: [500, 520, 580, 880], value: '$16,420.00', confidence: 0.99 },
        ],
        rawSummary: 'AI recognized official CRA T4 slip for Shopify Commerce Canada Inc. Total Box 14 $78,500 with $16,420 tax withheld.',
        verificationRequired: true,
      },
    },
  },
  {
    code: 'T4A',
    category: 't4_slips',
    personas: ['individual', 'freelancer', 'business'],
    titleEn: 'Statement of Pension, Retirement, Annuity, and Other Income (T4A)',
    titleFr: 'État du revenu de pension, de retraite, de rente ou d’autres sources (T4A)',
    subtitleEn: 'Pensions, annuities, scholarships & self-employed contract commissions',
    subtitleFr: 'Pensions de retraite, bourses et commissions de pigistes',
    descriptionEn: 'Reports pension income, retirement allowances, annuities, scholarships, or freelance fees for services (Box 048 for independent contractors).',
    descriptionFr: 'Indique les rentes de retraite, allocations de retraite, bourses d’études ou honoraires de pigistes (case 048).',
    issuerEn: 'Pension funds, clients or payers',
    issuerFr: 'Régimes de retraite, payeurs ou clients',
    accentColor: 'indigo',
    bgLinear: 'from-indigo-700 to-purple-900',
    officialCraUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/tax-slips/a-t4a-slip.html',
    keyBoxes: [
      { box: '016', nameEn: 'Pension or superannuation', nameFr: 'Pension ou allocation de retraite', t1Line: 'Line 11500', descriptionEn: 'Company pension plan income', descriptionFr: 'Rente d’un régime de retraite d’entreprise' },
      { box: '048', nameEn: 'Fees for services (Contract work)', nameFr: 'Honoraires pour services rendus', t1Line: 'Line 13500', descriptionEn: 'Self-employment / freelancer contractor income', descriptionFr: 'Revenus de travailleur autonome ou pigiste' },
      { box: '105', nameEn: 'Scholarships, bursaries, fellowships', nameFr: 'Bourses d’études ou de perfectionnement', t1Line: 'Line 13010', descriptionEn: 'Post-secondary student awards and grants', descriptionFr: 'Bourses postsecondaires pour étudiants' },
      { box: '022', nameEn: 'Income tax deducted', nameFr: 'Impôt sur le revenu retenu', t1Line: 'Line 43700', descriptionEn: 'Withheld income tax', descriptionFr: 'Impôt retenu à la source' },
    ],
    sampleDocument: {
      id: 'sample-t4a-freelance',
      fileName: 'T4A_DigitalCraft_Contractor_2025.png',
      fileSize: '1.1 MB',
      previewUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
      extractedResult: {
        detectedSlipType: 'T4A',
        issuerName: 'DigitalCraft Media Studios Inc.',
        taxYear: 2025,
        confidenceScore: 0.97,
        extractedBoxes: {
          '048': 24500,
          '022': 2450,
          '016': 0,
          '105': 0,
        },
        boundingBoxes: [
          { label: 'Payer Name', box_2d: [100, 80, 170, 500], value: 'DigitalCraft Media Studios Inc.', confidence: 0.99 },
          { label: 'Box 048: Fees for Services', box_2d: [320, 500, 400, 880], value: '$24,500.00', confidence: 0.98 },
          { label: 'Box 022: Income Tax Deducted', box_2d: [480, 500, 560, 880], value: '$2,450.00', confidence: 0.96 },
        ],
        rawSummary: 'AI detected T4A Freelance Contractor Slip. Box 048 Fees for Services: $24,500.00 with $2,450.00 tax withheld.',
        verificationRequired: true,
      },
    },
  },
  {
    code: 'T4A(OAS)',
    category: 't4_slips',
    personas: ['individual'],
    titleEn: 'Statement of Old Age Security (T4A(OAS))',
    titleFr: 'État de la sécurité de la vieillesse (T4A(SV))',
    subtitleEn: 'Federal Old Age Security pension and net supplements',
    subtitleFr: 'Pension fédérale de la sécurité de la vieillesse et suppléments',
    descriptionEn: 'Sent by Service Canada. Reports Old Age Security pension received and any net federal supplements (such as the Guaranteed Income Supplement).',
    descriptionFr: 'Émis par Service Canada. Indique la pension de la Sécurité de la vieillesse et les suppléments de revenu garanti.',
    issuerEn: 'Employment & Social Development Canada / Service Canada',
    issuerFr: 'Emploi et Développement social Canada / Service Canada',
    accentColor: 'blue',
    bgLinear: 'from-blue-700 to-sky-900',
    officialCraUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/tax-slips/a-t4a-oas-slip.html',
    keyBoxes: [
      { box: '18', nameEn: 'Taxable OAS pension paid', nameFr: 'Pension de la SV imposable', t1Line: 'Line 11300', descriptionEn: 'Regular monthly OAS pension benefit', descriptionFr: 'Prestation régulière mensuelle de la SV' },
      { box: '19', nameEn: 'Net federal supplements', nameFr: 'Suppléments fédéraux nets', t1Line: 'Line 14500', descriptionEn: 'Guaranteed Income Supplement (GIS)', descriptionFr: 'Supplément de revenu garanti (SRG)' },
      { box: '22', nameEn: 'Income tax deducted', nameFr: 'Impôt retenu', t1Line: 'Line 43700', descriptionEn: 'Voluntary tax withheld', descriptionFr: 'Impôt retenu volontairement' },
    ],
    sampleDocument: {
      id: 'sample-t4a-oas',
      fileName: 'T4A_OAS_Service_Canada_2025.png',
      fileSize: '890 KB',
      previewUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
      extractedResult: {
        detectedSlipType: 'T4A(OAS)',
        issuerName: 'Service Canada / Government of Canada',
        taxYear: 2025,
        confidenceScore: 0.99,
        extractedBoxes: {
          '18': 8496.6,
          '19': 0,
          '22': 500,
        },
        boundingBoxes: [
          { label: 'Issuer', box_2d: [90, 80, 160, 480], value: 'Service Canada (OAS Program)', confidence: 0.99 },
          { label: 'Box 18: Taxable OAS Pension', box_2d: [290, 520, 370, 880], value: '$8,496.60', confidence: 0.99 },
          { label: 'Box 22: Income Tax Deducted', box_2d: [480, 520, 550, 880], value: '$500.00', confidence: 0.98 },
        ],
        rawSummary: 'AI identified CRA T4A(OAS) Statement of Old Age Security. Box 18 taxable pension $8,496.60 mapped to Line 11300.',
        verificationRequired: true,
      },
    },
  },
  {
    code: 'T4A(P)',
    category: 't4_slips',
    personas: ['individual'],
    titleEn: 'Statement of Canada Pension Plan Benefits (T4A(P))',
    titleFr: 'État des prestations du Régime de pensions du Canada (T4A(P))',
    subtitleEn: 'CPP retirement, survivor, disability, and children’s benefits',
    subtitleFr: 'Prestations de retraite, de survivant et d’invalidité du RPC',
    descriptionEn: 'Sent by Service Canada. Reports monthly CPP retirement benefits, disability benefits, survivor pensions, and child benefits.',
    descriptionFr: 'Transmis par Service Canada. Rapporte les prestations mensuelles de retraite du RPC, d’invalidité et de survivant.',
    issuerEn: 'Employment & Social Development Canada / Service Canada',
    issuerFr: 'Service Canada',
    accentColor: 'teal',
    bgLinear: 'from-teal-700 to-emerald-950',
    officialCraUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/tax-slips/a-t4a-p-slip.html',
    keyBoxes: [
      { box: '20', nameEn: 'Taxable CPP benefits', nameFr: 'Prestations imposables du RPC', t1Line: 'Line 11400', descriptionEn: 'Total taxable CPP payments received', descriptionFr: 'Total des prestations de retraite imposables du RPC' },
      { box: '22', nameEn: 'Income tax deducted', nameFr: 'Impôt sur le revenu retenu', t1Line: 'Line 43700', descriptionEn: 'Income tax withheld at source', descriptionFr: 'Impôt retenu à la source' },
      { box: '16', nameEn: 'Disability benefit', nameFr: 'Prestation d’invalidité', t1Line: 'Line 11410', descriptionEn: 'CPP disability benefit portion', descriptionFr: 'Partie relative aux prestations d’invalidité' },
    ],
    sampleDocument: {
      id: 'sample-t4a-p',
      fileName: 'T4A_P_CPP_Benefits_2025.png',
      fileSize: '950 KB',
      previewUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80',
      extractedResult: {
        detectedSlipType: 'T4A(P)',
        issuerName: 'Service Canada — CPP Administration',
        taxYear: 2025,
        confidenceScore: 0.98,
        extractedBoxes: {
          '20': 11840,
          '22': 1200,
        },
        boundingBoxes: [
          { label: 'Issuer', box_2d: [100, 80, 170, 480], value: 'Service Canada (CPP)', confidence: 0.99 },
          { label: 'Box 20: Taxable CPP Benefits', box_2d: [310, 520, 390, 880], value: '$11,840.00', confidence: 0.98 },
          { label: 'Box 22: Income Tax Deducted', box_2d: [490, 520, 560, 880], value: '$1,200.00', confidence: 0.97 },
        ],
        rawSummary: 'AI identified CRA T4A(P) Statement of Canada Pension Plan Benefits. Box 20 taxable benefits $11,840.00 mapped to Line 11400.',
        verificationRequired: true,
      },
    },
  },
  {
    code: 'T4E',
    category: 't4_slips',
    personas: ['individual', 'freelancer'],
    titleEn: 'Statement of Employment Insurance and Other Benefits (T4E)',
    titleFr: 'État des prestations d’assurance-emploi et autres (T4E)',
    subtitleEn: 'EI regular, sickness, parental benefits & clawback calculations',
    subtitleFr: 'Prestations d’AE régulières, parentales ou maladie',
    descriptionEn: 'Issued by Service Canada. Details Employment Insurance benefits paid during the calendar year and any income tax deducted.',
    descriptionFr: 'Délivré par Service Canada. Précise les prestations d’assurance-emploi versées durant l’année et l’impôt retenu.',
    issuerEn: 'Employment & Social Development Canada / Service Canada',
    issuerFr: 'Service Canada',
    accentColor: 'amber',
    bgLinear: 'from-amber-700 to-yellow-900',
    officialCraUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/tax-slips/a-t4e-slip.html',
    keyBoxes: [
      { box: '14', nameEn: 'Total benefits paid', nameFr: 'Total des prestations versées', t1Line: 'Line 11900', descriptionEn: 'Gross EI payments received', descriptionFr: 'Montant brut des prestations d’AE' },
      { box: '22', nameEn: 'Income tax deducted', nameFr: 'Impôt retenu', t1Line: 'Line 43700', descriptionEn: 'Tax withheld from EI payments', descriptionFr: 'Impôt déduit à la source sur l’AE' },
      { box: '18', nameEn: 'Taxable benefits', nameFr: 'Prestations imposables', t1Line: 'Line 11905', descriptionEn: 'Portion subject to income tax', descriptionFr: 'Montant assujetti à l’impôt sur le revenu' },
    ],
    sampleDocument: {
      id: 'sample-t4e-ei',
      fileName: 'T4E_Service_Canada_EI_2025.png',
      fileSize: '1.0 MB',
      previewUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=600&q=80',
      extractedResult: {
        detectedSlipType: 'T4E',
        issuerName: 'Service Canada / Assurance-Emploi',
        taxYear: 2025,
        confidenceScore: 0.98,
        extractedBoxes: {
          '14': 9600,
          '22': 1440,
        },
        boundingBoxes: [
          { label: 'Issuer', box_2d: [100, 80, 170, 480], value: 'Service Canada (EI Branch)', confidence: 0.99 },
          { label: 'Box 14: Total Benefits Paid', box_2d: [300, 520, 380, 880], value: '$9,600.00', confidence: 0.98 },
          { label: 'Box 22: Income Tax Deducted', box_2d: [480, 520, 560, 880], value: '$1,440.00', confidence: 0.97 },
        ],
        rawSummary: 'AI identified CRA T4E Statement of Employment Insurance. Box 14 $9,600 mapped to Line 11900 with $1,440 tax withheld.',
        verificationRequired: true,
      },
    },
  },
  {
    code: 'T4FHSA',
    category: 't4_slips',
    personas: ['individual'],
    titleEn: 'First Home Savings Account Statement (T4FHSA)',
    titleFr: 'État du compte d’épargne libre d’impôt pour l’achat d’une première propriété (T4CELIAPP)',
    subtitleEn: 'CELIAPP contributions, transfers & tax-free home purchase withdrawals',
    subtitleFr: 'Cotisations au CELIAPP et retraits admissibles pour premier achat',
    descriptionEn: 'Issued by financial institutions managing your First Home Savings Account (FHSA / CELIAPP). Reports contributions eligible for tax deduction and qualifying tax-free home purchases.',
    descriptionFr: 'Émis par votre institution financière pour votre CELIAPP. Indique les cotisations déductibles et les retraits admissibles sans impôt.',
    issuerEn: 'Banks / FHSA Trust issuers',
    issuerFr: 'Institutions financières et courtiers',
    accentColor: 'sky',
    bgLinear: 'from-sky-700 to-cyan-950',
    officialCraUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/first-home-savings-account.html',
    keyBoxes: [
      { box: '18', nameEn: 'FHSA contributions eligible for deduction', nameFr: 'Cotisations déductibles au CELIAPP', t1Line: 'Line 20805', descriptionEn: 'Contributions reducing your taxable income (up to $8,000/yr)', descriptionFr: 'Cotisations réduisant votre revenu imposable' },
      { box: '22', nameEn: 'Qualifying withdrawals', nameFr: 'Retraits admissibles', t1Line: 'Tax-Free', descriptionEn: 'Tax-free withdrawals used to buy a first home', descriptionFr: 'Retraits non imposables pour achat d’une première maison' },
      { box: '24', nameEn: 'Taxable withdrawals', nameFr: 'Retraits imposables', t1Line: 'Line 12905', descriptionEn: 'Non-qualifying withdrawals subject to tax', descriptionFr: 'Retraits non admissibles assujettis à l’impôt' },
    ],
    sampleDocument: {
      id: 'sample-t4fhsa-td',
      fileName: 'TD_T4FHSA_CELIAPP_Statement_2025.png',
      fileSize: '1.2 MB',
      previewUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80',
      extractedResult: {
        detectedSlipType: 'T4FHSA',
        issuerName: 'TD Canada Trust / Wealth Management',
        taxYear: 2025,
        confidenceScore: 0.99,
        extractedBoxes: {
          '18': 8000,
          '22': 0,
        },
        boundingBoxes: [
          { label: 'Financial Institution', box_2d: [100, 80, 180, 500], value: 'TD Canada Trust', confidence: 0.99 },
          { label: 'Box 18: FHSA Contributions', box_2d: [310, 520, 390, 880], value: '$8,000.00', confidence: 0.99 },
        ],
        rawSummary: 'AI identified CRA T4FHSA First Home Savings Account slip. Box 18 contributions $8,000.00 eligible for Line 20805 deduction.',
        verificationRequired: true,
      },
    },
  },
  {
    code: 'T4RIF',
    category: 't4_slips',
    personas: ['individual'],
    titleEn: 'Statement of Income from a RRIF (T4RIF)',
    titleFr: 'État du revenu provenant d’un FERR (T4RIF)',
    subtitleEn: 'Registered Retirement Income Fund payments & tax deductions',
    subtitleFr: 'Paiements provenant d’un fonds enregistré de revenu de retraite',
    descriptionEn: 'Reports income received from a Registered Retirement Income Fund (RRIF/FERR), including minimum required annual payments and excess amounts.',
    descriptionFr: 'Indique les revenus tirés d’un FERR, incluant le paiement annuel minimum obligatoire et les retraits supplémentaires.',
    issuerEn: 'Trust companies / Banks',
    issuerFr: 'Institutions financières et compagnies de fiducie',
    accentColor: 'rose',
    bgLinear: 'from-rose-800 to-red-950',
    officialCraUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/tax-slips/a-t4rif-slip.html',
    keyBoxes: [
      { box: '16', nameEn: 'Taxable amounts', nameFr: 'Montants imposables', t1Line: 'Line 11500 (Age 65+) or 13000', descriptionEn: 'Eligible for pension income credit if age 65+', descriptionFr: 'Admissible au crédit pour revenu de pension si âgé de 65 ans et plus' },
      { box: '22', nameEn: 'Income tax deducted', nameFr: 'Impôt retenu', t1Line: 'Line 43700', descriptionEn: 'Tax withheld at source on RRIF withdrawals', descriptionFr: 'Impôt prélevé à la source' },
    ],
    sampleDocument: {
      id: 'sample-t4rif-rbc',
      fileName: 'RBC_T4RIF_Statement_2025.png',
      fileSize: '980 KB',
      previewUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
      extractedResult: {
        detectedSlipType: 'T4RIF',
        issuerName: 'Royal Bank of Canada — Wealth Trust',
        taxYear: 2025,
        confidenceScore: 0.98,
        extractedBoxes: {
          '16': 14200,
          '22': 2840,
        },
        boundingBoxes: [
          { label: 'Issuer', box_2d: [100, 80, 170, 480], value: 'RBC Wealth Management', confidence: 0.99 },
          { label: 'Box 16: Taxable Amounts', box_2d: [300, 520, 380, 880], value: '$14,200.00', confidence: 0.98 },
          { label: 'Box 22: Income Tax Deducted', box_2d: [490, 520, 560, 880], value: '$2,840.00', confidence: 0.97 },
        ],
        rawSummary: 'AI identified CRA T4RIF Statement of Income from RRIF. Box 16 $14,200 with $2,840 tax deducted.',
        verificationRequired: true,
      },
    },
  },
  {
    code: 'T4RSP',
    category: 't4_slips',
    personas: ['individual'],
    titleEn: 'Statement of RRSP Income (T4RSP)',
    titleFr: 'État des revenus d’un REER (T4RSP)',
    subtitleEn: 'RRSP withdrawals, Home Buyers’ Plan (HBP) & Lifelong Learning',
    subtitleFr: 'Retraits de REER, Régime d’accession à la propriété (RAP)',
    descriptionEn: 'Reports withdrawals made from your Registered Retirement Savings Plan (RRSP), including Home Buyers’ Plan (HBP) and Lifelong Learning Plan (LLP) designations.',
    descriptionFr: 'Indique les retraits effectués d’un REER, y compris les désignations au RAP ou au REEP.',
    issuerEn: 'Financial institutions / Brokerages',
    issuerFr: 'Institutions financières et courtiers',
    accentColor: 'violet',
    bgLinear: 'from-violet-800 to-purple-950',
    officialCraUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/tax-slips/a-t4rsp-slip.html',
    keyBoxes: [
      { box: '22', nameEn: 'Withdrawal amount', nameFr: 'Montant du retrait', t1Line: 'Line 12900', descriptionEn: 'Regular taxable RRSP withdrawal', descriptionFr: 'Retrait imposable régulier de REER' },
      { box: '30', nameEn: 'Income tax deducted', nameFr: 'Impôt retenu', t1Line: 'Line 43700', descriptionEn: 'Withholding tax deducted on withdrawal', descriptionFr: 'Impôt retenu à la source lors du retrait' },
      { box: '27', nameEn: 'Home Buyers’ Plan withdrawal', nameFr: 'Retrait au titre du RAP', t1Line: 'Line 12900 / HBP', descriptionEn: 'Tax-free withdrawal under HBP', descriptionFr: 'Retrait non imposable au titre du RAP' },
    ],
    sampleDocument: {
      id: 'sample-t4rsp-scotia',
      fileName: 'Scotiabank_T4RSP_Withdrawal_2025.png',
      fileSize: '910 KB',
      previewUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
      extractedResult: {
        detectedSlipType: 'T4RSP',
        issuerName: 'The Bank of Nova Scotia (Scotiabank)',
        taxYear: 2025,
        confidenceScore: 0.98,
        extractedBoxes: {
          '22': 5000,
          '30': 500,
        },
        boundingBoxes: [
          { label: 'Issuer', box_2d: [100, 80, 170, 480], value: 'Scotiabank RRSP Operations', confidence: 0.99 },
          { label: 'Box 22: Withdrawal Amount', box_2d: [310, 520, 390, 880], value: '$5,000.00', confidence: 0.98 },
          { label: 'Box 30: Income Tax Deducted', box_2d: [490, 520, 560, 880], value: '$500.00', confidence: 0.97 },
        ],
        rawSummary: 'AI recognized CRA T4RSP Statement of RRSP Income. Box 22 taxable withdrawal $5,000.00 with $500.00 tax withheld.',
        verificationRequired: true,
      },
    },
  },

  // -------------------------------------------------------------
  // GROUP 2: T5 SLIPS (5 SLIPS)
  // -------------------------------------------------------------
  {
    code: 'T5',
    category: 't5_slips',
    personas: ['individual', 'freelancer', 'business'],
    titleEn: 'Statement of Investment Income (T5)',
    titleFr: 'État des revenus de placements (T5)',
    subtitleEn: 'Bank interest, GICs, dividends & corporate distributions',
    subtitleFr: 'Intérêts bancaires, CPG, dividendes déterminés et non déterminés',
    descriptionEn: 'Reports interest from savings accounts, term deposits/GICs, bonds, and Canadian eligible or non-eligible dividends from non-registered investment accounts.',
    descriptionFr: 'Indique les intérêts perçus sur comptes d’épargne, CPG, obligations et dividendes de source canadienne.',
    issuerEn: 'Banks, credit unions & brokerages',
    issuerFr: 'Banques, coopératives de crédit et courtiers',
    accentColor: 'blue',
    bgLinear: 'from-blue-800 to-indigo-950',
    officialCraUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/tax-slips/a-t5-slip.html',
    keyBoxes: [
      { box: '13', nameEn: 'Interest from Canadian sources', nameFr: 'Intérêts de source canadienne', t1Line: 'Line 12100', descriptionEn: 'Taxable bank and GIC interest', descriptionFr: 'Intérêts imposables sur dépôts bancaires et CPG' },
      { box: '24', nameEn: 'Actual amount of eligible dividends', nameFr: 'Montant réel des dividendes déterminés', t1Line: 'Line 12000', descriptionEn: 'Gross dividend received before gross-up', descriptionFr: 'Dividendes réels reçus d’entreprises canadiennes' },
      { box: '25', nameEn: 'Taxable amount of eligible dividends', nameFr: 'Montant imposable des dividendes déterminés', t1Line: 'Line 12000', descriptionEn: 'Grossed up dividend amount (138%)', descriptionFr: 'Dividendes majorés (138 %)' },
      { box: '26', nameEn: 'Dividend tax credit', nameFr: 'Crédit d’impôt pour dividendes', t1Line: 'Line 40425', descriptionEn: 'Federal tax credit on Canadian dividends', descriptionFr: 'Crédit d’impôt fédéral pour dividendes' },
    ],
    sampleDocument: {
      id: 'sample-t5-bmo',
      fileName: 'BMO_T5_Investment_Income_2025.png',
      fileSize: '1.2 MB',
      previewUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
      extractedResult: {
        detectedSlipType: 'T5',
        issuerName: 'Bank of Montreal (BMO InvestorLine)',
        taxYear: 2025,
        confidenceScore: 0.98,
        extractedBoxes: {
          '13': 3450,
          '24': 1800,
          '25': 2484,
          '26': 373.1,
        },
        boundingBoxes: [
          { label: 'Financial Institution', box_2d: [100, 80, 170, 480], value: 'BMO InvestorLine Inc.', confidence: 0.99 },
          { label: 'Box 13: Interest from Canadian Sources', box_2d: [300, 520, 380, 880], value: '$3,450.00', confidence: 0.98 },
          { label: 'Box 24: Eligible Dividends', box_2d: [480, 520, 560, 880], value: '$1,800.00', confidence: 0.97 },
        ],
        rawSummary: 'AI identified CRA T5 Statement of Investment Income. Box 13 Interest $3,450.00 and Box 24 Eligible Dividends $1,800.00.',
        verificationRequired: true,
      },
    },
  },
  {
    code: 'T5007',
    category: 't5_slips',
    personas: ['individual'],
    titleEn: 'Statement of Benefits (T5007)',
    titleFr: 'État des prestations (T5007)',
    subtitleEn: 'Workers’ compensation (WSIB/CNESST) & social assistance',
    subtitleFr: 'Indemnités pour accidents du travail et aide sociale provinciale',
    descriptionEn: 'Reports Workers’ Compensation Board (WCB/WSIB/CNESST) benefits or provincial social assistance. Non-taxable on Line 25000, but included in net income to compute income-tested credits.',
    descriptionFr: 'Rapporte les indemnités de la CNESST/WSIB ou les prestations d’aide sociale reçues. Non imposables (déduites à la ligne 25000), mais incluses dans le revenu net.',
    issuerEn: 'Provincial workers’ boards / Social ministries',
    issuerFr: 'Commissions de santé et sécurité / Ministères sociaux',
    accentColor: 'rose',
    bgLinear: 'from-rose-700 to-pink-950',
    officialCraUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/tax-slips/a-t5007-slip.html',
    keyBoxes: [
      { box: '10', nameEn: 'Workers’ compensation benefits', nameFr: 'Indemnités pour accidents du travail', t1Line: 'Line 14400 & Line 25000', descriptionEn: 'WCB benefits (tax-free offset)', descriptionFr: 'Indemnités d’accident du travail déduites à la ligne 25000' },
      { box: '11', nameEn: 'Social assistance payments', nameFr: 'Prestations d’aide sociale', t1Line: 'Line 14500 & Line 25000', descriptionEn: 'Provincial support benefits', descriptionFr: 'Prestations d’assistance financière' },
    ],
    sampleDocument: {
      id: 'sample-t5007-wsib',
      fileName: 'WSIB_T5007_Benefits_Statement_2025.png',
      fileSize: '880 KB',
      previewUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80',
      extractedResult: {
        detectedSlipType: 'T5007',
        issuerName: 'Workplace Safety and Insurance Board (WSIB)',
        taxYear: 2025,
        confidenceScore: 0.99,
        extractedBoxes: {
          '10': 6200,
          '11': 0,
        },
        boundingBoxes: [
          { label: 'Payer', box_2d: [100, 80, 170, 480], value: 'WSIB Ontario', confidence: 0.99 },
          { label: 'Box 10: Workers’ Comp', box_2d: [310, 520, 390, 880], value: '$6,200.00', confidence: 0.98 },
        ],
        rawSummary: 'AI identified CRA T5007 Statement of Benefits. Box 10 WCB $6,200.00 entered on Line 14400 and offset at Line 25000.',
        verificationRequired: true,
      },
    },
  },
  {
    code: 'T5008',
    category: 't5_slips',
    personas: ['individual', 'freelancer', 'business'],
    titleEn: 'Statement of Securities Transactions (T5008)',
    titleFr: 'État des opérations sur titres (T5008)',
    subtitleEn: 'Stock, ETF, bond dispositions & capital gains (Schedule 3)',
    subtitleFr: 'Dispositions d’actions, FNB, obligations et gains en capital',
    descriptionEn: 'Issued by stockbrokers and financial institutions when you sell shares, ETFs, mutual funds, or bonds in a non-registered account. Details proceeds and adjusted cost base.',
    descriptionFr: 'Délivré par les courtiers lors de la vente d’actions, FNB ou obligations dans un compte non enregistré.',
    issuerEn: 'Investment brokerages & trading platforms',
    issuerFr: 'Courtiers en valeurs mobilières et plateformes de négociation',
    accentColor: 'emerald',
    bgLinear: 'from-emerald-800 to-green-950',
    officialCraUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/tax-slips/a-t5008-slip.html',
    keyBoxes: [
      { box: '21', nameEn: 'Proceeds of disposition or settlement', nameFr: 'Produit de disposition ou règlement', t1Line: 'Schedule 3 / Line 12700', descriptionEn: 'Total sale proceeds received', descriptionFr: 'Montant total de la vente des titres' },
      { box: '20', nameEn: 'Cost or book value (ACB)', nameFr: 'Coût ou valeur comptable', t1Line: 'Schedule 3', descriptionEn: 'Adjusted Cost Base of securities sold', descriptionFr: 'Prix de base rajusté des titres vendus' },
      { box: '16', nameEn: 'Quantity of securities', nameFr: 'Quantité de titres', t1Line: 'Schedule 3', descriptionEn: 'Number of units or shares transacted', descriptionFr: 'Nombre d’actions ou parts cédées' },
    ],
    sampleDocument: {
      id: 'sample-t5008-wealthsimple',
      fileName: 'Wealthsimple_T5008_Securities_2025.png',
      fileSize: '1.3 MB',
      previewUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
      extractedResult: {
        detectedSlipType: 'T5008',
        issuerName: 'Wealthsimple Investments Inc.',
        taxYear: 2025,
        confidenceScore: 0.97,
        extractedBoxes: {
          '21': 15800,
          '20': 12200,
          '16': 150,
        },
        boundingBoxes: [
          { label: 'Broker Name', box_2d: [100, 80, 170, 480], value: 'Wealthsimple Investments Inc.', confidence: 0.99 },
          { label: 'Box 21: Proceeds of Disposition', box_2d: [300, 520, 380, 880], value: '$15,800.00', confidence: 0.98 },
          { label: 'Box 20: Cost or Book Value', box_2d: [480, 520, 560, 880], value: '$12,200.00', confidence: 0.96 },
        ],
        rawSummary: 'AI identified CRA T5008 Statement of Securities Transactions. Proceeds $15,800, Cost $12,200. Net Capital Gain: $3,600.00.',
        verificationRequired: true,
      },
    },
  },
  {
    code: 'T5013',
    category: 't5_slips',
    personas: ['freelancer', 'business'],
    titleEn: 'Statement of Partnership Income (T5013)',
    titleFr: 'État des revenus d’une société de personnes (T5013)',
    subtitleEn: 'Partnership allocations for small business owners & partners',
    subtitleFr: 'Attribution des revenus et dépenses pour associés',
    descriptionEn: 'Issued to partners in general or limited partnerships. Allocates your share of partnership business income, professional income, dividends, or capital gains.',
    descriptionFr: 'Émis aux associés d’une société en nom collectif ou en commandite. Répartit votre part de revenus d’entreprise ou de gains.',
    issuerEn: 'Partnership managers / Corporate accountants',
    issuerFr: 'Gestionnaires de société de personnes et comptables',
    accentColor: 'cyan',
    bgLinear: 'from-cyan-800 to-slate-900',
    officialCraUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/tax-slips/a-t5013-slip.html',
    keyBoxes: [
      { box: '010', nameEn: 'Total business income (loss)', nameFr: 'Revenu net d’entreprise (perte)', t1Line: 'Line 12200', descriptionEn: 'Your share of active partnership profit', descriptionFr: 'Votre part du bénéfice net de la société' },
      { box: '105', nameEn: 'Limited partner business income', nameFr: 'Revenu d’entreprise d’un commanditaire', t1Line: 'Line 12200', descriptionEn: 'Allocated limited partner distribution', descriptionFr: 'Part de revenu d’un associé commanditaire' },
      { box: '128', nameEn: 'Interest from Canadian sources', nameFr: 'Intérêts de source canadienne', t1Line: 'Line 12100', descriptionEn: 'Interest earned within the partnership', descriptionFr: 'Intérêts gagnés au sein de la société' },
    ],
    sampleDocument: {
      id: 'sample-t5013-partnership',
      fileName: 'Nexus_Partners_T5013_Statement_2025.png',
      fileSize: '1.4 MB',
      previewUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
      extractedResult: {
        detectedSlipType: 'T5013',
        issuerName: 'Nexus Tech Advisory LP',
        taxYear: 2025,
        confidenceScore: 0.98,
        extractedBoxes: {
          '010': 32400,
          '128': 1150,
        },
        boundingBoxes: [
          { label: 'Partnership Name', box_2d: [100, 80, 170, 480], value: 'Nexus Tech Advisory LP', confidence: 0.99 },
          { label: 'Box 010: Partnership Business Income', box_2d: [310, 520, 390, 880], value: '$32,400.00', confidence: 0.98 },
        ],
        rawSummary: 'AI recognized CRA T5013 Statement of Partnership Income. Box 010 Partnership Business Income: $32,400.00 for Line 12200.',
        verificationRequired: true,
      },
    },
  },
  {
    code: 'T5018',
    category: 't5_slips',
    personas: ['freelancer', 'business'],
    titleEn: 'Statement of Contract Payments (T5018)',
    titleFr: 'État des paiements contractuels (T5018)',
    subtitleEn: 'Subcontractor payments in construction & contractor services',
    subtitleFr: 'Paiements versés aux sous-traitants dans la construction et services',
    descriptionEn: 'Essential for construction businesses and freelance subcontractors. Reports total payments made or received for subcontracting services during the reporting period.',
    descriptionFr: 'Indispensable pour le secteur de la construction et les sous-traitants. Déclare les paiements versés pour services de sous-traitance.',
    issuerEn: 'General contractors & construction business clients',
    issuerFr: 'Entrepreneurs généraux et donneurs d’ouvrage',
    accentColor: 'amber',
    bgLinear: 'from-amber-800 to-orange-950',
    officialCraUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/contract-payment-reporting-system.html',
    keyBoxes: [
      { box: '22', nameEn: 'Total contract payments received', nameFr: 'Total des paiements contractuels reçus', t1Line: 'Form T2125 / Line 13500', descriptionEn: 'Gross contract revenue received for services', descriptionFr: 'Revenu brut perçu pour travaux sous-traités' },
      { box: '24', nameEn: 'Recipient Business / GST Number', nameFr: 'Numéro d’entreprise / TPS du bénéficiaire', t1Line: 'CRA Business Identification', descriptionEn: 'Tax identifier of the subcontractor', descriptionFr: 'Numéro d’entreprise de l’artisan ou sous-traitant' },
    ],
    sampleDocument: {
      id: 'sample-t5018-contract',
      fileName: 'Apex_Builders_T5018_Contract_2025.png',
      fileSize: '1.2 MB',
      previewUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
      extractedResult: {
        detectedSlipType: 'T5018',
        issuerName: 'Apex Canadian Builders Group Inc.',
        taxYear: 2025,
        confidenceScore: 0.99,
        extractedBoxes: {
          '22': 48500,
          '24': '894215689RT0001',
        },
        boundingBoxes: [
          { label: 'Payer Construction Co.', box_2d: [100, 80, 170, 500], value: 'Apex Canadian Builders Group Inc.', confidence: 0.99 },
          { label: 'Box 22: Total Contract Payments', box_2d: [310, 520, 390, 880], value: '$48,500.00', confidence: 0.99 },
          { label: 'Box 24: GST/HST Account Number', box_2d: [480, 520, 560, 880], value: '894215689RT0001', confidence: 0.98 },
        ],
        rawSummary: 'AI identified CRA T5018 Statement of Contract Payments. Box 22 Gross Contract Payments: $48,500.00 for Form T2125 business revenue.',
        verificationRequired: true,
      },
    },
  },

  // -------------------------------------------------------------
  // GROUP 3: MORE TAX SLIPS (6 SLIPS)
  // -------------------------------------------------------------
  {
    code: 'T3',
    category: 'more_slips',
    personas: ['individual', 'freelancer', 'business'],
    titleEn: 'Statement of Trust Income Allocations and Designations (T3)',
    titleFr: 'État des revenus de fiducie (T3)',
    subtitleEn: 'Mutual funds, ETFs & Real Estate Investment Trusts (REITs)',
    subtitleFr: 'Fonds communs, FNB et fiducies de placement immobilier (FPI)',
    descriptionEn: 'Issued for distributions from mutual fund trusts, unit trusts, and ETFs in non-registered accounts. Allocates capital gains, dividends, and other trust distributions.',
    descriptionFr: 'Émis pour les distributions de fiducies de fonds communs et FNB. Répartit les gains en capital, dividendes et autres revenus de fiducie.',
    issuerEn: 'Fund managers & trust administrators',
    issuerFr: 'Gestionnaires de fonds et administrateurs de fiducie',
    accentColor: 'cyan',
    bgLinear: 'from-cyan-700 to-blue-950',
    officialCraUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/tax-slips/a-t3-slip.html',
    keyBoxes: [
      { box: '21', nameEn: 'Capital gains', nameFr: 'Gains en capital', t1Line: 'Schedule 3 / Line 12700', descriptionEn: 'Trust capital gains distributions', descriptionFr: 'Gains en capital distribués par la fiducie' },
      { box: '49', nameEn: 'Eligible dividends', nameFr: 'Dividendes déterminés', t1Line: 'Line 12000', descriptionEn: 'Eligible dividends from Canadian corporations', descriptionFr: 'Dividendes déterminés de sociétés canadiennes' },
      { box: '26', nameEn: 'Other income', nameFr: 'Autres revenus', t1Line: 'Line 13000', descriptionEn: 'Interest and other trust earnings', descriptionFr: 'Intérêts et autres gains de la fiducie' },
    ],
    sampleDocument: {
      id: 'sample-t3-vanguard',
      fileName: 'Vanguard_T3_Trust_Allocation_2025.png',
      fileSize: '1.1 MB',
      previewUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=600&q=80',
      extractedResult: {
        detectedSlipType: 'T3',
        issuerName: 'Vanguard Investments Canada Trust',
        taxYear: 2025,
        confidenceScore: 0.98,
        extractedBoxes: {
          '21': 2850,
          '49': 1420,
          '26': 650,
        },
        boundingBoxes: [
          { label: 'Trust Issuer', box_2d: [100, 80, 170, 480], value: 'Vanguard Investments Canada', confidence: 0.99 },
          { label: 'Box 21: Capital Gains', box_2d: [300, 520, 380, 880], value: '$2,850.00', confidence: 0.98 },
          { label: 'Box 49: Eligible Dividends', box_2d: [480, 520, 560, 880], value: '$1,420.00', confidence: 0.97 },
        ],
        rawSummary: 'AI identified CRA T3 Statement of Trust Income Allocations. Capital Gains $2,850.00, Dividends $1,420.00, Other Income $650.00.',
        verificationRequired: true,
      },
    },
  },
  {
    code: 'T2202',
    category: 'more_slips',
    personas: ['individual'],
    titleEn: 'Tuition and Enrolment Certificate (T2202)',
    titleFr: 'Certificat pour frais de scolarité et d’inscription (T2202)',
    subtitleEn: 'Tuition tax credit & student qualifying months calculation',
    subtitleFr: 'Crédit d’impôt pour frais de scolarité et mois d’études',
    descriptionEn: 'Issued by designated colleges, universities, or post-secondary institutions in Canada. Certifies eligible tuition fees paid and qualifying part-time and full-time months.',
    descriptionFr: 'Délivré par les universités et collèges agréés au Canada. Atteste des frais de scolarité admissibles payés et des mois d’études.',
    issuerEn: 'Canadian post-secondary colleges & universities',
    issuerFr: 'Universités et collèges canadiens agréés',
    accentColor: 'indigo',
    bgLinear: 'from-indigo-800 to-purple-950',
    officialCraUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/tax-slips/a-t2202-slip.html',
    keyBoxes: [
      { box: 'A', nameEn: 'Eligible tuition fees', nameFr: 'Frais de scolarité admissibles', t1Line: 'Schedule 11 / Line 32300', descriptionEn: 'Tuition paid (exceeding $100)', descriptionFr: 'Frais de scolarité admissibles ouvrant droit au crédit' },
      { box: 'B', nameEn: 'Part-time months', nameFr: 'Nombre de mois à temps partiel', t1Line: 'Schedule 11', descriptionEn: 'Number of part-time enrolled months', descriptionFr: 'Mois d’inscription à temps partiel' },
      { box: 'C', nameEn: 'Full-time months', nameFr: 'Nombre de mois à temps plein', t1Line: 'Schedule 11', descriptionEn: 'Number of full-time enrolled months', descriptionFr: 'Mois d’inscription à temps plein' },
    ],
    sampleDocument: {
      id: 'sample-t2202-utoronto',
      fileName: 'UToronto_T2202_Tuition_Certificate_2025.png',
      fileSize: '1.2 MB',
      previewUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80',
      extractedResult: {
        detectedSlipType: 'T2202',
        issuerName: 'University of Toronto',
        taxYear: 2025,
        confidenceScore: 0.99,
        extractedBoxes: {
          eligibleTuitionFees: 7850,
          fullTimeMonths: 8,
          partTimeMonths: 0,
        },
        boundingBoxes: [
          { label: 'Educational Institution', box_2d: [110, 120, 190, 580], value: 'University of Toronto', confidence: 0.99 },
          { label: 'Eligible Tuition Fees', box_2d: [350, 480, 430, 880], value: '$7,850.00', confidence: 0.98 },
          { label: 'Full-time Months', box_2d: [510, 650, 580, 850], value: '8 Months', confidence: 0.97 },
        ],
        rawSummary: 'AI identified Canadian T2202 Tuition Certificate. Eligible tuition fees $7,850.00 mapped to Line 32300 with 8 full-time months.',
        verificationRequired: true,
      },
    },
  },
  {
    code: 'T1204',
    category: 'more_slips',
    personas: ['freelancer', 'business'],
    titleEn: 'Government Services Contract Payments (T1204)',
    titleFr: 'Paiements contractuels de services du gouvernement (T1204)',
    subtitleEn: 'Federal, provincial & crown corporation service contracts',
    subtitleFr: 'Contrats de services gouvernementaux et sociétés d’État',
    descriptionEn: 'Issued by federal, provincial, or territorial government departments and Crown corporations for services provided under procurement contracts.',
    descriptionFr: 'Remis par les ministères et sociétés d’État pour services rendus dans le cadre de marchés publics.',
    issuerEn: 'Government of Canada / Provincial procurement',
    issuerFr: 'Gouvernement du Canada et ministères provinciaux',
    accentColor: 'slate',
    bgLinear: 'from-slate-800 to-gray-950',
    officialCraUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/government-services-contract-payments.html',
    keyBoxes: [
      { box: '13', nameEn: 'Contract payment amount', nameFr: 'Montant du paiement contractuel', t1Line: 'Form T2125 / Line 13500', descriptionEn: 'Gross contract payment from government body', descriptionFr: 'Montant brut versé pour contrat gouvernemental' },
      { box: '14', nameEn: 'HST / GST included', nameFr: 'TPS / TVH incluse', t1Line: 'GST/HST Return', descriptionEn: 'Sales tax component of the invoice', descriptionFr: 'Taxe de vente applicable' },
    ],
    sampleDocument: {
      id: 'sample-t1204-pwgsc',
      fileName: 'Public_Services_Canada_T1204_2025.png',
      fileSize: '1.0 MB',
      previewUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
      extractedResult: {
        detectedSlipType: 'T1204',
        issuerName: 'Public Services and Procurement Canada',
        taxYear: 2025,
        confidenceScore: 0.98,
        extractedBoxes: {
          '13': 38000,
          '14': 4940,
        },
        boundingBoxes: [
          { label: 'Government Body', box_2d: [100, 80, 170, 500], value: 'Public Services and Procurement Canada', confidence: 0.99 },
          { label: 'Box 13: Contract Payment', box_2d: [310, 520, 390, 880], value: '$38,000.00', confidence: 0.98 },
        ],
        rawSummary: 'AI identified CRA T1204 Government Services Contract Payments. Box 13 Gross Payment: $38,000.00 for Form T2125 self-employment revenue.',
        verificationRequired: true,
      },
    },
  },
  {
    code: 'RC62',
    category: 'more_slips',
    personas: ['individual'],
    titleEn: 'Universal Child Care Benefit Statement (RC62)',
    titleFr: 'État de la prestation universelle pour la garde d’enfants (RC62)',
    subtitleEn: 'Prior UCCB payments, lump-sum repayments & family benefits',
    subtitleFr: 'Prestation pour garde d’enfants et remboursements rétroactifs',
    descriptionEn: 'Reports Universal Child Care Benefit (UCCB) amounts paid or repaid. Relevant for retroactive or historical adjustments to Canadian child benefit entitlements.',
    descriptionFr: 'Indique les montants versés ou remboursés au titre de la PUGE lors de redressements rétroactifs.',
    issuerEn: 'Canada Revenue Agency (CRA)',
    issuerFr: 'Agence du revenu du Canada (ARC)',
    accentColor: 'rose',
    bgLinear: 'from-pink-800 to-rose-950',
    officialCraUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/tax-slips/a-rc62-slip.html',
    keyBoxes: [
      { box: '10', nameEn: 'Universal child care benefit received', nameFr: 'PUGE reçue', t1Line: 'Line 11700', descriptionEn: 'Taxable child care benefits received', descriptionFr: 'Prestation imposable reçue pour la garde d’enfants' },
      { box: '12', nameEn: 'UCCB repayment', nameFr: 'Remboursement de la PUGE', t1Line: 'Line 21300', descriptionEn: 'Deductible UCCB repayment amount', descriptionFr: 'Montant déductible pour remboursement de la PUGE' },
    ],
    sampleDocument: {
      id: 'sample-rc62-cra',
      fileName: 'CRA_RC62_Statement_2025.png',
      fileSize: '890 KB',
      previewUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
      extractedResult: {
        detectedSlipType: 'RC62',
        issuerName: 'Canada Revenue Agency',
        taxYear: 2025,
        confidenceScore: 0.99,
        extractedBoxes: {
          '10': 1920,
        },
        boundingBoxes: [
          { label: 'Agency', box_2d: [100, 80, 170, 480], value: 'Canada Revenue Agency', confidence: 0.99 },
          { label: 'Box 10: UCCB Received', box_2d: [310, 520, 390, 880], value: '$1,920.00', confidence: 0.98 },
        ],
        rawSummary: 'AI identified CRA RC62 Child Care Benefit Statement. Box 10 UCCB $1,920.00 mapped to Line 11700.',
        verificationRequired: true,
      },
    },
  },
  {
    code: 'RRSP',
    category: 'more_slips',
    personas: ['individual', 'freelancer', 'business'],
    titleEn: 'Official RRSP Contribution Receipt',
    titleFr: 'Reçu officiel de cotisation à un REER',
    subtitleEn: 'Line 20800 deduction for tax year & first 60 days of next year',
    subtitleFr: 'Déduction REER à la ligne 20800 et 60 premiers jours',
    descriptionEn: 'Issued by your bank, brokerage, or financial institution. Certifies official tax-deductible contributions made to your Registered Retirement Savings Plan (RRSP).',
    descriptionFr: 'Délivré par votre banque ou courtier. Atteste de vos cotisations officielles déductibles à votre REER.',
    issuerEn: 'Banks, mutual funds & financial brokerages',
    issuerFr: 'Institutions financières et courtiers',
    accentColor: 'teal',
    bgLinear: 'from-teal-800 to-emerald-950',
    officialCraUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-20800-rrsp-deduction.html',
    keyBoxes: [
      { box: 'Receipt', nameEn: 'Total contribution amount', nameFr: 'Montant total de la cotisation', t1Line: 'Line 20800', descriptionEn: 'Deductible contribution reducing taxable income', descriptionFr: 'Cotisation déductible diminuant le revenu imposable' },
      { box: 'Period', nameEn: 'Contribution period (March-Dec or First 60 Days)', nameFr: 'Période de cotisation', t1Line: 'Schedule 7', descriptionEn: 'Valid for current tax year deduction', descriptionFr: 'Valide pour déduction sur l’année fiscale' },
    ],
    sampleDocument: {
      id: 'sample-rrsp-rbc',
      fileName: 'RBC_Direct_Investing_RRSP_Contribution_2025.pdf',
      fileSize: '348 KB',
      previewUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      extractedResult: {
        detectedSlipType: 'RRSP',
        issuerName: 'RBC Direct Investing Inc.',
        taxYear: 2025,
        confidenceScore: 0.99,
        extractedBoxes: {
          contributionAmount: 6500,
        },
        boundingBoxes: [
          { label: 'Issuer Institution', box_2d: [90, 80, 160, 500], value: 'RBC Direct Investing Inc.', confidence: 0.99 },
          { label: 'Contribution Amount', box_2d: [350, 480, 430, 880], value: '$6,500.00 CAD', confidence: 0.99 },
        ],
        rawSummary: 'AI identified Official RRSP Contribution Receipt. Total deductible amount $6,500.00 mapped to Line 20800.',
        verificationRequired: true,
      },
    },
  },
  {
    code: 'PRPP',
    category: 'more_slips',
    personas: ['individual', 'freelancer', 'business'],
    titleEn: 'PRPP Contribution Receipt (Pooled Registered Pension)',
    titleFr: 'Reçu de cotisation au RPAC (Régime de pension agréé collectif)',
    subtitleEn: 'Retirement savings for employees & self-employed individuals',
    subtitleFr: 'Épargne-retraite collective pour salariés et travailleurs autonomes',
    descriptionEn: 'Issued to employees and self-employed individuals who participate in a Pooled Registered Pension Plan (PRPP/RPAC). Contributions are deductible on Line 20810.',
    descriptionFr: 'Délivré aux participants d’un Régime de pension agréé collectif (RPAC). Les cotisations sont déductibles à la ligne 20810.',
    issuerEn: 'PRPP administrator / Insurance underwriters',
    issuerFr: 'Administrateurs de RPAC et compagnies d’assurance',
    accentColor: 'indigo',
    bgLinear: 'from-indigo-800 to-slate-950',
    officialCraUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/pooled-registered-pension-plan-prpp-information-individuals.html',
    keyBoxes: [
      { box: 'Receipt', nameEn: 'PRPP employee / member contribution', nameFr: 'Cotisation du participant au RPAC', t1Line: 'Line 20810', descriptionEn: 'Deductible PRPP contribution amount', descriptionFr: 'Cotisation déductible au RPAC' },
      { box: 'Employer', nameEn: 'Employer matching PRPP contribution', nameFr: 'Cotisation de l’employeur au RPAC', t1Line: 'Non-taxable benefit', descriptionEn: 'Employer contribution not included in income', descriptionFr: 'Contribution de l’employeur exclue du revenu' },
    ],
    sampleDocument: {
      id: 'sample-prpp-manulife',
      fileName: 'Manulife_PRPP_Contribution_Receipt_2025.png',
      fileSize: '950 KB',
      previewUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=600&q=80',
      extractedResult: {
        detectedSlipType: 'PRPP',
        issuerName: 'Manulife Financial PRPP Services',
        taxYear: 2025,
        confidenceScore: 0.98,
        extractedBoxes: {
          contributionAmount: 3200,
        },
        boundingBoxes: [
          { label: 'PRPP Administrator', box_2d: [100, 80, 170, 480], value: 'Manulife Financial', confidence: 0.99 },
          { label: 'PRPP Contribution Amount', box_2d: [320, 500, 400, 880], value: '$3,200.00 CAD', confidence: 0.98 },
        ],
        rawSummary: 'AI recognized CRA PRPP Contribution Receipt. Member contribution $3,200.00 eligible for Line 20810 deduction.',
        verificationRequired: true,
      },
    },
  },
];

export function getSlipDefinition(code: string): TaxSlipDefinition | undefined {
  return ALL_19_TAX_SLIPS.find((s) => s.code.toLowerCase() === code.toLowerCase());
}

export const getSlipMetadataByCode = getSlipDefinition;

export function getCategoryForSlip(code: string): SlipCategory {
  const slip = getSlipDefinition(code);
  return slip?.category || 't4_slips';
}

/**
 * Heuristic auto-categorization based on filename or text snippet.
 * Resolves to the most matching CRA tax slip and its category.
 */
export function autoDetectSlipFromTextOrName(input: string): {
  detectedSlipType: SlipType;
  category: SlipCategory;
  confidence: number;
  slipTitle: string;
  reason: string;
} {
  const upper = input.toUpperCase();

  // Explicit code matches (ordered by specificity to prevent substrings like T4 matching T4A)
  const prioritizedSlips: SlipType[] = [
    'T4A(OAS)',
    'T4A(P)',
    'T4FHSA',
    'T4RIF',
    'T4RSP',
    'T4A',
    'T4E',
    'T5007',
    'T5008',
    'T5013',
    'T5018',
    'T1204',
    'T2202',
    'RC62',
    'RRSP',
    'PRPP',
    'T5',
    'T4',
    'T3',
  ];

  for (const code of prioritizedSlips) {
    // Check if the input contains the slip code as an isolated token or in filename
    const regex = new RegExp(`(^|[^A-Z0-9])${code.replace(/[()]/g, '\\$&')}([^A-Z0-9]|$)`, 'i');
    if (regex.test(upper) || upper.includes(code.toUpperCase())) {
      const def = getSlipDefinition(code)!;
      return {
        detectedSlipType: code,
        category: def.category,
        confidence: 0.96,
        slipTitle: def.titleEn,
        reason: `Matched CRA slip identifier '${code}' in document header or file name.`,
      };
    }
  }

  // Keywords matching
  if (upper.includes('INVESTMENT') || upper.includes('DIVIDEND') || upper.includes('INTEREST')) {
    const def = getSlipDefinition('T5')!;
    return {
      detectedSlipType: 'T5',
      category: 't5_slips',
      confidence: 0.92,
      slipTitle: def.titleEn,
      reason: "Detected investment income keywords ('Interest', 'Dividends') matching CRA Form T5.",
    };
  }

  if (upper.includes('TUITION') || upper.includes('COLLEGE') || upper.includes('UNIVERSITY') || upper.includes('ENROLMENT')) {
    const def = getSlipDefinition('T2202')!;
    return {
      detectedSlipType: 'T2202',
      category: 'more_slips',
      confidence: 0.94,
      slipTitle: def.titleEn,
      reason: "Detected educational institution keywords matching CRA Tuition & Enrolment Certificate T2202.",
    };
  }

  if (upper.includes('SECURITIES') || upper.includes('BROKER') || upper.includes('PROCEEDS') || upper.includes('DISPOSITION')) {
    const def = getSlipDefinition('T5008')!;
    return {
      detectedSlipType: 'T5008',
      category: 't5_slips',
      confidence: 0.93,
      slipTitle: def.titleEn,
      reason: "Detected securities trading and capital disposition terms matching CRA Slip T5008.",
    };
  }

  if (upper.includes('EMPLOYMENT') || upper.includes('REMUNERATION') || upper.includes('SALARY') || upper.includes('PAYROLL')) {
    const def = getSlipDefinition('T4')!;
    return {
      detectedSlipType: 'T4',
      category: 't4_slips',
      confidence: 0.95,
      slipTitle: def.titleEn,
      reason: "Detected employment remuneration keywords matching CRA Form T4 (Statement of Remuneration Paid).",
    };
  }

  // Default to T4 if generic
  const defaultSlip = getSlipDefinition('T4')!;
  return {
    detectedSlipType: 'T4',
    category: 't4_slips',
    confidence: 0.85,
    slipTitle: defaultSlip.titleEn,
    reason: 'Defaulted to standard CRA T4 Employment Income slip.',
  };
}

export function getSlipsByCategory(category: SlipCategory): TaxSlipDefinition[] {
  return ALL_19_TAX_SLIPS.filter((s) => s.category === category);
}

export function getSlipsByPersona(persona: SlipPersona): TaxSlipDefinition[] {
  return ALL_19_TAX_SLIPS.filter((s) => s.personas.includes(persona));
}
