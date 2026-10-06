import { useState } from 'react';
import { useCreateLeadLog } from '../api/queries';
import { X, Calendar } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  leadId: string | number | null;
}

export default function ScheduleFollowUpModal({ isOpen, onClose, leadId }: Props) {
  const [comment, setComment] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');
  
  const createMutation = useCreateLeadLog();

  if (!isOpen || !leadId) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextAction.trim() && !comment.trim()) return;

    await createMutation.mutateAsync({
      leadId,
      log: {
        comment: comment.trim() || undefined,
        nextAction: nextAction.trim() || undefined,
        nextActionDate: nextActionDate ? new Date(nextActionDate).toISOString() : undefined,
      }
    });

    setComment('');
    setNextAction('');
    setNextActionDate('');
    onClose();
  };

  const handleSkip = () => {
    setComment('');
    setNextAction('');
    setNextActionDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Schedule Follow-up Action
          </h2>
          <button onClick={handleSkip} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Next Action
            </label>
            <input
              type="text"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="E.g., Send pricing email"
              className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={nextActionDate}
              onChange={(e) => setNextActionDate(e.target.value)}
              className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Comment (Context)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Client was happy, requested pricing..."
              rows={3}
              className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-2">
            <button 
              type="button" 
              onClick={handleSkip} 
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800 rounded-md transition"
            >
              Skip / No Follow-up
            </button>
            <button 
              type="submit"
              disabled={createMutation.isPending || (!nextAction.trim() && !comment.trim())}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition disabled:opacity-50"
            >
              {createMutation.isPending ? 'Saving...' : 'Save Follow-up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
