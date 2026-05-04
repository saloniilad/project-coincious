import { useState, useEffect, useRef, useCallback } from "react";
import {
  RotateCcw,
  Trash2,
  Wallet,
  ShoppingBag,
  Star,
  CheckCircle2,
} from "lucide-react";

const DJANGO_BASE = import.meta.env.VITE_IMAGES.replace("/static/currency-images", "");

const hintArrowStyle = `
  @keyframes coinGlow {
    0%, 100% { box-shadow: 0 0 0 0px rgba(244,114,182,0.8); transform: scale(1); }
    50%       { box-shadow: 0 0 0 14px rgba(244,114,182,0); transform: scale(1.18); }
  }
  .coin-glow { animation: coinGlow 0.8s ease-in-out infinite; }

  @keyframes flyArc {
    0%   { transform: translate(0%,   0%)   scale(1.1); opacity: 1; }
    25%  { transform: translate(25%,  -40%) scale(1.3); opacity: 1; }
    50%  { transform: translate(50%,  -10%) scale(1.2); opacity: 1; }
    75%  { transform: translate(75%,  -35%) scale(1.1); opacity: 0.8; }
    100% { transform: translate(100%, 0%)   scale(0.6); opacity: 0; }
  }
  .fly-emoji {
    animation: flyArc 1.4s ease-in-out infinite;
    position: absolute;
    font-size: 22px;
    pointer-events: none;
    z-index: 50;
    top: 10px;
    left: 0;
    filter: drop-shadow(0 2px 6px rgba(236,72,153,0.3));
  }

  @keyframes dashMove {
    from { stroke-dashoffset: 24; }
    to   { stroke-dashoffset: 0; }
  }
  .hint-path {
    stroke-dasharray: 8 6;
    animation: dashMove 0.5s linear infinite;
  }

  @keyframes labelBounce {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-5px); }
  }
  .hint-label { animation: labelBounce 0.6s ease-in-out infinite; }

  @keyframes stepFade {
    from { opacity: 0; transform: scale(0.7) translateY(-4px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  .step-badge { animation: stepFade 0.3s ease-out forwards; }
`;

function calculateStars(attempts, timeSpent, hintsUsed) {
  let score = 100;
  score -= attempts * 5;
  score -= hintsUsed * 10;
  score -= timeSpent * 0.5;
  if (score >= 80) return 3;
  if (score >= 50) return 2;
  return 1;
}

function CurrencyChip({
  currency,
  draggable = false,
  onDragStart,
  onClick,
  small = false,
}) {
  const isCoin = currency.type === "coin";
  const imgSrc = currency.front_image
    ? `${DJANGO_BASE}${currency.front_image}`
    : null;
  const coinSize = small ? "w-12 h-12" : "w-16 h-16";
  const noteSize = small ? "w-20 h-10" : "w-28 h-14";
  const baseClass = `object-contain select-none
    ${draggable ? "cursor-grab active:cursor-grabbing hover:scale-110 transition-transform drop-shadow-md" : ""}
    ${onClick ? "cursor-pointer hover:scale-105 transition-transform" : ""}`;

  if (imgSrc)
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

  if (isCoin)
    return (
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onClick={onClick}
        className={`${coinSize} rounded-full border-4 border-yellow-600 bg-gradient-to-br from-yellow-300 to-yellow-500
        flex items-center justify-center font-bold text-yellow-900 shadow-md select-none
        ${draggable ? "cursor-grab hover:scale-110 transition-transform" : ""}
        ${onClick ? "cursor-pointer hover:scale-105 transition-transform" : ""}`}
      >
        ₹{currency.value}
      </div>
    );

  const noteColors = {
    10: "from-orange-200 to-orange-300 border-orange-400",
    20: "from-yellow-200 to-yellow-300 border-yellow-400",
    50: "from-cyan-200 to-cyan-300 border-cyan-400",
    100: "from-purple-200 to-purple-300 border-purple-400",
    200: "from-amber-200 to-amber-300 border-amber-400",
    500: "from-stone-200 to-stone-300 border-stone-400",
  };
  const colorClass =
    noteColors[currency.value] ||
    "from-slate-200 to-slate-300 border-slate-400";
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className={`${noteSize} rounded-lg border-2 bg-gradient-to-r ${colorClass}
        flex items-center justify-center font-bold text-slate-700 shadow-sm select-none
        ${draggable ? "cursor-grab hover:scale-110 transition-transform" : ""}
        ${onClick ? "cursor-pointer hover:scale-105 transition-transform" : ""}`}
    >
      ₹{currency.value}
    </div>
  );
}

