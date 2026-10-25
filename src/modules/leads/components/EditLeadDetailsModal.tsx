import { useState, useEffect } from 'react';
import { useUpdateLeadDetail, useTags } from '../api/queries';
import type { Lead } from '../types';
import { X, Check, Tag } from 'lucide-react';

interface EditLeadDetailsModalProps {
  lead: Lead | null;
  onClose: () => void;
}

export default function EditLeadDetailsModal({ lead, onClose }: EditLeadDetailsModalProps) {
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const updateMutation = useUpdateLeadDetail();
  const { data: availableTags } = useTags();
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  useEffect(() => {
    if (lead) {
      setFormData({
        fullName: lead.fullName || '',
        company: lead.company || '',
        jobTitle: lead.jobTitle || '',
        mobileNumber: lead.mobileNumber || '',
        linkedinUrl: lead.linkedinUrl || '',
        personalEmail: lead.personalEmail || '',
        city: lead.city || '',
      });
      const initialTags = (lead.tags || []).map(t => typeof t === 'string' ? t : t.name);
      setTags(initialTags);
      setNewTagInput('');
    }
  }, [lead]);

  if (!lead) return null;

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim().replace(/^#+/, '');
    if (!trimmed) return;
    if (!tags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      setTags(prev => [...prev, trimmed]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t.toLowerCase() !== tagToRemove.toLowerCase()));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(newTagInput);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        id: lead.id,
        lead: {
          ...formData,
          tagNames: tags,
        }
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to update details');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-zinc-800 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Details</h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
            <input 
              name="fullName" 
              value={formData.fullName} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700 dark:text-white focus:ring-1 focus:ring-blue-500" 
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
              <input 
                name="company" 
                value={formData.company} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700 dark:text-white focus:ring-1 focus:ring-blue-500" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Job Title</label>
              <input 
                name="jobTitle" 
                value={formData.jobTitle} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700 dark:text-white focus:ring-1 focus:ring-blue-500" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
              <input 
                name="mobileNumber" 
                value={formData.mobileNumber} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700 dark:text-white focus:ring-1 focus:ring-blue-500" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input 
                name="personalEmail" 
                type="email"
                value={formData.personalEmail} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700 dark:text-white focus:ring-1 focus:ring-blue-500" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">LinkedIn URL</label>
            <input 
              name="linkedinUrl" 
              type="url"
              value={formData.linkedinUrl} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700 dark:text-white focus:ring-1 focus:ring-blue-500" 
            />
          </div>

          {/* Tags */}
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-500" />
              <span>Tags</span>
            </label>

            {/* Active Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map(t => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-blue-950 dark:hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add Tag Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 text-sm">#</span>
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add a tag..."
                  className="w-full pl-6 pr-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddTag(newTagInput)}
                disabled={!newTagInput.trim()}
                className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 disabled:opacity-40 transition"
              >
                Add Tag
              </button>
            </div>

            {/* Suggestions */}
            {availableTags && availableTags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1 max-h-20 overflow-y-auto">
                {availableTags.map(tag => {
                  const isSelected = tags.some(t => t.toLowerCase() === tag.name.toLowerCase());
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => isSelected ? handleRemoveTag(tag.name) : handleAddTag(tag.name)}
                      className={`px-2 py-0.5 text-xs font-medium rounded-full border transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700'
                      }`}
                    >
                      #{tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800 rounded-md transition"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition disabled:opacity-50 flex items-center gap-2"
            >
              {updateMutation.isPending ? 'Saving...' : <><Check className="w-4 h-4"/> Save Details</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
