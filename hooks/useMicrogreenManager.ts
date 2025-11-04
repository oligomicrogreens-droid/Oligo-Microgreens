import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Order, OrderStatus, MicrogreenVariety, MicrogreenVarietyName, Inventory, DeliveryMode, AggregatedHarvestList, OrderItem, ShortfallReport, HarvestLogEntry, SeedInventory, SeedInventoryItem } from '../types';
import { OrderStatus as OrderStatusEnum } from '../types';

const initialVarieties: MicrogreenVariety[] = [
    { name: "Basil", growthCycleDays: 20 },
    { name: "Broccoli", growthCycleDays: 10 },
    { name: "Cilantro", growthCycleDays: 22 },
    { name: "Edible Flower", growthCycleDays: 45 },
    { name: "Fenugreek", growthCycleDays: 12 },
    { name: "Kale", growthCycleDays: 12 },
    { name: "Live Tray Gongura", growthCycleDays: 14 },
    { name: "Live Tray Mustard", growthCycleDays: 8 },
    { name: "Live Tray Pea shoots", growthCycleDays: 12 },
    { name: "Live Tray Pink Radish", growthCycleDays: 9 },
    { name: "Live Tray Red Amaranth", growthCycleDays: 20 },
    { name: "Live Tray Sango Radish", growthCycleDays: 9 },
    { name: "Live Tray Sunflower", growthCycleDays: 10 },
    { name: "Mix Box", growthCycleDays: 10 }, // Composite product, using an average
    { name: "Mustard", growthCycleDays: 6 },
    { name: "Nasturtium Leaves", growthCycleDays: 14 },
    { name: "Pea Shoots", growthCycleDays: 10 },
    { name: "Pink Radish", growthCycleDays: 7 },
    { name: "Purple Kohlrabi", growthCycleDays: 10 },
    { name: "Red Amaranth", growthCycleDays: 18 },
    { name: "Sango Radish", growthCycleDays: 7 },
    { name: "Sunflower", growthCycleDays: 8 },
    { name: "Wheatgrass", growthCycleDays: 9 }
].sort((a, b) => a.name.localeCompare(b.name));

const initialDeliveryModes: DeliveryMode[] = [ "Tiffin", "Porter", "Priority", "Himanshu", "Suryance", "Shivas" ];

const initialOrders: Order[] = [
  { id: 'ORD-001', clientName: 'Green Leaf Cafe', items: [{ variety: 'Sunflower', quantity: 8 }], status: OrderStatusEnum.Pending, createdAt: new Date(new Date().setDate(new Date().getDate() - 5)), deliveryDate: new Date(new Date().setDate(new Date().getDate() + 2)) },
  { id: 'ORD-002', clientName: 'Healthy Bites', items: [{ variety: 'Pea Shoots', quantity: 12 }, { variety: 'Broccoli', quantity: 6 }], status: OrderStatusEnum.Pending, createdAt: new Date(new Date().setDate(new Date().getDate() - 4)) },
  { id: 'ORD-003', clientName: 'The Salad Bar', items: [{ variety: 'Mustard', quantity: 5 }], status: OrderStatusEnum.Pending, createdAt: new Date(new Date().setDate(new Date().getDate() - 3)), deliveryDate: new Date(new Date().setDate(new Date().getDate() + 4)) },
  { id: 'ORD-004', clientName: 'Juice Junction', items: [{ variety: 'Cilantro', quantity: 7 }, { variety: 'Sunflower', quantity: 7 }], status: OrderStatusEnum.Pending, createdAt: new Date(new Date().setDate(new Date().getDate() - 1)) },
];

const createInitialInventory = (varietyNames: MicrogreenVarietyName[]): Inventory => {
    return varietyNames.reduce((acc, varietyName) => {
        acc[varietyName] = 0;
        return acc;
    }, {} as Inventory);
};


