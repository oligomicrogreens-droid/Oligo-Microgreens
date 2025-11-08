
import React, { useState, useEffect, useMemo } from 'react';
import type { SeedInventory, SeedInventoryItem, MicrogreenVarietyName, MicrogreenVariety } from '../types';
import { SeedIcon, ExclamationTriangleIcon } from './icons';

interface SeedInventoryDashboardProps {
  seedInventory: SeedInventory;
  onUpdateItem: (variety: MicrogreenVarietyName, item: Partial<SeedInventoryItem>) => void;
  microgreenVarieties: MicrogreenVariety[];
}

const SeedInventoryRow: React.FC<{
  varietyName: MicrogreenVarietyName;
  item: SeedInventoryItem;
  onUpdate: (variety: MicrogreenVarietyName, item: Partial<SeedInventoryItem>) => void;
}> = ({ varietyName, item, onUpdate }) => {
  const [stock, setStock] = useState(item.stockOnHand);
  const [reorder, setReorder] = useState(item.reorderLevel);
  const [grams, setGrams] = useState(item.gramsPerTray);
  const [safetyStock, setSafetyStock] = useState(item.safetyStockBoxes || 0);

  useEffect(() => {
    setStock(item.stockOnHand);
    setReorder(item.reorderLevel);
    setGrams(item.gramsPerTray);
    setSafetyStock(item.safetyStockBoxes || 0);
  }, [item]);

  const handleBlur = (field: keyof SeedInventoryItem, value: number) => {
    if (value !== item[field]) {
      onUpdate(varietyName, { [field]: value });
    }
  };
  
  const estimatedTraysLeft = useMemo(() => {
      if (!grams || grams <= 0) return Infinity;
      return Math.floor(stock / grams);
  }, [stock, grams]);

  const isLowStock = stock <= reorder;

  return (
    <tr className={`bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 ${isLowStock ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-2">
        {varietyName}
        {isLowStock && <ExclamationTriangleIcon className="w-5 h-5 text-red-500" title="Stock is at or below reorder level" />}
      </td>
      <td className="px-6 py-4">
        <input 
          type="number"
          value={stock}
          onChange={e => setStock(Number(e.target.value))}
          onBlur={e => handleBlur('stockOnHand', Number(e.target.value))}
          className="w-24 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500"
        />
      </td>
      <td className="px-6 py-4">
        <input
          type="number"
          value={reorder}
          onChange={e => setReorder(Number(e.target.value))}
          onBlur={e => handleBlur('reorderLevel', Number(e.target.value))}
          className="w-24 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500"
        />
      </td>
      <td className="px-6 py-4">
        <input
          type="number"
          value={grams}
          onChange={e => setGrams(Number(e.target.value))}
          onBlur={e => handleBlur('gramsPerTray', Number(e.target.value))}
          className="w-24 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500"
        />
      </td>
      <td className="px-6 py-4">
        <input
          type="number"
          value={safetyStock}
          onChange={e => setSafetyStock(Number(e.target.value))}
          onBlur={e => handleBlur('safetyStockBoxes', Number(e.target.value))}
          className="w-24 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500"
        />
      </td>
      <td className="px-6 py-4 text-center font-mono font-bold text-lg text-green-600 dark:text-green-400">
        {isFinite(estimatedTraysLeft) ? estimatedTraysLeft : 'N/A'}
      </td>
    </tr>
  );
};

const SeedInventoryDashboard: React.FC<SeedInventoryDashboardProps> = ({ seedInventory, onUpdateItem, microgreenVarieties }) => {
  const sortedVarietyNames = useMemo(() => microgreenVarieties.map(v => v.name).sort(), [microgreenVarieties]);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <SeedIcon className="w-8 h-8 text-green-500" />
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Seed Inventory Management</h2>
      </div>

      <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
            <tr>
              <th scope="col" className="px-6 py-3">Variety</th>
              <th scope="col" className="px-6 py-3">Stock on Hand (g)</th>
              <th scope="col" className="px-6 py-3">Reorder Level (g)</th>
              <th scope="col" className="px-6 py-3">Grams per Tray</th>
              <th scope="col" className="px-6 py-3">Safety Stock (Boxes)</th>
              <th scope="col" className="px-6 py-3 text-center">Est. Trays Left</th>
            </tr>
          </thead>
          <tbody>
            {sortedVarietyNames.map(name => {
              const item = seedInventory[name];
              if (!item) return null;
              return <SeedInventoryRow key={name} varietyName={name} item={item} onUpdate={onUpdateItem} />;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SeedInventoryDashboard;
