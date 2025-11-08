
import React, { useMemo } from 'react';
import type { Order, HarvestLogEntry } from '../types';
import { OrderStatus } from '../types';
import type { AppView } from '../App';
import { PackageIcon, LeafIcon, TruckIcon, CalendarDaysIcon, PlusIcon, ChartBarIcon } from './icons';
import OrderStatusBadge from './OrderStatusBadge';
import YieldRatioReport from './YieldRatioReport';

interface HomeDashboardProps {
    orders: Order[];
    harvestingLog: Record<string, HarvestLogEntry>;
    setCurrentView: (view: AppView) => void;
    onAddOrder: () => void;
}

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; description: string }> = ({ title, value, icon, description }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg flex items-start space-x-4">
        <div className="flex-shrink-0 bg-green-100 dark:bg-slate-700 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-white">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        </div>
    </div>
);

const HomeDashboard: React.FC<HomeDashboardProps> = ({ orders, harvestingLog, setCurrentView, onAddOrder }) => {
    const dashboardData = useMemo(() => {
        const isSameDay = (d1?: Date, d2?: Date) => {
            if (!d1 || !d2) return false;
            return d1.getFullYear() === d2.getFullYear() &&
                   d1.getMonth() === d2.getMonth() &&
                   d1.getDate() === d2.getDate();
        };

        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOf7thDay = new Date(startOfToday);
        endOf7thDay.setDate(startOfToday.getDate() + 7);

        const pendingOrders = orders
            .filter(o => o.status === 'Pending')
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); // oldest first
        
        const deliveriesToday = orders.filter(o => isSameDay(o.deliveryDate, today));
        const deliveriesTomorrow = orders.filter(o => isSameDay(o.deliveryDate, tomorrow));
        const activeDispatches = orders.filter(o => o.status === 'Dispatched');
        
        const upcomingDeliveries = orders.filter(o => 
            o.deliveryDate && new Date(o.deliveryDate) >= startOfToday && new Date(o.deliveryDate) < endOf7thDay
        ).sort((a,b) => a.deliveryDate!.getTime() - b.deliveryDate!.getTime());

        return {
            pendingOrdersCount: pendingOrders.length,
            deliveriesTodayCount: deliveriesToday.length,
            deliveriesTomorrowCount: deliveriesTomorrow.length,
            activeDispatchesCount: activeDispatches.length,
            upcomingDeliveries,
            pendingOrders,
        };
    }, [orders]);

    const topSellingVarieties = useMemo(() => {
        const sales: Record<string, number> = {};

        orders
            .filter(o => o.status === OrderStatus.Completed || o.status === OrderStatus.Dispatched || o.status === OrderStatus.Shortfall)
            .forEach(order => {
                if (order.actualHarvest) {
                    order.actualHarvest.forEach(item => {
                        sales[item.variety] = (sales[item.variety] || 0) + item.quantity;
                    });
                }
            });

        return Object.entries(sales)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5) // Top 5
            .map(([variety, totalBoxes]) => ({ variety, totalBoxes }));
    }, [orders]);
    
    return (
        <div className="space-y-8">
            {/* Header and Quick Actions */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onAddOrder}
                        className="flex items-center justify-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-slate-900 transition-colors duration-300"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add New Order
                    </button>
                    <button 
                        onClick={() => setCurrentView('harvesting')}
                        className="flex items-center justify-center px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 font-semibold rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-slate-900 transition-colors duration-300"
                    >
                        <LeafIcon className="w-5 h-5 mr-2" />
                        Go to Harvesting
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Pending Orders" 
                    value={dashboardData.pendingOrdersCount}
                    description="Awaiting harvest"
                    icon={<PackageIcon className="w-6 h-6 text-yellow-600" />}
                />
                <StatCard 
                    title="Deliveries for Today" 
                    value={dashboardData.deliveriesTodayCount}
                    description="Scheduled for today"
                    icon={<CalendarDaysIcon className="w-6 h-6 text-blue-600" />}
                />
                 <StatCard 
                    title="Deliveries for Tomorrow" 
                    value={dashboardData.deliveriesTomorrowCount}
                    description="Scheduled for tomorrow"
                    icon={<CalendarDaysIcon className="w-6 h-6 text-indigo-600" />}
                />
                <StatCard 
                    title="Active Dispatches" 
                    value={dashboardData.activeDispatchesCount}
                    description="Out for delivery"
                    icon={<TruckIcon className="w-6 h-6 text-green-600" />}
                />
            </div>
            
            {/* Lists Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upcoming Deliveries */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Upcoming Deliveries (Next 7 Days)</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {dashboardData.upcomingDeliveries.length > 0 ? (
                            dashboardData.upcomingDeliveries.map(order => (
                                <div key={order.id} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-white">{order.clientName}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{order.deliveryDate?.toLocaleDateString()}</p>
                                    </div>
                                    <OrderStatusBadge status={order.status} />
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-slate-500 dark:text-slate-400 py-10">No upcoming deliveries.</div>
                        )}
                    </div>
                </div>

                {/* Pending Orders */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Pending Orders Queue</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {dashboardData.pendingOrders.length > 0 ? (
                            dashboardData.pendingOrders.map(order => (
                                <div key={order.id} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-white">{order.clientName}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Created: {order.createdAt.toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-white">{order.items.reduce((sum, item) => sum + item.quantity, 0)} boxes</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-slate-500 dark:text-slate-400 py-10">No pending orders.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <ChartBarIcon className="w-6 h-6 text-blue-500"/>
                        Top Selling Varieties
                    </h2>
                    <div className="space-y-4">
                        {topSellingVarieties.length > 0 ? (
                            topSellingVarieties.map(({ variety, totalBoxes }) => (
                                <div key={variety} className="flex items-center text-sm">
                                    <span className="w-2/5 font-semibold text-slate-700 dark:text-slate-300 truncate">{variety}</span>
                                    <div className="w-3/5 flex items-center gap-3">
                                        <div className="flex-grow bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                            <div 
                                                className="bg-blue-500 h-2.5 rounded-full" 
                                                style={{ width: `${(totalBoxes / (topSellingVarieties[0].totalBoxes || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="font-mono font-bold text-slate-800 dark:text-white w-8 text-right">{totalBoxes}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-slate-500 dark:text-slate-400 py-10">
                                <p>No sales data available yet.</p>
                                <p className="text-xs">Complete some orders to see your top sellers.</p>
                            </div>
                        )}
                    </div>
                </div>
                <YieldRatioReport orders={orders} harvestingLog={harvestingLog} />
            </div>
        </div>
    );
};

export default HomeDashboard;
