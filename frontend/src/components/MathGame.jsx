/**
 * MathGame.jsx
 * ============
 * Props:
 *   module    – "addition" | "subtraction" | "multiplication" | "division" | "wordproblems"
 *   symbol    – "+" | "−" | "×" | "÷" | "📖"
 *   level     – Number (1-10)
 *   onBack    – () => void   (called when user presses Back)
 *   onComplete – (level) => void  (called after level is finished)
 *
 * Behaviour
 * ---------
 * • On mount, checks if this level has been played before.
 *   – If YES  → load the exact same question (level revisit) via GET /api/math/level-question/
 *   – If NO   → fetch a fresh question at the correct starting difficulty via GET /api/math/question/
 * • An invisible timer starts the moment the question is displayed.
 * • The user picks an MCQ option (or types a word-problem answer).
 * • Wrong answer → attempts++ (question stays, user can try again).
 * • Correct answer → timer stops, stars calculated, attempt POSTed to backend.
 * • Stars are stored locally AND synced to the backend.
 * • next_difficulty from API drives the next question if the user wants to replay.
 * • Hint button (max 3) reveals part of the answer and increments hints_used.
 * • Currency images fetched from /api/math/currencies/?ids=... and shown in wallet.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, Lightbulb, Clock } from "lucide-react";
import WordProblemGame from "./WordProblemGame";

const API_BASE = "http://localhost:8000/api";
const IMAGE_BASE = import.meta.env.VITE_IMAGES || "http://127.0.0.1:8000";

// ── Star calculation (mirrors backend logic) ──────────────────────────────────
function calculateStars(attempts, timeSpent, hintsUsed) {
  let score = 100;
  score -= attempts * 5;
  score -= hintsUsed * 10;
  score -= timeSpent * 0.5;
  if (score >= 80) return 3;
  if (score >= 50) return 2;
  return 1;
}

// ── Difficulty ladder ─────────────────────────────────────────────────────────
const DIFFICULTY_STEPS = [
  "easy-basic",
  "easy-moderate",
  "easy-high",
  "medium-basic",
  "medium-moderate",
  "medium-high",
  "hard-basic",
  "hard-moderate",
  "hard-high",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateHint(question) {
  if (!question) return "Think carefully! 🤔";
  const answer = question.expected_answer ?? question.correct_answer;
  if (answer == null) return "Read the question again slowly.";
  const hint1 = `The answer is between ${Math.floor(answer * 0.7)} and ${Math.ceil(answer * 1.3)}.`;
  const hint2 = `The answer ends in …${String(answer).slice(-1)}.`;
  const hint3 = `The correct answer is ${answer}. 🎉`;
  return [hint1, hint2, hint3];
}

// ── Currency Wallet UI ────────────────────────────────────────────────────────
function CurrencyWallet({ images }) {
  const [zoomedIdx, setZoomedIdx] = useState(null);

  if (!images || images.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="text-xs text-gray-400 text-center mb-2 font-medium tracking-wide uppercase">
        Coins &amp; Notes
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        {images.map((currency, index) => {
          const path = currency.front_image.replace(
            "/static/currency-images",
            "",
          );
          const imgUrl = `${IMAGE_BASE}${path}`;
          return (
            <div
              key={index}
              onClick={() => setZoomedIdx(index)}
              className="flex flex-col items-center bg-amber-50 border border-amber-200 rounded-2xl px-6 py-5 shadow-sm min-w-[110px] cursor-zoom-in hover:border-pink-300 hover:shadow-md transition"
            >
              <img
                src={imgUrl}
                alt={`₹${currency.value} ${currency.type}`}
                className="w-32 h-32 object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <span className="text-sm text-amber-700 mt-2 font-semibold">
                ₹{currency.value}
              </span>
              <span className="text-xs text-gray-400 capitalize">
                {currency.type}
              </span>
              <span className="text-[10px] text-pink-400 mt-1">
                🔍 tap to zoom
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Zoom popup overlay ── */}
      {zoomedIdx !== null &&
        (() => {
          const c = images[zoomedIdx];
          const path = c.front_image.replace("/static/currency-images", "");
          const imgUrl = `${IMAGE_BASE}${path}`;
          return (
            <div
              onClick={() => setZoomedIdx(null)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                cursor: "zoom-out",
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "white",
                  borderRadius: 24,
                  padding: "32px 40px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                  animation: "zoomIn 0.2s ease-out",
                }}
              >
                <style>{`
                @keyframes zoomIn {
                  from { transform: scale(0.7); opacity: 0; }
                  to   { transform: scale(1);   opacity: 1; }
                }
              `}</style>
                <img
                  src={imgUrl}
                  alt={`₹${c.value}`}
                  style={{ width: 220, height: 220, objectFit: "contain" }}
                />
                <p style={{ fontSize: 22, fontWeight: 800, color: "#b45309" }}>
                  ₹{c.value}
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "#9ca3af",
                    textTransform: "capitalize",
                  }}
                >
                  {c.type}
                </p>
                <button
                  onClick={() => setZoomedIdx(null)}
                  style={{
                    marginTop: 4,
                    background: "linear-gradient(135deg,#ec4899,#f472b6)",
                    color: "white",
                    border: "none",
                    borderRadius: 12,
                    padding: "8px 28px",
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Close ✕
                </button>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
// ── Component ─────────────────────────────────────────────────────────────────
export default function MathGame({
  module,
  symbol,
  level,
  onBack,
  onComplete,
}) {
  const profileName = localStorage.getItem("user") || "Student";

  // ── State ──────────────────────────────────────────────────────────────────
  const [question, setQuestion] = useState(null);
  const [currencyImages, setCurrencyImages] = useState([]);
  const [difficulty, setDifficulty] = useState(() => {
    if (level === 1) return "easy-basic";
    return localStorage.getItem(`${module}_next_difficulty`) || "easy-basic";
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedOption, setSelectedOption] = useState(null);
  const [wordAnswer, setWordAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);

  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintMessages, setHintMessages] = useState([]);
  const [showHintPanel, setShowHintPanel] = useState(false);

  const [timeSpent, setTimeSpent] = useState(0);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const [showResult, setShowResult] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);
  const [deltaStars, setDeltaStars] = useState(0);
  const [prevBestStars, setPrevBestStars] = useState(0);
  const [savedQuestionId, setSavedQuestionId] = useState(null);
  const [isRevisit, setIsRevisit] = useState(false);

  const fetchCurrencyImages = useCallback(async (currencyIds) => {
    if (!currencyIds || currencyIds.length === 0) {
      setCurrencyImages([]);
      return;
    }

    try {
      const uniqueIds = [...new Set(currencyIds)];
      const res = await fetch(
        `${API_BASE}/math/currencies/?ids=${uniqueIds.join(",")}`,
      );
      const data = await res.json();

      const currencyMap = {};
      for (const c of data.currencies || []) {
        currencyMap[c.id] = c;
      }

      const expanded = currencyIds.map((id) => currencyMap[id]).filter(Boolean);

      setCurrencyImages(expanded);
    } catch (e) {
      console.error("🪙 Failed to fetch currency images:", e);
      setCurrencyImages([]);
    }
  }, []);

  // ── Fetch question on mount ────────────────────────────────────────────────
  useEffect(() => {
    loadQuestion();
    return () => stopTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadQuestion = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFeedback(null);
    setSelectedOption(null);
    setWordAnswer("");
    setAttempts(0);
    setHintsUsed(0);
    setHintMessages([]);
    setShowHintPanel(false);
    setShowResult(false);
    setCurrencyImages([]);
    stopTimer();

    try {
      const revisitRes = await fetch(
        `${API_BASE}/math/level-question/?name=${encodeURIComponent(profileName)}&module=${module}&level=${level}`,
      );
      const revisitData = await revisitRes.json();

      if (revisitData.question_id) {
        setIsRevisit(true);
        setDifficulty(revisitData.difficulty);

        const byIdRes = await fetch(
          `${API_BASE}/math/question/by-id/?question_id=${revisitData.question_id}`,
        );
        const byIdData = await byIdRes.json();
        const q = byIdData.question;

        setQuestion(q);
        setSavedQuestionId(revisitData.question_id);
        await fetchCurrencyImages(q?.currency_ids || []);
      } else {
        setIsRevisit(false);

        if (level === 1) {
          setDifficulty("easy-basic");
          const freshQ = await fetchFreshQuestion("easy-basic");
          await fetchCurrencyImages(freshQ?.currency_ids || []);
        } else {
          const savedDiff =
            localStorage.getItem(`${module}_next_difficulty`) || "easy-basic";
          setDifficulty(savedDiff);
          const freshQ = await fetchFreshQuestion(savedDiff);
          await fetchCurrencyImages(freshQ?.currency_ids || []);
        }
      }
    } catch (e) {
      setError("Failed to load question. Please check your connection.");
    } finally {
      setLoading(false);
      startTimer();
    }
  }, [module, level, profileName, fetchCurrencyImages]);

  const fetchFreshQuestion = async (diff) => {
    const res = await fetch(
      `${API_BASE}/math/question/?module=${module}&difficulty=${diff}`,
    );
    if (!res.ok) throw new Error("No question found");
    const data = await res.json();
    setQuestion(data.question);
    setSavedQuestionId(null);
    return data.question;
  };

  // ── Timer ──────────────────────────────────────────────────────────────────
  const startTimer = () => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const getElapsedSeconds = () => {
    if (!startTimeRef.current) return 0;
    return (Date.now() - startTimeRef.current) / 1000;
  };

  // ── Hint ───────────────────────────────────────────────────────────────────
  const handleHint = () => {
    if (hintsUsed >= 3) return;
    const hints = generateHint(question);
    setHintMessages((prev) => [...prev, hints[hintsUsed]]);
    setHintsUsed((h) => h + 1);
    setShowHintPanel(true);
  };

  // ── Answer submission ──────────────────────────────────────────────────────
  const handleMCQSelect = (option) => {
    if (feedback === "correct") return;
    setSelectedOption(option);
  };

  const handleSubmit = async () => {
    if (!question) return;

    const userAnswer =
      question.problem_type === "mcq" ? selectedOption : Number(wordAnswer);
    const correctAnswer =
      question.problem_type === "mcq"
        ? question.correct_answer
        : question.expected_answer;

    const isCorrect = Number(userAnswer) === Number(correctAnswer);

    if (!isCorrect) {
      setAttempts((a) => a + 1);
      setFeedback("wrong");
      setTimeout(() => setFeedback(null), 900);
      setSelectedOption(null);
      setWordAnswer("");
      return;
    }

    stopTimer();
    setFeedback("correct");

    const elapsed = getElapsedSeconds();
    const finalAttempts = attempts + 1;
    const stars = calculateStars(finalAttempts, elapsed, hintsUsed);

    setStarsEarned(stars);
    setTimeSpent(Math.round(elapsed));

    try {
      const res = await fetch(`${API_BASE}/math/attempt/save/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          module: module,
          level: level,
          question_id: question.question_id,
          attempts: finalAttempts,
          time_spent: Math.round(elapsed),
          hints_used: hintsUsed,
          user_answer: userAnswer,
          difficulty: difficulty,
        }),
      });

      const data = await res.json();

      const delta = data.delta_stars ?? 0;
      const prevBest = data.previous_best_stars ?? 0;
      const nextDiff = data.next_difficulty ?? difficulty;

      setDifficulty(nextDiff);
      localStorage.setItem(`${module}_next_difficulty`, nextDiff);
      setDeltaStars(delta);
      setPrevBestStars(prevBest);

      const storageKey = `${module}_level_${level}_stars`;
      const existing = Number(localStorage.getItem(storageKey)) || 0;
      localStorage.setItem(storageKey, existing + delta);

      const unlockedKey = `${module}_unlocked`;
      const currentUnlocked = Number(localStorage.getItem(unlockedKey)) || 1;
      if (level >= currentUnlocked && level < 10) {
        localStorage.setItem(unlockedKey, level + 1);
      }
    } catch (e) {
      console.error("Failed to save attempt:", e);
    }

    setTimeout(() => setShowResult(true), 600);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  // ── Render: loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f1ee] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-5xl animate-bounce">🧮</div>
          <p className="text-xl font-semibold text-[#3b2f1e]">
            Loading question…
          </p>
        </div>
      </div>
    );
  }

  // ── Render: error ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#f3f1ee] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center space-y-4 max-w-sm">
          <div className="text-4xl">⚠️</div>
          <p className="text-red-500 font-semibold">{error}</p>
          <button
            onClick={loadQuestion}
            className="bg-orange-500 text-white px-6 py-2 rounded-xl hover:bg-orange-600 transition"
          >
            Retry
          </button>
          <button
            onClick={onBack}
            className="block w-full text-gray-500 underline text-sm"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  // ── Render: result screen ──────────────────────────────────────────────────
  if (showResult) {
    return (
      <div className="min-h-screen bg-[#f3f1ee] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-sm w-full text-center space-y-5">
          <div className="text-5xl">
            {starsEarned === 3 ? "🎉" : starsEarned === 2 ? "👍" : "💪"}
          </div>

          <h2 className="text-2xl font-bold text-[#3b2f1e]">
            Level {level} Complete!
          </h2>

          <div className="flex justify-center gap-2 text-4xl">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`transition-transform duration-300 ${
                  s <= starsEarned
                    ? "text-yellow-400 scale-125"
                    : "text-gray-300"
                }`}
              >
                ★
              </span>
            ))}
          </div>

          <p className="text-gray-600 font-medium">
            {starsEarned === 3
              ? "Perfect! Excellent work! 🌟"
              : starsEarned === 2
                ? "Great job! Keep it up!"
                : "Good effort! Practice makes perfect!"}
          </p>

          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>⏱ Time</span>
              <span>{timeSpent}s</span>
            </div>
            <div className="flex justify-between">
              <span>🔁 Attempts</span>
              <span>{attempts + 1}</span>
            </div>
            <div className="flex justify-between">
              <span>💡 Hints used</span>
              <span>{hintsUsed}</span>
            </div>
          </div>

          {deltaStars > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-green-700 text-sm font-medium">
              +{deltaStars} ⭐ added to your total!
              {prevBestStars > 0 && (
                <span className="block text-xs text-green-600">
                  (Previous best: {prevBestStars} ★ → Now: {starsEarned} ★)
                </span>
              )}
            </div>
          )}
          {deltaStars === 0 && prevBestStars > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-blue-700 text-sm">
              You already scored {prevBestStars} ★ on this level — no new stars
              added.
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => {
                onComplete(level);
                onBack();
              }}
              className="bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition"
            >
              🗺 Back to Map
            </button>
            <button
              onClick={loadQuestion}
              className="border border-orange-400 text-orange-500 py-3 rounded-xl font-semibold hover:bg-orange-50 transition"
            >
              🔄 Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: question screen ────────────────────────────────────────────────
  const isMCQ = question?.problem_type === "mcq";

  return (
    <div className="min-h-screen bg-[#f3f1ee] flex flex-col">
      {/* Top bar */}
      <div className="max-w-3xl mx-auto w-full px-4 pt-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="bg-blue-200 text-blue-800 px-4 py-2 rounded-2xl flex items-center gap-2 hover:bg-blue-300 transition text-sm"
        >
          <ChevronLeft size={16} />
          Back
        </button>

        <div className="flex items-center gap-3">
          <span className="bg-white text-gray-500 border text-xs px-3 py-1 rounded-full shadow-sm">
            {difficulty}
          </span>
          <span className="bg-orange-500 text-white text-sm font-bold px-4 py-1 rounded-full shadow">
            Level {level}
          </span>
        </div>
      </div>

      {/* Main card — wider and taller */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl p-8 space-y-6">
          {/* Question header + wallet */}
          <div className="text-center">
            {/* Enhanced symbol badge */}
            <div className="flex justify-center mb-3">
              <div
                style={{
                  background: "linear-gradient(135deg, #ec4899, #f472b6)",
                  borderRadius: "50%",
                  width: 64,
                  height: 64,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    "0 4px 18px rgba(236,72,153,0.45), 0 1px 4px rgba(0,0,0,0.1)",
                  fontSize: 32,
                  fontWeight: 900,
                  color: "white",
                  letterSpacing: "-1px",
                  border: "3px solid rgba(255,255,255,0.35)",
                }}
              >
                {symbol}
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#3b2f1e] leading-snug">
              {question?.question_text}
            </h2>
            {isRevisit && (
              <span className="text-xs text-gray-400 mt-1 block">
                (Revisiting this level)
              </span>
            )}

            {/* Currency wallet */}
            <CurrencyWallet images={currencyImages} />
          </div>

          {/* Wrong-answer flash */}
          {feedback === "wrong" && (
            <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-2 text-center text-red-600 font-semibold text-sm animate-pulse">
              ❌ Not quite! Try again.
            </div>
          )}

          {/* MCQ options — slightly smaller */}
          {isMCQ && question?.options && (
            <div className="grid grid-cols-2 gap-3">
              {question.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleMCQSelect(opt)}
                  className={`py-2 rounded-2xl text-sm font-bold transition border-2
                    ${
                      selectedOption === opt
                        ? "bg-orange-500 text-white border-orange-500 scale-105"
                        : "bg-gray-50 text-gray-800 border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                >
                  ₹{opt}
                </button>
              ))}
            </div>
          )}

          {/* Word-problem input */}
          {!isMCQ && (
            <div className="space-y-2">
              <label className="text-sm text-gray-500 font-medium">
                Your Answer (₹)
              </label>
              <input
                type="number"
                value={wordAnswer}
                onChange={(e) => setWordAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter amount…"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-center focus:border-orange-400 focus:outline-none"
              />
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={isMCQ ? selectedOption === null : wordAnswer === ""}
            className={`w-full py-4 rounded-2xl text-white font-bold text-lg transition
              ${
                (isMCQ ? selectedOption !== null : wordAnswer !== "")
                  ? "bg-orange-500 hover:bg-orange-600 shadow-md"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
          >
            ✅ Submit Answer
          </button>

          {/* Hint button + timer */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleHint}
              disabled={hintsUsed >= 3}
              className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition
                ${
                  hintsUsed < 3
                    ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
            >
              <Lightbulb size={16} />
              Hint ({3 - hintsUsed} left)
            </button>

            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <Clock size={13} />
              {timeSpent}s
            </div>
          </div>

          {/* Hint messages */}
          {showHintPanel && hintMessages.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-2">
              {hintMessages.map((msg, i) => (
                <p key={i} className="text-yellow-800 text-sm">
                  💡 {msg}
                </p>
              ))}
            </div>
          )}

          {/* Attempt counter */}
          {attempts > 0 && (
            <p className="text-center text-xs text-gray-400">
              Attempts so far: {attempts}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
