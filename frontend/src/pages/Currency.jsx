import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { ChevronRight } from "lucide-react";

export default function Currency() {
  const navigate = useNavigate();
  const profileName = localStorage.getItem("user") || "Student";

  const [listening, setListening] = useState(false);

  // 🔊 SPEAK FUNCTION
  const speakText = (text) => {
    if (!window.speechSynthesis || !text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.9;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // 🎤 VOICE NAVIGATION
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      const speech = event.results[0][0].transcript.toLowerCase();
      console.log("You said:", speech);

      if (speech.includes("study")) {
        navigate("/study");
      } else if (
        speech.includes("game") ||
        speech.includes("play") ||
        speech.includes("identification")
      ) {
        navigate("/identification");
      } else {
        alert("Say 'study' or 'game'");
      }
    };

    recognition.onend = () => setListening(false);

    recognition.start();
  };

  // 🔊 AUTO SPEAK ON LOAD
  useEffect(() => {
    speakText(
      "Welcome to Currency Identification. Choose study module or identification game.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f1ee]">
      {/* Navbar */}
      <Navbar profileName={profileName} />

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-[#3b2f1e] flex items-center justify-center gap-3">
          🪙 Currency Identification
        </h1>

        {/* 🎤 GLOBAL VOICE BUTTON */}
        <div className="flex justify-center">
          <button
            onClick={startListening}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              listening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
          >
            🎤 {listening ? "Listening..." : "Speak (Say 'Study' or 'Game')"}
          </button>
        </div>

        {/* Study Module Card */}
        <div
          onClick={() => navigate("/study")}
          className="cursor-pointer bg-blue-50 border border-blue-200 rounded-2xl p-8 shadow hover:shadow-lg transition flex justify-between items-center"
        >
          <div>
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              📚 Study Module
            </h2>
            <p className="text-gray-600 text-sm">
              Learn about all Indian Rupee coins and notes — their colors,
              values, materials, and fun facts!
            </p>

            {/* 🔊 Speak button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                speakText(
                  "Study module. Learn about coins and notes with details.",
                );
              }}
              className="mt-3 text-sm bg-blue-100 px-3 py-1 rounded-lg"
            >
              🔊 Hear
            </button>
          </div>

          <ChevronRight className="text-gray-400" />
        </div>

        {/* Identification Game Card */}
        <div
          onClick={() => navigate("/identification")}
          className="cursor-pointer bg-green-50 border border-green-200 rounded-2xl p-8 shadow hover:shadow-lg transition flex justify-between items-center"
        >
          <div>
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              🎮 Identification Game
            </h2>
            <p className="text-gray-600 text-sm">
              Drag and drop coins/notes into the correct numbered jar. Keep
              going until you master them all!
            </p>

            {/* 🔊 Speak button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                speakText(
                  "Identification game. Drag and drop coins into correct jar.",
                );
              }}
              className="mt-3 text-sm bg-green-100 px-3 py-1 rounded-lg"
            >
              🔊 Hear
            </button>
          </div>

          <ChevronRight className="text-gray-400" />
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => navigate("/home")}
            className="text-sm text-gray-600 hover:text-black"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
