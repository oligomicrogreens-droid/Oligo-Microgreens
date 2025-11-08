
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Order, OrderItem, MicrogreenVarietyName } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface EditOrderModalProps {
  order: Order;
  onClose: () => void;
  onSave: (orderId: string, updatedData: { clientName: string; items: OrderItem[]; deliveryDate?: Date; location?: string }) => void;
  microgreenVarieties: MicrogreenVarietyName[];
}

type ModalOrderItem = OrderItem & { _id: number };

const toInputDateString = (date?: Date): string => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const OrderItemRow: React.FC<{ item: ModalOrderItem; onRemove: (id: number) => void }> = React.memo(({ item, onRemove }) => {
    return (
        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
           <span>{item.variety}: <span className="font-mono">{item.quantity}</span> boxes</span>
           <button onClick={() => onRemove(item._id)} className="text-red-500 hover:text-red-700">
               <TrashIcon className="w-5 h-5"/>
           </button>
        </div>
    );
});

const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, onClose, onSave, microgreenVarieties }) => {
  const [clientName, setClientName] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [location, setLocation] = useState('');
  const [items, setItems] = useState<ModalOrderItem[]>([]);
  const [currentItem, setCurrentItem] = useState<{ variety: MicrogreenVarietyName | '', quantity: number | string }>({ variety: '', quantity: '' });
  const nextId = useRef(0);

  useEffect(() => {
    if (order) {
      setClientName(order.clientName);
      setDeliveryDate(toInputDateString(order.deliveryDate));
      setLocation(order.location || '');
      const initialItems = order.items.map((item, index) => ({
        ...item,
        _id: index
      }));
      setItems(initialItems);
      nextId.current = order.items.length;
    }
  }, [order]);

  const handleAddItem = () => {
    if (currentItem.variety && Number(currentItem.quantity) > 0) {
      setItems([...items, { variety: currentItem.variety, quantity: Number(currentItem.quantity), _id: nextId.current++ }]);
      setCurrentItem({ variety: '', quantity: '' });
    }
  };

  const handleRemoveItem = useCallback((_id: number) => {
    setItems(prevItems => prevItems.filter((item) => item._id !== _id));
  }, []);
  
  const handleSave = () => {
    const finalItemsWithId = [...items];
    if (currentItem.variety && Number(currentItem.quantity) > 0) {
        finalItemsWithId.push({ 
            variety: currentItem.variety, 
            quantity: Number(currentItem.quantity),
            _id: nextId.current++,
        });
    }

    if (clientName && finalItemsWithId.length > 0) {
      const itemsToSubmit = finalItemsWithId.map(({ variety, quantity }) => ({ variety, quantity }));
      onSave(order.id, { clientName, items: itemsToSubmit, deliveryDate: deliveryDate ? new Date(deliveryDate + 'T00:00:00') : undefined, location });
    } else {
      alert('Please ensure a client name is present and there is at least one item.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Edit Order <span className="text-green-500">{order.id}</span></h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="clientNameEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Client Name</label>
              <input
                type="text"
                id="clientNameEdit"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Green Leaf Cafe"
              />
            </div>
            
            <div>
              <label htmlFor="locationEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location / Address (Optional)</label>
              <input
                type="text"
                id="locationEdit"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Koramangala, 5th Block"
              />
            </div>

            <div>
              <label htmlFor="deliveryDateEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Date (Optional)</label>
              <input
                type="date"
                id="deliveryDateEdit"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Order Items</h3>
                <div className="space-y-2">
                    {items.map((item) => (
                        <OrderItemRow key={item._id} item={item} onRemove={handleRemoveItem} />
                    ))}
                </div>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Variety</label>
                <select
                  value={currentItem.variety}
                  onChange={e => setCurrentItem({ variety: e.target.value as MicrogreenVarietyName, quantity: 1 })}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="" disabled>Select variety</option>
                  {microgreenVarieties.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={currentItem.quantity}
                  onChange={e => {
                      const value = e.target.value;
                      if (value === '' || Number(value) >= 0) {
                          setCurrentItem(prev => ({ ...prev, quantity: value }));
                      }
                  }}
                  className="mt-1 block w-24 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Boxes"
                />
              </div>
              <button onClick={handleAddItem} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                <PlusIcon className="w-5 h-5"/>
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditOrderModal;