

import React, { useEffect, useMemo } from 'react';
import type { Order } from '../types';
import { XMarkIcon, TruckIcon, ClipboardIcon, PackageIcon } from './icons';

interface DeliveryManifestModalProps {
  orders: Order[];
  onClose: () => void;
}

const printStyles = `
  @media print {
    @page { size: A4; margin: 0.75in; }
    body * { visibility: hidden; }
    #printable-manifest, #printable-manifest * { visibility: visible; }
    #printable-manifest { position: absolute; left: 0; top: 0; width: 100%; padding: 0; font-size: 10pt; }
    #printable-manifest h3 { font-size: 16pt; text-align: center; margin-bottom: 0.5rem; }
    #printable-manifest > p { text-align: center; margin-bottom: 1.5rem; font-size: 9pt; }
    .manifest-group { page-break-inside: avoid; margin-bottom: 1.5rem; }
    .manifest-group h4 { font-size: 14pt; border-bottom: 2px solid black; padding-bottom: 0.25rem; margin-bottom: 0.5rem; }
    .manifest-order { page-break-inside: avoid; border: 1px solid #ccc; border-radius: 0.5rem; padding: 0.5rem; margin-bottom: 0.5rem; }
    .manifest-order-header { display: flex; justify-content: space-between; font-weight: bold; }
    #printable-manifest, #printable-manifest * { color: black !important; background-color: white !important; box-shadow: none !important; }
  }
`;

const DeliveryManifestModal: React.FC<DeliveryManifestModalProps> = ({ orders, onClose }) => {
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = printStyles;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const groupedByDeliveryMode = useMemo(() => {
    // FIX: The generic type argument on `reduce` was causing a type error.
    // This is fixed by typing the accumulator (`acc`) in the callback, which correctly types the result.
    return orders.reduce((acc: Record<string, Order[]>, order) => {
      const mode = order.deliveryMode || 'Unassigned';
      if (!acc[mode]) {
        acc[mode] = [];
      }
      acc[mode].push(order);
      return acc;
    }, {});
  }, [orders]);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 print:bg-transparent print:p-0" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col print:shadow-none print:max-h-full print:max-w-full" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center print:hidden">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Daily Delivery Manifest</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div id="printable-manifest" className="p-6 overflow-y-auto">
          <h3 className="text-xl font-bold text-center text-gray-800 dark:text-white mb-2">Delivery Manifest</h3>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-6">{today}</p>
          
          <div className="space-y-8">
            {Object.entries(groupedByDeliveryMode).map(([mode, ordersInGroup]) => (
              <div key={mode} className="manifest-group">
                <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white border-b-2 border-gray-300 dark:border-gray-600 pb-2 mb-4">
                  <TruckIcon className="w-6 h-6" />
                  Delivery via: {mode}
                </h4>
                <div className="space-y-4">
                  {ordersInGroup.map(order => (
                    <div key={order.id} className="manifest-order bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="manifest-order-header flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">{order.clientName}</p>
                          <p className="text-xs font-mono text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <ClipboardIcon className="w-3 h-3"/>{order.id}
                          </p>
                        </div>
                        <p className="font-bold text-lg text-gray-800 dark:text-white">
                          {order.actualHarvest?.reduce((sum, item) => sum + item.quantity, 0)} boxes
                        </p>
                      </div>
                      <ul className="space-y-1 text-sm">
                        {order.actualHarvest?.map(item => (
                          <li key={item.variety} className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                            <span className="flex items-center gap-2"><PackageIcon className="w-4 h-4" />{item.variety}</span>
                            <span className="font-mono bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-md text-xs">{item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3 flex justify-end space-x-3 print:hidden">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
            Close
          </button>
          <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Print Manifest
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryManifestModal;