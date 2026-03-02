import { Job } from "bullmq";
import pino from "pino";
import { prisma } from "@hew/db";

const log = pino({ name: "payment-confirmation" });

export async function paymentConfirmationProcessor(job: Job) {
  const { orderId } = job.data;

  log.info({ jobId: job.id, orderId }, "Checking payment status");

  // MVP: just log. In production, would verify with Omise/charge API.
  const payment = await prisma.escrowPayment.findUnique({
    where: { orderId },
  });

  if (payment) {
    log.info({ orderId, status: payment.status }, "Payment status");
  } else {
    log.warn({ orderId }, "No escrow payment found");
  }

  return { checked: true };
}
