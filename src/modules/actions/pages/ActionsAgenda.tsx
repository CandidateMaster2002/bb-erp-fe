import { useState } from 'react';
import { 
  useActionsToday, 
  useActionsByDate, 
  useActionsByRange, 
  useCompleteLogAction, 
  useCancelLogAction,
  useUpdateLeadLog
} from '../../leads/api/queries';
import { CheckCircle2, XCircle, User, Clock } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, isBefore, startOfDay } from 'date-fns';
import { Link } from 'react-router-dom';

type ViewMode = 'today' | 'tomorrow' | 'week';

export default function ActionsAgenda() {
  const [viewMode, setViewMode] = useState<ViewMode>('today');

  const todayQuery = useActionsToday();
  const tomorrowQuery = useActionsByDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekQuery = useActionsByRange(format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd'));

  const completeAction = useCompleteLogAction();
  const cancelAction = useCancelLogAction();
  const updateLog = useUpdateLeadLog();
  const [postponeActionId, setPostponeActionId] = useState<string | number | null>(null);
  const [postponeDate, setPostponeDate] = useState<string>('');

  const handleSavePostpone = async (logId: string | number) => {
    if (!postponeDate) return;
    await updateLog.mutateAsync({
      logId,
      log: {
        nextActionDate: new Date(postponeDate).toISOString()
      }
    });
    setPostponeActionId(null);
    setPostponeDate('');
  };

  let currentQuery = todayQuery;
  if (viewMode === 'tomorrow') currentQuery = tomorrowQuery;
  if (viewMode === 'week') currentQuery = weekQuery;

  const { data: actions, isLoading } = currentQuery;

  const now = startOfDay(new Date());

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold dark:text-white">Agenda</h1>
        
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 p-1 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm">
          <button 
            onClick={() => setViewMode('today')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'today' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
          >
            Today
          </button>
          <button 
            onClick={() => setViewMode('tomorrow')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'tomorrow' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
          >
            Tomorrow
          </button>
          <button 
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'week' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
          >
            This Week
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 hide-scrollbar">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading actions...</div>
        ) : !actions || actions.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-800 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 text-gray-500">
            <CheckCircle2 className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3 opacity-50" />
            <p className="font-medium text-gray-700 dark:text-gray-300">All caught up!</p>
            <p className="text-sm mt-1">No pending actions found for this period.</p>
          </div>
        ) : (
          actions.map(action => {
            const actionDate = action.nextActionDate ? new Date(action.nextActionDate) : null;
            const isOverdue = actionDate && isBefore(actionDate, now);

            return (
              <div key={action.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 flex flex-col gap-4 transition hover:border-blue-300 dark:hover:border-blue-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link to={`/leads/${action.leadId}`} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                      <User className="w-4 h-4" />
                      {action.leadName || `Lead #${action.leadId}`}
                    </Link>
                    {actionDate && (
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium border ${isOverdue ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-zinc-700 dark:text-gray-300 dark:border-zinc-600'}`}>
                        {format(actionDate, 'MMM d, yyyy')} {isOverdue && '(Overdue)'}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mt-2">
                    {action.nextAction}
                  </h3>
                  
                  {action.comment && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      <span className="font-medium text-gray-400">Context: </span>
                      {action.comment}
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col gap-2 shrink-0">
                  <button 
                    onClick={() => completeAction.mutateAsync(action.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-400 rounded-lg text-sm font-medium transition border border-green-200 dark:border-green-800/30"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Complete
                  </button>
                  <button 
                    onClick={() => cancelAction.mutateAsync(action.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-gray-300 rounded-lg text-sm font-medium transition border border-gray-200 dark:border-zinc-700"
                  >
                    <XCircle className="w-4 h-4" /> Cancel
                  </button>
                  <button 
                    onClick={() => {
                      setPostponeActionId(action.id);
                      const d = action.nextActionDate ? new Date(action.nextActionDate) : new Date();
                      if (!isNaN(d.getTime())) {
                        setPostponeDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
                      }
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-lg text-sm font-medium transition border border-blue-200 dark:border-blue-800/30"
                  >
                    <Clock className="w-4 h-4" /> Postpone
                  </button>
                </div>
                </div>

                {postponeActionId === action.id && (
                  <div className="pt-3 border-t border-gray-100 dark:border-zinc-700 flex flex-col sm:flex-row gap-3 items-center">
                    <input
                      type="datetime-local"
                      value={postponeDate}
                      onChange={(e) => setPostponeDate(e.target.value)}
                      className="flex-1 w-full text-sm p-2 border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 rounded-md dark:text-gray-100 focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => setPostponeActionId(null)}
                        className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800 rounded-md transition border border-transparent hover:border-gray-200 dark:hover:border-zinc-600"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleSavePostpone(action.id)}
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
    </div>
  );
}
