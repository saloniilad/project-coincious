import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import WordProblemGame from "../components/WordProblemGame";
import { ChevronLeft } from "lucide-react";
import roadImg from "../assets/bg.png";
import { useNavigate } from "react-router-dom";

const TOTAL_LEVELS               = 10;
const STARS_REQUIRED_TO_UNLOCK   = 10;
const API_BASE                   = "http://localhost:8000";

export default function WordProblems() {
  const navigate = useNavigate();

  const [selectedLevel,  setSelectedLevel]  = useState(null);
  const [unlockedLevel,  setUnlockedLevel]  = useState(1);
  const [totalStars,     setTotalStars]     = useState(0);
  const [profileName,    setProfileName]    = useState("Student");

  const [question,     setQuestion]     = useState(null);
  const [currencies,   setCurrencies]   = useState([]);
  const [item,         setItem]         = useState(null);
  const [loadingLevel, setLoadingLevel] = useState(false);

  useEffect(() => {
    const saved      = Number(localStorage.getItem("wordproblems_unlocked")) || 1;
    const storedUser = localStorage.getItem("user");
    setUnlockedLevel(saved);
    if (storedUser) setProfileName(storedUser);
    calculateTotalStars();
  }, []);

  const calculateTotalStars = () => {
    let sum = 0;
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
      sum += Number(localStorage.getItem(`wordproblems_level_${i}_stars`)) || 0;
    }
    setTotalStars(sum);
  };

  const loadLevel = async (level) => {
    setLoadingLevel(true);
    setQuestion(null);
    setCurrencies([]);
    setItem(null);

    try {
      const difficultyMap = {
        1:  "easy-basic",
        2:  "easy-basic",
        3:  "easy-moderate",
        4:  "easy-moderate",
        5:  "easy-high",
        6:  "medium-basic",
        7:  "medium-moderate",
        8:  "medium-high",
        9:  "hard-basic",
        10: "hard-moderate",
      };
      const difficulty = difficultyMap[level] || "easy-basic";

      // Reuse same question if level was played before
      const prevRes  = await fetch(
        `${API_BASE}/api/math/level-question/?name=${encodeURIComponent(profileName)}&module=wordproblems&level=${level}`
      );
      const prevData = await prevRes.json();

      let fetchedQuestion = null;
      if (prevData.question_id) {
        const qRes  = await fetch(`${API_BASE}/api/math/question/by-id/?question_id=${prevData.question_id}`);
        const qData = await qRes.json();
        fetchedQuestion = qData.question;
      } else {
        const qRes  = await fetch(`${API_BASE}/api/math/question/?module=wordproblems&difficulty=${difficulty}`);
        const qData = await qRes.json();
        fetchedQuestion = qData.question;
      }

      if (!fetchedQuestion) {
        console.error("No question returned for level", level);
        setLoadingLevel(false);
        return;
      }

      setQuestion(fetchedQuestion);

      const fetches = [];

      if (fetchedQuestion.currency_ids?.length) {
        const idsParam = fetchedQuestion.currency_ids.join(",");
        fetches.push(
          fetch(`${API_BASE}/api/currencies/?ids=${idsParam}`)
            .then((r) => r.json())
            .then((data) => setCurrencies(data.currencies || []))
        );
      }

      if (fetchedQuestion.item_id) {
        fetches.push(
          fetch(`${API_BASE}/api/items/?ids=${fetchedQuestion.item_id}`)
            .then((r) => r.json())
            .then((data) => { if (data.items?.length) setItem(data.items[0]); })
        );
      }

      await Promise.all(fetches);
      setSelectedLevel(level);
    } catch (err) {
      console.error("Failed to load word problem level:", err);
    } finally {
      setLoadingLevel(false);
    }
  };

  const handleComplete = async (starsEarned, attempts, timeSpent, hintsUsed) => {
    try {
      await fetch(`${API_BASE}/api/math/attempt/save/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:        profileName,
          module:      "wordproblems",
          level:       selectedLevel,
          question_id: question.question_id,
          attempts,
          time_spent:  timeSpent,
          hints_used:  hintsUsed,
          user_answer: question.expected_answer,
          difficulty:  question.difficulty,
        }),
      });
    } catch (err) {
      console.error("Failed to save attempt:", err);
    }

    const key  = `wordproblems_level_${selectedLevel}_stars`;
    const prev = Number(localStorage.getItem(key)) || 0;
    localStorage.setItem(key, Math.max(prev, starsEarned));

    const next = selectedLevel + 1;
    if (next <= TOTAL_LEVELS && next > unlockedLevel) {
      localStorage.setItem("wordproblems_unlocked", next);
      setUnlockedLevel(next);
    }

    calculateTotalStars();

    setTimeout(() => {
      setSelectedLevel(null);
      setQuestion(null);
      setCurrencies([]);
      setItem(null);
    }, 2200);
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

  // ── Game screen ────────────────────────────────────────────────────────────
  if (selectedLevel && question) {
    return (
      <div className="min-h-screen bg-[#f3f1ee]">
        <Navbar profileName={profileName} />
        <div className="max-w-2xl mx-auto px-4 pt-6">
          <button
            onClick={() => { setSelectedLevel(null); setQuestion(null); setCurrencies([]); setItem(null); }}
            className="mb-4 bg-blue-100 text-blue-700 px-4 py-2 rounded-xl flex items-center gap-2 font-semibold hover:bg-blue-200 transition"
          >
            <ChevronLeft size={16} /> Back to Map
          </button>
          <h2 className="text-xl font-bold text-[#3b2f1e] mb-4">
            📘 Word Problems — Level {selectedLevel}
          </h2>
          <WordProblemGame
            question={question}
            currencies={currencies}
            item={item}
            onComplete={handleComplete}
          />
        </div>
      </div>
    );
  }

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loadingLevel) {
    return (
      <div className="min-h-screen bg-[#f3f1ee] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-bounce">🛒</div>
          <p className="text-[#8b7b65] font-semibold">Loading problem...</p>
        </div>
      </div>
    );
  }

  // ── Map screen ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f3f1ee]">
      <Navbar profileName={profileName} />

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
              📘 Word Problems
            </h1>
            <p className="text-sm sm:text-lg text-[#8b7b65] mt-1">
              ⭐ Total Stars: {totalStars} / {TOTAL_LEVELS * 3}
            </p>
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
            const level      = i + 1;
            const pos        = getLevelPos(i);
            const stars      = Number(localStorage.getItem(`wordproblems_level_${level}_stars`)) || 0;
            const isUnlocked = level <= unlockedLevel;

            return (
              <div
                key={level}
                onClick={() => isUnlocked && loadLevel(level)}
                className={`absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center text-white font-bold shadow-lg
                  ${isUnlocked
                    ? "bg-orange-500 cursor-pointer hover:scale-110 transition-transform"
                    : "bg-gray-400 cursor-not-allowed"}`}
                style={{
                  left: `${pos.x}%`,
                  top:  `${pos.y}%`,
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
                left: `${getLevelPos(unlockedLevel - 1).x}%`,
                top:  `${getLevelPos(unlockedLevel - 1).y}%`,
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