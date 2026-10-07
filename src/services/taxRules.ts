/**
 * Canadian Tax Rules, Province Metadata, Slips & Boxes Dictionary,
 * and Official CRA Resources.
 */

import { ProvinceCode, ProvinceInfo, SlipType } from '../types/tax';

export const PROVINCES_LIST: ProvinceInfo[] = [
  { code: 'AB', nameEn: 'Alberta', nameFr: 'Alberta', taxRateDescription: '10% – 15% progressive brackets' },
  { code: 'BC', nameEn: 'British Columbia', nameFr: 'Colombie-Britannique', taxRateDescription: '5.06% – 20.5% progressive brackets' },
  { code: 'MB', nameEn: 'Manitoba', nameFr: 'Manitoba', taxRateDescription: '10.8% – 17.4% progressive brackets' },
  { code: 'NB', nameEn: 'New Brunswick', nameFr: 'Nouveau-Brunswick', taxRateDescription: '9.4% – 19.5% progressive brackets' },
  { code: 'NL', nameEn: 'Newfoundland & Labrador', nameFr: 'Terre-Neuve-et-Labrador', taxRateDescription: '8.7% – 21.8% progressive brackets' },
  { code: 'NT', nameEn: 'Northwest Territories', nameFr: 'Territoires du Nord-Ouest', taxRateDescription: '5.9% – 14.05% progressive brackets' },
  { code: 'NS', nameEn: 'Nova Scotia', nameFr: 'Nouvelle-Écosse', taxRateDescription: '8.79% – 21% progressive brackets' },
  { code: 'NU', nameEn: 'Nunavut', nameFr: 'Nunavut', taxRateDescription: '4.0% – 11.5% progressive brackets' },
  { code: 'ON', nameEn: 'Ontario', nameFr: 'Ontario', taxRateDescription: '5.05% – 13.16% progressive brackets' },
  { code: 'PE', nameEn: 'Prince Edward Island', nameFr: 'Île-du-Prince-Édouard', taxRateDescription: '9.8% – 16.7% progressive brackets' },
  { code: 'QC', nameEn: 'Quebec', nameFr: 'Québec', taxRateDescription: '14% – 25.75% provincial brackets' },
  { code: 'SK', nameEn: 'Saskatchewan', nameFr: 'Saskatchewan', taxRateDescription: '10.5% – 14.5% progressive brackets' },
  { code: 'YT', nameEn: 'Yukon', nameFr: 'Yukon', taxRateDescription: '6.4% – 15.0% progressive brackets' },
];

export interface SlipDescription {
  type: SlipType;
  titleEn: string;
  titleFr: string;
  descriptionEn: string;
  descriptionFr: string;
  commonBoxes: {
    box: string;
    labelEn: string;
    labelFr: string;
    explanationEn: string;
    explanationFr: string;
    t1Line: string;
  }[];
}

