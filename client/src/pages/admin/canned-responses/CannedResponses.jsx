import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  MessageSquare,
  Edit,
  Trash2,
  Loader2,
  RefreshCw,
  AlertCircle,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getAllCannedResponses,
  deleteCannedResponse,
} from "../../../services/adminCannedResponseService.js";

const CannedResponses = () => {
  const navigate = useNavigate();

  const [responses, setResponses] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ==========================================
  // LOAD CANNED RESPONSES
  // ==========================================

  const loadResponses = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const result = await getAllCannedResponses();

      const data = Array.isArray(result?.responses)
        ? result.responses
        : Array.isArray(result?.data?.responses)
          ? result.data.responses
          : [];

      setResponses(data);
    } catch (err) {
      console.error("Failed to load canned responses:", err);

      setError(err.message || "Unable to load canned responses.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadResponses();
  }, [loadResponses]);

  // ==========================================
  // SEARCH
  // ==========================================

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return responses;
    }

    return responses.filter((item) => {
      return (
        item.title?.toLowerCase().includes(query) ||
        item.shortcut?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.content?.toLowerCase().includes(query)
      );
    });
  }, [responses, search]);

  // ==========================================
  // DELETE
  // ==========================================

  const deleteResponse = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);
      setError("");

      await deleteCannedResponse(deleteId);

      setResponses((current) =>
        current.filter((item) => (item._id || item.id) !== deleteId),
      );

      setDeleteId(null);
    } catch (err) {
      console.error("Delete canned response error:", err);

      setError(err.message || "Unable to delete canned response.");
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            Loading canned responses...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      {/* ========================================
          HEADER
      ======================================== */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold text-white">
            Canned Responses
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage reusable replies for support agents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* REFRESH */}

          <button
            type="button"
            onClick={() => loadResponses(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#0a1222] px-3 py-2.5 text-sm font-semibold text-slate-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>

          {/* NEW RESPONSE */}

          <button
            type="button"
            onClick={() => navigate("/admin/canned-responses/new")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
          >
            <Plus size={17} />
            New Response
          </button>
        </div>
      </div>

      {/* ========================================
          ERROR
      ======================================== */}

      {error && (
        <div className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <div className="flex items-start gap-3">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />

            <span>{error}</span>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-300 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ========================================
          SEARCH
      ======================================== */}

      <div className="relative mb-5">
        <Search
          size={17}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
        />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search canned responses..."
          className="w-full rounded-2xl border border-slate-800 bg-[#0a1222] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/40"
        />
      </div>

      {/* ========================================
          RESULTS
      ======================================== */}

      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-slate-600">
          {filtered.length} {filtered.length === 1 ? "response" : "responses"}
        </p>
      </div>

      {/* ========================================
          EMPTY STATE
      ======================================== */}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <MessageSquare size={20} />
          </div>

          <h2 className="mt-4 text-sm font-semibold text-white">
            No canned responses found
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {search
              ? "Try a different search term."
              : "Create your first reusable response for support agents."}
          </p>

          {!search && (
            <button
              type="button"
              onClick={() => navigate("/admin/canned-responses/new")}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              <Plus size={17} />
              New Response
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((response) => {
            const id = response._id || response.id;

            return (
              <div
                key={id}
                className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                      <MessageSquare size={18} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-semibold text-white">
                          {response.title}
                        </h2>

                        <span className="rounded-md bg-slate-900 px-2 py-1 text-[10px] text-blue-400">
                          /{String(response.shortcut || "").replace(/^\/+/, "")}
                        </span>
                      </div>

                      <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-500">
                        {response.content}
                      </p>

                      <div className="mt-3 flex items-center gap-3">
                        <span className="text-[11px] text-slate-600">
                          {response.category}
                        </span>

                        <span
                          className={`text-[11px] ${
                            response.isActive
                              ? "text-emerald-400"
                              : "text-slate-600"
                          }`}
                        >
                          {response.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS */}

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/admin/canned-responses/${id}/edit`)
                      }
                      className="rounded-lg border border-slate-800 p-2 text-slate-500 hover:text-white"
                      title="Edit"
                    >
                      <Edit size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteId(id)}
                      className="rounded-lg border border-slate-800 p-2 text-slate-500 hover:border-red-500/20 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================
          DELETE CONFIRMATION MODAL
      ======================================== */}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0a1222] p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <Trash2 size={19} />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-white">
              Delete Canned Response?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              This response will be permanently removed from the canned response
              library. This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={deleteResponse}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting && <Loader2 size={15} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CannedResponses;
