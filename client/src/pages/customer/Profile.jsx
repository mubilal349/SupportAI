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
import axios from "axios";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const API_URL = "http://localhost:8000/api";

const Profile = () => {
  const { user, logout } = useAuth();

  const [activeSection, setActiveSection] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);

  // IMPORTANT:
  // This is the loading state used by the JSX below.
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [savingProfile, setSavingProfile] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    timezone: "Asia/Karachi",
    language: "English",
    avatar: "",
    avatarFile: undefined,
  });

  const [passwords, setPasswords] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [notifications, setNotifications] = useState({
    email: true,
    conversation: true,
    ticket: true,
    marketing: false,
  });

  const [supportPreferences, setSupportPreferences] = useState({
    aiFirst: true,
    autoEscalation: true,
    satisfaction: true,
  });

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

    return `http://localhost:8000${normalizedPath}`;
  };

  /*
   * ============================================================
   * LOAD PROFILE
   * ============================================================
   */

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      setError("");

      const response = await api.get("/customer/profile");

      console.log("PROFILE RESPONSE:", response.data);

      if (response.data?.success && response.data?.user) {
        const user = response.data.user;

        setProfile({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          company: user.company || "",
          timezone: user.timezone || "Asia/Karachi",
          language: user.language || "English",
          avatar: user.avatar || "",
          avatarFile: undefined,
        });
      }
    } catch (err) {
      console.error("Load profile error:", err.response?.data || err.message);

      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

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
  };

  /*
   * ============================================================
   * SAVE PROFILE + AVATAR
   * ============================================================
   */

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      setError("");
      setSaveMessage("");

      const formData = new FormData();

      formData.append("name", profile.name || "");
      formData.append("email", profile.email || "");
      formData.append("phone", profile.phone || "");
      formData.append("company", profile.company || "");
      formData.append("timezone", profile.timezone || "Asia/Karachi");
      formData.append("language", profile.language || "English");

      if (profile.avatarFile) {
        formData.append("avatar", profile.avatarFile);
      }

      const response = await api.put("/customer/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("UPDATED PROFILE:", response.data);

      if (response.data?.success && response.data?.user) {
        const updatedUser = response.data.user;

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

        setIsEditing(false);
        setSaveMessage("Profile updated successfully.");

        setTimeout(() => {
          setSaveMessage("");
        }, 3000);
      }
    } catch (err) {
      console.error("Save profile error:", err.response?.data || err.message);

      setError(
        err.response?.data?.message ||
          "Unable to update your profile. Please try again.",
      );
    } finally {
      setSavingProfile(false);
    }
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

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, or WEBP image.");
      return;
    }

    // Validate file size - 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError("Profile picture must be smaller than 5MB.");
      return;
    }

    /*
     * Create temporary preview.
     */
    const previewUrl = URL.createObjectURL(file);

    setProfile((prev) => ({
      ...prev,
      avatar: previewUrl,
      avatarFile: file,
    }));
  };

  /*
   * ============================================================
   * PASSWORD
   * ============================================================
   */

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswords((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required. Please log in again.");
        return;
      }

      await axios.put(
        `${API_URL}/customer/password`,
        {
          currentPassword: passwords.current,
          newPassword: passwords.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

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
        err.response?.data?.message || "Unable to change your password.",
      );
    }
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
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600"
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

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />

            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Success */}
        {saveMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-400">
            <Check className="h-4 w-4 shrink-0" />

            <span>{saveMessage}</span>

            <button
              type="button"
              onClick={() => setSaveMessage("")}
              className="ml-auto"
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
                    <div className="relative">
                      {profile.avatar ? (
                        <img
                          src={getAvatarUrl(profile.avatar)}
                          alt={profile.name || "Profile"}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            console.error(
                              "Avatar failed to load:",
                              e.currentTarget.src,
                            );
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold">
                          {getInitials()}
                        </div>
                      )}

                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 bg-emerald-500" />
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
                        className={`mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left transition cursor-pointer ${
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
                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-slate-500 transition hover:bg-red-500/5 hover:text-red-400 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />

                    <span className="text-xs font-medium">Sign out</span>
                  </button>
                </div>
              </div>

              {/* Account status */}
              <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex gap-3">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />

                  <div>
                    <p className="text-xs font-semibold text-emerald-400">
                      Account secure
                    </p>

                    <p className="mt-1 text-[10px] leading-4 text-slate-600">
                      Your account is protected and currently in good standing.
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
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 cursor-pointer"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit profile
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditing(false);
                              setError("");
                              loadProfile();
                            }}
                            disabled={savingProfile}
                            className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-400 hover:bg-slate-800 disabled:opacity-50"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={handleSaveProfile}
                            disabled={savingProfile}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />

                            <span className="text-xs text-emerald-400">
                              Active account
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
                            <option>English</option>
                            <option>Urdu</option>
                            <option>German</option>
                            <option>French</option>
                            <option>Spanish</option>
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
                              {user?.createdAt
                                ? new Date(user.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "long",
                                      year: "numeric",
                                    },
                                  )
                                : "August 2026"}
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
                              Last login
                            </p>

                            <p className="mt-1 text-sm font-medium">Today</p>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="h-5 w-5 text-emerald-400" />

                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-600">
                              Account status
                            </p>

                            <p className="mt-1 text-sm font-medium text-emerald-400">
                              Verified
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
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowCurrentPassword((prev) => !prev)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
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
                          />

                          <button
                            type="button"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
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
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword((prev) => !prev)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
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
                            "At least 8 characters",
                            "One uppercase letter",
                            "One number",
                            "One special character",
                          ].map((requirement) => (
                            <div
                              key={requirement}
                              className="flex items-center gap-2 text-xs text-slate-600"
                            >
                              <Check className="h-3.5 w-3.5 text-emerald-500" />

                              {requirement}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Submit */}
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-700 cursor-pointer"
                        >
                          <Save className="h-4 w-4" />
                          Update password
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
                  </div>

                  {/* Support stats */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
                    <div className="border-b border-slate-800 p-6">
                      <h3 className="font-semibold">Your support activity</h3>

                      <p className="mt-1 text-sm text-slate-500">
                        A summary of your SupportAI usage.
                      </p>
                    </div>

                    <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
                      <ActivityCard
                        icon={MessageSquare}
                        value="10"
                        label="Conversations"
                      />

                      <ActivityCard icon={Ticket} value="9" label="Tickets" />

                      <ActivityCard icon={Check} value="8" label="Resolved" />

                      <ActivityCard
                        icon={Clock3}
                        value="1.8s"
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
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10 cursor-pointer"
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
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
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
