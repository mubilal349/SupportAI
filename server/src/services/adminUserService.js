import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";

// ============================================================
// GET USERS
// ============================================================

export const getAdminUsers = async ({
  search = "",
  role = "all",
  status = "all",
  page = 1,
  limit = 10,
}) => {
  const currentPage = Math.max(Number(page) || 1, 1);
  const currentLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const skip = (currentPage - 1) * currentLimit;

  const filter = {};

  // ==========================================================
  // ROLE FILTER
  // ==========================================================

  if (role && ["admin", "agent", "customer"].includes(role)) {
    filter.role = role;
  }

  // ==========================================================
  // STATUS FILTER
  // ==========================================================

  if (status && ["active", "inactive", "suspended"].includes(status)) {
    filter.status = status;
  }

  // ==========================================================
  // SEARCH
  // ==========================================================

  if (search?.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");

    filter.$or = [
      {
        name: searchRegex,
      },
      {
        email: searchRegex,
      },
      {
        phone: searchRegex,
      },
      {
        company: searchRegex,
      },
    ];
  }

  // ==========================================================
  // QUERY
  // ==========================================================

  const [users, totalUsers] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(currentLimit)
      .lean(),

    User.countDocuments(filter),
  ]);

  return {
    users,

    pagination: {
      currentPage,
      limit: currentLimit,
      totalUsers,
      totalPages: Math.ceil(totalUsers / currentLimit),
      hasNextPage: currentPage < Math.ceil(totalUsers / currentLimit),
      hasPreviousPage: currentPage > 1,
    },
  };
};

// ============================================================
// GET USER DETAILS
// ============================================================

export const getAdminUserById = async (userId) => {
  const user = await User.findById(userId).select("-password").lean();

  if (!user) {
    const error = new Error("User not found.");

    error.statusCode = 404;

    throw error;
  }

  return user;
};

// ============================================================
// GET CUSTOMER TICKET HISTORY
// ============================================================

