'use client';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { SmallCaps } from '@/components/iris/SmallCaps';
import { Initials } from '@/components/iris/Initials';
import { MaitreMark } from '@/components/iris/Marks';
import { StatusDot } from '@/components/iris/StatusDot';

export type DraftCardData = {
  id: string;
  content: string;
  status: string;
  from: { name: string; slug: string; role: string };
  intent?: string | null;
};

export function DraftCard({
  draft,
  guestFirstName,
  onSent,
}: {
  draft: DraftCardData | null;
  guestFirstName: string;
  onSent?: (info: { messageId: string; smsSent: boolean }) => void;
}) {
  const [content, setContent] = useState(draft?.content ?? '');
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    draft?.status === 'sent' ? 'sent' : 'idle'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (draft) {
      setContent(draft.content);
      setStatus(draft.status === 'sent' ? 'sent' : 'idle');
      setEditing(false);
    }
  }, [draft?.id, draft?.content, draft?.status]);

  if (!draft) {
    return (
      <div className="card p-6 text-[13px] text-stone italic font-serif">
        A draft will appear here once a note is captured.
      </div>
    );
  }

  async function approve() {
    if (!draft) return;
    setStatus('sending');
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/messages/${draft.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'send failed');
      }
      setStatus('sent');
      onSent?.({ messageId: data.messageId, smsSent: !!data.sms?.sid });
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'unknown');
    }
  }

  const fromFirst = draft.from.name.split(' ')[0];
  const lead = content.split('\n')[0];
  const restLines = content.split('\n').slice(1).join('\n');

  return (
    <div className="flex flex-col gap-5">
      {/* The postcard preview */}
      <div className={cn('card px-7 py-7 flex flex-col gap-5', status === 'sent' && 'opacity-90')}>
        <div className="flex items-center gap-3">
          <Initials name={draft.from.name} size={42} tone="dark" />
          <div className="flex flex-col">
            <span className="font-serif text-[18px] text-ink leading-tight">{draft.from.name}</span>
            <SmallCaps size={9.5} tracking={0.22}>
              {draft.from.role.replace('_', ' ')} · Rosewood Sand Hill
            </SmallCaps>
          </div>
          <span className="ml-auto flex items-center gap-1.5">
            <StatusDot status={status === 'sent' ? 'sent' : 'pending'} />
            <SmallCaps size={9} tracking={0.22}>
              {status === 'sent' ? 'sent' : 'draft'}
            </SmallCaps>
          </span>
        </div>
        <div className="hairline" />
        {editing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={status === 'sending' || status === 'sent'}
            rows={Math.max(4, content.split('\n').length + 1)}
            className="w-full resize-y border border-hair bg-paper p-4 font-serif text-[16.5px] leading-[1.55] text-inkSoft focus:outline-none focus:ring-1 focus:ring-discovery/40"
            style={{ borderRadius: 2 }}
            autoFocus
          />
        ) : (
          <div className="font-serif text-inkSoft">
            <p className="text-[21px] leading-[1.3] mb-3">{lead}</p>
            {restLines && (
              <p className="text-[16.5px] leading-[1.6] whitespace-pre-wrap">{restLines}</p>
            )}
          </div>
        )}
      </div>

      {/* Maître ack — the only place it appears */}
      <div className="flex flex-col items-center gap-1 py-1">
        <div className="flex items-center gap-2">
          <MaitreMark size={14} />
          <SmallCaps tracking={0.3}>Written with Maître</SmallCaps>
        </div>
        <SmallCaps size={9} tracking={0.22} color="#B5B0A8">
          drafted from your prior conversations · edit before sending
        </SmallCaps>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-3 pt-2 border-t border-hair pt-5">
        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          disabled={status === 'sending' || status === 'sent'}
          className="button-ghost"
        >
          {editing ? 'Done editing' : 'Edit'}
        </button>
        {errorMessage && (
          <span className="text-[11px] text-pending">{errorMessage}</span>
        )}
        <button
          type="button"
          onClick={approve}
          disabled={status !== 'idle'}
          className="button-primary flex-1"
        >
          {status === 'sending'
            ? 'Sending…'
            : status === 'sent'
              ? 'Sent ✓'
              : `Send to ${guestFirstName} →`}
        </button>
      </div>
    </div>
  );
}
