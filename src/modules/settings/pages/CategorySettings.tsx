import { useState } from 'react';
import { 
  useCategories, 
  useCreateCategoryGroup, 
  useUpdateCategoryGroup, 
  useDeleteCategoryGroup,
  useCreateCategoryValue,
  useUpdateCategoryValue,
  useDeleteCategoryValue 
} from '../../leads/api/queries';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { CategoryGroup, CategoryValue } from '../../leads/types';

export default function CategorySettings() {
  const { data: categories, isLoading } = useCategories();
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
      await createGroup.mutateAsync(name.trim());
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
      await createValue.mutateAsync({ groupId, name: name.trim() });
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
    return <div className="p-4">Loading categories...</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Category Settings</h1>
        <button 
          onClick={handleAddGroup}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" /> Add Category Group
        </button>
      </div>

      <div className="space-y-4">
        {categories?.map(group => (
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
                <button onClick={() => handleEditGroup(group)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-700 rounded transition">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteGroup(group)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-zinc-700 rounded transition">
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
                      <button onClick={() => handleEditValue(val)} className="opacity-50 hover:opacity-100 transition">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDeleteValue(val)} className="opacity-50 hover:opacity-100 hover:text-red-500 transition">
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
        {(!categories || categories.length === 0) && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No category groups found. Add one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
