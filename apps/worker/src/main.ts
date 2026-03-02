import { Worker } from "bullmq";
import IORedis from "ioredis";
import pino from "pino";
import { paymentConfirmationProcessor } from "./jobs/payment-confirmation.job";
import { payoutReleaseProcessor } from "./jobs/payout-release.job";
import { escrowTimeoutProcessor } from "./jobs/escrow-timeout.job";
import { notificationProcessor } from "./jobs/notification.job";

const log = pino({ name: "hew-worker" });

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

const workerOptions = {
  connection,
  concurrency: 5,
};

const workers: Worker[] = [];

function registerWorkers() {
  workers.push(
    new Worker("payment-confirmation", paymentConfirmationProcessor, workerOptions),
    new Worker("payout-release", payoutReleaseProcessor, workerOptions),
    new Worker("escrow-timeout", escrowTimeoutProcessor, workerOptions),
    new Worker("notification", notificationProcessor, workerOptions)
  );

  workers.forEach((worker) => {
    worker.on("completed", (job) => {
      log.info({ queue: worker.name, jobId: job.id }, "Job completed");
    });
    worker.on("failed", (job, err) => {
      log.error({ queue: worker.name, jobId: job?.id, err }, "Job failed");
    });
  });
}

async function gracefulShutdown() {
  log.info("Shutting down workers...");
  await Promise.all(workers.map((w) => w.close()));
  await connection.quit();
  log.info("Shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

registerWorkers();
log.info(`Worker started. Listening on queues: payment-confirmation, payout-release, escrow-timeout, notification`);
