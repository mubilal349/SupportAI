import { useState } from "react";
import { Menu, X, Bot, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
            <Bot size={22} />
          </div>

          <div>
            <span className="text-xl font-bold">
              Support
              <span className="text-blue-400">AI</span>
            </span>

            <p className="hidden text-[10px] uppercase tracking-[0.2em] text-slate-500 sm:block">
              Intelligent Support
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            Features
          </a>

          <a
            href="#how-it-works"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            How it works
          </a>

          <a
            href="#testimonials"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            Reviews
          </a>
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-blue-500"
          >
            Get Started
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 md:hidden"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {open && (
        <div className="border-t border-white/10 bg-slate-950 px-6 py-5 md:hidden">
          <div className="flex flex-col gap-4">
            <a
              href="#features"
              onClick={() => setOpen(false)}
              className="py-2 text-slate-300"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              onClick={() => setOpen(false)}
              className="py-2 text-slate-300"
            >
              How it works
            </a>

            <a
              href="#testimonials"
              onClick={() => setOpen(false)}
              className="py-2 text-slate-300"
            >
              Reviews
            </a>

            <div className="my-2 h-px bg-white/10" />

            <Link
              to="/login"
              className="rounded-lg border border-white/10 px-4 py-3 text-center"
              onClick={() => setOpen(false)}
            >
              Login
            </Link>

            <Link
              to="/register"
              className="rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold"
              onClick={() => setOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
