import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  useLeadDetail, 
  useCategories, 
  useUpdateLeadCategories 
} from '../api/queries';
import { Phone, MoreVertical, ArrowLeft, Link2 } from 'lucide-react';
import LogInteractionSheet from '../components/LogInteractionSheet';
import LeadActivityLog from '../components/LeadActivityLog';
import LeadDetailsTab from '../components/LeadDetailsTab';
import type { CategoryGroup } from '../types';

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: lead, isLoading } = useLeadDetail(id!);
  const { data: categoryGroups } = useCategories();
  const updateCategoriesMutation = useUpdateLeadCategories();

  const [activeTab, setActiveTab] = useState<'timeline' | 'details'>('timeline');
  const [logSheetOpen, setLogSheetOpen] = useState(false);

  if (isLoading) return <div className="p-4 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  if (!lead) return <div className="p-4">Lead not found</div>;

  const currentCategoryIds = lead.categories?.map(c => c.id) || [];

  const handleGroupCategoryChange = (group: CategoryGroup, newValueId: string) => {
    const groupValueIds = group.values?.map(v => v.id) || [];
    
    // Remove all existing categories that belong to this group
    const newCategoryIds = currentCategoryIds.filter(id => !groupValueIds.includes(id));
    
    // If a new value was selected, add it
    if (newValueId) {
      newCategoryIds.push(Number(newValueId));
    }
    
    updateCategoriesMutation.mutate({ id: lead.id, categoryIds: newCategoryIds });
  };

  return (
    <div className="bg-gray-50 dark:bg-zinc-900 min-h-full pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 sticky top-0 z-10">
        <div className="p-4 flex items-start gap-4">
          <Link to="/leads" className="mt-1 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition flex-shrink-0">
            <ArrowLeft className="w-5 h-5 dark:text-gray-200" />
          </Link>

          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold truncate dark:text-white">{lead.fullName}</h1>
              {lead.linkedinUrl && (
                <a href={lead.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  <Link2 className="w-5 h-5" />
                </a>
              )}
              <span className="text-sm text-gray-400 dark:text-gray-500">#{lead.id}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
              {lead.jobTitle && lead.company ? `${lead.jobTitle} at ${lead.company}` : lead.jobTitle || lead.company || ''}
            </p>
            {lead.mobileNumber && (
              <div className="flex items-center gap-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                <Phone className="w-4 h-4" />
                <span>{lead.mobileNumber}</span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-4 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            {Array.isArray(categoryGroups) && categoryGroups.map(group => {
              const groupValueIds = group.values?.map(v => v.id) || [];
              const currentVal = lead.categories?.find(c => groupValueIds.includes(c.id));
              const selectedValueId = currentVal ? currentVal.id : '';

              return (
                <div key={group.id} className="flex items-center">
                  <select
                    value={selectedValueId}
                    onChange={(e) => handleGroupCategoryChange(group, e.target.value)}
                    className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-md px-2 py-1 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="">Select {group.name}</option>
                    {group.values?.map(val => (
                      <option key={val.id} value={val.id}>{val.name}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-200 dark:border-zinc-700 overflow-x-auto hide-scrollbar">
          {(['timeline', 'details'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[100px] py-3 text-sm font-medium text-center capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <LeadActivityLog leadId={lead.id} />
          </div>
        )}
        {activeTab === 'details' && (
          <div className="space-y-4">
            <LeadDetailsTab lead={lead} />
          </div>
        )}
        {/* other tabs placeholder */}
      </div>

      {/* Sticky Bottom Log Interaction */}
      <div className="fixed bottom-16 md:bottom-0 left-0 md:left-64 right-0 p-4 bg-white dark:bg-zinc-950 border-t border-gray-200 dark:border-zinc-800 z-30">
        <button onClick={() => setLogSheetOpen(true)} className="w-full py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md font-medium transition flex justify-center items-center gap-2">
           Log Interaction
        </button>
      </div>

      <LogInteractionSheet open={logSheetOpen} onOpenChange={setLogSheetOpen} />
    </div>
  );
}
