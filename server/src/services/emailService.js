import nodemailer from "nodemailer";

/*
 * =========================================================
 * EMAIL CONFIGURATION
 * =========================================================
 */

const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";

const EMAIL_PORT = Number(process.env.EMAIL_PORT || 587);

const EMAIL_USER = process.env.EMAIL_USER;

const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  `SupportAI <${EMAIL_USER || "no-reply@example.com"}>`;

/*
 * =========================================================
 * VALIDATE CONFIGURATION
 * =========================================================
 */

if (!EMAIL_USER || !EMAIL_PASSWORD) {
  console.warn(
    "EMAIL SERVICE WARNING: EMAIL_USER or EMAIL_PASSWORD is missing.",
  );
}

/*
 * =========================================================
 * CREATE SMTP TRANSPORTER
 * =========================================================
 */

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,

  port: EMAIL_PORT,

  /*
   * Gmail:
   * 587 -> secure false
   * 465 -> secure true
   */

  secure: EMAIL_PORT === 465,

  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },

  connectionTimeout: 10000,

  greetingTimeout: 10000,

  socketTimeout: 10000,
});

/*
 * =========================================================
 * SEND GENERIC EMAIL
 * =========================================================
 */

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) {
    throw new Error("Recipient email is required.");
  }

  if (!EMAIL_USER) {
    throw new Error("EMAIL_USER is not configured.");
  }

  if (!EMAIL_PASSWORD) {
    throw new Error("EMAIL_PASSWORD is not configured.");
  }

  const info = await transporter.sendMail({
    from: EMAIL_FROM,

    to,

    subject,

    text: text || "",

    html: html || text || "",
  });

  console.log(`Email sent successfully to ${to}`);

  return info;
};

/*
 * =========================================================
 * TICKET CREATED EMAIL
 * =========================================================
 */

export const sendTicketCreatedEmail = async ({ customer, ticket }) => {
  if (!customer?.email) {
    throw new Error("Customer email is required for ticket creation email.");
  }

  const customerName = customer.name || "Customer";

  const ticketNumber = ticket?.ticketNumber || "N/A";

  const subject = `Support Ticket Created - ${ticketNumber}`;

  const text = `
Hello ${customerName},

Your SupportAI ticket has been created successfully.

Ticket Number: ${ticketNumber}
Subject: ${ticket?.subject || "N/A"}
Category: ${ticket?.category || "General"}
Priority: ${ticket?.priority || "medium"}
Status: ${ticket?.status || "open"}

Our support system has received your request.

You can log in to SupportAI to view your ticket and follow its progress.

Regards,
SupportAI Support Team
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>SupportAI Ticket Created</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f1f5f9;
    font-family:Arial,Helvetica,sans-serif;
    color:#0f172a;
  "
>
  <div style="max-width:600px;margin:0 auto;padding:30px 20px;">

    <div
      style="
        background:#ffffff;
        border-radius:16px;
        overflow:hidden;
        border:1px solid #e2e8f0;
      "
    >

      <div
        style="
          background:#2563eb;
          color:#ffffff;
          padding:24px;
        "
      >
        <h1
          style="
            margin:0;
            font-size:22px;
          "
        >
          SupportAI
        </h1>

        <p
          style="
            margin:8px 0 0;
            font-size:14px;
            opacity:.9;
          "
        >
          Support ticket created
        </p>
      </div>

      <div style="padding:24px;">

        <p style="margin:0 0 16px;">
          Hello <strong>${customerName}</strong>,
        </p>

        <p
          style="
            margin:0 0 20px;
            line-height:1.6;
            color:#475569;
          "
        >
          Your SupportAI ticket has been created successfully.
          Our support system has received your request.
        </p>

        <div
          style="
            background:#f8fafc;
            border:1px solid #e2e8f0;
            border-radius:12px;
            padding:18px;
          "
        >

          <p style="margin:0 0 10px;">
            <strong>Ticket:</strong>
            ${ticketNumber}
          </p>

          <p style="margin:0 0 10px;">
            <strong>Subject:</strong>
            ${ticket?.subject || "N/A"}
          </p>

          <p style="margin:0 0 10px;">
            <strong>Category:</strong>
            ${ticket?.category || "General"}
          </p>

          <p style="margin:0 0 10px;">
            <strong>Priority:</strong>
            ${ticket?.priority || "medium"}
          </p>

          <p style="margin:0;">
            <strong>Status:</strong>
            ${ticket?.status || "open"}
          </p>

        </div>

        <p
          style="
            margin:20px 0 0;
            line-height:1.6;
            color:#475569;
          "
        >
          You can log in to SupportAI to view your ticket,
          review replies, and track its progress.
        </p>

        <p
          style="
            margin:24px 0 0;
            color:#64748b;
          "
        >
          Regards,<br />
          <strong>SupportAI Support Team</strong>
        </p>

      </div>

    </div>

  </div>
</body>
</html>
`;

  return sendEmail({
    to: customer.email,
    subject,
    text,
    html,
  });
};

