import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { GuestCockpit } from './GuestCockpit';

export const dynamic = 'force-dynamic';

export default async function GuestCockpitPage({
  params,
}: {
  params: Promise<{ placemakerSlug: string; guestId: string }>;
}) {
  const { placemakerSlug, guestId } = await params;

  const placeMaker = await prisma.placeMaker.findUnique({
    where: { slug: placemakerSlug },
  });
  if (!placeMaker) notFound();

  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    include: {
      relationships: { include: { placeMaker: true } },
    },
  });
  if (!guest) notFound();

  const latestRawNote = await prisma.rawNote.findFirst({
    where: { guestId },
    orderBy: { createdAt: 'desc' },
  });

  // A staff cockpit shows only this person's brief, never anyone else's.
  const myBrief = latestRawNote
    ? await prisma.brief.findFirst({
        where: {
          sourceRawNoteId: latestRawNote.id,
          recipientPlaceMakerId: placeMaker.id,
        },
        include: { recipient: true },
        orderBy: { createdAt: 'desc' },
      })
    : null;

  const latestDraft = await prisma.messageDraft.findFirst({
    where: {
      guestId,
      fromPlaceMakerId: placeMaker.id,
    },
    include: { from: true },
    orderBy: { createdAt: 'desc' },
  });

  const messages = await prisma.message.findMany({
    where: { guestId },
    include: { from: true },
    orderBy: { deliveredAt: 'asc' },
  });
  const replies = await prisma.guestReply.findMany({
    where: { fromGuestId: guestId },
    include: { toPlaceMaker: true },
    orderBy: { createdAt: 'asc' },
  });

  const threadItems = [
    ...messages.map((m) => ({
      kind: 'message' as const,
      id: m.id,
      content: m.content,
      at: m.deliveredAt.toISOString(),
      fromName: m.from.name,
      fromSlug: m.from.slug,
      fromRole: m.from.role,
    })),
    ...replies.map((r) => ({
      kind: 'reply' as const,
      id: r.id,
      content: r.content,
      at: r.createdAt.toISOString(),
      toName: r.toPlaceMaker.name,
      toSlug: r.toPlaceMaker.slug,
    })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col gap-8">
      <div className="text-sm">
        <Link href={`/${placemakerSlug}`} className="text-muted hover:text-ink">
          ← back to your circle
        </Link>
      </div>
      <GuestCockpit
        placeMakerId={placeMaker.id}
        placeMakerName={placeMaker.name}
        placeMakerRole={placeMaker.role}
        guest={{
          id: guest.id,
          name: guest.name,
          partnerName: guest.partnerName,
          anniversary: guest.anniversary,
          origin: guest.origin,
          interestTags: guest.interestTags,
          notes: guest.notes,
          stayState: guest.stayState,
          arrivalAt: guest.arrivalAt?.toISOString() ?? null,
          visitCount: guest.visitCount,
        }}
        initialBrief={
          myBrief && {
            id: myBrief.id,
            content: myBrief.content,
            sensitivity: myBrief.sensitivity,
            recipient: {
              slug: myBrief.recipient.slug,
              name: myBrief.recipient.name,
              role: myBrief.recipient.role,
              title: myBrief.recipient.title,
            },
          }
        }
        initialDraft={
          latestDraft && {
            id: latestDraft.id,
            content: latestDraft.content,
            status: latestDraft.status,
            from: {
              name: latestDraft.from.name,
              slug: latestDraft.from.slug,
              role: latestDraft.from.role,
            },
            intent: latestDraft.intent,
          }
        }
        initialThread={threadItems}
      />
    </div>
  );
}
