
import React, { useState, useMemo } from 'react';
import type { DeliveryExpense, DeliveryMode } from '../types';
import { useUser } from '../contexts/UserContext';
import { canManageDeliveryExpenses } from '../permissions';
import { BanknotesIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon } from './icons';

interface DeliveryExpensesDashboardProps {
    expenses: DeliveryExpense[];
    deliveryModes: DeliveryMode[]; // Already filtered to exclude 'Tiffin'
    onAddExpense: (expense: Omit<DeliveryExpense, 'id'>) => void;
    onDeleteExpense: (id: string) => void;
}

const toInputDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

const DeliveryExpensesDashboard: React.FC<DeliveryExpensesDashboardProps> = ({ expenses, deliveryModes, onAddExpense, onDeleteExpense }) => {
    const { currentUser } = useUser();
    const canManage = useMemo(() => canManageDeliveryExpenses(currentUser!.role), [currentUser]);

    const [date, setDate] = useState(toInputDateString(new Date()));
    const [deliveryPerson, setDeliveryPerson] = useState<DeliveryMode | ''>('');
    const [amount, setAmount] = useState<number | string>('');
    const [remarks, setRemarks] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deliveryPerson || Number(amount) <= 0) {
            alert('Please select a delivery person and enter a valid amount.');
            return;
        }

        onAddExpense({
            date: new Date(date + 'T00:00:00'),
            deliveryPerson,
            amount: Number(amount),
            remarks: remarks.trim() || undefined,
        });

        // Reset form
        setDeliveryPerson('');
        setAmount('');
        setRemarks('');
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this expense entry?')) {
            onDeleteExpense(id);
        }
    };
    
    const filteredExpenses = useMemo(() => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        if (!lowerCaseSearch) return expenses;
        return expenses.filter(entry => 
            entry.deliveryPerson.toLowerCase().includes(lowerCaseSearch) ||
            entry.remarks?.toLowerCase().includes(lowerCaseSearch)
        );
    }, [expenses, searchTerm]);

    const totalExpenses = useMemo(() => {
        return filteredExpenses.reduce((sum, entry) => sum + entry.amount, 0);
    }, [filteredExpenses]);

    return (
        <div className="space-y-8">
             <div className="flex items-center gap-3">
                <BanknotesIcon className="w-8 h-8 text-green-500" />
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Delivery Expenses</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {canManage && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Add New Expense</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="expense-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                                <input id="expense-date" type="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" />
                            </div>
                            <div>
                                <label htmlFor="expense-person" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Person</label>
                                <select id="expense-person" value={deliveryPerson} onChange={e => setDeliveryPerson(e.target.value as DeliveryMode)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                                    <option value="" disabled>Select person...</option>
                                    {deliveryModes.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="expense-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount (₹)</label>
                                <input id="expense-amount" type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="e.g., 150" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" />
                            </div>
                             <div>
                                <label htmlFor="expense-remarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Remarks</label>
                                <input id="expense-remarks" type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional, e.g., Petrol" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" />
                            </div>
                            <button type="submit" className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900">
                                <PlusIcon className="w-5 h-5 mr-2" /> Add Expense
                            </button>
                        </form>
                    </div>
                )}
                
                <div className={canManage ? "lg:col-span-2" : "lg:col-span-3"}>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Expense History</h3>
                             <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <input type="search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search person or remarks..." className="block w-full sm:w-64 rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400 dark:focus:ring-green-500" />
                            </div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto">
                           {filteredExpenses.length > 0 ? (
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300 sticky top-0">
                                        <tr>
                                            <th scope="col" className="px-4 py-3">Date</th>
                                            <th scope="col" className="px-4 py-3">Delivery Person</th>
                                            <th scope="col" className="px-4 py-3 text-right">Amount</th>
                                            <th scope="col" className="px-4 py-3">Remarks</th>
                                            {canManage && <th scope="col" className="px-4 py-3"><span className="sr-only">Delete</span></th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredExpenses.map(entry => (
                                            <tr key={entry.id}>
                                                <td className="px-4 py-3 whitespace-nowrap">{entry.date.toLocaleDateString()}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{entry.deliveryPerson}</td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-gray-800 dark:text-white">₹{entry.amount.toFixed(2)}</td>
                                                <td className="px-4 py-3 italic text-gray-600 dark:text-gray-400">{entry.remarks || '-'}</td>
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
                                     <tfoot className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <td colSpan={2} className="px-4 py-3 font-bold text-right text-gray-800 dark:text-white">Total Shown:</td>
                                            <td className="px-4 py-3 text-right font-mono font-extrabold text-lg text-gray-900 dark:text-white">₹{totalExpenses.toFixed(2)}</td>
                                            <td colSpan={canManage ? 2 : 1}></td>
                                        </tr>
                                    </tfoot>
                                </table>
                           ) : (
                                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                                    <p>No expense entries found.</p>
                                </div>
                           )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DeliveryExpensesDashboard;