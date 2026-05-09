/**
 * MathGame.jsx
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, Lightbulb, Clock, Volume2, VolumeX } from "lucide-react";
import WordProblemGame from "./WordProblemGame";
import { getNextDifficulty } from "../ai/adaptiveRNN";

const API_BASE = import.meta.env.VITE_API;
const IMAGE_BASE = import.meta.env.VITE_IMAGES || "http://127.0.0.1:8000";

function calculateStars(attempts, timeSpent, hintsUsed) {
  let score = 100;
  score -= attempts * 5;
  score -= hintsUsed * 10;
  score -= timeSpent * 0.5;
  if (score >= 80) return 3;
  if (score >= 50) return 2;
  return 1;
}

const saveProgressToBackend = async (module, level, stars) => {
  try {
    const name = localStorage.getItem("user");
    if (!name) return;
    const res = await fetch(`${API_BASE}/progress/update/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, module, level, stars }),
    });
    const data = await res.json();
    if (!res.ok) console.error("Failed saving progress:", data);
    else console.log("✅ Progress saved:", data);
  } catch (err) {
    console.error("Progress save error:", err);
  }
};

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

      {/* Zoom popup */}
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
                <style>{`@keyframes zoomIn { from{transform:scale(0.7);opacity:0} to{transform:scale(1);opacity:1} }`}</style>
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

