import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';
import { CallEvent, Counter, QueueItem, Service, Settings } from '../types/sitara';
import { formatIndonesianDate } from '../utils/storage';
import { announceQueueCall } from '../utils/speechAndPrint';
import { DynamicBrandHeader } from './DynamicBrandHeader';

interface MonitorViewProps {
  settings: Settings;
  counters: Counter[];
  queues: QueueItem[];
  services: Service[];
  callEvent: CallEvent | null;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const MonitorView: React.FC<MonitorViewProps> = ({
  settings,
  counters,
  queues,
  services,
  callEvent,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [clockText, setClockText] = useState<string>(() =>
    new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date())
  );
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [lastAnnouncement, setLastAnnouncement] = useState<string>('');
  const lastPlayedEventIdRef = useRef<string | null>(callEvent?.event_id ?? null);

  // Live clock
  useEffect(() => {
    const id = window.setInterval(() => {
      setClockText(
        new Intl.DateTimeFormat('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date())
      );
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Trigger Chime + Web Speech API TTS whenever a new callEvent arrives
  useEffect(() => {
    if (!callEvent) return;
    if (lastPlayedEventIdRef.current === callEvent.event_id) return;

    lastPlayedEventIdRef.current = callEvent.event_id;
    if (audioEnabled) {
      announceQueueCall(callEvent.queue_number, callEvent.counter_name).then((phrase) => {
        setLastAnnouncement(phrase);
      });
    }
  }, [callEvent, audioEnabled]);

  const activeCounters = counters.filter((c) => c.is_active);

  // Determine main call display (latest callEvent or currently serving queue)
  const servingQueues = queues.filter(
    (q) => q.queue_date === settings.active_date && q.status === 'called'
  );
  const latestServing = servingQueues.sort((a, b) =>
    (b.called_at || '').localeCompare(a.called_at || '')
  )[0];

  const mainNumber = callEvent?.queue_number || latestServing?.queue_number || '--';
  const mainCounter =
    callEvent?.counter_name ||
    (latestServing?.counter_id ? `Loket ${latestServing.counter_id}` : 'Menunggu Panggilan');
  const mainService =
    callEvent?.service_name ||
    (latestServing
      ? services.find((s) => s.id === latestServing.service_id)?.service_name || '-'
      : 'Belum ada antrean dipanggil');

  const waitingCount = queues.filter(
    (q) => q.queue_date === settings.active_date && q.status === 'waiting'
  ).length;

  const handleTestVoice = () => {
    setAudioEnabled(true);
    const numToSpeak = mainNumber !== '--' ? mainNumber : '01';
    const counterToSpeak = mainNumber !== '--' ? mainCounter : 'Loket 1';
    announceQueueCall(numToSpeak, counterToSpeak).then((phrase) => {
      setLastAnnouncement(phrase);
    });
  };

  return (
    <div
      className={`min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 ${
        isFullscreen ? 'min-h-screen p-6 sm:p-8' : 'px-4 sm:px-6 py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <DynamicBrandHeader
          settings={settings}
          variant="dark"
          rightSlot={
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-left sm:text-right mr-2">
                <div className="font-mono-tabular text-2xl font-bold text-white tracking-tight">
                  {clockText}
                </div>
                <div className="text-xs text-slate-400">
                  {formatIndonesianDate(settings.active_date)}
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestVoice}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {audioEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                <span>Uji Suara TTS</span>
              </button>

              <button
                type="button"
                onClick={() => setAudioEnabled((v) => !v)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>{audioEnabled ? 'Audio Aktif' : 'Audio Bisu'}</span>
              </button>

              <button
                type="button"
                onClick={onToggleFullscreen}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-4 h-4" />
                    <span>Keluar Layar Penuh</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4" />
                    <span>Layar Penuh</span>
                  </>
                )}
              </button>
            </div>
          }
        />

        {/* Panel Panggilan Utama */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <span className="text-sm font-semibold text-emerald-400 tracking-wide">
                Panggilan Antrean Saat Ini
              </span>
              <span className="text-xs text-slate-400 tabular-nums">
                {waitingCount} pemohon menunggu
              </span>
            </div>

            <div className="my-8 text-center">
              <div className="text-sm text-slate-400">Nomor Antrean</div>
              <div className="font-mono-tabular text-7xl sm:text-8xl lg:text-9xl font-bold text-white tracking-tight mt-2 leading-none">
                {mainNumber}
              </div>
              <div className="mt-6 inline-block px-6 py-2.5 rounded-xl bg-emerald-700 text-white font-display text-xl sm:text-2xl font-bold">
                {mainCounter}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
              <div>
                <span className="text-slate-400">Jenis Layanan: </span>
                <span className="font-semibold text-white">{mainService}</span>
              </div>
              {lastAnnouncement && (
                <div className="text-xs text-slate-400 truncate max-w-md" title={lastAnnouncement}>
                  Suara: “{lastAnnouncement}”
                </div>
              )}
            </div>
          </div>

          {/* Info & Antrean Menunggu Ringkas */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-white border-b border-slate-800 pb-3">
                Daftar Antrean Menunggu
              </h2>
              <div className="mt-4 divide-y divide-slate-800">
                {queues
                  .filter((q) => q.queue_date === settings.active_date && q.status === 'waiting')
                  .slice(0, 5)
                  .map((q) => {
                    const srv = services.find((s) => s.id === q.service_id)?.service_name ?? '-';
                    return (
                      <div key={q.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono-tabular text-xl font-bold text-emerald-400 w-10">
                            {q.queue_number}
                          </span>
                          <span className="text-sm font-medium text-slate-200">{srv}</span>
                        </div>
                        <span className="text-xs text-slate-400">Menunggu</span>
                      </div>
                    );
                  })}
                {waitingCount === 0 && (
                  <p className="py-8 text-sm text-slate-400 text-center">
                    Tidak ada antrean menunggu saat ini.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>Sistem Antrean Tunggal (Single Queue)</span>
              <span className="tabular-nums">{activeCounters.length} Loket Aktif</span>
            </div>
          </div>
        </div>

        {/* Grid Loket Dinamis */}
        <div className="mt-6">
          <h2 className="font-display text-base font-semibold text-slate-300 mb-3">
            Status Loket Pelayanan
          </h2>
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${
              activeCounters.length <= 2
                ? 'lg:grid-cols-2'
                : activeCounters.length === 3
                ? 'lg:grid-cols-3'
                : activeCounters.length === 4
                ? 'lg:grid-cols-4'
                : activeCounters.length === 5
                ? 'lg:grid-cols-5'
                : 'lg:grid-cols-3 xl:grid-cols-4'
            }`}
          >
            {activeCounters.map((counter) => {
              const currentQ = counter.current_queue_id
                ? queues.find((q) => q.id === counter.current_queue_id && q.status === 'called')
                : undefined;
              const currentSrv = currentQ
                ? services.find((s) => s.id === currentQ.service_id)?.service_name
                : undefined;
              const isServing = Boolean(currentQ);

              return (
                <div
                  key={counter.id}
                  className={`rounded-xl p-5 border transition-colors ${
                    isServing
                      ? 'bg-slate-900 border-emerald-600'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display font-bold text-base text-white">
                      {counter.counter_name}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        isServing ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {isServing ? 'Melayani' : 'Tersedia'}
                    </span>
                  </div>

                  <div className="my-4 font-mono-tabular text-4xl font-bold text-white">
                    {currentQ ? currentQ.queue_number : '--'}
                  </div>

                  <div className="text-xs text-slate-300 truncate">
                    {currentSrv || 'Menunggu pemohon berikutnya'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
