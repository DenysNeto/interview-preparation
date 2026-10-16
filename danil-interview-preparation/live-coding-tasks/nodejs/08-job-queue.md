# 08 — In-Memory Job Queue with Worker Concurrency

## Statement
Implement a simple in-memory job queue.

Queue behavior:
- `enqueue(payload)` adds a job.
- Workers process jobs asynchronously.
- Run up to `concurrency` jobs in parallel.
- Track basic job states (`queued`, `running`, `done`, `failed`).

You may implement this as:
- a queue class, or
- EventEmitter-based pub/sub with worker loops.

## Requirements
- TypeScript.
- In-memory only.
- Concurrency-limited workers.
- Graceful error handling for failed jobs.
- Provide minimal usage example.

## Time box
45-60 minutes

## What interviewers look for (Что ищут)
- Понимание producer/consumer модели.
- Корректный контроль конкурентности и жизненного цикла job.
- Прозрачные статусы и наблюдаемость (хотя бы логами).
- Обсуждение ограничений in-memory очереди и путей эволюции.

## Hints
- Храни очередь в массиве и `activeCount`.
- После завершения job запускай `drain()` снова.
- Job id можно делать через инкремент или `randomUUID`.
- Подумай о retry/dead-letter как follow-up.

## Reference solution — complete TypeScript (Express or plain Node)
```ts
type JobStatus = "queued" | "running" | "done" | "failed";

type Job<T> = {
  id: string;
  payload: T;
  status: JobStatus;
  error?: string;
};

export class JobQueue<T> {
  private queue: Job<T>[] = [];
  private activeCount = 0;
  private idSeq = 0;

  constructor(
    private readonly concurrency: number,
    private readonly worker: (payload: T, jobId: string) => Promise<void>
  ) {
    if (concurrency <= 0) throw new Error("concurrency must be > 0");
  }

  enqueue(payload: T): Job<T> {
    const job: Job<T> = {
      id: String(++this.idSeq),
      payload,
      status: "queued",
    };
    this.queue.push(job);
    this.drain();
    return job;
  }

  getJobs(): Job<T>[] {
    return this.queue.slice();
  }

  private drain(): void {
    while (this.activeCount < this.concurrency) {
      const next = this.queue.find((j) => j.status === "queued");
      if (!next) return;
      this.runJob(next);
    }
  }

  private runJob(job: Job<T>): void {
    this.activeCount += 1;
    job.status = "running";

    this.worker(job.payload, job.id)
      .then(() => {
        job.status = "done";
      })
      .catch((err: unknown) => {
        job.status = "failed";
        job.error = err instanceof Error ? err.message : "Unknown error";
      })
      .finally(() => {
        this.activeCount -= 1;
        this.drain();
      });
  }
}

// Example usage
async function main() {
  const queue = new JobQueue<{ name: string; ms: number }>(
    2,
    async (payload, id) => {
      console.log(`Start #${id}`, payload.name);
      await new Promise((r) => setTimeout(r, payload.ms));
      if (payload.name === "bad-job") throw new Error("Simulated failure");
      console.log(`Done #${id}`, payload.name);
    }
  );

  queue.enqueue({ name: "A", ms: 300 });
  queue.enqueue({ name: "B", ms: 150 });
  queue.enqueue({ name: "bad-job", ms: 100 });
  queue.enqueue({ name: "C", ms: 120 });

  setTimeout(() => {
    console.log(queue.getJobs());
  }, 1200);
}

main();
```

## Follow-up questions
- Как добавить retry с лимитом попыток и backoff?
- Как обеспечить durability при перезапуске процесса?
- Как сделать priority queue?
- Когда стоит перейти на BullMQ/RabbitMQ/Kafka и почему?
