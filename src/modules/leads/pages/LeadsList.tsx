import { useState } from 'react';
import { useLeadsList } from '../api/queries';
import { useSavedFilters, useSaveFilter, useDeleteFilter } from '../api/filters';
import { Search, Filter, Save, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function LeadsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilterId, setActiveFilterId] = useState<string>('');
  
  const { data: filtersData } = useSavedFilters();
  const saveFilterMutation = useSaveFilter();
  const deleteFilterMutation = useDeleteFilter();
  
  const { data, isLoading } = useLeadsList({ search: searchTerm, filterId: activeFilterId });

  const handleSaveFilter = () => {
    const name = prompt('Enter a name for this filter:');
    if (name) {
      saveFilterMutation.mutate({ name, filters: { search: searchTerm } });
    }
  };

  return (
    <div className="p-4 h-full flex flex-col bg-gray-50 dark:bg-zinc-900">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold dark:text-white">Leads</h1>
        <div className="flex items-center space-x-2">
          {Array.isArray(filtersData) && filtersData.length > 0 && (
            <select 
              value={activeFilterId}
              onChange={(e) => setActiveFilterId(e.target.value)}
              className="text-sm p-1.5 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-md dark:text-gray-200"
            >
              <option value="">Saved Filters...</option>
              {filtersData.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          )}
          {activeFilterId && (
            <button onClick={() => { deleteFilterMutation.mutate(activeFilterId); setActiveFilterId(''); }} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button onClick={handleSaveFilter} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800" title="Save this filter">
            <Save className="w-4 h-4" />
          </button>
          <button className="p-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md shadow-sm">
            <Filter className="w-4 h-4 dark:text-gray-300" />
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search name, phone, company..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md leading-5 bg-white dark:bg-zinc-800 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-24">
        {isLoading ? (
          <div className="text-center py-4">Loading leads...</div>
        ) : data?.data && data.data.length > 0 ? (
          data.data.map(lead => (
            <Link key={lead.id} to={`/leads/${lead.id}`} className="block">
              <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{lead.name}</h3>
                    {lead.company && <p className="text-sm text-gray-500 dark:text-gray-400">{lead.company}</p>}
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    {lead.stage}
                  </span>
                </div>
                <div className="mt-3 flex gap-2 flex-wrap text-xs">
                  <span className="bg-gray-100 dark:bg-zinc-700 px-2 py-1 rounded dark:text-gray-300">
                    Priority: {lead.priority}
                  </span>
                  {lead.nextFollowUpDate && (
                    <span className="bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 px-2 py-1 rounded flex items-center gap-1">
                      Next: {format(new Date(lead.nextFollowUpDate), 'MMM d')}
                    </span>
                  )}
                  {lead.lastContactedDate && (
                    <span className="bg-gray-100 dark:bg-zinc-700 px-2 py-1 rounded dark:text-gray-300 flex items-center gap-1">
                      Last: {format(new Date(lead.lastContactedDate), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            No leads found. Tap + to add one.
          </div>
        )}
      </div>
    </div>
  );
}
