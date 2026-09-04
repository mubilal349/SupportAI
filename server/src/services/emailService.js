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
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SupportAI - Ticket Created</title>
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
  <div
    style="
      width:100%;
      background:#f1f5f9;
      padding:40px 16px;
      box-sizing:border-box;
    "
  >

    <!-- EMAIL CONTAINER -->
    <div
      style="
        max-width:620px;
        margin:0 auto;
        background:#ffffff;
        border:1px solid #e2e8f0;
        border-radius:20px;
        overflow:hidden;
        box-shadow:0 10px 35px rgba(15,23,42,0.08);
      "
    >

      <!-- HEADER -->
      <div
        style="
          background:linear-gradient(135deg,#2563eb,#1d4ed8);
          padding:32px 32px 30px;
          color:#ffffff;
        "
      >
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
        >
          <tr>
            <td>
              <div
                style="
                  font-size:26px;
                  font-weight:700;
                  letter-spacing:-0.5px;
                "
              >
                SupportAI
              </div>

              <div
                style="
                  margin-top:6px;
                  font-size:14px;
                  color:#dbeafe;
                "
              >
                Customer Support
              </div>
            </td>

            <td
              align="right"
              valign="middle"
            >
              <div
                style="
                  display:inline-block;
                  background:rgba(255,255,255,0.14);
                  border:1px solid rgba(255,255,255,0.20);
                  padding:8px 12px;
                  border-radius:999px;
                  font-size:11px;
                  font-weight:600;
                  color:#ffffff;
                "
              >
                TICKET CREATED
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- CONTENT -->
      <div style="padding:32px;">

        <!-- GREETING -->
        <p
          style="
            margin:0;
            font-size:18px;
            line-height:1.5;
            font-weight:600;
            color:#0f172a;
          "
        >
          Hello ${customerName},
        </p>

        <p
          style="
            margin:10px 0 0;
            font-size:14px;
            line-height:1.7;
            color:#475569;
          "
        >
          Thanks for contacting SupportAI. Your support request has been
          successfully received and a ticket has been created.
        </p>

        <!-- SUCCESS MESSAGE -->
        <div
          style="
            margin-top:24px;
            padding:16px 18px;
            border:1px solid #bbf7d0;
            background:#f0fdf4;
            border-radius:12px;
          "
        >
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
          >
            <tr>
              <td
                width="38"
                valign="top"
              >
                <div
                  style="
                    width:30px;
                    height:30px;
                    line-height:30px;
                    text-align:center;
                    border-radius:50%;
                    background:#dcfce7;
                    color:#16a34a;
                    font-size:16px;
                    font-weight:700;
                  "
                >
                  ✓
                </div>
              </td>

              <td valign="middle">
                <div
                  style="
                    font-size:14px;
                    font-weight:700;
                    color:#166534;
                  "
                >
                  Your ticket is now in our system
                </div>

                <div
                  style="
                    margin-top:4px;
                    font-size:12px;
                    line-height:1.5;
                    color:#4d7c5f;
                  "
                >
                  Our support team can now review and respond to your request.
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- TICKET DETAILS -->
        <div
          style="
            margin-top:28px;
            border:1px solid #e2e8f0;
            border-radius:16px;
            overflow:hidden;
          "
        >

          <div
            style="
              padding:16px 18px;
              background:#f8fafc;
              border-bottom:1px solid #e2e8f0;
            "
          >
            <div
              style="
                font-size:13px;
                font-weight:700;
                color:#0f172a;
              "
            >
              Ticket details
            </div>

            <div
              style="
                margin-top:4px;
                font-size:11px;
                color:#64748b;
              "
            >
              Keep this information for future reference.
            </div>
          </div>

          <div style="padding:20px;">

            <!-- TICKET NUMBER -->
            <div
              style="
                padding-bottom:16px;
                border-bottom:1px solid #f1f5f9;
              "
            >
              <div
                style="
                  font-size:11px;
                  font-weight:600;
                  text-transform:uppercase;
                  letter-spacing:0.08em;
                  color:#94a3b8;
                "
              >
                Ticket number
              </div>

              <div
                style="
                  margin-top:6px;
                  font-size:17px;
                  font-weight:700;
                  color:#2563eb;
                "
              >
                ${ticketNumber}
              </div>
            </div>

            <!-- SUBJECT -->
            <div
              style="
                padding:16px 0;
                border-bottom:1px solid #f1f5f9;
              "
            >
              <div
                style="
                  font-size:11px;
                  font-weight:600;
                  text-transform:uppercase;
                  letter-spacing:0.08em;
                  color:#94a3b8;
                "
              >
                Subject
              </div>

              <div
                style="
                  margin-top:6px;
                  font-size:14px;
                  line-height:1.5;
                  font-weight:600;
                  color:#334155;
                "
              >
                ${ticket?.subject || "N/A"}
              </div>
            </div>

            <!-- CATEGORY / PRIORITY -->
            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              border="0"
              style="
                padding:16px 0;
                border-bottom:1px solid #f1f5f9;
              "
            >
              <tr>
                <td width="50%" valign="top">
                  <div
                    style="
                      font-size:11px;
                      font-weight:600;
                      text-transform:uppercase;
                      letter-spacing:0.08em;
                      color:#94a3b8;
                    "
                  >
                    Category
                  </div>

                  <div
                    style="
                      margin-top:6px;
                      font-size:13px;
                      font-weight:600;
                      color:#334155;
                    "
                  >
                    ${ticket?.category || "General"}
                  </div>
                </td>

                <td width="50%" valign="top">
                  <div
                    style="
                      font-size:11px;
                      font-weight:600;
                      text-transform:uppercase;
                      letter-spacing:0.08em;
                      color:#94a3b8;
                    "
                  >
                    Priority
                  </div>

                  <div
                    style="
                      margin-top:6px;
                      font-size:13px;
                      font-weight:600;
                      color:#334155;
                      text-transform:capitalize;
                    "
                  >
                    ${ticket?.priority || "medium"}
                  </div>
                </td>
              </tr>
            </table>

            <!-- STATUS -->
            <div style="padding-top:16px;">
              <div
                style="
                  font-size:11px;
                  font-weight:600;
                  text-transform:uppercase;
                  letter-spacing:0.08em;
                  color:#94a3b8;
                "
              >
                Current status
              </div>

              <div style="margin-top:8px;">
                <span
                  style="
                    display:inline-block;
                    padding:7px 11px;
                    border-radius:999px;
                    background:#dbeafe;
                    color:#1d4ed8;
                    font-size:11px;
                    font-weight:700;
                    text-transform:capitalize;
                  "
                >
                  ${ticket?.status || "open"}
                </span>
              </div>
            </div>

          </div>
        </div>

        <!-- NEXT STEP -->
        <div
          style="
            margin-top:28px;
            padding:20px;
            background:#eff6ff;
            border:1px solid #bfdbfe;
            border-radius:14px;
          "
        >
          <div
            style="
              font-size:14px;
              font-weight:700;
              color:#1e40af;
            "
          >
            What happens next?
          </div>

          <p
            style="
              margin:8px 0 0;
              font-size:13px;
              line-height:1.7;
              color:#475569;
            "
          >
            You can view your ticket, follow its status, and respond to
            support from your SupportAI account. We'll notify you when there
            is a new reply or important update.
          </p>
        </div>

        <!-- CTA -->
        <div
          style="
            margin-top:28px;
            text-align:center;
          "
        >
          <a
            href="http://localhost:5173/support/tickets"
            style="
              display:inline-block;
              padding:13px 22px;
              background:#2563eb;
              color:#ffffff;
              text-decoration:none;
              border-radius:10px;
              font-size:13px;
              font-weight:700;
            "
          >
            View My Tickets
          </a>
        </div>

        <!-- SUPPORT NOTE -->
        <p
          style="
            margin:26px 0 0;
            text-align:center;
            font-size:11px;
            line-height:1.6;
            color:#94a3b8;
          "
        >
          Need more help? You can continue the conversation through
          SupportAI at any time.
        </p>

      </div>

      <!-- FOOTER -->
      <div
        style="
          padding:22px 32px;
          background:#f8fafc;
          border-top:1px solid #e2e8f0;
          text-align:center;
        "
      >
        <p
          style="
            margin:0;
            font-size:12px;
            font-weight:700;
            color:#475569;
          "
        >
          SupportAI Support Team
        </p>

        <p
          style="
            margin:6px 0 0;
            font-size:10px;
            color:#94a3b8;
          "
        >
          This is an automated notification from SupportAI.
          Please do not reply directly to this email.
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
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SupportAI - New Reply</title>
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
  <div
    style="
      width:100%;
      background:#f1f5f9;
      padding:40px 16px;
      box-sizing:border-box;
    "
  >

    <!-- EMAIL CONTAINER -->
    <div
      style="
        max-width:620px;
        margin:0 auto;
        background:#ffffff;
        border:1px solid #e2e8f0;
        border-radius:20px;
        overflow:hidden;
        box-shadow:0 10px 35px rgba(15,23,42,0.08);
      "
    >

      <!-- HEADER -->
      <div
        style="
          background:linear-gradient(135deg,#2563eb,#1d4ed8);
          padding:32px;
          color:#ffffff;
        "
      >
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
        >
          <tr>
            <td valign="middle">

              <div
                style="
                  font-size:26px;
                  font-weight:700;
                  letter-spacing:-0.5px;
                "
              >
                SupportAI
              </div>

              <div
                style="
                  margin-top:6px;
                  font-size:14px;
                  color:#dbeafe;
                "
              >
                Customer Support
              </div>

            </td>

            <td
              align="right"
              valign="middle"
            >
              <div
                style="
                  display:inline-block;
                  background:rgba(255,255,255,0.14);
                  border:1px solid rgba(255,255,255,0.20);
                  padding:8px 12px;
                  border-radius:999px;
                  font-size:10px;
                  font-weight:700;
                  color:#ffffff;
                "
              >
                NEW REPLY
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- CONTENT -->
      <div style="padding:32px;">

        <!-- GREETING -->
        <p
          style="
            margin:0;
            font-size:18px;
            line-height:1.5;
            font-weight:600;
            color:#0f172a;
          "
        >
          Hello ${customerName},
        </p>

        <p
          style="
            margin:10px 0 0;
            font-size:14px;
            line-height:1.7;
            color:#475569;
          "
        >
          There's a new reply waiting for you regarding your
          support ticket.
        </p>

        <!-- NOTIFICATION -->
        <div
          style="
            margin-top:24px;
            padding:16px 18px;
            border:1px solid #bfdbfe;
            background:#eff6ff;
            border-radius:12px;
          "
        >
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
          >
            <tr>

              <td
                width="42"
                valign="top"
              >
                <div
                  style="
                    width:32px;
                    height:32px;
                    line-height:32px;
                    text-align:center;
                    border-radius:50%;
                    background:#dbeafe;
                    color:#2563eb;
                    font-size:16px;
                    font-weight:700;
                  "
                >
                  ↗
                </div>
              </td>

              <td valign="middle">

                <div
                  style="
                    font-size:14px;
                    font-weight:700;
                    color:#1e40af;
                  "
                >
                  Your support ticket has a new reply
                </div>

                <div
                  style="
                    margin-top:4px;
                    font-size:12px;
                    line-height:1.5;
                    color:#64748b;
                  "
                >
                  Sign in to SupportAI to continue the conversation.
                </div>

              </td>

            </tr>
          </table>
        </div>

        <!-- TICKET DETAILS -->
        <div
          style="
            margin-top:28px;
            border:1px solid #e2e8f0;
            border-radius:16px;
            overflow:hidden;
          "
        >

          <div
            style="
              padding:16px 18px;
              background:#f8fafc;
              border-bottom:1px solid #e2e8f0;
            "
          >
            <div
              style="
                font-size:13px;
                font-weight:700;
                color:#0f172a;
              "
            >
              Ticket details
            </div>

            <div
              style="
                margin-top:4px;
                font-size:11px;
                color:#64748b;
              "
            >
              Conversation reference
            </div>
          </div>

          <div style="padding:20px;">

            <!-- TICKET -->
            <div
              style="
                padding-bottom:16px;
                border-bottom:1px solid #f1f5f9;
              "
            >

              <div
                style="
                  font-size:11px;
                  font-weight:600;
                  text-transform:uppercase;
                  letter-spacing:0.08em;
                  color:#94a3b8;
                "
              >
                Ticket number
              </div>

              <div
                style="
                  margin-top:6px;
                  font-size:17px;
                  font-weight:700;
                  color:#2563eb;
                "
              >
                ${ticketNumber}
              </div>

            </div>

            <!-- SUBJECT -->
            <div style="padding-top:16px;">

              <div
                style="
                  font-size:11px;
                  font-weight:600;
                  text-transform:uppercase;
                  letter-spacing:0.08em;
                  color:#94a3b8;
                "
              >
                Subject
              </div>

              <div
                style="
                  margin-top:6px;
                  font-size:14px;
                  line-height:1.5;
                  font-weight:600;
                  color:#334155;
                "
              >
                ${ticket?.subject || "N/A"}
              </div>

            </div>

          </div>
        </div>

        <!-- REPLY BOX -->
        <div style="margin-top:28px;">

          <div
            style="
              margin-bottom:10px;
              font-size:12px;
              font-weight:700;
              color:#475569;
            "
          >
            Latest reply
          </div>

          <div
            style="
              padding:20px;
              background:#f8fafc;
              border:1px solid #e2e8f0;
              border-left:4px solid #2563eb;
              border-radius:12px;
            "
          >

            <p
              style="
                margin:0;
                font-size:14px;
                line-height:1.8;
                color:#334155;
                white-space:pre-wrap;
              "
            >
              ${safeReply}
            </p>

          </div>

        </div>

        <!-- CTA -->
        <div
          style="
            margin-top:30px;
            text-align:center;
          "
        >
          <a
            href="${process.env.CLIENT_URL || "http://localhost:5173"}/support/tickets"
            style="
              display:inline-block;
              padding:13px 24px;
              background:#2563eb;
              color:#ffffff;
              text-decoration:none;
              border-radius:10px;
              font-size:13px;
              font-weight:700;
            "
          >
            View & Reply to Ticket
          </a>
        </div>

        <!-- EXTRA MESSAGE -->
        <div
          style="
            margin-top:28px;
            padding-top:22px;
            border-top:1px solid #e2e8f0;
          "
        >

          <p
            style="
              margin:0;
              font-size:12px;
              line-height:1.7;
              color:#64748b;
              text-align:center;
            "
          >
            You can continue your conversation with SupportAI or
            your support specialist directly from your customer dashboard.
          </p>

        </div>

        <!-- SIGNATURE -->
        <p
          style="
            margin:24px 0 0;
            text-align:center;
            font-size:12px;
            line-height:1.6;
            color:#64748b;
          "
        >
          Regards,<br />
          <strong style="color:#334155;">
            SupportAI Support Team
          </strong>
        </p>

      </div>

      <!-- FOOTER -->
      <div
        style="
          padding:22px 32px;
          background:#f8fafc;
          border-top:1px solid #e2e8f0;
          text-align:center;
        "
      >

        <p
          style="
            margin:0;
            font-size:12px;
            font-weight:700;
            color:#475569;
          "
        >
          SupportAI
        </p>

        <p
          style="
            margin:6px 0 0;
            font-size:10px;
            line-height:1.5;
            color:#94a3b8;
          "
        >
          This is an automated notification from SupportAI.
          Please manage your email preferences from your account settings.
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
