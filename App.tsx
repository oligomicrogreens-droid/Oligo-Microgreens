
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
import ImportVarietiesModal from './components/ImportVarietiesModal';
import type { Order, OrderItem, PurchaseOrder, PurchaseOrderItem } from './types';
import { LeafIcon } from './components/icons';
import { UserProvider, useUser } from './contexts/UserContext';
import LoginScreen from './components/LoginScreen';
import { viewPermissions } from './permissions';
import PermissionDenied from './components/PermissionDenied';
import WasteLogDashboard from './components/WasteLogDashboard';
import DeliveryExpensesDashboard from './components/DeliveryExpensesDashboard';
import SowingPlanDashboard from './components/SowingPlanDashboard';
import PurchaseOrdersDashboard from './components/PurchaseOrdersDashboard';
import EditPurchaseOrderModal from './components/EditPurchaseOrderModal';

export type AppView = 'dashboard' | 'orders' | 'harvesting' | 'dispatch' | 'delivery' | 'reports' | 'management' | 'harvesting-log' | 'sowing' | 'upcoming-harvests' | 'seed-inventory' | 'waste-log' | 'delivery-expenses' | 'sowing-plan' | 'purchase-orders';

const AppContent: React.FC = () => {
  const { currentUser, logout } = useUser();
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [historyClient, setHistoryClient] = useState<string | null>(null);
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportVarietiesModalOpen, setIsImportVarietiesModalOpen] = useState(false);
  const [reorderData, setReorderData] = useState<{ clientName: string; items: OrderItem[]; deliveryDate?: Date; location?: string } | null>(null);
  const [isEditPOModalOpen, setIsEditPOModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  
  const { 
    orders, aggregatedHarvestList, microgreenVarieties, microgreenVarietyNames,
    deliveryModes, harvestingLog, seedInventory, isLoading, error, handleHarvest, 
    handleDispatch, handleCompleteDelivery, addOrder, updateOrder, importOrders,
    addMicrogreenVariety, addDeliveryMode, deleteMicrogreenVariety, deleteOrder,
    deleteAllOrders,
    saveSowingLog, resetApplicationData, updateSeedInventoryItem, exportAllData, importAllData,
    wasteLog, addWasteLogEntry, deleteWasteLogEntry,
    deliveryExpenses, addDeliveryExpense, deleteDeliveryExpense,
    importVarieties, purchaseOrders, addPurchaseOrder, updatePurchaseOrder,
    deletePurchaseOrder, markPOAsOrdered, markPOAsReceived, cancelPurchaseOrder,
  } = useMicrogreenManager();

  const clients = useMemo(() => {
    const clientSet = new Set(orders.map(order => order.clientName));
    return Array.from(clientSet).sort();
  }, [orders]);
  
  const handleShowHistory = (clientName: string) => setHistoryClient(clientName);
  const handleCloseHistory = () => setHistoryClient(null);
  
  const handleReorder = (order: Order) => {
    setHistoryClient(null);
    setReorderData({ clientName: order.clientName, items: order.items, deliveryDate: order.deliveryDate, location: order.location });
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

  const handleOpenAddPOModal = () => {
    setEditingPO(null);
    setIsEditPOModalOpen(true);
  };

  const handleOpenEditPOModal = (po: PurchaseOrder) => {
    setEditingPO(po);
    setIsEditPOModalOpen(true);
  };

  const handleCloseEditPOModal = () => {
    setEditingPO(null);
    setIsEditPOModalOpen(false);
  };

  const renderView = () => {
    if (!currentUser || !viewPermissions[currentView].includes(currentUser.role)) {
      return <PermissionDenied onGoToDashboard={() => setCurrentView('dashboard')} />;
    }
    switch (currentView) {
      case 'dashboard':
        return <HomeDashboard orders={orders} harvestingLog={harvestingLog} setCurrentView={setCurrentView} onAddOrder={handleOpenAddOrderModal} />;
      case 'sowing-plan':
        return <SowingPlanDashboard
                  orders={orders}
                  microgreenVarieties={microgreenVarieties}
                  harvestingLog={harvestingLog}
                  seedInventory={seedInventory}
                  onSaveSowingLog={saveSowingLog}
                />;
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
      case 'purchase-orders':
        return <PurchaseOrdersDashboard
                  purchaseOrders={purchaseOrders}
                  onAddClick={handleOpenAddPOModal}
                  onEditClick={handleOpenEditPOModal}
                  onDelete={deletePurchaseOrder}
                  onMarkAsOrdered={markPOAsOrdered}
                  onMarkAsReceived={markPOAsReceived}
                  onCancel={cancelPurchaseOrder}
                />;
      case 'upcoming-harvests':
        return <UpcomingHarvests harvestingLog={harvestingLog} microgreenVarieties={microgreenVarieties} />;
      case 'harvesting':
        return <HarvestingDashboard 
                  aggregatedList={aggregatedHarvestList} 
                  onHarvest={handleHarvest} 
                  microgreenVarieties={microgreenVarieties} 
                  harvestingLog={harvestingLog} 
                  setCurrentView={setCurrentView}
                />;
      case 'harvesting-log':
        return <HarvestingLog microgreenVarietyNames={microgreenVarietyNames} harvestingLog={harvestingLog} onSaveSowingLog={saveSowingLog} />;
      case 'waste-log':
        return <WasteLogDashboard
                  wasteLog={wasteLog}
                  microgreenVarietyNames={microgreenVarietyNames}
                  onAddEntry={addWasteLogEntry}
                  onDeleteEntry={deleteWasteLogEntry}
                />;
      case 'dispatch':
        return <DispatchDashboard orders={orders} onDispatch={handleDispatch} deliveryModes={deliveryModes} />;
      case 'delivery':
        return <DeliveryDashboard orders={orders} onComplete={handleCompleteDelivery} />;
      case 'delivery-expenses':
        return <DeliveryExpensesDashboard
                  expenses={deliveryExpenses}
                  deliveryModes={deliveryModes.filter(m => m !== 'Tiffin')}
                  onAddExpense={addDeliveryExpense}
                  onDeleteExpense={deleteDeliveryExpense}
                />;
      case 'reports':
        return <ReportsDashboard 
                  orders={orders} 
                  harvestingLog={harvestingLog} 
                  onShowHistory={handleShowHistory} 
                  purchaseOrders={purchaseOrders}
                  seedInventory={seedInventory}
                />;
      case 'management':
        return <ManagementDashboard 
                  microgreenVarieties={microgreenVarieties} 
                  deliveryModes={deliveryModes}
                  orders={orders}
                  // FIX: Corrected typo from addAddMicrogreenVariety to addMicrogreenVariety.
                  onAddVariety={addMicrogreenVariety}
                  onAddMode={addDeliveryMode}
                  onShowHistory={handleShowHistory}
                  onDeleteVariety={deleteMicrogreenVariety}
                  onDeleteAllOrders={deleteAllOrders}
                  onResetData={resetApplicationData}
                  onOpenImportModal={() => setIsImportModalOpen(true)}
                  onOpenImportVarietiesModal={() => setIsImportVarietiesModalOpen(true)}
                  onExportData={exportAllData}
                  onImportData={importAllData}
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

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-100 dark:bg-slate-900">
          <div className="flex items-center mb-4">
              <LeafIcon className="h-10 w-10 text-green-500 animate-pulse" />
              <h1 className="ml-3 text-2xl font-bold text-slate-800 dark:text-white">
              Microgreen Hub
            </h1>
          </div>
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <p className="ml-4 text-lg font-semibold text-slate-700 dark:text-slate-300">Loading Local Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-red-50 dark:bg-red-900/20 p-4">
            <div className="text-center max-w-lg">
                <h2 className="text-2xl font-bold text-red-800 dark:text-red-300">Error</h2>
                <p className="mt-2 text-red-700 dark:text-red-400">{error}</p>
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Please try refreshing the page or clearing your browser's site data if the problem persists.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700"
                >
                    Refresh
                </button>
            </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      <Header currentView={currentView} setCurrentView={setCurrentView} onLogout={logout} />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderView()}
      </main>
      {historyClient && <ClientHistoryModal clientName={historyClient} orders={orders} onClose={handleCloseHistory} onReorder={handleReorder} />}
      {isAddOrderModalOpen && <AddOrderModal onClose={handleCloseAddOrderModal} onAddOrder={addOrder} microgreenVarieties={microgreenVarietyNames} clients={clients} initialData={reorderData} />}
      {isImportModalOpen && <ImportOrdersModal onClose={() => setIsImportModalOpen(false)} onImport={importOrders} microgreenVarietyNames={microgreenVarietyNames} />}
      {isImportVarietiesModalOpen && <ImportVarietiesModal
        onClose={() => setIsImportVarietiesModalOpen(false)}
        onImport={importVarieties}
        existingVarietyNames={microgreenVarietyNames}
      />}
      {isEditPOModalOpen && <EditPurchaseOrderModal
        onClose={handleCloseEditPOModal}
        onSave={editingPO ? updatePurchaseOrder : addPurchaseOrder}
        microgreenVarieties={microgreenVarietyNames}
        purchaseOrder={editingPO}
      />}
    </div>
  );
};

const AuthGate: React.FC = () => {
    const { currentUser } = useUser();
    return currentUser ? <AppContent /> : <LoginScreen />;
};

const App: React.FC = () => {
    return (
        <UserProvider>
            <AuthGate />
        </UserProvider>
    );
};

export default App;
