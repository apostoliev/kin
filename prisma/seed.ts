import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.placeMaker.findUnique({ where: { slug: 'maria' } });
  const forceReseed = process.env.KIN_FORCE_RESEED === 'true';
  if (existing && !forceReseed) {
    console.log('Seed skipped — Kin data already present. Set KIN_FORCE_RESEED=true to reset.');
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

  const maria = await prisma.placeMaker.create({
    data: {
      id: 'pm_maria',
      slug: 'maria',
      name: 'Maria Vasquez',
      role: 'sommelier',
      property: 'Rosewood Sand Hill',
      title: 'Sommelier',
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
        "Background presence. Rarely messages guests directly. Internal communication only. When written, plain and respectful.",
    },
  });

  const apostoliPhone = process.env.DEMO_GUEST_PHONE || '+15555550199';
  const apostoli = await prisma.guest.create({
    data: {
      id: 'apostoli',
      name: 'Apostoli Evreniadis',
      phone: apostoliPhone,
      partnerName: 'Anna',
      anniversary: 'May 17',
      origin: 'Athens · San Francisco',
      interestTags: [
        'Greek wines',
        'single-vineyard syrah',
        'low-intervention',
        'late dinners',
        'long-format breakfast',
      ],
      notes:
        'Third visit. First stay was suite 412 with Anna. Previously discussed Domaine Sigalas with Maria. Travels for work; comes here to slow down.',
    },
  });

  const lena = await prisma.guest.create({
    data: {
      id: 'lena',
      name: 'Lena Chen',
      phone: '+15555550144',
      origin: 'Singapore · Palo Alto',
      interestTags: ['matcha mornings', 'mountain walk', 'piano in lobby'],
      notes: 'Second visit. Quiet preference.',
    },
  });

  await prisma.relationshipRecord.createMany({
    data: [
      {
        guestId: apostoli.id,
        placeMakerId: maria.id,
        visits: 3,
        themes: ['Greek wines', 'anniversary plans', 'low-intervention', 'late tastings'],
        lastSeenAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 92),
      },
      {
        guestId: apostoli.id,
        placeMakerId: diana.id,
        visits: 3,
        themes: ['late check-in', 'high floor preference', 'partner travels with him'],
        lastSeenAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 92),
      },
      {
        guestId: apostoli.id,
        placeMakerId: tomas.id,
        visits: 3,
        themes: ['morning service preferred', 'quiet floor', 'spare pillows'],
        lastSeenAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 92),
      },
      {
        guestId: lena.id,
        placeMakerId: maria.id,
        visits: 2,
        themes: ['curious about Japanese sakes', 'morning tea ritual'],
        lastSeenAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200),
      },
    ],
  });

  const fiveDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 5);
  await prisma.message.create({
    data: {
      fromPlaceMakerId: maria.id,
      guestId: apostoli.id,
      content:
        "The Sigalas you liked is back on the list — let me know if you'd like to try the new Mavrotragano this trip. — M.",
      deliveredAt: fiveDaysAgo,
    },
  });
  await prisma.guestReply.create({
    data: {
      fromGuestId: apostoli.id,
      toPlaceMakerId: maria.id,
      content: 'Yes. Surprise me Friday.',
      createdAt: new Date(fiveDaysAgo.getTime() + 1000 * 60 * 14),
    },
  });

  const twoDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2);
  const seededNote = await prisma.rawNote.create({
    data: {
      guestId: apostoli.id,
      sourcePlaceMakerId: diana.id,
      content:
        'On the call to confirm the suite, Apostoli mentioned this is the anniversary trip and Anna is coming in Friday morning instead of Thursday. He sounded tired — said his quarter has been heavy. Asked if we could keep the room quiet.',
      sensitivity: 'medium',
      themes: ['anniversary', 'fatigue', 'quiet stay'],
      suggestedRoles: ['front_desk', 'housekeeping', 'sommelier'],
      createdAt: twoDaysAgo,
    },
  });

  await prisma.messageDraft.create({
    data: {
      fromPlaceMakerId: maria.id,
      guestId: apostoli.id,
      content:
        "Apostoli — the Mavrotragano you said yes to is set aside for Friday. Thinking we open it with the meal rather than upstairs — quieter that way. Looking forward to having you both. — M.",
      intent: 'pre_arrival_warm_outreach',
      status: 'draft',
      createdAt: new Date(twoDaysAgo.getTime() + 1000 * 60 * 2),
    },
  });

  await prisma.brief.createMany({
    data: [
      {
        guestId: apostoli.id,
        recipientPlaceMakerId: diana.id,
        sourceRawNoteId: seededNote.id,
        sensitivity: 'medium',
        content:
          'Apostoli arrives Thursday night; Anna joins Friday morning. He wants a quiet stay this visit. Hold a high-floor suite, soft welcome — no balloons, no full welcome cart. Confirm late check-in window when he calls.',
        createdAt: new Date(twoDaysAgo.getTime() + 1000 * 60),
      },
      {
        guestId: apostoli.id,
        recipientPlaceMakerId: tomas.id,
        sourceRawNoteId: seededNote.id,
        sensitivity: 'medium',
        content:
          'Service the room only in the morning unless asked. Extra pillows on the bed before turndown. Avoid evening housekeeping knocks Friday — a private moment is likely.',
        createdAt: new Date(twoDaysAgo.getTime() + 1000 * 60),
      },
      {
        guestId: apostoli.id,
        recipientPlaceMakerId: maria.id,
        sourceRawNoteId: seededNote.id,
        sensitivity: 'medium',
        content:
          'Apostoli + Anna in Friday — an occasion stay. He has asked for the Mavrotragano (you set it aside). Consider opening it with the meal rather than a tasting flight; this trip is for slowing down, not for performance.',
        createdAt: new Date(twoDaysAgo.getTime() + 1000 * 60),
      },
    ],
  });

  console.log('Seed complete.');
  console.log(`Apostoli guest id: ${apostoli.id}`);
  console.log(`Maria placeMaker id: ${maria.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
