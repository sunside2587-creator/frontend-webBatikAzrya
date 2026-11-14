import { useRef } from 'react';
import {
  AlertTriangle,
  Download,
  ExternalLink,
  PackageCheck,
  Upload,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { KpiCardsGrid } from '../features/dashboard/KpiCardsGrid';
import { RagAssistantCard } from '../features/dashboard/RagAssistantCard';
import { WeeklyInsightCard } from '../features/dashboard/WeeklyInsightCard';
import { useDashboardFeature } from '../features/dashboard/useDashboardFeature';
import { cn } from '../utils/cn';
import { formatRupiah } from '../utils/formatters';

interface DashboardAiPageProps {
  embedded?: boolean;
}

export function DashboardAiPage({ embedded = false }: DashboardAiPageProps) {
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const {
    periode,
    setPeriode,
    kategori,
    setKategori,
    segmen,
    setSegmen,
    isLoadingDash,
    dashData,
    forecasts,
    maxTrendValue,
    insight,
    isInsightFallback,
    isLoadingInsight,
    chatInput,
    setChatInput,
    chatMessages,
    isChatLoading,
    isRagExpanded,
    uploadedCsvName,
    handleToggleInsightMode,
    handleAskRag,
    handleExportCsv,
    handleCsvUpload,
    handleToggleRagExpand,
  } = useDashboardFeature();

  const streamlitUrl =
    import.meta.env.VITE_STREAMLIT_URL || 'https://azrya-batik-analytics.streamlit.app';

  const HeadingTag = embedded ? 'h2' : 'h1';

  return (
    <section className={cn(!embedded && 'mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8')}>
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

      <KpiCardsGrid summary={dashData.summary} isLoading={isLoadingDash} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-soga-600/35 bg-white p-5 shadow-soft lg:col-span-7">
          <div className="border-b border-canvas-200 pb-3">
            <h2 className="font-display text-lg font-bold text-forest-900">
              Tren Pendapatan vs HPP ({periode})
            </h2>
          </div>

          <div className="mt-5 space-y-4">
            {dashData.trend.map((row) => {
              const revWidth = Math.max(
                8,
                Math.round((row.pendapatan / maxTrendValue) * 100)
              );
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

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
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

        <WeeklyInsightCard
          insight={insight}
          isFallback={isInsightFallback}
          isLoading={isLoadingInsight}
          onToggleMode={handleToggleInsightMode}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <RagAssistantCard
          chatInput={chatInput}
          onChangeChatInput={setChatInput}
          chatMessages={chatMessages}
          isChatLoading={isChatLoading}
          isExpanded={isRagExpanded}
          onToggleExpand={handleToggleRagExpand}
          onSubmitQuestion={handleAskRag}
        />

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
export default DashboardAiPage;
