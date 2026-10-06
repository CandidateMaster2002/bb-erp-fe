import { X, ClipboardList } from 'lucide-react';
import LeadActivityLog from './LeadActivityLog';

export default function LeadLogsModal({ 
  isOpen, 
  onClose, 
  leadId,
  leadName
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  leadId: string;
  leadName?: string;
}) {
  if (!isOpen || !leadId) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-zinc-800 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Logs for {leadName || `#${leadId}`}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-gray-50 dark:bg-zinc-900/50">
          <LeadActivityLog leadId={leadId} />
        </div>
      </div>
    </div>
  );
}
