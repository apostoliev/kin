import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Demo "now" — the script frames today as Daniel's arrival night.
const NOW = new Date();
const days = (n: number) => 1000 * 60 * 60 * 24 * n;

async function main() {
  const existing = await prisma.placeMaker.findUnique({ where: { slug: 'maria' } });
  const forceReseed = process.env.KIN_FORCE_RESEED === 'true';
  if (existing && !forceReseed) {
    console.log('Seed skipped — Iris demo data already present. Set KIN_FORCE_RESEED=true to reset.');
    return;
  }

  await prisma.guestReply.deleteMany();
  await prisma.message.deleteMany();
  await prisma.messageDraft.deleteMany();
  await prisma.brief.deleteMany();
  await prisma.rawNote.deleteMany();
  await prisma.relationshipRecord.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.placeMaker.deleteMany();

  // ─── PlaceMakers ────────────────────────────────────────────────
  const maria = await prisma.placeMaker.create({
    data: {
      id: 'pm_maria',
      slug: 'maria',
      name: 'Maria Vasquez',
      role: 'sommelier',
      property: 'Rosewood Sand Hill',
      title: 'Wine Director',
      voiceStyle:
        "Warm, lightly playful. References the cellar by feel rather than vintage. Signs off with 'M.' Never over-formal. Uses em dashes. Light specificity always beats grand claims.",
    },
  });

  const diana = await prisma.placeMaker.create({
    data: {
      id: 'pm_diana',
      slug: 'diana',
      name: 'Diana Park',
      role: 'front_desk',
      property: 'Rosewood Sand Hill',
      title: 'Front Desk Lead',
      voiceStyle:
        "Crisp, precise, attentive to logistics. Confirms times explicitly. Brief warmth at the edges, never effusive. Signs 'Diana'.",
    },
  });

  const tomas = await prisma.placeMaker.create({
    data: {
      id: 'pm_tomas',
      slug: 'tomas',
      name: 'Tomás Reyes',
      role: 'housekeeping',
      property: 'Rosewood Sand Hill',
      title: 'Housekeeping Lead',
      voiceStyle:
        'Background presence. Rarely messages guests directly. Internal communication only. When written, plain and respectful.',
    },
  });

  const carol = await prisma.placeMaker.create({
    data: {
      id: 'pm_carol',
      slug: 'carol',
      name: 'Carol Sato',
      role: 'manager',
      property: 'Rosewood Sand Hill',
      title: 'Director of Communications',
      voiceStyle:
        'Senior, calm, considered. Speaks for the property when she has to, but prefers to let her team carry the relationships. Signs "Carol".',
    },
  });

  // ─── Guests ─────────────────────────────────────────────────────
  const danielPhone = process.env.DEMO_GUEST_PHONE || '+15555550199';
  const daniel = await prisma.guest.create({
    data: {
      id: 'daniel',
      name: 'Daniel Marchetti',
      phone: danielPhone,
      partnerName: 'Anna',
      anniversary: 'May 18',
      origin: 'Athens · Zürich',
      arrivalAt: new Date(NOW.getTime()), // tonight
      departureAt: new Date(NOW.getTime() + days(4)),
      stayState: 'on_property',
      visitCount: 3,
      interestTags: [
        'Greek wines',
        'single-vineyard syrah',
        'low-intervention',
        'late dinners',
        'long-format breakfast',
      ],
      notes:
        'Third visit. First stay was suite 412 with Anna. Previously discussed Domaine Sigalas and Mavrotragano with Maria. Travels for work; comes here to slow down.',
    },
  });

  const lena = await prisma.guest.create({
    data: {
      id: 'lena',
      name: 'Lena Chen',
      phone: '+15555550144',
      origin: 'Singapore · Palo Alto',
      arrivalAt: null,
      departureAt: new Date(NOW.getTime() - days(212)), // last seen ~ October 2025
      stayState: 'past',
      visitCount: 2,
      interestTags: [
        'Japanese sakes',
        'matcha mornings',
        'mountain walk',
        'piano in lobby',
        'quiet rooms',
      ],
      notes:
        'Two prior stays. Curious about sake — she and Maria had a long conversation in October about junmai daiginjo. Reads at breakfast. No return on the books.',
    },
  });

  const sophie = await prisma.guest.create({
    data: {
      id: 'sophie',
      name: 'Sophie Laurent',
      phone: '+15555550177',
      origin: 'Paris · New York',
      arrivalAt: new Date(NOW.getTime() + days(14)), // ~2 weeks out
      departureAt: new Date(NOW.getTime() + days(17)),
      stayState: 'upcoming',
      visitCount: 1,
      interestTags: [
        'Loire reds',
        'morning runs',
        'reformer pilates',
        'late check-out',
        'still water only',
      ],
      notes:
        'First return. Came once last spring for a quiet weekend. Asked about Loire reds at dinner. Booked suite for a long weekend.',
    },
  });

  // Manager has a relationship to every guest at the property
  const allGuests = [daniel, lena, sophie];

  await prisma.relationshipRecord.createMany({
    data: [
      // Maria
      {
        guestId: daniel.id,
        placeMakerId: maria.id,
        visits: 3,
        themes: ['Greek wines', 'anniversary plans', 'low-intervention', 'late tastings'],
        lastSeenAt: new Date(NOW.getTime() - days(92)),
      },
      {
        guestId: lena.id,
        placeMakerId: maria.id,
        visits: 2,
        themes: ['curious about Japanese sakes', 'morning tea ritual'],
        lastSeenAt: new Date(NOW.getTime() - days(212)),
      },
      {
        guestId: sophie.id,
        placeMakerId: maria.id,
        visits: 1,
        themes: ['Loire reds', 'asked about cellar tour'],
        lastSeenAt: new Date(NOW.getTime() - days(380)),
      },
      // Diana
      {
        guestId: daniel.id,
        placeMakerId: diana.id,
        visits: 3,
        themes: ['late check-in', 'high floor preference', 'partner travels with him'],
        lastSeenAt: new Date(NOW.getTime() - days(92)),
      },
      {
        guestId: sophie.id,
        placeMakerId: diana.id,
        visits: 1,
        themes: ['arrives late', 'requested still water only'],
        lastSeenAt: new Date(NOW.getTime() - days(380)),
      },
      // Tomás
      {
        guestId: daniel.id,
        placeMakerId: tomas.id,
        visits: 3,
        themes: ['morning service preferred', 'quiet floor', 'spare pillows'],
        lastSeenAt: new Date(NOW.getTime() - days(92)),
      },
      // Carol (manager) — sees everyone
      ...allGuests.map((g) => ({
        guestId: g.id,
        placeMakerId: carol.id,
        visits: g.visitCount,
        themes: ['property-wide'],
        lastSeenAt: g.departureAt ?? null,
      })),
    ],
  });

  // ─── Prior thread between Maria and Daniel ──────────────────────
  const fiveDaysAgo = new Date(NOW.getTime() - days(5));
  await prisma.message.create({
    data: {
      fromPlaceMakerId: maria.id,
      guestId: daniel.id,
      content:
        "The Sigalas you liked is back on the list — let me know if you'd like to try the new Mavrotragano this trip. — M.",
      deliveredAt: fiveDaysAgo,
    },
  });
  await prisma.guestReply.create({
    data: {
      fromGuestId: daniel.id,
      toPlaceMakerId: maria.id,
      content: 'Yes. Surprise me Friday.',
      createdAt: new Date(fiveDaysAgo.getTime() + 1000 * 60 * 14),
    },
  });

  // ─── Pre-arrival raw note + briefs + draft for Daniel ───────────
  const twoDaysAgo = new Date(NOW.getTime() - days(2));
  const danielNote = await prisma.rawNote.create({
    data: {
      guestId: daniel.id,
      sourcePlaceMakerId: diana.id,
      content:
        'On the call to confirm the suite, Daniel mentioned this is the anniversary trip and Anna is coming in Friday morning instead of Thursday. He sounded tired — said his quarter has been heavy. Asked if we could keep the room quiet.',
      sensitivity: 'medium',
      themes: ['anniversary', 'fatigue', 'quiet stay'],
      suggestedRoles: ['front_desk', 'housekeeping', 'sommelier'],
      createdAt: twoDaysAgo,
    },
  });

  await prisma.brief.createMany({
    data: [
      {
        guestId: daniel.id,
        recipientPlaceMakerId: diana.id,
        sourceRawNoteId: danielNote.id,
        sensitivity: 'medium',
        content:
          'Daniel arrives tonight; Anna joins Friday morning. He wants a quiet stay this visit. Hold the high-floor suite he prefers, soft welcome — no balloons, no full welcome cart. Confirm late check-in window when he calls.',
        createdAt: new Date(twoDaysAgo.getTime() + 1000 * 60),
      },
      {
        guestId: daniel.id,
        recipientPlaceMakerId: tomas.id,
        sourceRawNoteId: danielNote.id,
        sensitivity: 'medium',
        content:
          'Service the room only in the morning unless asked. Extra pillows on the bed before turndown. Avoid evening housekeeping knocks Friday — a private moment is likely.',
        createdAt: new Date(twoDaysAgo.getTime() + 1000 * 60),
      },
      {
        guestId: daniel.id,
        recipientPlaceMakerId: maria.id,
        sourceRawNoteId: danielNote.id,
        sensitivity: 'medium',
        content:
          'Daniel + Anna in tonight — an occasion stay. He has asked for the Mavrotragano (you set it aside). Consider opening it with the meal rather than a tasting flight; this trip is for slowing down, not for performance.',
        createdAt: new Date(twoDaysAgo.getTime() + 1000 * 60),
      },
    ],
  });

  await prisma.messageDraft.create({
    data: {
      fromPlaceMakerId: maria.id,
      guestId: daniel.id,
      content:
        "Daniel — the Mavrotragano you said yes to is set aside for tonight. Thinking we open it with the meal rather than upstairs — quieter that way. Looking forward to having you both. — M.",
      intent: 'pre_arrival_warm_outreach',
      status: 'draft',
      createdAt: new Date(twoDaysAgo.getTime() + 1000 * 60 * 2),
    },
  });

  // ─── Lena's queued draft about the new sake (script's act 3) ────
  const lenaNote = await prisma.rawNote.create({
    data: {
      guestId: lena.id,
      sourcePlaceMakerId: maria.id,
      content:
        'A new junmai daiginjo from a small Niigata kura arrived this week — exactly the style Lena was asking about in October. Worth telling her.',
      sensitivity: 'low',
      themes: ['sake', 'new arrival', 'past-guest outreach'],
      suggestedRoles: ['sommelier'],
      createdAt: new Date(NOW.getTime() - days(1)),
    },
  });

  await prisma.brief.create({
    data: {
      guestId: lena.id,
      recipientPlaceMakerId: maria.id,
      sourceRawNoteId: lenaNote.id,
      sensitivity: 'low',
      content:
        "Lena hasn't been back since October. She spent a long evening with you on Niigata junmai daiginjos. A new one from a small kura just came in. A short, warm note from you — no pitch — would be the right thing.",
      createdAt: new Date(NOW.getTime() - days(1) + 1000 * 60),
    },
  });

  await prisma.messageDraft.create({
    data: {
      fromPlaceMakerId: maria.id,
      guestId: lena.id,
      content:
        "Lena — a Niigata junmai daiginjo came in this week that I think you'd love. No occasion, just remembering the conversation we had in October. Whenever you're back. — M.",
      intent: 'post_stay_warm_outreach',
      status: 'draft',
      createdAt: new Date(NOW.getTime() - days(1) + 1000 * 60 * 2),
    },
  });

  // ─── Sophie's pre-arrival brief (booked in two weeks) ───────────
  const sophieNote = await prisma.rawNote.create({
    data: {
      guestId: sophie.id,
      sourcePlaceMakerId: diana.id,
      content:
        'Sophie booked the long weekend suite for end-of-the-month. On the call she asked whether the cellar tour was still happening Saturdays. Sounded excited.',
      sensitivity: 'low',
      themes: ['return guest', 'cellar tour', 'weekend stay'],
      suggestedRoles: ['front_desk', 'sommelier'],
      createdAt: new Date(NOW.getTime() - days(3)),
    },
  });

  await prisma.brief.createMany({
    data: [
      {
        guestId: sophie.id,
        recipientPlaceMakerId: maria.id,
        sourceRawNoteId: sophieNote.id,
        sensitivity: 'low',
        content:
          "Sophie is back at the end of the month — second stay. She asked specifically about the Saturday cellar tour. Loire reds were her interest last time; we have a Bourgueil arrival worth saving for her.",
        createdAt: new Date(NOW.getTime() - days(3) + 1000 * 60),
      },
      {
        guestId: sophie.id,
        recipientPlaceMakerId: diana.id,
        sourceRawNoteId: sophieNote.id,
        sensitivity: 'low',
        content:
          'Sophie arrives in two weeks — a long weekend. Late arrival likely. Still water in the room, not sparkling. Confirm cellar-tour timing when she checks in.',
        createdAt: new Date(NOW.getTime() - days(3) + 1000 * 60),
      },
    ],
  });

  console.log('Seed complete.');
  console.log(`  Maria  → /maria`);
  console.log(`  Daniel → /g/daniel`);
  console.log(`  Carol  → /manager (or /carol)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
