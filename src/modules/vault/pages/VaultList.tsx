import { useState } from 'react';
import { 
  useVaultItems, 
  useCreateVaultItem, 
  useUpdateVaultItem, 
  useDeleteVaultItem, 
  useToggleArchiveVaultItem, 
  usePromoteVaultItem 
} from '../api/vault';
import type { VaultItem, VaultCategory } from '../types';
import type { TimeHorizon } from '../../actions/api/tasks';
import { 
  Lightbulb, 
  Target, 
  ShoppingBag, 
  FileText, 
  Archive, 
  Plus, 
  ExternalLink, 
  Rocket, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  Compass,
  Calendar,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIES: { key: VaultCategory | 'ALL'; label: string; icon: typeof Lightbulb; color: string }[] = [
  { key: 'ALL', label: 'All Items', icon: Sparkles, color: 'text-gray-600' },
  { key: 'IDEA', label: 'Ideas', icon: Lightbulb, color: 'text-amber-500' },
  { key: 'ASPIRATION', label: 'Aspirations', icon: Target, color: 'text-indigo-500' },
  { key: 'TO_BUY', label: 'Wishlist / Buy', icon: ShoppingBag, color: 'text-emerald-500' },
  { key: 'NOTE', label: 'Notes', icon: FileText, color: 'text-sky-500' },
];

export default function VaultList() {
  const [selectedCategory, setSelectedCategory] = useState<VaultCategory | 'ALL'>('ALL');
  const [showArchived, setShowArchived] = useState(false);

  const categoryParam = selectedCategory === 'ALL' ? undefined : selectedCategory;
  const { data: items, isLoading } = useVaultItems(categoryParam, showArchived);

  const createItem = useCreateVaultItem();
  const updateItem = useUpdateVaultItem();
  const deleteItem = useDeleteVaultItem();
  const toggleArchive = useToggleArchiveVaultItem();
  const promoteItem = usePromoteVaultItem();

  // Create / Edit modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<VaultCategory>('IDEA');
  const [formLink, setFormLink] = useState('');

  // Promote modal state
  const [promotingItem, setPromotingItem] = useState<VaultItem | null>(null);
  const [promoteHorizon, setPromoteHorizon] = useState<TimeHorizon>('TODAY');
  const [promoteDeadline, setPromoteDeadline] = useState('');

  const openCreateModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory(selectedCategory === 'ALL' ? 'IDEA' : selectedCategory);
    setFormLink('');
    setIsFormOpen(true);
  };

  const openEditModal = (item: VaultItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setFormCategory((item.category as VaultCategory) || 'IDEA');
    setFormLink(item.link || '');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingItem) {
      await updateItem.mutateAsync({
        id: editingItem.id,
        data: {
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          category: formCategory,
          link: formLink.trim() || undefined,
        }
      });
    } else {
      await createItem.mutateAsync({
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        category: formCategory,
        link: formLink.trim() || undefined,
      });
    }

    setIsFormOpen(false);
  };

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promotingItem) return;

    await promoteItem.mutateAsync({
      id: promotingItem.id,
      payload: {
        timeHorizon: promoteHorizon,
        deadline: promoteDeadline ? new Date(promoteDeadline).toISOString() : null,
        archiveVaultItem: true,
      }
    });

    setPromotingItem(null);
    setPromoteDeadline('');
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat.toUpperCase()) {
      case 'IDEA':
        return <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800"><Lightbulb className="w-3 h-3" /> Idea</span>;
      case 'ASPIRATION':
        return <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"><Target className="w-3 h-3" /> Aspiration</span>;
      case 'TO_BUY':
        return <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"><ShoppingBag className="w-3 h-3" /> Wishlist</span>;
      case 'NOTE':
        return <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border border-sky-200 dark:border-sky-800"><FileText className="w-3 h-3" /> Note</span>;
      default:
        return <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-gray-100 text-gray-700 dark:bg-zinc-700 dark:text-gray-300">{cat}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-24 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" /> Personal Vault
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Capture ideas, aspirations, wishlist items, and personal notes. Promote any item to an active Action when ready.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Add to Vault
        </button>
      </div>

      {/* Filter Tabs & Archive Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800/80 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-full">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${cat.color}`} />
                {cat.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
            showArchived
              ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
              : 'text-gray-500 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          {showArchived ? 'Showing Archived' : 'Show Archived'}
        </button>
      </div>

      {/* Vault Items Grid / List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading vault items...</div>
      ) : !items || items.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-800 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 p-8 space-y-3">
          <Sparkles className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
          <p className="font-medium text-gray-700 dark:text-gray-300">Your vault is clean</p>
          <p className="text-xs text-gray-400">
            Jot down startup ideas, books to read, tech gadgets to buy, or long-term dreams.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add First Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => {
            const createdAtDate = item.createdAt ? new Date(item.createdAt) : null;

            return (
              <div 
                key={item.id}
                className={`bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm border transition flex flex-col justify-between gap-3 ${
                  item.isArchived 
                    ? 'border-gray-200 dark:border-zinc-700 opacity-60' 
                    : 'border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(item.category)}
                      {item.isArchived && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200 dark:border-zinc-700">
                          Archived
                        </span>
                      )}
                    </div>
                    {createdAtDate && (
                      <span className="text-[11px] text-gray-400">
                        {format(createdAtDate, 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1.5 whitespace-pre-wrap line-clamp-3">
                      {item.description}
                    </p>
                  )}

                  {item.link && (
                    <a
                      href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
                    >
                      <ExternalLink className="w-3 h-3" /> View Reference Link
                    </a>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-700/60 mt-2">
                  <button
                    onClick={() => setPromotingItem(item)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 transition"
                    title="Promote to an active Action / Task"
                  >
                    <Rocket className="w-3.5 h-3.5" /> Promote to Action
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-md transition"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleArchive.mutateAsync({ id: item.id, archived: !item.isArchived })}
                      className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-md transition"
                      title={item.isArchived ? 'Unarchive' : 'Archive'}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this item from Vault?')) {
                          deleteItem.mutateAsync(item.id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                {editingItem ? 'Edit Vault Item' : 'New Vault Item'}
              </h2>
              <button 
                onClick={() => setIsFormOpen(false)} 
                className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="E.g., Try mechanical keyboard with linear switches"
                  className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as VaultCategory)}
                  className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="IDEA">💡 Idea</option>
                  <option value="ASPIRATION">🎯 Aspiration / Goal</option>
                  <option value="TO_BUY">🛍️ Wishlist / To Buy</option>
                  <option value="NOTE">📝 Note / Memo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Notes, specifications, thoughts..."
                  rows={3}
                  className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Link / URL (Optional)
                </label>
                <input
                  type="text"
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  placeholder="https://amazon.in/... or blog link"
                  className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800 rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createItem.isPending || updateItem.isPending || !formTitle.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition disabled:opacity-50"
                >
                  {editingItem ? 'Save Changes' : 'Add to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promote to Action Modal */}
      {promotingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Rocket className="w-5 h-5 text-blue-600" />
                Promote to Active Action
              </h2>
              <button 
                onClick={() => setPromotingItem(null)} 
                className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePromoteSubmit} className="p-4 space-y-4">
              <div className="bg-gray-50 dark:bg-zinc-800/60 p-3 rounded-lg border border-gray-200 dark:border-zinc-700">
                <p className="text-xs text-gray-500">Promoting item:</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{promotingItem.title}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-600" /> Select Time Horizon
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'SOMEDAY'] as TimeHorizon[]).map(h => {
                    const isSelected = promoteHorizon === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setPromoteHorizon(h)}
                        className={`p-2 rounded-lg text-left border transition text-xs font-medium ${
                          isSelected 
                            ? 'border-blue-600 bg-blue-50 text-blue-900 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-200 font-semibold ring-1 ring-blue-500' 
                            : 'border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/40 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {h === 'TODAY' ? 'Today' : h === 'THIS_WEEK' ? 'This Week' : h === 'THIS_MONTH' ? 'This Month' : 'Backlog / Someday'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" /> Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={promoteDeadline}
                  onChange={(e) => setPromoteDeadline(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPromotingItem(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800 rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={promoteItem.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition disabled:opacity-50"
                >
                  <Check className="w-4 h-4" /> Convert to Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
