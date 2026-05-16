'use client';
import { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { Mic, X, Keyboard, Loader2, Square } from 'lucide-react';
import DailyIframe, { type DailyCall } from '@daily-co/daily-js';
import { cn } from '@/lib/utils';

type SpeakState =
  | 'idle'
  | 'starting'
  | 'connecting'
  | 'listening'
  | 'finishing'
  | 'done'
  | 'error';

export function CaptureModal({
  guestId,
  sourcePlaceMakerId,
  guestName,
  onCaptured,
}: {
  guestId: string;
  sourcePlaceMakerId: string;
  guestName: string;
  onCaptured?: (noteId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'speak' | 'type'>('speak');
  const [typedNote, setTypedNote] = useState('');
  const [typeStatus, setTypeStatus] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [speakState, setSpeakState] = useState<SpeakState>('idle');
  const [speakError, setSpeakError] = useState<string | null>(null);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const callRef = useRef<DailyCall | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      teardownCall();
    };
  }, []);

  useEffect(() => {
    if (!open) {
      teardownCall();
      setSpeakState('idle');
      setSpeakError(null);
      setElapsed(0);
      setTypeStatus('idle');
      setTypedNote('');
    }
  }, [open]);

  useEffect(() => {
    if (speakState === 'listening') {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [speakState]);

  function teardownCall() {
    const c = callRef.current;
    if (c) {
      c.leave().catch(() => {});
      c.destroy().catch(() => {});
      callRef.current = null;
    }
  }

  async function submitTyped() {
    if (!typedNote.trim()) return;
    setTypeStatus('submitting');
    try {
      const res = await fetch('/api/dictate/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId,
          sourcePlaceMakerId,
          transcript: typedNote.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'capture failed');
      setTypeStatus('done');
      onCaptured?.(data.noteId);
      setTimeout(() => {
        setOpen(false);
      }, 400);
    } catch (err) {
      setTypeStatus('idle');
      setSpeakError(err instanceof Error ? err.message : 'unknown');
    }
  }

  async function startSpeak() {
    setSpeakState('starting');
    setSpeakError(null);
    setElapsed(0);
    try {
      const res = await fetch('/api/dictate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId, sourcePlaceMakerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'pipecat start failed');

      const call = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: false,
      });
      callRef.current = call;

      call.on('participant-updated', (ev) => {
        if (ev?.participant?.local) {
          setUserSpeaking(!!ev.participant.tracks?.audio?.state && ev.participant.tracks.audio.state === 'playable');
        }
      });
      call.on('joined-meeting', () => setSpeakState('listening'));
      call.on('left-meeting', () => {
        // transcript will arrive via webhook
      });
      call.on('error', (err) => {
        console.error('Daily error', err);
        setSpeakState('error');
        setSpeakError(String(err?.errorMsg || 'daily error'));
      });

      setSpeakState('connecting');
      await call.join({ url: data.roomUrl, token: data.token });
    } catch (err) {
      setSpeakState('error');
      setSpeakError(err instanceof Error ? err.message : 'unknown');
      teardownCall();
    }
  }

  async function stopSpeak() {
    setSpeakState('finishing');
    teardownCall();
    setSpeakState('done');
    setTimeout(() => {
      setOpen(false);
    }, 1200);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className="button-primary">
          <Mic className="h-4 w-4" /> Capture observation
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(560px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-cream p-6 shadow-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Dialog.Title className="font-serif text-2xl text-ink">
                Observation about {guestName.split(' ')[0]}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted mt-1">
                Stored privately as a Raw Note. Maître abstracts it by role before anyone sees it.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="rounded-md p-1 text-muted hover:bg-sandlight">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <Tabs.Root value={tab} onValueChange={(v) => setTab(v as 'speak' | 'type')}>
            <Tabs.List className="flex gap-1 mb-4 p-1 bg-sandlight rounded-lg">
              <Tabs.Trigger
                value="speak"
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-md py-1.5 text-sm transition-colors',
                  tab === 'speak' ? 'bg-cream text-ink shadow-sm' : 'text-muted'
                )}
              >
                <Mic className="h-4 w-4" /> Speak
              </Tabs.Trigger>
              <Tabs.Trigger
                value="type"
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-md py-1.5 text-sm transition-colors',
                  tab === 'type' ? 'bg-cream text-ink shadow-sm' : 'text-muted'
                )}
              >
                <Keyboard className="h-4 w-4" /> Type
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="speak" className="flex flex-col items-center gap-5 py-6">
              {speakState === 'idle' && (
                <>
                  <button
                    type="button"
                    onClick={startSpeak}
                    className="h-20 w-20 rounded-full bg-discovery text-cream flex items-center justify-center hover:bg-discovery2 transition-colors shadow-lg"
                    aria-label="Start listening"
                  >
                    <Mic className="h-8 w-8" />
                  </button>
                  <p className="text-sm text-muted text-center max-w-xs">
                    Tap to open a private voice session. Maître transcribes and structures.
                  </p>
                </>
              )}

              {(speakState === 'starting' || speakState === 'connecting') && (
                <>
                  <div className="h-20 w-20 rounded-full bg-discovery/20 flex items-center justify-center">
                    <Loader2 className="h-7 w-7 text-discovery animate-spin" />
                  </div>
                  <p className="text-sm text-muted">
                    {speakState === 'starting' ? 'Starting a session…' : 'Joining the room…'}
                  </p>
                </>
              )}

              {speakState === 'listening' && (
                <>
                  <div className="relative flex items-center justify-center">
                    <span
                      className={cn(
                        'absolute inset-0 rounded-full bg-discovery/20 transition-transform duration-300',
                        userSpeaking ? 'scale-150' : 'scale-110 animate-pulse'
                      )}
                    />
                    <span className="absolute inset-0 rounded-full bg-discovery/10 scale-125 animate-pulse" />
                    <span className="relative h-20 w-20 rounded-full bg-discovery text-cream flex items-center justify-center shadow-lg">
                      <Mic className="h-8 w-8" />
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="font-serif text-xl text-ink">Listening</p>
                    <p className="text-xs text-muted mt-1 font-mono">
                      {formatElapsed(elapsed)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={stopSpeak}
                    className="button-ghost"
                  >
                    <Square className="h-4 w-4" /> I'm done
                  </button>
                  <p className="text-xs text-muted text-center max-w-xs">
                    Speak naturally — Maître will structure what matters and discard the rest.
                  </p>
                </>
              )}

              {speakState === 'finishing' && (
                <>
                  <div className="h-20 w-20 rounded-full bg-discovery/20 flex items-center justify-center">
                    <Loader2 className="h-7 w-7 text-discovery animate-spin" />
                  </div>
                  <p className="text-sm text-muted">Finalizing transcript…</p>
                </>
              )}

              {speakState === 'done' && (
                <>
                  <div className="h-20 w-20 rounded-full bg-discovery flex items-center justify-center text-cream font-serif text-2xl">
                    ✓
                  </div>
                  <p className="text-sm text-discovery">Captured. Maître is fanning briefs across roles…</p>
                </>
              )}

              {speakState === 'error' && (
                <>
                  <div className="h-20 w-20 rounded-full bg-gold/20 flex items-center justify-center">
                    <Mic className="h-7 w-7 text-gold" />
                  </div>
                  <p className="text-sm text-gold text-center max-w-xs">
                    Voice unavailable: {speakError ?? 'unknown error'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('type');
                      setSpeakState('idle');
                      setSpeakError(null);
                    }}
                    className="button-ghost"
                  >
                    Type instead
                  </button>
                </>
              )}
            </Tabs.Content>

            <Tabs.Content value="type">
              <textarea
                value={typedNote}
                onChange={(e) => setTypedNote(e.target.value)}
                placeholder="What did you notice? Speak as you would to a colleague at shift change."
                rows={5}
                autoFocus
                className="w-full resize-y rounded-md border border-mist bg-whisper p-3 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-discovery/30"
              />
              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={submitTyped}
                  disabled={!typedNote.trim() || typeStatus === 'submitting'}
                  className="button-primary"
                >
                  {typeStatus === 'submitting' ? 'Capturing…' : typeStatus === 'done' ? 'Captured ✓' : 'Capture'}
                </button>
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
