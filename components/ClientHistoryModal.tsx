import React, { useMemo } from 'react';
import type { Order } from '../types';
import { OrderStatus } from '../types';
import OrderStatusBadge from './OrderStatusBadge';
import { XMarkIcon, LeafIcon, CalendarDaysIcon, ClipboardIcon, TruckIcon, ArrowDownTrayIcon, PackageIcon, ExclamationTriangleIcon, ReorderIcon } from './icons';
import { downloadCSV } from '../utils/csv';


interface ClientHistoryModalProps {
  clientName: string;
  orders: Order[];
  onClose: () => void;
  onReorder: (order: Order) => void;
}

// A compact StatCard for the modal view
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-gray-100 dark:bg-gray-700/60 p-3 rounded-lg flex items-center space-x-3">
        <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
            {icon}
        </div>
        <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
            <p className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white truncate">{value}</p>
        </div>
    </div>
);


const ClientHistoryModal: React.FC<ClientHistoryModalProps> = ({ clientName, orders, onClose, onReorder }) => {
  const clientOrders = useMemo(() => orders
    .filter(order => order.clientName === clientName)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()), [orders, clientName]);

  const stats = useMemo(() => {
    if (clientOrders.length === 0) {
      return {
        totalOrders: 0,
        totalBoxes: 0,
        favoriteVariety: 'N/A',
        shortfallOrders: 0,
      };
    }

    const totalOrders = clientOrders.length;

    const totalBoxes = clientOrders.reduce((acc, order) => {
      return acc + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);

    const shortfallOrders = clientOrders.filter(o => o.status === OrderStatus.Shortfall).length;

    const varietyCounts: Record<string, number> = {};
    clientOrders.forEach(order => {
      order.items.forEach(item => {
        varietyCounts[item.variety] = (varietyCounts[item.variety] || 0) + item.quantity;
      });
    });

    let favoriteVariety = 'N/A';
    if (Object.keys(varietyCounts).length > 0) {
      favoriteVariety = Object.entries(varietyCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }
    
    return { totalOrders, totalBoxes, favoriteVariety, shortfallOrders };
  }, [clientOrders]);

  const handleExport = () => {
    const flattenedData = clientOrders.flatMap(order => {
        // If it's a shortfall order with actual harvest data, we can be very specific
        if (order.status === OrderStatus.Shortfall && order.actualHarvest) {
            const requestedMap = new Map(order.items.map(i => [i.variety, i.quantity]));
            const harvestedMap = new Map(order.actualHarvest.map(h => [h.variety, h.quantity]));
            const allVarieties = new Set([...requestedMap.keys(), ...harvestedMap.keys()]);
            
            return Array.from(allVarieties).map(variety => {
                const requested = requestedMap.get(variety) || 0;
                const harvested = harvestedMap.get(variety) || 0;
                return {
                    order_id: order.id,
                    created_at: order.createdAt.toISOString().split('T')[0],
                    status: order.status,
                    delivery_mode: order.deliveryMode || 'N/A',
                    item_variety: variety,
                    requested_quantity: requested,
                    harvested_quantity: harvested,
                    shortfall_quantity: Math.max(0, Number(requested) - Number(harvested)),
                };
            });
        }

        // For all other statuses, we assume requested amount was harvested/delivered
        return order.items.map(item => ({
            order_id: order.id,
            created_at: order.createdAt.toISOString().split('T')[0],
            status: order.status,
            delivery_mode: order.deliveryMode || 'N/A',
            item_variety: item.variety,
            requested_quantity: item.quantity,
            harvested_quantity: (order.status === OrderStatus.Pending) ? 'N/A' : item.quantity,
            shortfall_quantity: 0,
        }));
    });
    
    if (flattenedData.length > 0) {
      downloadCSV(flattenedData, `order_history_${clientName.replace(/\s+/g, '_')}.csv`);
    } else {
      alert("No order history to export.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Order History for <span className="text-green-600 dark:text-green-400">{clientName}</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <XMarkIcon className="w-7 h-7" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Stats Section */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Client Snapshot</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Orders" value={stats.totalOrders} icon={<ClipboardIcon className="w-6 h-6" />} />
                    <StatCard title="Total Boxes" value={stats.totalBoxes} icon={<PackageIcon className="w-6 h-6" />} />
                    <StatCard title="Favorite Variety" value={stats.favoriteVariety} icon={<LeafIcon className="w-6 h-6" />} />
                    <StatCard title="Shortfalls" value={stats.shortfallOrders} icon={<ExclamationTriangleIcon className="w-6 h-6 text-red-500" />} />
                </div>
            </div>

          {clientOrders.length > 0 ? (
            <div className="space-y-4">
              {clientOrders.map(order => (
                <div key={order.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        <ClipboardIcon className="w-4 h-4" /> {order.id}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <CalendarDaysIcon className="w-4 h-4" /> Created: {order.createdAt.toLocaleDateString()}
                      </div>
                       {order.deliveryDate && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <TruckIcon className="w-4 h-4" /> Delivery: {order.deliveryDate.toLocaleDateString()}
                        </div>
                       )}
                    </div>
                    <div className="flex items-center gap-2">
                        <OrderStatusBadge status={order.status} />
                        <button 
                            onClick={() => onReorder(order)}
                            className="p-1.5 text-gray-500 hover:text-green-600 dark:hover:text-green-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title="Re-order this list of items"
                        >
                            <ReorderIcon className="w-5 h-5" />
                        </button>
                    </div>
                  </div>
                   <ul className="space-y-1 text-sm">
                    {order.items.map((item, index) => (
                      <li key={index} className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                        <span className="flex items-center">
                          <LeafIcon className="w-4 h-4 mr-2 text-green-500" />
                          {item.variety}
                        </span>
                        <span className="font-mono bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-md text-xs">
                          {item.quantity} boxes
                        </span>
                      </li>
                    ))}
                  </ul>
                  {order.status === 'Completed' && (order.cashReceived != null || order.remarks) && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 text-xs space-y-1">
                          {order.cashReceived != null && (
                              <p className="text-gray-600 dark:text-gray-400">
                                  <strong>Cash Received:</strong> ₹{order.cashReceived.toFixed(2)}
                              </p>
                          )}
                          {order.remarks && (
                              <p className="text-gray-600 dark:text-gray-400">
                                  <strong>Remarks:</strong> <span className="italic">"{order.remarks}"</span>
                              </p>
                          )}
                      </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-10">No order history found for this client.</p>
          )}
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex justify-between items-center sticky bottom-0">
            <button 
                onClick={handleExport}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800"
            >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Export CSV
            </button>
            <button onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default ClientHistoryModal;