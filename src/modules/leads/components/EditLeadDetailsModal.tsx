import { useState, useEffect } from 'react';
import { useUpdateLeadDetail } from '../api/queries';
import type { Lead } from '../types';
import { X, Check } from 'lucide-react';

interface EditLeadDetailsModalProps {
  lead: Lead | null;
  onClose: () => void;
}

export default function EditLeadDetailsModal({ lead, onClose }: EditLeadDetailsModalProps) {
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const updateMutation = useUpdateLeadDetail();

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
    }
  }, [lead]);

  if (!lead) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        id: lead.id,
        lead: formData
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
