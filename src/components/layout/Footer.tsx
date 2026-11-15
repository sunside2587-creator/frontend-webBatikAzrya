import { Phone } from 'lucide-react';
import { cn } from '../../utils/cn';
import { BatikFooterOrnament } from '../ui/BatikOrnaments';

interface FooterProps {
  className?: string;
}

const WHATSAPP_NUMBER = '0897-7488-528';
const COPYRIGHT_TEXT = '© 2026 Azrya Batik Probolinggo';

export function Footer({ className = '' }: FooterProps) {
  return (
    <footer className={cn('mt-12 bg-forest-900 text-canvas-50', className)}>
      <BatikFooterOrnament />

      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-sage-200/90 sm:flex-row sm:px-6 lg:px-8">
        <p>{COPYRIGHT_TEXT}</p>
        <p className="inline-flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-soga-400" aria-hidden="true" />
          <span>WhatsApp {WHATSAPP_NUMBER}</span>
        </p>
      </div>
    </footer>
  );
}
