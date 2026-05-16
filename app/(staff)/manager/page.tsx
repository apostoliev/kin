import Link from 'next/link';
import { prisma } from '@/lib/db';
import { SmallCaps } from '@/components/iris/SmallCaps';
import { Initials } from '@/components/iris/Initials';
import { StatusDot } from '@/components/iris/StatusDot';
import { MaitreMark } from '@/components/iris/Marks';

export const dynamic = 'force-dynamic';

type StayState = 'on_property' | 'upcoming' | 'past';
const sectionLabel: Record<StayState, string> = {
  on_property: 'On property',
  upcoming: 'Upcoming',
  past: 'Past · between stays',
};

function relTime(d: Date) {
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
}

export default async function ManagerOverview() {
  const carol = await prisma.placeMaker.findUnique({ where: { slug: 'carol' } });

  const guests = await prisma.guest.findMany({
    orderBy: [{ stayState: 'asc' }, { arrivalAt: 'asc' }],
  });
  const placeMakers = await prisma.placeMaker.findMany({
    where: { role: { not: 'manager' } },
    orderBy: { createdAt: 'asc' },
  });

  const drafts = await prisma.messageDraft.findMany({
    where: { status: 'draft' },
    include: { from: true, guest: true },
    orderBy: { createdAt: 'desc' },
  });
  const recentMessages = await prisma.message.findMany({
    include: { from: true, guest: true },
    orderBy: { deliveredAt: 'desc' },
    take: 6,
  });
  const recentNotes = await prisma.rawNote.findMany({
    include: { source: true, guest: true },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  const grouped: Record<StayState, typeof guests> = {
    on_property: [],
    upcoming: [],
    past: [],
  };
  for (const g of guests) {
    const s = (g.stayState as StayState) ?? 'past';
    grouped[s].push(g);
  }

  // Activity feed merged
  type Activity = {
    id: string;
    at: Date;
    kind: 'note' | 'draft' | 'message';
    guestName: string;
    staffName: string;
    label: string;
  };
  const activity: Activity[] = [
    ...recentNotes.map<Activity>((n) => ({
      id: `n-${n.id}`,
      at: n.createdAt,
      kind: 'note',
      guestName: n.guest.name,
      staffName: n.source.name,
      label: 'Observation captured',
    })),
    ...drafts.map<Activity>((d) => ({
      id: `d-${d.id}`,
      at: d.createdAt,
      kind: 'draft',
      guestName: d.guest.name,
      staffName: d.from.name,
      label: 'Draft awaiting approval',
    })),
    ...recentMessages.map<Activity>((m) => ({
      id: `m-${m.id}`,
      at: m.deliveredAt,
      kind: 'message',
      guestName: m.guest.name,
      staffName: m.from.name,
      label: 'Message sent',
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 10);

  const today = new Date().toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mx-auto max-w-6xl px-7 py-12 flex flex-col gap-14">
      {/* Masthead */}
      <section className="flex flex-col gap-2">
        <SmallCaps tracking={0.3}>{today} · Property overview</SmallCaps>
        <h1 className="font-serif text-[44px] leading-[1.05] text-ink mt-2">
          Sand Hill, in one view.
        </h1>
        <p className="font-serif text-[19px] text-inkFaint mt-1 max-w-2xl italic">
          {carol?.name ?? 'Director of Communications'} · what the property is holding for our guests this week.
        </p>
      </section>

      {/* Stats row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="On property" value={grouped.on_property.length} />
        <Stat label="Upcoming" value={grouped.upcoming.length} />
        <Stat label="Drafts pending" value={drafts.length} accent />
        <Stat label="Messages sent · 7d" value={recentMessages.length} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12">
        {/* Main column — guests by state */}
        <div className="flex flex-col gap-12">
          {(['on_property', 'upcoming', 'past'] as StayState[]).map((state) => {
            const rows = grouped[state];
            if (!rows.length) return null;
            return (
              <section key={state} className="flex flex-col gap-3">
                <SmallCaps tracking={0.3}>{sectionLabel[state]}</SmallCaps>
                <div className="flex flex-col">
                  {rows.map((g) => {
                    const pending = drafts.find((d) => d.guestId === g.id);
                    return (
                      <div
                        key={g.id}
                        className="grid grid-cols-[56px_1fr_auto] gap-4 items-center py-5 border-t border-hair"
                      >
                        <Initials
                          name={g.name}
                          size={48}
                          tone={state === 'on_property' ? 'dark' : state === 'upcoming' ? 'mid' : 'light'}
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-3">
                            <span className="font-serif text-[20px] text-ink leading-tight">
                              {g.name}
                            </span>
                            {pending && (
                              <span className="inline-flex items-center gap-1.5">
                                <StatusDot status="pending" />
                                <SmallCaps size={9} tracking={0.22}>
                                  Draft pending · {pending.from.name.split(' ')[0]}
                                </SmallCaps>
                              </span>
                            )}
                          </div>
                          <SmallCaps size={9.5} tracking={0.22}>
                            {state === 'on_property' && g.arrivalAt
                              ? `Arriving ${g.arrivalAt.toLocaleString('en-US', { weekday: 'short', hour: 'numeric' }).toLowerCase()}`
                              : state === 'upcoming' && g.arrivalAt
                                ? `Booked ${g.arrivalAt.toLocaleString('en-US', { month: 'short', day: 'numeric' })}`
                                : g.departureAt
                                  ? `Last seen ${g.departureAt.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`
                                  : '—'}
                            {g.visitCount ? ` · ${g.visitCount} visits` : ''}
                          </SmallCaps>
                          {g.interestTags.length > 0 && (
                            <p className="font-serif text-[14px] text-inkFaint italic mt-1">
                              {g.interestTags.slice(0, 3).join(' · ')}
                            </p>
                          )}
                        </div>
                        <Link
                          href={`/g/${g.id}`}
                          target="_blank"
                          className="text-[10px] uppercase tracking-[0.22em] text-stone hover:text-discovery"
                        >
                          Guest view ↗
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Side column — staff + activity */}
        <aside className="flex flex-col gap-10">
          <section>
            <SmallCaps tracking={0.3}>Your team</SmallCaps>
            <ul className="mt-4 flex flex-col gap-3">
              {placeMakers.map((pm) => (
                <li key={pm.id}>
                  <Link
                    href={`/${pm.slug}`}
                    className="flex items-center gap-3 py-2 hover:opacity-80 transition-opacity"
                  >
                    <Initials name={pm.name} size={40} tone="paper" />
                    <div className="flex flex-col">
                      <span className="font-serif text-[16px] text-ink leading-tight">
                        {pm.name}
                      </span>
                      <SmallCaps size={9} tracking={0.22}>
                        {pm.title ?? pm.role.replace('_', ' ')}
                      </SmallCaps>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <SmallCaps tracking={0.3}>Activity</SmallCaps>
            <ul className="mt-4 flex flex-col">
              {activity.map((a) => (
                <li
                  key={a.id}
                  className="grid grid-cols-[10px_1fr_auto] gap-3 items-start py-3 border-t border-hair"
                >
                  <span className="pt-1.5">
                    <StatusDot
                      status={a.kind === 'draft' ? 'pending' : a.kind === 'message' ? 'sent' : 'archived'}
                    />
                  </span>
                  <div className="flex flex-col">
                    <span className="font-serif text-[14.5px] text-inkSoft leading-tight">
                      {a.label}
                    </span>
                    <SmallCaps size={9} tracking={0.22}>
                      {a.staffName} · {a.guestName}
                    </SmallCaps>
                  </div>
                  <SmallCaps size={9} tracking={0.22} color="#B5B0A8">
                    {relTime(a.at)}
                  </SmallCaps>
                </li>
              ))}
              {activity.length === 0 && (
                <li className="font-serif text-[14px] italic text-stone py-3">
                  Quiet — nothing in motion right now.
                </li>
              )}
            </ul>
          </section>

          <div className="flex items-center gap-2 pt-2 border-t border-hair pt-4">
            <MaitreMark size={12} />
            <SmallCaps size={9.5} tracking={0.22}>
              Maître writes · Iris carries
            </SmallCaps>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="card px-5 py-5 flex flex-col gap-2">
      <SmallCaps size={9.5} tracking={0.22}>
        {label}
      </SmallCaps>
      <span
        className="font-serif text-[36px] leading-none"
        style={{ color: accent ? 'var(--iris-green)' : '#1A1A1A' }}
      >
        {value}
      </span>
    </div>
  );
}
