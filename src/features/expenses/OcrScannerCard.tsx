import type { ChangeEvent } from 'react';
import { Camera, Image as ImageIcon, Info } from 'lucide-react';

interface OcrScannerCardProps {
  previewImageUrl: string;
  selectedFileName?: string;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSwitchToManual: () => void;
}

export function OcrScannerCard({
  previewImageUrl,
  selectedFileName = '',
  onFileChange,
  onSwitchToManual,
}: OcrScannerCardProps) {
  return (
    <div className="rounded-2xl border border-soga-600/40 bg-white p-5 shadow-card lg:col-span-5">
      <p className="text-xs font-bold uppercase tracking-wider text-forest-900">
        Pemindai Nota
      </p>

      <div className="relative mt-4 flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-soga-600/50 bg-canvas-50 px-4 py-8 text-center transition-colors focus-within:ring-2 focus-within:ring-soga-700 hover:border-soga-900 hover:bg-canvas-100/80">
        <input
          id="ocr-file-input"
          type="file"
          accept="image/*"
          onChange={onFileChange}
          aria-label="Pilih atau ambil foto nota belanja"
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-soga-900/10 text-soga-900">
          <Camera className="h-6 w-6" />
        </div>
        <p className="mt-3 text-sm font-bold text-forest-900">
          Ketuk untuk Ambil Foto Nota
        </p>
        <p className="mt-1 max-w-xs text-xs text-forest-800/75">
          atau pilih file gambar bukti pembayaran (JPG/PNG, maks 5 MB)
        </p>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-sage-400 bg-white px-3 py-1 text-[11px] font-semibold text-sage-600">
          FastAPI OCR Engine Ready
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-soga-400/50 bg-canvas-100 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-forest-900">Pratinjau Citra Nota</p>
          {selectedFileName ? (
            <span className="max-w-44 truncate rounded bg-white px-2 py-0.5 text-[11px] font-medium text-forest-800">
              {selectedFileName}
            </span>
          ) : null}
        </div>
        {previewImageUrl ? (
          <img
            src={previewImageUrl}
            alt="Pratinjau nota belanja bahan batik"
            className="max-h-48 w-full rounded-lg bg-white object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-soga-400/60 bg-white/70 px-4 py-6 text-center text-xs text-forest-800/70">
            <ImageIcon className="mb-1.5 h-5 w-5 text-soga-700/70" />
            <span>Belum ada gambar nota terpilih.</span>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-soga-400/50 bg-canvas-100/70 p-4 text-xs leading-relaxed text-forest-800">
        <p className="flex items-center gap-1.5 font-semibold text-soga-900">
          <Info className="h-4 w-4 shrink-0" />
          <span>Panduan Foto Nota Akurat:</span>
        </p>
        <p className="mt-1">
          Pastikan nota diletakkan di permukaan datar, cahaya terang (tidak berbayang), dan teks angka total terlihat jelas tanpa lipatan.
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-canvas-200 pt-3 text-xs">
        <span className="text-forest-800/75">Gagal OCR atau nota tulisan tangan?</span>
        <button
          type="button"
          onClick={onSwitchToManual}
          className="font-semibold text-soga-900 hover:underline"
        >
          Input Manual →
        </button>
      </div>
    </div>
  );
}
