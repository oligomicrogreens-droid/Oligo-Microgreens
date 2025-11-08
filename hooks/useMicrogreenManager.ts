
import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Order, OrderStatus, MicrogreenVariety, MicrogreenVarietyName, Inventory, DeliveryMode, AggregatedHarvestList, OrderItem, ShortfallReport, HarvestLogEntry, SeedInventory, SeedInventoryItem, AppData, WasteLogEntry, DeliveryExpense, PurchaseOrder, PurchaseOrderItem } from '../types';
import { OrderStatus as OrderStatusEnum, PurchaseOrderStatus } from '../types';

const STORAGE_KEY = 'microgreen-app-data';

// A function to create initial empty/default data
const getInitialData = (): AppData => ({
  orders: [],
  microgreenVarieties: [
    { name: 'Sunflower', growthCycleDays: 8 },
    { name: 'Radish', growthCycleDays: 7 },
    { name: 'Peas', growthCycleDays: 10 },
    { name: 'Broccoli', growthCycleDays: 9 },
    { name: 'Mustard', growthCycleDays: 6 },
  ],
  deliveryModes: ['Porter', 'Swiggy Genie', 'Tiffin'],
  inventory: {},
  harvestingLog: {},
  seedInventory: {
    'Sunflower': { stockOnHand: 5000, reorderLevel: 1000, gramsPerTray: 120, safetyStockBoxes: 10 },
    'Radish': { stockOnHand: 2500, reorderLevel: 500, gramsPerTray: 80, safetyStockBoxes: 5 },
    'Peas': { stockOnHand: 8000, reorderLevel: 2000, gramsPerTray: 200, safetyStockBoxes: 8 },
    'Broccoli': { stockOnHand: 1500, reorderLevel: 300, gramsPerTray: 30, safetyStockBoxes: 5 },
    'Mustard': { stockOnHand: 1200, reorderLevel: 300, gramsPerTray: 40, safetyStockBoxes: 0 },
  },
  wasteLog: [],
  deliveryExpenses: [],
  purchaseOrders: [],
});

// Recursively parses objects/arrays to convert ISO date strings back into Date objects.
const parseDates = (obj: any): any => {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => parseDates(item));
    }
    // ISO date string format check
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (typeof value === 'string' && isoDateRegex.test(value)) {
                newObj[key] = new Date(value);
            } else if (typeof value === 'object' && value !== null) {
                newObj[key] = parseDates(value);
            } else {
                newObj[key] = value;
            }
        }
    }
    return newObj;
};


