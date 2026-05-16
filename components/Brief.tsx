'use client';
import { useRef, useState } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SmallCaps } from '@/components/iris/SmallCaps';
import { Initials } from '@/components/iris/Initials';

type BriefRecipient = {
  name: string;
  role: string;
  title?: string | null;
};

export function Brief({
  id,
  recipient,
  content,
  sensitivity,
  fresh,
  className,
}: {
  id?: string;
  recipient: BriefRecipient;
  content: string;
  sensitivity: string;
  fresh?: boolean;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioState, setAudioState] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');

  async function togglePlay() {
    if (!id) return;
    if (audioState === 'playing') {
      audioRef.current?.pause();
      setAudioState('idle');
      return;
    }
    setAudioState('loading');
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(`/api/briefs/${id}/audio`);
        audioRef.current.addEventListener('ended', () => setAudioState('idle'));
        audioRef.current.addEventListener('error', () => setAudioState('error'));
      }
      await audioRef.current.play();
      setAudioState('playing');
    } catch {
      setAudioState('error');
    }
  }

  return (
    <div
      className={cn(
        'card p-6 flex flex-col gap-4 min-h-[220px]',
        fresh && 'animate-fade-in-up ring-1 ring-discovery/30',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Initials name={recipient.name} size={36} tone="paper" />
          <div className="flex flex-col">
            <span className="font-serif text-[20px] text-ink leading-tight">
              {recipient.name.split(' ')[0]}
            </span>
            <SmallCaps size={9.5} tracking={0.22}>
              {recipient.title ?? recipient.role.replace('_', ' ')}
            </SmallCaps>
          </div>
        </div>
        {id && (
          <button
            type="button"
            onClick={togglePlay}
            className="rounded-full border border-hair bg-paperLight p-2 text-discovery hover:bg-whisper transition-colors"
            title="Play aloud"
            aria-label="Play aloud"
          >
            {audioState === 'loading' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : audioState === 'playing' ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
      <p className="font-serif text-[16px] leading-[1.55] text-inkSoft whitespace-pre-wrap">
        {content}
      </p>
      {sensitivity === 'high' && (
        <SmallCaps size={9.5} color="#a8945a" tracking={0.22}>
          held in confidence
        </SmallCaps>
      )}
    </div>
  );
}
