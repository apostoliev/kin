import { cn } from '@/lib/utils';

type Tone = 'paper' | 'light' | 'mid' | 'dark';

const tones: Record<Tone, { bg: string; fg: string }> = {
  paper: { bg: '#E6E0D6', fg: '#3a342d' },
  light: { bg: '#D8D3CB', fg: '#2a251f' },
  mid: { bg: '#b5ab9e', fg: '#2a251f' },
  dark: { bg: '#3a342d', fg: '#f0ebe1' },
};

export function Initials({
  name,
  size = 44,
  tone = 'paper',
  className,
}: {
  name: string;
  size?: number;
  tone?: Tone;
  className?: string;
}) {
  const initials = (name || '?')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const { bg, fg } = tones[tone];
  return (
    <div
      className={cn('flex items-center justify-center flex-shrink-0 rounded-full font-serif leading-none', className)}
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        fontSize: size * 0.4,
        fontWeight: 500,
      }}
    >
      {initials}
    </div>
  );
}
