import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { publish, guestChannel } from '@/lib/events';
import { runMaitre } from '@/lib/maitre';
import { extractGuestObservation } from '@/lib/maitre/extract';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const transcript = (body?.transcript as string | undefined)?.trim();
  const sourcePlaceMakerId = body?.sourcePlaceMakerId as string | undefined;
  const sessionId = body?.sessionId as string | undefined;

  if (!transcript || !sourcePlaceMakerId) {
    return Response.json(
      { error: 'transcript and sourcePlaceMakerId required' },
      { status: 400 }
    );
  }

  const extraction = await extractGuestObservation(transcript);

  if (!extraction.guestId) {
    return Response.json({
      accepted: true,
      stored: false,
      rationale: extraction.rationale,
    });
  }

  const note = await prisma.rawNote.create({
    data: {
      guestId: extraction.guestId,
      sourcePlaceMakerId,
      content: extraction.cleanedNote ?? transcript,
    },
  });

  publish({
    type: 'note.captured',
    channel: guestChannel(extraction.guestId),
    data: {
      rawNoteId: note.id,
      sourcePlaceMakerId,
      via: 'pipecat-turn',
      sessionId,
    },
    ts: Date.now(),
  });

  runMaitre({ rawNoteId: note.id }).catch((err) => {
    console.error('runMaitre failed', err);
  });

  return Response.json({
    accepted: true,
    stored: true,
    guestId: extraction.guestId,
    noteId: note.id,
    rationale: extraction.rationale,
  });
}
