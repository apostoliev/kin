import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSms } from '@/lib/twilio';
import { publish, guestChannel } from '@/lib/events';

export const runtime = 'nodejs';

// Direct send — staff types a custom message, no draft step, no Maître.
// Authorship is the place-maker; the guest receives it from that person.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const fromPlaceMakerId = body?.fromPlaceMakerId as string | undefined;
  const guestId = body?.guestId as string | undefined;
  const content = (body?.content as string | undefined)?.trim();

  if (!fromPlaceMakerId || !guestId || !content) {
    return Response.json(
      { error: 'fromPlaceMakerId, guestId, content required' },
      { status: 400 }
    );
  }

  const [placeMaker, guest] = await Promise.all([
    prisma.placeMaker.findUnique({ where: { id: fromPlaceMakerId } }),
    prisma.guest.findUnique({ where: { id: guestId } }),
  ]);
  if (!placeMaker) return Response.json({ error: 'place-maker not found' }, { status: 404 });
  if (!guest) return Response.json({ error: 'guest not found' }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const deepLink = `${appUrl}/g/${guestId}`;
  const smsBody = `${content}\n\nReply privately: ${deepLink}`;

  const sms = guest.phone
    ? await sendSms({ to: guest.phone, body: smsBody })
    : { skipped: true, reason: 'guest has no phone' };

  const message = await prisma.message.create({
    data: {
      fromPlaceMakerId,
      guestId,
      content,
      twilioSid: 'sid' in sms ? sms.sid ?? null : null,
    },
  });

  publish({
    type: 'message.sent',
    channel: guestChannel(guestId),
    data: {
      messageId: message.id,
      fromPlaceMakerId,
      content,
      smsSent: 'sid' in sms && !!sms.sid,
      smsReason: 'reason' in sms ? sms.reason : undefined,
    },
    ts: Date.now(),
  });

  return Response.json({ messageId: message.id, sms, deepLink });
}
