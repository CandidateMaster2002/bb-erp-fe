const fs = require('fs');
let code = fs.readFileSync('src/modules/leads/components/LeadActivityLog.tsx', 'utf8');

code = code.replace(
  "const [nextActionDate, setNextActionDate] = useState('');",
  "const [nextActionDate, setNextActionDate] = useState('');\n  const [editingLogId, setEditingLogId] = useState<string | number | null>(null);\n  const [editComment, setEditComment] = useState('');\n  const [editNextAction, setEditNextAction] = useState('');\n  const [editNextActionDate, setEditNextActionDate] = useState('');"
);

const handleEditRegex = /const handleEdit = async \(log: LeadLog\) => \{[\s\S]*?\};/;
const newHandleEdit = \const handleEdit = (log: LeadLog) => {
    setEditingLogId(log.id);
    setEditComment(log.comment || '');
    setEditNextAction(log.nextAction || '');
    let localDateStr = '';
    if (log.nextActionDate) {
      const d = new Date(log.nextActionDate);
      if (!isNaN(d.getTime())) {
        localDateStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,16);
      }
    }
    setEditNextActionDate(localDateStr);
  };

  const handleSaveEdit = async (logId: string | number) => {
    await updateLog.mutateAsync({
      logId,
      log: {
        comment: editComment.trim() || undefined,
        nextAction: editNextAction.trim() || undefined,
        nextActionDate: editNextActionDate ? new Date(editNextActionDate).toISOString() : undefined,
      }
    });
    setEditingLogId(null);
  };
  
  const handleCancelEdit = () => {
    setEditingLogId(null);
  };\;
code = code.replace(handleEditRegex, newHandleEdit);

code = code.replace(/type="date"/, 'type="datetime-local"');

const addLogRegex = /nextActionDate: nextActionDate \|\| undefined,/;
const newAddLog = \
extActionDate: nextActionDate ? new Date(nextActionDate).toISOString() : undefined,\;
code = code.replace(addLogRegex, newAddLog);

const mapSplit = code.split('logs.map(log => (');
if (mapSplit.length > 1) {
  let bottom = mapSplit[1];
  
  const editFormUI = \
            <div key={log.id} className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700">
              {editingLogId === log.id ? (
                <div className="space-y-3">
                  <div>
                    <textarea
                      value={editComment}
                      onChange={e => setEditComment(e.target.value)}
                      placeholder="Edit comment..."
                      className="w-full text-sm p-3 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md dark:text-gray-100 focus:ring-1 focus:ring-blue-500 min-h-[80px]"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={editNextAction}
                        onChange={e => setEditNextAction(e.target.value)}
                        placeholder="Next Action (optional)"
                        className="w-full text-sm p-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md dark:text-gray-100 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="w-full sm:w-56">
                      <input
                        type="datetime-local"
                        value={editNextActionDate}
                        onChange={e => setEditNextActionDate(e.target.value)}
                        className="w-full text-sm p-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md dark:text-gray-100 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end mt-2">
                    <button onClick={handleCancelEdit} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-700 rounded-md transition">Cancel</button>
                    <button onClick={() => handleSaveEdit(log.id)} className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition">Save</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      {log.comment && (
                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{log.comment}</p>
                      )}
                      {log.nextAction && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <span className="flex items-center gap-1 font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                            <ClipboardList className="w-4 h-4" /> {log.nextAction}
                            {log.nextActionDate && (
                              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 ml-2 border-l border-blue-200 dark:border-blue-800 pl-2">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(log.nextActionDate), log.nextActionDate.includes('T') && !log.nextActionDate.endsWith('T00:00:00.000Z') ? 'MMM d, yyyy h:mm a' : 'MMM d, yyyy')}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-gray-400">
                        {format(new Date(log.createdAt), 'MMM d, yyyy \u2022 h:mm a')}
                      </span>
                      <div className="flex gap-1 text-gray-400">
                        <button onClick={() => handleEdit(log)} className="p-1 hover:text-blue-500 transition"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(log.id)} className="p-1 hover:text-red-500 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>

                  {log.actionStatus && (
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-700/50 flex items-center gap-3">
                      <span className={\	ext-xs font-semibold px-2 py-0.5 rounded-full \\}>
                        {log.actionStatus}
                      </span>
                      
                      {log.actionStatus === 'PENDING' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => completeAction.mutateAsync(log.id)}
                            className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                          </button>
                          <button 
                            onClick={() => cancelAction.mutateAsync(log.id)}
                            className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-100 dark:bg-zinc-700 px-2 py-1 rounded transition"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))\;

  const endOfMap = bottom.lastIndexOf('))');
  bottom = '\n' + editFormUI + bottom.substring(endOfMap + 2);
  code = mapSplit[0] + 'logs.map(log => (' + bottom;
}

fs.writeFileSync('src/modules/leads/components/LeadActivityLog.tsx', code);
console.log("Patch applied!");
