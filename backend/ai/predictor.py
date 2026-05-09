import numpy as np

from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler

# -------------------------------------
# LOAD MODEL
# -------------------------------------

model = load_model("ai/adaptive_lstm_model.h5")

# -------------------------------------
# LABELS
# -------------------------------------

labels = {

    0: "easy-basic",
    1: "easy-moderate",
    2: "easy-high",

    3: "medium-basic",
    4: "medium-moderate",
    5: "medium-high",

    6: "hard-basic",
    7: "hard-moderate",
    8: "hard-high",
}

# -------------------------------------
# PREDICT FUNCTION
# -------------------------------------

def predict_next_difficulty(sequence):

    """
    sequence example:

    [
      [40,1,0,3],
      [50,2,1,2],
      [70,3,2,1]
    ]
    """

    arr = np.array([sequence])

    # normalize
    scaler = MinMaxScaler()

    reshaped = arr.reshape(-1, arr.shape[-1])

    scaled = scaler.fit_transform(reshaped)

    arr = scaled.reshape(arr.shape)

    prediction = model.predict(arr)

    index = int(np.argmax(prediction))

    return labels[index]