export const getAdminCustomerTickets = async ({
  userId,
  page = 1,
  limit = 10,
}) => {
  const currentPage = Math.max(Number(page) || 1, 1);
  const currentLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);

  const skip = (currentPage - 1) * currentLimit;

  // Make sure the user exists and is a customer.
  const user = await User.findById(userId).select("_id role").lean();

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== "customer") {
    return {
      tickets: [],
      pagination: {
        currentPage,
        limit: currentLimit,
        totalTickets: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  const filter = {
    customer: userId,
  };

  const [tickets, totalTickets] = await Promise.all([
    Ticket.find(filter)
      .select(
        [
          "_id",
          "ticketNumber",
          "subject",
          "description",
          "status",
          "priority",
          "category",
          "assignedAgent",
          "createdAt",
          "updatedAt",
          "statusHistory",
          "satisfaction",
          "customerRating",
          "customerFeedback",
          "ratedAt",
          "conversation",
        ].join(" "),
      )
      .populate("assignedAgent", "name email avatar")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(currentLimit)
      .lean(),

    Ticket.countDocuments(filter),
  ]);

  return {
    tickets,

    pagination: {
      currentPage,
      limit: currentLimit,
      totalTickets,
      totalPages: Math.ceil(totalTickets / currentLimit),
      hasNextPage: currentPage < Math.ceil(totalTickets / currentLimit),
      hasPreviousPage: currentPage > 1,
    },
  };
};

// ============================================================
// GET CUSTOMER ACTIVITY
// ============================================================

export const getAdminCustomerActivity = async ({ userId, limit = 30 }) => {
  const user = await User.findById(userId).select("_id role").lean();

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== "customer") {
    return [];
  }

  const tickets = await Ticket.find({
    customer: userId,
  })
    .select(
      [
        "_id",
        "ticketNumber",
        "subject",
        "status",
        "createdAt",
        "updatedAt",
        "statusHistory",
        "conversation",
        "satisfaction",
        "customerRating",
        "ratedAt",
      ].join(" "),
    )
    .sort({
      createdAt: -1,
    })
    .limit(100)
    .lean();

  const activities = [];

  tickets.forEach((ticket) => {
    // --------------------------------------------------------
    // Ticket created
    // --------------------------------------------------------

    if (ticket.createdAt) {
      activities.push({
        id: `${ticket._id}-created`,
        type: "ticket_created",
        title: "Ticket created",
        description: ticket.subject || "Support ticket created",
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        createdAt: ticket.createdAt,
      });
    }

    // --------------------------------------------------------
    // Status history
    // --------------------------------------------------------

    if (Array.isArray(ticket.statusHistory)) {
      ticket.statusHistory.forEach((history, index) => {
        activities.push({
          id: `${ticket._id}-status-${index}`,
          type: "status_changed",
          title: "Ticket status changed",
          description: history.status
            ? `Status changed to ${history.status}`
            : "Ticket status updated",
          ticketId: ticket._id,
          ticketNumber: ticket.ticketNumber,
          createdAt:
            history.createdAt ||
            history.changedAt ||
            history.timestamp ||
            ticket.updatedAt,
        });
      });
    }

    // --------------------------------------------------------
    // Conversation activity
    // --------------------------------------------------------

    if (Array.isArray(ticket.conversation)) {
      ticket.conversation.forEach((message, index) => {
        const senderRole =
          message.sender?.role || message.senderRole || message.role || "";

        const isCustomer =
          senderRole === "customer" ||
          String(message.senderId || message.userId || "") === String(userId);

        activities.push({
          id: `${ticket._id}-message-${index}`,
          type: isCustomer ? "customer_reply" : "agent_reply",
          title: isCustomer ? "Customer replied" : "Agent replied",
          description:
            message.message ||
            message.content ||
            message.text ||
            "New conversation message",
          ticketId: ticket._id,
          ticketNumber: ticket.ticketNumber,
          createdAt: message.createdAt || message.timestamp || ticket.updatedAt,
        });
      });
    }

    // --------------------------------------------------------
    // Customer rating
    // --------------------------------------------------------

    const rating = ticket.satisfaction?.rating ?? ticket.customerRating;

    if (rating !== undefined && rating !== null) {
      activities.push({
        id: `${ticket._id}-rating`,
        type: "rating_submitted",
        title: "Customer rating submitted",
        description: `Rated ${rating}/5`,
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        createdAt:
          ticket.satisfaction?.submittedAt ||
          ticket.ratedAt ||
          ticket.updatedAt,
        rating,
      });
    }
  });

  return activities
    .filter((activity) => activity.createdAt)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, Number(limit) || 30);
};

// ============================================================
// UPDATE USER
// ============================================================

