import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

import {
  getAdminAgents,
  getAdminAgentById,
  updateAdminAgent,
  updateAdminAgentStatus,
  updateAdminAgentAvailability,
} from "../services/adminAgentService.js";

import { createAuditLog } from "../services/auditLogService.js";

// ============================================================
// GET ALL AGENTS
// ============================================================

export const getAgents = async (req, res) => {
  try {
    const { search = "", status = "", availability = "" } = req.query;

    const agents = await getAdminAgents({
      search,
      status,
      availability,
    });

    return res.status(200).json({
      success: true,
      agents,
    });
  } catch (error) {
    console.error("ADMIN GET AGENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load agents.",
    });
  }
};

// ============================================================
// GET AGENT BY ID
// ============================================================

export const getAgent = async (req, res) => {
  try {
    const { agentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid agent ID.",
      });
    }

    const agent = await getAdminAgentById(agentId);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found.",
      });
    }

    return res.status(200).json({
      success: true,
      agent,
    });
  } catch (error) {
    console.error("ADMIN GET AGENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load agent.",
    });
  }
};

// ============================================================
// CREATE AGENT
// ============================================================

export const createAdminAgent = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      status = "active",
      availability = "offline",
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const allowedStatuses = ["active", "inactive", "suspended"];

    const allowedAvailability = ["online", "away", "busy", "offline"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid agent status.",
      });
    }

    if (!allowedAvailability.includes(availability)) {
      return res.status(400).json({
        success: false,
        message: "Invalid agent availability.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const agent = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "agent",
      status,
      availability: status === "active" ? availability : "offline",
    });

    const agentResponse = agent.toObject();

    delete agentResponse.password;

    // ============================================================
    // AUDIT LOG
    // ============================================================

    await createAuditLog({
      req,
      action: "AGENT_CREATED",

      resource: {
        type: "agent",
        id: agent._id,
      },

      description: `Created agent "${agent.name}"`,

      metadata: {
        agentId: agent._id,
        name: agent.name,
        email: agent.email,
        status: agent.status,
        availability: agent.availability,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Agent created successfully.",
      agent: agentResponse,
    });
  } catch (error) {
    console.error("ADMIN CREATE AGENT ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create agent.",
    });
  }
};

// ============================================================
// UPDATE AGENT
// ============================================================

export const updateAgent = async (req, res) => {
  try {
    const { agentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid agent ID.",
      });
    }

    const allowedStatuses = ["active", "inactive", "suspended"];

    const allowedAvailability = ["online", "away", "busy", "offline"];

    const {
      name,
      email,
      phone,
      company,
      timezone,
      language,
      status,
      availability,
    } = req.body;

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid agent status.",
      });
    }

    if (availability && !allowedAvailability.includes(availability)) {
      return res.status(400).json({
        success: false,
        message: "Invalid agent availability.",
      });
    }

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: agentId },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "A user with this email already exists.",
        });
      }
    }

    // ============================================================
    // GET CURRENT AGENT BEFORE UPDATE
    // ============================================================

    const existingAgent = await User.findById(agentId).select(
      "name email phone company timezone language status availability role",
    );

    if (!existingAgent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found.",
      });
    }

    const updatedAgent = await updateAdminAgent(agentId, {
      name,
      email: email?.trim().toLowerCase(),
      phone,
      company,
      timezone,
      language,
      status,
      availability,
    });

    if (!updatedAgent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found.",
      });
    }

    // ============================================================
    // DETECT CHANGED FIELDS
    // ============================================================

    const changedFields = [];

    const fieldsToCheck = [
      "name",
      "email",
      "phone",
      "company",
      "timezone",
      "language",
      "status",
      "availability",
    ];

    for (const field of fieldsToCheck) {
      if (
        req.body[field] !== undefined &&
        String(existingAgent[field] ?? "") !== String(updatedAgent[field] ?? "")
      ) {
        changedFields.push(field);
      }
    }

    // ============================================================
    // AUDIT LOG
    // ============================================================

    await createAuditLog({
      req,
      action: "AGENT_UPDATED",

      resource: {
        type: "agent",
        id: updatedAgent._id,
      },

      description: `Updated agent "${updatedAgent.name}"`,

      metadata: {
        agentId: updatedAgent._id,
        changedFields,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Agent updated successfully.",
      agent: updatedAgent,
    });
  } catch (error) {
    console.error("ADMIN UPDATE AGENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update agent.",
    });
  }
};

// ============================================================
// UPDATE AGENT STATUS
// ============================================================

export const updateAgentStatus = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid agent ID.",
      });
    }

    const allowedStatuses = ["active", "inactive", "suspended"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid agent status.",
      });
    }

    // ============================================================
    // GET CURRENT STATUS
    // ============================================================

    const existingAgent = await User.findById(agentId).select("name status");

    if (!existingAgent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found.",
      });
    }

    const previousStatus = existingAgent.status;

    const agent = await updateAdminAgentStatus(agentId, status);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found.",
      });
    }

    // ============================================================
    // AUDIT LOG
    // ============================================================

    await createAuditLog({
      req,
      action: "AGENT_STATUS_CHANGED",

      resource: {
        type: "agent",
        id: agent._id,
      },

      description: `Changed agent "${agent.name}" status from "${previousStatus}" to "${status}"`,

      metadata: {
        agentId: agent._id,
        previousStatus,
        newStatus: status,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Agent status updated successfully.",
      agent,
    });
  } catch (error) {
    console.error("ADMIN UPDATE AGENT STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update agent status.",
    });
  }
};

// ============================================================
// UPDATE AGENT AVAILABILITY
// ============================================================

export const updateAgentAvailability = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { availability } = req.body;

    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid agent ID.",
      });
    }

    const allowedAvailability = ["online", "away", "busy", "offline"];

    if (!allowedAvailability.includes(availability)) {
      return res.status(400).json({
        success: false,
        message: "Invalid agent availability.",
      });
    }

    // ============================================================
    // GET CURRENT AVAILABILITY
    // ============================================================

    const existingAgent =
      await User.findById(agentId).select("name availability");

    if (!existingAgent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found.",
      });
    }

    const previousAvailability = existingAgent.availability;

    const agent = await updateAdminAgentAvailability(agentId, availability);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found.",
      });
    }

    // ============================================================
    // AUDIT LOG
    // ============================================================

    await createAuditLog({
      req,
      action: "AGENT_AVAILABILITY_CHANGED",

      resource: {
        type: "agent",
        id: agent._id,
      },

      description: `Changed agent "${agent.name}" availability from "${previousAvailability}" to "${availability}"`,

      metadata: {
        agentId: agent._id,
        previousAvailability,
        newAvailability: availability,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Agent availability updated successfully.",
      agent,
    });
  } catch (error) {
    console.error("ADMIN UPDATE AGENT AVAILABILITY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update agent availability.",
    });
  }
};
