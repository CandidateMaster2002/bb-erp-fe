import { useState, useEffect } from 'react';
import { useCategories, useUpdateLeadCategories } from '../api/queries';
import type { Lead, CategoryGroup } from '../types';
import { X, Check } from 'lucide-react';
import LeadActivityLog from './LeadActivityLog';

interface QuickUpdateModalProps {
  lead: Lead | null;
  onClose: () => void;
}

export default function QuickUpdateModal({ lead, onClose }: QuickUpdateModalProps) {
  const { data: categoryGroups } = useCategories();
  const updateCategoriesMutation = useUpdateLeadCategories();

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (lead) {
      setSelectedCategoryIds(lead.categories?.map(c => Number(c.id)) || []);
      setToastMessage(null);
    }
  }, [lead]);

  if (!lead) return null;

  const toggleCategory = (group: CategoryGroup, categoryId: number) => {
    setSelectedCategoryIds(prev => {
      const groupCategoryIds = group.values?.map(v => Number(v.id)) || [];
      let newSelection = prev.filter(id => !groupCategoryIds.includes(id));
      if (!prev.includes(categoryId)) {
        newSelection.push(categoryId);
      }
      return newSelection;
    });
  };

  const handleSaveCategories = async () => {
    try {
      await updateCategoriesMutation.mutateAsync({
        id: lead.id,
        categoryIds: selectedCategoryIds
      });
      setToastMessage('Categories saved!');
      setTimeout(() => setToastMessage(null), 2000);
    } catch (error) {
      console.error(error);
      alert('Failed to update categories');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-zinc-800 shrink-0 bg-gray-50 dark:bg-zinc-800/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Update: <span className="text-blue-600 dark:text-blue-400">{lead.fullName}</span></h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-0 flex flex-col md:flex-row">
          
          {/* Left Column: Categories */}
          <div className="p-4 md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-900/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-800 dark:text-gray-200">Categories</h3>
            </div>
            
            <div className="space-y-4 mb-4">
              {Array.isArray(categoryGroups) && categoryGroups.map(group => (
                <div key={group.id} className="space-y-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{group.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {group.values?.map(val => {
                      const isSelected = selectedCategoryIds.includes(Number(val.id));
                      return (
                        <button
                          key={val.id}
                          onClick={() => toggleCategory(group, Number(val.id))}
                          className={`px-2 py-1 text-xs font-medium rounded-full border transition-colors ${
                            isSelected 
                              ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800' 
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {val.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={handleSaveCategories}
              disabled={updateCategoriesMutation.isPending}
              className="w-full px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              {toastMessage ? <><Check className="w-4 h-4"/> Saved</> : 'Save Categories'}
            </button>
          </div>

          {/* Right Column: Activity Logs */}
          <div className="p-4 md:w-2/3 flex-1 bg-white dark:bg-zinc-900">
             <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Activity & Logs</h3>
             <LeadActivityLog leadId={lead.id.toString()} />
          </div>

        </div>
      </div>
    </div>
  );
}
