import { CRATooltipContent } from '../components/CRAFieldTooltip';

export const INCOME_TOOLTIPS: Record<string, CRATooltipContent> = {
  box14_employmentIncome: {
    lineCode: 'Line 10100',
    formCode: 'T4 Box 14',
    titleEn: 'Employment Income (Gross Wages & Salary)',
    titleFr: 'Revenus d’emploi (Salaire brut)',
    explanationEn:
      'Total gross salary, wages, taxable bonuses, commissions, tips, and taxable benefits before any statutory deductions (income tax, CPP, EI). Transferred directly to Line 10100 of your T1 return.',
    explanationFr:
      'Total des salaires bruts, primes imposables, pourboires et avantages imposables avant retenues. Reporté directement à la ligne 10100 de votre déclaration T1.',
    commonErrorsEn:
      'Common error: Entering your net take-home deposit amount instead of the gross total, or omitting taxable bonuses or cash tips received.',
    commonErrorsFr:
      'Erreur courante : Inscrire le salaire net déposé au compte bancaire au lieu du salaire brut, ou omettre les primes ou pourboires perçus.',
    statutoryLimitEn:
      'Subject to full federal and provincial income taxes, but qualifies for the Canada Employment Amount credit (Line 31260, up to $1,433).',
    statutoryLimitFr:
      'Entièrement imposable, mais donne droit au montant canadien pour emploi (ligne 31260, jusqu’à 1 433 $).',
  },
  box22_incomeTaxDeducted: {
    lineCode: 'Line 43700',
    formCode: 'T4 Box 22',
    titleEn: 'Income Tax Deducted at Source',
    titleFr: 'Impôt sur le revenu retenu à la source',
    explanationEn:
      'Federal and provincial income tax already withheld by your employer from your paycheques throughout the tax year. Directly offsets your total tax payable on Line 43700.',
    explanationFr:
      'Impôt fédéral et provincial déjà retenu sur vos paies par votre employeur durant l’année. Réduit directement votre solde d’impôt à la ligne 43700.',
    commonErrorsEn:
      'Common error: Confusing Box 22 with CPP (Box 16) or EI (Box 18). Do not combine them. Box 22 must strictly match the tax withheld number on your slip.',
    commonErrorsFr:
      'Erreur courante : Confondre la case 22 avec le RPC (case 16) ou l’AE (case 18). Ne les additionnez pas, indiquez seulement l’impôt retenu.',
    statutoryLimitEn:
      'If total tax deducted exceeds your calculated tax payable, the difference is fully refunded to you on Line 48400.',
    statutoryLimitFr:
      'Si l’impôt retenu excède votre impôt calculé, la différence vous est intégralement remboursée à la ligne 48400.',
  },
  box16_cppContributions: {
    lineCode: 'Line 30800',
    formCode: 'T4 Box 16',
    titleEn: 'Employee CPP / QPP Contributions',
    titleFr: 'Cotisations de l’employé au RPC / RRQ',
    explanationEn:
      'Statutory Canada Pension Plan (or Québec Pension Plan) contributions withheld from your earnings. Generates a 15% federal non-refundable tax credit on Line 30800.',
    explanationFr:
      'Cotisations obligatoires au Régime de pensions du Canada (ou RRQ) retenues sur votre salaire. Donne droit à un crédit d’impôt de 15 % à la ligne 30800.',
    commonErrorsEn:
      'Common error: Overpayment when working multiple jobs. If total CPP exceeds statutory maximum ($3,867.50 base / $4,055.50 second ceiling), claim the overpayment refund on Line 44800.',
    commonErrorsFr:
      'Erreur courante : Trop-perçu en ayant eu plusieurs employeurs. Si le total dépasse le plafond légal (3 867,50 $ base), réclamez le remboursement à la ligne 44800.',
    statutoryLimitEn:
      '2025 Maximum base CPP contribution is $3,867.50 (5.95% on earnings up to $68,500 with $3,500 basic exemption).',
    statutoryLimitFr:
      'Le plafond de cotisation de base 2025 au RPC est de 3 867,50 $ (5,95 % sur les gains jusqu’à 68 500 $).',
  },
  box18_eiPremiums: {
    lineCode: 'Line 31200',
    formCode: 'T4 Box 18',
    titleEn: 'Employee Employment Insurance (EI) Premiums',
    titleFr: 'Cotisations de l’employé à l’assurance-emploi (AE)',
    explanationEn:
      'Employment Insurance premiums withheld by your employer. Qualifies for a 15% non-refundable tax credit on Line 31200 of Schedule 1.',
    explanationFr:
      'Primes d’assurance-emploi retenues par l’employeur. Donne droit à un crédit d’impôt non remboursable de 15 % à la ligne 31200.',
    commonErrorsEn:
      'Common error: Paying more than statutory annual maximum across two or more jobs. Overpayment must be claimed on Line 45000 for a direct refund.',
    commonErrorsFr:
      'Erreur courante : Avoir cotisé au-delà du plafond annuel en cumulant deux emplois. Réclamez l’excédent à la ligne 45000 pour remboursement.',
    statutoryLimitEn:
      '2025 Maximum annual employee EI premium is $1,049.12 (1.66% on insurable earnings up to $63,200).',
    statutoryLimitFr:
      'Plafond annuel maximal 2025 de cotisation AE : 1 049,12 $ (1,66 % sur le salaire assurable jusqu’à 63 200 $).',
  },
  box20_rppContributions: {
    lineCode: 'Line 20700',
    formCode: 'T4 Box 20',
    titleEn: 'Registered Pension Plan (RPP) Deduction',
    titleFr: 'Cotisations à un régime de pension agréé (RPA)',
    explanationEn:
      'Amounts contributed by you to an employer-sponsored registered pension plan. Deducted dollar-for-dollar from Total Income to calculate Net Income on Line 20700.',
    explanationFr:
      'Montants cotisés par vous à un régime de retraite agréé d’employeur. Déduit directement du revenu total pour établir le revenu net.',
    commonErrorsEn:
      'Common error: Confusing RPP (Box 20) with personal RRSP contributions (Line 20800). Do not re-enter Box 20 as an RRSP receipt; doing so causes double deduction and CRA reassessment.',
    commonErrorsFr:
      'Erreur courante : Confondre le RPA (case 20) avec vos cotisations REER personnelles (ligne 20800). Ne réinscrivez pas ce montant dans les REER.',
    statutoryLimitEn:
      'Deduction is limited to your actual payroll withholding as certified on the employer T4 slip.',
    statutoryLimitFr:
      'Déduction limitée aux retenues réelles attestées sur le feuillet T4 de l’employeur.',
  },
  box44_unionDues: {
    lineCode: 'Line 21200',
    formCode: 'T4 Box 44',
    titleEn: 'Union and Professional Dues',
    titleFr: 'Cotisations syndicales ou professionnelles',
    explanationEn:
      'Mandatory union dues paid through payroll deductions for collective bargaining or labour association representation, deducted directly on Line 21200.',
    explanationFr:
      'Cotisations syndicales obligatoires retenues sur le salaire pour négociation collective, déduites directement à la ligne 21200.',
    commonErrorsEn:
      'Common error: Double-counting dues by entering them here from Box 44 and again in the Deductions step. Only record each payment once.',
    commonErrorsFr:
      'Erreur courante : Double déduction en inscrivant le montant ici et de nouveau à l’étape des Déductions. Ne le déclarez qu’une seule fois.',
    statutoryLimitEn:
      'Must be strictly statutory union or licensing dues; voluntary social funds or insurance premiums are not deductible.',
    statutoryLimitFr:
      'Doit être strictement une cotisation légale; les fonds sociaux ou primes d’assurance sont exclus.',
  },
  box24_eiInsurableEarnings: {
    lineCode: 'EI Records',
    formCode: 'T4 Box 24',
    titleEn: 'EI Insurable Earnings',
    titleFr: 'Gains assurables d’assurance-emploi',
    explanationEn:
      'The portion of your employment income used to calculate EI premiums, capped at the annual maximum insurable earnings limit ($63,200 for 2025).',
    explanationFr:
      'Portion du salaire servant à calculer les cotisations AE, plafonnée au maximum des gains assurables (63 200 $ pour 2025).',
    commonErrorsEn:
      'Common error: Leaving this blank when Box 18 has a value. If Box 24 is blank on your slip, CRA assumes earnings equal Box 14 up to the ceiling.',
    commonErrorsFr:
      'Erreur courante : Laisser ce champ vide si la case 18 contient un montant. L’ARC présume alors que les gains égalent la case 14.',
    statutoryLimitEn: 'Statutory ceiling is $63,200 for 2025.',
    statutoryLimitFr: 'Le plafond légal est de 63 200 $ pour 2025.',
  },
  box26_cppPensionableEarnings: {
    lineCode: 'CPP Records',
    formCode: 'T4 Box 26',
    titleEn: 'CPP / QPP Pensionable Earnings',
    titleFr: 'Gains ouvrant droit à pension (RPC/RRQ)',
    explanationEn:
      'Earnings subject to CPP/QPP contributions, between the $3,500 basic exemption and the Year’s Maximum Pensionable Earnings (YMPE) of $68,500.',
    explanationFr:
      'Gains soumis au RPC entre l’exemption de base de 3 500 $ et le maximum des gains ouvrant droit à pension (MGAP) de 68 500 $.',
    commonErrorsEn:
      'Common error: Entering numbers exceeding the statutory YMPE ($68,500).',
    commonErrorsFr:
      'Erreur courante : Inscrire un montant qui dépasse le plafond MGAP de 68 500 $.',
    statutoryLimitEn: '2025 YMPE is $68,500.',
    statutoryLimitFr: 'Le MGAP 2025 est de 68 500 $.',
  },
  box52_pensionAdjustment: {
    lineCode: 'Line 20600',
    formCode: 'T4 Box 52',
    titleEn: 'Pension Adjustment (PA)',
    titleFr: 'Facteur d’équivalence (FE)',
    explanationEn:
      'Represents the value of pension benefits accrued under your employer’s RPP or DPSP. It does NOT reduce your current income, but reduces your RRSP contribution room for next year.',
    explanationFr:
      'Représente la valeur des droits à pension accumulés dans le régime d’employeur. Ne réduit PAS votre revenu actuel, mais diminue vos droits de cotisation REER de l’année suivante.',
    commonErrorsEn:
      'Common error: Treating Box 52 as a tax deduction or taxable income. Box 52 is strictly an informational figure reported on Line 20600.',
    commonErrorsFr:
      'Erreur courante : Déduire le montant de la case 52 de vos impôts. C’est un montant informatif servant uniquement au calcul des droits REER futurs.',
    statutoryLimitEn:
      'CRA automatically uses this figure on your Notice of Assessment to calculate subsequent year RRSP deduction limit.',
    statutoryLimitFr:
      'L’ARC utilise ce chiffre pour fixer vos plafonds REER sur l’avis de cotisation.',
  },

  // T4A Slip Boxes
  box016_pension: {
    lineCode: 'Line 11500',
    formCode: 'T4A Box 016',
    titleEn: 'Pension or Superannuation Income',
    titleFr: 'Prestations de retraite ou de pension',
    explanationEn:
      'Periodic pension payments received from an employer pension plan or superannuation fund. Eligible for the federal $2,000 Pension Income Amount (Line 31400) if age 65 or older.',
    explanationFr:
      'Prestations périodiques d’un régime de retraite d’employeur. Admissible au montant de 2 000 $ pour revenu de pension (ligne 31400) dès 65 ans.',
    commonErrorsEn:
      'Common error: Forgetting to split eligible pension income with your spouse on Form T1032, which can save thousands in higher tax brackets.',
    commonErrorsFr:
      'Erreur courante : Oublier de fractionner le revenu de pension avec votre conjoint (formulaire T1032) pour réduire l’impôt du couple.',
    statutoryLimitEn:
      'Up to 50% can be allocated to spouse via joint election on Form T1032.',
    statutoryLimitFr:
      'Jusqu’à 50 % transférable au conjoint par choix conjoint sur le T1032.',
  },
  box022_taxDeducted: {
    lineCode: 'Line 43700',
    formCode: 'T4A Box 022',
    titleEn: 'T4A Income Tax Deducted',
    titleFr: 'Impôt retenu sur feuillet T4A',
    explanationEn:
      'Income tax withheld at source from your pension, annuity, or lump-sum payment. Offsets total tax payable on Line 43700.',
    explanationFr:
      'Impôt retenu à la source sur vos rentes ou pensions. Réduit directement l’impôt exigible.',
    commonErrorsEn:
      'Common error: Entering withholding tax as an expense instead of a tax credit prepayment.',
    commonErrorsFr:
      'Erreur courante : Saisir l’impôt retenu comme une dépense plutôt qu’un paiement d’impôt anticipé.',
    statutoryLimitEn: 'Full 100% credit applied on Line 43700.',
    statutoryLimitFr: 'Crédit à 100 % appliqué sur la ligne 43700.',
  },
  box020_commissions: {
    lineCode: 'Line 13900',
    formCode: 'T4A Box 020 / T2125',
    titleEn: 'Self-Employed Commissions',
    titleFr: 'Commissions de travail indépendant',
    explanationEn:
      'Commissions paid to independent sales contractors or agents without tax deducted. Reported as business gross income on Form T2125.',
    explanationFr:
      'Commissions versées aux travailleurs autonomes sans retenue d’impôt. Déclaré comme revenu d’entreprise brut sur le formulaire T2125.',
    commonErrorsEn:
      'Common error: Forgetting to deduct qualifying business expenses (automobile, cell phone, supplies) incurred to earn this commission on Form T2125.',
    commonErrorsFr:
      'Erreur courante : Oublier de déduire les dépenses engagées (kilométrage, téléphone, fournitures) sur le formulaire T2125.',
    statutoryLimitEn:
      'Subject to both employee and employer CPP contributions (11.9% total) via Schedule 8 if net income exceeds $3,500.',
    statutoryLimitFr:
      'Assujetti aux cotisations patronales et salariales du RPC (11,9 %) via l’annexe 8 si supérieur à 3 500 $.',
  },
  box028_otherIncome: {
    lineCode: 'Line 13000',
    formCode: 'T4A Box 028',
    titleEn: 'Other Income (T4A Miscellaneous)',
    titleFr: 'Autres revenus (Feuillet T4A)',
    explanationEn:
      'Miscellaneous taxable payments not reported elsewhere, such as research grants, death benefits, or financial assistance.',
    explanationFr:
      'Revenus imposables divers non inscrits ailleurs : subventions de recherche, prestations de décès ou aides financières.',
    commonErrorsEn:
      'Common error: Entering non-taxable lottery or inheritance awards here; only declare official T4A slip amounts.',
    commonErrorsFr:
      'Erreur courante : Déclarer des gains de loterie ou héritages non imposables; n’inscrivez que les montants du T4A.',
    statutoryLimitEn: 'Included in Line 13000 and Line 15000 Total Income.',
    statutoryLimitFr: 'Inclus dans le revenu total à la ligne 15000.',
  },
  box105_scholarships: {
    lineCode: 'Line 13010',
    formCode: 'T4A Box 105',
    titleEn: 'Scholarships, Fellowships, and Bursaries',
    titleFr: 'Bourses d’études ou de perfectionnement',
    explanationEn:
      'Financial awards for post-secondary students. Fully tax-exempt if enrolled in a qualifying full-time program.',
    explanationFr:
      'Bourses d’études postsecondaires. Entièrement exonérées d’impôt si vous êtes inscrit à un programme admissible à temps plein.',
    commonErrorsEn:
      'Common error: Paying tax on full-time qualifying scholarships. Under CRA rules, scholarships for full-time post-secondary students are 100% exempt from income tax.',
    commonErrorsFr:
      'Erreur courante : Payer de l’impôt sur une bourse d’études à temps plein. Selon l’ARC, ces bourses sont exemptes d’impôt à 100 %.',
    statutoryLimitEn:
      'Part-time students qualify for an exemption up to tuition fees paid plus $500.',
    statutoryLimitFr:
      'Les étudiants à temps partiel bénéficient d’une exemption équivalente aux frais de scolarité plus 500 $.',
  },

  // T5 Slip Boxes
  box13_interest: {
    lineCode: 'Line 12100',
    formCode: 'T5 Box 13',
    titleEn: 'Interest from Canadian Sources',
    titleFr: 'Intérêts de source canadienne',
    explanationEn:
      'Interest income earned from Canadian bank savings accounts, high-interest deposits, guaranteed investment certificates (GICs), and treasury bonds in non-registered accounts.',
    explanationFr:
      'Revenus d’intérêts sur comptes bancaires, certificats de placement garanti (CPG) et obligations dans des comptes non enregistrés.',
    commonErrorsEn:
      'Common error: Failing to declare interest under $50. Banks are not required to issue a T5 slip if interest is under $50, but CRA legally requires you to report all interest earned.',
    commonErrorsFr:
      'Erreur courante : Omettre les intérêts inférieurs à 50 $. Les banques n’émettent pas de T5 sous 50 $, mais l’ARC exige la déclaration de chaque dollar d’intérêt.',
    statutoryLimitEn:
      'Taxed at 100% of your marginal personal tax rate. TFSA interest is completely tax-free and must NOT be entered here.',
    statutoryLimitFr:
      'Imposé à 100 % à votre taux marginal. Les intérêts de CELI sont 100 % non imposables et ne doivent pas être inscrits ici.',
  },
  box10_eligibleDividends: {
    lineCode: 'Schedule 4',
    formCode: 'T5 Box 10',
    titleEn: 'Actual Amount of Eligible Dividends',
    titleFr: 'Montant réel des dividendes déterminés',
    explanationEn:
      'The actual cash dividend paid by Canadian public corporations out of income subjected to the standard corporate tax rate.',
    explanationFr:
      'Montant réel des dividendes reçus de sociétés canadiennes publiques assujetties au taux général d’imposition.',
    commonErrorsEn:
      'Common error: Confusing Box 10 (actual cash dividend) with Box 11 (grossed-up taxable dividend). Only Box 11 is added to Line 12000.',
    commonErrorsFr:
      'Erreur courante : Confondre la case 10 (montant réel) et la case 11 (montant majoré). Seule la case 11 est ajoutée au revenu imposable.',
    statutoryLimitEn: 'Box 11 is calculated as Box 10 multiplied by 138%.',
    statutoryLimitFr: 'La case 11 correspond à la case 10 multipliée par 138 %.',
  },
  box11_taxableDividends: {
    lineCode: 'Line 12000',
    formCode: 'T5 Box 11',
    titleEn: 'Taxable Amount of Eligible Dividends',
    titleFr: 'Montant imposable des dividendes déterminés',
    explanationEn:
      'Grossed-up amount (138% of actual dividend) added to taxable income. Generates the substantial federal Dividend Tax Credit (Line 40425) to eliminate corporate double taxation.',
    explanationFr:
      'Montant majoré (138 % du dividende réel) inclus au revenu. Donne droit au crédit d’impôt pour dividendes (ligne 40425) pour éviter la double imposition.',
    commonErrorsEn:
      'Common error: Forgetting to claim the federal Dividend Tax Credit (15.02% of taxable amount) on Line 40425, which significantly lowers net tax.',
    commonErrorsFr:
      'Erreur courante : Omettre le crédit d’impôt pour dividendes de 15,02 % sur la ligne 40425.',
    statutoryLimitEn:
      'Federal credit is 15.0198% of taxable dividend (Line 40425) plus provincial credit.',
    statutoryLimitFr:
      'Le crédit fédéral est de 15,0198 % du montant imposable plus le crédit provincial.',
  },
  box24_capitalGains: {
    lineCode: 'Line 17400',
    formCode: 'T5 Box 24',
    titleEn: 'Capital Gains Dividends',
    titleFr: 'Dividendes sur les gains en capital',
    explanationEn:
      'Capital gains distributed by Canadian mutual funds or investment trusts. Only 50% is taxable on Line 12700 of Schedule 3.',
    explanationFr:
      'Gains en capital distribués par des fonds communs ou fiducies de placement. Seulement 50 % est imposable à la ligne 12700.',
    commonErrorsEn:
      'Common error: Declaring 100% as income. CRA provides a 50% inclusion rate so only half of your capital gain is subject to tax.',
    commonErrorsFr:
      'Erreur courante : Inclure 100 % du montant dans le revenu. Le taux d’inclusion de l’ARC est de 50 % (seule la moitié est imposée).',
    statutoryLimitEn:
      'Subject to 50% inclusion rate under Income Tax Act section 38.',
    statutoryLimitFr:
      'Assujetti au taux d’inclusion de 50 % selon l’article 38 de la LIR.',
  },
  otherIncome: {
    lineCode: 'Line 13000',
    formCode: 'General T1',
    titleEn: 'Other Taxable Income / Gig Economy',
    titleFr: 'Autres revenus imposables / Économie à la demande',
    explanationEn:
      'Income from freelance projects, casual labour, tutoring, rental peer platforms, tips not on T4, or foreign income.',
    explanationFr:
      'Revenus de travail à la pige, tutorat, plateformes de partage, pourboires non déclarés sur T4 ou revenus étrangers.',
    commonErrorsEn:
      'Common error: Failing to keep invoices and expense receipts. Any direct costs incurred to earn self-employed income can be deducted.',
    commonErrorsFr:
      'Erreur courante : Omettre de conserver les reçus de dépenses engagées pour gagner ce revenu.',
    statutoryLimitEn: 'Taxable at ordinary marginal tax rates.',
    statutoryLimitFr: 'Imposé aux taux marginaux réguliers.',
  },
};

