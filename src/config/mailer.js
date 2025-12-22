 const nodemailer = require("nodemailer");

exports.mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
 exports.sendAdminCredentials = async function(email, tempPassword) {
  await exports.mailer.sendMail({
    from: `"School ERP" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Admin Account Created",
    html: `
      <p>Your admin account has been created.</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Temporary Password:</b> ${tempPassword}</p>
      <p>Please login and change your password.</p>
    `,
  });
}
