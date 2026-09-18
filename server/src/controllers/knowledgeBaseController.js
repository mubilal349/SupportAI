import KnowledgeBase from "../models/KnowledgeBase.js";
import { createAuditLog } from "../services/auditLogService.js";

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
    const {
      title,
      category,
      content,
      solution,
      solutionVideoUrl,
      tags,
      isPublished,
    } = req.body;

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

    // Optional video URL
    const videoUrl =
      solutionVideoUrl !== undefined && solutionVideoUrl !== null
        ? String(solutionVideoUrl).trim()
        : "";

    const article = await KnowledgeBase.create({
      title: title.trim(),
      category: category.trim(),
      content: content.trim(),
      solution: solution.trim(),
      solutionVideoUrl: videoUrl,
      tags: Array.isArray(tags) ? tags : [],
      isPublished: typeof isPublished === "boolean" ? isPublished : true,
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });

    // ============================================================
    // AUDIT LOG
    // ============================================================

    await createAuditLog({
      req,
      action: "ARTICLE_CREATED",
      resource: {
        type: "knowledge_base_article",
        id: article._id,
      },
      description: `Created Knowledge Base article "${article.title}".`,
      metadata: {
        articleId: article._id,
        title: article.title,
        category: article.category,
        isPublished: article.isPublished,
        tags: article.tags,
      },
    });

    // If the article is created as published, record publication too.
    if (article.isPublished) {
      await createAuditLog({
        req,
        action: "ARTICLE_PUBLISHED",
        resource: {
          type: "knowledge_base_article",
          id: article._id,
        },
        description: `Published Knowledge Base article "${article.title}".`,
        metadata: {
          articleId: article._id,
          title: article.title,
          category: article.category,
          publicationSource: "article_creation",
        },
      });
    }

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

    const {
      title,
      category,
      content,
      solution,
      solutionVideoUrl,
      tags,
      isPublished,
    } = req.body;

    const article = await KnowledgeBase.findById(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Knowledge Base article not found.",
      });
    }

    // Capture previous values before modifying the document.
    const previousArticle = {
      title: article.title,
      category: article.category,
      content: article.content,
      solution: article.solution,
      solutionVideoUrl: article.solutionVideoUrl,
      tags: article.tags,
      isPublished: article.isPublished,
    };

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

    // Update / remove solution video
    if (solutionVideoUrl !== undefined) {
      article.solutionVideoUrl =
        solutionVideoUrl === null ? "" : String(solutionVideoUrl).trim();
    }

    if (tags !== undefined) {
      article.tags = Array.isArray(tags) ? tags : [];
    }

    if (typeof isPublished === "boolean") {
      article.isPublished = isPublished;
    }

    article.updatedBy = req.user?.id || null;

    await article.save();

    // Determine what changed.
    const changedFields = [];

    if (previousArticle.title !== article.title) {
      changedFields.push("title");
    }

    if (previousArticle.category !== article.category) {
      changedFields.push("category");
    }

    if (previousArticle.content !== article.content) {
      changedFields.push("content");
    }

    if (previousArticle.solution !== article.solution) {
      changedFields.push("solution");
    }

    if (previousArticle.solutionVideoUrl !== article.solutionVideoUrl) {
      changedFields.push("solutionVideoUrl");
    }

    if (
      JSON.stringify(previousArticle.tags || []) !==
      JSON.stringify(article.tags || [])
    ) {
      changedFields.push("tags");
    }

    if (previousArticle.isPublished !== article.isPublished) {
      changedFields.push("isPublished");
    }

    // ============================================================
    // PUBLICATION STATUS AUDIT
    // ============================================================

    if (previousArticle.isPublished !== article.isPublished) {
      await createAuditLog({
        req,
        action: article.isPublished
          ? "ARTICLE_PUBLISHED"
          : "ARTICLE_UNPUBLISHED",
        resource: {
          type: "knowledge_base_article",
          id: article._id,
        },
        description: article.isPublished
          ? `Published Knowledge Base article "${article.title}".`
          : `Unpublished Knowledge Base article "${article.title}".`,
        metadata: {
          articleId: article._id,
          title: article.title,
          category: article.category,
          previousPublishedState: previousArticle.isPublished,
          newPublishedState: article.isPublished,
        },
      });
    }

    // ============================================================
    // ARTICLE UPDATE AUDIT
    // ============================================================

    if (
      changedFields.length > 0 &&
      !(changedFields.length === 1 && changedFields[0] === "isPublished")
    ) {
      await createAuditLog({
        req,
        action: "ARTICLE_UPDATED",
        resource: {
          type: "knowledge_base_article",
          id: article._id,
        },
        description: `Updated Knowledge Base article "${article.title}".`,
        metadata: {
          articleId: article._id,
          title: article.title,
          category: article.category,
          changedFields,
          previousValues: {
            title: previousArticle.title,
            category: previousArticle.category,
            solutionVideoUrl: previousArticle.solutionVideoUrl,
            tags: previousArticle.tags,
            isPublished: previousArticle.isPublished,
          },
          newValues: {
            title: article.title,
            category: article.category,
            solutionVideoUrl: article.solutionVideoUrl,
            tags: article.tags,
            isPublished: article.isPublished,
          },
        },
      });
    }

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

    // Fetch article first so the audit log can retain useful details.
    const article = await KnowledgeBase.findById(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Knowledge Base article not found.",
      });
    }

    await KnowledgeBase.findByIdAndDelete(id);

    // ============================================================
    // AUDIT LOG
    // ============================================================

    await createAuditLog({
      req,
      action: "ARTICLE_DELETED",
      resource: {
        type: "knowledge_base_article",
        id: article._id,
      },
      description: `Deleted Knowledge Base article "${article.title}".`,
      metadata: {
        articleId: article._id,
        title: article.title,
        category: article.category,
        isPublished: article.isPublished,
        tags: article.tags,
      },
    });

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
