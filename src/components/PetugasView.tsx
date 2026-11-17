import React, { useState } from 'react';
import {
  CheckCircle2,
  PhoneForwarded,
  RotateCcw,
  SkipForward,
  User as UserIcon,
  Clock,
} from 'lucide-react';
import { Counter, QueueItem, Service, Settings, User } from '../types/sitara';
import {
  callNextQueue,
  finishCurrentQueue,
  formatIndonesianDate,
  recallQueue,
} from '../utils/storage';
import { announceQueueCall } from '../utils/speechAndPrint';

interface PetugasViewProps {
  user: User;
  settings: Settings;
  counters: Counter[];
  queues: QueueItem[];
  services: Service[];
}

export const PetugasView: React.FC<PetugasViewProps> = ({
  user,
  settings,
  counters,
  queues,
  services,
}) => {
  const activeCounters = counters.filter((c) => c.is_active);
  const [selectedCounterId, setSelectedCounterId] = useState<number>(activeCounters[0]?.id ?? 1);
  const [feedback, setFeedback] = useState<string>('');

  // Keep selected counter within active counters list
  const selectedCounter =
    activeCounters.find((c) => c.id === selectedCounterId) || activeCounters[0];
  const safeCounterId = selectedCounter?.id ?? 1;

  const currentQueue = selectedCounter?.current_queue_id
    ? queues.find((q) => q.id === selectedCounter.current_queue_id && q.status === 'called')
    : undefined;

  const currentService = currentQueue
    ? services.find((s) => s.id === currentQueue.service_id)
    : undefined;

  const waitingToday = queues.filter(
    (q) => q.queue_date === settings.active_date && q.status === 'waiting'
  );
  const completedTodayCount = queues.filter(
    (q) => q.queue_date === settings.active_date && q.status === 'completed'
  ).length;

  const handleCallNext = () => {
    const result = callNextQueue(safeCounterId);
    if (!result) {
      setFeedback('Tidak ada lagi antrean dengan status Menunggu untuk tanggal aktif saat ini.');
      return;
    }
    setFeedback(
      `Memanggil nomor ${result.callEvent.queue_number} (${result.callEvent.service_name}) ke ${result.callEvent.counter_name}.`
    );
    // Also trigger local speech synthesis feedback if monitor isn't open in another tab
    announceQueueCall(result.callEvent.queue_number, result.callEvent.counter_name);
  };

  const handleRecall = () => {
    const ev = recallQueue(safeCounterId);
    if (!ev) return;
    setFeedback(`Memanggil ulang nomor ${ev.queue_number} ke ${ev.counter_name}.`);
    announceQueueCall(ev.queue_number, ev.counter_name);
  };

  const handleComplete = () => {
    if (!currentQueue) return;
    finishCurrentQueue(safeCounterId, 'completed');
    setFeedback(`Antrean nomor ${currentQueue.queue_number} ditandai Selesai.`);
  };

  const handleSkip = () => {
    if (!currentQueue) return;
    finishCurrentQueue(safeCounterId, 'skipped');
    setFeedback(`Antrean nomor ${currentQueue.queue_number} dilewati.`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Petugas & Pilihan Loket */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">{user.full_name}</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {formatIndonesianDate(settings.active_date)} ·{' '}
              <span className="tabular-nums">{completedTodayCount} selesai hari ini</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="loket-select" className="text-sm font-medium text-slate-700 whitespace-nowrap">
            Loket Tugas:
          </label>
          <select
            id="loket-select"
            value={safeCounterId}
            onChange={(e) => setSelectedCounterId(Number(e.target.value))}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
          >
            {activeCounters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.counter_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {feedback && (
        <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900">
          {feedback}
        </div>
      )}

      {/* Main Grid: Active Card + Waiting List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kartu Antrean Sedang Dilayani */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <span className="text-sm font-semibold text-slate-700">
              Sedang Dilayani ({selectedCounter?.counter_name})
            </span>
            {currentService ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-100 border border-emerald-200 text-xs font-semibold text-emerald-900">
                Layanan: {currentService.service_name}
              </span>
            ) : (
              <span className="text-xs text-slate-500">Loket Siaga</span>
            )}
          </div>

          <div className="py-8 text-center">
            <div className="text-xs font-medium text-slate-500">Nomor Antrean</div>
            <div className="font-mono-tabular text-7xl font-bold text-slate-900 mt-2 leading-none">
              {currentQueue ? currentQueue.queue_number : '--'}
            </div>
            <div className="mt-3 text-sm text-slate-600">
              {currentQueue
                ? `Dipanggil pukul ${currentQueue.called_at?.slice(11, 19) || '-'}`
                : 'Klik Panggil Berikutnya untuk melayani pemohon'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCallNext}
              className="col-span-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <PhoneForwarded className="w-4 h-4" />
              <span>Panggil Berikutnya</span>
            </button>

            <button
              type="button"
              onClick={handleRecall}
              disabled={!currentQueue}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-800 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Panggil Ulang</span>
            </button>

            <button
              type="button"
              onClick={handleSkip}
              disabled={!currentQueue}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 disabled:opacity-40 text-amber-900 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <SkipForward className="w-4 h-4" />
              <span>Lewati</span>
            </button>

            <button
              type="button"
              onClick={handleComplete}
              disabled={!currentQueue}
              className="col-span-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Selesai Dilayani</span>
            </button>
          </div>
        </div>

        {/* Tabel Antrean Waiting Hari Ini */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                Daftar Antrean Menunggu
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Urutan Single Queue untuk tanggal {settings.active_date}
              </p>
            </div>
            <div className="text-sm font-semibold text-slate-700 tabular-nums">
              {waitingToday.length} Antrean
            </div>
          </div>

          {waitingToday.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                    <th className="py-2.5 pr-4">Nomor</th>
                    <th className="py-2.5 px-4">Jenis Layanan</th>
                    <th className="py-2.5 px-4">Waktu Ambil</th>
                    <th className="py-2.5 pl-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {waitingToday.map((item) => {
                    const srvName =
                      services.find((s) => s.id === item.service_id)?.service_name ?? '-';
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 pr-4 font-mono-tabular font-bold text-slate-900">
                          {item.queue_number}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">{srvName}</td>
                        <td className="py-3 px-4 font-mono-tabular text-slate-600">
                          {item.created_at.split('T')[1] || '-'}
                        </td>
                        <td className="py-3 pl-4 text-right text-xs font-medium text-amber-700">
                          Menunggu
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="mt-2 text-sm font-medium text-slate-700">
                Semua antrean hari ini telah dipanggil
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Pemohon baru dapat mengambil nomor melalui tab Kiosk Pemohon.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
