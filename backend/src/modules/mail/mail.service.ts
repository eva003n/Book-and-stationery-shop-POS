import { Resend } from "resend";
import {
  APP_NAME,
  MAIL_FROM,
  MAIL_REPLY_TO,
  NODE_ENV,
  RESEND_API_KEY,
} from "../../config/env.js";
import { enqueueEmail } from "../../queues/email.queue.js";

type MailAddress = string | string[];

export type SendMailInput = {
  to: MailAddress;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: MailAddress;
  bcc?: MailAddress;
  tags?: Array<{ name: string; value: string }>;
};

export const resend = new Resend(RESEND_API_KEY);

export const sendMailNow = async ({
  from = MAIL_FROM,
  replyTo = MAIL_REPLY_TO,
  tags = [],
  ...mail
}: SendMailInput) => {
  if (!mail.html && !mail.text) {
    throw new Error("Email must include either html or text content");
  }

  const baseEmail = {
    to: mail.to,
    subject: mail.subject,
    from: from ?? "Bookstore POS <onboarding@resend.dev>",
    ...(replyTo ? { replyTo } : {}),
    ...(mail.cc ? { cc: mail.cc } : {}),
    ...(mail.bcc ? { bcc: mail.bcc } : {}),
    tags: [
      { name: "app", value: APP_NAME ?? "bookstore-pos" },
      { name: "env", value: NODE_ENV ?? "development" },
      ...tags,
    ],
  };

  if (mail.html) {
    return resend.emails.send({
      ...baseEmail,
      html: mail.html,
      ...(mail.text ? { text: mail.text } : {}),
    });
  }

  const text = mail.text;
  if (!text) {
    throw new Error("Email text content is required when html is not provided");
  }

  return resend.emails.send({
    ...baseEmail,
    text,
  });
};

export const sendMail = async (mail: SendMailInput) => {
  if (!mail.html && !mail.text) {
    throw new Error("Email must include either html or text content");
  }

  return enqueueEmail<SendMailInput>(mail);
};

export const sendTransactionalEmail = sendMail;
