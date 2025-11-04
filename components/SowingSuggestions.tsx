import React, { useState } from 'react';
import type { Order, MicrogreenVariety, SeedInventory, MicrogreenVarietyName } from '../types';
import { getSowingSuggestions, SowingSuggestion } from '../utils/suggestions';
import { LeafIcon as SparklesIcon, PlusIcon } from './icons';

interface SowingSuggestionsProps {
    orders: Order[];
    microgreenVarieties: MicrogreenVariety[];
    seedInventory: SeedInventory;
    onApplySuggestion: (variety: MicrogreenVarietyName, trays: number) => void;
}

const SowingSuggestions: React.FC<SowingSuggestionsProps> = ({ orders, microgreenVarieties, seedInventory, onApplySuggestion }) => {
    const [suggestions, setSuggestions] = useState<SowingSuggestion[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setSuggestions(null);
        try {
            const data = await getSowingSuggestions(orders, microgreenVarieties, seedInventory);
            setSuggestions(data);
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

    const handleApply = (suggestionText: string) => {
        // Simple regex to find "X trays of Y"
        const match = suggestionText.match(/sow\s+(\d+)\s+trays\s+of\s+([a-zA-Z\s.-]+)/i);
        if (match) {
            const trays = parseInt(match[1], 10);
            const variety = match[2].trim();
            // Check if it's a valid variety
            if (microgreenVarieties.some(v => v.name === variety)) {
                onApplySuggestion(variety, trays);
            } else {
                alert(`Could not apply suggestion: "${variety}" is not a recognized microgreen variety.`);
            }
        } else {
            alert("Could not automatically apply this suggestion. Please add it manually to the log.");
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="mt-3 font-semibold text-gray-700 dark:text-gray-300">Consulting with AI Advisor...</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="text-center py-10 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="font-semibold text-red-700 dark:text-red-400">Error Generating Suggestions</p>
                    <p className="text-sm text-red-600 dark:text-red-500 mt-1">{error}</p>
                    <button onClick={handleGenerate} className="mt-4 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 text-sm">
                        Try Again
                    </button>
                </div>
            );
        }
        if (suggestions) {
            if (suggestions.length === 0) {
                 return (
                    <div className="text-center py-10">
                        <p className="font-semibold text-gray-700 dark:text-gray-300">No Suggestions Generated</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Not enough historical data to generate reliable suggestions.</p>
                    </div>
                );
            }
            return (
                 <ul className="space-y-4">
                    {suggestions.map((item, index) => (
                        <li key={index} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-white">{item.suggestion}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.reason}</p>
                                </div>
                                <button
                                    onClick={() => handleApply(item.suggestion)}
                                    title="Add to log"
                                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-800 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 rounded-full transition-colors"
                                >
                                    <PlusIcon className="w-4 h-4"/>
                                    Apply
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            );
        }
        return (
            <div className="text-center py-10">
                <p className="font-semibold text-gray-700 dark:text-gray-300">Unlock Growth Insights</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4 max-w-sm mx-auto">Use Gemini AI to analyze sales trends and seed inventory to get strategic advice on what to sow next.</p>
                <button
                    onClick={handleGenerate}
                    className="flex items-center justify-center mx-auto px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-gray-900 transition-colors duration-300"
                >
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    Generate AI Suggestions
                </button>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3 mb-4">
                 <SparklesIcon className="w-7 h-7 text-purple-500" />
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Strategic Sowing Suggestions</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Long-term planning advice from Gemini.</p>
                </div>
            </div>
            {renderContent()}
        </div>
    );
};

export default SowingSuggestions;
