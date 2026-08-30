import {
  ArrowRight,
  BookOpen,
  Bot,
  ChevronRight,
  FileQuestion,
  LifeBuoy,
  MessageCircle,
  Search,
  Shield,
  Sparkles,
  Ticket,
  User,
  Zap,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useMemo, useState } from "react";

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // =========================================================
  // HELP CATEGORIES
  // =========================================================

  const categories = [
    {
      title: "Account & Security",
      description: "Manage your profile, password and account access.",
      icon: User,
      color: "blue",
      search: "account password security profile login",
    },
    {
      title: "Billing & Payments",
      description: "Find answers about invoices, payments and subscriptions.",
      icon: FileQuestion,
      color: "purple",
      search: "billing payment invoice subscription",
    },
    {
      title: "AI Support",
      description: "Learn how to use SupportAI and get better answers.",
      icon: Bot,
      color: "emerald",
      search: "AI support chatbot artificial intelligence",
    },
    {
      title: "Tickets",
      description: "Create, manage and track your support tickets.",
      icon: Ticket,
      color: "amber",
      search: "tickets support request status",
    },
    {
      title: "Getting Started",
      description: "Everything you need to get started with SupportAI.",
      icon: Zap,
      color: "cyan",
      search: "getting started setup guide",
    },
    {
      title: "Security & Privacy",
      description: "Learn how we protect your information and privacy.",
      icon: Shield,
      color: "rose",
      search: "security privacy data protection",
    },
  ];

  // =========================================================
  // POPULAR ARTICLES
  // =========================================================

  const articles = [
    {
      title: "How to get started with SupportAI",
      description:
        "Learn how to ask questions, start conversations and get help from SupportAI.",
      category: "Getting Started",
      icon: Sparkles,
    },
    {
      title: "How to create a support ticket",
      description:
        "Create a ticket when your issue requires assistance from a human support specialist.",
      category: "Tickets",
      icon: Ticket,
    },
    {
      title: "Managing your account",
      description:
        "Update your profile information, password and account preferences.",
      category: "Account",
      icon: User,
    },
    {
      title: "How AI support works",
      description:
        "Understand how SupportAI analyzes your request and finds the best solution.",
      category: "AI Support",
      icon: Bot,
    },
    {
      title: "Contacting human support",
      description:
        "Learn how to escalate your request to a support specialist.",
      category: "Support",
      icon: LifeBuoy,
    },
    {
      title: "Keeping your account secure",
      description:
        "Follow these recommendations to keep your SupportAI account protected.",
      category: "Security",
      icon: Shield,
    },
  ];

  // =========================================================
  // FAQ
  // =========================================================

  const faqs = [
    {
      question: "How does SupportAI work?",
      answer:
        "SupportAI analyzes your question and uses the available support knowledge to provide a relevant answer. If AI cannot resolve the issue, you can escalate the conversation to human support.",
    },
    {
      question: "How do I create a support ticket?",
      answer:
        "Open the My Tickets section from the sidebar and select the option to create a new ticket. Provide a clear subject and description so the support team can help you quickly.",
    },
    {
      question: "Can I talk to a human support agent?",
      answer:
        "Yes. If SupportAI cannot resolve your issue, you can request human assistance from the AI chat or contact support directly.",
    },
    {
      question: "Where can I see my previous conversations?",
      answer:
        "Open the Conversations section from your SupportAI dashboard. Your previous conversations and their current status will be displayed there.",
    },
    {
      question: "How can I update my account?",
      answer:
        "Open your profile from the customer dashboard. You can manage your account information and available profile settings there.",
    },
  ];

  // =========================================================
  // FILTER
  // =========================================================

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return categories;
    }

    return categories.filter(
      (category) =>
        category.title.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query) ||
        category.search.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const filteredArticles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return articles;
    }

    return articles.filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        article.description.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query),
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
        hover: "hover:border-blue-500/30",
      },
      purple: {
        box: "bg-purple-500/10",
        text: "text-purple-400",
        hover: "hover:border-purple-500/30",
      },
      emerald: {
        box: "bg-emerald-500/10",
        text: "text-emerald-400",
        hover: "hover:border-emerald-500/30",
      },
      amber: {
        box: "bg-amber-500/10",
        text: "text-amber-400",
        hover: "hover:border-amber-500/30",
      },
      cyan: {
        box: "bg-cyan-500/10",
        text: "text-cyan-400",
        hover: "hover:border-cyan-500/30",
      },
      rose: {
        box: "bg-rose-500/10",
        text: "text-rose-400",
        hover: "hover:border-rose-500/30",
      },
    };

    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-[#050b18] text-white">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#050b18]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-5 sm:px-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Help Center</h1>

              <span className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 sm:inline-flex">
                SupportAI
              </span>
            </div>

            <p className="mt-0.5 text-xs text-slate-600">
              Find answers and learn how SupportAI works
            </p>
          </div>

          <Link
            to="/support/chat"
            className="hidden items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold transition hover:bg-blue-700 sm:flex"
          >
            <Sparkles className="h-4 w-4" />
            Ask SupportAI
          </Link>
        </div>
      </header>

      {/* =====================================================
          CONTENT
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
              Knowledge Base
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              How can we help you?
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Search our knowledge base or browse helpful guides to find the
              answer you're looking for.
            </p>

            {/* Search */}

            <div className="mx-auto mt-8 max-w-2xl">
              <div className="flex items-center rounded-2xl border border-slate-700 bg-[#07101f] px-4 shadow-2xl shadow-black/20 focus-within:border-blue-500/40">
                <Search className="h-5 w-5 shrink-0 text-slate-600" />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search for articles, guides or questions..."
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
            </div>
          </div>
        </section>

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

          {filteredCategories.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-[#0a1323] px-6 py-12 text-center">
              <Search className="mx-auto h-8 w-8 text-slate-700" />

              <p className="mt-4 text-sm font-medium">No categories found</p>

              <p className="mt-1 text-xs text-slate-600">
                Try searching for something else.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCategories.map((category) => {
                const Icon = category.icon;
                const colors = getCategoryColors(category.color);

                return (
                  <button
                    type="button"
                    key={category.title}
                    onClick={() => setSearchQuery(category.title)}
                    className={`group rounded-2xl border border-slate-800 bg-[#0a1323] p-5 text-left transition hover:bg-[#0d1728] ${colors.hover}`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors.box} ${colors.text}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <ChevronRight className="h-4 w-4 text-slate-700 transition group-hover:translate-x-1 group-hover:text-slate-400" />
                    </div>

                    <h3 className="mt-5 text-sm font-semibold">
                      {category.title}
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      {category.description}
                    </p>

                    <span
                      className={`mt-4 flex items-center gap-1 text-[10px] font-medium ${colors.text}`}
                    >
                      Explore articles
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ===================================================
            POPULAR ARTICLES
        =================================================== */}

        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-purple-400">
                Knowledge
              </p>

              <h2 className="mt-2 text-xl font-bold">Popular articles</h2>

              <p className="mt-1 text-xs text-slate-600">
                Helpful resources for common support questions.
              </p>
            </div>
          </div>

          {filteredArticles.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-[#0a1323] px-6 py-12 text-center">
              <FileQuestion className="mx-auto h-8 w-8 text-slate-700" />

              <p className="mt-4 text-sm font-medium">No articles found</p>

              <p className="mt-1 text-xs text-slate-600">
                Try a different search term.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {filteredArticles.map((article) => {
                const Icon = article.icon;

                return (
                  <button
                    type="button"
                    key={article.title}
                    className="group flex items-start gap-4 rounded-2xl border border-slate-800 bg-[#0a1323] p-5 text-left transition hover:border-slate-700 hover:bg-[#0d1728]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-slate-500 transition group-hover:bg-blue-500/10 group-hover:text-blue-400">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="text-[9px] font-medium uppercase tracking-wider text-blue-400">
                            {article.category}
                          </span>

                          <h3 className="mt-1 text-sm font-semibold">
                            {article.title}
                          </h3>
                        </div>

                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-700 transition group-hover:translate-x-1 group-hover:text-slate-400" />
                      </div>

                      <p className="mt-2 text-xs leading-5 text-slate-600">
                        {article.description}
                      </p>

                      <span className="mt-3 inline-flex items-center gap-1 text-[10px] text-slate-500 group-hover:text-blue-400">
                        Read article
                        <ArrowRight className="h-3 w-3" />
                      </span>
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
              Quick answers to common questions.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-slate-800 bg-[#0a1323]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-medium">
                  <span>{faq.question}</span>

                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-600 transition group-open:rotate-90" />
                </summary>

                <div className="border-t border-slate-800 px-5 pb-5 pt-4">
                  <p className="text-xs leading-6 text-slate-600">
                    {faq.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ===================================================
            CONTACT SUPPORT
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
                  SupportAI can help answer your question, or you can connect
                  with a human support specialist.
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
    </div>
  );
};

export default Help;
