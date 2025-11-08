
import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { PurchaseOrder, PurchaseOrderItem, MicrogreenVarietyName } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface EditPurchaseOrderModalProps {
  onClose: () => void;
  onSave: (idOrData: any, data?: any) => void;
  microgreenVarieties: MicrogreenVarietyName[];
  purchaseOrder: PurchaseOrder | null;
}

type ModalPOItem = PurchaseOrderItem & { _id: number };

const POItemRow: React.FC<{ item: ModalPOItem; onRemove: (id: number) => void }> = React.memo(({ item, onRemove }) => {
    return (
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">
           <span>{item.variety}: <span className="font-mono">{item.quantity}</span> g</span>
           <button onClick={() => onRemove(item._id)} className="text-red-500 hover:text-red-700">
               <TrashIcon className="w-5 h-5"/>
           </button>
        </div>
    );
});

const EditPurchaseOrderModal: React.FC<EditPurchaseOrderModalProps> = ({ onClose, onSave, microgreenVarieties, purchaseOrder }) => {
  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ModalPOItem[]>([]);
  const [currentItem, setCurrentItem] = useState<{ variety: MicrogreenVarietyName | '', quantity: number | string }>({ variety: '', quantity: '' });
  const nextId = useRef(0);

  useEffect(() => {
    if (purchaseOrder) {
      setSupplierName(purchaseOrder.supplierName);
      setNotes(purchaseOrder.notes || '');
      const initialItems = purchaseOrder.items.map((item, index) => ({
        ...item,
        _id: index,
      }));
      setItems(initialItems);
      nextId.current = purchaseOrder.items.length;
    }
  }, [purchaseOrder]);

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
    if (!supplierName.trim() || items.length === 0) {
      alert('Please enter a supplier name and add at least one item.');
      return;
    }
    
    const finalData = {
        supplierName: supplierName.trim(),
        items: items.map(({ variety, quantity }) => ({ variety, quantity })),
        notes: notes.trim(),
    };

    if (purchaseOrder) {
      onSave(purchaseOrder.id, finalData);
    } else {
      onSave(finalData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
            {purchaseOrder ? `Edit PO ${purchaseOrder.id}` : 'Create New Purchase Order'}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="supplierName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Supplier Name</label>
              <input
                type="text"
                id="supplierName"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Johnny's Seeds"
              />
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">Items to Purchase</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {items.map((item) => (
                        <POItemRow key={item._id} item={item} onRemove={handleRemoveItem} />
                    ))}
                </div>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Variety</label>
                <select
                  value={currentItem.variety}
                  onChange={e => setCurrentItem({ ...currentItem, variety: e.target.value as MicrogreenVarietyName })}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="" disabled>Select variety</option>
                  {microgreenVarieties.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Quantity (g)</label>
                <input
                  type="number"
                  min="1"
                  value={currentItem.quantity}
                  onChange={e => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                  className="mt-1 block w-28 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Grams"
                />
              </div>
              <button onClick={handleAddItem} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                <PlusIcon className="w-5 h-5"/>
              </button>
            </div>
             <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Notes (Optional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Ask for non-GMO certificate"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            {purchaseOrder ? 'Save Changes' : 'Create Purchase Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPurchaseOrderModal;
