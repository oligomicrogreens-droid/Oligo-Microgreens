import React, { useState, useEffect, useMemo } from 'react';
import type { MicrogreenVarietyName, HarvestLogEntry } from '../types';
import { ClipboardDocumentListIcon } from './icons';

interface HarvestingLogProps {
  microgreenVarietyNames: MicrogreenVarietyName[];
  harvestingLog: Record<string, HarvestLogEntry>;
  onSaveSowingLog: (date: Date, trays: Record<MicrogreenVarietyName, number | string>) => void;
}

const HarvestingLog: React.FC<HarvestingLogProps> = ({ microgreenVarietyNames, harvestingLog, onSaveSowingLog }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [trayCounts, setTrayCounts] = useState<Record<MicrogreenVarietyName, number | string>>({});

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

  const handleQuantityChange = (variety: MicrogreenVarietyName, value: string) => {
    if (value === '' || Number(value) >= 0) {
      setTrayCounts(prev => ({ ...prev, [variety]: value }));
    }
  };

  const handleSave = () => {
    onSaveSowingLog(selectedDate, trayCounts);
    alert(`Sowing log for ${selectedDate.toLocaleDateString()} has been saved.`);
  };

  const dailyTotal = useMemo(() => {
    return Object.values(trayCounts).reduce((sum: number, count) => sum + Number(count || 0), 0);
  }, [trayCounts]);
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = e.target.value.split('-').map(Number);
    setSelectedDate(new Date(year, month - 1, day));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Daily Sowing Log</h2>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
          {microgreenVarietyNames.map(variety => (
            <div key={variety} className="grid grid-cols-5 items-center gap-4">
              <span className="col-span-3 font-semibold text-gray-700 dark:text-gray-200">{variety}</span>
              <div className="col-span-2">
                <input
                  type="number"
                  min="0"
                  value={trayCounts[variety] ?? ''}
                  onChange={(e) => handleQuantityChange(variety, e.target.value)}
                  className="w-full px-3 py-2 text-gray-800 bg-white dark:bg-gray-600 dark:text-white border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="No. of Trays"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="sticky top-20">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Log Details</h3>
          <div>
            <label htmlFor="harvest-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Date</label>
            <input
              id="harvest-date"
              type="date"
              value={dateString}
              onChange={handleDateChange}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="mt-6 bg-green-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Trays for {selectedDate.toLocaleDateString()}</p>
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

export default HarvestingLog;