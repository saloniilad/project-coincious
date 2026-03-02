import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

export default function Home() {

    const navigate = useNavigate();   
    const [profileName, setProfileName] = useState("Student");

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setProfileName(storedUser);
        }
    }, []);

    return (
        <div className="min-h-screen bg-[#f3f1ee]">

            <Navbar profileName={profileName} />

            <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-pink-400 to-pink-200 text-white rounded-2xl p-4 shadow-xl">
                    <h1 className="text-2xl font-bold mb-2">
                        Welcome, {profileName}! 👋
                    </h1>
                    <p className="opacity-90 mb-6">
                        Keep learning and earning stars!
                    </p>

                    <div className="flex gap-6">
                        <div className="bg-pink-300 rounded-2xl px-6 py-4 text-center">
                            <div className="text-3xl font-bold">0</div>
                            <div className="text-sm opacity-90">Total Score</div>
                        </div>

                        <div className="bg-pink-300 rounded-2xl px-6 py-4 text-center">
                            <div className="text-3xl font-bold">⭐ 0</div>
                            <div className="text-sm opacity-90">Stars Earned</div>
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-[#3b2f1e]">
                    Choose a Game
                </h2>

                <div className="grid md:grid-cols-2 gap-6">

                    {/* Currency Card */}
                    <div
                        onClick={() => navigate("/currency")}
                        className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition cursor-pointer"
                    >
                        <div className="flex justify-between mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center text-2xl shadow">
                                🪙
                            </div>
                            <ChevronRight className="text-gray-400" />
                        </div>

                        <h3 className="text-xl font-bold mb-2">
                            Currency Identification
                        </h3>
                        <p className="text-gray-500 mb-4">
                            Learn all Indian Rupee coins & notes. Play the sorting game!
                        </p>

                        <div className="flex gap-3">
                            <span className="bg-yellow-100 text-sm px-3 py-1 rounded-full">
                                📚 Study
                            </span>
                            <span className="bg-yellow-100 text-sm px-3 py-1 rounded-full">
                                🎮 Game
                            </span>
                        </div>
                    </div>

                    {/* Math Card */}
                    <div className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition cursor-pointer">
                        <div className="flex justify-between mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-2xl shadow">
                                🧮
                            </div>
                            <ChevronRight className="text-gray-400" />
                        </div>

                        <h3 className="text-xl font-bold mb-2">
                            Math Solving
                        </h3>
                        <p className="text-gray-500 mb-4">
                            5 modules: Addition, Subtraction, Multiplication, Division & Word Problems!
                        </p>

                        <div className="flex flex-wrap gap-2">
                            <span className="bg-pink-500 text-white text-xs px-3 py-1 rounded-full">
                                Addition
                            </span>
                            <span className="border text-xs px-3 py-1 rounded-full">
                                🔒 Subtraction
                            </span>
                            <span className="border text-xs px-3 py-1 rounded-full">
                                🔒 Multiplication
                            </span>
                            <span className="border text-xs px-3 py-1 rounded-full">
                                🔒 Division
                            </span>
                            <span className="border text-xs px-3 py-1 rounded-full">
                                🔒 Word Problems
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}