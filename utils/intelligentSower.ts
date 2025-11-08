
import type { Order, MicrogreenVariety, HarvestLogEntry, SeedInventory, MicrogreenVarietyName } from '../types';
import { getDemandForecast } from './forecast';
import { calculateYieldRatios } from './reports';

export interface IntelligentSowingPlanItem {
    variety: MicrogreenVarietyName;
    traysToSow: number;
    reason: string;
    seedStatus: 'OK' | 'Low Stock' | 'Insufficient';
    gramsNeeded: number;
}

export interface SeedPurchaseItem {
    variety: MicrogreenVarietyName;
    gramsToBuy: number;
    reason: string;
}

export interface IntelligentSowingPlan {
    plan: IntelligentSowingPlanItem[];
    purchaseList: SeedPurchaseItem[];
}

const DEFAULT_YIELD_RATIO = 5; // boxes/tray

const toYYYYMMDD = (d: Date): string => {
    const date = new Date(d);
    // Adjust for timezone to get the correct YYYY-MM-DD in the local timezone
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().split('T')[0];
};

export const generateIntelligentSowingPlan = async ({
    orders,
    microgreenVarieties,
    harvestingLog,
    seedInventory,
}: {
    orders: Order[];
    microgreenVarieties: MicrogreenVariety[];
    harvestingLog: Record<string, HarvestLogEntry>;
    seedInventory: SeedInventory;
}): Promise<IntelligentSowingPlan> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const varietyMap = new Map(microgreenVarieties.map(v => [v.name, v]));

    const historicalStartDate = new Date(today);
    historicalStartDate.setDate(today.getDate() - 90);
    const yieldRatiosData = calculateYieldRatios(orders, harvestingLog, historicalStartDate, today);
    const yieldRatioMap = new Map(yieldRatiosData
        .filter(d => d.yieldRatio !== null && d.yieldRatio > 0)
        .map(d => [d.variety, d.yieldRatio as number])
    );

    // AI Forecast Demand
    const forecastData = await getDemandForecast(orders);
    const forecastDemand = new Map<string, { quantity: number, reasons: string[] }>();
    if (forecastData) {
        forecastData.forEach((week, weekIndex) => {
            const weekStartDate = new Date(today);
            weekStartDate.setDate(today.getDate() + weekIndex * 7);
            week.predictions.forEach(p => {
                // For simplicity, we'll aim to have this ready by the start of the week.
                const demandDateStr = toYYYYMMDD(weekStartDate);
                const existing = forecastDemand.get(`${demandDateStr}::${p.variety}`) || { quantity: 0, reasons: [] };
                existing.quantity += p.quantity;
                existing.reasons.push(`AI forecast for Week ${weekIndex + 1}`);
                forecastDemand.set(`${demandDateStr}::${p.variety}`, existing);
            });
        });
    }

    // Pending Orders Demand
    const pendingOrderDemand = new Map<string, { quantity: number, reasons: string[] }>();
    orders.filter(o => o.status === 'Pending' && o.deliveryDate && new Date(o.deliveryDate) >= today).forEach(order => {
        const deliveryDateStr = toYYYYMMDD(order.deliveryDate!);
        order.items.forEach(item => {
            const key = `${deliveryDateStr}::${item.variety}`;
            const existing = pendingOrderDemand.get(key) || { quantity: 0, reasons: [] };
            existing.quantity += item.quantity;
            existing.reasons.push(`Order ${order.id}`);
            pendingOrderDemand.set(key, existing);
        });
    });

    // Projected Harvests (Supply)
    const projectedHarvests = new Map<string, Map<MicrogreenVarietyName, number>>();
    Object.values(harvestingLog).forEach(logEntry => {
        const sowingDate = new Date(logEntry.date + 'T00:00:00');
        for (const [varietyName, traysSown] of Object.entries(logEntry.trays)) {
            const variety = varietyMap.get(varietyName);
            if (variety && Number(traysSown) > 0) {
                const harvestDate = new Date(sowingDate);
                harvestDate.setDate(sowingDate.getDate() + variety.growthCycleDays);
                if (harvestDate >= today) {
                    const harvestDateStr = toYYYYMMDD(harvestDate);
                    const yieldRatio = yieldRatioMap.get(varietyName) || DEFAULT_YIELD_RATIO;
                    const boxes = Number(traysSown) * yieldRatio;
                    
                    const dateMap = projectedHarvests.get(harvestDateStr) || new Map();
                    dateMap.set(varietyName, (dateMap.get(varietyName) || 0) + boxes);
                    projectedHarvests.set(harvestDateStr, dateMap);
                }
            }
        }
    });

    // Net demand calculation (Demand - Supply)
    const netDemand = new Map<string, Map<MicrogreenVarietyName, { quantity: number, reasons: string[] }>>();
    
    const allDemand = new Map<string, { quantity: number, reasons: string[] }>();
    [forecastDemand, pendingOrderDemand].forEach(demandMap => {
        demandMap.forEach((value, key) => {
            const existing = allDemand.get(key) || { quantity: 0, reasons: [] };
            existing.quantity += value.quantity;
            existing.reasons.push(...value.reasons);
            allDemand.set(key, existing);
        });
    });

    allDemand.forEach((value, key) => {
        const [dateStr, variety] = key.split('::');
        const harvested = projectedHarvests.get(dateStr)?.get(variety) || 0;
        const needed = value.quantity - harvested;

        if (needed > 0) {
            const dateMap = netDemand.get(dateStr) || new Map();
            dateMap.set(variety, { quantity: needed, reasons: value.reasons });
            netDemand.set(dateStr, dateMap);
        }
    });

    // Safety Stock Demand - check future inventory levels
    const projectedInventory = new Map<string, Map<MicrogreenVarietyName, number>>();
    // We don't have a concept of current inventory of harvested goods, so we start from 0
    for (let i = 0; i < 30; i++) { // Look 30 days ahead
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = toYYYYMMDD(date);
        
        const prevDate = new Date(date);
        prevDate.setDate(date.getDate() - 1);
        const prevDateStr = toYYYYMMDD(prevDate);
        
        const inventoryToday = new Map(projectedInventory.get(prevDateStr));
        
        // Add harvests for today
        projectedHarvests.get(dateStr)?.forEach((boxes, variety) => {
            inventoryToday.set(variety, (inventoryToday.get(variety) || 0) + boxes);
        });

        // Subtract demand for today
        netDemand.get(dateStr)?.forEach((demand, variety) => {
            inventoryToday.set(variety, (inventoryToday.get(variety) || 0) - demand.quantity);
        });
        
        projectedInventory.set(dateStr, inventoryToday);

        // Check if we drop below safety stock
        microgreenVarieties.forEach(v => {
            const safetyStock = seedInventory[v.name]?.safetyStockBoxes || 0;
            if (safetyStock > 0) {
                const currentInv = inventoryToday.get(v.name) || 0;
                if (currentInv < safetyStock) {
                    const deficit = safetyStock - currentInv;
                    const dateMap = netDemand.get(dateStr) || new Map();
                    const existingDemand = dateMap.get(v.name) || { quantity: 0, reasons: [] };
                    existingDemand.quantity += deficit;
                    if (!existingDemand.reasons.includes('Safety Stock')) {
                        existingDemand.reasons.push('Safety Stock');
                    }
                    dateMap.set(v.name, existingDemand);
                    netDemand.set(dateStr, dateMap);
                }
            }
        });
    }


    // Convert net demand into today's sowing tasks
    const todaysSowingTasks = new Map<MicrogreenVarietyName, { trays: number, reasons: Set<string> }>();
    netDemand.forEach((varietyMapForDate, dateStr) => {
        varietyMapForDate.forEach((demand, varietyName) => {
            const variety = varietyMap.get(varietyName);
            if (variety) {
                const requiredSowDate = new Date(dateStr + 'T00:00:00');
                requiredSowDate.setDate(requiredSowDate.getDate() - variety.growthCycleDays);
                
                if (toYYYYMMDD(requiredSowDate) === toYYYYMMDD(today)) {
                    const yieldRatio = yieldRatioMap.get(varietyName) || DEFAULT_YIELD_RATIO;
                    const traysNeeded = Math.ceil(demand.quantity / yieldRatio);
                    
                    const task = todaysSowingTasks.get(varietyName) || { trays: 0, reasons: new Set() };
                    task.trays += traysNeeded;
                    demand.reasons.forEach(r => task.reasons.add(r));
                    todaysSowingTasks.set(varietyName, task);
                }
            }
        });
    });

    // Finalize plan with seed inventory check
    const plan: IntelligentSowingPlanItem[] = [];
    const purchaseList: SeedPurchaseItem[] = [];
    const purchaseListSet = new Set<MicrogreenVarietyName>();

    todaysSowingTasks.forEach((task, variety) => {
        const inventory = seedInventory[variety];
        if (!inventory) return;

        const gramsNeeded = task.trays * inventory.gramsPerTray;
        let seedStatus: 'OK' | 'Low Stock' | 'Insufficient' = 'OK';

        if (gramsNeeded > inventory.stockOnHand) {
            seedStatus = 'Insufficient';
        } else if (inventory.stockOnHand - gramsNeeded <= inventory.reorderLevel) {
            seedStatus = 'Low Stock';
        }
        
        plan.push({
            variety,
            traysToSow: task.trays,
            reason: Array.from(task.reasons).slice(0, 2).join('; '),
            seedStatus,
            gramsNeeded,
        });

        if (inventory.stockOnHand < inventory.reorderLevel + gramsNeeded && !purchaseListSet.has(variety)) {
             purchaseList.push({
                variety,
                gramsToBuy: Math.max(gramsNeeded, inventory.reorderLevel) * 1.2 - inventory.stockOnHand, // Buy a bit extra
                reason: `Stock will be low after sowing.`,
            });
            purchaseListSet.add(variety);
        }
    });
    
    // Also add items to purchase list that are low on stock but not in today's plan
    Object.entries(seedInventory).forEach(([variety, item]) => {
        if (item.stockOnHand <= item.reorderLevel && !purchaseListSet.has(variety)) {
            purchaseList.push({
                variety,
                gramsToBuy: item.reorderLevel * 1.5 - item.stockOnHand, // Replenish to 150% of reorder level
                reason: `Stock is below reorder level.`,
            });
            purchaseListSet.add(variety);
        }
    });

    return { 
        plan: plan.sort((a,b) => a.variety.localeCompare(b.variety)), 
        purchaseList: purchaseList.sort((a,b) => a.variety.localeCompare(b.variety)) 
    };
};
