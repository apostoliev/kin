import { cn } from '@/lib/utils';

export function IrisWordmark({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn('font-serif leading-none text-ink select-none', className)}
      style={{
        fontSize: size,
        fontWeight: 500,
        letterSpacing: `${size * 0.012}px`,
      }}
    >
      Iris
    </span>
  );
}

export function IrisLockup({
  property = 'Rosewood · Sand Hill',
  className,
}: {
  property?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'uppercase text-stone',
        className
      )}
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 10,
        letterSpacing: '0.30em',
        lineHeight: 1,
      }}
    >
      {property}
    </span>
  );
}

export function MaitreMark({
  size = 14,
  color,
}: {
  size?: number;
  color?: string;
}) {
  const c = color ?? 'var(--iris-green)';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <circle
        cx="12"
        cy="12"
        r="10.6"
        fill="none"
        stroke={c}
        strokeWidth="0.7"
        opacity="0.85"
      />
      <text
        x="12"
        y="16.4"
        textAnchor="middle"
        fontFamily='"EB Garamond", serif'
        fontSize="13.5"
        fontWeight="500"
        fontStyle="italic"
        fill={c}
      >
        M
      </text>
    </svg>
  );
}

export function IrisCipher({
  size = 24,
  color,
}: {
  size?: number;
  color?: string;
}) {
  const c = color ?? '#1A1A1A';
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
      <line x1="3" y1="16" x2="9" y2="16" stroke={c} strokeWidth="0.6" opacity="0.7" />
      <line x1="23" y1="16" x2="29" y2="16" stroke={c} strokeWidth="0.6" opacity="0.7" />
      <text
        x="16"
        y="22.5"
        textAnchor="middle"
        fontFamily='"EB Garamond", serif'
        fontSize="22"
        fontWeight="500"
        fontStyle="italic"
        fill={c}
      >
        I
      </text>
    </svg>
  );
}
