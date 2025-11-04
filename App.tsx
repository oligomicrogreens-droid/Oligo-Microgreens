import React, { useState, useMemo } from 'react';
import { useMicrogreenManager } from './hooks/useMicrogreenManager';
import Header from './components/Header';
import OrderList from './components/OrderList';
import HarvestingDashboard from './components/HarvestingDashboard';
import DispatchDashboard from './components/DispatchDashboard';
import DeliveryDashboard from './components/DeliveryDashboard';
import ManagementDashboard from './components/ManagementDashboard';
import ReportsDashboard from './components/MonthlyReport';
import ClientHistoryModal from './components/ClientHistoryModal';
import HarvestingLog from './components/HarvestingLog';
import HomeDashboard from './components/HomeDashboard';
import SowingDashboard from './components/SowingDashboard';
import UpcomingHarvests from './components/UpcomingHarvests';
import AddOrderModal from './components/AddOrderModal';
import SeedInventoryDashboard from './components/SeedInventoryDashboard';
import ImportOrdersModal from './components/ImportOrdersModal';
import type { Order, OrderItem } from './types';

export type AppView = 'dashboard' | 'orders' | 'harvesting' | 'dispatch' | 'delivery' | 'reports' | 'management' | 'harvesting-log' | 'sowing' | 'upcoming-harvests' | 'seed-inventory';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [historyClient, setHistoryClient] = useState<string | null>(null);
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [reorderData, setReorderData] = useState<{ clientName: string; items: OrderItem[] } | null>(null);
  
  const { 
    orders, 
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
    addDeliveryMode,
    deleteMicrogreenVariety,
    deleteOrder,
    saveSowingLog,
    resetApplicationData,
    updateSeedInventoryItem
  } = useMicrogreenManager();

  const clients = useMemo(() => {
    const clientSet = new Set(orders.map(order => order.clientName));
    return Array.from(clientSet).sort();
  }, [orders]);

  const handleShowHistory = (clientName: string) => {
    setHistoryClient(clientName);
  };

  const handleCloseHistory = () => {
    setHistoryClient(null);
  };
  
  const handleReorder = (order: Order) => {
    setHistoryClient(null);
    setReorderData({ clientName: order.clientName, items: order.items });
    setIsAddOrderModalOpen(true);
  };

  const handleOpenAddOrderModal = () => {
    setReorderData(null);
    setIsAddOrderModalOpen(true);
  };
  
  const handleCloseAddOrderModal = () => {
    setIsAddOrderModalOpen(false);
    setReorderData(null);
  };


  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <HomeDashboard orders={orders} harvestingLog={harvestingLog} setCurrentView={setCurrentView} onAddOrder={handleOpenAddOrderModal} />;
      case 'sowing':
        return <SowingDashboard 
                  microgreenVarieties={microgreenVarieties}
                  harvestingLog={harvestingLog} 
                  onSave={saveSowingLog} 
                  orders={orders} 
                  seedInventory={seedInventory}
                />;
      case 'seed-inventory':
        return <SeedInventoryDashboard 
                  seedInventory={seedInventory}
                  onUpdateItem={updateSeedInventoryItem}
                  microgreenVarieties={microgreenVarieties}
               />;
      case 'upcoming-harvests':
        return <UpcomingHarvests harvestingLog={harvestingLog} microgreenVarieties={microgreenVarieties} />;
      case 'harvesting':
        return <HarvestingDashboard aggregatedList={aggregatedHarvestList} onHarvest={handleHarvest} microgreenVarieties={microgreenVarieties} harvestingLog={harvestingLog} />;
      case 'harvesting-log':
        return <HarvestingLog microgreenVarietyNames={microgreenVarietyNames} harvestingLog={harvestingLog} onSaveSowingLog={saveSowingLog} />;
      case 'dispatch':
        return <DispatchDashboard orders={orders} onDispatch={handleDispatch} deliveryModes={deliveryModes} />;
      case 'delivery':
        return <DeliveryDashboard orders={orders} onComplete={handleCompleteDelivery} />;
      case 'reports':
        return <ReportsDashboard orders={orders} harvestingLog={harvestingLog} />;
      case 'management':
        return <ManagementDashboard 
                  microgreenVarieties={microgreenVarieties} 
                  deliveryModes={deliveryModes}
                  orders={orders}
                  onAddVariety={addMicrogreenVariety}
                  onAddMode={addDeliveryMode}
                  onShowHistory={handleShowHistory}
                  onDeleteVariety={deleteMicrogreenVariety}
                  onResetData={resetApplicationData}
                  onOpenImportModal={() => setIsImportModalOpen(true)}
                />;
      case 'orders':
      default:
        return <OrderList 
                  orders={orders} 
                  onAddOrder={addOrder}
                  onUpdateOrder={updateOrder}
                  microgreenVarietyNames={microgreenVarietyNames}
                  onShowHistory={handleShowHistory}
                  onDeleteOrder={deleteOrder}
                  onAddOrderClick={handleOpenAddOrderModal}
                />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderView()}
      </main>
      {historyClient && (
        <ClientHistoryModal 
          clientName={historyClient}
          orders={orders}
          onClose={handleCloseHistory}
          onReorder={handleReorder}
        />
      )}
       {isAddOrderModalOpen && (
        <AddOrderModal
          onClose={handleCloseAddOrderModal}
          onAddOrder={addOrder}
          microgreenVarieties={microgreenVarietyNames}
          clients={clients}
          initialData={reorderData}
        />
      )}
      {isImportModalOpen && (
        <ImportOrdersModal
            onClose={() => setIsImportModalOpen(false)}
            onImport={importOrders}
            microgreenVarietyNames={microgreenVarietyNames}
        />
      )}
    </div>
  );
};

export default App;
