import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArcElement,
  Chart,
  DoughnutController,
  Legend,
  Tooltip,
} from 'chart.js';
import {
  Calendar,
  Download,
  ImagePlus,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  Palette,
  MonitorCheck,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Plus,
  Power,
  Trash2,
  Pencil,
  Check,
  X,
  Layers,
} from 'lucide-react';
import { Counter, QueueItem, Service, Settings, User } from '../types/sitara';
import { DEFAULT_LOGO_DATA_URI } from '../data/sqlSchema';
import {
  addCounter,
  addDaysISO,
  addService,
  deleteCounter,
  deleteService,
  getTodayISO,
  initializeDatabase,
  renameCounter,
  resetToTodayDate,
  saveSettings,
  simulateNextDay,
  toggleCounterActive,
  toggleServiceActive,
  updateService,
} from '../utils/storage';
import { BrandLogo, ServiceIcon } from './DynamicBrandHeader';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

interface AdminPimpinanViewProps {
  user: User;
  settings: Settings;
  counters: Counter[];
  services: Service[];
  queues: QueueItem[];
}

const CHART_COLORS = ['#059669', '#0f172a', '#d97706', '#2563eb', '#64748b'];

const SERVICE_ICON_OPTIONS: Array<{ value: Service['icon']; label: string }> = [
  { value: 'id-card', label: 'Kartu ID' },
  { value: 'users', label: 'Keluarga' },
  { value: 'baby', label: 'Anak' },
  { value: 'smartphone', label: 'Digital' },
  { value: 'file-text', label: 'Dokumen' },
  { value: 'building', label: 'Instansi' },
  { value: 'clipboard-check', label: 'Verifikasi' },
  { value: 'shield-check', label: 'Perizinan' },
];

