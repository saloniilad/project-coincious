import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { ChevronRight } from "lucide-react";

export default function Currency() {
  const navigate = useNavigate();
  const profileName = localStorage.getItem("user") || "Student";

  return (
    <div className="min-h-screen bg-[#f3f1ee]">

      {/* Navbar */}
      <Navbar profileName={profileName} />

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-[#3b2f1e] flex items-center justify-center gap-3">
          🪙 Currency Identification
        </h1>

        {/* Study Module Card */}
        <div
          onClick={() => alert("Go to Study Module")}
          className="cursor-pointer bg-blue-50 border border-blue-200 rounded-2xl p-8 shadow hover:shadow-lg transition flex justify-between items-center"
        >
          <div>
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              📚 Study Module
            </h2>
            <p className="text-gray-600 text-sm">
              Learn about all Indian Rupee coins and notes — their colors, values,
              materials, and fun facts!
            </p>
          </div>

          <ChevronRight className="text-gray-400" />
        </div>

        {/* Identification Game Card */}
        <div
          onClick={() => alert("Go to Game")}
          className="cursor-pointer bg-green-50 border border-green-200 rounded-2xl p-8 shadow hover:shadow-lg transition flex justify-between items-center"
        >
          <div>
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              🎮 Identification Game
            </h2>
            <p className="text-gray-600 text-sm">
              Drag and drop coins/notes into the correct numbered jar.
              Keep going until you master them all!
            </p>
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