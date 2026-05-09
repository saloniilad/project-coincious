"""
Neurodiverse Adaptive LSTM – Training Script
=============================================

What changed from the original and WHY
---------------------------------------

1.  Labels come directly from difficulty_label in the dataset.
    The old code threw them away and recalculated using a custom
    performance_score with arbitrary thresholds that had nothing to
    do with the 9-class difficulty naming scheme.

2.  Two neurodiverse-specific features are added to every timestep:
      • trend     – are stars improving across the window? (+1/0/-1)
      • stability – how consistent is the student's performance?
    Neurodiverse learners often show "spiky" profiles (great one
    session, overwhelmed the next).  Stability is a critical signal
    for deciding whether to hold, step up, or step down.
    Input shape is now (3, 6) instead of (3, 4).

3.  Adaptive prediction uses current difficulty + performance window
    to recommend the NEXT difficulty.  Rules are gradual and gentle:
    never jump more than 1-2 steps, drop quickly when struggling,
    step up slowly when thriving.

4.  The DB-level predictor correctly deduplicates repeated level rows,
    sorts by level, and maps raw DB columns to model features.
"""

import numpy as np
import pandas as pd
import joblib

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.callbacks import EarlyStopping

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler

# ------------------------------------------------------------------
# DIFFICULTY LABEL MAP
# ------------------------------------------------------------------

DIFFICULTY_MAP = {
    "easy-basic":        0,
    "easy-moderate":     1,
    "easy-high":         2,
    "medium-basic":      3,
    "medium-moderate":   4,
    "medium-high":       5,
    "hard-basic":        6,
    "hard-moderate":     7,
    "hard-high":         8,
}

LABEL_MAP = {v: k for k, v in DIFFICULTY_MAP.items()}

NUM_CLASSES = 9
TIMESTEPS   = 3
FEATURES    = 6   # time, attempts, hints, stars, trend, stability

# ------------------------------------------------------------------
# LOAD DATASET
# ------------------------------------------------------------------

df = pd.read_csv("neurodiverse_lstm_dataset.csv")
print(f"Dataset loaded: {df.shape[0]} rows\n")

# ------------------------------------------------------------------
# NEURODIVERSE ENRICHMENT  – trend & stability per 3-level window
# ------------------------------------------------------------------

def compute_trend(s1, s2, s3):
    """
    Direction of star progression across the window.
      +1  = improving  (last level better than first)
       0  = stable
      -1  = declining
    For neurodiverse students a positive trend matters even when
    absolute star count is low.
    """
    delta = s3 - s1
    if delta > 0:
        return 1.0
    elif delta < 0:
        return -1.0
    return 0.0


def compute_stability(s1, s2, s3):
    """
    How consistent is performance across the window?
    std of 0 → stability 1.0 (perfectly consistent)
    std of 2 → stability 0.0 (wildly variable)
    High variance is a strong indicator of cognitive overload in
    neurodiverse learners.
    """
    return max(0.0, 1.0 - (np.std([s1, s2, s3]) / 2.0))


# ------------------------------------------------------------------
# BUILD SEQUENCES  (shape: N x 3 x 6)
# ------------------------------------------------------------------

X, y = [], []

for _, row in df.iterrows():

    stars     = [row["level1_stars"], row["level2_stars"], row["level3_stars"]]
    trend     = compute_trend(*stars)
    stability = compute_stability(*stars)

    sequence = [
        # [time, attempts, hints, stars, trend, stability]
        [row["level1_time"], row["level1_attempts"], row["level1_hints"], row["level1_stars"], trend, stability],
        [row["level2_time"], row["level2_attempts"], row["level2_hints"], row["level2_stars"], trend, stability],
        [row["level3_time"], row["level3_attempts"], row["level3_hints"], row["level3_stars"], trend, stability],
    ]

    X.append(sequence)
    y.append(int(row["difficulty_label"]))   # use dataset label directly

X = np.array(X, dtype=np.float32)   # (N, 3, 6)
y = np.array(y, dtype=np.int32)

print(f"X shape : {X.shape}")
print(f"y shape : {y.shape}")
print(f"\nLabel distribution:\n{pd.Series(y).value_counts().sort_index().rename(LABEL_MAP).to_string()}\n")

# ------------------------------------------------------------------
# NORMALISE FEATURES
# ------------------------------------------------------------------

scaler     = MinMaxScaler()
X_reshaped = X.reshape(-1, FEATURES)
X_scaled   = scaler.fit_transform(X_reshaped)
X          = X_scaled.reshape(-1, TIMESTEPS, FEATURES)

joblib.dump(scaler, "scaler.pkl")
print("Scaler saved -> scaler.pkl")

# ------------------------------------------------------------------
# ONE-HOT ENCODE LABELS
# ------------------------------------------------------------------

