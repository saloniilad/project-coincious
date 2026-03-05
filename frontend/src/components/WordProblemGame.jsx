import { useState, useRef, useEffect } from "react";
import { RotateCcw, Trash2, Wallet, ShoppingBag, Star, CheckCircle2 } from "lucide-react";

// Images are served directly from Django's /static/ — no extra base needed
// front_image is already "/static/currency-images/Coins/1/v1/front.png"
// image_url   is already "/static/Items/apple.png"
const DJANGO_BASE = "http://localhost:8000";

// ── Star calculation (mirrors backend) ────────────────────────────────────────
function calculateStars(attempts, timeSpent, hintsUsed) {
  let score = 100;
  score -= attempts * 5;
  score -= hintsUsed * 10;
  score -= timeSpent * 0.5;
  if (score >= 80) return 3;
  if (score >= 50) return 2;
  return 1;
}

// ── Currency chip ─────────────────────────────────────────────────────────────
// front_image comes from DB: "/static/currency-images/Coins/1/v1/front.png"
function CurrencyChip({ currency, draggable = false, onDragStart, onClick, small = false }) {
  const isCoin   = currency.type === "coin";
  const imgSrc   = currency.front_image ? `${DJANGO_BASE}${currency.front_image}` : null;
  const coinSize = small ? "w-12 h-12" : "w-16 h-16";
  const noteSize = small ? "w-20 h-10" : "w-28 h-14";

  const baseClass = `
    object-contain select-none
    ${draggable ? "cursor-grab active:cursor-grabbing hover:scale-110 transition-transform drop-shadow-md" : ""}
    ${onClick    ? "cursor-pointer hover:scale-105 transition-transform" : ""}
  `;

  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt={`₹${currency.value}`}
        draggable={draggable}
        onDragStart={onDragStart}
        onClick={onClick}
        className={`${isCoin ? coinSize : noteSize} ${baseClass}`}
      />
    );
  }

  // Fallback styled chip if image missing
  if (isCoin) {
    return (
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onClick={onClick}
        className={`${coinSize} rounded-full border-4 border-yellow-600 bg-gradient-to-br from-yellow-300 to-yellow-500
          flex items-center justify-center font-bold text-yellow-900 shadow-md select-none
          ${draggable ? "cursor-grab hover:scale-110 transition-transform" : ""}
          ${onClick   ? "cursor-pointer hover:scale-105 transition-transform" : ""}`}
      >
        ₹{currency.value}
      </div>
    );
  }

  const noteColors = {
    10: "from-orange-200 to-orange-300 border-orange-400",
    20: "from-yellow-200 to-yellow-300 border-yellow-400",
    50: "from-cyan-200   to-cyan-300   border-cyan-400",
    100:"from-purple-200 to-purple-300 border-purple-400",
    200:"from-amber-200  to-amber-300  border-amber-400",
    500:"from-stone-200  to-stone-300  border-stone-400",
  };
  const colorClass = noteColors[currency.value] || "from-slate-200 to-slate-300 border-slate-400";

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className={`${noteSize} rounded-lg border-2 bg-gradient-to-r ${colorClass}
        flex items-center justify-center font-bold text-slate-700 shadow-sm select-none
        ${draggable ? "cursor-grab hover:scale-110 transition-transform" : ""}
        ${onClick   ? "cursor-pointer hover:scale-105 transition-transform" : ""}`}
    >
      ₹{currency.value}
    </div>
  );
}

// ── Item display ──────────────────────────────────────────────────────────────
// item.image_url = "/static/Items/apple.png"
function ItemDisplay({ question, item }) {
  const imgSrc = item?.image_url ? `${DJANGO_BASE}${item.image_url}` : null;
  const name   = item?.name || question?.item_name || "Item";
  const price  = question?.expected_answer ?? 0;

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6
      bg-gradient-to-b from-orange-50 to-white rounded-3xl
      border-2 border-orange-100 shadow-sm h-full">
      <p className="text-xs font-black text-orange-400 tracking-widest uppercase">Buy This</p>

      {imgSrc ? (
        <img src={imgSrc} alt={name} className="w-28 h-28 object-contain drop-shadow-lg" />
      ) : (
        <div className="w-28 h-28 rounded-2xl bg-orange-100 flex items-center justify-center">
          <ShoppingBag size={48} className="text-orange-400" />
        </div>
      )}

      <p className="font-black text-slate-700 text-base text-center">{name}</p>
      <div className="bg-orange-500 text-white px-5 py-2 rounded-full shadow font-black text-xl">
        ₹{price}
      </div>
    </div>
  );
}

