import { useEffect, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Pencil,
  ShieldCheck,
  UserRound,
  X,
  Save,
  Clock3,
  Ticket,
  MessageSquare,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const AgentProfile = () => {
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    department: "Customer Support",
    bio: "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!user) return;

    setProfile({
      name: user.name || user.fullName || user.username || "Agent",
      email: user.email || "",
      phone: user.phone || "",
      department: user.department || "Customer Support",
      bio: user.bio || "Support agent at SupportAI.",
    });
  }, [user]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswords((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      /*
       * =========================================================
       * CONNECT YOUR UPDATE PROFILE API HERE
       * =========================================================
       *
       * Example:
       *
       * await updateProfile(profile);
       *
       * If your backend already has an update profile endpoint,
       * replace this section with your API call.
       */

      await new Promise((resolve) => setTimeout(resolve, 700));

      setIsEditing(false);
      setSuccessMessage("Profile updated successfully.");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Profile update error:", error);

      setErrorMessage(
        error?.response?.data?.message || "Unable to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    if (!passwords.currentPassword) {
      setErrorMessage("Please enter your current password.");
      return;
    }

    if (!passwords.newPassword) {
      setErrorMessage("Please enter a new password.");
      return;
    }

    if (passwords.newPassword.length < 6) {
      setErrorMessage("New password must contain at least 6 characters.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setErrorMessage("New passwords do not match.");
      return;
    }

    try {
      /*
       * =========================================================
       * CONNECT CHANGE PASSWORD API HERE
       * =========================================================
       *
       * Example:
       *
       * await changePassword({
       *   currentPassword: passwords.currentPassword,
       *   newPassword: passwords.newPassword,
       * });
       */

      await new Promise((resolve) => setTimeout(resolve, 700));

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setSuccessMessage("Password changed successfully.");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Password change error:", error);

      setErrorMessage(
        error?.response?.data?.message || "Unable to change your password.",
      );
    }
  };

  const getInitials = () => {
    const name = profile.name || user?.name || "Agent";

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  const role = user?.role
    ? String(user.role).charAt(0).toUpperCase() + String(user.role).slice(1)
    : "Agent";

  return (
    <div className="min-h-screen bg-[#050b18] px-4 py-6 text-slate-100 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-6xl">
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-blue-400">Account</p>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              My Profile
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage your agent profile and account settings.
            </p>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => {
                setSuccessMessage("");
                setErrorMessage("");
                setIsEditing(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
            >
              <Pencil size={17} />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setSuccessMessage("");
                  setErrorMessage("");
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                <X size={17} />
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleSaveProfile}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={17} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {/* =====================================================
            ALERTS
        ===================================================== */}
        {successMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            <CheckCircle2 size={19} />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <X size={19} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* =====================================================
            PROFILE HERO
        ===================================================== */}
        <section className="mb-6 overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/40">
          <div className="h-32 bg-gradient-to-r from-blue-600/20 via-indigo-600/10 to-transparent" />

          <div className="-mt-16 px-5 pb-6 sm:px-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                {/* AVATAR */}
                <div className="relative">
                  <div className="flex h-28 w-28 items-center justify-center rounded-3xl border-4 border-[#050b18] bg-blue-600/20 text-3xl font-bold text-blue-400 shadow-xl">
                    {getInitials()}
                  </div>

                  <button
                    type="button"
                    className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 shadow-lg transition hover:bg-slate-800 hover:text-white"
                    title="Change avatar"
                  >
                    <Camera size={17} />
                  </button>
                </div>

                <div className="pb-1">
                  <h2 className="text-2xl font-bold text-white">
                    {profile.name || "Agent"}
                  </h2>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                      {role}
                    </span>

                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <ShieldCheck size={17} className="text-emerald-400" />
                Verified Agent
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            STATS
        ===================================================== */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Ticket size={19} />
            </div>

            <p className="text-2xl font-bold text-white">
              {user?.assignedTickets ?? 0}
            </p>

            <p className="mt-1 text-sm text-slate-500">Assigned Tickets</p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <MessageSquare size={19} />
            </div>

            <p className="text-2xl font-bold text-white">
              {user?.resolvedTickets ?? 0}
            </p>

            <p className="mt-1 text-sm text-slate-500">Resolved Tickets</p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Clock3 size={19} />
            </div>

            <p className="text-2xl font-bold text-white">
              {user?.responseTime || "—"}
            </p>

            <p className="mt-1 text-sm text-slate-500">Average Response Time</p>
          </div>
        </div>

        {/* =====================================================
            MAIN GRID
        ===================================================== */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* ===================================================
              PERSONAL INFORMATION
          =================================================== */}
          <section className="xl:col-span-2 rounded-3xl border border-slate-800/80 bg-slate-900/40 p-5 sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your basic profile information.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* NAME */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Full Name
                </label>

                <div className="relative">
                  <UserRound
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                  />

                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-70"
                    placeholder="Your name"
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                  />

                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-slate-800 bg-slate-950/60 py-3.5 pl-11 pr-4 text-sm text-slate-400 outline-none"
                  />
                </div>
              </div>

              {/* PHONE */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Phone Number
                </label>

                <input
                  type="text"
                  name="phone"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3.5 text-sm text-white outline-none transition focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-70"
                  placeholder="Phone number"
                />
              </div>

              {/* DEPARTMENT */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Department
                </label>

                <input
                  type="text"
                  name="department"
                  value={profile.department}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3.5 text-sm text-white outline-none transition focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-70"
                  placeholder="Department"
                />
              </div>

              {/* BIO */}
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Bio
                </label>

                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3.5 text-sm text-white outline-none transition focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-70"
                  placeholder="Tell something about yourself..."
                />
              </div>
            </div>
          </section>

          {/* ===================================================
              ACCOUNT INFO
          =================================================== */}
          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-5 sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">Account</h2>

              <p className="mt-1 text-sm text-slate-500">
                Account and security information.
              </p>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-600">
                  Role
                </p>

                <p className="mt-2 text-sm font-semibold text-white">{role}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-600">
                  Account Status
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-emerald-400" />

                  <span className="text-sm font-semibold text-emerald-400">
                    Active
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-600">
                  Email
                </p>

                <p className="mt-2 break-all text-sm text-slate-300">
                  {profile.email || "Not available"}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* =====================================================
            CHANGE PASSWORD
        ===================================================== */}
        <section className="mt-6 rounded-3xl border border-slate-800/80 bg-slate-900/40 p-5 sm:p-7">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Lock size={20} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Change Password
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Keep your account secure with a strong password.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleChangePassword}
            className="grid grid-cols-1 gap-5 lg:grid-cols-3"
          >
            {/* CURRENT PASSWORD */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Current Password
              </label>

              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  name="currentPassword"
                  value={passwords.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3.5 pr-11 text-sm text-white outline-none transition focus:border-blue-500/50"
                  placeholder="Current password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowCurrentPassword((previous) => !previous)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-slate-300"
                >
                  {showCurrentPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* NEW PASSWORD */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                New Password
              </label>

              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3.5 pr-11 text-sm text-white outline-none transition focus:border-blue-500/50"
                  placeholder="New password"
                />

                <button
                  type="button"
                  onClick={() => setShowNewPassword((previous) => !previous)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-slate-300"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Confirm Password
              </label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3.5 pr-11 text-sm text-white outline-none transition focus:border-blue-500/50"
                  placeholder="Confirm password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-slate-300"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="lg:col-span-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                <Lock size={17} />
                Update Password
              </button>
            </div>
          </form>
        </section>

        {/* =====================================================
            SECURITY FOOTER
        ===================================================== */}
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/30 px-5 py-4 text-sm text-slate-500">
          <ShieldCheck size={18} className="shrink-0 text-emerald-400" />

          <p>
            Your account is protected by SupportAI authentication and role-based
            access control.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgentProfile;