/*
 * =========================================================
 * TICKET REPLY EMAIL
 * =========================================================
 */

export const sendTicketReplyEmail = async ({ customer, ticket, reply }) => {
  if (!customer?.email) {
    throw new Error("Customer email is required for ticket reply email.");
  }

  const customerName = customer.name || "Customer";

  const ticketNumber = ticket?.ticketNumber || "N/A";

  const safeReply = reply || "A new reply was added to your ticket.";

  const subject = `New Reply on Ticket ${ticketNumber}`;

  const text = `
Hello ${customerName},

A new reply has been added to your SupportAI ticket.

Ticket Number: ${ticketNumber}
Subject: ${ticket?.subject || "N/A"}

Reply:
${safeReply}

Log in to SupportAI to continue the conversation.

Regards,
SupportAI Support Team
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>New SupportAI Reply</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f1f5f9;
    font-family:Arial,Helvetica,sans-serif;
    color:#0f172a;
  "
>
  <div style="max-width:600px;margin:0 auto;padding:30px 20px;">

    <div
      style="
        background:#ffffff;
        border-radius:16px;
        overflow:hidden;
        border:1px solid #e2e8f0;
      "
    >

      <div
        style="
          background:#2563eb;
          color:#ffffff;
          padding:24px;
        "
      >
        <h1 style="margin:0;font-size:22px;">
          SupportAI
        </h1>

        <p
          style="
            margin:8px 0 0;
            font-size:14px;
            opacity:.9;
          "
        >
          New ticket reply
        </p>
      </div>

      <div style="padding:24px;">

        <p>
          Hello <strong>${customerName}</strong>,
        </p>

        <p
          style="
            line-height:1.6;
            color:#475569;
          "
        >
          A new reply has been added to your ticket.
        </p>

        <div
          style="
            margin-top:20px;
            background:#f8fafc;
            border:1px solid #e2e8f0;
            border-radius:12px;
            padding:18px;
          "
        >

          <p style="margin:0 0 10px;">
            <strong>Ticket:</strong>
            ${ticketNumber}
          </p>

          <p style="margin:0;">
            <strong>Subject:</strong>
            ${ticket?.subject || "N/A"}
          </p>

        </div>

        <div
          style="
            margin-top:20px;
            padding:18px;
            background:#eff6ff;
            border-left:4px solid #2563eb;
            border-radius:8px;
          "
        >
          <p
            style="
              margin:0;
              white-space:pre-wrap;
              line-height:1.6;
            "
          >
            ${safeReply}
          </p>
        </div>

        <p
          style="
            margin-top:24px;
            color:#64748b;
          "
        >
          Regards,<br />
          <strong>SupportAI Support Team</strong>
        </p>

      </div>

    </div>

  </div>
</body>
</html>
`;

  return sendEmail({
    to: customer.email,
    subject,
    text,
    html,
  });
};

/*
 * =========================================================
 * TICKET STATUS EMAIL
 * =========================================================
 */

