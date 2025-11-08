
import React, { useState } from 'react';
import type { Order, DeliveryMode } from '../types';
import { OrderStatus } from '../types';
import OrderStatusBadge from './OrderStatusBadge';
import { MapPinIcon } from './icons';

interface DispatchDashboardProps {
  orders: Order[];
  onDispatch: (orderId: string, deliveryMode: DeliveryMode) => void;
  deliveryModes: DeliveryMode[];
}

const DispatchCard: React.FC<{ order: Order, onDispatch: (orderId: string, deliveryMode: DeliveryMode) => void, deliveryModes: DeliveryMode[] }> = ({ order, onDispatch, deliveryModes }) => {
  const [selectedMode, setSelectedMode] = useState<DeliveryMode | ''>('');

  const handleDispatchClick = () => {
    if (selectedMode) {
      onDispatch(order.id, selectedMode);
    } else {
      alert('Please select a delivery mode.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">{order.id}</p>
          <p className="text-lg font-bold text-slate-800 dark:text-white">{order.clientName}</p>
          {order.location && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                <MapPinIcon className="w-3 h-3" /> {order.location}
            </p>
          )}
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      
      <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-300 mb-4">
        {(order.actualHarvest || order.items).map((item, index) => (
          <li key={index} className="flex justify-between">
            <span>{item.variety}</span>
            <span className="font-mono">{item.quantity} boxes</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={selectedMode}
          onChange={(e) => setSelectedMode(e.target.value as DeliveryMode)}
          className="flex-grow px-3 py-2 text-slate-800 bg-white dark:bg-slate-600 dark:text-white border border-slate-300 dark:border-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="" disabled>Select Delivery Mode</option>
          {deliveryModes.map(mode => (
            <option key={mode} value={mode}>{mode}</option>
          ))}
        </select>
        <button
          onClick={handleDispatchClick}
          disabled={!selectedMode}
          className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 transition-colors duration-300"
        >
          Dispatch
        </button>
      </div>
    </div>
  );
};


const DispatchDashboard: React.FC<DispatchDashboardProps> = ({ orders, onDispatch, deliveryModes }) => {
  const dispatchableOrders = orders.filter(
    order => order.status === OrderStatus.Harvested || order.status === OrderStatus.Shortfall
  );

  if (dispatchableOrders.length === 0) {
    return <div className="text-center py-10 text-slate-500 dark:text-slate-400">No orders ready for dispatch.</div>;
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Dispatch Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dispatchableOrders.map(order => (
          <DispatchCard key={order.id} order={order} onDispatch={onDispatch} deliveryModes={deliveryModes} />
        ))}
      </div>
    </div>
  );
};

export default DispatchDashboard;