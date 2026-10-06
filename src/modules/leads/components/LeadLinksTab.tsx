import React, { useState } from 'react';
import { 
  useLeadLinks, 
  useCreateLeadLink, 
  useUpdateLeadLink, 
  useDeleteLeadLink 
} from '../api/queries';
import type { LeadLink } from '../types';
import { Plus, Edit2, Trash2, X, ExternalLink } from 'lucide-react';

export default function LeadLinksTab({ leadId }: { leadId: string }) {
  const { data: links, isLoading } = useLeadLinks(leadId);
  const createLink = useCreateLeadLink();
  const updateLink = useUpdateLeadLink();
  const deleteLink = useDeleteLeadLink();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');

  const handleOpenAdd = () => {
    setEditingLinkId(null);
    setTitle('');
    setUrl('');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (link: LeadLink) => {
    setEditingLinkId(link.id);
    setTitle(link.title);
    setUrl(link.url);
    setDescription(link.description || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this link?')) {
      await deleteLink.mutateAsync(id);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    // basic validation to ensure URL starts with http
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    const payload = {
      title: title.trim(),
      url: finalUrl,
      description: description.trim() || undefined,
    };

    if (editingLinkId) {
      await updateLink.mutateAsync({ linkId: editingLinkId, link: payload });
    } else {
      await createLink.mutateAsync({ leadId, link: payload });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Attached Links</h3>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Link
        </button>
      </div>

      {isLoading ? (
        <div className="text-gray-500">Loading links...</div>
      ) : !links || links.length === 0 ? (
        <div className="text-center py-8 bg-white dark:bg-zinc-800 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 text-gray-500">
          No links attached yet.
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <div key={link.id} className="p-4 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl flex justify-between items-start gap-4">
              <div className="flex-1">
                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-base font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2"
                >
                  {link.title}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                {link.description && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{link.description}</p>
                )}
                <div className="mt-2 text-xs text-gray-400 truncate">{link.url}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => handleOpenEdit(link)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-700 rounded transition"
                  title="Edit Link"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(link.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-zinc-700 rounded transition"
                  title="Delete Link"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-zinc-800">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingLinkId ? 'Edit Link' : 'Add Link'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Portfolio"
                  className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What is this link for?"
                  className="w-full bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800 rounded-md transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!title.trim() || !url.trim() || createLink.isPending || updateLink.isPending}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 rounded-md transition shadow-sm"
                >
                  {editingLinkId ? 'Save Changes' : 'Add Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
