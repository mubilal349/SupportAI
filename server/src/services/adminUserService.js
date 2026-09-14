import bcrypt from "bcryptjs";
import User from "../models/User.js";

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
