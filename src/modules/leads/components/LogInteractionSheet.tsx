import { useState } from 'react';
import { Drawer } from 'vaul';
import { X, CalendarIcon, Repeat } from 'lucide-react';
import { useForm } from 'react-hook-form';

export default function LogInteractionSheet({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { register, handleSubmit, reset } = useForm();
  const [repeat, setRepeat] = useState('never');
  const [followUpType, setFollowUpType] = useState('Tomorrow');

  const onSubmit = (data: any) => {
    console.log('Logging interaction:', { ...data, repeat, followUpType });
    reset();
    onOpenChange(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
        <Drawer.Content className="bg-white dark:bg-zinc-900 flex flex-col rounded-t-[10px] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-[60] outline-none">
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-t-[10px] flex-1 overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-zinc-700 mb-6" />
            <div className="flex justify-between items-center mb-4">
              <Drawer.Title className="font-bold text-xl dark:text-gray-100">Log Interaction</Drawer.Title>
              <Drawer.Close className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition">
                <X className="w-5 h-5" />
              </Drawer.Close>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 col-span-2 mb-1">Type</label>
                {(['Call', 'WhatsApp', 'Email', 'Meeting'] as const).map(type => (
                  <label key={type} className="flex items-center gap-2 p-2 border border-gray-200 dark:border-zinc-700 rounded-md bg-gray-50 dark:bg-zinc-800 cursor-pointer">
                    <input type="radio" value={type} {...register('type')} className="text-blue-600" />
                    <span className="text-sm dark:text-gray-200">{type}</span>
                  </label>
                ))}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Summary</label>
                <textarea {...register('summary')} rows={3} className="w-full p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent dark:text-white" placeholder="What happened?" />
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
                <h3 className="font-semibold dark:text-gray-100 mb-3 flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-blue-500"/> Next Follow-up <span className="text-red-500">*</span></h3>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {['Tomorrow', '2 days', '1 week', 'Custom', 'None'].map(opt => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => setFollowUpType(opt)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${followUpType === opt ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-md">
                  <Repeat className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Repeat</label>
                    <select 
                      value={repeat} 
                      onChange={(e) => setRepeat(e.target.value)}
                      className="w-full p-1.5 text-sm rounded-md border border-blue-200 dark:border-blue-800 bg-white dark:bg-zinc-950 dark:text-gray-200"
                    >
                      <option value="never">Never</option>
                      <option value="7">Every 7 days</option>
                      <option value="15">Every 15 days</option>
                      <option value="30">Every 30 days</option>
                      <option value="custom">Custom days...</option>
                    </select>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition mt-4"
              >
                Log Interaction & Follow-up
              </button>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