export const updateAdminUser = async ({ userId, data, currentAdminId }) => {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("User not found.");

    error.statusCode = 404;

    throw error;
  }

  const {
    name,
    email,
    role,
    phone,
    company,
    avatar,
    timezone,
    language,
    theme,
    preferredChannel,
    status,
    availability,
    password,
  } = data;

  // ==========================================================
  // BASIC VALIDATION
  // ==========================================================

  if (name !== undefined) {
    if (!String(name).trim()) {
      const error = new Error("Name is required.");

      error.statusCode = 400;

      throw error;
    }

    user.name = String(name).trim();
  }

  // ==========================================================
  // EMAIL
  // ==========================================================

  if (email !== undefined) {
    const normalizedEmail = String(email).trim().toLowerCase();

    if (!normalizedEmail) {
      const error = new Error("Email is required.");

      error.statusCode = 400;

      throw error;
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: {
        $ne: userId,
      },
    });

    if (existingUser) {
      const error = new Error("Email is already in use.");

      error.statusCode = 409;

      throw error;
    }

    user.email = normalizedEmail;
  }

  // ==========================================================
  // ROLE
  // ==========================================================

  if (role !== undefined) {
    if (!["admin", "agent", "customer"].includes(role)) {
      const error = new Error("Invalid user role.");

      error.statusCode = 400;

      throw error;
    }

    user.role = role;
  }

  // ==========================================================
  // PROFILE
  // ==========================================================

  if (phone !== undefined) {
    user.phone = String(phone).trim();
  }

  if (company !== undefined) {
    user.company = String(company).trim();
  }

  if (avatar !== undefined) {
    user.avatar = String(avatar).trim();
  }

  // ==========================================================
  // PREFERENCES
  // ==========================================================

  if (timezone !== undefined) {
    user.timezone = String(timezone).trim();
  }

  if (language !== undefined) {
    user.language = String(language).trim();
  }

  if (theme !== undefined) {
    if (!["light", "dark", "system"].includes(theme)) {
      const error = new Error("Invalid theme.");

      error.statusCode = 400;

      throw error;
    }

    user.theme = theme;
  }

  if (preferredChannel !== undefined) {
    if (!["chat", "email", "both"].includes(preferredChannel)) {
      const error = new Error("Invalid preferred channel.");

      error.statusCode = 400;

      throw error;
    }

    user.preferredChannel = preferredChannel;
  }

  // ==========================================================
  // ACCOUNT STATUS
  // ==========================================================

  if (status !== undefined) {
    if (!["active", "inactive", "suspended"].includes(status)) {
      const error = new Error("Invalid account status.");

      error.statusCode = 400;

      throw error;
    }

    // Prevent current admin from disabling themselves.

    if (String(user._id) === String(currentAdminId) && status !== "active") {
      const error = new Error(
        "You cannot deactivate or suspend your own admin account.",
      );

      error.statusCode = 400;

      throw error;
    }

    user.status = status;
  }

  // ==========================================================
  // AVAILABILITY
  // ==========================================================

  if (availability !== undefined) {
    if (!["online", "away", "busy", "offline"].includes(availability)) {
      const error = new Error("Invalid availability status.");

      error.statusCode = 400;

      throw error;
    }

    user.availability = availability;
  }

  // ==========================================================
  // PASSWORD
  // ==========================================================

  if (password !== undefined) {
    if (String(password).length < 6) {
      const error = new Error("Password must be at least 6 characters.");

      error.statusCode = 400;

      throw error;
    }

    user.password = await bcrypt.hash(String(password), 10);
  }

  await user.save();

  return User.findById(userId).select("-password").lean();
};

// ============================================================
// UPDATE USER STATUS
// ============================================================

export const updateAdminUserStatus = async ({
  userId,
  status,
  currentAdminId,
}) => {
  if (!["active", "inactive", "suspended"].includes(status)) {
    const error = new Error("Invalid account status.");

    error.statusCode = 400;

    throw error;
  }

  if (String(userId) === String(currentAdminId)) {
    const error = new Error(
      "You cannot change the status of your own admin account.",
    );

    error.statusCode = 400;

    throw error;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      status,
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .select("-password")
    .lean();

  if (!user) {
    const error = new Error("User not found.");

    error.statusCode = 404;

    throw error;
  }

  return user;
};

// ============================================================
// DELETE USER
// ============================================================

export const deleteAdminUser = async ({ userId, currentAdminId }) => {
  if (String(userId) === String(currentAdminId)) {
    const error = new Error("You cannot delete your own account.");

    error.statusCode = 400;

    throw error;
  }

  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("User not found.");

    error.statusCode = 404;

    throw error;
  }

  await User.findByIdAndDelete(userId);

  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
};

// ============================================================
// USER STATISTICS
// ============================================================

export const getAdminUserStats = async () => {
  const [
    totalUsers,
    totalCustomers,
    totalAgents,
    totalAdmins,
    activeUsers,
    inactiveUsers,
    suspendedUsers,
  ] = await Promise.all([
    User.countDocuments(),

    User.countDocuments({
      role: "customer",
    }),

    User.countDocuments({
      role: "agent",
    }),

    User.countDocuments({
      role: "admin",
    }),

    User.countDocuments({
      status: "active",
    }),

    User.countDocuments({
      status: "inactive",
    }),

    User.countDocuments({
      status: "suspended",
    }),
  ]);

  return {
    totalUsers,
    totalCustomers,
    totalAgents,
    totalAdmins,
    activeUsers,
    inactiveUsers,
    suspendedUsers,
  };
};
