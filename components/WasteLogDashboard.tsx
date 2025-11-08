

import React, { useState, useMemo } from 'react';
import type { WasteLogEntry, MicrogreenVarietyName } from '../types';
import { useUser } from '../contexts/UserContext';
import { canManageWasteLog } from '../permissions';
import { ArchiveBoxXMarkIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon } from './icons';

interface WasteLogDashboardProps {
    wasteLog: WasteLogEntry[];
    microgreenVarietyNames: MicrogreenVarietyName[];
    onAddEntry: (entry: Omit<WasteLogEntry, 'id'>) => void;
    onDeleteEntry: (id: string) => void;
}

const commonReasons = ["Pest Damage", "Mold", "Poor Germination", "Overgrowth", "Contamination", "Human Error"];

const toInputDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

const WasteLogDashboard: React.FC<WasteLogDashboardProps> = ({ wasteLog, microgreenVarietyNames, onAddEntry, onDeleteEntry }) => {
    const { currentUser } = useUser();
    const canManage = useMemo(() => canManageWasteLog(currentUser!.role), [currentUser]);

    const [date, setDate] = useState(toInputDateString(new Date()));
    const [variety, setVariety] = useState<MicrogreenVarietyName | ''>('');
    const [traysWasted, setTraysWasted] = useState<number | string>('');
    const [reason, setReason] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!variety || Number(traysWasted) <= 0 || !reason.trim()) {
            alert('Please fill out all fields with valid values.');
            return;
        }

        onAddEntry({
            date: new Date(date + 'T00:00:00'),
            variety,
            traysWasted: Number(traysWasted),
            reason: reason.trim(),
        });

        // Reset form
        setVariety('');
        setTraysWasted('');
        setReason('');
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this waste log entry? This cannot be undone.')) {
            onDeleteEntry(id);
        }
    };
    
    const filteredLog = useMemo(() => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        return wasteLog.filter(entry => 
            entry.variety.toLowerCase().includes(lowerCaseSearch) ||
            entry.reason.toLowerCase().includes(lowerCaseSearch)
        );
    }, [wasteLog, searchTerm]);

    return (
        <div className="space-y-8">
             <div className="flex items-center gap-3">
                <ArchiveBoxXMarkIcon className="w-8 h-8 text-red-500" />
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Waste Log</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {canManage && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Log New Waste</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="waste-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                                <input id="waste-date" type="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" />
                            </div>
                            <div>
                                <label htmlFor="waste-variety" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Variety</label>
                                <select id="waste-variety" value={variety} onChange={e => setVariety(e.target.value as MicrogreenVarietyName)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                                    <option value="" disabled>Select variety...</option>
                                    {microgreenVarietyNames.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="waste-trays" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Trays Wasted</label>
                                <input id="waste-trays" type="number" min="1" value={traysWasted} onChange={e => setTraysWasted(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" />
                            </div>
                            <div>
                                <label htmlFor="waste-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason for Waste</label>
                                <input id="waste-reason" type="text" list="reason-list" value={reason} onChange={e => setReason(e.target.value)} required placeholder="e.g., Mold" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" />
                                <datalist id="reason-list">
                                    {commonReasons.map(r => <option key={r} value={r} />)}
                                </datalist>
                            </div>
                            <button type="submit" className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900">
                                <PlusIcon className="w-5 h-5 mr-2" /> Add to Log
                            </button>
                        </form>
                    </div>
                )}
                
                <div className={canManage ? "lg:col-span-2" : "lg:col-span-3"}>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Waste History</h3>
                        <div className="relative mb-4">
                             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                             <input type="search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by variety or reason..." className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400 dark:focus:ring-green-500" />
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto">
                           {filteredLog.length > 0 ? (
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300 sticky top-0">
                                        <tr>
                                            <th scope="col" className="px-4 py-3">Date</th>
                                            <th scope="col" className="px-4 py-3">Variety</th>
                                            <th scope="col" className="px-4 py-3 text-center">Trays</th>
                                            <th scope="col" className="px-4 py-3">Reason</th>
                                            {canManage && <th scope="col" className="px-4 py-3"><span className="sr-only">Delete</span></th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLog.map(entry => (
                                            <tr key={entry.id} className="border-b dark:border-gray-700">
                                                <td className="px-4 py-3 whitespace-nowrap">{entry.date.toLocaleDateString()}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{entry.variety}</td>
                                                <td className="px-4 py-3 text-center font-mono font-bold text-red-500">{entry.traysWasted}</td>
                                                <td className="px-4 py-3">{entry.reason}</td>
                                                {canManage && (
                                                    <td className="px-4 py-3 text-right">
                                                        <button onClick={() => handleDelete(entry.id)} className="text-gray-400 hover:text-red-500 p-1 rounded-full">
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                           ) : (
                                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                                    <p>No waste entries found.</p>
                                </div>
                           )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WasteLogDashboard;