import { useState, useEffect } from 'react';
import { useCategories, useUpdateLeadCategories, useCreateLeadLog } from '../api/queries';
import type { Lead } from '../types';
import { X, Check } from 'lucide-react';

interface QuickUpdateModalProps {
  lead: Lead | null;
  onClose: () => void;
}

export default function QuickUpdateModal({ lead, onClose }: QuickUpdateModalProps) {
  const { data: categoryGroups } = useCategories();
  const updateCategoriesMutation = useUpdateLeadCategories();
  const createLogMutation = useCreateLeadLog();

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [comment, setComment] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (lead) {
      setSelectedCategoryIds(lead.categories?.map(c => Number(c.id)) || []);
      setComment('');
      setNextAction('');
      setNextActionDate('');
      setToastMessage(null);
    }
  }, [lead]);

  if (!lead) return null;

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    try {
      const promises: Promise<any>[] = [];

      // Only call update if it actually changed, or just call it always to be safe.
      promises.push(updateCategoriesMutation.mutateAsync({ 
        id: lead.id, 
        categoryIds: selectedCategoryIds 
      }));

      if (comment.trim() || nextAction.trim()) {
        promises.push(createLogMutation.mutateAsync({
          leadId: lead.id,
          log: {
            comment: comment.trim(),
            nextAction: nextAction.trim(),
            nextActionDate: nextActionDate || undefined
          }
        }));
      }

      await Promise.all(promises);
      
      setToastMessage('Update successful!');
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      console.error(error);
      alert('Failed to update lead');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Update: <span className="text-blue-600 dark:text-blue-400">{lead.fullName}</span></h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-6">
          
          {/* Section A: Update Categories */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-800 dark:text-gray-200">Update Categories</h3>
            <div className="space-y-4">
              {Array.isArray(categoryGroups) && categoryGroups.map(group => (
                <div key={group.id} className="space-y-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{group.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {group.values?.map(val => {
                      const isSelected = selectedCategoryIds.includes(Number(val.id));
                      return (
                        <button
                          key={val.id}
                          onClick={() => toggleCategory(Number(val.id))}
                          className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
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
          </div>

          {/* Section B: Add Activity Log */}
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-zinc-800">
            <h3 className="font-medium text-gray-800 dark:text-gray-200">Add Activity Log</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Comment</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="E.g., Spoke on call, discussed pricing..."
                  rows={2}
                  className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Next Action (Optional)</label>
                  <input
                    type="text"
                    value={nextAction}
                    onChange={e => setNextAction(e.target.value)}
                    placeholder="E.g., Send proposal"
                    className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Next Action Date</label>
                  <input
                    type="date"
                    value={nextActionDate}
                    onChange={e => setNextActionDate(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="p-4 border-t border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-900/50">
          <div className="text-sm font-medium text-green-600 dark:text-green-400">
            {toastMessage && <span className="flex items-center gap-1"><Check className="w-4 h-4" /> {toastMessage}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800 rounded-md transition">
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={updateCategoriesMutation.isPending || createLogMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition disabled:opacity-50"
            >
              {(updateCategoriesMutation.isPending || createLogMutation.isPending) ? 'Saving...' : 'Save & Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
