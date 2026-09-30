import { useEffect, useState } from 'react';
import { Bell, Phone, MessageCircle, X } from 'lucide-react';
import { useReminderSummary, useDueNow, useAcknowledgeFollowUp } from '../api/reminders';
import { useUpdateFollowUpStatus } from '../api/queries';
import { addDays } from 'date-fns';
import type { FollowUp } from '../types';

export default function RemindersWidget() {
  const { data: summary } = useReminderSummary();
  const { data: dueNow } = useDueNow();
  const [isOpen, setIsOpen] = useState(false);
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());
  
  const count = summary?.count || 0;

  useEffect(() => {
    document.title = count > 0 ? `(${count}) BoltBlazers ERP` : 'BoltBlazers ERP';
  }, [count]);

  useEffect(() => {
    if (Array.isArray(dueNow) && dueNow.length > 0) {
      dueNow.forEach(item => {
        if (!notifiedIds.has(item.id)) {
          // Native browser notification if permitted
          if (Notification.permission === 'granted') {
            new Notification(`Follow-up Due: ${item.leadName}`, {
              body: item.note,
            });
          }
          setNotifiedIds(prev => new Set(prev).add(item.id));
        }
      });
    }
  }, [dueNow, notifiedIds]);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-zinc-950">
            {count}
          </span>
        )}
      </button>

      {isOpen && summary && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col max-h-[80vh]">
          <div className="p-3 border-b border-gray-200 dark:border-zinc-700 font-semibold flex justify-between items-center dark:text-white">
            Reminders
            <button onClick={() => setIsOpen(false)}><X className="w-4 h-4 text-gray-500" /></button>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2 bg-gray-50 dark:bg-zinc-900/50">
            {count === 0 ? (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 p-4">All caught up!</p>
            ) : (
              <>
                {Array.isArray(summary?.overdue) && summary.overdue.map(item => <ReminderCard key={item.id} item={item} isOverdue />)}
                {Array.isArray(summary?.dueToday) && summary.dueToday.map(item => <ReminderCard key={item.id} item={item} />)}
              </>
            )}
          </div>
        </div>
      )}

      {/* Due Now Floating Toasts */}
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-50 space-y-2 pointer-events-none">
        {Array.isArray(dueNow) && dueNow.map(item => (
           <ReminderToast key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function ReminderCard({ item, isOverdue = false }: { item: FollowUp, isOverdue?: boolean }) {
  const updateStatus = useUpdateFollowUpStatus();
  const acknowledge = useAcknowledgeFollowUp();

  return (
    <div className="bg-white dark:bg-zinc-800 p-3 rounded shadow-sm border border-gray-200 dark:border-zinc-700 text-sm">
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold dark:text-white">{item.leadName}</span>
        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${isOverdue ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'}`}>
          {isOverdue ? 'Overdue' : 'Due'}
        </span>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-3">{item.note}</p>
      
      <div className="flex flex-wrap gap-2">
        <a href={`tel:${item.leadPhone}`} className="p-1.5 bg-gray-100 dark:bg-zinc-700 rounded text-blue-600 dark:text-blue-400"><Phone className="w-4 h-4" /></a>
        <a href={`https://wa.me/${item.leadPhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-1.5 bg-gray-100 dark:bg-zinc-700 rounded text-green-600 dark:text-green-400"><MessageCircle className="w-4 h-4" /></a>
        <button onClick={() => updateStatus.mutate({ id: item.id, status: 'Completed' })} className="px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded font-medium text-xs">Done</button>
        <button onClick={() => updateStatus.mutate({ id: item.id, status: 'Snoozed', newDate: addDays(new Date(), 1).toISOString() })} className="px-2 py-1 bg-gray-100 dark:bg-zinc-700 dark:text-gray-200 rounded font-medium text-xs">Snooze (1d)</button>
        <button onClick={() => acknowledge.mutate(item.id)} className="ml-auto p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

function ReminderToast({ item }: { item: FollowUp }) {
  const updateStatus = useUpdateFollowUpStatus();
  const acknowledge = useAcknowledgeFollowUp();

  return (
    <div className="pointer-events-auto w-full md:w-80 bg-white dark:bg-zinc-900 rounded-lg shadow-2xl border-l-4 border-blue-500 overflow-hidden transform transition-all p-4">
      <div className="flex justify-between items-start mb-1">
        <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
          <Bell className="w-4 h-4 text-blue-500" /> Due Now
        </h4>
        <button onClick={() => acknowledge.mutate(item.id)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>
      <p className="font-medium text-gray-800 dark:text-gray-200">{item.leadName}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{item.note}</p>
      <div className="flex flex-wrap gap-2">
        <a href={`tel:${item.leadPhone}`} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium flex items-center gap-1"><Phone className="w-3 h-3" /> Call</a>
        <a href={`https://wa.me/${item.leadPhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium flex items-center gap-1"><MessageCircle className="w-3 h-3" /> WhatsApp</a>
        <button onClick={() => updateStatus.mutate({ id: item.id, status: 'Completed' })} className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 dark:text-white rounded text-xs font-medium flex items-center gap-1">Done</button>
      </div>
    </div>
  );
}
