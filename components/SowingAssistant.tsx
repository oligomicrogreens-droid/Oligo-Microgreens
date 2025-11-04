import React, { useState, useMemo } from 'react';
import type { Order, MicrogreenVariety, HarvestLogEntry, ForecastData, MicrogreenVarietyName } from '../types';
import { getDemandForecast } from '../utils/forecast';
import { calculateYieldRatios } from '../utils/reports';
import { LightBulbIcon, PlusIcon } from './icons';

interface SowingAssistantProps {
    orders: Order[];
    microgreenVarieties: MicrogreenVariety[];
    harvestingLog: Record<string, HarvestLogEntry>;
    onApplyAdvice: (variety: MicrogreenVarietyName, trays: number) => void;
    targetSowingDate: Date;
}

interface Recommendation {
    variety: MicrogreenVarietyName;
    traysToSow: number;
    reason: string;
}

const DEFAULT_YIELD_RATIO = 5; // boxes/tray

const SowingAssistant: React.FC<SowingAssistantProps> = ({ orders, microgreenVarieties, harvestingLog, onApplyAdvice, targetSowingDate }) => {
    const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const varietyMap = useMemo(() => new Map(microgreenVarieties.map(v => [v.name, v])), [microgreenVarieties]);

    const handleGenerateAdvice = async () => {
        setIsLoading(true);
        setError(null);
        setRecommendations(null);

        try {
            // 1. Get AI-powered demand forecast for the next 4 weeks
            const forecastData = await getDemandForecast(orders);
            if (!forecastData || forecastData.length === 0) {
                setRecommendations([]); // No forecast, so no recommendations
                setIsLoading(false);
                return;
            }

            // 2. Get historical yield ratios for accurate tray calculation
            const historicalStartDate = new Date(targetSowingDate);
            historicalStartDate.setDate(targetSowingDate.getDate() - 90);
            const yieldRatiosData = calculateYieldRatios(orders, harvestingLog, historicalStartDate, targetSowingDate);
            const yieldRatioMap = new Map(yieldRatiosData
                .filter(d => d.yieldRatio !== null && d.yieldRatio > 0)
                .map(d => [d.variety, d.yieldRatio as number])
            );

            // 3. Calculate projected harvests (in boxes) for the next 4 weeks from existing sowing log
            const projectedHarvestsByWeek: Map<number, Map<MicrogreenVarietyName, number>> = new Map([
                [1, new Map()], [2, new Map()], [3, new Map()], [4, new Map()]
            ]);
            
            const today = new Date(targetSowingDate);
            today.setHours(0, 0, 0, 0);

            Object.values(harvestingLog).forEach((logEntry: HarvestLogEntry) => {
                const sowingDate = new Date(logEntry.date + 'T00:00:00');
                for (const [varietyName, traysSown] of Object.entries(logEntry.trays)) {
                    const variety = varietyMap.get(varietyName);
                    if (variety) {
                        const harvestDate = new Date(sowingDate);
                        harvestDate.setDate(harvestDate.getDate() + variety.growthCycleDays);
                        
                        const timeDiff = harvestDate.getTime() - today.getTime();
                        if (timeDiff >= 0) {
                            const dayDiff = timeDiff / (1000 * 3600 * 24);
                            const weekIndex = Math.floor(dayDiff / 7) + 1;

                            if (weekIndex >= 1 && weekIndex <= 4) {
                                const yieldRatio = yieldRatioMap.get(varietyName) || DEFAULT_YIELD_RATIO;
                                const boxes = (Number(traysSown) || 0) * yieldRatio;
                                const weekMap = projectedHarvestsByWeek.get(weekIndex)!;
                                weekMap.set(varietyName, (weekMap.get(varietyName) || 0) + boxes);
                            }
                        }
                    }
                }
            });

            // 4. Compare forecast to projections to find shortfalls
            const newRecommendations: Recommendation[] = [];
            forecastData.forEach((weekForecast, index) => {
                const weekNum = index + 1;
                const weekProjections = projectedHarvestsByWeek.get(weekNum);
                
                weekForecast.predictions.forEach(prediction => {
                    const projectedQty = weekProjections?.get(prediction.variety) || 0;
                    const shortfall = prediction.quantity - projectedQty;

                    if (shortfall > 0) {
                        const variety = varietyMap.get(prediction.variety);
                        if (variety) {
                            // Can we sow today to meet this demand?
                            const prospectiveHarvestDate = new Date(today);
                            prospectiveHarvestDate.setDate(today.getDate() + variety.growthCycleDays);
                            const harvestDayDiff = (prospectiveHarvestDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
                            const harvestWeek = Math.floor(harvestDayDiff / 7) + 1;

                            if (harvestWeek <= weekNum) { // If sowing today harvests in time for the shortfall
                                const yieldRatio = yieldRatioMap.get(prediction.variety) || DEFAULT_YIELD_RATIO;
                                const traysToSow = Math.ceil(shortfall / yieldRatio);
                                newRecommendations.push({
                                    variety: prediction.variety,
                                    traysToSow,
                                    reason: `To meet a predicted shortfall of ${Math.ceil(shortfall)} boxes in Week ${weekNum}.`
                                });
                            }
                        }
                    }
                });
            });

            // Aggregate recommendations for the same variety
            const aggregatedRecs = new Map<MicrogreenVarietyName, { trays: number; reasons: string[] }>();
            newRecommendations.forEach(rec => {
                const existing = aggregatedRecs.get(rec.variety) || { trays: 0, reasons: [] };
                existing.trays += rec.traysToSow;
                existing.reasons.push(rec.reason);
                aggregatedRecs.set(rec.variety, existing);
            });

            setRecommendations(Array.from(aggregatedRecs.entries()).map(([variety, data]) => ({
                variety,
                traysToSow: data.trays,
                reason: data.reasons[0] // Just show the first reason for simplicity
            })));

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

    const renderContent = () => {
        if (isLoading) {
             return (
                <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-3 font-semibold text-gray-700 dark:text-gray-300">Analyzing Forecasts...</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="text-center py-10 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="font-semibold text-red-700 dark:text-red-400">Error Generating Advice</p>
                    <p className="text-sm text-red-600 dark:text-red-500 mt-1">{error}</p>
                    <button onClick={handleGenerateAdvice} className="mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 text-sm">
                        Try Again
                    </button>
                </div>
            );
        }
        if (recommendations) {
            if (recommendations.length === 0) {
                 return (
                    <div className="text-center py-10">
                        <p className="font-semibold text-gray-700 dark:text-gray-300">No Sowing Advice Today</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your current sowing schedule appears to cover all forecasted demand.</p>
                    </div>
                );
            }
            return (
                 <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {recommendations.map(item => (
                        <li key={item.variety} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-700 dark:text-gray-200">{item.variety}</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">{item.traysToSow} trays</span>
                                    <button
                                        onClick={() => onApplyAdvice(item.variety, item.traysToSow)}
                                        title="Add to log"
                                        className="p-1.5 text-gray-500 hover:text-green-600 dark:hover:text-green-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <PlusIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.reason}</p>
                        </li>
                    ))}
                </ul>
            );
        }

        return (
            <div className="text-center py-10">
                <p className="font-semibold text-gray-700 dark:text-gray-300">Get Proactive Sowing Advice</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4 max-w-sm mx-auto">Use Gemini AI to analyze demand forecasts and suggest what to sow today to prevent future shortfalls.</p>
                <button
                    onClick={handleGenerateAdvice}
                    className="flex items-center justify-center mx-auto px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors duration-300"
                >
                    Generate AI Advice
                </button>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3 mb-4">
                 <LightBulbIcon className="w-7 h-7 text-blue-500" />
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">AI Sowing Assistant</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Proactive recommendations based on demand forecast.</p>
                </div>
            </div>
            {renderContent()}
        </div>
    );
};

export default SowingAssistant;