export const useMicrogreenManager = () => {
  const [microgreenVarieties, setMicrogreenVarieties] = useState<MicrogreenVariety[]>(() => {
      try {
        const saved = localStorage.getItem('microgreen-app-varieties');
        return saved ? JSON.parse(saved) : initialVarieties;
      } catch (e) {
        console.error("Error loading varieties:", e);
        return initialVarieties;
      }
  });
  const [deliveryModes, setDeliveryModes] = useState<DeliveryMode[]>(() => {
    try {
        const saved = localStorage.getItem('microgreen-app-deliveryModes');
        return saved ? JSON.parse(saved) : initialDeliveryModes;
    } catch (e) {
        console.error("Error loading delivery modes:", e);
        return initialDeliveryModes;
    }
  });

  const microgreenVarietyNames = useMemo(() => microgreenVarieties.map(v => v.name), [microgreenVarieties]);

  const [orders, setOrders] = useState<Order[]>(() => {
      try {
        const saved = localStorage.getItem('microgreen-app-orders');
        if (saved) {
            const parsed = JSON.parse(saved);
            return parsed.map((order: Order) => ({
                ...order,
                createdAt: new Date(order.createdAt),
                deliveryDate: order.deliveryDate ? new Date(order.deliveryDate) : undefined,
            }));
        }
      } catch (e) {
        console.error("Error loading orders:", e);
      }
      return initialOrders;
  });

  const [inventory, setInventory] = useState<Inventory>(() => {
      try {
        const saved = localStorage.getItem('microgreen-app-inventory');
        if(saved) return JSON.parse(saved);
        return createInitialInventory(microgreenVarieties.map(v => v.name));
      } catch (e) {
        console.error("Error loading inventory:", e);
        return createInitialInventory(microgreenVarieties.map(v => v.name));
      }
  });

  const [harvestingLog, setHarvestingLog] = useState<Record<string, HarvestLogEntry>>(() => {
    try {
        const saved = localStorage.getItem('microgreen-app-harvestingLog');
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.error("Error loading harvesting log:", e);
        return {};
    }
  });

  const [seedInventory, setSeedInventory] = useState<SeedInventory>(() => {
    try {
        const saved = localStorage.getItem('microgreen-app-seedInventory');
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.error("Error loading seed inventory:", e);
        return {};
    }
  });

  // Effect to synchronize seed inventory with the definitive list of varieties
  useEffect(() => {
    setSeedInventory(prevInventory => {
        const newInventory = { ...prevInventory };
        let hasChanged = false;
        microgreenVarieties.forEach(variety => {
            if (!newInventory[variety.name]) {
                newInventory[variety.name] = {
                    stockOnHand: 1000, // Default: 1kg
                    reorderLevel: 200, // Default: 200g
                    gramsPerTray: 15,  // Default: 15g
                };
                hasChanged = true;
            }
        });
        return hasChanged ? newInventory : prevInventory;
    });
  }, [microgreenVarieties]);

  // Effect to save state to localStorage whenever it changes
  useEffect(() => {
    try {
        localStorage.setItem('microgreen-app-orders', JSON.stringify(orders));
        localStorage.setItem('microgreen-app-varieties', JSON.stringify(microgreenVarieties));
        localStorage.setItem('microgreen-app-deliveryModes', JSON.stringify(deliveryModes));
        localStorage.setItem('microgreen-app-inventory', JSON.stringify(inventory));
        localStorage.setItem('microgreen-app-harvestingLog', JSON.stringify(harvestingLog));
        localStorage.setItem('microgreen-app-seedInventory', JSON.stringify(seedInventory));
    } catch (e) {
        console.error("Failed to save data to localStorage:", e);
    }
  }, [orders, microgreenVarieties, deliveryModes, inventory, harvestingLog, seedInventory]);

  const aggregatedHarvestList = useMemo<AggregatedHarvestList>(() => {
    const list: AggregatedHarvestList = createInitialInventory(microgreenVarietyNames);
    orders
      .filter(order => order.status === OrderStatusEnum.Pending)
      .forEach(order => {
        order.items.forEach(item => {
          if (list.hasOwnProperty(item.variety)) {
            list[item.variety] = (list[item.variety] || 0) + item.quantity;
          }
        });
      });
    return list;
  }, [orders, microgreenVarietyNames]);

  const handleHarvest = useCallback((harvestedQuantities: Record<MicrogreenVarietyName, number | string>): ShortfallReport => {
    const availableHarvest: Record<MicrogreenVarietyName, number> = {};
    Object.keys(harvestedQuantities).forEach(key => {
      availableHarvest[key as MicrogreenVarietyName] = Number(harvestedQuantities[key as MicrogreenVarietyName] || 0);
    });

    const pendingOrders = orders
      .filter(o => o.status === OrderStatusEnum.Pending)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const processedOrders: Record<string, Order> = {};
    const shortfallReport: ShortfallReport = [];

    for (const order of pendingOrders) {
      let orderHasShortfall = false;
      const actualHarvestForThisOrder: OrderItem[] = order.items.map(item => {
        const needed = item.quantity;
        const available = availableHarvest[item.variety] || 0;
        const allocated = Math.min(needed, available);
        availableHarvest[item.variety] = available - allocated;
        if (allocated < needed) {
          orderHasShortfall = true;
          shortfallReport.push({
            orderId: order.id,
            clientName: order.clientName,
            variety: item.variety,
            requested: needed,
            allocated: allocated,
            shortfall: needed - allocated,
          });
        }
        return { variety: item.variety, quantity: allocated };
      });
      processedOrders[order.id] = {
        ...order,
        status: orderHasShortfall ? OrderStatusEnum.Shortfall : OrderStatusEnum.Harvested,
        actualHarvest: actualHarvestForThisOrder
      };
    }
    
    const updatedOrders = orders.map(order => processedOrders[order.id] || order);

    setInventory(prevInventory => {
      const newInventory = { ...prevInventory };
      for (const variety in harvestedQuantities) {
        if (newInventory.hasOwnProperty(variety)) {
          newInventory[variety as MicrogreenVarietyName] += Number(harvestedQuantities[variety as MicrogreenVarietyName] || 0);
        }
      }
      return newInventory;
    });

    setOrders(updatedOrders);
    return shortfallReport;
  }, [orders]);

  const handleDispatch = useCallback((orderId: string, deliveryMode: DeliveryMode) => {
    const orderToDispatch = orders.find(o => o.id === orderId);

    if (!orderToDispatch || (orderToDispatch.status !== OrderStatusEnum.Harvested && orderToDispatch.status !== OrderStatusEnum.Shortfall)) return;

    const itemsToDeduct = orderToDispatch.actualHarvest || orderToDispatch.items;

    setInventory(currentInventory => {
      const canDispatch = itemsToDeduct.every(item => currentInventory[item.variety] >= item.quantity);

      if (canDispatch) {
        setOrders(prevOrders => prevOrders.map(order => order.id === orderId ? { ...order, status: OrderStatusEnum.Dispatched, deliveryMode } : order));
        const newInventory = { ...currentInventory };
        itemsToDeduct.forEach(item => { newInventory[item.variety] -= item.quantity; });
        return newInventory;
      } else {
        alert(`Cannot dispatch ${orderToDispatch.clientName}'s order (${orderId}): Not enough inventory.`);
        return currentInventory;
      }
    });
  }, [orders]);

  const handleCompleteDelivery = useCallback((orderId: string, details: { cashReceived?: number; remarks?: string }) => {
    setOrders(prevOrders => prevOrders.map(order =>
      order.id === orderId && order.status === OrderStatusEnum.Dispatched
        ? { 
            ...order, 
            status: OrderStatusEnum.Completed,
            cashReceived: details.cashReceived,
            remarks: details.remarks,
          }
        : order
    ));
  }, []);
  
  const addOrder = useCallback((clientName: string, items: OrderItem[]) => {
    if (!clientName || items.length === 0) return;
    const newOrder: Order = {
        id: `ORD-${String(Date.now()).slice(-4)}-${String(orders.length + 1).padStart(3, '0')}`,
        clientName,
        items,
        status: OrderStatusEnum.Pending,
        createdAt: new Date(),
    };
    setOrders(prev => [newOrder, ...prev]);
  }, [orders.length]);

  const updateOrder = useCallback((orderId: string, updatedData: { clientName: string; items: OrderItem[] }) => {
    if (!updatedData.clientName || updatedData.items.length === 0) {
        alert("Client name and at least one item are required.");
        return;
    }
    setOrders(prevOrders => 
        prevOrders.map(order => {
            if (order.id === orderId) {
                const { actualHarvest, deliveryMode, ...restOfOrder } = order;
                return { 
                    ...restOfOrder, 
                    clientName: updatedData.clientName, 
                    items: updatedData.items,
                    status: OrderStatusEnum.Pending 
                };
            }
            return order;
        })
    );
  }, []);

  const importOrders = useCallback((ordersToImport: Omit<Order, 'id' | 'status' | 'createdAt'>[]) => {
      const newOrders: Order[] = ordersToImport.map((order, index) => ({
          id: `ORD-IMP-${String(Date.now()).slice(-4)}-${String(orders.length + index + 1).padStart(3, '0')}`,
          clientName: order.clientName,
          items: order.items,
          status: OrderStatusEnum.Pending,
          createdAt: new Date(),
          deliveryDate: order.deliveryDate ? new Date(order.deliveryDate) : undefined,
      }));
      setOrders(prev => [...newOrders, ...prev]);
      alert(`${newOrders.length} orders have been successfully imported.`);
  }, [orders.length]);

  const addMicrogreenVariety = useCallback((name: string, growthCycleDays: number) => {
      const newName = name.trim();
      if (newName && !microgreenVarietyNames.includes(newName)) {
          const newVariety: MicrogreenVariety = { name: newName, growthCycleDays };
          setMicrogreenVarieties(prev => [...prev, newVariety].sort((a, b) => a.name.localeCompare(b.name)));
          setInventory(prev => ({...prev, [newName]: 0}));
          setSeedInventory(prev => ({...prev, [newName]: { stockOnHand: 0, reorderLevel: 100, gramsPerTray: 15 } }));
      }
  }, [microgreenVarietyNames]);
  
  const updateMicrogreenVariety = useCallback((name: string, growthCycleDays: number) => {
    setMicrogreenVarieties(prev => prev.map(v => v.name === name ? { ...v, growthCycleDays } : v));
  }, []);

  const addDeliveryMode = useCallback((mode: string) => {
      const newMode = mode.trim();
      if (newMode && !deliveryModes.includes(newMode)) {
          setDeliveryModes(prev => [...prev, newMode]);
      }
  }, [deliveryModes]);

  const deleteMicrogreenVariety = useCallback((varietyNameToDelete: MicrogreenVarietyName) => {
    const isVarietyInUse = orders.some(order => order.items.some(item => item.variety === varietyNameToDelete));
    if (isVarietyInUse) {
      alert(`Cannot delete "${varietyNameToDelete}". It is currently used in one or more orders.`);
      return;
    }
    setMicrogreenVarieties(currentVarieties => currentVarieties.filter(v => v.name !== varietyNameToDelete));
    setInventory(currentInventory => {
      const newInventory = { ...currentInventory };
      delete newInventory[varietyNameToDelete];
      return newInventory;
    });
    setSeedInventory(currentInventory => {
      const newInventory = { ...currentInventory };
      delete newInventory[varietyNameToDelete];
      return newInventory;
    });
  }, [orders]);

  const deleteOrder = useCallback((orderIdToDelete: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderIdToDelete));
  }, []);

  const saveSowingLog = useCallback((date: Date, trays: Record<MicrogreenVarietyName, number | string>) => {
    const toYYYYMMDD = (d: Date): string => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const dateString = toYYYYMMDD(date);

    const numericTrays: Record<MicrogreenVarietyName, number> = {};
    Object.keys(trays).forEach(v => {
      numericTrays[v as MicrogreenVarietyName] = Number(trays[v as MicrogreenVarietyName] || 0);
    });

    setSeedInventory(prevInventory => {
        const newInventory = { ...prevInventory };
        const previousTraysForDate = harvestingLog[dateString]?.trays || {};

        Object.keys(numericTrays).forEach(vName => {
            const varietyName = vName as MicrogreenVarietyName;
            const inventoryItem = newInventory[varietyName];
            if (inventoryItem) {
                const oldTrayCount = previousTraysForDate[varietyName] || 0;
                const newTrayCount = numericTrays[varietyName] || 0;
                const trayDifference = newTrayCount - oldTrayCount;
                if (trayDifference !== 0) {
                    const seedUsage = trayDifference * inventoryItem.gramsPerTray;
                    newInventory[varietyName] = {
                        ...inventoryItem,
                        stockOnHand: inventoryItem.stockOnHand - seedUsage,
                    };
                }
            }
        });
        return newInventory;
    });

    setHarvestingLog(prev => ({
        ...prev,
        [dateString]: { date: dateString, trays: numericTrays }
    }));
  }, [harvestingLog]);

  const updateSeedInventoryItem = useCallback((variety: MicrogreenVarietyName, updatedItem: Partial<SeedInventoryItem>) => {
    setSeedInventory(prev => ({
        ...prev,
        [variety]: {
            ...prev[variety],
            ...updatedItem,
        }
    }));
  }, []);

  const resetApplicationData = useCallback(() => {
    if (window.confirm("Are you sure you want to reset all application data? This action is permanent and cannot be undone.")) {
        localStorage.removeItem('microgreen-app-orders');
        localStorage.removeItem('microgreen-app-varieties');
        localStorage.removeItem('microgreen-app-deliveryModes');
        localStorage.removeItem('microgreen-app-inventory');
        localStorage.removeItem('microgreen-app-harvestingLog');
        localStorage.removeItem('microgreen-app-seedInventory');
        window.location.reload();
    }
  }, []);

  return { 
    orders, 
    inventory, 
    aggregatedHarvestList,
    microgreenVarieties,
    microgreenVarietyNames,
    deliveryModes,
    harvestingLog,
    seedInventory,
    handleHarvest, 
    handleDispatch, 
    handleCompleteDelivery,
    addOrder,
    updateOrder,
    importOrders,
    addMicrogreenVariety,
    updateMicrogreenVariety,
    addDeliveryMode,
    deleteMicrogreenVariety,
    deleteOrder,
    saveSowingLog,
    resetApplicationData,
    updateSeedInventoryItem,
  };
};