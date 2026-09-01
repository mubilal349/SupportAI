import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!formData.email.trim() || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const data = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      const role = data?.user?.role;

      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else if (role === "agent") {
        navigate("/agent", { replace: true });
      } else {
        navigate("/support", { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to sign in. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* =====================================================
            LEFT - BRANDING
        ====================================================== */}

        <div className="relative hidden overflow-hidden lg:flex">
          {/* Background */}

          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-slate-950 to-purple-600/20" />

          <div className="absolute -left-24 top-20 h-72 w-72 animate-pulse rounded-full bg-blue-500/10 blur-3xl" />

          <div
            className="absolute bottom-20 right-0 h-80 w-80 animate-pulse rounded-full bg-purple-500/10 blur-3xl"
            style={{ animationDelay: "1s" }}
          />

          {/* Decorative moving glow */}

          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 animate-[spin_20s_linear_infinite] rounded-full border border-blue-500/5" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
            {/* Brand */}

            <div className="animate-[fadeInDown_0.7s_ease-out]">
              <div className="mb-12 flex items-center gap-3">
                <div className="group relative flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20 transition duration-300 hover:scale-110 hover:rotate-3 hover:shadow-blue-600/40">
                  <MessageSquare className="h-6 w-6 transition duration-300 group-hover:scale-110" />

                  <span className="absolute inset-0 rounded-xl bg-blue-400/20 opacity-0 blur-md transition duration-300 group-hover:opacity-100" />
                </div>

                <div>
                  <h1 className="text-xl font-bold tracking-tight">
                    SupportAI
                  </h1>

                  <p className="text-xs text-slate-400">
                    Intelligent Customer Support
                  </p>
                </div>
              </div>

              {/* Hero */}

              <div className="max-w-xl">
                <div className="mb-5 inline-flex animate-[fadeInUp_0.8s_ease-out] items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-sm text-blue-300 transition duration-300 hover:border-blue-400/40 hover:bg-blue-500/15">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  AI-powered support
                </div>

                <h2
                  className="animate-[fadeInUp_1s_ease-out] text-4xl font-bold leading-tight xl:text-5xl"
                  style={{ animationDelay: "100ms" }}
                >
                  Support your customers
                  <span className="block text-blue-400">
                    faster and smarter.
                  </span>
                </h2>

                <p
                  className="mt-6 max-w-lg animate-[fadeInUp_1s_ease-out] text-lg leading-8 text-slate-400"
                  style={{ animationDelay: "200ms" }}
                >
                  Manage conversations, automate support with AI, empower your
                  agents, and deliver better customer experiences from one
                  platform.
                </p>
              </div>
            </div>

            {/* Bottom features */}

            <div
              className="flex animate-[fadeInUp_1s_ease-out] flex-wrap gap-6 text-sm text-slate-400"
              style={{ animationDelay: "400ms" }}
            >
              <div className="flex items-center gap-2 transition duration-300 hover:-translate-y-1 hover:text-slate-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Secure authentication
              </div>

              <div className="flex items-center gap-2 transition duration-300 hover:-translate-y-1 hover:text-slate-300">
                <Sparkles className="h-4 w-4 text-blue-400" />
                AI assistance
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            RIGHT - LOGIN
        ====================================================== */}

        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md animate-[fadeInRight_0.8s_ease-out]">
            {/* Mobile Logo */}

            <div className="mb-10 flex animate-[fadeInDown_0.7s_ease-out] items-center justify-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20 transition duration-300 hover:scale-105">
                <MessageSquare className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-xl font-bold">SupportAI</h1>

                <p className="text-xs text-slate-500">
                  Intelligent Customer Support
                </p>
              </div>
            </div>

            {/* Header */}

            <div className="mb-8 animate-[fadeInUp_0.8s_ease-out]">
              <h2 className="text-3xl font-bold tracking-tight">
                Welcome back
              </h2>

              <p className="mt-2 text-slate-400">
                Sign in to your SupportAI account.
              </p>
            </div>

            {/* Error */}

            {error && (
              <div
                role="alert"
                className="mb-6 animate-[shake_0.4s_ease-in-out] rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            {/* =================================================
                FORM
            ================================================== */}

            <form
              onSubmit={handleSubmit}
              className="animate-[fadeInUp_0.9s_ease-out] space-y-5"
              style={{ animationDelay: "100ms" }}
            >
              {/* Email */}

              <div className="group">
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-200 transition-colors duration-200 group-focus-within:text-blue-400"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition duration-300 group-focus-within:scale-110 group-focus-within:text-blue-400" />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3.5 pl-12 pr-4 text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:-translate-y-0.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password */}

              <div className="group">
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-200 transition-colors duration-200 group-focus-within:text-blue-400"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-sm text-blue-400 transition duration-200 hover:-translate-y-0.5 hover:text-blue-300"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition duration-300 group-focus-within:scale-110 group-focus-within:text-blue-400" />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3.5 pl-12 pr-12 text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:-translate-y-0.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={loading}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition duration-200 hover:scale-110 hover:text-slate-300 active:scale-95"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}

              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {/* Button shine */}

                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    <span className="animate-pulse">Signing in...</span>
                  </>
                ) : (
                  <>
                    <span className="relative">Sign in</span>

                    <ArrowRight className="relative h-5 w-5 transition duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Register */}

            <p
              className="mt-8 animate-[fadeInUp_1s_ease-out] text-center text-sm text-slate-400"
              style={{ animationDelay: "300ms" }}
            >
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-blue-400 transition duration-200 hover:text-blue-300"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          ANIMATION KEYFRAMES
      ====================================================== */}

      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(24px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeInRight {
            from {
              opacity: 0;
              transform: translateX(30px);
            }

            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes shake {
            0%,
            100% {
              transform: translateX(0);
            }

            25% {
              transform: translateX(-5px);
            }

            50% {
              transform: translateX(5px);
            }

            75% {
              transform: translateX(-3px);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Login;
