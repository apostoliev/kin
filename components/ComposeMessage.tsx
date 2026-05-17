'use client';
import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Pencil, X, Loader2 } from 'lucide-react';
import { Initials } from '@/components/iris/Initials';
import { SmallCaps } from '@/components/iris/SmallCaps';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function ComposeMessage({
  placeMakerId,
  placeMakerName,
  placeMakerRole,
  guestId,
  guestName,
  onSent,
}: {
  placeMakerId: string;
  placeMakerName: string;
  placeMakerRole: string;
  guestId: string;
  guestName: string;
  onSent?: (info: { messageId: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setContent('');
      setStatus('idle');
      setError(null);
    }
  }, [open]);

  const firstName = guestName.split(' ')[0];

  async function send() {
    if (!content.trim()) return;
    setStatus('sending');
    setError(null);
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromPlaceMakerId: placeMakerId,
          guestId,
          content: content.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'send failed');
      setStatus('sent');
      onSent?.({ messageId: data.messageId });
      setTimeout(() => setOpen(false), 800);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'unknown');
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className="button-ghost">
          <Pencil className="h-4 w-4" /> Write a custom message
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(560px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-cream p-6 shadow-2xl">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <Initials name={placeMakerName} size={42} tone="dark" />
              <div className="flex flex-col">
                <Dialog.Title className="font-serif text-[22px] text-ink leading-tight">
                  Write to {firstName}
                </Dialog.Title>
                <SmallCaps size={9.5} tracking={0.22}>
                  from {placeMakerName} · {placeMakerRole.replace('_', ' ')}
                </SmallCaps>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md p-1 text-muted hover:bg-sandlight"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="sr-only">
            Compose a custom message in your voice to send directly to{' '}
            {firstName}.
          </Dialog.Description>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={status === 'sending' || status === 'sent'}
            placeholder={`Write to ${firstName} in your own voice…`}
            rows={6}
            autoFocus
            className="w-full resize-y rounded-md border border-mist bg-whisper p-3 font-serif text-[16px] leading-[1.55] focus:outline-none focus:ring-2 focus:ring-discovery/30"
          />

          <p className="text-[11px] uppercase tracking-[0.22em] text-stone mt-3">
            Goes out as SMS to {firstName} · with a deep link back to your thread.
          </p>

          {error && (
            <p className="text-[12px] text-pending mt-3">
              Couldn&apos;t send: {error}
            </p>
          )}

          <div className="flex justify-end gap-3 mt-5">
            <Dialog.Close asChild>
              <button type="button" className="button-ghost" disabled={status === 'sending'}>
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={send}
              disabled={!content.trim() || status === 'sending' || status === 'sent'}
              className="button-primary"
            >
              {status === 'sending' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                </>
              ) : status === 'sent' ? (
                'Sent ✓'
              ) : (
                `Send to ${firstName} →`
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
