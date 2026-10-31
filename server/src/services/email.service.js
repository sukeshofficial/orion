import nodemailer from "nodemailer";

/**
 * HTML Escaping helper to prevent XSS or malformed markup in email templates.
 */
const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const sanitizePlainText = (value = "") =>
  String(value)
    .replaceAll("\u0000", "")
    .replaceAll("\r", "")
    .replaceAll("\n", " ")
    .replaceAll("\t", " ")
    .trim();

const sanitizeLogValue = (value = "") =>
  String(value ?? "")
    .replaceAll("\u0000", "")
    .replaceAll("\r", "")
    .replaceAll("\n", "")
    .replaceAll("\t", "");

const getClientUrl = () => {
  const configuredUrl = process.env.CLIENT_URL?.trim();

  if (!configuredUrl) {
    throw new Error("CLIENT_URL environment variable is required");
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(configuredUrl);
  } catch {
    throw new Error("CLIENT_URL must be a valid URL");
  }

  const isDevelopment = process.env.NODE_ENV === "development";
  const isLocalhost = [
    "localhost",
    "127.0.0.1",
    "[::1]",
  ].includes(parsedUrl.hostname);

  if (
    parsedUrl.protocol !== "https:" &&
    !(isDevelopment && isLocalhost && parsedUrl.protocol === "http:")
  ) {
    throw new Error("CLIENT_URL must use HTTPS outside local development");
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new Error("CLIENT_URL must not contain URL credentials");
  }

  if (parsedUrl.pathname !== "/" || parsedUrl.search || parsedUrl.hash) {
    throw new Error("CLIENT_URL must contain only the frontend origin");
  }

  return parsedUrl.origin;
};

/**
 * Creates and returns a Nodemailer transporter instance configured from environment variables.
 * Supports SMTP (Host/Port/User/Pass) or service-based configuration (e.g. Gmail, SendGrid, SES).
 * If SMTP credentials are not yet configured in .env, falls back to a clean mock previewer in development.
 */
let transporter = null;

export const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE,
    EMAIL_SERVICE,
  } = process.env;

  if (EMAIL_SERVICE) {
    transporter = nodemailer.createTransport({
      service: EMAIL_SERVICE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  } else if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_SECURE === "true" || Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  } else {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Email transport is not configured. Configure SMTP or EMAIL_SERVICE."
      );
    }

    console.info(
      "[EmailService] SMTP is not configured. Emails will be previewed without message content."
    );

    transporter = {
      sendMail: async (mailOptions) => {
        console.info(
          [
            "[EmailService] Email preview",
            `To: ${sanitizeLogValue(mailOptions.to)}`,
            `Subject: ${sanitizeLogValue(mailOptions.subject)}`,
            "Message body: [REDACTED]",
          ].join("\n")
        );

        return { messageId: `mock-${Date.now()}` };
      },
    };
  }

  return transporter;
};

/**
 * Send an email with responsive HTML and plain-text fallback.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const mailer = getTransporter();

  const smtpUser = process.env.SMTP_USER;
  const fromAddress =
    process.env.EMAIL_FROM ||
    `"Orion" <${smtpUser || "noreply@orion.com"}>`;

  const info = await mailer.sendMail({
    from: fromAddress,
    to,
    subject,
    html,
    text: text ?? "",
  });

  return info;
};

/**
 * Generate production-quality HTML template for Password Reset email.
 * Built with email-safe table layout, inline CSS, high-contrast typography,
 * responsive mobile styling, and dark-mode safe CTA.
 *
 * @param {Object} params
 * @param {string} params.name - User's display name
 * @param {string} params.resetUrl - Full password reset URL with token and email
 * @param {number|string} [params.expirationHours=1] - Expiration duration in hours
 * @param {number|string} [params.year=2026] - Copyright year
 */
