import { cn } from '../../utils/cn';

interface BatikHeaderRibbonProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export function BatikHeaderRibbon({
  variant = 'light',
  className = '',
}: BatikHeaderRibbonProps) {
  const isDark = variant === 'dark';
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative h-2.5 w-full select-none overflow-hidden',
        isDark ? 'bg-forest-900' : 'bg-canvas-100',
        className
      )}
    >
      <div
        className={cn('h-full w-full', isDark ? 'opacity-50' : 'opacity-60')}
        style={{
          backgroundImage: isDark
            ? "url('/assets/batik-header-trim-light.png')"
            : "url('/assets/batik-header-trim.png')",
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'center center',
          backgroundSize: 'auto 10px',
        }}
      />
    </div>
  );
}

interface BatikSectionDividerProps {
  label?: string;
  className?: string;
}

export function BatikSectionDivider({
  label = '',
  className = '',
}: BatikSectionDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('relative my-8 flex items-center justify-center gap-4', className)}
    >
      <div className="flex flex-1 items-center">
        <div
          className="h-6 w-full opacity-35"
          style={{
            backgroundImage: "url('/assets/batik-header-trim.png')",
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'center center',
            backgroundSize: 'auto 18px',
          }}
        />
      </div>
      <div className="flex shrink-0 items-center gap-2 rounded-full border border-soga-600/45 bg-canvas-50 px-4 py-1.5 text-xs font-semibold tracking-wide text-soga-900 shadow-sm">
        <span className="h-2 w-2 rotate-45 bg-soga-700" />
        <span>{label || 'Azrya Batik Nusantara'}</span>
        <span className="h-2 w-2 rotate-45 bg-soga-700" />
      </div>
      <div className="flex flex-1 items-center">
        <div
          className="h-6 w-full opacity-35"
          style={{
            backgroundImage: "url('/assets/batik-header-trim.png')",
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'center center',
            backgroundSize: 'auto 18px',
          }}
        />
      </div>
    </div>
  );
}

interface BatikSideBorderProps {
  className?: string;
  position?: 'left' | 'right';
}

export function BatikSideBorder({
  className = '',
  position = 'right',
}: BatikSideBorderProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-y-0 w-3.5 overflow-hidden opacity-45',
        position === 'left' ? 'left-0' : 'right-0',
        className
      )}
    >
      <div
        className="h-full w-full"
        style={{
          backgroundImage: "url('/assets/batik-side-trim.png')",
          backgroundRepeat: 'repeat-y',
          backgroundPosition: 'center top',
          backgroundSize: '100% auto',
        }}
      />
    </div>
  );
}

export function BatikFooterOrnament({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative h-11 w-full overflow-hidden border-y border-soga-600/35 bg-forest-900',
        className
      )}
    >
      <div
        className="h-full w-full opacity-45"
        style={{
          backgroundImage: "url('/assets/batik-footer-trim.png')",
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'center center',
          backgroundSize: 'auto 28px',
        }}
      />
    </div>
  );
}

export function BatikDarkBackdrop({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <img
        src="/assets/corak_batikHitam.jpg"
        alt=""
        className="h-full w-full object-cover object-left opacity-20 mix-blend-screen"
        style={{
          maskImage:
            'linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0) 100%)',
        }}
      />
    </div>
  );
}
