import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileQuestion,
  LifeBuoy,
  MessageCircle,
  Search,
  Shield,
  Sparkles,
  Ticket,
  User,
  X,
  Zap,
  CreditCard,
  ThumbsDown,
  ThumbsUp,
  Eye,
  Clock3,
  Loader2,
  Video,
  ExternalLink,
  Lightbulb,
} from "lucide-react";

import {
  getAllKnowledgeBaseArticles,
  searchKnowledgeBase,
} from "../../../services/adminKnowledgeBaseService.js";

const KnowledgeBase = () => {
  // =========================================================
  // STATE
  // =========================================================

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [expandedFaq, setExpandedFaq] = useState(null);

  // =========================================================
  // CATEGORIES
  // =========================================================

  const categories = [
    {
      id: "account",
      title: "Account & Security",
      description: "Manage your profile, password and account access.",
      icon: User,
      color: "blue",
    },
    {
      id: "billing",
      title: "Billing & Payments",
      description: "Find answers about invoices, payments and subscriptions.",
      icon: CreditCard,
      color: "purple",
    },
    {
      id: "ai",
      title: "AI Support",
      description: "Learn how to use SupportAI and get better answers.",
      icon: Bot,
      color: "emerald",
    },
    {
      id: "tickets",
      title: "Tickets",
      description: "Create, manage and track your support tickets.",
      icon: Ticket,
      color: "amber",
    },
    {
      id: "getting-started",
      title: "Getting Started",
      description: "Everything you need to get started with SupportAI.",
      icon: Zap,
      color: "cyan",
    },
    {
      id: "security",
      title: "Security & Privacy",
      description: "Learn how we protect your information and privacy.",
      icon: Shield,
      color: "rose",
    },
  ];

  // =========================================================
  // LOAD KNOWLEDGE BASE ARTICLES
  // =========================================================

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = searchQuery.trim()
        ? await searchKnowledgeBase(searchQuery)
        : await getAllKnowledgeBaseArticles();

      const loadedArticles = Array.isArray(response?.articles)
        ? response.articles
        : [];

      setArticles(loadedArticles);
    } catch (err) {
      console.error("Customer Knowledge Base error:", err);

      setError(err.message || "Failed to load Knowledge Base articles.");

      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // =========================================================
  // LOAD / SEARCH
  // =========================================================

  useEffect(() => {
    const timer = setTimeout(
      () => {
        loadArticles();
      },
      searchQuery.trim() ? 350 : 0,
    );

    return () => clearTimeout(timer);
  }, [searchQuery, loadArticles]);

  // =========================================================
  // CATEGORY HELPERS
  // =========================================================

  const getCategoryId = (categoryName) => {
    const normalized = String(categoryName || "")
      .trim()
      .toLowerCase();

    const matchingCategory = categories.find(
      (category) =>
        category.title.toLowerCase() === normalized ||
        category.id === normalized,
    );

    if (matchingCategory) {
      return matchingCategory.id;
    }

    return normalized.replace(/\s+/g, "-");
  };

  const getCategoryConfig = (categoryName) => {
    const categoryId = getCategoryId(categoryName);

    return (
      categories.find((category) => category.id === categoryId) || {
        id: categoryId,
        title: categoryName || "General",
        description: "Helpful SupportAI resources.",
        icon: BookOpen,
        color: "blue",
      }
    );
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "Recently updated";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Recently updated";
    }

    return parsedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // =========================================================
  // ESTIMATED READ TIME
  // =========================================================

  const getReadTime = (article) => {
    const text = [article?.title, article?.content, article?.solution]
      .filter(Boolean)
      .join(" ");

    const words = text.trim().split(/\s+/).filter(Boolean).length;

    if (!words) {
      return "1 min read";
    }

    return `${Math.max(1, Math.ceil(words / 200))} min read`;
  };

  // =========================================================
  // YOUTUBE HELPERS
  // =========================================================

  const getYouTubeVideoId = (url) => {
    if (!url) return null;

    try {
      const parsedUrl = new URL(url);

      const hostname = parsedUrl.hostname.toLowerCase();

      // youtube.com/watch?v=VIDEO_ID
      if (
        hostname === "youtube.com" ||
        hostname === "www.youtube.com" ||
        hostname === "m.youtube.com"
      ) {
        const watchId = parsedUrl.searchParams.get("v");

        if (watchId) {
          return watchId;
        }

        // youtube.com/shorts/VIDEO_ID
        const shortsMatch = parsedUrl.pathname.match(/^\/shorts\/([^/?]+)/);

        if (shortsMatch) {
          return shortsMatch[1];
        }

        // youtube.com/embed/VIDEO_ID
        const embedMatch = parsedUrl.pathname.match(/^\/embed\/([^/?]+)/);

        if (embedMatch) {
          return embedMatch[1];
        }
      }

      // youtu.be/VIDEO_ID
      if (hostname === "youtu.be") {
        const videoId = parsedUrl.pathname.replace("/", "").split("/")[0];

        return videoId || null;
      }

      return null;
    } catch {
      return null;
    }
  };

  // =========================================================
  // NORMALIZE ARTICLES
  // =========================================================

  const normalizedArticles = useMemo(() => {
    return articles.map((article) => {
      const categoryConfig = getCategoryConfig(article.category);

      const contentArray = Array.isArray(article.content)
        ? article.content
        : String(article.content || "")
            .split(/\n+/)
            .map((item) => item.trim())
            .filter(Boolean);

      return {
        ...article,
        id: article._id,
        categoryId: categoryConfig.id,
        category: article.category || "General",
        description:
          article.description ||
          contentArray[0] ||
          "Read this Knowledge Base article to learn more.",
        content: contentArray,
        solution: article.solution || "",
        tags: Array.isArray(article.tags) ? article.tags : [],
        views: article.views || 0,
        readTime: getReadTime(article),
        updated: formatDate(article.updatedAt || article.createdAt),
        icon: categoryConfig.icon,
        solutionVideoUrl: article.solutionVideoUrl || "",
      };
    });
  }, [articles]);

  // =========================================================
  // FILTERED ARTICLES
  // =========================================================

  const filteredArticles = useMemo(() => {
    return normalizedArticles.filter((article) => {
      if (selectedCategory === "All") {
        return true;
      }

      return article.categoryId === selectedCategory;
    });
  }, [normalizedArticles, selectedCategory]);

  // =========================================================
  // AVAILABLE CATEGORY COUNTS
  // =========================================================

  const articleCategoryCounts = useMemo(() => {
    const counts = {};

    normalizedArticles.forEach((article) => {
      counts[article.categoryId] = (counts[article.categoryId] || 0) + 1;
    });

    return counts;
  }, [normalizedArticles]);

  // =========================================================
  // FAQ
  // =========================================================

  const faqs = [
    {
      id: 1,
      question: "How does SupportAI help me?",
      answer:
        "SupportAI uses AI to understand your support question and provide a relevant answer based on the available knowledge base. You can ask questions, troubleshoot common issues, and get help without waiting for a support agent.",
    },
    {
      id: 2,
      question: "What should I do if SupportAI cannot solve my issue?",
      answer:
        "If SupportAI cannot resolve your issue, you can request human assistance through the AI support chat or create a support ticket. Your conversation and issue details can help the support team understand your problem faster.",
    },
    {
      id: 3,
      question: "How do I create a support ticket?",
      answer:
        "Open My Tickets from the customer dashboard and select Create Ticket. Enter a clear subject and detailed description of your issue. You can also attach relevant files or screenshots before submitting the ticket.",
    },
    {
      id: 4,
      question: "Where can I see my support tickets?",
      answer:
        "Open My Tickets from the sidebar to view all your support tickets. You can check ticket subjects, statuses, creation dates, assigned support agents, and open a ticket to view its complete conversation.",
    },
    {
      id: 5,
      question: "What do the different ticket statuses mean?",
      answer:
        "Open means your ticket has been created and is waiting for support. In Progress means a support agent is actively working on it. Resolved means the issue has been addressed. Closed means the ticket has been completed and is no longer active.",
    },
    {
      id: 6,
      question: "Can I communicate with a human support agent?",
      answer:
        "Yes. If you need assistance from a human agent, you can request human support from the AI chat or create a support ticket. Once an agent responds, you can continue the conversation through the ticket.",
    },
    {
      id: 7,
      question: "Where can I find my previous AI conversations?",
      answer:
        "Open the Conversations or AI Support section from your customer dashboard. Your previous AI conversations are available there so you can review earlier questions and answers.",
    },
    {
      id: 8,
      question: "Can I attach files to a support ticket?",
      answer:
        "Yes. SupportAI allows you to attach supported files when creating or responding to a support ticket. Screenshots, documents, and other relevant files can help the support team understand and resolve your issue more effectively.",
    },
    {
      id: 9,
      question: "Can I add files to my ticket after creating it?",
      answer:
        "If attachments are supported for your ticket conversation, you can add relevant files while responding to the ticket. Make sure the files are related to the issue and meet the supported file type and size requirements.",
    },
    {
      id: 10,
      question: "How will I know when someone responds to my ticket?",
      answer:
        "SupportAI can notify you when there is an important update to your support ticket. Open the Notifications section to review new ticket responses, status changes, and other support updates.",
    },
    {
      id: 11,
      question: "How can I update my profile information?",
      answer:
        "Open Profile from the customer dashboard. You can manage available account information such as your name, email, phone number, company, timezone, language, and profile picture.",
    },
    {
      id: 12,
      question: "How can I change my password?",
      answer:
        "Open your Profile settings and use the Change Password option. Enter your current password and your new password, then save the changes.",
    },
    {
      id: 13,
      question: "Can I rate my support experience?",
      answer:
        "Yes. After a ticket has been resolved or closed, you may be able to provide a rating and feedback about your support experience. Your feedback helps improve the quality of customer support.",
    },
    {
      id: 14,
      question: "Can I search for answers instead of creating a ticket?",
      answer:
        "Yes. Use the Knowledge Base search to find articles and frequently asked questions related to your issue. Searching the Knowledge Base can help you find an answer quickly without creating a support ticket.",
    },
    {
      id: 15,
      question: "What should I include when reporting an issue?",
      answer:
        "Provide a clear description of the problem, what you were trying to do, what happened, and any error messages you received. Adding screenshots or relevant files can also help the support team diagnose the issue faster.",
    },
  ];

  // =========================================================
  // FILTER FAQ
  // =========================================================

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return faqs;
    }

    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  // =========================================================
  // COLOR HELPERS
  // =========================================================

  const getCategoryColors = (color) => {
    const colors = {
      blue: {
        box: "bg-blue-500/10",
        text: "text-blue-400",
        border: "hover:border-blue-500/30",
      },
      purple: {
        box: "bg-purple-500/10",
        text: "text-purple-400",
        border: "hover:border-purple-500/30",
      },
      emerald: {
        box: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "hover:border-emerald-500/30",
      },
      amber: {
        box: "bg-amber-500/10",
        text: "text-amber-400",
        border: "hover:border-amber-500/30",
      },
      cyan: {
        box: "bg-cyan-500/10",
        text: "text-cyan-400",
        border: "hover:border-cyan-500/30",
      },
      rose: {
        box: "bg-rose-500/10",
        text: "text-rose-400",
        border: "hover:border-rose-500/30",
      },
    };

    return colors[color] || colors.blue;
  };

  // =========================================================
  // HANDLERS
  // =========================================================

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);

    if (categoryId === "All") {
      return;
    }

    window.scrollTo({
      top: 650,
      behavior: "smooth",
    });
  };

  const handleFeedback = (articleId, type) => {
    setFeedback((previous) => ({
      ...previous,
      [articleId]: type,
    }));
  };

  const handleOpenArticle = (article) => {
    setSelectedArticle(article);

    setFeedback((previous) => ({
      ...previous,
      [article.id]: previous[article.id] || null,
    }));
  };

  const handleCloseArticle = () => {
    setSelectedArticle(null);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedCategory("All");
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-[#050b18] text-white">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#050b18]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-[1500px] items-center justify-between gap-4 px-5 sm:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 shrink-0 text-blue-400" />

              <h1 className="truncate text-lg font-semibold">Knowledge Base</h1>

              <span className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 sm:inline-flex">
                SupportAI
              </span>
            </div>

            <p className="mt-0.5 hidden text-xs text-slate-600 sm:block">
              Find answers and helpful support resources
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/support/chat"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold transition hover:bg-blue-700 sm:px-4"
            >
              <Sparkles className="h-4 w-4" />

              <span className="hidden sm:inline">Ask SupportAI</span>
            </Link>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8 lg:py-10">
        {/* ===================================================
            HERO
        =================================================== */}

        <section className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-[#0b1830] via-[#091426] to-[#07101f]">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

          <div className="relative px-6 py-12 text-center sm:px-10 sm:py-16">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
              <BookOpen className="h-7 w-7 text-blue-400" />
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
              Customer Knowledge Base
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              How can we help you?
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Search articles, browse categories, or find quick answers to
              common SupportAI questions.
            </p>

            {/* Search */}

            <div className="mx-auto mt-8 max-w-2xl">
              <div className="flex items-center rounded-2xl border border-slate-700 bg-[#07101f] px-4 shadow-2xl shadow-black/20 transition focus-within:border-blue-500/50">
                <Search className="h-5 w-5 shrink-0 text-slate-600" />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search articles, guides or questions..."
                  className="w-full bg-transparent px-3 py-4 text-sm text-white outline-none placeholder:text-slate-700"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="rounded-lg px-2 py-1 text-xs text-slate-600 transition hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-600">
                <span>Popular:</span>

                {["password", "ticket", "AI support", "account"].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setSearchQuery(term)}
                    className="rounded-full border border-slate-800 bg-slate-900/60 px-2.5 py-1 transition hover:border-slate-700 hover:text-blue-400"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <section className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
            <div className="flex items-start gap-3">
              <X className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

              <div>
                <p className="text-sm font-semibold text-red-300">
                  Unable to load Knowledge Base
                </p>

                <p className="mt-1 text-xs leading-5 text-red-300/70">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadArticles}
                  className="mt-4 rounded-xl bg-red-500/10 px-4 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/20"
                >
                  Try again
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ===================================================
            SEARCH SUMMARY
        =================================================== */}

        {(searchQuery || selectedCategory !== "All") && (
          <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-[#0a1323] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                {filteredArticles.length}{" "}
                {filteredArticles.length === 1 ? "article" : "articles"} found
              </p>

              <p className="mt-1 text-xs text-slate-600">
                {searchQuery
                  ? `Results for "${searchQuery}"`
                  : "Filtered knowledge base"}
              </p>
            </div>

            <button
              type="button"
              onClick={clearSearch}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-400 transition hover:border-slate-600 hover:text-white"
            >
              Clear filters
            </button>
          </section>
        )}

        {/* ===================================================
            CATEGORIES
        =================================================== */}

        <section className="mt-8">
          <div className="mb-5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-400">
              Browse
            </p>

            <h2 className="mt-2 text-xl font-bold">Explore help categories</h2>

            <p className="mt-1 text-xs text-slate-600">
              Find guides and answers organized by topic.
            </p>
          </div>

          <div className="mb-4">
            <button
              type="button"
              onClick={() => handleCategorySelect("All")}
              className={`rounded-xl border px-4 py-2 text-xs font-medium transition ${
                selectedCategory === "All"
                  ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                  : "border-slate-800 bg-[#0a1323] text-slate-500 hover:border-slate-700 hover:text-white"
              }`}
            >
              All Articles
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => {
              const Icon = category.icon;
              const colors = getCategoryColors(category.color);

              const isSelected = selectedCategory === category.id;

              const count = articleCategoryCounts[category.id] || 0;

              return (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`group rounded-2xl border p-5 text-left transition ${
                    isSelected
                      ? "border-blue-500/40 bg-blue-500/5"
                      : `border-slate-800 bg-[#0a1323] hover:bg-[#0d1728] ${colors.border}`
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors.box} ${colors.text}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <ChevronRight
                      className={`h-4 w-4 text-slate-700 transition group-hover:translate-x-1 ${
                        isSelected ? "text-blue-400" : ""
                      }`}
                    />
                  </div>

                  <h3 className="mt-5 text-sm font-semibold">
                    {category.title}
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    {category.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className={`flex items-center gap-1 text-[10px] font-medium ${colors.text}`}
                    >
                      {isSelected ? "Viewing articles" : "Explore articles"}

                      <ArrowRight className="h-3 w-3" />
                    </span>

                    <span className="text-[10px] text-slate-700">
                      {count} {count === 1 ? "article" : "articles"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ===================================================
            ARTICLES
        =================================================== */}

        <section className="mt-10">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-purple-400">
                Knowledge
              </p>

              <h2 className="mt-2 text-xl font-bold">
                {selectedCategory === "All"
                  ? "Knowledge Base articles"
                  : categories.find((item) => item.id === selectedCategory)
                      ?.title || "Articles"}
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                Helpful resources for common support questions.
              </p>
            </div>

            {!loading && (
              <div className="text-xs text-slate-700">
                {filteredArticles.length} articles
              </div>
            )}
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-800 bg-[#0a1323]">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-blue-400" />

                <p className="text-xs text-slate-600">
                  Loading Knowledge Base...
                </p>
              </div>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-[#0a1323] px-6 py-14 text-center">
              <Search className="mx-auto h-9 w-9 text-slate-700" />

              <p className="mt-4 text-sm font-medium">No articles found</p>

              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-600">
                We couldn't find any published Knowledge Base articles matching
                your search.
              </p>

              <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={clearSearch}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-400 transition hover:border-slate-600 hover:text-white"
                >
                  Clear search
                </button>

                <Link
                  to="/support/chat"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold transition hover:bg-blue-700"
                >
                  <Bot className="h-4 w-4" />
                  Ask SupportAI
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {filteredArticles.map((article) => {
                const Icon = article.icon;

                return (
                  <button
                    type="button"
                    key={article.id}
                    onClick={() => handleOpenArticle(article)}
                    className="group flex items-start gap-4 rounded-2xl border border-slate-800 bg-[#0a1323] p-5 text-left transition hover:border-slate-700 hover:bg-[#0d1728]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-slate-500 transition group-hover:bg-blue-500/10 group-hover:text-blue-400">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <span className="text-[9px] font-medium uppercase tracking-wider text-blue-400">
                            {article.category}
                          </span>

                          <h3 className="mt-1 text-sm font-semibold">
                            {article.title}
                          </h3>
                        </div>

                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-700 transition group-hover:translate-x-1 group-hover:text-slate-400" />
                      </div>

                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
                        {article.description}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-slate-700">
                        {article.views > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {article.views}
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3 w-3" />
                          {article.readTime}
                        </span>

                        {article.solutionVideoUrl && (
                          <span className="inline-flex items-center gap-1 text-purple-400">
                            <Video className="h-3 w-3" />
                            Video
                          </span>
                        )}

                        <span className="ml-auto inline-flex items-center gap-1 text-slate-500 group-hover:text-blue-400">
                          Read article
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ===================================================
            FAQ
        =================================================== */}

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-400">
              FAQ
            </p>

            <h2 className="mt-2 text-xl font-bold">
              Frequently asked questions
            </h2>

            <p className="mt-1 text-xs text-slate-600">
              Quick answers to common customer questions.
            </p>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-[#0a1323] px-6 py-10 text-center">
              <FileQuestion className="mx-auto h-8 w-8 text-slate-700" />

              <p className="mt-4 text-sm font-medium">No matching FAQs</p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {filteredFaqs.map((faq) => {
                const isOpen = expandedFaq === faq.id;

                return (
                  <div
                    key={faq.id}
                    className={`rounded-2xl border bg-[#0a1323] transition ${
                      isOpen ? "border-slate-700" : "border-slate-800"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                      className="flex w-full items-center justify-between gap-4 p-5 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm font-medium">
                        {faq.question}
                      </span>

                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-slate-600 transition ${
                          isOpen ? "rotate-180 text-emerald-400" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-800 px-5 pb-5 pt-4">
                        <p className="text-xs leading-6 text-slate-600">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ===================================================
            SUPPORT CTA
        =================================================== */}

        <section className="relative mt-10 overflow-hidden rounded-3xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <LifeBuoy className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-base font-semibold">Still need help?</h2>

                <p className="mt-1 max-w-xl text-xs leading-5 text-slate-600">
                  SupportAI can answer your question, or you can connect with a
                  human support specialist.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                to="/support/chat"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-semibold transition hover:bg-blue-700"
              >
                <MessageCircle className="h-4 w-4" />
                Ask SupportAI
              </Link>

              <Link
                to="/support/tickets"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
              >
                <Ticket className="h-4 w-4" />
                Create ticket
              </Link>
            </div>
          </div>
        </section>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <footer className="mt-10 border-t border-slate-800/80 pt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-700">
            <Bot className="h-4 w-4" />
            <span>SupportAI Knowledge Center</span>
          </div>

          <p className="mt-2 text-[10px] text-slate-800">
            Find answers faster with AI-powered customer support.
          </p>
        </footer>
      </main>

      {/* =====================================================
          ARTICLE DETAILS MODAL
      ===================================================== */}

      {selectedArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseArticle();
            }
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-[#08111f] shadow-2xl">
            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5 sm:p-6">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  {(() => {
                    const Icon = selectedArticle.icon || BookOpen;

                    return <Icon className="h-5 w-5" />;
                  })()}
                </div>

                <div className="min-w-0">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-blue-400">
                    {selectedArticle.category}
                  </span>

                  <h2 className="mt-1 text-lg font-bold">
                    {selectedArticle.title}
                  </h2>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-600">
                    {selectedArticle.views > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {selectedArticle.views} views
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3 w-3" />
                      {selectedArticle.readTime}
                    </span>

                    <span>Updated {selectedArticle.updated}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseArticle}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 text-slate-500 transition hover:border-slate-700 hover:text-white"
                aria-label="Close article"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* =================================================
                MODAL CONTENT
            ================================================= */}

            <div className="overflow-y-auto p-5 sm:p-7">
              <div className="max-w-2xl">
                {/* DESCRIPTION */}

                <p className="text-sm leading-7 text-slate-400">
                  {selectedArticle.description}
                </p>

                {/* =================================================
                    ARTICLE CONTENT
                ================================================= */}

                <div className="mt-7">
                  <div className="mb-4 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-400" />

                    <h3 className="text-sm font-semibold text-white">
                      Article
                    </h3>
                  </div>

                  <div className="space-y-5">
                    {selectedArticle.content.map((paragraph, index) => (
                      <div
                        key={`${selectedArticle.id}-${index}`}
                        className="flex gap-3"
                      >
                        <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                          <span className="text-[9px] font-bold">
                            {index + 1}
                          </span>
                        </div>

                        <p className="whitespace-pre-line text-sm leading-7 text-slate-500">
                          {paragraph}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* =================================================
                    SOLUTION
                ================================================= */}

                {selectedArticle.solution && (
                  <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-emerald-400" />

                      <h3 className="text-sm font-semibold text-emerald-300">
                        Solution
                      </h3>
                    </div>

                    <div className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-400">
                      {selectedArticle.solution}
                    </div>
                  </div>
                )}

                {/* =================================================
                    SOLUTION VIDEO
                ================================================= */}

                {selectedArticle.solutionVideoUrl?.trim() && (
                  <div className="mt-8 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
                    <div className="flex items-center gap-2">
                      <Video className="h-5 w-5 text-purple-400" />

                      <div>
                        <h3 className="text-sm font-semibold text-purple-300">
                          Video Solution
                        </h3>

                        <p className="mt-1 text-[10px] text-slate-600">
                          Watch this video for a visual walkthrough.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-black">
                      {getYouTubeVideoId(selectedArticle.solutionVideoUrl) ? (
                        <div className="aspect-video w-full">
                          <iframe
                            src={`https://www.youtube.com/embed/${getYouTubeVideoId(
                              selectedArticle.solutionVideoUrl,
                            )}`}
                            title={`Video solution for ${selectedArticle.title}`}
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                          <Video className="h-10 w-10 text-purple-400" />

                          <p className="mt-4 text-sm font-semibold text-white">
                            Video solution available
                          </p>

                          <p className="mt-2 max-w-md text-xs leading-5 text-slate-600">
                            Open the video using the button below.
                          </p>

                          <a
                            href={selectedArticle.solutionVideoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-purple-500"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Watch Video
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* =================================================
                    TAGS
                ================================================= */}

                {selectedArticle.tags.length > 0 && (
                  <div className="mt-7 flex flex-wrap gap-2">
                    {selectedArticle.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-[10px] text-slate-500"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* =================================================
                    FEEDBACK
                ================================================= */}

                <div className="mt-8 rounded-2xl border border-slate-800 bg-[#0a1323] p-5">
                  <div className="text-center">
                    <p className="text-sm font-semibold">
                      Was this article helpful?
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      Your feedback helps us improve our knowledge base.
                    </p>

                    <div className="mt-4 flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleFeedback(selectedArticle.id, "helpful")
                        }
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium transition ${
                          feedback[selectedArticle.id] === "helpful"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-slate-700 text-slate-500 hover:border-slate-600 hover:text-white"
                        }`}
                      >
                        {feedback[selectedArticle.id] === "helpful" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <ThumbsUp className="h-4 w-4" />
                        )}
                        Yes, helpful
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleFeedback(selectedArticle.id, "not-helpful")
                        }
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium transition ${
                          feedback[selectedArticle.id] === "not-helpful"
                            ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                            : "border-slate-700 text-slate-500 hover:border-slate-600 hover:text-white"
                        }`}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        Not helpful
                      </button>
                    </div>

                    {feedback[selectedArticle.id] && (
                      <p className="mt-3 text-[10px] text-emerald-400">
                        Thanks for your feedback.
                      </p>
                    )}
                  </div>
                </div>

                {/* =================================================
                    ARTICLE CTA
                ================================================= */}

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Link
                    to="/support/chat"
                    onClick={handleCloseArticle}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-semibold transition hover:bg-blue-700"
                  >
                    <Bot className="h-4 w-4" />
                    Ask SupportAI
                  </Link>

                  <Link
                    to="/support/tickets"
                    onClick={handleCloseArticle}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
                  >
                    <Ticket className="h-4 w-4" />
                    Create a ticket
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
