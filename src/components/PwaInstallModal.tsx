import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  X,
  Download,
  Share2,
  PlusSquare,
  CheckCircle2,
  Apple,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'fr';
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const isFrench = language === 'fr';

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceTab, setDeviceTab] = useState<'android' | 'ios'>('android');

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="pwa-install-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col">
        {/* Header - Deep Blue & Deep Green */}
        <div className="bg-linear-to-r from-[#0b1f3a] to-[#064e3b] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                {isFrench ? 'Application Mobile' : 'Mobile Application'}
              </span>
              <h2 className="text-base font-bold text-white">
                {isFrench ? 'Installer sur Android & iOS' : 'Download for Android & iOS'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="bg-slate-100 border-b border-slate-200 p-2 flex space-x-2">
          <button
            onClick={() => setDeviceTab('android')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
              deviceTab === 'android'
                ? 'bg-white text-[#064e3b] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="text-base">🤖</span>
            <span>Android (Google Chrome)</span>
          </button>

          <button
            onClick={() => setDeviceTab('ios')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
              deviceTab === 'ios'
                ? 'bg-white text-[#0b1f3a] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Apple className="w-4 h-4 text-slate-800" />
            <span>iPhone / iPad (iOS Safari)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs sm:text-sm">
          {isInstalled ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-emerald-950 text-sm">
                {isFrench ? 'Application déjà installée !' : 'App already installed!'}
              </h3>
              <p className="text-xs text-emerald-800">
                {isFrench
                  ? 'Tax Easy est installé sur votre appareil. Vous pouvez y accéder depuis votre écran d’accueil.'
                  : 'Tax Easy is running in standalone mode directly on your device.'}
              </p>
            </div>
          ) : (
            <>
              {deviceTab === 'android' && (
                <div className="space-y-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      1
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {isFrench ? 'Installation en 1 clic (si supporté)' : 'One-Click Instant Install'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isFrench
                          ? 'Appuyez sur le bouton ci-dessous pour ajouter l’application à vos applis Android.'
                          : 'Tap the button below to add Tax Easy directly to your Android device launcher.'}
                      </p>
                      {deferredPrompt && (
                        <button
                          onClick={handleNativeInstall}
                          className="mt-2 px-4 py-2 bg-[#064e3b] hover:bg-[#08634c] text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{isFrench ? 'Installer l’application' : 'Install App Now'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      2
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {isFrench ? 'Méthode Menu Chrome' : 'Chrome Menu Method'}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        {isFrench
                          ? 'Appuyez sur les trois points verticaux (⋮) en haut à droite de Chrome, puis sélectionnez « Ajouter à l’écran d’accueil » ou « Installer l’application ».'
                          : 'Tap the three dots (⋮) in the top-right of Google Chrome, then tap "Add to Home screen" or "Install App".'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {deviceTab === 'ios' && (
                <div className="space-y-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-[#0b1f3a] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      1
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <span>{isFrench ? 'Ouvrir dans Safari & Partager' : 'Open in Safari & Tap Share'}</span>
                        <Share2 className="w-4 h-4 text-blue-600 inline" />
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        {isFrench
                          ? 'Dans Safari sur iOS, touchez le bouton Partager au bas de l’écran.'
                          : 'In Apple Safari on iOS, tap the Share icon at the bottom of the screen.'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-[#0b1f3a] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      2
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <span>{isFrench ? 'Sur l’écran d’accueil' : 'Add to Home Screen'}</span>
                        <PlusSquare className="w-4 h-4 text-emerald-600 inline" />
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        {isFrench
                          ? 'Faites défiler le menu vers le bas et touchez « Sur l’écran d’accueil ».'
                          : 'Scroll down the options list and tap "Add to Home Screen".'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="bg-slate-100 rounded-xl p-3 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800">
              {isFrench ? 'Fonctionnalités mobiles incluses :' : 'Mobile Capabilities:'}
            </div>
            <ul className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
              <li>✓ {isFrench ? 'Numérisation par caméra' : 'Camera Slip OCR'}</li>
              <li>✓ {isFrench ? 'Mode hors-ligne local' : 'Offline local caching'}</li>
              <li>✓ {isFrench ? 'Chiffrement des données' : 'SOC-2 encryption standard'}</li>
              <li>✓ {isFrench ? 'Mises à jour automatiques' : 'Auto-sync & zero install size'}</li>
            </ul>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 transition-colors"
          >
            {isFrench ? 'Compris' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
