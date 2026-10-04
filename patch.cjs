const fs = require('fs');
let code = fs.readFileSync('src/modules/actions/pages/ActionsAgenda.tsx', 'utf8');

const targetBlock = \<div key={action.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-blue-300 dark:hover:border-blue-700">
                <div className="flex-1">\;

const replaceBlock = \<div key={action.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 flex flex-col gap-4 transition hover:border-blue-300 dark:hover:border-blue-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">\;

code = code.replace(targetBlock, replaceBlock);

const buttonTarget = \<button 
                    onClick={() => cancelAction.mutateAsync(action.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-gray-300 rounded-lg text-sm font-medium transition border border-gray-200 dark:border-zinc-700"
                  >
                    <XCircle className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>\;

const buttonReplace = \<button 
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
                        className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-700 rounded-md transition border border-transparent hover:border-gray-200 dark:hover:border-zinc-600"
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
              </div>\;

code = code.replace(buttonTarget, buttonReplace);

fs.writeFileSync('src/modules/actions/pages/ActionsAgenda.tsx', code);
