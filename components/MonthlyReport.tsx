
import React, { useState, useMemo } from 'react';
import type { Order, HarvestLogEntry, PurchaseOrder, SeedInventory } from '../types';
import { OrderStatus, UserRole } from '../types';
import { ChartBarIcon, TruckIcon, ArrowDownTrayIcon, BanknotesIcon } from './icons';
import { downloadCSV } from '../utils/csv';
import { useUser } from '../contexts/UserContext';
import { canSeeFinancials } from '../permissions';
import ClientEngagementReport from './ClientEngagementReport';
import LocationSalesReport from './LocationSalesReport';
import SeedToSaleReport from './SeedToSaleReport';

interface ReportsDashboardProps {
  orders: Order[];
  harvestingLog: Record<string, HarvestLogEntry>;
  onShowHistory: (clientName: string) => void;
  purchaseOrders: PurchaseOrder[];
  seedInventory: SeedInventory;
}

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

const StatCard: React.FC<{ title: string; value: string | number; description: string, icon?: React.ReactNode }> = ({ title, value, description, icon }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg flex items-start">
        <div className="flex-grow">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{title}</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        {icon && <div className="flex-shrink-0 text-slate-400 dark:text-slate-500">{icon}</div>}
    </div>
);

const toInputDateString = (date: Date, type: 'date' | 'week' | 'month' | 'year'): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    if (type === 'year') return String(year);
    if (type === 'month') return `${year}-${month}`;
    if (type === 'week') {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    }
    // 'date'
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getWeekNumber = (date: Date): [number, number] => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return [d.getUTCFullYear(), weekNo];
};

const statusColors: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: 'bg-yellow-400',
  [OrderStatus.Harvested]: 'bg-blue-400',
  [OrderStatus.Dispatched]: 'bg-indigo-400',
  [OrderStatus.Completed]: 'bg-green-500',
  [OrderStatus.Shortfall]: 'bg-red-500',
};