export const AdminPimpinanView: React.FC<AdminPimpinanViewProps> = ({
  user,
  settings,
  counters,
  services,
  queues,
}) => {
  const isAdmin = user.role === 'admin';
  const [activeTab, setActiveTab] = useState<'branding' | 'counters' | 'services' | 'report'>(
    isAdmin ? 'branding' : 'report'
  );

  // Edit Tampilan state (local draft until "Simpan Tampilan")
  const [draftLogo, setDraftLogo] = useState<string>(settings.logo_url);
  const [draftHeader, setDraftHeader] = useState<string>(settings.header_text);
  const [draftSubheader, setDraftSubheader] = useState<string>(settings.subheader_text);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Atur Loket state
  const [newCounterName, setNewCounterName] = useState<string>('');
  const [editingCounterId, setEditingCounterId] = useState<number | null>(null);
  const [editingCounterName, setEditingCounterName] = useState<string>('');

  // Atur Layanan state
  const [newServiceName, setNewServiceName] = useState<string>('');
  const [newServiceDesc, setNewServiceDesc] = useState<string>('');
  const [newServiceIcon, setNewServiceIcon] = useState<Service['icon']>('file-text');
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [editServiceName, setEditServiceName] = useState<string>('');
  const [editServiceDesc, setEditServiceDesc] = useState<string>('');
  const [editServiceIcon, setEditServiceIcon] = useState<Service['icon']>('file-text');

  // Sync draft when external reset happens
  useEffect(() => {
    setDraftLogo(settings.logo_url);
    setDraftHeader(settings.header_text);
    setDraftSubheader(settings.subheader_text);
  }, [settings.logo_url, settings.header_text, settings.subheader_text]);

  // Report date range filter (default: last 14 days up to active_date/today)
  const todayISO = getTodayISO();
  const maxDate = settings.active_date > todayISO ? settings.active_date : todayISO;
  const [startDate, setStartDate] = useState<string>(addDaysISO(todayISO, -13));
  const [endDate, setEndDate] = useState<string>(maxDate);

  useEffect(() => {
    if (settings.active_date > endDate) {
      setEndDate(settings.active_date);
    }
  }, [settings.active_date, endDate]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDraftLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const showNotice = (type: 'ok' | 'err', text: string) => {
    setNotice({ type, text });
    window.setTimeout(() => setNotice(null), 5000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings({
      logo_url: draftLogo.trim() || DEFAULT_LOGO_DATA_URI,
      header_text: draftHeader.trim() || 'SITARA',
      subheader_text: draftSubheader.trim() || 'Sistem Informasi Antrean Kecamatan Tulangan',
    });
    showNotice(
      'ok',
      'Logo dan teks tampilan berhasil disimpan. Kiosk Pemohon & Layar Monitor telah diperbarui.'
    );
  };

  const handleAddCounter = (e: React.FormEvent) => {
    e.preventDefault();
    const nextNum = counters.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const name = newCounterName.trim() || `Loket ${nextNum}`;
    const created = addCounter(name);
    setNewCounterName('');
    showNotice('ok', `${created.counter_name} berhasil ditambahkan dan diaktifkan.`);
  };

  const handleToggleCounter = (counterId: number) => {
    const res = toggleCounterActive(counterId);
    showNotice(res.success ? 'ok' : 'err', res.message);
  };

  const handleStartRename = (counter: Counter) => {
    setEditingCounterId(counter.id);
    setEditingCounterName(counter.counter_name);
  };

  const handleSaveRename = (counterId: number) => {
    if (editingCounterName.trim()) {
      renameCounter(counterId, editingCounterName);
      showNotice('ok', `Nama loket diperbarui menjadi "${editingCounterName.trim()}".`);
    }
    setEditingCounterId(null);
    setEditingCounterName('');
  };

  const handleDeleteCounter = (counterId: number) => {
    const res = deleteCounter(counterId);
    showNotice(res.success ? 'ok' : 'err', res.message);
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) {
      showNotice('err', 'Nama jenis layanan wajib diisi.');
      return;
    }
    const created = addService({
      service_name: newServiceName,
      description: newServiceDesc,
      icon: newServiceIcon,
    });
    setNewServiceName('');
    setNewServiceDesc('');
    setNewServiceIcon('file-text');
    showNotice(
      'ok',
      `Jenis layanan "${created.service_name}" berhasil ditambahkan dan langsung tampil di Kiosk Pemohon.`
    );
  };

  const handleStartEditService = (srv: Service) => {
    setEditingServiceId(srv.id);
    setEditServiceName(srv.service_name);
    setEditServiceDesc(srv.description);
    setEditServiceIcon(srv.icon);
  };

  const handleSaveEditService = (serviceId: number) => {
    const res = updateService(serviceId, {
      service_name: editServiceName,
      description: editServiceDesc,
      icon: editServiceIcon,
    });
    showNotice(res.success ? 'ok' : 'err', res.message);
    if (res.success) {
      setEditingServiceId(null);
    }
  };

  const handleToggleService = (serviceId: number) => {
    const res = toggleServiceActive(serviceId);
    showNotice(res.success ? 'ok' : 'err', res.message);
  };

  const handleDeleteService = (serviceId: number) => {
    const res = deleteService(serviceId);
    showNotice(res.success ? 'ok' : 'err', res.message);
  };

  const handleSimulateNextDay = () => {
    const nextDate = simulateNextDay();
    showNotice(
      'ok',
      `Tanggal aktif disimulasikan berganti ke ${nextDate}. Pengambilan nomor berikutnya di Kiosk akan otomatis reset ke 01.`
    );
  };

  const handleResetDateToday = () => {
    const today = resetToTodayDate();
    showNotice('ok', `Tanggal aktif dikembalikan ke hari ini (${today}).`);
  };

  const handleResetDatabase = () => {
    initializeDatabase(true);
    showNotice(
      'ok',
      'Seluruh data sampel (50 transaksi, logo, loket, & pengaturan awal) berhasil dipulihkan.'
    );
  };

  // Filtered queues for Report
  const filteredQueues = useMemo(() => {
    return queues.filter((q) => {
      if (startDate && q.queue_date < startDate) return false;
      if (endDate && q.queue_date > endDate) return false;
      return true;
    });
  }, [queues, startDate, endDate]);

  const serviceSummary = useMemo(() => {
    const total = filteredQueues.length;
    return services.map((srv) => {
      const items = filteredQueues.filter((q) => q.service_id === srv.id);
      const completed = items.filter((q) => q.status === 'completed').length;
      const active = items.filter((q) => q.status === 'waiting' || q.status === 'called').length;
      const skipped = items.filter((q) => q.status === 'skipped').length;
      const pct = total > 0 ? Math.round((items.length / total) * 1000) / 10 : 0;
      return {
        service: srv,
        count: items.length,
        completed,
        active,
        skipped,
        percentage: pct,
      };
    });
  }, [filteredQueues, services]);

  const totalCompleted = filteredQueues.filter((q) => q.status === 'completed').length;
  const totalActive = filteredQueues.filter(
    (q) => q.status === 'waiting' || q.status === 'called'
  ).length;
  const topService = [...serviceSummary].sort((a, b) => b.count - a.count)[0];

  // Chart.js Doughnut instance
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (activeTab !== 'report' || !canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: serviceSummary.map((row) => row.service.service_name),
        datasets: [
          {
            data: serviceSummary.map((row) => row.count),
            backgroundColor: CHART_COLORS,
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 16,
              color: '#334155',
              font: {
                family: 'Public Sans, sans-serif',
                size: 12,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = Number(context.raw || 0);
                const total = filteredQueues.length || 1;
                const pct = ((value / total) * 100).toFixed(1);
                return ` ${context.label}: ${value} pemohon (${pct}%)`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [activeTab, serviceSummary, filteredQueues.length]);

  const handleDownloadCSV = () => {
    const header = ['Jenis Layanan', 'Total Pemohon', 'Selesai', 'Menunggu/Diproses', 'Dilewati', 'Persentase (%)'];
    const rows = serviceSummary.map((r) => [
      `"${r.service.service_name}"`,
      r.count,
      r.completed,
      r.active,
      r.skipped,
      r.percentage,
    ]);
    const csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rekapitulasi-sitara-${startDate}-sd-${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header & Role Segmented Switch */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
            {isAdmin ? 'Dashboard Administrator SITARA' : 'Dashboard Pimpinan Kecamatan'}
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Masuk sebagai {user.full_name} · Tanggal aktif sistem:{' '}
            <span className="font-mono-tabular font-semibold text-slate-900">
              {settings.active_date}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('branding')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'branding'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Edit Tampilan</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('counters')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'counters'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MonitorCheck className="w-3.5 h-3.5" />
                <span>Atur Loket</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('services')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'services'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Atur Layanan</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'report'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Laporan Rekapitulasi</span>
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`px-4 py-3 rounded-xl border text-sm flex items-center gap-2.5 ${
            notice.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {notice.type === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* TAB 1: MENU EDIT TAMPILAN & LOGO (ADMIN ONLY) */}
      {isAdmin && activeTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSaveSettings}
            className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-5"
          >
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-display text-lg font-bold text-slate-900">
                Edit Tampilan & Logo Instansi
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Unggah gambar logo atau tempel URL gambar, lalu sesuaikan teks identitas untuk
                Kiosk Pemohon dan Layar Monitor.
              </p>
            </div>

            {/* (a) Upload Logo & URL */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-800">
                Logo Instansi (Upload Gambar / URL)
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <BrandLogo logoUrl={draftLogo} altText="Pratinjau Logo" sizeClass="w-20 h-20" />
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-colors">
                      <ImagePlus className="w-4 h-4" />
                      <span>Unggah File Logo (PNG/JPG/SVG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="sr-only"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setDraftLogo(DEFAULT_LOGO_DATA_URI)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Logo Default</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={draftLogo.startsWith('data:') ? '' : draftLogo}
                    onChange={(e) => setDraftLogo(e.target.value)}
                    placeholder="Atau tempel URL gambar logo (https://...)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* (b) Input Teks Header */}
            <div>
              <label
                htmlFor="header-text-input"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                Teks Header Utama
              </label>
              <input
                id="header-text-input"
                type="text"
                value={draftHeader}
                onChange={(e) => setDraftHeader(e.target.value)}
                placeholder="SITARA"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {/* (c) Input Teks Sub-header */}
            <div>
              <label
                htmlFor="subheader-text-input"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                Teks Sub-header (Tulisan di Bawah Logo)
              </label>
              <input
                id="subheader-text-input"
                type="text"
                value={draftSubheader}
                onChange={(e) => setDraftSubheader(e.target.value)}
                placeholder="Sistem Informasi Antrean Kecamatan Tulangan"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Tampilan</span>
              </button>
            </div>
          </form>

          {/* Right Column: Live Previews + Auto-Reset Test */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="text-xs font-semibold text-slate-500">
                Pratinjau Langsung Kiosk & Monitor
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3.5">
                <BrandLogo logoUrl={draftLogo} altText="Preview Light" sizeClass="w-14 h-14" />
                <div className="min-w-0">
                  <div className="font-display text-lg font-bold text-slate-900 truncate">
                    {draftHeader || 'SITARA'}
                  </div>
                  <div className="text-xs text-slate-600 truncate">
                    {draftSubheader || 'Sistem Informasi Antrean Kecamatan Tulangan'}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3.5">
                <BrandLogo logoUrl={draftLogo} altText="Preview Dark" sizeClass="w-14 h-14" />
                <div className="min-w-0">
                  <div className="font-display text-lg font-bold text-white truncate">
                    {draftHeader || 'SITARA'}
                  </div>
                  <div className="text-xs text-slate-300 truncate">
                    {draftSubheader || 'Sistem Informasi Antrean Kecamatan Tulangan'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="font-display text-base font-bold text-slate-900">
                Pengujian Auto-Reset Harian (01)
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Simulasikan pergantian hari untuk menguji bahwa nomor antrean tunggal otomatis
                kembali ke 01 saat pemohon mengambil tiket di Kiosk.
              </p>

              <div className="mt-4 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={handleSimulateNextDay}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Simulasikan Ganti Tanggal (+1 Hari)</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetDateToday}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Hari Ini</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetDatabase}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset 50 Data Awal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MENU ATUR LOKET (TAMBAH, UBAH NAMA, AKTIF/NONAKTIFKAN LOKET) */}
      {isAdmin && activeTab === 'counters' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Tambah Loket Baru */}
          <form
            onSubmit={handleAddCounter}
            className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
          >
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-display text-lg font-bold text-slate-900">
                Tambah Loket Baru
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Loket baru otomatis aktif dan muncul di Layar Monitor serta pilihan Petugas.
              </p>
            </div>

            <div>
              <label
                htmlFor="new-counter-name"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                Nama Loket
              </label>
              <input
                id="new-counter-name"
                type="text"
                value={newCounterName}
                onChange={(e) => setNewCounterName(e.target.value)}
                placeholder={`Loket ${counters.reduce((m, c) => Math.max(m, c.id), 0) + 1}`}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Loket</span>
            </button>

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
              <span>Total Loket Terdaftar</span>
              <span className="font-mono-tabular font-bold text-slate-900">{counters.length}</span>
            </div>
            <div className="text-xs text-slate-600 flex items-center justify-between">
              <span>Loket Berstatus Aktif</span>
              <span className="font-mono-tabular font-bold text-emerald-700">
                {counters.filter((c) => c.is_active).length}
              </span>
            </div>
          </form>

          {/* Daftar & Kontrol Aktif/Nonaktif Loket */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  Daftar Loket Pelayanan
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Aktifkan atau nonaktifkan loket sesuai kebutuhan operasional harian.
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500 tabular-nums">
                {counters.filter((c) => c.is_active).length} dari {counters.length} aktif
              </span>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {counters.map((counter) => {
                const isServing = Boolean(counter.current_queue_id);
                const isEditing = editingCounterId === counter.id;

                return (
                  <div
                    key={counter.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-2 max-w-xs">
                          <input
                            type="text"
                            value={editingCounterName}
                            onChange={(e) => setEditingCounterName(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(counter.id)}
                            className="p-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
                            aria-label="Simpan nama loket"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCounterId(null)}
                            className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                            aria-label="Batal ubah nama"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <span className="font-display font-bold text-base text-slate-900">
                            {counter.counter_name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartRename(counter)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            aria-label={`Ubah nama ${counter.counter_name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span
                          className={`font-semibold ${
                            counter.is_active ? 'text-emerald-700' : 'text-slate-500'
                          }`}
                        >
                          {counter.is_active ? 'Status: Aktif' : 'Status: Nonaktif'}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span className="text-slate-500">
                          {isServing ? 'Sedang melayani antrean' : 'Siaga / Tidak ada antrean'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleCounter(counter.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                          counter.is_active
                            ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                            : 'bg-emerald-700 border-emerald-700 text-white hover:bg-emerald-800'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{counter.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCounter(counter.id)}
                        className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-red-700 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                        aria-label={`Hapus ${counter.counter_name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MENU ATUR LAYANAN (TAMBAH, EDIT NAMA/DESKRIPSI/IKON, AKTIF/NONAKTIFKAN) */}
      {isAdmin && activeTab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Tambah Jenis Layanan Baru */}
          <form
            onSubmit={handleAddService}
            className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
          >
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-display text-lg font-bold text-slate-900">
                Tambah Jenis Layanan
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Layanan baru langsung tampil sebagai tombol pilihan di Kiosk Pemohon.
              </p>
            </div>

            <div>
              <label
                htmlFor="new-service-name"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                Nama Jenis Layanan
              </label>
              <input
                id="new-service-name"
                type="text"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="Misal: Surat Pindah Datang"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                required
              />
            </div>

            <div>
              <label
                htmlFor="new-service-desc"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                Deskripsi Layanan
              </label>
              <textarea
                id="new-service-desc"
                rows={3}
                value={newServiceDesc}
                onChange={(e) => setNewServiceDesc(e.target.value)}
                placeholder="Jelaskan secara singkat dokumen atau keperluan yang dilayani..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <span className="block text-sm font-semibold text-slate-800 mb-2">
                Ikon Layanan
              </span>
              <div className="grid grid-cols-4 gap-2">
                {SERVICE_ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNewServiceIcon(opt.value)}
                    title={opt.label}
                    className={`p-2.5 rounded-lg border flex flex-col items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
                      newServiceIcon === opt.value
                        ? 'bg-emerald-700 border-emerald-700 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ServiceIcon icon={opt.value} className="w-4 h-4" />
                    <span className="truncate w-full text-center">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Layanan</span>
            </button>

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
              <span>Layanan Aktif di Kiosk</span>
              <span className="font-mono-tabular font-bold text-emerald-700">
                {services.filter((s) => s.is_active).length} dari {services.length}
              </span>
            </div>
          </form>

          {/* Daftar & Edit Jenis Layanan */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  Daftar Jenis Layanan & Deskripsi
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Klik Edit untuk memperbarui nama, deskripsi, atau ikon layanan yang tampil di
                  Kiosk Pemohon.
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500 tabular-nums">
                {services.length} jenis layanan
              </span>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {services.map((srv) => {
                const isEditing = editingServiceId === srv.id;

                return (
                  <div key={srv.id} className="py-4">
                    {isEditing ? (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Nama Jenis Layanan
                            </label>
                            <input
                              type="text"
                              value={editServiceName}
                              onChange={(e) => setEditServiceName(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Ikon
                            </label>
                            <select
                              value={editServiceIcon}
                              onChange={(e) => setEditServiceIcon(e.target.value as Service['icon'])}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            >
                              {SERVICE_ICON_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Deskripsi Layanan
                          </label>
                          <textarea
                            rows={2}
                            value={editServiceDesc}
                            onChange={(e) => setEditServiceDesc(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingServiceId(null)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Batal</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditService(srv.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Simpan Perubahan</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                            <ServiceIcon icon={srv.icon} className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-display font-bold text-base text-slate-900">
                                {srv.service_name}
                              </span>
                              <span
                                className={`text-xs font-semibold ${
                                  srv.is_active ? 'text-emerald-700' : 'text-slate-500'
                                }`}
                              >
                                · {srv.is_active ? 'Aktif di Kiosk' : 'Nonaktif'}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-snug">
                              {srv.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditService(srv)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleService(srv.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                              srv.is_active
                                ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                                : 'bg-emerald-700 border-emerald-700 text-white hover:bg-emerald-800'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{srv.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteService(srv.id)}
                            className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-red-700 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                            aria-label={`Hapus layanan ${srv.service_name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LAPORAN REKAPITULASI (ADMIN & PIMPINAN) */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 max-w-xl">
              <div>
                <label htmlFor="filter-start-date" className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Mulai
                </label>
                <input
                  id="filter-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono-tabular text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label htmlFor="filter-end-date" className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Akhir
                </label>
                <input
                  id="filter-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono-tabular text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setStartDate(settings.active_date);
                  setEndDate(settings.active_date);
                }}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartDate(addDaysISO(todayISO, -6));
                  setEndDate(maxDate);
                }}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
              >
                7 Hari
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartDate(addDaysISO(todayISO, -13));
                  setEndDate(maxDate);
                }}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
              >
                14 Hari
              </button>
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor CSV</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak</span>
              </button>
            </div>
          </div>

          {/* 4-Column KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs font-medium text-slate-500">Total Pemohon</div>
              <div className="font-mono-tabular text-3xl font-bold text-slate-900 mt-1">
                {filteredQueues.length}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs font-medium text-slate-500">Selesai Dilayani</div>
              <div className="font-mono-tabular text-3xl font-bold text-emerald-700 mt-1">
                {totalCompleted}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs font-medium text-slate-500">Menunggu / Dipanggil</div>
              <div className="font-mono-tabular text-3xl font-bold text-amber-600 mt-1">
                {totalActive}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs font-medium text-slate-500">Layanan Tertinggi</div>
              <div className="font-display text-lg font-bold text-slate-900 mt-2 truncate">
                {topService && topService.count > 0 ? topService.service.service_name : '-'}
              </div>
            </div>
          </div>

          {/* Table & Chart.js Doughnut */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="font-display text-lg font-bold text-slate-900 pb-4 border-b border-slate-100">
                Agregasi Pemohon per Jenis Layanan
              </h3>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                      <th className="py-2.5 pr-4">Jenis Layanan</th>
                      <th className="py-2.5 px-3 text-right">Pemohon</th>
                      <th className="py-2.5 px-3 text-right">Selesai</th>
                      <th className="py-2.5 px-3 text-right">Aktif</th>
                      <th className="py-2.5 pl-3 text-right">Persentase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {serviceSummary.map((row) => (
                      <tr key={row.service.id} className="hover:bg-slate-50">
                        <td className="py-3 pr-4 font-semibold text-slate-900">
                          {row.service.service_name}
                        </td>
                        <td className="py-3 px-3 text-right font-mono-tabular font-bold text-slate-900">
                          {row.count}
                        </td>
                        <td className="py-3 px-3 text-right font-mono-tabular text-emerald-700">
                          {row.completed}
                        </td>
                        <td className="py-3 px-3 text-right font-mono-tabular text-slate-600">
                          {row.active}
                        </td>
                        <td className="py-3 pl-3 text-right font-mono-tabular text-slate-700">
                          {row.percentage.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 text-sm font-bold text-slate-900">
                      <td className="py-3 pr-4">Total Keseluruhan</td>
                      <td className="py-3 px-3 text-right font-mono-tabular">
                        {filteredQueues.length}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-tabular text-emerald-700">
                        {totalCompleted}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-tabular">{totalActive}</td>
                      <td className="py-3 pl-3 text-right font-mono-tabular">
                        {filteredQueues.length > 0 ? '100.0%' : '0.0%'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col">
              <h3 className="font-display text-lg font-bold text-slate-900 pb-4 border-b border-slate-100">
                Distribusi Layanan (Chart.js)
              </h3>
              <div className="relative flex-1 min-h-[290px] mt-4">
                {filteredQueues.length > 0 ? (
                  <canvas ref={canvasRef} />
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-slate-500">
                    Tidak ada transaksi pada rentang tanggal yang dipilih.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
