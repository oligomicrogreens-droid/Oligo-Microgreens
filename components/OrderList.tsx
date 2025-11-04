import React, { useState, useMemo, useCallback } from 'react';
import type { Order, OrderItem, MicrogreenVarietyName } from '../types';
import { OrderStatus } from '../types';
import OrderStatusBadge from './OrderStatusBadge';
import { TruckIcon, CheckCircleIcon, LeafIcon, PackageIcon, PlusIcon, AdjustmentsHorizontalIcon, ArrowsUpDownIcon, TrashIcon, PencilIcon, MagnifyingGlassIcon } from './icons';
import EditOrderModal from './EditOrderModal';

interface OrderListProps {
  orders: Order[];
  onAddOrder: (clientName: string, items: OrderItem[]) => void;
  onUpdateOrder: (orderId: string, updatedData: { clientName: string; items: OrderItem[] }) => void;
  microgreenVarietyNames: MicrogreenVarietyName[];
  onShowHistory: (clientName: string) => void;
  onDeleteOrder: (orderId: string) => void;
  onAddOrderClick: () => void;
}

const OrderCard: React.FC<{ 
  order: Order; 
  onShowHistory: (clientName: string) => void; 
  onDelete: (order: Order) => void; 
  onEdit: (order: Order) => void; 
}> = ({ order, onShowHistory, onDelete, onEdit }) => {
  const isCompleted = order.status === OrderStatus.Completed;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300 flex flex-col">
      <div className="p-5 flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">{order.id}</p>
            <button 
              onClick={() => onShowHistory(order.clientName)}
              className="text-xl font-bold text-gray-800 dark:text-white text-left hover:underline focus:outline-none focus:ring-2 focus:ring-green-500 rounded-sm"
            >
              {order.clientName}
            </button>
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Created: {order.createdAt.toLocaleDateString()}
            </p>
            {order.deliveryDate && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Delivery: {order.deliveryDate.toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <OrderStatusBadge status={order.status} />
             <div className="flex">
                <button
                    onClick={() => onEdit(order)}
                    disabled={isCompleted}
                    className={`p-1 rounded-full transition-colors ${
                        isCompleted 
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                        : 'text-gray-400 hover:text-blue-500'
                    }`}
                    aria-label={isCompleted ? "Cannot edit completed order" : "Edit order"}
                    title={isCompleted ? "Completed orders cannot be edited" : "Edit order"}
                >
                    <PencilIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={() => onDelete(order)}
                    disabled={isCompleted}
                    className={`p-1 rounded-full transition-colors ${
                        isCompleted 
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                        : 'text-gray-400 hover:text-red-500'
                    }`}
                    aria-label={isCompleted ? "Cannot delete completed order" : "Delete order"}
                    title={isCompleted ? "Completed orders cannot be deleted" : "Delete order"}
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
             </div>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Items (50g boxes):</h4>
          <ul className="space-y-2">
            {order.items.map((item, index) => (
              <li key={index} className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                <span className="flex items-center">
                  <LeafIcon className="w-4 h-4 mr-2 text-green-500" />
                  {item.variety}
                </span>
                <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md text-sm">
                  {item.quantity}
                </span>
              </li>
            ))}
          </ul>
        </div>
        
        {order.actualHarvest && (order.status === 'Shortfall' || order.status === 'Dispatched' || order.status === 'Completed') && (
            <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Actual Harvest:</h4>
                <ul className="space-y-2">
                    {order.actualHarvest.map((item, index) => (
                        <li key={index} className={`flex justify-between items-center text-gray-700 dark:text-gray-300 ${
                            (order.items.find(i => i.variety === item.variety)?.quantity || 0) > item.quantity ? 'text-red-500' : ''
                        }`}>
                            <span className="flex items-center">
                                <PackageIcon className="w-4 h-4 mr-2" />
                                {item.variety}
                            </span>
                            <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md text-sm">
                                {item.quantity}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        )}
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 mt-auto space-y-2">
        {order.deliveryMode && (order.status === 'Dispatched' || order.status === 'Completed') && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <TruckIcon className="w-5 h-5 mr-2" />
            <span className="font-medium">Delivery via: {order.deliveryMode}</span>
          </div>
        )}

        {order.status === 'Completed' && (
           <>
            <div className="flex items-center text-green-600 dark:text-green-400">
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Delivery Completed</span>
            </div>
             {order.cashReceived != null && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold w-6 text-center mr-1.5">₹</span>
                    <span>Cash Received: <strong>{order.cashReceived.toFixed(2)}</strong></span>
                </div>
            )}
           </>
        )}
        {order.remarks && (
            <div className="text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                <p className="font-semibold">Remarks:</p>
                <p className="italic">"{order.remarks}"</p>
            </div>
        )}
      </div>
    </div>
  );
};


const OrderList: React.FC<OrderListProps> = ({ orders, onAddOrder, onUpdateOrder, microgreenVarietyNames, onShowHistory, onDeleteOrder, onAddOrderClick }) => {
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'All'>('All');
  type SortOption = 'date-desc' | 'date-asc' | 'client-asc' | 'client-desc';
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');

  const displayedOrders = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();

    const filtered = orders.filter(order => {
      const matchesSearch = lowerCaseSearchTerm === '' ? true : (
        order.clientName.toLowerCase().includes(lowerCaseSearchTerm) ||
        order.id.toLowerCase().includes(lowerCaseSearchTerm)
      );
      
      const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
    
    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'date-asc':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'client-asc':
          return a.clientName.localeCompare(b.clientName);
        case 'client-desc':
          return b.clientName.localeCompare(a.clientName);
        case 'date-desc':
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });
  }, [orders, filterStatus, sortOption, searchTerm]);

  const handleDeleteOrder = useCallback((order: Order) => {
    if (order.status === OrderStatus.Completed) {
        alert("Completed orders cannot be deleted.");
        return;
    }

    if (window.confirm(`Are you sure you want to delete order ${order.id} for ${order.clientName}?`)) {
      onDeleteOrder(order.id);
    }
  }, [onDeleteOrder]);

  const handleEditOrder = useCallback((order: Order) => {
    if (order.status === OrderStatus.Completed) {
        alert("Completed orders cannot be edited.");
        return;
    }
    setEditingOrder(order);
  }, []);

  const handleUpdateOrder = (orderId: string, updatedData: { clientName: string, items: OrderItem[] }) => {
    onUpdateOrder(orderId, updatedData);
    setEditingOrder(null);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
        <div className="flex-grow">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">All Orders</h2>
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mt-3">
                <div className="relative w-full lg:w-auto lg:flex-grow">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="search"
                        name="search-orders"
                        id="search-orders"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400 dark:focus:ring-green-500"
                        placeholder="Search by client or Order ID..."
                    />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <div className="flex flex-wrap items-center gap-2">
                            {(['All', ...Object.values(OrderStatus)] as const).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    aria-pressed={filterStatus === status}
                                    className={`px-3 py-1 text-sm font-medium rounded-full transition-colors duration-200 ${
                                        filterStatus === status 
                                        ? 'bg-green-600 text-white shadow' 
                                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                                    }`}
                                >
                                    {status === 'All' ? 'All' : status}
                                </button>
                            ))}
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        <ArrowsUpDownIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <label htmlFor="sort-order" className="text-sm font-medium text-gray-600 dark:text-gray-300 sr-only">Sort by:</label>
                        <select 
                          id="sort-order"
                          value={sortOption}
                          onChange={e => setSortOption(e.target.value as SortOption)}
                          className="block w-full sm:w-auto pl-3 pr-8 py-1.5 text-base bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
                        >
                            <option value="date-desc">Newest First</option>
                            <option value="date-asc">Oldest First</option>
                            <option value="client-asc">Client Name (A-Z)</option>
                            <option value="client-desc">Client Name (Z-A)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
        <div className="flex-shrink-0 mt-2 md:mt-0 self-start">
          <button
            onClick={onAddOrderClick}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900 transition-colors duration-300"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add New Order
          </button>
        </div>
      </div>

      {displayedOrders.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold">No Orders Found</h3>
            <p className="mt-1">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedOrders.map(order => (
            <OrderCard 
              key={order.id} 
              order={order} 
              onShowHistory={onShowHistory} 
              onDelete={handleDeleteOrder} 
              onEdit={handleEditOrder}
            />
          ))}
        </div>
      )}

      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={handleUpdateOrder}
          microgreenVarieties={microgreenVarietyNames}
        />
      )}
    </>
  );
};

export default OrderList;