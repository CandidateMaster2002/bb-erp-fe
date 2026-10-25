import { useState } from 'react';
import { 
  useCategories, 
  useCreateCategoryGroup, 
  useUpdateCategoryGroup, 
  useDeleteCategoryGroup,
  useCreateCategoryValue,
  useUpdateCategoryValue,
  useDeleteCategoryValue,
  useTags,
  useCreateTag,
  useUpdateTag,
  useDeleteTag
} from '../../leads/api/queries';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Tag as TagIcon, Check, X, Search } from 'lucide-react';
import type { CategoryGroup, CategoryValue, Tag } from '../../leads/types';

function TagsManagerSection() {
  const { data: tags, isLoading } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [newTagName, setNewTagName] = useState('');
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTagName.trim().replace(/^#+/, '');
    if (!trimmed) return;
    
    // Check if tag already exists
    if (tags?.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
      alert(`Tag "${trimmed}" already exists.`);
      return;
    }

    try {
      await createTag.mutateAsync({ name: trimmed });
      setNewTagName('');
      setIsCreating(false);
    } catch (err) {
      console.error(err);
      alert('Failed to create tag');
    }
  };

  const startEditing = (tag: Tag) => {
    setEditingTagId(tag.id);
    setEditingTagName(tag.name);
  };

  const cancelEditing = () => {
    setEditingTagId(null);
    setEditingTagName('');
  };

  const handleSaveEdit = async (id: number) => {
    const trimmed = editingTagName.trim().replace(/^#+/, '');
    if (!trimmed) {
      cancelEditing();
      return;
    }

    try {
      await updateTag.mutateAsync({ id, name: trimmed });
      cancelEditing();
    } catch (err) {
      console.error(err);
      alert('Failed to update tag');
    }
  };

  const handleDelete = async (tag: Tag) => {
    const countText = typeof tag.leadCount === 'number' ? ` (${tag.leadCount} leads assigned)` : '';
    const msg = `Are you sure you want to delete tag "#${tag.name}"${countText}? This will permanently remove it from all assigned leads.`;
    if (window.confirm(msg)) {
      try {
        await deleteTag.mutateAsync(tag.id);
      } catch (err) {
        console.error(err);
        alert('Failed to delete tag');
      }
    }
  };

  const filteredTags = (tags || []).filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pt-4">
        <div>
          <div className="flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold dark:text-white">Tags Manager</h2>
            {tags && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300 border border-gray-200 dark:border-zinc-700">
                {tags.length}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Create, rename, and delete global tags. Tag deletion removes the tag from all assigned leads.
          </p>
        </div>

        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Tag
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-5 shadow-sm space-y-4">
        {/* Quick Create Form */}
        {(isCreating || (tags && tags.length === 0)) && (
          <form onSubmit={handleCreate} className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-sm">#</span>
              <input
                type="text"
                autoFocus
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name (e.g. SaaS Founders, Property Inspection)..."
                className="w-full pl-7 pr-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => { setIsCreating(false); setNewTagName(''); }}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800 rounded-md transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTagName.trim() || createTag.isPending}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition disabled:opacity-50 shadow-sm"
              >
                {createTag.isPending ? 'Creating...' : 'Create Tag'}
              </button>
            </div>
          </form>
        )}

        {/* Search Bar */}
        {tags && tags.length > 4 && (
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tags..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading tags...</div>
        ) : !tags || tags.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            No tags found. Click <strong>"Add Tag"</strong> above to create your first tag.
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-xs">
            No tags match "{searchQuery}".
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5 pt-1">
            {filteredTags.map(tag => {
              const isEditing = editingTagId === tag.id;
              const count = tag.leadCount ?? 0;

              if (isEditing) {
                return (
                  <div 
                    key={tag.id}
                    className="flex items-center gap-1.5 p-1 bg-white dark:bg-zinc-900 border border-blue-400 dark:border-blue-500 rounded-lg shadow-sm"
                  >
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold pl-1.5">#</span>
                    <input
                      type="text"
                      autoFocus
                      value={editingTagName}
                      onChange={(e) => setEditingTagName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(tag.id);
                        if (e.key === 'Escape') cancelEditing();
                      }}
                      className="px-1.5 py-0.5 text-xs rounded border border-gray-300 dark:border-zinc-700 bg-transparent text-gray-900 dark:text-white outline-none w-32 focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(tag.id)}
                      disabled={updateTag.isPending}
                      className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/40 rounded transition"
                      title="Save name"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={tag.id}
                  className="group flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-800/60 text-blue-900 dark:text-blue-200 px-3 py-1.5 rounded-lg text-sm shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition"
                >
                  <span className="font-semibold text-blue-600 dark:text-blue-400">#</span>
                  <span className="font-medium">{tag.name}</span>

                  {/* leadCount badge (e.g. Founders (142)) */}
                  <span 
                    className="ml-0.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100/80 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40"
                    title={`${count} lead${count === 1 ? '' : 's'} assigned to this tag`}
                  >
                    {count}
                  </span>

                  <div className="flex items-center gap-1 pl-1 ml-1 border-l border-blue-200 dark:border-blue-800/60 opacity-60 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={() => startEditing(tag)}
                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-100/50 dark:hover:bg-blue-900/40 rounded transition"
                      title="Edit / Rename Tag"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(tag)}
                      disabled={deleteTag.isPending}
                      className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition"
                      title="Delete Tag"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CategorySection({ type, title }: { type: 'LEAD' | 'COLLABORATOR', title: string }) {
  const { data: categories, isLoading } = useCategories(type);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const createGroup = useCreateCategoryGroup();
  const updateGroup = useUpdateCategoryGroup();
  const deleteGroup = useDeleteCategoryGroup();
  const createValue = useCreateCategoryValue();
  const updateValue = useUpdateCategoryValue();
  const deleteValue = useDeleteCategoryValue();

  const toggleGroup = (id: string | number) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddGroup = async () => {
    const name = prompt('Enter new category group name:');
    if (name?.trim()) {
      await createGroup.mutateAsync({ name: name.trim(), type });
    }
  };

  const handleEditGroup = async (group: CategoryGroup) => {
    const name = prompt('Enter new name:', group.name);
    if (name?.trim() && name !== group.name) {
      await updateGroup.mutateAsync({ id: group.id, name: name.trim() });
    }
  };

  const handleDeleteGroup = async (group: CategoryGroup) => {
    if (confirm(`Are you sure you want to delete the group "${group.name}" and ALL its values?`)) {
      await deleteGroup.mutateAsync(group.id);
    }
  };

  const handleAddValue = async (groupId: string | number) => {
    const name = prompt('Enter new value name:');
    if (name?.trim()) {
      await createValue.mutateAsync({ groupId: groupId, name: name.trim() });
      setExpandedGroups(prev => ({ ...prev, [groupId]: true }));
    }
  };

  const handleEditValue = async (value: CategoryValue) => {
    const name = prompt('Enter new value name:', value.name);
    if (name?.trim() && name !== value.name) {
      await updateValue.mutateAsync({ valueId: value.id, name: name.trim() });
    }
  };

  const handleDeleteValue = async (value: CategoryValue) => {
    if (confirm(`Are you sure you want to delete "${value.name}"?`)) {
      await deleteValue.mutateAsync(value.id);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading {title.toLowerCase()}...</div>;
  }

  // Filter out legacy campaign categories
  const filteredCategories = categories?.filter(g => !g.name.toLowerCase().includes('campaign'));

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pt-4">
        <h2 className="text-xl font-bold dark:text-white">{title}</h2>
        <button 
          onClick={handleAddGroup}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Category Group
        </button>
      </div>

      <div className="space-y-4">
        {filteredCategories?.map(group => (
          <div key={group.id} className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-700">
              <button 
                onClick={() => toggleGroup(group.id)}
                className="flex items-center gap-2 flex-1 text-left font-semibold dark:text-gray-100"
              >
                {expandedGroups[group.id] ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                {group.name}
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEditGroup(group)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-700 rounded transition" title="Edit Group">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteGroup(group)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-zinc-700 rounded transition" title="Delete Group">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {expandedGroups[group.id] && (
              <div className="p-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {group.values?.map(val => (
                    <div key={val.id} className="group flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-300 px-3 py-1.5 rounded-full text-sm">
                      <span>{val.name}</span>
                      <button onClick={() => handleEditValue(val)} className="opacity-50 hover:opacity-100 transition" title="Edit Value">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDeleteValue(val)} className="opacity-50 hover:opacity-100 hover:text-red-500 transition" title="Delete Value">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {(!group.values || group.values.length === 0) && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 italic">No values added yet.</span>
                  )}
                </div>
                <div>
                  <button 
                    onClick={() => handleAddValue(group.id)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                  >
                    <Plus className="w-4 h-4" /> Add Value
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {(!filteredCategories || filteredCategories.length === 0) && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No category groups found. Add one to get started.
          </div>
        )}
      </div>
    </div>
  );
}

export default function CategorySettings() {
  const [hideDeadLeads, setHideDeadLeads] = useState(() => {
    return localStorage.getItem('hideDeadLeads') !== 'false';
  });

  const toggleHideDeadLeads = () => {
    const newVal = !hideDeadLeads;
    setHideDeadLeads(newVal);
    localStorage.setItem('hideDeadLeads', String(newVal));
  };

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-bold dark:text-white mb-4">Settings</h1>
        <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-5 shadow-sm">
          <h2 className="text-lg font-semibold dark:text-gray-100 mb-4">Global Preferences</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-200">Hide Dead Leads</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Hide leads marked as "Dead" from the main list by default.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={hideDeadLeads} onChange={toggleHideDeadLeads} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Tags Manager Section */}
      <TagsManagerSection />
      <hr className="my-8 border-gray-200 dark:border-zinc-800" />

      {/* Lead Categories */}
      <CategorySection type="LEAD" title="Lead Categories" />
      <hr className="my-8 border-gray-200 dark:border-zinc-800" />

      {/* Collaborator Categories */}
      <CategorySection type="COLLABORATOR" title="Collaborator Categories" />
    </div>
  );
}
