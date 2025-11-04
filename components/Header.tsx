import React from 'react';
import type { AppView } from '../App';
import { HomeIcon, LeafIcon } from './icons';

interface HeaderProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
}

type NavItem = { view: AppView; label: string; icon?: React.ReactNode };
type Separator = { type: 'separator' };
const navItems: (NavItem | Separator)[] = [
    { view: 'dashboard', label: 'Dashboard', icon: <HomeIcon className="w-4 h-4 mr-1.5"/> },
    { view: 'orders', label: 'Order List' },
    { type: 'separator' },
    { view: 'sowing', label: 'Sowing' },
    { view: 'seed-inventory', label: 'Seed Inventory' },
    { view: 'upcoming-harvests', label: 'Upcoming Harvests' },
    { view: 'harvesting', label: 'Harvesting' },
    { view: 'harvesting-log', label: 'Sowing Log' },
    { type: 'separator' },
    { view: 'dispatch', label: 'Dispatch' },
    { view: 'delivery', label: 'Delivery' },
    { type: 'separator' },
    { view: 'reports', label: 'Reports' },
    { view: 'management', label: 'Management' },
  ];


const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView }) => {
  const NavButton: React.FC<NavItem> = ({ view, label, icon }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => setCurrentView(view)}
        className={`flex items-center px-3 py-2 text-xs md:px-4 md:text-sm font-medium rounded-md transition-colors duration-200 whitespace-nowrap ${
          isActive
            ? 'bg-green-600 text-white shadow-md'
            : 'text-gray-600 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-gray-700'
        }`}
      >
        {icon}{label}
      </button>
    );
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <LeafIcon className="h-8 w-8 text-green-500" />
            <h1 className="ml-2 text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
              Microgreen Hub
            </h1>
          </div>
          <nav className="hidden lg:flex items-center space-x-2">
            {navItems.map((item, index) => {
              if ('type' in item && item.type === 'separator') {
                return <div key={`sep-${index}`} className="h-5 w-px bg-gray-300 dark:bg-gray-600"></div>;
              }
              const navItem = item as NavItem;
              return <NavButton key={navItem.view} {...navItem} />;
            })}
          </nav>
           {/* Mobile/Tablet scrollable navigation */}
           <nav className="flex lg:hidden items-center space-x-1 md:space-x-2 overflow-x-auto pb-2">
            {navItems.map((item) => {
                if ('type' in item && item.type === 'separator') return null; // Hide separators on mobile for a continuous scroll
                const navItem = item as NavItem;
                return <NavButton key={navItem.view} {...navItem} />;
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;