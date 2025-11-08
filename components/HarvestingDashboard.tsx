
import React, { useState, useEffect, useMemo } from 'react';
import type { AggregatedHarvestList, MicrogreenVariety, MicrogreenVarietyName, ShortfallReport, ShortfallItem, HarvestLogEntry } from '../types';
import { LeafIcon, XMarkIcon, ClipboardDocumentListIcon, InformationCircleIcon } from './icons';
import PickListModal from './PickListModal';
import type { AppView } from '../App';

interface HarvestingDashboardProps {
  aggregatedList: AggregatedHarvestList;
  onHarvest: (harvestedQuantities: Record<MicrogreenVarietyName, number | string>) => Promise<ShortfallReport>;
  microgreenVarieties: MicrogreenVariety[];
  harvestingLog: Record<string, HarvestLogEntry>;
  setCurrentView: (view: AppView) => void;
}

const ShortfallReportModal: React.FC<{ report: ShortfallReport, onClose: () => void }> = ({ report, onClose }) => {
  const groupedByClient: Record<string, ShortfallItem[]> = {};
  report.forEach(item => {
    (groupedByClient[item.clientName] = groupedByClient[item.clientName] || []).push(item);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Harvest Shortfall Report</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">The following items could not be fully supplied based on the harvest quantities provided.</p>
          <div className="space-y-6">
            {Object.entries(groupedByClient).map(([clientName, items]) => (
              <div key={clientName} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">{clientName}</h3>
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-600 dark:text-slate-300">
                    <tr>
                      <th scope="col" className="px-4 py-2 rounded-l-lg">Variety</th>
                      <th scope="col" className="px-4 py-2 text-center">Requested</th>
                      <th scope="col" className="px-4 py-2 text-center">Harvested</th>
                      <th scope="col" className="px-4 py-2 text-center text-red-500 dark:text-red-400 rounded-r-lg">Shortfall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 last:border-b-0">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{item.variety}</td>
                        <td className="px-4 py-3 text-center font-mono">{item.requested}</td>
                        <td className="px-4 py-3 text-center font-mono">{item.allocated}</td>
                        <td className="px-4 py-3 text-center font-bold text-red-500 font-mono">-{item.shortfall}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


const HarvestingDashboard: React.FC<HarvestingDashboardProps> = ({ aggregatedList, onHarvest, microgreenVarieties, harvestingLog, setCurrentView }) => {
  const [harvestedQuantities, setHarvestedQuantities] = useState<Record<MicrogreenVarietyName, number | string>>({});
  const [shortfallReport, setShortfallReport] = useState<ShortfallReport | null>(null);
  const [isPickListModalOpen, setIsPickListModalOpen] = useState(false);

  const microgreenVarietyNames = useMemo(() => microgreenVarieties.map(v => v.name), [microgreenVarieties]);

  const todaysHarvestSchedule = useMemo(() => {
    // FIX: Explicitly type the Map to ensure correct type inference for `variety`.
    const varietyMap = new Map<string, MicrogreenVariety>(microgreenVarieties.map(v => [v.name, v]));
    const todaysSchedule: Record<MicrogreenVarietyName, number> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    Object.values(harvestingLog).forEach((logEntry: HarvestLogEntry) => {
      const sowingDate = new Date(logEntry.date + 'T00:00:00');
      Object.entries(logEntry.trays).forEach(([varietyName, trays]) => {
        if (trays > 0) {
          const variety = varietyMap.get(varietyName);
          if (variety) {
            const harvestDate = new Date(sowingDate);
            harvestDate.setDate(harvestDate.getDate() + variety.growthCycleDays);
            if (harvestDate.getTime() === today.getTime()) {
              todaysSchedule[varietyName] = (todaysSchedule[varietyName] || 0) + trays;
            }
          }
        }
      });
    });

    return todaysSchedule;
  }, [harvestingLog, microgreenVarieties]);

  useEffect(() => {
    const initialQuantities = microgreenVarietyNames.reduce((acc, varietyName) => {
        const quantity = Number(aggregatedList[varietyName]) || 0;
        acc[varietyName] = quantity > 0 ? quantity : '';
        return acc;
    }, {} as Record<MicrogreenVarietyName, number|string>);
    setHarvestedQuantities(initialQuantities);
  }, [aggregatedList, microgreenVarietyNames]);

  const handleQuantityChange = (variety: MicrogreenVarietyName, value: string) => {
    // Allow the input to be cleared. For other values, only update state if the number is non-negative.
    // This prevents users from typing negative numbers.
    if (value === '' || Number(value) >= 0) {
      setHarvestedQuantities(prev => ({ ...prev, [variety]: value }));
    }
  };

  const handleSubmit = async () => {
    const report = await onHarvest(harvestedQuantities);
    if (report.length > 0) {
      setShortfallReport(report);
    }
  };
  
  const hasPendingItems = Object.values(aggregatedList).some(qty => Number(qty) > 0);

  const dailyTotal = useMemo(() => {
    return Object.values(harvestedQuantities).reduce((sum: number, count) => sum + Number(count || 0), 0);
  }, [harvestedQuantities]);

  const sortedVarieties = useMemo(() => 
    [...microgreenVarietyNames].sort((a, b) => {
      const aRequired = Number(aggregatedList[a] || 0) > 0;
      const bRequired = Number(aggregatedList[b] || 0) > 0;
      if (aRequired && !bRequired) return -1;
      if (!aRequired && bRequired) return 1;
      return a.localeCompare(b);
    }), 
  [microgreenVarietyNames, aggregatedList]);

  return (
    <>
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 text-blue-800 dark:text-blue-300 p-4 rounded-r-lg mb-6" role="alert">
        <div className="flex">
          <div className="flex-shrink-0">
            <InformationCircleIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm">
              This list shows items required for pending orders with a delivery date of <strong>today or earlier</strong>, plus any orders with no set delivery date. 
              To plan for future orders, please visit the{' '}
              <button onClick={() => setCurrentView('sowing')} className="font-bold underline hover:text-blue-600 dark:hover:text-blue-200 focus:outline-none">
                Sowing
              </button>
              {' '}dashboard.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Harvesting List Section */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl">
          <div className="flex items-center gap-3 mb-6">
              <LeafIcon className="w-8 h-8 text-green-500" />
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Harvesting Dashboard</h2>
          </div>
          {hasPendingItems ? (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
              {sortedVarieties.map(variety => (
                <div key={variety} className="grid grid-cols-5 items-center gap-4">
                  <span className="col-span-2 font-semibold text-slate-700 dark:text-slate-200">{variety}</span>
                  <div className="col-span-1 text-center">
                    <span className="font-mono text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg text-sm">
                      {Number(aggregatedList[variety] || 0)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      value={harvestedQuantities[variety] ?? ''}
                      onChange={(e) => handleQuantityChange(variety, e.target.value)}
                      className="w-full px-3 py-2 text-slate-800 bg-white dark:bg-slate-600 dark:text-white border border-slate-300 dark:border-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Actual (boxes)"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              <h3 className="text-lg font-semibold">All Clear!</h3>
              <p>There are no pending orders requiring harvesting today.</p>
            </div>
          )}
        </div>
        
        {/* Controls & Summary Section */}
        <div className="sticky top-20">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Summary & Actions</h3>
              
              <div className="bg-green-50 dark:bg-slate-700 p-4 rounded-lg text-center">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Boxes to Harvest</p>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-1">{dailyTotal}</p>
              </div>

              <div className="mt-6 space-y-3">
                 <button
                  onClick={() => setIsPickListModalOpen(true)}
                  disabled={!hasPendingItems}
                  className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-colors duration-300"
                >
                  <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
                  Generate Pick List
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!hasPendingItems}
                  className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-slate-800 transition-colors duration-300"
                >
                  Complete Harvest
                </button>
              </div>
            </div>
            
             <div className="mt-6 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Scheduled for Today</h3>
                {Object.keys(todaysHarvestSchedule).length > 0 ? (
                    <ul className="space-y-2 text-sm">
                        {Object.entries(todaysHarvestSchedule).map(([variety, trays]) => (
                            <li key={variety} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">
                                <span className="font-medium text-slate-700 dark:text-slate-300">{variety}</span>
                                <span className="font-mono text-slate-800 dark:text-white bg-slate-200 dark:bg-slate-600 px-2 py-0.5 rounded">{trays} trays</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-center text-slate-500 dark:text-slate-400 py-4">No specific harvests scheduled for today based on sowing logs.</p>
                )}
             </div>
        </div>

      </div>
      {shortfallReport && <ShortfallReportModal report={shortfallReport} onClose={() => setShortfallReport(null)} />}
      {isPickListModalOpen && <PickListModal list={aggregatedList} onClose={() => setIsPickListModalOpen(false)} />}
    </>
  );
};

export default HarvestingDashboard;