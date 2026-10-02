import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLeadDetail } from '../api/queries';
import { Phone, MessageCircle, MoreVertical, ArrowLeft, Link2 } from 'lucide-react';
import LogInteractionSheet from '../components/LogInteractionSheet';

const getInitials = (name?: string) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: lead, isLoading } = useLeadDetail(id!);
  const [activeTab, setActiveTab] = useState<'timeline' | 'details' | 'followups' | 'tosend'>('timeline');
  const [logSheetOpen, setLogSheetOpen] = useState(false);

  if (isLoading) return <div className="p-4 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  if (!lead) return <div className="p-4">Lead not found</div>;

  const priorityLabel = lead.priority === 'HOT' ? 'High' : lead.priority === 'WARM' ? 'Medium' : lead.priority === 'COLD' ? 'Low' : lead.priority;

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
          <div className="flex flex-wrap gap-2">
            <select 
              value={lead.stageName}
              onChange={() => {}}
              className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-md px-2 py-1 text-sm font-medium focus:outline-none"
            >
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal">Proposal</option>
              <option value="Won">Won</option>
            </select>
            <span className="bg-gray-100 dark:bg-zinc-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-md text-sm font-medium border border-gray-200 dark:border-zinc-600">
              {priorityLabel} Priority
            </span>
            <span className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-1 rounded-md text-sm font-medium border border-purple-200 dark:border-purple-800">
              {lead.categoryName}
            </span>
          </div>

          {lead.mobileNumber && (
            <div className="flex gap-2 pt-1">
              <a href={`tel:${lead.mobileNumber}`} className="flex-1 flex justify-center items-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition">
                <Phone className="w-4 h-4" /> Call
              </a>
              <a href={`https://wa.me/${lead.mobileNumber?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 flex justify-center items-center gap-2 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-200 dark:border-zinc-700 overflow-x-auto hide-scrollbar">
          {(['timeline', 'details', 'followups', 'tosend'] as const).map(tab => (
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
            <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700">
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center">No interactions logged yet.</p>
            </div>
          </div>
        )}
        {activeTab === 'details' && (
          <div className="space-y-4">
             <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 space-y-3">
               <div><span className="text-gray-500 dark:text-gray-400 text-sm">Phone:</span> <p className="dark:text-white">{lead.mobileNumber}</p></div>
               <div><span className="text-gray-500 dark:text-gray-400 text-sm">Notes:</span> <p className="dark:text-white">{lead.remark || 'N/A'}</p></div>
             </div>
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
