
import React, { useState, useMemo, useCallback } from 'react';
import type { PurchaseOrder, MicrogreenVarietyName } from '../types';
import { PurchaseOrderStatus } from '../types';
import { PlusIcon, AdjustmentsHorizontalIcon, ArrowsUpDownIcon, TrashIcon, PencilIcon, MagnifyingGlassIcon, PaperAirplaneIcon, ArrowDownTrayIcon, CheckCircleIcon } from './icons';
import PurchaseOrderStatusBadge from './PurchaseOrderStatusBadge';

interface PurchaseOrdersDashboardProps {
  purchaseOrders: PurchaseOrder[];
  onAddClick: () => void;
  onEditClick: (po: PurchaseOrder) => void;
  onDelete: (poId: string) => void;
  onMarkAsOrdered: (poId: string) => void;
  onMarkAsReceived: (poId: string) => void;
  onCancel: (poId: string) => void;
}

const POCard: React.FC<{ 
  po: PurchaseOrder;
  onEdit: (po: PurchaseOrder) => void;
  onDelete: (po: PurchaseOrder) => void;
  onMarkOrdered: (po: PurchaseOrder) => void;
  onMarkReceived: (po: PurchaseOrder) => void;
  onCancel: (po: PurchaseOrder) => void;
}> = ({ po, onEdit, onDelete, onMarkOrdered, onMarkReceived, onCancel }) => {
  const isActionable = po.status === PurchaseOrderStatus.Draft || po.status === PurchaseOrderStatus.Ordered;
  const totalQuantity = useMemo(() => po.items.reduce((sum, item) => sum + item.quantity, 0), [po.items]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex flex-col border border-slate-200 dark:border-slate-700">
        <div className="p-5 flex-grow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">{po.id}</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">{po.supplierName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Created: {po.createdAt.toLocaleDateString()}
                    </p>
                    {po.orderedAt && <p className="text-xs text-slate-500 dark:text-slate-400">Ordered: {po.orderedAt.toLocaleDateString()}</p>}
                    {po.receivedAt && <p className="text-xs text-slate-500 dark:text-slate-400">Received: {po.receivedAt.toLocaleDateString()}</p>}
                </div>
                <PurchaseOrderStatusBadge status={po.status} />
            </div>

            <div className="mt-4">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Items ({totalQuantity.toLocaleString()} g total):</h4>
                <ul className="space-y-2 max-h-32 overflow-y-auto">
                    {po.items.map((item, index) => (
                    <li key={index} className="flex justify-between items-center text-slate-700 dark:text-slate-300 text-sm">
                        <span>{item.variety}</span>
                        <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">{item.quantity} g</span>
                    </li>
                    ))}
                </ul>
            </div>

            {po.notes && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic">Notes: {po.notes}</p>
                </div>
            )}
        </div>
        
        {isActionable && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 mt-auto flex flex-wrap gap-2 justify-end">
                {po.status === PurchaseOrderStatus.Draft && (
                    <>
                        <button onClick={() => onMarkOrdered(po)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                            <PaperAirplaneIcon className="w-4 h-4" /> Mark as Ordered
                        </button>
                        <button onClick={() => onEdit(po)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg">
                            <PencilIcon className="w-4 h-4" /> Edit
                        </button>
                        <button onClick={() => onDelete(po)} className="p-1.5 text-slate-500 hover:text-red-600" title="Delete Draft">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </>
                )}
                {po.status === PurchaseOrderStatus.Ordered && (
                    <>
                         <button onClick={() => onMarkReceived(po)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg">
                            <ArrowDownTrayIcon className="w-4 h-4" /> Mark as Received
                        </button>
                         <button onClick={() => onCancel(po)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg">
                            Cancel PO
                        </button>
                    </>
                )}
            </div>
        )}
    </div>
  );
};

const PurchaseOrdersDashboard: React.FC<PurchaseOrdersDashboardProps> = (props) => {
    const { purchaseOrders, onAddClick, onEditClick, onDelete, onMarkAsOrdered, onMarkAsReceived, onCancel } = props;

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<PurchaseOrderStatus | 'All'>('All');
    type SortOption = 'date-desc' | 'date-asc' | 'supplier-asc' | 'supplier-desc';
    const [sortOption, setSortOption] = useState<SortOption>('date-desc');

    const displayedPOs = useMemo(() => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();

        const filtered = purchaseOrders.filter(po => {
            const matchesSearch = lowerCaseSearchTerm === '' ? true : (
                po.supplierName.toLowerCase().includes(lowerCaseSearchTerm) ||
                po.id.toLowerCase().includes(lowerCaseSearchTerm) ||
                po.items.some(item => item.variety.toLowerCase().includes(lowerCaseSearchTerm))
            );
            const matchesStatus = filterStatus === 'All' || po.status === filterStatus;
            return matchesSearch && matchesStatus;
        });

        return [...filtered].sort((a, b) => {
            switch (sortOption) {
                case 'date-asc': return a.createdAt.getTime() - b.createdAt.getTime();
                case 'supplier-asc': return a.supplierName.localeCompare(b.supplierName);
                case 'supplier-desc': return b.supplierName.localeCompare(a.supplierName);
                case 'date-desc': default: return b.createdAt.getTime() - a.createdAt.getTime();
            }
        });
    }, [purchaseOrders, filterStatus, sortOption, searchTerm]);

    const handleDelete = (po: PurchaseOrder) => {
        if (window.confirm(`Are you sure you want to delete Purchase Order ${po.id}?`)) {
            onDelete(po.id);
        }
    };
    const handleCancel = (po: PurchaseOrder) => {
        if (window.confirm(`Are you sure you want to cancel Purchase Order ${po.id}? This cannot be undone.`)) {
            onCancel(po.id);
        }
    };
    const handleReceive = (po: PurchaseOrder) => {
        if (window.confirm(`This will mark PO ${po.id} as received and add all items to your seed inventory. Proceed?`)) {
            onMarkAsReceived(po.id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Purchase Orders</h2>
                <button
                    onClick={onAddClick}
                    className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    New Purchase Order
                </button>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex flex-col lg:flex-row items-start lg:items-center gap-4">
                <div className="relative w-full lg:w-auto lg:flex-grow">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full rounded-lg border-0 py-2 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 dark:bg-slate-700 dark:text-white dark:ring-slate-600 focus:ring-2 focus:ring-green-500"
                        placeholder="Search by supplier, PO ID, or variety..."
                    />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                        <AdjustmentsHorizontalIcon className="w-5 h-5 text-slate-500" />
                         <div className="flex flex-wrap items-center gap-2">
                            {(['All', ...Object.values(PurchaseOrderStatus)] as const).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-3 py-1 text-sm font-medium rounded-full ${filterStatus === status ? 'bg-green-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ArrowsUpDownIcon className="w-5 h-5 text-slate-500" />
                        <select 
                          value={sortOption}
                          onChange={e => setSortOption(e.target.value as SortOption)}
                          className="block w-full sm:w-auto pl-3 pr-8 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                        >
                            <option value="date-desc">Newest First</option>
                            <option value="date-asc">Oldest First</option>
                            <option value="supplier-asc">Supplier (A-Z)</option>
                            <option value="supplier-desc">Supplier (Z-A)</option>
                        </select>
                    </div>
                </div>
            </div>

            {displayedPOs.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-400 py-16 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold">No Purchase Orders Found</h3>
                    <p className="mt-1">Try adjusting your filters or create a new purchase order.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayedPOs.map(po => (
                        <POCard 
                            key={po.id} 
                            po={po}
                            onEdit={onEditClick}
                            onDelete={handleDelete}
                            onMarkOrdered={(p) => onMarkAsOrdered(p.id)}
                            onMarkReceived={handleReceive}
                            onCancel={handleCancel}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PurchaseOrdersDashboard;
