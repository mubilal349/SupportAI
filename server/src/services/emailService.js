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

  <style>
    @media only screen and (max-width: 620px) {
      .email-wrapper {
        padding: 20px 10px !important;
      }

      .email-container {
        border-radius: 14px !important;
      }

      .email-header {
        padding: 28px 22px !important;
      }

      .email-content {
        padding: 26px 20px !important;
      }

      .footer {
        padding: 22px 20px !important;
      }

      .mobile-block {
        display: block !important;
        width: 100% !important;
      }

      .ticket-number {
        font-size: 18px !important;
      }
    }
  </style>
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

  <!-- OUTER WRAPPER -->
  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background:#f1f5f9;"
  >
    <tr>
      <td
        align="center"
        class="email-wrapper"
        style="padding:40px 16px;"
      >

        <!-- MAIN CONTAINER -->
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          class="email-container"
          style="
            max-width:620px;
            background:#ffffff;
            border:1px solid #e2e8f0;
            border-radius:18px;
            overflow:hidden;
          "
        >

          <!-- HEADER -->
          <tr>
            <td
              class="email-header"
              style="
                padding:30px 32px;
                background:#2563eb;
              "
            >

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
              >
                <tr>

                  <!-- LOGO -->
                  <td
                    valign="middle"
                    style="width:60%;"
                  >
                    <div
                      style="
                        font-size:25px;
                        line-height:1.2;
                        font-weight:700;
                        color:#ffffff;
                        letter-spacing:-0.5px;
                      "
                    >
                      SupportAI
                    </div>

                    <div
                      style="
                        margin-top:6px;
                        font-size:13px;
                        line-height:1.4;
                        color:#dbeafe;
                      "
                    >
                      Intelligent customer support
                    </div>
                  </td>

                  <!-- STATUS -->
                  <td
                    align="right"
                    valign="middle"
                    style="width:40%;"
                  >
                    <span
                      style="
                        display:inline-block;
                        padding:7px 11px;
                        border:1px solid rgba(255,255,255,0.30);
                        border-radius:20px;
                        background:rgba(255,255,255,0.12);
                        color:#ffffff;
                        font-size:10px;
                        line-height:1;
                        font-weight:700;
                        letter-spacing:0.6px;
                      "
                    >
                      TICKET CREATED
                    </span>
                  </td>

                </tr>
              </table>

            </td>
          </tr>


          <!-- CONTENT -->
          <tr>
            <td
              class="email-content"
              style="
                padding:34px 32px;
              "
            >

              <!-- GREETING -->
              <div
                style="
                  font-size:21px;
                  line-height:1.4;
                  font-weight:700;
                  color:#0f172a;
                "
              >
                Hello ${customerName},
              </div>

              <div
                style="
                  margin-top:10px;
                  font-size:14px;
                  line-height:1.7;
                  color:#64748b;
                "
              >
                Thank you for contacting SupportAI. We've received your
                support request and created a ticket for you.
              </div>


              <!-- SUCCESS MESSAGE -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  margin-top:26px;
                  border:1px solid #bbf7d0;
                  background:#f0fdf4;
                  border-radius:12px;
                "
              >
                <tr>
                  <td style="padding:16px 18px;">

                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >
                      <tr>

                        <td
                          valign="top"
                          style="width:38px;"
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
                              line-height:1.4;
                              font-weight:700;
                              color:#166534;
                            "
                          >
                            Your ticket has been created
                          </div>

                          <div
                            style="
                              margin-top:4px;
                              font-size:12px;
                              line-height:1.5;
                              color:#4d7c5f;
                            "
                          >
                            Our support team can now review your request
                            and respond to you.
                          </div>

                        </td>

                      </tr>
                    </table>

                  </td>
                </tr>
              </table>


              <!-- TICKET SUMMARY -->
              <div
                style="
                  margin-top:30px;
                  font-size:16px;
                  line-height:1.4;
                  font-weight:700;
                  color:#0f172a;
                "
              >
                Ticket summary
              </div>

              <div
                style="
                  margin-top:4px;
                  font-size:12px;
                  line-height:1.5;
                  color:#94a3b8;
                "
              >
                Keep this information for your records.
              </div>


              <!-- TICKET CARD -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  margin-top:14px;
                  border:1px solid #e2e8f0;
                  border-radius:14px;
                  overflow:hidden;
                "
              >

                <!-- TICKET NUMBER -->
                <tr>
                  <td
                    colspan="2"
                    style="
                      padding:18px 20px;
                      background:#f8fafc;
                      border-bottom:1px solid #e2e8f0;
                    "
                  >

                    <div
                      style="
                        font-size:10px;
                        line-height:1.4;
                        font-weight:700;
                        letter-spacing:0.8px;
                        text-transform:uppercase;
                        color:#94a3b8;
                      "
                    >
                      Ticket number
                    </div>

                    <div
                      class="ticket-number"
                      style="
                        margin-top:6px;
                        font-size:19px;
                        line-height:1.4;
                        font-weight:700;
                        color:#2563eb;
                      "
                    >
                      ${ticketNumber}
                    </div>

                  </td>
                </tr>


                <!-- SUBJECT -->
                <tr>
                  <td
                    colspan="2"
                    style="
                      padding:18px 20px;
                      border-bottom:1px solid #f1f5f9;
                    "
                  >

                    <div
                      style="
                        font-size:10px;
                        line-height:1.4;
                        font-weight:700;
                        letter-spacing:0.8px;
                        text-transform:uppercase;
                        color:#94a3b8;
                      "
                    >
                      Subject
                    </div>

                    <div
                      style="
                        margin-top:6px;
                        font-size:14px;
                        line-height:1.6;
                        font-weight:600;
                        color:#334155;
                      "
                    >
                      ${ticket?.subject || "N/A"}
                    </div>

                  </td>
                </tr>


                <!-- CATEGORY + PRIORITY -->
                <tr>

                  <td
                    width="50%"
                    valign="top"
                    style="
                      padding:18px 20px;
                      border-right:1px solid #f1f5f9;
                    "
                  >

                    <div
                      style="
                        font-size:10px;
                        line-height:1.4;
                        font-weight:700;
                        letter-spacing:0.8px;
                        text-transform:uppercase;
                        color:#94a3b8;
                      "
                    >
                      Category
                    </div>

                    <div
                      style="
                        margin-top:6px;
                        font-size:13px;
                        line-height:1.5;
                        font-weight:600;
                        color:#334155;
                      "
                    >
                      ${ticket?.category || "General"}
                    </div>

                  </td>


                  <td
                    width="50%"
                    valign="top"
                    style="
                      padding:18px 20px;
                    "
                  >

                    <div
                      style="
                        font-size:10px;
                        line-height:1.4;
                        font-weight:700;
                        letter-spacing:0.8px;
                        text-transform:uppercase;
                        color:#94a3b8;
                      "
                    >
                      Priority
                    </div>

                    <div
                      style="
                        margin-top:6px;
                        font-size:13px;
                        line-height:1.5;
                        font-weight:600;
                        color:#334155;
                        text-transform:capitalize;
                      "
                    >
                      ${ticket?.priority || "medium"}
                    </div>

                  </td>

                </tr>


                <!-- STATUS -->
                <tr>
                  <td
                    colspan="2"
                    style="
                      padding:18px 20px;
                      border-top:1px solid #f1f5f9;
                    "
                  >

                    <div
                      style="
                        font-size:10px;
                        line-height:1.4;
                        font-weight:700;
                        letter-spacing:0.8px;
                        text-transform:uppercase;
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
                          background:#dbeafe;
                          color:#1d4ed8;
                          border-radius:20px;
                          font-size:11px;
                          line-height:1;
                          font-weight:700;
                          text-transform:capitalize;
                        "
                      >
                        ${ticket?.status || "open"}
                      </span>

                    </div>

                  </td>
                </tr>

              </table>


              <!-- WHAT HAPPENS NEXT -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  margin-top:28px;
                  border:1px solid #dbeafe;
                  background:#eff6ff;
                  border-radius:14px;
                "
              >
                <tr>
                  <td style="padding:20px;">

                    <div
                      style="
                        font-size:14px;
                        line-height:1.4;
                        font-weight:700;
                        color:#1e40af;
                      "
                    >
                      What happens next?
                    </div>

                    <div
                      style="
                        margin-top:8px;
                        font-size:13px;
                        line-height:1.7;
                        color:#475569;
                      "
                    >
                      Our support team will review your request and respond
                      as soon as possible. You can follow your ticket,
                      check its status, and continue the conversation
                      directly from your SupportAI account.
                    </div>

                  </td>
                </tr>
              </table>


              <!-- CTA -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="margin-top:28px;"
              >
                <tr>
                  <td align="center">

                    <a
                      href="${process.env.CLIENT_URL || "http://localhost:5173"}/support/tickets"
                      style="
                        display:inline-block;
                        padding:14px 26px;
                        background:#2563eb;
                        color:#ffffff;
                        text-decoration:none;
                        border-radius:10px;
                        font-size:13px;
                        line-height:1;
                        font-weight:700;
                      "
                    >
                      View My Tickets
                    </a>

                  </td>
                </tr>
              </table>


              <!-- SECONDARY TEXT -->
              <div
                style="
                  margin-top:18px;
                  text-align:center;
                  font-size:11px;
                  line-height:1.6;
                  color:#94a3b8;
                "
              >
                You can also access your tickets anytime from your
                SupportAI dashboard.
              </div>

            </td>
          </tr>


          <!-- FOOTER -->
          <tr>
            <td
              class="footer"
              style="
                padding:24px 32px;
                background:#f8fafc;
                border-top:1px solid #e2e8f0;
                text-align:center;
              "
            >

              <div
                style="
                  font-size:13px;
                  line-height:1.4;
                  font-weight:700;
                  color:#334155;
                "
              >
                SupportAI Support Team
              </div>

              <div
                style="
                  margin-top:6px;
                  font-size:10px;
                  line-height:1.6;
                  color:#94a3b8;
                "
              >
                This is an automated notification from SupportAI.
                Please do not reply directly to this email.
              </div>

              <div
                style="
                  margin-top:12px;
                  font-size:10px;
                  line-height:1.5;
                  color:#cbd5e1;
                "
              >
                © ${new Date().getFullYear()} SupportAI. All rights reserved.
              </div>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

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

  <style>
    @media only screen and (max-width: 620px) {
      .email-wrapper {
        padding: 20px 10px !important;
      }

      .email-container {
        border-radius: 14px !important;
      }

      .email-header {
        padding: 28px 22px !important;
      }

      .email-content {
        padding: 26px 20px !important;
      }

      .footer {
        padding: 22px 20px !important;
      }

      .ticket-number {
        font-size: 18px !important;
      }
    }
  </style>
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

  <!-- OUTER WRAPPER -->
  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background:#f1f5f9;"
  >
    <tr>
      <td
        align="center"
        class="email-wrapper"
        style="padding:40px 16px;"
      >

        <!-- EMAIL CONTAINER -->
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          class="email-container"
          style="
            max-width:620px;
            background:#ffffff;
            border:1px solid #e2e8f0;
            border-radius:18px;
            overflow:hidden;
          "
        >

          <!-- HEADER -->
          <tr>
            <td
              class="email-header"
              style="
                padding:30px 32px;
                background:#2563eb;
              "
            >

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
              >
                <tr>

                  <!-- BRAND -->
                  <td
                    valign="middle"
                    style="width:60%;"
                  >

                    <div
                      style="
                        font-size:25px;
                        line-height:1.2;
                        font-weight:700;
                        color:#ffffff;
                        letter-spacing:-0.5px;
                      "
                    >
                      SupportAI
                    </div>

                    <div
                      style="
                        margin-top:6px;
                        font-size:13px;
                        line-height:1.4;
                        color:#dbeafe;
                      "
                    >
                      Intelligent customer support
                    </div>

                  </td>

                  <!-- HEADER BADGE -->
                  <td
                    align="right"
                    valign="middle"
                    style="width:40%;"
                  >

                    <span
                      style="
                        display:inline-block;
                        padding:7px 11px;
                        border:1px solid rgba(255,255,255,0.30);
                        border-radius:20px;
                        background:rgba(255,255,255,0.12);
                        color:#ffffff;
                        font-size:10px;
                        line-height:1;
                        font-weight:700;
                        letter-spacing:0.6px;
                      "
                    >
                      NEW REPLY
                    </span>

                  </td>

                </tr>
              </table>

            </td>
          </tr>


          <!-- CONTENT -->
          <tr>
            <td
              class="email-content"
              style="
                padding:34px 32px;
              "
            >

              <!-- GREETING -->
              <div
                style="
                  font-size:21px;
                  line-height:1.4;
                  font-weight:700;
                  color:#0f172a;
                "
              >
                Hello ${customerName},
              </div>

              <div
                style="
                  margin-top:10px;
                  font-size:14px;
                  line-height:1.7;
                  color:#64748b;
                "
              >
                There's a new reply waiting for you regarding your
                SupportAI support ticket.
              </div>


              <!-- NEW REPLY NOTIFICATION -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  margin-top:26px;
                  border:1px solid #bfdbfe;
                  background:#eff6ff;
                  border-radius:12px;
                "
              >
                <tr>

                  <td style="padding:17px 18px;">

                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >
                      <tr>

                        <!-- ICON -->
                        <td
                          valign="top"
                          style="width:40px;"
                        >

                          <div
                            style="
                              width:30px;
                              height:30px;
                              line-height:30px;
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

                        <!-- MESSAGE -->
                        <td valign="middle">

                          <div
                            style="
                              font-size:14px;
                              line-height:1.4;
                              font-weight:700;
                              color:#1e40af;
                            "
                          >
                            Your ticket has a new reply
                          </div>

                          <div
                            style="
                              margin-top:4px;
                              font-size:12px;
                              line-height:1.5;
                              color:#64748b;
                            "
                          >
                            A member of our support team has responded
                            to your request.
                          </div>

                        </td>

                      </tr>
                    </table>

                  </td>

                </tr>
              </table>


              <!-- TICKET SUMMARY -->
              <div
                style="
                  margin-top:30px;
                  font-size:16px;
                  line-height:1.4;
                  font-weight:700;
                  color:#0f172a;
                "
              >
                Ticket summary
              </div>

              <div
                style="
                  margin-top:4px;
                  font-size:12px;
                  line-height:1.5;
                  color:#94a3b8;
                "
              >
                Conversation reference
              </div>


              <!-- TICKET CARD -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  margin-top:14px;
                  border:1px solid #e2e8f0;
                  border-radius:14px;
                  overflow:hidden;
                "
              >

                <!-- TICKET NUMBER -->
                <tr>
                  <td
                    style="
                      padding:18px 20px;
                      background:#f8fafc;
                      border-bottom:1px solid #e2e8f0;
                    "
                  >

                    <div
                      style="
                        font-size:10px;
                        line-height:1.4;
                        font-weight:700;
                        letter-spacing:0.8px;
                        text-transform:uppercase;
                        color:#94a3b8;
                      "
                    >
                      Ticket number
                    </div>

                    <div
                      class="ticket-number"
                      style="
                        margin-top:6px;
                        font-size:19px;
                        line-height:1.4;
                        font-weight:700;
                        color:#2563eb;
                      "
                    >
                      ${ticketNumber}
                    </div>

                  </td>
                </tr>


                <!-- SUBJECT -->
                <tr>
                  <td
                    style="
                      padding:18px 20px;
                    "
                  >

                    <div
                      style="
                        font-size:10px;
                        line-height:1.4;
                        font-weight:700;
                        letter-spacing:0.8px;
                        text-transform:uppercase;
                        color:#94a3b8;
                      "
                    >
                      Subject
                    </div>

                    <div
                      style="
                        margin-top:6px;
                        font-size:14px;
                        line-height:1.6;
                        font-weight:600;
                        color:#334155;
                      "
                    >
                      ${ticket?.subject || "N/A"}
                    </div>

                  </td>
                </tr>

              </table>


              <!-- LATEST REPLY -->
              <div
                style="
                  margin-top:30px;
                  font-size:16px;
                  line-height:1.4;
                  font-weight:700;
                  color:#0f172a;
                "
              >
                Latest reply
              </div>

              <div
                style="
                  margin-top:4px;
                  font-size:12px;
                  line-height:1.5;
                  color:#94a3b8;
                "
              >
                Here's the latest message from your support conversation.
              </div>


              <!-- REPLY CARD -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  margin-top:14px;
                  border:1px solid #e2e8f0;
                  border-left:4px solid #2563eb;
                  background:#f8fafc;
                  border-radius:12px;
                "
              >
                <tr>

                  <td style="padding:20px;">

                    <div
                      style="
                        font-size:12px;
                        line-height:1.4;
                        font-weight:700;
                        color:#475569;
                      "
                    >
                      SupportAI Support Team
                    </div>

                    <div
                      style="
                        margin-top:12px;
                        font-size:14px;
                        line-height:1.8;
                        color:#334155;
                        white-space:pre-wrap;
                        word-break:break-word;
                      "
                    >
                      ${safeReply}
                    </div>

                  </td>

                </tr>
              </table>


              <!-- CTA -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  margin-top:30px;
                "
              >
                <tr>
                  <td align="center">

                    <a
                      href="${process.env.CLIENT_URL || "http://localhost:5173"}/support/tickets"
                      style="
                        display:inline-block;
                        padding:14px 26px;
                        background:#2563eb;
                        color:#ffffff;
                        text-decoration:none;
                        border-radius:10px;
                        font-size:13px;
                        line-height:1;
                        font-weight:700;
                      "
                    >
                      View &amp; Reply to Ticket
                    </a>

                  </td>
                </tr>
              </table>


              <!-- HELPER MESSAGE -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  margin-top:28px;
                  border-top:1px solid #e2e8f0;
                "
              >
                <tr>

                  <td
                    align="center"
                    style="
                      padding-top:22px;
                    "
                  >

                    <div
                      style="
                        font-size:12px;
                        line-height:1.7;
                        color:#64748b;
                      "
                    >
                      You can continue your conversation with our support
                      team directly from your SupportAI dashboard.
                    </div>

                  </td>

                </tr>
              </table>


              <!-- SIGNATURE -->
              <div
                style="
                  margin-top:24px;
                  text-align:center;
                  font-size:12px;
                  line-height:1.6;
                  color:#64748b;
                "
              >
                Regards,<br />

                <strong
                  style="
                    color:#334155;
                  "
                >
                  SupportAI Support Team
                </strong>
              </div>

            </td>
          </tr>


          <!-- FOOTER -->
          <tr>
            <td
              class="footer"
              style="
                padding:24px 32px;
                background:#f8fafc;
                border-top:1px solid #e2e8f0;
                text-align:center;
              "
            >

              <div
                style="
                  font-size:13px;
                  line-height:1.4;
                  font-weight:700;
                  color:#334155;
                "
              >
                SupportAI
              </div>

              <div
                style="
                  margin-top:6px;
                  font-size:10px;
                  line-height:1.6;
                  color:#94a3b8;
                "
              >
                This is an automated notification from SupportAI.
                Please manage your email preferences from your account settings.
              </div>

              <div
                style="
                  margin-top:12px;
                  font-size:10px;
                  line-height:1.5;
                  color:#cbd5e1;
                "
              >
                © ${new Date().getFullYear()} SupportAI. All rights reserved.
              </div>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

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
