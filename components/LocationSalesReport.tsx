import React, { useState, useMemo } from 'react';
import type { Order, MicrogreenVarietyName } from '../types';
import { OrderStatus, UserRole } from '../types';
import { useUser } from '../contexts/UserContext';
import { canSeeFinancials } from '../permissions';
import { downloadCSV } from '../utils/csv';
import { ArrowDownTrayIcon, ChevronDownIcon, MapPinIcon } from './icons';

interface LocationSalesReportProps {
  orders: Order[];
}

interface LocationData {
    location: string;
    totalOrders: number;
    totalBoxes: number;
    totalCash: number;
    topVarieties: { variety: MicrogreenVarietyName; boxes: number }[];
}

const LocationSalesReport: React.FC<LocationSalesReportProps> = ({ orders }) => {
    const { currentUser } = useUser();
    const showFinancials = useMemo(() => canSeeFinancials(currentUser?.role || UserRole.Logistics), [currentUser]);
    const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());

    const reportData = useMemo<LocationData[]>(() => {
        const completedOrders = orders.filter(o => o.status === OrderStatus.Completed);
        
        const dataByLocation: Record<string, {
            totalOrders: number;
            totalBoxes: number;
            totalCash: number;
            varietySales: Record<MicrogreenVarietyName, number>;
        }> = {};

        completedOrders.forEach(order => {
            const location = order.location?.trim() || 'Unspecified Location';
            
            if (!dataByLocation[location]) {
                dataByLocation[location] = {
                    totalOrders: 0,
                    totalBoxes: 0,
                    totalCash: 0,
                    varietySales: {},
                };
            }

            const locationEntry = dataByLocation[location];
            locationEntry.totalOrders += 1;
            locationEntry.totalCash += order.cashReceived || 0;

            const items = order.actualHarvest || order.items;
            items.forEach(item => {
                locationEntry.totalBoxes += item.quantity;
                locationEntry.varietySales[item.variety] = (locationEntry.varietySales[item.variety] || 0) + item.quantity;
            });
        });

        return Object.entries(dataByLocation).map(([location, data]) => {
            const topVarieties = Object.entries(data.varietySales)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([variety, boxes]) => ({ variety, boxes }));
            
            return {
                location,
                ...data,
                topVarieties,
            };
        }).sort((a, b) => {
            if (a.location === 'Unspecified Location') return 1;
            if (b.location === 'Unspecified Location') return -1;
            return b.totalBoxes - a.totalBoxes;
        });

    }, [orders]);

    const toggleLocation = (location: string) => {
        setExpandedLocations(prev => {
            const newSet = new Set(prev);
            if (newSet.has(location)) {
                newSet.delete(location);
            } else {
                newSet.add(location);
            }
            return newSet;
        });
    };
    
    const handleExport = () => {
        if (reportData.length === 0) {
            alert("No data to export.");
            return;
        }
        
        const dataToExport = reportData.map(d => ({
            location: d.location,
            total_orders: d.totalOrders,
            total_boxes_sold: d.totalBoxes,
            ...(showFinancials && { total_cash_received: d.totalCash.toFixed(2) }),
            top_variety_1: d.topVarieties[0]?.variety || '',
            top_variety_1_boxes: d.topVarieties[0]?.boxes || '',
            top_variety_2: d.topVarieties[1]?.variety || '',
            top_variety_2_boxes: d.topVarieties[1]?.boxes || '',
            top_variety_3: d.topVarieties[2]?.variety || '',
            top_variety_3_boxes: d.topVarieties[2]?.boxes || '',
        }));

        downloadCSV(dataToExport, `sales_by_location_${new Date().toISOString().split('T')[0]}.csv`);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
             <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <MapPinIcon className="w-6 h-6 text-green-500" />
                    Sales by Location
                </h3>
                <button
                    onClick={handleExport}
                    disabled={reportData.length === 0}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600"
                >
                    <ArrowDownTrayIcon className="w-5 h-5"/>
                    Export CSV
                </button>
            </div>
            {reportData.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-10">No completed orders with location data found.</p>
            ) : (
                <div className="space-y-2">
                    {reportData.map(data => {
                        const isExpanded = expandedLocations.has(data.location);
                        return (
                            <div key={data.location} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <button 
                                    onClick={() => toggleLocation(data.location)}
                                    className="w-full p-4 text-left grid grid-cols-3 sm:grid-cols-5 items-center gap-4"
                                    aria-expanded={isExpanded}
                                >
                                    <div className="col-span-2 sm:col-span-2 font-bold text-slate-800 dark:text-white truncate">{data.location}</div>
                                    <div className="text-sm text-center text-slate-600 dark:text-slate-300">
                                        <span className="font-mono font-semibold">{data.totalOrders}</span> Orders
                                    </div>
                                    <div className="text-sm text-center text-slate-600 dark:text-slate-300">
                                        <span className="font-mono font-semibold">{data.totalBoxes}</span> Boxes
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        {showFinancials && (
                                            <div className="text-sm text-center text-green-600 dark:text-green-400 font-semibold">
                                                ₹{data.totalCash.toFixed(2)}
                                            </div>
                                        )}
                                        <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                {isExpanded && (
                                    <div className="px-4 pb-4">
                                        <div className="p-3 bg-white dark:bg-slate-800 rounded-md">
                                            <h5 className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Top Varieties:</h5>
                                            {data.topVarieties.length > 0 ? (
                                                <ul className="space-y-1 text-sm">
                                                    {data.topVarieties.map(v => (
                                                        <li key={v.variety} className="flex justify-between">
                                                            <span>{v.variety}</span>
                                                            <span className="font-mono font-semibold">{v.boxes} boxes</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-slate-500 dark:text-slate-400">No variety data for this location.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default LocationSalesReport;
