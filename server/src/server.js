import dotenv from "dotenv";

dotenv.config();

import http from "http";
import { Server } from "socket.io";

import app from "./app.js";
import connectDB from "./config/db.js";
import { initializeSocket } from "./socket/socket.js";

const PORT = process.env.PORT || 8000;

/*
 * =========================================================
 * START SERVER
 * =========================================================
 */

const startServer = async () => {
  try {
    /*
     * =====================================================
     * CONNECT DATABASE
     * =====================================================
     */

    await connectDB();

    /*
     * =====================================================
     * CREATE HTTP SERVER
     * =====================================================
     *
     * Instead of:
     *
     * app.listen(...)
     *
     * we create a Node HTTP server so Socket.IO can
     * use the same server as Express.
     *
     * =====================================================
     */

    const server = http.createServer(app);

    /*
     * =====================================================
     * SOCKET.IO
     * =====================================================
     */

    const io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",

        credentials: true,
      },
    });

    /*
     * =====================================================
     * MAKE SOCKET.IO AVAILABLE TO EXPRESS
     * =====================================================
     *
     * Controllers can access Socket.IO using:
     *
     * const io = req.app.get("io");
     *
     * =====================================================
     */

    app.set("io", io);

    /*
     * =====================================================
     * INITIALIZE SOCKET EVENTS
     * =====================================================
     */

    initializeSocket(io);

    /*
     * =====================================================
     * START SERVER
     * =====================================================
     */

    server.listen(PORT, () => {
      console.log(`SupportAI server running on port ${PORT}`);

      console.log(`Socket.IO running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);

    process.exit(1);
  }
};

startServer();
