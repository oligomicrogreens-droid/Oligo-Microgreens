
import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { OrderItem, MicrogreenVarietyName } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface AddOrderModalProps {
  onClose: () => void;
  onAddOrder: (clientName: string, items: OrderItem[], deliveryDate?: Date, location?: string) => void;
  microgreenVarieties: MicrogreenVarietyName[];
  clients: string[];
  initialData?: { clientName: string; items: OrderItem[]; deliveryDate?: Date; location?: string } | null;
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
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">
           <span>{item.variety}: <span className="font-mono">{item.quantity}</span> boxes</span>
           <button onClick={() => onRemove(item._id)} className="text-red-500 hover:text-red-700">
               <TrashIcon className="w-5 h-5"/>
           </button>
        </div>
    );
});

const AddOrderModal: React.FC<AddOrderModalProps> = ({ onClose, onAddOrder, microgreenVarieties, clients, initialData }) => {
  const [clientName, setClientName] = useState(initialData?.clientName || '');
  const [deliveryDate, setDeliveryDate] = useState(() => toInputDateString(initialData?.deliveryDate));
  const [location, setLocation] = useState(initialData?.location || '');
  const [items, setItems] = useState<ModalOrderItem[]>([]);
  const [currentItem, setCurrentItem] = useState<{ variety: MicrogreenVarietyName | '', quantity: number | string }>({ variety: '', quantity: '' });
  const nextId = useRef(0);

  useEffect(() => {
    if (initialData) {
      const initialItems = initialData.items.map((item, index) => ({
        ...item,
        _id: index,
      }));
      setItems(initialItems);
      setLocation(initialData.location || '');
      nextId.current = initialData.items.length;
    }
  }, [initialData]);

  const handleAddItem = () => {
    if (currentItem.variety && Number(currentItem.quantity) > 0) {
      setItems([...items, { variety: currentItem.variety, quantity: Number(currentItem.quantity), _id: nextId.current++ }]);
      setCurrentItem({ variety: '', quantity: '' });
    }
  };

  const handleRemoveItem = useCallback((_id: number) => {
    setItems(prevItems => prevItems.filter((item) => item._id !== _id));
  }, []);
  
  const handleSubmit = () => {
    const finalItemsWithId = [...items];
    // Also include the item currently being edited if it's valid
    if (currentItem.variety && Number(currentItem.quantity) > 0) {
        finalItemsWithId.push({ 
            variety: currentItem.variety, 
            quantity: Number(currentItem.quantity),
            _id: nextId.current++,
        });
    }

    if (clientName && finalItemsWithId.length > 0) {
      const itemsToSubmit = finalItemsWithId.map(({ variety, quantity }) => ({ variety, quantity }));
      onAddOrder(clientName, itemsToSubmit, deliveryDate ? new Date(deliveryDate + 'T00:00:00') : undefined, location);
      onClose();
    } else {
      alert('Please enter a client name and add at least one item.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
            {initialData ? `Re-order for ${initialData.clientName}` : 'Add New Order'}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Client Name</label>
              <input
                type="text"
                id="clientName"
                list="client-list"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Green Leaf Cafe"
              />
              <datalist id="client-list">
                {clients.map(client => (
                    <option key={client} value={client} />
                ))}
              </datalist>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Location / Address (Optional)</label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Koramangala, 5th Block"
              />
            </div>

            <div>
              <label htmlFor="deliveryDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Delivery Date (Optional)</label>
              <input
                type="date"
                id="deliveryDate"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">Order Items</h3>
                <div className="space-y-2">
                    {items.map((item) => (
                        <OrderItemRow key={item._id} item={item} onRemove={handleRemoveItem} />
                    ))}
                </div>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Variety</label>
                <select
                  value={currentItem.variety}
                  onChange={e => setCurrentItem({ variety: e.target.value as MicrogreenVarietyName, quantity: 1 })}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="" disabled>Select variety</option>
                  {microgreenVarieties.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={currentItem.quantity}
                  onChange={e => {
                      const value = e.target.value;
                      // Prevent negative numbers from being entered
                      if (value === '' || Number(value) >= 0) {
                          setCurrentItem(prev => ({ ...prev, quantity: value }));
                      }
                  }}
                  className="mt-1 block w-24 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Boxes"
                />
              </div>
              <button onClick={handleAddItem} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                <PlusIcon className="w-5 h-5"/>
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Submit Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddOrderModal;