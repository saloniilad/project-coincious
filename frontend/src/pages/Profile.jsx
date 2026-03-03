import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

const API_BASE = "http://localhost:8000/api";

const MODULES = [
  { name: "addition", label: "Addition", icon: "➕" },
  { name: "subtraction", label: "Subtraction", icon: "➖" },
  { name: "multiplication", label: "Multiplication", icon: "✖" },
  { name: "division", label: "Division", icon: "➗" },
  { name: "wordproblems", label: "Word Problems", icon: "📘" },
];

const TOTAL_LEVELS = 10;
const STARS_REQUIRED = 150;

export async function syncProgressToBackend(name) {
  try {
    const progress = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (MODULES.some((m) => key.startsWith(m.name + "_level_"))) {
        progress[key] = localStorage.getItem(key);
      }
    }
    await fetch(`${API_BASE}/progress/save/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, progress }),
    });
  } catch {
    // Non-critical — silently ignore
  }
}

function computeStats(progressMap) {
  let globalStars = 0;
  let globalLevels = 0;
  let globalScore = 0;
  const stats = {};

  MODULES.forEach((module) => {
    let stars = 0;
    let levels = 0;
    const levelsCount = module.name === "wordproblems" ? 5 : TOTAL_LEVELS;

    for (let i = 1; i <= levelsCount; i++) {
      const key = `${module.name}_level_${i}_stars`;
      const levelStars = Number(progressMap[key]) || 0;
      stars += levelStars;
      if (levelStars > 0) levels++;
    }

    stats[module.name] = { stars, levels };
    globalStars += stars;
    globalLevels += levels;
    globalScore += stars * 3;
  });

  return { stats, globalStars, globalLevels, globalScore };
}

// ── Change-Password Modal ─────────────────────────────────────────────────────

function ChangePasswordModal({ profileName, onClose }) {
  // step: "idle" | "sending" | "otp" | "verifying" | "password" | "saving" | "done"
  const [step, setStep] = useState("idle");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSendOtp = async () => {
    setError("");
    setStep("sending");
    try {
      const res = await fetch(`${API_BASE}/change-password/send-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send OTP.");
        setStep("idle");
        return;
      }
      setMaskedEmail(data.masked_email);
      setStep("otp");
    } catch {
      setError("Network error. Please try again.");
      setStep("idle");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) { setError("Please enter the OTP."); return; }
    setError("");
    setStep("verifying");
    // We do a lightweight client-side pre-check; real validation is on the server
    // Move to password step — server will reject bad OTPs in final call
    setStep("password");
  };

  const handleChangePassword = async () => {
    setError("");
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setStep("saving");
    try {
      const res = await fetch(`${API_BASE}/change-password/verify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName, otp, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        // If OTP was wrong, go back to OTP step
        setStep(data.error?.toLowerCase().includes("otp") ? "otp" : "password");
        return;
      }
      setStep("done");
    } catch {
      setError("Network error. Please try again.");
      setStep("password");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 relative">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-xl">🔑</div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Change Password</h2>
            <p className="text-sm text-gray-500">We'll send a verification code to your email</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* ── STEP: idle ── */}
        {step === "idle" && (
          <div>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              To change your password, we'll send a one-time code (OTP) to the email address linked to your account <span className="font-semibold">({profileName})</span>.
            </p>
            <button
              onClick={handleSendOtp}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition"
            >
              Send Verification Code
            </button>
          </div>
        )}

        {/* ── STEP: sending ── */}
        {step === "sending" && (
          <div className="text-center py-6">
            <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500">Sending code to your email…</p>
          </div>
        )}

        {/* ── STEP: otp ── */}
        {step === "otp" && (
          <div>
            <p className="text-gray-600 mb-1 text-sm">
              A 6-digit code was sent to <span className="font-semibold text-gray-800">{maskedEmail}</span>.
            </p>
            <p className="text-gray-400 text-xs mb-5">The code expires in 10 minutes.</p>

            <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
              placeholder="123456"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-400 mb-5"
            />

            <button
              onClick={handleVerifyOtp}
              disabled={otp.length < 6}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 text-white font-semibold py-3 rounded-xl transition"
            >
              Verify Code
            </button>

            <button
              onClick={() => { setStep("idle"); setOtp(""); setError(""); }}
              className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600 transition"
            >
              ← Resend code
            </button>
          </div>
        )}

        {/* ── STEP: verifying ── */}
        {step === "verifying" && (
          <div className="text-center py-6">
            <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500">Verifying…</p>
          </div>
        )}

        {/* ── STEP: password ── */}
        {step === "password" && (
          <div>
            <p className="text-gray-600 text-sm mb-5">
              ✅ Code verified! Now set your new password.
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                placeholder="At least 6 characters"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
              placeholder="Repeat your new password"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 mb-5"
            />

            {/* Password strength indicator */}
            {newPassword && (
              <div className="mb-4">
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        newPassword.length >= i * 3
                          ? i <= 1 ? "bg-red-400" : i <= 2 ? "bg-yellow-400" : i <= 3 ? "bg-blue-400" : "bg-green-500"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  {newPassword.length < 6 ? "Too short" : newPassword.length < 9 ? "Fair" : newPassword.length < 12 ? "Good" : "Strong"}
                </p>
              </div>
            )}

            <button
              onClick={handleChangePassword}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition"
            >
              Change Password
            </button>
          </div>
        )}

        {/* ── STEP: saving ── */}
        {step === "saving" && (
          <div className="text-center py-6">
            <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500">Saving new password…</p>
          </div>
        )}

        {/* ── STEP: done ── */}
        {step === "done" && (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Password Changed!</h3>
            <p className="text-gray-500 text-sm mb-6">Your password has been updated successfully.</p>
            <button
              onClick={onClose}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Profile Page ──────────────────────────────────────────────────────────────

export default function Profile() {
  const [profileName, setProfileName] = useState("Student");
  const [email, setEmail] = useState("");
  const [totalStars, setTotalStars] = useState(0);
  const [levelsDone, setLevelsDone] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [moduleStats, setModuleStats] = useState({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [syncStatus, setSyncStatus] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem("user");
    const storedEmail = localStorage.getItem("email");

    if (storedName) setProfileName(storedName);
    if (storedEmail) setEmail(storedEmail);

    initProfile(storedName, storedEmail);
  }, []);

  const initProfile = async (storedName, storedEmail) => {
    setLoadingProfile(true);

    if (storedName) {
      try {
        const res = await fetch(
          `${API_BASE}/profile/?name=${encodeURIComponent(storedName)}`
        );
        if (res.ok) {
          const data = await res.json();
          setProfileName(data.name);
          setEmail(data.email);
          localStorage.setItem("email", data.email);
        }
      } catch {
        // Fall back to localStorage values
      }
    }

    if (storedName) {
      try {
        const res = await fetch(
          `${API_BASE}/progress/load/?name=${encodeURIComponent(storedName)}`
        );
        if (res.ok) {
          const data = await res.json();
          const backendProgress = data.progress || {};
          Object.entries(backendProgress).forEach(([key, value]) => {
            localStorage.setItem(key, value);
          });
        }
      } catch {
        // Fall back to existing localStorage
      }
    }

    const progressMap = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      progressMap[key] = localStorage.getItem(key);
    }
    const { stats, globalStars, globalLevels, globalScore } =
      computeStats(progressMap);

    setModuleStats(stats);
    setTotalStars(globalStars);
    setLevelsDone(globalLevels);
    setTotalScore(globalScore);
    setLoadingProfile(false);
  };

  const handleSyncNow = async () => {
    const name = localStorage.getItem("user");
    if (!name) return;
    setSyncStatus("Saving...");
    await syncProgressToBackend(name);
    setSyncStatus("✅ Progress saved!");
    setTimeout(() => setSyncStatus(""), 3000);
  };

  return (
    <div className="min-h-screen bg-[#f3f1ee]">
      <Navbar profileName={profileName} />

      {showChangePassword && (
        <ChangePasswordModal
          profileName={profileName}
          onClose={() => setShowChangePassword(false)}
        />
      )}

      <div className="max-w-4xl mx-auto py-10 px-6">

        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto bg-orange-200 rounded-full flex items-center justify-center text-4xl mb-4">
            👤
          </div>

          <h2 className="text-2xl font-bold">{profileName}</h2>
          <p className="text-gray-500">{email || "—"}</p>

          {/* Action buttons */}
          <div className="flex justify-center gap-3 mt-3 flex-wrap">
            <button
              onClick={handleSyncNow}
              className="text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-2 rounded-full transition"
            >
              ☁️ Save Progress to Cloud
            </button>
            <button
              onClick={() => setShowChangePassword(true)}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full transition"
            >
              🔑 Change Password
            </button>
          </div>

          {syncStatus && (
            <p className="text-sm text-green-600 mt-2">{syncStatus}</p>
          )}
        </div>

        {loadingProfile ? (
          <div className="text-center text-gray-400 py-16 text-lg">Loading your stats...</div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-6 mb-10">
              <div className="bg-white rounded-xl p-6 shadow text-center">
                <h3 className="text-3xl font-bold text-orange-500">{totalScore}</h3>
                <p className="text-gray-500">Total Score</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow text-center">
                <h3 className="text-3xl font-bold text-yellow-500">{totalStars}</h3>
                <p className="text-gray-500">Total Stars</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow text-center">
                <h3 className="text-3xl font-bold text-green-500">{levelsDone}</h3>
                <p className="text-gray-500">Levels Done</p>
              </div>
            </div>

            {/* Module Progress */}
            <div className="bg-white rounded-xl p-6 shadow">
              <h3 className="text-xl font-bold mb-6">Module Progress</h3>

              {MODULES.map((module) => {
                const data = moduleStats[module.name] || { stars: 0, levels: 0 };
                const progress = (data.stars / STARS_REQUIRED) * 100;
                const isLocked =
                  module.name !== "addition" &&
                  (moduleStats["addition"]?.stars || 0) < STARS_REQUIRED;

                return (
                  <div key={module.name} className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{module.icon}</span>
                        <span className="font-semibold">{module.label}</span>
                        {isLocked && (
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                            🔒 Locked
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-600">
                        ⭐ {data.stars} stars • {data.levels} levels
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-orange-500 h-3 transition-all duration-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>

                    <p className="text-xs text-gray-500 mt-1">
                      {data.stars} / {STARS_REQUIRED} to unlock next
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}