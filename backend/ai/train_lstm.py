import numpy as np
import pandas as pd
import joblib

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.utils import to_categorical

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler

# -------------------------------------------------
# LOAD DATASET
# -------------------------------------------------

df = pd.read_csv("neurodiverse_lstm_dataset.csv")

print(df.head())

# -------------------------------------------------
# CREATE INPUT SEQUENCES
# -------------------------------------------------

X = []
y = []

for index, row in df.iterrows():

    sequence = [

        [
            row["level1_time"],
            row["level1_attempts"],
            row["level1_hints"],
            row["level1_stars"]
        ],

        [
            row["level2_time"],
            row["level2_attempts"],
            row["level2_hints"],
            row["level2_stars"]
        ],

        [
            row["level3_time"],
            row["level3_attempts"],
            row["level3_hints"],
            row["level3_stars"]
        ]
    ]

    # -------------------------------------------------
    # FEATURE AVERAGES
    # -------------------------------------------------

    avg_time = sum(x[0] for x in sequence) / 3

    avg_attempts = sum(x[1] for x in sequence) / 3

    avg_hints = sum(x[2] for x in sequence) / 3

    avg_stars = sum(x[3] for x in sequence) / 3

    # -------------------------------------------------
    # CONSISTENCY SCORE
    # -------------------------------------------------

    star_variation = max(x[3] for x in sequence) - min(x[3] for x in sequence)

    consistency_bonus = max(0, 3 - star_variation) * 12

    # -------------------------------------------------
    # IMPROVEMENT TREND
    # -------------------------------------------------

    improvement_bonus = 0

    if sequence[-1][3] > sequence[0][3]:
        improvement_bonus += 15

    elif sequence[-1][3] == sequence[0][3]:
        improvement_bonus += 5

    # -------------------------------------------------
    # MOMENTUM BONUS
    # -------------------------------------------------

    momentum_bonus = 0

    if avg_stars >= 2:
        momentum_bonus += 12

    if avg_stars >= 2.3:
        momentum_bonus += 10

    # -------------------------------------------------
    # PERFORMANCE SCORE
    # -------------------------------------------------

    performance_score = 0

    # Accuracy most important
    performance_score += avg_stars * 40

    # Time low importance
    performance_score += max(0, 140 - avg_time) * 0.08

    # Attempts moderate importance
    performance_score += max(0, 5 - avg_attempts) * 6

    # Hints low penalty
    performance_score += max(0, 3 - avg_hints) * 2

    # Bonuses
    performance_score += consistency_bonus

    performance_score += improvement_bonus

    performance_score += momentum_bonus

    # -------------------------------------------------
    # LABELS
    # -------------------------------------------------

    if performance_score >= 175:
        label = 8

    elif performance_score >= 155:
        label = 7

    elif performance_score >= 135:
        label = 6

    elif performance_score >= 118:
        label = 5

    elif performance_score >= 102:
        label = 4

    elif performance_score >= 86:
        label = 3

    elif performance_score >= 70:
        label = 2

    elif performance_score >= 52:
        label = 1

    else:
        label = 0

    # -------------------------------------------------
    # APPEND
    # -------------------------------------------------

    X.append(sequence)

    y.append(label)

# -------------------------------------------------
# CONVERT TO NUMPY
# -------------------------------------------------

X = np.array(X)

y = np.array(y)

print("\nX Shape:", X.shape)

print("y Shape:", y.shape)

# -------------------------------------------------
# NORMALIZE FEATURES
# -------------------------------------------------

scaler = MinMaxScaler()

X_reshaped = X.reshape(-1, X.shape[-1])

X_scaled = scaler.fit_transform(X_reshaped)

X = X_scaled.reshape(X.shape)

# SAVE SCALER

joblib.dump(scaler, "ai/scaler.pkl")

print("\nScaler saved")

# -------------------------------------------------
# ONE HOT ENCODE LABELS
# -------------------------------------------------

y = to_categorical(y, num_classes=9)

# -------------------------------------------------
# TRAIN TEST SPLIT
# -------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(

    X,
    y,

    test_size=0.2,

    random_state=42
)

# -------------------------------------------------
# BUILD MODEL
# -------------------------------------------------

model = Sequential()

model.add(
    LSTM(
        64,
        input_shape=(3,4)
    )
)

model.add(
    Dense(
        32,
        activation='relu'
    )
)

model.add(
    Dense(
        9,
        activation='softmax'
    )
)

# -------------------------------------------------
# COMPILE
# -------------------------------------------------

model.compile(

    optimizer='adam',

    loss='categorical_crossentropy',

    metrics=['accuracy']
)

model.summary()

# -------------------------------------------------
# TRAIN MODEL
# -------------------------------------------------

history = model.fit(

    X_train,
    y_train,

    epochs=25,

    batch_size=16,

    validation_data=(X_test, y_test)
)

# -------------------------------------------------
# EVALUATE
# -------------------------------------------------

loss, accuracy = model.evaluate(X_test, y_test)

print("\nAccuracy:", accuracy)

# -------------------------------------------------
# SAVE MODEL
# -------------------------------------------------

model.save("ai/adaptive_lstm_model.h5")

print("\nMODEL TRAINED SUCCESSFULLY")

print("Model saved to ai/adaptive_lstm_model.h5")

print("Scaler saved to ai/scaler.pkl")