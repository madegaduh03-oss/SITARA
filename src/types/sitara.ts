export type UserRole = 'petugas' | 'admin' | 'pimpinan';

export type QueueStatus = 'waiting' | 'called' | 'completed' | 'skipped';

export type ActiveModule = 'kiosk' | 'monitor' | 'internal' | 'sql';

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: UserRole;
  full_name: string;
}

export interface Service {
  id: number;
  service_name: string;
  description: string;
  icon:
    | 'id-card'
    | 'users'
    | 'baby'
    | 'smartphone'
    | 'file-text'
    | 'building'
    | 'clipboard-check'
    | 'shield-check';
  is_active: boolean;
}

export interface Counter {
  id: number;
  counter_name: string;
  status: 'idle' | 'serving';
  current_queue_id: string | null;
  is_active: boolean;
}

export interface QueueItem {
  id: string;
  queue_date: string; // YYYY-MM-DD
  queue_number: string; // "01", "02", ...
  service_id: number;
  status: QueueStatus;
  counter_id: number | null;
  created_at: string;
  called_at: string | null;
  completed_at: string | null;
}

export interface Settings {
  id: number;
  logo_url: string;
  header_text: string;
  subheader_text: string;
  total_counters: number; // 2 to 5
  active_date: string; // YYYY-MM-DD (supports date simulation for auto-reset test)
}

export interface CallEvent {
  event_id: string;
  queue_id: string;
  queue_number: string;
  service_name: string;
  counter_id: number;
  counter_name: string;
  timestamp: number;
}
