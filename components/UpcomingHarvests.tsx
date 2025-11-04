import React, { useMemo } from 'react';
import type { HarvestLogEntry, MicrogreenVariety } from '../types';
import { CalendarDaysIcon, LeafIcon } from './icons';

interface UpcomingHarvestsProps {
  harvestingLog: Record<string, HarvestLogEntry>;
  microgreenVarieties: MicrogreenVariety[];
}

interface HarvestPrediction {
  harvestDate: Date;
  varietyName: string;
  trays: number;
}

const UpcomingHarvests: React.FC<UpcomingHarvestsProps> = ({ harvestingLog, microgreenVarieties }) => {
  const varietyMap = useMemo(() => {
    return new Map(microgreenVarieties.map(v => [v.name, v]));
  }, [microgreenVarieties]);

  const upcomingHarvestsByDate = useMemo(() => {
    const predictions: HarvestPrediction[] = [];
    Object.values(harvestingLog).forEach((logEntry: HarvestLogEntry) => {
      const sowingDate = new Date(logEntry.date + 'T00:00:00'); // Avoid timezone issues
      Object.entries(logEntry.trays).forEach(([varietyName, trays]) => {
        if (trays > 0) {
          const variety = varietyMap.get(varietyName);
          if (variety) {
            const harvestDate = new Date(sowingDate);
            harvestDate.setDate(harvestDate.getDate() + variety.growthCycleDays);
            predictions.push({ harvestDate, varietyName, trays });
          }
        }
      });
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const grouped: Record<string, { varietyName: string; trays: number }[]> = {};
    predictions
      .filter(p => p.harvestDate >= today)
      .sort((a, b) => a.harvestDate.getTime() - b.harvestDate.getTime())
      .forEach(p => {
        const dateString = p.harvestDate.toISOString().split('T')[0];
        if (!grouped[dateString]) {
          grouped[dateString] = [];
        }
        grouped[dateString].push({ varietyName: p.varietyName, trays: p.trays });
      });

    return grouped;
  }, [harvestingLog, varietyMap]);

  // Create a list of the next 14 days to display
  const next14Days = useMemo(() => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        dates.push(date);
    }
    return dates;
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <CalendarDaysIcon className="w-8 h-8 text-green-500" />
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Upcoming Harvests (Next 14 Days)</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {next14Days.map(date => {
          const dateString = date.toISOString().split('T')[0];
          const harvests = upcomingHarvestsByDate[dateString];
          const isToday = date.toDateString() === new Date().toDateString();
          return (
            <div key={dateString} className={`bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md ${isToday ? 'border-2 border-green-500' : ''}`}>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">
                {date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
              {harvests && harvests.length > 0 ? (
                <ul className="space-y-2">
                  {harvests.map(({ varietyName, trays }, index) => (
                    <li key={index} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
                      <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"><LeafIcon className="w-4 h-4 text-green-500"/>{varietyName}</span>
                      <span className="font-mono text-gray-800 dark:text-white bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">{trays} trays</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No harvests scheduled.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingHarvests;