function ItemDisplay({ question, item }) {
  const imgSrc = item?.image_url ? `${DJANGO_BASE}${item.image_url}` : null;
  const name = item?.name || question?.item_name || "Item";
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 p-6
      bg-gradient-to-b from-pink-50 to-white rounded-3xl border-2 border-pink-100 shadow-sm h-full"
    >
      <p className="text-xs font-black text-pink-400 tracking-widest uppercase">
        Buy This
      </p>
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={name}
          className="w-28 h-28 object-contain drop-shadow-lg"
        />
      ) : (
        <div className="w-28 h-28 rounded-2xl bg-orange-100 flex items-center justify-center">
          <ShoppingBag size={48} className="text-pink-400" />
        </div>
      )}
      <p className="font-black text-slate-700 text-base text-center">{name}</p>
    </div>
  );
}

function StarRow({ count }) {
  return (
    <div className="flex gap-1 justify-center">
      {[1, 2, 3].map((s) => (
        <Star
          key={s}
          size={32}
          className={
            s <= count
              ? "text-yellow-400 fill-yellow-400"
              : "text-slate-300 fill-slate-100"
          }
        />
      ))}
    </div>
  );
}

// ── SVG Dotted Line overlay from coin → wallet ────────────────────────────────
function HintLine({ fromRef, toRef, show }) {
  const [line, setLine] = useState(null);

  useEffect(() => {
    if (!show || !fromRef?.current || !toRef?.current) {
      setLine(null);
      return;
    }

    const calcLine = () => {
      const from = fromRef.current.getBoundingClientRect();
      const to = toRef.current.getBoundingClientRect();
      // Use page coords relative to viewport
      setLine({
        x1: from.left + from.width / 2,
        y1: from.top + from.height / 2,
        x2: to.left + to.width / 2,
        y2: to.top + to.height / 2,
      });
    };

    calcLine();
    window.addEventListener("resize", calcLine);
    window.addEventListener("scroll", calcLine, true);
    return () => {
      window.removeEventListener("resize", calcLine);
      window.removeEventListener("scroll", calcLine, true);
    };
  }, [show, fromRef, toRef]);

  if (!show || !line) return null;

  return (
    <svg
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      {/* Glow/shadow line */}
      <line
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
        stroke="rgba(244,114,182,0.2)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Animated dashed line */}
      <line
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
        stroke="#f472b6"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="hint-path"
      />
      {/* Dot at wallet end */}
      <circle cx={line.x2} cy={line.y2} r="5" fill="#ec4899" opacity="0.9" />
      <circle cx={line.x2} cy={line.y2} r="3" fill="white" opacity="0.9" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WordProblemGame({
  question,
  currencies,
  item,
  onComplete,
}) {
  const [walletItems, setWalletItems] = useState([]);
  const [walletTotal, setWalletTotal] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hintCurrencyIdx, setHintCurrencyIdx] = useState(null);
  const [hintIndices, setHintIndices] = useState([]);
  const [startTime] = useState(Date.now());

  // Refs for SVG line
  const coinRefs = useRef({}); // idx → ref
  const walletRef = useRef(null);
  const timerRefs = useRef([]);

  useEffect(() => {
    setWalletItems([]);
    setWalletTotal(0);
    setFeedback(null);
    setSubmitted(false);
    setStarsEarned(0);
    setAttempts(0);
    setHintsUsed(0);
    setShowHint(false);
    setHintCurrencyIdx(null);
    setHintIndices([]);
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  }, [question?.question_id]);

  const target = question?.expected_answer ?? 0;

  const uniqueCurrencies = Object.values(
    (currencies || []).reduce((acc, c) => {
      const key = `${c.type}-${c.value}`;
      if (!acc[key]) acc[key] = c;
      return acc;
    }, {}),
  ).sort((a, b) => a.value - b.value);

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

  const stopHint = useCallback(() => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    setHintCurrencyIdx(null);
    setHintIndices([]);
  }, []);

  const handleSubmit = () => {
    if (submitted || walletTotal === 0) return;
    stopHint();
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    if (walletTotal === target) {
      const timeSpent = (Date.now() - startTime) / 1000;
      const stars = calculateStars(newAttempts, timeSpent, hintsUsed);
      setStarsEarned(stars);
      setSubmitted(true);
      setFeedback({
        type: "success",
        msg: "🎉 Perfect! You paid the right amount!",
      });
      setTimeout(
        () =>
          onComplete && onComplete(stars, newAttempts, timeSpent, hintsUsed),
        1800,
      );
    } else if (walletTotal < target) {
      setFeedback({
        type: "error",
        msg: `You need ₹${target - walletTotal} more!`,
      });
    } else {
      setFeedback({
        type: "error",
        msg: `That's ₹${walletTotal - target} too much!`,
      });
    }
  };

  // ── Hint: greedy → all coins needed → cycle through them forever ──────────
  const handleHint = () => {
    setShowHint(true);
    setHintsUsed((h) => h + 1);

    // Greedy decomposition
    const sortedDesc = [...uniqueCurrencies].sort((a, b) => b.value - a.value);
    let remaining = target - walletTotal;
    const needed = [];
    for (const c of sortedDesc) {
      while (remaining >= c.value) {
        const idx = uniqueCurrencies.findIndex(
          (u) => u.type === c.type && u.value === c.value,
        );
        if (idx !== -1) needed.push(idx);
        remaining -= c.value;
      }
    }
    if (needed.length === 0) needed.push(0);

    setHintIndices(needed);

    const STEP = 2000; // ms per coin

    const schedule = (iteration) => {
      needed.forEach((coinIdx, step) => {
        const t = setTimeout(
          () => {
            setHintCurrencyIdx(coinIdx);
          },
          (iteration * needed.length + step) * STEP,
        );
        timerRefs.current.push(t);
      });
      // schedule next cycle
      const next = setTimeout(
        () => schedule(iteration + 1),
        (iteration + 1) * needed.length * STEP,
      );
      timerRefs.current.push(next);
    };

    schedule(0);

    // Auto-stop after 15 seconds
    const stop = setTimeout(stopHint, 15000);
    timerRefs.current.push(stop);
  };

  if (!question) return null;

  return (
    <>
      <style>{hintArrowStyle}</style>

      {/* SVG dotted line from active coin → wallet */}
      <HintLine
        fromRef={
          hintCurrencyIdx !== null ? coinRefs.current[hintCurrencyIdx] : null
        }
        toRef={walletRef}
        show={hintCurrencyIdx !== null}
      />

      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">
        {/* Question banner */}
        <div className="bg-gradient-to-r from-amber-100 to-pink-100 border-2 border-pink-200 rounded-2xl px-5 py-4 text-center">
          <p className="text-base font-black text-pink-800 leading-snug">
            {question.question_text}
          </p>
          {showHint && (
            <p className="mt-2 text-sm text-pink-600 font-semibold">
              💡 Hint: Find coins/notes that add up to ₹{target}
            </p>
          )}
        </div>

        {/* Item + Wallet */}
        <div className="grid grid-cols-2 gap-4">
          <ItemDisplay question={question} item={item} />

          <div className="flex flex-col gap-3 p-4 bg-gradient-to-b from-blue-50 to-white rounded-3xl border-2 border-blue-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-blue-500" />
                <span className="text-xs font-black text-slate-600 tracking-wide uppercase">
                  Wallet
                </span>
              </div>
              <button
                onClick={resetWallet}
                disabled={submitted}
                className="flex items-center gap-1 px-2 py-1 text-xs font-black text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition disabled:opacity-40"
              >
                <RotateCcw size={11} /> Reset
              </button>
            </div>

            <div
              ref={walletRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`flex-1 min-h-[110px] rounded-2xl border-2 border-dashed p-2
                flex flex-wrap gap-2 content-start transition-colors
                ${
                  submitted
                    ? "border-slate-200 bg-slate-50"
                    : "border-blue-200 bg-blue-50/60 hover:border-blue-400 hover:bg-blue-50"
                }`}
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

            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="text-xs font-black text-slate-500">Total</span>
              <span
                className={`text-2xl font-black transition-colors
                ${
                  walletTotal === target
                    ? "text-emerald-600"
                    : walletTotal > target
                      ? "text-red-500"
                      : "text-blue-600"
                }`}
              >
                ₹{walletTotal}
              </span>
            </div>
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            className={`rounded-2xl px-4 py-3 text-center font-black text-sm
            ${
              feedback.type === "success"
                ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-200"
                : "bg-red-100 text-red-700 border-2 border-red-200"
            }`}
          >
            {feedback.msg}
          </div>
        )}

        {/* Stars after success */}
        {submitted && (
          <div className="flex flex-col items-center gap-2 py-2 animate-bounce">
            <p className="text-sm font-black text-slate-500 uppercase tracking-widest">
              Stars Earned
            </p>
            <StarRow count={starsEarned} />
          </div>
        )}

        {/* Available money tray */}
        <div className="bg-white rounded-2xl border-2 border-slate-100 p-4 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-center mb-4">
            Available Money — Drag to Wallet
          </p>

          {/* Step indicator when hint is active */}
          {hintCurrencyIdx !== null && hintIndices.length > 1 && (
            <div className="step-badge flex justify-center gap-2 mb-3">
              {hintIndices.map((coinIdx, i) => (
                <div
                  key={i}
                  className={`px-3 py-1 rounded-full text-xs font-black transition-all
                    ${
                      hintCurrencyIdx === coinIdx
                        ? "bg-pink-500 text-white scale-110 shadow-md"
                        : "bg-pink-100 text-pink-400"
                    }`}
                >
                  ₹{uniqueCurrencies[coinIdx]?.value}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-4 justify-center">
            {uniqueCurrencies.map((currency, idx) => {
              // Ensure a ref exists for every coin
              if (!coinRefs.current[idx]) {
                coinRefs.current[idx] = { current: null };
              }
              const isHinted = hintCurrencyIdx === idx;

              return (
                <div
                  key={idx}
                  className="relative flex flex-col items-center"
                  ref={(el) => {
                    coinRefs.current[idx] = { current: el };
                  }}
                >
                  {/* Flying emoji */}
                  {isHinted && <span className="fly-emoji">🪙</span>}

                  {/* Coin with glow */}
                  <div className={isHinted ? "coin-glow rounded-full" : ""}>
                    <CurrencyChip
                      currency={currency}
                      draggable={!submitted}
                      onDragStart={(e) => handleDragStart(e, currency)}
                    />
                  </div>

                  {/* Bouncing label */}
                  {isHinted && (
                    <p className="hint-label text-xs text-pink-500 font-black mt-2 whitespace-nowrap bg-pink-50 px-2 py-1 rounded-lg border border-pink-200">
                      👉 Add ₹{currency.value}!
                    </p>
                  )}
                </div>
              );
            })}
            {uniqueCurrencies.length === 0 && (
              <p className="text-slate-400 text-sm">No currencies loaded.</p>
            )}
          </div>
        </div>

        {/* Action row */}
        <div className="flex gap-3">
          {!submitted &&
            (hintCurrencyIdx !== null ? (
              <button
                onClick={stopHint}
                className="flex-none px-4 py-3 rounded-2xl bg-red-100 text-red-600 font-black text-sm hover:bg-red-200 transition border-2 border-red-300 animate-pulse"
              >
                ⏹ Stop
              </button>
            ) : !showHint ? (
              <button
                onClick={handleHint}
                className="flex-none px-4 py-3 rounded-2xl bg-amber-100 text-amber-700 font-black text-sm hover:bg-amber-200 transition"
              >
                💡 Hint
              </button>
            ) : null)}
          <button
            onClick={handleSubmit}
            disabled={walletTotal === 0 || submitted}
            className={`flex-1 py-4 rounded-2xl font-black text-lg uppercase tracking-widest transition-all shadow-md
              ${
                submitted
                  ? "bg-emerald-400 text-white cursor-default flex items-center justify-center gap-2"
                  : walletTotal === 0
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-pink-500 text-white hover:bg-pink-600 active:scale-95"
              }`}
          >
            {submitted ? (
              <>
                <CheckCircle2 size={22} className="inline mr-2" /> Paid!
              </>
            ) : (
              `Pay ₹${walletTotal}`
            )}
          </button>
        </div>
      </div>
    </>
  );
}
