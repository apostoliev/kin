'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export type PersonaOption = {
  slug: string;
  name: string;
  role: string;
  title: string | null;
};

export function PersonaSwitcher({ options }: { options: PersonaOption[] }) {
  const pathname = usePathname();
  const first = pathname.split('/').filter(Boolean)[0] ?? null;
  // Treat /manager as Carol
  const activeSlug = first === 'manager' ? 'carol' : first;

  return (
    <div className="flex items-center gap-0 border border-hair bg-paperLight">
      {options.map((opt) => {
        const active = opt.slug === activeSlug;
        const href = opt.role === 'manager' ? '/manager' : `/${opt.slug}`;
        return (
          <Link
            key={opt.slug}
            href={href}
            className={cn(
              'px-3 py-2 text-[10px] uppercase tracking-[0.18em] transition-colors border-r border-hair last:border-r-0',
              active
                ? 'bg-discovery text-paperLight'
                : 'text-stone hover:bg-whisper hover:text-ink'
            )}
          >
            <span className="font-medium">{opt.name.split(' ')[0]}</span>
            <span className="ml-1.5 opacity-70">· {roleLabel(opt.role)}</span>
          </Link>
        );
      })}
    </div>
  );
}

function roleLabel(role: string) {
  return role.replace('_', ' ');
}
