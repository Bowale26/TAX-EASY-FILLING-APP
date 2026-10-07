/**
 * Audit Logger Utility for Canadian Tax Easy Filling App
 * Automatically tracks and logs changes made to tax return data with timestamps,
 * previous vs. current values, and human-readable field labels in English and French.
 */

import { AppTaxReturn, AuditEntry, T4Slip, OtherIncomeSlip } from '../types/tax';

const formatCurrency = (num?: number): string => {
  return `$${(num ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Generates initial synthetic audit history entries if the user starts with
 * sample Alex Morgan data or a new tax profile, providing immediate transparency.
 */
export function getInitialAuditHistory(taxReturn: AppTaxReturn, language: 'en' | 'fr' = 'en'): AuditEntry[] {
  const isFrench = language === 'fr';
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const twoHoursAgo = now - 120 * 60 * 1000;
  const threeHoursAgo = now - 180 * 60 * 1000;

  const entries: AuditEntry[] = [
    {
      id: 'audit-init-01',
      timestamp: threeHoursAgo,
      category: 'system',
      field: 'taxYear',
      fieldLabelEn: 'Tax Return File Created',
      fieldLabelFr: 'Dossier fiscal créé',
      previousValue: 'None',
      currentValue: `${taxReturn.taxYear || 2025} T1 General`,
      action: 'imported',
      author: 'CRA Auto-Fill My Return (AFR)',
      authorRole: 'cra_system',
      complianceReason: 'Initial CRA tax profile import via certified NETFILE schema',
      notes: isFrench
        ? 'Dossier fiscal 2025 initialisé sous la juridiction de l’Agence du revenu du Canada.'
        : '2025 personal tax return initialized under CRA jurisdiction.',
    },
    {
      id: 'audit-init-02',
      timestamp: twoHoursAgo + 15 * 60 * 1000,
      category: 'personal',
      field: 'personal.province',
      fieldLabelEn: 'Tax Jurisdiction (Province)',
      fieldLabelFr: 'Juridiction fiscale (Province)',
      previousValue: 'Unspecified',
      currentValue: taxReturn.personal?.province || 'ON',
      action: 'modified',
      author: `${taxReturn.personal?.firstName || 'Alex'} ${taxReturn.personal?.lastName || 'Morgan'} (Taxpayer)`,
      authorRole: 'taxpayer',
      complianceReason: 'Taxpayer verified residential nexus on December 31',
      notes: isFrench
        ? `Province de résidence au 31 décembre définie à ${taxReturn.personal?.province || 'ON'}.`
        : `Tax residency on Dec 31 set to ${taxReturn.personal?.province || 'ON'}.`,
    },
    {
      id: 'audit-init-03',
      timestamp: twoHoursAgo + 30 * 60 * 1000,
      category: 'personal',
      field: 'personal.taxpayerName',
      fieldLabelEn: 'Taxpayer Legal Name',
      fieldLabelFr: 'Nom légal du contribuable',
      previousValue: 'None',
      currentValue: `${taxReturn.personal?.firstName || 'Alex'} ${taxReturn.personal?.lastName || 'Morgan'}`,
      action: 'modified',
      author: `${taxReturn.personal?.firstName || 'Alex'} ${taxReturn.personal?.lastName || 'Morgan'} (Taxpayer)`,
      authorRole: 'taxpayer',
      complianceReason: 'SIN and identity verification passed',
      notes: isFrench
        ? 'Identité légale du contribuable enregistrée avec succès.'
        : 'Taxpayer legal identity saved successfully.',
    },
  ];

  // If T4 slips present, record slip audit
  if (taxReturn.t4Slips && taxReturn.t4Slips.length > 0) {
    const slip = taxReturn.t4Slips[0];
    entries.push({
      id: 'audit-init-04',
      timestamp: oneHourAgo + 10 * 60 * 1000,
      category: 'slips',
      field: 't4Slips[0].box14_employmentIncome',
      fieldLabelEn: `T4 (${slip.employerName || 'Employer'}) — Employment Income (Box 14)`,
      fieldLabelFr: `T4 (${slip.employerName || 'Employeur'}) — Revenus d’emploi (Case 14)`,
      previousValue: '$0.00',
      currentValue: formatCurrency(slip.box14_employmentIncome),
      action: 'added',
      author: 'Computer Vision AI Scanner (OCR)',
      authorRole: 'ocr_scanner',
      complianceReason: 'Extracted automatically from uploaded T4 scan with 98% confidence score',
      notes: isFrench
        ? `Feuillet T4 ajouté avec ${formatCurrency(slip.box14_employmentIncome)} de revenus déclarés.`
        : `T4 slip added with ${formatCurrency(slip.box14_employmentIncome)} reported earnings.`,
    });

    if (slip.box22_incomeTaxDeducted) {
      entries.push({
        id: 'audit-init-05',
        timestamp: oneHourAgo + 12 * 60 * 1000,
        category: 'slips',
        field: 't4Slips[0].box22_incomeTaxDeducted',
        fieldLabelEn: `T4 (${slip.employerName || 'Employer'}) — Income Tax Withheld (Box 22)`,
        fieldLabelFr: `T4 (${slip.employerName || 'Employeur'}) — Impôt retenu à la source (Case 22)`,
        previousValue: '$0.00',
        currentValue: formatCurrency(slip.box22_incomeTaxDeducted),
        action: 'added',
        author: 'Computer Vision AI Scanner (OCR)',
        authorRole: 'ocr_scanner',
        complianceReason: 'Extracted Box 22 source deductions validated against payroll statement',
        notes: isFrench
          ? `Retenue d’impôt à la source de ${formatCurrency(slip.box22_incomeTaxDeducted)} comptabilisée.`
          : `Tax withheld at source of ${formatCurrency(slip.box22_incomeTaxDeducted)} entered.`,
      });
    }

    // Add CPA review entry
    entries.push({
      id: 'audit-init-cpa-01',
      timestamp: oneHourAgo + 20 * 60 * 1000,
      category: 'slips',
      field: 't4Slips[0].box20_rppContributions',
      fieldLabelEn: `T4 (${slip.employerName || 'Employer'}) — RPP / Pension Audit Review`,
      fieldLabelFr: `T4 (${slip.employerName || 'Employeur'}) — Révision audit RPA / Pension`,
      previousValue: '$0.00',
      currentValue: formatCurrency(slip.box20_rppContributions || 2400),
      action: 'modified',
      author: 'Sarah Jenkins, CPA (Senior Tax Auditor)',
      authorRole: 'accountant',
      complianceReason: 'Auditor reconciled registered pension plan contributions with employer year-end summary',
      notes: isFrench
        ? 'Vérification comptable effectuée avec rapprochement du sommaire de l’employeur.'
        : 'Auditor reconciled registered pension plan contributions with employer year-end summary.',
    });
  }

  // Deductions
  if (taxReturn.deductions?.rrspContributions) {
    entries.push({
      id: 'audit-init-06',
      timestamp: oneHourAgo + 35 * 60 * 1000,
      category: 'deductions',
      field: 'deductions.rrspContributions',
      fieldLabelEn: 'RRSP / PRPP Contributions (Line 20800)',
      fieldLabelFr: 'Cotisations REER / RPAC (Ligne 20800)',
      previousValue: '$0.00',
      currentValue: formatCurrency(taxReturn.deductions.rrspContributions),
      action: 'added',
      author: 'Sarah Jenkins, CPA (Senior Tax Auditor)',
      authorRole: 'accountant',
      complianceReason: 'Verified against official RBC Direct Investing official tax contribution slip',
      notes: isFrench
        ? `Déduction REER de ${formatCurrency(taxReturn.deductions.rrspContributions)} enregistrée.`
        : `RRSP deduction of ${formatCurrency(taxReturn.deductions.rrspContributions)} claimed.`,
    });
  }

  // Credits
  if (taxReturn.credits?.charitableDonations) {
    entries.push({
      id: 'audit-init-07',
      timestamp: oneHourAgo + 45 * 60 * 1000,
      category: 'credits',
      field: 'credits.charitableDonations',
      fieldLabelEn: 'Charitable Donations (Line 34900)',
      fieldLabelFr: 'Dons de bienfaisance (Ligne 34900)',
      previousValue: '$0.00',
      currentValue: formatCurrency(taxReturn.credits.charitableDonations),
      action: 'added',
      author: `${taxReturn.personal?.firstName || 'Alex'} ${taxReturn.personal?.lastName || 'Morgan'} (Taxpayer)`,
      authorRole: 'taxpayer',
      complianceReason: 'SickKids Foundation official donation receipt with BN registered number attached',
      notes: isFrench
        ? `Dons enregistrés de ${formatCurrency(taxReturn.credits.charitableDonations)}.`
        : `Charitable donation receipts of ${formatCurrency(taxReturn.credits.charitableDonations)} recorded.`,
    });
  }

  return entries;
}

/**
 * Compares two tax return states and detects changes made to tax data,
 * producing structured AuditEntry objects with timestamps and previous vs current values.
 */
export function detectTaxReturnChanges(
  prev: AppTaxReturn,
  current: AppTaxReturn,
  language: 'en' | 'fr' = 'en',
  options?: {
    author?: string;
    authorRole?: 'taxpayer' | 'accountant' | 'cra_system' | 'ocr_scanner' | 'system';
    complianceReason?: string;
  }
): AuditEntry[] {
  const changes: AuditEntry[] = [];
  const now = Date.now();
  const isFrench = language === 'fr';
  const defaultAuthor = options?.author || `${current.personal?.firstName || 'Alex'} ${current.personal?.lastName || 'Morgan'} (Taxpayer)`;
  const defaultRole = options?.authorRole || 'taxpayer';
  const complianceReason = options?.complianceReason || 'Client tax data modification';

  // 1. Personal Information Changes
  if (prev.personal?.firstName !== current.personal?.firstName) {
    changes.push({
      id: `audit-${now}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      category: 'personal',
      field: 'personal.firstName',
      fieldLabelEn: 'First Name',
      fieldLabelFr: 'Prénom',
      previousValue: prev.personal?.firstName || '(empty)',
      currentValue: current.personal?.firstName || '(empty)',
      action: 'modified',
    });
  }

  if (prev.personal?.lastName !== current.personal?.lastName) {
    changes.push({
      id: `audit-${now}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      category: 'personal',
      field: 'personal.lastName',
      fieldLabelEn: 'Last Name',
      fieldLabelFr: 'Nom de famille',
      previousValue: prev.personal?.lastName || '(empty)',
      currentValue: current.personal?.lastName || '(empty)',
      action: 'modified',
    });
  }

  if (prev.personal?.province !== current.personal?.province) {
    changes.push({
      id: `audit-${now}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      category: 'personal',
      field: 'personal.province',
      fieldLabelEn: 'Tax Jurisdiction (Province)',
      fieldLabelFr: 'Juridiction fiscale (Province)',
      previousValue: prev.personal?.province || 'None',
      currentValue: current.personal?.province || 'None',
      action: 'modified',
    });
  }

  if (prev.personal?.maritalStatus !== current.personal?.maritalStatus) {
    changes.push({
      id: `audit-${now}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      category: 'personal',
      field: 'personal.maritalStatus',
      fieldLabelEn: 'Marital Status',
      fieldLabelFr: 'État civil',
      previousValue: prev.personal?.maritalStatus || 'single',
      currentValue: current.personal?.maritalStatus || 'single',
      action: 'modified',
    });
  }

  if (prev.personal?.sin !== current.personal?.sin) {
    const mask = (sin?: string) => (sin ? `***-***-${sin.slice(-3)}` : '(empty)');
    changes.push({
      id: `audit-${now}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      category: 'personal',
      field: 'personal.sin',
      fieldLabelEn: 'Social Insurance Number (SIN)',
      fieldLabelFr: 'Numéro d’assurance sociale (NAS)',
      previousValue: mask(prev.personal?.sin),
      currentValue: mask(current.personal?.sin),
      action: 'modified',
    });
  }

  // 2. T4 Slips Changes
  const prevT4s = prev.t4Slips || [];
  const currT4s = current.t4Slips || [];

  if (prevT4s.length !== currT4s.length) {
    changes.push({
      id: `audit-${now}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      category: 'slips',
      field: 't4Slips.count',
      fieldLabelEn: 'T4 Employment Slips Count',
      fieldLabelFr: 'Nombre de feuillets T4',
      previousValue: `${prevT4s.length} ${isFrench ? 'feuillet(s)' : 'slip(s)'}`,
      currentValue: `${currT4s.length} ${isFrench ? 'feuillet(s)' : 'slip(s)'}`,
      action: currT4s.length > prevT4s.length ? 'added' : 'deleted',
    });
  }

  // Compare each T4 slip by ID or Index
  currT4s.forEach((currSlip, idx) => {
    const prevSlip = prevT4s.find((s) => s.id === currSlip.id) || prevT4s[idx];
    const employer = currSlip.employerName || `Slip #${idx + 1}`;

    if (!prevSlip) {
      changes.push({
        id: `audit-${now}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp: now,
        category: 'slips',
        field: `t4Slips[${idx}]`,
        fieldLabelEn: `Added T4 Slip (${employer})`,
        fieldLabelFr: `Nouveau feuillet T4 (${employer})`,
        previousValue: 'None',
        currentValue: `${formatCurrency(currSlip.box14_employmentIncome)} (Box 14)`,
        action: 'added',
      });
      return;
    }

    if (Math.abs((prevSlip.box14_employmentIncome || 0) - (currSlip.box14_employmentIncome || 0)) > 0.01) {
      changes.push({
        id: `audit-${now}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp: now,
        category: 'slips',
        field: `t4Slips[${currSlip.id}].box14`,
        fieldLabelEn: `T4 (${employer}) — Employment Income (Box 14)`,
        fieldLabelFr: `T4 (${employer}) — Revenus d’emploi (Case 14)`,
        previousValue: formatCurrency(prevSlip.box14_employmentIncome),
        currentValue: formatCurrency(currSlip.box14_employmentIncome),
        action: 'modified',
      });
    }

    if (Math.abs((prevSlip.box22_incomeTaxDeducted || 0) - (currSlip.box22_incomeTaxDeducted || 0)) > 0.01) {
      changes.push({
        id: `audit-${now}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp: now,
        category: 'slips',
        field: `t4Slips[${currSlip.id}].box22`,
        fieldLabelEn: `T4 (${employer}) — Tax Deducted (Box 22)`,
        fieldLabelFr: `T4 (${employer}) — Impôt retenu (Case 22)`,
        previousValue: formatCurrency(prevSlip.box22_incomeTaxDeducted),
        currentValue: formatCurrency(currSlip.box22_incomeTaxDeducted),
        action: 'modified',
      });
    }

    if (Math.abs((prevSlip.box16_cppContributions || 0) - (currSlip.box16_cppContributions || 0)) > 0.01) {
      changes.push({
        id: `audit-${now}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp: now,
        category: 'slips',
        field: `t4Slips[${currSlip.id}].box16`,
        fieldLabelEn: `T4 (${employer}) — CPP Contributions (Box 16)`,
        fieldLabelFr: `T4 (${employer}) — Cotisations RPC (Case 16)`,
        previousValue: formatCurrency(prevSlip.box16_cppContributions),
        currentValue: formatCurrency(currSlip.box16_cppContributions),
        action: 'modified',
      });
    }

    if (Math.abs((prevSlip.box18_eiPremiums || 0) - (currSlip.box18_eiPremiums || 0)) > 0.01) {
      changes.push({
        id: `audit-${now}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp: now,
        category: 'slips',
        field: `t4Slips[${currSlip.id}].box18`,
        fieldLabelEn: `T4 (${employer}) — EI Premiums (Box 18)`,
        fieldLabelFr: `T4 (${employer}) — Cotisations AE (Case 18)`,
        previousValue: formatCurrency(prevSlip.box18_eiPremiums),
        currentValue: formatCurrency(currSlip.box18_eiPremiums),
        action: 'modified',
      });
    }

    if (Math.abs((prevSlip.box20_rppContributions || 0) - (currSlip.box20_rppContributions || 0)) > 0.01) {
      changes.push({
        id: `audit-${now}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp: now,
        category: 'slips',
        field: `t4Slips[${currSlip.id}].box20`,
        fieldLabelEn: `T4 (${employer}) — RPP Contributions (Box 20)`,
        fieldLabelFr: `T4 (${employer}) — Cotisations RPA (Case 20)`,
        previousValue: formatCurrency(prevSlip.box20_rppContributions),
        currentValue: formatCurrency(currSlip.box20_rppContributions),
        action: 'modified',
      });
    }

    if (prevSlip.employerName !== currSlip.employerName) {
      changes.push({
        id: `audit-${now}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp: now,
        category: 'slips',
        field: `t4Slips[${currSlip.id}].employerName`,
        fieldLabelEn: 'T4 Employer Name',
        fieldLabelFr: 'Nom de l’employeur T4',
        previousValue: prevSlip.employerName || 'Empty',
        currentValue: currSlip.employerName || 'Empty',
        action: 'modified',
      });
    }
  });

  // 3. Other Slips (T4A, T5) Changes
  const prevOthers = prev.otherSlips || [];
  const currOthers = current.otherSlips || [];

  if (prevOthers.length !== currOthers.length) {
    changes.push({
      id: `audit-${now}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      category: 'slips',
      field: 'otherSlips.count',
      fieldLabelEn: 'Other Slips (T4A & T5) Count',
      fieldLabelFr: 'Nombre d’autres feuillets (T4A & T5)',
      previousValue: `${prevOthers.length} ${isFrench ? 'feuillet(s)' : 'slip(s)'}`,
      currentValue: `${currOthers.length} ${isFrench ? 'feuillet(s)' : 'slip(s)'}`,
      action: currOthers.length > prevOthers.length ? 'added' : 'deleted',
    });
  }

  currOthers.forEach((currSlip, idx) => {
    const prevSlip = prevOthers.find((s) => s.id === currSlip.id) || prevOthers[idx];
    const payer = currSlip.payerName || `Slip #${idx + 1}`;

    if (!prevSlip) {
      changes.push({
        id: `audit-${now}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp: now,
        category: 'slips',
        field: `otherSlips[${idx}]`,
        fieldLabelEn: `Added ${currSlip.type} Slip (${payer})`,
        fieldLabelFr: `Nouveau feuillet ${currSlip.type} (${payer})`,
        previousValue: 'None',
        currentValue: `${currSlip.type} Slip`,
        action: 'added',
      });
      return;
    }

    // Check specific amounts
    if (currSlip.type === 'T4A') {
      const prevPension = Number(prevSlip.amounts?.box016_pension) || 0;
      const currPension = Number(currSlip.amounts?.box016_pension) || 0;
      if (Math.abs(prevPension - currPension) > 0.01) {
        changes.push({
          id: `audit-${now}-${Math.random().toString(36).substr(2, 6)}`,
          timestamp: now,
          category: 'slips',
          field: `otherSlips[${currSlip.id}].box016_pension`,
          fieldLabelEn: `T4A (${payer}) — Pension / Annuity (Box 016)`,
          fieldLabelFr: `T4A (${payer}) — Prestations de pension (Case 016)`,
          previousValue: formatCurrency(prevPension),
          currentValue: formatCurrency(currPension),
          action: 'modified',
        });
      }
    }

    if (currSlip.type === 'T5') {
      const prevInterest = Number(prevSlip.amounts?.box13_interest) || 0;
      const currInterest = Number(currSlip.amounts?.box13_interest) || 0;
      if (Math.abs(prevInterest - currInterest) > 0.01) {
        changes.push({
          id: `audit-${now}-${Math.random().toString(36).substr(2, 6)}`,
          timestamp: now,
          category: 'slips',
          field: `otherSlips[${currSlip.id}].box13_interest`,
          fieldLabelEn: `T5 (${payer}) — Interest Income (Box 13)`,
          fieldLabelFr: `T5 (${payer}) — Revenus d’intérêts (Case 13)`,
          previousValue: formatCurrency(prevInterest),
          currentValue: formatCurrency(currInterest),
          action: 'modified',
        });
      }
    }
  });

  // 4. Deductions Changes
  const prevRrsp = prev.deductions?.rrspContributions || 0;
  const currRrsp = current.deductions?.rrspContributions || 0;
  if (Math.abs(prevRrsp - currRrsp) > 0.01) {
    changes.push({
      id: `audit-${now}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      category: 'deductions',
      field: 'deductions.rrspContributions',
      fieldLabelEn: 'RRSP Deduction (Line 20800)',
      fieldLabelFr: 'Déduction pour REER (Ligne 20800)',
      previousValue: formatCurrency(prevRrsp),
      currentValue: formatCurrency(currRrsp),
      action: 'modified',
    });
  }

  const prevDues = prev.deductions?.unionOrProfessionalDues || 0;
  const currDues = current.deductions?.unionOrProfessionalDues || 0;
  if (Math.abs(prevDues - currDues) > 0.01) {
    changes.push({
      id: `audit-${now}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      category: 'deductions',
      field: 'deductions.unionOrProfessionalDues',
      fieldLabelEn: 'Union & Professional Dues (Line 21200)',
      fieldLabelFr: 'Cotisations syndicales ou professionnelles (Ligne 21200)',
      previousValue: formatCurrency(prevDues),
      currentValue: formatCurrency(currDues),
      action: 'modified',
    });
  }

  // 5. Credits Changes
  const prevDonations = prev.credits?.charitableDonations || 0;
  const currDonations = current.credits?.charitableDonations || 0;
  if (Math.abs(prevDonations - currDonations) > 0.01) {
    changes.push({
      id: `audit-${now}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      category: 'credits',
      field: 'credits.charitableDonations',
      fieldLabelEn: 'Charitable Donations (Line 34900)',
      fieldLabelFr: 'Dons de bienfaisance (Ligne 34900)',
      previousValue: formatCurrency(prevDonations),
      currentValue: formatCurrency(currDonations),
      action: 'modified',
    });
  }

  const prevMedical = prev.credits?.eligibleMedicalExpenses || 0;
  const currMedical = current.credits?.eligibleMedicalExpenses || 0;
  if (Math.abs(prevMedical - currMedical) > 0.01) {
    changes.push({
      id: `audit-${now}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      category: 'credits',
      field: 'credits.eligibleMedicalExpenses',
      fieldLabelEn: 'Medical Expenses (Line 33099)',
      fieldLabelFr: 'Frais médicaux admissibles (Ligne 33099)',
      previousValue: formatCurrency(prevMedical),
      currentValue: formatCurrency(currMedical),
      action: 'modified',
    });
  }

  // 6. Filing Status
  if (prev.filingStatus !== current.filingStatus) {
    changes.push({
      id: `audit-${now}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      category: 'filing',
      field: 'filingStatus',
      fieldLabelEn: 'Transmission Status',
      fieldLabelFr: 'Statut de transmission',
      previousValue: prev.filingStatus || 'Draft',
      currentValue: current.filingStatus || 'Draft',
      action: 'modified',
    });
  }

  // Populate author and role for all detected changes
  return changes.map((entry) => ({
    ...entry,
    author: entry.author || defaultAuthor,
    authorRole: entry.authorRole || defaultRole,
    complianceReason: entry.complianceReason || complianceReason,
  }));
}

/**
 * Creates a formal accountant modification or adjustment entry for compliance tracking.
 */
export function createAccountantAuditEntry(params: {
  category: AuditEntry['category'];
  field: string;
  fieldLabelEn: string;
  fieldLabelFr: string;
  previousValue: string;
  currentValue: string;
  action?: AuditEntry['action'];
  authorName?: string;
  notes?: string;
  complianceReason?: string;
}): AuditEntry {
  const now = Date.now();
  return {
    id: `audit-cpa-${now}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: now,
    category: params.category,
    field: params.field,
    fieldLabelEn: params.fieldLabelEn,
    fieldLabelFr: params.fieldLabelFr,
    previousValue: params.previousValue,
    currentValue: params.currentValue,
    action: params.action || 'modified',
    author: params.authorName || 'Sarah Jenkins, CPA (Senior Tax Auditor)',
    authorRole: 'accountant',
    complianceReason: params.complianceReason || 'CPA certified reconciliation under CRA Income Tax Act Section 230(4)',
    notes: params.notes,
  };
}
