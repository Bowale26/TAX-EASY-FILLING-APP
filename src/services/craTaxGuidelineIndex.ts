export interface CRATaxGuideline {
  id: string;
  termEn: string;
  termFr: string;
  category: 't4_slips' | 'deductions' | 'credits' | 'other_slips' | 'cra_general';
  categoryLabelEn: string;
  categoryLabelFr: string;
  craLine: string;
  slipType?: string;
  summaryEn: string;
  summaryFr: string;
  contentEn: string;
  contentFr: string;
  keyRulesEn: string[];
  keyRulesFr: string[];
  tags: string[];
  officialUrl: string;
}

export const CRA_TAX_GUIDELINES_DATABASE: CRATaxGuideline[] = [
  {
    id: 't4-box-14',
    termEn: 'T4 Box 14 — Employment Income',
    termFr: 'Feuillet T4 Case 14 — Revenus d’emploi',
    category: 't4_slips',
    categoryLabelEn: 'T4 Slip Boxes',
    categoryLabelFr: 'Cases du feuillet T4',
    craLine: 'CRA Line 10100',
    slipType: 'T4',
    summaryEn: 'Total gross employment income earned before payroll deductions and taxes.',
    summaryFr: 'Revenu brut total d’emploi gagné avant les retenues à la source et impôts.',
    contentEn:
      'Box 14 reports your gross salary, wages, tips, bonuses, commissions, honorariums, and taxable employer-paid benefits (such as group health or life insurance) before income taxes, CPP, and EI were deducted. This total flows directly onto Line 10100 of your T1 return.',
    contentFr:
      'La case 14 indique votre salaire brut, pourboires, primes, commissions et avantages imposables payés par l’employeur avant les retenues d’impôt, de RPC et d’AE. Ce montant est reporté directement à la ligne 10100 de votre déclaration T1.',
    keyRulesEn: [
      'Reported on Line 10100 of the Canadian Federal T1 Return',
      'Includes taxable allowances and taxable employer health benefits (Box 40)',
      'If you have multiple employers, combine Box 14 amounts across all T4 slips',
    ],
    keyRulesFr: [
      'Reporté à la ligne 10100 de la déclaration T1 fédérale',
      'Comprend les allocations et avantages imposables (case 40)',
      'Si vous avez plusieurs employeurs, additionnez les montants de la case 14',
    ],
    tags: ['box 14', 't4', 'employment', 'salary', 'wages', 'income', '10100'],
    officialUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/tax-slips/a-t4-slip/t4-statement-remuneration-paid.html',
  },
  {
    id: 't4-box-16',
    termEn: 'T4 Box 16 — Employee’s CPP Contributions',
    termFr: 'Feuillet T4 Case 16 — Cotisations de l’employé au RPC',
    category: 't4_slips',
    categoryLabelEn: 'T4 Slip Boxes',
    categoryLabelFr: 'Cases du feuillet T4',
    craLine: 'Line 30800 & Line 22215',
    slipType: 'T4',
    summaryEn: 'Mandatory Canada Pension Plan contributions deducted by your employer.',
    summaryFr: 'Cotisations obligatoires au Régime de pensions du Canada retenues par l’employeur.',
    contentEn:
      'Box 16 shows base CPP contributions deducted from your pay. For 2025, base CPP is deducted at 5.95% on pensionable earnings up to the Year’s Maximum Pensionable Earnings (YMPE). Base contributions give you a 15% non-refundable tax credit on Line 30800, while the enhanced portion is deducted on Line 22215.',
    contentFr:
      'La case 16 indique les cotisations de base au RPC retenues sur votre paie. Pour 2025, le taux de base est de 5,95 % sur les gains ouvrant droit à pension. Les cotisations de base donnent droit à un crédit non remboursable de 15 % à la ligne 30800, et la bonification est déduite à la ligne 22215.',
    keyRulesEn: [
      'Statutory employee contribution rate is 5.95% on pensionable earnings',
      'Base contribution maximum is $3,867.50 in 2025',
      'Overpayments resulting from multiple employers are refunded on Line 44800',
    ],
    keyRulesFr: [
      'Taux de cotisation salariale fixé à 5,95 % des gains admissibles',
      'Plafond de cotisation de base fixé à 3 867,50 $ pour 2025',
      'Les cotisations excédentaires dues à des employeurs multiples sont remboursées à la ligne 44800',
    ],
    tags: ['box 16', 'cpp', 'pension', 'ympe', '30800', '22215'],
    officialUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-30800-base-cpp-qpp-contributions.html',
  },
  {
    id: 't4-box-18',
    termEn: 'T4 Box 18 — Employee’s EI Premiums',
    termFr: 'Feuillet T4 Case 18 — Cotisations de l’employé à l’AE',
    category: 't4_slips',
    categoryLabelEn: 'T4 Slip Boxes',
    categoryLabelFr: 'Cases du feuillet T4',
    craLine: 'CRA Line 31200',
    slipType: 'T4',
    summaryEn: 'Employment Insurance premiums withheld on insurable earnings.',
    summaryFr: 'Cotisations à l’assurance-emploi retenues sur vos gains assurables.',
    contentEn:
      'Box 18 indicates the total Employment Insurance (EI) premiums deducted during the calendar year. The federal EI premium rate is 1.64% on insurable earnings up to the annual ceiling ($65,700). Box 18 provides a federal non-refundable tax credit on Schedule 1 (Line 31200).',
    contentFr:
      'La case 18 indique les cotisations totales à l’assurance-emploi (AE) retenues pendant l’année civile. Le taux fédéral est de 1,64 % jusqu’au maximum annuel des gains assurables (65 700 $). Ce montant donne droit à un crédit d’impôt non remboursable à la ligne 31200.',
    keyRulesEn: [
      'Standard federal EI premium rate: 1.64%',
      'Annual maximum employee premium: $1,077.44 in 2025',
      'Any overpayment above the annual cap is credited on Line 45000',
    ],
    keyRulesFr: [
      'Taux de cotisation fédéral standard à l’AE : 1,64 %',
      'Plafond maximal de cotisation annuelle de l’employé : 1 077,44 $ en 2025',
      'Tout excédent au-delà du plafond est crédité à la ligne 45000',
    ],
    tags: ['box 18', 'ei', 'assurance-emploi', 'insurance', '31200', '45000'],
    officialUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-31200-employment-insurance-premiums.html',
  },
  {
    id: 't4-box-20',
    termEn: 'T4 Box 20 — RPP Contributions',
    termFr: 'Feuillet T4 Case 20 — Cotisations à un RPA',
    category: 't4_slips',
    categoryLabelEn: 'T4 Slip Boxes',
    categoryLabelFr: 'Cases du feuillet T4',
    craLine: 'CRA Line 20700',
    slipType: 'T4',
    summaryEn: 'Registered Pension Plan contributions deducted by your employer.',
    summaryFr: 'Cotisations à un régime de pension agréé retenues par votre employeur.',
    contentEn:
      'Box 20 contains mandatory employee contributions to an employer-sponsored Registered Pension Plan (RPP). This amount is deducted dollar-for-dollar from your total income on Line 20700, reducing both your net income and taxable income.',
    contentFr:
      'La case 20 comprend les cotisations de l’employé à un régime de pension agréé (RPA) parrainé par l’employeur. Ce montant est déduit intégralement de votre revenu total à la ligne 20700.',
    keyRulesEn: [
      'Deducted directly on Line 20700 of the federal return',
      'Lowers your net income for child benefits and federal benefit calculations',
      'Separate from personal RRSP contributions made to financial institutions',
    ],
    keyRulesFr: [
      'Déduit directement à la ligne 20700 de la déclaration fédérale',
      'Diminue le revenu net servant au calcul des prestations familiales',
      'Distinct des cotisations REER personnelles versées en banque',
    ],
    tags: ['box 20', 'rpp', 'pension', 'rpa', '20700', 'deductions'],
    officialUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-20700-registered-pension-plan-rpp-deduction.html',
  },
  {
    id: 't4-box-22',
    termEn: 'T4 Box 22 — Income Tax Deducted',
    termFr: 'Feuillet T4 Case 22 — Impôt sur le revenu retenu',
    category: 't4_slips',
    categoryLabelEn: 'T4 Slip Boxes',
    categoryLabelFr: 'Cases du feuillet T4',
    craLine: 'CRA Line 43700',
    slipType: 'T4',
    summaryEn: 'Total federal and provincial income tax withheld at source by your employer.',
    summaryFr: 'Impôt fédéral et provincial total retenu à la source par l’employeur.',
    contentEn:
      'Box 22 represents all income tax your employer withheld from your salary and sent directly to the CRA throughout the tax year. This total is claimed on Line 43700 as taxes already paid. If this amount exceeds your total calculated tax payable, the difference is your CRA refund.',
    contentFr:
      'La case 22 représente l’impôt sur le revenu retenu à la source par l’employeur et versé à l’ARC. Réclamé à la ligne 43700 comme acompte provisionnel. Si ce montant dépasse l’impôt exigible, vous recevez un remboursement.',
    keyRulesEn: [
      'Reported on Line 43700 as prepaid taxes',
      'Includes both Federal and Provincial portions (except Quebec TP-1 source tax)',
      'Primary factor determining whether you receive a refund or have a balance owing',
    ],
    keyRulesFr: [
      'Reporté à la ligne 43700 comme impôt payé par retenues',
      'Comprend les portions fédérale et provinciale (sauf Québec TP-1)',
      'Élément clé qui détermine si vous avez un remboursement ou un solde dû',
    ],
    tags: ['box 22', 'tax withheld', 'source deductions', '43700', 'refund'],
    officialUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-43700-total-income-tax-deducted.html',
  },
  {
    id: 't4-box-44',
    termEn: 'T4 Box 44 — Union or Professional Dues',
    termFr: 'Feuillet T4 Case 44 — Cotisations syndicales ou professionnelles',
    category: 't4_slips',
    categoryLabelEn: 'T4 Slip Boxes',
    categoryLabelFr: 'Cases du feuillet T4',
    craLine: 'CRA Line 21200',
    slipType: 'T4',
    summaryEn: 'Annual dues paid to trade unions or mandatory professional licensing bodies.',
    summaryFr: 'Cotisations annuelles payées à des syndicats ou ordres professionnels obligatoires.',
    contentEn:
      'Box 44 displays the dues collected by your employer for collective bargaining or mandatory professional licensure (e.g. order of nurses, professional engineers, bar associations). This amount is deductible on Line 21200 from your net income.',
    contentFr:
      'La case 44 indique les cotisations prélevées par votre employeur pour un syndicat ou un ordre professionnel obligatoire (ex. infirmières, ingénieurs). Ce montant est déductible à la ligne 21200.',
    keyRulesEn: [
      'Claimed on Line 21200 of the federal return',
      'Must be mandatory for retaining professional employment status',
      'Excludes initiation fees, recreational dues, or special capital assessments',
    ],
    keyRulesFr: [
      'Réclamé à la ligne 21200 de la déclaration fédérale',
      'Doit être obligatoire pour conserver le titre ou l’emploi',
      'Exclut les frais d’adhésion initiaux et régimes spéciaux',
    ],
    tags: ['box 44', 'union dues', 'professional dues', '21200', 'syndicat'],
    officialUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-21200-annual-union-professional-like-dues.html',
  },
  {
    id: 't4-box-52',
    termEn: 'T4 Box 52 — Pension Adjustment (PA)',
    termFr: 'Feuillet T4 Case 52 — Facteur d’équivalence (FE)',
    category: 't4_slips',
    categoryLabelEn: 'T4 Slip Boxes',
    categoryLabelFr: 'Cases du feuillet T4',
    craLine: 'CRA Information Line',
    slipType: 'T4',
    summaryEn: 'Value of pension benefits earned; reduces next year’s RRSP contribution room.',
    summaryFr: 'Valeur des prestations de retraite; réduit vos droits de cotisation REER futurs.',
    contentEn:
      'Box 52 is not a deduction or an income item. Instead, it reflects the monetary value of retirement benefits you earned under your employer’s pension plan (RPP or DPSP). The CRA uses this amount to reduce your new RRSP contribution headroom for the subsequent tax year.',
    contentFr:
      'La case 52 n’est ni un revenu ni une déduction directe. Elle représente la valeur des droits à pension accumulés dans le régime de retraite de l’employeur. L’ARC utilise ce chiffre pour réduire vos droits de cotisation REER de l’année suivante.',
    keyRulesEn: [
      'Does not change your current year tax payable or refund amount',
      'Reported on your CRA Notice of Assessment to adjust next year’s RRSP room',
      'Calculated automatically by your employer’s payroll pension formula',
    ],
    keyRulesFr: [
      'Ne modifie pas votre impôt exigible ni votre remboursement de l’année courante',
      'Utilisé sur l’avis de cotisation pour ajuster le plafond REER de l’année suivante',
      'Calculé automatiquement par la formule de retraite de l’employeur',
    ],
    tags: ['box 52', 'pension adjustment', 'pa', 'fe', 'rrsp room'],
    officialUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/tax-slips/a-t4-slip.html',
  },
  {
    id: 'line-20800-rrsp',
    termEn: 'RRSP Deduction — Line 20800',
    termFr: 'Déduction REER — Ligne 20800',
    category: 'deductions',
    categoryLabelEn: 'Deductions',
    categoryLabelFr: 'Déductions',
    craLine: 'CRA Line 20800 & Schedule 7',
    summaryEn: 'Tax deduction for contributions made to personal or spousal RRSP/PRPP plans.',
    summaryFr: 'Déduction fiscale pour cotisations à un REER ou RPAC personnel ou de conjoint.',
    contentEn:
      'Contributions made to your Registered Retirement Savings Plan (RRSP) between March 2025 and March 2, 2026 can be claimed on Line 20800. This deduction directly reduces your net income. Any contributions exceeding your optimal deduction can be reported and carried forward indefinitely.',
    contentFr:
      'Les cotisations versées à votre REER entre mars 2025 et le 2 mars 2026 peuvent être réclamées à la ligne 20800. Cette déduction réduit directement votre revenu net. Toute portion excédentaire peut être reportée indéfiniment.',
    keyRulesEn: [
      'Maximum annual limit: 18% of earned income up to $32,490 plus unused room',
      'Includes contributions made in the first 60 days of the new calendar year',
      'Verify exact deduction limit on your prior year CRA Notice of Assessment',
    ],
    keyRulesFr: [
      'Plafond annuel : 18 % du revenu gagné jusqu’à 32 490 $ plus droits inutilisés',
      'Comprend les cotisations versées dans les 60 premiers jours de l’année civile suivante',
      'Vérifiez votre plafond exact sur votre dernier avis de cotisation de l’ARC',
    ],
    tags: ['rrsp', 'reer', 'line 20800', 'schedule 7', 'deduction', 'savings'],
    officialUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/contributing-a-rrsp-prpp.html',
  },
  {
    id: 'line-30000-bpa',
    termEn: 'Basic Personal Amount (BPA) — Line 30000',
    termFr: 'Montant personnel de base (MPB) — Ligne 30000',
    category: 'credits',
    categoryLabelEn: 'Non-Refundable Credits',
    categoryLabelFr: 'Crédits non remboursables',
    craLine: 'CRA Line 30000',
    summaryEn: 'Universal non-refundable tax credit protecting baseline income from federal tax.',
    summaryFr: 'Crédit non remboursable universel protégeant le revenu de base de l’impôt fédéral.',
    contentEn:
      'All Canadian residents are entitled to claim the Federal Basic Personal Amount. For 2025, the basic personal amount is $15,705. Multiplied by the 15% lowest federal tax bracket rate, it eliminates $2,355.75 of federal tax for every Canadian taxpayer with eligible earnings.',
    contentFr:
      'Tous les résidents canadiens ont droit au montant personnel de base fédéral. Pour 2025, il est fixé à 15 705 $. Multiplié par le taux fédéral de 15 %, il élimine 2 355,75 $ d’impôt fédéral pour tout contribuable.',
    keyRulesEn: [
      '2025 Federal statutory amount: $15,705 ($2,355.75 direct tax reduction)',
      'Phased down for high-income earners with net income exceeding $173,205',
      'Provinces provide an additional provincial basic personal credit on Line 42800',
    ],
    keyRulesFr: [
      'Montant fédéral 2025 : 15 705 $ (réduction d’impôt directe de 2 355,75 $)',
      'Réduit progressivement pour les revenus nets supérieurs à 173 205 $',
      'Les provinces accordent un crédit de base provincial supplémentaire à la ligne 42800',
    ],
    tags: ['basic personal amount', 'bpa', 'line 30000', 'credits', 'federal credit'],
    officialUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-30000-basic-personal-amount.html',
  },
  {
    id: 'line-31270-hbtc',
    termEn: 'First-Time Home Buyers’ Amount (HBTC)',
    termFr: 'Montant pour l’achat d’une habitation (HBTC)',
    category: 'credits',
    categoryLabelEn: 'Non-Refundable Credits',
    categoryLabelFr: 'Crédits non remboursables',
    craLine: 'CRA Line 31270',
    summaryEn: '$10,000 non-refundable credit providing $1,500 direct tax savings on first homes.',
    summaryFr: 'Crédit de 10 000 $ offrant 1 500 $ d’économie d’impôt direct sur une première maison.',
    contentEn:
      'You can claim up to $10,000 for the purchase of a qualifying home in Canada if neither you nor your spouse or common-law partner owned and occupied another home in the calendar year of purchase or any of the preceding 4 calendar years. Calculated at 15%, it yields a $1,500 federal credit.',
    contentFr:
      'Vous pouvez réclamer jusqu’à 10 000 $ pour l’achat d’une maison admissible au Canada si vous ou votre conjoint n’étiez pas propriétaire occupant dans les 4 années précédentes. Calculé à 15 %, il accorde une économie de 1 500 $.',
    keyRulesEn: [
      'Statutory claim: $10,000 (yielding $1,500 federal tax reduction)',
      'Can be split between co-purchasing spouses or partners',
      'Qualifying home must be registered in your or your partner’s name',
    ],
    keyRulesFr: [
      'Montant légal : 10 000 $ (réduction d’impôt fédéral de 1 500 $)',
      'Peut être partagé entre conjoints copropriétaires',
      'L’habitation doit être enregistrée au nom de l’un ou l’autre des conjoints',
    ],
    tags: ['home buyer', 'hbtc', 'line 31270', 'first home', 'mortgage', 'house'],
    officialUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-31270-home-buyers-amount.html',
  },
  {
    id: 'line-34900-donations',
    termEn: 'Charitable Donations & Gifts — Line 34900',
    termFr: 'Dons de bienfaisance et autres dons — Ligne 34900',
    category: 'credits',
    categoryLabelEn: 'Non-Refundable Credits',
    categoryLabelFr: 'Crédits non remboursables',
    craLine: 'CRA Line 34900 & Schedule 9',
    summaryEn: 'Tax credit for gifts to registered charities with 2-tier federal calculation.',
    summaryFr: 'Crédit d’impôt pour dons à des organismes de bienfaisance à taux progressif.',
    contentEn:
      'Eligible gifts to registered Canadian charities qualify for a two-tier federal credit: 15% on the first $200 of donations, and 29% (or 33% if high income) on donations above $200. You can pool receipts between spouses and carry forward unused receipts for up to 5 years.',
    contentFr:
      'Les dons admissibles à des organismes canadiens enregistrés donnent droit à un crédit fédéral à deux paliers : 15 % sur les premiers 200 $, et 29 % (ou 33 % si revenu élevé) sur l’excédent. Reportable jusqu’à 5 ans.',
    keyRulesEn: [
      '15% credit on first $200; 29% (or 33%) on amount exceeding $200',
      'Official Canadian registered charity tax receipt required',
      'Can be carried forward for up to 5 years',
    ],
    keyRulesFr: [
      '15 % sur les premiers 200 $; 29 % (ou 33 %) sur l’excédent',
      'Reçu fiscal officiel d’organisme de bienfaisance canadien requis',
      'Reportable sur une période allant jusqu’à 5 ans',
    ],
    tags: ['donations', 'charity', 'line 34900', 'schedule 9', 'dons'],
    officialUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-34900-donations-gifts.html',
  },
  {
    id: 't2202-tuition',
    termEn: 'T2202 Tuition and Education Certificate',
    termFr: 'Certificat pour frais de scolarité T2202',
    category: 'other_slips',
    categoryLabelEn: 'Other Tax Slips',
    categoryLabelFr: 'Autres feuillets fiscaux',
    craLine: 'CRA Line 32300 & Schedule 11',
    slipType: 'T2202',
    summaryEn: 'Tax slip issued by post-secondary schools for tuition and education credits.',
    summaryFr: 'Feuillet émis par les cégeps et universités pour frais de scolarité admissibles.',
    contentEn:
      'Issued by universities, colleges, and recognized institutions across Canada, the T2202 lists eligible tuition fees paid and number of months in full-time or part-time study. Generates a 15% federal non-refundable tax credit. Unused amounts can be carried forward indefinitely or transferred to a parent/spouse up to $5,000.',
    contentFr:
      'Délivré par les universités et collèges reconnus au Canada, le T2202 indique les frais de scolarité admissibles. Donne droit à un crédit de 15 %. La portion inutilisée peut être reportée indéfiniment ou transférée à un parent/conjoint jusqu’à 5 000 $.',
    keyRulesEn: [
      'Only eligible fees paid to designated educational institutions qualify',
      'Up to $5,000 can be transferred to a parent, grandparent, or spouse',
      'Unused amounts carry forward automatically via CRA Notice of Assessment',
    ],
    keyRulesFr: [
      'Seuls les frais payés à des établissements d’enseignement agréés sont admissibles',
      'Jusqu’à 5 000 $ transférables à un parent, grand-parent ou conjoint',
      'Les montants inutilisés sont reportés automatiquement par l’avis de cotisation',
    ],
    tags: ['t2202', 'tuition', 'student', 'education', 'university', 'college', '32300'],
    officialUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-32300-your-tuition-education-textbook-amounts.html',
  },
  {
    id: 't5-investment-slips',
    termEn: 'T5 Slip — Investment Income & Dividends',
    termFr: 'Feuillet T5 — Revenus de placements & dividendes',
    category: 'other_slips',
    categoryLabelEn: 'Other Tax Slips',
    categoryLabelFr: 'Autres feuillets fiscaux',
    craLine: 'CRA Lines 12000 & 12100',
    slipType: 'T5',
    summaryEn: 'Reports interest from Canadian bank accounts, GICs, and eligible dividends.',
    summaryFr: 'Indique les intérêts bancaires, CPG et dividendes déterminés de sociétés canadiennes.',
    contentEn:
      'The T5 slip reports investment earnings outside registered accounts (TFSA/RRSP). Box 13 reports bank interest and GIC earnings (Line 12100). Box 10, 11, and 12 report dividends from Canadian corporations, which receive special gross-up treatment and dividend tax credits on Schedule 1.',
    contentFr:
      'Le feuillet T5 indique les revenus de placements détenus hors des comptes enregistrés (CELI/REER). La case 13 indique les intérêts bancaires (Ligne 12100) et la case 10 les dividendes canadiens ouvrant droit au crédit pour dividendes.',
    keyRulesEn: [
      'Interest over $50 is automatically issued on a T5 by your financial institution',
      'Eligible dividends are grossed up by 38% and granted a federal dividend tax credit',
      'Investments inside TFSA or RRSP accounts are non-taxable and do NOT generate a T5',
    ],
    keyRulesFr: [
      'Les intérêts supérieurs à 50 $ génèrent automatiquement un T5 bancaire',
      'Les dividendes déterminés sont majorés de 38 % et donnent droit au crédit pour dividendes',
      'Les placements dans un CELI ou REER sont exempts d’impôt et ne génèrent pas de T5',
    ],
    tags: ['t5', 'interest', 'dividends', 'investments', 'bank', '12000', '12100'],
    officialUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/tax-slips/a-t5-slip.html',
  },
  {
    id: 'netfile-system',
    termEn: 'CRA NETFILE & Electronic Filing Rules',
    termFr: 'Système IMPÔTNET de l’ARC & Transmission en ligne',
    category: 'cra_general',
    categoryLabelEn: 'General CRA Rules',
    categoryLabelFr: 'Règles générales de l’ARC',
    craLine: 'NETFILE Confirmation Protocol',
    summaryEn: 'Secure digital transmission protocol between certified software and CRA servers.',
    summaryFr: 'Protocole de transmission numérique sécurisé entre logiciels certifiés et serveurs de l’ARC.',
    contentEn:
      'NETFILE is the Canada Revenue Agency’s secure electronic transmission service. When you file electronically, your return is validated instantly against CRA servers. You receive an immediate 6-character NETFILE confirmation number as legal proof of filing, and direct deposit refunds are issued in 8 business days.',
    contentFr:
      'IMPÔTNET est le service de transmission électronique sécurisé de l’ARC. Votre déclaration est validée instantanément. Vous recevez un numéro de confirmation à 6 caractères comme preuve légale de transmission, et les remboursements par dépôt direct sont émis en 8 jours ouvrables.',
    keyRulesEn: [
      'Produces an official 6-character CRA confirmation code upon successful receipt',
      'Eliminates the need to mail paper T4 slips or paper receipts to the tax center',
      'Available annually from late February until late January of the following year',
    ],
    keyRulesFr: [
      'Génère un code de confirmation officiel de l’ARC à 6 caractères',
      'Élimine la nécessité d’envoyer des feuillets T4 ou reçus papier par la poste',
      'Disponible de la fin février jusqu’à la fin janvier de l’année suivante',
    ],
    tags: ['netfile', 'impotnet', 'electronic filing', 'cra confirmation', 'submission'],
    officialUrl: 'https://www.canada.ca/en/revenue-agency/services/e-services/digital-services-individuals/netfile-overview.html',
  },
  {
    id: 'notice-of-assessment',
    termEn: 'Notice of Assessment (NOA)',
    termFr: 'Avis de cotisation (ADC)',
    category: 'cra_general',
    categoryLabelEn: 'General CRA Rules',
    categoryLabelFr: 'Règles générales de l’ARC',
    craLine: 'CRA Post-Assessment Document',
    summaryEn: 'Official statement sent by CRA showing final refund/owing and carry-over room.',
    summaryFr: 'Document officiel de l’ARC résumant votre cotisation finale et vos plafonds futurs.',
    contentEn:
      'The Notice of Assessment is an official document sent by the CRA after reviewing your tax return. It confirms whether the CRA agrees with your calculation, specifies your refund or balance owing, and lists crucial information for future tax years, including your RRSP deduction limit, FHSA limit, and unused tuition credits.',
    contentFr:
      'L’avis de cotisation est le document officiel envoyé par l’ARC après traitement de votre déclaration. Il confirme l’accord de l’ARC avec vos calculs, indique le remboursement ou solde dû, et précise vos plafonds REER et crédits reportables.',
    keyRulesEn: [
      'Contains your official RRSP deduction limit for the next tax year',
      'Displays unused tuition and education carry-forward amounts',
      'Should be retained with your tax records for a minimum of 6 years',
    ],
    keyRulesFr: [
      'Contient votre plafond officiel de déduction REER pour l’année suivante',
      'Indique les montants de frais de scolarité reportés inutilisés',
      'Doit être conservé dans vos dossiers fiscaux pour une durée minimale de 6 ans',
    ],
    tags: ['noa', 'notice of assessment', 'avis de cotisation', 'cra statement', 'limits'],
    officialUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/notice-assessment-understand.html',
  },
];

