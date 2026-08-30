import { ArrowRight, Bot, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="px-6 py-24 lg:px-8">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-blue-500/20 bg-blue-600 px-8 py-16 text-center shadow-2xl shadow-blue-900/20 sm:px-12">
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />

        <div className="relative">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <Bot size={28} />
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-widest text-blue-100">
            <Sparkles size={15} />
            Start today
          </p>

          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
            Ready to transform customer support?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-100">
            Give your customers instant AI assistance while keeping human
            support just one click away.
          </p>

          <Link
            to="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            Create your account
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTA;
