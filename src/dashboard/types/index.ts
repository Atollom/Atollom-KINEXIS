// src/dashboard/types/index.ts

export type UserRole = 'owner' | 'admin' | 'warehouse' | 'contador' | 'viewer';

export interface TenantUser {
  id: string;
  tenant_id: string;
  role: UserRole;
  name: string;
  email: string;
}

export type Platform = 'ml' | 'amazon' | 'shopify' | 'b2b';
export type OrderStatus = 'DRAFT' | 'APPROVED' | 'SENT' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  external_id?: string;
  platform: Platform;
  status: OrderStatus;
  total: number;
  customer_name: string;
  customer_rfc?: string;
  tracking_number?: string;
  created_at: string;
}

export type StockStatus = 'ok' | 'warning' | 'critical' | 'out';

export interface InventoryItem {
  sku: string;
  name: string;
  stock: number;
  days_remaining: number;
  status: StockStatus;
}

export type AgentStatus = 'active' | 'idle' | 'error' | 'paused';
export type AutonomyLevel = 'FULL' | 'NOTIFY' | 'SUPERVISED' | 'HUMAN_REQUIRED' | 'PAUSED';

export interface Agent {
  agent_id: string;
  name: string;
  module: string;
  status: AgentStatus;
  autonomy: AutonomyLevel;
  last_run?: string;
  success_rate: number;
}

export type CFDIType = 'I' | 'E' | 'P';
export type CFDIStatus = 'TIMBRADO' | 'ERROR_PAC' | 'ERROR_VALIDACION' | 'CANCELADO' | 'CANCELACION_PENDIENTE';

export interface CFDI {
  uuid: string;
  folio: string;
  cfdi_type: CFDIType;
  status: CFDIStatus;
  total: number;
  customer_rfc: string;
  timbrado_at: string;
}

export interface DashboardKPIs {
  orders_today: number;
  pending_to_pick: number;
  critical_stock_count: number;
  active_agents: number;
  revenue_today: number;
  cfdi_pending: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  ts: string;
}

export type ChatContext = 'full' | 'warehouse' | 'fiscal';

export interface Notification {
  id: string;
  type: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}
