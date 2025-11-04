import type { Order, HarvestLogEntry, YieldRatioData, MicrogreenVarietyName } from '../types';
import { OrderStatus } from '../types';

/**
 * Calculates the yield ratio (boxes harvested per tray sown) for each microgreen variety
 * within a given date range.
 *
 * @param orders - The complete list of orders.
 * @param harvestingLog - The log of trays sown per day.
 * @param startDate - The start of the analysis period.
 * @param endDate - The end of the analysis period.
 * @returns An array of objects, each containing the variety, trays sown, boxes harvested, and calculated yield ratio.
 */
export const calculateYieldRatios = (
  orders: Order[],
  harvestingLog: Record<string, HarvestLogEntry>,
  startDate: Date,
  endDate: Date
): YieldRatioData[] => {
  const toYYYYMMDD = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const startTime = startDate.getTime();
  // Set end of day for inclusive date range
  const endTime = new Date(endDate.setHours(23, 59, 59, 999)).getTime();

  // 1. Aggregate trays sown from the harvesting log
  const traysSown: Record<MicrogreenVarietyName, number> = {};
  for (const dateString in harvestingLog) {
    const logDate = new Date(dateString).getTime();
    if (logDate >= startTime && logDate <= endTime) {
      const logEntry = harvestingLog[dateString];
      for (const variety in logEntry.trays) {
        traysSown[variety as MicrogreenVarietyName] = (traysSown[variety as MicrogreenVarietyName] || 0) + Number(logEntry.trays[variety as MicrogreenVarietyName]);
      }
    }
  }

  // 2. Aggregate boxes harvested from completed/dispatched/shortfall orders
  const boxesHarvested: Record<MicrogreenVarietyName, number> = {};
  const processedOrders = orders.filter(order => {
    const createdAt = order.createdAt.getTime();
    return (
      createdAt >= startTime &&
      createdAt <= endTime &&
      (order.status === OrderStatus.Harvested ||
        order.status === OrderStatus.Dispatched ||
        order.status === OrderStatus.Completed ||
        order.status === OrderStatus.Shortfall) &&
      order.actualHarvest
    );
  });

  processedOrders.forEach(order => {
    order.actualHarvest?.forEach(item => {
      boxesHarvested[item.variety] = (boxesHarvested[item.variety] || 0) + Number(item.quantity);
    });
  });

  // 3. Combine data and calculate ratios
  const allVarieties = new Set([...Object.keys(traysSown), ...Object.keys(boxesHarvested)]);
  
  const reportData: YieldRatioData[] = Array.from(allVarieties).map(variety => {
    const sown = traysSown[variety as MicrogreenVarietyName] || 0;
    const harvested = boxesHarvested[variety as MicrogreenVarietyName] || 0;
    
    return {
      variety: variety as MicrogreenVarietyName,
      traysSown: sown,
      boxesHarvested: harvested,
      yieldRatio: sown > 0 ? harvested / sown : null, // Avoid division by zero
    };
  });
  
  // Sort by variety name for consistent ordering
  return reportData.sort((a, b) => a.variety.localeCompare(b.variety));
};
