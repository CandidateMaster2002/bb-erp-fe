import React, { useState } from 'react';
import { 
  CheckSquare, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  X, 
  Check, 
  Compass, 
  ChevronDown 
} from 'lucide-react';
import { format, addDays, nextMonday } from 'date-fns';
import { 
  useBulkShiftTaskHorizon, 
  useBulkCompleteTasks, 
  useBulkCancelTasks, 
  useBulkDeleteTasks, 
  useBulkAssignDate 
} from '../api/tasks';
import type { Task, TimeHorizon } from '../api/tasks';

interface BulkTaskActionsBarProps {
  selectedTasks: Task[];
  onClearSelection: () => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
  totalCount: number;
}

export default function BulkTaskActionsBar({
  selectedTasks,
  onClearSelection,
  onSelectAll,
  isAllSelected,
  totalCount,
}: BulkTaskActionsBarProps) {
  const count = selectedTasks.length;

  const bulkShift = useBulkShiftTaskHorizon();
  const bulkComplete = useBulkCompleteTasks();
  const bulkCancel = useBulkCancelTasks();
  const bulkDelete = useBulkDeleteTasks();
  const bulkAssignDate = useBulkAssignDate();

  const [isHorizonMenuOpen, setIsHorizonMenuOpen] = useState(false);
  const [isAssignDateModalOpen, setIsAssignDateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Assign date modal state
  const [dateVal, setDateVal] = useState('');
  const [timeVal, setTimeVal] = useState('');
  const [horizonVal, setHorizonVal] = useState<TimeHorizon>('TODAY');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  if (count === 0) return null;

  const taskIds = selectedTasks.map(t => t.id);

  // 1. Shift Horizon
  const handleShiftHorizon = async (horizon: TimeHorizon) => {
    try {
      await bulkShift.mutateAsync({ ids: taskIds, horizon });
      showToast(`Moved ${count} actions to ${horizon.replace('_', ' ').toLowerCase()}!`);
      setIsHorizonMenuOpen(false);
      onClearSelection();
    } catch (err) {
      console.error(err);
      alert('Failed to shift horizon for tasks');
    }
  };

  // 2. Assign Date
  const handleAssignDateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateVal) return;

    const finalIso = timeVal 
      ? new Date(`${dateVal}T${timeVal}`).toISOString() 
      : new Date(dateVal).toISOString();

    try {
      await bulkAssignDate.mutateAsync({
        ids: taskIds,
        deadline: finalIso,
        horizon: horizonVal,
      });
      showToast(`Assigned date to ${count} actions!`);
      setIsAssignDateModalOpen(false);
      setDateVal('');
      setTimeVal('');
      onClearSelection();
    } catch (err) {
      console.error(err);
      alert('Failed to assign date to tasks');
    }
  };

  // 3. Complete
  const handleCompleteAll = async () => {
    try {
      await bulkComplete.mutateAsync(taskIds);
      showToast(`Completed ${count} actions!`);
      onClearSelection();
    } catch (err) {
      console.error(err);
      alert('Failed to complete tasks');
    }
  };

  // 4. Cancel
  const handleCancelAll = async () => {
    try {
      await bulkCancel.mutateAsync(taskIds);
      showToast(`Cancelled ${count} actions.`);
      onClearSelection();
    } catch (err) {
      console.error(err);
      alert('Failed to cancel tasks');
    }
  };

  // 5. Delete
  const handleDeleteAll = async () => {
    try {
      await bulkDelete.mutateAsync(taskIds);
      showToast(`Deleted ${count} actions.`);
      setIsDeleteModalOpen(false);
      onClearSelection();
    } catch (err) {
      console.error(err);
      alert('Failed to delete tasks');
    }
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

      {/* Floating Bulk Task Actions Bar */}
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

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 1. Shift Horizon Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsHorizonMenuOpen(!isHorizonMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600/70 rounded-lg text-xs font-medium transition"
              title="Shift Time Horizon"
            >
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span>Shift Horizon</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {isHorizonMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsHorizonMenuOpen(false)} />
                <div className="absolute right-0 bottom-full mb-2 w-44 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50 text-xs py-1">
                  <button
                    onClick={() => handleShiftHorizon('TODAY')}
                    className="w-full text-left px-3 py-2 hover:bg-zinc-700 flex items-center gap-2 text-gray-200"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Move to Today
                  </button>
                  <button
                    onClick={() => handleShiftHorizon('THIS_WEEK')}
                    className="w-full text-left px-3 py-2 hover:bg-zinc-700 flex items-center gap-2 text-gray-200"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500" /> Move to This Week
                  </button>
                  <button
                    onClick={() => handleShiftHorizon('THIS_MONTH')}
                    className="w-full text-left px-3 py-2 hover:bg-zinc-700 flex items-center gap-2 text-gray-200"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500" /> Move to This Month
                  </button>
                  <button
                    onClick={() => handleShiftHorizon('SOMEDAY')}
                    className="w-full text-left px-3 py-2 hover:bg-zinc-700 flex items-center gap-2 text-gray-200"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Move to Someday
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 2. Assign Date */}
          <button
            onClick={() => setIsAssignDateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600/70 rounded-lg text-xs font-medium transition"
            title="Assign or Reschedule Date"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Assign Date</span>
          </button>

          {/* 3. Complete */}
          <button
            onClick={handleCompleteAll}
            disabled={bulkComplete.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 rounded-lg text-xs font-medium transition"
            title="Mark all selected as completed"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Complete</span>
          </button>

          {/* 4. Cancel */}
          <button
            onClick={handleCancelAll}
            disabled={bulkCancel.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600/70 rounded-lg text-xs font-medium transition"
            title="Mark all selected as cancelled"
          >
            <XCircle className="w-3.5 h-3.5 text-gray-400" />
            <span>Cancel</span>
          </button>

          {/* 5. Delete */}
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
            title="Delete Selected Tasks"
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

      {/* MODAL: Assign / Reschedule Date */}
      {isAssignDateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  Assign Date in Bulk
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Updating deadline for {count} selected actions
                </p>
              </div>
              <button
                onClick={() => setIsAssignDateModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignDateSubmit} className="p-4 overflow-y-auto flex-1 space-y-4">
              {/* Quick Date Selection Buttons */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Fast Date Selection
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDateVal(format(new Date(), 'yyyy-MM-dd'));
                      setHorizonVal('TODAY');
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 transition text-left"
                  >
                    ⚡ Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDateVal(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
                      setHorizonVal('THIS_WEEK');
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 transition text-left"
                  >
                    🌅 Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDateVal(format(nextMonday(new Date()), 'yyyy-MM-dd'));
                      setHorizonVal('THIS_WEEK');
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 transition text-left"
                  >
                    📅 Next Monday
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDateVal(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
                      setHorizonVal('THIS_MONTH');
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 transition text-left"
                  >
                    ⏳ In 7 Days
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Specific Date & Time <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    required
                    value={dateVal}
                    onChange={(e) => setDateVal(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded-lg dark:bg-zinc-950 dark:border-zinc-700 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="time"
                    value={timeVal}
                    onChange={(e) => setTimeVal(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded-lg dark:bg-zinc-950 dark:border-zinc-700 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Target Time Horizon
                </label>
                <select
                  value={horizonVal}
                  onChange={(e) => setHorizonVal(e.target.value as TimeHorizon)}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-zinc-950 dark:border-zinc-700 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="TODAY">Today</option>
                  <option value="THIS_WEEK">This Week</option>
                  <option value="THIS_MONTH">This Month</option>
                  <option value="SOMEDAY">Someday (Backlog)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAssignDateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!dateVal || bulkAssignDate.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 shadow-sm"
                >
                  {bulkAssignDate.isPending ? 'Assigning...' : `Assign to ${count} Actions`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Bulk Delete Confirmation */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Delete {count} Actions?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                This will permanently delete all {count} selected actions and their subactions. This cannot be undone.
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
                onClick={handleDeleteAll}
                disabled={bulkDelete.isPending}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 shadow-sm"
              >
                {bulkDelete.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
