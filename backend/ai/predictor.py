import numpy as np
import joblib
from tensorflow.keras.models import load_model

# -------------------------------------
# LOAD MODEL & SCALER (once at startup)
# -------------------------------------

model  = load_model("ai/adaptive_lstm_model.h5")
scaler = joblib.load("ai/scaler.pkl")

# -------------------------------------
# LABELS
# -------------------------------------

DIFFICULTY_STEPS = [
    "easy-basic",
    "easy-moderate",
    "easy-high",
    "medium-basic",
    "medium-moderate",
    "medium-high",
    "hard-basic",
    "hard-moderate",
    "hard-high",
]

labels = {i: d for i, d in enumerate(DIFFICULTY_STEPS)}

# -------------------------------------
# TREND & STABILITY HELPERS
# -------------------------------------

def compute_trend(s1, s2, s3):
    """
    Direction of star progression across the window.
      +1  = improving  (last level better than first)
       0  = stable
      -1  = declining
    """
    delta = s3 - s1
    return 1.0 if delta > 0 else (-1.0 if delta < 0 else 0.0)


def compute_stability(s1, s2, s3):
    """
    How consistent is performance across the window?
    std of 0 -> stability 1.0 (perfectly consistent)
    std of 2 -> stability 0.0 (wildly variable)
    """
    return max(0.0, 1.0 - (np.std([s1, s2, s3]) / 2.0))


# -------------------------------------
# PREDICT FUNCTION
# -------------------------------------

def predict_next_difficulty(sequence):
    """
    Predict the next difficulty level based on performance history.
    
    Args:
        sequence : list of attempts, each with [time_spent, attempts, hints_used, stars_earned]
    
    Strategy:
        1. Uses rolling window of LAST 3 attempts only
        2. Computes trend (improvement?) and stability (consistency?)
        3. Feeds to LSTM model which outputs probability across 9 difficulty levels
        4. Returns highest-probability difficulty
        
    For neurodiverse learners:
        - Trend: +1 if improving, -1 if declining, 0 if stable
        - Stability: 0.0 (chaotic) to 1.0 (perfectly consistent)
        - Model learns: spiky/inconsistent performance -> hold or ease back
    """
    
    # Rolling window: always use last 3 attempts
    # If fewer than 3, this shouldn't be called (frontend handles this)
    window = sequence[-3:] if len(sequence) >= 3 else sequence
    
    if len(window) < 3:
        print(f"[WARN] Window has {len(window)} items, expected 3")
        return "easy-basic"
    
    # Extract star progression for trend calculation
    stars = [row[3] for row in window]
    trend = compute_trend(*stars)
    stability = compute_stability(*stars)
    
    print(f"[AI] Window stars: {stars}")
    print(f"[AI] Trend: {trend:+.1f}  |  Stability: {stability:.2f}")
    
    # Enrich each timestep: [time, attempts, hints, stars, trend, stability]
    enriched = [
        [row[0], row[1], row[2], row[3], trend, stability]
        for row in window
    ]
    
    # Reshape for model
    arr = np.array([enriched], dtype=np.float32)  # shape: (1, 3, 6)
    reshaped = arr.reshape(-1, 6)  # shape: (3, 6)
    
    # Apply same scaler used during training
    scaled = scaler.transform(reshaped)  # transform only, do NOT fit
    arr = scaled.reshape(1, 3, 6)  # shape: (1, 3, 6) for model
    
    # Get prediction
    prediction = model.predict(arr, verbose=0)  # shape: (1, 9)
    index = int(np.argmax(prediction))
    confidence = float(prediction[0][index])
    
    result = labels[index]
    print(f"[AI] Prediction: {result} (confidence: {confidence:.2%})")
    print(f"[AI] All probabilities: {[f'{p:.3f}' for p in prediction[0]]}")
    
    return result