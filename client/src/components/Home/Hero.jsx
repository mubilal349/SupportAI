import {
  ArrowRight,
  Bot,
  CheckCircle2,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="absolute right-0 top-1/3 h-[300px] w-[300px] rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 py-24 lg:grid-cols-2 lg:px-8 lg:py-32">
        {/* Left */}
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm text-blue-300">
            <Sparkles size={16} />
            AI-powered customer support
          </div>

          <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Customer support,
            <span className="block text-blue-400">reimagined with AI.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
            SupportAI helps businesses answer customer questions instantly,
            automate repetitive support requests, and connect customers with
            human agents when they need them.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold transition hover:bg-blue-500"
            >
              Start for free
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/login"
              className="rounded-xl border border-white/10 px-6 py-3.5 text-center font-semibold text-slate-200 transition hover:bg-white/5"
            >
              Sign in
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              AI assistance
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              Human escalation
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              Ticket management
            </div>
          </div>
        </div>

        {/* Right - Chat Preview */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-blue-600/10 blur-2xl" />

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
            {/* Window Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                  <Bot size={20} />
                </div>

                <div>
                  <p className="font-semibold">SupportAI</p>

                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Online
                  </div>
                </div>
              </div>

              <MessageSquare size={20} className="text-slate-500" />
            </div>

            {/* Messages */}
            <div className="space-y-5 p-5">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                  <Bot size={16} />
                </div>

                <div className="max-w-[80%] rounded-2xl rounded-tl-none bg-slate-800 px-4 py-3 text-sm leading-6 text-slate-200">
                  Hi! I'm SupportAI. How can I help you today?
                </div>
              </div>

              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-none bg-blue-600 px-4 py-3 text-sm leading-6">
                  I can't access my account.
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                  <Bot size={16} />
                </div>

                <div className="max-w-[80%] rounded-2xl rounded-tl-none bg-slate-800 px-4 py-3 text-sm leading-6 text-slate-200">
                  I can help with that. Let's first check your login credentials
                  and account status.
                </div>
              </div>

              {/* Typing */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                  <Bot size={16} />
                </div>

                <div className="flex gap-1 rounded-2xl bg-slate-800 px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:300ms]" />
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-white/10 p-4">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950 px-4 py-3">
                <span className="text-sm text-slate-600">
                  Ask SupportAI anything...
                </span>

                <div className="rounded-lg bg-blue-600 p-2">
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
