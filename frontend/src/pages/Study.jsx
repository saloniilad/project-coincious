import { useState } from "react";
import Navbar from "../components/Navbar";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BASE_URL =
   import.meta.env.VITE_IMAGES;

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

export default function Study() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const currentItem = currencyData[currentIndex];

  const folder =
    currentItem.type === "coin" ? "Coins" : "Notes";

  const frontImg = `${BASE_URL}/${folder}/${currentItem.value}/v1/front.png`;
  const backImg = `${BASE_URL}/${folder}/${currentItem.value}/v1/back.png`;

  const nextSlide = () => {
    if (currentIndex < currencyData.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f1ee]">
      <Navbar profileName="Nausheen" />

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Title */}
        <div className="text-center mb-6">
          <div className="flex justify-center items-center gap-2 text-orange-600">
            <BookOpen />
            <h1 className="text-2xl font-bold">
              Study Indian Currency
            </h1>
          </div>
          <p className="text-gray-500 mt-2">
            Learn about all Indian Rupee denominations
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {currencyData.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i === currentIndex
                  ? "bg-orange-500"
                  : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-orange-200 text-center">

          {/* Flip Area */}
          <div
            className={`mx-auto mb-6 perspective cursor-pointer ${
              currentItem.type === "note"
                ? "w-64 h-40"
                : "w-32 h-32"
            }`}
            onClick={() => setFlipped(!flipped)}
          >
            <div
              className={`relative w-full h-full transition-transform duration-700 transform-style ${
                flipped ? "rotate-y-180" : ""
              }`}
            >
              {/* Front */}
              <div className="absolute w-full h-full backface-hidden flex items-center justify-center">
                <img
                  src={frontImg}
                  alt="front"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>

              {/* Back */}
              <div className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center">
                <img
                  src={backImg}
                  alt="back"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Info */}
          <h2 className="text-3xl font-bold mb-2">
            ₹{currentItem.value}{" "}
            {currentItem.type === "coin" ? "Coin" : "Note"}
          </h2>

          <div className="inline-block bg-yellow-100 text-sm px-3 py-1 rounded-full mb-4">
            {currentItem.type === "coin" ? "🪙 Coin" : "💵 Note"}
          </div>

          <div className="bg-gray-200 rounded-xl py-4 text-xl font-semibold text-gray-600">
            ₹{currentItem.value}
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Tap to flip!
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 px-4 py-2 bg-gray-200 rounded-xl disabled:opacity-50"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <span className="text-gray-600">
            {currentIndex + 1} / {currencyData.length}
          </span>

          <button
            onClick={nextSlide}
            disabled={
              currentIndex === currencyData.length - 1
            }
            className="flex items-center gap-1 px-4 py-2 bg-gray-200 rounded-xl disabled:opacity-50"
          >
            Next
            <ChevronRight size={16} />
          </button>
          
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