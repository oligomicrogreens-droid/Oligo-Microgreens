
import React from 'react';
import { OrderStatus } from '../types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const statusStyles: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  [OrderStatus.Harvested]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  [OrderStatus.Dispatched]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  [OrderStatus.Completed]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  [OrderStatus.Shortfall]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusStyles[status]}`}>
      {status}
    </span>
  );
};

export default OrderStatusBadge;
