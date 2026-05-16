import { prisma } from '@/lib/db';
import { anthropic, MODELS } from '@/lib/anthropic';

export type ExtractionResult = {
  guestId: string | null;
  rationale: string;
  cleanedNote?: string;
};

export async function extractGuestObservation(utterance: string): Promise<ExtractionResult> {
  const trimmed = utterance.trim();
  if (trimmed.length < 4) {
    return { guestId: null, rationale: 'utterance too short' };
  }

  const guests = await prisma.guest.findMany({
    select: { id: true, name: true, partnerName: true },
  });
  if (!guests.length) {
    return { guestId: null, rationale: 'no guests in directory' };
  }

  const directory = guests
    .map((g) => {
      const partner = g.partnerName ? ` (partner: ${g.partnerName})` : '';
      return `${g.id}: ${g.name}${partner}`;
    })
    .join('\n');

  const system = `You decide whether a hotel staff member's spoken utterance contains a useful observation about a specific guest, and if so, which guest.

Known guest directory (use the exact id from the list):
${directory}

Return ONLY this JSON shape:
{
  "guestId": string | null,
  "rationale": string,
  "cleanedNote": string | null
}

Rules:
- If the utterance contains a fact, preference, mood, plan, or context about a specific named guest in the directory, set guestId to that exact id and cleanedNote to a single-sentence neutral note in third person.
- If the utterance is operational chatter, a greeting, an unnamed reference, or about someone not in the directory: set guestId = null and cleanedNote = null.
- Match the partner's name to the guest if the staff member mentions a partner (e.g., "Anna" → the guest whose partner is Anna).
- Be conservative. When in doubt, set guestId = null.

Examples:
- "Apostoli's wife Anna is coming Friday morning" → guestId set, cleanedNote: "Anna will arrive Friday morning."
- "Lena asked about an early breakfast" → guestId set, cleanedNote: "Asked about an early breakfast."
- "We need more towels in 4B" → guestId null
- "Apostoli looked tired at check-in and mentioned a hard quarter" → guestId set, cleanedNote: "Looked tired at check-in; mentioned a hard quarter."
- "Going on break" → guestId null`;

  const msg = await anthropic.messages.create({
    model: MODELS.classifier,
    max_tokens: 280,
    system: [
      {
        type: 'text',
        text: system,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: trimmed }],
  });

  const text = msg.content
    .map((b) => (b.type === 'text' ? b.text : ''))
    .join('')
    .trim();

  const parsed = safeJson(text);
  const candidateId = typeof parsed?.guestId === 'string' ? parsed.guestId : null;
  const known = candidateId && guests.find((g) => g.id === candidateId);

  return {
    guestId: known ? known.id : null,
    rationale: typeof parsed?.rationale === 'string' ? parsed.rationale : 'no rationale',
    cleanedNote: typeof parsed?.cleanedNote === 'string' && parsed.cleanedNote ? parsed.cleanedNote : undefined,
  };
}

function safeJson(text: string): any {
  try { return JSON.parse(text); } catch { /* noop */ }
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch { /* noop */ }
  }
  return null;
}
