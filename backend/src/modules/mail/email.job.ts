import { Job, Worker } from "bullmq";
import { redisClient } from "../../infra/redis/index.js";
import logger from "../../logger/index.js";
import { JOB_NAMES, QUEUE_NAMES } from "../../shared/utils/constants.js";
import { sendMailNow, type SendMailInput } from "./mail.service.js";

export const processEmailJob = async (job: Job<SendMailInput>) => {
  if (job.name !== JOB_NAMES.EMAIL) {
    throw new Error(`Unsupported email job: ${job.name}`);
  }

  return sendMailNow(job.data);
};

export const emailWorker = new Worker<SendMailInput>(
  QUEUE_NAMES.EMAIL,
  processEmailJob,
  {
    connection: redisClient.messageQueue(),
    concurrency: 5,
  },
);

emailWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Email job completed");
});

emailWorker.on("failed", (job, error) => {
  logger.error({ jobId: job?.id, error }, "Email job failed");
});
