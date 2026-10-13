import { useState, useEffect } from 'react';
import { useCreateTask, useCreateRecurringTask } from '../api/tasks';
import type { TimeHorizon } from '../api/tasks';
import { X, Calendar, RefreshCw, Compass } from 'lucide-react';

const DAYS_MAP = [
  { value: 'MONDAY', label: 'M' },
  { value: 'TUESDAY', label: 'T' },
  { value: 'WEDNESDAY', label: 'W' },
  { value: 'THURSDAY', label: 'T' },
  { value: 'FRIDAY', label: 'F' },
  { value: 'SATURDAY', label: 'S' },
  { value: 'SUNDAY', label: 'S' }
];

const HORIZONS: { value: TimeHorizon; label: string; desc: string }[] = [
  { value: 'TODAY', label: 'Today', desc: 'Needs attention today' },
  { value: 'THIS_WEEK', label: 'This Week', desc: 'Within this week' },
  { value: 'THIS_MONTH', label: 'This Month', desc: 'Later this month' },
  { value: 'SOMEDAY', label: 'Backlog / Someday', desc: 'No rush / ideation' },
];

export default function NewTaskModal({ 
  isOpen, 
  onClose, 
  defaultDate = '',
  defaultHorizon
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  defaultDate?: string; 
  defaultHorizon?: TimeHorizon;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadlineDate, setDeadlineDate] = useState(defaultDate);
  const [deadlineTime, setDeadlineTime] = useState('');
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>(defaultHorizon || (defaultDate ? 'TODAY' : 'SOMEDAY'));
  
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<string[]>([]);
  const [recurringTime, setRecurringTime] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setDeadlineDate(defaultDate);
      setDeadlineTime('');
      setTimeHorizon(defaultHorizon || (defaultDate ? 'TODAY' : 'SOMEDAY'));
      setIsRecurring(false);
      setRecurringDays([]);
      setRecurringTime('');
    }
  }, [isOpen, defaultDate, defaultHorizon]);

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

  const handleDeadlineDateChange = (dateVal: string) => {
    setDeadlineDate(dateVal);
    if (dateVal && timeHorizon === 'SOMEDAY') {
      setTimeHorizon('TODAY');
    } else if (!dateVal && timeHorizon === 'TODAY' && !defaultDate) {
      setTimeHorizon('SOMEDAY');
    }
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
        timeHorizon: timeHorizon,
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
              autoFocus
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

          {/* Time Horizon Selector (when not recurring) */}
          {!isRecurring && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Time Horizon
              </label>
              <div className="grid grid-cols-2 gap-2">
                {HORIZONS.map(h => {
                  const isSelected = timeHorizon === h.value;
                  return (
                    <button
                      key={h.value}
                      type="button"
                      onClick={() => setTimeHorizon(h.value)}
                      className={`p-2 rounded-lg text-left border transition text-xs flex flex-col gap-0.5 ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50 text-blue-900 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-200 font-semibold ring-1 ring-blue-500' 
                          : 'border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/40 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span className="font-medium">{h.label}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{h.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
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
                Specific Deadline (Optional)
              </label>
              <div className="flex gap-2 w-full">
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => handleDeadlineDateChange(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <input
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                {deadlineDate ? 'Specific date set.' : 'Optional — tasks can live in a Time Horizon without a strict date.'}
              </p>
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