export const sendTicketStatusEmail = async ({
  customer,
  ticket,
  oldStatus,
  newStatus,
}) => {
  if (!customer?.email) {
    throw new Error("Customer email is required for status email.");
  }

  const customerName = customer.name || "Customer";

  const ticketNumber = ticket?.ticketNumber || "N/A";

  const subject = `Ticket ${ticketNumber} Status Updated`;

  const text = `
Hello ${customerName},

Your SupportAI ticket status has been updated.

Ticket Number: ${ticketNumber}
Subject: ${ticket?.subject || "N/A"}
Previous Status: ${oldStatus || "N/A"}
New Status: ${newStatus || ticket?.status || "N/A"}

Please log in to SupportAI to view the latest details.

Regards,
SupportAI Support Team
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>SupportAI Ticket Status Update</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f1f5f9;
    font-family:Arial,Helvetica,sans-serif;
    color:#0f172a;
  "
>
  <div style="max-width:600px;margin:0 auto;padding:30px 20px;">

    <div
      style="
        background:#ffffff;
        border-radius:16px;
        border:1px solid #e2e8f0;
        overflow:hidden;
      "
    >

      <div
        style="
          background:#2563eb;
          color:#ffffff;
          padding:24px;
        "
      >
        <h1 style="margin:0;">
          SupportAI
        </h1>

        <p
          style="
            margin:8px 0 0;
            opacity:.9;
          "
        >
          Ticket status updated
        </p>
      </div>

      <div style="padding:24px;">

        <p>
          Hello <strong>${customerName}</strong>,
        </p>

        <p
          style="
            color:#475569;
            line-height:1.6;
          "
        >
          Your support ticket status has been updated.
        </p>

        <div
          style="
            margin-top:20px;
            padding:18px;
            border:1px solid #e2e8f0;
            border-radius:12px;
            background:#f8fafc;
          "
        >

          <p style="margin:0 0 10px;">
            <strong>Ticket:</strong>
            ${ticketNumber}
          </p>

          <p style="margin:0 0 10px;">
            <strong>Subject:</strong>
            ${ticket?.subject || "N/A"}
          </p>

          <p style="margin:0 0 10px;">
            <strong>Previous status:</strong>
            ${oldStatus || "N/A"}
          </p>

          <p style="margin:0;">
            <strong>New status:</strong>
            ${newStatus || ticket?.status || "N/A"}
          </p>

        </div>

        <p
          style="
            margin-top:24px;
            color:#64748b;
          "
        >
          Regards,<br />
          <strong>SupportAI Support Team</strong>
        </p>

      </div>

    </div>

  </div>
</body>
</html>
`;

  return sendEmail({
    to: customer.email,
    subject,
    text,
    html,
  });
};

/*
 * =========================================================
 * TICKET RESOLVED EMAIL
 * =========================================================
 */

export const sendTicketResolvedEmail = async ({ customer, ticket }) => {
  if (!customer?.email) {
    throw new Error("Customer email is required for resolved ticket email.");
  }

  const customerName = customer.name || "Customer";

  const ticketNumber = ticket?.ticketNumber || "N/A";

  const subject = `Ticket ${ticketNumber} Resolved`;

  const text = `
Hello ${customerName},

Your SupportAI ticket has been marked as resolved.

Ticket Number: ${ticketNumber}
Subject: ${ticket?.subject || "N/A"}
Status: resolved

Thank you for using SupportAI.

You can log in to SupportAI to review the ticket and submit your feedback.

Regards,
SupportAI Support Team
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>SupportAI Ticket Resolved</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f1f5f9;
    font-family:Arial,Helvetica,sans-serif;
    color:#0f172a;
  "
>
  <div style="max-width:600px;margin:0 auto;padding:30px 20px;">

    <div
      style="
        background:#ffffff;
        border-radius:16px;
        border:1px solid #e2e8f0;
        overflow:hidden;
      "
    >

      <div
        style="
          background:#059669;
          color:#ffffff;
          padding:24px;
        "
      >
        <h1 style="margin:0;">
          SupportAI
        </h1>

        <p
          style="
            margin:8px 0 0;
            opacity:.9;
          "
        >
          Ticket resolved
        </p>
      </div>

      <div style="padding:24px;">

        <p>
          Hello <strong>${customerName}</strong>,
        </p>

        <p
          style="
            color:#475569;
            line-height:1.6;
          "
        >
          Your SupportAI ticket has been marked as resolved.
        </p>

        <div
          style="
            margin-top:20px;
            padding:18px;
            border:1px solid #d1fae5;
            border-radius:12px;
            background:#ecfdf5;
          "
        >

          <p style="margin:0 0 10px;">
            <strong>Ticket:</strong>
            ${ticketNumber}
          </p>

          <p style="margin:0 0 10px;">
            <strong>Subject:</strong>
            ${ticket?.subject || "N/A"}
          </p>

          <p style="margin:0;">
            <strong>Status:</strong>
            Resolved
          </p>

        </div>

        <p
          style="
            margin-top:24px;
            color:#64748b;
            line-height:1.6;
          "
        >
          Thank you for using SupportAI.
          You can log in to your account to review the ticket
          and submit your feedback.
        </p>

        <p
          style="
            margin-top:24px;
            color:#64748b;
          "
        >
          Regards,<br />
          <strong>SupportAI Support Team</strong>
        </p>

      </div>

    </div>

  </div>
</body>
</html>
`;

  return sendEmail({
    to: customer.email,
    subject,
    text,
    html,
  });
};

/*
 * =========================================================
 * VERIFY SMTP CONNECTION
 * =========================================================
 */

export const verifyEmailConnection = async () => {
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    throw new Error("EMAIL_USER and EMAIL_PASSWORD are required.");
  }

  await transporter.verify();

  console.log("SMTP connection verified successfully.");

  return true;
};
