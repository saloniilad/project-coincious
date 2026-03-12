import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useLocation } from "react-router-dom";

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

function computeStats(progressMap) {
  let globalStars = 0;
  let globalLevels = 0;
  const stats = {};

  MODULES.forEach((module) => {
    let stars = 0;
    let levels = 0;

    const levelCount = module.name === "wordproblems" ? 10 : TOTAL_LEVELS;

    for (let i = 1; i <= levelCount; i++) {
      const key = `${module.name}_level_${i}_stars`;
      const levelStars = Number(progressMap[key]) || 0;

      stars += levelStars;
      if (levelStars > 0) levels++;
    }

    stats[module.name] = { stars, levels };

    globalStars += stars;
    globalLevels += levels;
  });

  const globalScore = globalStars * 3;

  return {
    stats,
    globalStars,
    globalLevels,
    globalScore,
  };
}

export default function Profile() {
  const location = useLocation();

  const [profileName, setProfileName] = useState("Student");
  const [email, setEmail] = useState("");

  const [moduleStats, setModuleStats] = useState({});
  const [totalStars, setTotalStars] = useState(0);
  const [levelsDone, setLevelsDone] = useState(0);
  const [totalScore, setTotalScore] = useState(0);

  const [loading, setLoading] = useState(true);

  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("user");
    const email = localStorage.getItem("email");

    if (name) setProfileName(name);
    if (email) setEmail(email);

    if (name) fetchProgress(name);
  }, [location]);

  const fetchProgress = async (name) => {
    try {
      const res = await fetch(
        `${API_BASE}/progress/load/?name=${encodeURIComponent(name)}`
      );

      const data = await res.json();
      const progressMap = data.progress || {};

      const { stats, globalStars, globalLevels, globalScore } =
        computeStats(progressMap);

      setModuleStats(stats);
      setTotalStars(globalStars);
      setLevelsDone(globalLevels);
      setTotalScore(globalScore);
    } catch (err) {
      console.log("Failed loading progress", err);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f3f1ee]">
      <Navbar profileName={profileName} />

      <div className="max-w-4xl mx-auto py-10 px-6">

        {/* Profile Header */}

        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto bg-orange-200 rounded-full flex items-center justify-center text-4xl mb-4">
            👤
          </div>

          <h2 className="text-2xl font-bold">{profileName}</h2>

          <p className="text-gray-500">{email}</p>

          <button
            onClick={() => setShowChangePassword(true)}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Change Password
          </button>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-16 text-lg">
            Loading stats...
          </div>
        ) : (
          <>
            {/* Stats Cards */}

            <div className="grid grid-cols-3 gap-6 mb-10">
              <div className="bg-white rounded-xl p-6 shadow text-center">
                <div className="text-2xl mb-2">🏆</div>
                <h3 className="text-3xl font-bold text-orange-500">
                  {totalScore}
                </h3>
                <p className="text-gray-500">Total Score</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow text-center">
                <div className="text-2xl mb-2">⭐</div>
                <h3 className="text-3xl font-bold text-yellow-500">
                  {totalStars}
                </h3>
                <p className="text-gray-500">Total Stars</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow text-center">
                <div className="text-2xl mb-2">📈</div>
                <h3 className="text-3xl font-bold text-green-500">
                  {levelsDone}
                </h3>
                <p className="text-gray-500">Levels Done</p>
              </div>
            </div>

            {/* Module Progress */}

            <div className="bg-white rounded-xl p-6 shadow">
              <h3 className="text-xl font-bold mb-6">Module Progress</h3>

              {MODULES.map((module) => {
                const data = moduleStats[module.name] || {
                  stars: 0,
                  levels: 0,
                };

                const progress = (data.stars / STARS_REQUIRED) * 100;

                return (
                  <div key={module.name} className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{module.icon}</span>
                        <span className="font-semibold">{module.label}</span>
                      </div>

                      <span className="text-sm text-gray-600">
                        ⭐ {data.stars} stars • {data.levels} levels
                      </span>
                    </div>

                    <div className="w-full bg-yellow-100 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-orange-500 h-3 transition-all duration-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
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

      {showChangePassword && (
        <ChangePasswordModal
          profileName={profileName}
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </div>
  );
}

function ChangePasswordModal({ profileName, onClose }) {
  const [step, setStep] = useState("idle");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    setError("");
    setStep("sending");

    try {
      const res = await fetch(`${API_BASE}/change-password/send-otp/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: profileName
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send OTP");
        setStep("idle");
        return;
      }

      setMaskedEmail(data.masked_email);
      setStep("otp");

    } catch {
      setError("Network error");
      setStep("idle");
    }
  };

  const handleChangePassword = async () => {

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setStep("saving");

    try {

      const res = await fetch(`${API_BASE}/change-password/verify/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: profileName,
          otp: otp,
          new_password: newPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error changing password");
        setStep("otp");
        return;
      }

      setStep("done");

    } catch {
      setError("Network error");
      setStep("otp");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

      <div className="bg-white p-8 rounded-xl w-[400px] shadow-lg">

        <h2 className="text-xl font-bold mb-4">
          Change Password
        </h2>

        {error && (
          <p className="text-red-500 text-sm mb-3">
            {error}
          </p>
        )}

        {step === "idle" && (
          <button
            onClick={handleSendOtp}
            className="w-full bg-orange-500 text-white py-2 rounded-lg"
          >
            Send OTP
          </button>
        )}

        {step === "otp" && (
          <>
            <p className="text-sm mb-2">
              OTP sent to {maskedEmail}
            </p>

            <input
              value={otp}
              onChange={(e)=>setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="border p-2 w-full mb-3"
            />

            <button
              onClick={()=>setStep("password")}
              className="w-full bg-orange-500 text-white py-2 rounded-lg"
            >
              Verify OTP
            </button>
          </>
        )}

        {step === "password" && (
          <>
            <input
              type="password"
              value={newPassword}
              onChange={(e)=>setNewPassword(e.target.value)}
              placeholder="New Password"
              className="border p-2 w-full mb-3"
            />

            <input
              type="password"
              value={confirmPassword}
              onChange={(e)=>setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="border p-2 w-full mb-3"
            />

            <button
              onClick={handleChangePassword}
              className="w-full bg-orange-500 text-white py-2 rounded-lg"
            >
              Change Password
            </button>
          </>
        )}

        {step === "done" && (
          <p className="text-green-600 font-semibold">
            Password updated successfully!
          </p>
        )}

        <button
          onClick={onClose}
          className="mt-4 text-gray-500 text-sm"
        >
          Cancel
        </button>

      </div>

    </div>
  );
}