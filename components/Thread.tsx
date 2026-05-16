'use client';
import { relativeTime, cn } from '@/lib/utils';

export type ThreadItem =
  | { kind: 'message'; id: string; content: string; at: string; fromName: string; fromSlug: string; fromRole: string }
  | { kind: 'reply'; id: string; content: string; at: string; toName: string; toSlug: string };

export function Thread({
  items,
  perspective,
}: {
  items: ThreadItem[];
  perspective: 'staff' | 'guest';
}) {
  if (!items.length) {
    return (
      <div className="text-[13px] text-stone italic font-serif">No messages yet.</div>
    );
  }
  return (
    <ol className="flex flex-col gap-3">
      {items.map((it) => {
        const isFromStaff = it.kind === 'message';
        const onLeft = perspective === 'staff' ? !isFromStaff : isFromStaff;
        return (
          <li
            key={it.id}
            className={cn('flex', onLeft ? 'justify-start' : 'justify-end')}
          >
            <div
              className={cn(
                'max-w-[78%] border px-4 py-3',
                onLeft
                  ? 'bg-paperLight border-hair'
                  : 'bg-whisper border-hair'
              )}
              style={{ borderRadius: 2 }}
            >
              <div
                className={cn(
                  'uppercase mb-1 text-stone',
                  'text-[9.5px] tracking-[0.22em]'
                )}
              >
                {it.kind === 'message' ? it.fromName : 'You'}
                <span className="opacity-70"> · {relativeTime(it.at)}</span>
              </div>
              <div className="whitespace-pre-wrap text-[15.5px] leading-[1.55] font-serif text-inkSoft">
                {it.content}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
