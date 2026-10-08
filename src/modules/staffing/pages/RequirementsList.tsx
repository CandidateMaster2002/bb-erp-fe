import { useRequirements, useDeleteRequirement } from '../api/queries';
import { Plus, Trash2, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { Requirement } from '../types';

export default function RequirementsList() {
  const { data: requirements, isLoading } = useRequirements();
  const deleteMutation = useDeleteRequirement();
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-800/50">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Requirements (Job Orders)</h2>
        <button
          onClick={() => navigate('/staffing/requirements/new')}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" /> Add Requirement
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="text-xs uppercase bg-gray-50 dark:bg-zinc-800/50 text-gray-700 dark:text-gray-400 border-b border-gray-200 dark:border-zinc-700">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Client</th>
              <th className="px-6 py-3">Experience</th>
              <th className="px-6 py-3">CTC</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center">Loading...</td></tr>
            ) : (!requirements || requirements.length === 0) ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center">No requirements found.</td></tr>
            ) : (
              requirements.map((req: Requirement) => (
                <tr key={req.id} className="border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                  <td className="px-6 py-4">#{req.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                    <Link to={`/staffing/requirements/${req.id}`} className="hover:text-blue-600 hover:underline">
                      {req.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">{req.client?.name || `Client ID: ${req.demandSourceId}`}</td>
                  <td className="px-6 py-4">{req.experienceRange || '-'}</td>
                  <td className="px-6 py-4">{req.ctc || '-'}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link to={`/staffing/requirements/${req.id}`} className="inline-flex p-1 text-gray-400 hover:text-blue-600 rounded">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={() => { if(confirm('Delete requirement?')) deleteMutation.mutate(req.id); }} 
                      className="inline-flex p-1 text-gray-400 hover:text-red-600 rounded"
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
