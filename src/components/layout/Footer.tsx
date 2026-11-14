import { Clock, MapPin, Phone } from 'lucide-react';
import { ROUTES, type RouteId } from '../../routes/routeConfig';
import { BatikFooterOrnament } from '../ui/BatikOrnaments';

interface FooterProps {
  onNavigate: (route: RouteId) => void;
}

const FOOTER_LINKS: ReadonlyArray<{ id: RouteId; label: string }> = [
  { id: ROUTES.POS, label: 'POS Kasir & Margin' },
  { id: ROUTES.EXPENSES, label: 'Pengeluaran & Scan OCR' },
  { id: ROUTES.HPP, label: 'Kalkulator HPP Batik' },
  { id: ROUTES.DASHBOARD, label: 'Dashboard & AI Advisor' },
];

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="mt-16 border-t border-soga-600/30 bg-forest-900 text-canvas-50">
      <BatikFooterOrnament />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="/assets/logo_azrya_batik.png"
                alt="Logo Azrya Batik"
                className="h-11 w-11 rounded-lg border border-soga-600/40 bg-forest-800 object-contain p-1"
              />
              <div>
                <p className="font-display text-lg font-bold tracking-wider text-canvas-50">
                  AZRYA BATIK
                </p>
                <p className="text-xs text-soga-400">Probolinggo • Jawa Timur</p>
              </div>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-sage-200/85">
              Produsen batik tulis katun primisima, seragam instansi, selendang, dan tas etnik kombinasi kulit di Probolinggo.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-soga-400">
              Navigasi Sistem
            </h3>
            <ul className="space-y-2 text-sm text-sage-200/90">
              {FOOTER_LINKS.map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(link.id)}
                    className="hover:text-canvas-50 hover:underline"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-soga-400">
              Galeri &amp; Rumah Produksi
            </h3>
            <ul className="space-y-2.5 text-sm text-sage-200/90">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-soga-400" />
                <span>Kota/Kab. Probolinggo, Jawa Timur</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-soga-400" />
                <span>WhatsApp Galeri: 0897-7488-528</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-soga-400" />
                <span>Senin hingga Jumat dan Minggu mulai pukul 08.00–21.00 WIB</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-soga-600/25 pt-6 text-xs text-soga-400/85 sm:flex-row sm:items-center">
          <p>© 2026 Azrya Batik Probolinggo.</p>
        </div>
      </div>
    </footer>
  );
}
