import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Users,
  UserCheck,
  Plus,
  Search,
  Building,
  CheckCircle2,
  Calendar,
  FileText,
  DollarSign,
  ArrowRight,
  Trash2,
  Copy,
  Edit2,
  Sparkles,
  ShieldCheck,
  Download,
  AlertCircle,
} from 'lucide-react';
import { AppTaxReturn, ProvinceCode } from '../types/tax';
import {
  ClientFileRecord,
  getSavedClientFiles,
  saveClientFile,
  deleteClientFile,
  createNewClientFile,
  getActiveClientId,
  setActiveClientId,
  DEFAULT_PREPARER_ID,
  DEFAULT_PREPARER_NAME,
} from '../utils/clientFilesManager';

interface ClientFileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTaxReturn: AppTaxReturn;
  onSwitchClient: (loadedReturn: AppTaxReturn) => void;
  language: 'en' | 'fr';
}

export const ClientFileManagerModal: React.FC<ClientFileManagerModalProps> = ({
  isOpen,
  onClose,
  currentTaxReturn,
  onSwitchClient,
  language,
}) => {
  const isFrench = language === 'fr';
  const [clients, setClients] = useState<ClientFileRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeId, setActiveId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Draft' | 'Review' | 'Filed'>('all');

  // Create new client form
  const [showNewClientForm, setShowNewClientForm] = useState<boolean>(false);
  const [newClientName, setNewClientName] = useState<string>('');
  const [newPreparerId, setNewPreparerId] = useState<string>(DEFAULT_PREPARER_ID);
  const [newProvince, setNewProvince] = useState<ProvinceCode>('ON');

  // Feedback notification
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Sync current taxReturn into clients list upon opening
  useEffect(() => {
    if (isOpen) {
      const all = getSavedClientFiles();
      const currentId = currentTaxReturn.clientId || getActiveClientId();
      setActiveId(currentId);

      // Make sure active return's latest state is saved in the record
      const idx = all.findIndex((c) => c.clientId === currentId);
      if (idx >= 0) {
        all[idx] = {
          ...all[idx],
          clientName: `${currentTaxReturn.personal?.firstName || 'Alex'} ${currentTaxReturn.personal?.lastName || 'Morgan'}`,
          preparerId: currentTaxReturn.preparerId || all[idx].preparerId || DEFAULT_PREPARER_ID,
          taxReturn: currentTaxReturn,
          lastModified: Date.now(),
        };
        saveClientFile(all[idx]);
      }
      setClients(all);
    }
  }, [isOpen, currentTaxReturn]);

  const filteredClients = clients.filter((c) => {
    if (statusFilter !== 'all' && c.filingStatus !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        c.clientName.toLowerCase().includes(q) ||
        c.clientId.toLowerCase().includes(q) ||
        c.preparerId.toLowerCase().includes(q) ||
        (c.notes || '').toLowerCase().includes(q) ||
        c.province.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSelectClient = (record: ClientFileRecord) => {
    // Save current tax return first before switching
    if (currentTaxReturn.clientId) {
      const currentRec = clients.find((c) => c.clientId === currentTaxReturn.clientId);
      if (currentRec) {
        saveClientFile({
          ...currentRec,
          taxReturn: currentTaxReturn,
          lastModified: Date.now(),
        });
      }
    }

    setActiveClientId(record.clientId);
    setActiveId(record.clientId);
    onSwitchClient(record.taxReturn);
    setNotice(
      isFrench
        ? `Dossier actif basculé vers : ${record.clientName} (${record.clientId})`
        : `Switched active client file to: ${record.clientName} (${record.clientId})`
    );
    setTimeout(() => {
      setNotice(null);
      onClose();
    }, 1200);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const created = createNewClientFile(newPreparerId.trim() || DEFAULT_PREPARER_ID, newClientName.trim(), newProvince);
    setClients(getSavedClientFiles());
    setShowNewClientForm(false);
    setNewClientName('');

    // Automatically switch to the newly created client file
    handleSelectClient(created);
  };

  const handleDeleteClient = (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (clients.length <= 1) {
      setNotice(isFrench ? 'Au moins un dossier client doit être conservé.' : 'At least one client file must be retained.');
      setTimeout(() => setNotice(null), 3000);
      return;
    }
    if (confirmDeleteId !== clientId) {
      setConfirmDeleteId(clientId);
      return;
    }

    deleteClientFile(clientId);
    setConfirmDeleteId(null);
    const updated = getSavedClientFiles();
    setClients(updated);
    setNotice(isFrench ? `Dossier ${clientId} supprimé.` : `Client file ${clientId} deleted.`);
    setTimeout(() => setNotice(null), 3000);

    if (activeId === clientId && updated.length > 0) {
      handleSelectClient(updated[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-xs overflow-y-auto"
        id="client-file-manager-backdrop"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden relative my-4"
          id="client-file-manager-modal-container"
        >
          {/* Header */}
          <div className="bg-linear-to-r from-[#0b1f3a] via-[#0d2a4e] to-[#064e3b] px-6 py-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-blue-300 border border-white/20 shadow-inner">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-200 border border-blue-400/30">
                    CPA MULTI-CLIENT MANAGER
                  </span>
                  <span className="text-[11px] font-mono text-emerald-300 font-bold">
                    PREPARER: {currentTaxReturn.preparerId || DEFAULT_PREPARER_ID}
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-white mt-0.5">
                  {isFrench ? 'Gestionnaire des Dossiers Clients Fiscaux' : 'Tax Client Files & Preparer Manager'}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              title={isFrench ? 'Fermer' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Client Banner & Notification */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-bold text-slate-500 uppercase">{isFrench ? 'Dossier Actif :' : 'Active Client File:'}</span>
              <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                {activeId || 'CLI-2025-001'}
              </span>
              <span className="font-semibold text-slate-800">
                {currentTaxReturn.personal?.firstName} {currentTaxReturn.personal?.lastName} ({currentTaxReturn.personal?.province || 'ON'})
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                id="btn-show-new-client-form"
                onClick={() => setShowNewClientForm(!showNewClientForm)}
                className="px-3 py-1.5 rounded-xl bg-[#064e3b] hover:bg-[#054030] text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isFrench ? 'Nouveau Dossier Client' : 'Create New Client File'}</span>
              </button>
            </div>
          </div>

          {notice && (
            <div className="bg-emerald-50 border-b border-emerald-300 px-6 py-2 text-xs text-emerald-900 font-medium flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {/* New Client Form Modal Drawer */}
          {showNewClientForm && (
            <div className="bg-blue-50/60 border-b border-blue-200 p-5 shrink-0">
              <form onSubmit={handleCreateClient} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-blue-900 uppercase flex items-center space-x-1.5">
                    <Plus className="w-4 h-4 text-blue-700" />
                    <span>{isFrench ? 'Créer un nouveau fichier fiscal client' : 'Create New Client Tax Return File'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewClientForm(false)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    {isFrench ? 'Annuler' : 'Cancel'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isFrench ? 'Nom complet du client' : 'Client Full Legal Name'}
                    </label>
                    <input
                      type="text"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="e.g., Jonathan Vance"
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isFrench ? 'Numéro de préparateur (EFILE/CPA)' : 'Tax Preparer ID'}
                    </label>
                    <input
                      type="text"
                      value={newPreparerId}
                      onChange={(e) => setNewPreparerId(e.target.value)}
                      placeholder="e.g., CPA-JENKINS-884920"
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isFrench ? 'Province au 31 décembre' : 'Province on Dec 31'}
                    </label>
                    <select
                      value={newProvince}
                      onChange={(e) => setNewProvince(e.target.value as ProvinceCode)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="ON">Ontario (ON)</option>
                      <option value="BC">British Columbia (BC)</option>
                      <option value="AB">Alberta (AB)</option>
                      <option value="QC">Quebec (QC)</option>
                      <option value="MB">Manitoba (MB)</option>
                      <option value="SK">Saskatchewan (SK)</option>
                      <option value="NS">Nova Scotia (NS)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {isFrench ? 'Créer et Basculer' : 'Create & Switch to File'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search & Filter Toolbar */}
          <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  isFrench
                    ? 'Rechercher par Client ID, nom, préparateur ou province...'
                    : 'Search by Client ID, client name, preparer ID, or province...'
                }
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 bg-white cursor-pointer"
              >
                <option value="all">{isFrench ? 'Tous les Statuts' : 'All Statuses'}</option>
                <option value="Draft">Draft</option>
                <option value="Review">Review</option>
                <option value="Filed">Filed</option>
              </select>
            </div>
          </div>

          {/* Clients List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-100/60 custom-scrollbar">
            {filteredClients.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-2xl border border-slate-200">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">
                  {isFrench ? 'Aucun dossier client correspondant trouvé' : 'No matching client files found'}
                </p>
              </div>
            ) : (
              filteredClients.map((client) => {
                const isActive = client.clientId === activeId;
                const refundOrOwing = client.taxReturn.calculation?.balanceOwingOrRefund ?? client.estimatedRefundOrOwing;
                const isRefund = refundOrOwing >= 0;

                return (
                  <div
                    key={client.clientId}
                    onClick={() => handleSelectClient(client)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white relative ${
                      isActive
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                        : 'border-slate-200 hover:border-blue-400 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start space-x-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isActive
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-[#0b1f3a] border border-slate-300'
                          }`}
                        >
                          {isActive ? <UserCheck className="w-5 h-5" /> : client.province}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2 flex-wrap">
                            <h3 className="font-extrabold text-sm text-slate-900">
                              {client.clientName}
                            </h3>
                            <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                              {client.clientId}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                client.filingStatus === 'Filed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : client.filingStatus === 'Review'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {client.filingStatus}
                            </span>
                            {isActive && (
                              <span className="text-[10px] font-bold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                {isFrench ? 'ACTIF' : 'ACTIVE'}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-500 mt-1 flex items-center space-x-3 flex-wrap">
                            <span>Preparer: <strong className="font-mono text-slate-700">{client.preparerId}</strong></span>
                            <span>•</span>
                            <span>Slips: <strong>{client.slipsCount || client.taxReturn.t4Slips.length}</strong></span>
                            <span>•</span>
                            <span>Prov: <strong>{client.province}</strong></span>
                          </div>

                          {client.notes && (
                            <p className="text-[11px] text-slate-500 mt-1.5 italic line-clamp-1">
                              {client.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right side: Refund and Action */}
                      <div className="flex items-center space-x-4 self-end sm:self-center shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-slate-400">
                            {isRefund ? (isFrench ? 'Remboursement' : 'Est. Refund') : (isFrench ? 'Solde à payer' : 'Balance Owing')}
                          </div>
                          <div
                            className={`text-sm font-mono font-black ${
                              isRefund ? 'text-[#064e3b]' : 'text-slate-900'
                            }`}
                          >
                            {isRefund ? '+' : '-'}${Math.abs(refundOrOwing).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {confirmDeleteId === client.clientId ? (
                            <div className="flex items-center space-x-1 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                              <span className="text-[10px] text-rose-700 font-semibold">
                                {isFrench ? 'Supprimer ?' : 'Delete?'}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteClient(client.clientId, e)}
                                className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded hover:bg-rose-700 cursor-pointer"
                              >
                                {isFrench ? 'Oui' : 'Yes'}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(null);
                                }}
                                className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded hover:bg-slate-300 cursor-pointer"
                              >
                                {isFrench ? 'Non' : 'No'}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteClient(client.clientId, e)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title={isFrench ? 'Supprimer le dossier client' : 'Delete client file'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-[#0b1f3a] text-white hover:bg-[#132c4f]'
                            }`}
                          >
                            <span>{isActive ? (isFrench ? 'Sélectionné' : 'Active') : (isFrench ? 'Basculer' : 'Switch')}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-500">
              <span>{clients.length} {isFrench ? 'dossiers clients enregistrés en session locale' : 'saved client returns in local session'}</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              {isFrench ? 'Fermer' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
