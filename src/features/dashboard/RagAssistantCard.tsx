import {
  useEffect,
  useLayoutEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import {
  Bot,
  Maximize2,
  MessageSquare,
  Minimize2,
  RefreshCw,
  Send,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { BUSINESS_CONSTANTS, SAMPLE_RAG_QUESTIONS } from '../../constants';
import type { RagChatMessage } from '../../types';
import { cn } from '../../utils/cn';

interface RagAssistantCardProps {
  chatInput: string;
  onChangeChatInput: (val: string) => void;
  chatMessages: RagChatMessage[];
  isChatLoading: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSubmitQuestion: (e: FormEvent | KeyboardEvent) => void;
}

export function RagAssistantCard({
  chatInput,
  onChangeChatInput,
  chatMessages,
  isChatLoading,
  isExpanded,
  onToggleExpand,
  onSubmitQuestion,
}: RagAssistantCardProps) {
  const chatTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = chatTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.min(
      Math.max(el.scrollHeight, BUSINESS_CONSTANTS.RAG_TEXTAREA_MIN_HEIGHT),
      BUSINESS_CONSTANTS.RAG_TEXTAREA_MAX_HEIGHT
    );
    el.style.height = `${nextHeight}px`;
    el.style.overflowY =
      el.scrollHeight > BUSINESS_CONSTANTS.RAG_TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden';
  }, [chatInput, isExpanded]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [chatMessages, isChatLoading, isExpanded]);

  const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isChatLoading && chatInput.trim()) {
        onSubmitQuestion(e);
      }
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border border-soga-600/40 bg-white p-5 shadow-card transition-all',
        isExpanded ? 'lg:col-span-12' : 'lg:col-span-7'
      )}
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
          onClick={onToggleExpand}
          aria-label={isExpanded ? 'Perkecil kartu asisten RAG' : 'Perbesar kartu asisten RAG'}
          aria-pressed={isExpanded}
          title={isExpanded ? 'Perkecil tampilan RAG' : 'Perbesar tampilan RAG'}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-soga-400/60 bg-canvas-50 px-2.5 py-1.5 text-xs font-semibold text-forest-900 transition-colors hover:bg-canvas-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soga-700"
        >
          {isExpanded ? (
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
        {SAMPLE_RAG_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => {
              onChangeChatInput(q);
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
        className={cn(
          'mt-3 resize-y space-y-2.5 overflow-y-auto rounded-xl border border-canvas-200 bg-canvas-50/70 p-3.5 transition-all',
          isExpanded ? 'min-h-[320px] max-h-[520px]' : 'min-h-40 max-h-64'
        )}
      >
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              'rounded-xl p-3 text-xs leading-relaxed sm:text-sm',
              msg.sender === 'user'
                ? 'ml-auto max-w-[85%] bg-forest-900 text-canvas-50'
                : 'mr-auto max-w-[92%] border border-soga-400/50 bg-white text-forest-900'
            )}
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

      <form onSubmit={onSubmitQuestion} className="mt-3 flex items-end gap-2">
        <textarea
          ref={chatTextareaRef}
          rows={1}
          value={chatInput}
          onChange={(e) => onChangeChatInput(e.target.value)}
          onKeyDown={handleTextareaKeyDown}
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
  );
}
