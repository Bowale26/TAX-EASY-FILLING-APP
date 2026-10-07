import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, User, HelpCircle, ShieldAlert } from 'lucide-react';
import { AppTaxReturn } from '../types/tax';

interface TaxAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxReturn: AppTaxReturn;
  language: 'en' | 'fr';
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const TaxAssistantModal: React.FC<TaxAssistantModalProps> = ({
  isOpen,
  onClose,
  taxReturn,
  language,
}) => {
  const isFrench = language === 'fr';

  const initialGreeting: ChatMessage = {
    id: 'msg-init',
    sender: 'assistant',
    text: isFrench
      ? 'Bonjour! Je suis TaxFile, votre assistant fiscal intelligent et guide d’application. Je peux vous expliquer les fonctionnalités de l’application (numériseur IA par caméra, validation sectorielle SCIAN, chronologie d’audit Avant/Après, soumission NETFILE) ainsi que vos feuillets d’impôt (T4, T5, etc.) et vos déductions REER. Que puis-je clarifier pour vous?'
      : 'Hello! I am TaxFile, your Canadian AI tax assistant and app guide. I can explain any app feature (such as camera slip scanning & OCR, CRA NAICS industry benchmark cross-referencing, visual audit timeline with Before & After tracking, or NETFILE submission) as well as clarify all 19 CRA tax slips and deductions in plain language. How can I help you today?',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickPrompts = isFrench
    ? [
        'Comment imprimer le code QR et consulter le journal de partage?',
        'Comment fonctionne le bouton Partager et l’URL de vérification?',
        'Comment l’optimiseur fiscal IA maximise mon remboursement?',
        'Comment fonctionne le numériseur IA par caméra?',
        'Explique la validation sectorielle SCIAN / ARC',
        'Comment fonctionne la chronologie d’audit (Avant/Après)?',
        'C’est quoi la case 14 et 22 d’un T4?',
        'Comment les REER augmentent mon remboursement?',
        'Comment fonctionne la transmission NETFILE?',
      ]
    : [
        'How do I print the verification QR code or view the share log?',
        'How does the Share button and verification URL copy work?',
        'How does the AI Tax Optimizer maximize my refund?',
        'How does the Camera AI Scanner work?',
        'Explain CRA NAICS Industry Cross-Referencing',
        'How does the Visual Audit Timeline (Before/After) work?',
        'What are Box 14 and Box 22 on my T4?',
        'How does an RRSP increase my refund?',
        'How does certified NETFILE transmission work?',
      ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputVal.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          language,
          userContext: {
            province: taxReturn.personal.province,
            employmentIncome: taxReturn.calculation?.totalEmploymentIncome || 0,
            hasT4: taxReturn.t4Slips.length > 0,
            taxYear: taxReturn.taxYear,
          },
        }),
      });

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || (isFrench ? 'Je suis là pour vous aider avec vos questions fiscales.' : 'I am here to help with your Canadian tax questions.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: isFrench
          ? 'Désolé, une brève erreur de connexion est survenue. N’hésitez pas à poser une autre question sur vos feuillets ou vos déductions.'
          : 'Pardon me, a network error occurred. Please feel free to re-ask any question about your T-slips or tax deductions.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="tax-assistant-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col h-[650px] max-h-[92vh]">
        {/* Header - Deep Green & Deep Blue */}
        <div className="bg-linear-to-r from-[#064e3b] to-[#0b1f3a] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  {isFrench ? 'Assistant Fiscal IA' : 'AI Tax & App Guide'}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  TaxFile Engine
                </span>
              </div>
              <h2 className="text-base font-bold text-white">
                {isFrench ? 'Assistant TaxFile' : 'TaxFile AI Assistant'}
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

        {/* Disclaimer Bar */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-[11px] text-amber-800 flex items-center space-x-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            {isFrench
              ? 'Renseignements fiscaux généraux fournis à titre indicatif. Ne remplace pas les conseils d’un comptable agréé.'
              : 'General Canadian tax education based on CRA rules. Not formal accounting or legal advice.'}
          </span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {messages.map((msg) => {
            const isBot = msg.sender === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-2.5 ${
                  isBot ? 'justify-start' : 'justify-end'
                }`}
              >
                {isBot && (
                  <div className="w-8 h-8 rounded-lg bg-[#064e3b] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4 text-emerald-300" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isBot
                      ? 'bg-white text-slate-900 border border-slate-200'
                      : 'bg-[#0b1f3a] text-white'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span
                    className={`block text-[10px] mt-1 ${
                      isBot ? 'text-slate-400' : 'text-slate-300'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {!isBot && (
                  <div className="w-8 h-8 rounded-lg bg-[#0b1f3a] text-white flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-blue-300" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#064e3b] text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xs flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-100" />
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-200" />
                <span className="text-xs text-slate-500 ml-1">
                  {isFrench ? 'Consultation des règles de l’ARC...' : 'Checking CRA guidelines...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 bg-white border-t border-slate-200 flex items-center space-x-2 overflow-x-auto">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-full text-[11px] whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={
              isFrench
                ? 'Posez une question (ex. Comment déclarer mes cotisations REER?)...'
                : 'Ask anything (e.g. How does Box 14 affect my taxes?)...'
            }
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isLoading}
            className="px-4 py-2 rounded-xl bg-[#064e3b] hover:bg-[#08634c] text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isFrench ? 'Envoyer' : 'Send'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
