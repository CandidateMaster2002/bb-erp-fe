import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, endOfWeek, isBefore, startOfDay } from 'date-fns';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  ChevronRight, 
  ListTodo, 
  Calendar, 
  Sparkles, 
  Inbox,
  CheckSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  useTasksToday, 
  useTasksByDate, 
  useTasksByRange, 
  useTasksByStatus, 
  useTasksByHorizon,
  useShiftTaskHorizon, 
  useCompleteTask, 
  useCancelTask, 
} from '../api/tasks';
import type { Task, TimeHorizon } from '../api/tasks';
import NewTaskModal from './NewTaskModal';
import BulkTaskActionsBar from './BulkTaskActionsBar';

type TaskFilter = 
  | 'TODAY' 
  | 'THIS_WEEK' 
  | 'THIS_MONTH' 
  | 'SOMEDAY' 
  | 'all' 
  | 'completed' 
  | 'cancelled' 
  | 'custom-date' 
  | 'custom-range';

const HORIZON_TABS: { key: TimeHorizon; label: string; icon: typeof Clock }[] = [
  { key: 'TODAY', label: 'Today', icon: Sparkles },
  { key: 'THIS_WEEK', label: 'This Week', icon: Clock },
  { key: 'THIS_MONTH', label: 'This Month', icon: Calendar },
  { key: 'SOMEDAY', label: 'Backlog / Someday', icon: Inbox },
];

