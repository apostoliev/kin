"""Kin Dictation — passive Pipecat listener.

A staff member opens a private voice session from the Kin dashboard. This agent
listens silently and uses Pipecat's voice-activity detection (VAD) to slice
speech into discrete turns. On each turn (utterance end), it POSTs the
finalized transcript to the Kin extractor endpoint, which decides whether the
utterance contains a guest observation worth storing.

No LLM, no TTS, no replies. Pure ambient capture.

Deployed to Pipecat Cloud. Entry point: ``bot``.
"""

from __future__ import annotations

import asyncio

import aiohttp
from loguru import logger

from pipecat.frames.frames import EndFrame, Frame, TranscriptionFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.transports.daily.transport import DailyParams, DailyTransport
from pipecatcloud.agent import DailySessionArguments


class TurnPoster(FrameProcessor):
    """Posts each finalized transcription turn to the Kin extractor endpoint."""

    def __init__(
        self,
        callback_url: str,
        session_id: str,
        source_placemaker_id: str,
    ) -> None:
        super().__init__()
        self.callback_url = callback_url
        self.session_id = session_id
        self.source_placemaker_id = source_placemaker_id
        self._turn_count = 0

    async def process_frame(self, frame: Frame, direction: FrameDirection) -> None:
        await super().process_frame(frame, direction)
        if isinstance(frame, TranscriptionFrame):
            text = (frame.text or "").strip()
            if text:
                self._turn_count += 1
                logger.info(f"[{self.session_id}] turn #{self._turn_count}: {text}")
                asyncio.create_task(self._post(text))
        await self.push_frame(frame, direction)

    async def _post(self, text: str) -> None:
        payload = {
            "sessionId": self.session_id,
            "sourcePlaceMakerId": self.source_placemaker_id,
            "transcript": text,
        }
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    self.callback_url,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=15),
                ) as resp:
                    body = await resp.text()
                    logger.info(
                        f"[{self.session_id}] turn posted → status={resp.status} "
                        f"body={body[:160]}"
                    )
            except Exception as e:
                logger.error(f"[{self.session_id}] turn post failed: {e}")


async def bot(args: DailySessionArguments) -> None:
    body = args.body or {}
    session_id = body.get("sessionId", "unknown")
    source_placemaker_id = body.get("sourcePlaceMakerId")
    callback_url = body.get("callbackUrl")

    if not (source_placemaker_id and callback_url):
        logger.error(
            "Missing sourcePlaceMakerId or callbackUrl in session body."
        )
        return

    # The turn endpoint differs from the legacy webhook. Append /turn to the
    # base callback URL if the host passed the older webhook URL.
    if callback_url.endswith("/api/pipecat/webhook"):
        callback_url = callback_url.replace("/api/pipecat/webhook", "/api/pipecat/turn")

    logger.info(
        f"[{session_id}] starting passive dictation; turns post to {callback_url} "
        f"as place-maker {source_placemaker_id}"
    )

    transport = DailyTransport(
        args.room_url,
        args.token,
        "Kin Dictation",
        DailyParams(
            audio_in_enabled=True,
            audio_out_enabled=False,
            transcription_enabled=True,
            vad_enabled=True,
        ),
    )

    poster = TurnPoster(
        callback_url=callback_url,
        session_id=session_id,
        source_placemaker_id=source_placemaker_id,
    )

    pipeline = Pipeline([transport.input(), poster, transport.output()])
    task = PipelineTask(pipeline, params=PipelineParams(allow_interruptions=True))

    @transport.event_handler("on_first_participant_joined")
    async def on_first_participant_joined(_t, participant):
        logger.info(f"[{session_id}] participant joined: {participant.get('id')}")

    @transport.event_handler("on_participant_left")
    async def on_participant_left(_t, participant, reason):
        logger.info(f"[{session_id}] participant left ({reason})")
        await task.queue_frame(EndFrame())

    runner = PipelineRunner()
    await runner.run(task)