export const DEDUCTION_TOOLTIPS: Record<string, CRATooltipContent> = {
  rrspContributions: {
    lineCode: 'Line 20800',
    formCode: 'Schedule 7',
    titleEn: 'RRSP & PRPP Deduction',
    titleFr: 'Déduction REER et RPAC',
    explanationEn:
      'Deduct contributions made to your Registered Retirement Savings Plan (RRSP) or Pooled Registered Pension Plan (PRPP) between March 2025 and March 2, 2026. This deduction reduces your net income directly.',
    explanationFr:
      'Déduisez vos cotisations versées à votre Régime enregistré d’épargne-retraite (REER) ou Régime de pension agréé collectif (RPAC) entre mars 2025 et le 2 mars 2026. Réduit directement le revenu net.',
    commonErrorsEn:
      'Common error: Contributing more than your CRA deduction limit from your Notice of Assessment. Over-contributions exceeding $2,000 are subject to a 1% per month penalty tax on Form T1-OVP.',
    commonErrorsFr:
      'Erreur courante : Cotiser au-delà de votre plafond indiqué sur votre avis de cotisation. L’excédent de plus de 2 000 $ subit une pénalité de 1 % par mois (formulaire T1-OVP).',
    statutoryLimitEn:
      'Capped at 18% of prior year earned income up to $32,490 plus unused contribution room from your latest CRA Notice of Assessment.',
    statutoryLimitFr:
      'Plafonné à 18 % du revenu gagné antérieur jusqu’à 32 490 $ plus vos droits inutilisés indiqués sur votre avis de cotisation.',
  },
  childcareExpenses: {
    lineCode: 'Line 21400',
    formCode: 'Form T778',
    titleEn: 'Child Care Expenses Deduction',
    titleFr: 'Déduction pour frais de garde d’enfants',
    explanationEn:
      'Amounts paid to caregivers, daycare centres, nursery schools, and day camps that enabled you or your spouse to earn employment income, run a business, or attend designated school programs.',
    explanationFr:
      'Montants payés à des gardiennes, garderies, centres de la petite enfance ou camps de jour qui vous ont permis de travailler ou d’étudier.',
    commonErrorsEn:
      'Common error: Claiming the deduction on the higher-earning spouse’s return. CRA requires the spouse with the lower net income to claim child care expenses, unless specific exceptions apply (e.g. enrolled in school, hospitalized).',
    commonErrorsFr:
      'Erreur courante : Déduire les frais sur la déclaration du conjoint au revenu le plus élevé. L’ARC exige que ce soit le conjoint au revenu net le plus bas qui les réclame.',
    statutoryLimitEn:
      'Maximum deduction per child: $8,000 for under age 7; $5,000 for ages 7–16; $11,000 for children eligible for the Disability Tax Credit. Must generally be claimed by the lower-income spouse.',
    statutoryLimitFr:
      'Plafond par enfant : 8 000 $ pour les moins de 7 ans; 5 000 $ pour les 7 à 16 ans; 11 000 $ si admissible au CIP. Déduit par le conjoint ayant le revenu le plus bas.',
  },
  unionOrProfessionalDues: {
    lineCode: 'Line 21200',
    formCode: 'Box 44 / Receipts',
    titleEn: 'Annual Union, Professional, or Like Dues',
    titleFr: 'Cotisations syndicales ou professionnelles',
    explanationEn:
      'Mandatory annual dues paid to maintain professional legal status (e.g. order of nurses, professional engineers, bar associations) or collective bargaining dues paid to trade unions. Usually reported in Box 44 of your T4 slip.',
    explanationFr:
      'Cotisations obligatoires pour maintenir un statut professionnel légal (ingénieurs, infirmières, barreaux) ou cotisations syndicales. Habituellement indiquées à la case 44 de votre feuillet T4.',
    commonErrorsEn:
      'Common error: Double-counting dues by claiming them both from T4 Box 44 and as a separate deduction receipt. Also, optional club memberships and malpractice insurance that is optional are not deductible.',
    commonErrorsFr:
      'Erreur courante : Réclamer à la fois le montant de la case 44 du T4 et un reçu séparé pour la même adhésion. Les associations récréatives sont exclues.',
    statutoryLimitEn:
      'Must be strictly required for employment or professional certification. Initiation fees and special capital assessments are not deductible.',
    statutoryLimitFr:
      'Doit être obligatoire pour l’emploi ou le maintien du titre. Les frais d’adhésion initiaux et régimes spéciaux sont exclus.',
  },
  movingExpenses: {
    lineCode: 'Line 21900',
    formCode: 'Form T1-M',
    titleEn: 'Moving Expenses Deduction',
    titleFr: 'Déduction pour frais de déménagement',
    explanationEn:
      'Expenses incurred when moving at least 40 kilometres closer to a new place of work, employment, or full-time post-secondary education within Canada. Covers travel, packing, movers, temporary lodging, and lease cancellation.',
    explanationFr:
      'Frais engagés lorsque vous avez déménagé d’au moins 40 kilomètres plus près d’un nouvel emploi ou d’études postsecondaires à temps plein au Canada.',
    commonErrorsEn:
      'Common error: Claiming moving expenses when the move was less than 40 km shorter in travel distance, or claiming costs that were already reimbursed by your employer.',
    commonErrorsFr:
      'Erreur courante : Déduire des frais si la nouvelle résidence ne vous rapproche pas d’au moins 40 km, ou déduire des dépenses déjà remboursées par l’employeur.',
    statutoryLimitEn:
      'Deduction is limited to net employment or self-employment income earned at the new work location. Unused amounts can be carried forward.',
    statutoryLimitFr:
      'Limité aux revenus nets d’emploi ou de travail autonome gagnés au nouveau lieu de travail. Reportable aux années subséquentes.',
  },
  otherDeductions: {
    lineCode: 'Line 23200',
    formCode: 'General T1',
    titleEn: 'Other Allowable Deductions',
    titleFr: 'Autres déductions déductibles',
    explanationEn:
      'Miscellaneous allowable deductions under CRA guidelines, including legal fees to collect salary/support, repayment of EI or OAS benefits, and disability supports deduction (Form T929).',
    explanationFr:
      'Déductions autorisées diverses selon l’ARC, incluant les frais juridiques pour percevoir un salaire ou pension, remboursements de prestations et déduction pour soutien aux personnes handicapées.',
    commonErrorsEn:
      'Common error: Claiming personal legal fees (e.g. standard divorce or estate planning), which are strictly non-deductible under the Income Tax Act.',
    commonErrorsFr:
      'Erreur courante : Déduire des frais juridiques personnels (ex. divorce ou succession), qui ne sont pas admissibles selon la Loi de l’impôt.',
    statutoryLimitEn:
      'Receipts and supporting schedules must be retained for 6 years in case of CRA desk review.',
    statutoryLimitFr:
      'Conservez tous les reçus et annexes justificatives pendant 6 ans pour examen par l’ARC.',
  },
};

