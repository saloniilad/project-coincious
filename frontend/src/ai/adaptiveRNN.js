const API_BASE = import.meta.env.VITE_API;

export async function getNextDifficulty(history) {

  if (history.length < 3) {
    return "easy-basic";
  }

  const sequence = history.map(item => [

    item.time_spent,

    item.attempts,

    item.hints_used,

    item.star_earned
  ]);

  try {

    const response = await fetch(

      `${API_BASE}/math/predict-difficulty/`,

      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          sequence
        })
      }
    );

    const data = await response.json();

    return data.difficulty;

  } catch (err) {

    console.error(err);

    return "easy-basic";
  }
}