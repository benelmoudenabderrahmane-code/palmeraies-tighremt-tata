import asyncio
from typing import Callable, Any


class JobQueue:
    """In-process async job queue with SSE-compatible subscriber notifications."""

    def __init__(self):
        self._queue: asyncio.Queue = asyncio.Queue()
        self._statuses: dict[int, dict] = {}
        self._subscribers: dict[int, list[asyncio.Queue]] = {}

    async def enqueue(self, job_id: int, coro_fn: Callable, *args, **kwargs) -> None:
        self._statuses[job_id] = {"status": "queued"}
        await self._queue.put((job_id, coro_fn, args, kwargs))

    def subscribe(self, job_id: int) -> asyncio.Queue:
        """Return a queue that receives status update dicts for this job."""
        q: asyncio.Queue = asyncio.Queue()
        self._subscribers.setdefault(job_id, []).append(q)
        return q

    def get_status(self, job_id: int) -> dict:
        return self._statuses.get(job_id, {"status": "unknown"})

    async def _notify(self, job_id: int, event: dict) -> None:
        self._statuses[job_id] = event
        for q in self._subscribers.get(job_id, []):
            await q.put(event)

    async def run_worker(self) -> None:
        """Long-running coroutine — run with asyncio.create_task() at startup."""
        while True:
            job_id, coro_fn, args, kwargs = await self._queue.get()
            await self._notify(job_id, {"status": "running"})
            try:
                result = await coro_fn(*args, **kwargs)
                await self._notify(job_id, {"status": "done", "result": result})
            except Exception as exc:
                await self._notify(job_id, {"status": "failed", "error": str(exc)})
            finally:
                self._queue.task_done()


# Singleton instance shared across the app
job_queue = JobQueue()
