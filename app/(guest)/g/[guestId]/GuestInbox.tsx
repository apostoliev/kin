'use client';
import { useState, useMemo } from 'react';
import { useSse } from '@/lib/use-sse';
import type { ThreadItem } from '@/components/Thread';
import { SmallCaps } from '@/components/iris/SmallCaps';
import { Initials } from '@/components/iris/Initials';
import { IrisWordmark, IrisLockup } from '@/components/iris/Marks';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

type PlaceMakerCard = {
  slug: string;
  name: string;
  role: string;
  title?: string | null;
  property: string;
  visits?: number;
  sinceYear?: number | null;
};

export function GuestInbox({
  guest,
  placeMakers,
  initialThread,
}: {
  guest: { id: string; name: string };
  placeMakers: PlaceMakerCard[];
  initialThread: ThreadItem[];
}) {
  const [thread, setThread] = useState(initialThread);
  const [replyText, setReplyText] = useState('');
  const lastMessage = useMemo(
    () =>
      [...thread]
        .reverse()
        .find((it) => it.kind === 'message') as
        | Extract<ThreadItem, { kind: 'message' }>
        | undefined,
    [thread]
  );
  const [activeMessageId, setActiveMessageId] = useState<string | null>(
    lastMessage?.id ?? null
  );
  const [replyingTo, setReplyingTo] = useState<string | null>(
    lastMessage?.fromSlug ?? null
  );
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<'inbox' | 'compose'>('inbox');
  // When composeFresh is true, we're writing a NEW message (not replying).
  const [composeFresh, setComposeFresh] = useState(false);

  useSse(`guest-${guest.id}`, (event) => {
    if (event.type === 'message.sent' || event.type === 'guest.replied') {
      refreshThread(true);
    }
  });

  async function refreshThread(maybeOpenNew = false) {
    const res = await fetch(`/api/messages/thread/${guest.id}`);
    if (!res.ok) return;
    const data = await res.json();
    const items: ThreadItem[] = data.items ?? [];
    setThread(items);
    if (maybeOpenNew) {
      const latest = [...items]
        .reverse()
        .find((it) => it.kind === 'message') as
        | Extract<ThreadItem, { kind: 'message' }>
        | undefined;
      if (latest && latest.id !== activeMessageId) {
        setActiveMessageId(latest.id);
        setReplyingTo(latest.fromSlug);
        setMode('inbox');
      }
    }
  }

  async function sendReply() {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/messages/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: guest.id,
          content: replyText.trim(),
          toPlaceMakerSlug: replyingTo ?? undefined,
        }),
      });
      if (res.ok) {
        setReplyText('');
        setMode('inbox');
        setComposeFresh(false);
        refreshThread();
      }
    } finally {
      setSending(false);
    }
  }

  function openComposeTo(slug: string) {
    setReplyingTo(slug);
    setComposeFresh(true);
    setMode('compose');
  }

  const activeMessage =
    (thread.find((it) => it.id === activeMessageId) as
      | Extract<ThreadItem, { kind: 'message' }>
      | undefined) ?? lastMessage;
  const sender = activeMessage
    ? placeMakers.find((p) => p.slug === activeMessage.fromSlug)
    : null;
  const composeTarget =
    composeFresh && replyingTo
      ? placeMakers.find((p) => p.slug === replyingTo) ?? null
      : null;
  const guestFirst = guest.name.split(' ')[0];

  // Compose mode covers both replies and fresh "write to anyone in your circle".
  if (mode === 'compose') {
    if (composeFresh && composeTarget) {
      return (
        <ReplyComposeScreen
          guestFirst={guestFirst}
          sender={composeTarget}
          original={null}
          value={replyText}
          onChange={setReplyText}
          onSend={sendReply}
          sending={sending}
          onBack={() => {
            setMode('inbox');
            setComposeFresh(false);
          }}
        />
      );
    }
    if (activeMessage && sender) {
      return (
        <ReplyComposeScreen
          guestFirst={guestFirst}
          sender={sender}
          original={activeMessage.content}
          value={replyText}
          onChange={setReplyText}
          onSend={sendReply}
          sending={sending}
          onBack={() => setMode('inbox')}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* iOS-style chrome */}
      <header className="px-6 pt-10 pb-5 flex items-baseline justify-between">
        <IrisWordmark size={22} />
        <IrisLockup property="Rosewood" />
      </header>

      {/* The featured postcard */}
      {activeMessage && sender ? (
        <PostcardMessage
          guestFirst={guestFirst}
          sender={sender}
          at={activeMessage.at}
          content={activeMessage.content}
          onReply={() => setMode('compose')}
        />
      ) : (
        <section className="px-6 py-8 flex-1">
          <SmallCaps tracking={0.3}>Your circle at Sand Hill</SmallCaps>
          <p className="font-serif text-[28px] text-ink mt-2 leading-tight">
            A few people who know you here, {guestFirst}.
          </p>
        </section>
      )}

      <div className="hairline mx-6" />

      {/* Your circle — the private network */}
      <section className="px-6 py-8">
        <SmallCaps tracking={0.3}>Your circle at Sand Hill</SmallCaps>
        <p className="font-serif text-[19px] text-ink mt-2 leading-snug max-w-[36ch] italic">
          The people here who know you, {guestFirst}. Tap anyone to write.
        </p>
        <div className="mt-6 flex gap-5 overflow-x-auto pb-2 -mx-1 px-1">
          {placeMakers.map((pm) => {
            const meta = circleMeta(pm);
            return (
              <button
                type="button"
                key={pm.slug}
                onClick={() => openComposeTo(pm.slug)}
                className="flex flex-col items-center gap-2 flex-shrink-0 w-[88px] focus:outline-none group"
              >
                <span className="rounded-full transition-transform group-hover:-translate-y-0.5 group-focus:-translate-y-0.5">
                  <Initials name={pm.name} size={68} tone="paper" />
                </span>
                <span className="font-serif text-[15px] text-ink leading-tight text-center">
                  {pm.name.split(' ')[0]}
                </span>
                <SmallCaps size={8.5} tracking={0.22} className="text-center">
                  {pm.title ?? pm.role.replace('_', ' ')}
                </SmallCaps>
                {meta && (
                  <SmallCaps
                    size={8.5}
                    tracking={0.22}
                    className="text-center"
                    color="#B5B0A8"
                  >
                    {meta}
                  </SmallCaps>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <div className="hairline mx-6" />

      {/* Recent messages */}
      <section className="px-6 py-7 flex-1">
        <SmallCaps tracking={0.3}>Recent</SmallCaps>
        <ul className="mt-4 flex flex-col">
          {thread.length === 0 && (
            <li className="font-serif text-[15px] italic text-stone">No messages yet.</li>
          )}
          {[...thread].reverse().map((it) => {
            const senderName = it.kind === 'message' ? it.fromName : `You → ${it.toName}`;
            const isActive = it.id === activeMessageId;
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (it.kind === 'message') {
                      setActiveMessageId(it.id);
                      setReplyingTo(it.fromSlug);
                    }
                  }}
                  className={cn(
                    'w-full text-left grid grid-cols-[40px_1fr_auto] gap-3 items-start py-4 border-t border-hair transition-colors',
                    isActive ? 'bg-paperLight' : 'hover:bg-paperLight'
                  )}
                >
                  {it.kind === 'message' ? (
                    <Initials name={it.fromName} size={36} tone="paper" />
                  ) : (
                    <div className="w-9 h-9" />
                  )}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-serif text-[16px] text-ink leading-tight">
                      {senderName}
                    </span>
                    <span className="font-serif text-[13.5px] text-inkFaint truncate">
                      {it.content.split('\n')[0]}
                    </span>
                  </div>
                  <SmallCaps size={9} tracking={0.22} className="self-start">
                    {formatShort(it.at)}
                  </SmallCaps>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <footer className="border-t border-hair py-5 text-center">
        <SmallCaps size={9} tracking={0.3} color="#B5B0A8">
          A private network · between you and the people who serve you here
        </SmallCaps>
      </footer>
    </div>
  );
}

function PostcardMessage({
  guestFirst,
  sender,
  at,
  content,
  onReply,
}: {
  guestFirst: string;
  sender: PlaceMakerCard;
  at: string;
  content: string;
  onReply: () => void;
}) {
  const lead = content.split('\n')[0];
  const rest = content.split('\n').slice(1).join('\n');
  const date = new Date(at).toLocaleString('en-US', {
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
  });
  return (
    <section className="px-7 pt-2 pb-6 flex flex-col items-center text-center">
      <Initials name={sender.name} size={68} tone="dark" />
      <SmallCaps tracking={0.3} className="mt-4">
        {date.replace(/^\w/, (c) => c.toUpperCase())}
      </SmallCaps>
      <h1 className="font-serif text-[26px] text-ink mt-1">{sender.name}</h1>
      <SmallCaps size={9.5} tracking={0.22}>
        {sender.title ?? sender.role.replace('_', ' ')} · {sender.property}
      </SmallCaps>
      <div className="hairline w-12 mt-5 mb-6" />
      <div className="text-left font-serif text-inkSoft max-w-[34ch]">
        <p className="text-[22px] leading-[1.3] mb-3">
          {guestFirst} —
        </p>
        <p className="text-[16.5px] leading-[1.6] whitespace-pre-wrap">
          {lead}
          {rest && (
            <>
              <br />
              {rest}
            </>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={onReply}
        className="button-primary mt-7 w-full max-w-[280px]"
      >
        Reply to {sender.name.split(' ')[0]}
      </button>
    </section>
  );
}

function ReplyComposeScreen({
  guestFirst,
  sender,
  original,
  value,
  onChange,
  onSend,
  sending,
  onBack,
}: {
  guestFirst: string;
  sender: PlaceMakerCard;
  original: string | null;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  onBack: () => void;
}) {
  const senderFirst = sender.name.split(' ')[0];
  const isFresh = original === null;
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <header className="px-6 pt-10 pb-4 flex items-center justify-between border-b border-hair">
        <button type="button" onClick={onBack} className="text-stone">
          <SmallCaps tracking={0.22}>← back</SmallCaps>
        </button>
        <SmallCaps tracking={0.3}>
          {isFresh ? `Write to ${senderFirst}` : `Reply to ${senderFirst}`}
        </SmallCaps>
        <div className="w-10" />
      </header>
      <div className="px-7 py-6 flex-1 flex flex-col gap-6">
        {isFresh ? (
          <div className="flex items-center gap-3">
            <Initials name={sender.name} size={48} tone="paper" />
            <div className="flex flex-col">
              <span className="font-serif text-[19px] text-ink leading-tight">
                {sender.name}
              </span>
              <SmallCaps size={9.5} tracking={0.22}>
                {sender.title ?? sender.role.replace('_', ' ')} ·{' '}
                {sender.property}
              </SmallCaps>
            </div>
          </div>
        ) : (
          <div
            className="card-inset px-5 py-4"
            style={{ borderLeft: '2px solid #D8D3CB' }}
          >
            <SmallCaps size={9.5} tracking={0.22}>
              {sender.name} wrote
            </SmallCaps>
            <p className="font-serif text-[15px] leading-[1.55] text-inkFaint mt-2 italic whitespace-pre-wrap">
              {original}
            </p>
          </div>
        )}
        <div className="flex-1 relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              isFresh
                ? `What would you like to say to ${senderFirst}, ${guestFirst}?`
                : `Write to ${senderFirst}…`
            }
            rows={6}
            autoFocus
            className="w-full h-full resize-none bg-transparent font-serif text-[19px] leading-[1.5] text-inkSoft placeholder:italic placeholder:text-stoneLight focus:outline-none"
          />
        </div>
      </div>
      <footer className="border-t border-hair px-6 py-4">
        <button
          type="button"
          onClick={onSend}
          disabled={sending || !value.trim()}
          className="button-primary w-full"
        >
          {sending ? 'Sending…' : `Send to ${senderFirst} →`}
        </button>
      </footer>
    </div>
  );
}

function circleMeta(pm: PlaceMakerCard): string | null {
  const parts: string[] = [];
  if (pm.visits && pm.visits > 0) {
    parts.push(`${pm.visits} ${pm.visits === 1 ? 'stay' : 'stays'}`);
  }
  if (pm.sinceYear) parts.push(`since ${pm.sinceYear}`);
  return parts.length ? parts.join(' · ') : null;
}

function formatShort(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
}
