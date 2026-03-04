import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import MathGame from "../components/MathGame";
import { ChevronLeft } from "lucide-react";
import roadImg from "../assets/bg.png";
import { useNavigate } from "react-router-dom";

const TOTAL_LEVELS = 10;
// Max stars collectible = 10 levels × 3 stars = 30
// Requirement to unlock Subtraction = 10 stars (as per spec)
const STARS_REQUIRED_TO_UNLOCK = 10;

export default function Addition() {
  const navigate = useNavigate();

  const [selectedLevel, setSelectedLevel]   = useState(null);
  const [unlockedLevel, setUnlockedLevel]   = useState(1);
  const [totalStars, setTotalStars]         = useState(0);
  const [profileName, setProfileName]       = useState("Student");

  useEffect(() => {
    const saved = Number(localStorage.getItem("addition_unlocked")) || 1;
    setUnlockedLevel(saved);

    const storedUser = localStorage.getItem("user");
    if (storedUser) setProfileName(storedUser);

    calculateTotalStars();
  }, []);

  const calculateTotalStars = () => {
    let sum = 0;
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
      sum += Number(localStorage.getItem(`addition_level_${i}_stars`)) || 0;
    }
    setTotalStars(sum);
  };

  // Road positions mapped to the background image
  const getLevelPos = (idx) => {
    const positions = [
      { x: 50, y: 85 },
      { x: 60, y: 75 },
      { x: 70, y: 65 },
      { x: 60, y: 55 },
      { x: 50, y: 45 },
      { x: 40, y: 35 },
      { x: 30, y: 25 },
      { x: 40, y: 18 },
      { x: 55, y: 12 },
      { x: 70, y: 8  },
    ];
    return positions[idx];
  };

  const handleLevelComplete = (lvl) => {
    calculateTotalStars();
    const next = lvl + 1;
    if (next <= TOTAL_LEVELS) {
      localStorage.setItem("addition_unlocked", next);
      setUnlockedLevel(next);
    }
  };

  if (selectedLevel) {
    return (
      <MathGame
        module="addition"
        symbol="+"
        level={selectedLevel}
        onBack={() => {
          setSelectedLevel(null);
          calculateTotalStars();
        }}
        onComplete={handleLevelComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f1ee]">
      <Navbar profileName={profileName} />

      {/* HEADER */}
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <div className="flex items-center gap-6 mb-4">
          <button
            onClick={() => navigate("/math")}
            className="bg-blue-200 text-blue-800 px-5 py-2 rounded-2xl flex items-center gap-2 hover:bg-blue-300 transition"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#3b2f1e]">
              ➕ Addition
            </h1>
            <p className="text-sm sm:text-lg text-[#8b7b65] mt-1">
              ⭐ Total Stars: {totalStars} / {TOTAL_LEVELS * 3}
              {totalStars >= STARS_REQUIRED_TO_UNLOCK && (
                <span className="ml-3 text-green-600 font-semibold text-sm">
                  ✅ Subtraction unlocked!
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ROAD MAP */}
      <div className="flex justify-center pb-20 px-4">
        <div className="relative w-full h-[90vh]">
          <img
            src={roadImg}
            alt="road"
            className="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-xl"
          />

          {Array.from({ length: TOTAL_LEVELS }, (_, i) => {
            const level     = i + 1;
            const pos       = getLevelPos(i);
            const stars     = Number(localStorage.getItem(`addition_level_${level}_stars`)) || 0;
            const isUnlocked = level <= unlockedLevel;

            return (
              <div
                key={level}
                onClick={() => isUnlocked && setSelectedLevel(level)}
                className={`absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center text-white font-bold shadow-lg
                  ${isUnlocked ? "bg-orange-500 cursor-pointer hover:scale-110 transition-transform" : "bg-gray-400"}`}
                style={{
                  left:      `${pos.x}%`,
                  top:       `${pos.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {level}
                <div className="flex text-yellow-300 text-xs">
                  {[1, 2, 3].map((s) => (
                    <span key={s}>{s <= stars ? "★" : "☆"}</span>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Plane indicator at current unlocked level */}
          {unlockedLevel && (
            <div
              className="absolute text-4xl sm:text-5xl transition-all duration-1000 pointer-events-none"
              style={{
                left:      `${getLevelPos(unlockedLevel - 1).x}%`,
                top:       `${getLevelPos(unlockedLevel - 1).y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              ✈️
            </div>
          )}
        </div>
      </div>
    </div>
  );
}