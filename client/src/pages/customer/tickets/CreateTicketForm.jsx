import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  FileText,
  Flag,
  FolderOpen,
  Loader2,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  X,
} from "lucide-react";

import { createTicket } from "../../../services/ticketService";

const categories = [
  "Billing",
  "Technical",
  "Account",
  "Subscription",
  "General",
];

const priorities = [
  {
    value: "low",
    label: "Low",
    description: "Minor issue or general request",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Issue affecting your work",
  },
  {
    value: "high",
    label: "High",
    description: "Important issue requiring attention",
  },
];

const CreateTicketForm = () => {
  const navigate = useNavigate();

  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    category: "General",
    priority: "medium",
  });

  const [attachments, setAttachments] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setNewTicket((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "text/plain",
      "text/csv",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    const maxSize = 10 * 1024 * 1024;

    const invalidFile = selectedFiles.find(
      (file) => !allowedTypes.includes(file.type) || file.size > maxSize,
    );

    if (invalidFile) {
      setError(
        `"${invalidFile.name}" is not supported or is larger than 10 MB.`,
      );
      event.target.value = "";
      return;
    }

    setError("");

    setAttachments((previous) => {
      const combined = [...previous, ...selectedFiles];

      const uniqueFiles = combined.filter(
        (file, index, array) =>
          index ===
          array.findIndex(
            (item) =>
              item.name === file.name &&
              item.size === file.size &&
              item.lastModified === file.lastModified,
          ),
      );

      return uniqueFiles.slice(0, 5);
    });

    event.target.value = "";
  };

  const removeAttachment = (indexToRemove) => {
    setAttachments((previous) =>
      previous.filter((_, index) => index !== indexToRemove),
    );
  };

  const formatFileSize = (size) => {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCreateTicket = async (event) => {
    event.preventDefault();

    setError("");

    const subject = newTicket.subject.trim();
    const description = newTicket.description.trim();

    if (!subject) {
      setError("Please enter a ticket subject.");
      return;
    }

    if (subject.length < 5) {
      setError("The ticket subject should be at least 5 characters.");
      return;
    }

    if (!description) {
      setError("Please describe your issue.");
      return;
    }

    if (description.length < 10) {
      setError("Please provide a little more detail about your issue.");
      return;
    }

    try {
      setCreating(true);

      /*
       * Your backend currently accepts the basic ticket fields.
       * Attachments are therefore prepared separately below.
       *
       * If your createTicket service already supports FormData,
       * you can pass attachments there as well.
       */
      const response = await createTicket({
        subject,
        description,
        category: newTicket.category,
        priority: newTicket.priority,
        attachments,
      });

      const ticket =
        response?.ticket || response?.data?.ticket || response?.data || null;

      const ticketId = ticket?._id || ticket?.id;

      if (ticketId) {
        navigate(`/support/tickets/${ticketId}`);
        return;
      }

      navigate("/support/tickets");
    } catch (err) {
      console.error("CREATE TICKET ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to create ticket. Please try again.",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate("/support/tickets/create")}
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-slate-400 transition-all hover:border-slate-700 hover:bg-slate-800 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-500/10 bg-blue-500/10 text-blue-400">
              <Plus className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Create a new ticket
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                Tell us about your issue and our support team will help you
                resolve it as quickly as possible.
              </p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleCreateTicket}>
          <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-2xl shadow-black/10 backdrop-blur-sm">
            {/* Form Header */}
            <div className="border-b border-slate-800/80 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <MessageSquare className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-white">
                    Tell us what happened
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Provide enough information so our team can help you.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

                  <div>
                    <p className="text-sm font-medium text-red-300">
                      Something went wrong
                    </p>

                    <p className="mt-1 text-xs leading-5 text-red-400/80">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Subject */}
              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Ticket subject
                  <span className="ml-1 text-red-400">*</span>
                </label>

                <div className="relative">
                  <FileText className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    value={newTicket.subject}
                    onChange={handleChange}
                    placeholder="e.g. Unable to access my account"
                    maxLength={150}
                    disabled={creating}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-3 pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-slate-950 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div className="mt-1.5 flex justify-end">
                  <span className="text-[11px] text-slate-600">
                    {newTicket.subject.length}/150
                  </span>
                </div>
              </div>

              {/* Category + Priority */}
              <div className="grid gap-5 md:grid-cols-2">
                {/* Category */}
                <div>
                  <label
                    htmlFor="category"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Category
                    <span className="ml-1 text-red-400">*</span>
                  </label>

                  <div className="relative">
                    <FolderOpen className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-600" />

                    <select
                      id="category"
                      name="category"
                      value={newTicket.category}
                      onChange={handleChange}
                      disabled={creating}
                      className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-950/60 py-3 pl-10 pr-10 text-sm text-white outline-none transition-all focus:border-blue-500/50 focus:bg-slate-950 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label
                    htmlFor="priority"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Priority
                    <span className="ml-1 text-red-400">*</span>
                  </label>

                  <div className="relative">
                    <Flag className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-600" />

                    <select
                      id="priority"
                      name="priority"
                      value={newTicket.priority}
                      onChange={handleChange}
                      disabled={creating}
                      className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-950/60 py-3 pl-10 pr-10 text-sm text-white outline-none transition-all focus:border-blue-500/50 focus:bg-slate-950 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {priorities.map((priority) => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                  </div>

                  <p className="mt-1.5 text-[11px] text-slate-600">
                    {
                      priorities.find(
                        (item) => item.value === newTicket.priority,
                      )?.description
                    }
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Describe your issue
                  <span className="ml-1 text-red-400">*</span>
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={newTicket.description}
                  onChange={handleChange}
                  placeholder="Please explain the problem you're experiencing. Include any error messages, steps you already tried, and other details that may help our support team."
                  rows={8}
                  maxLength={5000}
                  disabled={creating}
                  className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm leading-6 text-white outline-none transition-all placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-slate-950 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-[11px] text-slate-600">
                    More details usually help our team resolve your issue
                    faster.
                  </p>

                  <span className="text-[11px] text-slate-600">
                    {newTicket.description.length}/5000
                  </span>
                </div>
              </div>

              {/* Attachments */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-200">
                    Attachments
                  </label>

                  <span className="text-[11px] text-slate-600">
                    Up to 5 files · 10 MB each
                  </span>
                </div>

                <label
                  htmlFor="attachments"
                  className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40 px-5 py-8 text-center transition-all hover:border-blue-500/30 hover:bg-blue-500/[0.03] ${
                    creating || attachments.length >= 5
                      ? "pointer-events-none opacity-50"
                      : ""
                  }`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition-transform group-hover:scale-105">
                    <Paperclip className="h-5 w-5" />
                  </div>

                  <p className="mt-3 text-sm font-medium text-slate-300">
                    Add files to your ticket
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    PDF, images, documents, spreadsheets, TXT or CSV
                  </p>

                  <span className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-400">
                    <Plus className="h-3.5 w-3.5" />
                    Choose files
                  </span>

                  <input
                    id="attachments"
                    type="file"
                    multiple
                    disabled={creating || attachments.length >= 5}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx"
                  />
                </label>

                {/* Selected Files */}
                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={`${file.name}-${file.lastModified}-${index}`}
                        className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-3"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                          <FileText className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-slate-300">
                            {file.name}
                          </p>

                          <p className="mt-0.5 text-[11px] text-slate-600">
                            {formatFileSize(file.size)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          disabled={creating}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-800/80 bg-slate-950/50 px-5 py-4 sm:px-6">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-slate-600">
                  Your ticket will be reviewed by our support team.
                </p>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate("/support/tickets")}
                    disabled={creating}
                    className="inline-flex cusror-pointer items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-400 transition-all hover:border-slate-700 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={creating}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/10 transition-all duration-200 hover:bg-blue-500 hover:shadow-blue-500/20 cursor-pointer disabled:opacity-60"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Create ticket
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketForm;
