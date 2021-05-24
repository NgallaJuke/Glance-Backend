const nodemailer = require("nodemailer");

const sendEmail = async options => {
  // create reusable transporter object using the default SMTP transport
  let transporter = null;
  if (process.env.NODE_ENV.trim() === "development") {
    //IN development mode
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    //in production mode
    transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      auth: {
        user: process.env.SMTP_GMAIL_USER,
        pass: process.env.SMTP_GMAIL_PASSWORD,
      },
    });
  }

  // send mail with defined transport object
  let message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };
  const info = await transporter.sendMail(message);

  console.log("Message sent: %s", info.messageId);
};

module.exports = sendEmail;
