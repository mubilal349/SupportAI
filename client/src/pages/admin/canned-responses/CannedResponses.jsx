import React, { useMemo, useState } from "react";
import { Search, Plus, MessageSquare, Edit, Trash2 } from "lucide-react";

const initialResponses = [
  {
    _id: "cr-1",
    title: "Greeting",
    shortcut: "/greeting",
    category: "General",
    content:
      "Hello! Thank you for contacting SupportAI. How can I help you today?",
  },
  {
    _id: "cr-2",
    title: "Password Reset",
    shortcut: "/password",
    category: "Account",
    content: "You can reset your password from the account settings page.",
  },
  {
    _id: "cr-3",
    title: "Payment Issue",
    shortcut: "/payment",
    category: "Billing",
    content:
      "I'm sorry you're experiencing a payment issue. Let me check this for you.",
  },
];

const CannedResponses = () => {
  const [responses, setResponses] = useState(initialResponses);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return responses.filter(
      (item) =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.shortcut.toLowerCase().includes(search.toLowerCase()) ||
        item.content.toLowerCase().includes(search.toLowerCase()),
    );
  }, [responses, search]);

  const deleteResponse = (id) => {
    setResponses((current) => current.filter((item) => item._id !== id));
  };

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
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

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
        >
          <Plus size={17} />
          New Response
        </button>
      </div>

      <div className="relative mb-5">
        <Search
          size={17}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
        />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search canned responses..."
          className="w-full rounded-2xl border border-slate-800 bg-[#0a1222] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((response) => (
          <div
            key={response._id}
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
                      {response.shortcut}
                    </span>
                  </div>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    {response.content}
                  </p>

                  <span className="mt-3 inline-block text-[11px] text-slate-600">
                    {response.category}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-800 p-2 text-slate-500 hover:text-white"
                  title="Edit"
                >
                  <Edit size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => deleteResponse(response._id)}
                  className="rounded-lg border border-slate-800 p-2 text-slate-500 hover:border-red-500/20 hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CannedResponses;
