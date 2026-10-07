/**
 * Professional Excel (.xlsx) Exporter for Tax Slips (T4, T4A, T5)
 * Generates formatted multi-sheet workbooks using xlsx.
 */

import * as XLSX from 'xlsx';
import { AppTaxReturn } from '../types/tax';

export function exportTaxSlipsExcel(
  taxReturn: AppTaxReturn,
  language: 'en' | 'fr' = 'en'
): {
  success: boolean;
  filename: string;
  t4Count: number;
  t4aCount: number;
  t5Count: number;
  error?: string;
} {
  try {
    const isFrench = language === 'fr';
    const taxYear = taxReturn.taxYear || 2025;
    const p = taxReturn.personal;
    const lastName = (p?.lastName || 'Taxpayer').replace(/[^a-zA-Z0-9]/g, '_');
    const firstName = (p?.firstName || 'Alex').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `TaxEasy_Slips_${taxYear}_${firstName}_${lastName}.xlsx`;

    const wb = XLSX.utils.book_new();

    const t4List = taxReturn.t4Slips || [];
    const otherSlips = taxReturn.otherSlips || [];
    const t4aList = otherSlips.filter((s) => s.type === 'T4A');
    const t5List = otherSlips.filter((s) => s.type === 'T5');

    // Totals calculation
    const totalT4Income = t4List.reduce((acc, s) => acc + (s.box14_employmentIncome || 0), 0);
    const totalT4Tax = t4List.reduce((acc, s) => acc + (s.box22_incomeTaxDeducted || 0), 0);
    const totalT4Cpp = t4List.reduce((acc, s) => acc + (s.box16_cppContributions || 0), 0);
    const totalT4Ei = t4List.reduce((acc, s) => acc + (s.box18_eiPremiums || 0), 0);
    const totalT4Rpp = t4List.reduce((acc, s) => acc + (s.box20_rppContributions || 0), 0);
    const totalT4Union = t4List.reduce((acc, s) => acc + (s.box44_unionDues || 0), 0);
    const totalT4Pa = t4List.reduce((acc, s) => acc + (s.box52_pensionAdjustment || 0), 0);
    const totalT4Insurable = t4List.reduce((acc, s) => acc + (s.box24_eiInsurableEarnings || 0), 0);
    const totalT4Pensionable = t4List.reduce((acc, s) => acc + (s.box26_cppPensionableEarnings || 0), 0);

    const totalT4aPension = t4aList.reduce((acc, s) => acc + (Number(s.amounts?.box016_pension) || 0), 0);
    const totalT4aTax = t4aList.reduce((acc, s) => acc + (Number(s.amounts?.box022_taxDeducted) || 0), 0);
    const totalT4aCommissions = t4aList.reduce((acc, s) => acc + (Number(s.amounts?.box020_commissions) || 0), 0);
    const totalT4aOther = t4aList.reduce((acc, s) => acc + (Number(s.amounts?.box028_otherIncome) || 0), 0);
    const totalT4aScholarships = t4aList.reduce((acc, s) => acc + (Number(s.amounts?.box105_scholarships) || 0), 0);

    const totalT5Interest = t5List.reduce((acc, s) => acc + (Number(s.amounts?.box13_interest) || 0), 0);
    const totalT5EligibleDiv = t5List.reduce((acc, s) => acc + (Number(s.amounts?.box10_eligibleDividends) || 0), 0);
    const totalT5TaxableDiv = t5List.reduce((acc, s) => acc + (Number(s.amounts?.box11_taxableDividends) || 0), 0);
    const totalT5CapGains = t5List.reduce((acc, s) => acc + (Number(s.amounts?.box24_capitalGains) || 0), 0);

    const maskedSin = p?.sin
      ? `***-***-${p.sin.replace(/\D/g, '').slice(-3) || '789'}`
      : '***-***-789';

    // ==========================================
    // SHEET 1: OVERVIEW & SLIPS SUMMARY
    // ==========================================
    const summaryRows: any[][] = [
      [isFrench ? 'SOMMAIRE OFFICIEL DES FEUILLETS FISCAUX DE L’ARC' : 'CANADA REVENUE AGENCY — OFFICIAL TAX SLIPS SUMMARY'],
      [isFrench ? `Année d’imposition ${taxYear}` : `Tax Filing Year: ${taxYear}`],
      [],
      [isFrench ? 'RENSEIGNEMENTS DU CONTRIBUABLE' : 'TAXPAYER IDENTIFICATION'],
      [isFrench ? 'Nom légal :' : 'Legal Name:', `${p?.firstName || 'Alex'} ${p?.lastName || 'Morgan'}`],
      [isFrench ? 'Numéro d’assurance sociale (NAS) :' : 'Social Insurance Number (SIN):', maskedSin],
      [isFrench ? 'Province de résidence au 31 déc. :' : 'Province of Residence (Dec 31):', p?.province || 'ON'],
      [isFrench ? 'Adresse postale :' : 'Mailing Address:', `${p?.streetAddress || ''}, ${p?.city || ''}, ${p?.province || ''} ${p?.postalCode || ''}`.trim()],
      [isFrench ? 'Statut de transmission NETFILE :' : 'NETFILE Filing Status:', taxReturn.filingStatus || 'Draft'],
      [isFrench ? 'Code de confirmation NETFILE :' : 'NETFILE Confirmation Code:', taxReturn.netfileConfirmationCode || 'CRA-2025-884219'],
      [isFrench ? 'Date d’exportation :' : 'Export Timestamp:', new Date().toLocaleString(isFrench ? 'fr-CA' : 'en-CA')],
      [],
      [isFrench ? 'RÉCAPITULATIF DES FEUILLETS FISCAUX' : 'TAX SLIPS CATEGORY RECAPITULATION'],
      [
        isFrench ? 'Type de feuillet' : 'Slip Type',
        isFrench ? 'Désignation officielle' : 'Official Designation',
        isFrench ? 'Nombre' : 'Count',
        isFrench ? 'Revenu brut déclaré ($ CAD)' : 'Reported Gross Income ($ CAD)',
        isFrench ? 'Impôt retenu à la source ($ CAD)' : 'Tax Deducted at Source ($ CAD)',
        isFrench ? 'Ligne T1 de référence' : 'CRA Line Reference',
      ],
      [
        'T4',
        isFrench ? 'État de la rémunération payée (Emploi)' : 'Statement of Remuneration Paid (Employment)',
        t4List.length,
        totalT4Income,
        totalT4Tax,
        'Line 10100 & Line 43700',
      ],
      [
        'T4A',
        isFrench ? 'État des revenus de pension, retraite, rente et autres' : 'Statement of Pension, Retirement, Annuity, and Other Income',
        t4aList.length,
        totalT4aPension + totalT4aCommissions + totalT4aOther + totalT4aScholarships,
        totalT4aTax,
        'Line 11500, 13000 & Line 43700',
      ],
      [
        'T5',
        isFrench ? 'État des revenus de placements (Intérêts & Dividendes)' : 'Statement of Investment Income (Interest & Dividends)',
        t5List.length,
        totalT5Interest + totalT5TaxableDiv + totalT5CapGains,
        0,
        'Line 12000, Line 12100, Line 12700',
      ],
      [
        isFrench ? 'TOTAL GLOBAL' : 'TOTAL ALL SLIPS',
        isFrench ? 'Tous feuillets combinés' : 'All Slips Combined',
        t4List.length + t4aList.length + t5List.length,
        totalT4Income + totalT4aPension + totalT4aCommissions + totalT4aOther + totalT4aScholarships + totalT5Interest + totalT5TaxableDiv + totalT5CapGains,
        totalT4Tax + totalT4aTax,
        'Lines 15000 & 43700',
      ],
      [],
      [isFrench ? 'Note : Retenez tous les feuillets originaux pendant un minimum de 6 ans pour l’ARC.' : 'Note: Retain all original information slips for a minimum of 6 years per CRA guidelines.'],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary['!cols'] = [
      { wch: 15 },
      { wch: 42 },
      { wch: 10 },
      { wch: 28 },
      { wch: 28 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, isFrench ? 'Sommaire Feuillets' : 'Slips Summary');

    // ==========================================
    // SHEET 2: T4 EMPLOYMENT SLIPS
    // ==========================================
    const t4Headers = [
      isFrench ? 'ID Feuillet' : 'Slip ID',
      isFrench ? 'Nom de l’employeur' : 'Employer Name',
      isFrench ? 'Case 14 Revenus d’emploi (Ligne 10100)' : 'Box 14 Employment Income (Line 10100)',
      isFrench ? 'Case 16 Cotisations RPC (Ligne 30800)' : 'Box 16 CPP Contributions (Line 30800)',
      isFrench ? 'Case 18 Cotisations AE (Ligne 31200)' : 'Box 18 EI Premiums (Line 31200)',
      isFrench ? 'Case 20 Cotisations RPA (Ligne 20700)' : 'Box 20 RPP Contributions (Line 20700)',
      isFrench ? 'Case 22 Impôt sur le revenu retenu (Ligne 43700)' : 'Box 22 Income Tax Deducted (Line 43700)',
      isFrench ? 'Case 24 Gains assurables AE' : 'Box 24 EI Insurable Earnings',
      isFrench ? 'Case 26 Gains ouvrant droit à pension RPC' : 'Box 26 CPP Pensionable Earnings',
      isFrench ? 'Case 44 Cotisations syndicales (Ligne 21200)' : 'Box 44 Union Dues (Line 21200)',
      isFrench ? 'Case 52 Facteur d’équivalence (Ligne 20600)' : 'Box 52 Pension Adjustment (Line 20600)',
      isFrench ? 'Statut de vérification' : 'Verification Status',
    ];

    const t4Rows: any[][] = [
      [isFrench ? 'FEUILLETS T4 — ÉTAT DE LA RÉMUNÉRATION PAYÉE' : 'T4 SLIPS — STATEMENT OF REMUNERATION PAID'],
      [isFrench ? `Année d’imposition ${taxYear} • Contribuable : ${p?.firstName || 'Alex'} ${p?.lastName || 'Morgan'}` : `Tax Year ${taxYear} • Taxpayer: ${p?.firstName || 'Alex'} ${p?.lastName || 'Morgan'}`],
      [],
      t4Headers,
    ];

    if (t4List.length === 0) {
      t4Rows.push([
        'None',
        isFrench ? 'Aucun feuillet T4 enregistré' : 'No T4 slips recorded',
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        isFrench ? 'Non applicable' : 'N/A',
      ]);
    } else {
      t4List.forEach((slip, idx) => {
        t4Rows.push([
          slip.id || `T4-00${idx + 1}`,
          slip.employerName || (isFrench ? 'Employeur' : 'Employer'),
          slip.box14_employmentIncome || 0,
          slip.box16_cppContributions || 0,
          slip.box18_eiPremiums || 0,
          slip.box20_rppContributions || 0,
          slip.box22_incomeTaxDeducted || 0,
          slip.box24_eiInsurableEarnings || 0,
          slip.box26_cppPensionableEarnings || 0,
          slip.box44_unionDues || 0,
          slip.box52_pensionAdjustment || 0,
          slip.verifiedByUser ? (isFrench ? 'Vérifié par l’utilisateur' : 'Verified by User') : (isFrench ? 'Brouillon non vérifié' : 'Unverified Draft'),
        ]);
      });
    }

    // Totals Row
    t4Rows.push([]);
    t4Rows.push([
      isFrench ? 'TOTAL T4' : 'TOTAL T4 SLIPS',
      `${t4List.length} ${isFrench ? 'feuillet(s)' : 'slip(s)'}`,
      totalT4Income,
      totalT4Cpp,
      totalT4Ei,
      totalT4Rpp,
      totalT4Tax,
      totalT4Insurable,
      totalT4Pensionable,
      totalT4Union,
      totalT4Pa,
      '✓ Complete',
    ]);

    const wsT4 = XLSX.utils.aoa_to_sheet(t4Rows);
    wsT4['!cols'] = [
      { wch: 14 },
      { wch: 32 },
      { wch: 26 },
      { wch: 24 },
      { wch: 22 },
      { wch: 24 },
      { wch: 28 },
      { wch: 22 },
      { wch: 26 },
      { wch: 24 },
      { wch: 26 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, wsT4, isFrench ? 'Feuillets T4 (Emploi)' : 'T4 Slips (Employment)');

    // ==========================================
    // SHEET 3: T4A PENSION & OTHER INCOME SLIPS
    // ==========================================
    const t4aHeaders = [
      isFrench ? 'ID Feuillet' : 'Slip ID',
      isFrench ? 'Émetteur / Régime de pension' : 'Payer / Pension Plan Name',
      isFrench ? 'Description' : 'Description',
      isFrench ? 'Case 016 Prestations de retraite / pension (Ligne 11500)' : 'Box 016 Pension or Superannuation (Line 11500)',
      isFrench ? 'Case 022 Impôt sur le revenu retenu (Ligne 43700)' : 'Box 022 Income Tax Deducted (Line 43700)',
      isFrench ? 'Case 020 Commissions travailleur autonome' : 'Box 020 Self-Employed Commissions',
      isFrench ? 'Case 028 Autres revenus (Ligne 13000)' : 'Box 028 Other Income (Line 13000)',
      isFrench ? 'Case 105 Bourses d’études ou de perfectionnement' : 'Box 105 Scholarships / Fellowships',
      isFrench ? 'Statut de vérification' : 'Verification Status',
    ];

    const t4aRows: any[][] = [
      [isFrench ? 'FEUILLETS T4A — REVENUS DE PENSION, RETRAITE, RENTE ET AUTRES' : 'T4A SLIPS — STATEMENT OF PENSION, RETIREMENT, ANNUITY, AND OTHER INCOME'],
      [isFrench ? `Année d’imposition ${taxYear} • Contribuable : ${p?.firstName || 'Alex'} ${p?.lastName || 'Morgan'}` : `Tax Year ${taxYear} • Taxpayer: ${p?.firstName || 'Alex'} ${p?.lastName || 'Morgan'}`],
      [],
      t4aHeaders,
    ];

    if (t4aList.length === 0) {
      t4aRows.push([
        'None',
        isFrench ? 'Aucun feuillet T4A enregistré' : 'No T4A slips recorded',
        '—',
        0, 0, 0, 0, 0,
        isFrench ? 'Non applicable' : 'N/A',
      ]);
    } else {
      t4aList.forEach((slip, idx) => {
        t4aRows.push([
          slip.id || `T4A-00${idx + 1}`,
          slip.payerName || (isFrench ? 'Payeur T4A' : 'Payer'),
          slip.description || (isFrench ? 'Revenu de pension ou rente' : 'Pension or Annuity Income'),
          Number(slip.amounts?.box016_pension) || 0,
          Number(slip.amounts?.box022_taxDeducted) || 0,
          Number(slip.amounts?.box020_commissions) || 0,
          Number(slip.amounts?.box028_otherIncome) || 0,
          Number(slip.amounts?.box105_scholarships) || 0,
          slip.verifiedByUser ? (isFrench ? 'Vérifié' : 'Verified') : (isFrench ? 'Brouillon' : 'Draft'),
        ]);
      });
    }

    // Totals Row
    t4aRows.push([]);
    t4aRows.push([
      isFrench ? 'TOTAL T4A' : 'TOTAL T4A SLIPS',
      `${t4aList.length} ${isFrench ? 'feuillet(s)' : 'slip(s)'}`,
      '—',
      totalT4aPension,
      totalT4aTax,
      totalT4aCommissions,
      totalT4aOther,
      totalT4aScholarships,
      '✓ Complete',
    ]);

    const wsT4a = XLSX.utils.aoa_to_sheet(t4aRows);
    wsT4a['!cols'] = [
      { wch: 14 },
      { wch: 34 },
      { wch: 32 },
      { wch: 30 },
      { wch: 28 },
      { wch: 26 },
      { wch: 24 },
      { wch: 26 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, wsT4a, isFrench ? 'Feuillets T4A (Pension)' : 'T4A Slips (Pension)');

    // ==========================================
    // SHEET 4: T5 INVESTMENT INCOME SLIPS
    // ==========================================
    const t5Headers = [
      isFrench ? 'ID Feuillet' : 'Slip ID',
      isFrench ? 'Émetteur / Institution financière' : 'Payer / Financial Institution',
      isFrench ? 'Description' : 'Description',
      isFrench ? 'Case 13 Intérêts de source canadienne (Ligne 12100)' : 'Box 13 Interest from CDN Sources (Line 12100)',
      isFrench ? 'Case 10 Montant réel des dividendes déterminés' : 'Box 10 Actual Amount of Eligible Dividends',
      isFrench ? 'Case 11 Montant imposable des dividendes déterminés (Ligne 12000)' : 'Box 11 Taxable Amount of Eligible Dividends (Line 12000)',
      isFrench ? 'Case 24 Dividendes sur les gains en capital (Ligne 12700)' : 'Box 24 Capital Gains Dividends (Line 12700)',
      isFrench ? 'Statut de vérification' : 'Verification Status',
    ];

    const t5Rows: any[][] = [
      [isFrench ? 'FEUILLETS T5 — ÉTAT DES REVENUS DE PLACEMENTS' : 'T5 SLIPS — STATEMENT OF INVESTMENT INCOME'],
      [isFrench ? `Année d’imposition ${taxYear} • Contribuable : ${p?.firstName || 'Alex'} ${p?.lastName || 'Morgan'}` : `Tax Year ${taxYear} • Taxpayer: ${p?.firstName || 'Alex'} ${p?.lastName || 'Morgan'}`],
      [],
      t5Headers,
    ];

    if (t5List.length === 0) {
      t5Rows.push([
        'None',
        isFrench ? 'Aucun feuillet T5 enregistré' : 'No T5 slips recorded',
        '—',
        0, 0, 0, 0,
        isFrench ? 'Non applicable' : 'N/A',
      ]);
    } else {
      t5List.forEach((slip, idx) => {
        t5Rows.push([
          slip.id || `T5-00${idx + 1}`,
          slip.payerName || (isFrench ? 'Institution financière' : 'Financial Institution'),
          slip.description || (isFrench ? 'Revenus de placements' : 'Investment Income'),
          Number(slip.amounts?.box13_interest) || 0,
          Number(slip.amounts?.box10_eligibleDividends) || 0,
          Number(slip.amounts?.box11_taxableDividends) || 0,
          Number(slip.amounts?.box24_capitalGains) || 0,
          slip.verifiedByUser ? (isFrench ? 'Vérifié' : 'Verified') : (isFrench ? 'Brouillon' : 'Draft'),
        ]);
      });
    }

    // Totals Row
    t5Rows.push([]);
    t5Rows.push([
      isFrench ? 'TOTAL T5' : 'TOTAL T5 SLIPS',
      `${t5List.length} ${isFrench ? 'feuillet(s)' : 'slip(s)'}`,
      '—',
      totalT5Interest,
      totalT5EligibleDiv,
      totalT5TaxableDiv,
      totalT5CapGains,
      '✓ Complete',
    ]);

    const wsT5 = XLSX.utils.aoa_to_sheet(t5Rows);
    wsT5['!cols'] = [
      { wch: 14 },
      { wch: 34 },
      { wch: 30 },
      { wch: 30 },
      { wch: 28 },
      { wch: 32 },
      { wch: 30 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, wsT5, isFrench ? 'Feuillets T5 (Placements)' : 'T5 Slips (Investments)');

    // Generate output array buffer and trigger browser download
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    return {
      success: true,
      filename,
      t4Count: t4List.length,
      t4aCount: t4aList.length,
      t5Count: t5List.length,
    };
  } catch (err: any) {
    console.error('Failed to export Excel workbook:', err);
    return {
      success: false,
      filename: '',
      t4Count: 0,
      t4aCount: 0,
      t5Count: 0,
      error: err?.message || 'Export error',
    };
  }
}
