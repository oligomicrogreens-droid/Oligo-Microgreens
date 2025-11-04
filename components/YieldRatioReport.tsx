import React, { useState, useMemo } from 'react';
import type { Order, HarvestLogEntry, YieldRatioData } from '../types';
import { calculateYieldRatios } from '../utils/reports';
import { ScaleIcon } from './icons';

interface YieldRatioReportProps {
    orders: Order[];
    harvestingLog: Record<string, HarvestLogEntry>;
}

// Helper to format date to YYYY-MM-DD for input fields
const toInputDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const YieldRatioReport: React.FC<YieldRatioReportProps> = ({ orders, harvestingLog }) => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const [startDate, setStartDate] = useState(toInputDateString(thirtyDaysAgo));
    const [endDate, setEndDate] = useState(toInputDateString(today));
    const [reportData, setReportData] = useState<YieldRatioData[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateReport = () => {
        setIsLoading(true);
        // Add a small delay to show loading state, improving UX
        setTimeout(() => {
            const data = calculateYieldRatios(
                orders,
                harvestingLog,
                new Date(startDate),
                new Date(endDate)
            );
            setReportData(data);
            setIsLoading(false);
        }, 500);
    };

    const hasDataToProcess = useMemo(() => {
        return orders.length > 0 && Object.keys(harvestingLog).length > 0;
    }, [orders, harvestingLog]);
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <ScaleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Yield Ratio Analysis</h2>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm"
                    />
                    <span className="text-center text-gray-500 dark:text-gray-400 font-semibold">to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm"
                    />
                    <button
                        onClick={handleGenerateReport}
                        disabled={isLoading || !hasDataToProcess}
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900 transition-colors duration-300"
                    >
                        {isLoading ? 'Generating...' : 'Generate Report'}
                    </button>
                </div>
            </div>

            {!hasDataToProcess ? (
                 <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    <h3 className="text-lg font-semibold">Insufficient Data</h3>
                    <p className="mt-1">Both order history and harvesting logs are needed to generate this report.</p>
                </div>
            ) : reportData === null ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    <h3 className="text-lg font-semibold">Ready to Analyze</h3>
                    <p className="mt-1">Select a date range and click "Generate Report" to see your yield ratios.</p>
                </div>
            ) : reportData.length === 0 ? (
                 <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    <h3 className="text-lg font-semibold">No Data Found</h3>
                    <p className="mt-1">No harvesting or order data found for the selected period.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                            <tr>
                                <th scope="col" className="px-6 py-3 rounded-l-lg">Variety</th>
                                <th scope="col" className="px-6 py-3 text-center">Trays Sown</th>
                                <th scope="col" className="px-6 py-3 text-center">Boxes Harvested</th>
                                <th scope="col" className="px-6 py-3 text-center rounded-r-lg">Yield Ratio (Boxes/Tray)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map(item => (
                                <tr key={item.variety} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.variety}</td>
                                    <td className="px-6 py-4 text-center font-mono">{item.traysSown}</td>
                                    <td className="px-6 py-4 text-center font-mono">{item.boxesHarvested}</td>
                                    <td className="px-6 py-4 text-center font-bold text-green-600 dark:text-green-400">
                                        {item.yieldRatio !== null ? item.yieldRatio.toFixed(2) : 'N/A'}
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

export default YieldRatioReport;
