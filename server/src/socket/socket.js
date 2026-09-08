import jwt from "jsonwebtoken";
import Ticket from "../models/Ticket.js";

// =========================================================
// SOCKET.IO INSTANCE
// =========================================================

let ioInstance = null;

// =========================================================
// USER HELPERS
// =========================================================

const getUserId = (user) => {
  return user?.id || user?._id || user?.userId || null;
};

const getUserRole = (user) => {
  return user?.role || null;
};

// =========================================================
// AUTHORIZE USER FOR TICKET
// =========================================================

export const canAccessTicket = (ticket, user) => {
  if (!ticket || !user) {
    return false;
  }

  const userId = String(getUserId(user));
  const role = getUserRole(user);

  if (!userId) {
    return false;
  }

  // Admin can access every ticket
  if (role === "admin") {
    return true;
  }

  // Customer can access their own ticket
  if (
    role === "customer" &&
    String(ticket.customer?._id || ticket.customer) === userId
  ) {
    return true;
  }

  // Agent can access only their assigned ticket
  if (
    role === "agent" &&
    String(ticket.assignedAgent?._id || ticket.assignedAgent) === userId
  ) {
    return true;
  }

  return false;
};

// =========================================================
// PUBLIC TICKET ROOM
// =========================================================
// Customer + assigned agent + admin can join.
//
// IMPORTANT:
// Never emit internal notes into this room.
// =========================================================

export const getTicketRoom = (ticketId) => {
  return `ticket:${ticketId}`;
};

// =========================================================
// PRIVATE AGENT TICKET ROOM
// =========================================================
// Only agents/admins should receive internal notes.
// Customers NEVER join this room.
// =========================================================

export const getAgentTicketRoom = (ticketId) => {
  return `ticket:agents:${ticketId}`;
};

// =========================================================
// GET SOCKET.IO INSTANCE
// =========================================================

export const getSocketIO = () => {
  return ioInstance;
};

// =========================================================
// INITIALIZE SOCKET.IO
// =========================================================

