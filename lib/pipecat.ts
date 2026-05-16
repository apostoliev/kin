type PipecatStartOptions = {
  guestId: string;
  sourcePlaceMakerId: string;
  callbackUrl: string;
};

type PipecatStartResult = {
  roomUrl: string;
  token: string;
  sessionId: string;
};

export async function startPipecatSession(opts: PipecatStartOptions): Promise<PipecatStartResult> {
  const apiKey = process.env.PIPECAT_API_KEY || process.env.PIPECAT_CLOUD_API_KEY;
  const agentName = process.env.PIPECAT_AGENT_NAME || 'kin-dictation';
  if (!apiKey) throw new Error('Pipecat API key not configured (set PIPECAT_API_KEY or PIPECAT_CLOUD_API_KEY)');

  const sessionId = `kin_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  const response = await fetch(
    `https://api.pipecat.daily.co/v1/public/${agentName}/start`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        createDailyRoom: true,
        dailyRoomProperties: { enable_prejoin_ui: false, exp_minutes: 10 },
        body: {
          sessionId,
          guestId: opts.guestId,
          sourcePlaceMakerId: opts.sourcePlaceMakerId,
          callbackUrl: opts.callbackUrl,
        },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Pipecat start failed (${response.status}): ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as { dailyRoom?: { url: string; token: string } };
  if (!data.dailyRoom?.url || !data.dailyRoom?.token) {
    throw new Error('Pipecat response missing dailyRoom');
  }
  return { roomUrl: data.dailyRoom.url, token: data.dailyRoom.token, sessionId };
}
