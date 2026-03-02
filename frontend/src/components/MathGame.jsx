import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { ChevronLeft, Clock, Lightbulb } from "lucide-react";

function calculateStars(attempts, timeSpent, hintsUsed) {
  let score = 100;
  score -= attempts * 5;
  score -= hintsUsed * 10;
  score -= timeSpent * 0.5;

  if (score >= 80) return 3;
  if (score >= 50) return 2;
  return 1;
}

export default function MathGame({
  module,
  symbol,
  level,
  onBack,
  onComplete,
}) {
  const [question, setQuestion] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [startTime] = useState(Date.now());

  // Generate Question
  useEffect(() => {
    const num1 = Math.floor(Math.random() * 10) + level;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const answer = num1 + num2;

    const choices = [
      answer,
      answer + 1,
      answer - 1,
      answer + 2,
    ].sort(() => Math.random() - 0.5);

    setQuestion({ num1, num2, answer, choices });
  }, [level]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAnswer = (choice) => {
    setAttempts((prev) => prev + 1);

    if (choice === question.answer) {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const stars = calculateStars(attempts + 1, timeSpent, hintsUsed);

      const key = `${module}_level_${level}_stars`;
      const previousStars = Number(localStorage.getItem(key)) || 0;

      // ⭐ Only save if better than previous
      if (stars > previousStars) {
        localStorage.setItem(key, stars);
      }

      alert(`Correct! ⭐ You earned ${stars} star(s)`);

      // 🔓 Unlock next level
      if (onComplete) {
        onComplete(level);
      }

      onBack();
    } else {
      alert("Wrong! Try again.");
    }
  };

  if (!question) return null;

  return (
    <div className="min-h-screen bg-[#f3f1ee]">
      <Navbar profileName="Student" />

      <div className="max-w-3xl mx-auto p-6">

        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-gray-500 hover:text-black"
          >
            <ChevronLeft size={16} />
            Levels
          </button>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Level {level}</span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow p-8 text-center mb-6">
          <p className="text-sm text-gray-500 mb-2">
            {module} • Level {level}
          </p>

          <h2 className="text-4xl font-bold mb-6">
            ₹{question.num1} {symbol} ₹{question.num2} = ?
          </h2>

          <div className="flex justify-center gap-2 text-2xl">
            🪙 🪙 🪙 + 🪙 🪙
          </div>
        </div>

        {/* Choices */}
        <div className="grid grid-cols-2 gap-4">
          {question.choices.map((choice) => (
            <button
              key={choice}
              onClick={() => handleAnswer(choice)}
              className="bg-white p-6 rounded-xl shadow hover:shadow-lg text-2xl font-bold"
            >
              ₹{choice}
            </button>
          ))}
        </div>

        {/* Bottom Controls */}
        <div className="flex justify-between items-center mt-6 text-sm text-gray-600">
          <button
            onClick={() => setHintsUsed((h) => h + 1)}
            className="flex items-center gap-1 text-blue-500"
            disabled={hintsUsed >= 3}
          >
            <Lightbulb size={14} />
            Hint ({3 - hintsUsed} left)
          </button>

          <span>Attempts: {attempts}</span>
        </div>
      </div>
    </div>
  );
}