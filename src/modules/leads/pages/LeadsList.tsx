import { useState, useEffect } from 'react';
import { useLeadsList, useStages, useCategories } from '../api/queries';
import { useSavedFilters, useSaveFilter, useDeleteFilter } from '../api/filters';
import { Search, Filter, Save, Trash2, Link2, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const getInitials = (name?: string) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export default function LeadsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilterId, setActiveFilterId] = useState<string>('');
  
  // New filter states
  const [hasMobileNo, setHasMobileNo] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // Fetch filter options
  const { data: stages } = useStages();
  const { data: categories } = useCategories();
  
  // Debounce the search input by 500ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: filtersData } = useSavedFilters();
  const saveFilterMutation = useSaveFilter();
  const deleteFilterMutation = useDeleteFilter();
  
  const currentFilters: any = {};
  if (debouncedSearch) {
    currentFilters.q = debouncedSearch;
    currentFilters.search = debouncedSearch; // pass both just in case backend expects the old one
  }
  if (hasMobileNo) currentFilters.hasMobileNo = true;
  if (selectedStageId) currentFilters.stageId = selectedStageId;
  if (selectedCategoryId) currentFilters.categoryId = selectedCategoryId;
  if (activeFilterId) currentFilters.filterId = activeFilterId;

  const { data, isLoading } = useLeadsList(currentFilters);

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

      <div className="relative mb-3">
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

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-sm">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
          <input 
            type="checkbox" 
            checked={hasMobileNo}
            onChange={(e) => setHasMobileNo(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          Has Mobile No
        </label>

        <div className="h-4 w-px bg-gray-300 dark:bg-zinc-600 hidden sm:block"></div>

        <select
          value={selectedStageId}
          onChange={(e) => setSelectedStageId(e.target.value)}
          className="text-sm p-1.5 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-md dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Stages</option>
          {(Array.isArray(stages) ? stages : []).map(stage => (
            <option key={stage.id} value={stage.id}>{stage.name}</option>
          ))}
        </select>

        <select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="text-sm p-1.5 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-md dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {(Array.isArray(categories) ? categories : []).map(category => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-24">
        {isLoading ? (
          <div className="text-center py-4">Loading leads...</div>
        ) : data?.content && data.content.length > 0 ? (
          data.content.map(lead => {
            const priorityLabel = lead.priority === 'HOT' ? 'High' : lead.priority === 'WARM' ? 'Medium' : lead.priority === 'COLD' ? 'Low' : lead.priority;
            return (
            <Link key={lead.id} to={`/leads/${lead.id}`} className="block">
              <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 transition">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {getInitials(lead.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{lead.fullName}</h3>
                        {lead.linkedinUrl && (
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(lead.linkedinUrl, '_blank'); }} className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                            <Link2 className="w-4 h-4" />
                          </button>
                        )}
                        <span className="text-xs text-gray-400 dark:text-gray-500">#{lead.id}</span>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 whitespace-nowrap ml-2">
                        {lead.stageName}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {lead.jobTitle && lead.company ? `${lead.jobTitle} at ${lead.company}` : lead.jobTitle || lead.company || ''}
                    </p>
                    
                    {lead.mobileNumber && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <Phone className="w-3 h-3" />
                        <span>{lead.mobileNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex gap-2 flex-wrap text-xs pl-[60px]">
                  <span className="bg-gray-100 dark:bg-zinc-700 px-2 py-1 rounded dark:text-gray-300">
                    Priority: {priorityLabel}
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
          )})
        ) : (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            No leads found. Tap + to add one.
          </div>
        )}
      </div>
    </div>
  );
}
