import { useState } from 'react';
import { Drawer } from 'vaul';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAddLead } from '../api/queries';
import { Plus, X } from 'lucide-react';

const addLeadSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  categoryId: z.string().min(1, 'Category is required'),
  remark: z.string().optional(),
});

type AddLeadForm = z.infer<typeof addLeadSchema>;

export default function QuickAddSheet() {
  const [open, setOpen] = useState(false);
  const [duplicateError, setDuplicateError] = useState<{ message: string; leadId: string } | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AddLeadForm>({
    resolver: zodResolver(addLeadSchema),
  });

  const addLead = useAddLead();

  const onSubmit = async (data: AddLeadForm) => {
    setDuplicateError(null);
    try {
      await addLead.mutateAsync({ ...data, priority: 'WARM' });
      reset();
      setOpen(false);
    } catch (error: any) {
      if (error.response?.status === 409) {
        setDuplicateError({
          message: 'This lead already exists!',
          leadId: error.response.data.existingLeadId || '123', // fallback for demo
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
        <Drawer.Content className="bg-white dark:bg-zinc-900 flex flex-col rounded-t-[10px] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none">
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-t-[10px] flex-1 overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-zinc-700 mb-6" />
            <div className="flex justify-between items-center mb-4">
              <Drawer.Title className="font-bold text-xl dark:text-gray-100">Quick Add Lead</Drawer.Title>
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input {...register('fullName')} className="w-full p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white" />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone / WhatsApp</label>
                <input {...register('phone')} className="w-full p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white" />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select {...register('categoryId')} className="w-full p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white">
                  <option value="">Select...</option>
                  <option value="cat_1">Property Inspection Co.</option>
                  <option value="cat_2">ISM Alumni</option>
                  <option value="cat_3">IIT Roorkee Alumni</option>
                </select>
                {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quick Note</label>
                <textarea {...register('remark')} rows={3} className="w-full p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white" />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Lead'}
              </button>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
