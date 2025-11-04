import type { Order, HarvestLogEntry, MicrogreenVariety, MicrogreenVarietyName } from '../types';
import { calculateYieldRatios } from './reports';

const DEFAULT_YIELD_RATIO = 5; // Default boxes harvested per tray if no historical data exists.

const toYYYYMMDD = (d: Date): string => {
    if (!d) return '';
    const date = new Date(d);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export interface SowingPlanItem {
    variety: MicrogreenVarietyName;
    trays: number;
    reason: string;
}

/**
 * Generates a sowing plan for a specific target date based on pending orders and historical yield data.
 * @param {Order[]} orders - All orders in the system.
 * @param {MicrogreenVariety[]} microgreenVarieties - All available microgreen varieties.
 * @param {Record<string, HarvestLogEntry>} harvestingLog - The log of all past sowing activities.
 * @param {Date} targetSowingDate - The date for which to generate the sowing plan.
 * @returns {SowingPlanItem[]} An array of recommended items to sow.
 */
export const generateSowingPlan = ({
    orders,
    microgreenVarieties,
    harvestingLog,
    targetSowingDate,
}: {
    orders: Order[];
    microgreenVarieties: MicrogreenVariety[];
    harvestingLog: Record<string, HarvestLogEntry>;
    targetSowingDate: Date;
}): SowingPlanItem[] => {
    // 1. Establish data maps for quick lookups
    const varietyMap = new Map(microgreenVarieties.map(v => [v.name, v]));

    // 2. Calculate historical yield ratios to make the plan more accurate
    const historicalStartDate = new Date(targetSowingDate);
    historicalStartDate.setDate(targetSowingDate.getDate() - 90); // Use a 90-day lookback for yields
    const yieldRatiosData = calculateYieldRatios(orders, harvestingLog, historicalStartDate, targetSowingDate);
    const yieldRatioMap = new Map(yieldRatiosData
        .filter(d => d.yieldRatio !== null && d.yieldRatio > 0)
        .map(d => [d.variety, d.yieldRatio as number])
    );

    // 3. Aggregate future demand from all pending orders with a delivery date
    const demand = new Map<string, { quantity: number; variety: MicrogreenVarietyName }>(); // Key: 'YYYY-MM-DD::VarietyName'
    orders
        .filter(o => o.status === 'Pending' && o.deliveryDate)
        .forEach(order => {
            const deliveryDateStr = toYYYYMMDD(order.deliveryDate!);
            order.items.forEach(item => {
                const key = `${deliveryDateStr}::${item.variety}`;
                const existing = demand.get(key) || { quantity: 0, variety: item.variety };
                existing.quantity += item.quantity;
                demand.set(key, existing);
            });
        });

    // 4. Translate demand into sowing tasks by calculating trays and required sowing date
    const sowingTasks = [];
    for (const [key, dem] of demand.entries()) {
        const [demandDateStr] = key.split('::');
        const demandDate = new Date(demandDateStr + 'T00:00:00'); // Use T00:00:00 to avoid timezone issues
        const varietyInfo = varietyMap.get(dem.variety);

        if (varietyInfo) {
            const yieldRatio = yieldRatioMap.get(dem.variety) || DEFAULT_YIELD_RATIO;
            const traysNeeded = Math.ceil(dem.quantity / yieldRatio);
            
            const sowingDate = new Date(demandDate);
            sowingDate.setDate(demandDate.getDate() - varietyInfo.growthCycleDays);

            sowingTasks.push({
                sowDate: sowingDate,
                variety: dem.variety,
                trays: traysNeeded,
                reason: `For ${dem.quantity} boxes due ${demandDate.toLocaleDateString()}`
            });
        }
    }

    // 5. Filter for tasks scheduled for the target date and aggregate them
    const targetDateStr = toYYYYMMDD(targetSowingDate);
    const finalPlan = new Map<string, { trays: number; reasons: string[] }>();
    
    sowingTasks
        .filter(task => toYYYYMMDD(task.sowDate) === targetDateStr)
        .forEach(task => {
            const existing = finalPlan.get(task.variety) || { trays: 0, reasons: [] };
            existing.trays += task.trays;
            existing.reasons.push(task.reason);
            finalPlan.set(task.variety, existing);
        });

    return Array.from(finalPlan.entries()).map(([variety, data]) => ({
        variety,
        trays: data.trays,
        reason: data.reasons.join('; '),
    })).sort((a, b) => a.variety.localeCompare(b.variety));
};
