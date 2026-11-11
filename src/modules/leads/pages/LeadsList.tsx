import { useState, useEffect } from 'react';
import { useLeadsList, useCategories, useTags, useUpdateLeadDetail, useDeleteLead, useUpdateLeadCategories } from '../api/queries';
import { useSavedFilters, useSaveFilter, useDeleteFilter } from '../api/filters';
import { Search, Trash2, Link2, Phone, Zap, LayoutGrid, List, Edit2, Check, X, Tag as TagIcon, ChevronDown, ChevronLeft, ChevronRight, Maximize2, Minimize2, Copy, FileSpreadsheet, Loader2, Bookmark, Clock, MessageCircle } from 'lucide-react';
import api from '../../../shared/api/client';
import { exportLeadsToExcel } from '../utils/excelExport';
import { format } from 'date-fns';
import { Link, useSearchParams } from 'react-router-dom';
import QuickUpdateModal from '../components/QuickUpdateModal';
import ScheduleFollowUpModal from '../components/ScheduleFollowUpModal';
import EditLeadDetailsModal from '../components/EditLeadDetailsModal';
import BulkActionsBar from '../components/BulkActionsBar';
import type { Lead, CategoryGroup } from '../types';

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function LeadsList({ recordType = 'LEAD' }: { recordType?: 'LEAD' | 'COLLABORATOR' }) {
  const routePath = recordType === 'COLLABORATOR' ? 'collaborators' : 'leads';
  const title = recordType === 'COLLABORATOR' ? 'Collaborators' : 'Leads';

  const [searchParams] = useSearchParams();

  const parseUrlFilters = () => {
    const urlSearch = searchParams.get('q') || searchParams.get('search') || '';
    const rawMobile = searchParams.get('hasMobile') ?? searchParams.get('hasMobileNo');
    let urlMobile: 'all' | 'has_mobile' | 'no_mobile' = 'all';
    if (rawMobile === 'true') {
      urlMobile = 'has_mobile';
    } else if (rawMobile === 'false') {
      urlMobile = 'no_mobile';
    }
    const urlMobileUpdatedToday = searchParams.get('mobileUpdatedToday') === 'true';

    let urlTagIds: number[] = [];
    const tIds = searchParams.get('tagIds');
    if (tIds) {
      urlTagIds = tIds.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);
    } else {
      const single = searchParams.get('tagId');
      if (single && !isNaN(Number(single))) {
        urlTagIds = [Number(single)];
      }
    }

    const urlCatMap: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      if (key.startsWith('cat_')) {
        urlCatMap[key.replace('cat_', '')] = val;
      }
    });

    const urlView = searchParams.get('view');
    let urlViewMode: 'card' | 'table' | 'bulk-mark' = 'table';
    if (urlView === 'bulk-mark' || urlView === 'bulk') {
      urlViewMode = 'bulk-mark';
    } else if (urlView === 'card') {
      urlViewMode = 'card';
    } else if (urlView === 'table') {
      urlViewMode = 'table';
    } else if (typeof window !== 'undefined' && window.innerWidth < 768) {
      urlViewMode = 'card';
    }

    return {
      search: urlSearch,
      mobile: urlMobile,
      mobileUpdatedToday: urlMobileUpdatedToday,
      tagIds: urlTagIds,
      categories: urlCatMap,
      viewMode: urlViewMode,
    };
  };

  const initialFilters = parseUrlFilters();

  const [searchTerm, setSearchTerm] = useState(initialFilters.search);
  const [debouncedSearch, setDebouncedSearch] = useState(initialFilters.search);
  const [activeFilterId, setActiveFilterId] = useState<string>(() => searchParams.get('viewId') || searchParams.get('filterId') || '');
  const [mobileFilter, setMobileFilter] = useState<'all' | 'has_mobile' | 'no_mobile'>(initialFilters.mobile);
  const [mobileUpdatedToday, setMobileUpdatedToday] = useState<boolean>(initialFilters.mobileUpdatedToday);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(initialFilters.tagIds);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Record<string, string>>(initialFilters.categories);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveViewName, setSaveViewName] = useState('');

  const updateLead = useUpdateLeadDetail();
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editingContactValue, setEditingContactValue] = useState('');

  const handleContactSave = async (id: string | number) => {
    if (editingContactId === id.toString()) {
      await updateLead.mutateAsync({ id, lead: { mobileNumber: editingContactValue } });
      setEditingContactId(null);
    }
  };

  const [copiedPhoneId, setCopiedPhoneId] = useState<string | number | null>(null);

  const handleCopyPhone = (phone: string, id: string | number) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    setTimeout(() => {
      setCopiedPhoneId((prev) => (prev === id ? null : prev));
    }, 1500);
  };

  const deleteLead = useDeleteLead();

  const [quickUpdateLead, setQuickUpdateLead] = useState<Lead | null>(null);
  const [followUpLeadId, setFollowUpLeadId] = useState<string | number | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table' | 'bulk-mark'>(initialFilters.viewMode);

  // Bulk Mark state & optimistic handlers
  const updateLeadCategories = useUpdateLeadCategories();
  const [pendingMarkLeadId, setPendingMarkLeadId] = useState<string | null>(null);
  const [localCategoryOverrides, setLocalCategoryOverrides] = useState<Record<string, number[]>>({});

  const getEffectiveCategoryIds = (lead: Lead): number[] => {
    const leadIdStr = lead.id.toString();
    if (localCategoryOverrides[leadIdStr] !== undefined) {
      return localCategoryOverrides[leadIdStr];
    }
    return (lead.categories || []).map((c) => Number(c.id));
  };

  const handleDirectMarkCategory = async (lead: Lead, group: CategoryGroup, clickedValueId: number) => {
    const leadIdStr = lead.id.toString();
    const groupValueIds = (group.values || []).map((v) => Number(v.id));
    const currentIds = getEffectiveCategoryIds(lead);

    const withoutThisGroup = currentIds.filter((id) => !groupValueIds.includes(id));
    const isAlreadySelected = currentIds.includes(clickedValueId);
    const nextIds = isAlreadySelected ? withoutThisGroup : [...withoutThisGroup, clickedValueId];

    // Optimistic local state update
    setLocalCategoryOverrides((prev) => ({ ...prev, [leadIdStr]: nextIds }));
    setPendingMarkLeadId(leadIdStr);

    try {
      await updateLeadCategories.mutateAsync({
        id: leadIdStr,
        categoryIds: nextIds,
      });
    } catch (error) {
      console.error('Failed to update categories', error);
      setLocalCategoryOverrides((prev) => {
        const copy = { ...prev };
        delete copy[leadIdStr];
        return copy;
      });
    } finally {
      setPendingMarkLeadId(null);
    }
  };
  
  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(() => {
    const saved = localStorage.getItem('leads_page_size');
    return saved ? Number(saved) : 50;
  });

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0);
    localStorage.setItem('leads_page_size', String(newSize));
  };

  // Full Screen State (In-window full screen to preserve Chrome browser tabs)
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    setIsFullScreen((prev) => !prev);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen]);

  // Excel Export State & Handler
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadExcel = async () => {
    if (!data || !data.totalElements || data.totalElements === 0) {
      alert('No leads match the current filters to download.');
      return;
    }

    setIsExporting(true);
    try {
      let leadsToExport: Lead[] = [];

      // If all filtered leads are already in data.content
      if (data.totalElements <= (data.content?.length || 0)) {
        leadsToExport = data.content;
      } else {
        // Fetch all filtered leads matching the active criteria
        const exportFilters = {
          ...currentFilters,
          page: 0,
          size: Math.min(data.totalElements, 5000),
        };
        const res = await api.get('/leads', { params: exportFilters });
        leadsToExport = res.data?.content || data.content || [];
      }

      exportLeadsToExcel(leadsToExport, recordType);
    } catch (err) {
      console.error('Failed to export filtered leads to Excel:', err);
      if (data?.content && data.content.length > 0) {
        exportLeadsToExcel(data.content, recordType);
      } else {
        alert('Failed to download Excel. Please try again.');
      }
    } finally {
      setIsExporting(false);
    }
  };


  // Tag filter states
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const { data: availableTags } = useTags();

  const toggleTag = (tagId: number) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const clearAllTags = () => {
    setSelectedTagIds([]);
  };

  const filteredAvailableTags = (availableTags || []).filter(t => 
    t.name.toLowerCase().includes(tagSearchQuery.toLowerCase().trim())
  );

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
  if (recordType !== 'COLLABORATOR') {
    if (mobileFilter === 'has_mobile') currentFilters.hasMobileNo = true;
    else if (mobileFilter === 'no_mobile') currentFilters.hasMobileNo = false;
    if (mobileUpdatedToday) currentFilters.mobileUpdatedToday = true;
  }
  
  // Pass all selected category values. The backend expects ?categoryId=1&categoryId=4
  const categoryIdsParam = Object.values(selectedCategoryIds).filter(Boolean);
  if (categoryIdsParam.length > 0) {
    currentFilters.categoryId = categoryIdsParam;
  }
  
  // Tag filter param: Single tag ?tagId=1, Multiple tags ?tagIds=1,2
  if (selectedTagIds.length === 1) {
    currentFilters.tagId = selectedTagIds[0];
  } else if (selectedTagIds.length > 1) {
    currentFilters.tagIds = selectedTagIds.join(',');
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

  currentFilters.page = page;
  currentFilters.size = pageSize;

  const { data, isLoading } = useLeadsList(currentFilters);

  // Selection helpers
  const toggleSelect = (id: string | number) => {
    const strId = id.toString();
    setSelectedIds(prev => 
      prev.includes(strId) ? prev.filter(i => i !== strId) : [...prev, strId]
    );
  };

  const isAllSelected = Boolean(
    data?.content && 
    data.content.length > 0 && 
    data.content.every(l => selectedIds.includes(l.id.toString()))
  );

  const handleSelectAll = () => {
    if (!data?.content || data.content.length === 0) return;
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.content.map(l => l.id.toString()));
    }
  };

  const selectedLeads = data?.content?.filter(l => selectedIds.includes(l.id.toString())) || [];

  // Reset selection & optimistic overrides when search / filter changes
  useEffect(() => {
    setSelectedIds([]);
    setLocalCategoryOverrides({});
    setPage(0);
  }, [debouncedSearch, mobileFilter, mobileUpdatedToday, JSON.stringify(selectedCategoryIds), JSON.stringify(selectedTagIds), activeFilterId]);

  // Generate shareable link representing the current filter combination
  const getShareableLink = () => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    if (recordType !== 'COLLABORATOR') {
      if (mobileFilter === 'has_mobile') params.set('hasMobile', 'true');
      else if (mobileFilter === 'no_mobile') params.set('hasMobile', 'false');
      if (mobileUpdatedToday) params.set('mobileUpdatedToday', 'true');
    }
    if (selectedTagIds.length > 0) params.set('tagIds', selectedTagIds.join(','));
    Object.entries(selectedCategoryIds).forEach(([grpId, valId]) => {
      if (valId) params.set(`cat_${grpId}`, valId);
    });
    if (activeFilterId) params.set('viewId', activeFilterId);
    if (viewMode === 'bulk-mark') params.set('view', 'bulk-mark');
    else if (viewMode === 'card') params.set('view', 'card');

    const queryString = params.toString();
    const relativePath = `/${routePath}${queryString ? '?' + queryString : ''}`;
    return {
      relativePath,
      fullUrl: `${window.location.origin}${relativePath}`,
    };
  };

  // 1-Click Copy Link to Clipboard
  const handleCopyLink = () => {
    const { fullUrl } = getShareableLink();
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Seamlessly keep the browser URL bar up-to-date with active filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
    if (recordType !== 'COLLABORATOR') {
      if (mobileFilter === 'has_mobile') params.set('hasMobile', 'true');
      else if (mobileFilter === 'no_mobile') params.set('hasMobile', 'false');
      if (mobileUpdatedToday) params.set('mobileUpdatedToday', 'true');
    }
    if (selectedTagIds.length > 0) params.set('tagIds', selectedTagIds.join(','));
    Object.entries(selectedCategoryIds).forEach(([grpId, valId]) => {
      if (valId) params.set(`cat_${grpId}`, valId);
    });
    if (activeFilterId) params.set('viewId', activeFilterId);
    if (viewMode === 'bulk-mark') params.set('view', 'bulk-mark');
    else if (viewMode === 'card') params.set('view', 'card');

    const queryString = params.toString();
    const newPath = `/${routePath}${queryString ? '?' + queryString : ''}`;
    if (window.location.pathname + window.location.search !== newPath) {
      window.history.replaceState(null, '', newPath);
    }
  }, [debouncedSearch, mobileFilter, mobileUpdatedToday, selectedTagIds, selectedCategoryIds, activeFilterId, routePath, recordType, viewMode]);

  // Synchronize when URL searchParams changes from navigation (e.g. sidebar link clicked)
  useEffect(() => {
    const parsed = parseUrlFilters();
    const viewId = searchParams.get('viewId') || searchParams.get('filterId') || '';

    if (parsed.viewMode && parsed.viewMode !== viewMode) {
      setViewMode(parsed.viewMode);
    }

    if (viewId && filtersData && filtersData.length > 0) {
      const matched = filtersData.find(f => String(f.id) === String(viewId));
      if (matched?.filters) {
        if (matched.filters.search !== undefined) {
          setSearchTerm(matched.filters.search);
          setDebouncedSearch(matched.filters.search);
        }
        if (matched.filters.hasMobileNo === true) setMobileFilter('has_mobile');
        else if (matched.filters.hasMobileNo === false) setMobileFilter('no_mobile');
        else setMobileFilter('all');
        if (Array.isArray(matched.filters.tagIds)) setSelectedTagIds(matched.filters.tagIds);
        if (matched.filters.categoryIds) setSelectedCategoryIds(matched.filters.categoryIds);
        setActiveFilterId(String(viewId));
        return;
      }
    }

    setSearchTerm(parsed.search);
    setDebouncedSearch(parsed.search);
    setMobileFilter(parsed.mobile);
    setSelectedTagIds(parsed.tagIds);
    setSelectedCategoryIds(parsed.categories);
    setActiveFilterId(viewId);
  }, [searchParams.toString()]);

  // Open Save View Dialog
  const openSaveModal = () => {
    const parts: string[] = [];
    if (searchTerm.trim()) parts.push(`"${searchTerm.trim()}"`);
    if (mobileFilter === 'has_mobile') parts.push('Has Mobile');
    if (mobileFilter === 'no_mobile') parts.push('No Mobile');
    if (selectedTagIds.length > 0) parts.push(`${selectedTagIds.length} tags`);
    const defaultName = parts.length > 0 ? parts.join(' + ') : `${title} View`;
    setSaveViewName(defaultName);
    setIsSaveModalOpen(true);
  };

  // Confirm Save View
  const handleConfirmSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!saveViewName.trim()) return;

    const { relativePath } = getShareableLink();

    const hasMobileNoVal = mobileFilter === 'has_mobile' ? true : mobileFilter === 'no_mobile' ? false : undefined;

    const newSaved = await saveFilterMutation.mutateAsync({
      name: saveViewName.trim(),
      filters: {
        path: relativePath,
        search: searchTerm.trim(),
        hasMobileNo: hasMobileNoVal,
        tagIds: selectedTagIds,
        categoryIds: selectedCategoryIds,
        recordType,
      }
    });

    if (newSaved?.id) {
      setActiveFilterId(String(newSaved.id));
    }
    setIsSaveModalOpen(false);
    setSaveViewName('');
  };

  // Handle selecting a saved filter from the dropdown
  const handleSelectSavedFilter = (filterId: string) => {
    setActiveFilterId(filterId);
    if (!filterId) {
      setSearchTerm('');
      setDebouncedSearch('');
      setMobileFilter('all');
      setMobileUpdatedToday(false);
      setSelectedTagIds([]);
      setSelectedCategoryIds({});
      return;
    }

    const selected = filtersData?.find(f => String(f.id) === filterId);
    if (selected?.filters) {
      const f = selected.filters;
      setSearchTerm(f.search || '');
      setDebouncedSearch(f.search || '');
      if (f.hasMobileNo === true) setMobileFilter('has_mobile');
      else if (f.hasMobileNo === false) setMobileFilter('no_mobile');
      else setMobileFilter('all');
      setMobileUpdatedToday(Boolean(f.mobileUpdatedToday));
      setSelectedTagIds(Array.isArray(f.tagIds) ? f.tagIds : []);
      setSelectedCategoryIds(f.categoryIds || {});
    }
  };

  const isAnyFilterActive = Boolean(
    searchTerm.trim() ||
    mobileFilter !== 'all' ||
    mobileUpdatedToday ||
    selectedTagIds.length > 0 ||
    Object.values(selectedCategoryIds).some(Boolean) ||
    activeFilterId
  );

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setMobileFilter('all');
    setMobileUpdatedToday(false);
    setSelectedTagIds([]);
    setSelectedCategoryIds({});
    setActiveFilterId('');
    window.history.replaceState(null, '', `/${routePath}`);
  };

  const handleDeleteLead = async (leadId: string | number) => {
    if (window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      await deleteLead.mutateAsync(leadId);
    }
  };

  const renderTableView = () => (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 overflow-auto h-full">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700 text-sm">
        <thead className="bg-gray-50 dark:bg-zinc-900 sticky top-0 z-10 shadow-sm">
          <tr>
            <th scope="col" className="w-10 px-3 py-3 text-center bg-gray-50 dark:bg-zinc-900">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-zinc-700 focus:ring-blue-500 cursor-pointer"
                title={isAllSelected ? "Deselect All" : "Select All"}
              />
            </th>
            <th scope="col" className="w-12 px-2 py-3 text-center font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-900">
              #
            </th>
            <th scope="col" className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-900">Lead</th>
            <th scope="col" className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-900">Company / Title</th>
            <th scope="col" className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-900">Contact</th>
            <th scope="col" className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-900">Tags & Categories</th>
            <th scope="col" className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-900">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
          {data?.content?.map((lead, index) => {
            const isSelected = selectedIds.includes(lead.id.toString());
            const serialNo = page * pageSize + index + 1;
            return (
              <tr 
                key={lead.id} 
                className={`hover:bg-gray-50 dark:hover:bg-zinc-700/50 group transition ${
                  isSelected ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''
                }`}
              >
                <td className="w-10 px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(lead.id)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-zinc-700 focus:ring-blue-500 cursor-pointer"
                  />
                </td>
                <td className="w-12 px-2 py-3 text-center text-xs font-mono font-medium text-gray-400 dark:text-gray-500">
                  {serialNo}
                </td>
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
                    <div className="flex flex-col items-start gap-0.5 cursor-pointer">
                      <div className="flex items-center gap-1.5">
                        <span className={lead.mobileNumber ? '' : 'text-gray-400'}>{lead.mobileNumber || '-'}</span>
                        {lead.mobileNumber && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleCopyPhone(lead.mobileNumber!, lead.id);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-700 rounded transition"
                            title="Copy mobile number"
                          >
                            {copiedPhoneId === lead.id ? (
                              <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                        <Edit2 className="w-3 h-3 opacity-0 group-hover/contact:opacity-100 text-gray-400 transition" />
                      </div>
                      {lead.mobileUpdatedAt && (
                        <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                          {format(new Date(lead.mobileUpdatedAt), 'dd MMM yyyy')}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {/* Tags */}
                    {lead.tags && Array.isArray(lead.tags) && lead.tags.map((tagItem, idx) => {
                      const tagName = typeof tagItem === 'string' ? tagItem : tagItem.name;
                      const tagId = typeof tagItem === 'string'
                        ? availableTags?.find(t => t.name.toLowerCase() === tagItem.toLowerCase())?.id
                        : tagItem.id;
                      const isFiltering = tagId ? selectedTagIds.includes(tagId) : false;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={(e) => {
                            if (tagId) {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleTag(tagId);
                            }
                          }}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium transition ${
                            isFiltering
                              ? 'bg-blue-600 text-white'
                              : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100'
                          }`}
                          title={tagId ? "Click to filter by tag" : undefined}
                        >
                          #{tagName}
                        </button>
                      );
                    })}
                    {lead.categories?.filter(c => !c.name.toLowerCase().includes('campaign')).map(c => (
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
                    <button onClick={(e) => { e.preventDefault(); setEditLead(lead); }} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-zinc-700 rounded transition" title="Edit Details"><Edit2 className="w-4 h-4" /></button>
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
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const BULK_MARK_GROUP_COLORS = [
    {
      header: 'text-blue-600 dark:text-blue-400',
      base: 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/20',
      active: 'bg-blue-100 text-blue-900 border-blue-500 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-500 font-semibold shadow-xs',
    },
    {
      header: 'text-emerald-600 dark:text-emerald-400',
      base: 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-zinc-700 hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20',
      active: 'bg-emerald-100 text-emerald-900 border-emerald-500 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-500 font-semibold shadow-xs',
    },
    {
      header: 'text-purple-600 dark:text-purple-400',
      base: 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-zinc-700 hover:border-purple-400 hover:bg-purple-50/40 dark:hover:bg-purple-950/20',
      active: 'bg-purple-100 text-purple-900 border-purple-500 dark:bg-purple-900/60 dark:text-purple-200 dark:border-purple-500 font-semibold shadow-xs',
    },
    {
      header: 'text-amber-600 dark:text-amber-400',
      base: 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-zinc-700 hover:border-amber-400 hover:bg-amber-50/40 dark:hover:bg-amber-950/20',
      active: 'bg-amber-100 text-amber-900 border-amber-500 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-500 font-semibold shadow-xs',
    },
  ];

  const getDirectPillClass = (_groupName: string, valueName: string, isSelected: boolean) => {
    const v = valueName.toLowerCase().trim();
    if (v === 'hot') {
      return isSelected
        ? 'bg-rose-600 text-white border-rose-700 font-bold shadow-xs scale-105'
        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-400 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
    }
    if (v === 'warm') {
      return isSelected
        ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-xs scale-105'
        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-400 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    }
    if (v === 'cold') {
      return isSelected
        ? 'bg-sky-600 text-white border-sky-700 font-bold shadow-xs scale-105'
        : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 hover:border-sky-400 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800';
    }
    if (v === 'call done') {
      return isSelected
        ? 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-xs scale-105'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    }
    if (v === 'trash') {
      return isSelected
        ? 'bg-red-700 text-white border-red-800 font-bold shadow-xs scale-105'
        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-400 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800';
    }
    if (v === 'i messaged') {
      return isSelected
        ? 'bg-indigo-600 text-white border-indigo-700 font-bold shadow-xs scale-105'
        : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800';
    }
    if (v === 'he replied') {
      return isSelected
        ? 'bg-teal-600 text-white border-teal-700 font-bold shadow-xs scale-105'
        : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 hover:border-teal-400 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800';
    }
    if (v === "didn't respond" || v === 'didnt respond') {
      return isSelected
        ? 'bg-zinc-600 text-white border-zinc-700 font-bold shadow-xs scale-105'
        : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200 hover:border-zinc-400 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
    }
    if (v === 'no whatsapp no') {
      return isSelected
        ? 'bg-yellow-600 text-white border-yellow-700 font-bold shadow-xs scale-105'
        : 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-400 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800';
    }
    return isSelected
      ? 'bg-blue-600 text-white border-blue-700 font-bold shadow-xs scale-105'
      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-400 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700';
  };

  const desiredGroupOrder = ['stage', 'business potential', 'helpfulness'];
  const bulkMarkGroups = (Array.isArray(categories) ? categories : [])
    .filter((g) => !g.name.toLowerCase().includes('campaign'))
    .sort((a, b) => {
      const idxA = desiredGroupOrder.findIndex((o) => a.name.toLowerCase().includes(o));
      const idxB = desiredGroupOrder.findIndex((o) => b.name.toLowerCase().includes(o));
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

  const renderBulkMarkView = () => {

    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 overflow-auto h-full">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700 text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-900 sticky top-0 z-10 shadow-sm">
            <tr>
              <th scope="col" className="w-10 px-3 py-3 text-center bg-gray-50 dark:bg-zinc-900">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-zinc-700 focus:ring-blue-500 cursor-pointer"
                  title={isAllSelected ? "Deselect All" : "Select All"}
                />
              </th>
              <th scope="col" className="w-12 px-2 py-3 text-center font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-900">
                #
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-zinc-900 min-w-[200px]">
                {title}
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-zinc-900 min-w-[170px]">
                Mobile No
              </th>
              {bulkMarkGroups.map((group, idx) => {
                const colorConfig = BULK_MARK_GROUP_COLORS[idx % BULK_MARK_GROUP_COLORS.length];
                return (
                  <th
                    key={group.id}
                    scope="col"
                    className={`px-4 py-3 text-left font-bold ${colorConfig.header} bg-gray-50 dark:bg-zinc-900 min-w-[180px] whitespace-nowrap`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{group.name}</span>
                      <span className="text-[10px] font-normal opacity-70">(Tap to set)</span>
                    </div>
                  </th>
                );
              })}
              <th scope="col" className="px-3 py-3 text-right font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-900 w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
            {data?.content?.map((lead, index) => {
              const isSelected = selectedIds.includes(lead.id.toString());
              const serialNo = page * pageSize + index + 1;
              const isPending = pendingMarkLeadId === lead.id.toString();
              const currentCatIds = getEffectiveCategoryIds(lead);

              return (
                <tr
                  key={lead.id}
                  className={`hover:bg-gray-50 dark:hover:bg-zinc-700/50 group transition ${
                    isSelected ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''
                  } ${isPending ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                >
                  {/* Multi-select Checkbox */}
                  <td className="w-10 px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(lead.id)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-zinc-700 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>

                  {/* Serial Number */}
                  <td className="w-12 px-2 py-3 text-center text-xs font-mono font-medium text-gray-400 dark:text-gray-500">
                    {serialNo}
                  </td>

                  {/* Lead Name & Details */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/${routePath}/${lead.id}`}
                        className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-[200px]"
                      >
                        {lead.fullName}
                      </Link>
                      {lead.linkedinUrl && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(lead.linkedinUrl, '_blank');
                          }}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 shrink-0"
                          title="Open LinkedIn"
                        >
                          <LinkedinIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isPending && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />}
                    </div>
                    {(lead.company || lead.jobTitle) && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px] mt-0.5">
                        {lead.jobTitle && lead.company ? `${lead.jobTitle} • ${lead.company}` : lead.company || lead.jobTitle}
                      </div>
                    )}
                  </td>

                  {/* Mobile No Column */}
                  <td
                    className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300 relative group/contact"
                    onClick={(e) => {
                      if (editingContactId !== lead.id.toString()) {
                        e.preventDefault();
                        setEditingContactId(lead.id.toString());
                        setEditingContactValue(lead.mobileNumber || '');
                      }
                    }}
                  >
                    {editingContactId === lead.id.toString() ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                        <input
                          type="text"
                          autoFocus
                          value={editingContactValue}
                          onChange={(e) => setEditingContactValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleContactSave(lead.id);
                            if (e.key === 'Escape') setEditingContactId(null);
                          }}
                          className="w-32 px-2 py-1 text-xs border rounded dark:bg-zinc-800 dark:border-zinc-700 focus:ring-1 focus:ring-blue-500 outline-none text-gray-900 dark:text-gray-100"
                          placeholder="+91..."
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleContactSave(lead.id);
                          }}
                          className="text-green-600 hover:text-green-700 p-1 bg-green-50 rounded dark:bg-green-900/30 transition cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setEditingContactId(null);
                          }}
                          className="text-gray-500 hover:text-gray-700 p-1 bg-gray-100 rounded dark:bg-zinc-800 transition cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 cursor-pointer">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className={`text-xs font-mono font-medium ${lead.mobileNumber ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 italic'}`}>
                          {lead.mobileNumber || 'No mobile'}
                        </span>
                        {lead.mobileNumber ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleCopyPhone(lead.mobileNumber!, lead.id);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-700 rounded transition cursor-pointer"
                              title="Copy mobile number"
                            >
                              {copiedPhoneId === lead.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <a
                              href={`https://wa.me/${lead.mobileNumber.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-zinc-700 rounded transition cursor-pointer"
                              title="WhatsApp Chat"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                            </a>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="p-1 text-gray-400 hover:text-blue-600 rounded transition opacity-0 group-hover/contact:opacity-100"
                            title="Add mobile number"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Direct Tap Pills for Each Category Group */}
                  {bulkMarkGroups.map((group) => {
                    return (
                      <td key={group.id} className="px-3 py-2">
                        <div className="flex flex-wrap gap-1 items-center min-w-[200px]">
                          {group.values?.map((val) => {
                            const valId = Number(val.id);
                            const isSelected = currentCatIds.includes(valId);
                            return (
                              <button
                                key={val.id}
                                type="button"
                                disabled={isPending}
                                onClick={() => handleDirectMarkCategory(lead, group, valId)}
                                className={`px-2.5 py-0.5 text-[11px] rounded-full border transition-all duration-150 cursor-pointer ${
                                  getDirectPillClass(group.name, val.name, isSelected)
                                } ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`}
                                title={`Tap to ${isSelected ? 'unmark' : 'mark'} "${val.name}"`}
                              >
                                {val.name}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}

                  {/* Action Buttons */}
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setEditLead(lead);
                        }}
                        className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-zinc-700 rounded transition cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setQuickUpdateLead(lead);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-700 rounded transition cursor-pointer"
                        title="Quick Update / Activity"
                      >
                        <Zap className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteLead(lead.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-zinc-700 rounded transition cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderThinPagination = () => {
    if (!data || data.totalPages <= 1) return null;
    return (
      <div className="flex items-center gap-0.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md p-0.5 shadow-xs">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="p-1 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          title="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Numbered buttons on sm+ */}
        <div className="hidden sm:flex items-center gap-0.5">
          {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
            let pageNum = i;
            if (data.totalPages > 5) {
              if (page >= 3 && page <= data.totalPages - 3) {
                pageNum = page - 2 + i;
              } else if (page > data.totalPages - 3) {
                pageNum = data.totalPages - 5 + i;
              }
            }
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`min-w-[22px] h-6 px-1 text-[11px] font-semibold rounded transition cursor-pointer ${
                  page === pageNum
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700'
                }`}
              >
                {pageNum + 1}
              </button>
            );
          })}
        </div>

        {/* Compact text on mobile */}
        <span className="sm:hidden text-[11px] font-semibold px-1 text-gray-700 dark:text-gray-200 select-none">
          {page + 1}/{data.totalPages}
        </span>

        <button
          onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
          disabled={page >= data.totalPages - 1}
          className="p-1 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          title="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  // Full Screen Exclusive Table View
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 flex flex-col p-3 sm:p-4 overflow-hidden">
        {/* Fullscreen Minimal Header */}
        <div className="flex items-center justify-between pb-2.5 shrink-0 border-b border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>{title} {viewMode === 'bulk-mark' ? 'Bulk Mark' : 'Table'}</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                {data?.totalElements ?? data?.content?.length ?? 0} total
              </span>
            </h1>
            {selectedIds.length > 0 && (
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                • {selectedIds.length} of {data?.content?.length || 0} selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* View Switcher in Fullscreen */}
            <div className="flex bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md overflow-hidden shadow-xs">
              <button 
                onClick={() => setViewMode('table')} 
                className={`p-1.5 ${viewMode === 'table' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('bulk-mark')} 
                className={`p-1.5 border-l border-gray-300 dark:border-zinc-700 flex items-center gap-1.5 ${viewMode === 'bulk-mark' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
                title="⚡ 1-Tap Triage (Direct Tap Stage, Potential, Helpfulness)"
              >
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="hidden sm:inline text-xs pr-1 font-bold">⚡ 1-Tap Triage</span>
              </button>
            </div>

            {/* Thin Top Pagination in Full Screen */}
            {renderThinPagination()}

            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-2 py-1 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>

            {/* Download Excel Button in Fullscreen */}
            <button
              onClick={handleDownloadExcel}
              disabled={isExporting || !data || data.totalElements === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-40 cursor-pointer"
              title={`Download all ${data?.totalElements ?? 0} filtered ${title.toLowerCase()} as Excel`}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download Excel ({data?.totalElements ?? data?.content?.length ?? 0})</span>
                </>
              )}
            </button>

            <button
              onClick={toggleFullScreen}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-gray-800 dark:hover:bg-zinc-200 rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
              title="Exit Full Screen (Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Full Screen</span>
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-gray-700 dark:bg-zinc-300 dark:text-zinc-800 text-gray-200 rounded">Esc</kbd>
            </button>
          </div>
        </div>

        {/* Fullscreen Table - Only the table */}
        <div className="flex-1 min-h-0 mt-3 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">{`Loading ${title.toLowerCase()}...`}</div>
          ) : data?.content && data.content.length > 0 ? (
            viewMode === 'bulk-mark' ? renderBulkMarkView() : renderTableView()
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {`No ${title.toLowerCase()} found.`}
            </div>
          )}
        </div>



        {/* Floating Bulk Actions Bar */}
        <BulkActionsBar
          selectedLeads={selectedLeads}
          onClearSelection={() => setSelectedIds([])}
          onSelectAll={handleSelectAll}
          isAllSelected={isAllSelected}
          totalCount={data?.content?.length || 0}
          recordType={recordType}
          isFullScreen={true}
        />

        <QuickUpdateModal lead={quickUpdateLead} onClose={() => setQuickUpdateLead(null)} />
        <EditLeadDetailsModal lead={editLead} onClose={() => setEditLead(null)} />
        <ScheduleFollowUpModal 
          isOpen={!!followUpLeadId} 
          onClose={() => setFollowUpLeadId(null)} 
          leadId={followUpLeadId} 
        />
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col bg-gray-50 dark:bg-zinc-900">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold dark:text-white">{title}</h1>
          {!isLoading && data && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm whitespace-nowrap">
              {data.totalElements !== undefined ? `${data.totalElements} results` : `${data.content?.length || 0} results`}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {Array.isArray(filtersData) && filtersData.length > 0 && (
            <select 
              value={activeFilterId}
              onChange={(e) => handleSelectSavedFilter(e.target.value)}
              className="text-xs p-1.5 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-md dark:text-gray-200 focus:outline-none"
            >
              <option value="">Saved Views...</option>
              {filtersData.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          )}
          {activeFilterId && (
            <button 
              onClick={() => { deleteFilterMutation.mutate(activeFilterId); setActiveFilterId(''); }} 
              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
              title="Delete this saved view"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={openSaveModal} 
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800 transition cursor-pointer" 
            title="Save current filters as a view in left panel"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save View</span>
          </button>
          <button 
            onClick={handleCopyLink} 
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700 rounded-md text-gray-700 dark:text-gray-200 transition cursor-pointer shadow-2xs" 
            title="Copy direct shareable link for this filtered view"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Link2 className="w-3.5 h-3.5 text-gray-500" />
                <span className="hidden sm:inline">Copy Link</span>
              </>
            )}
          </button>
          {isAnyFilterActive && (
            <button
              onClick={handleClearAllFilters}
              className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition cursor-pointer"
              title="Reset all filters"
            >
              Clear
            </button>
          )}
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
            <button 
              onClick={() => setViewMode('bulk-mark')} 
              className={`p-1.5 border-l border-gray-300 dark:border-zinc-700 flex items-center gap-1.5 ${viewMode === 'bulk-mark' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
              title="⚡ 1-Tap Triage (Direct Tap Stage, Potential, Helpfulness)"
            >
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="hidden sm:inline text-xs pr-1 font-bold">⚡ 1-Tap Triage</span>
            </button>
          </div>

          {/* Full Screen Button */}
          <button
            onClick={toggleFullScreen}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-md shadow-sm text-xs font-semibold transition ml-1 cursor-pointer"
            title="Full Screen (Table Only)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Full Screen</span>
          </button>

          {/* Download Filtered Excel Button in Top Toolbar */}
          <button
            onClick={handleDownloadExcel}
            disabled={isExporting || !data || data.totalElements === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-md shadow-sm text-xs font-semibold transition ml-1 disabled:opacity-40 cursor-pointer"
            title={`Download all ${data?.totalElements ?? 0} filtered ${title.toLowerCase()} as Excel`}
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <span className="hidden sm:inline">Excel</span>
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
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-zinc-700 rounded-md leading-5 bg-white dark:bg-zinc-800 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setDebouncedSearch('');
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-sm">
        {recordType !== 'COLLABORATOR' && (
          <>
            {/* 3-State Mobile Filter Segmented Control + Updated Today Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-zinc-800/90 p-0.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-xs">
              <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 px-2 flex items-center gap-1 select-none">
                <Phone className="w-3 h-3 text-gray-400" />
                <span className="hidden sm:inline">Mobile:</span>
              </span>
              <button
                type="button"
                onClick={() => setMobileFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  mobileFilter === 'all'
                    ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 shadow-2xs font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setMobileFilter('has_mobile')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1 cursor-pointer ${
                  mobileFilter === 'has_mobile'
                    ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                Has Mobile
              </button>
              <button
                type="button"
                onClick={() => setMobileFilter('no_mobile')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1 cursor-pointer ${
                  mobileFilter === 'no_mobile'
                    ? 'bg-rose-600 text-white shadow-2xs font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400'
                }`}
              >
                No Mobile
              </button>
              <div className="h-3 w-px bg-gray-300 dark:bg-zinc-600 mx-0.5"></div>
              <button
                type="button"
                onClick={() => setMobileUpdatedToday(prev => !prev)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1 cursor-pointer ${
                  mobileUpdatedToday
                    ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
                title="Filter leads whose mobile contact was added or updated today"
              >
                <Clock className="w-3 h-3" />
                Updated Today
              </button>
            </div>

            <div className="h-4 w-px bg-gray-300 dark:bg-zinc-600 hidden sm:block"></div>
          </>
        )}

        {/* Tag Filter Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
            className={`text-sm px-2.5 py-1.5 border rounded-md flex items-center gap-1.5 transition ${
              selectedTagIds.length > 0
                ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 font-medium'
                : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-zinc-700 hover:bg-gray-50'
            }`}
          >
            <TagIcon className="w-3.5 h-3.5 text-blue-500" />
            <span>{selectedTagIds.length > 0 ? `Tags (${selectedTagIds.length})` : 'Filter by Tags'}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {isTagDropdownOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsTagDropdownOpen(false)} />
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-xl z-30 p-2.5 text-xs">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-100 dark:border-zinc-700">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Select Tags</span>
                  {selectedTagIds.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllTags}
                      className="text-blue-600 hover:underline"
                    >
                      Clear ({selectedTagIds.length})
                    </button>
                  )}
                </div>

                {availableTags && availableTags.length > 5 && (
                  <div className="relative mb-2">
                    <input
                      type="text"
                      value={tagSearchQuery}
                      onChange={(e) => setTagSearchQuery(e.target.value)}
                      placeholder="Search tags..."
                      className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-zinc-700 rounded bg-gray-50 dark:bg-zinc-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredAvailableTags.length === 0 ? (
                    <div className="text-gray-400 py-3 text-center">No tags found</div>
                  ) : (
                    filteredAvailableTags.map(tag => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <label
                          key={tag.id}
                          className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-700/60 cursor-pointer select-none"
                        >
                          <span className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleTag(tag.id)}
                              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            />
                            <span>#{tag.name}</span>
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Selected Tag Pills */}
        {selectedTagIds.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {selectedTagIds.map(id => {
              const tagObj = availableTags?.find(t => t.id === id);
              const name = tagObj?.name || id;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                >
                  #{name}
                  <button
                    type="button"
                    onClick={() => toggleTag(id)}
                    className="hover:text-blue-900 dark:hover:text-white"
                    title="Remove tag filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            <button
              type="button"
              onClick={clearAllTags}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Popular / Quick Tag Pills when none selected */}
        {selectedTagIds.length === 0 && availableTags && availableTags.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400">Quick:</span>
            {availableTags.slice(0, 5).map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-700 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 border border-gray-200 dark:border-zinc-700 transition"
              >
                #{tag.name}
              </button>
            ))}
          </div>
        )}

        {Array.isArray(categories) && categories
          .filter(group => !group.name.toLowerCase().includes('campaign'))
          .map(group => (
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

      {/* Results Count & Status Bar */}
      {!isLoading && data && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-gray-900 dark:text-gray-100">{data.content?.length || 0}</strong>
              {data.totalElements !== undefined && (
                <> of <strong className="text-gray-900 dark:text-gray-100">{data.totalElements}</strong></>
              )} {title.toLowerCase()}
            </span>
            {(Boolean(debouncedSearch) || mobileFilter !== 'all' || selectedTagIds.length > 0 || Object.values(selectedCategoryIds).some(Boolean)) && (
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                (filtered)
              </span>
            )}
            {data.totalPages > 1 && (
              <span className="text-gray-400">
                • Page {page + 1} of {data.totalPages}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {selectedIds.length > 0 && (
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {selectedIds.length} of {data.content?.length || 0} selected
              </span>
            )}

            {/* Thin Top Pagination */}
            {renderThinPagination()}

            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-2 py-0.5 text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>

            {/* Download Filtered Excel Button directly above Table */}
            <button
              onClick={handleDownloadExcel}
              disabled={isExporting || !data || data.totalElements === 0}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 shadow-sm transition disabled:opacity-40 cursor-pointer"
              title={`Download all ${data?.totalElements ?? 0} filtered ${title.toLowerCase()} as Excel`}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Download Excel ({data?.totalElements ?? data?.content?.length ?? 0})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-6">
        {isLoading ? (
          <div className="text-center py-4">{`Loading ${title.toLowerCase()}...`}</div>
        ) : data?.content && data.content.length > 0 ? (
          viewMode === 'card' ? (
            <div className="space-y-3">
              {/* Card Selection Header Bar */}
              <div className="flex items-center justify-between px-1 py-1 text-xs text-gray-500 dark:text-gray-400">
                <label className="flex items-center gap-2 cursor-pointer font-medium hover:text-gray-900 dark:hover:text-gray-200">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-zinc-700 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Select All ({data.content.length})</span>
                </label>
                {selectedIds.length > 0 && (
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {selectedIds.length} of {data.content.length} selected
                  </span>
                )}
              </div>

              {data.content.map((lead, index) => {
                const isSelected = selectedIds.includes(lead.id.toString());
                const serialNo = page * pageSize + index + 1;
                return (
                  <div 
                    key={lead.id} 
                    className={`bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border transition flex items-start gap-3 ${
                      isSelected 
                        ? 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/10' 
                        : 'border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="pt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(lead.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-zinc-700 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 pr-2">
                          <Link to={`/${routePath}/${lead.id}`} className="group block">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shrink-0">
                                #{serialNo}
                              </span>
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 truncate">{lead.fullName}</h3>
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
                          </Link>
                          
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
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                      <Phone className="w-3 h-3 shrink-0" />
                                      <span>{lead.mobileNumber}</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          handleCopyPhone(lead.mobileNumber!, lead.id);
                                        }}
                                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-700 rounded transition"
                                        title="Copy mobile number"
                                      >
                                        {copiedPhoneId === lead.id ? (
                                          <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    </div>
                                    {lead.mobileUpdatedAt && (
                                      <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                                        • {format(new Date(lead.mobileUpdatedAt), 'dd MMM yyyy')}
                                      </span>
                                    )}
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
                          {/* Tags */}
                          {lead.tags && Array.isArray(lead.tags) && lead.tags.map((tagItem, idx) => {
                            const tagName = typeof tagItem === 'string' ? tagItem : tagItem.name;
                            const tagId = typeof tagItem === 'string'
                              ? availableTags?.find(t => t.name.toLowerCase() === tagItem.toLowerCase())?.id
                              : tagItem.id;
                            const isFiltering = tagId ? selectedTagIds.includes(tagId) : false;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={(e) => {
                                  if (tagId) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleTag(tagId);
                                  }
                                }}
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium transition ${
                                  isFiltering
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100'
                                }`}
                                title={tagId ? "Click to filter by tag" : undefined}
                              >
                                #{tagName}
                              </button>
                            );
                          })}
                          {lead.categories?.filter(c => !c.name.toLowerCase().includes('campaign')).map(c => (
                            <span key={c.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 whitespace-nowrap">
                              {c.name}
                            </span>
                          ))}
                          <button onClick={(e) => { e.preventDefault(); setEditLead(lead); }} className="ml-1 p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-zinc-700 rounded-md transition" title="Edit Details"><Edit2 className="w-4 h-4" /></button>
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

                      {/* 1-Tap Quick Mark Pills on Card */}
                      <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-zinc-700/60 space-y-2">
                        {bulkMarkGroups.map((group) => {
                          const currentCatIds = getEffectiveCategoryIds(lead);
                          const isPending = pendingMarkLeadId === lead.id.toString();
                          return (
                            <div key={group.id} className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20 shrink-0">
                                {group.name}:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {group.values?.map((val) => {
                                  const valId = Number(val.id);
                                  const isSelected = currentCatIds.includes(valId);
                                  return (
                                    <button
                                      key={val.id}
                                      type="button"
                                      disabled={isPending}
                                      onClick={() => handleDirectMarkCategory(lead, group, valId)}
                                      className={`px-2 py-0.5 text-[11px] rounded-full border transition-all cursor-pointer ${
                                        getDirectPillClass(group.name, val.name, isSelected)
                                      } ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`}
                                      title={`Tap to ${isSelected ? 'unmark' : 'mark'} "${val.name}"`}
                                    >
                                      {val.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : viewMode === 'bulk-mark' ? (
            renderBulkMarkView()
          ) : (
            renderTableView()
          )
        ) : (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            {`No ${title.toLowerCase()} found. Tap + to add one.`}
          </div>
        )}

      </div>

      {/* Bulk Actions Floating Bar */}
      <BulkActionsBar
        selectedLeads={selectedLeads}
        onClearSelection={() => setSelectedIds([])}
        onSelectAll={handleSelectAll}
        isAllSelected={isAllSelected}
        totalCount={data?.content?.length || 0}
        recordType={recordType}
      />

      <QuickUpdateModal lead={quickUpdateLead} onClose={() => setQuickUpdateLead(null)} />
      <EditLeadDetailsModal lead={editLead} onClose={() => setEditLead(null)} />
      <ScheduleFollowUpModal 
        isOpen={!!followUpLeadId} 
        onClose={() => setFollowUpLeadId(null)} 
        leadId={followUpLeadId} 
      />

      {/* Save Filtered View Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-800 w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Bookmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Save Filtered View</h3>
                  <p className="text-xs text-gray-500">Save for 1-click access in your left panel & get a shareable link.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSaveModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  View Name
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Founders with Phone, High Intent Leads"
                  value={saveViewName}
                  onChange={(e) => setSaveViewName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filters Preview */}
              <div className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-lg border border-gray-200 dark:border-zinc-700/60 text-xs space-y-1.5">
                <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block">
                  Active Filters being saved:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {searchTerm && (
                    <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[11px]">
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {mobileFilter === 'has_mobile' && (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-[11px]">
                      Has Mobile No
                    </span>
                  )}
                  {mobileFilter === 'no_mobile' && (
                    <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 text-[11px]">
                      No Mobile No
                    </span>
                  )}
                  {mobileUpdatedToday && (
                    <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Updated Today
                    </span>
                  )}
                  {selectedTagIds.length > 0 && (
                    <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-[11px]">
                      {selectedTagIds.length} tag(s)
                    </span>
                  )}
                  {Object.values(selectedCategoryIds).some(Boolean) && (
                    <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px]">
                      Categories applied
                    </span>
                  )}
                  {!searchTerm && mobileFilter === 'all' && selectedTagIds.length === 0 && !Object.values(selectedCategoryIds).some(Boolean) && (
                    <span className="text-gray-400 italic">All {title.toLowerCase()} (unfiltered)</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveFilterMutation.isPending || !saveViewName.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {saveFilterMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Save View</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
