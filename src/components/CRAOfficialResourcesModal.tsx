import React, { useState, useEffect, useTransition } from 'react';
import {
  ExternalLink,
  X,
  HelpCircle,
  Shield,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  FileText,
  Tag,
  Sparkles,
  ArrowRight,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import { OFFICIAL_CRA_LINKS } from '../services/taxRules';
import {
  CRATaxGuideline,
  searchCRATaxGuidelines,
  CRA_TAX_GUIDELINES_DATABASE,
} from '../services/craTaxGuidelineIndex';

interface CRAOfficialResourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'fr';
}

export const CRAOfficialResourcesModal: React.FC<CRAOfficialResourcesModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const isFrench = language === 'fr';

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [guidelines, setGuidelines] = useState<CRATaxGuideline[]>(CRA_TAX_GUIDELINES_DATABASE);
  const [selectedGuideline, setSelectedGuideline] = useState<CRATaxGuideline | null>(
    CRA_TAX_GUIDELINES_DATABASE[0] || null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<'guidelines' | 'generalFaqs' | 'links'>('guidelines');

  // Categories list
  const categories = [
    { id: 'all', labelEn: 'All Terms', labelFr: 'Tous les termes' },
    { id: 't4_slips', labelEn: 'T4 Slips', labelFr: 'Feuillets T4' },
    { id: 'deductions', labelEn: 'Deductions', labelFr: 'Déductions' },
    { id: 'credits', labelEn: 'Credits', labelFr: 'Crédits' },
    { id: 'other_slips', labelEn: 'Other Slips', labelFr: 'Autres feuillets' },
    { id: 'cra_general', labelEn: 'CRA General', labelFr: 'Généralités ARC' },
  ];

  // Fetch guidelines through simulated local search index
  useEffect(() => {
    let isMounted = true;
    setIsSearching(true);

    const timer = setTimeout(() => {
      searchCRATaxGuidelines(searchQuery, activeCategory)
        .then((results) => {
          if (isMounted) {
            setGuidelines(results);
            setIsSearching(false);
            // If current selection is not in the new results, select the first result
            if (results.length > 0) {
              setSelectedGuideline((prev) => {
                const stillExists = results.some((r) => r.id === prev?.id);
                return stillExists ? prev : results[0];
              });
            } else {
              setSelectedGuideline(null);
            }
          }
        })
        .catch(() => {
          if (isMounted) setIsSearching(false);
        });
    }, 120);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, activeCategory]);

  const faqs = isFrench
    ? [
        {
          q: 'Quand dois-je produire ma déclaration de revenus?',
          a: 'Pour l’année d’imposition 2024/2025, la date limite de production pour la majorité des particuliers est le 30 avril. Pour les travailleurs indépendants ou conjoints de travailleurs indépendants, la déclaration est due le 15 juin, mais tout solde dû doit être réglé au plus tard le 30 avril.',
        },
        {
          q: 'Qu’est-ce que le service NETFILE de l’ARC?',
          a: 'NETFILE est le service de transmission électronique sécurisé de l’ARC permettant aux particuliers d’envoyer leur déclaration directement par Internet. Les déclarations produites par NETFILE reçoivent généralement leur remboursement en aussi peu que 8 jours ouvrables.',
        },
        {
          q: 'Comment fonctionne le montant personnel de base?',
          a: 'Le montant personnel de base fédéral pour 2025 est de 15 705 $. Il s’agit d’un crédit d’impôt non remboursable qui garantit qu’aucun impôt fédéral sur le revenu n’est payé sur les premiers 15 705 $ de revenu imposable.',
        },
        {
          q: 'Mes données personnelles et mon NAS sont-ils protégés?',
          a: 'Oui. Vos renseignements sont protégés selon les normes de chiffrement les plus strictes. Votre numéro d’assurance sociale (NAS) est masqué et n’est jamais partagé publiquement ou consigné dans des journaux informatiques non chiffrés.',
        },
      ]
    : [
        {
          q: 'When is the Canadian personal tax filing deadline?',
          a: 'For the 2024/2025 tax year, the deadline for most Canadian residents is April 30. If you or your spouse are self-employed, you have until June 15 to file, but any tax balance owing must still be paid by April 30 to avoid interest.',
        },
        {
          q: 'What is CRA NETFILE and how does it work?',
          a: 'NETFILE is the Canada Revenue Agency’s secure electronic transmission service. It allows Canadian taxpayers to transmit their personal T1 return directly to the CRA over the Internet. Refunds filed via NETFILE are typically deposited in as little as 8 business days.',
        },
        {
          q: 'What is the Federal Basic Personal Amount?',
          a: 'The Federal Basic Personal Amount for 2025 is $15,705. It is a non-refundable tax credit (calculated at 15%), meaning all Canadian residents can earn up to $15,705 before paying any federal income tax.',
        },
        {
          q: 'How does Computer Vision slip scanning protect my data?',
          a: 'Computer Vision extracts text and box numbers locally and through secure server-side encrypted processing. The app never silently inputs financial data—you review and verify every box before it becomes part of your calculation.',
        },
      ];

  if (!isOpen) return null;

  return (
    <div
      id="cra-resources-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden flex flex-col h-[90vh] max-h-[850px]">
        {/* Header */}
        <div className="bg-linear-to-r from-[#064e3b] via-[#093528] to-[#0b1f3a] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  {isFrench ? 'Ressources & Guides Fiscaux ARC' : 'Official CRA Guides & Tax Terms'}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-1.5 py-0.2 rounded">
                  {isFrench ? 'Index 2025' : '2025 Index'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {isFrench
                  ? 'Foire Aux Questions & Lexique des Feuillets de l’ARC'
                  : 'CRA Tax Glossary, Searchable FAQ & Official Guidelines'}
              </h2>
            </div>
          </div>

          <button
            id="close-cra-resources-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isFrench ? 'Fermer' : 'Close modal'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 text-xs text-amber-950 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="text-[11px] sm:text-xs">
              <strong>{isFrench ? 'Avis de conformité :' : 'CRA Compliance Notice:'}</strong>{' '}
              {isFrench
                ? 'Données fiscales synchronisées avec les barèmes officiels de l’ARC pour l’année d’imposition 2024/2025.'
                : 'Tax guidelines and rate caps verified against official CRA schedules for the 2024/2025 filing year.'}
            </span>
          </div>

          {/* Navigation View Switcher */}
          <div className="flex items-center space-x-1 bg-amber-100/70 p-0.5 rounded-lg text-[11px] font-semibold text-amber-900 shrink-0 ml-2">
            <button
              onClick={() => setActiveTab('guidelines')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                activeTab === 'guidelines'
                  ? 'bg-white shadow-xs text-slate-900 font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              {isFrench ? 'Lexique & Feuillets' : 'Slip Terms & Guidelines'}
            </button>
            <button
              onClick={() => setActiveTab('generalFaqs')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                activeTab === 'generalFaqs'
                  ? 'bg-white shadow-xs text-slate-900 font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              FAQ
            </button>
            <button
              onClick={() => setActiveTab('links')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                activeTab === 'links'
                  ? 'bg-white shadow-xs text-slate-900 font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              {isFrench ? 'Portails ARC' : 'CRA Portals'}
            </button>
          </div>
        </div>

        {/* Main Modal Body */}
        {activeTab === 'guidelines' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Searchable Sidebar */}
            <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col bg-slate-50/50 shrink-0">
              {/* Search Box */}
              <div className="p-3.5 border-b border-slate-200 bg-white space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="cra-faq-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      isFrench
                        ? 'Rechercher une case (ex: Case 14, REER, AE)...'
                        : 'Search tax terms (e.g. Box 14, CPP, RRSP)...'
                    }
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                      title={isFrench ? 'Effacer la recherche' : 'Clear search'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Filters */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      id={`cra-faq-cat-${cat.id}`}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        activeCategory === cat.id
                          ? 'bg-[#064e3b] text-white font-bold shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {isFrench ? cat.labelFr : cat.labelEn}
                    </button>
                  ))}
                </div>

                {/* Status bar */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSearching ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                      }`}
                    />
                    <span>
                      {isSearching
                        ? isFrench
                          ? 'Indexation en cours...'
                          : 'Indexing guidelines...'
                        : isFrench
                        ? `${guidelines.length} résultat(s) indexé(s)`
                        : `${guidelines.length} tax terms found`}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    CRA Index v2025
                  </span>
                </div>
              </div>

              {/* Guidelines List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1">
                {guidelines.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600">
                      {isFrench
                        ? `Aucun terme trouvé pour « ${searchQuery} »`
                        : `No tax guidelines found for "${searchQuery}"`}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {isFrench
                        ? 'Essayez avec "T4", "Case 14", "REER" ou "RPC".'
                        : 'Try searching for "Box 14", "CPP", "EI", or "Tuition".'}
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setActiveCategory('all');
                      }}
                      className="text-xs text-emerald-700 hover:underline font-bold pt-1 cursor-pointer"
                    >
                      {isFrench ? 'Réinitialiser les filtres' : 'Reset search filters'}
                    </button>
                  </div>
                ) : (
                  guidelines.map((item) => {
                    const isSelected = selectedGuideline?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`cra-guideline-item-${item.id}`}
                        onClick={() => setSelectedGuideline(item)}
                        className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer space-y-1 ${
                          isSelected
                            ? 'bg-emerald-50/80 border border-emerald-300 shadow-xs'
                            : 'hover:bg-slate-100/80 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                              isSelected
                                ? 'bg-emerald-200 text-emerald-900'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {item.craLine}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isFrench ? item.categoryLabelFr : item.categoryLabelEn}
                          </span>
                        </div>
                        <h4
                          className={`text-xs font-bold ${
                            isSelected ? 'text-emerald-950' : 'text-slate-800'
                          }`}
                        >
                          {isFrench ? item.termFr : item.termEn}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {isFrench ? item.summaryFr : item.summaryEn}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Guideline Details Pane */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 bg-white space-y-5">
              {selectedGuideline ? (
                <>
                  {/* Top Badge & Line Number */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold bg-[#064e3b] text-white px-2.5 py-1 rounded-lg">
                        {selectedGuideline.craLine}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {isFrench
                          ? selectedGuideline.categoryLabelFr
                          : selectedGuideline.categoryLabelEn}
                      </span>
                    </div>

                    <a
                      href={selectedGuideline.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center space-x-1"
                    >
                      <span>{isFrench ? 'Page officielle Canada.ca' : 'Official Canada.ca Guide'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Title & Overview Card */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      {isFrench ? selectedGuideline.termFr : selectedGuideline.termEn}
                    </h3>
                    <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs text-emerald-950 leading-relaxed font-medium">
                      {isFrench ? selectedGuideline.summaryFr : selectedGuideline.summaryEn}
                    </div>
                  </div>

                  {/* Detailed Description */}
                  <div className="space-y-2">
                    <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-700">
                      {isFrench ? 'Lignes directrices & Explications de l’ARC' : 'CRA Guidelines & Explanations'}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {isFrench ? selectedGuideline.contentFr : selectedGuideline.contentEn}
                    </p>
                  </div>

                  {/* Key CRA Rules Checklist */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-700 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{isFrench ? 'Règles & Plafonds Légaux 2025' : 'Key Statutory Rules & Caps (2025)'}</span>
                    </h4>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                      {(isFrench ? selectedGuideline.keyRulesFr : selectedGuideline.keyRulesEn).map(
                        (rule, idx) => (
                          <div key={idx} className="flex items-start space-x-2 text-xs text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                            <span>{rule}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Quick Filing Tip */}
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start space-x-2.5 text-xs text-blue-950">
                    <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>{isFrench ? 'Conseil pour votre déclaration :' : 'Filing Pro Tip:'}</strong>{' '}
                      {isFrench
                        ? 'Lorsque vous saisissez vos feuillets T4 ou d’autres reçus, assurez-vous que les cases correspondent exactement aux feuillets émis par votre payeur pour éviter les vérifications post-cotisation de l’ARC.'
                        : 'When entering your tax slips or OCR-scanning documents, verify that each box aligns with your official paper or CRA My Account tax documents to ensure automatic NETFILE matching.'}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-center p-8 text-slate-400">
                  <div className="space-y-2">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-600">
                      {isFrench
                        ? 'Sélectionnez un terme dans le menu de gauche'
                        : 'Select a tax term from the left sidebar'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* General FAQ Tab View */}
        {activeTab === 'generalFaqs' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-emerald-700" />
                <span>
                  {isFrench
                    ? 'Questions Fréquentes sur la Déclaration Canadienne'
                    : 'Frequently Asked Questions on Canadian Tax Returns'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {isFrench
                  ? 'Réponses rapides aux questions courantes sur les dates limites, les remboursements et NETFILE.'
                  : 'Quick answers regarding personal deadlines, refund timelines, and CRA NETFILE.'}
              </p>
            </div>

            <div className="space-y-2.5">
              {faqs.map((faq, idx) => {
                const isExpanded = expandedFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 transition-colors"
                  >
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                      className="w-full text-left px-4 py-3 font-semibold text-xs sm:text-sm text-slate-900 flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-3 text-xs text-slate-600 leading-relaxed bg-white border-t border-slate-100">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Official Links Tab View */}
        {activeTab === 'links' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                {isFrench ? 'Liens Directs vers Canada.ca et l’ARC' : 'Direct Canada.ca & CRA Portal Links'}
              </h3>
              <p className="text-xs text-slate-500">
                {isFrench
                  ? 'Consultez les guides officiels, votre dossier Mon dossier ARC et les formulaires prescrits.'
                  : 'Access official CRA guidance, My Account portals, and statutory schedules.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {OFFICIAL_CRA_LINKS.map((link) => (
                <a
                  key={link.id}
                  id={`cra-link-${link.id}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-xl flex items-center justify-between group transition-all"
                >
                  <div className="pr-2 space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#064e3b] transition-colors">
                      {isFrench ? link.titleFr : link.titleEn}
                    </h4>
                    <span className="text-[10px] text-slate-400">canada.ca/services/taxes</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#064e3b] shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            {isFrench
              ? 'Besoin d’aide supplémentaire? Utilisez le Juge IA ou le conseiller fiscal.'
              : 'Need additional tax calculation review? Check the A2A Judge or AI Assistant.'}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 transition-colors cursor-pointer ml-auto"
          >
            {isFrench ? 'Fermer' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
