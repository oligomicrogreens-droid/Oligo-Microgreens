

import React, { useState, useMemo } from 'react';
import type { Order, ForecastData } from '../types';
import { getDemandForecast } from '../utils/forecast';
import { ChartPieIcon } from './icons';

interface DemandForecastProps {
    orders: Order[];
}

// Consistent color palette for varieties
const a11yColors = [
  '#00429d', '#3e67ae', '#618dbe', '#85b4cf', '#abdbdf',
  '#ffd39b', '#f4a678', '#e97a5a', '#d94c41', '#c5192d',
  '#005f58', '#4b8077', '#7fa199', '#b5c3bc', '#ffffff',
  '#ffb576', '#f98643', '#e75300', '#c81b00', '#9e0000',
];

const getVarietyColor = (variety: string, colorMap: Map<string, string>): string => {
    if (!colorMap.has(variety)) {
        const colorIndex = colorMap.size % a11yColors.length;
        colorMap.set(variety, a11yColors[colorIndex]);
    }
    return colorMap.get(variety)!;
};


const DemandForecast: React.FC<DemandForecastProps> = ({ orders }) => {
    const [forecastData, setForecastData] = useState<ForecastData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateForecast = async () => {
        setIsLoading(true);
        setError(null);
        setForecastData(null);
        try {
            const data = await getDemandForecast(orders);
            setForecastData(data);
        } catch (e) {
            if (e instanceof Error) {
                setError(e.message || 'An unexpected error occurred.');
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const chartData = useMemo(() => {
        if (!forecastData) return null;

        const varietyColorMap = new Map<string, string>();
        const allVarieties = Array.from(new Set(forecastData.flatMap(week => week.predictions.map(p => p.variety)))).sort();
        // FIX: Explicitly type `v` as string to resolve type inference issue.
        allVarieties.forEach((v: string) => getVarietyColor(v, varietyColorMap));
        
        const maxWeeklyTotal = Math.max(
            10, // Minimum height for the y-axis
            ...forecastData.map(week => week.predictions.reduce((sum, p) => sum + p.quantity, 0))
        );

        return { varietyColorMap, allVarieties, maxWeeklyTotal };
    }, [forecastData]);


    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                    <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Generating Forecast...</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing historical data with Gemini AI. This may take a moment.</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center py-10 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-lg font-semibold text-red-700 dark:text-red-400">Error Generating Forecast</p>
                    <p className="text-sm text-red-600 dark:text-red-500 mt-1">{error}</p>
                    <button onClick={handleGenerateForecast} className="mt-4 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700">
                        Try Again
                    </button>
                </div>
            );
        }

        if (forecastData && chartData) {
            if (forecastData.length === 0) {
                 return (
                    <div className="text-center py-10">
                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">No Forecast Data Generated</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">The model could not generate a forecast from the available data.</p>
                    </div>
                );
            }
            return (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">4-Week Demand Forecast</h3>
                         <button onClick={handleGenerateForecast} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 text-sm">
                            Regenerate
                        </button>
                    </div>
                    
                    {/* Chart Area */}
                    <div className="flex items-end h-72 border-b-2 border-l-2 border-gray-300 dark:border-gray-600 space-x-4 p-4">
                        {forecastData.map(weeklyData => (
                            <div key={weeklyData.week} className="flex-1 flex flex-col-reverse h-full group relative">
                                {weeklyData.predictions.map(p => (
                                    <div
                                        key={p.variety}
                                        className="transition-all duration-300 group-hover:opacity-75"
                                        style={{
                                            height: `${(p.quantity / chartData.maxWeeklyTotal) * 100}%`,
                                            backgroundColor: chartData.varietyColorMap.get(p.variety)
                                        }}
                                    >
                                        <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 px-2 py-1 text-xs text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                            {p.variety}: {p.quantity} boxes
                                        </span>
                                    </div>
                                ))}
                                <div className="absolute -bottom-6 text-center w-full text-sm font-medium text-gray-600 dark:text-gray-400">{weeklyData.week}</div>
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-2">
                        {chartData.allVarieties.map(variety => (
                            <div key={variety} className="flex items-center text-xs">
                                <span className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: chartData.varietyColorMap.get(variety) }}></span>
                                <span className="text-gray-700 dark:text-gray-300">{variety}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
             <div className="text-center py-10">
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Ready to look into the future?</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4 max-w-md mx-auto">Generate a 4-week demand forecast using AI based on your completed order history.</p>
                <button
                    onClick={handleGenerateForecast}
                    disabled={isLoading}
                    className="flex items-center justify-center mx-auto px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900 transition-colors duration-300"
                >
                    <ChartPieIcon className="w-5 h-5 mr-2" />
                    Generate Demand Forecast
                </button>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-8">
            {renderContent()}
        </div>
    );
};

export default DemandForecast;