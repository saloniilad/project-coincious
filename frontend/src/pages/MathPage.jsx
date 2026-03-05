import Navbar from "../components/Navbar";
import { Plus, Minus, X, Divide, Lock, ChevronRight, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const TOTAL_LEVELS    = 10;
const WP_TOTAL_LEVELS = 5;
const STARS_TO_UNLOCK = 10;

// Defined OUTSIDE the component
const ModuleCard = ({ icon, color, title, subtitle, locked, stats, onClick }) => (
  <div
    onClick={locked ? undefined : onClick}
    className={`p-6 rounded-2xl shadow flex justify-between items-center
      ${locked ? "bg-gray-100 opacity-70" : "bg-white hover:shadow-lg cursor-pointer"}`}
  >
    <div className="flex gap-4 items-center">
      <div className={`w-14 h-14 ${color} text-white rounded-xl flex items-center justify-center shadow`}>
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          {title} {locked && <Lock size={16} />}
        </h2>
        <p className="text-gray-500 text-sm">
          {locked ? subtitle : `⭐ ${stats.stars} stars | 🏆 ${stats.levels} levels`}
        </p>
        {!locked && stats.stars > 0 && (
          <div className="flex gap-0.5 mt-1">
            {Array.from({ length: Math.min(stats.stars, 30) }).map((_, i) => (
              <span key={i} className="text-yellow-400 text-xs">★</span>
            ))}
          </div>
        )}
      </div>
    </div>
    {!locked && <ChevronRight className="text-gray-400 shrink-0" />}
  </div>
);

export default function MathPage() {
  const navigate = useNavigate();
  const [profileName,         setProfileName]         = useState("Student");
  const [additionStats,       setAdditionStats]       = useState({ stars: 0, levels: 0 });
  const [subtractionStats,    setSubtractionStats]    = useState({ stars: 0, levels: 0 });
  const [multiplicationStats, setMultiplicationStats] = useState({ stars: 0, levels: 0 });
  const [divisionStats,       setDivisionStats]       = useState({ stars: 0, levels: 0 });
  const [wordProblemStats,    setWordProblemStats]    = useState({ stars: 0, levels: 0 });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setProfileName(storedUser);
    loadStats();
  }, []);

  const calculateModuleStats = (mod, totalLevels = TOTAL_LEVELS) => {
    let stars = 0, completedLevels = 0;
    for (let i = 1; i <= totalLevels; i++) {
      const s = Number(localStorage.getItem(`${mod}_level_${i}_stars`)) || 0;
      stars += s;
      if (s > 0) completedLevels++;
    }
    return { stars, levels: completedLevels };
  };

  const loadStats = () => {
    setAdditionStats(calculateModuleStats("addition"));
    setSubtractionStats(calculateModuleStats("subtraction"));
    setMultiplicationStats(calculateModuleStats("multiplication"));
    setDivisionStats(calculateModuleStats("division"));
    setWordProblemStats(calculateModuleStats("wordproblems", WP_TOTAL_LEVELS));
  };

  const isSubtractionUnlocked    = additionStats.stars       >= STARS_TO_UNLOCK;
  const isMultiplicationUnlocked = subtractionStats.stars    >= STARS_TO_UNLOCK;
  const isDivisionUnlocked       = multiplicationStats.stars >= STARS_TO_UNLOCK;
  // Word Problems unlocks after earning any stars in Division
  const isWordProblemsUnlocked   = divisionStats.stars       >= STARS_TO_UNLOCK;

  return (
    <div className="min-h-screen bg-[#f3f1ee]">
      <Navbar profileName={profileName} />

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#3b2f1e]">🧮 Math Solving</h1>
          <p className="text-gray-500 mt-2">
            Earn {STARS_TO_UNLOCK} stars in each module to unlock the next one!
          </p>
        </div>

        <ModuleCard
          icon={<Plus />}
          color="bg-green-500"
          title="Addition"
          subtitle="Add coins & notes"
          locked={false}
          stats={additionStats}
          onClick={() => navigate("/addition")}
        />

        <ModuleCard
          icon={<Minus />}
          color="bg-red-400"
          title="Subtraction"
          subtitle={`Complete Addition (${STARS_TO_UNLOCK} stars) to unlock`}
          locked={!isSubtractionUnlocked}
          stats={subtractionStats}
          onClick={() => navigate("/subtraction")}
        />

        <ModuleCard
          icon={<X />}
          color="bg-purple-400"
          title="Multiplication"
          subtitle={`Complete Subtraction (${STARS_TO_UNLOCK} stars) to unlock`}
          locked={!isMultiplicationUnlocked}
          stats={multiplicationStats}
          onClick={() => navigate("/multiplication")}
        />

        <ModuleCard
          icon={<Divide />}
          color="bg-blue-400"
          title="Division"
          subtitle={`Complete Multiplication (${STARS_TO_UNLOCK} stars) to unlock`}
          locked={!isDivisionUnlocked}
          stats={divisionStats}
          onClick={() => navigate("/division")}
        />

        {/* ── Word Problems ── */}
        <ModuleCard
          icon={<BookOpen />}
          color="bg-orange-400"
          title="Word Problems"
          subtitle={`Complete Division (${STARS_TO_UNLOCK} stars) to unlock`}
          locked={!isWordProblemsUnlocked}
          stats={wordProblemStats}
          onClick={() => navigate("/wordproblems")}
        />

        <div className="pt-6">
          <button
            onClick={() => navigate("/home")}
            className="w-full bg-pink-500 text-white py-3 rounded-xl shadow hover:bg-pink-600 transition flex items-center justify-center gap-2"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}