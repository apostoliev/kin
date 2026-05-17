'use client';
import { useState } from 'react';
import { Brief } from '@/components/Brief';
import { type BriefForDisplay } from '@/components/BriefTrio';
import { DraftCard, type DraftCardData } from '@/components/DraftCard';
import { Thread, type ThreadItem } from '@/components/Thread';
import { CaptureModal } from '@/components/CaptureModal';
import { ComposeMessage } from '@/components/ComposeMessage';
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
  placeMakerRole,
  guest,
  initialBrief,
  initialDraft,
  initialThread,
}: {
  placeMakerId: string;
  placeMakerName: string;
  placeMakerRole: string;
  guest: Guest;
  initialBrief: BriefForDisplay | null;
  initialDraft: DraftCardData | null;
  initialThread: ThreadItem[];
}) {
  const [brief, setBrief] = useState<BriefForDisplay | null>(initialBrief);
  const [draft, setDraft] = useState<DraftCardData | null>(initialDraft);
  const [thread, setThread] = useState<ThreadItem[]>(initialThread);
  const [briefFresh, setBriefFresh] = useState(false);
  const [working, setWorking] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useSse(`guest-${guest.id}`, (event) => {
    if (event.type === 'note.captured') {
      setWorking(true);
      setFlash('Iris is reshaping your brief…');
    }
    if (event.type === 'regenerate.started') {
      setWorking(true);
    }
    if (event.type === 'brief.updated') {
      refreshBrief();
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

  async function refreshBrief() {
    const res = await fetch(
      `/api/guests/${guest.id}/briefs?placeMakerId=${placeMakerId}`
    );
    if (!res.ok) return;
    const data = await res.json();
    const incoming: BriefForDisplay | null = (data.briefs ?? [])[0] ?? null;
    if (incoming && incoming.id !== brief?.id) {
      setBriefFresh(true);
      setTimeout(() => setBriefFresh(false), 5000);
    }
    setBrief(incoming);
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
        {/* Your brief — and only yours. */}
        <section>
          <div className="flex items-baseline justify-between mb-2">
            <SmallCaps tracking={0.3}>Your brief on {firstName}</SmallCaps>
            <div className="flex items-center gap-2">
              {working && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-discovery uppercase tracking-[0.22em]">
                  <Loader2 className="h-3 w-3 animate-spin" /> Iris is reshaping…
                </span>
              )}
              {flash && !working && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-discovery uppercase tracking-[0.22em] animate-fade-in-up">
                  {flash}
                </span>
              )}
            </div>
          </div>
          <h2 className="font-serif text-[26px] text-ink mb-2">What you, and only you, need to know.</h2>
          <p className="font-serif text-[15.5px] text-inkFaint italic mb-5 max-w-2xl">
            The network holds the whole picture. Your brief is the one piece of it
            shaped for what you do.
          </p>
          {brief ? (
            <Brief
              id={brief.id}
              recipient={brief.recipient}
              content={brief.content}
              sensitivity={brief.sensitivity}
              fresh={briefFresh}
              className="max-w-3xl"
            />
          ) : (
            <div className="card p-10 text-center text-stone text-[14px] italic font-serif max-w-3xl">
              No brief yet — capture an observation and the network will route one to you.
            </div>
          )}
          <div className="flex items-center gap-2 mt-4">
            <MaitreMark size={12} />
            <SmallCaps size={9.5} tracking={0.22}>
              Maître has held back what isn&apos;t yours to know.
            </SmallCaps>
          </div>
        </section>

        {/* Drafted message + custom compose */}
        <section>
          <div className="flex items-baseline justify-between mb-2">
            <SmallCaps tracking={0.3}>Drafted in your voice</SmallCaps>
            <ComposeMessage
              placeMakerId={placeMakerId}
              placeMakerName={placeMakerName}
              placeMakerRole={placeMakerRole}
              guestId={guest.id}
              guestName={guest.name}
              onSent={() => {
                refreshThread();
              }}
            />
          </div>
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