export default function TasksView({ hideFilters, filterOverride }: { hideFilters?: boolean; filterOverride?: any }) {
  const [filter, setFilter] = useState<TaskFilter>('TODAY');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [assignDateTaskId, setAssignDateTaskId] = useState<number | null>(null);
  const [assignDateVal, setAssignDateVal] = useState<string>('');
  const [assignTimeVal, setAssignTimeVal] = useState<string>('');

  // Multi-select state
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);

  const [customDate, setCustomDate] = useState<string>('');
  const [customRange, setCustomRange] = useState<{from: string; to: string}>({ from: '', to: '' });

  const activeFilter = filterOverride || filter;

  const customDateStr = typeof activeFilter === 'object' && activeFilter.type === 'custom-date' ? activeFilter.date : filter === 'custom-date' ? customDate : '';
  const customRangeFrom = typeof activeFilter === 'object' && activeFilter.type === 'custom-range' ? activeFilter.from : filter === 'custom-range' ? customRange.from : '';
  const customRangeTo = typeof activeFilter === 'object' && activeFilter.type === 'custom-range' ? activeFilter.to : filter === 'custom-range' ? customRange.to : '';

  // Queries
  const allQuery = useTasksByStatus('PENDING');
  const todayLegacyQuery = useTasksToday();
  const tomorrowQuery = useTasksByDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const weekLegacyQuery = useTasksByRange(
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'), 
    format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  );
  const customDateQuery = useTasksByDate(customDateStr);
  const customRangeQuery = useTasksByRange(customRangeFrom, customRangeTo);
  const completedQuery = useTasksByStatus('COMPLETED');
  const cancelledQuery = useTasksByStatus('CANCELLED');

  // Horizon Queries
  const todayHorizonQuery = useTasksByHorizon('TODAY');
  const thisWeekHorizonQuery = useTasksByHorizon('THIS_WEEK');
  const thisMonthHorizonQuery = useTasksByHorizon('THIS_MONTH');
  const somedayHorizonQuery = useTasksByHorizon('SOMEDAY');

  const completeMutation = useCompleteTask();
  const cancelMutation = useCancelTask();
  const shiftHorizonMutation = useShiftTaskHorizon();

  let currentQuery = todayHorizonQuery;
  if (activeFilter === 'TODAY') currentQuery = todayHorizonQuery;
  else if (activeFilter === 'THIS_WEEK') currentQuery = thisWeekHorizonQuery;
  else if (activeFilter === 'THIS_MONTH') currentQuery = thisMonthHorizonQuery;
  else if (activeFilter === 'SOMEDAY') currentQuery = somedayHorizonQuery;
  else if (activeFilter === 'all') currentQuery = allQuery;
  else if (activeFilter === 'today') currentQuery = todayLegacyQuery;
  else if (activeFilter === 'tomorrow') currentQuery = tomorrowQuery;
  else if (activeFilter === 'week') currentQuery = weekLegacyQuery;
  else if (activeFilter === 'completed') currentQuery = completedQuery;
  else if (activeFilter === 'cancelled') currentQuery = cancelledQuery;
  else if (activeFilter === 'custom-date') currentQuery = customDateQuery;
  else if (activeFilter === 'custom-range') currentQuery = customRangeQuery;
  else if (typeof activeFilter === 'object') {
    if (activeFilter.type === 'custom-date') currentQuery = customDateQuery;
    if (activeFilter.type === 'custom-range') currentQuery = customRangeQuery;
  }

  const { data: tasks, isLoading } = currentQuery;
  const now = startOfDay(new Date());

  const toggleSelectTask = (id: number) => {
    setSelectedTaskIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const isAllSelected = Boolean(tasks && tasks.length > 0 && tasks.every(t => selectedTaskIds.includes(t.id)));

  const handleSelectAllTasks = () => {
    if (!tasks || tasks.length === 0) return;
    if (isAllSelected) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tasks.map(t => t.id));
    }
  };

  const selectedTasks = tasks?.filter(t => selectedTaskIds.includes(t.id)) || [];

  // Reset selection when changing filters or dates
  useEffect(() => {
    setSelectedTaskIds([]);
  }, [filter, filterOverride, customDate, customRange.from, customRange.to]);

  const handleSaveAssignDate = async (id: number) => {
    if (!assignDateVal) return;
    const finalIso = assignTimeVal 
      ? new Date(`${assignDateVal}T${assignTimeVal}`).toISOString() 
      : new Date(assignDateVal).toISOString();

    await shiftHorizonMutation.mutateAsync({
      id,
      horizon: 'TODAY',
      deadline: finalIso
    });
    setAssignDateTaskId(null);
    setAssignDateVal('');
    setAssignTimeVal('');
  };

  const getHorizonBadge = (horizon?: string) => {
    if (!horizon) return null;
    switch (horizon.toUpperCase()) {
      case 'TODAY':
        return <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Today</span>;
      case 'THIS_WEEK':
        return <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">This Week</span>;
      case 'THIS_MONTH':
        return <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800">This Month</span>;
      case 'SOMEDAY':
        return <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Someday</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${hideFilters ? "" : "flex-1 overflow-y-auto hide-scrollbar -mx-4 px-4 pt-1"}`}>
      {/* Header and Controls */}
      {!hideFilters && (
        <div className="sticky top-0 z-10 bg-gray-50 dark:bg-zinc-900 py-2 -mt-2 -mx-4 px-4 space-y-2 border-b border-gray-200 dark:border-zinc-800">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
            {/* Primary Time Horizon Segmented Control */}
            <div className="flex items-center gap-1 bg-gray-200/70 dark:bg-zinc-800/80 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-full">
              {HORIZON_TABS.map(tab => {
                const Icon = tab.icon;
                const isSelected = filter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition whitespace-nowrap shrink-0 ${
                      isSelected 
                        ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-zinc-700/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Action Button */}
            <button 
              onClick={() => setIsNewTaskModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium transition shadow-sm whitespace-nowrap shrink-0 self-end lg:self-auto"
            >
              <Plus className="w-4 h-4" /> New Task
            </button>
          </div>

          {/* Secondary Filters */}
          <div className="flex items-center gap-2 text-xs overflow-x-auto no-scrollbar pb-1">
            <span className="text-gray-400 font-medium whitespace-nowrap shrink-0">Other:</span>
            {(['all', 'completed', 'cancelled'] as TaskFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md capitalize transition font-medium whitespace-nowrap shrink-0 ${
                  filter === f
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
              >
                {f === 'all' ? 'All Tasks' : f}
              </button>
            ))}

            {/* Date Picker Input */}
            <div className="flex items-center gap-1 pl-2 border-l border-gray-300 dark:border-zinc-700 ml-1 shrink-0">
              <input 
                type="date"
                value={filter === 'custom-range' ? customRange.from : filter === 'custom-date' ? customDate : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (filter === 'custom-range') {
                    setCustomRange(prev => ({ ...prev, from: val }));
                  } else {
                    setCustomDate(val);
                    setFilter('custom-date');
                  }
                }}
                className={`text-xs bg-transparent border rounded p-1 transition-colors ${
                  filter === 'custom-date' || (filter === 'custom-range' && customRange.from)
                    ? 'border-blue-500 ring-1 ring-blue-500 text-blue-700 dark:text-blue-300' 
                    : 'border-gray-300 dark:border-zinc-600 dark:text-gray-300'
                }`}
                title="Filter by Specific Date"
              />
              <span className="text-gray-400 text-xs px-0.5">to</span>
              <input 
                type="date"
                value={filter === 'custom-range' ? customRange.to : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomRange(prev => ({ from: filter === 'custom-date' ? customDate : prev.from, to: val }));
                  setFilter('custom-range');
                }}
                className={`text-xs bg-transparent border rounded p-1 transition-colors ${
                  filter === 'custom-range' && customRange.to
                    ? 'border-blue-500 ring-1 ring-blue-500 text-blue-700 dark:text-blue-300' 
                    : 'border-gray-300 dark:border-zinc-600 dark:text-gray-300'
                }`}
                title="End Date (Optional)"
              />
            </div>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className={`space-y-3 ${hideFilters ? "pb-4" : "pb-24"}`}>
        {/* Select All Bar */}
        {tasks && tasks.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-zinc-800/80 rounded-xl border border-gray-200 dark:border-zinc-700 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer font-medium text-gray-700 dark:text-gray-300 select-none">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAllTasks}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {selectedTaskIds.length > 0 ? (
                  <span>Selected <strong className="text-blue-600 dark:text-blue-400">{selectedTaskIds.length}</strong> of {tasks.length}</span>
                ) : (
                  <span>Select All ({tasks.length})</span>
                )}
              </span>
            </label>
            {selectedTaskIds.length > 0 && (
              <button
                onClick={() => setSelectedTaskIds([])}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
              >
                Clear Selection
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading tasks...</div>
        ) : !tasks || tasks.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-800 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 text-gray-500 space-y-3">
            <CheckCircle2 className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-2 opacity-50" />
            <p className="font-medium text-gray-700 dark:text-gray-300">
              {filter === 'TODAY' ? 'No tasks scheduled for Today' :
               filter === 'THIS_WEEK' ? 'No tasks in This Week horizon' :
               filter === 'THIS_MONTH' ? 'No tasks in This Month horizon' :
               filter === 'SOMEDAY' ? 'Backlog / Someday is empty' :
               'No tasks found'}
            </p>
            <p className="text-xs text-gray-400">
              {filter === 'SOMEDAY' 
                ? 'Store long-term goals or ideas that do not have strict deadlines yet.' 
                : 'Stay organized by moving tasks into flexible horizons or adding new ones.'}
            </p>
            <button
              onClick={() => setIsNewTaskModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Task Here
            </button>
          </div>
        ) : (
          tasks.map((task: Task) => {
            const deadlineDate = task.deadline ? new Date(task.deadline) : null;
            const isOverdue = deadlineDate && task.status === 'PENDING' && isBefore(deadlineDate, now);
            const isSelected = selectedTaskIds.includes(task.id);

            return (
              <div 
                key={task.id} 
                className={`p-3 rounded-xl shadow-sm border flex flex-col gap-4 transition ${
                  isSelected 
                    ? 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-500 ring-2 ring-blue-500/20' 
                    : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="pt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectTask(task.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 cursor-pointer"
                        title={isSelected ? "Deselect action" : "Select action"}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium border ${
                        task.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                        task.status === 'CANCELLED' ? 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-zinc-700 dark:text-gray-400 dark:border-zinc-600' :
                        isOverdue ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' : 
                        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                      }`}>
                        {task.status}
                      </span>

                      {getHorizonBadge(task.timeHorizon)}

                      {deadlineDate && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {format(deadlineDate, 'MMM d, yyyy h:mm a')} {isOverdue && '(Overdue)'}
                        </span>
                      )}

                      {task.subactions && task.subactions.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium">
                          <ListTodo className="w-3 h-3" />
                          {task.subactions.filter(s => s.status === 'COMPLETED').length}/{task.subactions.length} subactions
                        </span>
                      )}
                    </div>
                    
                    <Link to={`/actions/${task.id}`} className="block group">
                      <h3 className={`text-base font-medium mt-1.5 transition group-hover:text-blue-600 dark:group-hover:text-blue-400 ${task.status !== 'PENDING' ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                        {task.title}
                      </h3>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </Link>

                    {/* Quick Horizon Shift Actions */}
                    {task.status === 'PENDING' && (
                      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mr-0.5">Shift:</span>
                        
                        {task.timeHorizon !== 'TODAY' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              shiftHorizonMutation.mutate({ id: task.id, horizon: 'TODAY' });
                            }}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 font-medium transition"
                          >
                            Move to Today
                          </button>
                        )}

                        {task.timeHorizon !== 'THIS_WEEK' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              shiftHorizonMutation.mutate({ id: task.id, horizon: 'THIS_WEEK' });
                            }}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 font-medium transition"
                          >
                            Move to Week
                          </button>
                        )}

                        {task.timeHorizon !== 'THIS_MONTH' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              shiftHorizonMutation.mutate({ id: task.id, horizon: 'THIS_MONTH' });
                            }}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 font-medium transition"
                          >
                            To Month
                          </button>
                        )}

                        {task.timeHorizon !== 'SOMEDAY' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              shiftHorizonMutation.mutate({ id: task.id, horizon: 'SOMEDAY' });
                            }}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-gray-300 border border-gray-200 dark:border-zinc-600 font-medium transition"
                          >
                            To Someday
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssignDateTaskId(task.id);
                            const d = task.deadline ? new Date(task.deadline) : new Date();
                            if (!isNaN(d.getTime())) {
                              const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
                              setAssignDateVal(localIso.slice(0, 10));
                              const timePart = localIso.slice(11, 16);
                              setAssignTimeVal(task.deadline && timePart !== '00:00' ? timePart : '');
                            }
                          }}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 font-medium transition flex items-center gap-1"
                        >
                          <Calendar className="w-3 h-3 text-gray-400" /> Assign Date
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action Buttons */}
                  <div className="flex flex-wrap sm:flex-nowrap gap-2 shrink-0 sm:items-center mt-3 sm:mt-0">
                    {task.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); completeMutation.mutateAsync(task.id); }}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-400 rounded-lg text-sm font-medium transition border border-green-200 dark:border-green-800/30"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Complete
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); cancelMutation.mutateAsync(task.id); }}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-gray-300 rounded-lg text-sm font-medium transition border border-gray-200 dark:border-zinc-700"
                        >
                          <XCircle className="w-4 h-4" /> Cancel
                        </button>
                      </>
                    )}

                    <Link
                      to={`/actions/${task.id}`}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-700 rounded-lg transition"
                      title="View Details & Subactions"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Inline Assign / Change Date Drawer */}
                {assignDateTaskId === task.id && (
                  <div className="pt-3 border-t border-gray-100 dark:border-zinc-700 flex flex-col sm:flex-row gap-3 items-center">
                    <div className="flex-1 flex gap-2 w-full">
                      <input
                        type="date"
                        value={assignDateVal}
                        onChange={(e) => setAssignDateVal(e.target.value)}
                        className="w-full text-sm p-2 border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 rounded-md dark:text-gray-100 focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="time"
                        value={assignTimeVal}
                        onChange={(e) => setAssignTimeVal(e.target.value)}
                        className="w-full text-sm p-2 border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 rounded-md dark:text-gray-100 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => setAssignDateTaskId(null)}
                        className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800 rounded-md transition"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleSaveAssignDate(task.id)}
                        disabled={!assignDateVal}
                        className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 rounded-md transition shadow-sm"
                      >
                        Save Date
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bulk Task Actions Toolbar */}
      <BulkTaskActionsBar
        selectedTasks={selectedTasks}
        onClearSelection={() => setSelectedTaskIds([])}
        onSelectAll={handleSelectAllTasks}
        isAllSelected={isAllSelected}
        totalCount={tasks?.length || 0}
      />

      <NewTaskModal 
        isOpen={isNewTaskModalOpen} 
        onClose={() => setIsNewTaskModalOpen(false)}
        defaultHorizon={
          filter === 'TODAY' || filter === 'THIS_WEEK' || filter === 'THIS_MONTH' || filter === 'SOMEDAY' 
            ? filter 
            : 'TODAY'
        }
      />
    </div>
  );
}
