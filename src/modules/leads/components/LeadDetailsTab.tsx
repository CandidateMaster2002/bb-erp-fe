import { useState, useEffect } from 'react';
import { useUpdateLeadDetail } from '../api/queries';
import type { Lead, Education } from '../types';
import { Pencil, Check, X, Plus, Trash2 } from 'lucide-react';

export default function LeadDetailsTab({ lead }: { lead: Lead }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const updateMutation = useUpdateLeadDetail();

  useEffect(() => {
    if (lead) {
      setFormData({
        fullName: lead.fullName,
        headline: lead.headline || '',
        summary: lead.summary || '',
        city: lead.city || '',
        state: lead.state || '',
        country: lead.country || '',
        location: lead.location || '',
        jobTitle: lead.jobTitle || '',
        company: lead.company || '',
        linkedinUrl: lead.linkedinUrl || '',
        mobileNumber: lead.mobileNumber || '',
        personalEmail: lead.personalEmail || '',
        remark: lead.remark || '',
        education: lead.education || []
      });
    }
  }, [lead, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEducationChange = (index: number, field: keyof Education, value: string) => {
    setFormData(prev => {
      const ed = [...(prev.education || [])];
      ed[index] = { ...ed[index], [field]: value };
      return { ...prev, education: ed };
    });
  };

  const handleAddEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...(prev.education || []), { id: Date.now().toString(), college: '', degree: '', branch: '', batchStart: '', batchEnd: '' }]
    }));
  };

  const handleRemoveEducation = (index: number) => {
    setFormData(prev => {
      const ed = [...(prev.education || [])];
      ed.splice(index, 1);
      return { ...prev, education: ed };
    });
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ id: lead.id, lead: formData });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end mb-2">
          <button 
            onClick={() => setIsEditing(true)} 
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700 transition"
          >
            <Pencil className="w-4 h-4" /> Edit Details
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-zinc-700 pb-2">Personal Information</h3>
            <div><span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider block">Full Name</span> <p className="dark:text-gray-200 font-medium">{lead.fullName}</p></div>
            <div><span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider block">Phone</span> <p className="dark:text-gray-200">{lead.mobileNumber || 'N/A'}</p></div>
            <div><span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider block">Personal Email</span> <p className="dark:text-gray-200">{lead.personalEmail || 'N/A'}</p></div>
            <div><span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider block">Location (Raw)</span> <p className="dark:text-gray-200">{lead.location || 'N/A'}</p></div>
            <div><span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider block">City / State / Country</span> 
              <p className="dark:text-gray-200">
                {[lead.city, lead.state, lead.country].filter(Boolean).join(', ') || 'N/A'}
              </p>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-zinc-700 pb-2">Professional</h3>
            <div><span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider block">Job Title</span> <p className="dark:text-gray-200">{lead.jobTitle || 'N/A'}</p></div>
            <div><span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider block">Company</span> <p className="dark:text-gray-200">{lead.company || 'N/A'}</p></div>
            <div><span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider block">LinkedIn</span> 
              {lead.linkedinUrl ? <a href={lead.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{lead.linkedinUrl}</a> : <p className="dark:text-gray-200">N/A</p>}
            </div>
            <div><span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider block">Headline</span> <p className="dark:text-gray-200">{lead.headline || 'N/A'}</p></div>
          </div>
        </div>

        {(lead.summary || lead.remark) && (
          <div className="p-5 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 space-y-4">
            {lead.summary && <div><span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider block mb-1">Summary</span> <p className="dark:text-gray-300 text-sm">{lead.summary}</p></div>}
            {lead.remark && <div><span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider block mb-1">Internal Notes</span> <p className="dark:text-gray-300 text-sm whitespace-pre-wrap">{lead.remark}</p></div>}
          </div>
        )}

        {lead.education && lead.education.length > 0 && (
          <div className="p-5 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 space-y-4">
             <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-zinc-700 pb-2">Education History</h3>
             <div className="space-y-4">
               {lead.education.map(ed => (
                 <div key={ed.id} className="flex flex-col border-l-2 border-gray-200 dark:border-zinc-600 pl-4 py-1">
                   <h4 className="font-medium text-gray-900 dark:text-gray-100">{ed.college || 'Unknown College'}</h4>
                   <p className="text-sm text-gray-600 dark:text-gray-400">
                     {[ed.degree, ed.branch].filter(Boolean).join(' • ')} 
                     {(ed.batchStart || ed.batchEnd) && ` (${ed.batchStart || '?'} - ${ed.batchEnd || '?'})`}
                   </p>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 p-5 space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-700 pb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Edit Details</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsEditing(false)} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-700 rounded-md transition">
            <X className="w-4 h-4" /> Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={updateMutation.isPending}
            className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition"
          >
            <Check className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-800 dark:text-gray-200">Personal Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} />
          <InputField label="Mobile Number" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} />
          <InputField label="Personal Email" name="personalEmail" value={formData.personalEmail} onChange={handleChange} />
          <InputField label="Location (Raw)" name="location" value={formData.location} onChange={handleChange} />
          <InputField label="City" name="city" value={formData.city} onChange={handleChange} />
          <InputField label="State" name="state" value={formData.state} onChange={handleChange} />
          <InputField label="Country" name="country" value={formData.country} onChange={handleChange} />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-800 dark:text-gray-200 pt-4 border-t border-gray-100 dark:border-zinc-700">Professional</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Job Title" name="jobTitle" value={formData.jobTitle} onChange={handleChange} />
          <InputField label="Company" name="company" value={formData.company} onChange={handleChange} />
          <InputField label="LinkedIn URL" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} />
          <InputField label="Headline" name="headline" value={formData.headline} onChange={handleChange} />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-800 dark:text-gray-200 pt-4 border-t border-gray-100 dark:border-zinc-700">Extended Text</h4>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Summary</label>
            <textarea name="summary" value={formData.summary || ''} onChange={handleChange} rows={3} className="w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Internal Notes (Remark)</label>
            <textarea name="remark" value={formData.remark || ''} onChange={handleChange} rows={3} className="w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-zinc-700">
          <h4 className="font-medium text-gray-800 dark:text-gray-200">Education History</h4>
          <button onClick={handleAddEducation} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-md transition">
            <Plus className="w-4 h-4" /> Add Education
          </button>
        </div>
        
        {formData.education?.map((ed, i) => (
          <div key={ed.id} className="p-4 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg relative">
            <button onClick={() => handleRemoveEducation(i)} className="absolute top-3 right-3 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded-md transition">
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-8">
               <InputField label="College / University" name="college" value={ed.college} onChange={(e) => handleEducationChange(i, 'college', e.target.value)} />
               <InputField label="Degree" name="degree" value={ed.degree} onChange={(e) => handleEducationChange(i, 'degree', e.target.value)} />
               <InputField label="Branch / Major" name="branch" value={ed.branch} onChange={(e) => handleEducationChange(i, 'branch', e.target.value)} />
               <div className="grid grid-cols-2 gap-2">
                 <InputField label="Start Year" name="batchStart" value={ed.batchStart} onChange={(e) => handleEducationChange(i, 'batchStart', e.target.value)} />
                 <InputField label="End Year" name="batchEnd" value={ed.batchEnd} onChange={(e) => handleEducationChange(i, 'batchEnd', e.target.value)} />
               </div>
            </div>
          </div>
        ))}
        {formData.education?.length === 0 && <p className="text-sm text-gray-500">No education entries added.</p>}
      </div>

    </div>
  );
}

function InputField({ label, name, value, onChange }: { label: string; name: string; value: string | undefined; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input
        type="text"
        name={name}
        value={value || ''}
        onChange={onChange}
        className="w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-1.5 text-sm dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none transition"
      />
    </div>
  );
}