export const SLIP_DESCRIPTIONS: Record<string, SlipDescription> = {
  T4: {
    type: 'T4',
    titleEn: 'Statement of Remuneration Paid (T4)',
    titleFr: 'État de la rémunération payée (T4)',
    descriptionEn: 'Issued by employers showing your employment income, tax deducted, and CPP/EI contributions.',
    descriptionFr: 'Émis par les employeurs indiquant les revenus d’emploi, l’impôt retenu et les cotisations RPC/AE.',
    commonBoxes: [
      {
        box: '14',
        labelEn: 'Employment Income',
        labelFr: 'Revenus d’emploi',
        explanationEn: 'Your gross earnings before taxes and deductions.',
        explanationFr: 'Votre salaire brut avant impôts et déductions.',
        t1Line: 'Line 10100',
      },
      {
        box: '16',
        labelEn: 'Employee CPP Contributions',
        labelFr: 'Cotisations de l’employé au RPC',
        explanationEn: 'Canada Pension Plan contributions deducted by your employer (max $3,867.50).',
        explanationFr: 'Cotisations au Régime de pensions du Canada retenues (max 3 867,50 $).',
        t1Line: 'Line 30800',
      },
      {
        box: '18',
        labelEn: 'Employee EI Premiums',
        labelFr: 'Cotisations de l’employé à l’AE',
        explanationEn: 'Employment Insurance premiums deducted (max $1,049.12).',
        explanationFr: 'Cotisations d’assurance-emploi retenues (max 1 049,12 $).',
        t1Line: 'Line 31200',
      },
      {
        box: '22',
        labelEn: 'Income Tax Deducted',
        labelFr: 'Impôt sur le revenu retenu',
        explanationEn: 'Total federal & provincial tax already paid to CRA throughout the year.',
        explanationFr: 'Total de l’impôt fédéral et provincial déjà versé à l’ARC.',
        t1Line: 'Line 43700',
      },
      {
        box: '44',
        labelEn: 'Union Dues',
        labelFr: 'Cotisations syndicales',
        explanationEn: 'Annual membership dues paid to trade unions or professional associations.',
        explanationFr: 'Cotisations annuelles payées aux syndicats ou associations professionnelles.',
        t1Line: 'Line 21200',
      },
      {
        box: '52',
        labelEn: 'Pension Adjustment',
        labelFr: 'Facteur d’équivalence',
        explanationEn: 'Value of pension benefits earned, reducing next year’s RRSP room.',
        explanationFr: 'Valeur des prestations de retraite accumulées, réduisant le plafond REER.',
        t1Line: 'Line 20600',
      },
    ],
  },
  T4A: {
    type: 'T4A',
    titleEn: 'Statement of Pension, Retirement, Annuity, and Other Income (T4A)',
    titleFr: 'État du revenu de pension, de retraite, de rente ou d’autres sources (T4A)',
    descriptionEn: 'Covers pensions, superannuation, annuities, scholarships, or self-employed commissions.',
    descriptionFr: 'Indique les pensions, rentes, bourses d’études ou commissions de travail indépendant.',
    commonBoxes: [
      {
        box: '016',
        labelEn: 'Pension or Superannuation',
        labelFr: 'Prestation de retraite ou pension',
        explanationEn: 'Regular retirement pension payments received.',
        explanationFr: 'Paiements périodiques de pension de retraite reçus.',
        t1Line: 'Line 11500',
      },
      {
        box: '048',
        labelEn: 'Fees for Services',
        labelFr: 'Honoraires pour services rendus',
        explanationEn: 'Gross professional fees or contractor income.',
        explanationFr: 'Honoraires professionnels bruts ou revenus de pigiste.',
        t1Line: 'Line 13500',
      },
      {
        box: '105',
        labelEn: 'Scholarships and Bursaries',
        labelFr: 'Bourses d’études',
        explanationEn: 'Financial assistance for post-secondary education (often tax-exempt for full-time students).',
        explanationFr: 'Aide financière aux études postsecondaires (souvent exonérée d’impôt).',
        t1Line: 'Line 13010',
      },
    ],
  },
  T5: {
    type: 'T5',
    titleEn: 'Statement of Investment Income (T5)',
    titleFr: 'État des revenus de placements (T5)',
    descriptionEn: 'Issued by banks or brokerages showing dividends, interest from GICs/savings, and royalties.',
    descriptionFr: 'Émis par les banques pour les dividendes, intérêts de CPG ou d’épargne.',
    commonBoxes: [
      {
        box: '13',
        labelEn: 'Interest from Canadian Sources',
        labelFr: 'Intérêts de source canadienne',
        explanationEn: 'Total taxable interest earned on bank accounts and bonds.',
        explanationFr: 'Intérêts imposables gagnés sur comptes bancaires et obligations.',
        t1Line: 'Line 12100',
      },
      {
        box: '24',
        labelEn: 'Eligible Dividends',
        labelFr: 'Dividendes déterminés',
        explanationEn: 'Actual amount of eligible Canadian corporate dividends received.',
        explanationFr: 'Montant réel des dividendes canadiens déterminés.',
        t1Line: 'Line 12000',
      },
    ],
  },
  T2202: {
    type: 'T2202',
    titleEn: 'Tuition and Enrolment Certificate (T2202)',
    titleFr: 'Certificat pour frais de scolarité et d’inscription (T2202)',
    descriptionEn: 'Issued by accredited universities and colleges for tuition fees and eligible months.',
    descriptionFr: 'Émis par les universités et collèges pour les frais de scolarité admissibles.',
    commonBoxes: [
      {
        box: 'A',
        labelEn: 'Eligible Tuition Fees',
        labelFr: 'Frais de scolarité admissibles',
        explanationEn: 'Amount paid for courses qualifying for non-refundable tax credit.',
        explanationFr: 'Montant payé pour les cours admissibles au crédit d’impôt.',
        t1Line: 'Line 32300',
      },
    ],
  },
};

