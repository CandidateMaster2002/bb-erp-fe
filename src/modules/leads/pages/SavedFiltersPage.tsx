import { useState } from 'react';
import { useSavedFilters, useDeleteFilter } from '../api/filters';
import { Bookmark, Link2, Trash2, ArrowUpRight, Search, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function SavedFiltersPage() {
  const { data: savedFilters = [], isLoading } = useSavedFilters();
  const deleteMutation = useDeleteFilter();
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopyLink = (path: string, id: string | number) => {
    const fullUrl = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string | number, name: string) => {
    if (window.confirm(`Are you sure you want to delete the saved filter "${name}"?`)) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const filteredList = savedFilters.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.filters?.path || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Filters & Views</h1>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
              {savedFilters.length} saved
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Access, copy shareable links, or open your custom filtered views instantly without re-applying filters.
          </p>
        </div>

        {savedFilters.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search saved views..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-500">Loading saved views...</div>
      ) : savedFilters.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800/80 rounded-2xl border border-gray-200 dark:border-zinc-700 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">No saved filters yet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
            Whenever you search or filter leads by tags, categories, or mobile numbers, click the <strong>Save View</strong> or <strong>Copy Link</strong> button. It will appear here and in your left navigation panel for 1-click access!
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/leads"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              Go to Leads CRM
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((item) => {
            const path = item.filters?.path || `/leads?viewId=${item.id}`;
            const search = item.filters?.search;
            const hasMobile = item.filters?.hasMobileNo;
            const tagIds = item.filters?.tagIds;
            const recordType = item.filters?.recordType || 'LEAD';

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Bookmark className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-gray-400">
                          {recordType === 'COLLABORATOR' ? 'Collaborators' : 'Leads'}
                          {item.createdAt && ` • Saved ${format(new Date(item.createdAt), 'MMM d, yyyy')}`}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                      title="Delete saved view"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Filter tags preview */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {search && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300">
                        <Search className="w-2.5 h-2.5" /> "{search}"
                      </span>
                    )}
                    {hasMobile === true && (
                      <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Has Phone
                      </span>
                    )}
                    {hasMobile === false && (
                      <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        No Phone
                      </span>
                    )}
                    {Array.isArray(tagIds) && tagIds.length > 0 && (
                      <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {tagIds.length} tag{tagIds.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Shareable Link Bar */}
                  <div className="mt-3 flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-900/70 p-1.5 rounded-lg border border-gray-100 dark:border-zinc-700/60 text-xs">
                    <span className="font-mono text-[11px] text-gray-500 truncate flex-1 select-all">
                      {window.location.origin}{path}
                    </span>
                    <button
                      onClick={() => handleCopyLink(path, item.id)}
                      className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded text-gray-700 dark:text-gray-300 text-[11px] font-medium shadow-2xs transition shrink-0"
                      title="Copy full link"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Link2 className="w-3 h-3 text-gray-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-zinc-700/60 flex items-center justify-end">
                  <Link
                    to={path}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                  >
                    <span>Open Filtered View</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
