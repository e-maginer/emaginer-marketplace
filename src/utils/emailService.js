import nodeMailer from 'nodemailer';
import debugLib from 'debug';
import createError from 'http-errors';
const debug = debugLib('util:emailService')
const Templates = Object.freeze({
   REGISTRATION: 1,
   ACTIVATION: 2,
   RESEND_CODE:3,
   FORGOT_PASSWORD:4,
   RESET_PASSWORD:5
})

function getTemplateDefinition(template, params){
   const mailOptions = {
      from: 'sales@emaginer.com'
   }
   switch (template) {
      case Templates.REGISTRATION: {
         mailOptions.subject = 'Welcome to Emaginer';
         mailOptions.text= `Thanks for registering to Emaginer service. Please your activation URL:${params.activationUrl}`;
         mailOptions.html =`<b>Thanks for registering to Emaginer service. Please your activation URL:${params.activationUrl}</b>`;
         break;
      }
      case Templates.ACTIVATION: {
         mailOptions.subject = 'Emaginer account activated';
         mailOptions.text= `Thanks for activating your Emaginer account`;
         break;
      }
      case Templates.RESEND_CODE:{
         mailOptions.subject = 'Activation your Emaginer account';
         mailOptions.text= `Please use your activation URL:${params.activationUrl}`;
         mailOptions.html =`<b>Please use your activation URL:${params.activationUrl}</b>`;
         break;
      }
      case Templates.FORGOT_PASSWORD: {
         mailOptions.subject = 'Reset your Emaginer account Password';
         mailOptions.text= `Please use the rest password URL:${params.resetUrl} to submit a PATCH request including your new password and password confirmation`;
         mailOptions.html =`<b>Please use use the rest password  URL:${params.resetUrl}</b>`;
         break;
      }
      case Templates.RESET_PASSWORD: {
         mailOptions.subject = 'New Emaginer account Password';
         mailOptions.text= `Your account password has been reset successfully`;
         mailOptions.html =`<b>Your account password has been reset successfully</b>`;
         break;
      }
      default: {
         throw createError(500,'no email template configured');
      }
   }
   return mailOptions;
}
class EmailService{

    constructor() {
       this.templates = Templates;
//todo replace with actual email service from Heroku in production
       nodeMailer.createTestAccount().then((testAccount) => {
          this.transporter =  nodeMailer.createTransport({
             //todo reading from process.env for production and secret for testing
             host: "smtp.ethereal.email",
             port: "587",
             secure: false,
             auth: {
                user: testAccount.user,
                pass: testAccount.pass
             }
          })
       });
    }
   async sendEmail(to, template, params){
      const mailOptions = getTemplateDefinition(template, params);
      mailOptions.to = to;
      let info =  await this.transporter.sendMail(mailOptions);
      console.log(`Email preview URL is ${nodeMailer.getTestMessageUrl(info)}`);
   }
}
// exporting an instance to leverage the Module caching mechanism to return a stateful instance which can be shared across different client modules
// (this.transporter is the same for all EmailService)
export default new EmailService();