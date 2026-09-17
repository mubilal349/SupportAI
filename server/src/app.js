import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

// ==========
//   ROUTES
// ==========
import authRoutes from "./routes/authRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import aiTicketRoutes from "./routes/aiTicketRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import knowledgeBaseRoutes from "./routes/knowledgeBaseRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import adminAgentRoutes from "./routes/adminAgentRoutes.js";
import adminTicketRoutes from "./routes/adminTicketRoutes.js";
import adminEscalationRoutes from "./routes/adminEscalationRoutes.js";
import adminSlaRoutes from "./routes/adminSlaRoutes.js";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";
import cannedResponseRoutes from "./routes/cannedResponseRoutes.js";
import auditLogRoutes from "./routes/auditLogRoutes.js";

import rolePermissionRoutes from "./routes/rolePermissionRoutes.js";

// ==========
//  AGENT ROUTES
// ==========
import agentRoutes from "./routes/agentRoutes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SupportAI API is running.",
  });
});

// CUSTOMER APIS

app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/ai-tickets", aiTicketRoutes);
app.use("/api/notifications", notificationRoutes);

app.use("/api/role-permissions", rolePermissionRoutes);

app.use("/api/analytics", analyticsRoutes);
app.use("/api/knowledge-base", knowledgeBaseRoutes);

// Agent APIS
app.use("/api/agent", agentRoutes);

//Admin APIS
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/agents", adminAgentRoutes);
app.use("/api/admin/tickets", adminTicketRoutes);
app.use("/api/admin/escalations", adminEscalationRoutes);
app.use("/api/admin/sla", adminSlaRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/canned-responses", cannedResponseRoutes);
app.use("/api/audit-logs", auditLogRoutes);

export default app;
