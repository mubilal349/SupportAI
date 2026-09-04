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

app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/ai-tickets", aiTicketRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);

// Agent routes
app.use("/api/agent", agentRoutes);

export default app;
