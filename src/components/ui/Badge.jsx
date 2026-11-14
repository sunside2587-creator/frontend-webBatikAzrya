const BADGE_VARIANTS = {
  sage: 'bg-sage-200/70 text-forest-900 border-sage-400/60',
  forest: 'bg-forest-900 text-canvas-50 border-forest-800',
  soga: 'bg-soga-900/10 text-soga-900 border-soga-600/40',
  warning: 'bg-amber-100 text-amber-900 border-amber-400',
  danger: 'bg-red-100 text-red-800 border-red-300',
  neutral: 'bg-canvas-100 text-forest-800 border-soga-400/60',
};

export function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${
        BADGE_VARIANTS[variant] || BADGE_VARIANTS.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}
