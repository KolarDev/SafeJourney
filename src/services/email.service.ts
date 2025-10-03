import nodemailer, { Transporter } from "nodemailer";
import pug from "pug";
import { convert } from "html-to-text";
import path from "path";

interface ExtraData {
  [key: string]: any;
}

export class Email {
  private to: string;
  private user?: any;
  private from: string;
  private extraData?: ExtraData;

  constructor(
    email: string,
    contents: { user?: any; extraData?: ExtraData } = {}
  ) {
    this.to = email;
    this.user = contents.user;
    this.extraData = contents.extraData;
    this.from = `SafeJourney <${process.env.EMAIL_FROM}>`;
  }

  private newTransport(): Transporter {
    return nodemailer.createTransport({
      host: process.env.BREVO_HOST,
      port: Number(process.env.BREVO_PORT),
      secure: false,
      auth: {
        user: process.env.BREVO_USERNAME,
        pass: process.env.BREVO_PASSWORD,
      },
    });
  }

  public async send(template: string, subject: string): Promise<void> {

    let html: string;
    
    try {
   html = pug.renderFile(
    path.join(__dirname, `../views/emails/${template}.pug`),
    {
      user: this.user,
      subject,
      ...this.extraData,
    }
  );
} catch (err) {
  console.error("Pug render error:", err);
  throw err; 
}

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html),
      attachments: []
    };

    await this.newTransport().sendMail(mailOptions);
  }
}
