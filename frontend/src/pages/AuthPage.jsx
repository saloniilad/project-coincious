import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const API_BASE = "http://localhost:8000/api";

export default function AuthPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("login");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Forgot password state
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotMsg, setForgotMsg] = useState("");

    // After login: pull progress from backend into localStorage
    const syncProgressFromBackend = async (name) => {
        try {
            const res = await fetch(`${API_BASE}/progress/load/?name=${encodeURIComponent(name)}`);
            if (!res.ok) return;
            const data = await res.json();
            const progress = data.progress || {};
            Object.entries(progress).forEach(([key, value]) => {
                localStorage.setItem(key, value);
            });
        } catch {
            // Non-critical — silently ignore
        }
    };

    // Add this function before handleSubmit
        const clearPreviousUserProgress = () => {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (
            key.includes("_level_") ||
            key.includes("_unlocked") ||
            key.includes("_next_difficulty")
            ) {
            keysToRemove.push(key);
            }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        const inputs = e.target.querySelectorAll("input");

        try {
            if (activeTab === "login") {
                const name = inputs[0].value;
                const password = inputs[1].value;

                const res = await fetch(`${API_BASE}/login/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, password }),
                });
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || "Login failed");

// ✅ Clear previous user's progress before loading new user
                clearPreviousUserProgress();

                localStorage.setItem("user", data.user.name);
                localStorage.setItem("email", data.user.email);

                await syncProgressFromBackend(data.user.name);

                navigate("/home", { replace: true });

            } else {
                const name = inputs[0].value;
                const email = inputs[1].value;
                const password = inputs[2].value;

                const res = await fetch(`${API_BASE}/signup/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password }),
                });
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || "Signup failed");

                setSuccess(data.message + " Please login.");
                setActiveTab("login");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        setForgotMsg("");
        if (!forgotEmail) return;
        setForgotLoading(true);
        try {
            const res = await fetch(`${API_BASE}/forgot-password/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: forgotEmail }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
            setForgotMsg(data.message);
        } catch (err) {
            setForgotMsg(err.message);
        } finally {
            setForgotLoading(false);
        }
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
                    <p className="text-[#6f604b] text-lg">Learn Indian Currency & Maths 🎮</p>
                    <div className="flex justify-center gap-10 mt-4 text-sm text-[#8b7b65]">
                        <span>🔗 Currency Games</span>
                        <span>📖 Math Challenges</span>
                    </div>
                </div>

                {/* Card */}
                <div className="w-full max-w-md bg-[#f5f3ef] rounded-2xl shadow-2xl p-4">
                    <h2 className="text-2xl font-semibold text-center text-[#3b2f1e]">Welcome!</h2>
                    <p className="text-center text-[#8b7b65] text-sm mt-1 mb-8">Sign in or create a new account</p>

                    {/* Tabs */}
                    <div className="flex bg-[#dcd6cc] rounded-xl p-1 mb-8">
                        <button
                            onClick={() => { setActiveTab("login"); setError(""); setSuccess(""); }}
                            className={`flex-1 py-2 rounded-lg transition-all duration-300 ${activeTab === "login" ? "bg-white shadow text-[#3b2f1e]" : "text-[#7a6a55]"}`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => { setActiveTab("signup"); setError(""); setSuccess(""); }}
                            className={`flex-1 py-2 rounded-lg transition-all duration-300 ${activeTab === "signup" ? "bg-white shadow text-[#3b2f1e]" : "text-[#7a6a55]"}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Alerts */}
                    {error && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
                    {success && <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {activeTab === "login" && (
                            <>
                                <div>
                                    <label className="block text-sm text-[#3b2f1e] mb-1">Name</label>
                                    <input
                                        type="text"
                                        placeholder="Nausheen"
                                        className="w-full px-4 py-3 rounded-xl bg-[#e9e5df] border border-[#d5cec3] focus:outline-none focus:ring-2 focus:ring-orange-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[#3b2f1e] mb-1">Password</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 rounded-xl bg-[#e9e5df] border border-[#d5cec3] focus:outline-none focus:ring-2 focus:ring-orange-400"
                                        required
                                    />
                                    {/* Forgot Password Link */}
                                    <button
                                        type="button"
                                        onClick={() => { setShowForgot(true); setForgotMsg(""); setForgotEmail(""); }}
                                        className="mt-1 text-xs text-orange-500 hover:text-orange-700 underline float-right"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            </>
                        )}

                        {activeTab === "signup" && (
                            <>
                                <div>
                                    <label className="block text-sm text-[#3b2f1e] mb-1">Your Name</label>
                                    <input
                                        type="text"
                                        placeholder="Nausheen"
                                        className="w-full px-4 py-3 rounded-xl bg-[#e9e5df] border border-[#d5cec3] focus:outline-none focus:ring-2 focus:ring-orange-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[#3b2f1e] mb-1">Email</label>
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        className="w-full px-4 py-3 rounded-xl bg-[#e9e5df] border border-[#d5cec3] focus:outline-none focus:ring-2 focus:ring-orange-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[#3b2f1e] mb-1">Password</label>
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
                            className="w-full bg-pink-300 hover:bg-pink-400 transition text-white font-semibold py-3 rounded-xl shadow-lg mt-6"
                        >
                            {loading ? "Please wait..." : activeTab === "login" ? "Login 🚀" : "Create Account 🎉"}
                        </button>
                    </form>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgot && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-[#f5f3ef] rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-semibold text-[#3b2f1e] mb-2">Forgot Password?</h3>
                        <p className="text-sm text-[#8b7b65] mb-4">
                            Enter your registered email. We'll send you a new password.
                        </p>

                        <input
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full px-4 py-3 rounded-xl bg-[#e9e5df] border border-[#d5cec3] focus:outline-none focus:ring-2 focus:ring-orange-400 mb-3"
                        />

                        {forgotMsg && (
                            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">
                                {forgotMsg}
                            </p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleForgotPassword}
                                disabled={forgotLoading}
                                className="flex-1 bg-pink-300 hover:bg-pink-400 text-white font-semibold py-2 rounded-xl transition"
                            >
                                {forgotLoading ? "Sending..." : "Send Password"}
                            </button>
                            <button
                                onClick={() => setShowForgot(false)}
                                className="flex-1 bg-[#dcd6cc] hover:bg-[#c9c2b5] text-[#3b2f1e] font-semibold py-2 rounded-xl transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}