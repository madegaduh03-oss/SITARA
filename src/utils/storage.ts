import { DEFAULT_LOGO_DATA_URI } from '../data/sqlSchema';
import { CallEvent, Counter, QueueItem, Service, Settings, User } from '../types/sitara';

export const STORAGE_KEYS = {
  USERS: 'sitara_users',
  SERVICES: 'sitara_services',
  COUNTERS: 'sitara_counters',
  QUEUES: 'sitara_queues',
  SETTINGS: 'sitara_settings',
  CALL_EVENT: 'sitara_call_event',
  SESSION_USER: 'sitara_session_user',
  INITIALIZED: 'sitara_initialized_v21',
} as const;

export const SYNC_EVENT_NAME = 'sitara:local-sync';
export const BROADCAST_CHANNEL_NAME = 'sitara_realtime_channel';

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(baseISO: string, deltaDays: number): string {
  const [y, m, d] = baseISO.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  const ny = dt.getFullYear();
  const nm = String(dt.getMonth() + 1).padStart(2, '0');
  const nd = String(dt.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

export function formatIndonesianDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dt);
}

export function formatShortTime(isoTimestamp: string): string {
  const dt = new Date(isoTimestamp);
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(dt);
}

const DEFAULT_USERS: User[] = [
  { id: 1, username: 'petugas', password_hash: '12345', role: 'petugas', full_name: 'Petugas Pelayanan' },
  { id: 2, username: 'admin', password_hash: '12345', role: 'admin', full_name: 'Administrator Sistem' },
  { id: 3, username: 'pimpinan', password_hash: '12345', role: 'pimpinan', full_name: 'Camat Tulangan' },
];

const DEFAULT_SERVICES: Service[] = [
  {
    id: 1,
    service_name: 'KTP-el',
    description: 'Perekaman baru, cetak ulang, atau perubahan data KTP Elektronik',
    icon: 'id-card',
    is_active: true,
  },
  {
    id: 2,
    service_name: 'KK',
    description: 'Pembuatan Kartu Keluarga baru, pisah KK, atau pemutakhiran data',
    icon: 'users',
    is_active: true,
  },
  {
    id: 3,
    service_name: 'KIA',
    description: 'Penerbitan Kartu Identitas Anak untuk warga usia 0–17 tahun',
    icon: 'baby',
    is_active: true,
  },
  {
    id: 4,
    service_name: 'Aktivasi IKD',
    description: 'Aktivasi & verifikasi Identitas Kependudukan Digital di ponsel',
    icon: 'smartphone',
    is_active: true,
  },
  {
    id: 5,
    service_name: 'Layanan Lainnya',
    description: 'Surat keterangan pindah, legalisir dokumen, dan layanan umum',
    icon: 'file-text',
    is_active: true,
  },
];

const DEFAULT_COUNTERS: Counter[] = [
  { id: 1, counter_name: 'Loket 1', status: 'idle', current_queue_id: null, is_active: true },
  { id: 2, counter_name: 'Loket 2', status: 'idle', current_queue_id: null, is_active: true },
  { id: 3, counter_name: 'Loket 3', status: 'idle', current_queue_id: null, is_active: true },
  { id: 4, counter_name: 'Loket 4', status: 'idle', current_queue_id: null, is_active: true },
  { id: 5, counter_name: 'Loket 5', status: 'idle', current_queue_id: null, is_active: false },
];

function createDefaultSettings(): Settings {
  return {
    id: 1,
    logo_url: DEFAULT_LOGO_DATA_URI,
    header_text: 'SITARA',
    subheader_text: 'Sistem Informasi Antrean Kecamatan Tulangan',
    total_counters: 4,
    active_date: getTodayISO(),
  };
}

/**
 * Generates 50 realistic dummy queue transactions spread across the last 14 days:
 * - 47 completed records distributed across days -13 to -1 (realistic Kecamatan Tulangan volume)
 * - 3 waiting records for today (01, 02, 03) so Petugas can immediately test calling
 */
