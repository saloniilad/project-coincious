import os
import numpy as np

BASE = os.path.dirname(os.path.abspath(__file__))
_d = np.load(os.path.join(BASE, "model_weights.npz"))
K1, R1, b1, K2, R2, b2, W3, b3, W4, b4 = [_d[f"arr_{i}"] for i in range(10)]
SCALE, MIN = _d["scale"], _d["min"]

DIFFICULTY_STEPS = ["easy-basic", "easy-moderate", "easy-high",
                    "medium-basic", "medium-moderate", "medium-high",
                    "hard-basic", "hard-moderate", "hard-high"]

def _sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))

def _lstm(x, K, R, b):
    h = np.zeros(R.shape[0]); c = np.zeros(R.shape[0]); out = []
    for t in range(x.shape[0]):
        z = x[t] @ K + h @ R + b
        i, f, g, o = np.split(z, 4)
        c = _sigmoid(f) * c + _sigmoid(i) * np.tanh(g)
        h = _sigmoid(o) * np.tanh(c)
        out.append(h)
    return np.array(out)

def _trend(s1, s2, s3):
    d = s3 - s1
    return 1.0 if d > 0 else (-1.0 if d < 0 else 0.0)

def _stability(s1, s2, s3):
    return max(0.0, 1.0 - np.std([s1, s2, s3]) / 2.0)

def predict_next_difficulty(sequence):
    window = sequence[-3:]
    if len(window) < 3:
        return "easy-basic"
    stars = [r[3] for r in window]
    tr, st = _trend(*stars), _stability(*stars)
    x = np.array([[r[0], r[1], r[2], r[3], tr, st] for r in window], dtype=np.float32)
    x = x * SCALE + MIN
    h1 = _lstm(x, K1, R1, b1)
    h2 = _lstm(h1, K2, R2, b2)[-1]
    d = np.maximum(0, h2 @ W3 + b3)
    logits = d @ W4 + b4
    return DIFFICULTY_STEPS[int(np.argmax(logits))]