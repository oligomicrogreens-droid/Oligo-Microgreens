import React, { useMemo } from 'react';
import type { Order } from '../types';
import { OrderStatus } from '../types';
import { ArrowTrendingDownIcon, InformationCircleIcon, ArrowDownTrayIcon } from './icons';
import { downloadCSV } from '../utils/csv';

interface ClientEngagementReportProps {
  orders: Order[];
  onShowHistory: (clientName: string) => void;
}

interface EngagementData {
  clientName: string;
  lastMonthBoxes: number;
  thisMonthBoxes: number;
  percentChange: number;
}

const REDUCTION_THRESHOLD = 0.25; // 25% drop

const ClientEngagementReport: React.FC<ClientEngagementReportProps> = ({ orders, onShowHistory }) => {
  const reportData = useMemo(() => {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const thisMonthOrders = orders.filter(o => o.createdAt >= startOfThisMonth && o.status === OrderStatus.Completed);
    const lastMonthOrders = orders.filter(o => o.createdAt >= startOfLastMonth && o.createdAt <= endOfLastMonth && o.status === OrderStatus.Completed);
    
    const lastMonthSales: Record<string, number> = {};
    lastMonthOrders.forEach(order => {
      const total = order.items.reduce((sum, item) => sum + item.quantity, 0);
      lastMonthSales[order.clientName] = (lastMonthSales[order.clientName] || 0) + total;
    });

    const thisMonthSales: Record<string, number> = {};
    thisMonthOrders.forEach(order => {
      const total = order.items.reduce((sum, item) => sum + item.quantity, 0);
      thisMonthSales[order.clientName] = (thisMonthSales[order.clientName] || 0) + total;
    });

    const noOrdersThisMonth: EngagementData[] = [];
    const reducedOrders: EngagementData[] = [];
    
    Object.keys(lastMonthSales).forEach(clientName => {
      const lastMonthBoxes = lastMonthSales[clientName];
      const thisMonthBoxes = thisMonthSales[clientName] || 0;

      if (thisMonthBoxes === 0) {
        noOrdersThisMonth.push({
          clientName,
          lastMonthBoxes,
          thisMonthBoxes: 0,
          percentChange: -1, // 100% drop
        });
      } else {
        const percentChange = (thisMonthBoxes - lastMonthBoxes) / lastMonthBoxes;
        if (percentChange < -REDUCTION_THRESHOLD) {
          reducedOrders.push({
            clientName,
            lastMonthBoxes,
            thisMonthBoxes,
            percentChange,
          });
        }
      }
    });

    return { noOrdersThisMonth, reducedOrders };
  }, [orders]);
  
  const handleExport = () => {
    const dataToExport = [
        ...reportData.noOrdersThisMonth.map(d => ({
            client_name: d.clientName,
            status: 'High Priority (No Orders)',
            last_month_boxes: d.lastMonthBoxes,
            this_month_boxes: d.thisMonthBoxes,
            change: '-100%',
        })),
        ...reportData.reducedOrders.map(d => ({
            client_name: d.clientName,
            status: 'Watch List (Reduced Orders)',
            last_month_boxes: d.lastMonthBoxes,
            this_month_boxes: d.thisMonthBoxes,
            change: `${(d.percentChange * 100).toFixed(0)}%`,
        })),
    ];
    if (dataToExport.length === 0) {
        alert("No clients to export.");
        return;
    }
    downloadCSV(dataToExport, `client_engagement_report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const hasData = reportData.noOrdersThisMonth.length > 0 || reportData.reducedOrders.length > 0;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <ArrowTrendingDownIcon className="w-6 h-6 text-red-500" />
          Client Engagement Report
        </h3>
        <button
            onClick={handleExport}
            disabled={!hasData}
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600"
        >
            <ArrowDownTrayIcon className="w-5 h-5"/>
            Export List
        </button>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
        Clients who ordered last month but have reduced or stopped ordering this month. This is a list of potential clients to follow up with.
      </p>

      {!hasData ? (
        <div className="text-center py-10 text-slate-500 dark:text-slate-400">
            <h4 className="font-semibold text-lg">All clients are engaged!</h4>
            <p className="mt-1">No clients from last month have significantly reduced their orders this month.</p>
        </div>
      ) : (
        <div className="space-y-8">
            {/* High Priority Section */}
            {reportData.noOrdersThisMonth.length > 0 && (
                 <div>
                    <h4 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">High Priority: No Orders This Month</h4>
                    <div className="space-y-3">
                        {reportData.noOrdersThisMonth.map(data => (
                            <div key={data.clientName} className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                <span className="font-bold text-slate-800 dark:text-white">{data.clientName}</span>
                                <div className="flex items-center gap-4">
                                    <div className="text-sm text-center">
                                        <p className="font-semibold">{data.lastMonthBoxes}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Last Month</p>
                                    </div>
                                    <p className="font-bold text-red-500 text-xl">→</p>
                                    <div className="text-sm text-center">
                                        <p className="font-semibold">0</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">This Month</p>
                                    </div>
                                </div>
                                <button onClick={() => onShowHistory(data.clientName)} className="text-sm text-blue-600 hover:underline dark:text-blue-400 font-semibold px-3 py-1 rounded-full bg-white dark:bg-slate-700 hover:bg-slate-100">View History</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
           
            {/* Watch List Section */}
            {reportData.reducedOrders.length > 0 && (
                <div>
                    <h4 className="text-lg font-semibold text-yellow-600 dark:text-yellow-400 mb-3">Watch List: Reduced Orders ({`>${REDUCTION_THRESHOLD * 100}% Drop`})</h4>
                     <div className="space-y-3">
                        {reportData.reducedOrders.map(data => (
                            <div key={data.clientName} className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                <span className="font-bold text-slate-800 dark:text-white">{data.clientName}</span>
                                <div className="flex items-center gap-4">
                                    <div className="text-sm text-center">
                                        <p className="font-semibold">{data.lastMonthBoxes}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Last Month</p>
                                    </div>
                                    <p className="font-bold text-yellow-500 text-xl">→</p>
                                    <div className="text-sm text-center">
                                        <p className="font-semibold">{data.thisMonthBoxes}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">This Month</p>
                                    </div>
                                    <span className="text-sm font-bold text-red-500">({(data.percentChange * 100).toFixed(0)}%)</span>
                                </div>
                                <button onClick={() => onShowHistory(data.clientName)} className="text-sm text-blue-600 hover:underline dark:text-blue-400 font-semibold px-3 py-1 rounded-full bg-white dark:bg-slate-700 hover:bg-slate-100">View History</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default ClientEngagementReport;
