import { Worker, Job, type ConnectionOptions } from "bullmq";
import { redisClient } from "../infra/redis";
import { logger } from "better-auth";
import { handleEmail } from "../jobs/email/email.job";
import { QUEUE_NAMES, JOB_NAMES } from "../shared/utils/constants";
import type { SendMailInput } from "../shared/validator/validators";


const workerClient = redisClient.messageQueue() ;

/* (async () => {
  

  process.send?.("ready"); // 
})(); */
workerClient.on("ready", () => {
    process.send?.("ready") //start worker process when its connected to external services(redis)
})

const worker = new Worker(
  QUEUE_NAMES.EMAIL,
  async (job: Job<SendMailInput>) => {
    switch (job.name) {
      case JOB_NAMES.EMAIL:
        return await handleEmail(job.data);

      default:
        throw new Error(`Unknown job in email worker: ${job.name}`);
    }
  },
  {
    connection: workerClient.options as ConnectionOptions,
    concurrency: 5,
    limiter: {
      max: 100, // 100 email
      duration: 60000, // per minute
    },
  },
);

worker.on("error", (error) => {
  logger.error(`Email Worker error: ${error.message}`);
  process.exit(1);
});

const shutDown = async () => {
  logger.info("Gracefully shutting down email worker");
  await worker.close();
  await workerClient.quit(); // waits for pending commands to complete
  process.exit(0);
};

process.on("SIGTERM", shutDown);
process.on("SIGINT", shutDown);
