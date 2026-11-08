import { useState } from 'react';
import { Outlet, NavLink, Navigate, useLocation, Link } from 'react-router-dom';
import { 
  Users, 
  Settings, 
  LogOut, 
  CalendarCheck, 
  Link2, 
  Briefcase, 
  Sparkles, 
  Menu, 
  X, 
  Download, 
  CheckCircle2, 
  MoreHorizontal,
  RefreshCw,
  Bookmark
} from 'lucide-react';
import { cn } from '../shared/utils/cn';
import QuickAddSheet from '../modules/leads/components/QuickAddSheet';
import RemindersWidget from '../modules/leads/components/RemindersWidget';
import { usePwa } from '../shared/pwa/usePwa';
import { useSavedFilters } from '../modules/leads/api/filters';

// All modules for desktop sidebar and mobile drawer
const ALL_MODULES = [
  { name: 'Actions', path: '/', icon: CalendarCheck, exact: true },
  { name: 'Leads CRM', path: '/leads', icon: Users },
  { name: 'Collaborators', path: '/collaborators', icon: Briefcase },
  { name: 'Staffing / ATS', path: '/staffing', icon: Briefcase },
  { name: 'Saved Filters', path: '/saved-filters', icon: Bookmark },
  { name: 'Personal Vault', path: '/vault', icon: Sparkles },
  { name: 'Global Links', path: '/links', icon: Link2 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

// Primary 4 tabs for mobile bottom bar
const MOBILE_PRIMARY_TABS = [
  { name: 'Actions', path: '/', icon: CalendarCheck, exact: true },
  { name: 'Leads', path: '/leads', icon: Users },
  { name: 'Staffing', path: '/staffing', icon: Briefcase },
  { name: 'Vault', path: '/vault', icon: Sparkles },
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isInstallable, isInstalled, hasUpdate, installApp, updateApp } = usePwa();
  const { data: savedFilters = [] } = useSavedFilters();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  // Check if current route is one of the secondary items in the "More" menu
  const isSecondaryActive = ['/collaborators', '/links', '/settings', '/pipeline', '/reports', '/saved-filters'].some(
    p => location.pathname === p || location.pathname.startsWith(`${p}/`)
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      
      {/* PWA Update Banner */}
      {hasUpdate && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white text-xs sm:text-sm px-4 py-2 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>A new version of BB ERP is available!</span>
          </div>
          <button
            onClick={updateApp}
            className="px-3 py-1 bg-white text-blue-700 font-semibold rounded-md shadow hover:bg-blue-50 transition text-xs"
          >
            Update Now
          </button>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
              BE
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">BoltBlazers</h1>
              <p className="text-[10px] text-gray-500 font-medium">ERP & ATS Suite</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {ALL_MODULES.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive 
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-gray-200"
                )
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}

          {/* Saved Views in Left Sidebar */}
          {savedFilters && savedFilters.length > 0 && (
            <div className="pt-3 mt-3 border-t border-gray-200 dark:border-zinc-800">
              <div className="flex items-center justify-between px-3 py-1 mb-1">
                <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Bookmark className="w-3 h-3 text-blue-500" />
                  <span>Saved Views</span>
                </span>
                <Link 
                  to="/saved-filters" 
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-0.5">
                {savedFilters.slice(0, 8).map((item) => {
                  const targetPath = item.filters?.path || `/leads?viewId=${item.id}`;
                  const isActive = (location.pathname + location.search) === targetPath;
                  return (
                    <Link
                      key={item.id}
                      to={targetPath}
                      className={cn(
                        "flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors group",
                        isActive 
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium" 
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-gray-200"
                      )}
                      title={item.name}
                    >
                      <span className="truncate">{item.name}</span>
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-400 transition-opacity">
                        ↗
                      </span>
                    </Link>
                  );
                })}
                {savedFilters.length > 8 && (
                  <Link
                    to="/saved-filters"
                    className="block px-3 py-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    +{savedFilters.length - 8} more views...
                  </Link>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Desktop PWA Install Prompt */}
        {isInstallable && (
          <div className="p-3 mx-3 mb-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">Install Desktop App</p>
            <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">Fast standalone window & offline access.</p>
            <button
              onClick={installApp}
              className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Install App
            </button>
          </div>
        )}

        <div className="p-3 border-t border-gray-200 dark:border-zinc-800 space-y-1">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2 w-full rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
        
        {/* Mobile Header (Hidden on md and up) */}
        <header className="h-14 bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-3 md:hidden shrink-0 z-30 pt-safe">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                BE
              </div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white">BB ERP</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isInstallable && (
              <button
                onClick={installApp}
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-sm transition"
              >
                <Download className="w-3 h-3" /> Install
              </button>
            )}
            <DevBackendToggle />
            <RemindersWidget />
          </div>
        </header>

        {/* Desktop Top Header Bar */}
        <div className="hidden md:flex h-14 bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 items-center justify-end px-6 gap-3 shrink-0">
          <DevBackendToggle />
          <RemindersWidget />
        </div>

        {/* Routed Page Content */}
        <main className="flex-1 overflow-y-auto relative overscroll-contain">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (5 Tabs) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border-t border-gray-200 dark:border-zinc-800 flex justify-around items-center h-[calc(4rem+env(safe-area-inset-bottom))] pb-safe z-40 touch-manipulation">
        {MOBILE_PRIMARY_TABS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors relative",
                isActive 
                  ? "text-blue-600 dark:text-blue-400 font-semibold" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-5 h-5 mb-0.5", isActive && "stroke-[2.5]")} />
                <span className="text-[11px] leading-tight">{item.name}</span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* 5th Tab: Menu / More */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors relative",
            isSecondaryActive || isMobileMenuOpen
              ? "text-blue-600 dark:text-blue-400 font-semibold" 
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          )}
          aria-label="More Options"
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] leading-tight">More</span>
          {isSecondaryActive && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
          )}
        </button>
      </nav>

      {/* Mobile Slide-Over Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Menu */}
          <div className="relative w-4/5 max-w-xs bg-white dark:bg-zinc-950 h-full flex flex-col shadow-2xl z-10 pt-safe pb-safe">
            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                  BE
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">BoltBlazers ERP</h2>
                  <p className="text-[10px] text-gray-500">Navigation & Tools</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Modules
              </p>
              {ALL_MODULES.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                    )
                  }
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}

              {/* Saved Views in Mobile Drawer */}
              {savedFilters && savedFilters.length > 0 && (
                <div className="pt-3 mt-3 border-t border-gray-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between px-3 py-1 mb-1">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Bookmark className="w-3 h-3 text-blue-500" />
                      <span>Saved Views</span>
                    </span>
                    <Link 
                      to="/saved-filters" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="space-y-0.5">
                    {savedFilters.slice(0, 8).map((item) => {
                      const targetPath = item.filters?.path || `/leads?viewId=${item.id}`;
                      return (
                        <Link
                          key={item.id}
                          to={targetPath}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                        >
                          <span className="truncate">{item.name}</span>
                          <span className="text-[10px] text-gray-400">↗</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Install PWA Prompt inside Drawer */}
              {isInstallable && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-semibold text-blue-900 dark:text-blue-200">Install Mobile App</span>
                  </div>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 mb-2">
                    Add BB ERP to your home screen for quick offline access and native app experience.
                  </p>
                  <button
                    onClick={() => {
                      installApp();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    Install Now
                  </button>
                </div>
              )}

              {isInstalled && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>App is installed on your phone</span>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-zinc-800 space-y-2">
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (Quick Add Lead/Collaborator) */}
      <QuickAddSheet />
    </div>
  );
}
