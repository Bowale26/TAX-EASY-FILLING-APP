import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Camera,
  Bot,
  Sparkles,
  GitCompare,
  TrendingUp,
  History,
  FileSignature,
  Send,
  CheckCircle2,
  HelpCircle,
  FolderLock,
} from 'lucide-react';

interface AppTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'fr';
  onNavigateToStep?: (step: number) => void;
  onOpenScanner?: () => void;
  onOpenAssistant?: () => void;
  onOpenDMS?: () => void;
}

interface TourStep {
  id: string;
  badgeEn: string;
  badgeFr: string;
  titleEn: string;
  titleFr: string;
  descEn: string;
  descFr: string;
  featuresEn: string[];
  featuresFr: string[];
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  actionButton?: {
    labelEn: string;
    labelFr: string;
    action: 'step' | 'scanner' | 'assistant' | 'dms';
    stepNumber?: number;
  };
}

export const AppTourModal: React.FC<AppTourModalProps> = ({
  isOpen,
  onClose,
  language,
  onNavigateToStep,
  onOpenScanner,
  onOpenAssistant,
  onOpenDMS,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const isFrench = language === 'fr';

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      badgeEn: 'Welcome & Overview',
      badgeFr: 'Bienvenue & Vue d’ensemble',
      titleEn: 'TAX EASY Canada: Complete Filing Suite',
      titleFr: 'TAX EASY Canada : Suite Complète de Déclaration',
      descEn:
        'TAX EASY is an intelligent Canadian tax filing suite built for individual employees, self-employed contractors, and small business filers. Powered by native CRA tax rules, certified calculation standards, and our TaxFile AI assistant.',
      descFr:
        'TAX EASY est une suite fiscale canadienne intelligente conçue pour les employés, les travailleurs autonomes et les propriétaires de petites entreprises. Conforme aux règles de l’ARC et assistée par TaxFile.',
      featuresEn: [
        'Full support for all 19 CRA tax slips (T4, T5, T5018, T1204, etc.)',
        'Certified CRA calculation rules with real-time refund/owing updates',
        'Official NETFILE electronic transmission with instant confirmation numbers',
        'Interactive TaxFile AI guide available at any step',
      ],
      featuresFr: [
        'Prise en charge intégrale des 19 feuillets de l’ARC (T4, T5, T5018, T1204, etc.)',
        'Règles de calcul certifiées de l’ARC avec mise à jour du remboursement en temps réel',
        'Transmission électronique NETFILE officielle avec numéro de confirmation instantané',
        'Assistant fiscal TaxFile disponible à tout moment',
      ],
      icon: Sparkles,
      accentColor: 'from-[#064e3b] to-[#0b1f3a]',
    },
    {
      id: 'scanner',
      badgeEn: 'Slip Scanning & OCR',
      badgeFr: 'Numérisation & ROC',
      titleEn: 'AI Computer Vision & Slip Scanner',
      titleFr: 'Numériseur de Feuillets par Vision Artificielle',
      descEn:
        'Capture slips with your device camera or upload image files. The built-in OCR engine recognizes CRA slip formats, extracts numerical box data, and auto-populates your return with bounding boxes and thumbnail previews.',
      descFr:
        'Capturez vos feuillets avec la caméra de votre appareil ou téléversez des images. Le moteur de ROC reconnaît le format de feuillet, extrait les données des cases et remplit automatiquement votre déclaration.',
      featuresEn: [
        'Device camera capture with live visual alignment guidelines',
        'Supports all 19 CRA slips including T4, T4A, T5, T5018 subcontractors, and T1204 contracts',
        'Automatic field mapping with validation badges (Validated / Needs Review)',
        'Clickable "Expand" preview icon on document list to inspect slip thumbnails',
      ],
      featuresFr: [
        'Capture par caméra avec guides visuels d’alignement',
        'Supporte les 19 feuillets de l’ARC incluant T4, T4A, T5, T5018 sous-traitants et T1204 contrats',
        'Correspondance automatique des cases avec badges de validation',
        'Icône « Agrandir » pour afficher la vignette de l’image numérisée',
      ],
      icon: Camera,
      accentColor: 'from-emerald-700 to-teal-800',
      actionButton: {
        labelEn: 'Try Slip Scanner',
        labelFr: 'Essayer le Numériseur',
        action: 'scanner',
      },
    },
    {
      id: 'taxfile',
      badgeEn: 'AI Tax & App Guide',
      badgeFr: 'Assistant Fiscal & Guide',
      titleEn: 'Meet "TaxFile" — Your AI Tax Assistant',
      titleFr: 'Découvrez « TaxFile » — Votre Assistant IA',
      descEn:
        'TaxFile is your dedicated Canadian tax assistant. It explains complex tax jargon in plain Grade-8 language, breaks down Box numbers across all 19 slips, clarifies deductions, and explains any app feature.',
      descFr:
        'TaxFile est votre assistant fiscal dédié. Il vulgarise les règles fiscales en langage clair, explique les numéros de case pour tous les 19 feuillets, clarifie les déductions et répond à vos questions.',
      featuresEn: [
        'Plain language explanations for Box 14, Box 22, RRSP deductions, and more',
        'Explains all app capabilities: OCR, industry benchmarks, audit timeline, NETFILE',
        'Bilingual conversation support in French and English',
        'Context-aware answers tailored to your specific return data and province',
      ],
      featuresFr: [
        'Explications claires des cases 14, 22, déductions REER et crédits d’impôt',
        'Explique toutes les fonctions : ROC, validation SCIAN, audit visuel, NETFILE',
        'Support bilingue complet en français et anglais',
        'Réponses adaptées aux données réelles de votre déclaration et province',
      ],
      icon: Bot,
      accentColor: 'from-blue-700 to-indigo-900',
      actionButton: {
        labelEn: 'Chat with TaxFile',
        labelFr: 'Discuter avec TaxFile',
        action: 'assistant',
      },
    },
    {
      id: 'document-management',
      badgeEn: 'Document Management System',
      badgeFr: 'Gestionnaire de Documents Fiscaux',
      titleEn: 'Secure Tax Document Vault (W-2, 1099, Receipts)',
      titleFr: 'Coffre-Fort Sécurisé pour Documents Fiscaux',
      descEn:
        'Upload, categorize, tag, and search all your tax-related records in one place. Features client-side AES-256-GCM encryption, SHA-256 cryptographic tamper detection, and automated CRA 6-year retention tracking.',
      descFr:
        'Téléversez, catégorisez, étiquetez et recherchez tous vos documents fiscaux au même endroit. Chiffrement AES-256-GCM, détection de falsification par hachage SHA-256 et suivi de conservation légale de 6 ans de l’ARC.',
      featuresEn: [
        'Supports W-2, 1099-MISC/NEC/INT/DIV, Receipts, T4/T5 Slips, CRA Notices & Form 1040',
        'Custom multi-tagging and real-time full-text search with instant filtering',
        'AES-256-GCM secure encryption and cryptographic SHA-256 integrity checks',
        'Consolidated in the Left-Hand Button Panel with deep green, white, and deep blue UI',
      ],
      featuresFr: [
        'Prise en charge W-2, 1099, reçus médicaux/dons, feuillets T4/T5, avis de cotisation',
        'Étiquetage personnalisé, recherche textuelle en temps réel et filtres avancés',
        'Chiffrement robuste AES-256-GCM et vérification cryptographique SHA-256',
        'Consolidé dans le panneau gauche avec thème vert foncé, blanc et bleu profond',
      ],
      icon: FolderLock,
      accentColor: 'from-emerald-800 to-[#0b2942]',
      actionButton: {
        labelEn: 'Open Document Vault',
        labelFr: 'Ouvrir le Coffre Docs',
        action: 'dms',
      },
    },
    {
      id: 'industry-crossref',
      badgeEn: 'Review Step Validation',
      badgeFr: 'Validation de l’Étape Vérification',
      titleEn: 'CRA NAICS Industry Benchmark Cross-Reference',
      titleFr: 'Validation Croisée Sectorielle SCIAN / ARC',
      descEn:
        'In the Review step, this audit engine compares total reported T4 employment income against Statistics Canada / CRA salary ranges for your selected industry code (e.g. NAICS 541514 Software & Tech, 236110 Construction, etc.).',
      descFr:
        'À l’étape Vérification, ce moteur d’audit compare le total de vos revenus d’emploi T4 aux fourchettes de salaires types de Statistique Canada et de l’ARC pour votre code SCIAN.',
      featuresEn: [
        'Percentile wage brackets: 25th percentile, 50th median, 75th, and 90th high earner',
        'Proactively warns filers if reported income appears unusually low (potential missing T4)',
        'Flags high-earner federal and provincial surtax brackets (e.g. Ontario surtax, 33% top federal)',
        'Instant industry code selector to update benchmark analysis in real time',
      ],
      featuresFr: [
        'Échelons de salaires : 25e centile, médiane 50e, 75e et 90e centile supérieur',
        'Alerte préventive si le revenu semble anormalement bas (feuillet T4 potentiellement omis)',
        'Indicateurs de surtaxes pour hauts revenus (surtaxe de l’Ontario, tranche fédérale de 33%)',
        'Sélecteur de code sectoriel pour mettre à jour l’analyse en temps réel',
      ],
      icon: TrendingUp,
      accentColor: 'from-amber-600 to-emerald-800',
      actionButton: {
        labelEn: 'Go to Review Step',
        labelFr: 'Aller à la Vérification',
        action: 'step',
        stepNumber: 5,
      },
    },
    {
      id: 'audit-timeline',
      badgeEn: 'Review Step Transparency',
      badgeFr: 'Transparence de Vérification',
      titleEn: 'Visual Audit Trail Timeline',
      titleFr: 'Chronologie d’Audit Visuelle (Avant/Après)',
      descEn:
        'Located in the Review step, the Visual Audit Timeline displays every tax return modification with explicit "Before" and "After" state badges, timestamps, user/agent source tags, and category filters.',
      descFr:
        'Située à l’étape Vérification, la chronologie d’audit affiche chaque modification de votre déclaration avec des indicateurs explicites « Avant » et « Après », horodatages et filtres par catégorie.',
      featuresEn: [
        'Clear visual contrast between previous values (Before) and modified values (After)',
        'Action badges for Slip Added, Value Updated, AI Extracted, and System Recalculated',
        'Category filters for Slips, Deductions, Personal Info, and System calculations',
        'Guarantees full CRA audit readiness and records traceability before filing',
      ],
      featuresFr: [
        'Contraste visuel clair entre ancienne valeur (Avant) et nouvelle valeur (Après)',
        'Badges d’action : Feuillet Ajouté, Valeur Modifiée, Extrait par IA, Recalcul Système',
        'Filtres par catégorie pour Feuillets, Déductions, Info Personnelle et Système',
        'Garantit une traçabilité totale conforme aux audits de l’ARC',
      ],
      icon: History,
      accentColor: 'from-slate-700 to-[#064e3b]',
      actionButton: {
        labelEn: 'View Timeline in Review',
        labelFr: 'Voir la Chronologie',
        action: 'step',
        stepNumber: 5,
      },
    },
    {
      id: 'a2a-judge',
      badgeEn: 'Autonomous Reconciliation',
      badgeFr: 'Réconciliation Autonome',
      titleEn: 'A2A Multi-Agent Discrepancy Judge',
      titleFr: 'Juge Multi-Agents A2A de Divergences',
      descEn:
        'When local slips differ from CRA remote data, our multi-agent arbitration engine compares values line-by-line, analyzes evidence (such as employer scan dates vs. CRA data feeds), and resolves discrepancies automatically.',
      descFr:
        'Lorsque des données locales divergent des registres de l’ARC, le juge d’arbitrage multi-agents compare les lignes, analyse les preuves et propose une réconciliation automatisée.',
      featuresEn: [
        'Simulates Agent-to-Agent dispute resolution between Taxpayer and CRA auditor agents',
        'Generates formal reconciliation rationale and audit-stamped agreement',
        'Provides seamless one-click dispute resolution for contested boxes',
      ],
      featuresFr: [
        'Simulation d’arbitrage agent-à-agent entre déclarant et vérificateur de l’ARC',
        'Génération de justifications formelles avec estampille d’accord d’audit',
        'Résolution des contestations en un seul clic',
      ],
      icon: GitCompare,
      accentColor: 'from-violet-700 to-indigo-950',
    },
    {
      id: 'docusign-netfile',
      badgeEn: 'Filing & Certification',
      badgeFr: 'Transmission & Certification',
      titleEn: 'CRA E-Signature & NETFILE Submission',
      titleFr: 'Signature Électronique et Transmission NETFILE',
      descEn:
        'Finalize your return with CRA-compliant YYYY/MM/DD electronic signature and transmit directly through the certified NETFILE protocol to receive an instant official confirmation code.',
      descFr:
        'Finalisez votre déclaration avec signature électronique conforme au format AAAA/MM/JJ de l’ARC et transmettez via NETFILE pour recevoir votre numéro officiel de confirmation.',
      featuresEn: [
        'DocuSign-style electronic signature modal enforcing YYYY/MM/DD date standard',
        'Instant CRA NETFILE transmission with official confirmation number',
        'Downloadable CRA Assessment Summary Report and formatted PDF tax return',
        'Complete printable filing package for your personal records',
      ],
      featuresFr: [
        'Modal de signature électronique conforme à la norme de date AAAA/MM/JJ de l’ARC',
        'Transmission NETFILE instantanée avec numéro officiel de confirmation',
        'Téléchargement de l’avis de cotisation sommaire et copie PDF formatée',
        'Dossier de déclaration complet imprimable pour vos archives',
      ],
      icon: Send,
      accentColor: 'from-[#064e3b] to-emerald-900',
      actionButton: {
        labelEn: 'Go to File / NETFILE',
        labelFr: 'Aller à la Transmission',
        action: 'step',
        stepNumber: 6,
      },
    },
  ];

  const currentStep = tourSteps[currentStepIndex];
  const StepIcon = currentStep.icon;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentStepIndex < tourSteps.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
      }
      if (e.key === 'ArrowLeft' && currentStepIndex > 0) {
        setCurrentStepIndex((prev) => prev - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, tourSteps.length, onClose]);

  if (!isOpen) return null;

  const handleActionClick = () => {
    if (!currentStep.actionButton) return;
    onClose();
    if (currentStep.actionButton.action === 'scanner') {
      onOpenScanner?.();
    } else if (currentStep.actionButton.action === 'assistant') {
      onOpenAssistant?.();
    } else if (currentStep.actionButton.action === 'dms') {
      onOpenDMS?.();
    } else if (currentStep.actionButton.action === 'step' && currentStep.actionButton.stepNumber) {
      onNavigateToStep?.(currentStep.actionButton.stepNumber);
    }
  };

  return (
    <div
      id="app-tour-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="app-tour-modal-card"
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div
          className={`bg-linear-to-r ${currentStep.accentColor} text-white px-5 sm:px-6 py-5 flex items-center justify-between transition-colors duration-300`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-xs">
              <StepIcon className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 bg-white/10 px-2.5 py-0.5 rounded-full">
                  {isFrench ? currentStep.badgeFr : currentStep.badgeEn}
                </span>
                <span className="text-[11px] text-emerald-100 font-mono">
                  {currentStepIndex + 1} / {tourSteps.length}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1 leading-snug">
                {isFrench ? currentStep.titleFr : currentStep.titleEn}
              </h2>
            </div>
          </div>

          <button
            type="button"
            id="app-tour-close-button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer"
            title="Close Tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="bg-slate-100 px-5 sm:px-6 py-2.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto py-1">
            {tourSteps.map((step, idx) => (
              <button
                key={step.id}
                type="button"
                id={`app-tour-dot-${step.id}`}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2 transition-all rounded-full cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-7 sm:w-8 bg-[#064e3b]'
                    : idx < currentStepIndex
                    ? 'w-2 bg-emerald-600'
                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                title={`Go to step ${idx + 1}: ${step.titleEn}`}
              />
            ))}
          </div>
          <span className="text-xs text-slate-500 font-medium shrink-0 ml-2">
            {isFrench
              ? `Étape ${currentStepIndex + 1} sur ${tourSteps.length}`
              : `Step ${currentStepIndex + 1} of ${tourSteps.length}`}
          </span>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-white text-slate-700">
          <p className="text-sm sm:text-base leading-relaxed text-slate-700">
            {isFrench ? currentStep.descFr : currentStep.descEn}
          </p>

          {/* Feature Highlights Checklist */}
          <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isFrench ? 'Points Clés & Capacités :' : 'Key Features & Capabilities:'}
            </h4>
            <ul className="space-y-2">
              {(isFrench ? currentStep.featuresFr : currentStep.featuresEn).map(
                (feat, idx) => (
                  <li key={idx} className="flex items-start space-x-2.5 text-xs sm:text-sm text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{feat}</span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Contextual Action Button if available */}
          {currentStep.actionButton && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                id="app-tour-contextual-action"
                onClick={handleActionClick}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-[#064e3b] hover:bg-[#043d2e] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <span>
                  {isFrench
                    ? currentStep.actionButton.labelFr
                    : currentStep.actionButton.labelEn}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 px-5 sm:px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            id="app-tour-prev-button"
            onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentStepIndex === 0}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              currentStepIndex === 0
                ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400'
                : 'border-slate-300 text-slate-700 hover:bg-white hover:border-slate-400'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{isFrench ? 'Précédent' : 'Previous'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              id="app-tour-skip-button"
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 font-medium transition-colors cursor-pointer"
            >
              {isFrench ? 'Passer la visite' : 'Skip Tour'}
            </button>

            {currentStepIndex < tourSteps.length - 1 ? (
              <button
                type="button"
                id="app-tour-next-button"
                onClick={() =>
                  setCurrentStepIndex((prev) =>
                    Math.min(tourSteps.length - 1, prev + 1)
                  )
                }
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#064e3b] hover:bg-[#043d2e] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <span>{isFrench ? 'Suivant' : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                id="app-tour-finish-button"
                onClick={onClose}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isFrench ? 'Terminer' : 'Got it!'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