export const OFFICIAL_CRA_LINKS = [
  {
    id: 'cra-autofill',
    titleEn: 'CRA Auto-Fill My Return (AFR)',
    titleFr: 'ARC — Préremplir ma déclaration (PRD)',
    url: 'https://www.canada.ca/en/revenue-agency/services/e-services/e-services-individuals/auto-fill-my-return.html',
    category: 'autofill',
    descriptionEn: 'Automatically download tax slips (T4, T5, RRSP, pensions) directly into your return from CRA.',
    descriptionFr: 'Téléchargez automatiquement vos feuillets fiscaux (T4, T5, REER) directement de l’ARC.',
  },
  {
    id: 'cra-efile-individuals',
    titleEn: 'CRA EFILE for Individuals & Tax Preparers',
    titleFr: 'ARC — TED pour les particuliers et préparateurs',
    url: 'https://www.canada.ca/en/revenue-agency/services/e-services/e-services-individuals/efile-individuals.html',
    category: 'efile',
    descriptionEn: 'Official CRA electronic filing service for accountants, bookkeepers, and registered tax professionals.',
    descriptionFr: 'Service de transmission électronique de l’ARC pour comptables et préparateurs d’impôt agréés.',
  },
  {
    id: 'cra-netfile',
    titleEn: 'CRA NETFILE Overview & Transmission',
    titleFr: 'ARC — Aperçu et transmission IMPÔTNET',
    url: 'https://www.canada.ca/en/revenue-agency/services/e-services/netfile-overview.html',
    category: 'filing',
    descriptionEn: 'Certified CRA service allowing eligible Canadian residents to transmit personal T1 returns online directly.',
    descriptionFr: 'Service officiel permettant aux résidents canadiens de télétransmettre leur déclaration T1 en ligne.',
  },
  {
    id: 'cra-my-account',
    titleEn: 'CRA My Account for Individuals',
    titleFr: 'Mon dossier de l’ARC pour les particuliers',
    url: 'https://www.canada.ca/en/revenue-agency/services/e-services/e-services-individuals/account-individuals.html',
    category: 'account',
    descriptionEn: 'View notices of assessment, check refund statuses, manage direct deposit, and access tax slips.',
    descriptionFr: 'Consultez vos avis de cotisation, l’état de vos remboursements et accédez à vos feuillets officiels.',
  },
  {
    id: 'cra-t1-guide',
    titleEn: 'CRA T1 General Income Tax and Benefit Guide',
    titleFr: 'ARC — Guide général d’impôt et de prestations T1',
    url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/5000-g/general-income-tax-benefit-guide.html',
    category: 'guide',
    descriptionEn: 'Authoritative CRA line-by-line guide for completing Federal and Provincial T1 tax calculations.',
    descriptionFr: 'Guide officiel ligne par ligne pour remplir votre déclaration de revenus fédérale et provinciale T1.',
  },
  {
    id: 'cra-business-slips',
    titleEn: 'CRA Business & Investment Slips (T3, T4, T4A, T5, T5008)',
    titleFr: 'ARC — Feuillets d’entreprises et placements (T3, T4, T4A, T5, T5008)',
    url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications.html',
    category: 'slips',
    descriptionEn: 'Official CRA forms and publications catalog for statement slips, business income, and tax returns.',
    descriptionFr: 'Répertoire officiel des formulaires et feuillets de revenus d’emploi, d’entreprise et de placement.',
  },
  {
    id: 'docusign-canada',
    titleEn: 'DocuSign Canada — CRA Form E-Signatures (T183, T1013)',
    titleFr: 'DocuSign Canada — Signature électronique conforme ARC',
    url: 'https://www.docusign.ca/',
    category: 'signature',
    descriptionEn: 'Accountant-grade electronic signature pipeline for CRA compliance forms (T183, T1013/AUT-01) with audit trails.',
    descriptionFr: 'Pipeline de signatures électroniques agréé pour formulaires T183 et T1013 avec piste d’audit complète.',
  },
];

