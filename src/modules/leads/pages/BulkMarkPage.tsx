import { useState, useEffect, useCallback } from 'react';
import { useLeadsList, useCategories, useUpdateLeadCategories } from '../api/queries';
import { Search, ChevronLeft, ChevronRight, CheckSquare, Loader2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Lead, CategoryGroup, CategoryValue } from '../types';

// Color palettes per group index
const GROUP_COLORS = [
  // Group 0 — e.g., Relationship Stage
  {
    base: 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-zinc-600 hover:border-blue-400',
    active: 'bg-blue-100 text-blue-800 border-blue-400 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-600 font-semibold',
  },
  // Group 1 — e.g., Business Potential
  {
    base: 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-zinc-600 hover:border-emerald-400',
    active: 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-600 font-semibold',
  },
  // Group 2 — additional groups
  {
    base: 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-zinc-600 hover:border-violet-400',
    active: 'bg-violet-100 text-violet-800 border-violet-400 dark:bg-violet-900/50 dark:text-violet-300 dark:border-violet-600 font-semibold',
  },
  // Group 3
  {
    base: 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-zinc-600 hover:border-amber-400',
    active: 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-600 font-semibold',
  },
];

// ---- Inline category pills per row ----
interface CategoryPillsProps {
  lead: Lead;
  group: CategoryGroup;
  groupIndex: number;
  onMark: (lead: Lead, group: CategoryGroup, valueId: number) => void;
  pendingLeadId: string | null;
}

