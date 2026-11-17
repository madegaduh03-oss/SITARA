import React, { useEffect, useState } from 'react';
import {
  Bluetooth,
  CheckCircle2,
  Printer,
  Ticket,
  X,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { QueueItem, Service, Settings } from '../types/sitara';
import {
  formatIndonesianDate,
  generateNextQueueNumber,
  takeQueueTicket,
} from '../utils/storage';
import { printThermalViaBluetooth } from '../utils/speechAndPrint';
import { BrandLogo, DynamicBrandHeader, ServiceIcon } from './DynamicBrandHeader';

interface KioskViewProps {
  settings: Settings;
  services: Service[];
  queues: QueueItem[];
}

export const KioskView: React.FC<KioskViewProps> = ({ settings, services, queues }) => {
  const [issuedTicket, setIssuedTicket] = useState<QueueItem | null>(null);
  const [issuedServiceName, setIssuedServiceName] = useState<string>('');
  const [btStatus, setBtStatus] = useState<{ type: 'idle' | 'loading' | 'ok' | 'err'; msg: string }>({
    type: 'idle',
    msg: '',
  });

  useEffect(() => {
    document.body.dataset.printMode = issuedTicket ? 'receipt' : '';
    return () => {
      document.body.dataset.printMode = '';
    };
  }, [issuedTicket]);

  const activeServices = services.filter((s) => s.is_active);
  const nextNumberPreview = generateNextQueueNumber(queues, settings.active_date);
  const waitingTodayCount = queues.filter(
    (q) => q.queue_date === settings.active_date && q.status === 'waiting'
  ).length;

  const handleSelectService = (service: Service) => {
    const ticket = takeQueueTicket(service.id);
    setIssuedTicket(ticket);
    setIssuedServiceName(service.service_name);
    setBtStatus({ type: 'idle', msg: '' });
  };

  const handleBluetoothPrint = async () => {
    if (!issuedTicket) return;
    setBtStatus({ type: 'loading', msg: 'Menghubungkan ke printer thermal Bluetooth...' });
    const res = await printThermalViaBluetooth(issuedTicket, issuedServiceName, settings);
    setBtStatus({
      type: res.success ? 'ok' : 'err',
      msg: res.message,
    });
  };

  const handleBrowserPrint = () => {
    document.body.dataset.printMode = 'receipt';
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <DynamicBrandHeader
          settings={settings}
          rightSlot={
            <div className="text-left sm:text-right text-sm text-slate-600">
              <div className="font-medium text-slate-900">
                {formatIndonesianDate(settings.active_date)}
              </div>
              <div className="mt-1 flex items-center sm:justify-end gap-2 text-xs text-slate-500">
                <span>Antrean berikutnya:</span>
                <span className="font-mono-tabular font-bold text-slate-900">
                  {nextNumberPreview}
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{waitingTodayCount} menunggu</span>
              </div>
            </div>
          }
        />

        <div className="mt-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              Pilih Jenis Layanan Kependudukan & Administrasi
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-1.5 leading-relaxed">
              Sentuh salah satu tombol layanan di bawah ini untuk mengambil nomor antrean tunggal
              (Single Queue). Nomor akan otomatis kembali ke 01 setiap pergantian hari.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeServices.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => handleSelectService(service)}
                className="group text-left bg-slate-50 hover:bg-emerald-700 border border-slate-200 hover:border-emerald-700 rounded-xl p-6 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 min-h-[144px] flex flex-col justify-between cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white group-hover:bg-emerald-600 border border-slate-200 group-hover:border-emerald-500 flex items-center justify-center text-emerald-700 group-hover:text-white transition-colors shrink-0">
                    <ServiceIcon icon={service.icon} className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>

                <div className="mt-5">
                  <div className="font-display text-lg font-bold text-slate-900 group-hover:text-white transition-colors">
                    {service.service_name}
                  </div>
                  <p className="text-sm text-slate-600 group-hover:text-emerald-50 mt-1 leading-snug transition-colors">
                    {service.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Preview Struk 58mm */}
      {issuedTicket && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="receipt-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <Ticket className="w-5 h-5 text-emerald-700" />
                <h3 id="receipt-modal-title" className="font-display text-lg font-bold text-slate-900">
                  Pratinjau Struk Antrean 58mm
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIssuedTicket(null)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Tutup modal struk"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 58mm Thermal Paper Preview */}
            <div className="mt-5 flex justify-center bg-slate-100 rounded-xl p-5 border border-slate-200">
              <div
                id="thermal-receipt-print-area"
                className="w-[228px] bg-white border border-dashed border-slate-300 px-4 py-5 text-center text-slate-900 shadow-xs"
              >
                <div className="flex justify-center mb-2">
                  <BrandLogo
                    logoUrl={settings.logo_url}
                    altText={settings.header_text}
                    sizeClass="w-12 h-12"
                  />
                </div>
                <div className="font-display font-bold text-sm tracking-tight uppercase">
                  {settings.header_text}
                </div>
                <div className="text-[11px] text-slate-600 leading-tight mt-0.5">
                  {settings.subheader_text}
                </div>

                <div className="my-3 border-t border-dashed border-slate-400" />

                <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                  Nomor Antrean Anda
                </div>
                <div className="font-mono-tabular text-6xl font-bold tracking-tight text-slate-900 my-2 leading-none">
                  {issuedTicket.queue_number}
                </div>

                <div className="mt-3 pt-2 border-t border-dashed border-slate-300 text-xs space-y-1">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Layanan:</span>
                    <span className="font-semibold text-right">{issuedServiceName}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Tanggal:</span>
                    <span className="font-mono-tabular">{issuedTicket.queue_date}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Waktu:</span>
                    <span className="font-mono-tabular">
                      {issuedTicket.created_at.split('T')[1] || '-'}
                    </span>
                  </div>
                </div>

                <div className="my-3 border-t border-dashed border-slate-400" />

                <p className="text-[10px] text-slate-600 leading-snug">
                  Mohon menunggu hingga nomor Anda dipanggil pada layar monitor ruang tunggu.
                </p>
              </div>
            </div>

            {btStatus.type !== 'idle' && (
              <div
                className={`mt-4 p-3 rounded-lg border text-xs flex items-start gap-2 ${
                  btStatus.type === 'ok'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : btStatus.type === 'err'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {btStatus.type === 'ok' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{btStatus.msg}</span>
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleBluetoothPrint}
                disabled={btStatus.type === 'loading'}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                <Bluetooth className="w-4 h-4 shrink-0" />
                <span>Cetak Bluetooth</span>
              </button>
              <button
                type="button"
                onClick={handleBrowserPrint}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>Cetak Browser</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIssuedTicket(null)}
              className="mt-3 w-full py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
            >
              Selesai & Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
