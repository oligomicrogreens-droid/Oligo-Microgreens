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