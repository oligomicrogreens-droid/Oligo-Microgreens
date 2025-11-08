
import React, { useState, useEffect, useMemo } from 'react';
import type { MicrogreenVarietyName, HarvestLogEntry, Order, MicrogreenVariety, SeedInventory } from '../types';
import { generateSowingPlan, SowingPlanItem } from '../utils/planner';
import { LeafIcon, ClipboardDocumentListIcon, LightBulbIcon, ExclamationTriangleIcon } from './icons';

interface SowingDashboardProps {
  microgreenVarieties: MicrogreenVariety[];
  harvestingLog: Record<string, HarvestLogEntry>;
  onSave: (date: Date, trays: Record<MicrogreenVarietyName, number | string>) => void;
  orders: Order[];
  seedInventory: SeedInventory;
}

const OrderBasedSowingPlan: React.FC<{
  plan: SowingPlanItem[];
  onApply: (plan: SowingPlanItem[]) => void;
}> = ({ plan, onApply }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <LightBulbIcon className="w-7 h-7 text-yellow-500" />
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Order-Based Sowing</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Recommendations for pending orders with delivery dates.</p>
          </div>
        </div>
        <button
          onClick={() => onApply(plan)}
          disabled={plan.length === 0}
          className="px-3 py-1.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs font-semibold rounded-md hover:bg-green-200 dark:hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Apply All to Log
        </button>
      </div>
      {plan.length > 0 ? (
        <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {plan.map(item => (
            <li key={item.variety} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700 dark:text-gray-200">{item.variety}</span>
                <span className="font-mono text-lg font-bold text-green-600 dark:text-green-400">{item.trays} trays</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.reason}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          <p>No specific sowing required today for upcoming pending orders.</p>
        </div>
      )}
    </div>
  );
};

const SowingDashboard: React.FC<SowingDashboardProps> = ({ microgreenVarieties, harvestingLog, onSave, orders, seedInventory }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [trayCounts, setTrayCounts] = useState<Record<MicrogreenVarietyName, number | string>>({});

  const microgreenVarietyNames = useMemo(() => microgreenVarieties.map(v => v.name).sort(), [microgreenVarieties]);

  const sowingPlan = useMemo(() => {
    return generateSowingPlan({ orders, microgreenVarieties, harvestingLog, targetSowingDate: selectedDate });
  }, [orders, microgreenVarieties, harvestingLog, selectedDate]);

  const toYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const dateString = toYYYYMMDD(selectedDate);

  useEffect(() => {
    const logEntry = harvestingLog[dateString];
    const initialCounts = microgreenVarietyNames.reduce((acc, variety) => {
        const count = logEntry?.trays[variety];
        acc[variety] = count ? count : '';
        return acc;
    }, {} as Record<MicrogreenVarietyName, number | string>);
    setTrayCounts(initialCounts);
  }, [dateString, harvestingLog, microgreenVarietyNames]);

  const handleApplyPlan = (plan: SowingPlanItem[]) => {
    const newTrayCounts = { ...trayCounts };
    plan.forEach(item => {
      const existing = Number(newTrayCounts[item.variety] || 0);
      newTrayCounts[item.variety] = existing + item.trays;
    });
    setTrayCounts(newTrayCounts);
  };

  const handleQuantityChange = (variety: MicrogreenVarietyName, value: string) => {
    if (value === '' || Number(value) >= 0) {
      setTrayCounts(prev => ({ ...prev, [variety]: value }));
    }
  };

  const handleSave = () => {
    onSave(selectedDate, trayCounts);
    alert(`Sowing log for ${selectedDate.toLocaleDateString()} has been saved.`);
  };

  const dailyTotal = useMemo(() => {
    return Object.values(trayCounts).reduce((sum: number, count) => sum + Number(count || 0), 0);
  }, [trayCounts]);
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = e.target.value.split('-').map(Number);
    // Use UTC to prevent timezone shifts from changing the date
    setSelectedDate(new Date(Date.UTC(year, month - 1, day)));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 space-y-8">
        <OrderBasedSowingPlan plan={sowingPlan} onApply={handleApplyPlan} />
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <LeafIcon className="w-8 h-8 text-green-500" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Log Actual Sown Trays</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-h-[60vh] overflow-y-auto pr-4">
            {microgreenVarietyNames.map(variety => {
              const inventoryItem = seedInventory[variety];
              const stock = inventoryItem?.stockOnHand ?? 0;
              const gramsPerTray = inventoryItem?.gramsPerTray ?? 1;
              const traysLeft = gramsPerTray > 0 ? Math.floor(stock / gramsPerTray) : Infinity;
              const enteredTrays = Number(trayCounts[variety] || 0);
              const isOverdraft = enteredTrays > traysLeft;

              return (
                <div key={variety}>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <label htmlFor={`sow-${variety}`} className="font-semibold text-gray-700 dark:text-gray-200 truncate">{variety}</label>
                    <div className="relative">
                      <input
                        id={`sow-${variety}`}
                        type="number"
                        min="0"
                        value={trayCounts[variety] ?? ''}
                        onChange={(e) => handleQuantityChange(variety, e.target.value)}
                        className={`w-full px-3 py-2 text-gray-800 bg-white dark:bg-gray-600 dark:text-white border  rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${isOverdraft ? 'border-red-500' : 'border-gray-300 dark:border-gray-500'}`}
                        placeholder="No. of Trays"
                      />
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1 pr-1">
                    {isFinite(traysLeft) ? traysLeft : 'N/A'} trays left ({stock.toFixed(0)}g)
                  </div>
                  {isOverdraft && (
                    <div className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400 mt-1">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      Not enough seeds in inventory.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="sticky top-20">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Log Controls</h3>
          <div>
            <label htmlFor="sowing-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Sowing Date</label>
            <input
              id="sowing-date"
              type="date"
              value={dateString}
              onChange={handleDateChange}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="mt-6 bg-green-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Trays Logged for {selectedDate.toLocaleDateString()}</p>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-1">{dailyTotal}</p>
          </div>

          <div className="mt-6">
            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 transition-colors duration-300"
            >
              <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
              Save Sowing Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SowingDashboard;
