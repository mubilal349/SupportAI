import React, { useEffect, useState } from "react";
import { ArrowLeft, Save, Loader2, MessageSquare } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getCannedResponse,
  createCannedResponse,
  updateCannedResponse,
} from "../../../services/adminCannedResponseService";

const CannedResponseEditor = () => {
  const navigate = useNavigate();
  const { responseId } = useParams();

  const isEditing = Boolean(responseId);

  const [formData, setFormData] = useState({
    title: "",
    shortcut: "",
    category: "General",
    content: "",
    isActive: true,
  });

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    "General",
    "Account",
    "Billing",
    "Payments",
    "Technical",
    "Tickets",
    "Security",
  ];

  useEffect(() => {
    if (!isEditing) return;

    const loadResponse = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getCannedResponse(responseId);

        const response = data?.data || data?.cannedResponse || data;

        setFormData({
          title: response?.title || "",
          shortcut: response?.shortcut || "",
          category: response?.category || "General",
          content: response?.content || "",
          isActive:
            typeof response?.isActive === "boolean" ? response.isActive : true,
        });
      } catch (err) {
        setError(err?.message || "Failed to load canned response.");
      } finally {
        setLoading(false);
      }
    };

    loadResponse();
  }, [isEditing, responseId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!formData.title.trim()) {
      setError("Please enter a title.");
      return;
    }

    if (!formData.shortcut.trim()) {
      setError("Please enter a shortcut.");
      return;
    }

    if (!formData.category.trim()) {
      setError("Please select a category.");
      return;
    }

    if (!formData.content.trim()) {
      setError("Please enter the response content.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: formData.title.trim(),
        shortcut: formData.shortcut.trim(),
        category: formData.category.trim(),
        content: formData.content.trim(),
        isActive: formData.isActive,
      };

      if (isEditing) {
        await updateCannedResponse(responseId, payload);
      } else {
        await createCannedResponse(payload);
      }

      navigate("/admin/canned-responses");
    } catch (err) {
      setError(
        err?.message ||
          `Failed to ${isEditing ? "update" : "create"} canned response.`,
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center px-4 py-10">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Loader2 size={18} className="animate-spin" />
          Loading canned response...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate("/admin/canned-responses")}
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Canned Responses
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <MessageSquare size={20} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
              Administration
            </p>

            <h1 className="mt-1 text-2xl font-bold text-white">
              {isEditing ? "Edit Canned Response" : "New Canned Response"}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {isEditing
                ? "Update this reusable reply for support agents."
                : "Create a reusable reply for support agents."}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="max-w-4xl rounded-2xl border border-slate-800 bg-[#0a1222] p-5 sm:p-6">
          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Title
            </label>

            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Password Reset"
              maxLength={150}
              className="w-full rounded-xl border border-slate-800 bg-[#050b18] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/50"
            />

            <p className="mt-1 text-xs text-slate-600">
              Give this response a short and recognizable name.
            </p>
          </div>

          {/* Shortcut + Category */}
          <div className="mb-5 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Shortcut
              </label>

              <input
                type="text"
                name="shortcut"
                value={formData.shortcut}
                onChange={handleChange}
                placeholder="/password"
                maxLength={100}
                className="w-full rounded-xl border border-slate-800 bg-[#050b18] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/50"
              />

              <p className="mt-1 text-xs text-slate-600">
                Example: /greeting or /password
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Category
              </label>

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-800 bg-[#050b18] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Content */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Response Content
            </label>

            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Write the reusable response that agents can send to customers..."
              maxLength={5000}
              rows={9}
              className="w-full resize-y rounded-xl border border-slate-800 bg-[#050b18] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/50"
            />

            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-slate-600">
                You can use placeholders such as{" "}
                <span className="text-slate-500">{"{{customerName}}"}</span> and{" "}
                <span className="text-slate-500">{"{{ticketNumber}}"}</span>.
              </p>

              <span className="text-xs text-slate-600">
                {formData.content.length}/5000
              </span>
            </div>
          </div>

          {/* Active Status */}
          <div className="mb-6 rounded-xl border border-slate-800 bg-[#050b18] p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
              />

              <div>
                <p className="text-sm font-medium text-white">
                  Active response
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Active responses can be used by support agents. Disable this
                  if you don't want agents to use it temporarily.
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/admin/canned-responses")}
              disabled={saving}
              className="rounded-xl border border-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-400 transition hover:border-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEditing ? "Update Response" : "Create Response"}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CannedResponseEditor;
