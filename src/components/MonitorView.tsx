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
      className={`min-h-[calc(100vh-4rem)] bg-gradient-to-br from-teal-950 via-teal-900 to-teal-800 text-teal-50 ${
        isFullscreen ? 'min-h-screen p-6 sm:p-8' : 'px-4 sm:px-6 py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <DynamicBrandHeader
          settings={settings}
          variant="teal"
          rightSlot={
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-left sm:text-right mr-2">
                <div className="font-mono-tabular text-2xl font-bold text-white tracking-tight">
                  {clockText}
                </div>
                <div className="text-xs text-teal-200">
                  {formatIndonesianDate(settings.active_date)}
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestVoice}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-teal-800/80 hover:bg-teal-700 border border-teal-600/80 text-xs font-medium text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {audioEnabled ? (
                  <Volume2 className="w-4 h-4 text-teal-200" />
                ) : (
                  <VolumeX className="w-4 h-4 text-teal-300" />
                )}
                <span>Uji Suara TTS</span>
              </button>

              <button
                type="button"
                onClick={() => setAudioEnabled((v) => !v)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-teal-950/60 hover:bg-teal-800 border border-teal-700 text-xs font-medium text-teal-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>{audioEnabled ? 'Audio Aktif' : 'Audio Bisu'}</span>
              </button>

              <button
                type="button"
                onClick={onToggleFullscreen}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-xs font-bold text-teal-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
          <div className="lg:col-span-7 bg-teal-900/75 border border-teal-600/60 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between gap-4 border-b border-teal-700/70 pb-4">
              <span className="text-sm font-semibold text-teal-200 tracking-wide">
                Panggilan Antrean Saat Ini
              </span>
              <span className="text-xs text-teal-200 tabular-nums">
                {waitingCount} pemohon menunggu
              </span>
            </div>

            <div className="my-8 text-center">
              <div className="text-sm text-teal-200">Nomor Antrean</div>
              <div className="font-mono-tabular text-7xl sm:text-8xl lg:text-9xl font-bold text-white tracking-tight mt-2 leading-none">
                {mainNumber}
              </div>
              <div className="mt-6 inline-block px-7 py-2.5 rounded-xl bg-teal-500 text-teal-950 font-display text-xl sm:text-2xl font-extrabold shadow-xs">
                {mainCounter}
              </div>
            </div>

            <div className="pt-4 border-t border-teal-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
              <div>
                <span className="text-teal-200">Jenis Layanan: </span>
                <span className="font-semibold text-white">{mainService}</span>
              </div>
              {lastAnnouncement && (
                <div className="text-xs text-teal-200 truncate max-w-md" title={lastAnnouncement}>
                  Suara: “{lastAnnouncement}”
                </div>
              )}
            </div>
          </div>

          {/* Info & Antrean Menunggu Ringkas */}
          <div className="lg:col-span-5 bg-teal-900/65 border border-teal-700/60 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-white border-b border-teal-700/70 pb-3">
                Daftar Antrean Menunggu
              </h2>
              <div className="mt-4 divide-y divide-teal-800/80">
                {queues
                  .filter((q) => q.queue_date === settings.active_date && q.status === 'waiting')
                  .slice(0, 5)
                  .map((q) => {
                    const srv = services.find((s) => s.id === q.service_id)?.service_name ?? '-';
                    return (
                      <div key={q.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono-tabular text-xl font-bold text-teal-300 w-10">
                            {q.queue_number}
                          </span>
                          <span className="text-sm font-medium text-white">{srv}</span>
                        </div>
                        <span className="text-xs text-teal-200">Menunggu</span>
                      </div>
                    );
                  })}
                {waitingCount === 0 && (
                  <p className="py-8 text-sm text-teal-200 text-center">
                    Tidak ada antrean menunggu saat ini.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-teal-700/70 text-xs text-teal-200 flex items-center justify-between">
              <span>Sistem Antrean Tunggal (Single Queue)</span>
              <span className="tabular-nums">{activeCounters.length} Loket Aktif</span>
            </div>
          </div>
        </div>

        {/* Grid Loket Dinamis */}
        <div className="mt-6">
          <h2 className="font-display text-base font-semibold text-teal-100 mb-3">
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
                      ? 'bg-teal-700/85 border-teal-400 shadow-md'
                      : 'bg-teal-900/55 border-teal-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display font-bold text-base text-white">
                      {counter.counter_name}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        isServing ? 'text-teal-100' : 'text-teal-300/80'
                      }`}
                    >
                      {isServing ? 'Melayani' : 'Tersedia'}
                    </span>
                  </div>

                  <div className="my-4 font-mono-tabular text-4xl font-bold text-white">
                    {currentQ ? currentQ.queue_number : '--'}
                  </div>

                  <div className="text-xs text-teal-100 truncate">
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
