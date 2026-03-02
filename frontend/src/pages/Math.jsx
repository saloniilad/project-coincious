import Navbar from "../components/Navbar";
import { Plus, Minus, X, Divide, Lock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const TOTAL_LEVELS = 10;
const STARS_REQUIRED = 150;

export default function Math() {
    const navigate = useNavigate();
    const [profileName, setProfileName] = useState("Student");

    const [additionStats, setAdditionStats] = useState({ stars: 0, levels: 0 });
    const [subtractionStats, setSubtractionStats] = useState({ stars: 0, levels: 0 });
    const [multiplicationStats, setMultiplicationStats] = useState({ stars: 0, levels: 0 });
    const [divisionStats, setDivisionStats] = useState({ stars: 0, levels: 0 });

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setProfileName(storedUser);

        loadStats();
    }, []);

    const calculateModuleStats = (module) => {
        let stars = 0;
        let completedLevels = 0;

        for (let i = 1; i <= TOTAL_LEVELS; i++) {
            const levelStars =
                Number(localStorage.getItem(`${module}_level_${i}_stars`)) || 0;

            stars += levelStars;
            if (levelStars > 0) completedLevels++;
        }

        return { stars, levels: completedLevels };
    };

    const loadStats = () => {
        setAdditionStats(calculateModuleStats("addition"));
        setSubtractionStats(calculateModuleStats("subtraction"));
        setMultiplicationStats(calculateModuleStats("multiplication"));
        setDivisionStats(calculateModuleStats("division"));
    };

    const isSubtractionUnlocked = additionStats.stars >= STARS_REQUIRED;
    const isMultiplicationUnlocked = subtractionStats.stars >= STARS_REQUIRED;
    const isDivisionUnlocked = multiplicationStats.stars >= STARS_REQUIRED;

    return (
        <div className="min-h-screen bg-[#f3f1ee]">
            <Navbar profileName={profileName} />

            <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">

                {/* Title */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-[#3b2f1e]">
                        🧮 Math Solving
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Complete each module and earn 150 stars to unlock the next one!
                    </p>
                </div>

                {/* Addition */}
                <div
                    onClick={() => navigate("/addition")}
                    className="bg-white p-6 rounded-2xl shadow hover:shadow-lg cursor-pointer flex justify-between items-center"
                >
                    <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 bg-green-500 text-white rounded-xl flex items-center justify-center shadow">
                            <Plus />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold">Addition</h2>
                            <p className="text-gray-500 text-sm">Add coins & notes</p>
                            <p className="text-xs text-gray-400 mt-1">
                                ⭐ {additionStats.stars} stars | 🏆 {additionStats.levels} levels
                            </p>
                        </div>
                    </div>

                    <ChevronRight className="text-gray-400" />
                </div>

                {/* Subtraction */}
                <div
                    onClick={() => isSubtractionUnlocked && navigate("/subtraction")}
                    className={`p-6 rounded-2xl shadow flex justify-between items-center ${isSubtractionUnlocked
                            ? "bg-white hover:shadow-lg cursor-pointer"
                            : "bg-gray-100 opacity-70"
                        }`}
                >
                    <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 bg-red-400 text-white rounded-xl flex items-center justify-center shadow">
                            <Minus />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                Subtraction {!isSubtractionUnlocked && <Lock size={16} />}
                            </h2>
                            <p className="text-gray-500 text-sm">
                                {!isSubtractionUnlocked
                                    ? "Complete Addition (150 stars) to unlock"
                                    : `⭐ ${subtractionStats.stars} stars | 🏆 ${subtractionStats.levels} levels`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Multiplication */}
                <div
                    onClick={() => isMultiplicationUnlocked && navigate("/multiplication")}
                    className={`p-6 rounded-2xl shadow flex justify-between items-center ${isMultiplicationUnlocked
                            ? "bg-white hover:shadow-lg cursor-pointer"
                            : "bg-gray-100 opacity-70"
                        }`}
                >
                    <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 bg-purple-400 text-white rounded-xl flex items-center justify-center shadow">
                            <X />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                Multiplication {!isMultiplicationUnlocked && <Lock size={16} />}
                            </h2>
                            <p className="text-gray-500 text-sm">
                                {!isMultiplicationUnlocked
                                    ? "Complete Subtraction (150 stars) to unlock"
                                    : `⭐ ${multiplicationStats.stars} stars | 🏆 ${multiplicationStats.levels} levels`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Division */}
                <div
                    onClick={() => isDivisionUnlocked && navigate("/division")}
                    className={`p-6 rounded-2xl shadow flex justify-between items-center ${isDivisionUnlocked
                            ? "bg-white hover:shadow-lg cursor-pointer"
                            : "bg-gray-100 opacity-70"
                        }`}
                >
                    <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 bg-blue-400 text-white rounded-xl flex items-center justify-center shadow">
                            <Divide />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                Division {!isDivisionUnlocked && <Lock size={16} />}
                            </h2>
                            <p className="text-gray-500 text-sm">
                                {!isDivisionUnlocked
                                    ? "Complete Multiplication (150 stars) to unlock"
                                    : `⭐ ${divisionStats.stars} stars | 🏆 ${divisionStats.levels} levels`}
                            </p>
                        </div>
                    </div>
                </div>
                {/* Back To Home */}
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