export const initializeSocket = (io) => {
  ioInstance = io;

  console.log("Socket.IO initialized successfully.");

  // =======================================================
  // SOCKET AUTHENTICATION
  // =======================================================

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.user = decoded;

      next();
    } catch (error) {
      console.error("SOCKET AUTH ERROR:", error);

      next(new Error("Invalid or expired token"));
    }
  });

  // =======================================================
  // CONNECTION
  // =======================================================

  io.on("connection", (socket) => {
    const userId = getUserId(socket.user);
    const role = getUserRole(socket.user);

    const userRoom = `user:${userId}`;

    // -----------------------------------------------------
    // PERSONAL USER ROOM
    // -----------------------------------------------------

    socket.join(userRoom);

    console.log(
      `Socket ${socket.id} joined user notification room ${userRoom}`,
    );

    console.log(
      `Socket connected: ${socket.id} | User: ${userId} | Role: ${role}`,
    );

    // =====================================================
    // JOIN TICKET
    // =====================================================

    socket.on("ticket:join", async ({ ticketId }) => {
      try {
        if (!ticketId) {
          socket.emit("ticket:error", {
            message: "Ticket ID is required.",
          });

          return;
        }

        const ticket = await Ticket.findById(ticketId).select(
          "customer assignedAgent status",
        );

        if (!ticket) {
          socket.emit("ticket:error", {
            message: "Ticket not found.",
          });

          return;
        }

        // -------------------------------------------------
        // AUTHORIZATION
        // -------------------------------------------------

        if (!canAccessTicket(ticket, socket.user)) {
          socket.emit("ticket:error", {
            message: "You are not authorized to access this ticket.",
          });

          return;
        }

        // -------------------------------------------------
        // PUBLIC ROOM
        // -------------------------------------------------

        const room = getTicketRoom(ticketId);

        socket.join(room);

        console.log(`Socket ${socket.id} joined public ticket room ${room}`);

        // -------------------------------------------------
        // PRIVATE AGENT ROOM
        // -------------------------------------------------
        // Customers DO NOT join this room.
        // Agents/admins DO join this room.
        // -------------------------------------------------

        if (role === "agent" || role === "admin") {
          const agentRoom = getAgentTicketRoom(ticketId);

          socket.join(agentRoom);

          console.log(
            `Socket ${socket.id} joined private agent ticket room ${agentRoom}`,
          );
        }

        // -------------------------------------------------
        // JOIN CONFIRMATION
        // -------------------------------------------------

        socket.emit("ticket:joined", {
          ticketId,
          room,
          agentRoom:
            role === "agent" || role === "admin"
              ? getAgentTicketRoom(ticketId)
              : null,
        });

        // -------------------------------------------------
        // USER ONLINE
        // -------------------------------------------------

        socket.to(room).emit("ticket:user-online", {
          ticketId,
          userId,
          role,
        });
      } catch (error) {
        console.error("TICKET JOIN ERROR:", error);

        socket.emit("ticket:error", {
          message: "Failed to join ticket.",
        });
      }
    });

    // =====================================================
    // LEAVE TICKET
    // =====================================================

    socket.on("ticket:leave", ({ ticketId }) => {
      if (!ticketId) {
        return;
      }

      // Leave public room
      const room = getTicketRoom(ticketId);

      socket.leave(room);

      socket.to(room).emit("ticket:user-offline", {
        ticketId,
        userId,
        role,
      });

      // Leave private agent room if applicable
      if (role === "agent" || role === "admin") {
        const agentRoom = getAgentTicketRoom(ticketId);

        socket.leave(agentRoom);

        console.log(
          `Socket ${socket.id} left private agent ticket room ${agentRoom}`,
        );
      }

      console.log(`Socket ${socket.id} left public ticket room ${room}`);
    });

    // =====================================================
    // TYPING START
    // =====================================================

    socket.on("ticket:typing:start", ({ ticketId }) => {
      if (!ticketId) {
        return;
      }

      const room = getTicketRoom(ticketId);

      socket.to(room).emit("ticket:typing", {
        ticketId,
        userId,
        role,
        isTyping: true,
      });
    });

    // =====================================================
    // TYPING STOP
    // =====================================================

    socket.on("ticket:typing:stop", ({ ticketId }) => {
      if (!ticketId) {
        return;
      }

      const room = getTicketRoom(ticketId);

      socket.to(room).emit("ticket:typing", {
        ticketId,
        userId,
        role,
        isTyping: false,
      });
    });

    // =====================================================
    // MESSAGE READ
    // =====================================================

    socket.on("ticket:message:read", async ({ ticketId, messageId }) => {
      try {
        if (!ticketId || !messageId) {
          return;
        }

        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
          return;
        }

        if (!canAccessTicket(ticket, socket.user)) {
          return;
        }

        const conversationMessage = ticket.conversation.id(messageId);

        if (!conversationMessage) {
          return;
        }

        // -------------------------------------------------
        // SECURITY:
        // Customers cannot read/mark internal notes.
        // -------------------------------------------------

        if (conversationMessage.isInternal === true && role === "customer") {
          return;
        }

        conversationMessage.isRead = true;

        await ticket.save();

        // -------------------------------------------------
        // INTERNAL MESSAGE READ
        // -------------------------------------------------
        // Internal notes stay inside private agent room.
        // -------------------------------------------------

        if (conversationMessage.isInternal === true) {
          const agentRoom = getAgentTicketRoom(ticketId);

          io.to(agentRoom).emit("ticket:message:read", {
            ticketId,
            messageId,
            userId,
          });

          return;
        }

        // -------------------------------------------------
        // NORMAL PUBLIC MESSAGE READ
        // -------------------------------------------------

        const room = getTicketRoom(ticketId);

        io.to(room).emit("ticket:message:read", {
          ticketId,
          messageId,
          userId,
        });
      } catch (error) {
        console.error("TICKET MESSAGE READ ERROR:", error);
      }
    });

    // =====================================================
    // DISCONNECT
    // =====================================================

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} | Reason: ${reason}`);
    });
  });
};
