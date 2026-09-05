import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  MessageSquare,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const CreateTicket = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* =========================================================
          PAGE CONTAINER
      ========================================================= */}
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =========================================================
            BACK BUTTON
        ========================================================= */}
        <button
          type="button"
          onClick={() => navigate("/support/tickets")}
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-slate-400 transition-all hover:border-slate-700 hover:bg-slate-800 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tickets
        </button>

        {/* =========================================================
            PAGE HEADER
        ========================================================= */}
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

        {/* =========================================================
            MAIN CREATE TICKET CARD
        ========================================================= */}
        <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-2xl shadow-black/10 backdrop-blur-sm">
          {/* =======================================================
              CARD HEADER
          ======================================================= */}
          <div className="border-b border-slate-800/80 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-semibold text-white">
                  Need help?
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Our support team is ready to assist you.
                </p>
              </div>
            </div>
          </div>

          {/* =======================================================
              CARD CONTENT
          ======================================================= */}
          <div className="p-5 sm:p-6">
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-6 text-center sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                <MessageSquare className="h-8 w-8" />
              </div>

              <h2 className="mt-5 text-xl font-semibold text-white">
                Create a support ticket
              </h2>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                Have a problem or need assistance? Create a ticket and provide
                the details of your issue. Our support team will review your
                request and get back to you.
              </p>

              {/* Create Ticket Button */}
              <button
                type="button"
                onClick={() => navigate("/support/tickets/create-form")}
                className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/10 transition-all duration-200 hover:bg-blue-500 hover:shadow-blue-500/20"
              >
                <Plus className="h-4 w-4" />
                Create ticket
              </button>
            </div>

            {/* =====================================================
                INFORMATION CARDS
            ===================================================== */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {/* Card 1 */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <FileText className="h-4 w-4" />
                </div>

                <h3 className="text-sm font-semibold text-white">
                  Describe your issue
                </h3>

                <p className="mt-1.5 text-xs leading-5 text-slate-600">
                  Provide enough information so our team can understand your
                  problem.
                </p>
              </div>

              {/* Card 2 */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <MessageSquare className="h-4 w-4" />
                </div>

                <h3 className="text-sm font-semibold text-white">
                  Get a response
                </h3>

                <p className="mt-1.5 text-xs leading-5 text-slate-600">
                  A support agent will review your request and respond to your
                  ticket.
                </p>
              </div>

              {/* Card 3 */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>

                <h3 className="text-sm font-semibold text-white">
                  Track your ticket
                </h3>

                <p className="mt-1.5 text-xs leading-5 text-slate-600">
                  Follow your ticket and communicate with support from one
                  place.
                </p>
              </div>
            </div>
          </div>

          {/* =======================================================
              FOOTER
          ======================================================= */}
          <div className="border-t border-slate-800/80 bg-slate-950/50 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-600">
                Our support team will review your request shortly.
              </p>

              <button
                type="button"
                onClick={() => navigate("/support/tickets")}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:border-slate-700 hover:bg-slate-800 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to tickets
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================
            WHAT HAPPENS NEXT
        ========================================================= */}
        <div className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-white">
                What happens next?
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Your support journey is simple.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs font-semibold text-blue-400">01</p>

              <p className="mt-2 text-sm font-medium text-white">
                Create your ticket
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                Tell us what problem you are experiencing.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs font-semibold text-amber-400">02</p>

              <p className="mt-2 text-sm font-medium text-white">
                Agent reviews it
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                Our support team reviews your request.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs font-semibold text-emerald-400">03</p>

              <p className="mt-2 text-sm font-medium text-white">
                Get your solution
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                Continue the conversation until the issue is resolved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTicket;
