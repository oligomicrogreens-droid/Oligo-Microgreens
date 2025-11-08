
export interface MicrogreenVariety {
  name: string;
  growthCycleDays: number;
}
export type MicrogreenVarietyName = string;

export type DeliveryMode = string;

export enum OrderStatus {
  Pending = 'Pending',
  Harvested = 'Harvested',
  Dispatched = 'Dispatched',
  Completed = 'Completed',
  Shortfall = 'Shortfall'
}

export interface OrderItem {
  variety: MicrogreenVarietyName;
  quantity: number; // Number of 50g boxes
}

export interface Order {
  id: string;
  clientName: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: Date;
  deliveryDate?: Date;
  deliveryMode?: DeliveryMode;
  actualHarvest?: OrderItem[];
  cashReceived?: number;
  remarks?: string;
  location?: string;
}

export type Inventory = Record<MicrogreenVarietyName, number>;

export type AggregatedHarvestList = Record<MicrogreenVarietyName, number>;

export interface ShortfallItem {
  orderId: string;
  clientName: string;
  variety: MicrogreenVarietyName;
  requested: number;
  allocated: number;
  shortfall: number;
}

export type ShortfallReport = ShortfallItem[];

export interface HarvestLogEntry {
    date: string; // YYYY-MM-DD
    trays: Record<MicrogreenVarietyName, number>;
}

export interface SeedInventoryItem {
  stockOnHand: number; // in grams
  reorderLevel: number; // in grams
  gramsPerTray: number;
  safetyStockBoxes?: number; // Desired minimum number of boxes to have available
}
export type SeedInventory = Record<MicrogreenVarietyName, SeedInventoryItem>;

export interface WeeklyForecastPrediction {
  variety: MicrogreenVarietyName;
  quantity: number;
}

export interface WeeklyForecast {
  week: string; // e.g., "Week 1"
  predictions: WeeklyForecastPrediction[];
}

export type ForecastData = WeeklyForecast[];

export interface YieldRatioData {
  variety: MicrogreenVarietyName;
  traysSown: number;
  boxesHarvested: number;
  yieldRatio: number | null;
}

export enum UserRole {
  Admin = 'Admin',
  Sales = 'Sales',
  Production = 'Production',
  Logistics = 'Logistics',
}

export interface User {
  name: string;
  role: UserRole;
}

export interface WasteLogEntry {
  id: string;
  date: Date;
  variety: MicrogreenVarietyName;
  traysWasted: number;
  reason: string;
}

export interface DeliveryExpense {
  id: string;
  date: Date;
  deliveryPerson: DeliveryMode;
  amount: number;
  remarks?: string;
}

export enum PurchaseOrderStatus {
  Draft = 'Draft',
  Ordered = 'Ordered',
  Received = 'Received',
  Cancelled = 'Cancelled',
}

export interface PurchaseOrderItem {
  variety: MicrogreenVarietyName;
  quantity: number; // in grams
  pricePerGram?: number;
}

export interface PurchaseOrder {
  id: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  status: PurchaseOrderStatus;
  createdAt: Date;
  orderedAt?: Date;
  receivedAt?: Date;
  totalCost?: number;
  notes?: string;
}

// FIX: Define and export the AppData interface to be used across the application.
export interface AppData {
    orders: Order[];
    microgreenVarieties: MicrogreenVariety[];
    deliveryModes: DeliveryMode[];
    inventory: Inventory;
    harvestingLog: Record<string, HarvestLogEntry>;
    seedInventory: SeedInventory;
    wasteLog: WasteLogEntry[];
    deliveryExpenses: DeliveryExpense[];
    purchaseOrders: PurchaseOrder[];
}