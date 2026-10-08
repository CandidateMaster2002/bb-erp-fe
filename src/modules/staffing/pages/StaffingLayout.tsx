import { Outlet, NavLink } from 'react-router-dom';
import { Briefcase, Building, Users } from 'lucide-react';
import { cn } from '../../../shared/utils/cn';

export default function StaffingLayout() {
  const tabs = [
    { name: 'Requirements', to: '/staffing/requirements', icon: Briefcase },
    { name: 'Clients', to: '/staffing/clients', icon: Building },
    { name: 'Vendors', to: '/staffing/vendors', icon: Users },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-zinc-950">
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staffing / ATS</h1>
      </div>
      
      <div className="px-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <nav className="flex space-x-6">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                )
              }
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}
