import { useState } from 'react';
import { format, addDays, startOfWeek, endOfWeek, isBefore, startOfDay } from 'date-fns';
import { 
  CheckCircle2, XCircle, Clock, Plus
} from 'lucide-react';
import { 
  useTasksToday, 
  useTasksByDate, 
  useTasksByRange, 
  useTasksByStatus, 
  useCompleteTask, 
  useCancelTask, 
  useUpdateTask,
} from '../api/tasks';
import type { Task } from '../api/tasks';
import NewTaskModal from './NewTaskModal';

type TaskFilter = 'today' | 'tomorrow' | 'week' | 'completed' | 'cancelled';

export default function TasksView() {
  const [filter, setFilter] = useState<TaskFilter>('today');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [postponeTaskId, setPostponeTaskId] = useState<number | null>(null);
  const [postponeDate, setPostponeDate] = useState<string>('');

  const todayQuery = useTasksToday();
  const tomorrowQuery = useTasksByDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const weekQuery = useTasksByRange(
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'), 
    format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  );
  const completedQuery = useTasksByStatus('COMPLETED');
  const cancelledQuery = useTasksByStatus('CANCELLED');

  const completeMutation = useCompleteTask();
  const cancelMutation = useCancelTask();
  const updateMutation = useUpdateTask();

  let currentQuery = todayQuery;
  if (filter === 'tomorrow') currentQuery = tomorrowQuery;
  if (filter === 'week') currentQuery = weekQuery;
  if (filter === 'completed') currentQuery = completedQuery;
  if (filter === 'cancelled') currentQuery = cancelledQuery;

  const { data: tasks, isLoading } = currentQuery;
  const now = startOfDay(new Date());

  const handlePostpone = async (id: number) => {
    if (!postponeDate) return;
    await updateMutation.mutateAsync({
      id,
      data: { deadline: new Date(postponeDate).toISOString() }
    });
    setPostponeTaskId(null);
    setPostponeDate('');
  };

  return (
    <div className="space-y-6 flex-1 overflow-y-auto hide-scrollbar -mx-4 px-4 pt-1">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2 bg-gray-100/80 dark:bg-zinc-800/80 p-1 rounded-xl">
          {(['today', 'tomorrow', 'week', 'completed', 'cancelled'] as TaskFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition ${
                filter === f 
                  ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-zinc-700/50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button 
          onClick={() => setIsNewTaskModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3 pb-24">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading tasks...</div>
        ) : !tasks || tasks.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-800 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 text-gray-500">
            <CheckCircle2 className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3 opacity-50" />
            <p className="font-medium text-gray-700 dark:text-gray-300">No tasks found</p>
            <p className="text-sm mt-1">Enjoy your free time!</p>
          </div>
        ) : (
          tasks.map((task: Task) => {
            const deadlineDate = task.deadline ? new Date(task.deadline) : null;
            const isOverdue = deadlineDate && task.status === 'PENDING' && isBefore(deadlineDate, now);

            return (
              <div key={task.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 flex flex-col gap-4 transition hover:border-blue-300 dark:hover:border-blue-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium border ${
                        task.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                        task.status === 'CANCELLED' ? 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-zinc-700 dark:text-gray-400 dark:border-zinc-600' :
                        isOverdue ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' : 
                        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                      }`}>
                        {task.status}
                      </span>
                      {deadlineDate && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {format(deadlineDate, 'MMM d, yyyy h:mm a')} {isOverdue && '(Overdue)'}
                        </span>
                      )}
                    </div>
                    
                    <h3 className={`text-base font-medium mt-2 ${task.status !== 'PENDING' ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                      {task.title}
                    </h3>
                    
                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {task.status === 'PENDING' && (
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <button 
                        onClick={() => completeMutation.mutateAsync(task.id)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-400 rounded-lg text-sm font-medium transition border border-green-200 dark:border-green-800/30"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Complete
                      </button>
                      <button 
                        onClick={() => cancelMutation.mutateAsync(task.id)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-gray-300 rounded-lg text-sm font-medium transition border border-gray-200 dark:border-zinc-700"
                      >
                        <XCircle className="w-4 h-4" /> Cancel
                      </button>
                      <button 
                        onClick={() => {
                          setPostponeTaskId(task.id);
                          const d = task.deadline ? new Date(task.deadline) : new Date();
                          if (!isNaN(d.getTime())) {
                            setPostponeDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
                          }
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-lg text-sm font-medium transition border border-blue-200 dark:border-blue-800/30"
                      >
                        <Clock className="w-4 h-4" /> Postpone
                      </button>
                    </div>
                  )}
                </div>

                {postponeTaskId === task.id && (
                  <div className="pt-3 border-t border-gray-100 dark:border-zinc-700 flex flex-col sm:flex-row gap-3 items-center">
                    <input
                      type="datetime-local"
                      value={postponeDate}
                      onChange={(e) => setPostponeDate(e.target.value)}
                      className="flex-1 w-full text-sm p-2 border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 rounded-md dark:text-gray-100 focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => setPostponeTaskId(null)}
                        className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-700 rounded-md transition border border-transparent hover:border-gray-200 dark:hover:border-zinc-600"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handlePostpone(task.id)}
                        disabled={!postponeDate}
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

      <NewTaskModal 
        isOpen={isNewTaskModalOpen} 
        onClose={() => setIsNewTaskModalOpen(false)} 
      />
    </div>
  );
}
