/**
 * CRA Employment Industry Benchmarks & Cross-Reference Validation Engine
 * 
 * Based on Statistics Canada Labour Force Survey (LFS) and CRA T1/T4 matching parameters
 * for North American Industry Classification System (NAICS) employment wage variance checks.
 */

import { IndustryBenchmark, IndustryCrossReferenceResult } from '../types/tax';

export const CRA_INDUSTRY_BENCHMARKS: IndustryBenchmark[] = [
  {
    code: '541514',
    nameEn: 'Computer Systems Design & Software Services',
    nameFr: 'Conception de systèmes informatiques et logiciels',
    category: 'Technology & Information',
    typicalMinIncome: 45000,
    typicalMaxIncome: 165000,
    craMedianIncome: 88500,
    descriptionEn: 'Software developers, web architects, DevOps engineers, systems analysts, and cloud infrastructure specialists.',
    descriptionFr: 'Développeurs de logiciels, architectes web, ingénieurs DevOps, analystes de systèmes et spécialistes infonuagiques.',
  },
  {
    code: '621111',
    nameEn: 'Healthcare, Medical Clinics & Nursing',
    nameFr: 'Santé, cliniques médicales et soins infirmiers',
    category: 'Health Care & Social Assistance',
    typicalMinIncome: 42000,
    typicalMaxIncome: 210000,
    craMedianIncome: 92000,
    descriptionEn: 'Registered nurses, nurse practitioners, physician clinical staff, medical technologists, and allied healthcare staff.',
    descriptionFr: 'Infirmiers autorisés, praticiens, personnel clinique, technologistes médicaux et spécialistes de la santé.',
  },
  {
    code: '236110',
    nameEn: 'Residential Building Construction & Trades',
    nameFr: 'Construction de bâtiments résidentiels et métiers',
    category: 'Construction & Skilled Trades',
    typicalMinIncome: 35000,
    typicalMaxIncome: 120000,
    craMedianIncome: 64500,
    descriptionEn: 'Carpenters, residential builders, electricians, plumbers, framing specialists, and project coordinators.',
    descriptionFr: 'Charpentiers, constructeurs résidentiels, électriciens, plombiers et coordonnateurs de chantier.',
  },
  {
    code: '522110',
    nameEn: 'Commercial Banking & Financial Services',
    nameFr: 'Banques commerciales et services financiers',
    category: 'Finance & Insurance',
    typicalMinIncome: 44000,
    typicalMaxIncome: 180000,
    craMedianIncome: 84000,
    descriptionEn: 'Financial analysts, commercial lenders, compliance officers, branch managers, and portfolio underwriters.',
    descriptionFr: 'Analystes financiers, prêteurs commerciaux, agents de conformité et souscripteurs de portefeuille.',
  },
  {
    code: '611110',
    nameEn: 'Elementary & Secondary Schools / Education',
    nameFr: 'Enseignement primaire et secondaire',
    category: 'Educational Services',
    typicalMinIncome: 38000,
    typicalMaxIncome: 108000,
    craMedianIncome: 69000,
    descriptionEn: 'Certified educators, academic specialists, instructors, secondary department heads, and school board personnel.',
    descriptionFr: 'Enseignants brevetés, spécialistes pédagogiques, instructeurs et personnel des commissions scolaires.',
  },
  {
    code: '722511',
    nameEn: 'Full-Service Restaurants & Hospitality',
    nameFr: 'Restauration et services d’hôtellerie',
    category: 'Accommodation & Food Services',
    typicalMinIncome: 18000,
    typicalMaxIncome: 65000,
    craMedianIncome: 32500,
    descriptionEn: 'Culinary staff, restaurant supervisors, front-of-house managers, and hospitality professionals.',
    descriptionFr: 'Personnel culinaire, superviseurs de salle, gérants de restaurant et professionnels de l’hôtellerie.',
  },
  {
    code: '445110',
    nameEn: 'Supermarkets, Grocery & Retail Trade',
    nameFr: 'Supermarchés, alimentation et commerce de détail',
    category: 'Retail Trade',
    typicalMinIncome: 21000,
    typicalMaxIncome: 68000,
    craMedianIncome: 36000,
    descriptionEn: 'Store department managers, retail team leaders, inventory coordinators, and merchandise specialists.',
    descriptionFr: 'Gérants de rayon, chefs d’équipe de vente, coordonnateurs d’inventaire et spécialistes de la marchandise.',
  },
  {
    code: '484110',
    nameEn: 'Freight Trucking & Supply Chain Logistics',
    nameFr: 'Transport routier de marchandises et logistique',
    category: 'Transportation & Warehousing',
    typicalMinIncome: 38000,
    typicalMaxIncome: 105000,
    craMedianIncome: 62000,
    descriptionEn: 'Commercial class 1 drivers, fleet dispatchers, logistics planners, and distribution warehouse managers.',
    descriptionFr: 'Chauffeurs commerciaux classe 1, répartiteurs de flotte, planificateurs logistiques et gestionnaires d’entrepôt.',
  },
  {
    code: '541330',
    nameEn: 'Engineering Services & Architecture',
    nameFr: 'Services de génie et architecture',
    category: 'Professional, Scientific & Technical',
    typicalMinIncome: 48000,
    typicalMaxIncome: 160000,
    craMedianIncome: 87000,
    descriptionEn: 'Civil, mechanical, electrical P.Eng engineers, architectural designers, and industrial project consultants.',
    descriptionFr: 'Ingénieurs civils, mécaniques, électriques, concepteurs architecturaux et consultants industriels.',
  },
  {
    code: '541110',
    nameEn: 'Legal Services & Law Practice',
    nameFr: 'Services juridiques et cabinets d’avocats',
    category: 'Professional, Scientific & Technical',
    typicalMinIncome: 46000,
    typicalMaxIncome: 215000,
    craMedianIncome: 96000,
    descriptionEn: 'Barristers, solicitors, licensed paralegals, corporate contract specialists, and legal directors.',
    descriptionFr: 'Avocats, parajuristes agréés, spécialistes des contrats d’entreprise et directeurs des affaires juridiques.',
  },
  {
    code: '211110',
    nameEn: 'Energy, Oil & Gas Extraction, and Mining',
    nameFr: 'Énergie, extraction pétrolière et secteur minier',
    category: 'Mining, Quarrying & Oil and Gas',
    typicalMinIncome: 55000,
    typicalMaxIncome: 195000,
    craMedianIncome: 108000,
    descriptionEn: 'Field instrumentation engineers, drilling supervisors, geoscientists, and pipeline operations technicians.',
    descriptionFr: 'Ingénieurs d’instrumentation, superviseurs de forage, géoscientifiques et techniciens de pipelines.',
  },
  {
    code: '911110',
    nameEn: 'Federal & Provincial Public Administration',
    nameFr: 'Fonction publique et administration gouvernementale',
    category: 'Public Administration',
    typicalMinIncome: 44000,
    typicalMaxIncome: 138000,
    craMedianIncome: 78000,
    descriptionEn: 'Public servants, administrative officers, policy analysts, tax examiners, and crown corporation specialists.',
    descriptionFr: 'Fonctionnaires, agents administratifs, analystes de politiques, vérificateurs et spécialistes de sociétés d’État.',
  },
];

