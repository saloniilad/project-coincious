import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coins, IndianRupee, BookOpen } from "lucide-react";
import logo from "../assets/logo.png";

export default function AuthPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("login");
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        // Get name from first input field
        const name = e.target.querySelector("input[type='text']")?.value;

        setTimeout(() => {
            // Store name in localStorage
            if (name) {
                localStorage.setItem("user", name);
            }

            navigate("/home", { replace: true });
            setLoading(false);
        }, 1000);
    };

    return (
  <div className="min-h-screen overflow-hidden bg-gradient-to-br from-[#f4f1e6] via-[#e8e2cf] to-[#d9d2be] flex items-center justify-center px-6">

    <div className="w-full max-w-5xl flex flex-col items-center">

      {/* Logo Section */}
      <div className="text-center mb-2">
        <img
          src={logo}
          alt="Coincious Logo"
          className="w-[320px] max-w-full mx-auto object-contain mb-2"
        />

        <p className="text-[#6f604b] text-lg">
          Learn Indian Currency & Maths 🎮
        </p>

        <div className="flex justify-center gap-10 mt-4 text-sm text-[#8b7b65]">
          <span>🔗 Currency Games</span>
          <span>📖 Math Challenges</span>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-[#f5f3ef] rounded-2xl shadow-2xl p-4">

        <h2 className="text-2xl font-semibold text-center text-[#3b2f1e]">
          Welcome!
        </h2>

        <p className="text-center text-[#8b7b65] text-sm mt-1 mb-8">
          Sign in or create a new account
        </p>

        {/* Tabs */}
        <div className="flex bg-[#dcd6cc] rounded-xl p-1 mb-8">
          <button
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-2 rounded-lg transition-all duration-300 ${
              activeTab === "login"
                ? "bg-white shadow text-[#3b2f1e]"
                : "text-[#7a6a55]"
            }`}
          >
            Login
          </button>

          <button
            onClick={() => setActiveTab("signup")}
            className={`flex-1 py-2 rounded-lg transition-all duration-300 ${
              activeTab === "signup"
                ? "bg-white shadow text-[#3b2f1e]"
                : "text-[#7a6a55]"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {activeTab === "login" && (
            <>
              <div>
                <label className="block text-sm text-[#3b2f1e] mb-1">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Nausheen"
                  className="w-full px-4 py-3 rounded-xl bg-[#e9e5df] border border-[#d5cec3] focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-[#3b2f1e] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-[#e9e5df] border border-[#d5cec3] focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>
            </>
          )}

          {activeTab === "signup" && (
            <>
              <div>
                <label className="block text-sm text-[#3b2f1e] mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="Nausheen"
                  className="w-full px-4 py-3 rounded-xl bg-[#e9e5df] border border-[#d5cec3] focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-[#3b2f1e] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-[#e9e5df] border border-[#d5cec3] focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-[#3b2f1e] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-[#e9e5df] border border-[#d5cec3] focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-300 hover:bg-pink-400 transition text-white font-semibold py-3 rounded-xl shadow-lg"
          >
            {loading
              ? "Please wait..."
              : activeTab === "login"
              ? "Login 🚀"
              : "Create Account 🎉"}
          </button>

        </form>
      </div>

    </div>
  </div>
);
}