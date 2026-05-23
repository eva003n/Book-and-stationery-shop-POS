
import type { CreateEmailResponse } from "resend";
import { resend, sendMail, sendTransactionalEmail, type SendMailInput } from "./mail.service.js";

interface IMailService {
  sendMail({ from, replyTo, tags, ...mail }: SendMailInput): Promise<CreateEmailResponse>,
  sendTransactionalEmail ({ from, replyTo, tags, ...mail }: SendMailInput): Promise<CreateEmailResponse>


}

 class MailService {
  //  sendMail: typeof sendMail;
  //  sendTransactionalEmail: typeof sendTransactionalEmail;

   constructor(private mailService: IMailService) {
    //  this.sendMail = sendMail;
    //  this.sendTransactionalEmail = sendTransactionalEmail
   }
 }

const mailService = new MailService()
export default mailService