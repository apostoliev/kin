import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { SmallCaps } from '@/components/iris/SmallCaps';
import { Initials } from '@/components/iris/Initials';
import { StatusDot } from '@/components/iris/StatusDot';

export const dynamic = 'force-dynamic';

type StayState = 'on_property' | 'upcoming' | 'past';

const sectionLabel: Record<StayState, string> = {
  on_property: 'On property',
  upcoming: 'Upcoming',
  past: 'Past · between stays',
};

function stayCopy(g: {
  stayState: string;
  arrivalAt: Date | null;
  departureAt: Date | null;
  visitCount: number;
}) {
  if (g.stayState === 'on_property') {
    const arrives = g.arrivalAt
      ? g.arrivalAt.toLocaleString('en-US', {
          weekday: 'short',
          hour: 'numeric',
        })
      : 'tonight';
    return {
      headline: `Arriving ${arrives.toLowerCase()}`,
      sub: `${ordinal(g.visitCount)} stay`,
    };
  }
  if (g.stayState === 'upcoming') {
    const arrives = g.arrivalAt
      ? g.arrivalAt.toLocaleString('en-US', { month: 'short', day: 'numeric' })
      : 'soon';
    return {
      headline: `Booked ${arrives}`,
      sub: `${ordinal(g.visitCount + 1)} stay · ~${daysUntil(g.arrivalAt)} days out`,
    };
  }
  const left = g.departureAt
    ? g.departureAt.toLocaleString('en-US', { month: 'long', year: 'numeric' })
    : '—';
  return {
    headline: `Last seen ${left}`,
    sub: 'No return on the books',
  };
}

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function daysUntil(d: Date | null) {
  if (!d) return '—';
  const diff = Math.round((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default async function StaffDashboard({
  params,
}: {
  params: Promise<{ placemakerSlug: string }>;
}) {
  const { placemakerSlug } = await params;
  const placeMaker = await prisma.placeMaker.findUnique({
    where: { slug: placemakerSlug },
  });
  if (!placeMaker) notFound();
  if (placeMaker.role === 'manager') redirect('/manager');

  const relationships = await prisma.relationshipRecord.findMany({
    where: { placeMakerId: placeMaker.id },
    include: {
      guest: {
        include: {
          drafts: {
            where: { status: 'draft' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          briefs: {
            where: { recipientPlaceMakerId: placeMaker.id },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  const grouped: Record<StayState, typeof relationships> = {
    on_property: [],
    upcoming: [],
    past: [],
  };
  for (const rel of relationships) {
    const state = (rel.guest.stayState as StayState) ?? 'past';
    grouped[state].push(rel);
  }

  const today = new Date().toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const firstName = placeMaker.name.split(' ')[0];

  return (
    <div className="mx-auto max-w-5xl px-7 py-12 flex flex-col gap-14">
      {/* Masthead */}
      <section className="flex flex-col gap-2">
        <SmallCaps tracking={0.3}>{today}</SmallCaps>
        <h1 className="font-serif text-[44px] leading-[1.05] text-ink mt-2">
          {firstName}&apos;s circle.
        </h1>
        <p className="font-serif text-[19px] text-inkFaint mt-1 max-w-xl italic">
          {placeMaker.title ?? placeMaker.role.replace('_', ' ')} · Rosewood Sand Hill
        </p>
      </section>

      {/* Three sections, in order */}
      {(['on_property', 'upcoming', 'past'] as StayState[]).map((state) => {
        const rows = grouped[state];
        if (!rows.length) return null;
        return (
          <section key={state} className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <SmallCaps tracking={0.3}>{sectionLabel[state]}</SmallCaps>
              <SmallCaps size={9.5} color="#B5B0A8">
                {rows.length} {rows.length === 1 ? 'guest' : 'guests'}
              </SmallCaps>
            </div>
            <div className="flex flex-col">
              {rows.map((rel) => {
                const guest = rel.guest;
                const copy = stayCopy(guest);
                const pendingDraft = guest.drafts[0];
                const latestBrief = guest.briefs[0];
                return (
                  <Link
                    key={guest.id}
                    href={`/${placemakerSlug}/guests/${guest.id}`}
                    className="group grid grid-cols-[64px_1fr_auto] gap-5 items-start py-6 border-t border-hair hover:bg-paperLight transition-colors px-1"
                  >
                    <Initials
                      name={guest.name}
                      size={56}
                      tone={state === 'on_property' ? 'dark' : state === 'upcoming' ? 'mid' : 'light'}
                    />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className="font-serif text-[22px] text-ink leading-tight">
                          {guest.name}
                        </span>
                        {pendingDraft && (
                          <span className="inline-flex items-center gap-1.5">
                            <StatusDot status="pending" />
                            <SmallCaps size={9.5} tracking={0.22}>
                              A note ready to send
                            </SmallCaps>
                          </span>
                        )}
                      </div>
                      <SmallCaps size={10} tracking={0.22}>
                        {copy.headline} · {copy.sub}
                      </SmallCaps>
                      {latestBrief ? (
                        <p className="font-serif text-[15.5px] leading-[1.55] text-inkFaint mt-2 line-clamp-2 max-w-[60ch]">
                          {latestBrief.content}
                        </p>
                      ) : rel.themes.length > 0 ? (
                        <p className="font-serif text-[15.5px] leading-[1.5] text-inkFaint mt-2 italic">
                          {rel.themes.slice(0, 3).join(' · ')}
                        </p>
                      ) : null}
                    </div>
                    <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <SmallCaps color="var(--iris-green)" tracking={0.22}>
                        Open →
                      </SmallCaps>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
