import { Job } from "bullmq";
import pino from "pino";

const log = pino({ name: "notification" });

export async function notificationProcessor(job: Job) {
  const { type, payload } = job.data;

  log.info({ jobId: job.id, type, payload }, "Sending notification");

  // MVP: just log. In production, would send email/SMS/push.
  return { sent: true };
}
