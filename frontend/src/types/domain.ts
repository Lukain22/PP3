import type { UserRole } from '../lib/auth';
import type { Category } from '../lib/categories';
import type { SlaStatus } from '../lib/sla';
import type { TicketStatus } from '../lib/ticketStatus';
import type { TicketType } from '../lib/ticketTypes';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: string | null;
  type: TicketType;
  group_id: number | null;
  group_name: string | null;
  sla_status: SlaStatus | null;
  created_at: string;
  category?: Category | null;
  subcategory?: string | null;
  sla_response_due?: string | null;
  sla_resolution_due?: string | null;
  updated_at?: string;
  user_id?: number;
  user_email?: string;
  technician_id?: number | null;
  technician_email?: string | null;
  seen?: number | boolean;
}

export interface Comment {
  id: number;
  content: string;
  created_at: string;
  user_id: number;
  email: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string | null;
  is_default?: number;
  created_at?: string;
  technicians?: { id: number; email: string }[];
}

export interface User {
  id: number;
  email: string;
  role: UserRole;
  created_at: string;
  groups?: Group[];
}

export interface TicketHistoryEntry {
  id: number;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  email: string;
}

export interface SlaPolicy {
  priority: string;
  response_hours: number;
  resolution_hours: number;
}