export const useMicrogreenManager = () => {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initial load from localStorage
  useEffect(() => {
      try {
          const storedData = localStorage.getItem(STORAGE_KEY);
          if (storedData) {
              const parsedData = JSON.parse(storedData);
              const data = parseDates(parsedData);
              // Ensure new properties exist
              if (!data.purchaseOrders) data.purchaseOrders = [];
              setAppData(data);
          } else {
              setAppData(getInitialData());
          }
      } catch (err) {
          console.error("Failed to load data from localStorage", err);
          setError("Could not load data. It may be corrupted. You may need to clear your browser's site data.");
          setAppData(getInitialData());
      }
  }, []);

  // Persist data to localStorage whenever it changes
  useEffect(() => {
      if (appData) {
          try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
          } catch (err) {
              console.error("Failed to save data to localStorage", err);
              setError("Could not save your changes.");
          }
      }
  }, [appData]);
  
  const data = useMemo(() => appData || getInitialData(), [appData]);
  const { orders, microgreenVarieties, deliveryModes, inventory, harvestingLog, seedInventory, wasteLog, deliveryExpenses, purchaseOrders } = data;
  const microgreenVarietyNames = useMemo(() => microgreenVarieties.map(v => v.name), [microgreenVarieties]);


  const aggregatedHarvestList = useMemo<AggregatedHarvestList>(() => {
    const list: AggregatedHarvestList = {};
    microgreenVarietyNames.forEach(name => list[name] = 0);
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    orders
      .filter(order => {
        if (order.status !== OrderStatusEnum.Pending) return false;
        if (!order.deliveryDate) return true;
        return new Date(order.deliveryDate) <= today;
      })
      .forEach(order => {
        order.items.forEach(item => {
          if (list.hasOwnProperty(item.variety)) {
            list[item.variety] = (list[item.variety] || 0) + item.quantity;
          }
        });
      });
    return list;
  }, [orders, microgreenVarietyNames]);

  const addOrder = useCallback((clientName: string, items: OrderItem[], deliveryDate?: Date, location?: string) => {
      if (!clientName || items.length === 0) return;
      const newOrder: Order = {
          id: `ORD-${Date.now()}`,
          clientName,
          items,
          status: OrderStatusEnum.Pending,
          createdAt: new Date(),
          deliveryDate,
          location,
      };
      setAppData(prev => prev ? { ...prev, orders: [newOrder, ...prev.orders] } : null);
  }, []);

  const updateOrder = useCallback((orderId: string, updatedData: { clientName: string; items: OrderItem[]; deliveryDate?: Date; location?: string }) => {
     setAppData(prev => {
        if (!prev) return null;
        const newOrders = prev.orders.map(o => {
            if (o.id === orderId) {
                return { ...o, ...updatedData, status: OrderStatusEnum.Pending };
            }
            return o;
        });
        return { ...prev, orders: newOrders };
     });
  }, []);

  const deleteOrder = useCallback((orderIdToDelete: string) => {
    setAppData(prev => prev ? { ...prev, orders: prev.orders.filter(o => o.id !== orderIdToDelete) } : null);
  }, []);
  
  const deleteAllOrders = useCallback(async () => {
    if (window.confirm("Are you sure you want to delete ALL orders? This is permanent and will clear all order history, but will not affect other data like varieties or logs.")) {
      setAppData(prev => prev ? { ...prev, orders: [] } : null);
    }
  }, []);

  const addMicrogreenVariety = useCallback((name: string, growthCycleDays: number) => {
    const newName = name.trim();
    if (newName && !microgreenVarietyNames.includes(newName)) {
        const newVariety: MicrogreenVariety = { name: newName, growthCycleDays };
        setAppData(prev => {
            if (!prev) return null;
            const newVarieties = [...prev.microgreenVarieties, newVariety];
            const newSeedInventory = { ...prev.seedInventory, [newName]: { stockOnHand: 0, reorderLevel: 0, gramsPerTray: 0, safetyStockBoxes: 0 }};
            return { ...prev, microgreenVarieties: newVarieties, seedInventory: newSeedInventory };
        });
    }
  }, [microgreenVarietyNames]);

  const deleteMicrogreenVariety = useCallback((varietyNameToDelete: MicrogreenVarietyName) => {
    const isVarietyInUse = orders.some(order => order.items.some(item => item.variety === varietyNameToDelete));
    if (isVarietyInUse) {
      alert(`Cannot delete "${varietyNameToDelete}". It is currently used in one or more orders.`);
      return;
    }
    setAppData(prev => {
        if (!prev) return null;
        const newVarieties = prev.microgreenVarieties.filter(v => v.name !== varietyNameToDelete);
        const newSeedInventory = { ...prev.seedInventory };
        delete newSeedInventory[varietyNameToDelete];
        // Note: also consider cleaning up from orders, logs etc. or prevent deletion if in use.
        return { ...prev, microgreenVarieties: newVarieties, seedInventory: newSeedInventory };
    });
  }, [orders]);
  
  const saveSowingLog = useCallback((date: Date, trays: Record<MicrogreenVarietyName, number | string>) => {
    const toYYYYMMDD = (d: Date): string => d.toISOString().split('T')[0];
    const dateString = toYYYYMMDD(date);

    const numericTrays: Record<MicrogreenVarietyName, number> = {};
    let seedDeductions: Record<MicrogreenVarietyName, number> = {};

    Object.keys(trays).forEach(v => {
      const variety = v as MicrogreenVarietyName;
      const count = Number(trays[variety] || 0);
      numericTrays[variety] = count;
      const gramsPerTray = seedInventory[variety]?.gramsPerTray || 0;
      seedDeductions[variety] = (seedDeductions[variety] || 0) + (count * gramsPerTray);
    });
    
    setAppData(prev => {
      if (!prev) return null;
      const newHarvestingLog = { ...prev.harvestingLog, [dateString]: { date: dateString, trays: numericTrays } };
      
      const newSeedInventory = { ...prev.seedInventory };
      Object.entries(seedDeductions).forEach(([variety, deduction]) => {
          if (newSeedInventory[variety as MicrogreenVarietyName]) {
              newSeedInventory[variety as MicrogreenVarietyName].stockOnHand -= deduction;
          }
      });

      return { ...prev, harvestingLog: newHarvestingLog, seedInventory: newSeedInventory };
    });
  }, [seedInventory]);
  
  const handleHarvest = useCallback(async (harvestedQuantities: Record<MicrogreenVarietyName, number | string>): Promise<ShortfallReport> => {
      const report: ShortfallReport = [];
      setAppData(prev => {
          if (!prev) return null;
          
          const newState = JSON.parse(JSON.stringify(prev));
          
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          
          const ordersToProcess = newState.orders
              .filter((o: Order) => o.status === OrderStatusEnum.Pending && (!o.deliveryDate || new Date(o.deliveryDate) <= today))
              .sort((a: Order, b: Order) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          const availableHarvest: Record<string, number> = {};
          Object.keys(harvestedQuantities).forEach(key => {
              availableHarvest[key] = Number(harvestedQuantities[key] || 0);
          });

          ordersToProcess.forEach((order: Order) => {
              let hasShortfall = false;
              const actualHarvest: OrderItem[] = [];
              
              order.items.forEach((item: OrderItem) => {
                  const requested = item.quantity;
                  const available = availableHarvest[item.variety] || 0;
                  const allocated = Math.min(requested, available);
                  
                  actualHarvest.push({ variety: item.variety, quantity: allocated });
                  availableHarvest[item.variety] -= allocated;
                  
                  if (allocated < requested) {
                      hasShortfall = true;
                      report.push({
                          orderId: order.id, clientName: order.clientName, variety: item.variety,
                          requested: requested, allocated: allocated, shortfall: requested - allocated,
                      });
                  }
              });
              
              const orderInState = newState.orders.find((o: Order) => o.id === order.id);
              if (orderInState) {
                  orderInState.status = hasShortfall ? OrderStatusEnum.Shortfall : OrderStatusEnum.Harvested;
                  orderInState.actualHarvest = actualHarvest;
              }
          });
          
          return parseDates(newState);
      });
      return report;
  }, []);
  
  const handleDispatch = useCallback(async (orderId: string, deliveryMode: DeliveryMode) => {
      setAppData(prev => {
          if (!prev) return null;
          const newOrders = prev.orders.map(o => o.id === orderId ? { ...o, status: OrderStatusEnum.Dispatched, deliveryMode } : o);
          return { ...prev, orders: newOrders };
      });
  }, []);
  
  const handleCompleteDelivery = useCallback(async (orderId: string, details: { cashReceived?: number; remarks?: string }) => {
      setAppData(prev => {
          if (!prev) return null;
          const newOrders = prev.orders.map(o => o.id === orderId ? { ...o, status: OrderStatusEnum.Completed, ...details } : o);
          return { ...prev, orders: newOrders };
      });
  }, []);
  
  const resetApplicationData = useCallback(async () => {
    if (window.confirm("Are you sure you want to reset all data? This is permanent and will clear everything stored in your browser for this app.")) {
      localStorage.removeItem(STORAGE_KEY);
      setAppData(getInitialData());
    }
  }, []);

  const importOrders = useCallback(async (ordersToImport: Omit<Order, 'id' | 'status' | 'createdAt'>[]) => {
    const newOrders: Order[] = ordersToImport.map((o, i) => ({
        ...o,
        id: `IMP-${Date.now()}-${i}`,
        status: OrderStatusEnum.Pending,
        createdAt: new Date(),
    }));
    setAppData(prev => prev ? { ...prev, orders: [...newOrders, ...prev.orders] } : null);
    alert(`${newOrders.length} orders imported successfully.`);
  }, []);
  
  const importVarieties = useCallback(async (varietiesToImport: MicrogreenVariety[]) => {
    let importedCount = 0;
    setAppData(prev => {
        if (!prev) return null;
        const existingVarietyNames = new Set(prev.microgreenVarieties.map(v => v.name.toLowerCase()));
        const newVarietiesToAdd: MicrogreenVariety[] = [];
        const newSeedInventoryEntries: SeedInventory = {};

        varietiesToImport.forEach(v => {
            const trimmedName = v.name.trim();
            const growthCycleDays = Number(v.growthCycleDays);

            if (trimmedName && !isNaN(growthCycleDays) && growthCycleDays > 0 && !existingVarietyNames.has(trimmedName.toLowerCase())) {
                newVarietiesToAdd.push({ name: trimmedName, growthCycleDays });
                newSeedInventoryEntries[trimmedName] = { stockOnHand: 0, reorderLevel: 0, gramsPerTray: 0, safetyStockBoxes: 0 };
                existingVarietyNames.add(trimmedName.toLowerCase());
            }
        });
        
        importedCount = newVarietiesToAdd.length;
        if (importedCount > 0) {
            return {
                ...prev,
                microgreenVarieties: [...prev.microgreenVarieties, ...newVarietiesToAdd].sort((a, b) => a.name.localeCompare(b.name)),
                seedInventory: { ...prev.seedInventory, ...newSeedInventoryEntries }
            };
        }
        return prev;
    });
    alert(`${importedCount} new ${importedCount === 1 ? 'variety' : 'varieties'} imported successfully.`);
  }, []);

  const addDeliveryMode = useCallback(async (mode: string) => {
    const newMode = mode.trim();
    if (!newMode) return;
    setAppData(prev => {
        if (!prev || prev.deliveryModes.includes(newMode)) return prev;
        return { ...prev, deliveryModes: [...prev.deliveryModes, newMode] };
    });
  }, []);

  const updateSeedInventoryItem = useCallback(async (variety: MicrogreenVarietyName, itemUpdate: Partial<SeedInventoryItem>) => {
    setAppData(prev => {
        if (!prev) return null;
        const newSeedInventory = { ...prev.seedInventory };
        newSeedInventory[variety] = { ...newSeedInventory[variety], ...itemUpdate };
        return { ...prev, seedInventory: newSeedInventory };
    });
  }, []);
  
  const exportAllData = useCallback(async () => {
    if (!appData) return;
    const dataString = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `microgreen-hub-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [appData]);

  const importAllData = useCallback(async (fileContent: string) => {
      try {
        const importedData = JSON.parse(fileContent);
        if (importedData && 'orders' in importedData && 'microgreenVarieties' in importedData) {
            if (window.confirm("This will overwrite all current data. Are you sure?")) {
                setAppData(parseDates(importedData));
            }
        } else {
            throw new Error("Invalid data file format.");
        }
      } catch (e) {
          alert(`Import failed: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
  }, []);

  const addWasteLogEntry = useCallback(async (entry: Omit<WasteLogEntry, 'id'>) => {
    const newEntry: WasteLogEntry = { ...entry, id: `WST-${Date.now()}` };
    setAppData(prev => prev ? { ...prev, wasteLog: [newEntry, ...prev.wasteLog] } : null);
  }, []);

  const deleteWasteLogEntry = useCallback(async (id: string) => {
    setAppData(prev => prev ? { ...prev, wasteLog: prev.wasteLog.filter(e => e.id !== id) } : null);
  }, []);
  
  const addDeliveryExpense = useCallback(async (expense: Omit<DeliveryExpense, 'id'>) => {
    const newExpense: DeliveryExpense = { ...expense, id: `EXP-${Date.now()}` };
    setAppData(prev => prev ? { ...prev, deliveryExpenses: [newExpense, ...prev.deliveryExpenses] } : null);
  }, []);
  
  const deleteDeliveryExpense = useCallback(async (id: string) => {
    setAppData(prev => prev ? { ...prev, deliveryExpenses: prev.deliveryExpenses.filter(e => e.id !== id) } : null);
  }, []);
  
  // Purchase Order Management
  const addPurchaseOrder = useCallback((po: Omit<PurchaseOrder, 'id' | 'status' | 'createdAt'>) => {
    const newPO: PurchaseOrder = {
      ...po,
      id: `PO-${Date.now()}`,
      status: PurchaseOrderStatus.Draft,
      createdAt: new Date(),
    };
    setAppData(prev => prev ? { ...prev, purchaseOrders: [newPO, ...prev.purchaseOrders] } : null);
  }, []);

  const updatePurchaseOrder = useCallback((poId: string, updatedData: { supplierName: string; items: PurchaseOrderItem[]; notes?: string }) => {
    setAppData(prev => {
      if (!prev) return null;
      const newPOs = prev.purchaseOrders.map(po => 
        po.id === poId ? { ...po, ...updatedData } : po
      );
      return { ...prev, purchaseOrders: newPOs };
    });
  }, []);

  const deletePurchaseOrder = useCallback((poId: string) => {
    setAppData(prev => prev ? { ...prev, purchaseOrders: prev.purchaseOrders.filter(po => po.id !== poId) } : null);
  }, []);

  const markPOAsOrdered = useCallback((poId: string) => {
    setAppData(prev => {
      if (!prev) return null;
      const newPOs = prev.purchaseOrders.map(po =>
        po.id === poId ? { ...po, status: PurchaseOrderStatus.Ordered, orderedAt: new Date() } : po
      );
      return { ...prev, purchaseOrders: newPOs };
    });
  }, []);

  const markPOAsReceived = useCallback((poId: string) => {
    setAppData(prev => {
      if (!prev) return null;
      const poToReceive = prev.purchaseOrders.find(po => po.id === poId);
      if (!poToReceive || poToReceive.status !== PurchaseOrderStatus.Ordered) return prev;

      const newPOs = prev.purchaseOrders.map(po =>
        po.id === poId ? { ...po, status: PurchaseOrderStatus.Received, receivedAt: new Date() } : po
      );
      
      const newSeedInventory = { ...prev.seedInventory };
      poToReceive.items.forEach(item => {
        if (newSeedInventory[item.variety]) {
          newSeedInventory[item.variety].stockOnHand += item.quantity;
        } else {
          // This case should ideally not happen if varieties are managed properly
          newSeedInventory[item.variety] = { stockOnHand: item.quantity, reorderLevel: 0, gramsPerTray: 0 };
        }
      });
      
      return { ...prev, purchaseOrders: newPOs, seedInventory: newSeedInventory };
    });
  }, []);
  
  const cancelPurchaseOrder = useCallback((poId: string) => {
     setAppData(prev => {
      if (!prev) return null;
      const newPOs = prev.purchaseOrders.map(po =>
        po.id === poId ? { ...po, status: PurchaseOrderStatus.Cancelled } : po
      );
      return { ...prev, purchaseOrders: newPOs };
    });
  }, []);

  return { 
    orders, inventory, aggregatedHarvestList, microgreenVarieties, microgreenVarietyNames,
    deliveryModes, harvestingLog, seedInventory, wasteLog, deliveryExpenses, purchaseOrders,
    isLoading: appData === null, isSaving: false, error, 
    handleHarvest, handleDispatch, handleCompleteDelivery, addOrder, updateOrder,
    addMicrogreenVariety, deleteMicrogreenVariety, deleteOrder, deleteAllOrders,
    saveSowingLog, 
    resetApplicationData, importOrders, importVarieties, addDeliveryMode, updateSeedInventoryItem,
    exportAllData, importAllData, addWasteLogEntry, deleteWasteLogEntry,
    addDeliveryExpense, deleteDeliveryExpense,
    addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, markPOAsOrdered, markPOAsReceived, cancelPurchaseOrder,
    // Placeholders for functions not implemented via UI but kept for type safety
    updateMicrogreenVariety: async () => alert("This function is not implemented."),
  };
};