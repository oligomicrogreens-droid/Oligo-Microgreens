

import React, { useState } from 'react';
import type { Order } from '../types';
import { OrderStatus } from '../types';
import OrderStatusBadge from './OrderStatusBadge';
import { CheckCircleIcon, ClipboardDocumentListIcon } from './icons';
import DeliveryManifestModal from './DeliveryManifestModal';

interface DeliveryDashboardProps {
  orders: Order[];
  onComplete: (orderId: string, details: { cashReceived?: number; remarks?: string }) => void;
}

const DeliveryCard: React.FC<{ order: Order, onComplete: (orderId: string, details: { cashReceived?: number; remarks?: string }) => void }> = ({ order, onComplete }) => {
  const [cashReceived, setCashReceived] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  const handleCompleteClick = () => {
    onComplete(order.id, {
      cashReceived: cashReceived ? parseFloat(cashReceived) : undefined,
      remarks: remarks.trim() || undefined,
    });
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">{order.id}</p>
          <p className="text-lg font-bold text-gray-800 dark:text-white">{order.clientName}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Delivery via: <span className="font-semibold">{order.deliveryMode}</span></p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        <div>
          <label htmlFor={`cash-${order.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cash Received</label>
          <div className="relative mt-1">
             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">₹</span>
            </div>
            <input
              type="number"
              id={`cash-${order.id}`}
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              placeholder="0.00"
              className="block w-full sm:w-48 rounded-md border-0 pl-7 pr-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400 dark:focus:ring-green-500"
            />
          </div>
        </div>
        <div>
          <label htmlFor={`remarks-${order.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Client Remarks</label>
          <textarea
            id={`remarks-${order.id}`}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            placeholder="Any feedback, comments, or notes..."
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      {/* Action */}
      <div className="flex justify-end">
        <button
          onClick={handleCompleteClick}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-green-500 text-white font-semibold rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 transition-colors duration-300"
        >
          <CheckCircleIcon className="w-5 h-5 mr-2" />
          Mark as Completed
        </button>
      </div>
    </div>
  );
};


const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({ orders, onComplete }) => {
  const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);
  const dispatchedOrders = orders.filter(order => order.status === OrderStatus.Dispatched);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Active Deliveries</h2>
            <button
                onClick={() => setIsManifestModalOpen(true)}
                disabled={dispatchedOrders.length === 0}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-300"
            >
                <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
                Generate Delivery Manifest
            </button>
        </div>

        {dispatchedOrders.length === 0 ? (
           <div className="text-center py-10 text-gray-500 dark:text-gray-400">No active deliveries.</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dispatchedOrders.map(order => (
                <DeliveryCard key={order.id} order={order} onComplete={onComplete} />
                ))}
            </div>
        )}
      </div>
      {isManifestModalOpen && (
        <DeliveryManifestModal 
            orders={dispatchedOrders} 
            onClose={() => setIsManifestModalOpen(false)} 
        />
      )}
    </>
  );
};

export default DeliveryDashboard;