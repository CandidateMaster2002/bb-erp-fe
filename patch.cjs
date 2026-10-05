const fs = require('fs');
let code = fs.readFileSync('src/modules/actions/pages/ActionsAgenda.tsx', 'utf8');

const importTarget = "import { Link } from 'react-router-dom';";
const importReplacement = "import { Link } from 'react-router-dom';\nimport TasksView from '../components/TasksView';";
code = code.replace(importTarget, importReplacement);

const stateTarget = "const [viewMode, setViewMode] = useState<ViewMode>('today');";
const stateReplacement = "const [activeTab, setActiveTab] = useState<'leads' | 'tasks'>('leads');\n  const [viewMode, setViewMode] = useState<ViewMode>('today');";
code = code.replace(stateTarget, stateReplacement);

const uiTarget = eturn (
    <div className="p-4 max-w-5xl mx-auto pb-24 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold dark:text-white">Agenda</h1>
        
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 p-1 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm">;

const uiReplacement = eturn (
    <div className="p-4 max-w-5xl mx-auto pb-24 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold dark:text-white">Agenda</h1>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg border border-gray-200 dark:border-zinc-700">
            <button 
              onClick={() => setActiveTab('leads')}
              className={\px-3 py-1.5 text-sm font-medium rounded-md transition \\}
            >
              Lead Follow-ups
            </button>
            <button 
              onClick={() => setActiveTab('tasks')}
              className={\px-3 py-1.5 text-sm font-medium rounded-md transition \\}
            >
              My To-Do List
            </button>
          </div>
        </div>
        
        {activeTab === 'leads' && (
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 p-1 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm">;
code = code.replace(uiTarget, uiReplacement);

const listStartTarget = <div className="flex-1 overflow-y-auto hide-scrollbar -mx-4 px-4">;
const listStartReplacement = {activeTab === 'tasks' ? (\n        <TasksView />\n      ) : (\n      <div className="flex-1 overflow-y-auto hide-scrollbar -mx-4 px-4">;
code = code.replace(listStartTarget, listStartReplacement);

const endTarget =           })
        )}
      </div>
    </div>
  );
};
const endReplacement =           })
        )}
      </div>
      )}
    </div>
  );
};
code = code.replace(endTarget, endReplacement);

// Close the activeTab === 'leads' condition for the header
const headerEndTarget =           </button>
        </div>
      </div>;
const headerEndReplacement =           </button>
        </div>
        )}
      </div>;
code = code.replace(headerEndTarget, headerEndReplacement);

fs.writeFileSync('src/modules/actions/pages/ActionsAgenda.tsx', code);
