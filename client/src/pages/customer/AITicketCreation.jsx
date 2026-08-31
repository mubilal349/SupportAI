import { useState } from "react";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  FileText,
  Loader2,
  Send,
  Sparkles,
  Tag,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { createTicket } from "../../services/ticketService";

const AITicketCreation = () => {
  const navigate = useNavigate();

  const [problem, setProblem] = useState("");

  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [suggestion, setSuggestion] = useState(null);

  const [ticket, setTicket] = useState({
    subject: "",
    description: "",
    category: "General",
    priority: "medium",
    summary: "",
    suggestedResolution: "",
  });

  // =========================================================
  // DEMO AI ANALYSIS
  // =========================================================
  //
  // This is intentionally separated from the UI.
  //
  // Later, replace this function with:
  //
  // POST /api/tickets/ai-analyze
  //
  // and let Ollama generate the ticket information.
  //
  // =========================================================

  const analyzeProblem = async () => {
    setError("");
    setSuccess("");

    if (!problem.trim()) {
      setError("Please describe your problem first.");
      return;
    }

    if (problem.trim().length < 15) {
      setError("Please provide a little more detail about your problem.");
      return;
    }

    try {
      setGenerating(true);

      // -------------------------------------------------------
      // TEMPORARY LOCAL AI SIMULATION
      // -------------------------------------------------------
      //
      // Replace this section with your Ollama API call later.
      //
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const text = problem.toLowerCase();

      let generatedCategory = "General";
      let generatedPriority = "medium";
      let generatedSubject = "Customer support request";
      let generatedSummary = problem.trim();
      let generatedResolution =
        "A support agent will review your issue and provide the appropriate solution.";

      // Account / Login
      if (
        text.includes("login") ||
        text.includes("log in") ||
        text.includes("password") ||
        text.includes("sign in")
      ) {
        generatedCategory = "Account";
        generatedSubject = "Unable to access my account";

        if (
          text.includes("password reset") ||
          text.includes("reset email") ||
          text.includes("reset")
        ) {
          generatedSubject = "Password reset email not received";
          generatedResolution =
            "Check your spam or junk folder first. If the reset email is still missing, verify that the email address associated with your account is correct.";
        }
      }

      // Billing
      else if (
        text.includes("payment") ||
        text.includes("billing") ||
        text.includes("charged") ||
        text.includes("invoice")
      ) {
        generatedCategory = "Billing";
        generatedSubject = "Billing or payment issue";
        generatedPriority = "high";
        generatedResolution =
          "Please verify your payment method and billing information. A support agent will review the transaction details.";
      }

      // Subscription
      else if (
        text.includes("subscription") ||
        text.includes("plan") ||
        text.includes("upgrade") ||
        text.includes("cancel")
      ) {
        generatedCategory = "Subscription";
        generatedSubject = "Subscription support request";
        generatedResolution =
          "Your subscription details can be reviewed by the support team. They will verify your current plan and requested changes.";
      }

      // Technical
      else if (
        text.includes("error") ||
        text.includes("bug") ||
        text.includes("crash") ||
        text.includes("not working") ||
        text.includes("website") ||
        text.includes("dashboard")
      ) {
        generatedCategory = "Technical";
        generatedSubject = "Technical issue requiring assistance";
        generatedPriority = "high";
        generatedResolution =
          "Please provide any visible error messages and the steps that caused the problem. The technical support team will investigate the issue.";
      }

      // Urgent
      if (
        text.includes("urgent") ||
        text.includes("critical") ||
        text.includes("blocked") ||
        text.includes("cannot access")
      ) {
        generatedPriority = "high";
      }

      const generatedTicket = {
        subject: generatedSubject,
        description: problem.trim(),
        category: generatedCategory,
        priority: generatedPriority,
        summary: generatedSummary,
        suggestedResolution: generatedResolution,
      };

      setTicket(generatedTicket);
      setSuggestion(generatedTicket);
    } catch (err) {
      console.error("AI TICKET ANALYSIS ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to analyze your issue.",
      );
    } finally {
      setGenerating(false);
    }
  };

  // =========================================================
  // UPDATE GENERATED TICKET
  // =========================================================

  const updateTicket = (field, value) => {
    setTicket((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // =========================================================
  // CREATE TICKET
  // =========================================================

  const handleCreateTicket = async () => {
    setError("");
    setSuccess("");

    if (!ticket.subject.trim()) {
      setError("Ticket subject is required.");
      return;
    }

    if (!ticket.description.trim()) {
      setError("Ticket description is required.");
      return;
    }

    try {
      setCreating(true);

      const payload = {
        subject: ticket.subject.trim(),
        description: ticket.description.trim(),
        category: ticket.category,
        priority: ticket.priority,
      };

      console.log("AI GENERATED TICKET:", payload);

      const response = await createTicket(payload);

      console.log("AI TICKET CREATED:", response);

      setSuccess("Your support ticket has been created successfully.");

      const createdTicket = response?.ticket;

      if (createdTicket?._id || createdTicket?.id) {
        const ticketId = createdTicket._id || createdTicket.id;

        setTimeout(() => {
          navigate(`/support/tickets/${ticketId}`);
        }, 800);
      } else {
        setTimeout(() => {
          navigate("/support/tickets");
        }, 800);
      }
    } catch (err) {
      console.error("CREATE AI TICKET ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to create support ticket.",
      );
    } finally {
      setCreating(false);
    }
  };

  // =========================================================
  // RESET
  // =========================================================

  const resetAnalysis = () => {
    setSuggestion(null);

    setTicket({
      subject: "",
      description: "",
      category: "General",
      priority: "medium",
      summary: "",
      suggestedResolution: "",
    });

    setProblem("");
    setError("");
    setSuccess("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <Link
              to="/support/tickets"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div>
              <h1 className="font-bold">AI Ticket Assistant</h1>

              <p className="text-xs text-slate-600">
                Create a support ticket with AI assistance
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 sm:flex">
            <Sparkles className="h-4 w-4 text-blue-400" />

            <span className="text-xs font-medium text-blue-400">
              AI Assisted
            </span>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Heading */}

        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Bot className="h-5 w-5" />
            </div>

            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Intelligent Support
            </span>
          </div>

          <h2 className="text-3xl font-bold">
            Tell us what you're experiencing
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Describe your problem naturally. SupportAI will analyze your issue
            and prepare a structured ticket for you to review before submitting.
          </p>
        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* =====================================================
            SUCCESS
        ====================================================== */}

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />

            <p className="text-sm text-emerald-400">{success}</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          {/* ===================================================
              LEFT — PROBLEM
          ==================================================== */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <MessageIcon />
              </div>

              <div>
                <h3 className="font-semibold">Describe your issue</h3>

                <p className="text-xs text-slate-600">
                  Explain the problem in your own words
                </p>
              </div>
            </div>

            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Example: I can't log into my account and the password reset email isn't arriving..."
              rows={10}
              disabled={generating || creating}
              className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-slate-700 focus:border-blue-500 disabled:opacity-50"
            />

            <div className="mt-3 flex items-center justify-between">
              <p className="text-[10px] text-slate-700">
                {problem.length} characters
              </p>

              <p className="text-[10px] text-slate-700">
                Be as specific as possible
              </p>
            </div>

            <button
              type="button"
              onClick={analyzeProblem}
              disabled={generating || !problem.trim()}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing your issue...
                </>
              ) : (
                <>
                  <WandSparkles className="h-4 w-4" />
                  Analyze with AI
                </>
              )}
            </button>
          </section>

          {/* ===================================================
              RIGHT — AI RESULT
          ==================================================== */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60">
            {!suggestion ? (
              <div className="flex min-h-[470px] flex-col items-center justify-center p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                  <Bot className="h-7 w-7" />
                </div>

                <h3 className="mt-5 font-semibold">
                  Your AI ticket will appear here
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
                  Describe your problem and let SupportAI organize it into a
                  clear support request.
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Suggestion text="Password issue" />
                  <Suggestion text="Payment failed" />
                  <Suggestion text="Dashboard error" />
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Sparkles className="h-4 w-4" />
                    </div>

                    <div>
                      <h3 className="font-semibold">AI analysis</h3>

                      <p className="text-xs text-slate-600">
                        Review before creating
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={resetAnalysis}
                    disabled={creating}
                    className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-800 hover:text-white"
                    title="Start over"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Subject */}

                <Field icon={FileText} label="Subject">
                  <input
                    type="text"
                    value={ticket.subject}
                    onChange={(e) => updateTicket("subject", e.target.value)}
                    disabled={creating}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-blue-500"
                  />
                </Field>

                {/* Category + Priority */}

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field icon={Tag} label="Category">
                    <select
                      value={ticket.category}
                      onChange={(e) => updateTicket("category", e.target.value)}
                      disabled={creating}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-300 outline-none focus:border-blue-500"
                    >
                      <option value="General">General</option>
                      <option value="Billing">Billing</option>
                      <option value="Technical">Technical</option>
                      <option value="Account">Account</option>
                      <option value="Subscription">Subscription</option>
                    </select>
                  </Field>

                  <Field icon={AlertIcon} label="Priority">
                    <select
                      value={ticket.priority}
                      onChange={(e) => updateTicket("priority", e.target.value)}
                      disabled={creating}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm capitalize text-slate-300 outline-none focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </Field>
                </div>

                {/* Description */}

                <div className="mt-4">
                  <label className="mb-2 block text-xs font-medium text-slate-400">
                    Description
                  </label>

                  <textarea
                    value={ticket.description}
                    onChange={(e) =>
                      updateTicket("description", e.target.value)
                    }
                    rows={5}
                    disabled={creating}
                    className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm leading-6 text-slate-300 outline-none focus:border-blue-500"
                  />
                </div>

                {/* AI Summary */}

                {ticket.summary && (
                  <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-blue-400" />

                      <p className="text-xs font-semibold text-blue-400">
                        AI Summary
                      </p>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {ticket.summary}
                    </p>
                  </div>
                )}

                {/* Suggested resolution */}

                {ticket.suggestedResolution && (
                  <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />

                      <p className="text-xs font-semibold text-emerald-400">
                        Suggested resolution
                      </p>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {ticket.suggestedResolution}
                    </p>
                  </div>
                )}

                {/* Create */}

                <button
                  type="button"
                  onClick={handleCreateTicket}
                  disabled={creating}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating ticket...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Create support ticket
                    </>
                  )}
                </button>
              </div>
            )}
          </section>
        </div>

        {/* =====================================================
            INFO
        ====================================================== */}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <InfoCard
            icon={Bot}
            title="AI understands"
            text="Describe your issue naturally instead of filling out complicated forms."
          />

          <InfoCard
            icon={FileText}
            title="Structured ticket"
            text="Your problem is converted into a clear subject, category and priority."
          />

          <InfoCard
            icon={UserRound}
            title="Human support"
            text="A support agent can review and continue the conversation when needed."
          />
        </div>
      </main>
    </div>
  );
};

// ===========================================================
// SMALL COMPONENTS
// ===========================================================

const Field = ({ icon: Icon, label, children }) => {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
        <Icon className="h-3.5 w-3.5 text-slate-600" />
        {label}
      </label>

      {children}
    </div>
  );
};

const Suggestion = ({ text }) => {
  return (
    <span className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1.5 text-[10px] text-slate-600">
      {text}
    </span>
  );
};

const InfoCard = ({ icon: Icon, title, text }) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
        <Icon className="h-4 w-4" />
      </div>

      <h3 className="mt-4 text-sm font-semibold">{title}</h3>

      <p className="mt-2 text-xs leading-5 text-slate-600">{text}</p>
    </div>
  );
};

const MessageIcon = () => {
  return <FileText className="h-4 w-4" />;
};

const AlertIcon = () => {
  return <Sparkles className="h-4 w-4" />;
};

export default AITicketCreation;