/**
 * Local simulated search index engine for CRA tax guidelines.
 * Simulates an index lookup with instant query ranking and tag matching.
 */
export async function searchCRATaxGuidelines(
  query: string,
  categoryFilter: string = 'all'
): Promise<CRATaxGuideline[]> {
  // Simulate lightweight async search latency
  await new Promise((resolve) => setTimeout(resolve, 60));

  const trimmed = query.trim().toLowerCase();

  return CRA_TAX_GUIDELINES_DATABASE.filter((item) => {
    // Category filtering
    if (categoryFilter !== 'all' && item.category !== categoryFilter) {
      return false;
    }

    // If query is empty, return all matching the category filter
    if (!trimmed) return true;

    // Matching logic
    const termEnMatch = item.termEn.toLowerCase().includes(trimmed);
    const termFrMatch = item.termFr.toLowerCase().includes(trimmed);
    const craLineMatch = item.craLine.toLowerCase().includes(trimmed);
    const summaryEnMatch = item.summaryEn.toLowerCase().includes(trimmed);
    const summaryFrMatch = item.summaryFr.toLowerCase().includes(trimmed);
    const contentEnMatch = item.contentEn.toLowerCase().includes(trimmed);
    const contentFrMatch = item.contentFr.toLowerCase().includes(trimmed);
    const tagMatch = item.tags.some((tag) => tag.toLowerCase().includes(trimmed));

    return (
      termEnMatch ||
      termFrMatch ||
      craLineMatch ||
      summaryEnMatch ||
      summaryFrMatch ||
      contentEnMatch ||
      contentFrMatch ||
      tagMatch
    );
  });
}
