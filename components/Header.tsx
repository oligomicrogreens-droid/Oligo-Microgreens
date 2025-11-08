
import React from 'react';
import type { AppView } from '../App';
import { HomeIcon, LeafIcon, ShoppingCartIcon } from './icons';
import { useUser } from '../contexts/UserContext';
import { viewPermissions } from '../permissions';

interface HeaderProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  onLogout: () => void;
}

type NavItem = { view: AppView; label: string; icon?: React.ReactNode };
type Separator = { type: 'separator' };
const allNavItems: (NavItem | Separator)[] = [
    { view: 'dashboard', label: 'Dashboard', icon: <HomeIcon className="w-4 h-4 mr-1.5"/> },
    { view: 'orders', label: 'Order List' },
    { type: 'separator' },
    { view: 'sowing-plan', label: 'Sowing Plan' },
    { view: 'sowing', label: 'Sowing' },
    { view: 'seed-inventory', label: 'Seed Inventory' },
    { view: 'purchase-orders', label: 'Purchase Orders', icon: <ShoppingCartIcon className="w-4 h-4 mr-1.5" /> },
    { view: 'upcoming-harvests', label: 'Upcoming Harvests' },
    { view: 'harvesting', label: 'Harvesting' },
    { view: 'harvesting-log', label: 'Sowing Log' },
    { view: 'waste-log', label: 'Waste Log' },
    { type: 'separator' },
    { view: 'dispatch', label: 'Dispatch' },
    { view: 'delivery', label: 'Delivery' },
    { view: 'delivery-expenses', label: 'Delivery Expenses' },
    { type: 'separator' },
    { view: 'reports', label: 'Reports' },
    { view: 'management', label: 'Management' },
  ];


const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, onLogout }) => {
  const { currentUser } = useUser();

  const accessibleNavItems = React.useMemo(() => {
    if (!currentUser) return [];
    return allNavItems.filter(item => {
        if ('view' in item) {
            return viewPermissions[item.view].includes(currentUser.role);
        }
        return true; // Keep separators for now, will be cleaned up next
    }).reduce((acc, item, index, arr) => {
        // Fix: Added type guards to check for 'type' property before accessing it.
        // Clean up separators that are at the beginning, end, or next to another separator
        if ('type' in item && item.type === 'separator') {
            const prev = acc[acc.length - 1];
            if (!prev || ('type' in prev && prev.type === 'separator') || index === arr.length - 1) {
                return acc;
            }
        }
        acc.push(item);
        return acc;
    }, [] as (NavItem | Separator)[]);
  }, [currentUser]);

  const NavButton: React.FC<NavItem> = ({ view, label, icon }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => setCurrentView(view)}
        className={`flex items-center px-3 py-2 text-xs md:px-4 md:text-sm font-medium rounded-lg transition-colors duration-200 whitespace-nowrap ${
          isActive
            ? 'bg-green-600 text-white shadow-md'
            : 'text-slate-600 dark:text-slate-300 hover:bg-green-100 dark:hover:bg-slate-700'
        }`}
      >
        {icon}{label}
      </button>
    );
  };

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <LeafIcon className="h-8 w-8 text-green-500" />
            <h1 className="ml-2 text-xl md:text-2xl font-bold text-slate-800 dark:text-white">
              Microgreen Hub
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden lg:flex items-center space-x-2">
                {accessibleNavItems.map((item, index) => {
                if ('type' in item && item.type === 'separator') {
                    return <div key={`sep-${index}`} className="h-5 w-px bg-slate-300 dark:bg-slate-600"></div>;
                }
                const navItem = item as NavItem;
                return <NavButton key={navItem.view} {...navItem} />;
                })}
            </nav>
            {currentUser && (
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{currentUser.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.role}</p>
                    </div>
                    <button 
                        onClick={onLogout}
                        className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                        title="Logout"
                    >
                        Logout
                    </button>
                </div>
            )}
           </div>
        </div>
         {/* Mobile/Tablet scrollable navigation */}
        <nav className="flex lg:hidden items-center space-x-1 md:space-x-2 overflow-x-auto pb-2 border-t border-slate-200 dark:border-slate-700 pt-2">
        {accessibleNavItems.map((item) => {
            if ('type' in item && item.type === 'separator') return null; // Hide separators on mobile for a continuous scroll
            const navItem = item as NavItem;
            return <NavButton key={navItem.view} {...navItem} />;
        })}
        </nav>
      </div>
    </header>
  );
};

export default Header;