// ── Star row ──────────────────────────────────────────────────────────────────
function StarRow({ count }) {
  return (
    <div className="flex gap-1 justify-center">
      {[1, 2, 3].map((s) => (
        <Star
          key={s}
          size={32}
          className={s <= count
            ? "text-yellow-400 fill-yellow-400"
            : "text-slate-300 fill-slate-100"}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WordProblemGame({ question, currencies, item, onComplete }) {
  /*
    Props:
      question   – from _serialize_question:
                   { question_id, question_text, expected_answer,
                     difficulty, currency_ids, item_id, ... }
      currencies – array from GET /api/currencies/?ids=...
                   [{ _id, value, type, front_image, back_image }, ...]
      item       – object from GET /api/items/?ids=...
                   { _id, name, image_url } or null
      onComplete – callback(starsEarned, attempts, timeSpent, hintsUsed)
  */

  const [walletItems,  setWalletItems]  = useState([]);
  const [walletTotal,  setWalletTotal]  = useState(0);
  const [feedback,     setFeedback]     = useState(null);
  const [submitted,    setSubmitted]    = useState(false);
  const [starsEarned,  setStarsEarned]  = useState(0);
  const [attempts,     setAttempts]     = useState(0);
  const [hintsUsed,    setHintsUsed]    = useState(0);
  const [showHint,     setShowHint]     = useState(false);
  const [startTime]                     = useState(Date.now());

  // Reset on question change
  useEffect(() => {
    setWalletItems([]);
    setWalletTotal(0);
    setFeedback(null);
    setSubmitted(false);
    setStarsEarned(0);
    setAttempts(0);
    setHintsUsed(0);
    setShowHint(false);
  }, [question?.question_id]);

  const target = question?.expected_answer ?? 0;

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const handleDragStart = (e, currency) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("currency", JSON.stringify(currency));
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    if (submitted) return;
    const currency = JSON.parse(e.dataTransfer.getData("currency"));
    const uid = `${currency._id}-${Date.now()}-${Math.random()}`;
    setWalletItems((prev) => [...prev, { ...currency, uid }]);
    setWalletTotal((prev) => prev + currency.value);
    setFeedback(null);
  };

  const removeFromWallet = (uid, value) => {
    if (submitted) return;
    setWalletItems((prev) => prev.filter((c) => c.uid !== uid));
    setWalletTotal((prev) => prev - value);
    setFeedback(null);
  };

  const resetWallet = () => {
    if (submitted) return;
    setWalletItems([]);
    setWalletTotal(0);
    setFeedback(null);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (submitted || walletTotal === 0) return;

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (walletTotal === target) {
      const timeSpent = (Date.now() - startTime) / 1000;
      const stars     = calculateStars(newAttempts, timeSpent, hintsUsed);
      setStarsEarned(stars);
      setSubmitted(true);
      setFeedback({ type: "success", msg: "🎉 Perfect! You paid the right amount!" });
      setTimeout(() => onComplete && onComplete(stars, newAttempts, timeSpent, hintsUsed), 1800);
    } else if (walletTotal < target) {
      setFeedback({ type: "error", msg: `You need ₹${target - walletTotal} more!` });
    } else {
      setFeedback({ type: "error", msg: `That's ₹${walletTotal - target} too much!` });
    }
  };

  const handleHint = () => {
    setShowHint(true);
    setHintsUsed((h) => h + 1);
  };

  if (!question) return null;

  // Deduplicate for the available-money tray (one chip per denomination)
  const uniqueCurrencies = Object.values(
    (currencies || []).reduce((acc, c) => {
      const key = `${c.type}-${c.value}`;
      if (!acc[key]) acc[key] = c;
      return acc;
    }, {})
  ).sort((a, b) => a.value - b.value);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">

      {/* Question banner */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-orange-200 rounded-2xl px-5 py-4 text-center">
        <p className="text-base font-black text-orange-800 leading-snug">
          {question.question_text}
        </p>
        {showHint && (
          <p className="mt-2 text-sm text-orange-600 font-semibold">
            💡 Hint: Find coins/notes that add up to ₹{target}
          </p>
        )}
      </div>

      {/* Item + Wallet */}
      <div className="grid grid-cols-2 gap-4">

        {/* Item image from DB */}
        <ItemDisplay question={question} item={item} />

        {/* Wallet drop zone */}
        <div className="flex flex-col gap-3 p-4 bg-gradient-to-b from-blue-50 to-white rounded-3xl border-2 border-blue-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-blue-500" />
              <span className="text-xs font-black text-slate-600 tracking-wide uppercase">Wallet</span>
            </div>
            <button
              onClick={resetWallet}
              disabled={submitted}
              className="flex items-center gap-1 px-2 py-1 text-xs font-black text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition disabled:opacity-40"
            >
              <RotateCcw size={11} /> Reset
            </button>
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`flex-1 min-h-[110px] rounded-2xl border-2 border-dashed p-2
              flex flex-wrap gap-2 content-start transition-colors
              ${submitted
                ? "border-slate-200 bg-slate-50"
                : "border-blue-200 bg-blue-50/60 hover:border-blue-400 hover:bg-blue-50"}`}
          >
            {walletItems.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-blue-300 text-xs font-bold select-none">
                Drag coins / notes here
              </div>
            ) : (
              walletItems.map((c) => (
                <div key={c.uid} className="relative group">
                  <CurrencyChip currency={c} small />
                  {!submitted && (
                    <button
                      onClick={() => removeFromWallet(c.uid, c.value)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full
                        flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Running total */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-xs font-black text-slate-500">Total</span>
            <span className={`text-2xl font-black transition-colors
              ${walletTotal === target  ? "text-emerald-600"
              : walletTotal > target   ? "text-red-500"
              : "text-blue-600"}`}>
              ₹{walletTotal}
            </span>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`rounded-2xl px-4 py-3 text-center font-black text-sm
          ${feedback.type === "success"
            ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-200"
            : "bg-red-100 text-red-700 border-2 border-red-200"}`}>
          {feedback.msg}
        </div>
      )}

      {/* Stars after success */}
      {submitted && (
        <div className="flex flex-col items-center gap-2 py-2 animate-bounce">
          <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Stars Earned</p>
          <StarRow count={starsEarned} />
        </div>
      )}

      {/* Available money tray — currency images from DB */}
      <div className="bg-white rounded-2xl border-2 border-slate-100 p-4 shadow-sm">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-center mb-3">
          Available Money — Drag to Wallet
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {uniqueCurrencies.map((currency, idx) => (
            <CurrencyChip
              key={idx}
              currency={currency}
              draggable={!submitted}
              onDragStart={(e) => handleDragStart(e, currency)}
            />
          ))}
          {uniqueCurrencies.length === 0 && (
            <p className="text-slate-400 text-sm">No currencies loaded.</p>
          )}
        </div>
      </div>

      {/* Action row */}
      <div className="flex gap-3">
        {!showHint && !submitted && (
          <button
            onClick={handleHint}
            className="flex-none px-4 py-3 rounded-2xl bg-amber-100 text-amber-700 font-black text-sm hover:bg-amber-200 transition"
          >
            💡 Hint
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={walletTotal === 0 || submitted}
          className={`flex-1 py-4 rounded-2xl font-black text-lg uppercase tracking-widest transition-all shadow-md
            ${submitted
              ? "bg-emerald-400 text-white cursor-default flex items-center justify-center gap-2"
              : walletTotal === 0
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-orange-500 text-white hover:bg-orange-600 active:scale-95"}`}
        >
          {submitted
            ? <><CheckCircle2 size={22} className="inline mr-2" /> Paid!</>
            : `Pay ₹${walletTotal}`}
        </button>
      </div>
    </div>
  );
}