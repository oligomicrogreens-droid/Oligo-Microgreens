

import React, { useState } from 'react';
import type { Order, MicrogreenVariety, HarvestLogEntry, SeedInventory, MicrogreenVarietyName } from '../types';
import { generateIntelligentSowingPlan, IntelligentSowingPlan } from '../utils/intelligentSower';
import { LightBulbIcon, CheckCircleIcon, ExclamationTriangleIcon, TrashIcon, ArrowDownTrayIcon, ShoppingCartIcon } from './icons';

interface SowingPlanDashboardProps {
    orders: Order[];
    microgreenVarieties: MicrogreenVariety[];
    harvestingLog: Record<string, HarvestLogEntry>;
    seedInventory: SeedInventory;
    onSaveSowingLog: (date: Date, trays: Record<MicrogreenVarietyName, number | string>) => void;
}

const statusIndicator = (status: 'OK' | 'Low Stock' | 'Insufficient') => {
    switch (status) {
        // FIX: The `CheckCircleIcon` component now correctly receives the `title` prop.
        case 'OK': return <CheckCircleIcon className="w-5 h-5 text-green-500" title="Sufficient seeds available" />;
        case 'Low Stock': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" title="Stock will be at or below reorder level after sowing" />;
        case 'Insufficient': return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" title="Not enough seeds in inventory" />;
    }
};

const SowingPlanDashboard: React.FC<SowingPlanDashboardProps> = (props) => {
    const { onSaveSowingLog } = props;
    const [plan, setPlan] = useState<IntelligentSowingPlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateIntelligentSowingPlan(props);
            setPlan(result);
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
    
    const handleConfirm = () => {
        if (!plan || plan.plan.length === 0) return;
        
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        const existingLog = props.harvestingLog[dateString]?.trays || {};
        
        // FIX: Replaced a loop using Object.entries that caused type inference issues with a cleaner spread operator approach.
        const newTrayCounts: Record<MicrogreenVarietyName, number | string> = { ...existingLog };

        plan.plan.forEach(item => {
            const currentTrays = Number(newTrayCounts[item.variety] || 0);
            newTrayCounts[item.variety] = currentTrays + item.traysToSow;
        });
        
        onSaveSowingLog(today, newTrayCounts);
        alert('Sowing plan has been confirmed and added to today\'s sowing log.');
        setPlan(null); // Clear the plan after confirming
    };

    const renderPlan = () => {
        if (!plan) return null;

        return (
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Sowing Plan for Today</h3>
                        {plan.plan.length > 0 && (
                            <button
                                onClick={handleConfirm}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700"
                            >
                                <CheckCircleIcon className="w-5 h-5" />
                                Confirm & Add to Log
                            </button>
                        )}
                    </div>
                    {plan.plan.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-left text-gray-500 dark:text-gray-400">
                                    <tr>
                                        <th className="py-2">Variety</th>
                                        <th className="py-2 text-center">Trays to Sow</th>
                                        <th className="py-2">Reason</th>
                                        <th className="py-2 text-center">Seed Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plan.plan.map(item => (
                                        <tr key={item.variety} className="border-t border-gray-200 dark:border-gray-700">
                                            <td className="py-3 font-semibold text-gray-800 dark:text-white">{item.variety}</td>
                                            <td className="py-3 text-center font-mono text-lg font-bold">{item.traysToSow}</td>
                                            <td className="py-3 text-xs text-gray-600 dark:text-gray-400 italic">{item.reason}</td>
                                            <td className="py-3 flex justify-center items-center">{statusIndicator(item.seedStatus)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                            <p>No specific sowing required today based on forecast and orders.</p>
                        </div>
                    )}
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                     <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><ShoppingCartIcon className="w-6 h-6"/> Seed Purchase List</h3>
                     {plan.purchaseList.length > 0 ? (
                        <ul className="space-y-3">
                            {plan.purchaseList.map(item => (
                                <li key={item.variety} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-gray-800 dark:text-white">{item.variety}</span>
                                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{Math.ceil(item.gramsToBuy)} g</span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.reason}</p>
                                </li>
                            ))}
                        </ul>
                     ) : (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                            <p>All seed stocks are sufficient.</p>
                        </div>
                     )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 rounded-r-lg">
                <div className="flex items-start gap-4">
                    <LightBulbIcon className="w-10 h-10 text-blue-500 flex-shrink-0" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Intelligent Sowing Pipeline</h2>
                        <p className="mt-1 text-gray-600 dark:text-gray-300">
                            Generate a strategic plan for what to sow today. This tool analyzes AI-powered demand forecasts, pending orders, and safety stock levels to create a proactive sowing schedule, helping you prevent future shortfalls and optimize production.
                        </p>
                    </div>
                </div>
                <div className="mt-4 text-right">
                     <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
                    >
                        {isLoading ? 'Generating Plan...' : 'Generate Today\'s Sowing Plan'}
                    </button>
                </div>
            </div>

            {isLoading && (
                 <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Generating Plan...</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing data with Gemini AI. This may take a moment.</p>
                </div>
            )}

            {error && (
                 <div className="text-center py-10 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-lg font-semibold text-red-700 dark:text-red-400">Error Generating Plan</p>
                    <p className="text-sm text-red-600 dark:text-red-500 mt-1">{error}</p>
                </div>
            )}
            
            {plan && renderPlan()}
        </div>
    );
};

export default SowingPlanDashboard;