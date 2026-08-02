import { BrevoClient } from "@getbrevo/brevo";

const api = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY!
});

export async function sendVerificationEmail(
  email: string,
  verifyUrl: string
) {
  await api.transactionalEmails.sendTransacEmail({
    sender: {
      name: "Arena Karya",
      email: "arenakarya.cs@gmail.com",
    },
    to: [{ email }],
    subject: "Verify your email",
    htmlContent: `
      <h2>Verify your email</h2>
      <p>Click the button below to verify your email and complete your registration.</p>
      <a href="${verifyUrl}" style="display:inline-block;padding:10px 20px;background:#1A73E8;color:white;text-decoration:none;border-radius:5px;">
        Verify Email
      </a>
    `,
  });
}

export async function sendResetPasswordEmail(
  email: string,
  resetUrl: string
) {
  await api.transactionalEmails.sendTransacEmail({
    sender: {
      name: "Arena Karya",
      email: "arenakarya.cs@gmail.com",
    },
    to: [{ email }],
    subject: "Reset your password",
    htmlContent: `
      <h2>Reset your password</h2>
      <p>Click the button below to reset your password.</p>
      <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#1A73E8;color:white;text-decoration:none;border-radius:5px;">
        Reset Password
      </a>
    `,
  });
}