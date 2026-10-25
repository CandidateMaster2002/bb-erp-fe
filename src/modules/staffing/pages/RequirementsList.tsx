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
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Requirements (Job Orders)</h2>
          {!isLoading && requirements && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {requirements.length} {requirements.length === 1 ? 'order' : 'orders'}
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/staffing/requirements/new')}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" /> Add Requirement
        </button>
      </div>

      {/* Mobile Card List (< sm) */}
      <div className="block sm:hidden divide-y divide-gray-100 dark:divide-zinc-800">
        {isLoading ? (
          <div className="p-6 text-center text-sm text-gray-500">Loading...</div>
        ) : (!requirements || requirements.length === 0) ? (
          <div className="p-6 text-center text-sm text-gray-500">No requirements found.</div>
        ) : (
          requirements.map((req: Requirement) => (
            <div key={req.id} className="p-4 space-y-2 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-semibold text-gray-400">#{req.id}</span>
                  <Link to={`/staffing/requirements/${req.id}`} className="block font-semibold text-gray-900 dark:text-white hover:text-blue-600 truncate">
                    {req.title}
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                    {req.client?.name || `Client ID: ${req.demandSourceId}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link to={`/staffing/requirements/${req.id}`} className="p-1 text-gray-400 hover:text-blue-600">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                  <button 
                    onClick={() => { if(confirm('Delete requirement?')) deleteMutation.mutate(req.id); }} 
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                {req.experienceRange && (
                  <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300">
                    Exp: {req.experienceRange}
                  </span>
                )}
                {req.ctc && (
                  <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300 border border-green-200 dark:border-green-800/40 font-medium">
                    CTC: {req.ctc}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop / Tablet Table (>= sm) */}
      <div className="hidden sm:block overflow-x-auto">
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
