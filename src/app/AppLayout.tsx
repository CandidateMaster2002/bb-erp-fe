import { Outlet, NavLink, Navigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Columns, Settings, LogOut, FileBarChart, CalendarCheck } from 'lucide-react';
import { cn } from '../shared/utils/cn';
import QuickAddSheet from '../modules/leads/components/QuickAddSheet';
import RemindersWidget from '../modules/leads/components/RemindersWidget';

// Modules config for future scaling
const MODULES_NAV = [
  { name: 'Today', path: '/', icon: LayoutDashboard },
  { name: 'Leads', path: '/leads', icon: Users },
  { name: 'Actions', path: '/actions', icon: CalendarCheck },
  { name: 'Pipeline', path: '/pipeline', icon: Columns },
  { name: 'Reports', path: '/reports', icon: FileBarChart },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const DevBackendToggle = () => {
  if (!import.meta.env.DEV) return null;
  const isLocal = localStorage.getItem('backend_target') === 'local';
  
  const toggle = () => {
    localStorage.setItem('backend_target', isLocal ? 'deployed' : 'local');
    window.location.reload();
  };

  return (
    <button
      onClick={toggle}
      className={`text-xs px-2 py-1 rounded-full border transition-colors ${
        isLocal 
          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
          : 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800'
      }`}
      title="Toggle Backend (Local vs Deployed)"
    >
      {isLocal ? '🔌 Local BE' : '☁️ Prod BE'}
    </button>
  );
};

export default function AppLayout() {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-500">BoltBlazers ERP</h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {MODULES_NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                  isActive 
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-gray-200"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2 w-full rounded-md text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 md:pb-0">
        <header className="h-14 bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-4 lg:hidden">
          <h1 className="text-lg font-bold text-blue-600 dark:text-blue-500">BB ERP</h1>
          <div className="flex items-center gap-2">
            <DevBackendToggle />
            <RemindersWidget />
          </div>
        </header>
        <div className="hidden lg:flex h-14 bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 items-center justify-end px-4 gap-2">
          <DevBackendToggle />
          <RemindersWidget />
        </div>
        <main className="flex-1 overflow-y-auto relative">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-zinc-950 border-t border-gray-200 dark:border-zinc-800 flex justify-around items-center h-16 pb-safe z-40">
        {MODULES_NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
              )
            }
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>
      
      <QuickAddSheet />
    </div>
  );
}
