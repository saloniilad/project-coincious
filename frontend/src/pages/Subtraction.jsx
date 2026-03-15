import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import MathGame from "../components/MathGame";
import { ChevronLeft } from "lucide-react";
import roadImg from "../assets/bg.png";
import { useNavigate } from "react-router-dom";

const TOTAL_LEVELS = 10;
const STARS_REQUIRED_TO_UNLOCK = 10;

export default function Subtraction() {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [totalStars, setTotalStars] = useState(0);
  const [profileName, setProfileName] = useState("Student");
  const loadProgressFromBackend = async (name) => {
  try {
    const res = await fetch(
      `http://localhost:8000/api/progress/load/?name=${encodeURIComponent(name)}`
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

  useEffect(() => {
  
    const storedUser = localStorage.getItem("user");
  
    if (storedUser) {
      setProfileName(storedUser);
  
      loadProgressFromBackend(storedUser).then(() => {
  
        let unlocked = 1;
  
  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    const stars = Number(localStorage.getItem(`subtraction_level_${i}_stars`)) || 0;
  
    if (stars > 0) {
      unlocked = i + 1;
    }
  }
  
  setUnlockedLevel(unlocked);
  
        calculateTotalStars();
  
      });
  
    }
  
  }, []);

  const calculateTotalStars = () => {
    let sum = 0;
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
      sum += Number(localStorage.getItem(`subtraction_level_${i}_stars`)) || 0;
    }
    setTotalStars(sum);
  };

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
      localStorage.setItem("subtraction_unlocked", next);
      setUnlockedLevel(next);
    }
  };

  if (selectedLevel) {
    return (
      <MathGame
        module="subtraction"
        symbol="−"
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

      <div className="w-full bg-white shadow-sm border-b">
           
             <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4 md:px-8 py-4 gap-4">
           
               {/* LEFT SECTION */}
               <div className="flex items-center gap-4">
           
                 <button
                   onClick={() => navigate("/math")}
                   className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-200 transition text-sm md:text-base"
                 >
                   <ChevronLeft size={18}/>
                   Back
                 </button>
           
                 <div className="flex items-center gap-3">
           
                   <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-100 flex items-center justify-center text-xl md:text-2xl">
                     ➖
                   </div>
           
                   <div>
                     <h1 className="text-xl md:text-3xl font-bold text-gray-800">
                       Subtraction
                     </h1>
           
                     <p className="text-xs md:text-sm text-gray-500">
                       Practice subtraction with fun levels
                     </p>
                   </div>
           
                 </div>
           
               </div>
           
           
               {/* RIGHT SECTION */}
               <div className="flex flex-col items-start md:items-end gap-2">
           
                 <div className="text-sm font-semibold text-gray-600">
                   ⭐ {totalStars} / {TOTAL_LEVELS * 3} Stars
                 </div>
           
                 {/* Progress bar */}
                 <div className="w-full md:w-64 bg-gray-200 rounded-full h-2 overflow-hidden">
                   <div
                     className="bg-green-500 h-2 transition-all duration-500"
                     style={{
                       width: `${(totalStars / (TOTAL_LEVELS * 3)) * 100}%`
                     }}
                   />
                 </div>
           
                 {totalStars >= STARS_REQUIRED_TO_UNLOCK && (
                   <span className="text-green-600 text-xs md:text-sm font-semibold">
                     ✅ Multiplication unlocked
                   </span>
                 )}
           
               </div>
           
             </div>
           
           </div>

      <div className="flex justify-center pb-20 px-4">
        <div className="relative w-full h-[90vh]">
          <img
            src={roadImg}
            alt="road"
            className="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-xl"
          />

          {Array.from({ length: TOTAL_LEVELS }, (_, i) => {
            const level = i + 1;
            const pos = getLevelPos(i);
            const stars = Number(localStorage.getItem(`subtraction_level_${level}_stars`)) || 0;
            const isUnlocked = level <= unlockedLevel;

            return (
              <div
                key={level}
                onClick={() => isUnlocked && setSelectedLevel(level)}
                className={`absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center text-white font-bold shadow-lg
                  ${isUnlocked ? "bg-green-500 cursor-pointer hover:scale-110 transition-transform" : "bg-gray-400"}`}
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
                className="absolute text-4xl sm:text-5xl transition-all duration-1000 pointer-events-none"
                style={{
                  left: `${getLevelPos(Math.min(unlockedLevel, TOTAL_LEVELS) - 1).x}%`,
                  top: `${getLevelPos(Math.min(unlockedLevel, TOTAL_LEVELS) - 1).y}%`,
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