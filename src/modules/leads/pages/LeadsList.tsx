import { useState, useEffect } from 'react';
import { useLeadsList, useCategories, useUpdateLeadDetail, useDeleteLead } from '../api/queries';
import { useSavedFilters, useSaveFilter, useDeleteFilter } from '../api/filters';
import { Search, Filter, Save, Trash2, Link2, Phone, Zap, LayoutGrid, List, Edit2, Check, X, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import QuickUpdateModal from '../components/QuickUpdateModal';
import ScheduleFollowUpModal from '../components/ScheduleFollowUpModal';
import LeadLogsModal from '../components/LeadLogsModal';
import type { Lead } from '../types';

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function LeadsList({ recordType = 'LEAD' }: { recordType?: 'LEAD' | 'COLLABORATOR' }) {
  const updateLead = useUpdateLeadDetail();
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editingContactValue, setEditingContactValue] = useState('');

  const handleContactSave = async (id: string | number) => {
    if (editingContactId === id.toString()) {
      await updateLead.mutateAsync({ id, lead: { mobileNumber: editingContactValue } });
      setEditingContactId(null);
    }
  };

  const deleteLead = useDeleteLead();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilterId, setActiveFilterId] = useState<string>('');
  const [quickUpdateLead, setQuickUpdateLead] = useState<Lead | null>(null);
  const [followUpLeadId, setFollowUpLeadId] = useState<string | number | null>(null);
  const [logsLead, setLogsLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table'); // Default to table for denser view
  
  // New filter states
  const [hasMobileNo, setHasMobileNo] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Record<string, string>>({});

  // Fetch filter options
  const { data: categories } = useCategories(recordType);
  
  // Debounce the search input by 500ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: filtersData } = useSavedFilters();
  const saveFilterMutation = useSaveFilter();
  const deleteFilterMutation = useDeleteFilter();
  
  const currentFilters: any = { recordType };
  if (debouncedSearch) {
    currentFilters.q = debouncedSearch;
    currentFilters.search = debouncedSearch;
  }
  if (hasMobileNo && recordType !== 'COLLABORATOR') currentFilters.hasMobileNo = true;
  
  // Pass all selected category values. The backend expects ?categoryId=1&categoryId=4
  const categoryIdsParam = Object.values(selectedCategoryIds).filter(Boolean);
  if (categoryIdsParam.length > 0) {
    currentFilters.categoryId = categoryIdsParam;
  }
  
  if (activeFilterId) currentFilters.filterId = activeFilterId;

  // Global preference: Hide dead leads unless explicitly filtering by it
  const hideDeadLeads = localStorage.getItem('hideDeadLeads') !== 'false';
  let deadCategoryId = '';
  if (categories) {
    for (const group of categories) {
      const deadCat = group.values?.find(v => v.name.toLowerCase() === 'dead' || v.name.toLowerCase() === 'dead lead');
      if (deadCat) {
        deadCategoryId = deadCat.id.toString();
        break;
      }
    }
  }

  if (hideDeadLeads && deadCategoryId && !categoryIdsParam.includes(deadCategoryId)) {
    // Only exclude if it's not being explicitly searched for
    const searchLower = debouncedSearch.toLowerCase();
    if (!searchLower.includes('dead')) {
      currentFilters.excludeCategoryId = deadCategoryId;
    }
  }

  const { data, isLoading } = useLeadsList(currentFilters);

  const handleSaveFilter = () => {
    const name = prompt('Enter a name for this filter:');
    if (name) {
      saveFilterMutation.mutate({ name, filters: { search: searchTerm } });
    }
  };

  const handleDeleteLead = async (leadId: string | number) => {
    if (window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      await deleteLead.mutateAsync(leadId);
    }
  };

  const routePath = recordType === 'COLLABORATOR' ? 'collaborators' : 'leads';
  const title = recordType === 'COLLABORATOR' ? 'Collaborators' : 'Leads';
  

  return (
    <div className="p-4 h-full flex flex-col bg-gray-50 dark:bg-zinc-900">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold dark:text-white">{title}</h1>
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
          <div className="flex bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md overflow-hidden shadow-sm ml-2">
            <button 
              onClick={() => setViewMode('table')} 
              className={`p-1.5 ${viewMode === 'table' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('card')} 
              className={`p-1.5 border-l border-gray-300 dark:border-zinc-700 ${viewMode === 'card' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
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
        {recordType !== 'COLLABORATOR' && (
          <>
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
          </>
        )}

        {Array.isArray(categories) && categories.map(group => (
          <select
            key={group.id}
            value={selectedCategoryIds[group.id] || ''}
            onChange={(e) => setSelectedCategoryIds(prev => ({ ...prev, [group.id]: e.target.value }))}
            className="text-sm p-1.5 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-md dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">{group.name} (All)</option>
            {group.values?.map(val => (
              <option key={val.id} value={val.id}>{val.name}</option>
            ))}
          </select>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {isLoading ? (
          <div className="text-center py-4">{`Loading ${title.toLowerCase()}...`}</div>
        ) : data?.content && data.content.length > 0 ? (
          viewMode === 'card' ? (
            <div className="space-y-3">
              {data.content.map(lead => (
                <Link key={lead.id} to={`/${routePath}/${lead.id}`} className="block">
                  <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{lead.fullName}</h3>
                          {lead.linkedinUrl && (
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(lead.linkedinUrl, '_blank'); }} className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                              <Link2 className="w-4 h-4" />
                            </button>
                          )}
                          <span className="text-xs text-gray-400 dark:text-gray-500">#{lead.id}</span>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {lead.jobTitle && lead.company ? `${lead.jobTitle} at ${lead.company}` : lead.jobTitle || lead.company || ''}
                        </p>
                        
                        <div className="group/contact flex items-center h-6 mt-1 cursor-pointer" onClick={(e) => { if (editingContactId !== lead.id.toString()) { e.preventDefault(); setEditingContactId(lead.id.toString()); setEditingContactValue(lead.mobileNumber || ''); } }}>
                          {editingContactId === lead.id.toString() ? (
                            <div className="flex items-center gap-1 w-full max-w-[200px]" onClick={e => e.preventDefault()}>
                              <input 
                                type="text"
                                autoFocus
                                value={editingContactValue}
                                onChange={e => setEditingContactValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleContactSave(lead.id);
                                  if (e.key === 'Escape') setEditingContactId(null);
                                }}
                                className="w-full px-2 py-0.5 text-xs border rounded dark:bg-zinc-800 dark:border-zinc-700 focus:ring-1 focus:ring-blue-500 outline-none text-gray-900 dark:text-gray-100"
                                placeholder="Mobile No"
                              />
                              <button onClick={(e) => { e.preventDefault(); handleContactSave(lead.id); }} className="text-green-600 p-0.5 hover:bg-green-50 rounded dark:hover:bg-green-900/30">
                                <Check className="w-3 h-3" />
                              </button>
                              <button onClick={(e) => { e.preventDefault(); setEditingContactId(null); }} className="text-gray-500 p-0.5 hover:bg-gray-100 rounded dark:hover:bg-zinc-700">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              {lead.mobileNumber ? (
                                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                  <Phone className="w-3 h-3" />
                                  <span>{lead.mobileNumber}</span>
                                </div>
                              ) : (
                                <div className="text-xs text-gray-400 italic flex items-center gap-1"><Phone className="w-3 h-3 opacity-50" /> Add contact</div>
                              )}
                              <Edit2 className="w-3 h-3 opacity-0 group-hover/contact:opacity-100 ml-2 text-gray-400 transition" />
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end items-start">
                        {lead.categories?.map(c => (
                          <span key={c.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 whitespace-nowrap">
                            {c.name}
                          </span>
                        ))}
                        <button onClick={(e) => { e.preventDefault(); setLogsLead(lead); }} className="ml-1 p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-zinc-700 rounded-md transition" title="View Logs"><ClipboardList className="w-4 h-4" /></button>
                        <button 
                          onClick={(e) => { e.preventDefault(); setQuickUpdateLead(lead); }}
                          className="ml-1 p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-700 rounded-md transition"
                          title="Quick Update"
                        >
                          <Zap className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.preventDefault(); handleDeleteLead(lead.id); }}
                          className="ml-1 p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-zinc-700 rounded-md transition"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2 flex-wrap text-xs">
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
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700 text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-900/50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Lead</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Company / Title</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Contact</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Categories</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  {data.content.map(lead => (
                    <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700/50 group transition">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link to={`/${routePath}/${lead.id}`} className="block">
                          <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5"><span className="text-xs text-gray-400 dark:text-gray-500 font-normal">#{lead.id}</span>{lead.fullName}</div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                        {lead.company || '-'}
                        {lead.jobTitle && <div className="text-xs text-gray-500 dark:text-gray-400">{lead.jobTitle}</div>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300 relative group/contact" onClick={(e) => { if (editingContactId !== lead.id.toString()) { e.preventDefault(); setEditingContactId(lead.id.toString()); setEditingContactValue(lead.mobileNumber || ''); } }}>
                        {editingContactId === lead.id.toString() ? (
                          <div className="flex items-center gap-1" onClick={e => e.preventDefault()}>
                            <input 
                              type="text"
                              autoFocus
                              value={editingContactValue}
                              onChange={e => setEditingContactValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleContactSave(lead.id);
                                if (e.key === 'Escape') setEditingContactId(null);
                              }}
                              className="w-28 px-2 py-1 text-xs border rounded dark:bg-zinc-800 dark:border-zinc-700 focus:ring-1 focus:ring-blue-500 outline-none text-gray-900 dark:text-gray-100"
                              placeholder="Mobile No"
                            />
                            <button onClick={(e) => { e.preventDefault(); handleContactSave(lead.id); }} className="text-green-600 hover:text-green-700 p-1 bg-green-50 rounded dark:bg-green-900/30 transition">
                              <Check className="w-3 h-3" />
                            </button>
                            <button onClick={(e) => { e.preventDefault(); setEditingContactId(null); }} className="text-gray-500 hover:text-gray-700 p-1 bg-gray-100 rounded dark:bg-zinc-800 transition">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 cursor-pointer">
                            <span className={lead.mobileNumber ? '' : 'text-gray-400'}>{lead.mobileNumber || '-'}</span>
                            <Edit2 className="w-3 h-3 opacity-0 group-hover/contact:opacity-100 text-gray-400 transition" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {lead.categories?.map(c => (
                            <span key={c.id} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 whitespace-nowrap">
                              {c.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-1">
                          {lead.linkedinUrl && (
                            <button 
                              onClick={(e) => { e.preventDefault(); window.open(lead.linkedinUrl, '_blank'); }}
                              className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition"
                              title="LinkedIn Profile"
                            >
                              <LinkedinIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={(e) => { e.preventDefault(); setLogsLead(lead); }} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-zinc-700 rounded transition" title="View Logs"><ClipboardList className="w-4 h-4" /></button>
                          <button 
                            onClick={(e) => { e.preventDefault(); setQuickUpdateLead(lead); }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-700 rounded transition"
                            title="Quick Update"
                          >
                            <Zap className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.preventDefault(); handleDeleteLead(lead.id); }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-zinc-700 rounded transition"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            {`No ${title.toLowerCase()} found. Tap + to add one.`}
          </div>
        )}
      </div>

      <QuickUpdateModal lead={quickUpdateLead} onClose={() => setQuickUpdateLead(null)} />
      <LeadLogsModal
        isOpen={!!logsLead}
        onClose={() => setLogsLead(null)}
        leadId={logsLead?.id?.toString() || ''}
        leadName={logsLead?.fullName}
      />
      <ScheduleFollowUpModal 
        isOpen={!!followUpLeadId} 
        onClose={() => setFollowUpLeadId(null)} 
        leadId={followUpLeadId} 
      />
    </div>
  );
}