function generateDummyQueues(todayISO: string): QueueItem[] {
  const queues: QueueItem[] = [];
  // Deterministic realistic service distribution: KTP-el (1), KK (2), KIA (3), IKD (4), Lainnya (5)
  const weightedServices = [1, 1, 2, 2, 1, 4, 3, 2, 5, 1, 4, 2, 1, 3, 5];

  // Spread 47 past records over days -13 .. -1
  let totalPast = 0;
  for (let offset = -13; offset <= -1; offset++) {
    const dateISO = addDaysISO(todayISO, offset);
    // 3 or 4 transactions per day -> sum over 13 days = 47
    const countForDay = offset % 3 === 0 ? 3 : 4;
    let dayNum = 1;

    for (let i = 0; i < countForDay && totalPast < 47; i++) {
      const serviceId = weightedServices[(totalPast + i) % weightedServices.length];
      const counterId = ((totalPast + i) % 4) + 1;
      const numStr = String(dayNum).padStart(2, '0');
      const hour = 8 + Math.floor(i * 1.3);
      const minute = (i * 17 + 10) % 60;
      const createdAt = `${dateISO}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
      const calledAt = `${dateISO}T${String(hour).padStart(2, '0')}:${String(Math.min(59, minute + 4)).padStart(2, '0')}:00`;
      const completedAt = `${dateISO}T${String(hour).padStart(2, '0')}:${String(Math.min(59, minute + 12)).padStart(2, '0')}:00`;

      queues.push({
        id: `q-${dateISO}-${numStr}`,
        queue_date: dateISO,
        queue_number: numStr,
        service_id: serviceId,
        status: 'completed',
        counter_id: counterId,
        created_at: createdAt,
        called_at: calledAt,
        completed_at: completedAt,
      });

      dayNum++;
      totalPast++;
    }
  }

  // Ensure exact 47 past items if loop ended slightly short
  let extraNum = 5;
  while (totalPast < 47) {
    const dateISO = addDaysISO(todayISO, -1);
    const numStr = String(extraNum++).padStart(2, '0');
    queues.push({
      id: `q-${dateISO}-${numStr}`,
      queue_date: dateISO,
      queue_number: numStr,
      service_id: weightedServices[totalPast % weightedServices.length],
      status: 'completed',
      counter_id: (totalPast % 4) + 1,
      created_at: `${dateISO}T13:15:00`,
      called_at: `${dateISO}T13:20:00`,
      completed_at: `${dateISO}T13:28:00`,
    });
    totalPast++;
  }

  // Add 3 active waiting records for today (01, 02, 03) -> Total = 50 records!
  const todayWaitingServices = [1, 2, 4];
  todayWaitingServices.forEach((serviceId, idx) => {
    const numStr = String(idx + 1).padStart(2, '0');
    const minute = String(5 + idx * 4).padStart(2, '0');
    queues.push({
      id: `q-${todayISO}-${numStr}`,
      queue_date: todayISO,
      queue_number: numStr,
      service_id: serviceId,
      status: 'waiting',
      counter_id: null,
      created_at: `${todayISO}T08:${minute}:00`,
      called_at: null,
      completed_at: null,
    });
  });

  return queues;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function broadcastSync(reason = 'update'): void {
  window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail: { reason } }));
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const ch = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      ch.postMessage({ reason, at: Date.now() });
      ch.close();
    } catch {
      // Ignore BroadcastChannel errors in restricted contexts
    }
  }
}

export function initializeDatabase(forceReset = false): void {
  const alreadyInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (alreadyInit && !forceReset) return;

  const todayISO = getTodayISO();
  writeJSON(STORAGE_KEYS.USERS, DEFAULT_USERS);
  writeJSON(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES);
  writeJSON(STORAGE_KEYS.COUNTERS, DEFAULT_COUNTERS);
  writeJSON(STORAGE_KEYS.SETTINGS, createDefaultSettings());
  writeJSON(STORAGE_KEYS.QUEUES, generateDummyQueues(todayISO));
  localStorage.removeItem(STORAGE_KEYS.CALL_EVENT);
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

  if (forceReset) {
    broadcastSync('reset');
  }
}

export function getUsers(): User[] {
  return readJSON<User[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
}

export function getServices(): Service[] {
  return readJSON<Service[]>(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES);
}

export function getCounters(): Counter[] {
  const raw = readJSON<Array<Partial<Counter>>>(STORAGE_KEYS.COUNTERS, DEFAULT_COUNTERS);
  const settings = getSettings();
  return raw.map((c, idx) => ({
    id: c.id ?? idx + 1,
    counter_name: c.counter_name ?? `Loket ${idx + 1}`,
    status: c.status === 'serving' ? 'serving' : 'idle',
    current_queue_id: c.current_queue_id ?? null,
    is_active: typeof c.is_active === 'boolean' ? c.is_active : idx < (settings.total_counters || 4),
  }));
}

export function getQueues(): QueueItem[] {
  return readJSON<QueueItem[]>(STORAGE_KEYS.QUEUES, []);
}

export function getSettings(): Settings {
  return readJSON<Settings>(STORAGE_KEYS.SETTINGS, createDefaultSettings());
}

export function getCallEvent(): CallEvent | null {
  return readJSON<CallEvent | null>(STORAGE_KEYS.CALL_EVENT, null);
}

export function getSessionUser(): User | null {
  return readJSON<User | null>(STORAGE_KEYS.SESSION_USER, null);
}

export function saveSessionUser(user: User | null): void {
  if (user) {
    writeJSON(STORAGE_KEYS.SESSION_USER, user);
  } else {
    localStorage.removeItem(STORAGE_KEYS.SESSION_USER);
  }
  broadcastSync('session');
}

export function saveSettings(updated: Partial<Settings>): Settings {
  const current = getSettings();
  const next: Settings = { ...current, ...updated };
  writeJSON(STORAGE_KEYS.SETTINGS, next);
  broadcastSync('settings');
  return next;
}

/**
 * CORE LOGIC (STEP 2): Single Queue & Auto-Reset 01
 * Checks the queue_date of the last queue entry (and queues on activeDate).
 * If queue_date is NOT activeDate (day changed), the new number MUST reset to "01".
 */
export function generateNextQueueNumber(queues: QueueItem[], activeDate: string): string {
  if (queues.length === 0) {
    return '01';
  }

  const lastQueue = queues[queues.length - 1];
  const queuesForActiveDate = queues.filter((q) => q.queue_date === activeDate);

  // If the last queue's date is not today's active date AND no queues exist for activeDate yet -> Reset to 01
  if (lastQueue.queue_date !== activeDate && queuesForActiveDate.length === 0) {
    return '01';
  }

  if (queuesForActiveDate.length === 0) {
    return '01';
  }

  const maxNumber = queuesForActiveDate.reduce((max, q) => {
    const parsed = parseInt(q.queue_number, 10);
    return Number.isNaN(parsed) ? max : Math.max(max, parsed);
  }, 0);

  return String(maxNumber + 1).padStart(2, '0');
}

export function takeQueueTicket(serviceId: number): QueueItem {
  const settings = getSettings();
  const queues = getQueues();
  const activeDate = settings.active_date || getTodayISO();
  const nextNumber = generateNextQueueNumber(queues, activeDate);

  const now = new Date();
  const timePart = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const newTicket: QueueItem = {
    id: `q-${activeDate}-${nextNumber}-${Date.now()}`,
    queue_date: activeDate,
    queue_number: nextNumber,
    service_id: serviceId,
    status: 'waiting',
    counter_id: null,
    created_at: `${activeDate}T${timePart}`,
    called_at: null,
    completed_at: null,
  };

  const updated = [...queues, newTicket];
  writeJSON(STORAGE_KEYS.QUEUES, updated);
  broadcastSync('queue-created');
  return newTicket;
}

export function callNextQueue(counterId: number): { queue: QueueItem; callEvent: CallEvent } | null {
  const settings = getSettings();
  const activeDate = settings.active_date || getTodayISO();
  const queues = getQueues();
  const counters = getCounters();
  const services = getServices();

  // If this counter is currently serving a 'called' queue, mark it completed automatically first
  const currentCounter = counters.find((c) => c.id === counterId);
  const nowISO = new Date().toISOString();

  let updatedQueues = queues.map((q) => {
    if (currentCounter?.current_queue_id && q.id === currentCounter.current_queue_id && q.status === 'called') {
      return { ...q, status: 'completed' as const, completed_at: nowISO };
    }
    return q;
  });

  // Find next waiting queue for activeDate
  const nextWaiting = updatedQueues.find(
    (q) => q.queue_date === activeDate && q.status === 'waiting'
  );

  if (!nextWaiting) {
    // Free the counter if nothing is waiting
    const freedCounters = counters.map((c) =>
      c.id === counterId ? { ...c, status: 'idle' as const, current_queue_id: null } : c
    );
    writeJSON(STORAGE_KEYS.QUEUES, updatedQueues);
    writeJSON(STORAGE_KEYS.COUNTERS, freedCounters);
    broadcastSync('queue-updated');
    return null;
  }

  const calledQueue: QueueItem = {
    ...nextWaiting,
    status: 'called',
    counter_id: counterId,
    called_at: nowISO,
  };

  updatedQueues = updatedQueues.map((q) => (q.id === calledQueue.id ? calledQueue : q));

  const updatedCounters = counters.map((c) =>
    c.id === counterId ? { ...c, status: 'serving' as const, current_queue_id: calledQueue.id } : c
  );

  const serviceName = services.find((s) => s.id === calledQueue.service_id)?.service_name ?? 'Pelayanan';
  const counterName = currentCounter?.counter_name ?? `Loket ${counterId}`;

  const callEvent: CallEvent = {
    event_id: `call-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    queue_id: calledQueue.id,
    queue_number: calledQueue.queue_number,
    service_name: serviceName,
    counter_id: counterId,
    counter_name: counterName,
    timestamp: Date.now(),
  };

  writeJSON(STORAGE_KEYS.QUEUES, updatedQueues);
  writeJSON(STORAGE_KEYS.COUNTERS, updatedCounters);
  writeJSON(STORAGE_KEYS.CALL_EVENT, callEvent);
  broadcastSync('queue-called');

  return { queue: calledQueue, callEvent };
}

export function recallQueue(counterId: number): CallEvent | null {
  const counters = getCounters();
  const queues = getQueues();
  const services = getServices();

  const counter = counters.find((c) => c.id === counterId);
  if (!counter?.current_queue_id) return null;

  const activeQueue = queues.find((q) => q.id === counter.current_queue_id && q.status === 'called');
  if (!activeQueue) return null;

  const serviceName = services.find((s) => s.id === activeQueue.service_id)?.service_name ?? 'Pelayanan';

  const callEvent: CallEvent = {
    event_id: `recall-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    queue_id: activeQueue.id,
    queue_number: activeQueue.queue_number,
    service_name: serviceName,
    counter_id: counterId,
    counter_name: counter.counter_name,
    timestamp: Date.now(),
  };

  writeJSON(STORAGE_KEYS.CALL_EVENT, callEvent);
  broadcastSync('queue-recalled');
  return callEvent;
}

export function finishCurrentQueue(counterId: number, outcome: 'completed' | 'skipped'): void {
  const counters = getCounters();
  const queues = getQueues();
  const counter = counters.find((c) => c.id === counterId);
  if (!counter?.current_queue_id) return;

  const nowISO = new Date().toISOString();
  const updatedQueues = queues.map((q) =>
    q.id === counter.current_queue_id
      ? { ...q, status: outcome, completed_at: outcome === 'completed' ? nowISO : null }
      : q
  );

  const updatedCounters = counters.map((c) =>
    c.id === counterId ? { ...c, status: 'idle' as const, current_queue_id: null } : c
  );

  writeJSON(STORAGE_KEYS.QUEUES, updatedQueues);
  writeJSON(STORAGE_KEYS.COUNTERS, updatedCounters);
  broadcastSync('queue-finished');
}

export function simulateNextDay(): string {
  const settings = getSettings();
  const nextDate = addDaysISO(settings.active_date || getTodayISO(), 1);
  // Also free counters on simulated new day so the desk starts fresh
  const resetCounters = getCounters().map((c) => ({
    ...c,
    status: 'idle' as const,
    current_queue_id: null,
  }));
  writeJSON(STORAGE_KEYS.COUNTERS, resetCounters);
  saveSettings({ active_date: nextDate });
  return nextDate;
}

export function resetToTodayDate(): string {
  const today = getTodayISO();
  saveSettings({ active_date: today });
  return today;
}

function syncTotalCountersSetting(counters: Counter[]): void {
  const activeCount = counters.filter((c) => c.is_active).length;
  const current = getSettings();
  writeJSON(STORAGE_KEYS.SETTINGS, { ...current, total_counters: activeCount });
}

export function addCounter(counterName: string): Counter {
  const counters = getCounters();
  const nextId = counters.reduce((max, c) => Math.max(max, c.id), 0) + 1;
  const trimmed = counterName.trim() || `Loket ${nextId}`;
  const newCounter: Counter = {
    id: nextId,
    counter_name: trimmed,
    status: 'idle',
    current_queue_id: null,
    is_active: true,
  };
  const updated = [...counters, newCounter];
  writeJSON(STORAGE_KEYS.COUNTERS, updated);
  syncTotalCountersSetting(updated);
  broadcastSync('counters-updated');
  return newCounter;
}

export function toggleCounterActive(counterId: number): { success: boolean; message: string } {
  const counters = getCounters();
  const target = counters.find((c) => c.id === counterId);
  if (!target) {
    return { success: false, message: 'Loket tidak ditemukan.' };
  }

  if (target.is_active) {
    const activeCount = counters.filter((c) => c.is_active).length;
    if (activeCount <= 1) {
      return { success: false, message: 'Minimal 1 loket harus tetap aktif untuk melayani antrean.' };
    }
    if (target.current_queue_id) {
      return {
        success: false,
        message: `${target.counter_name} sedang melayani antrean. Selesaikan atau lewati antrean terlebih dahulu.`,
      };
    }
  }

  const updated = counters.map((c) =>
    c.id === counterId ? { ...c, is_active: !c.is_active } : c
  );
  writeJSON(STORAGE_KEYS.COUNTERS, updated);
  syncTotalCountersSetting(updated);
  broadcastSync('counters-updated');
  return {
    success: true,
    message: `${target.counter_name} berhasil ${!target.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`,
  };
}

export function renameCounter(counterId: number, newName: string): void {
  const trimmed = newName.trim();
  if (!trimmed) return;
  const counters = getCounters();
  const updated = counters.map((c) =>
    c.id === counterId ? { ...c, counter_name: trimmed } : c
  );
  writeJSON(STORAGE_KEYS.COUNTERS, updated);
  broadcastSync('counters-updated');
}

export function deleteCounter(counterId: number): { success: boolean; message: string } {
  const counters = getCounters();
  const target = counters.find((c) => c.id === counterId);
  if (!target) {
    return { success: false, message: 'Loket tidak ditemukan.' };
  }
  if (target.current_queue_id) {
    return {
      success: false,
      message: `${target.counter_name} sedang melayani antrean dan tidak dapat dihapus.`,
    };
  }
  const remainingActive = counters.filter((c) => c.id !== counterId && c.is_active).length;
  if (remainingActive < 1) {
    return { success: false, message: 'Minimal 1 loket aktif harus dipertahankan.' };
  }

  const updated = counters.filter((c) => c.id !== counterId);
  writeJSON(STORAGE_KEYS.COUNTERS, updated);
  syncTotalCountersSetting(updated);
  broadcastSync('counters-updated');
  return { success: true, message: `${target.counter_name} berhasil dihapus.` };
}

