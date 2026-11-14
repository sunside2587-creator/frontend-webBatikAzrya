import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { SAMPLE_RAG_QUESTIONS } from '../../constants';
import { useToast } from '../../hooks/useToast';
import { isRequestCanceled } from '../../services/apiClient';
import {
  askRagAssistant,
  getDashboardSummary,
  getStockAndDemandForecast,
  getWeeklyInsight,
} from '../../services/dashboardService';
import { dummyDashboardData } from '../../services/mockData';
import type {
  DashboardData,
  RagChatMessage,
  StockForecast,
  WeeklyInsight,
} from '../../types';

const INITIAL_CHAT_MESSAGES: RagChatMessage[] = [
  {
    sender: 'assistant',
    intent: 'info',
    text: 'Halo, saya Asisten Finansial Azrya Batik. Tanyakan seputar HPP produk, rekap laba rugi, stok kain mori/lilin malam, atau cara penggunaan aplikasi.',
    sources: ['Konteks Usaha Azrya Batik'],
  },
];

export function useDashboardFeature() {
  const { showToast } = useToast();

  const [periode, setPeriode] = useState('Mei 2026');
  const [kategori, setKategori] = useState('ALL');
  const [segmen, setSegmen] = useState('ALL');

  const [isLoadingDash, setIsLoadingDash] = useState(true);
  const [dashData, setDashData] = useState<DashboardData>({
    data_label: dummyDashboardData.data_label,
    summary: dummyDashboardData.summary,
    trend: dummyDashboardData.trend,
    produk_terlaris: dummyDashboardData.produk_terlaris,
  });
  const [forecasts, setForecasts] = useState<StockForecast[]>(
    dummyDashboardData.forecasts
  );

  const [insight, setInsight] = useState<WeeklyInsight>(
    dummyDashboardData.weekly_insight_ai
  );
  const [isInsightFallback, setIsInsightFallback] = useState(false);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  const [chatInput, setChatInput] = useState<string>(SAMPLE_RAG_QUESTIONS[0]);
  const [chatMessages, setChatMessages] = useState<RagChatMessage[]>(
    INITIAL_CHAT_MESSAGES
  );
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isRagExpanded, setIsRagExpanded] = useState(false);
  const [uploadedCsvName, setUploadedCsvName] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingDash(true);

    Promise.all([
      getDashboardSummary({ periode, kategori, segmen }, controller.signal),
      getStockAndDemandForecast(controller.signal),
    ])
      .then(([dashRes, forecastRes]) => {
        if (controller.signal.aborted) return;
        if (dashRes?.data) setDashData(dashRes.data);
        if (forecastRes?.data) setForecasts(forecastRes.data);
      })
      .catch((err) => {
        if (controller.signal.aborted || isRequestCanceled(err)) return;
        showToast(
          err instanceof Error ? err.message : 'Gagal memuat ringkasan dashboard.',
          'error'
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingDash(false);
      });

    return () => {
      controller.abort();
    };
  }, [periode, kategori, segmen, showToast]);

  const maxTrendValue = useMemo(() => {
    const vals = (dashData.trend || []).map((t) => t.pendapatan || 0);
    return Math.max(1, ...vals);
  }, [dashData.trend]);

  const handleToggleInsightMode = useCallback(
    async (simulateFallback: boolean) => {
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
        showToast(
          err instanceof Error ? err.message : 'Gagal memuat insight mingguan.',
          'error'
        );
      } finally {
        setIsLoadingInsight(false);
      }
    },
    [showToast]
  );

  const handleAskRag = useCallback(
    async (e?: FormEvent | KeyboardEvent) => {
      e?.preventDefault();
      const question = chatInput.trim();
      if (!question || isChatLoading) return;

      setChatMessages((prev) => [...prev, { sender: 'user', text: question }]);
      setChatInput('');
      setIsChatLoading(true);
      try {
        const res = await askRagAssistant({ question, periode });
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
        showToast(
          err instanceof Error ? err.message : 'Gagal menghubungi asisten RAG.',
          'error'
        );
      } finally {
        setIsChatLoading(false);
      }
    },
    [chatInput, isChatLoading, periode, showToast]
  );

  const handleExportCsv = useCallback(() => {
    const rows = [
      ['Periode', 'Pendapatan', 'HPP', 'Pengeluaran Operasional'],
      ...dashData.trend.map((t) => [t.periode, t.pendapatan, t.hpp, t.pengeluaran_op]),
    ];
    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-azrya-batik-${periode.toLowerCase().replace(/\s+/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('File CSV rekap keuangan berhasil diunduh.', 'success');
  }, [dashData.trend, periode, showToast]);

  const handleCsvUpload = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadedCsvName(file.name);
      showToast(
        `Berkas "${file.name}" siap diproses untuk pembaruan data analitik.`,
        'success'
      );
    },
    [showToast]
  );

  const handleToggleRagExpand = useCallback(() => {
    setIsRagExpanded((prev) => !prev);
  }, []);

  return {
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
  };
}
