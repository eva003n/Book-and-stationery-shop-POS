
import { resend, sendMail, sendTransactionalEmail } from "./mail.service.js";

 class MailService {
   sendMail: typeof sendMail;
   sendTransactionalEmail: typeof sendTransactionalEmail;

   constructor() {
     this.sendMail = sendMail;
     this.sendTransactionalEmail = sendTransactionalEmail
   }
 }

const mailService = new MailService()
export default mailService