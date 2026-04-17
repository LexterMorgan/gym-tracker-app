import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChartNoAxesColumn, Dumbbell, Home, CalendarDays, Moon, Sun, Plus, UserPen, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { getPendingMutationCount } from "../api/client";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/start", label: "Workout", icon: Dumbbell },
  { to: "/progress", label: "Progress", icon: ChartNoAxesColumn },
  { to: "/planner", label: "Planner", icon: CalendarDays },
];

export function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem("gym-theme") || "night");
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [pendingSync, setPendingSync] = useState(() => getPendingMutationCount());
  const [profileName, setProfileName] = useState(() => localStorage.getItem("gym-profile-name") || "Athlete");
  const [profileAvatar, setProfileAvatar] = useState(() => localStorage.getItem("gym-profile-avatar") || "");
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const fileInputRef = useRef(null);
  const [showNav, setShowNav] = useState(true);

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    []
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("gym-theme", theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem("gym-profile-name", profileName || "Athlete");
  }, [profileName]);
  useEffect(() => {
    if (profileAvatar) localStorage.setItem("gym-profile-avatar", profileAvatar);
    else localStorage.removeItem("gym-profile-avatar");
  }, [profileAvatar]);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onQueueUpdate = (event) => setPendingSync(event.detail?.pending ?? getPendingMutationCount());
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("gym-queue-updated", onQueueUpdate);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("gym-queue-updated", onQueueUpdate);
    };
  }, []);

  const onAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = typeof reader.result === "string" ? reader.result : "";
      if (data) setProfileAvatar(data);
    };
    reader.readAsDataURL(file);
  };

  const initials = (profileName || "A")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const movingDown = y > lastY;
      if (y < 40) setShowNav(true);
      else setShowNav(!movingDown);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-4 pb-24 pt-4">
      {(!online || pendingSync > 0) && (
        <div className="mb-2 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          {!online
            ? `Offline mode: ${pendingSync} changes queued for sync.`
            : `${pendingSync} queued changes syncing...`}
        </div>
      )}
      <header className="premium-surface mb-4 rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowProfileEditor((prev) => !prev)}
              className="relative h-10 w-10 overflow-hidden rounded-full bg-violet-500/35 ring-2 ring-violet-400/30"
              aria-label="Edit profile"
              title="Edit profile"
            >
              {profileAvatar ? (
                <img src={profileAvatar} alt="Profile avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-white">{initials || "A"}</span>
              )}
            </button>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-violet-300">Gym Tracker</p>
              <p className="text-sm font-medium text-white">{profileName || "Athlete"}</p>
              <p className="text-xs text-zinc-400">{todayLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/start"
              className="premium-control inline-flex h-9 w-9 items-center justify-center rounded-full text-white"
              aria-label="Quick start workout"
            >
              <Plus size={16} />
            </Link>
            <motion.button
              type="button"
              onClick={() => setTheme((prev) => (prev === "night" ? "day" : "night"))}
              className="premium-control rounded-full p-2 text-white"
              aria-label={theme === "night" ? "Switch to day mode" : "Switch to night mode"}
              title={theme === "night" ? "Switch to day mode" : "Switch to night mode"}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
            >
              <motion.span
                key={theme}
                initial={{ rotate: -25, opacity: 0, scale: 0.7 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="block"
              >
                {theme === "night" ? <Sun size={16} /> : <Moon size={16} />}
              </motion.span>
            </motion.button>
          </div>
        </div>
        {showProfileEditor && (
          <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-zinc-300">
              <UserPen size={14} />
              Profile
            </p>
            <div className="grid gap-2">
              <input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="premium-input rounded-lg border border-white/10 bg-black/20 p-2 text-sm"
                placeholder="Your name"
                maxLength={24}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="premium-button rounded-lg px-3 py-2 text-xs"
                >
                  Choose PFP
                </button>
                <button
                  type="button"
                  onClick={() => setProfileAvatar("")}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200"
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate("/login", { replace: true });
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs text-red-200"
                >
                  <LogOut size={12} />
                  Sign out
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onAvatarUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        )}
        <div className="h-px w-full bg-white/10" />
        <h1 className="mt-3 text-xl font-semibold text-white">
          {location.pathname === "/start"
            ? "Start Workout"
            : location.pathname === "/progress"
              ? "Progress"
              : location.pathname === "/planner"
                ? "Weekly Planner"
                : "Dashboard"}
        </h1>
      </header>
      {children}
      <motion.nav
        animate={{ y: showNav ? 0 : 100, opacity: showNav ? 1 : 0.7 }}
        transition={{ duration: 0.2 }}
        className="premium-surface fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-20 flex w-[95%] max-w-md -translate-x-1/2 justify-between p-2"
      >
        {navItems.map((item) => (
          <motion.div key={item.to} whileTap={{ scale: 0.93 }}>
            <NavLink key={item.to} to={item.to} className="relative block rounded-xl px-3 py-2 text-xs">
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 rounded-xl bg-violet-500/30 shadow-[0_0_14px_rgba(139,92,246,0.35)]"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex flex-col items-center gap-1">
                    <item.icon size={16} className={isActive ? "text-white" : "text-zinc-300"} />
                    <span className={`${isActive ? "text-white" : "text-zinc-300"} text-[10px]`}>{item.label}</span>
                  </span>
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </motion.nav>
    </div>
  );
}
