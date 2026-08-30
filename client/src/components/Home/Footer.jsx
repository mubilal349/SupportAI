import { Bot, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                <Bot size={21} />
              </div>

              <span className="text-xl font-bold text-white">
                Support
                <span className="text-blue-400">AI</span>
              </span>
            </Link>

            <p className="mt-5 max-w-md leading-7 text-slate-500">
              Intelligent customer support powered by AI, designed to help
              businesses deliver faster and better customer experiences.
            </p>

            {/* Social Links */}
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                GitHub
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                LinkedIn
              </a>

              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                Twitter
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-white">Product</h3>

            <div className="mt-5 flex flex-col gap-3 text-sm text-slate-500">
              <a href="#features" className="transition hover:text-white">
                Features
              </a>

              <a href="#how-it-works" className="transition hover:text-white">
                How it works
              </a>

              <Link to="/login" className="transition hover:text-white">
                Login
              </Link>

              <Link to="/register" className="transition hover:text-white">
                Get started
              </Link>
            </div>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-white">Support</h3>

            <div className="mt-5 flex flex-col gap-3 text-sm text-slate-500">
              <Link to="/support" className="transition hover:text-white">
                Customer Dashboard
              </Link>

              <Link to="/support/chat" className="transition hover:text-white">
                AI Chat
              </Link>

              <Link
                to="/support/conversations"
                className="transition hover:text-white"
              >
                Conversations
              </Link>

              <Link
                to="/support/tickets"
                className="transition hover:text-white"
              >
                Tickets
              </Link>

              <Link
                to="/support/profile"
                className="transition hover:text-white"
              >
                Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} SupportAI. All rights reserved.
          </p>

          <div className="flex items-center gap-5 text-sm text-slate-600">
            <a href="#" className="transition hover:text-slate-300">
              Privacy
            </a>

            <a href="#" className="transition hover:text-slate-300">
              Terms
            </a>

            <a
              href="#"
              className="flex items-center gap-1 transition hover:text-slate-300"
            >
              Documentation
              <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
