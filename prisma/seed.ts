import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Demo "now" — the script frames today as Daniel and Priya's arrival night.
const NOW = new Date();
const days = (n: number) => 1000 * 60 * 60 * 24 * n;

async function main() {
  const existing = await prisma.placeMaker.findUnique({ where: { slug: 'maria' } });
  const hasNoor = await prisma.placeMaker.findUnique({ where: { slug: 'noor' } });
  // Sentinel: a draft from Tomás to Daniel only exists in the v3 seed onward.
  // If it's missing, the demo data is stale and should be regenerated.
  const tomasDraftToDaniel = hasNoor
    ? await prisma.messageDraft.findFirst({
        where: {
          guestId: 'daniel',
          from: { slug: 'tomas' },
          status: 'draft',
        },
      })
    : null;
  const forceReseed = process.env.KIN_FORCE_RESEED === 'true';
  if (existing && hasNoor && tomasDraftToDaniel && !forceReseed) {
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

  const noor = await prisma.placeMaker.create({
    data: {
      id: 'pm_noor',
      slug: 'noor',
      name: 'Noor Haddad',
      role: 'concierge',
      property: 'Rosewood Sand Hill',
      title: 'Head Concierge',
      voiceStyle:
        "Warm and matter-of-fact. Plans feel inevitable, not effortful. Short sentences. Signs '— N.' Calls people by first name. One quick question only if it helps land the plan. No exclamation, no superlatives.",
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

  // Priya — the celebratory profile that the live demo capture quietly reframes.
  const priya = await prisma.guest.create({
    data: {
      id: 'priya',
      name: 'Priya Anand',
      phone: '+15555550155',
      origin: 'Los Angeles · Mumbai',
      arrivalAt: new Date(NOW.getTime() - 1000 * 60 * 60 * 3), // checked in this afternoon
      departureAt: new Date(NOW.getTime() + days(5)),
      stayState: 'on_property',
      visitCount: 4,
      interestTags: [
        'private dinners with friends',
        'Napa wineries',
        'lobby bar nightcaps',
        'spa pre-dinner',
        'late riser',
        'big bold reds',
      ],
      notes:
        'Four visits in eighteen months — usually a long weekend with two close friends, Mira and Jules. Treats Sand Hill as a recurring playground: Madera tasting menus, winery tours, late bar service. Birthdays, half-birthdays, "just because." Generous tipper. Books through Noor.',
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

  // Jonas — past guest in Noor's circle, gives the concierge a parallel to Lena/Maria.
  const jonas = await prisma.guest.create({
    data: {
      id: 'jonas',
      name: 'Jonas Weber',
      phone: '+15555550122',
      origin: 'Berlin · Cambridge',
      arrivalAt: null,
      departureAt: new Date(NOW.getTime() - days(95)), // February-ish
      stayState: 'past',
      visitCount: 1,
      interestTags: [
        'writing retreats',
        'long walks',
        'bookshops',
        'pour-over coffee',
        'rooms with desks',
      ],
      notes:
        "Came in February for a self-imposed writing week. Asked Noor about quiet bookshops and where Stegner used to walk. Sent a thank-you note after. Nothing on the books.",
    },
  });

  // ─── Relationships ──────────────────────────────────────────────
  const allGuests = [daniel, priya, lena, sophie, jonas];

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
        guestId: priya.id,
        placeMakerId: maria.id,
        visits: 4,
        themes: ['big bold reds', 'magnum at the table', 'late bar', 'group pours'],
        lastSeenAt: new Date(NOW.getTime() - days(70)),
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
      // Noor (concierge)
      {
        guestId: daniel.id,
        placeMakerId: noor.id,
        visits: 3,
        themes: ['anniversary planning', 'quiet itineraries', 'restaurant holds'],
        lastSeenAt: new Date(NOW.getTime() - days(92)),
      },
      {
        guestId: priya.id,
        placeMakerId: noor.id,
        visits: 4,
        themes: ['birthday weekends', 'Madera tastings', 'winery tours', 'table for 3-4'],
        lastSeenAt: new Date(NOW.getTime() - days(70)),
      },
      {
        guestId: jonas.id,
        placeMakerId: noor.id,
        visits: 1,
        themes: ['writing week', 'bookshops', 'Stegner walks', 'quiet rooms'],
        lastSeenAt: new Date(NOW.getTime() - days(95)),
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
        guestId: priya.id,
        placeMakerId: diana.id,
        visits: 4,
        themes: ['arrives with friends', 'wants quick check-in', 'asks for the corner suite'],
        lastSeenAt: new Date(NOW.getTime() - days(70)),
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
      {
        guestId: priya.id,
        placeMakerId: tomas.id,
        visits: 4,
        themes: ['friends in the suite', 'late turndown', 'extra glassware', 'champagne welcome'],
        lastSeenAt: new Date(NOW.getTime() - days(70)),
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

  // ─── Prior thread between Noor and Priya (last trip) ────────────
  const sixtyDaysAgo = new Date(NOW.getTime() - days(60));
  await prisma.message.create({
    data: {
      fromPlaceMakerId: noor.id,
      guestId: priya.id,
      content:
        "Priya — Madera locked for Saturday at 8. Bringing the magnum upstairs after. — N.",
      deliveredAt: sixtyDaysAgo,
    },
  });
  await prisma.guestReply.create({
    data: {
      fromGuestId: priya.id,
      toPlaceMakerId: noor.id,
      content: 'You are the best. See you Friday.',
      createdAt: new Date(sixtyDaysAgo.getTime() + 1000 * 60 * 7),
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

  // Noor for Daniel — anniversary itinerary, in her plans-feel-inevitable voice.
  await prisma.messageDraft.create({
    data: {
      fromPlaceMakerId: noor.id,
      guestId: daniel.id,
      content:
        "Daniel — quiet table held for Friday at 8 in the smaller dining room. Car for Anna in the morning, 9:15 from SFO. Nothing else on the schedule unless you want it. — N.",
      intent: 'pre_arrival_planning_confirmation',
      status: 'draft',
      createdAt: new Date(twoDaysAgo.getTime() + 1000 * 60 * 3),
    },
  });

  // Diana for Daniel — crisp logistics, signs Diana.
  await prisma.messageDraft.create({
    data: {
      fromPlaceMakerId: diana.id,
      guestId: daniel.id,
      content:
        "Daniel — high-floor suite is ready as you like it. Soft welcome upstairs, no cart. Late check-in window held to midnight. See you when you land. — Diana",
      intent: 'pre_arrival_logistics_confirmation',
      status: 'draft',
      createdAt: new Date(twoDaysAgo.getTime() + 1000 * 60 * 4),
    },
  });

  // Tomás for Daniel — plain, respectful, the rare housekeeping note.
  await prisma.messageDraft.create({
    data: {
      fromPlaceMakerId: tomas.id,
      guestId: daniel.id,
      content:
        "Daniel — welcome back. The pillows you like are on the bed and we'll keep evenings quiet for you both. Anything else, just leave word at the desk. — Tomás, housekeeping",
      intent: 'pre_arrival_welcome',
      status: 'draft',
      createdAt: new Date(twoDaysAgo.getTime() + 1000 * 60 * 5),
    },
  });

  // ─── Priya: celebratory pre-arrival state (gets reframed live) ──
  const threeDaysAgo = new Date(NOW.getTime() - days(3));
  const priyaNote = await prisma.rawNote.create({
    data: {
      guestId: priya.id,
      sourcePlaceMakerId: noor.id,
      content:
        "Priya in this weekend with Mira and Jules. Birthday energy. Asked to lock the tasting menu at Madera Saturday at 8 and a winery in Napa Sunday morning — she wants 'big.' Corner banquette at the bar after dinner each night. Magnum of the Mavrotragano upstairs.",
      sensitivity: 'low',
      themes: ['birthday', 'group dinner', 'winery tour', 'late nights', 'magnum upstairs'],
      suggestedRoles: ['concierge', 'sommelier', 'housekeeping', 'front_desk'],
      createdAt: threeDaysAgo,
    },
  });

  await prisma.brief.createMany({
    data: [
      {
        guestId: priya.id,
        recipientPlaceMakerId: noor.id,
        sourceRawNoteId: priyaNote.id,
        sensitivity: 'low',
        content:
          "Priya's birthday weekend — in tonight with Mira and Jules through Wednesday. Madera Saturday 8pm, table of four, locked. Sunday winery, car at 10. Corner banquette at the bar after dinner each night. The magnum upstairs on arrival.",
        createdAt: new Date(threeDaysAgo.getTime() + 1000 * 60),
      },
      {
        guestId: priya.id,
        recipientPlaceMakerId: maria.id,
        sourceRawNoteId: priyaNote.id,
        sensitivity: 'low',
        content:
          "Priya in for the birthday weekend with two friends. She drinks bold when she's with company. Magnum of Mavrotragano set for the suite, the Bourgueil ready for Saturday's late table. Expect them at the bar Friday after dinner — the corner banquette is theirs.",
        createdAt: new Date(threeDaysAgo.getTime() + 1000 * 60),
      },
      {
        guestId: priya.id,
        recipientPlaceMakerId: tomas.id,
        sourceRawNoteId: priyaNote.id,
        sensitivity: 'low',
        content:
          "Priya arriving this afternoon with two friends. Champagne welcome amenity in suite 514, extra flutes on the bar. Late turndown — they will be out at dinner most nights. Spare towels for three.",
        createdAt: new Date(threeDaysAgo.getTime() + 1000 * 60),
      },
      {
        guestId: priya.id,
        recipientPlaceMakerId: diana.id,
        sourceRawNoteId: priyaNote.id,
        sensitivity: 'low',
        content:
          "Priya in this afternoon with Mira and Jules — birthday weekend. Big party energy. Quick warm check-in, get them upstairs. Confirm the Madera reservation if she asks. Car for Napa booked Sunday morning, 10am pickup.",
        createdAt: new Date(threeDaysAgo.getTime() + 1000 * 60),
      },
    ],
  });

  await prisma.messageDraft.create({
    data: {
      fromPlaceMakerId: noor.id,
      guestId: priya.id,
      content:
        "Priya — Madera is set for Saturday, table of four at 8. The corner banquette is yours after. Magnum of the Mavrotragano upstairs when you check in. Anything else before Friday? — N.",
      intent: 'pre_arrival_planning_confirmation',
      status: 'draft',
      createdAt: new Date(threeDaysAgo.getTime() + 1000 * 60 * 2),
    },
  });

  // ─── Lena's queued draft about the new sake (script's past-guest beat) ──
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

  // ─── Jonas: a parallel past-guest beat for Noor ─────────────────
  const jonasNote = await prisma.rawNote.create({
    data: {
      guestId: jonas.id,
      sourcePlaceMakerId: noor.id,
      content:
        "Saw a small literary salon next Thursday at Kepler's in Menlo Park — Marilynne Robinson reading. Jonas spent his week here asking after exactly this kind of thing. Worth a note.",
      sensitivity: 'low',
      themes: ['literary event', 'past-guest outreach', 'bookshop'],
      suggestedRoles: ['concierge'],
      createdAt: new Date(NOW.getTime() - days(2)),
    },
  });

  await prisma.brief.create({
    data: {
      guestId: jonas.id,
      recipientPlaceMakerId: noor.id,
      sourceRawNoteId: jonasNote.id,
      sensitivity: 'low',
      content:
        "Jonas hasn't been back since February. Kepler's has a Marilynne Robinson reading next Thursday — exactly the kind of evening he was hunting for last visit. A short note from you, no pressure to book — just the heads-up — would land well.",
      createdAt: new Date(NOW.getTime() - days(2) + 1000 * 60),
    },
  });

  await prisma.messageDraft.create({
    data: {
      fromPlaceMakerId: noor.id,
      guestId: jonas.id,
      content:
        "Jonas — Marilynne Robinson is reading at Kepler's next Thursday. Thought of you. No need to plan around it. Hope the book is going. — N.",
      intent: 'post_stay_warm_outreach',
      status: 'draft',
      createdAt: new Date(NOW.getTime() - days(2) + 1000 * 60 * 2),
    },
  });

  console.log('Seed complete.');
  console.log('  Maria  → /maria      (wine director)');
  console.log('  Noor   → /noor       (head concierge — new)');
  console.log('  Diana  → /diana      (front desk)');
  console.log('  Tomás  → /tomas      (housekeeping)');
  console.log('  Carol  → /manager    (director of communications)');
  console.log('  Guests → Daniel · Priya · Lena · Sophie · Jonas');
  console.log('  Demo moment: as Diana, capture Priya hospice observation → watch all four briefs reframe.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
