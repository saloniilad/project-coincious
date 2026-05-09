import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import MathGame from "../components/MathGame";
import { ChevronLeft, ChevronRight } from "lucide-react";
import roadImg from "../assets/bg.png";
import { useNavigate } from "react-router-dom";

const LEVELS_PER_SET = 10;
const STARS_REQUIRED_TO_UNLOCK = 10;

const SET_POSITIONS = [
  { x: 50, y: 85 },
  { x: 60, y: 75 },
  { x: 70, y: 65 },
  { x: 60, y: 55 },
  { x: 50, y: 45 },
  { x: 40, y: 35 },
  { x: 30, y: 25 },
  { x: 40, y: 18 },
  { x: 55, y: 12 },
  { x: 70, y: 8 },
];

// FIX: Robust helper — finds the highest completed level from localStorage
// by scanning all keys rather than breaking at the first gap.
// Mirrors the fix applied to AdditionPage.
function getHighestCompletedLevel(prefix) {
  let highest = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(`${prefix}_level_`)) continue;
    const match = key.match(/_level_(\d+)_stars$/);
    if (!match) continue;
    const lvl   = Number(match[1]);
    const stars = Number(localStorage.getItem(key)) || 0;
    if (stars > 0 && lvl > highest) highest = lvl;
  }
  return highest;
}

export default function Division() {
  const navigate = useNavigate();

  const [selectedLevel, setSelectedLevel] = useState(null);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [totalStars,    setTotalStars]    = useState(0);
  const [profileName,   setProfileName]   = useState("Student");
  const [viewingSet,    setViewingSet]    = useState(0);

  const loadProgressFromBackend = async (name) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API}/progress/load/?name=${encodeURIComponent(name)}`,
      );
      const data = await res.json();
      const progress = data.progress || {};
      Object.entries(progress).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    } catch (err) {
      console.error("Failed loading progress:", err);
    }
  };

  // FIX: uses getHighestCompletedLevel — no early-break on gaps
  const recalcUnlocked = () => {
    const highest  = getHighestCompletedLevel("division");
    const unlocked = highest + 1;
    setUnlockedLevel(unlocked);
    return unlocked;
  };

  // FIX: scans all localStorage keys instead of breaking at first zero
  const recalcTotalStars = () => {
    let sum = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("division_level_") && key.endsWith("_stars")) {
        sum += Number(localStorage.getItem(key)) || 0;
      }
    }
    setTotalStars(sum);
    return sum;
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setProfileName(storedUser);
      loadProgressFromBackend(storedUser).then(() => {
        const unlocked = recalcUnlocked();
        recalcTotalStars();
        setViewingSet(Math.floor((unlocked - 1) / LEVELS_PER_SET));
      });
    }
  }, []);

  const handleLevelComplete = (lvl) => {
    recalcTotalStars();
    const currentUnlocked = Number(localStorage.getItem("division_unlocked")) || 1;
    const next = Math.max(currentUnlocked, lvl + 1);
    localStorage.setItem("division_unlocked", next);
    setUnlockedLevel(next);
    setViewingSet(Math.floor((next - 1) / LEVELS_PER_SET));
  };

  const setStart = viewingSet * LEVELS_PER_SET + 1;
  const setEnd   = setStart + LEVELS_PER_SET - 1;
  const maxSet   = Math.floor((unlockedLevel - 1) / LEVELS_PER_SET);

  if (selectedLevel) {
    return (
      <MathGame
        module="division"
        symbol="÷"
        level={selectedLevel}
        onBack={() => { setSelectedLevel(null); recalcTotalStars(); }}
        onComplete={handleLevelComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f1ee]">
      <Navbar profileName={profileName} />

      {/* Header */}
      <div className="w-full bg-white shadow-sm border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4 md:px-8 py-4 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/math")}
              className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-200 transition text-sm md:text-base"
            >
              <ChevronLeft size={18} /> Back
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-orange-100 flex items-center justify-center text-xl md:text-2xl">
                ➗
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-gray-800">Division</h1>
                <p className="text-xs md:text-sm text-gray-500">Practice division with fun levels</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="text-sm font-semibold text-gray-600">⭐ {totalStars} Stars · Level {unlockedLevel}</div>
            <div className="w-full md:w-64 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-orange-400 h-2 transition-all duration-500"
                style={{ width: `${Math.min((totalStars / (Math.max(maxSet, 0) * LEVELS_PER_SET * 3 + 30)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Set navigation */}
      <div className="flex items-center justify-center gap-4 py-3 bg-white border-b shadow-sm">
        <button
          onClick={() => setViewingSet((s) => Math.max(0, s - 1))}
          disabled={viewingSet === 0}
          className="px-3 py-1 rounded-lg bg-orange-100 text-orange-700 font-bold disabled:opacity-30 hover:bg-orange-200 transition flex items-center"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold text-gray-600 min-w-[120px] text-center">Levels {setStart} – {setEnd}</span>
        <button
          onClick={() => setViewingSet((s) => Math.min(maxSet, s + 1))}
          disabled={viewingSet >= maxSet}
          className="px-3 py-1 rounded-lg bg-orange-100 text-orange-700 font-bold disabled:opacity-30 hover:bg-orange-200 transition flex items-center"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Road map */}
      <div className="flex justify-center pb-20 px-4">
        <div className="relative w-full h-[90vh]">
          <img src={roadImg} alt="road" className="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-xl" />

          {Array.from({ length: LEVELS_PER_SET }, (_, i) => {
            const level      = setStart + i;
            const pos        = SET_POSITIONS[i];
            const stars      = Number(localStorage.getItem(`division_level_${level}_stars`)) || 0;
            const isUnlocked = level <= unlockedLevel;

            return (
              <div
                key={level}
                onClick={() => isUnlocked && setSelectedLevel(level)}
                className={`absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center text-white font-bold shadow-lg ${
                  isUnlocked
                    ? "bg-orange-400 cursor-pointer hover:scale-110 transition-transform"
                    : "bg-gray-400 cursor-not-allowed opacity-60"
                }`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}
              >
                {level}
                <div className="flex text-yellow-300 text-xs">
                  {[1, 2, 3].map((s) => <span key={s}>{s <= stars ? "★" : "☆"}</span>)}
                </div>
              </div>
            );
          })}

          {unlockedLevel >= setStart && unlockedLevel <= setEnd && (() => {
            const idx = Math.min(unlockedLevel - setStart, LEVELS_PER_SET - 1);
            const pos = SET_POSITIONS[idx];
            return (
              <div
                className="absolute text-4xl sm:text-5xl transition-all duration-1000 pointer-events-none"
                style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -160%)" }}
              >
                ✈️
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}