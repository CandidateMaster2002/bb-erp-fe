import { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAddLead, useCategories } from '../api/queries';
import { Plus, X } from 'lucide-react';

const addLeadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  headline: z.string().optional(),
  phone: z.string().optional(),
  personalEmail: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  location: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  linkedinUrl: z.string().optional(),
  notes: z.string().optional(),
});

type AddLeadForm = z.infer<typeof addLeadSchema>;

export default function QuickAddSheet() {
  const [open, setOpen] = useState(false);
  const [duplicateError, setDuplicateError] = useState<{ message: string; leadId: string } | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AddLeadForm>({
    resolver: zodResolver(addLeadSchema),
  });

  const addLead = useAddLead();
  const { data: categoryGroups } = useCategories();

  // Handle Category Defaulting Rule
  useEffect(() => {
    if (open) {
      reset(); // Reset form fields
      setDuplicateError(null);
      
      // Apply defaults for categories
      if (Array.isArray(categoryGroups)) {
        const defaultIds: number[] = [];
        const campaignGroup = categoryGroups.find(g => g.name.toLowerCase() === 'campaign');
        if (campaignGroup) {
          const newCat = campaignGroup.values.find(v => v.name.toLowerCase() === 'new');
          if (newCat) {
            defaultIds.push(Number(newCat.id));
          }
        }
        setSelectedCategoryIds(defaultIds);
      } else {
        setSelectedCategoryIds([]);
      }
    }
  }, [open, categoryGroups, reset]);

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const onSubmit = async (data: AddLeadForm) => {
    setDuplicateError(null);
    try {
      const payload = {
        ...data,
        categoryIds: selectedCategoryIds
      };
      await addLead.mutateAsync(payload);
      setOpen(false);
    } catch (error: any) {
      if (error.response?.status === 409) {
        setDuplicateError({
          message: 'This lead already exists!',
          leadId: error.response.data.existingLeadId || '123',
        });
      }
    }
  };

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <button className="fixed bottom-20 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors z-50">
          <Plus className="w-6 h-6" />
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-white dark:bg-zinc-900 flex flex-col rounded-t-[10px] h-[90vh] mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none">
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-t-[10px] flex-1 overflow-y-auto hide-scrollbar">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-zinc-700 mb-6" />
            <div className="flex justify-between items-center mb-4">
              <Drawer.Title className="font-bold text-xl dark:text-gray-100">Add Lead</Drawer.Title>
              <Drawer.Close className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition">
                <X className="w-5 h-5" />
              </Drawer.Close>
            </div>
            
            {duplicateError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm flex justify-between items-center">
                <span>{duplicateError.message}</span>
                <a href={`/leads/${duplicateError.leadId}`} onClick={() => setOpen(false)} className="underline font-medium">View Lead</a>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-6">
              {/* Basic Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-zinc-800 pb-2">Basic Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input {...register('name')} className="w-full p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile Number</label>
                    <input {...register('phone')} className="w-full p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Personal Email</label>
                    <input {...register('personalEmail')} className="w-full p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Headline</label>
                    <input {...register('headline')} className="w-full p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                    <input {...register('city')} className="w-full p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                    <input {...register('state')} className="w-full p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                    <input {...register('country')} className="w-full p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location (Raw)</label>
                    <input {...register('location')} className="w-full p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-zinc-800 pb-2 pt-2">Professional Info</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
                    <input {...register('company')} className="w-full p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title</label>
                    <input {...register('jobTitle')} className="w-full p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LinkedIn URL</label>
                    <input {...register('linkedinUrl')} className="w-full p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Categorization & Notes */}
              <div className="space-y-4 pt-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-zinc-800 pb-2">Categorization & Notes</h3>
                
                <div className="space-y-4">
                  {Array.isArray(categoryGroups) && categoryGroups.map(group => (
                    <div key={group.id} className="space-y-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">{group.name}</label>
                      <div className="flex flex-wrap gap-2">
                        {group.values?.map(val => (
                          <button
                            key={val.id}
                            type="button"
                            onClick={() => toggleCategory(Number(val.id))}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                              selectedCategoryIds.includes(Number(val.id))
                                ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700 dark:hover:bg-zinc-700'
                            }`}
                          >
                            {val.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                  <textarea {...register('notes')} rows={3} className="w-full p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition disabled:opacity-50 mt-4"
              >
                {isSubmitting ? 'Saving Lead...' : 'Save Lead'}
              </button>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
