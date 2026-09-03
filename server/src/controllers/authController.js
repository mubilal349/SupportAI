import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

/* =========================================================
   REGISTER
========================================================= */

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "customer",
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || null,
        phone: user.phone || "",
        company: user.company || "",
        timezone: user.timezone || "Asia/Karachi",
        language: user.language || "English",
        theme: user.theme || "dark",
        preferredChannel: user.preferredChannel || "chat",

        notificationPreferences: {
          email: user.notificationPreferences?.email ?? true,
          ticketUpdates: user.notificationPreferences?.ticketUpdates ?? true,
          newMessages: user.notificationPreferences?.newMessages ?? true,
          ticketResolved: user.notificationPreferences?.ticketResolved ?? true,
        },

        aiSupport: {
          enabled: user.aiSupport?.enabled ?? true,
          allowAutoResponse: user.aiSupport?.allowAutoResponse ?? true,
        },
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during registration.",
    });
  }
};

/* =========================================================
   LOGIN
========================================================= */

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    user.lastSeen = new Date();

    await user.save();

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || null,
        phone: user.phone || "",
        company: user.company || "",
        timezone: user.timezone || "Asia/Karachi",
        language: user.language || "English",
        theme: user.theme || "dark",
        preferredChannel: user.preferredChannel || "chat",

        notificationPreferences: {
          email: user.notificationPreferences?.email ?? true,
          ticketUpdates: user.notificationPreferences?.ticketUpdates ?? true,
          newMessages: user.notificationPreferences?.newMessages ?? true,
          ticketResolved: user.notificationPreferences?.ticketResolved ?? true,
        },

        aiSupport: {
          enabled: user.aiSupport?.enabled ?? true,
          allowAutoResponse: user.aiSupport?.allowAutoResponse ?? true,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
};

/* =========================================================
   GET PROFILE
========================================================= */

export const getProfile = async (req, res) => {
  try {
    console.log("========== PROFILE DEBUG ==========");
    console.log("Authenticated user:", req.user);
    console.log("User ID:", req.user?.id);

    const user = await User.findById(req.user.id);

    console.log("MongoDB user:", user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
        debugId: req.user.id,
      });
    }

    return res.status(200).json({
      success: true,
      user: user.toObject({
        transform: (_, ret) => {
          delete ret.password;
          return ret;
        },
      }),
    });
  } catch (error) {
    console.error("Profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load profile.",
    });
  }
};

/* =========================================================
   UPDATE PROFILE & CUSTOMER PREFERENCES
========================================================= */

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const {
      name,
      email,
      phone,
      company,
      timezone,
      language,
      theme,
      preferredChannel,
      notificationPreferences,
      aiSupport,
    } = req.body;

    /* ---------------------------------------------
       UPDATE PROFILE INFORMATION
    --------------------------------------------- */

    if (name !== undefined) {
      const cleanName = String(name).trim();

      if (!cleanName) {
        return res.status(400).json({
          success: false,
          message: "Name is required.",
        });
      }

      user.name = cleanName;
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).toLowerCase().trim();

      if (!normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: "Email address is required.",
        });
      }

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email address is already in use.",
        });
      }

      user.email = normalizedEmail;
    }

    if (phone !== undefined) {
      user.phone = String(phone).trim();
    }

    if (company !== undefined) {
      user.company = String(company).trim();
    }

    /* ---------------------------------------------
       LANGUAGE & TIMEZONE
    --------------------------------------------- */

    if (timezone !== undefined) {
      user.timezone = String(timezone).trim();
    }

    if (language !== undefined) {
      user.language = String(language).trim();
    }

    /* ---------------------------------------------
       THEME
    --------------------------------------------- */

    if (theme !== undefined) {
      const allowedThemes = ["light", "dark", "system"];

      if (!allowedThemes.includes(theme)) {
        return res.status(400).json({
          success: false,
          message: "Invalid theme. Allowed values: light, dark, system.",
        });
      }

      user.theme = theme;
    }

    /* ---------------------------------------------
       PREFERRED SUPPORT CHANNEL
    --------------------------------------------- */

    if (preferredChannel !== undefined) {
      const allowedChannels = ["chat", "email", "both"];

      if (!allowedChannels.includes(preferredChannel)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid preferred channel. Allowed values: chat, email, both.",
        });
      }

      user.preferredChannel = preferredChannel;
    }

    /* ---------------------------------------------
       NOTIFICATION PREFERENCES
    --------------------------------------------- */

    if (notificationPreferences !== undefined) {
      if (
        typeof notificationPreferences !== "object" ||
        Array.isArray(notificationPreferences)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid notification preferences.",
        });
      }

      if (!user.notificationPreferences) {
        user.notificationPreferences = {};
      }

      if (notificationPreferences.email !== undefined) {
        user.notificationPreferences.email = Boolean(
          notificationPreferences.email,
        );
      }

      if (notificationPreferences.ticketUpdates !== undefined) {
        user.notificationPreferences.ticketUpdates = Boolean(
          notificationPreferences.ticketUpdates,
        );
      }

      if (notificationPreferences.newMessages !== undefined) {
        user.notificationPreferences.newMessages = Boolean(
          notificationPreferences.newMessages,
        );
      }

      if (notificationPreferences.ticketResolved !== undefined) {
        user.notificationPreferences.ticketResolved = Boolean(
          notificationPreferences.ticketResolved,
        );
      }
    }

    /* ---------------------------------------------
       AI SUPPORT PREFERENCES
    --------------------------------------------- */

    if (aiSupport !== undefined) {
      if (typeof aiSupport !== "object" || Array.isArray(aiSupport)) {
        return res.status(400).json({
          success: false,
          message: "Invalid AI support preferences.",
        });
      }

      if (!user.aiSupport) {
        user.aiSupport = {};
      }

      if (aiSupport.enabled !== undefined) {
        user.aiSupport.enabled = Boolean(aiSupport.enabled);
      }

      if (aiSupport.allowAutoResponse !== undefined) {
        user.aiSupport.allowAutoResponse = Boolean(aiSupport.allowAutoResponse);
      }
    }

    /* ---------------------------------------------
       UPDATE AVATAR
    --------------------------------------------- */

    if (req.file) {
      user.avatar = `/avatars/${req.file.filename}`;
    }

    /* ---------------------------------------------
       SAVE
    --------------------------------------------- */

    await user.save();

    /* ---------------------------------------------
       RETURN UPDATED USER
    --------------------------------------------- */

    const updatedUser = await User.findById(user._id).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile and preferences updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/* =========================================================
   CHANGE PASSWORD
========================================================= */

export const changePassword = async (req, res) => {
  try {
    const { current, newPassword } = req.body;

    if (!current || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isValid = await bcrypt.compare(current, user.password);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to change password.",
    });
  }
};
