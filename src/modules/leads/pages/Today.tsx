import { useState } from 'react';
import { useTodayDashboard, useUpdateFollowUpStatus } from '../api/queries';
import { Phone, MessageCircle, CheckCircle2, Clock, CalendarIcon, Repeat } from 'lucide-react';
import type { FollowUp } from '../types';
import { format, addDays } from 'date-fns';

export default function TodayDashboard() {
  const { data, isLoading, isError } = useTodayDashboard();
  
  if (isLoading) return <div className="p-4 flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  if (isError) return <div className="p-4 text-red-500">Failed to load dashboard data. Ensure backend is running.</div>;
  
  // Use empty arrays as fallback if data is undefined (e.g. mock backend not ready)
  const dueToday = data?.dueToday || [];
  const overdue = data?.overdue || [];
  const pendingToSend = data?.pendingToSend || [];
  const newThisWeek = data?.newThisWeek || [];

  return (
    <div className="p-4 pb-24 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold dark:text-white">Today's Focus</h1>
      
      <Section title="Overdue" items={overdue} color="text-red-600 dark:text-red-400" />
      <Section title="Follow-ups Due Today" items={dueToday} color="text-blue-600 dark:text-blue-400" />
      <Section title="Pending to Send" items={pendingToSend} color="text-orange-600 dark:text-orange-400" />
      
      <div>
        <h2 className="text-lg font-semibold mb-3 dark:text-white">New Leads This Week</h2>
        {newThisWeek.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No new leads this week.</p>
        ) : (
          <div className="space-y-3">
            {newThisWeek.map(lead => (
              <div key={lead.id} className="p-3 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 flex justify-between items-center">
                <div>
                  <p className="font-medium dark:text-white">{lead.fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{lead.categoryName} • {lead.stageName}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, items, color }: { title: string, items: FollowUp[], color: string }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className={`text-lg font-semibold mb-3 ${color}`}>{title} ({items.length})</h2>
      <div className="space-y-3">
        {items.map(item => <FollowUpCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}

function FollowUpCard({ item }: { item: FollowUp }) {
  const updateStatus = useUpdateFollowUpStatus();
  const [showSnooze, setShowSnooze] = useState(false);

  const handleDone = () => {
    updateStatus.mutate({ id: item.id, status: 'Completed' });
  };

  const handleSnooze = (days: number) => {
    const newDate = addDays(new Date(), days).toISOString();
    updateStatus.mutate({ id: item.id, status: 'Snoozed', newDate });
    setShowSnooze(false);
  };

  return (
    <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.leadName}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{item.note}</p>
          <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{format(new Date(item.dueDate), 'MMM d, h:mm a')}</span>
            {item.repeat && item.repeat !== 'never' && (
              <span title={`Repeats: ${item.repeat}`}>
                <Repeat className="w-3 h-3 text-blue-500" />
              </span>
            )}
            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-700 rounded text-[10px] uppercase font-medium">{item.type}</span>
          </div>
        </div>
      </div>

      {showSnooze ? (
        <div className="pt-2 border-t border-gray-100 dark:border-zinc-700 flex flex-wrap gap-2">
          <button onClick={() => handleSnooze(1)} className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-zinc-700 dark:text-gray-200 rounded-full hover:bg-gray-200 transition">Tomorrow</button>
          <button onClick={() => handleSnooze(2)} className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-zinc-700 dark:text-gray-200 rounded-full hover:bg-gray-200 transition">2 Days</button>
          <button onClick={() => handleSnooze(7)} className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-zinc-700 dark:text-gray-200 rounded-full hover:bg-gray-200 transition">1 Week</button>
          <button onClick={() => setShowSnooze(false)} className="px-3 py-1.5 text-xs text-red-500 ml-auto">Cancel</button>
        </div>
      ) : (
        <div className="pt-2 flex justify-between items-center border-t border-gray-100 dark:border-zinc-700 gap-2">
          <div className="flex space-x-2">
            <a href={`tel:${item.leadPhone}`} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition">
              <Phone className="w-5 h-5" />
            </a>
            <a href={`https://wa.me/${item.leadPhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition">
              <MessageCircle className="w-5 h-5" />
            </a>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => setShowSnooze(true)} className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-md transition">
              <CalendarIcon className="w-4 h-4" />
              <span>Snooze</span>
            </button>
            <button onClick={handleDone} className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md font-medium transition">
              <CheckCircle2 className="w-4 h-4" />
              <span>Done</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
