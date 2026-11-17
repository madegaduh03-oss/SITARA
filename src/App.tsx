import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, LogOut } from 'lucide-react';
import {
  ActiveModule,
  CallEvent,
  Counter,
  QueueItem,
  Service,
  Settings,
  User,
} from './types/sitara';
import {
  BROADCAST_CHANNEL_NAME,
  getCallEvent,
  getCounters,
  getQueues,
  getServices,
  getSessionUser,
  getSettings,
  getUsers,
  initializeDatabase,
  saveSessionUser,
  SYNC_EVENT_NAME,
} from './utils/storage';
import { KioskView } from './components/KioskView';
import { MonitorView } from './components/MonitorView';
import { LoginView } from './components/LoginView';
import { PetugasView } from './components/PetugasView';
import { AdminPimpinanView } from './components/AdminPimpinanView';
import { SqlSchemaView } from './components/SqlSchemaView';

function resolveInitialModule(): ActiveModule {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'monitor' || hash === 'internal' || hash === 'sql' || hash === 'kiosk') {
    return hash;
  }
  return 'kiosk';
}

export default function App() {
  // Initialize LocalStorage seed data synchronously before initial reads
  initializeDatabase(false);

  const [activeModule, setActiveModule] = useState<ActiveModule>(resolveInitialModule);
  const [isMonitorFullscreen, setIsMonitorFullscreen] = useState(false);

  const [settings, setSettings] = useState<Settings>(() => getSettings());
  const [services, setServices] = useState<Service[]>(() => getServices());
  const [counters, setCounters] = useState<Counter[]>(() => getCounters());
  const [queues, setQueues] = useState<QueueItem[]>(() => getQueues());
  const [users, setUsers] = useState<User[]>(() => getUsers());
  const [callEvent, setCallEvent] = useState<CallEvent | null>(() => getCallEvent());
  const [sessionUser, setSessionUser] = useState<User | null>(() => getSessionUser());

  const refreshAllFromStorage = useCallback(() => {
    setSettings(getSettings());
    setServices(getServices());
    setCounters(getCounters());
    setQueues(getQueues());
    setUsers(getUsers());
    setCallEvent(getCallEvent());
    setSessionUser(getSessionUser());
  }, []);

  // Real-time synchronization across same-tab actions & other browser tabs
  useEffect(() => {
    const onStorage = () => refreshAllFromStorage();
    const onLocalSync = () => refreshAllFromStorage();

    window.addEventListener('storage', onStorage);
    window.addEventListener(SYNC_EVENT_NAME, onLocalSync);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channel.onmessage = () => refreshAllFromStorage();
      } catch {
        channel = null;
      }
    }

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(SYNC_EVENT_NAME, onLocalSync);
      channel?.close();
    };
  }, [refreshAllFromStorage]);

  // Sync URL hash for multi-tab testing (e.g. #monitor in Tab 2)
  const navigateModule = (mod: ActiveModule) => {
    setActiveModule(mod);
    window.location.hash = mod;
    if (mod !== 'monitor') {
      setIsMonitorFullscreen(false);
    }
  };

  useEffect(() => {
    const onHashChange = () => {
      setActiveModule(resolveInitialModule());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleToggleMonitorFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsMonitorFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsMonitorFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsMonitorFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleLoginSuccess = (user: User) => {
    saveSessionUser(user);
    setSessionUser(user);
    navigateModule('internal');
  };

  const handleLogout = () => {
    saveSessionUser(null);
    setSessionUser(null);
  };

  const showTopBar = !(activeModule === 'monitor' && isMonitorFullscreen);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Three-Zone Top Bar Contract */}
      {showTopBar && (
        <header className="no-print sticky top-0 z-40 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
            {/* Zone 1: Single-line Brand Wordmark */}
            <button
              type="button"
              onClick={() => navigateModule('kiosk')}
              className="font-display text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
            >
              SITARA
            </button>

            {/* Zone 2: Concise single-line navigation links */}
            <nav className="flex items-center gap-5 sm:gap-7 overflow-x-auto text-sm font-medium">
              <button
                type="button"
                onClick={() => navigateModule('kiosk')}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 cursor-pointer ${
                  activeModule === 'kiosk'
                    ? 'border-emerald-700 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Kiosk Pemohon
              </button>
              <button
                type="button"
                onClick={() => navigateModule('monitor')}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 cursor-pointer ${
                  activeModule === 'monitor'
                    ? 'border-emerald-700 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Layar Monitor
              </button>
              <button
                type="button"
                onClick={() => navigateModule('internal')}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 cursor-pointer ${
                  activeModule === 'internal'
                    ? 'border-emerald-700 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {sessionUser ? `Dashboard (${sessionUser.role})` : 'Portal Internal'}
              </button>
              <button
                type="button"
                onClick={() => navigateModule('sql')}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 cursor-pointer ${
                  activeModule === 'sql'
                    ? 'border-emerald-700 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Skema SQL
              </button>
            </nav>

            {/* Zone 3: 1 Primary Action */}
            <div className="shrink-0">
              {sessionUser ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigateModule('internal')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Login Petugas</span>
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Viewport */}
      <main className="flex-1">
        {activeModule === 'kiosk' && (
          <KioskView settings={settings} services={services} queues={queues} />
        )}

        {activeModule === 'monitor' && (
          <MonitorView
            settings={settings}
            counters={counters}
            queues={queues}
            services={services}
            callEvent={callEvent}
            isFullscreen={isMonitorFullscreen}
            onToggleFullscreen={handleToggleMonitorFullscreen}
          />
        )}

        {activeModule === 'internal' && !sessionUser && (
          <LoginView users={users} onLoginSuccess={handleLoginSuccess} />
        )}

        {activeModule === 'internal' && sessionUser && sessionUser.role === 'petugas' && (
          <PetugasView
            user={sessionUser}
            settings={settings}
            counters={counters}
            queues={queues}
            services={services}
          />
        )}

        {activeModule === 'internal' &&
          sessionUser &&
          (sessionUser.role === 'admin' || sessionUser.role === 'pimpinan') && (
            <AdminPimpinanView
              user={sessionUser}
              settings={settings}
              counters={counters}
              services={services}
              queues={queues}
            />
          )}

        {activeModule === 'sql' && <SqlSchemaView />}
      </main>

      {/* Quiet Footer with Multi-Tab Sync Helper */}
      {showTopBar && (
        <footer className="no-print border-t border-slate-200 bg-white py-4 px-4 sm:px-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              SITARA · Sistem Informasi Antrean dan Rekapitulasi Pelayanan Kecamatan Tulangan
            </span>
            <a
              href="#monitor"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-medium"
            >
              <span>Buka Layar Monitor di Tab Terpisah</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </footer>
      )}
    </div>
  );
}
