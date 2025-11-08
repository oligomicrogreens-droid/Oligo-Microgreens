
import type { AppView } from './App';
import { UserRole } from './types';

export const viewPermissions: Record<AppView, UserRole[]> = {
    dashboard: [UserRole.Admin, UserRole.Sales, UserRole.Production, UserRole.Logistics],
    orders: [UserRole.Admin, UserRole.Sales],
    'sowing-plan': [UserRole.Admin, UserRole.Production],
    sowing: [UserRole.Admin, UserRole.Production],
    'seed-inventory': [UserRole.Admin, UserRole.Production],
    'purchase-orders': [UserRole.Admin, UserRole.Production],
    'upcoming-harvests': [UserRole.Admin, UserRole.Production],
    harvesting: [UserRole.Admin, UserRole.Production],
    'harvesting-log': [UserRole.Admin, UserRole.Production],
    'waste-log': [UserRole.Admin, UserRole.Production],
    dispatch: [UserRole.Admin, UserRole.Logistics],
    delivery: [UserRole.Admin, UserRole.Logistics],
    'delivery-expenses': [UserRole.Admin, UserRole.Logistics],
    reports: [UserRole.Admin, UserRole.Sales],
    management: [UserRole.Admin],
};

export const canManageOrders = (role: UserRole) => [UserRole.Admin, UserRole.Sales].includes(role);

export const canSeeFinancials = (role: UserRole) => [UserRole.Admin, UserRole.Sales].includes(role);

export const canManageWasteLog = (role: UserRole) => [UserRole.Admin, UserRole.Production].includes(role);

export const canManageDeliveryExpenses = (role: UserRole) => [UserRole.Admin, UserRole.Logistics].includes(role);