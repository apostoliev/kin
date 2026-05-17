type SynthOptions = {
  text: string;
  voiceId?: string;
  modelId?: string;
};

const DEFAULT_VOICE_IDS: Record<string, string> = {
  sommelier: 'EXAVITQu4vr4xnSDxMaL',
  concierge: 'XB0fDUnXU5powFXDhCwa',
  front_desk: 'TX3LPaxmHKxFdv7VOQHJ',
  housekeeping: 'pNInz6obpgDQGcFmaJgB',
  manager: 'oWAxZDx7w5VEj9dCyTzz',
  default: 'EXAVITQu4vr4xnSDxMaL',
};

export function voiceIdForRole(role: string): string {
  return DEFAULT_VOICE_IDS[role] ?? DEFAULT_VOICE_IDS.default;
}

export async function synthesizeSpeech({
  text,
  voiceId,
  modelId = 'eleven_turbo_v2_5',
}: SynthOptions): Promise<{ audio: ArrayBuffer; contentType: string } | { error: string }> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return { error: 'ELEVENLABS_API_KEY not configured' };
  const voice = voiceId ?? DEFAULT_VOICE_IDS.default;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75,
          style: 0.2,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    return { error: `ElevenLabs (${response.status}): ${errText.slice(0, 200)}` };
  }
  const audio = await response.arrayBuffer();
  return { audio, contentType: 'audio/mpeg' };
}
