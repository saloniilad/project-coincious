import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import MathGame from "../components/MathGame";
import { ChevronLeft } from "lucide-react";
import roadImg from "../assets/bg.png";

const TOTAL_LEVELS = 5;
const STARS_REQUIRED = 150;

export default function WordProblems() {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [totalStars, setTotalStars] = useState(0);
  const [profileName, setProfileName] = useState("Student");

  useEffect(() => {
    const saved =
      Number(localStorage.getItem("wordproblems_unlocked")) || 1;
    setUnlockedLevel(saved);

    const storedUser = localStorage.getItem("user");
    if (storedUser) setProfileName(storedUser);

    calculateTotalStars();
  }, []);

  const calculateTotalStars = () => {
    let sum = 0;
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
      sum +=
        Number(localStorage.getItem(`wordproblems_level_${i}_stars`)) || 0;
    }
    setTotalStars(sum);
  };

  const getLevelPos = (idx) => {
    const positions = [
      { x: 50, y: 80 },
      { x: 65, y: 65 },
      { x: 50, y: 50 },
      { x: 35, y: 35 },
      { x: 50, y: 20 },
    ];
    return positions[idx];
  };

  if (selectedLevel) {
    return (
      <MathGame
        module="wordproblems"
        symbol=""
        level={selectedLevel}
        onBack={() => {
          setSelectedLevel(null);
          calculateTotalStars();
        }}
        onComplete={(lvl) => {
          const next = lvl + 1;
          if (next <= TOTAL_LEVELS) {
            localStorage.setItem("wordproblems_unlocked", next);
            setUnlockedLevel(next);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f1ee]">
      <Navbar profileName={profileName} />

      <div className="max-w-4xl mx-auto px-6 pt-8">
        <div className="flex items-center gap-6 mb-4">
          <button
            onClick={() => window.history.back()}
            className="bg-blue-200 text-blue-800 px-5 py-2 rounded-2xl flex items-center gap-2"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <div>
            <h1 className="text-4xl font-bold text-[#3b2f1e]">
              📘 Word Problems
            </h1>
            <p className="text-lg text-[#8b7b65] mt-1">
              ⭐ Total Stars: {totalStars} / {STARS_REQUIRED}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center pb-20 px-4">
        <div className="relative w-full h-[80vh]">
          <img
            src={roadImg}
            alt="road"
            className="absolute inset-0 w-full h-full object-cover rounded-3xl"
          />

          {Array.from({ length: TOTAL_LEVELS }, (_, i) => {
            const level = i + 1;
            const pos = getLevelPos(i);
            const stars =
              Number(localStorage.getItem(`wordproblems_level_${level}_stars`)) || 0;
            const isUnlocked = level <= unlockedLevel;

            return (
              <div
                key={level}
                onClick={() => isUnlocked && setSelectedLevel(level)}
                className={`absolute w-16 h-16 rounded-full flex flex-col items-center justify-center text-white font-bold shadow-lg ${
                  isUnlocked ? "bg-orange-500" : "bg-gray-400"
                }`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
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

          {unlockedLevel && (
            <div
              className="absolute text-5xl transition-all duration-1000"
              style={{
                left: `${getLevelPos(unlockedLevel - 1).x}%`,
                top: `${getLevelPos(unlockedLevel - 1).y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              🚗
            </div>
          )}
        </div>
      </div>
    </div>
  );
}