export const generatePasswordResetTemplate = ({
  name = "there",
  resetUrl,
  expirationHours = 1,
  year = new Date().getFullYear(),
}) => {
  const safeName = escapeHtml(name || "there");
  const safeResetUrl = escapeHtml(resetUrl);

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Reset your password</title>
  <style type="text/css">
    /* Client resets */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #F4F6FA; }

    /* Responsive */
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .email-card { padding: 24px 20px !important; border-radius: 12px !important; }
      .mobile-button { width: 100% !important; display: block !important; text-align: center !important; }
      .button-cell { padding-left: 0 !important; padding-right: 0 !important; }
    }
  </style>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #F4F6FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <center style="width: 100%; background-color: #F4F6FA; padding-top: 36px; padding-bottom: 48px;">
    <!-- Main Email Container -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto;" class="email-container">
      
      <!-- Brand Header -->
      <tr>
        <td align="left" style="padding-bottom: 20px; padding-left: 4px; padding-right: 4px;">
          <table border="0" cellpadding="0" cellspacing="0">
            <tr>
              <!-- Outline House Icon SVG represented cleanly with inline table / shapes -->
              <td valign="middle" style="padding-right: 12px;">
                <table border="0" cellpadding="0" cellspacing="0" width="36" height="36" style="background-color: #172033; border-radius: 10px;">
                  <tr>
                    <td align="center" valign="middle" style="color: #ffffff; font-size: 18px; font-weight: bold; line-height: 1;">
                      ⌂
                    </td>
                  </tr>
                </table>
              </td>
              <td valign="middle">
                <span style="font-size: 16px; font-weight: 700; color: #172033; letter-spacing: -0.3px; display: block; line-height: 1.2;">Orion</span>
                <span style="font-size: 12px; font-weight: 500; color: #667085; display: block;">Workspace Security</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Email Card -->
      <tr>
        <td>
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border: 1px solid #E7EAF0; border-radius: 16px; padding: 36px 36px; box-shadow: 0 4px 12px rgba(23, 32, 51, 0.04);" class="email-card">
            
            <!-- Eyebrow -->
            <tr>
              <td align="left" style="padding-bottom: 8px;">
                <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.8px; color: #3659E3; text-transform: uppercase;">ACCOUNT SECURITY</span>
              </td>
            </tr>

            <!-- Heading -->
            <tr>
              <td align="left" style="padding-bottom: 16px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #172033; letter-spacing: -0.5px; line-height: 1.25;">Reset your password</h1>
              </td>
            </tr>

            <!-- Description -->
            <tr>
              <td align="left" style="font-size: 15px; line-height: 1.6; color: #334155; padding-bottom: 28px;">
                Hello <strong>${safeName}</strong>,<br /><br />
                We received a request to reset the password for your Orion account. Click the button below to choose a new password.
              </td>
            </tr>

            <!-- Primary CTA Button -->
            <tr>
              <td align="left" style="padding-bottom: 32px;" class="button-cell">
                <table border="0" cellspacing="0" cellpadding="0" class="mobile-button">
                  <tr>
                    <td align="center" style="border-radius: 10px; background-color: #3659E3;">
                      <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeResetUrl}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="20%" stroke="f" fillcolor="#3659E3">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:sans-serif;font-size:14px;font-weight:bold;">Reset password &rarr;</center>
                      </v:roundrect>
                      <![endif]-->
                      <!--[if !mso]><!-->
                      <a href="${safeResetUrl}" target="_blank" rel="noopener noreferrer" style="background-color: #3659E3; border: 1px solid #3659E3; border-radius: 10px; color: #ffffff !important; display: inline-block; font-size: 14px; font-weight: 600; line-height: 1.2; padding: 14px 28px; text-align: center; text-decoration: none; -webkit-text-size-adjust: none; box-shadow: 0 2px 6px rgba(54, 89, 227, 0.25);" class="mobile-button">
                        Reset password &rarr;
                      </a>
                      <!--<![endif]-->
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Security Notice Box -->
            <tr>
              <td align="left" style="padding-bottom: 28px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F5F7FC; border: 1px solid #E7EAF0; border-radius: 10px; padding: 14px 16px;">
                  <tr>
                    <td valign="top" style="width: 20px; font-size: 14px; color: #3659E3; line-height: 1.4; padding-right: 8px;">
                      🛡️
                    </td>
                    <td align="left" style="font-size: 13px; line-height: 1.5; color: #475569;">
                      For your security, this link expires in <strong>${expirationHours} hour</strong>. If you didn't request a password reset, you can safely ignore this email. Your account will remain secure.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Fallback URL Section -->
            <tr>
              <td align="left" style="border-top: 1px solid #E7EAF0; padding-top: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #667085;">
                  Having trouble with the button? Copy and paste the link below into your browser:
                </p>
                <div style="background-color: #FAFAFC; border: 1px solid #E7EAF0; border-radius: 8px; padding: 10px 12px; word-break: break-all;">
                  <a href="${safeResetUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; line-height: 1.5; color: #3659E3; text-decoration: underline;">
                    ${safeResetUrl}
                  </a>
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td align="center" style="padding-top: 24px; padding-bottom: 12px; text-align: center;">
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #94A3B8; line-height: 1.4;">
            This is an automated security email from Orion. Please do not reply directly.
          </p>
          <p style="margin: 0; font-size: 12px; color: #94A3B8; line-height: 1.4;">
            &copy; ${year} Orion. All rights reserved.
          </p>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>`;
};

/**
 * Send a secure Password Reset email with redesigned template.
 *
 * @param {Object} params
 * @param {string} params.to - User email
 * @param {string} params.name - User name
 * @param {string} params.resetToken - Raw crypto token
 */
export const sendPasswordResetEmail = async ({
  to,
  name,
  resetToken,
}) => {
  if (typeof to !== "string" || !to.trim()) {
    throw new Error("A valid recipient email is required");
  }

  if (typeof resetToken !== "string" || !resetToken.trim()) {
    throw new Error("A valid password-reset token is required");
  }

  const clientUrl = getClientUrl();
  const resetUrl = new URL("/reset-password", `${clientUrl}/`);

  resetUrl.searchParams.set("token", resetToken);
  resetUrl.searchParams.set("email", to.trim());

  const resetLink = resetUrl.toString();
  const safeName = sanitizePlainText(name || "there");
  const currentYear = new Date().getFullYear();

  const subject = "Reset your Orion password";

  const html = generatePasswordResetTemplate({
    name: safeName,
    resetUrl: resetLink,
    expirationHours: 1,
    year: currentYear,
  });

  const plainText = [
    "ACCOUNT SECURITY: Reset your password",
    "",
    `Hello ${safeName || "there"},`,
    "",
    "We received a request to reset the password for your Orion account.",
    "To choose a new password, visit the link below:",
    "",
    resetLink,
    "",
    "This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email; your account will remain secure.",
    "",
    `© ${currentYear} Orion. All rights reserved.`,
  ].join("\n");

  return sendEmail({
    to: to.trim(),
    subject,
    html,
    text: plainText,
  });
};

/**
 * Reusable HTML template for Email Verification
 */
export const generateEmailVerificationTemplate = ({
  name = "there",
  verificationUrl,
  expirationMinutes = 30,
  appName = process.env.APP_NAME || "Starter Platform",
  year = new Date().getFullYear(),
}) => {
  const safeName = escapeHtml(name || "there");
  const safeVerificationUrl = escapeHtml(verificationUrl);
  const safeAppName = escapeHtml(appName);

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email address</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #F4F6FA; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .email-card { padding: 24px 20px !important; border-radius: 12px !important; }
      .mobile-button { width: 100% !important; display: block !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F6FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <center style="width: 100%; background-color: #F4F6FA; padding-top: 36px; padding-bottom: 48px;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto;" class="email-container">
      <tr>
        <td align="left" style="padding-bottom: 20px; padding-left: 4px; padding-right: 4px;">
          <table border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="middle">
                <span style="font-size: 18px; font-weight: 700; color: #172033; letter-spacing: -0.3px; display: block; line-height: 1.2;">${safeAppName}</span>
                <span style="font-size: 12px; font-weight: 500; color: #667085; display: block;">Email Verification</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td>
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border: 1px solid #E7EAF0; border-radius: 16px; padding: 36px 36px; box-shadow: 0 4px 12px rgba(23, 32, 51, 0.04);" class="email-card">
            <tr>
              <td align="left" style="padding-bottom: 8px;">
                <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.8px; color: #2563EB; text-transform: uppercase;">CONFIRM YOUR EMAIL</span>
              </td>
            </tr>
            <tr>
              <td align="left" style="padding-bottom: 16px;">
                <h1 style="font-size: 24px; font-weight: 700; color: #172033; margin: 0; line-height: 1.3;">Verify your email address</h1>
              </td>
            </tr>
            <tr>
              <td align="left" style="padding-bottom: 24px; font-size: 14px; line-height: 1.6; color: #475467;">
                Hello <strong>${safeName}</strong>,<br /><br />
                Thank you for signing up for ${safeAppName}. To complete your setup and ensure secure access to your account, please verify your email address by clicking the button below:
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom: 28px;">
                <table border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="border-radius: 10px; background-color: #2563EB;">
                      <a href="${safeVerificationUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 14px; font-weight: 600; color: #FFFFFF; text-decoration: none; padding: 12px 28px; display: inline-block; border-radius: 10px; background-color: #2563EB;">
                        Verify Email Address
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="left" style="padding-bottom: 20px; font-size: 13px; line-height: 1.6; color: #667085; border-top: 1px solid #F2F4F7; padding-top: 20px;">
                <strong>Note:</strong> This verification link will expire in <strong>${expirationMinutes} minutes</strong>. If you did not create an account or request this verification, you can safely ignore this email; no account will be activated with your email without this confirmation.
              </td>
            </tr>
            <tr>
              <td align="left" style="font-size: 12px; line-height: 1.6; color: #98A2B3;">
                If the button above does not work, copy and paste this URL into your browser:<br />
                <a href="${safeVerificationUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563EB; word-break: break-all;">${safeVerificationUrl}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-top: 24px; font-size: 12px; color: #98A2B3;">
          © ${year} ${safeAppName}. All rights reserved.
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
};

/**
 * Dispatch verification email
 */
export const sendVerificationEmail = async ({
  to,
  name,
  verificationToken,
  expirationMinutes = 30,
}) => {
  if (typeof to !== "string" || !to.trim()) {
    throw new Error("A valid recipient email is required");
  }

  if (typeof verificationToken !== "string" || !verificationToken.trim()) {
    throw new Error("A valid verification token is required");
  }

  const clientUrl = getClientUrl();
  const verifyUrl = new URL("/verify-email", `${clientUrl}/`);
  verifyUrl.searchParams.set("token", verificationToken);
  verifyUrl.searchParams.set("email", to.trim());

  const verificationLink = verifyUrl.toString();
  const safeName = sanitizePlainText(name || "there");
  const appName = process.env.APP_NAME || "Starter Platform";
  const currentYear = new Date().getFullYear();

  const subject = `Verify your email for ${appName}`;

  const html = generateEmailVerificationTemplate({
    name: safeName,
    verificationUrl: verificationLink,
    expirationMinutes,
    appName,
    year: currentYear,
  });

  const plainText = [
    `VERIFY YOUR EMAIL - ${appName}`,
    "",
    `Hello ${safeName || "there"},`,
    "",
    `Thank you for joining ${appName}. Please verify your email address by visiting this link:`,
    "",
    verificationLink,
    "",
    `This link expires in ${expirationMinutes} minutes. If you did not sign up, please ignore this email.`,
    "",
    `© ${currentYear} ${appName}. All rights reserved.`,
  ].join("\n");

  return sendEmail({
    to: to.trim(),
    subject,
    html,
    text: plainText,
  });
};
