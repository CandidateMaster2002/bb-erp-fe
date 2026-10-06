import { useState, useEffect } from 'react';
import { useCreateTask, useCreateRecurringTask } from '../api/tasks';
import { X, Calendar, RefreshCw } from 'lucide-react';

const DAYS_MAP = [
  { value: 'MONDAY', label: 'M' },
  { value: 'TUESDAY', label: 'T' },
  { value: 'WEDNESDAY', label: 'W' },
  { value: 'THURSDAY', label: 'T' },
  { value: 'FRIDAY', label: 'F' },
  { value: 'SATURDAY', label: 'S' },
  { value: 'SUNDAY', label: 'S' }
];

export default function NewTaskModal({ isOpen, onClose, defaultDate = '' }: { isOpen: boolean; onClose: () => void; defaultDate?: string; }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadlineDate, setDeadlineDate] = useState(defaultDate);
  const [deadlineTime, setDeadlineTime] = useState('');
  
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<string[]>([]);
  const [recurringTime, setRecurringTime] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setDeadlineDate(defaultDate);
      setDeadlineTime('');
      setIsRecurring(false);
      setRecurringDays([]);
      setRecurringTime('');
    }
  }, [isOpen, defaultDate]);

  const createMutation = useCreateTask();
  const createRecurringMutation = useCreateRecurringTask();

  if (!isOpen) return null;

  const toggleDay = (dayValue: string) => {
    if (dayValue === 'ALL') {
      if (recurringDays.includes('ALL')) {
        setRecurringDays([]);
      } else {
        setRecurringDays(['ALL']);
      }
      return;
    }

    setRecurringDays(prev => {
      // If ALL is selected, clear it and select just this day
      if (prev.includes('ALL')) {
        return [dayValue];
      }
      if (prev.includes(dayValue)) {
        return prev.filter(d => d !== dayValue);
      } else {
        return [...prev, dayValue];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isRecurring) {
      if (recurringDays.length === 0) {
        alert("Please select at least one day for recurring task.");
        return;
      }
      await createRecurringMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        daysOfWeek: recurringDays,
        timeOfDay: recurringTime || undefined,
      });
    } else {
      const finalIso = deadlineDate 
        ? (deadlineTime ? new Date(`${deadlineDate}T${deadlineTime}`).toISOString() : new Date(deadlineDate).toISOString())
        : undefined;

      await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        deadline: finalIso,
      });
    }

    setTitle('');
    setDescription('');
    setDeadlineDate('');
    setDeadlineTime('');
    setIsRecurring(false);
    onClose();
  };

  const isPending = createMutation.isPending || createRecurringMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Create New Task
          </h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Buy domain for new landing page"
              className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any extra details here..."
              rows={3}
              className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="recurring-toggle" 
              checked={isRecurring} 
              onChange={e => setIsRecurring(e.target.checked)} 
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="recurring-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-gray-500" /> Make Recurring
            </label>
          </div>

          {!isRecurring ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Deadline (Optional)
              </label>
              <div className="flex gap-2 w-full">
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <input
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-gray-200 dark:border-zinc-700 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Repeat on <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button 
                    type="button"
                    onClick={() => toggleDay('ALL')}
                    className={`px-3 py-1 text-sm font-medium rounded-full transition ${recurringDays.includes('ALL') ? 'bg-blue-600 text-white' : 'bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300'}`}
                  >
                    Everyday (ALL)
                  </button>
                  {DAYS_MAP.map(day => (
                    <button 
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      disabled={recurringDays.includes('ALL')}
                      className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-full transition disabled:opacity-50 ${!recurringDays.includes('ALL') && recurringDays.includes(day.value) ? 'bg-blue-600 text-white' : 'bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300'}`}
                      title={day.value}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time of Day (Optional)
                </label>
                <input
                  type="time"
                  value={recurringTime}
                  onChange={(e) => setRecurringTime(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800 rounded-md transition"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isPending || !title.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition disabled:opacity-50"
            >
              {isPending ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
