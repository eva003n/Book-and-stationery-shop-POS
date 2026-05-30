import { Queue } from "bullmq";
import { redisClient } from "../infra/redis/index.js";
import { JOB_NAMES, QUEUE_NAMES } from "../shared/utils/constants.js";

export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, {
  connection: redisClient.messageQueue(),
});

export const enqueueEmail = async <T>(emailData: T) => {
  return emailQueue.add(JOB_NAMES.EMAIL, emailData);
};