const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ orders, harvestingLog, onShowHistory, purchaseOrders, seedInventory }) => {
  const { currentUser } = useUser();
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [selectedDateValue, setSelectedDateValue] = useState(() => toInputDateString(new Date(), 'month'));
  const showFinancials = useMemo(() => canSeeFinancials(currentUser?.role || UserRole.Logistics), [currentUser]);

  const { filteredOrders, periodLabel } = useMemo(() => {
    let filtered: Order[] = [];
    let label = '';
    
    switch(period) {
        case 'daily': {
            const date = new Date(selectedDateValue + 'T00:00:00');
            label = `for ${date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`;
            filtered = orders.filter(order => new Date(order.createdAt).toDateString() === date.toDateString());
            break;
        }
        case 'weekly': {
            const [year, week] = selectedDateValue.split('-W').map(Number);
            label = `for Week ${week}, ${year}`;
            filtered = orders.filter(order => {
                const [oYear, oWeek] = getWeekNumber(new Date(order.createdAt));
                return oYear === year && oWeek === week;
            });
            break;
        }
        case 'monthly': {
            const [year, month] = selectedDateValue.split('-').map(Number);
            label = `for ${new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`;
            filtered = orders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate.getFullYear() === year && orderDate.getMonth() + 1 === month;
            });
            break;
        }
        case 'yearly': {
            const year = Number(selectedDateValue);
            label = `for ${year}`;
            filtered = orders.filter(order => new Date(order.createdAt).getFullYear() === year);
            break;
        }
    }
    return { filteredOrders: filtered, periodLabel: label };
  }, [orders, period, selectedDateValue]);

  const reportData = useMemo(() => {
    const totalOrders = filteredOrders.length;
    if (totalOrders === 0) {
      return { totalOrders: 0, totalBoxes: 0, completedOrders: 0, shortfallOrders: 0, varietyCount: {}, orderStatusCount: {}, topClients: [], totalShortfallBoxes: 0, deliveryModeCount: {}, totalCashReceived: 0 };
    }

    let totalBoxes = 0;
    let totalShortfallBoxes = 0;
    let totalCashReceived = 0;
    const varietyCount: Record<string, number> = {};
    const clientSales: Record<string, number> = {};
    const deliveryModeCount: Record<string, number> = {};
    const orderStatusCount = { ...Object.values(OrderStatus).reduce((acc, status) => ({...acc, [status]: 0 }), {} as Record<OrderStatus, number>)};

    filteredOrders.forEach(order => {
        orderStatusCount[order.status]++;
        if (order.deliveryMode && (order.status === OrderStatus.Dispatched || order.status === OrderStatus.Completed)) {
            deliveryModeCount[order.deliveryMode] = (deliveryModeCount[order.deliveryMode] || 0) + 1;
        }

        if (order.status === OrderStatus.Completed && order.cashReceived != null) {
            totalCashReceived += order.cashReceived;
        }

        const items = order.actualHarvest || order.items;
        const currentOrderBoxes = items.reduce((sum: number, item) => sum + Number(item.quantity), 0);
        totalBoxes += currentOrderBoxes;
        clientSales[order.clientName] = (clientSales[order.clientName] || 0) + currentOrderBoxes;

        items.forEach(item => {
            varietyCount[item.variety] = (varietyCount[item.variety] || 0) + Number(item.quantity);
        });

        if (order.actualHarvest) {
            const requestedMap = new Map(order.items.map(i => [i.variety, i.quantity]));
            order.actualHarvest.forEach(harvested => {
                const requested = requestedMap.get(harvested.variety) || 0;
                if (Number(requested) > Number(harvested.quantity)) {
                    totalShortfallBoxes += Number(requested) - Number(harvested.quantity);
                }
            });
        }
    });

    const topClients = Object.entries(clientSales).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, boxes]) => ({ name, boxes }));

    return { totalOrders, totalBoxes, completedOrders: orderStatusCount[OrderStatus.Completed], shortfallOrders: orderStatusCount[OrderStatus.Shortfall], varietyCount, orderStatusCount, topClients, totalShortfallBoxes, deliveryModeCount, totalCashReceived };
  }, [filteredOrders]);

  const handlePeriodChange = (newPeriod: ReportPeriod) => {
    setPeriod(newPeriod);
    const inputType = newPeriod === 'yearly' ? 'year' : newPeriod === 'daily' ? 'date' : newPeriod;
    setSelectedDateValue(toInputDateString(new Date(), inputType as any));
  };
  
  const handleExport = () => {
    if (filteredOrders.length === 0) {
        alert(`No data to export for the selected period.`);
        return;
    }
    const filename = `report_${period}_${selectedDateValue.replace('-W', '_week_')}.csv`;
    downloadCSV(filteredOrders, filename);
  };
  
  const maxVarietyValue = Math.max(1, ...Object.values(reportData.varietyCount).map(v => Number(v)));

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Reports Dashboard</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                {(['daily', 'weekly', 'monthly', 'yearly'] as ReportPeriod[]).map(p => (
                    <button key={p} onClick={() => handlePeriodChange(p)} className={`px-3 py-1 text-sm font-semibold rounded-md capitalize transition-colors ${period === p ? 'bg-white dark:bg-slate-800 shadow text-green-600' : 'text-slate-600 dark:text-slate-300'}`}>
                        {p}
                    </button>
                ))}
              </div>
              
              {period === 'yearly' ? (
                 <input type="number" value={selectedDateValue} onChange={(e) => setSelectedDateValue(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm w-full sm:w-auto" />
              ) : (
                 <input type={period === 'daily' ? 'date' : period} value={selectedDateValue} onChange={(e) => setSelectedDateValue(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm w-full sm:w-auto" />
              )}
              
              <button onClick={handleExport} className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600 dark:focus:ring-offset-slate-800">
                  <ArrowDownTrayIcon className="w-5 h-5"/>
                  <span className="hidden sm:inline">Export</span>
              </button>
          </div>
        </div>
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${showFinancials ? 'lg:grid-cols-3 xl:grid-cols-5' : 'lg:grid-cols-2 xl:grid-cols-4'}`}>
          <StatCard title="Total Orders" value={reportData.totalOrders} description={periodLabel} />
          <StatCard title="Total Boxes Sold" value={reportData.totalBoxes} description="50g boxes" />
          {showFinancials && <StatCard title="Total Cash Received" value={`₹${reportData.totalCashReceived.toFixed(2)}`} description="From completed orders" icon={<BanknotesIcon className="w-8 h-8"/>} />}
          <StatCard title="Completed Orders" value={reportData.completedOrders} description={`${Math.round((reportData.completedOrders / (reportData.totalOrders || 1)) * 100)}% completion`} />
          <StatCard title="Shortfall Orders" value={reportData.shortfallOrders} description={`${reportData.totalShortfallBoxes} boxes short`} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Sales by Variety</h3>
          {Object.keys(reportData.varietyCount).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(reportData.varietyCount).sort((a,b) => Number(b[1]) - Number(a[1])).map(([variety, count]) => (
                <div key={variety} className="flex items-center gap-4 text-sm">
                  <span className="w-32 text-slate-600 dark:text-slate-300 truncate font-medium">{variety}</span>
                  <div className="flex-grow bg-slate-200 dark:bg-slate-700 rounded-full h-5">
                      <div className="bg-green-500 h-5 rounded-full text-right px-2 text-black dark:text-white font-bold text-xs flex items-center justify-end" style={{ width: `${(Number(count) / maxVarietyValue) * 100}%`}}>
                          {count}
                      </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (<p className="text-center text-slate-500 dark:text-slate-400 py-10">No sales data for this period.</p>)}
        </div>
        
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Order Status Breakdown</h3>
          {reportData.totalOrders > 0 ? (
             <ul className="space-y-3">
               {Object.entries(reportData.orderStatusCount).map(([status, count]) => (
                 <li key={status} className="flex items-center text-sm">
                   <span className={`w-3 h-3 rounded-full mr-3 ${statusColors[status as OrderStatus]}`}></span>
                   <span className="font-medium text-slate-700 dark:text-slate-300 w-28">{status}</span>
                   <span className="font-semibold text-slate-800 dark:text-white mr-2">{count}</span>
                   <span className="text-slate-500 dark:text-slate-400">({((Number(count) / reportData.totalOrders) * 100).toFixed(1)}%)</span>
                 </li>
               ))}
             </ul>
          ) : (<p className="text-center text-slate-500 dark:text-slate-400 py-10">No orders to analyze.</p>)}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Top Clients {periodLabel}</h3>
          {reportData.topClients.length > 0 ? (
            <ol className="space-y-3">
              {reportData.topClients.map((client, index) => (
                <li key={client.name} className="flex items-center gap-4 text-sm">
                  <span className="text-lg font-bold text-slate-400 dark:text-slate-500 w-5">#{index+1}</span>
                  <span className="font-semibold text-slate-800 dark:text-white flex-grow">{client.name}</span>
                  <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg">{client.boxes} boxes</span>
                </li>
              ))}
            </ol>
          ) : (<p className="text-center text-slate-500 dark:text-slate-400 py-10">No client sales data.</p>)}
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Deliveries by Mode {periodLabel}</h3>
          {Object.keys(reportData.deliveryModeCount).length > 0 ? (
            <ul className="space-y-3">
              {Object.entries(reportData.deliveryModeCount)
                .sort(([, a], [, b]) => Number(b) - Number(a))
                .map(([mode, count]) => (
                <li key={mode} className="flex items-center gap-4 text-sm">
                    <TruckIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <span className="font-semibold text-slate-800 dark:text-white flex-grow">{mode}</span>
                  <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg">{count} deliveries</span>
                </li>
              ))}
            </ul>
          ) : (<p className="text-center text-slate-500 dark:text-slate-400 py-10">No delivery data.</p>)}
        </div>
      </div>
      
      <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700 space-y-8">
        <SeedToSaleReport 
          orders={orders}
          purchaseOrders={purchaseOrders}
          seedInventory={seedInventory}
          harvestingLog={harvestingLog}
        />
        <LocationSalesReport orders={orders} />
        <ClientEngagementReport orders={orders} onShowHistory={onShowHistory} />
      </div>

    </div>
  );
};

export default ReportsDashboard;
