import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRequirementDetail, useCreateRequirement, useUpdateRequirement, useClients } from '../api/queries';
import { ArrowLeft, Save } from 'lucide-react';
import type { Client } from '../types';

export default function RequirementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const { data: clients } = useClients();
  const { data: requirement, isLoading } = useRequirementDetail(isNew ? '' : id || '');
  const createMutation = useCreateRequirement();
  const updateMutation = useUpdateRequirement();

  const [formData, setFormData] = useState({
    demandSourceId: '',
    title: '',
    jdText: '',
    ctc: '',
    noticePeriod: '',
    experienceRange: '',
    description: ''
  });

  useEffect(() => {
    if (requirement && !isNew) {
      setFormData({
        demandSourceId: requirement.demandSourceId?.toString() || '',
        title: requirement.title || '',
        jdText: requirement.jdText || '',
        ctc: requirement.ctc || '',
        noticePeriod: requirement.noticePeriod || '',
        experienceRange: requirement.experienceRange || '',
        description: requirement.description || ''
      });
    }
  }, [requirement, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      demandSourceId: parseInt(formData.demandSourceId) || 0
    };

    if (isNew) {
      await createMutation.mutateAsync(payload);
      navigate('/staffing/requirements');
    } else {
      await updateMutation.mutateAsync({ id: Number(id), data: payload });
      alert('Requirement updated successfully');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (isLoading && !isNew) {
    return <div className="p-8 text-center text-gray-500">Loading requirement...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/staffing/requirements')} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full dark:hover:bg-zinc-800 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isNew ? 'New Requirement' : `Edit Requirement #${id}`}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Job Title *</label>
            <input 
              required
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700 dark:text-white" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Client *</label>
            <select
              required
              name="demandSourceId"
              value={formData.demandSourceId}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
            >
              <option value="">-- Select Client --</option>
              {clients?.map((client: Client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">CTC</label>
            <input 
              type="text" 
              name="ctc" 
              value={formData.ctc} 
              onChange={handleChange} 
              placeholder="e.g. 25 LPA"
              className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700 dark:text-white" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notice Period</label>
            <input 
              type="text" 
              name="noticePeriod" 
              value={formData.noticePeriod} 
              onChange={handleChange} 
              placeholder="e.g. 30 Days"
              className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700 dark:text-white" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Experience Range</label>
            <input 
              type="text" 
              name="experienceRange" 
              value={formData.experienceRange} 
              onChange={handleChange} 
              placeholder="e.g. 5-8 Years"
              className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700 dark:text-white" 
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Short Description</label>
          <input 
            type="text" 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700 dark:text-white" 
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Job Description Text (JD)</label>
          <textarea 
            name="jdText" 
            value={formData.jdText} 
            onChange={handleChange} 
            rows={5}
            className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700 dark:text-white" 
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-zinc-800">
          <button 
            type="submit" 
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isNew ? 'Create Requirement' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
