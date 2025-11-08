
import React, { useState, useMemo } from 'react';
// FIX: Removed FunnelData from this import as it's defined locally and not exported from types.ts
import type { Order, PurchaseOrder, SeedInventory, HarvestLogEntry } from '../types';
import { PurchaseOrderStatus, OrderStatus } from '../types';
import { FunnelIcon, ArrowDownTrayIcon } from './icons';
import { calculateYieldRatios } from '../utils/reports';
import { downloadCSV } from '../utils/csv';

interface SeedToSaleReportProps {
    orders: Order[];
    purchaseOrders: PurchaseOrder[];
    seedInventory: SeedInventory;
    harvestingLog: Record<string, HarvestLogEntry>;
}

interface FunnelData {
    variety: string;
    seedPurchased: number;
    potentialTrays: number;
    potentialBoxes: number;
    boxesSold: number;
    conversionRate: number;
}

const toInputDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const SeedToSaleReport: React.FC<SeedToSaleReportProps> = ({ orders, purchaseOrders, seedInventory, harvestingLog }) => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const [startDate, setStartDate] = useState(toInputDateString(thirtyDaysAgo));
    const [endDate, setEndDate] = useState(toInputDateString(today));
    const [reportData, setReportData] = useState<FunnelData[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateReport = () => {
        setIsLoading(true);
        setTimeout(() => {
            const rangeStart = new Date(startDate + 'T00:00:00');
            const rangeEnd = new Date(endDate + 'T23:59:59');

            const receivedPOs = purchaseOrders.filter(po =>
                po.status === PurchaseOrderStatus.Received &&
                po.receivedAt &&
                new Date(po.receivedAt) >= rangeStart &&
                new Date(po.receivedAt) <= rangeEnd
            );

            const seedsPurchased: Record<string, number> = {};
            receivedPOs.forEach(po => {
                po.items.forEach(item => {
                    seedsPurchased[item.variety] = (seedsPurchased[item.variety] || 0) + item.quantity;
                });
            });

            const soldOrders = orders.filter(o =>
                (o.status === OrderStatus.Completed || o.status === OrderStatus.Dispatched || o.status === OrderStatus.Shortfall) &&
                new Date(o.createdAt) >= rangeStart &&
                new Date(o.createdAt) <= rangeEnd
            );

            const boxesSold: Record<string, number> = {};
            soldOrders.forEach(order => {
                (order.actualHarvest || order.items).forEach(item => {
                    boxesSold[item.variety] = (boxesSold[item.variety] || 0) + item.quantity;
                });
            });
            
            const allTimeYields = calculateYieldRatios(orders, harvestingLog, new Date('2000-01-01'), new Date());
            const yieldRatioMap = new Map(allTimeYields.map(y => [y.variety, y.yieldRatio]));

            const allVarieties = new Set([...Object.keys(seedsPurchased), ...Object.keys(boxesSold)]);

            const data = Array.from(allVarieties).map(variety => {
                const purchased = seedsPurchased[variety] || 0;
                const sold = boxesSold[variety] || 0;
                const seedInfo = seedInventory[variety];
                const gramsPerTray = seedInfo?.gramsPerTray || 0;
                const yieldRatio = yieldRatioMap.get(variety) || 5;

                const potentialTrays = gramsPerTray > 0 ? purchased / gramsPerTray : 0;
                const potentialBoxes = potentialTrays * yieldRatio;
                const conversionRate = potentialBoxes > 0 ? (sold / potentialBoxes) * 100 : 0;

                return { variety, seedPurchased: purchased, potentialTrays, potentialBoxes, boxesSold: sold, conversionRate };
            }).sort((a,b) => b.seedPurchased - a.seedPurchased);

            setReportData(data);
            setIsLoading(false);
        }, 500);
    };

    const handleExport = () => {
        if (!reportData || reportData.length === 0) {
            alert("No data to export.");
            return;
        }
        const dataToExport = reportData.map(d => ({
            variety: d.variety,
            seed_purchased_g: d.seedPurchased.toFixed(2),
            potential_trays: d.potentialTrays.toFixed(2),
            potential_boxes: d.potentialBoxes.toFixed(2),
            boxes_sold: d.boxesSold,
            conversion_rate_percent: d.conversionRate.toFixed(2),
        }));
        downloadCSV(dataToExport, `seed_to_sale_report_${startDate}_to_${endDate}.csv`);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FunnelIcon className="w-6 h-6 text-purple-500" />
                    Seed to Sale Funnel
                </h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm" />
                    <span className="text-center text-slate-500 dark:text-slate-400 font-semibold">to</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm" />
                    <button onClick={handleGenerateReport} disabled={isLoading} className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 disabled:bg-slate-400">
                        {isLoading ? 'Generating...' : 'Generate'}
                    </button>
                    <button onClick={handleExport} disabled={!reportData || reportData.length === 0} className="p-2 text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600">
                        <ArrowDownTrayIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            {reportData === null ? (
                <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                    <h3 className="text-lg font-semibold">Ready to Analyze</h3>
                    <p className="mt-1">Select a date range to see your seed to sale conversion rates.</p>
                </div>
            ) : reportData.length === 0 ? (
                <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                    <h3 className="text-lg font-semibold">No Data Found</h3>
                    <p className="mt-1">No purchased seeds or completed sales found for the selected period.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">Variety</th>
                                <th className="px-4 py-3 text-right">Seed Purchased (g)</th>
                                <th className="px-4 py-3 text-right">Potential Trays</th>
                                <th className="px-4 py-3 text-right">Potential Boxes</th>
                                <th className="px-4 py-3 text-right">Boxes Sold</th>
                                <th className="px-4 py-3 rounded-r-lg">Conversion Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map(item => (
                                <tr key={item.variety} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{item.variety}</td>
                                    <td className="px-4 py-3 text-right font-mono">{item.seedPurchased.toFixed(0)}</td>
                                    <td className="px-4 py-3 text-right font-mono">{item.potentialTrays.toFixed(1)}</td>
                                    <td className="px-4 py-3 text-right font-mono">{item.potentialBoxes.toFixed(1)}</td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-800 dark:text-white">{item.boxesSold}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                                                <div 
                                                    className={`h-4 rounded-full ${item.conversionRate > 80 ? 'bg-green-500' : item.conversionRate > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${Math.min(item.conversionRate, 100)}%`}}
                                                ></div>
                                            </div>
                                            <span className="font-semibold w-12 text-right">{item.conversionRate.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SeedToSaleReport;