// ── Visual Question: "2 × [coin] = ?" or "[coin] ÷ 5 = ?" ───────────────────
function VisualQuestion({ module, questionText, currencyImages }) {
  const [zoomed, setZoomed] = useState(false);
  if (!currencyImages || currencyImages.length === 0) return null;

  const coin = currencyImages[0];
  const path = coin.front_image.replace("/static/currency-images", "");
  const imgUrl = `${IMAGE_BASE}${path}`;
  const isCoin = coin.type === "coin";

  let parts = null;
  if (module === "multiplication") {
    const match = questionText?.match(/^(\d+)\s*[×x\*]/);
    if (match) parts = { left: match[1], op: "×", right: null };
  } else if (module === "division") {
    const match = questionText?.match(/[÷\/]\s*(\d+)/);
    if (match) parts = { left: null, op: "÷", right: match[1] };
  }

  if (!parts) return null;

  const CoinImg = (
    <div
      className="flex flex-col items-center cursor-zoom-in group"
      onClick={() => setZoomed(true)}
    >
      <div className="relative">
        <img
          src={imgUrl}
          alt={`₹${coin.value}`}
          className={`object-contain drop-shadow-md transition group-hover:scale-110
            ${isCoin ? "w-20 h-20" : "w-32 h-16"}`}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
        <span className="absolute -top-2 -right-2 bg-white/80 text-pink-500 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow border border-pink-200 backdrop-blur-sm">
          🔍
        </span>
      </div>
      <span className="text-xs text-pink-500 font-bold mt-1">
        ₹{coin.value}
      </span>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-center gap-4 flex-wrap mt-2 mb-1">
        {parts.left ? (
          <span className="text-4xl font-black text-[#3b2f1e]">
            {parts.left}
          </span>
        ) : (
          CoinImg
        )}
        <span className="text-3xl font-black text-pink-400">{parts.op}</span>
        {parts.right ? (
          <span className="text-4xl font-black text-[#3b2f1e]">
            {parts.right}
          </span>
        ) : (
          CoinImg
        )}
        <span className="text-3xl font-black text-pink-400">=</span>
        <span className="text-4xl font-black text-[#3b2f1e]">?</span>
      </div>

      {zoomed && (
        <div
          onClick={() => setZoomed(false)}
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
            <style>{`@keyframes zoomIn{from{transform:scale(0.7);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
            <img
              src={imgUrl}
              alt={`₹${coin.value}`}
              style={{ width: 220, height: 220, objectFit: "contain" }}
            />
            <p style={{ fontSize: 22, fontWeight: 800, color: "#b45309" }}>
              ₹{coin.value}
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#9ca3af",
                textTransform: "capitalize",
              }}
            >
              {coin.type}
            </p>
            <button
              onClick={() => setZoomed(false)}
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
      )}
    </>
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
  const getProfileName = () => localStorage.getItem("user") || "Student";

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
  const [listening, setListening] = useState(false);
  const [deltaStars, setDeltaStars] = useState(0);
  const [prevBestStars, setPrevBestStars] = useState(0);
  const [savedQuestionId, setSavedQuestionId] = useState(null);
  const [isRevisit, setIsRevisit] = useState(false);
  const loadingRef = useRef(false);

  // ── NEW: tracks whether speech is currently playing ──────────────────────
  const [isSpeaking, setIsSpeaking] = useState(false);

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
      for (const c of data.currencies || []) currencyMap[c.id] = c;
      const expanded = currencyIds.map((id) => currencyMap[id]).filter(Boolean);
      setCurrencyImages(expanded);
    } catch (e) {
      console.error("🪙 Failed to fetch currency images:", e);
      setCurrencyImages([]);
    }
  }, []);

  useEffect(() => {
    loadQuestion();
    return () => {
      stopTimer();
      // Stop any ongoing speech when the component unmounts
      window.speechSynthesis?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadQuestion = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
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
    setStarsEarned(0);
    setDeltaStars(0);
    setPrevBestStars(0);

    const currentUser = getProfileName();
    if (!currentUser || currentUser === "Student") {
      const stored = localStorage.getItem("user");
      if (!stored) {
        setError("You must be logged in to play. Please log in and try again.");
        setLoading(false);
        return;
      }
    }

    try {
      const revisitRes = await fetch(
        `${API_BASE}/math/level-question/?name=${encodeURIComponent(currentUser)}&module=${module}&level=${level}`,
      );
      if (!revisitRes.ok)
        throw new Error(`Level-question lookup failed: ${revisitRes.status}`);
      const revisitData = await revisitRes.json();

      if (revisitData.question_id) {
        const byIdRes = await fetch(
          `${API_BASE}/math/question/by-id/?question_id=${revisitData.question_id}`,
        );
        if (byIdRes.ok) {
          const byIdData = await byIdRes.json();
          const q = byIdData.question;
          setIsRevisit(true);
          setDifficulty(revisitData.difficulty);
          setQuestion(q);
          setSavedQuestionId(revisitData.question_id);
          await fetchCurrencyImages(q?.currency_ids || []);
        } else {
          setIsRevisit(false);
          const fallbackDiff =
            revisitData.difficulty ||
            (level === 1
              ? "easy-basic"
              : localStorage.getItem(`${module}_next_difficulty`) ||
              "easy-basic");
          setDifficulty(fallbackDiff);
          const freshQ = await fetchFreshQuestion(fallbackDiff);
          await fetchCurrencyImages(freshQ?.currency_ids || []);
        }
      } else {
        setIsRevisit(false);
        const startDiff =
          level === 1
            ? "easy-basic"
            : localStorage.getItem(`${module}_next_difficulty`) || "easy-basic";
        setDifficulty(startDiff);
        const freshQ = await fetchFreshQuestion(startDiff);
        await fetchCurrencyImages(freshQ?.currency_ids || []);
      }
    } catch (e) {
      console.error("loadQuestion error:", e);
      setError("Failed to load question. Please check your connection.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
      startTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, level, fetchCurrencyImages]);

  const fetchFreshQuestion = async (diffOverride = null) => {

    const actualDifficulty =
      diffOverride || difficulty;

    const res = await fetch(
      `${API_BASE}/math/question/?module=${module}&difficulty=${actualDifficulty}`,
    );

    if (!res.ok)
      throw new Error(
        `No question found for ${module}/${actualDifficulty}`
      );

    const data = await res.json();

    setQuestion(data.question);

    setSavedQuestionId(null);

    return data.question;
  };

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

  const handleHint = () => {
    if (hintsUsed >= 3) return;
    const hints = generateHint(question);
    const hintText = hints[hintsUsed];
    setHintMessages((prev) => [...prev, hintText]);
    setHintsUsed((h) => h + 1);
    setShowHintPanel(true);
    // Also read the hint aloud so kids don't need to read it
    speakQuestion(hintText);
  };

  const handleMCQSelect = (option) => {
    if (feedback === "correct") return;
    setSelectedOption(option);
  };

  const handleSubmit = async (directAnswer = null) => {
    if (!question) return;
    const userAnswer =
      directAnswer !== null
        ? directAnswer
        : question.problem_type === "mcq"
          ? selectedOption
          : Number(wordAnswer);
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
    const historyKey = `${module}_history`;

    let history =
      JSON.parse(localStorage.getItem(historyKey)) || [];

    history.push({

      time_spent: Math.round(elapsed),

      attempts: finalAttempts,

      hints_used: hintsUsed,

      stars_earned: stars
    });

    history = history.slice(-3);

    localStorage.setItem(
      historyKey,
      JSON.stringify(history)
    );
    const aiDifficulty =
      await getNextDifficulty(history);

    console.log(
      "AI Difficulty:",
      aiDifficulty
    );


    localStorage.setItem(

      `${module}_next_difficulty`,

      aiDifficulty
    );
    setStarsEarned(stars);
    setTimeSpent(Math.round(elapsed));
    const currentUser = getProfileName();

    try {
      const res = await fetch(`${API_BASE}/math/attempt/save/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: currentUser,
          module,
          level,
          question_id: question.question_id,
          attempts: finalAttempts,
          time_spent: Math.round(elapsed),
          hints_used: hintsUsed,
          user_answer: userAnswer,
          difficulty,
        }),
      });
      const data = await res.json();
      const delta = data.delta_stars ?? 0;
      const prevBest = data.previous_best_stars ?? 0;
      const nextDiff = aiDifficulty;

      // SAVE FIRST
      localStorage.setItem(
        `${module}_next_difficulty`,
        nextDiff
      );

      // UPDATE STATE
      setDifficulty(nextDiff);

      // IMMEDIATELY LOAD QUESTION
      await fetchFreshQuestion(nextDiff);
      setDeltaStars(delta);
      setPrevBestStars(prevBest);
      const storageKey = `${module}_level_${level}_stars`;
      const existing = Number(localStorage.getItem(storageKey)) || 0;
      const updatedStars = Math.max(existing, stars);
      localStorage.setItem(storageKey, updatedStars);
      await saveProgressToBackend(module, level, updatedStars);
      const unlockedKey = `${module}_unlocked`;
      const currentUnlocked = Number(localStorage.getItem(unlockedKey)) || 1;
      if (level >= currentUnlocked && level < 10)
        localStorage.setItem(unlockedKey, level + 1);
    } catch (e) {
      console.error("Failed to save attempt:", e);
    }
    setTimeout(() => setShowResult(true), 600);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  // ── UPDATED speakQuestion ─────────────────────────────────────────────────
  // Changes vs original:
  //   • rate 0.9 → 0.65  (noticeably slower for neurodiverse kids)
  //   • pitch 1.1         (slightly warmer, friendlier tone)
  //   • symbols replaced with words so the voice reads them naturally
  //   • onstart / onend / onerror update isSpeaking state for button feedback
  const speakQuestion = (text) => {
    if (!window.speechSynthesis || !text) return;

    // Replace ₹NUMBER with "rupees NUMBER," so the voice pauses after each amount
    // Then add commas around operators so the voice pauses before and after each one
    const readable = text
      .replace(/₹/g, "rupees ")
      .replace(/\+/g, " plus ")
      .replace(/\p{Dash}/gu, " minus ")
      .replace(/×/g, " times ")
      .replace(/÷/g, " divided by ")
      .replace(/=/g, " equals ")
      .replace(/\?/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(readable);
    utterance.lang = "en-IN";
    utterance.rate = 0.65; // slow & clear
    utterance.pitch = 1.1; // warm, friendly tone

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      const speech = event.results[0][0].transcript.toLowerCase();

      const numberMap = {
        zero: 0,
        one: 1,
        two: 2,
        three: 3,
        four: 4,
        five: 5,
        six: 6,
        seven: 7,
        eight: 8,
        nine: 9,
        ten: 10,
      };

      let detectedNumber = null;

      Object.keys(numberMap).forEach((word) => {
        if (speech.includes(word)) {
          detectedNumber = numberMap[word];
        }
      });

      if (detectedNumber === null) {
        const num = speech.match(/\d+/);
        if (num) detectedNumber = Number(num[0]);
      }

      if (detectedNumber !== null) {
        if (question.problem_type === "mcq") {
          setSelectedOption(detectedNumber);
        } else {
          setWordAnswer(String(detectedNumber));
        }
        // Pass the answer directly so we don't rely on stale state
        setTimeout(() => handleSubmit(detectedNumber), 800);
      } else {
        alert("Could not understand. Please try again.");
      }
    };

    recognition.onend = () => setListening(false);
    recognition.start();
  };

  // ── Render: loading ───────────────────────────────────────────────────────
  if (loading)
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

  // ── Render: error ─────────────────────────────────────────────────────────
  if (error)
    return (
      <div className="min-h-screen bg-[#f3f1ee] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center space-y-4 max-w-sm">
          <div className="text-4xl">⚠️</div>
          <p className="text-red-500 font-semibold">{error}</p>
          <button
            onClick={loadQuestion}
            className="bg-pink-500 text-white px-6 py-2 rounded-xl hover:bg-pink-600 transition"
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

  // ── Render: result screen ─────────────────────────────────────────────────
  if (showResult)
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
                className={`transition-transform duration-300 ${s <= starsEarned ? "text-yellow-400 scale-125" : "text-gray-300"}`}
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
              className="bg-pink-500 text-white py-3 rounded-xl font-semibold hover:bg-pink-600 transition"
            >
              🗺 Back to Map
            </button>
            <button
              onClick={loadQuestion}
              className="border border-pink-400 text-pink-500 py-3 rounded-xl font-semibold hover:bg-pink-50 transition"
            >
              🔄 Play Again
            </button>
          </div>
        </div>
      </div>
    );

  // ── Render: question screen ───────────────────────────────────────────────
  const isMCQ = question?.problem_type === "mcq";
  const isVisualQuestion =
    (module === "multiplication" &&
      currencyImages.length > 0 &&
      question?.question_text?.match(/^(\d+)\s*[×x\*]/)) ||
    (module === "division" &&
      currencyImages.length > 0 &&
      question?.question_text?.match(/[÷\/]\s*(\d+)/));

  return (
    <div className="min-h-screen bg-[#f3f1ee] flex flex-col">
      {/* Top bar */}
      <div className="max-w-3xl mx-auto w-full px-4 pt-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="bg-blue-200 text-blue-800 px-4 py-2 rounded-2xl flex items-center gap-2 hover:bg-blue-300 transition text-sm"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-3">
          <span className="bg-white text-gray-500 border text-xs px-3 py-1 rounded-full shadow-sm">
            {difficulty}
          </span>
          <span className="bg-pink-500 text-white text-sm font-bold px-4 py-1 rounded-full shadow">
            Level {level}
          </span>
        </div>
      </div>

      {/* Main card */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl p-8 space-y-6">
          {/* Question header */}
          <div className="text-center">
            {/* Pink symbol badge */}
            <div className="flex justify-center mb-3">
              <div
                style={{
                  background: "linear-gradient(135deg,#ec4899,#f472b6)",
                  borderRadius: "50%",
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    "0 4px 18px rgba(236,72,153,0.45),0 1px 4px rgba(0,0,0,0.1)",
                  fontSize: 22,
                  fontWeight: 900,
                  color: "white",
                  letterSpacing: "-1px",
                  border: "3px solid rgba(255,255,255,0.35)",
                }}
              >
                {symbol}
              </div>
            </div>

            {/* Question text */}
            {isVisualQuestion ? (
              <VisualQuestion
                module={module}
                questionText={question?.question_text}
                currencyImages={currencyImages}
              />
            ) : (
              <h2 className="text-2xl font-bold text-[#3b2f1e] leading-snug">
                {question?.question_text}
              </h2>
            )}

            {isRevisit && (
              <span className="text-xs text-gray-400 mt-1 block">
                (Revisiting this level)
              </span>
            )}

            {/* ── NEW: Read Question button ──────────────────────────────── */}
            {/* Appears right below the question so kids can tap it any time  */}
            <div className="flex justify-center mt-4">
              <button
                onClick={() =>
                  isSpeaking
                    ? stopSpeaking()
                    : speakQuestion(question?.question_text)
                }
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-base transition-all shadow-md select-none
                  ${isSpeaking
                    ? "bg-blue-500 text-white scale-105 shadow-blue-200"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200 hover:scale-105"
                  }`}
                aria-label={isSpeaking ? "Stop reading" : "Read question aloud"}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX size={20} />
                    <span className="flex items-center gap-1">
                      Reading
                      {/* Animated bars to show the voice is active */}
                      <span
                        style={{
                          display: "flex",
                          gap: 3,
                          alignItems: "flex-end",
                          height: 18,
                          marginLeft: 4,
                        }}
                      >
                        {[0, 150, 300].map((delay) => (
                          <span
                            key={delay}
                            style={{
                              width: 4,
                              borderRadius: 2,
                              background: "white",
                              animation: `voiceBar 0.7s ease-in-out ${delay}ms infinite alternate`,
                            }}
                          />
                        ))}
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <Volume2 size={20} />
                    Read Question
                  </>
                )}
              </button>
            </div>
            {/* ──────────────────────────────────────────────────────────── */}

            {/* Currency wallet */}
            {!isVisualQuestion && <CurrencyWallet images={currencyImages} />}
          </div>

          {/* Wrong-answer flash */}
          {feedback === "wrong" && (
            <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-2 text-center text-red-600 font-semibold text-sm animate-pulse">
              ❌ Not quite! Try again.
            </div>
          )}

          {/* MCQ options */}
          {isMCQ && question?.options && (
            <div className="grid grid-cols-2 gap-3">
              {question.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleMCQSelect(opt)}
                  className={`py-2 rounded-2xl text-sm font-bold transition border-2
                    ${selectedOption === opt
                      ? "bg-pink-500 text-white border-pink-500 scale-105"
                      : "bg-gray-50 text-gray-800 border-gray-200 hover:border-pink-300 hover:bg-pink-50"
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
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-center focus:border-pink-400 focus:outline-none"
              />
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={() => handleSubmit()}
            disabled={isMCQ ? selectedOption === null : wordAnswer === ""}
            className={`w-full py-4 rounded-2xl text-white font-bold text-lg transition
              ${(isMCQ ? selectedOption !== null : wordAnswer !== "")
                ? "bg-pink-500 hover:bg-pink-600 shadow-md"
                : "bg-gray-300 cursor-not-allowed"
              }`}
          >
            ✅ Submit Answer
          </button>

          {/* Hint + timer row */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleHint}
              disabled={hintsUsed >= 3}
              className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition
                ${hintsUsed < 3
                  ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
            >
              <Lightbulb size={16} /> Hint ({3 - hintsUsed} left)
            </button>
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <Clock size={13} /> {timeSpent}s
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

          {/* Voice input row */}
          <div className="flex gap-3">
            <button
              onClick={startListening}
              className={`flex-1 py-3 rounded-xl font-semibold transition ${listening
                ? "bg-red-500 text-white"
                : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
            >
              🎤 {listening ? "Listening…" : "Speak Answer"}
            </button>
          </div>
        </div>
      </div>

      {/* Keyframe for the animated speaking bars */}
      <style>{`
        @keyframes voiceBar {
          from { height: 6px; }
          to   { height: 18px; }
        }
      `}</style>
    </div>
  );
}
