import React, { useState } from 'react';
import { 
  Tag, 
  Calendar, 
  Trash2, 
  X, 
  Check, 
  Copy, 
  Download, 
  CheckSquare, 
  MessageSquare,
  ChevronDown
} from 'lucide-react';
import { format, addDays, nextMonday } from 'date-fns';
import { 
  useCategories, 
  useBulkUpdateLeadCategories, 
  useBulkCreateLeadLogs, 
  useBulkDeleteLeads 
} from '../api/queries';
import type { Lead } from '../types';

interface BulkActionsBarProps {
  selectedLeads: Lead[];
  onClearSelection: () => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
  totalCount: number;
  recordType?: 'LEAD' | 'COLLABORATOR';
}

export default function BulkActionsBar({
  selectedLeads,
  onClearSelection,
  onSelectAll,
  isAllSelected,
  totalCount,
  recordType = 'LEAD',
}: BulkActionsBarProps) {
  const count = selectedLeads.length;

  const { data: categoryGroups } = useCategories(recordType);
  const bulkUpdateCategories = useBulkUpdateLeadCategories();
  const bulkCreateLogs = useBulkCreateLeadLogs();
  const bulkDeleteLeads = useBulkDeleteLeads();

  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCopyMenuOpen, setIsCopyMenuOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Category modal state
  const [selectedCatIds, setSelectedCatIds] = useState<number[]>([]);
  const [categoryMode, setCategoryMode] = useState<'merge' | 'replace_group'>('merge');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  // Schedule modal state
  const [nextActionTitle, setNextActionTitle] = useState('');
  const [actionDateVal, setActionDateVal] = useState('');
  const [actionTimeVal, setActionTimeVal] = useState('');
  const [actionComment, setActionComment] = useState('');

  // Log modal state
  const [logComment, setLogComment] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  if (count === 0) return null;

  // --- Handlers ---

  // 1. Bulk Category Apply
  const handleApplyCategories = async () => {
    if (selectedCatIds.length === 0) return;

    let groupValueIds: number[] = [];
    if (categoryMode === 'replace_group' && selectedGroupId && categoryGroups) {
      const group = categoryGroups.find(g => Number(g.id) === selectedGroupId);
      if (group?.values) {
        groupValueIds = group.values.map(v => Number(v.id));
      }
    }

    try {
      await bulkUpdateCategories.mutateAsync({
        leads: selectedLeads,
        categoryIdsToApply: selectedCatIds,
        mode: categoryMode,
        groupValueIdsToReplace: groupValueIds,
      });
      showToast(`Updated categories for ${count} ${recordType.toLowerCase()}s!`);
      setIsCategoryModalOpen(false);
      setSelectedCatIds([]);
      onClearSelection();
    } catch (err) {
      console.error(err);
      alert('Failed to update categories in bulk');
    }
  };

  // 2. Bulk Schedule Action
  const handleScheduleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextActionTitle.trim() && !actionComment.trim()) return;

    const finalIso = actionDateVal 
      ? (actionTimeVal ? new Date(`${actionDateVal}T${actionTimeVal}`).toISOString() : new Date(actionDateVal).toISOString())
      : undefined;

    try {
      await bulkCreateLogs.mutateAsync({
        leadIds: selectedLeads.map(l => l.id),
        log: {
          nextAction: nextActionTitle.trim() || undefined,
          nextActionDate: finalIso,
          comment: actionComment.trim() || undefined,
        }
      });
      showToast(`Scheduled action for ${count} ${recordType.toLowerCase()}s!`);
      setIsScheduleModalOpen(false);
      setNextActionTitle('');
      setActionDateVal('');
      setActionTimeVal('');
      setActionComment('');
      onClearSelection();
    } catch (err) {
      console.error(err);
      alert('Failed to schedule bulk action');
    }
  };

  // 3. Bulk Log Note
  const handleBulkLogNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logComment.trim()) return;

    try {
      await bulkCreateLogs.mutateAsync({
        leadIds: selectedLeads.map(l => l.id),
        log: {
          comment: logComment.trim(),
        }
      });
      showToast(`Logged note for ${count} ${recordType.toLowerCase()}s!`);
      setIsLogModalOpen(false);
      setLogComment('');
      onClearSelection();
    } catch (err) {
      console.error(err);
      alert('Failed to log bulk note');
    }
  };

  // 4. Bulk Delete
  const handleBulkDelete = async () => {
    try {
      await bulkDeleteLeads.mutateAsync(selectedLeads.map(l => l.id));
      showToast(`Deleted ${count} ${recordType.toLowerCase()}s.`);
      setIsDeleteModalOpen(false);
      onClearSelection();
    } catch (err) {
      console.error(err);
      alert('Failed to delete leads');
    }
  };

  // 5. Copy Phone Numbers
  const handleCopyPhones = () => {
    const phones = selectedLeads
      .map(l => l.mobileNumber?.trim())
      .filter((p): p is string => Boolean(p));

    if (phones.length === 0) {
      showToast('No phone numbers available to copy.');
      return;
    }
    navigator.clipboard.writeText(phones.join(', '));
    showToast(`Copied ${phones.length} phone numbers to clipboard!`);
    setIsCopyMenuOpen(false);
  };

  // 6. Copy Emails
  const handleCopyEmails = () => {
    const emails = selectedLeads
      .map(l => l.personalEmail?.trim())
      .filter((e): e is string => Boolean(e));

    if (emails.length === 0) {
      showToast('No email addresses available to copy.');
      return;
    }
    navigator.clipboard.writeText(emails.join(', '));
    showToast(`Copied ${emails.length} emails to clipboard!`);
    setIsCopyMenuOpen(false);
  };

  // 7. Copy LinkedIn URLs
  const handleCopyLinkedIn = () => {
    const urls = selectedLeads
      .map(l => l.linkedinUrl?.trim())
      .filter((u): u is string => Boolean(u));

    if (urls.length === 0) {
      showToast('No LinkedIn URLs available to copy.');
      return;
    }
    navigator.clipboard.writeText(urls.join('\n'));
    showToast(`Copied ${urls.length} LinkedIn links to clipboard!`);
    setIsCopyMenuOpen(false);
  };

  // 8. Export CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Full Name', 'Company', 'Job Title', 'Mobile Number', 'Email', 'LinkedIn', 'Categories'];
    const rows = selectedLeads.map(l => [
      `"${l.id}"`,
      `"${(l.fullName || '').replace(/"/g, '""')}"`,
      `"${(l.company || '').replace(/"/g, '""')}"`,
      `"${(l.jobTitle || '').replace(/"/g, '""')}"`,
      `"${(l.mobileNumber || '').replace(/"/g, '""')}"`,
      `"${(l.personalEmail || '').replace(/"/g, '""')}"`,
      `"${(l.linkedinUrl || '').replace(/"/g, '""')}"`,
      `"${(l.categories || []).map(c => c.name).join('; ')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${recordType.toLowerCase()}s_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${count} ${recordType.toLowerCase()}s to CSV!`);
    setIsCopyMenuOpen(false);
  };

  return (
    <>
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] bg-zinc-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-zinc-700 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-6 left-3 right-3 md:left-72 md:right-8 z-40 bg-zinc-900/95 dark:bg-zinc-800/95 text-white p-2.5 sm:p-3 rounded-2xl shadow-2xl border border-zinc-700/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5 transition-all">
        {/* Left: Count & Select All */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2.5 py-1 rounded-lg text-xs font-semibold">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{count} Selected</span>
          </div>

          <button
            onClick={onSelectAll}
            className="text-xs text-gray-300 hover:text-white underline font-medium transition px-1"
          >
            {isAllSelected ? 'Deselect All' : `Select All (${totalCount})`}
          </button>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 1. Category / Campaign */}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600/70 rounded-lg text-xs font-medium transition"
            title="Bulk Update Categories or Campaigns"
          >
            <Tag className="w-3.5 h-3.5 text-blue-400" />
            <span>Campaign / Tag</span>
          </button>

          {/* 2. Schedule Follow-up */}
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600/70 rounded-lg text-xs font-medium transition"
            title="Schedule Follow-up Action for all selected"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Schedule</span>
          </button>

          {/* 3. Log Note */}
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600/70 rounded-lg text-xs font-medium transition"
            title="Log Interaction Note for all selected"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Log Note</span>
          </button>

          {/* 4. Copy / Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsCopyMenuOpen(!isCopyMenuOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600/70 rounded-lg text-xs font-medium transition"
              title="Copy or Export Data"
            >
              <Copy className="w-3.5 h-3.5 text-sky-400" />
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {isCopyMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsCopyMenuOpen(false)} />
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50 text-xs py-1">
                  <button
                    onClick={handleCopyPhones}
                    className="w-full text-left px-3 py-2 hover:bg-zinc-700 flex items-center gap-2 text-gray-200"
                  >
                    <Copy className="w-3.5 h-3.5 text-gray-400" /> Copy Phone Numbers
                  </button>
                  <button
                    onClick={handleCopyEmails}
                    className="w-full text-left px-3 py-2 hover:bg-zinc-700 flex items-center gap-2 text-gray-200"
                  >
                    <Copy className="w-3.5 h-3.5 text-gray-400" /> Copy Emails
                  </button>
                  <button
                    onClick={handleCopyLinkedIn}
                    className="w-full text-left px-3 py-2 hover:bg-zinc-700 flex items-center gap-2 text-gray-200"
                  >
                    <Copy className="w-3.5 h-3.5 text-gray-400" /> Copy LinkedIn Links
                  </button>
                  <hr className="border-zinc-700 my-1" />
                  <button
                    onClick={handleExportCsv}
                    className="w-full text-left px-3 py-2 hover:bg-zinc-700 flex items-center gap-2 text-emerald-400 font-medium"
                  >
                    <Download className="w-3.5 h-3.5" /> Download CSV
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 5. Delete Button */}
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
            title="Delete Selected"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>

          {/* Clear Button */}
          <button
            onClick={onClearSelection}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-zinc-700 rounded-lg transition ml-1"
            title="Clear Selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MODAL 1: Bulk Category Assignment */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  Assign Categories / Campaign
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Updating {count} selected {recordType.toLowerCase()}s
                </p>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {/* Mode Selector */}
              <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setCategoryMode('merge')}
                  className={`flex-1 py-1.5 px-2 rounded-md font-medium transition ${
                    categoryMode === 'merge'
                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Add to existing tags
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryMode('replace_group')}
                  className={`flex-1 py-1.5 px-2 rounded-md font-medium transition ${
                    categoryMode === 'replace_group'
                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Replace in group
                </button>
              </div>

              {/* Category Groups */}
              <div className="space-y-4">
                {Array.isArray(categoryGroups) && categoryGroups.map(group => (
                  <div key={group.id} className="space-y-2">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {group.name}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.values?.map(val => {
                        const valId = Number(val.id);
                        const isSelected = selectedCatIds.includes(valId);
                        return (
                          <button
                            key={val.id}
                            type="button"
                            onClick={() => {
                              setSelectedGroupId(Number(group.id));
                              if (isSelected) {
                                setSelectedCatIds(prev => prev.filter(id => id !== valId));
                              } else {
                                setSelectedCatIds(prev => [...prev, valId]);
                              }
                            }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                              isSelected
                                ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800 font-semibold ring-1 ring-blue-500'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700'
                            }`}
                          >
                            {val.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-2 bg-gray-50 dark:bg-zinc-800/50">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCategories}
                disabled={selectedCatIds.length === 0 || bulkUpdateCategories.isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 shadow-sm"
              >
                {bulkUpdateCategories.isPending ? 'Applying...' : `Apply to ${count} Leads`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Bulk Schedule Follow-Up */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  Schedule Follow-up Action
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Creating follow-up for {count} selected {recordType.toLowerCase()}s
                </p>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleAction} className="p-4 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Action Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nextActionTitle}
                  onChange={(e) => setNextActionTitle(e.target.value)}
                  placeholder="E.g., Follow up on proposal email"
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-zinc-950 dark:border-zinc-700 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>

              {/* Fast Date Selection Buttons */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Quick Date Selection
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionDateVal(format(new Date(), 'yyyy-MM-dd'))}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 transition text-left"
                  >
                    ⚡ Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionDateVal(format(addDays(new Date(), 1), 'yyyy-MM-dd'))}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 transition text-left"
                  >
                    🌅 Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionDateVal(format(nextMonday(new Date()), 'yyyy-MM-dd'))}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 transition text-left"
                  >
                    📅 Next Monday
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionDateVal(format(addDays(new Date(), 7), 'yyyy-MM-dd'))}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 transition text-left"
                  >
                    ⏳ In 7 Days
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Due Date & Time
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={actionDateVal}
                    onChange={(e) => setActionDateVal(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded-lg dark:bg-zinc-950 dark:border-zinc-700 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="time"
                    value={actionTimeVal}
                    onChange={(e) => setActionTimeVal(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded-lg dark:bg-zinc-950 dark:border-zinc-700 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Note / Comment (Optional)
                </label>
                <textarea
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  placeholder="Notes about this scheduled follow-up..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-zinc-950 dark:border-zinc-700 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!nextActionTitle.trim() || bulkCreateLogs.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 shadow-sm"
                >
                  {bulkCreateLogs.isPending ? 'Scheduling...' : `Schedule for ${count} Leads`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Bulk Log Note */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  Log Interaction Note
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Adding note to {count} selected {recordType.toLowerCase()}s
                </p>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkLogNote} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Note / Summary <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={logComment}
                  onChange={(e) => setLogComment(e.target.value)}
                  placeholder="E.g., Sent outreach email batch via campaign"
                  rows={4}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-zinc-950 dark:border-zinc-700 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!logComment.trim() || bulkCreateLogs.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 shadow-sm"
                >
                  {bulkCreateLogs.isPending ? 'Saving...' : `Log for ${count} Leads`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Bulk Delete Confirmation */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Delete {count} {recordType === 'COLLABORATOR' ? 'Collaborators' : 'Leads'}?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                This will permanently delete all {count} selected records and their associated interaction logs. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkDeleteLeads.isPending}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 shadow-sm"
              >
                {bulkDeleteLeads.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
