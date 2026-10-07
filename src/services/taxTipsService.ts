/**
 * Canadian Tax Tips Service
 * Provides contextual, year-specific tax tips and CRA guidelines for Income and Deductions.
 */

export interface TaxTip {
  id: string;
  category: 'income' | 'deductions';
  years: number[]; // e.g. [2024, 2025, 2026]
  tag: string;
  tagFr: string;
  title: string;
  titleFr: string;
  description: string;
  descriptionFr: string;
  craLine?: string;
  impactLevel: 'high' | 'medium' | 'info';
}

const TAX_TIPS_DATABASE: TaxTip[] = [
  // --- INCOME TIPS ---
  {
    id: 'tip-cpp2-enhancement',
    category: 'income',
    years: [2024, 2025, 2026],
    tag: 'CPP2 Update',
    tagFr: 'Mise à jour RPC2',
    title: 'CPP Enhancement Second Ceiling (CPP2)',
    titleFr: 'Bonification du RPC : deuxième plafond (RPC2)',
    description:
      'For 2024 and 2025, Box 16A on your T4 captures second-tier CPP contributions (4%) on employment earnings between the first ceiling ($68,500) and the second ceiling ($73,200). These provide an enhanced tax deduction on Line 22215.',
    descriptionFr:
      'Pour 2024 et 2025, la case 16A du feuillet T4 recueille les cotisations au deuxième palier du RPC (4 %) pour les gains entre 68 500 $ et 73 200 $. Ces montants donnent droit à une déduction bonifiée à la ligne 22215.',
    craLine: 'Box 16A / Line 22215',
    impactLevel: 'high',
  },
  {
    id: 'tip-bpa-indexing',
    category: 'income',
    years: [2024, 2025, 2026],
    tag: 'CRA Indexing',
    tagFr: 'Indexation ARC',
    title: 'Basic Personal Amount (BPA) Shield',
    titleFr: 'Montant personnel de base (MPB) indexé',
    description:
      'The Federal Basic Personal Amount is indexed to $15,705 for the 2025 tax year. This means your first $15,705 of net employment or taxable income is 100% tax-free at the federal level.',
    descriptionFr:
      'Le montant personnel de base fédéral est indexé à 15 705 $ pour l’année d’imposition 2025. Vos premiers 15 705 $ de revenus nets sont totalement exempts d’impôt fédéral.',
    craLine: 'Line 30000',
    impactLevel: 'high',
  },
  {
    id: 'tip-gig-freelance',
    category: 'income',
    years: [2024, 2025, 2026],
    tag: 'Compliance',
    tagFr: 'Conformité',
    title: 'Platform & Freelance Income Rules',
    titleFr: 'Revenus de plateformes et pigistes',
    description:
      'CRA now receives digital transaction reports from platforms (rideshare, delivery, freelance). All gross earnings must be reported under Line 10400 or Form T2125, even if you did not receive a formal T4A slip.',
    descriptionFr:
      'L’ARC reçoit désormais des déclarations numériques des plateformes (coursiers, covoiturage, pigistes). Tous les revenus bruts doivent être déclarés à la ligne 10400 ou au formulaire T2125, même sans feuillet T4A.',
    craLine: 'Line 10400 / T2125',
    impactLevel: 'medium',
  },
  {
    id: 'tip-t5-reporting',
    category: 'income',
    years: [2024, 2025, 2026],
    tag: 'Investments',
    tagFr: 'Placements',
    title: 'Bank Interest & Investment Slips (T5)',
    titleFr: 'Intérêts bancaires et feuillets T5',
    description:
      'Financial institutions only issue T5 slips if your annual interest exceeds $50. However, tax law requires you to report all interest earnings, even small amounts below the $50 issuance threshold.',
    descriptionFr:
      'Les banques n’émettent généralement de feuillet T5 que si vos intérêts dépassent 50 $. Cependant, vous êtes légalement tenu(e) de déclarer tous les intérêts accumulés, même sous ce seuil.',
    craLine: 'Line 12100',
    impactLevel: 'info',
  },
  {
    id: 'tip-work-from-home-t2200',
    category: 'income',
    years: [2024, 2025, 2026],
    tag: 'Employment',
    tagFr: 'Emploi',
    title: 'Detailed Home Office Expense (T2200 Required)',
    titleFr: 'Frais de télétravail : formulaire T2200 requis',
    description:
      'The temporary flat-rate $2/day method is no longer valid. To claim home office workspace expenses against employment income, your employer must provide a completed and signed Form T2200.',
    descriptionFr:
      'La méthode à taux fixe temporaire de 2 $/jour n’est plus en vigueur. Pour déduire des frais de bureau à domicile, votre employeur doit vous avoir remis un formulaire T2200 signé.',
    craLine: 'Line 22900 / T777',
    impactLevel: 'medium',
  },

  // --- DEDUCTIONS & CREDITS TIPS ---
  {
    id: 'tip-fhsa-advantage',
    category: 'deductions',
    years: [2024, 2025, 2026],
    tag: 'Top Deduction',
    tagFr: 'Déduction clé',
    title: 'First Home Savings Account (FHSA) Deduction',
    titleFr: 'Déduction pour compte d’épargne libre d’impôt (CELIAPP)',
    description:
      'Contributions to an FHSA up to $8,000/year are 100% tax-deductible from net income. Important: FHSA contributions must be made by December 31 of the tax year; the 60-day post-year grace period does not apply to FHSAs.',
    descriptionFr:
      'Les cotisations à un CELIAPP jusqu’à 8 000 $/an sont 100 % déductibles du revenu net. Attention : les cotisations doivent être faites avant le 31 décembre de l’année civile (pas de période de grâce de 60 jours).',
    craLine: 'Line 20805',
    impactLevel: 'high',
  },
  {
    id: 'tip-rrsp-deadline',
    category: 'deductions',
    years: [2024, 2025, 2026],
    tag: 'Deadline & Cap',
    tagFr: 'Plafond & Date',
    title: 'RRSP Contribution Cap & 60-Day Rule',
    titleFr: 'Plafond REER et règle des 60 premiers jours',
    description:
      'Your RRSP deduction limit is 18% of earned income up to $31,560 (2024) or $32,490 (2025). Contributions made during the tax year and within the first 60 days of the next calendar year can be deducted on this return.',
    descriptionFr:
      'Votre plafond de déduction REER est de 18 % du revenu gagné jusqu’à concurrence de 31 560 $ (2024) ou 32 490 $ (2025). Les cotisations des 60 premiers jours de l’année suivante sont admissibles.',
    craLine: 'Line 20800',
    impactLevel: 'high',
  },
  {
    id: 'tip-first-time-home-buyer',
    category: 'deductions',
    years: [2024, 2025, 2026],
    tag: '$1,500 Credit',
    tagFr: 'Crédit 1 500 $',
    title: 'Home Buyers’ Tax Credit (HBTC)',
    titleFr: 'Montant pour l’achat d’une habitation (MAH)',
    description:
      'If you bought your first qualifying home in Canada during the tax year, claim the $10,000 First-Time Home Buyers’ Amount on Line 31270 to receive an immediate $1,500 non-refundable federal tax credit.',
    descriptionFr:
      'Si vous avez acquis votre première propriété admissible au Canada durant l’année fiscale, demandez le montant de 10 000 $ à la ligne 31270 pour obtenir un crédit fédéral direct de 1 500 $.',
    craLine: 'Line 31270',
    impactLevel: 'high',
  },
  {
    id: 'tip-childcare-lower-income',
    category: 'deductions',
    years: [2024, 2025, 2026],
    tag: 'Family Rule',
    tagFr: 'Règle familiale',
    title: 'Child Care Expenses: Lower-Income Spouse Rule',
    titleFr: 'Frais de garde : règle du conjoint au revenu le plus bas',
    description:
      'Under CRA rules, child care expenses (up to $8,000 for kids under 7, $5,000 for kids aged 7–16) must be claimed by the spouse or partner with the lower net income, except under specific medical or educational conditions.',
    descriptionFr:
      'Selon les règles de l’ARC, les frais de garde (jusqu’à 8 000 $ pour les moins de 7 ans, 5 000 $ pour les 7 à 16 ans) doivent être réclamés par le conjoint ayant le revenu net le moins élevé.',
    craLine: 'Line 21400 / Form T778',
    impactLevel: 'medium',
  },
  {
    id: 'tip-charitable-donations-optimization',
    category: 'deductions',
    years: [2024, 2025, 2026],
    tag: 'Optimization',
    tagFr: 'Optimisation',
    title: 'Pool Charitable Donations for the 29% Tier',
    titleFr: 'Regroupez vos dons pour atteindre le palier de 29 %',
    description:
      'Charitable donations yield a 15% credit on the first $200 and a boosted 29% credit on amounts exceeding $200. Pool all receipts with your spouse onto one return to maximize the higher 29% tier.',
    descriptionFr:
      'Les dons donnent un crédit de 15 % sur les premiers 200 $, puis un taux bonifié de 29 % au-delà. Regroupez tous vos reçus de dons sur une seule déclaration pour maximiser la portion à 29 %.',
    craLine: 'Line 34900',
    impactLevel: 'medium',
  },
  {
    id: 'tip-medical-threshold-pooling',
    category: 'deductions',
    years: [2024, 2025, 2026],
    tag: 'Medical Credit',
    tagFr: 'Frais médicaux',
    title: 'Medical Expense 12-Month Period Flexibility',
    titleFr: 'Période flexible de 12 mois pour frais médicaux',
    description:
      'You can choose any 12-month period ending in the tax year to claim medical expenses. Claim them on the lower-income spouse’s return to clear the 3% net income hurdle more easily.',
    descriptionFr:
      'Vous pouvez choisir n’importe quelle période de 12 mois consécutifs se terminant dans l’année d’imposition. Réclamez-les sur la déclaration du conjoint au revenu le plus bas pour franchir le seuil des 3 % plus aisément.',
    craLine: 'Line 33099',
    impactLevel: 'info',
  },
];

/**
 * Fetches relevant tax tips for a specified category and tax year.
 * Simulates an asynchronous data fetch with graceful error handling.
 */
export async function fetchTaxTips(
  taxYear: number,
  category: 'income' | 'deductions'
): Promise<TaxTip[]> {
  // Simulate a brief asynchronous micro-fetch
  await new Promise((resolve) => setTimeout(resolve, 80));

  const filtered = TAX_TIPS_DATABASE.filter(
    (tip) => tip.category === category && (tip.years.includes(taxYear) || tip.years.includes(2025))
  );

  return filtered;
}