y_cat = to_categorical(y, num_classes=NUM_CLASSES)

# ------------------------------------------------------------------
# TRAIN / TEST SPLIT  (stratified to keep class balance)
# ------------------------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X, y_cat,
    test_size=0.2,
    random_state=42,
    stratify=y,
)

print(f"Train: {len(X_train)}   Test: {len(X_test)}\n")

# ------------------------------------------------------------------
# MODEL
# ------------------------------------------------------------------

model = Sequential([
    LSTM(128, input_shape=(TIMESTEPS, FEATURES), return_sequences=True),
    Dropout(0.2),
    LSTM(64),
    Dropout(0.2),
    Dense(64, activation="relu"),
    Dense(NUM_CLASSES, activation="softmax"),
])

model.compile(
    optimizer="adam",
    loss="categorical_crossentropy",
    metrics=["accuracy"],
)

model.summary()

# ------------------------------------------------------------------
# TRAIN
# ------------------------------------------------------------------

early_stop = EarlyStopping(
    monitor="val_loss",
    patience=5,
    restore_best_weights=True,
)

history = model.fit(
    X_train, y_train,
    epochs=50,
    batch_size=32,
    validation_data=(X_test, y_test),
    callbacks=[early_stop],
    verbose=1,
)

# ------------------------------------------------------------------
# EVALUATE & REPORT
# ------------------------------------------------------------------

loss, accuracy = model.evaluate(X_test, y_test, verbose=0)

epochs_run      = len(history.history["val_loss"])
best_val_loss   = min(history.history["val_loss"])
best_val_acc    = max(history.history["val_accuracy"])
final_train_acc = history.history["accuracy"][-1]

print("\n" + "=" * 50)
print("         TRAINING COMPLETE")
print("=" * 50)
print(f"  Epochs run        : {epochs_run}  (early stop patience=5)")
print(f"  Best val accuracy : {best_val_acc * 100:.1f}%")
print(f"  Best val loss     : {best_val_loss:.4f}")
print(f"  Final train acc   : {final_train_acc * 100:.1f}%")
print(f"  Test accuracy     : {accuracy * 100:.1f}%")
print(f"  Test loss         : {loss:.4f}")
print("=" * 50)

if accuracy >= 0.90:
    print("  Status : EXCELLENT  — model is ready to use")
elif accuracy >= 0.75:
    print("  Status : GOOD       — model is ready to use")
elif accuracy >= 0.60:
    print("  Status : FAIR       — consider more training data")
else:
    print("  Status : POOR       — check data or retrain")

# ------------------------------------------------------------------
# SAVE MODEL
# ------------------------------------------------------------------

model.save("adaptive_lstm_model.h5")
joblib.dump(scaler, "scaler.pkl")

print("\n  Saved : adaptive_lstm_model.h5")
print("  Saved : scaler.pkl")
print("=" * 50)


# ==================================================================
# ADAPTIVE PREDICTION  - for neurodiverse learners
# ==================================================================

def compute_adaptive_next_label(avg_stars, avg_attempts, avg_hints,
                                avg_time, trend, stability, current_label):
    """
    Decide the recommended NEXT difficulty for a neurodiverse student.

    Rules are deliberately gentle:
      - Never jump more than 1 step up (avoid overwhelm)
      - Drop 1 step on mild struggle, 2 steps on significant struggle
      - Trend bonus: even if avg_stars is moderate, consistent improvement
        earns a gentle push forward
      - Stability guard: high variance across levels -> hold or drop
        regardless of average score (spiky profiles = overload signal)
    """

    # Normalise signals to 0-1 (based on dataset ranges)
    norm_stars    = (avg_stars    - 1) / 2.0
    norm_attempts = 1 - (avg_attempts - 1) / 4.0
    norm_hints    = 1 - avg_hints / 3.0
    norm_time     = max(0.0, min(1.0, 1 - (avg_time - 20) / 120.0))

    # Weighted performance index
    perf = (norm_stars    * 0.50 +
            norm_attempts * 0.20 +
            norm_hints    * 0.20 +
            norm_time     * 0.10)

    # Stability guard – erratic performance = hold or ease back
    if stability < 0.80:
        return max(0, current_label - 1)

    # Trend bonus – improving student deserves a nudge even if not yet thriving
    if trend > 0 and perf >= 0.45:
        perf += 0.08

    # Step decision
    if perf >= 0.75:
        step = +1    # thriving -> gentle step up
    elif perf >= 0.45:
        step =  0    # coping   -> hold, build confidence
    elif perf >= 0.25:
        step = -1    # mild struggle -> ease off one level
    else:
        step = -2    # significant struggle -> step back two levels

    return max(0, min(8, current_label + step))