import { useState } from 'react';
import { useVendors, useCreateVendor, useUpdateVendor, useDeleteVendor } from '../api/queries';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import type { Vendor } from '../types';

export default function VendorsList() {
  const { data: vendors, isLoading } = useVendors();
  const createMutation = useCreateVendor();
  const updateMutation = useUpdateVendor();
  const deleteMutation = useDeleteVendor();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nameVal, setNameVal] = useState('');

  const handleSave = async () => {
    if (!nameVal.trim()) return;
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, data: { name: nameVal } });
      setEditingId(null);
    } else {
      await createMutation.mutateAsync({ name: nameVal });
      setIsAdding(false);
    }
    setNameVal('');
  };

  const handleEdit = (vendor: any) => {
    setEditingId(vendor.id);
    setNameVal(vendor.name);
    setIsAdding(false);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-800/50">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Vendors</h2>
        <button
          onClick={() => { setIsAdding(true); setEditingId(null); setNameVal(''); }}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center gap-3 bg-blue-50/50 dark:bg-blue-900/10">
          <input
            autoFocus
            type="text"
            placeholder="Vendor Name..."
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
          />
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
            Save
          </button>
          <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-4 py-2 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md">
            Cancel
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="text-xs uppercase bg-gray-50 dark:bg-zinc-800/50 text-gray-700 dark:text-gray-400 border-b border-gray-200 dark:border-zinc-700">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={3} className="px-6 py-4 text-center">Loading...</td></tr>
            ) : (!vendors || vendors.length === 0) ? (
              <tr><td colSpan={3} className="px-6 py-4 text-center">No vendors found.</td></tr>
            ) : (
              vendors.map((vendor: Vendor) => (
                <tr key={vendor.id} className="border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                  <td className="px-6 py-4">#{vendor.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{vendor.name}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(vendor)} className="p-1 text-gray-400 hover:text-blue-600 rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => { if(confirm('Delete vendor?')) deleteMutation.mutate(vendor.id); }} 
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
