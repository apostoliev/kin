import { cn } from '@/lib/utils';

export function SmallCaps({
  children,
  size = 10.5,
  tracking = 0.18,
  color,
  weight = 500,
  className,
  as: As = 'span',
}: {
  children: React.ReactNode;
  size?: number;
  tracking?: number;
  color?: string;
  weight?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  return (
    <As
      className={cn('uppercase', className)}
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: size,
        letterSpacing: `${tracking}em`,
        fontWeight: weight,
        color: color ?? '#8B8680',
        lineHeight: 1.3,
      }}
    >
      {children}
    </As>
  );
}
