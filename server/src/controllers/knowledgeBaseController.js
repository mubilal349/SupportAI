import KnowledgeBase from "../models/KnowledgeBase.js";

// ============================================================
// GET ALL ARTICLES
// ============================================================

export const getAllKnowledgeBaseArticles = async (req, res) => {
  try {
    const articles = await KnowledgeBase.find({
      isPublished: true,
    })
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error("Get Knowledge Base articles error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load Knowledge Base articles.",
    });
  }
};

// ============================================================
// SEARCH ARTICLES
// ============================================================

export const searchKnowledgeBase = async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();

    if (!query) {
      const articles = await KnowledgeBase.find({
        isPublished: true,
      })
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean();

      return res.status(200).json({
        success: true,
        count: articles.length,
        articles,
      });
    }

    const searchWords = query
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(Boolean);

    const regexConditions = searchWords.map((word) => ({
      $or: [
        {
          title: {
            $regex: word,
            $options: "i",
          },
        },
        {
          category: {
            $regex: word,
            $options: "i",
          },
        },
        {
          content: {
            $regex: word,
            $options: "i",
          },
        },
        {
          solution: {
            $regex: word,
            $options: "i",
          },
        },
        {
          tags: {
            $regex: word,
            $options: "i",
          },
        },
      ],
    }));

    const articles = await KnowledgeBase.find({
      isPublished: true,
      $and: regexConditions,
    })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({
      success: true,
      query,
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error("Search Knowledge Base error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search Knowledge Base.",
    });
  }
};

// ============================================================
// GET SINGLE ARTICLE
// ============================================================

export const getKnowledgeBaseArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await KnowledgeBase.findOne({
      _id: id,
      isPublished: true,
    }).lean();

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Knowledge Base article not found.",
      });
    }

    return res.status(200).json({
      success: true,
      article,
    });
  } catch (error) {
    console.error("Get Knowledge Base article error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load Knowledge Base article.",
    });
  }
};

// ============================================================
// CREATE ARTICLE
// ============================================================

export const createKnowledgeBaseArticle = async (req, res) => {
  try {
    const { title, category, content, solution, tags, isPublished } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required.",
      });
    }

    if (!category?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category is required.",
      });
    }

    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Article content is required.",
      });
    }

    if (!solution?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Solution is required.",
      });
    }

    const article = await KnowledgeBase.create({
      title: title.trim(),
      category: category.trim(),
      content: content.trim(),
      solution: solution.trim(),
      tags: Array.isArray(tags) ? tags : [],
      isPublished: typeof isPublished === "boolean" ? isPublished : true,
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Knowledge Base article created.",
      article,
    });
  } catch (error) {
    console.error("Create Knowledge Base article error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create Knowledge Base article.",
    });
  }
};

// ============================================================
// UPDATE ARTICLE
// ============================================================

export const updateKnowledgeBaseArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const { title, category, content, solution, tags, isPublished } = req.body;

    const article = await KnowledgeBase.findById(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Knowledge Base article not found.",
      });
    }

    if (title !== undefined) {
      if (!String(title).trim()) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty.",
        });
      }

      article.title = String(title).trim();
    }

    if (category !== undefined) {
      if (!String(category).trim()) {
        return res.status(400).json({
          success: false,
          message: "Category cannot be empty.",
        });
      }

      article.category = String(category).trim();
    }

    if (content !== undefined) {
      if (!String(content).trim()) {
        return res.status(400).json({
          success: false,
          message: "Content cannot be empty.",
        });
      }

      article.content = String(content).trim();
    }

    if (solution !== undefined) {
      if (!String(solution).trim()) {
        return res.status(400).json({
          success: false,
          message: "Solution cannot be empty.",
        });
      }

      article.solution = String(solution).trim();
    }

    if (tags !== undefined) {
      article.tags = Array.isArray(tags) ? tags : [];
    }

    if (typeof isPublished === "boolean") {
      article.isPublished = isPublished;
    }

    article.updatedBy = req.user?.id || null;

    await article.save();

    return res.status(200).json({
      success: true,
      message: "Knowledge Base article updated.",
      article,
    });
  } catch (error) {
    console.error("Update Knowledge Base article error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update Knowledge Base article.",
    });
  }
};

// ============================================================
// DELETE ARTICLE
// ============================================================

export const deleteKnowledgeBaseArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await KnowledgeBase.findByIdAndDelete(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Knowledge Base article not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Knowledge Base article deleted.",
    });
  } catch (error) {
    console.error("Delete Knowledge Base article error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete Knowledge Base article.",
    });
  }
};