function CategoryPills({ lead, group, groupIndex, onMark, pendingLeadId }: CategoryPillsProps) {
  const selectedIds = (lead.categories || []).map((c) => Number(c.id));
  const color = GROUP_COLORS[groupIndex % GROUP_COLORS.length];
  const isPending = pendingLeadId === String(lead.id);

  return (
    <div className="flex flex-wrap gap-1">
      {group.values.map((val: CategoryValue) => {
        const isSelected = selectedIds.includes(Number(val.id));
        return (
          <button
            key={val.id}
            disabled={isPending}
            onClick={() => onMark(lead, group, Number(val.id))}
            className={`px-2 py-0.5 text-xs rounded-full border transition-all duration-150 ${
              isSelected ? color.active : color.base
            } ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {val.name}
          </button>
        );
      })}
    </div>
  );
}

// ---- Main Page ----
export default function BulkMarkPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 30;

  // debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const filters = {
    search: debouncedSearch || undefined,
    page,
    size: pageSize,
    sort: 'createdAt,desc',
  };

  const { data: leadsData, isLoading: leadsLoading } = useLeadsList(filters);
  const { data: categoryGroups = [] } = useCategories('LEAD');
  const updateCategories = useUpdateLeadCategories();

  // Track which lead is currently being saved (optimistic feel)
  const [pendingLeadId, setPendingLeadId] = useState<string | null>(null);

  // Optimistic local state: override lead categories until server confirms
  const [localOverrides, setLocalOverrides] = useState<Record<string, number[]>>({});

  const leads: Lead[] = leadsData?.content || [];
  const totalPages = leadsData?.totalPages || 0;
  const totalElements = leadsData?.totalElements || 0;

  // Clear local overrides when page/search changes
  useEffect(() => {
    setLocalOverrides({});
  }, [debouncedSearch, page]);

  // Groups to display — exclude campaign-type multi-select groups
  const displayGroups = (Array.isArray(categoryGroups) ? categoryGroups : []).filter(
    (g) => !g.name.toLowerCase().includes('campaign')
  );

  const handleMark = useCallback(
    async (lead: Lead, group: CategoryGroup, clickedValueId: number) => {
      const leadId = String(lead.id);
      const groupValueIds = group.values.map((v) => Number(v.id));

      // Compute current effective category IDs for this lead
      const effectiveIds: number[] = localOverrides[leadId]
        ?? (lead.categories || []).map((c) => Number(c.id));

      // Toggle logic: single-select per group (replace existing from same group)
      const idsWithoutThisGroup = effectiveIds.filter((id) => !groupValueIds.includes(id));
      const alreadySelected = effectiveIds.includes(clickedValueId);
      const newIds = alreadySelected
        ? idsWithoutThisGroup // deselect
        : [...idsWithoutThisGroup, clickedValueId]; // select new

      // Apply optimistic update immediately
      setLocalOverrides((prev) => ({ ...prev, [leadId]: newIds }));
      setPendingLeadId(leadId);

      try {
        await updateCategories.mutateAsync({ id: leadId, categoryIds: newIds });
      } catch {
        // Rollback on error
        setLocalOverrides((prev) => {
          const copy = { ...prev };
          delete copy[leadId];
          return copy;
        });
      } finally {
        setPendingLeadId(null);
      }
    },
    [localOverrides, updateCategories]
  );

  // Helper: get lead with local overrides applied
  const getEffectiveLead = (lead: Lead): Lead => {
    const override = localOverrides[String(lead.id)];
    if (!override) return lead;
    // Build category value objects from all group values
    const allValues = displayGroups.flatMap((g) => g.values);
    const overrideCats = override.map((id) => allValues.find((v) => Number(v.id) === id)).filter(Boolean) as CategoryValue[];
    return { ...lead, categories: overrideCats };
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Bulk Mark</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tap a category value to assign it instantly — no modal needed.
            </p>
          </div>
          {totalElements > 0 && (
            <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 font-medium">
              {totalElements} leads
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search leads by name, company, mobile…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition"
          />
        </div>

        {/* Category group legend (column headers for desktop) */}
        {displayGroups.length > 0 && (
          <div className="hidden md:flex gap-2 mt-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            <span className="w-8 shrink-0">#</span>
            <span className="w-48 shrink-0">Lead</span>
            {displayGroups.map((g, i) => (
              <span
                key={g.id}
                className={`flex-1 ${
                  i === 0
                    ? 'text-blue-500'
                    : i === 1
                    ? 'text-emerald-500'
                    : i === 2
                    ? 'text-violet-500'
                    : 'text-amber-500'
                }`}
              >
                {g.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Pagination — top */}
      {totalPages > 1 && (
        <div className="shrink-0 flex items-center justify-between px-4 py-1.5 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-gray-500 dark:text-gray-400">
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Table / List body */}
      <div className="flex-1 overflow-y-auto">
        {leadsLoading ? (
          <div className="flex items-center justify-center h-40 gap-2 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm gap-2">
            <CheckSquare className="w-8 h-8 opacity-30" />
            <span>No leads found</span>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {leads.map((rawLead, idx) => {
              const lead = getEffectiveLead(rawLead);
              const serialNo = page * pageSize + idx + 1;
              const isPending = pendingLeadId === String(lead.id);

              return (
                <div
                  key={lead.id}
                  className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-3 px-4 py-3 transition-colors ${
                    isPending
                      ? 'bg-blue-50/60 dark:bg-blue-900/10'
                      : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  {/* Serial No */}
                  <span className="hidden md:block w-8 shrink-0 text-xs text-gray-400 dark:text-gray-500 font-mono">
                    {serialNo}
                  </span>

                  {/* Lead Name */}
                  <div className="md:w-48 shrink-0 flex items-start gap-1.5">
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono md:hidden mr-0.5">
                      {serialNo}.
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/leads/${lead.id}`}
                          className="text-sm font-semibold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 truncate block max-w-[150px]"
                        >
                          {lead.fullName}
                        </Link>
                        <Link
                          to={`/leads/${lead.id}`}
                          className="text-gray-400 hover:text-blue-500 shrink-0"
                          tabIndex={-1}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        {isPending && <Loader2 className="w-3 h-3 text-blue-500 animate-spin shrink-0" />}
                      </div>
                      {lead.company && (
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate block max-w-[150px]">
                          {lead.company}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category groups — inline pills */}
                  <div className="flex flex-col md:flex-row gap-2 md:gap-3 flex-1">
                    {displayGroups.map((group, groupIdx) => (
                      <div key={group.id} className="flex-1 min-w-0">
                        {/* Mobile: show group label */}
                        <div className="md:hidden text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                          {group.name}
                        </div>
                        <CategoryPills
                          lead={lead}
                          group={group}
                          groupIndex={groupIdx}
                          onMark={handleMark}
                          pendingLeadId={pendingLeadId}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination — bottom */}
      {totalPages > 1 && (
        <div className="shrink-0 flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-gray-500 dark:text-gray-400">
          <span>
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)} of {totalElements}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {/* Page pills */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pg = Math.max(0, Math.min(totalPages - 5, page - 2)) + i;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-6 h-6 rounded text-[11px] font-medium transition ${
                    pg === page
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {pg + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
