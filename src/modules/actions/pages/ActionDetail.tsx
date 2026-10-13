import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  useTaskDetail, 
  useCompleteTask, 
  useCancelTask, 
  useUpdateTask, 
  useDeleteTask,
  useCreateSubAction,
  useUpdateSubActionStatus,
  useDeleteSubAction,
  useShiftTaskHorizon
} from '../api/tasks';
import type { SubAction, TimeHorizon } from '../api/tasks';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  XCircle, 
  Clock, 
  Plus, 
  Trash2, 
  Calendar, 
  ListTodo,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';

export default function ActionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: task, isLoading, isError } = useTaskDetail(id || '');
  const completeTask = useCompleteTask();
  const cancelTask = useCancelTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const createSubAction = useCreateSubAction();
  const updateSubActionStatus = useUpdateSubActionStatus();
  const deleteSubAction = useDeleteSubAction();
  const shiftHorizon = useShiftTaskHorizon();

  // Create Subaction state
  const [isCreatingSubaction, setIsCreatingSubaction] = useState(false);
  const [subTitle, setSubTitle] = useState('');
  const [subDescription, setSubDescription] = useState('');
  const [subDueDate, setSubDueDate] = useState('');
  const [subDueTime, setSubDueTime] = useState('');

  // Postpone main task state
  const [isPostponing, setIsPostponing] = useState(false);
  const [postponeDate, setPostponeDate] = useState('');
  const [postponeTime, setPostponeTime] = useState('');

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex items-center justify-center">
        <div className="text-gray-500 flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Loading action details...
        </div>
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-semibold dark:text-white">Action Not Found</h2>
        <p className="text-sm text-gray-500">The action you are looking for does not exist or has been removed.</p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Agenda
        </Link>
      </div>
    );
  }

  const now = startOfDay(new Date());
  const deadlineDate = task.deadline ? new Date(task.deadline) : null;
  const isOverdue = deadlineDate && task.status === 'PENDING' && isBefore(deadlineDate, now);

  const subactions: SubAction[] = task.subactions || [];
  const completedSubactions = subactions.filter(s => s.status === 'COMPLETED').length;
  const progressPercent = subactions.length > 0 ? Math.round((completedSubactions / subactions.length) * 100) : 0;

  const handleCreateSubactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subTitle.trim()) return;

    const finalIso = subDueDate 
      ? (subDueTime ? new Date(`${subDueDate}T${subDueTime}`).toISOString() : new Date(subDueDate).toISOString())
      : undefined;

    await createSubAction.mutateAsync({
      taskId: task.id,
      data: {
        title: subTitle.trim(),
        description: subDescription.trim() || undefined,
        dueDate: finalIso
      }
    });

    setSubTitle('');
    setSubDescription('');
    setSubDueDate('');
    setSubDueTime('');
    setIsCreatingSubaction(false);
  };

  const handleToggleSubaction = async (sub: SubAction) => {
    const nextStatus = sub.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    await updateSubActionStatus.mutateAsync({
      taskId: task.id,
      subId: sub.id,
      status: nextStatus
    });
  };

  const handleCancelSubaction = async (sub: SubAction) => {
    const nextStatus = sub.status === 'CANCELLED' ? 'PENDING' : 'CANCELLED';
    await updateSubActionStatus.mutateAsync({
      taskId: task.id,
      subId: sub.id,
      status: nextStatus
    });
  };

  const handleDeleteTask = async () => {
    if (window.confirm('Are you sure you want to delete this action?')) {
      await deleteTask.mutateAsync(task.id);
      navigate('/');
    }
  };

  const handleSavePostpone = async () => {
    if (!postponeDate) return;
    const finalIso = postponeTime 
      ? new Date(`${postponeDate}T${postponeTime}`).toISOString() 
      : new Date(postponeDate).toISOString();

    await updateTask.mutateAsync({
      id: task.id,
      data: { deadline: finalIso }
    });
    setIsPostponing(false);
    setPostponeDate('');
    setPostponeTime('');
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-24 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Agenda
        </Link>

        {/* Action Level Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {task.status === 'PENDING' ? (
            <>
              <button
                onClick={() => completeTask.mutateAsync(task.id)}
                disabled={completeTask.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-400 rounded-lg text-sm font-medium transition border border-green-200 dark:border-green-800/30"
              >
                <CheckCircle2 className="w-4 h-4" /> Complete
              </button>
              <button
                onClick={() => cancelTask.mutateAsync(task.id)}
                disabled={cancelTask.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-gray-300 rounded-lg text-sm font-medium transition border border-gray-200 dark:border-zinc-700"
              >
                <XCircle className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={() => {
                  setIsPostponing(!isPostponing);
                  if (!isPostponing && deadlineDate) {
                    const localIso = new Date(deadlineDate.getTime() - deadlineDate.getTimezoneOffset() * 60000).toISOString();
                    setPostponeDate(localIso.slice(0, 10));
                    const timePart = localIso.slice(11, 16);
                    setPostponeTime(timePart !== '00:00' ? timePart : '');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-lg text-sm font-medium transition border border-blue-200 dark:border-blue-800/30"
              >
                <Clock className="w-4 h-4" /> Postpone
              </button>
            </>
          ) : (
            <button
              onClick={() => updateTask.mutateAsync({ id: task.id, data: { status: 'PENDING' } })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-lg text-sm font-medium transition border border-blue-200 dark:border-blue-800/30"
            >
              <Circle className="w-4 h-4" /> Re-open Task
            </button>
          )}

          <button
            onClick={handleDeleteTask}
            disabled={deleteTask.isPending}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
            title="Delete Action"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Task Header Card */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-zinc-700 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2.5 py-1 rounded-md font-medium border ${
            task.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
            task.status === 'CANCELLED' ? 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-zinc-700 dark:text-gray-400 dark:border-zinc-600' :
            isOverdue ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' : 
            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
          }`}>
            {task.status}
          </span>

          {deadlineDate && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 font-medium bg-gray-50 dark:bg-zinc-700/50 px-2 py-0.5 rounded border border-gray-200 dark:border-zinc-700">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              {format(deadlineDate, 'EEE, MMM d, yyyy h:mm a')} {isOverdue && <span className="text-red-500 font-semibold">(Overdue)</span>}
            </span>
          )}

          {task.recurrenceGroupId && (
            <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
              Recurring Task
            </span>
          )}

          {task.timeHorizon && (
            <span className={`text-xs px-2.5 py-1 rounded-md font-medium border ${
              task.timeHorizon === 'TODAY' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
              task.timeHorizon === 'THIS_WEEK' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800' :
              task.timeHorizon === 'THIS_MONTH' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' :
              'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
            }`}>
              Horizon: {task.timeHorizon === 'TODAY' ? 'Today' :
                        task.timeHorizon === 'THIS_WEEK' ? 'This Week' :
                        task.timeHorizon === 'THIS_MONTH' ? 'This Month' : 'Backlog / Someday'}
            </span>
          )}
        </div>

        <div>
          <h1 className={`text-xl sm:text-2xl font-bold ${task.status !== 'PENDING' ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
            {task.title}
          </h1>

          {task.description && (
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-2 whitespace-pre-wrap">
              {task.description}
            </p>
          )}

          {task.status === 'PENDING' && (
            <div className="pt-3 mt-3 border-t border-gray-100 dark:border-zinc-700/60 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-gray-400 font-medium">Shift Horizon:</span>
              {(['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'SOMEDAY'] as TimeHorizon[]).map(h => (
                <button
                  key={h}
                  onClick={() => shiftHorizon.mutate({ id: task.id, horizon: h })}
                  className={`px-2.5 py-1 rounded-md font-medium transition border ${
                    task.timeHorizon === h 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700'
                  }`}
                >
                  {h === 'TODAY' ? 'Today' : h === 'THIS_WEEK' ? 'This Week' : h === 'THIS_MONTH' ? 'This Month' : 'Someday'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Postpone editing inline */}
        {isPostponing && (
          <div className="pt-3 border-t border-gray-100 dark:border-zinc-700 flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex-1 flex gap-2 w-full">
              <input
                type="date"
                value={postponeDate}
                onChange={(e) => setPostponeDate(e.target.value)}
                className="w-full text-sm p-2 border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 rounded-md dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <input
                type="time"
                value={postponeTime}
                onChange={(e) => setPostponeTime(e.target.value)}
                className="w-full text-sm p-2 border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 rounded-md dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => setIsPostponing(false)}
                className="flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-700 rounded-md transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSavePostpone}
                disabled={!postponeDate}
                className="flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 rounded-md transition shadow-sm"
              >
                Save Date
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Subactions Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Subactions</h2>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-300 font-medium">
              {subactions.length}
            </span>
            {subactions.length > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({completedSubactions} of {subactions.length} completed)
              </span>
            )}
          </div>

          {!isCreatingSubaction && (
            <button
              onClick={() => setIsCreatingSubaction(true)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Subaction
            </button>
          )}
        </div>

        {/* Progress bar */}
        {subactions.length > 0 && (
          <div className="w-full bg-gray-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-300 rounded-full" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Create Subaction Card */}
        {isCreatingSubaction && (
          <form 
            onSubmit={handleCreateSubactionSubmit}
            className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm border border-blue-200 dark:border-blue-900/50 space-y-3 transition"
          >
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">New Subaction</h3>
              <button 
                type="button" 
                onClick={() => setIsCreatingSubaction(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subTitle}
                onChange={(e) => setSubTitle(e.target.value)}
                placeholder="E.g., Send follow-up email"
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-zinc-950 dark:border-zinc-700 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={subDescription}
                onChange={(e) => setSubDescription(e.target.value)}
                placeholder="E.g., Remind them about the proposal"
                rows={2}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-zinc-950 dark:border-zinc-700 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={subDueDate}
                  onChange={(e) => setSubDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border rounded-lg dark:bg-zinc-950 dark:border-zinc-700 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <input
                  type="time"
                  value={subDueTime}
                  onChange={(e) => setSubDueTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border rounded-lg dark:bg-zinc-950 dark:border-zinc-700 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingSubaction(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createSubAction.isPending || !subTitle.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition shadow-sm"
              >
                <Check className="w-4 h-4" /> Add Subaction
              </button>
            </div>
          </form>
        )}

        {/* Subactions List */}
        {subactions.length === 0 && !isCreatingSubaction ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 p-6 space-y-3">
            <ListTodo className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-600 opacity-60" />
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">No subactions yet</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Break down this action into smaller actionable steps.</p>
            </div>
            <button
              onClick={() => setIsCreatingSubaction(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 rounded-lg text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" /> Create First Subaction
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {subactions.map((sub) => {
              const subDueDateObj = sub.dueDate ? new Date(sub.dueDate) : null;
              const isSubOverdue = subDueDateObj && sub.status === 'PENDING' && isBefore(subDueDateObj, now);

              return (
                <div 
                  key={sub.id}
                  className={`bg-white dark:bg-zinc-800 rounded-xl p-3.5 shadow-sm border transition flex items-start gap-3 ${
                    sub.status === 'COMPLETED' 
                      ? 'border-green-200 dark:border-green-900/40 bg-green-50/20 dark:bg-green-950/10' 
                      : sub.status === 'CANCELLED'
                      ? 'border-gray-200 dark:border-zinc-700 opacity-60'
                      : 'border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  {/* Status Toggle Button */}
                  <button
                    onClick={() => handleToggleSubaction(sub)}
                    className="mt-0.5 text-gray-400 hover:text-green-600 transition shrink-0"
                    title={sub.status === 'COMPLETED' ? 'Mark Pending' : 'Mark Complete'}
                  >
                    {sub.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Circle className="w-5 h-5 hover:text-blue-600" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-sm font-medium ${
                        sub.status === 'COMPLETED' 
                          ? 'text-gray-500 dark:text-gray-400 line-through' 
                          : sub.status === 'CANCELLED'
                          ? 'text-gray-400 line-through'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {sub.title}
                      </h4>

                      {sub.status === 'CANCELLED' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-gray-400 border border-gray-200 dark:border-zinc-600">
                          Cancelled
                        </span>
                      )}

                      {subDueDateObj && (
                        <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium ${
                          isSubOverdue 
                            ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800' 
                            : 'bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-gray-300'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {format(subDueDateObj, 'MMM d, h:mm a')}
                          {isSubOverdue && ' (Overdue)'}
                        </span>
                      )}
                    </div>

                    {sub.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-pre-wrap">
                        {sub.description}
                      </p>
                    )}
                  </div>

                  {/* Subaction Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCancelSubaction(sub)}
                      className={`p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition ${
                        sub.status === 'CANCELLED' ? 'text-amber-600' : ''
                      }`}
                      title={sub.status === 'CANCELLED' ? 'Reopen Subaction' : 'Cancel Subaction'}
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteSubAction.mutateAsync({ taskId: task.id, subId: sub.id })}
                      className="p-1 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                      title="Delete Subaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
