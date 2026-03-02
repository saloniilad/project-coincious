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

// Save current localStorage progress to backend
export async function syncProgressToBackend(name) {
  try {
    const progress = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Only sync game progress keys
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

export default function Profile() {
  const [profileName, setProfileName] = useState("Student");
  const [email, setEmail] = useState("");
  const [totalStars, setTotalStars] = useState(0);
  const [levelsDone, setLevelsDone] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [moduleStats, setModuleStats] = useState({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [syncStatus, setSyncStatus] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("user");
    const storedEmail = localStorage.getItem("email");

    if (storedName) setProfileName(storedName);
    if (storedEmail) setEmail(storedEmail);

    initProfile(storedName, storedEmail);
  }, []);

  const initProfile = async (storedName, storedEmail) => {
    setLoadingProfile(true);

    // 1. Fetch profile from backend (ensures email is always fresh)
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

    // 2. Load progress from backend and merge into localStorage
    if (storedName) {
      try {
        const res = await fetch(
          `${API_BASE}/progress/load/?name=${encodeURIComponent(storedName)}`
        );
        if (res.ok) {
          const data = await res.json();
          const backendProgress = data.progress || {};

          // Merge: backend wins for any key it has
          Object.entries(backendProgress).forEach(([key, value]) => {
            localStorage.setItem(key, value);
          });
        }
      } catch {
        // Fall back to existing localStorage
      }
    }

    // 3. Build stats from merged localStorage
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

      <div className="max-w-4xl mx-auto py-10 px-6">

        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto bg-orange-200 rounded-full flex items-center justify-center text-4xl mb-4">
            👤
          </div>

          <h2 className="text-2xl font-bold">{profileName}</h2>
          <p className="text-gray-500">{email || "—"}</p>

          {/* Sync button */}
          <button
            onClick={handleSyncNow}
            className="mt-3 text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-2 rounded-full transition"
          >
            ☁️ Save Progress to Cloud
          </button>
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