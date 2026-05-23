import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Trophy } from "lucide-react";

const BASE_URL = import.meta.env.VITE_IMAGES;
const API_URL = import.meta.env.VITE_API;

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

function getRandomItem() {
  return currencyData[Math.floor(Math.random() * currencyData.length)];
}

export default function CurrencyGame() {
  const navigate = useNavigate();
  const [correct, setCorrect] = useState(0);
  const [currentItem, setCurrentItem] = useState(getRandomItem());
  const [feedback, setFeedback] = useState("");

  // Touch drag state
  const [touchDrag, setTouchDrag] = useState(null); // { x, y } or null
  const touchDragRef = useRef(null);
  const touchMovedRef = useRef(false);

  // Tap-to-select state: true when the coin card has been tapped
  const [selected, setSelected] = useState(false);

  const userName = localStorage.getItem("user");

  const folder = currentItem.type === "coin" ? "Coins" : "Notes";
  const imageUrl = `${BASE_URL}/${folder}/${currentItem.value}/v1/front.png`;

  // Clear selection when a new item loads
  useEffect(() => {
    setSelected(false);
  }, [currentItem]);

  // ── Shared drop logic ────────────────────────────────────────────────────
  const processDrop = useCallback(
    async (droppedValue, droppedType, jarValue, jarType) => {
      const isCorrect = droppedValue === jarValue && droppedType === jarType;

      try {
        await fetch(`${API_URL}/identification/attempt/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: userName,
            currency_value: droppedValue,
            currency_type: droppedType,
            selected_jar_value: jarValue,
            is_correct: isCorrect,
          }),
        });
      } catch (err) {
        console.error("Failed to save attempt:", err);
      }

      setSelected(false);

      if (isCorrect) {
        setCorrect((prev) => prev + 1);
        setFeedback("correct");
        setTimeout(() => {
          setCurrentItem(getRandomItem());
          setFeedback("");
        }, 800);
      } else {
        setFeedback("wrong");
        setTimeout(() => setFeedback(""), 800);
      }
    },
    [userName],
  );

  // ── Mouse drag handlers ──────────────────────────────────────────────────
  async function handleDrop(e, jarValue, jarType) {
    e.preventDefault();
    const droppedValue = Number(e.dataTransfer.getData("value"));
    const droppedType = e.dataTransfer.getData("type");
    await processDrop(droppedValue, droppedType, jarValue, jarType);
  }

  // ── Tap-on-jar handler (fires when coin is selected) ────────────────────
  const handleJarTap = useCallback(
    async (jarValue, jarType) => {
      if (!selected) return;
      await processDrop(currentItem.value, currentItem.type, jarValue, jarType);
    },
    [selected, currentItem, processDrop],
  );

  // ── Touch drag: document-level move + end ───────────────────────────────
  useEffect(() => {
    if (!touchDrag) return;

    const onTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const drag = touchDragRef.current;

      if (drag) {
        const dx = touch.clientX - drag.x;
        const dy = touch.clientY - drag.y;
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          touchMovedRef.current = true;
        }
      }

      setTouchDrag({ x: touch.clientX, y: touch.clientY });
    };

    const onTouchEnd = async (e) => {
      const touch = e.changedTouches[0];
      const drag = touchDragRef.current;

      if (drag) {
        if (touchMovedRef.current) {
          // ── DRAG: find the jar under the finger ──────────────
          setTouchDrag(null); // hide ghost so elementFromPoint works
          const el = document.elementFromPoint(touch.clientX, touch.clientY);
          const jar = el?.closest("[data-jar-value]");
          if (jar) {
            const jarValue = Number(jar.dataset.jarValue);
            const jarType = jar.dataset.jarType;
            await processDrop(
              drag.item.value,
              drag.item.type,
              jarValue,
              jarType,
            );
          }
        } else {
          // ── TAP: toggle selection ────────────────────────────
          setSelected((prev) => !prev);
        }
      }

      touchDragRef.current = null;
      setTouchDrag(null);
      touchMovedRef.current = false;
    };

    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [touchDrag, processDrop]);

  const handleTouchStart = useCallback(
    (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      touchDragRef.current = {
        item: currentItem,
        x: touch.clientX,
        y: touch.clientY,
      };
      touchMovedRef.current = false;
      setTouchDrag({ x: touch.clientX, y: touch.clientY });
    },
    [currentItem],
  );
  // ────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f3f1ee]">
      <Navbar profileName={userName} />

      {/* Floating ghost that follows the finger during drag */}
      {touchDrag && touchMovedRef.current && (
        <div
          style={{
            position: "fixed",
            left: touchDrag.x - 48,
            top: touchDrag.y - 48,
            zIndex: 10000,
            pointerEvents: "none",
            opacity: 0.85,
            transform: "scale(1.2)",
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
          }}
        >
          <img
            src={imageUrl}
            alt="dragging"
            className={currentItem.type === "coin" ? "w-24" : "w-40"}
          />
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-10 text-center">
        <div className="flex justify-center items-center gap-2 text-orange-600 mb-2">
          <Trophy />
          <h1 className="text-2xl font-bold">Currency Identification Game</h1>
        </div>

        <p className="text-gray-500 mb-2">
          Drag to a jar — or <strong>tap the coin</strong> then{" "}
          <strong>tap a jar</strong>!
        </p>

        <div className="mb-6">
          <span className="bg-green-100 px-4 py-2 rounded-full font-semibold">
            ✅ Correct: {correct}
          </span>
        </div>

        {/* Tap-to-select hint banner */}
        {selected && (
          <div className="mb-4 inline-block bg-pink-100 text-pink-700 text-sm font-bold px-4 py-2 rounded-full animate-pulse">
            👆 Now tap the correct jar!
          </div>
        )}

        {/* Draggable / tappable currency card */}
        <div
          className={`mx-auto w-64 p-6 rounded-2xl border-4 transition-all duration-300
                        ${
                          feedback === "correct"
                            ? "border-green-500 bg-green-50"
                            : feedback === "wrong"
                              ? "border-red-400 bg-red-50"
                              : selected
                                ? "border-pink-500 bg-pink-50 scale-105 shadow-xl shadow-pink-200"
                                : currentItem.type === "coin"
                                  ? "border-yellow-400 bg-yellow-50"
                                  : "border-blue-400 bg-blue-50"
                        }
                        ${touchDrag && touchMovedRef.current ? "opacity-40" : ""}`}
        >
          <img
            src={imageUrl}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("value", currentItem.value);
              e.dataTransfer.setData("type", currentItem.type);
            }}
            onTouchStart={handleTouchStart}
            className={`mx-auto mb-4 touch-none
                            ${currentItem.type === "coin" ? "w-24" : "w-40"}
                            ${selected ? "drop-shadow-[0_0_12px_rgba(236,72,153,0.7)]" : ""}`}
            alt="currency"
          />

          <div
            className={`text-white py-2 rounded-lg font-bold mb-2 transition-colors duration-300
                            ${currentItem.type === "coin" ? "bg-yellow-400" : "bg-blue-400"}`}
          >
            ₹{currentItem.value}
          </div>

          <div className="text-sm text-gray-600">
            {currentItem.type === "coin" ? "🪙 Coin" : "💵 Note"}
          </div>

          {selected && (
            <p className="text-pink-500 font-bold text-xs mt-2">Selected ✓</p>
          )}
          {feedback === "correct" && (
            <p className="text-green-600 font-semibold mt-3">✔ Correct!</p>
          )}
          {feedback === "wrong" && (
            <p className="text-red-500 font-semibold mt-3">✖ Try Again!</p>
          )}
        </div>

        {/* Coin Jars */}
        <h2 className="mt-10 mb-2 font-semibold text-gray-700">🪙 COIN JARS</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-2">
          {[1, 2, 5, 10, 20].map((value) => (
            <div
              key={value}
              data-jar-value={value}
              data-jar-type="coin"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, value, "coin")}
              onClick={() => handleJarTap(value, "coin")}
              className={`flex flex-col items-center cursor-pointer transition-transform
                                ${selected ? "scale-105 hover:scale-110" : ""}`}
            >
              <div className="relative w-20 h-28 sm:w-24 sm:h-32">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-3 bg-yellow-400 rounded-full" />
                <div
                  className={`absolute top-3 w-full h-24 sm:h-28 backdrop-blur-md border-2 rounded-b-3xl rounded-t-xl shadow-md flex items-end justify-center pb-3 transition-colors
                                    ${
                                      selected
                                        ? "bg-pink-50/80 border-pink-400 shadow-pink-200 shadow-md"
                                        : "bg-white/60 border-gray-300"
                                    }`}
                >
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

        {/* Note Jars */}
        <h2 className="mb-2 font-semibold text-gray-700">💵 NOTE JARS</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-10">
          {[10, 20, 50, 100, 200, 500].map((value) => (
            <div
              key={value}
              data-jar-value={value}
              data-jar-type="note"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, value, "note")}
              onClick={() => handleJarTap(value, "note")}
              className={`flex flex-col items-center cursor-pointer transition-transform
                                ${selected ? "scale-105 hover:scale-110" : ""}`}
            >
              <div className="relative w-20 h-28 sm:w-24 sm:h-32">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-3 bg-blue-400 rounded-full" />
                <div
                  className={`absolute top-3 w-full h-24 sm:h-28 backdrop-blur-md border-2 rounded-b-3xl rounded-t-xl shadow-md flex items-end justify-center pb-3 transition-colors
                                    ${
                                      selected
                                        ? "bg-pink-50/80 border-pink-400 shadow-pink-200 shadow-md"
                                        : "bg-white/60 border-gray-300"
                                    }`}
                >
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
