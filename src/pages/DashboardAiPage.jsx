import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Download,
  ExternalLink,
  Maximize2,
  MessageSquare,
  Minimize2,
  PackageCheck,
  RefreshCw,
  Send,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  askRagAssistant,
  getDashboardSummary,
  getStockAndDemandForecast,
  getWeeklyInsight,
} from '../api/services/dashboardService';
import { dummyDashboardData } from '../api/mockData';
import { formatPercent, formatRupiah } from '../utils/formatters';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { KpiSkeletonGrid, SkeletonBox } from '../components/ui/Skeleton';
import { BatikDarkBackdrop } from '../components/ui/BatikOrnaments';

const SAMPLE_QUESTIONS = [
  'Berapa sisa lilin malam dan apakah cukup untuk pesanan 20 kain seragam B2G besok?',
  'Berapa HPP pokok batik tulis motif daun mangga saat ini?',
  'Bagaimana ringkasan laba bersih bulan Mei 2026?',
];

export function DashboardAiPage({ embedded = false }) {
  const { showToast } = useToast();
  const csvInputRef = useRef(null);
  const chatTextareaRef = useRef(null);
  const chatContainerRef = useRef(null);

  const [periode, setPeriode] = useState('Mei 2026');
  const [kategori, setKategori] = useState('ALL');
  const [segmen, setSegmen] = useState('ALL');

  const [isLoadingDash, setIsLoadingDash] = useState(true);
  const [dashData, setDashData] = useState({
    data_label: dummyDashboardData.data_label,
    summary: dummyDashboardData.summary,
    trend: dummyDashboardData.trend,
    produk_terlaris: dummyDashboardData.produk_terlaris,
  });
  const [forecasts, setForecasts] = useState(dummyDashboardData.forecasts);

  const [insight, setInsight] = useState(dummyDashboardData.weekly_insight_ai);
  const [isInsightFallback, setIsInsightFallback] = useState(false);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  const [chatInput, setChatInput] = useState(SAMPLE_QUESTIONS[0]);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'assistant',
      intent: 'info',
      text: 'Halo, saya Asisten Finansial Azrya Batik. Tanyakan seputar HPP produk, rekap laba rugi, stok kain mori/lilin malam, atau cara penggunaan aplikasi.',
      sources: ['Konteks Usaha Azrya Batik'],
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isRagExpanded, setIsRagExpanded] = useState(false);
  const [uploadedCsvName, setUploadedCsvName] = useState('');

  useLayoutEffect(() => {
    const el = chatTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.min(Math.max(el.scrollHeight, 44), 180);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > 180 ? 'auto' : 'hidden';
  }, [chatInput, isRagExpanded]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [chatMessages, isChatLoading, isRagExpanded]);

  useEffect(() => {
    let active = true;
    setIsLoadingDash(true);
    Promise.all([
      getDashboardSummary({ periode, kategori, segmen }),
      getStockAndDemandForecast(),
    ])
      .then(([dashRes, forecastRes]) => {
        if (!active) return;
        if (dashRes?.data) setDashData(dashRes.data);
        if (forecastRes?.data) setForecasts(forecastRes.data);
      })
      .catch((err) => {
        if (active) showToast(err.message, 'error');
      })
      .finally(() => {
        if (active) setIsLoadingDash(false);
      });
    return () => {
      active = false;
    };
  }, [periode, kategori, segmen, showToast]);

  const maxTrendValue = useMemo(() => {
    const vals = (dashData.trend || []).map((t) => t.pendapatan || 0);
    return Math.max(1, ...vals);
  }, [dashData.trend]);

  const handleToggleInsightMode = async (simulateFallback) => {
    setIsLoadingInsight(true);
    try {
      const res = await getWeeklyInsight({ simulateFallback });
      if (res?.data) {
        setInsight(res.data);
        const fallbackActive = res.data.status === 'fallback_template';
        setIsInsightFallback(fallbackActive);
        if (fallbackActive) {
          showToast(
            'Kuota Gemini AI penuh/timeout. Menampilkan Ringkasan otomatis tanpa AI.',
            'warning'
          );
        } else {
          showToast('Ringkasan mingguan Gemini AI diperbarui.', 'success', 2500);
        }
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoadingInsight(false);
    }
  };

  const handleAskRag = async (e) => {
    e.preventDefault();
    const q = chatInput.trim();
    if (!q) return;

    setChatMessages((prev) => [...prev, { sender: 'user', text: q }]);
    setChatInput('');
    setIsChatLoading(true);
    try {
      const res = await askRagAssistant({ question: q, periode });
      const ans = res.data;
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          intent: ans.intent,
          text: ans.answer,
          sources: ans.sources || [],
        },
      ]);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleExportCsv = () => {
    const rows = [
      ['Periode', 'Pendapatan', 'HPP', 'Pengeluaran Operasional'],
      ...dashData.trend.map((t) => [t.periode, t.pendapatan, t.hpp, t.pengeluaran_op]),
    ];
    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-azrya-batik-${periode.toLowerCase().replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File CSV rekap keuangan berhasil diunduh.', 'success');
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedCsvName(file.name);
    showToast(`Berkas "${file.name}" siap diproses untuk pembaruan data analitik.`, 'success');
  };

  const streamlitUrl =
    import.meta.env.VITE_STREAMLIT_URL || 'https://azrya-batik-analytics.streamlit.app';

  const HeadingTag = embedded ? 'h2' : 'h1';

  return (
    <section className={embedded ? '' : 'mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8'}>
      {/* Header & Global Filters */}
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="space-y-1.5">
          <HeadingTag className="font-display text-2xl font-bold text-forest-900 sm:text-3xl">
            Dashboard Terintegrasi &amp; Asisten Finansial
          </HeadingTag>
          <p className="text-sm text-forest-800/80">
            Rekap laba rugi instan, tren produk terlaris, prediksi stok bahan baku, dan asisten AI Bahasa Indonesia.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <Select
            id="dash-filter-periode"
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            aria-label="Filter periode"
          >
            <option value="Mei 2026">Mei 2026 (Bulanan)</option>
            <option value="April 2026">April 2026 (Bulanan)</option>
            <option value="Q2 2026">Q2 2026 (Triwulan)</option>
          </Select>
          <Select
            id="dash-filter-kategori"
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            aria-label="Filter kategori produk"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="kain batik tulis">Kain Batik Tulis</option>
            <option value="seragam">Seragam Instansi</option>
            <option value="selendang">Selendang</option>
            <option value="tas">Tas Etnik</option>
          </Select>
          <Select
            id="dash-filter-segmen"
            value={segmen}
            onChange={(e) => setSegmen(e.target.value)}
            aria-label="Filter segmen pasar"
          >
            <option value="ALL">Semua Segmen (B2G, B2B, B2C)</option>
            <option value="B2G">Segmen B2G (Instansi)</option>
            <option value="B2B">Segmen B2B (Korporat)</option>
            <option value="B2C">Segmen B2C (Kolektor)</option>
          </Select>
        </div>
      </div>

      {/* 4 Kartu KPI */}
      {isLoadingDash ? (
        <KpiSkeletonGrid />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-soga-600/35 bg-white p-5 shadow-soft">
            <p className="text-[11px] font-bold uppercase tracking-wider text-forest-800/75">
              Omzet Penjualan
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-forest-900">
              {formatRupiah(dashData.summary.omzet)}
            </p>
            <p className="mt-1.5 text-xs font-semibold text-sage-600">
              ↗ {dashData.summary.pertumbuhan_omzet}
            </p>
          </div>

          <div className="rounded-2xl border border-soga-600/35 bg-white p-5 shadow-soft">
            <p className="text-[11px] font-bold uppercase tracking-wider text-forest-800/75">
              Total HPP Terpakai
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-soga-900">
              {formatRupiah(dashData.summary.hpp)}
            </p>
            <p className="mt-1.5 text-xs text-forest-800/75">
              {formatPercent(
                dashData.summary.omzet > 0
                  ? (dashData.summary.hpp / dashData.summary.omzet) * 100
                  : 0
              )}{' '}
              dari omzet
            </p>
          </div>

          <div className="rounded-2xl border border-soga-600/35 bg-white p-5 shadow-soft">
            <p className="text-[11px] font-bold uppercase tracking-wider text-forest-800/75">
              Laba Kotor
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-sage-600">
              {formatRupiah(dashData.summary.laba_kotor)}
            </p>
            <p className="mt-1.5 text-xs text-forest-800/75">
              Margin Kotor: {formatPercent(dashData.summary.margin_kotor_persen)}
            </p>
          </div>

          <div className="rounded-2xl border border-soga-600/35 bg-white p-5 shadow-soft">
            <p className="text-[11px] font-bold uppercase tracking-wider text-forest-800/75">
              Laba Bersih Operasional
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-forest-900">
              {formatRupiah(dashData.summary.laba_bersih)}
            </p>
            <p className="mt-1.5 text-xs font-semibold text-sage-600">
              {dashData.summary.arus_kas_status}
            </p>
          </div>
        </div>
      )}

      {/* Grafik Tren Laba Rugi & Produk Terlaris */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-soga-600/35 bg-white p-5 shadow-soft lg:col-span-7">
          <div className="border-b border-canvas-200 pb-3">
            <h2 className="font-display text-lg font-bold text-forest-900">
              Tren Pendapatan vs HPP ({periode})
            </h2>
          </div>

          <div className="mt-5 space-y-4">
            {dashData.trend.map((row) => {
              const revWidth = Math.max(8, Math.round((row.pendapatan / maxTrendValue) * 100));
              const hppWidth = Math.max(5, Math.round((row.hpp / maxTrendValue) * 100));
              return (
                <div key={row.periode} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-forest-900">{row.periode}</span>
                    <span className="text-forest-800/80">
                      Omzet {formatRupiah(row.pendapatan)} • HPP {formatRupiah(row.hpp)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 w-full overflow-hidden rounded-full bg-canvas-100">
                      <div
                        className="h-full rounded-full bg-forest-900 transition-all duration-300"
                        style={{ width: `${revWidth}%` }}
                      />
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-canvas-100">
                      <div
                        className="h-full rounded-full bg-soga-700 transition-all duration-300"
                        style={{ width: `${hppWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-forest-800/80">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-forest-900" /> Pendapatan
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-soga-700" /> HPP Produksi
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-soga-600/35 bg-white p-5 shadow-soft lg:col-span-5">
          <div className="flex items-center justify-between gap-2 border-b border-canvas-200 pb-3">
            <h2 className="font-display text-lg font-bold text-forest-900">
              Produk Terlaris
            </h2>
            <Badge variant="soga">Top Katalog</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {dashData.produk_terlaris.map((prod, idx) => (
              <div
                key={prod.nama}
                className="flex items-center justify-between gap-3 rounded-xl border border-canvas-200 bg-canvas-50/70 px-3.5 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-forest-900">
                    {idx + 1}. {prod.nama}
                  </p>
                  <p className="text-xs text-forest-800/75">
                    {prod.terjual} unit • Segmen {prod.segmen}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-soga-900">
                  {formatRupiah(prod.omzet)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Baris Tengah: Forecast Stok Bahan + Kartu Insight Mingguan Gemini AI */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Rekomendasi Pembelian Stok */}
        <div className="rounded-2xl border border-soga-600/40 bg-white p-5 shadow-card lg:col-span-5">
          <div className="flex items-start justify-between gap-2 border-b border-canvas-200 pb-3">
            <div className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-soga-900" />
              <h2 className="font-display text-lg font-bold text-forest-900">
                Rekomendasi Pembelian Stok
              </h2>
            </div>
            <Badge variant="neutral">DATA: ASLI &amp; SIMULASI</Badge>
          </div>

          <div className="mt-4 space-y-4">
            {forecasts.map((fc) => {
              const isLow = fc.stok_saat_ini < fc.stok_minimum;
              return (
                <div
                  key={fc.id}
                  className="rounded-xl border border-soga-400/50 bg-canvas-50 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-forest-900">{fc.nama_bahan}</p>
                      <p className="text-xs text-forest-800/75">
                        Pemakaian rata-rata: {fc.pemakaian_resep}
                      </p>
                    </div>
                    <Badge variant={isLow ? 'warning' : 'sage'}>{fc.status_stok}</Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-canvas-200 pt-3 text-xs">
                    <div>
                      <span className="block text-forest-800/70">Stok Saat Ini</span>
                      <span className="font-bold text-forest-900">
                        {fc.stok_saat_ini} {fc.satuan}
                      </span>
                    </div>
                    <div>
                      <span className="block text-forest-800/70">Safety Stock</span>
                      <span className="font-bold text-forest-900">
                        {fc.stok_minimum} {fc.satuan}
                      </span>
                    </div>
                    <div>
                      <span className="block text-forest-800/70">Saran Beli</span>
                      <span className="font-bold text-soga-900">
                        + {fc.rekomendasi_stok} {fc.satuan}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl bg-canvas-100 p-3 text-xs leading-relaxed text-forest-800/85">
            <strong>Formula:</strong> (Prediksi Permintaan × Pemakaian Resep) + Stok Pengaman - Stok Saat Ini. Label transparansi: <strong>SIMULASI</strong>.
          </div>
        </div>

        {/* Kartu Insight Mingguan Gemini AI (Dark Nusantara Card sesuai Component 1.png) */}
        <div className="relative overflow-hidden rounded-2xl border border-soga-600/45 bg-forest-900 p-5 text-canvas-50 shadow-elevated lg:col-span-7">
          <BatikDarkBackdrop />

          <div className="relative z-10 flex h-full flex-col justify-between space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-soga-600/30 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-soga-400" />
                  <h2 className="font-display text-lg font-bold text-canvas-50">
                    Kartu Insight Mingguan Gemini AI
                  </h2>
                </div>
                <p className="mt-0.5 text-xs text-sage-200/80">
                  {insight.segmen_highlight} • {insight.periode}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isInsightFallback ? (
                  <Badge variant="warning">Ringkasan otomatis tanpa AI</Badge>
                ) : (
                  <Badge variant="sage">AI Live (Gemini API)</Badge>
                )}
              </div>
            </div>

            {isLoadingInsight ? (
              <div className="space-y-3 py-4">
                <SkeletonBox className="h-16 w-full bg-forest-800" />
                <SkeletonBox className="h-24 w-full bg-forest-800" />
              </div>
            ) : (
              <div className="space-y-3 text-xs leading-relaxed sm:text-sm">
                <div className="rounded-xl border border-soga-600/30 bg-forest-800/80 p-3.5">
                  <p className="font-bold uppercase tracking-wider text-soga-400">
                    1. Ringkasan Kinerja
                  </p>
                  <p className="mt-1 text-canvas-50/95">{insight.isi_json.ringkasan}</p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-soga-600/30 bg-forest-800/75 p-3.5">
                    <p className="font-bold uppercase tracking-wider text-sage-200">
                      2. Sorotan Positif
                    </p>
                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-canvas-50/90">
                      {insight.isi_json.sorotan.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-amber-400/35 bg-forest-800/75 p-3.5">
                    <p className="font-bold uppercase tracking-wider text-amber-300">
                      3. Potensi Risiko
                    </p>
                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-canvas-50/90">
                      {insight.isi_json.risiko.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-xl border border-soga-600/40 bg-forest-800/90 p-3.5">
                  <p className="font-bold uppercase tracking-wider text-soga-400">
                    4. Rekomendasi AI
                  </p>
                  <ul className="mt-1 space-y-1 text-canvas-50/95">
                    {insight.isi_json.rekomendasi.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-soga-600/25 pt-3 text-[11px] text-sage-200/80">
              <span>
                Status: {isInsightFallback ? 'Mode Cadangan Tanpa AI' : 'AI Live (Gemini API)'} • Versi:{' '}
                {insight.prompt_version}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleInsightMode(true)}
                  className="rounded-lg border border-amber-400/50 px-2.5 py-1 font-semibold text-amber-200 hover:bg-forest-800"
                >
                  Uji Fallback Kuota Habis
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleInsightMode(false)}
                  className="inline-flex items-center gap-1 rounded-lg border border-soga-400/50 px-2.5 py-1 font-semibold text-canvas-50 hover:bg-forest-800"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Muat AI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Baris Bawah: Asisten Chat RAG & Analitik Streamlit / CSV */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Asisten Tanya-Jawab Finansial Azrya (RAG) */}
        <div
          className={`flex flex-col rounded-2xl border border-soga-600/40 bg-white p-5 shadow-card transition-all ${
            isRagExpanded ? 'lg:col-span-12' : 'lg:col-span-7'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-canvas-200 pb-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-soga-900 text-canvas-50">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-base font-bold text-forest-900">
                  Asisten Tanya-Jawab Finansial Azrya (RAG)
                </h2>
                <p className="text-xs text-forest-800/75">
                  Memahami konteks HPP, laporan keuangan, stok batik, dan panduan aplikasi
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsRagExpanded((prev) => !prev)}
              aria-label={isRagExpanded ? 'Perkecil kartu asisten RAG' : 'Perbesar kartu asisten RAG'}
              aria-pressed={isRagExpanded}
              title={isRagExpanded ? 'Perkecil tampilan RAG' : 'Perbesar tampilan RAG'}
              className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-soga-400/60 bg-canvas-50 px-2.5 py-1.5 text-xs font-semibold text-forest-900 transition-colors hover:bg-canvas-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soga-700"
            >
              {isRagExpanded ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5 text-soga-900" aria-hidden="true" />
                  <span className="hidden sm:inline">Perkecil</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5 text-soga-900" aria-hidden="true" />
                  <span className="hidden sm:inline">Perbesar</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {SAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setChatInput(q);
                  chatTextareaRef.current?.focus();
                }}
                className="rounded-full border border-soga-400/60 bg-canvas-50 px-3 py-1 text-left text-[11px] font-medium text-forest-900 hover:bg-canvas-100"
              >
                {q}
              </button>
            ))}
          </div>

          <div
            ref={chatContainerRef}
            className={`mt-3 resize-y space-y-2.5 overflow-y-auto rounded-xl border border-canvas-200 bg-canvas-50/70 p-3.5 transition-all ${
              isRagExpanded ? 'min-h-[320px] max-h-[520px]' : 'min-h-[160px] max-h-64'
            }`}
          >
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-3 text-xs leading-relaxed sm:text-sm ${
                  msg.sender === 'user'
                    ? 'ml-auto max-w-[85%] bg-forest-900 text-canvas-50'
                    : 'mr-auto max-w-[92%] border border-soga-400/50 bg-white text-forest-900'
                }`}
              >
                {msg.sender === 'assistant' ? (
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-soga-900">
                    <Bot className="h-3.5 w-3.5" />
                    <span>Asisten Azrya ({msg.intent || 'rag'})</span>
                  </div>
                ) : null}
                <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{msg.text}</p>
                {msg.sources && msg.sources.length > 0 ? (
                  <p className="mt-1.5 text-[11px] text-forest-800/70">
                    Sumber: {msg.sources.join(', ')}
                  </p>
                ) : null}
              </div>
            ))}
            {isChatLoading ? (
              <div className="flex items-center gap-2 text-xs text-soga-900">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Menyusun jawaban dari data Azrya Batik...</span>
              </div>
            ) : null}
          </div>

          <form onSubmit={handleAskRag} className="mt-3 flex items-end gap-2">
            <textarea
              ref={chatTextareaRef}
              rows={1}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!isChatLoading && chatInput.trim()) {
                    handleAskRag(e);
                  }
                }
              }}
              placeholder="Ketik pertanyaan seputar HPP atau laporan kas Azrya..."
              aria-label="Pertanyaan untuk asisten finansial"
              className="min-h-11 min-w-0 flex-1 resize-none rounded-xl border border-soga-400/70 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-forest-900 placeholder:text-soga-400 [overflow-wrap:anywhere] focus:outline-none focus:ring-2 focus:ring-soga-700 sm:text-base"
            />
            <Button
              type="submit"
              variant="primary"
              isLoading={isChatLoading}
              className="shrink-0 self-end whitespace-nowrap"
            >
              <span className="inline-flex items-center gap-1.5">
                <span>Kirim</span>
                <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
              </span>
            </Button>
          </form>
          <p className="mt-1.5 text-[11px] text-forest-800/65">
            Tekan Enter untuk mengirim, Shift + Enter untuk baris baru.
          </p>
        </div>

        {/* Analitik Mendalam: Unggah CSV/Excel & Tautan Dashboard Streamlit */}
        <div className="flex flex-col justify-between rounded-2xl border border-soga-600/40 bg-white p-5 shadow-card lg:col-span-5">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-soga-700">
              Analitik Mendalam
            </p>
            <h2 className="font-display text-xl font-bold text-forest-900">
              Dashboard Streamlit &amp; Ekspor CSV
            </h2>
            <p className="text-sm leading-relaxed text-forest-800/80">
              Unggah berkas pembukuan lama (CSV/Excel) untuk pembaruan data analitik atau buka dashboard analitik lanjutan tim Data Science di Streamlit.
            </p>

            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleCsvUpload}
              className="sr-only"
            />

            <div className="grid grid-cols-1 gap-2.5 pt-2 sm:grid-cols-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => csvInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                <span>Unggah CSV/Excel</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCsv}>
                <Download className="h-4 w-4" />
                <span>Unduh Rekap CSV</span>
              </Button>
            </div>

            {uploadedCsvName ? (
              <p className="rounded-lg bg-sage-200/40 px-3 py-2 text-xs font-medium text-forest-900">
                Berkas terpilih: <strong>{uploadedCsvName}</strong>
              </p>
            ) : null}
          </div>

          <div className="mt-5 space-y-2 border-t border-canvas-200 pt-4">
            <a
              href={streamlitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-forest-900 px-4 py-2.5 text-sm font-semibold text-canvas-50 transition-colors hover:bg-forest-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soga-700"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Buka Dashboard Streamlit</span>
            </a>
            <div className="flex items-start gap-2 text-[11px] text-forest-800/75">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-soga-700" />
              <span>
                Tautan eksternal diarahkan ke aplikasi Streamlit Analitik Data Science Azrya Batik.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
