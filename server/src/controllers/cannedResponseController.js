import CannedResponse from "../models/CannedResponse.js";

// ==========================================
// GET ALL CANNED RESPONSES
// ==========================================

export const getAllCannedResponses = async (req, res) => {
  try {
    const responses = await CannedResponse.find()
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: responses.length,
      responses,
    });
  } catch (error) {
    console.error("Get canned responses error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch canned responses.",
    });
  }
};

// ==========================================
// GET SINGLE CANNED RESPONSE
// ==========================================

export const getCannedResponse = async (req, res) => {
  try {
    const { id } = req.params;

    const response = await CannedResponse.findById(id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!response) {
      return res.status(404).json({
        success: false,
        message: "Canned response not found.",
      });
    }

    return res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("Get canned response error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch canned response.",
    });
  }
};

// ==========================================
// CREATE CANNED RESPONSE
// ==========================================

export const createCannedResponse = async (req, res) => {
  try {
    const { title, shortcut, category, content, isActive } = req.body;

    // Required fields
    if (!title || !shortcut || !category || !content) {
      return res.status(400).json({
        success: false,
        message: "Title, shortcut, category, and content are required.",
      });
    }

    const normalizedShortcut = shortcut
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

    // Check duplicate shortcut
    const existingResponse = await CannedResponse.findOne({
      shortcut: normalizedShortcut,
    });

    if (existingResponse) {
      return res.status(409).json({
        success: false,
        message: "A canned response with this shortcut already exists.",
      });
    }

    const response = await CannedResponse.create({
      title: title.trim(),
      shortcut: normalizedShortcut,
      category: category.trim(),
      content: content.trim(),
      isActive: typeof isActive === "boolean" ? isActive : true,
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });

    const populatedResponse = await CannedResponse.findById(response._id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    return res.status(201).json({
      success: true,
      message: "Canned response created successfully.",
      response: populatedResponse,
    });
  } catch (error) {
    console.error("Create canned response error:", error);

    // Handle MongoDB duplicate key
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A canned response with this shortcut already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create canned response.",
    });
  }
};

// ==========================================
// UPDATE CANNED RESPONSE
// ==========================================

export const updateCannedResponse = async (req, res) => {
  try {
    const { id } = req.params;

    const { title, shortcut, category, content, isActive } = req.body;

    const response = await CannedResponse.findById(id);

    if (!response) {
      return res.status(404).json({
        success: false,
        message: "Canned response not found.",
      });
    }

    if (title !== undefined) {
      if (!String(title).trim()) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty.",
        });
      }

      response.title = String(title).trim();
    }

    if (shortcut !== undefined) {
      if (!String(shortcut).trim()) {
        return res.status(400).json({
          success: false,
          message: "Shortcut cannot be empty.",
        });
      }

      const normalizedShortcut = String(shortcut)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");

      const duplicate = await CannedResponse.findOne({
        shortcut: normalizedShortcut,
        _id: { $ne: id },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "A canned response with this shortcut already exists.",
        });
      }

      response.shortcut = normalizedShortcut;
    }

    if (category !== undefined) {
      if (!String(category).trim()) {
        return res.status(400).json({
          success: false,
          message: "Category cannot be empty.",
        });
      }

      response.category = String(category).trim();
    }

    if (content !== undefined) {
      if (!String(content).trim()) {
        return res.status(400).json({
          success: false,
          message: "Content cannot be empty.",
        });
      }

      response.content = String(content).trim();
    }

    if (typeof isActive === "boolean") {
      response.isActive = isActive;
    }

    response.updatedBy = req.user?.id || null;

    await response.save();

    const populatedResponse = await CannedResponse.findById(response._id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Canned response updated successfully.",
      response: populatedResponse,
    });
  } catch (error) {
    console.error("Update canned response error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A canned response with this shortcut already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update canned response.",
    });
  }
};

// ==========================================
// DELETE CANNED RESPONSE
// ==========================================

export const deleteCannedResponse = async (req, res) => {
  try {
    const { id } = req.params;

    const response = await CannedResponse.findById(id);

    if (!response) {
      return res.status(404).json({
        success: false,
        message: "Canned response not found.",
      });
    }

    await CannedResponse.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Canned response deleted successfully.",
    });
  } catch (error) {
    console.error("Delete canned response error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete canned response.",
    });
  }
};

// ==========================================
// TOGGLE ACTIVE STATUS
// ==========================================

export const toggleCannedResponseStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const response = await CannedResponse.findById(id);

    if (!response) {
      return res.status(404).json({
        success: false,
        message: "Canned response not found.",
      });
    }

    response.isActive = !response.isActive;
    response.updatedBy = req.user?.id || null;

    await response.save();

    return res.status(200).json({
      success: true,
      message: `Canned response ${
        response.isActive ? "activated" : "deactivated"
      } successfully.`,
      response,
    });
  } catch (error) {
    console.error("Toggle canned response status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update canned response status.",
    });
  }
};
