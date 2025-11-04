import React, { useMemo } from 'react';
import type { Order, HarvestLogEntry } from '../types';
import { OrderStatus } from '../types';
import type { AppView } from '../App';
import { PackageIcon, LeafIcon, TruckIcon, CalendarDaysIcon, PlusIcon } from './icons';
import OrderStatusBadge from './OrderStatusBadge';
import DemandForecast from './DemandForecast';
import YieldRatioReport from './YieldRatioReport';

interface HomeDashboardProps {
    orders: Order[];
    harvestingLog: Record<string, HarvestLogEntry>;
    setCurrentView: (view: AppView) => void;
    onAddOrder: () => void;
}

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; description: string }> = ({ title, value, icon, description }) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md flex items-start space-x-4">
        <div className="flex-shrink-0 bg-green-100 dark:bg-gray-700 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
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
            .filter(o => o.status === OrderStatus.Pending)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); // oldest first
        
        const deliveriesToday = orders.filter(o => isSameDay(o.deliveryDate, today));
        const deliveriesTomorrow = orders.filter(o => isSameDay(o.deliveryDate, tomorrow));
        const activeDispatches = orders.filter(o => o.status === OrderStatus.Dispatched);
        
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
    
    return (
        <div className="space-y-8">
            {/* Header and Quick Actions */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onAddOrder}
                        className="flex items-center justify-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900 transition-colors duration-300"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add New Order
                    </button>
                    <button 
                        onClick={() => setCurrentView('harvesting')}
                        className="flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 font-semibold rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900 transition-colors duration-300"
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
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Upcoming Deliveries (Next 7 Days)</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {dashboardData.upcomingDeliveries.length > 0 ? (
                            dashboardData.upcomingDeliveries.map(order => (
                                <div key={order.id} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">{order.clientName}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{order.deliveryDate?.toLocaleDateString()}</p>
                                    </div>
                                    <OrderStatusBadge status={order.status} />
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-10">No upcoming deliveries.</div>
                        )}
                    </div>
                </div>

                {/* Pending Orders */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Pending Orders Queue</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {dashboardData.pendingOrders.length > 0 ? (
                            dashboardData.pendingOrders.map(order => (
                                <div key={order.id} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-white">{order.clientName}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Created: {order.createdAt.toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-white">{order.items.reduce((sum, item) => sum + item.quantity, 0)} boxes</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-10">No pending orders.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Demand Forecast */}
            <DemandForecast orders={orders} />

            {/* Yield Ratio Analysis */}
            <YieldRatioReport orders={orders} harvestingLog={harvestingLog} />
        </div>
    );
};

export default HomeDashboard;