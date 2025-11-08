
import React, { useState, useMemo, useCallback } from 'react';
import type { Order, MicrogreenVariety, DeliveryMode } from '../types';
import { PlusIcon, TrashIcon, ExclamationTriangleIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from './icons';

interface ManagementDashboardProps {
  microgreenVarieties: MicrogreenVariety[];
  deliveryModes: DeliveryMode[];
  orders: Order[];
  onAddVariety: (name: string, growthCycleDays: number) => void;
  onAddMode: (mode: string) => void;
  onShowHistory: (clientName: string) => void;
  onDeleteVariety: (name: string) => void;
  onDeleteAllOrders: () => void;
  onResetData: () => void;
  onOpenImportModal: () => void;
  onOpenImportVarietiesModal: () => void;
  onExportData: () => void;
  onImportData: (fileContent: string) => void;
}

const ManagementItem: React.FC<{ item: MicrogreenVariety; onDelete: (itemName: string) => void }> = ({ item, onDelete }) => {
    return (
        <li className="flex justify-between items-center px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300">
            <div>
              <span>{item.name}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">({item.growthCycleDays} days)</span>
            </div>
            <button
                onClick={() => onDelete(item.name)}
                className="text-slate-400 hover:text-red-500 p-1 rounded-full transition-colors"
                aria-label={`Delete ${item.name}`}
            >
                <TrashIcon className="w-5 h-5" />
            </button>
        </li>
    );
};

const VarietyManagementCard: React.FC<{
  items: MicrogreenVariety[];
  onAdd: (name: string, days: number) => void;
  onDelete: (name: string) => void;
  onOpenImportModal: () => void;
}> = ({ items, onAdd, onDelete, onOpenImportModal }) => {
  const [newName, setNewName] = useState('');
  const [newDays, setNewDays] = useState('');

  const handleAdd = () => {
    const days = parseInt(newDays, 10);
    if (newName.trim() && !isNaN(days) && days > 0) {
      onAdd(newName.trim(), days);
      setNewName('');
      setNewDays('');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Microgreen Varieties</h3>
        <button
          onClick={onOpenImportModal}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
          title="Import varieties from a CSV file"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Import
        </button>
      </div>
      <ul className="space-y-2 mb-4 h-48 overflow-y-auto flex-grow">
        {items.map((item) => (
          <ManagementItem key={item.name} item={item} onDelete={onDelete} />
        ))}
      </ul>
      <div className="flex gap-2 mt-auto">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-grow px-3 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="New variety name..."
        />
        <input
          type="number"
          min="1"
          value={newDays}
          onChange={(e) => setNewDays(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="w-24 px-3 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Days"
        />
        <button
          onClick={handleAdd}
          className="p-2 bg-green-600 text-white font-semibold rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-slate-800"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};


const ManagementCard: React.FC<{ 
  title: string; 
  items: string[]; 
  onAdd: (item: string) => void; 
  placeholder: string; 
}> = ({ title, items, onAdd, placeholder }) => {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem.trim());
      setNewItem('');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">{title}</h3>
      <ul className="space-y-2 mb-4 h-48 overflow-y-auto">
        {items.map((item) => (
            <li key={item} className="flex justify-between items-center px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300">
              <span>{item}</span>
            </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-grow px-3 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder={placeholder}
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-sm hover:bg-green-700 disabled:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-slate-800"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};


const ManagementDashboard: React.FC<ManagementDashboardProps> = ({ 
    microgreenVarieties, 
    deliveryModes, 
    orders, 
    onAddVariety, 
    onAddMode, 
    onShowHistory,
    onDeleteVariety,
    onDeleteAllOrders,
    onResetData,
    onOpenImportModal,
    onOpenImportVarietiesModal,
    onExportData,
    onImportData
}) => {
  const clients = useMemo(() => {
    const clientSet = new Set(orders.map(order => order.clientName));
    return Array.from(clientSet).sort((a: string, b: string) => a.localeCompare(b));
  }, [orders]);
  
  const handleDeleteVariety = useCallback((varietyName: string) => {
    if (window.confirm(`Are you sure you want to delete the variety "${varietyName}"? This cannot be undone.`)) {
      onDeleteVariety(varietyName);
    }
  }, [onDeleteVariety]);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target?.result as string;
        onImportData(text);
        // Reset file input so the same file can be uploaded again if needed
        e.target.value = ''; 
    };
    reader.onerror = () => {
        alert("Failed to read the file.");
    };
    reader.readAsText(file);
  };


  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <VarietyManagementCard 
          items={microgreenVarieties}
          onAdd={onAddVariety}
          onDelete={handleDeleteVariety}
          onOpenImportModal={onOpenImportVarietiesModal}
        />
        <ManagementCard 
          title="Delivery Modes / Personnel"
          items={deliveryModes}
          onAdd={onAddMode}
          placeholder="Add new delivery mode..."
        />
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Clients</h3>
          {clients.length > 0 ? (
            <ul className="space-y-2 h-[268px] overflow-y-auto">
              {clients.map((client, index) => (
                <li key={index}>
                  <button 
                    onClick={() => onShowHistory(client)}
                    className="w-full text-left px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-green-100 dark:hover:bg-green-800 transition-colors duration-200"
                  >
                    {client}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
             <div className="text-center text-slate-500 dark:text-slate-400 h-[268px] flex items-center justify-center">
                No clients found.
             </div>
          )}
        </div>
      </div>
      
       <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
         <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Data Management</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg">
                <h4 className="text-lg font-semibold text-slate-800 dark:text-blue-400">Import Orders (from Excel/CSV)</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Bulk-upload new pending orders from a file. First, save your Excel sheet as a CSV file, then upload it here for quick data entry.
                </p>
                <button 
                    onClick={onOpenImportModal}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900 transition-colors"
                >
                    <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                    Import Orders from File
                </button>
            </div>
         </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Data Portability</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg">
                <h4 className="text-lg font-semibold text-slate-800 dark:text-blue-400">Export Data</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Download all your application data into a single JSON file. You can use this file as a backup or to transfer your data to another computer.
                </p>
                <button 
                    onClick={onExportData}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900 transition-colors"
                >
                    <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                    Export Data File
                </button>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg">
                <h4 className="text-lg font-semibold text-slate-800 dark:text-green-400">Import Data</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Upload a previously exported JSON file to restore your data. <strong className="text-yellow-500">Warning:</strong> This will overwrite all current data in this browser.
                </p>
                <input
                    type="file"
                    id="import-file-input"
                    className="hidden"
                    accept=".json,application/json"
                    onChange={handleFileImport}
                />
                <label
                    htmlFor="import-file-input"
                    className="mt-4 cursor-pointer inline-flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-slate-900 transition-colors"
                >
                    <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
                    Import Data File
                </label>
            </div>
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
         <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Danger Zone</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-xl shadow-lg border border-red-200 dark:border-red-800">
                <div className="flex items-start">
                    <div className="flex-shrink-0 text-red-500 dark:text-red-400">
                        <ExclamationTriangleIcon className="w-6 h-6" />
                    </div>
                    <div className="ml-4 flex-1">
                        <h4 className="text-lg font-semibold text-red-800 dark:text-red-300">Delete All Orders</h4>
                        <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                            This will permanently delete all orders from the application. This action cannot be undone, but will not affect other data like varieties or settings.
                        </p>
                        <button 
                            onClick={onDeleteAllOrders}
                            className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-slate-900 transition-colors"
                        >
                            Delete All Orders
                        </button>
                    </div>
                </div>
             </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-xl shadow-lg border border-red-200 dark:border-red-800">
                <div className="flex items-start">
                    <div className="flex-shrink-0 text-red-500 dark:text-red-400">
                        <ExclamationTriangleIcon className="w-6 h-6" />
                    </div>
                    <div className="ml-4 flex-1">
                        <h4 className="text-lg font-semibold text-red-800 dark:text-red-300">Reset Application Data</h4>
                        <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                            This will permanently delete all orders, logs, and settings stored in your browser. This action cannot be undone.
                        </p>
                        <button 
                            onClick={onResetData}
                            className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-slate-900 transition-colors"
                        >
                            Reset All Data
                        </button>
                    </div>
                </div>
            </div>
         </div>
      </div>

    </div>
  );
};

export default ManagementDashboard;