export function getIndustryBenchmark(code?: string): IndustryBenchmark | undefined {
  if (!code) return undefined;
  return CRA_INDUSTRY_BENCHMARKS.find((b) => b.code === code);
}

/**
 * Cross-references total reported employment income from all T4 slips against
 * the CRA expected compliant range for the provided industry code.
 */
export function validateT4IncomeAgainstIndustry(
  totalT4Income: number,
  industryCode?: string,
  language: 'en' | 'fr' = 'en'
): IndustryCrossReferenceResult {
  const isFrench = language === 'fr';

  if (!industryCode) {
    return {
      status: 'unspecified_code',
      benchmark: null,
      reportedIncome: totalT4Income,
      minExpected: 0,
      maxExpected: 0,
      medianExpected: 0,
      differenceFromMedian: 0,
      percentageVariance: 0,
      title: isFrench
        ? 'Code d’industrie d’emploi non spécifié'
        : 'Employment Industry Code Unspecified',
      message: isFrench
        ? 'Sélectionnez votre secteur d’activité (code SCIAN/ARC) pour exécuter la validation croisée des revenus T4.'
        : 'Select your employment sector (CRA NAICS code) to run the cross-reference validation against CRA salary benchmarks.',
      craGuidance: isFrench
        ? 'L’ARC utilise les codes SCIAN pour vérifier la cohérence des revenus déclarés par rapport aux moyennes sectorielles.'
        : 'The CRA uses NAICS industry codes to benchmark salary reasonability and detect abnormal reporting variances.',
      craAuditRiskScore: 'low',
    };
  }

  const benchmark = getIndustryBenchmark(industryCode);

  if (!benchmark) {
    return {
      status: 'unspecified_code',
      benchmark: null,
      reportedIncome: totalT4Income,
      minExpected: 0,
      maxExpected: 0,
      medianExpected: 0,
      differenceFromMedian: 0,
      percentageVariance: 0,
      title: isFrench ? 'Code d’industrie personnalisé' : 'Custom Industry Code',
      message: isFrench
        ? `Le code d’industrie ${industryCode} est enregistré. Les comparaisons statistiques sont basées sur le profil général.`
        : `Industry code ${industryCode} is recorded. Cross-reference comparisons are based on general CRA T1 thresholds.`,
      craGuidance: isFrench
        ? 'Vérifiez que le code d’industrie correspond à l’activité principale de votre employeur.'
        : 'Ensure the industry code matches the primary business activity of your employer.',
      craAuditRiskScore: 'low',
    };
  }

  const differenceFromMedian = totalT4Income - benchmark.craMedianIncome;
  const percentageVariance = Math.round((differenceFromMedian / benchmark.craMedianIncome) * 100);

  // 1. Within typical range
  if (totalT4Income >= benchmark.typicalMinIncome && totalT4Income <= benchmark.typicalMaxIncome) {
    return {
      status: 'compliant',
      benchmark,
      reportedIncome: totalT4Income,
      minExpected: benchmark.typicalMinIncome,
      maxExpected: benchmark.typicalMaxIncome,
      medianExpected: benchmark.craMedianIncome,
      differenceFromMedian,
      percentageVariance,
      title: isFrench
        ? 'Revenu T4 conforme aux références sectorielles de l’ARC'
        : 'T4 Income Matches CRA Industry Compliant Range',
      message: isFrench
        ? `Votre revenu total T4 de ${totalT4Income.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })} se situe dans la plage normale attendue pour ${benchmark.nameFr} (${benchmark.typicalMinIncome.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })} - ${benchmark.typicalMaxIncome.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}).`
        : `Your total reported T4 employment income of ${totalT4Income.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })} falls comfortably within the expected CRA compliant benchmark range for ${benchmark.nameEn} (${benchmark.typicalMinIncome.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })} - ${benchmark.typicalMaxIncome.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })}).`,
      craGuidance: isFrench
        ? 'Faible probabilité d’examen supplémentaire de l’ARC pour anomalie de salaire sectoriel.'
        : 'Low likelihood of secondary CRA pre-assessment desk review for industry wage discrepancies.',
      craAuditRiskScore: 'low',
    };
  }

  // 2. Below expected range (e.g. part-time, partial year, student, or missing slip)
  if (totalT4Income < benchmark.typicalMinIncome) {
    return {
      status: 'underreported_risk',
      benchmark,
      reportedIncome: totalT4Income,
      minExpected: benchmark.typicalMinIncome,
      maxExpected: benchmark.typicalMaxIncome,
      medianExpected: benchmark.craMedianIncome,
      differenceFromMedian,
      percentageVariance,
      title: isFrench
        ? 'Avertissement de revenu inférieur à la norme sectorielle'
        : 'Reported Income Below Expected Industry Threshold',
      message: isFrench
        ? `Le revenu T4 total de ${totalT4Income.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })} est inférieur au seuil type à temps plein (${benchmark.typicalMinIncome.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}) pour ${benchmark.nameFr}. Si vous avez travaillé à temps partiel ou pour une partie de l'année, cela est justifié.`
        : `Total reported T4 income of ${totalT4Income.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })} is below the typical full-time threshold (${benchmark.typicalMinIncome.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })}) for ${benchmark.nameEn}. If you worked part-time, took parental leave, or started mid-year, this variance is justified.`,
      craGuidance: isFrench
        ? 'Conseil ARC: Assurez-vous d’avoir inclus tous vos feuillets T4 si vous avez eu plusieurs employeurs au cours de l’année.'
        : 'CRA Tip: Verify that all T4 slips have been scanned and attached if you held multiple employments during the tax year.',
      craAuditRiskScore: 'medium',
    };
  }

  // 3. Above typical max (high earner or executive)
  return {
    status: 'high_earner_variance',
    benchmark,
    reportedIncome: totalT4Income,
    minExpected: benchmark.typicalMinIncome,
    maxExpected: benchmark.typicalMaxIncome,
    medianExpected: benchmark.craMedianIncome,
    differenceFromMedian,
    percentageVariance,
    title: isFrench
      ? 'Revenu supérieur à la médiane sectorielle (Cadre / Rémunération élevée)'
      : 'High-Earner Industry Benchmark Variance',
    message: isFrench
      ? `Le revenu T4 de ${totalT4Income.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })} dépasse la fourchette standard (${benchmark.typicalMaxIncome.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}). Les paliers d'imposition supérieurs et les surtaxes fédérales/provinciales sont automatiquement appliqués.`
      : `Reported T4 income of ${totalT4Income.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })} exceeds the standard benchmark range (${benchmark.typicalMaxIncome.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })}). Top federal & provincial tax brackets and surtaxes are computed accurately.`,
    craGuidance: isFrench
      ? 'Conseil ARC: Assurez-vous que les déductions pour régimes de pension (case 20) et facteurs d’équivalence (case 52) sont fidèlement retranscrites.'
      : 'CRA Tip: Confirm that RPP deductions (Box 20) and Pension Adjustments (Box 52) match your physical slip for RRSP room calculations.',
    craAuditRiskScore: 'low',
  };
}
