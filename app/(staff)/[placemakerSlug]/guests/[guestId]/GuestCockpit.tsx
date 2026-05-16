'use client';
import { useState } from 'react';
import { BriefTrio, type BriefForDisplay } from '@/components/BriefTrio';
import { DraftCard, type DraftCardData } from '@/components/DraftCard';
import { Thread, type ThreadItem } from '@/components/Thread';
import { CaptureModal } from '@/components/CaptureModal';
import { useSse } from '@/lib/use-sse';
import { Loader2 } from 'lucide-react';
import { SmallCaps } from '@/components/iris/SmallCaps';
import { Initials } from '@/components/iris/Initials';
import { MaitreMark } from '@/components/iris/Marks';

type Guest = {
  id: string;
  name: string;
  partnerName?: string | null;
  anniversary?: string | null;
  origin?: string | null;
  interestTags: string[];
  notes?: string | null;
  stayState?: string | null;
  arrivalAt?: string | null;
  visitCount?: number | null;
};

export function GuestCockpit({
  placeMakerId,
  placeMakerName,
  guest,
  initialBriefs,
  initialDraft,
  initialThread,
}: {
  placeMakerId: string;
  placeMakerName: string;
  guest: Guest;
  initialBriefs: BriefForDisplay[];
  initialDraft: DraftCardData | null;
  initialThread: ThreadItem[];
}) {
  const [briefs, setBriefs] = useState(initialBriefs);
  const [draft, setDraft] = useState<DraftCardData | null>(initialDraft);
  const [thread, setThread] = useState<ThreadItem[]>(initialThread);
  const [freshBriefIds, setFreshBriefIds] = useState<Set<string>>(new Set());
  const [working, setWorking] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useSse(`guest-${guest.id}`, (event) => {
    if (event.type === 'note.captured') {
      setWorking(true);
      setFlash('Iris is fanning the brief across roles…');
    }
    if (event.type === 'regenerate.started') {
      setWorking(true);
    }
    if (event.type === 'brief.updated') {
      refreshBriefs();
    }
    if (event.type === 'draft.ready') {
      refreshDraft();
      setWorking(false);
      setFlash(null);
    }
    if (event.type === 'message.sent') {
      refreshThread();
    }
    if (event.type === 'guest.replied') {
      refreshThread();
      setFlash(`New reply from ${guest.name.split(' ')[0]}.`);
      setTimeout(() => setFlash(null), 4000);
    }
  });

  async function refreshBriefs() {
    const res = await fetch(`/api/guests/${guest.id}/briefs`);
    if (!res.ok) return;
    const data = await res.json();
    const incoming: BriefForDisplay[] = data.briefs ?? [];
    const previousIds = new Set(briefs.map((b) => b.id));
    const fresh = new Set(incoming.filter((b) => !previousIds.has(b.id)).map((b) => b.id));
    setFreshBriefIds(fresh);
    setBriefs(incoming);
    setTimeout(() => setFreshBriefIds(new Set()), 5000);
  }

  async function refreshDraft() {
    const res = await fetch(`/api/guests/${guest.id}/draft?placeMakerId=${placeMakerId}`);
    if (!res.ok) return;
    const data = await res.json();
    setDraft(data.draft ?? null);
  }

  async function refreshThread() {
    const res = await fetch(`/api/messages/thread/${guest.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setThread(data.items ?? []);
  }

  const firstName = guest.name.split(' ')[0];
  const stayBadge =
    guest.stayState === 'on_property'
      ? 'On property tonight'
      : guest.stayState === 'upcoming'
        ? 'Booked · upcoming'
        : 'Past · between stays';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12">
      {/* Profile sidebar */}
      <aside className="flex flex-col gap-7">
        <div className="flex flex-col gap-3">
          <SmallCaps tracking={0.3}>Guest</SmallCaps>
          <div className="flex items-center gap-4">
            <Initials name={guest.name} size={64} tone="dark" />
            <div className="flex flex-col">
              <h1 className="font-serif text-[32px] text-ink leading-[1.05]">{firstName}.</h1>
              <span className="font-serif text-[15px] text-inkFaint italic">
                {guest.name.split(' ').slice(1).join(' ')}
              </span>
            </div>
          </div>
          <SmallCaps size={10} tracking={0.22}>
            {stayBadge}
            {guest.visitCount ? ` · ${guest.visitCount} visits` : ''}
          </SmallCaps>
        </div>

        <div className="hairline" />

        <div className="flex flex-col gap-4 text-[13.5px]">
          {guest.origin && <Row label="Origin">{guest.origin}</Row>}
          {guest.partnerName && <Row label="Partner">{guest.partnerName}</Row>}
          {guest.anniversary && <Row label="Anniversary">{guest.anniversary}</Row>}
          {guest.interestTags.length > 0 && (
            <div>
              <SmallCaps size={9.5} tracking={0.22}>
                The cellar remembers
              </SmallCaps>
              <ul className="mt-2 flex flex-col gap-1.5">
                {guest.interestTags.map((t) => (
                  <li key={t} className="font-serif text-[14.5px] text-inkSoft italic">
                    — {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {guest.notes && (
            <div>
              <SmallCaps size={9.5} tracking={0.22}>
                Notes
              </SmallCaps>
              <p className="font-serif text-[15px] leading-[1.55] text-inkFaint mt-2">
                {guest.notes}
              </p>
            </div>
          )}
        </div>

        <div className="hairline" />

        <CaptureModal
          guestId={guest.id}
          sourcePlaceMakerId={placeMakerId}
          guestName={guest.name}
        />
      </aside>

      {/* Main column */}
      <div className="flex flex-col gap-14">
        {/* Briefs by role */}
        <section>
          <div className="flex items-baseline justify-between mb-2">
            <SmallCaps tracking={0.3}>Briefs by role</SmallCaps>
            <div className="flex items-center gap-2">
              {working && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-discovery uppercase tracking-[0.22em]">
                  <Loader2 className="h-3 w-3 animate-spin" /> Iris is thinking
                </span>
              )}
              {flash && !working && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-discovery uppercase tracking-[0.22em] animate-fade-in-up">
                  {flash}
                </span>
              )}
            </div>
          </div>
          <h2 className="font-serif text-[26px] text-ink mb-2">Same observation, different shape.</h2>
          <p className="font-serif text-[15.5px] text-inkFaint italic mb-5 max-w-2xl">
            What each person needs to know, and nothing more. The discretion filter routes role-by-role.
          </p>
          <BriefTrio briefs={briefs} freshIds={freshBriefIds} />
          <div className="flex items-center gap-2 mt-4">
            <MaitreMark size={12} />
            <SmallCaps size={9.5} tracking={0.22}>
              Maître has noted his preference for a quiet stay.
            </SmallCaps>
          </div>
        </section>

        {/* Drafted message */}
        <section>
          <SmallCaps tracking={0.3} className="mb-2 block">Drafted in your voice</SmallCaps>
          <h2 className="font-serif text-[26px] text-ink mb-5">A note ready to send.</h2>
          <DraftCard
            draft={draft}
            guestFirstName={firstName}
            onSent={() => {
              refreshThread();
            }}
          />
        </section>

        {/* Thread */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <SmallCaps tracking={0.3}>Thread with {firstName}</SmallCaps>
            <a
              href={`/g/${guest.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] uppercase tracking-[0.22em] text-stone hover:text-discovery"
            >
              Open guest view ↗
            </a>
          </div>
          <Thread items={thread} perspective="staff" />
        </section>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <SmallCaps size={9.5} tracking={0.22}>
        {label}
      </SmallCaps>
      <div className="font-serif text-[15.5px] text-inkSoft mt-1">{children}</div>
    </div>
  );
}
