import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Trophy } from "lucide-react";

const BASE_URL = import.meta.env.VITE_IMAGES;
const API_URL = import.meta.env.VITE_API;          // ← ADD

function getRandomItem() {                          // ← MOVE outside component
    return currencyData[Math.floor(Math.random() * currencyData.length)];
}

const currencyData = [
    { value: 1, type: "coin" },
    { value: 2, type: "coin" },
    { value: 5, type: "coin" },
    { value: 10, type: "coin" },
    { value: 20, type: "coin" },
    { value: 10, type: "note" },
    { value: 20, type: "note" },
    { value: 50, type: "note" },
    { value: 100, type: "note" },
    { value: 200, type: "note" },
    { value: 500, type: "note" },
];

export default function CurrencyGame() {
    const navigate = useNavigate();
    const [correct, setCorrect] = useState(0);
    const [currentItem, setCurrentItem] = useState(getRandomItem());
    const [feedback, setFeedback] = useState("");

    const userName = localStorage.getItem("user");  // ← ADD

    const folder = currentItem.type === "coin" ? "Coins" : "Notes";
    const imageUrl = `${BASE_URL}/${folder}/${currentItem.value}/v1/front.png`;

    async function handleDrop(e, jarValue, jarType) {  // ← async ADD
        e.preventDefault();

        const droppedValue = Number(e.dataTransfer.getData("value"));
        const droppedType = e.dataTransfer.getData("type");
        const isCorrect = droppedValue === jarValue && droppedType === jarType;  // ← ADD

        // ── Save attempt to backend ──────────────────  ← ADD BLOCK
        try {
            await fetch(`${API_URL}/identification/attempt/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name:               userName,
                    currency_value:     droppedValue,
                    currency_type:      droppedType,
                    selected_jar_value: jarValue,
                    is_correct:         isCorrect,
                }),
            });
        } catch (err) {
            console.error("Failed to save attempt:", err);
        }
        // ────────────────────────────────────────────────

        if (isCorrect) {                            // ← was (droppedValue === jarValue && droppedType === jarType)
            setCorrect((prev) => prev + 1);
            setFeedback("correct");
            setTimeout(() => {
                setCurrentItem(getRandomItem());
                setFeedback("");
            }, 800);
        } else {
            setFeedback("wrong");
            setTimeout(() => {
                setFeedback("");
            }, 800);
        }
    }

    return (
        <div className="min-h-screen bg-[#f3f1ee]">
            <Navbar profileName={userName} />       {/* ← was "Nausheen" */}

            {/* ── everything below is exactly the same as before ── */}
            <div className="max-w-5xl mx-auto px-6 py-10 text-center">

                <div className="flex justify-center items-center gap-2 text-orange-600 mb-2">
                    <Trophy />
                    <h1 className="text-2xl font-bold">
                        Currency Identification Game
                    </h1>
                </div>

                <p className="text-gray-500 mb-2">
                    Drag the currency to the correct jar!
                </p>

                <div className="mb-6">
                    <span className="bg-green-100 px-4 py-2 rounded-full font-semibold">
                        ✅ Correct: {correct}
                    </span>
                </div>

                <div
                    className={`mx-auto w-64 p-6 rounded-2xl border-4 transition-all duration-300 ${
                        feedback === "correct"
                            ? "border-green-500 bg-green-50"
                            : feedback === "wrong"
                                ? "border-red-400 bg-red-50"
                                : currentItem.type === "coin"
                                    ? "border-yellow-400 bg-yellow-50"
                                    : "border-blue-400 bg-blue-50"
                    }`}
                >
                    <img
                        src={imageUrl}
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer.setData("value", currentItem.value);
                            e.dataTransfer.setData("type", currentItem.type);
                        }}
                        className={`mx-auto mb-4 ${currentItem.type === "coin" ? "w-24" : "w-40"}`}
                        alt="currency"
                    />

                    <div
                        className={`text-white py-2 rounded-lg font-bold mb-2 transition-colors duration-300 ${
                            currentItem.type === "coin" ? "bg-yellow-400" : "bg-blue-400"
                        }`}
                    >
                        ₹{currentItem.value}
                    </div>

                    <div className="text-sm text-gray-600">
                        {currentItem.type === "coin" ? "🪙 Coin" : "💵 Note"}
                    </div>

                    {feedback === "correct" && (
                        <p className="text-green-600 font-semibold mt-3">✔ Correct!</p>
                    )}
                    {feedback === "wrong" && (
                        <p className="text-red-500 font-semibold mt-3">✖ Try Again!</p>
                    )}
                </div>

                <h2 className="mt-10 mb-2 font-semibold text-gray-700">🪙 COIN JARS</h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-2">
                    {[1, 2, 5, 10, 20].map((value) => (
                        <div
                            key={value}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, value, "coin")}
                            className="flex flex-col items-center cursor-pointer"
                        >
                            <div className="relative w-20 h-28 sm:w-24 sm:h-32">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-3 bg-yellow-400 rounded-full"></div>
                                <div className="absolute top-3 w-full h-24 sm:h-28 bg-white/60 backdrop-blur-md border-2 border-gray-300 rounded-b-3xl rounded-t-xl shadow-md flex items-end justify-center pb-3">
                                    <div className="bg-white w-12 h-12 rounded-full shadow flex items-center justify-center overflow-hidden">
                                        <img
                                            src={`${BASE_URL}/Coins/${value}/v1/front.png`}
                                            alt={`₹${value}`}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Coin</p>
                        </div>
                    ))}
                </div>

                <h2 className="mb-2 font-semibold text-gray-700">💵 NOTE JARS</h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-10">
                    {[10, 20, 50, 100, 200, 500].map((value) => (
                        <div
                            key={value}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, value, "note")}
                            className="flex flex-col items-center cursor-pointer"
                        >
                            <div className="relative w-20 h-28 sm:w-24 sm:h-32">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-3 bg-blue-400 rounded-full"></div>
                                <div className="absolute top-3 w-full h-24 sm:h-28 bg-white/60 backdrop-blur-md border-2 border-gray-300 rounded-b-3xl rounded-t-xl shadow-md flex items-end justify-center pb-3">
                                    <div className="bg-white w-16 h-10 sm:w-20 sm:h-12 rounded-lg shadow flex items-center justify-center overflow-hidden">
                                        <img
                                            src={`${BASE_URL}/Notes/${value}/v1/front.png`}
                                            alt={`₹${value}`}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Note</p>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => navigate("/home")}
                    className="bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition"
                >
                    ← Back to Home
                </button>
            </div>
        </div>
    );
}