/**
 * adaptiveRNN.js
 *
 * Adaptive difficulty prediction using rolling window of 3 attempts.
 * 
 * Strategy:
 *   1. First 3 levels: always return easy-basic (no prediction yet)
 *   2. After 3 attempts: use LSTM model to predict next difficulty
 *   3. Rolling window: always uses last 3 attempts for prediction
 *   4. Neurodiverse-aware: considers trend + stability, not just raw score
 */

const API_BASE = import.meta.env.VITE_API;

export async function getNextDifficulty(history, attemptNumber = null) {
  
  // CRITICAL: First 3 levels/attempts ALWAYS use easy-basic
  // This ensures a safe, confidence-building foundation
  if (!history || history.length < 3) {
    console.log("📚 Attempt count:", history?.length || 0, "→ returning easy-basic");
    return "easy-basic";
  }

  // Use only LAST 3 attempts (rolling window)
  const window = history.slice(-3);
  
  const sequence = window.map((item) => [
    item.time_spent ?? 0,
    item.attempts ?? 1,
    item.hints_used ?? 0,
    item.stars_earned ?? 1,  // default 1 star if missing
  ]);

  console.log("🧠 AI Prediction:");
  console.log("   Window size:", sequence.length);
  console.log("   Last 3 attempts (window):", sequence);

  try {
    const response = await fetch(
      `${API_BASE}/math/predict-difficulty/`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ sequence }),
      }
    );

    if (!response.ok) {
      console.error("❌ Prediction failed:", response.status, response.statusText);
      return "easy-basic";
    }

    const data = await response.json();
    const predicted = data.difficulty ?? "easy-basic";
    console.log("✅ Model predicted:", predicted);
    return predicted;

  } catch (err) {
    console.error("❌ adaptiveRNN error:", err);
    return "easy-basic";
  }
}