export const CREDIT_TOOLTIPS: Record<string, CRATooltipContent> = {
  firstTimeHomeBuyerClaim: {
    lineCode: 'Line 31270',
    formCode: 'Schedule 1',
    titleEn: 'First-Time Home Buyers’ Tax Credit (HBTC)',
    titleFr: 'Montant pour l’achat d’une habitation (HBTC)',
    explanationEn:
      'A federal non-refundable tax credit for individuals who acquired a qualifying home in Canada during the tax year and did not live in another home owned by them or their spouse in the prior 4 years.',
    explanationFr:
      'Crédit non remboursable fédéral pour l’achat d’une première habitation admissible au Canada durant l’année d’imposition sans avoir été propriétaire dans les 4 années précédentes.',
    commonErrorsEn:
      'Common error: Claiming the credit when you or your spouse lived in a home owned by either of you within the 4-year lookback period, or claiming more than the combined $10,000 maximum between spouses.',
    commonErrorsFr:
      'Erreur courante : Réclamer le crédit si vous ou votre conjoint avez été propriétaire d’une résidence principale au cours des 4 années précédentes, ou dépasser 10 000 $ au total pour le couple.',
    statutoryLimitEn:
      'Statutory claim amount is $10,000, which yields a direct federal tax reduction of $1,500 ($10,000 × 15%). Can be split between qualifying spouses.',
    statutoryLimitFr:
      'Montant légal fixé à 10 000 $, procurant une économie d’impôt direct de 1 500 $ (10 000 $ × 15 %). Peut être partagé entre conjoints.',
  },
  charitableDonations: {
    lineCode: 'Line 34900',
    formCode: 'Schedule 9',
    titleEn: 'Charitable Donations & Gifts Credit',
    titleFr: 'Dons de bienfaisance et autres dons',
    explanationEn:
      'Federal non-refundable credit for monetary gifts or property donated to registered Canadian charities, qualified donees, or the Government of Canada.',
    explanationFr:
      'Crédit non remboursable pour les dons en argent ou biens remis à des organismes de bienfaisance canadiens enregistrés ou donataires reconnus.',
    commonErrorsEn:
      'Common error: Claiming political contributions on Line 34900 (political contributions must go on Line 41000 for a separate credit), or claiming receipts without an official CRA charity registration number.',
    commonErrorsFr:
      'Erreur courante : Inscrire les dons à des partis politiques ici (ils vont à la ligne 41000), ou réclamer des reçus sans numéro d’enregistrement officiel d’organisme de bienfaisance de l’ARC.',
    statutoryLimitEn:
      'Federal rate is 15% on the first $200, and 29% on amounts exceeding $200 (or 33% if taxable income is in the top federal bracket). You can carry forward unclaimed donations for up to 5 years.',
    statutoryLimitFr:
      'Taux fédéral de 15 % sur les premiers 200 $, et 29 % sur l’excédent (33 % pour la tranche supérieure). Reportable sur 5 ans.',
  },
  eligibleMedicalExpenses: {
    lineCode: 'Line 33099',
    formCode: 'Receipts / Schedule 1',
    titleEn: 'Medical Expenses for Self, Spouse & Dependents',
    titleFr: 'Frais médicaux pour vous, conjoint et personnes à charge',
    explanationEn:
      'Eligible health costs paid out-of-pocket (not reimbursed by insurance) during any 12-month period ending in 2025. Includes prescription medications, dental treatments, eyeglasses, prosthetics, and prescribed medical equipment.',
    explanationFr:
      'Dépenses de santé payées de votre poche (non remboursées) sur une période de 12 mois se terminant en 2025. Inclut médicaments sur ordonnance, soins dentaires, lunettes et appareils médicaux prescrits.',
    commonErrorsEn:
      'Common error: Claiming expenses reimbursed by your workplace extended health plan, over-the-counter vitamins/supplements, gym memberships, or cosmetic procedures that have no medical purpose.',
    commonErrorsFr:
      'Erreur courante : Réclamer des dépenses déjà remboursées par votre assurance collective, des vitamines en vente libre, abonnements au gym ou interventions purement esthétiques.',
    statutoryLimitEn:
      'Only expenses exceeding 3% of your net income or the 2025 statutory threshold of $2,759 (whichever is less) provide a 15% tax credit. Usually best claimed by the lower-income spouse.',
    statutoryLimitFr:
      'Seule la portion dépassant 3 % de votre revenu net ou le seuil de 2 759 $ (le moindre des deux) donne droit au crédit de 15 %. Souvent plus avantageux pour le conjoint au revenu plus bas.',
  },
  tuitionFeesT2202: {
    lineCode: 'Line 32300',
    formCode: 'Slip T2202 / Schedule 11',
    titleEn: 'Tuition, Education, and Textbook Amounts',
    titleFr: 'Frais de scolarité, montant relatif aux études',
    explanationEn:
      'Eligible tuition fees paid to a certified Canadian university, college, or designated post-secondary institution, as documented on official tax slip T2202.',
    explanationFr:
      'Frais de scolarité admissibles payés à un collège, une université ou un établissement d’enseignement agréé au Canada, certifiés par le feuillet officiel T2202.',
    commonErrorsEn:
      'Common error: Estimating tuition from receipts or bank statements instead of using the exact amount on official Form T2202. Also, student union fees and residence fees are non-qualifying.',
    commonErrorsFr:
      'Erreur courante : Estimer les frais à partir des relevés bancaires plutôt que le feuillet officiel T2202. Les frais d’association étudiante et de résidence ne sont pas admissibles.',
    statutoryLimitEn:
      'Provides a 15% federal non-refundable tax credit. Any unused amount can be transferred to a supporting parent, grandparent, or spouse (up to $5,000/year) or carried forward indefinitely.',
    statutoryLimitFr:
      'Crédit de 15 %. La portion inutilisée peut être transférée à un parent, grand-parent ou conjoint (max. 5 000 $/an) ou reportée indéfiniment.',
  },
};
