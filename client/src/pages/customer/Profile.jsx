import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  Clock3,
  Edit3,
  Eye,
  EyeOff,
  Globe,
  Headphones,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  Phone,
  Save,
  ShieldCheck,
  Ticket,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const DEFAULT_PROFILE = {
  name: "",
  email: "",
  phone: "",
  company: "",
  timezone: "Asia/Karachi",
  language: "English",
  avatar: "",
  avatarFile: undefined,
};

const DEFAULT_NOTIFICATIONS = {
  email: true,
  conversation: true,
  ticket: true,
  marketing: false,
};

const DEFAULT_SUPPORT_PREFERENCES = {
  aiFirst: true,
  autoEscalation: true,
  satisfaction: true,
};

const Profile = () => {
  const { user, logout } = useAuth();

  const [activeSection, setActiveSection] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  const [accountInfo, setAccountInfo] = useState({
    createdAt: null,
    lastSeen: null,
    status: "active",
  });

  const [passwords, setPasswords] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /*
   * These preferences are currently frontend-only.
   *
   * Your current User.js does not have database fields for these
   * preferences. They can be connected to MongoDB later.
   */
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);

  const [supportPreferences, setSupportPreferences] = useState(
    DEFAULT_SUPPORT_PREFERENCES,
  );

  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState("");

  /*
   * ============================================================
   * AVATAR URL
   * ============================================================
   */

  const getAvatarUrl = (avatar) => {
    if (!avatar) return "";

    if (avatar.startsWith("blob:") || avatar.startsWith("data:")) {
      return avatar;
    }

    if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
      return avatar;
    }

    const normalizedPath = avatar.startsWith("/") ? avatar : `/${avatar}`;

    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

    /*
     * VITE_API_URL normally contains /api.
     * We need the server root for /uploads.
     */
    const serverUrl = baseUrl.replace(/\/api\/?$/, "");

    return `${serverUrl}${normalizedPath}`;
  };

  /*
   * ============================================================
   * INITIALS
   * ============================================================
   */

  const getInitials = () => {
    const name = profile.name || "Customer";

    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  /*
   * ============================================================
   * DATE FORMATTERS
   * ============================================================
   */

  const formatMemberSince = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const formatLastSeen = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  /*
   * ============================================================
   * LOAD PROFILE
   * ============================================================
   *
   * Actual backend:
   *
   * GET /api/auth/profile
   *
   * authenticateToken
   */

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      setError("");

      const response = await api.get("/auth/profile");

      console.log("PROFILE RESPONSE:", response.data);

      const loadedUser = response.data?.user;

      if (!response.data?.success || !loadedUser) {
        throw new Error(response.data?.message || "Unable to load profile.");
      }

      setProfile({
        name: loadedUser.name || "",
        email: loadedUser.email || "",
        phone: loadedUser.phone || "",
        company: loadedUser.company || "",
        timezone: loadedUser.timezone || "Asia/Karachi",
        language: loadedUser.language || "English",
        avatar: loadedUser.avatar || "",
        avatarFile: undefined,
      });

      setAccountInfo({
        createdAt: loadedUser.createdAt || null,
        lastSeen: loadedUser.lastSeen || null,
        status: loadedUser.status || "active",
      });
    } catch (err) {
      console.error("Load profile error:", err.response?.data || err.message);

      setError(
        err.response?.data?.message || err.message || "Failed to load profile.",
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  /*
   * ============================================================
   * CLEANUP AVATAR PREVIEW
   * ============================================================
   */

  useEffect(() => {
    return () => {
      if (profile.avatar?.startsWith("blob:")) {
        URL.revokeObjectURL(profile.avatar);
      }
    };
  }, [profile.avatar]);

  /*
   * ============================================================
   * PROFILE INPUT
   * ============================================================
   */

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSaveMessage("");
  };

  /*
   * ============================================================
   * SAVE PROFILE
   * ============================================================
   *
   * Actual backend:
   *
   * PUT /api/auth/profile
   *
   * Supports:
   * name
   * email
   * phone
   * company
   * timezone
   * language
   * avatar
   */

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      setError("");
      setSaveMessage("");

      if (!profile.name.trim()) {
        setError("Full name is required.");
        return;
      }

      if (!profile.email.trim()) {
        setError("Email address is required.");
        return;
      }

      const formData = new FormData();

      formData.append("name", profile.name.trim());
      formData.append("email", profile.email.trim());
      formData.append("phone", profile.phone.trim());
      formData.append("company", profile.company.trim());
      formData.append("timezone", profile.timezone || "Asia/Karachi");
      formData.append("language", profile.language || "English");

      if (profile.avatarFile) {
        formData.append("avatar", profile.avatarFile);
      }

      /*
       * IMPORTANT:
       * Do not manually set Content-Type here.
       *
       * Axios/browser will automatically set:
       *
       * multipart/form-data; boundary=...
       */

      const response = await api.put("/auth/profile", formData);

      console.log("UPDATED PROFILE:", response.data);

      const updatedUser = response.data?.user;

      if (!response.data?.success || !updatedUser) {
        throw new Error(response.data?.message || "Unable to update profile.");
      }

      setProfile({
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        phone: updatedUser.phone || "",
        company: updatedUser.company || "",
        timezone: updatedUser.timezone || "Asia/Karachi",
        language: updatedUser.language || "English",
        avatar: updatedUser.avatar || "",
        avatarFile: undefined,
      });

      setAccountInfo((prev) => ({
        ...prev,
        createdAt: updatedUser.createdAt || prev.createdAt,
        lastSeen: updatedUser.lastSeen || prev.lastSeen,
        status: updatedUser.status || prev.status,
      }));

      setIsEditing(false);
      setSaveMessage("Profile updated successfully.");

      setTimeout(() => {
        setSaveMessage("");
      }, 3000);
    } catch (err) {
      console.error("Save profile error:", err.response?.data || err.message);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to update your profile. Please try again.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  /*
   * ============================================================
   * CANCEL EDITING
   * ============================================================
   */

  const handleCancelEditing = async () => {
    setIsEditing(false);
    setError("");
    setSaveMessage("");

    await loadProfile();
  };

  /*
   * ============================================================
   * AVATAR CHANGE
   * ============================================================
   */

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSaveMessage("");

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, or WEBP image.");

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile picture must be smaller than 5MB.");

      event.target.value = "";
      return;
    }

    /*
     * Revoke previous temporary preview.
     */
    if (profile.avatar?.startsWith("blob:")) {
      URL.revokeObjectURL(profile.avatar);
    }

    const previewUrl = URL.createObjectURL(file);

    setProfile((prev) => ({
      ...prev,
      avatar: previewUrl,
      avatarFile: file,
    }));
  };

  /*
   * ============================================================
   * PASSWORD INPUT
   * ============================================================
   */

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswords((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSaveMessage("");
  };

  /*
   * ============================================================
   * CHANGE PASSWORD
   * ============================================================
   *
   * Actual backend:
   *
   * PUT /api/auth/change-password
   *
   * Backend expects:
   *
   * {
   *   current,
   *   newPassword
   * }
   */

  const handleChangePassword = async (e) => {
    e.preventDefault();

    setError("");
    setSaveMessage("");

    if (!passwords.current || !passwords.newPassword || !passwords.confirm) {
      setError("Please fill in all password fields.");
      return;
    }

    if (passwords.newPassword !== passwords.confirm) {
      setError("New passwords do not match.");
      return;
    }

    if (passwords.newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    try {
      setChangingPassword(true);

      /*
       * api.js automatically adds:
       *
       * Authorization: Bearer <supportai_token>
       */

      const response = await api.put("/auth/change-password", {
        current: passwords.current,
        newPassword: passwords.newPassword,
      });

      console.log("PASSWORD RESPONSE:", response.data);

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Unable to change password.");
      }

      setPasswords({
        current: "",
        newPassword: "",
        confirm: "",
      });

      setSaveMessage("Password changed successfully.");

      setTimeout(() => {
        setSaveMessage("");
      }, 3000);
    } catch (err) {
      console.error(
        "Change password error:",
        err.response?.data || err.message,
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to change your password.",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  /*
   * ============================================================
   * MENU
   * ============================================================
   */

  const menuItems = [
    {
      id: "profile",
      label: "Profile information",
      description: "Your personal information",
      icon: User,
    },
    {
      id: "security",
      label: "Password & security",
      description: "Manage your account security",
      icon: Lock,
    },
    {
      id: "notifications",
      label: "Notifications",
      description: "Control how we contact you",
      icon: Bell,
    },
    {
      id: "preferences",
      label: "Support preferences",
      description: "Customize your support experience",
      icon: Headphones,
    },
  ];

  /*
   * ============================================================
   * STATUS HELPERS
   * ============================================================
   */

  const normalizedStatus = String(accountInfo.status || "active").toLowerCase();

  const isActive = normalizedStatus === "active";

  const statusLabel = isActive
    ? "Active"
    : normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ========================================================
          HEADER
      ======================================================== */}

      <header className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <Link
              to="/support"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 transition hover:bg-blue-700"
            >
              <MessageSquare className="h-5 w-5" />
            </Link>

            <div>
              <h1 className="font-bold">SupportAI</h1>

              <p className="text-xs text-slate-500">Account settings</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/support"
              className="hidden rounded-xl px-4 py-2 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-white sm:block"
            >
              Dashboard
            </Link>

            <Link
              to="/support/chat"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-blue-700"
            >
              <MessageSquare className="h-4 w-4" />

              <span className="hidden sm:inline">New conversation</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================
          MAIN
      ======================================================== */}

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Heading */}

        <div className="mb-8">
          <p className="mb-2 text-sm text-slate-600">Account</p>

          <h2 className="text-3xl font-bold">Profile & Settings</h2>

          <p className="mt-2 max-w-2xl text-slate-500">
            Manage your personal information, security, notifications, and
            SupportAI preferences.
          </p>
        </div>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />

            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto cursor-pointer"
              aria-label="Close error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ======================================================
            SUCCESS
        ====================================================== */}

        {saveMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-400">
            <Check className="h-4 w-4 shrink-0" />

            <span>{saveMessage}</span>

            <button
              type="button"
              onClick={() => setSaveMessage("")}
              className="ml-auto cursor-pointer"
              aria-label="Close success message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ======================================================
            PROFILE LOADING
        ====================================================== */}

        {loadingProfile ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

              <p className="text-sm text-slate-500">Loading your profile...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* ==================================================
                SIDEBAR
            ================================================== */}

            <aside>
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
                {/* User mini profile */}

                <div className="border-b border-slate-800 p-5">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 sm:h-14 sm:w-14">
                      {profile.avatar ? (
                        <img
                          src={getAvatarUrl(profile.avatar)}
                          alt={profile.name || "Profile"}
                          className="h-full w-full rounded-2xl object-cover"
                          onError={(e) => {
                            console.error(
                              "Avatar failed to load:",
                              e.currentTarget.src,
                            );

                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-2xl bg-blue-600 text-base font-bold sm:text-lg">
                          {getInitials()}
                        </div>
                      )}

                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 sm:h-3.5 sm:w-3.5 ${
                          isActive ? "bg-emerald-500" : "bg-slate-500"
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {profile.name || "Customer"}
                      </p>

                      <p className="truncate text-xs text-slate-600">
                        {profile.email || "No email available"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Navigation */}

                <nav className="p-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;

                    const active = activeSection === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveSection(item.id);
                          setError("");
                          setSaveMessage("");
                        }}
                        className={`mb-1 flex w-full cursor-pointer items-center gap-3 rounded-xl p-3 text-left transition ${
                          active
                            ? "bg-blue-500/10 text-blue-400"
                            : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium">{item.label}</p>

                          <p
                            className={`mt-0.5 truncate text-[10px] ${
                              active ? "text-blue-400/60" : "text-slate-700"
                            }`}
                          >
                            {item.description}
                          </p>
                        </div>

                        {active && <ChevronRight className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </nav>

                {/* Logout */}

                <div className="border-t border-slate-800 p-2">
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-xl p-3 text-left text-slate-500 transition hover:bg-red-500/5 hover:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />

                    <span className="text-xs font-medium">Sign out</span>
                  </button>
                </div>
              </div>

              {/* Account status */}

              <div
                className={`mt-4 rounded-2xl border p-4 ${
                  isActive
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-amber-500/20 bg-amber-500/5"
                }`}
              >
                <div className="flex gap-3">
                  <ShieldCheck
                    className={`h-5 w-5 shrink-0 ${
                      isActive ? "text-emerald-400" : "text-amber-400"
                    }`}
                  />

                  <div>
                    <p
                      className={`text-xs font-semibold ${
                        isActive ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      Account {statusLabel.toLowerCase()}
                    </p>

                    <p className="mt-1 text-[10px] leading-4 text-slate-600">
                      Your SupportAI account is currently{" "}
                      {statusLabel.toLowerCase()}.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* ==================================================
                CONTENT
            ================================================== */}

            <section className="min-w-0">
              {/* ==================================================
                  PROFILE INFORMATION
              ================================================== */}

              {activeSection === "profile" && (
                <div className="space-y-6">
                  {/* Profile card */}

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
                    <div className="flex flex-col justify-between gap-5 border-b border-slate-800 p-6 sm:flex-row sm:items-center">
                      <div>
                        <h3 className="font-semibold">Profile information</h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Update your personal information.
                        </p>
                      </div>

                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(true);
                            setError("");
                            setSaveMessage("");
                          }}
                          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit profile
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleCancelEditing}
                            disabled={savingProfile}
                            className="cursor-pointer rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-400 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={handleSaveProfile}
                            disabled={savingProfile}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {savingProfile ? (
                              <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4" />
                                Save changes
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      {/* Avatar */}

                      <div className="mb-8 flex items-center gap-5">
                        <div className="relative">
                          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-blue-600 text-2xl font-bold">
                            {profile.avatar ? (
                              <img
                                src={getAvatarUrl(profile.avatar)}
                                alt={profile.name || "Profile"}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <span>{getInitials()}</span>
                            )}
                          </div>

                          {isEditing && (
                            <>
                              <input
                                id="avatar-upload"
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                className="hidden"
                                onChange={handleAvatarChange}
                              />

                              <label
                                htmlFor="avatar-upload"
                                className="absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border-4 border-slate-900 bg-slate-800 text-slate-300 transition hover:bg-slate-700"
                                title="Change profile picture"
                              >
                                <Camera className="h-4 w-4" />
                              </label>
                            </>
                          )}
                        </div>

                        <div>
                          <h4 className="text-lg font-semibold">
                            {profile.name || "Customer"}
                          </h4>

                          <p className="mt-1 text-sm text-slate-500">
                            Customer account
                          </p>

                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                isActive ? "bg-emerald-500" : "bg-slate-500"
                              }`}
                            />

                            <span
                              className={`text-xs ${
                                isActive ? "text-emerald-400" : "text-slate-500"
                              }`}
                            >
                              {statusLabel} account
                            </span>
                          </div>

                          {isEditing && (
                            <p className="mt-2 text-xs text-slate-600">
                              JPG, PNG or WEBP · Maximum 5MB
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Form */}

                      <div className="grid gap-5 md:grid-cols-2">
                        {/* Name */}

                        <div>
                          <label className="mb-2 block text-xs font-medium text-slate-400">
                            Full name
                          </label>

                          <div className="relative">
                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                            <input
                              type="text"
                              name="name"
                              value={profile.name}
                              onChange={handleProfileChange}
                              disabled={!isEditing}
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                              placeholder="Enter your full name"
                            />
                          </div>
                        </div>

                        {/* Email */}

                        <div>
                          <label className="mb-2 block text-xs font-medium text-slate-400">
                            Email address
                          </label>

                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                            <input
                              type="email"
                              name="email"
                              value={profile.email}
                              onChange={handleProfileChange}
                              disabled={!isEditing}
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                              placeholder="Enter your email"
                            />
                          </div>
                        </div>

                        {/* Phone */}

                        <div>
                          <label className="mb-2 block text-xs font-medium text-slate-400">
                            Phone number
                          </label>

                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                            <input
                              type="tel"
                              name="phone"
                              value={profile.phone}
                              onChange={handleProfileChange}
                              disabled={!isEditing}
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                              placeholder="Enter your phone number"
                            />
                          </div>
                        </div>

                        {/* Company */}

                        <div>
                          <label className="mb-2 block text-xs font-medium text-slate-400">
                            Company
                          </label>

                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                            <input
                              type="text"
                              name="company"
                              value={profile.company}
                              onChange={handleProfileChange}
                              disabled={!isEditing}
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                              placeholder="Enter your company"
                            />
                          </div>
                        </div>

                        {/* Language */}

                        <div>
                          <label className="mb-2 block text-xs font-medium text-slate-400">
                            Language
                          </label>

                          <select
                            name="language"
                            value={profile.language}
                            onChange={handleProfileChange}
                            disabled={!isEditing}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <option value="English">English</option>

                            <option value="Urdu">Urdu</option>

                            <option value="German">German</option>

                            <option value="French">French</option>

                            <option value="Spanish">Spanish</option>
                          </select>
                        </div>

                        {/* Timezone */}

                        <div>
                          <label className="mb-2 block text-xs font-medium text-slate-400">
                            Timezone
                          </label>

                          <select
                            name="timezone"
                            value={profile.timezone}
                            onChange={handleProfileChange}
                            disabled={!isEditing}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <option value="Asia/Karachi">
                              Pakistan Standard Time
                            </option>

                            <option value="Europe/Berlin">
                              Central European Time
                            </option>

                            <option value="Europe/London">
                              Greenwich Mean Time
                            </option>

                            <option value="America/New_York">
                              Eastern Time
                            </option>

                            <option value="America/Los_Angeles">
                              Pacific Time
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account information */}

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
                    <div className="border-b border-slate-800 p-6">
                      <h3 className="font-semibold">Account information</h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Information about your SupportAI account.
                      </p>
                    </div>

                    <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Member since */}

                      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                        <div className="flex items-center gap-3">
                          <CalendarDays className="h-5 w-5 text-blue-400" />

                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-600">
                              Member since
                            </p>

                            <p className="mt-1 text-sm font-medium">
                              {formatMemberSince(
                                accountInfo.createdAt || user?.createdAt,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Last login */}

                      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                        <div className="flex items-center gap-3">
                          <Clock3 className="h-5 w-5 text-purple-400" />

                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-600">
                              Last seen
                            </p>

                            <p className="mt-1 text-sm font-medium">
                              {formatLastSeen(
                                accountInfo.lastSeen || user?.lastSeen,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Status */}

                      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                        <div className="flex items-center gap-3">
                          <ShieldCheck
                            className={`h-5 w-5 ${
                              isActive ? "text-emerald-400" : "text-amber-400"
                            }`}
                          />

                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-600">
                              Account status
                            </p>

                            <p
                              className={`mt-1 text-sm font-medium ${
                                isActive ? "text-emerald-400" : "text-amber-400"
                              }`}
                            >
                              {statusLabel}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================================================
                  SECURITY
              ================================================== */}

              {activeSection === "security" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
                    <div className="border-b border-slate-800 p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                          <KeyRound className="h-5 w-5" />
                        </div>

                        <div>
                          <h3 className="font-semibold">Change password</h3>

                          <p className="mt-1 text-sm text-slate-500">
                            Keep your account secure with a strong password.
                          </p>
                        </div>
                      </div>
                    </div>

                    <form
                      onSubmit={handleChangePassword}
                      className="space-y-5 p-6"
                    >
                      {/* Current password */}

                      <div>
                        <label className="mb-2 block text-xs font-medium text-slate-400">
                          Current password
                        </label>

                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            name="current"
                            value={passwords.current}
                            onChange={handlePasswordChange}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-12 text-sm text-white outline-none focus:border-blue-500"
                            placeholder="Enter current password"
                            autoComplete="current-password"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowCurrentPassword((prev) => !prev)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-600 hover:text-slate-400"
                            aria-label={
                              showCurrentPassword
                                ? "Hide current password"
                                : "Show current password"
                            }
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* New password */}

                      <div>
                        <label className="mb-2 block text-xs font-medium text-slate-400">
                          New password
                        </label>

                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                          <input
                            type={showNewPassword ? "text" : "password"}
                            name="newPassword"
                            value={passwords.newPassword}
                            onChange={handlePasswordChange}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-12 text-sm text-white outline-none focus:border-blue-500"
                            placeholder="Enter new password"
                            autoComplete="new-password"
                          />

                          <button
                            type="button"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-600 hover:text-slate-400"
                            aria-label={
                              showNewPassword
                                ? "Hide new password"
                                : "Show new password"
                            }
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Confirm password */}

                      <div>
                        <label className="mb-2 block text-xs font-medium text-slate-400">
                          Confirm new password
                        </label>

                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirm"
                            value={passwords.confirm}
                            onChange={handlePasswordChange}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-12 text-sm text-white outline-none focus:border-blue-500"
                            placeholder="Confirm new password"
                            autoComplete="new-password"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword((prev) => !prev)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-600 hover:text-slate-400"
                            aria-label={
                              showConfirmPassword
                                ? "Hide password confirmation"
                                : "Show password confirmation"
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Requirements */}

                      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                        <p className="text-xs font-medium text-slate-400">
                          Password requirements
                        </p>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {[
                            {
                              label: "At least 8 characters",
                              valid: passwords.newPassword.length >= 8,
                            },
                            {
                              label: "One uppercase letter",
                              valid: /[A-Z]/.test(passwords.newPassword),
                            },
                            {
                              label: "One number",
                              valid: /\d/.test(passwords.newPassword),
                            },
                            {
                              label: "One special character",
                              valid: /[^A-Za-z0-9]/.test(passwords.newPassword),
                            },
                          ].map((requirement) => (
                            <div
                              key={requirement.label}
                              className={`flex items-center gap-2 text-xs ${
                                requirement.valid
                                  ? "text-emerald-400"
                                  : "text-slate-600"
                              }`}
                            >
                              <Check
                                className={`h-3.5 w-3.5 ${
                                  requirement.valid
                                    ? "text-emerald-500"
                                    : "text-slate-700"
                                }`}
                              />

                              {requirement.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Submit */}

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={changingPassword}
                          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {changingPassword ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Update password
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Security information */}

                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                    <div className="flex gap-4">
                      <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-400" />

                      <div>
                        <h3 className="font-semibold">
                          Your account is protected
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          We recommend using a unique password and never sharing
                          your login credentials with anyone.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================================================
                  NOTIFICATIONS
              ================================================== */}

              {activeSection === "notifications" && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
                  <div className="border-b border-slate-800 p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                        <Bell className="h-5 w-5" />
                      </div>

                      <div>
                        <h3 className="font-semibold">
                          Notification preferences
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Choose which notifications you receive.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-800">
                    <PreferenceToggle
                      title="Email notifications"
                      description="Receive important account and support updates by email."
                      checked={notifications.email}
                      onChange={() =>
                        setNotifications((prev) => ({
                          ...prev,
                          email: !prev.email,
                        }))
                      }
                    />

                    <PreferenceToggle
                      title="Conversation updates"
                      description="Get notified when someone replies to your support conversation."
                      checked={notifications.conversation}
                      onChange={() =>
                        setNotifications((prev) => ({
                          ...prev,
                          conversation: !prev.conversation,
                        }))
                      }
                    />

                    <PreferenceToggle
                      title="Ticket updates"
                      description="Receive updates when the status of your support ticket changes."
                      checked={notifications.ticket}
                      onChange={() =>
                        setNotifications((prev) => ({
                          ...prev,
                          ticket: !prev.ticket,
                        }))
                      }
                    />

                    <PreferenceToggle
                      title="Product & marketing"
                      description="Receive product news, tips, announcements, and special offers."
                      checked={notifications.marketing}
                      onChange={() =>
                        setNotifications((prev) => ({
                          ...prev,
                          marketing: !prev.marketing,
                        }))
                      }
                    />
                  </div>

                  <div className="border-t border-slate-800 p-6">
                    <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4">
                      <div className="flex gap-3">
                        <Bell className="h-5 w-5 shrink-0 text-blue-400" />

                        <div>
                          <p className="text-sm font-medium text-blue-400">
                            Notification settings
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            These settings control your current notification
                            preferences. Persistent notification storage can be
                            connected to your account settings backend later.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================================================
                  SUPPORT PREFERENCES
              ================================================== */}

              {activeSection === "preferences" && (
                <div className="space-y-6">
                  {/* Preferences */}

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
                    <div className="border-b border-slate-800 p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                          <Headphones className="h-5 w-5" />
                        </div>

                        <div>
                          <h3 className="font-semibold">Support preferences</h3>

                          <p className="mt-1 text-sm text-slate-500">
                            Customize how SupportAI handles your requests.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-800">
                      <PreferenceToggle
                        title="AI-first support"
                        description="Let SupportAI attempt to resolve your issue before connecting you with an agent."
                        checked={supportPreferences.aiFirst}
                        onChange={() =>
                          setSupportPreferences((prev) => ({
                            ...prev,
                            aiFirst: !prev.aiFirst,
                          }))
                        }
                      />

                      <PreferenceToggle
                        title="Automatic escalation"
                        description="Automatically request a human agent when AI confidence is low."
                        checked={supportPreferences.autoEscalation}
                        onChange={() =>
                          setSupportPreferences((prev) => ({
                            ...prev,
                            autoEscalation: !prev.autoEscalation,
                          }))
                        }
                      />

                      <PreferenceToggle
                        title="Conversation feedback"
                        description="Ask me for feedback after a conversation is resolved."
                        checked={supportPreferences.satisfaction}
                        onChange={() =>
                          setSupportPreferences((prev) => ({
                            ...prev,
                            satisfaction: !prev.satisfaction,
                          }))
                        }
                      />
                    </div>

                    <div className="border-t border-slate-800 p-6">
                      <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4">
                        <div className="flex gap-3">
                          <Headphones className="h-5 w-5 shrink-0 text-blue-400" />

                          <div>
                            <p className="text-sm font-medium text-blue-400">
                              Support preferences
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              These preferences currently apply to this page
                              session. Your current User model does not yet
                              include database fields for these settings.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Support stats */}

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
                    <div className="border-b border-slate-800 p-6">
                      <h3 className="font-semibold">Your support activity</h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Your support activity can be connected to your analytics
                        API.
                      </p>
                    </div>

                    <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
                      <ActivityCard
                        icon={MessageSquare}
                        value="—"
                        label="Conversations"
                      />

                      <ActivityCard icon={Ticket} value="—" label="Tickets" />

                      <ActivityCard icon={Check} value="—" label="Resolved" />

                      <ActivityCard
                        icon={Clock3}
                        value="—"
                        label="Avg. AI response"
                      />
                    </div>
                  </div>

                  {/* Danger zone */}

                  <div className="rounded-2xl border border-red-500/20 bg-red-500/5">
                    <div className="border-b border-red-500/10 p-6">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-400" />

                        <div>
                          <h3 className="font-semibold text-red-400">
                            Danger zone
                          </h3>

                          <p className="mt-1 text-sm text-slate-600">
                            These actions can permanently affect your account.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-sm font-medium">Delete account</p>

                        <p className="mt-1 max-w-lg text-xs leading-5 text-slate-600">
                          Permanently delete your account and associated support
                          data. This action cannot be undone.
                        </p>
                      </div>

                      <button
                        type="button"
                        className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
                        onClick={() => {
                          setError("Account deletion is not available yet.");
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

/*
 * ================================================================
 * PREFERENCE TOGGLE
 * ================================================================
 */

const PreferenceToggle = ({ title, description, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between gap-5 p-6">
      <div>
        <p className="text-sm font-medium">{title}</p>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onChange}
        aria-pressed={checked}
        className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition ${
          checked ? "bg-blue-600" : "bg-slate-800"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
};

/*
 * ================================================================
 * ACTIVITY CARD
 * ================================================================
 */

const ActivityCard = ({ icon: Icon, value, label }) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <Icon className="h-4 w-4 text-blue-400" />

      <p className="mt-3 text-2xl font-bold">{value}</p>

      <p className="mt-1 text-xs text-slate-600">{label}</p>
    </div>
  );
};

export default Profile;
