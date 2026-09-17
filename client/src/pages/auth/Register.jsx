import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();

  const { register, loginWithGoogle } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // =========================================================
  // REDIRECT BY ROLE
  // =========================================================

  const redirectByRole = (user) => {
    const role = user?.role;

    if (role === "admin") {
      navigate("/admin", { replace: true });
    } else if (role === "agent") {
      navigate("/agent", { replace: true });
    } else {
      navigate("/support", { replace: true });
    }
  };

  // =========================================================
  // INPUT CHANGE
  // =========================================================

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

  // =========================================================
  // VALIDATE FORM
  // =========================================================

  const validateForm = () => {
    if (!formData.name.trim()) {
      return "Please enter your name.";
    }

    if (!formData.email.trim()) {
      return "Please enter your email address.";
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      return "Please enter a valid email address.";
    }

    if (formData.password.length < 6) {
      return "Password must contain at least 6 characters.";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match.";
    }

    return "";
  };

  // =========================================================
  // NORMAL REGISTRATION
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const data = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      redirectByRole(data?.user);
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to create your account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // GOOGLE REGISTER
  // =========================================================

  const googleRegister = useGoogleLogin({
    flow: "implicit",

    onSuccess: async (tokenResponse) => {
      try {
        setError("");
        setGoogleLoading(true);

        console.log("Google token received.");

        /*
         * Same Google implementation as Login.jsx.
         */

        const credential = tokenResponse?.credential;

        if (!credential) {
          console.error("Google response:", tokenResponse);

          throw new Error("Google did not return an ID token.");
        }

        const data = await loginWithGoogle({
          credential,
        });

        console.log("Google authentication successful.");

        redirectByRole(data?.user);
      } catch (err) {
        console.error("Google registration error:", err?.response?.data || err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to register with Google. Please try again.",
        );
      } finally {
        setGoogleLoading(false);
      }
    },

    onError: () => {
      console.error("Google Registration Failed.");

      setGoogleLoading(false);

      setError("Google sign-up was cancelled or failed.");
    },
  });

  // =========================================================
  // GOOGLE BUTTON
  // =========================================================

  const handleGoogleRegister = () => {
    setError("");
    setGoogleLoading(true);

    googleRegister();
  };

  const isLoading = loading || googleLoading;

  // =========================================================
  // PASSWORD REQUIREMENTS
  // =========================================================

  const passwordRequirements = [
    {
      label: "At least 6 characters",
      valid: formData.password.length >= 6,
    },
    {
      label: "Passwords match",
      valid:
        formData.password.length > 0 &&
        formData.password === formData.confirmPassword,
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* =====================================================
            LEFT - BRANDING
        ====================================================== */}

        <div className="relative hidden overflow-hidden lg:flex">
          {/* Background */}

          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-slate-950 to-blue-600/20" />

          <div className="absolute left-10 top-32 h-72 w-72 animate-pulse rounded-full bg-purple-500/10 blur-3xl" />

          <div
            className="absolute bottom-10 right-10 h-80 w-80 animate-pulse rounded-full bg-blue-500/10 blur-3xl"
            style={{ animationDelay: "1s" }}
          />

          {/* Decorative ring */}

          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 animate-[spin_20s_linear_infinite] rounded-full border border-purple-500/5" />

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
                <div className="mb-5 inline-flex animate-[fadeInUp_0.8s_ease-out] items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-sm text-purple-300 transition duration-300 hover:border-purple-400/40 hover:bg-purple-500/15">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  Built for modern support teams
                </div>

                <h2
                  className="animate-[fadeInUp_1s_ease-out] text-4xl font-bold leading-tight xl:text-5xl"
                  style={{ animationDelay: "100ms" }}
                >
                  Turn every support
                  <span className="block text-purple-400">
                    conversation into value.
                  </span>
                </h2>

                <p
                  className="mt-6 max-w-lg animate-[fadeInUp_1s_ease-out] text-lg leading-8 text-slate-400"
                  style={{ animationDelay: "200ms" }}
                >
                  Combine AI automation with human expertise to resolve customer
                  issues quickly and efficiently.
                </p>

                {/* Features */}

                <div className="mt-10 space-y-4">
                  {[
                    "AI-powered customer conversations",
                    "Real-time agent collaboration",
                    "Smart tickets and knowledge base",
                  ].map((feature, index) => (
                    <div
                      key={feature}
                      className="flex animate-[fadeInLeft_0.7s_ease-out] items-center gap-3 text-sm text-slate-300 transition duration-300 hover:translate-x-1"
                      style={{
                        animationDelay: `${300 + index * 100}ms`,
                      }}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 transition duration-300 hover:scale-110">
                        <Check className="h-4 w-4" />
                      </span>

                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Security */}

            <div
              className="flex animate-[fadeInUp_1s_ease-out] items-center gap-2 text-sm text-slate-400"
              style={{ animationDelay: "600ms" }}
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Your account is protected with secure authentication.
            </div>
          </div>
        </div>

        {/* =====================================================
            RIGHT - REGISTER
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
                Create your account
              </h2>

              <p className="mt-2 text-slate-400">
                Start building a smarter support experience.
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
                GOOGLE REGISTER
            ================================================== */}

            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={isLoading}
              className="group mb-6 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-5 py-3.5 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {googleLoading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-500 border-t-white" />

                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  {/* Google Icon */}

                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M21.35 12.27c0-.78-.07-1.53-.22-2.27H12v4.3h5.23a4.47 4.47 0 0 1-1.94 2.93v2.45h3.14c1.84-1.69 2.92-4.18 2.92-7.41Z"
                    />

                    <path
                      fill="#34A853"
                      d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.29v2.53A9.75 9.75 0 0 0 12 21.75Z"
                    />

                    <path
                      fill="#FBBC05"
                      d="M6.53 13.83A5.86 5.86 0 0 1 6.22 12c0-.64.11-1.26.31-1.83V7.64H3.29A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.04 4.36l3.24-2.53Z"
                    />

                    <path
                      fill="#EA4335"
                      d="M12 6.14c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 3.13 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.71 5.39l3.24 2.53C7.3 7.86 9.46 6.14 12 6.14Z"
                    />
                  </svg>

                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Divider */}

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>

              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-950 px-4 text-slate-500">
                  OR CONTINUE WITH EMAIL
                </span>
              </div>
            </div>

            {/* =================================================
                FORM
            ================================================== */}

            <form
              onSubmit={handleSubmit}
              className="animate-[fadeInUp_0.9s_ease-out] space-y-5"
              style={{ animationDelay: "100ms" }}
            >
              {/* Name */}

              <div className="group">
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-slate-200 transition-colors duration-200 group-focus-within:text-blue-400"
                >
                  Full name
                </label>

                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition duration-300 group-focus-within:scale-110 group-focus-within:text-blue-400" />

                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Muhammad Bilal"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3.5 pl-12 pr-4 text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:-translate-y-0.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

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
                    disabled={isLoading}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3.5 pl-12 pr-4 text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:-translate-y-0.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password */}

              <div className="group">
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-200 transition-colors duration-200 group-focus-within:text-blue-400"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition duration-300 group-focus-within:scale-110 group-focus-within:text-blue-400" />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3.5 pl-12 pr-12 text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:-translate-y-0.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={isLoading}
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

              {/* Confirm Password */}

              <div className="group">
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-200 transition-colors duration-200 group-focus-within:text-blue-400"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition duration-300 group-focus-within:scale-110 group-focus-within:text-blue-400" />

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3.5 pl-12 pr-12 text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:-translate-y-0.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    disabled={isLoading}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition duration-200 hover:scale-110 hover:text-slate-300 active:scale-95"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}

              <div className="animate-[fadeInUp_0.8s_ease-out] rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Password requirements
                </p>

                <div className="space-y-2">
                  {passwordRequirements.map((requirement) => (
                    <div
                      key={requirement.label}
                      className={`flex items-center gap-2 text-sm transition-all duration-300 ${
                        requirement.valid
                          ? "translate-x-1 text-emerald-400"
                          : "text-slate-500"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full transition-all duration-300 ${
                          requirement.valid
                            ? "scale-100 bg-emerald-500/10"
                            : "scale-95"
                        }`}
                      >
                        <Check
                          className={`h-4 w-4 transition-all duration-300 ${
                            requirement.valid
                              ? "scale-100 opacity-100"
                              : "scale-75 opacity-40"
                          }`}
                        />
                      </span>

                      {requirement.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}

              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {/* Button shine */}

                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    <span className="animate-pulse">Creating account...</span>
                  </>
                ) : (
                  <>
                    <span className="relative">Create account</span>

                    <ArrowRight className="relative h-5 w-5 transition duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Login */}

            <p
              className="mt-8 animate-[fadeInUp_1s_ease-out] text-center text-sm text-slate-400"
              style={{ animationDelay: "300ms" }}
            >
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-blue-400 transition duration-200 hover:text-blue-300"
              >
                Sign in
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

          @keyframes fadeInLeft {
            from {
              opacity: 0;
              transform: translateX(-20px);
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

export default Register;
