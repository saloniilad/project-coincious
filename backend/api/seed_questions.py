"""
seed_questions.py
=================
Run this ONCE to insert all questions into MongoDB.

Schema (Questions Table):
  i.    question_id     → ObjectId  (Primary Key, auto by MongoDB as _id)
  ii.   module_id       → ObjectId  (Foreign Key → modules)
  iii.  difficulty      → String    ("easy-basic", "easy-moderate", "easy-high",
                                     "medium-basic", "medium-moderate", "medium-high",
                                     "hard-basic", "hard-moderate", "hard-high")
  iv.   question_text   → String
  v.    options         → Array     (for MCQ; null for word_problem)
  vi.   correct_answer  → Number    (for MCQ; null for word_problem)
  vii.  problem_type    → String    ("mcq" | "word_problem")
  viii. expected_answer → Number    (for MCQ; null for word_problem)
  ix.   created_at      → Date
  x.    updated_at      → Date
  xi.   item_id         → ObjectId  (FK → items; only for word_problem, null for MCQ)
  xii.  currency_id     → ObjectId  (FK → currency; only for MCQ, null for word_problem)

Usage:
    python manage.py shell
    >>> from api.seed_questions import seed_questions
    >>> seed_questions()
"""

from datetime import datetime
from api.db import (
    get_questions_collection,
    get_modules_collection,
    get_items_collection,
    get_currency_collection,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_module_id(modules_col, name):
    doc = modules_col.find_one({"module_name": name})
    if not doc:
        raise RuntimeError(f"Module '{name}' not found. Run seed_modules first.")
    return doc["_id"]


def get_item_id(items_col, name):
    """Case-insensitive lookup; returns None if not found."""
    doc = items_col.find_one({"name": {"$regex": f"^{name}$", "$options": "i"}})
    return doc["_id"] if doc else None


def get_currency_id(currency_col, value, ctype):
    """Lookup by numeric value + type ('coin'|'note'). Returns None if missing."""
    doc = currency_col.find_one({"value": int(value), "type": ctype})
    return doc["_id"] if doc else None


def extract_currencies_from_mcq(question_text):
    """
    Parse ALL Rs.<value> amounts from an MCQ question_text.
    Returns list of (value, type) tuples.
    Values >= 500 -> note, < 500 -> coin.
    """
    import re
    matches = re.findall(r'Rs\.?(\d+)|₹(\d+)', question_text)
    results = []
    seen = set()
    for pair in matches:
        value = int(next(v for v in pair if v))
        ctype = "note" if value >= 500 else "coin"
        key = (value, ctype)
        if key not in seen:          # deduplicate Rs.5 + Rs.5
            seen.add(key)
            results.append((value, ctype))
    return results



def extract_item_from_word_problem(question_text, items_col):
    """
    Try to find a known item name inside the word-problem text.
    Returns the item's ObjectId or None.
    """
    all_items = list(items_col.find({}, {"name": 1}))
    text_lower = question_text.lower()
    for item in all_items:
        if item["name"].lower() in text_lower:
            return item["_id"]
    return None


# ── Raw question data ─────────────────────────────────────────────────────────
# Format: (difficulty, question_text, options_or_None, correct_answer_or_None,
#          problem_type, expected_answer_or_None)

ADDITION_QUESTIONS = [
    # easy-basic
    ("easy-basic",    "₹1 + ₹2 = ?",                  [3,4,5,6],          3,   "mcq", 3),
    ("easy-basic",    "₹2 + ₹5 = ?",                  [6,7,8,9],          7,   "mcq", 7),
    ("easy-basic",    "₹5 + ₹10 = ?",                 [10,15,20,25],      15,  "mcq", 15),
    ("easy-basic",    "₹10 + ₹20 = ?",                [20,25,30,35],      30,  "mcq", 30),
    ("easy-basic",    "₹20 + ₹20 = ?",                [30,35,40,45],      40,  "mcq", 40),
    ("easy-basic",    "₹10 + ₹50 = ?",                [50,60,70,80],      60,  "mcq", 60),
    ("easy-basic",    "₹5 + ₹20 = ?",                 [20,25,30,35],      25,  "mcq", 25),
    ("easy-basic",    "₹20 + ₹10 = ?",                [25,30,35,40],      30,  "mcq", 30),
    ("easy-basic",    "₹50 + ₹20 = ?",                [60,70,80,90],      70,  "mcq", 70),
    ("easy-basic",    "₹100 + ₹20 = ?",               [100,110,120,130],  120, "mcq", 120),
    # easy-moderate
    ("easy-moderate", "₹1 + ₹2 + ₹5 = ?",             [6,7,8,9],          8,   "mcq", 8),
    ("easy-moderate", "₹2 + ₹5 + ₹10 = ?",            [15,17,19,20],      17,  "mcq", 17),
    ("easy-moderate", "₹5 + ₹5 + ₹20 = ?",            [25,30,35,40],      30,  "mcq", 30),
    ("easy-moderate", "₹10 + ₹20 + ₹10 = ?",          [30,35,40,45],      40,  "mcq", 40),
    ("easy-moderate", "₹20 + ₹20 + ₹10 = ?",          [40,45,50,55],      50,  "mcq", 50),
    ("easy-moderate", "₹50 + ₹20 + ₹10 = ?",          [70,75,80,90],      80,  "mcq", 80),
    ("easy-moderate", "₹10 + ₹10 + ₹20 = ?",          [30,35,40,45],      40,  "mcq", 40),
    ("easy-moderate", "₹5 + ₹10 + ₹50 = ?",           [60,65,70,75],      65,  "mcq", 65),
    ("easy-moderate", "₹2 + ₹2 + ₹20 = ?",            [22,23,24,25],      24,  "mcq", 24),
    ("easy-moderate", "₹20 + ₹50 + ₹20 = ?",          [80,85,90,100],     90,  "mcq", 90),
    # easy-high
    ("easy-high",     "₹2 + ₹5 + ₹20 = ?",            [25,27,30,32],      27,  "mcq", 27),
    ("easy-high",     "₹5 + ₹10 + ₹50 = ?",           [60,65,70,75],      65,  "mcq", 65),
    ("easy-high",     "₹1 + ₹2 + ₹50 = ?",            [50,52,53,55],      53,  "mcq", 53),
    ("easy-high",     "₹10 + ₹20 + ₹100 = ?",         [120,130,140,150],  130, "mcq", 130),
    ("easy-high",     "₹5 + ₹20 + ₹100 = ?",          [115,120,125,130],  125, "mcq", 125),
    ("easy-high",     "₹2 + ₹10 + ₹50 = ?",           [60,62,64,66],      62,  "mcq", 62),
    ("easy-high",     "₹20 + ₹20 + ₹10 = ?",          [40,45,50,55],      50,  "mcq", 50),
    ("easy-high",     "₹5 + ₹5 + ₹100 = ?",           [105,110,115,120],  110, "mcq", 110),
    ("easy-high",     "₹10 + ₹50 + ₹20 = ?",          [70,75,80,90],      80,  "mcq", 80),
    ("easy-high",     "₹1 + ₹5 + ₹100 = ?",           [104,105,106,110],  106, "mcq", 106),
    # medium-basic
    ("medium-basic",  "₹100 + ₹50 = ?",                [120,150,180,200],  150, "mcq", 150),
    ("medium-basic",  "₹200 + ₹100 = ?",               [250,300,350,400],  300, "mcq", 300),
    ("medium-basic",  "₹500 + ₹100 = ?",               [550,600,650,700],  600, "mcq", 600),
    ("medium-basic",  "₹200 + ₹50 = ?",                [220,250,270,300],  250, "mcq", 250),
    ("medium-basic",  "₹500 + ₹200 = ?",               [600,650,700,750],  700, "mcq", 700),
    ("medium-basic",  "₹100 + ₹200 = ?",               [250,300,350,400],  300, "mcq", 300),
    ("medium-basic",  "₹500 + ₹50 = ?",                [520,550,600,650],  550, "mcq", 550),
    ("medium-basic",  "₹200 + ₹200 = ?",               [350,380,400,420],  400, "mcq", 400),
    ("medium-basic",  "₹100 + ₹20 = ?",                [110,120,130,140],  120, "mcq", 120),
    ("medium-basic",  "₹500 + ₹20 = ?",                [510,520,530,540],  520, "mcq", 520),
    # medium-moderate
    ("medium-moderate","₹100 + ₹100 + ₹50 = ?",        [200,230,250,270],  250, "mcq", 250),
    ("medium-moderate","₹200 + ₹200 + ₹100 = ?",       [400,450,500,550],  500, "mcq", 500),
    ("medium-moderate","₹500 + ₹100 + ₹50 = ?",        [600,620,650,700],  650, "mcq", 650),
    ("medium-moderate","₹200 + ₹100 + ₹20 = ?",        [300,320,340,360],  320, "mcq", 320),
    ("medium-moderate","₹500 + ₹200 + ₹20 = ?",        [680,700,720,740],  720, "mcq", 720),
    # medium-high
    ("medium-high",   "₹5 + ₹10 + ₹100 + ₹200 = ?",   [300,310,315,330],  315, "mcq", 315),
    ("medium-high",   "₹2 + ₹5 + ₹50 + ₹200 = ?",     [240,250,257,270],  257, "mcq", 257),
    ("medium-high",   "₹1 + ₹2 + ₹5 + ₹20 + ₹50 = ?", [70,75,78,80],      78,  "mcq", 78),
    ("medium-high",   "₹10 + ₹20 + ₹100 + ₹200 = ?",  [300,320,330,350],  330, "mcq", 330),
    ("medium-high",   "₹5 + ₹5 + ₹20 + ₹100 = ?",     [110,120,130,140],  130, "mcq", 130),
    ("medium-high",   "₹2 + ₹2 + ₹10 + ₹50 + ₹100 = ?",[150,160,164,170], 164, "mcq", 164),
    ("medium-high",   "₹1 + ₹5 + ₹10 + ₹20 + ₹200 = ?",[220,230,236,250], 236, "mcq", 236),
    ("medium-high",   "₹10 + ₹10 + ₹50 + ₹100 = ?",   [150,160,170,180],  170, "mcq", 170),
    ("medium-high",   "₹5 + ₹20 + ₹50 + ₹200 = ?",    [250,260,275,300],  275, "mcq", 275),
    ("medium-high",   "₹2 + ₹5 + ₹20 + ₹100 + ₹200 = ?",[300,310,327,350],327, "mcq", 327),
    # hard-basic
    ("hard-basic",    "₹500 + ₹500 = ?",               [900,1000,1100,1200],  1000, "mcq", 1000),
    ("hard-basic",    "₹500 + ₹200 = ?",               [600,650,700,750],     700,  "mcq", 700),
    ("hard-basic",    "₹200 + ₹200 + ₹100 = ?",        [400,450,500,550],     500,  "mcq", 500),
    ("hard-basic",    "₹100 + ₹100 + ₹100 + ₹100 = ?", [300,350,400,450],     400,  "mcq", 400),
    ("hard-basic",    "₹500 + ₹100 + ₹100 = ?",        [600,650,700,750],     700,  "mcq", 700),
    ("hard-basic",    "₹200 + ₹200 + ₹200 = ?",        [500,550,600,650],     600,  "mcq", 600),
    ("hard-basic",    "₹500 + ₹200 + ₹100 = ?",        [700,750,800,850],     800,  "mcq", 800),
    ("hard-basic",    "₹100 + ₹200 + ₹500 = ?",        [700,750,800,850],     800,  "mcq", 800),
    ("hard-basic",    "₹50 + ₹50 + ₹50 + ₹50 = ?",    [150,180,200,220],     200,  "mcq", 200),
    ("hard-basic",    "₹500 + ₹500 + ₹100 = ?",        [1000,1100,1200,1300], 1100, "mcq", 1100),
    # hard-moderate
    ("hard-moderate", "₹500 + ₹200 + ₹100 + ₹50 = ?",         [800,820,850,900],  850, "mcq", 850),
    ("hard-moderate", "₹200 + ₹200 + ₹100 + ₹20 = ?",         [500,520,540,560],  520, "mcq", 520),
    ("hard-moderate", "₹500 + ₹100 + ₹50 + ₹20 = ?",          [650,670,690,710],  670, "mcq", 670),
    ("hard-moderate", "₹200 + ₹100 + ₹50 + ₹20 + ₹20 = ?",   [350,370,390,410],  390, "mcq", 390),
    ("hard-moderate", "₹500 + ₹200 + ₹100 + ₹20 = ?",         [780,800,820,840],  820, "mcq", 820),
    ("hard-moderate", "₹200 + ₹200 + ₹200 + ₹20 = ?",         [580,600,620,640],  620, "mcq", 620),
    ("hard-moderate", "₹500 + ₹100 + ₹100 + ₹50 = ?",         [700,720,750,780],  750, "mcq", 750),
    ("hard-moderate", "₹100 + ₹100 + ₹50 + ₹20 + ₹20 = ?",   [260,270,290,300],  290, "mcq", 290),
    ("hard-moderate", "₹200 + ₹50 + ₹50 + ₹20 = ?",           [300,310,320,330],  320, "mcq", 320),
    ("hard-moderate", "₹500 + ₹200 + ₹50 + ₹20 = ?",          [740,760,770,790],  770, "mcq", 770),
    # hard-high
    ("hard-high",     "₹5 + ₹10 + ₹20 + ₹100 + ₹200 = ?",               [320,330,335,350],  335, "mcq", 335),
    ("hard-high",     "₹2 + ₹2 + ₹20 + ₹50 + ₹200 + ₹500 = ?",          [760,770,774,780],  774, "mcq", 774),
    ("hard-high",     "₹1 + ₹5 + ₹10 + ₹20 + ₹100 + ₹500 = ?",          [620,630,636,650],  636, "mcq", 636),
    ("hard-high",     "₹10 + ₹10 + ₹50 + ₹100 + ₹200 + ₹500 = ?",       [850,860,870,900],  870, "mcq", 870),
    ("hard-high",     "₹2 + ₹5 + ₹20 + ₹100 + ₹200 + ₹500 = ?",         [810,820,827,840],  827, "mcq", 827),
    ("hard-high",     "₹5 + ₹5 + ₹10 + ₹20 + ₹50 + ₹200 = ?",           [260,270,290,300],  290, "mcq", 290),
    ("hard-high",     "₹1 + ₹2 + ₹5 + ₹10 + ₹20 + ₹100 = ?",            [130,135,138,140],  138, "mcq", 138),
    ("hard-high",     "₹10 + ₹20 + ₹50 + ₹100 + ₹200 = ?",              [350,360,380,400],  380, "mcq", 380),
    ("hard-high",     "₹2 + ₹5 + ₹20 + ₹50 + ₹100 + ₹200 = ?",          [360,370,377,390],  377, "mcq", 377),
    ("hard-high",     "₹5 + ₹10 + ₹20 + ₹100 + ₹500 = ?",               [620,630,635,650],  635, "mcq", 635),
]

SUBTRACTION_QUESTIONS = [
    # easy-basic
    ("easy-basic",    "₹10 − ₹2 = ?",   [6,7,8,9],          8,  "mcq", 8),
    ("easy-basic",    "₹20 − ₹5 = ?",   [10,15,18,20],      15, "mcq", 15),
    ("easy-basic",    "₹20 − ₹10 = ?",  [5,10,15,20],       10, "mcq", 10),
    ("easy-basic",    "₹50 − ₹20 = ?",  [20,25,30,40],      30, "mcq", 30),
    ("easy-basic",    "₹100 − ₹20 = ?", [60,70,80,90],      80, "mcq", 80),
    ("easy-basic",    "₹20 − ₹1 = ?",   [18,19,20,21],      19, "mcq", 19),
    ("easy-basic",    "₹10 − ₹5 = ?",   [3,4,5,6],          5,  "mcq", 5),
    ("easy-basic",    "₹50 − ₹10 = ?",  [30,35,40,45],      40, "mcq", 40),
    ("easy-basic",    "₹20 − ₹2 = ?",   [16,17,18,19],      18, "mcq", 18),
    ("easy-basic",    "₹100 − ₹50 = ?", [40,50,60,70],      50, "mcq", 50),
    # easy-moderate
    ("easy-moderate", "₹20 − ₹5 − ₹5 = ?",    [5,10,15,20],   10, "mcq", 10),
    ("easy-moderate", "₹50 − ₹10 − ₹10 = ?",  [20,30,40,50],  30, "mcq", 30),
    ("easy-moderate", "₹100 − ₹20 − ₹10 = ?", [60,70,80,90],  70, "mcq", 70),
    ("easy-moderate", "₹50 − ₹20 − ₹10 = ?",  [10,20,30,40],  20, "mcq", 20),
    ("easy-moderate", "₹20 − ₹2 − ₹1 = ?",    [16,17,18,19],  17, "mcq", 17),
    ("easy-moderate", "₹100 − ₹50 − ₹20 = ?", [20,30,40,50],  30, "mcq", 30),
    ("easy-moderate", "₹50 − ₹5 − ₹5 = ?",    [30,35,40,45],  40, "mcq", 40),
    ("easy-moderate", "₹20 − ₹5 − ₹2 = ?",    [11,12,13,14],  13, "mcq", 13),
    ("easy-moderate", "₹100 − ₹20 − ₹20 = ?", [40,50,60,70],  60, "mcq", 60),
    ("easy-moderate", "₹50 − ₹10 − ₹5 = ?",   [30,35,40,45],  35, "mcq", 35),
    # easy-high
    ("easy-high",     "₹50 − ₹5 − ₹10 = ?",   [30,35,40,45],  35, "mcq", 35),
    ("easy-high",     "₹100 − ₹20 − ₹10 = ?", [60,70,80,90],  70, "mcq", 70),
    ("easy-high",     "₹20 − ₹2 − ₹5 = ?",    [10,12,13,15],  13, "mcq", 13),
    ("easy-high",     "₹50 − ₹20 − ₹5 = ?",   [20,25,30,35],  25, "mcq", 25),
    ("easy-high",     "₹100 − ₹10 − ₹5 = ?",  [80,85,90,95],  85, "mcq", 85),
    ("easy-high",     "₹20 − ₹10 − ₹2 = ?",   [6,8,10,12],    8,  "mcq", 8),
    ("easy-high",     "₹50 − ₹10 − ₹20 = ?",  [10,20,30,40],  20, "mcq", 20),
    ("easy-high",     "₹100 − ₹50 − ₹10 = ?", [30,40,50,60],  40, "mcq", 40),
    ("easy-high",     "₹20 − ₹5 − ₹1 = ?",    [12,13,14,15],  14, "mcq", 14),
    ("easy-high",     "₹50 − ₹20 − ₹10 = ?",  [10,20,30,40],  20, "mcq", 20),
    # medium-basic
    ("medium-basic",  "₹200 − ₹50 = ?",   [120,150,170,180],  150, "mcq", 150),
    ("medium-basic",  "₹500 − ₹100 = ?",  [300,350,400,450],  400, "mcq", 400),
    ("medium-basic",  "₹200 − ₹100 = ?",  [50,100,150,200],   100, "mcq", 100),
    ("medium-basic",  "₹500 − ₹200 = ?",  [200,250,300,350],  300, "mcq", 300),
    ("medium-basic",  "₹100 − ₹20 = ?",   [60,70,80,90],      80,  "mcq", 80),
    ("medium-basic",  "₹500 − ₹50 = ?",   [400,420,450,470],  450, "mcq", 450),
    ("medium-basic",  "₹200 − ₹20 = ?",   [150,160,180,190],  180, "mcq", 180),
    ("medium-basic",  "₹500 − ₹20 = ?",   [450,470,480,490],  480, "mcq", 480),
    ("medium-basic",  "₹100 − ₹50 = ?",   [30,40,50,60],      50,  "mcq", 50),
    ("medium-basic",  "₹200 − ₹100 = ?",  [50,100,150,200],   100, "mcq", 100),
    # medium-moderate
    ("medium-moderate","₹500 − ₹100 − ₹50 = ?",   [300,350,400,450],  350, "mcq", 350),
    ("medium-moderate","₹200 − ₹50 − ₹20 = ?",    [120,130,140,150],  130, "mcq", 130),
    ("medium-moderate","₹500 − ₹200 − ₹100 = ?",  [150,200,250,300],  200, "mcq", 200),
    ("medium-moderate","₹200 − ₹100 − ₹20 = ?",   [60,80,100,120],    80,  "mcq", 80),
    ("medium-moderate","₹500 − ₹100 − ₹20 = ?",   [350,360,380,400],  380, "mcq", 380),
    ("medium-moderate","₹200 − ₹20 − ₹20 = ?",    [140,150,160,170],  160, "mcq", 160),
    ("medium-moderate","₹500 − ₹200 − ₹50 = ?",   [200,230,250,280],  250, "mcq", 250),
    ("medium-moderate","₹100 − ₹20 − ₹20 = ?",    [40,50,60,70],      60,  "mcq", 60),
    ("medium-moderate","₹200 − ₹100 − ₹50 = ?",   [40,50,60,70],      50,  "mcq", 50),
    ("medium-moderate","₹500 − ₹200 − ₹20 = ?",   [260,270,280,300],  280, "mcq", 280),
    # medium-high
    ("medium-high",   "₹200 − ₹5 − ₹10 = ?",    [170,180,185,190],  185, "mcq", 185),
    ("medium-high",   "₹500 − ₹20 − ₹50 = ?",   [400,420,430,450],  430, "mcq", 430),
    ("medium-high",   "₹100 − ₹2 − ₹5 = ?",     [90,92,93,95],      93,  "mcq", 93),
    ("medium-high",   "₹200 − ₹20 − ₹10 = ?",   [160,170,180,190],  170, "mcq", 170),
    ("medium-high",   "₹500 − ₹100 − ₹20 = ?",  [350,360,380,400],  380, "mcq", 380),
    ("medium-high",   "₹200 − ₹50 − ₹5 = ?",    [130,140,145,150],  145, "mcq", 145),
    ("medium-high",   "₹100 − ₹10 − ₹2 = ?",    [85,86,88,90],      88,  "mcq", 88),
    ("medium-high",   "₹500 − ₹200 − ₹5 = ?",   [280,290,295,300],  295, "mcq", 295),
    ("medium-high",   "₹200 − ₹20 − ₹2 = ?",    [170,175,178,180],  178, "mcq", 178),
    ("medium-high",   "₹500 − ₹50 − ₹10 = ?",   [420,430,440,450],  440, "mcq", 440),
    # hard-basic
    ("hard-basic",    "₹1000 − ₹500 = ?", [400,500,600,700],  500, "mcq", 500),
    ("hard-basic",    "₹1000 − ₹200 = ?", [700,800,900,1000], 800, "mcq", 800),
    ("hard-basic",    "₹500 − ₹200 = ?",  [200,300,400,500],  300, "mcq", 300),
    ("hard-basic",    "₹1000 − ₹100 = ?", [800,850,900,950],  900, "mcq", 900),
    ("hard-basic",    "₹800 − ₹200 = ?",  [500,600,700,800],  600, "mcq", 600),
    ("hard-basic",    "₹900 − ₹500 = ?",  [300,350,400,450],  400, "mcq", 400),
    ("hard-basic",    "₹700 − ₹200 = ?",  [400,500,600,700],  500, "mcq", 500),
    ("hard-basic",    "₹600 − ₹100 = ?",  [400,450,500,550],  500, "mcq", 500),
    ("hard-basic",    "₹1000 − ₹50 = ?",  [900,920,950,980],  950, "mcq", 950),
    ("hard-basic",    "₹900 − ₹100 = ?",  [700,750,800,850],  800, "mcq", 800),
    # hard-moderate
    ("hard-moderate", "₹1000 − ₹200 − ₹100 = ?", [600,650,700,750],  700, "mcq", 700),
    ("hard-moderate", "₹900 − ₹200 − ₹100 = ?",  [500,550,600,650],  600, "mcq", 600),
    ("hard-moderate", "₹800 − ₹200 − ₹50 = ?",   [500,520,550,580],  550, "mcq", 550),
    ("hard-moderate", "₹1000 − ₹500 − ₹100 = ?", [300,350,400,450],  400, "mcq", 400),
    ("hard-moderate", "₹700 − ₹200 − ₹100 = ?",  [300,350,400,450],  400, "mcq", 400),
    ("hard-moderate", "₹900 − ₹500 − ₹200 = ?",  [100,150,200,250],  200, "mcq", 200),
    ("hard-moderate", "₹1000 − ₹200 − ₹50 = ?",  [700,730,750,780],  750, "mcq", 750),
    ("hard-moderate", "₹800 − ₹100 − ₹50 = ?",   [600,620,650,700],  650, "mcq", 650),
    ("hard-moderate", "₹900 − ₹200 − ₹50 = ?",   [600,630,650,680],  650, "mcq", 650),
    ("hard-moderate", "₹1000 − ₹100 − ₹20 = ?",  [850,860,880,900],  880, "mcq", 880),
    # hard-high
    ("hard-high",     "₹1000 − ₹5 − ₹10 − ₹20 = ?",          [950,955,965,975],  965, "mcq", 965),
    ("hard-high",     "₹800 − ₹20 − ₹50 − ₹100 = ?",         [600,620,630,650],  630, "mcq", 630),
    ("hard-high",     "₹900 − ₹200 − ₹5 − ₹10 = ?",          [670,680,685,700],  685, "mcq", 685),
    ("hard-high",     "₹1000 − ₹500 − ₹20 − ₹10 = ?",        [450,460,470,480],  470, "mcq", 470),
    ("hard-high",     "₹850 − ₹200 − ₹20 − ₹5 = ?",          [600,615,625,635],  625, "mcq", 625),
    ("hard-high",     "₹900 − ₹100 − ₹50 − ₹20 = ?",         [700,720,730,750],  730, "mcq", 730),
    ("hard-high",     "₹1000 − ₹200 − ₹10 − ₹5 = ?",         [760,770,785,800],  785, "mcq", 785),
    ("hard-high",     "₹800 − ₹50 − ₹20 − ₹10 = ?",          [700,710,720,740],  720, "mcq", 720),
    ("hard-high",     "₹900 − ₹500 − ₹20 − ₹5 = ?",          [350,360,375,390],  375, "mcq", 375),
    ("hard-high",     "₹1000 − ₹200 − ₹50 − ₹20 = ?",        [700,720,730,750],  730, "mcq", 730),
]

MULTIPLICATION_QUESTIONS = [
    # easy-basic
    ("easy-basic",    "2 × ₹5 = ?",   [5,10,15,20],       10,  "mcq", 10),
    ("easy-basic",    "3 × ₹2 = ?",   [4,5,6,8],          6,   "mcq", 6),
    ("easy-basic",    "2 × ₹10 = ?",  [10,15,20,30],      20,  "mcq", 20),
    ("easy-basic",    "3 × ₹5 = ?",   [10,15,20,25],      15,  "mcq", 15),
    ("easy-basic",    "2 × ₹20 = ?",  [20,30,40,50],      40,  "mcq", 40),
    ("easy-basic",    "3 × ₹10 = ?",  [20,25,30,40],      30,  "mcq", 30),
    ("easy-basic",    "2 × ₹1 = ?",   [1,2,3,4],          2,   "mcq", 2),
    ("easy-basic",    "3 × ₹1 = ?",   [2,3,4,5],          3,   "mcq", 3),
    ("easy-basic",    "2 × ₹50 = ?",  [80,90,100,120],    100, "mcq", 100),
    ("easy-basic",    "3 × ₹20 = ?",  [40,50,60,80],      60,  "mcq", 60),
    # easy-moderate
    ("easy-moderate", "4 × ₹5 = ?",   [10,15,20,25],      20,  "mcq", 20),
    ("easy-moderate", "4 × ₹10 = ?",  [30,40,50,60],      40,  "mcq", 40),
    ("easy-moderate", "3 × ₹20 = ?",  [40,50,60,80],      60,  "mcq", 60),
    ("easy-moderate", "4 × ₹20 = ?",  [60,70,80,90],      80,  "mcq", 80),
    ("easy-moderate", "3 × ₹50 = ?",  [100,120,150,200],  150, "mcq", 150),
    ("easy-moderate", "2 × ₹100 = ?", [150,180,200,250],  200, "mcq", 200),
    ("easy-moderate", "4 × ₹2 = ?",   [6,8,10,12],        8,   "mcq", 8),
    ("easy-moderate", "3 × ₹10 = ?",  [20,30,40,50],      30,  "mcq", 30),
    ("easy-moderate", "2 × ₹200 = ?", [300,350,400,450],  400, "mcq", 400),
    ("easy-moderate", "4 × ₹1 = ?",   [2,3,4,5],          4,   "mcq", 4),
    # easy-high
    ("easy-high",     "5 × ₹10 = ?",  [40,50,60,70],      50,  "mcq", 50),
    ("easy-high",     "5 × ₹5 = ?",   [20,25,30,35],      25,  "mcq", 25),
    ("easy-high",     "4 × ₹50 = ?",  [150,180,200,250],  200, "mcq", 200),
    ("easy-high",     "3 × ₹100 = ?", [200,250,300,350],  300, "mcq", 300),
    ("easy-high",     "5 × ₹2 = ?",   [8,10,12,15],       10,  "mcq", 10),
    ("easy-high",     "4 × ₹20 = ?",  [60,70,80,100],     80,  "mcq", 80),
    ("easy-high",     "5 × ₹20 = ?",  [80,100,120,150],   100, "mcq", 100),
    ("easy-high",     "3 × ₹200 = ?", [400,500,600,700],  600, "mcq", 600),
    ("easy-high",     "4 × ₹10 = ?",  [20,30,40,50],      40,  "mcq", 40),
    ("easy-high",     "5 × ₹1 = ?",   [3,4,5,6],          5,   "mcq", 5),
    # medium-basic
    ("medium-basic",  "6 × ₹10 = ?",  [50,60,70,80],      60,  "mcq", 60),
    ("medium-basic",  "5 × ₹20 = ?",  [80,100,120,150],   100, "mcq", 100),
    ("medium-basic",  "6 × ₹2 = ?",   [10,12,14,16],      12,  "mcq", 12),
    ("medium-basic",  "4 × ₹100 = ?", [300,350,400,450],  400, "mcq", 400),
    ("medium-basic",  "5 × ₹50 = ?",  [200,220,250,300],  250, "mcq", 250),
    ("medium-basic",  "6 × ₹1 = ?",   [4,5,6,7],          6,   "mcq", 6),
    ("medium-basic",  "4 × ₹200 = ?", [600,700,800,900],  800, "mcq", 800),
    ("medium-basic",  "5 × ₹10 = ?",  [40,50,60,70],      50,  "mcq", 50),
    ("medium-basic",  "6 × ₹20 = ?",  [100,110,120,140],  120, "mcq", 120),
    ("medium-basic",  "6 × ₹5 = ?",   [20,25,30,35],      30,  "mcq", 30),
    # medium-moderate
    ("medium-moderate","7 × ₹5 = ?",   [25,30,35,40],      35,  "mcq", 35),
    ("medium-moderate","8 × ₹10 = ?",  [60,70,80,90],      80,  "mcq", 80),
    ("medium-moderate","7 × ₹20 = ?",  [120,130,140,150],  140, "mcq", 140),
    ("medium-moderate","8 × ₹5 = ?",   [30,35,40,45],      40,  "mcq", 40),
    ("medium-moderate","6 × ₹50 = ?",  [250,280,300,350],  300, "mcq", 300),
    ("medium-moderate","7 × ₹2 = ?",   [10,12,14,16],      14,  "mcq", 14),
    ("medium-moderate","8 × ₹20 = ?",  [140,150,160,180],  160, "mcq", 160),
    ("medium-moderate","5 × ₹100 = ?", [400,450,500,550],  500, "mcq", 500),
    ("medium-moderate","6 × ₹100 = ?", [500,550,600,650],  600, "mcq", 600),
    ("medium-moderate","7 × ₹10 = ?",  [60,70,80,90],      70,  "mcq", 70),
    # medium-high
    ("medium-high",   "9 × ₹5 = ?",    [35,40,45,50],       45,   "mcq", 45),
    ("medium-high",   "9 × ₹10 = ?",   [70,80,90,100],      90,   "mcq", 90),
    ("medium-high",   "8 × ₹20 = ?",   [140,150,160,180],   160,  "mcq", 160),
    ("medium-high",   "7 × ₹50 = ?",   [300,320,350,400],   350,  "mcq", 350),
    ("medium-high",   "9 × ₹2 = ?",    [16,18,20,22],       18,   "mcq", 18),
    ("medium-high",   "8 × ₹50 = ?",   [350,380,400,420],   400,  "mcq", 400),
    ("medium-high",   "6 × ₹200 = ?",  [1000,1100,1200,1300],1200,"mcq", 1200),
    ("medium-high",   "9 × ₹1 = ?",    [7,8,9,10],          9,    "mcq", 9),
    ("medium-high",   "8 × ₹100 = ?",  [600,700,800,900],   800,  "mcq", 800),
    ("medium-high",   "7 × ₹20 = ?",   [120,130,140,160],   140,  "mcq", 140),
    # hard-basic
    ("hard-basic",    "10 × ₹5 = ?",   [40,50,60,70],       50,   "mcq", 50),
    ("hard-basic",    "10 × ₹10 = ?",  [80,90,100,120],     100,  "mcq", 100),
    ("hard-basic",    "9 × ₹20 = ?",   [160,170,180,200],   180,  "mcq", 180),
    ("hard-basic",    "8 × ₹50 = ?",   [350,380,400,450],   400,  "mcq", 400),
    ("hard-basic",    "10 × ₹2 = ?",   [10,20,30,40],       20,   "mcq", 20),
    ("hard-basic",    "9 × ₹10 = ?",   [70,80,90,100],      90,   "mcq", 90),
    ("hard-basic",    "8 × ₹100 = ?",  [600,700,800,900],   800,  "mcq", 800),
    ("hard-basic",    "10 × ₹20 = ?",  [150,180,200,220],   200,  "mcq", 200),
    ("hard-basic",    "9 × ₹50 = ?",   [350,400,450,500],   450,  "mcq", 450),
    ("hard-basic",    "8 × ₹200 = ?",  [1400,1500,1600,1700],1600,"mcq", 1600),
    # hard-moderate
    ("hard-moderate", "12 × ₹5 = ?",   [50,55,60,65],       60,  "mcq", 60),
    ("hard-moderate", "11 × ₹10 = ?",  [100,110,120,130],   110, "mcq", 110),
    ("hard-moderate", "12 × ₹2 = ?",   [20,22,24,26],       24,  "mcq", 24),
    ("hard-moderate", "11 × ₹20 = ?",  [200,210,220,230],   220, "mcq", 220),
    ("hard-moderate", "12 × ₹10 = ?",  [100,110,120,130],   120, "mcq", 120),
    ("hard-moderate", "11 × ₹5 = ?",   [45,50,55,60],       55,  "mcq", 55),
    ("hard-moderate", "12 × ₹1 = ?",   [10,11,12,13],       12,  "mcq", 12),
    ("hard-moderate", "11 × ₹50 = ?",  [500,520,550,600],   550, "mcq", 550),
    ("hard-moderate", "12 × ₹20 = ?",  [200,220,240,260],   240, "mcq", 240),
    ("hard-moderate", "11 × ₹2 = ?",   [18,20,22,24],       22,  "mcq", 22),
    # hard-high
    ("hard-high",     "15 × ₹5 = ?",   [60,70,75,80],       75,  "mcq", 75),
    ("hard-high",     "15 × ₹10 = ?",  [120,140,150,160],   150, "mcq", 150),
    ("hard-high",     "14 × ₹2 = ?",   [24,26,28,30],       28,  "mcq", 28),
    ("hard-high",     "15 × ₹20 = ?",  [260,280,300,320],   300, "mcq", 300),
    ("hard-high",     "14 × ₹10 = ?",  [120,130,140,150],   140, "mcq", 140),
    ("hard-high",     "15 × ₹1 = ?",   [12,14,15,18],       15,  "mcq", 15),
    ("hard-high",     "14 × ₹5 = ?",   [60,65,70,75],       70,  "mcq", 70),
    ("hard-high",     "15 × ₹2 = ?",   [25,28,30,32],       30,  "mcq", 30),
    ("hard-high",     "14 × ₹20 = ?",  [240,260,280,300],   280, "mcq", 280),
    ("hard-high",     "15 × ₹5 = ?",   [60,70,75,80],       75,  "mcq", 75),
]

DIVISION_QUESTIONS = [
    # easy-basic
    ("easy-basic",    "₹10 ÷ 2 = ?",    [3,4,5,6],          5,    "mcq", 5),
    ("easy-basic",    "₹20 ÷ 2 = ?",    [8,9,10,12],        10,   "mcq", 10),
    ("easy-basic",    "₹20 ÷ 4 = ?",    [4,5,6,7],          5,    "mcq", 5),
    ("easy-basic",    "₹10 ÷ 5 = ?",    [1,2,3,4],          2,    "mcq", 2),
    ("easy-basic",    "₹50 ÷ 5 = ?",    [5,8,10,12],        10,   "mcq", 10),
    ("easy-basic",    "₹20 ÷ 5 = ?",    [2,3,4,5],          4,    "mcq", 4),
    ("easy-basic",    "₹100 ÷ 10 = ?",  [8,9,10,12],        10,   "mcq", 10),
    ("easy-basic",    "₹50 ÷ 10 = ?",   [3,4,5,6],          5,    "mcq", 5),
    ("easy-basic",    "₹20 ÷ 10 = ?",   [1,2,3,4],          2,    "mcq", 2),
    ("easy-basic",    "₹100 ÷ 5 = ?",   [10,15,20,25],      20,   "mcq", 20),
    # easy-moderate
    ("easy-moderate", "₹100 ÷ 2 = ?",   [40,50,60,70],      50,   "mcq", 50),
    ("easy-moderate", "₹100 ÷ 4 = ?",   [20,25,30,40],      25,   "mcq", 25),
    ("easy-moderate", "₹200 ÷ 2 = ?",   [80,100,120,150],   100,  "mcq", 100),
    ("easy-moderate", "₹200 ÷ 4 = ?",   [40,50,60,80],      50,   "mcq", 50),
    ("easy-moderate", "₹50 ÷ 2 = ?",    [20,25,30,40],      25,   "mcq", 25),
    ("easy-moderate", "₹500 ÷ 5 = ?",   [80,100,120,150],   100,  "mcq", 100),
    ("easy-moderate", "₹100 ÷ 10 = ?",  [8,10,12,15],       10,   "mcq", 10),
    ("easy-moderate", "₹200 ÷ 5 = ?",   [30,40,50,60],      40,   "mcq", 40),
    ("easy-moderate", "₹500 ÷ 10 = ?",  [30,40,50,60],      50,   "mcq", 50),
    ("easy-moderate", "₹50 ÷ 5 = ?",    [5,8,10,12],        10,   "mcq", 10),
    # easy-high
    ("easy-high",     "₹200 ÷ 10 = ?",  [10,15,20,25],      20,   "mcq", 20),
    ("easy-high",     "₹500 ÷ 2 = ?",   [200,225,250,300],  250,  "mcq", 250),
    ("easy-high",     "₹500 ÷ 5 = ?",   [80,100,120,150],   100,  "mcq", 100),
    ("easy-high",     "₹100 ÷ 20 = ?",  [4,5,6,8],          5,    "mcq", 5),
    ("easy-high",     "₹200 ÷ 20 = ?",  [8,10,12,15],       10,   "mcq", 10),
    ("easy-high",     "₹100 ÷ 25 = ?",  [2,3,4,5],          4,    "mcq", 4),
    ("easy-high",     "₹400 ÷ 4 = ?",   [80,90,100,120],    100,  "mcq", 100),
    ("easy-high",     "₹300 ÷ 3 = ?",   [80,90,100,120],    100,  "mcq", 100),
    ("easy-high",     "₹600 ÷ 6 = ?",   [80,90,100,120],    100,  "mcq", 100),
    ("easy-high",     "₹100 ÷ 4 = ?",   [20,25,30,40],      25,   "mcq", 25),
    # medium-basic
    ("medium-basic",  "₹800 ÷ 4 = ?",   [150,180,200,250],  200,  "mcq", 200),
    ("medium-basic",  "₹900 ÷ 3 = ?",   [200,250,300,350],  300,  "mcq", 300),
    ("medium-basic",  "₹600 ÷ 2 = ?",   [200,250,300,350],  300,  "mcq", 300),
    ("medium-basic",  "₹1000 ÷ 5 = ?",  [150,180,200,250],  200,  "mcq", 200),
    ("medium-basic",  "₹1000 ÷ 10 = ?", [80,90,100,120],    100,  "mcq", 100),
    ("medium-basic",  "₹400 ÷ 2 = ?",   [150,180,200,250],  200,  "mcq", 200),
    ("medium-basic",  "₹900 ÷ 9 = ?",   [80,90,100,120],    100,  "mcq", 100),
    ("medium-basic",  "₹700 ÷ 7 = ?",   [80,90,100,120],    100,  "mcq", 100),
    ("medium-basic",  "₹600 ÷ 3 = ?",   [150,180,200,220],  200,  "mcq", 200),
    ("medium-basic",  "₹500 ÷ 5 = ?",   [80,90,100,120],    100,  "mcq", 100),
    # medium-moderate
    ("medium-moderate","₹1200 ÷ 6 = ?",  [150,180,200,220],  200,  "mcq", 200),
    ("medium-moderate","₹1500 ÷ 5 = ?",  [250,280,300,350],  300,  "mcq", 300),
    ("medium-moderate","₹2000 ÷ 4 = ?",  [400,450,500,550],  500,  "mcq", 500),
    ("medium-moderate","₹1800 ÷ 6 = ?",  [250,280,300,320],  300,  "mcq", 300),
    ("medium-moderate","₹1600 ÷ 8 = ?",  [150,180,200,220],  200,  "mcq", 200),
    ("medium-moderate","₹1400 ÷ 7 = ?",  [150,180,200,220],  200,  "mcq", 200),
    ("medium-moderate","₹900 ÷ 3 = ?",   [250,280,300,320],  300,  "mcq", 300),
    ("medium-moderate","₹1000 ÷ 4 = ?",  [200,220,250,280],  250,  "mcq", 250),
    ("medium-moderate","₹1500 ÷ 3 = ?",  [400,450,500,550],  500,  "mcq", 500),
    ("medium-moderate","₹2000 ÷ 5 = ?",  [350,380,400,450],  400,  "mcq", 400),
    # medium-high
    ("medium-high",   "₹2400 ÷ 6 = ?",   [300,350,400,450],  400,  "mcq", 400),
    ("medium-high",   "₹3000 ÷ 5 = ?",   [500,550,600,650],  600,  "mcq", 600),
    ("medium-high",   "₹1800 ÷ 9 = ?",   [150,180,200,220],  200,  "mcq", 200),
    ("medium-high",   "₹2100 ÷ 7 = ?",   [250,280,300,320],  300,  "mcq", 300),
    ("medium-high",   "₹3200 ÷ 8 = ?",   [350,380,400,420],  400,  "mcq", 400),
    ("medium-high",   "₹2500 ÷ 5 = ?",   [450,480,500,520],  500,  "mcq", 500),
    ("medium-high",   "₹2700 ÷ 9 = ?",   [250,280,300,320],  300,  "mcq", 300),
    ("medium-high",   "₹4000 ÷ 10 = ?",  [300,350,400,450],  400,  "mcq", 400),
    ("medium-high",   "₹3600 ÷ 6 = ?",   [500,550,600,650],  600,  "mcq", 600),
    ("medium-high",   "₹4200 ÷ 7 = ?",   [500,550,600,650],  600,  "mcq", 600),
    # hard-basic
    ("hard-basic",    "₹5000 ÷ 5 = ?",   [800,900,1000,1200],  1000, "mcq", 1000),
    ("hard-basic",    "₹8000 ÷ 8 = ?",   [800,900,1000,1200],  1000, "mcq", 1000),
    ("hard-basic",    "₹6000 ÷ 6 = ?",   [800,900,1000,1200],  1000, "mcq", 1000),
    ("hard-basic",    "₹9000 ÷ 9 = ?",   [800,900,1000,1200],  1000, "mcq", 1000),
    ("hard-basic",    "₹7000 ÷ 7 = ?",   [800,900,1000,1200],  1000, "mcq", 1000),
    ("hard-basic",    "₹4000 ÷ 4 = ?",   [800,900,1000,1200],  1000, "mcq", 1000),
    ("hard-basic",    "₹3000 ÷ 3 = ?",   [800,900,1000,1200],  1000, "mcq", 1000),
    ("hard-basic",    "₹10000 ÷ 10 = ?", [800,900,1000,1200],  1000, "mcq", 1000),
    ("hard-basic",    "₹2000 ÷ 2 = ?",   [800,900,1000,1200],  1000, "mcq", 1000),
    ("hard-basic",    "₹1000 ÷ 1 = ?",   [800,900,1000,1200],  1000, "mcq", 1000),
    # hard-moderate
    ("hard-moderate", "₹3600 ÷ 12 = ?",  [200,250,300,350],  300,  "mcq", 300),
    ("hard-moderate", "₹2400 ÷ 12 = ?",  [150,180,200,220],  200,  "mcq", 200),
    ("hard-moderate", "₹4800 ÷ 12 = ?",  [300,350,400,450],  400,  "mcq", 400),
    ("hard-moderate", "₹6000 ÷ 15 = ?",  [300,350,400,450],  400,  "mcq", 400),
    ("hard-moderate", "₹7500 ÷ 15 = ?",  [400,450,500,550],  500,  "mcq", 500),
    ("hard-moderate", "₹5400 ÷ 9 = ?",   [500,550,600,650],  600,  "mcq", 600),
    ("hard-moderate", "₹6300 ÷ 9 = ?",   [600,650,700,750],  700,  "mcq", 700),
    ("hard-moderate", "₹7200 ÷ 8 = ?",   [800,850,900,950],  900,  "mcq", 900),
    ("hard-moderate", "₹8400 ÷ 12 = ?",  [600,650,700,750],  700,  "mcq", 700),
    ("hard-moderate", "₹9600 ÷ 12 = ?",  [700,750,800,850],  800,  "mcq", 800),
    # hard-high
    ("hard-high",     "₹15000 ÷ 15 = ?", [800,900,1000,1200],    1000, "mcq", 1000),
    ("hard-high",     "₹18000 ÷ 9 = ?",  [1500,1800,2000,2200],  2000, "mcq", 2000),
    ("hard-high",     "₹20000 ÷ 20 = ?", [800,900,1000,1200],    1000, "mcq", 1000),
    ("hard-high",     "₹24000 ÷ 12 = ?", [1500,1800,2000,2200],  2000, "mcq", 2000),
    ("hard-high",     "₹30000 ÷ 15 = ?", [1500,1800,2000,2200],  2000, "mcq", 2000),
    ("hard-high",     "₹27000 ÷ 9 = ?",  [2500,2800,3000,3200],  3000, "mcq", 3000),
    ("hard-high",     "₹32000 ÷ 8 = ?",  [3500,3800,4000,4200],  4000, "mcq", 4000),
    ("hard-high",     "₹40000 ÷ 10 = ?", [3500,3800,4000,4200],  4000, "mcq", 4000),
    ("hard-high",     "₹36000 ÷ 12 = ?", [2500,2800,3000,3200],  3000, "mcq", 3000),
    ("hard-high",     "₹42000 ÷ 7 = ?",  [5000,5500,6000,6500],  6000, "mcq", 6000),
]


# In WORD_PROBLEM_QUESTIONS, add the expected_answer as the 4th element:
WORD_PROBLEM_QUESTIONS = [
    # (difficulty, question_text, item_name, expected_answer)
    ("easy-basic",    "Buy 1 apple. Price ₹5. How much do you pay?",            "apple",     5),
    ("easy-basic",    "Buy 1 banana. Price ₹5. How much do you pay?",           "banana",    5),
    ("easy-basic",    "Buy 1 cookie. Price ₹10. How much do you pay?",          "cookies",   10),
    ("easy-basic",    "Buy 1 pencil. Price ₹2. How much do you pay?",           "pencil",    2),
    ("easy-basic",    "Buy 1 balloon. Price ₹10. How much do you pay?",         "balloon",   10),
    ("easy-basic",    "Buy 1 chocolate. Price ₹5. How much do you pay?",        "chocolate", 5),
    ("easy-basic",    "Buy 1 cupcake. Price ₹20. How much do you pay?",         "cupcake",   20),
    ("easy-basic",    "Buy 1 lollipop. Price ₹2. How much do you pay?",         None,        2),
    ("easy-basic",    "Buy 1 orange. Price ₹10. How much do you pay?",          None,        10),
    # easy-moderate
    ("easy-moderate", "Buy 2 chocolates. Price ₹5 each. How much do you pay?",  "chocolate", 10),
    ("easy-moderate", "Buy 2 balloons. Price ₹10 each. How much do you pay?",   "balloon",   20),
    ("easy-moderate", "Buy 3 apples. Price ₹5 each. How much do you pay?",      "apple",     15),
    ("easy-moderate", "Buy 4 pencils. Price ₹2 each. How much do you pay?",     "pencil",    8),
    ("easy-moderate", "Buy 2 cookies. Price ₹10 each. How much do you pay?",    "cookies",   20),
    ("easy-moderate", "Buy 3 bananas. Price ₹5 each. How much do you pay?",     "banana",    15),
    ("easy-moderate", "Buy 2 cupcakes. Price ₹20 each. How much do you pay?",   "cupcake",   40),
    ("easy-moderate", "Buy 5 lollipops. Price ₹2 each. How much do you pay?",   None,        10),
    ("easy-moderate", "Buy 4 erasers. Price ₹5 each. How much do you pay?",     None,        20),
    ("easy-moderate", "Buy 3 balloons. Price ₹10 each. How much do you pay?",   "balloon",   30),
    # easy-high
    ("easy-high",     "Buy 1 toy car. Price ₹50. How much do you pay?",         "toy car",   50),
    ("easy-high",     "Buy 2 books. Price ₹50 each. How much do you pay?",      "book",      100),
    ("easy-high",     "Buy 3 ice-creams. Price ₹20 each. How much do you pay?", "ice cream", 60),
    ("easy-high",     "Buy 4 cookies. Price ₹20 each. How much do you pay?",    "cookies",   80),
    ("easy-high",     "Buy 2 toy cars. Price ₹50 each. How much do you pay?",   "toy car",   100),
    ("easy-high",     "Buy 5 pencils. Price ₹10 each. How much do you pay?",    "pencil",    50),
    ("easy-high",     "Buy 3 cupcakes. Price ₹20 each. How much do you pay?",   "cupcake",   60),
    ("easy-high",     "Buy 1 story book. Price ₹100. How much do you pay?",     "book",      100),
    ("easy-high",     "Buy 2 toy balls. Price ₹20 each. How much do you pay?",  None,        40),
    ("easy-high",     "Buy 4 chocolates. Price ₹20 each. How much do you pay?", "chocolate", 80),
    # medium-basic
    ("medium-basic",  "Buy 1 toy. Price ₹200. How much do you pay?",            None,        200),
    ("medium-basic",  "Buy 1 school bag. Price ₹300. How much do you pay?",     None,        300),
    ("medium-basic",  "Buy 2 notebooks. Price ₹50 each. How much do you pay?",  None,        100),
    ("medium-basic",  "Buy 1 water bottle. Price ₹150. How much do you pay?",   None,        150),
    ("medium-basic",  "Buy 1 lunch box. Price ₹200. How much do you pay?",      None,        200),
    ("medium-basic",  "Buy 1 toy car. Price ₹100. How much do you pay?",        "toy car",   100),
    ("medium-basic",  "Buy 3 pencils. Price ₹10 each. How much do you pay?",    "pencil",    30),
    ("medium-basic",  "Buy 2 toy balls. Price ₹80 each. How much do you pay?",  None,        160),
    ("medium-basic",  "Buy 1 t-shirt. Price ₹250. How much do you pay?",        None,        250),
    ("medium-basic",  "Buy 2 books. Price ₹50 each. How much do you pay?",      "book",      100),
    # medium-moderate
    ("medium-moderate","Buy 4 balloons. Price ₹10 each. How much do you pay?",  "balloon",   40),
    ("medium-moderate","Buy 2 toy cars. Price ₹100 each. How much do you pay?", "toy car",   200),
    ("medium-moderate","Buy 5 chocolates. Price ₹10 each. How much do you pay?","chocolate", 50),
    ("medium-moderate","Buy 3 books. Price ₹100 each. How much do you pay?",    "book",      300),
    ("medium-moderate","Buy 4 cupcakes. Price ₹20 each. How much do you pay?",  "cupcake",   80),
    ("medium-moderate","Buy 2 toys. Price ₹200 each. How much do you pay?",     None,        400),
    ("medium-moderate","Buy 3 ice-creams. Price ₹50 each. How much do you pay?","ice cream", 150),
    ("medium-moderate","Buy 4 notebooks. Price ₹50 each. How much do you pay?", None,        200),
    ("medium-moderate","Buy 5 pencils. Price ₹10 each. How much do you pay?",   "pencil",    50),
    ("medium-moderate","Buy 3 toy cars. Price ₹100 each. How much do you pay?", "toy car",   300),
    # medium-high
    ("medium-high",   "Buy 5 books. Price ₹100 each. How much do you pay?",     "book",      500),
    ("medium-high",   "Buy 4 toys. Price ₹200 each. How much do you pay?",      None,        800),
    ("medium-high",   "Buy 6 toy cars. Price ₹100 each. How much do you pay?",  "toy car",   600),
    ("medium-high",   "Buy 8 cupcakes. Price ₹50 each. How much do you pay?",   "cupcake",   400),
    ("medium-high",   "Buy 7 ice-creams. Price ₹50 each. How much do you pay?", "ice cream", 350),
    ("medium-high",   "Buy 10 pencils. Price ₹10 each. How much do you pay?",   "pencil",    100),
    ("medium-high",   "Buy 6 books. Price ₹50 each. How much do you pay?",      "book",      300),
    ("medium-high",   "Buy 5 toys. Price ₹100 each. How much do you pay?",      None,        500),
    ("medium-high",   "Buy 9 balloons. Price ₹20 each. How much do you pay?",   "balloon",   180),
    ("medium-high",   "Buy 4 school bags. Price ₹300 each. How much do you pay?",None,       1200),
    # hard-basic
    ("hard-basic",    "Buy 1 toy. Price ₹500. How much do you pay?",            None,        500),
    ("hard-basic",    "Buy 1 cricket bat. Price ₹800. How much do you pay?",    None,        800),
    ("hard-basic",    "Buy 2 books. Price ₹200 each. How much do you pay?",     "book",      400),
    ("hard-basic",    "Buy 3 toy cars. Price ₹100 each. How much do you pay?",  "toy car",   300),
    ("hard-basic",    "Buy 1 headphones. Price ₹1000. How much do you pay?",    None,        1000),
    ("hard-basic",    "Buy 1 board game. Price ₹700. How much do you pay?",     None,        700),
    ("hard-basic",    "Buy 2 toys. Price ₹300 each. How much do you pay?",      None,        600),
    ("hard-basic",    "Buy 1 shoe. Price ₹900. How much do you pay?",           None,        900),
    ("hard-basic",    "Buy 2 cricket balls. Price ₹250 each. How much do you pay?",None,     500),
    ("hard-basic",    "Buy 1 jacket. Price ₹1200. How much do you pay?",        None,        1200),
    # hard-moderate
    ("hard-moderate", "Buy 4 books. Price ₹100 each. How much do you pay?",     "book",      400),
    ("hard-moderate", "Buy 5 ice-creams. Price ₹50 each. How much do you pay?", "ice cream", 250),
    ("hard-moderate", "Buy 3 toys. Price ₹200 each. How much do you pay?",      None,        600),
    ("hard-moderate", "Buy 6 notebooks. Price ₹80 each. How much do you pay?",  None,        480),
    ("hard-moderate", "Buy 4 school bags. Price ₹300 each. How much do you pay?",None,       1200),
    ("hard-moderate", "Buy 5 toy cars. Price ₹150 each. How much do you pay?",  "toy car",   750),
    ("hard-moderate", "Buy 3 board games. Price ₹700 each. How much do you pay?",None,       2100),
    ("hard-moderate", "Buy 4 jackets. Price ₹1200 each. How much do you pay?",  None,        4800),
    ("hard-moderate", "Buy 6 shoes. Price ₹900 each. How much do you pay?",     None,        5400),
    ("hard-moderate", "Buy 5 headphones. Price ₹1000 each. How much do you pay?",None,       5000),
    # hard-high
    ("hard-high",     "Buy 5 books. Price ₹200 each. How much do you pay?",     "book",      1000),
    ("hard-high",     "Buy 6 toy cars. Price ₹100 each. How much do you pay?",  "toy car",   600),
    ("hard-high",     "Buy 10 pencils. Price ₹10 each. How much do you pay?",   "pencil",    100),
    ("hard-high",     "Buy 8 notebooks. Price ₹80 each. How much do you pay?",  None,        640),
    ("hard-high",     "Buy 7 toys. Price ₹200 each. How much do you pay?",      None,        1400),
    ("hard-high",     "Buy 12 balloons. Price ₹50 each. How much do you pay?",  "balloon",   600),
    ("hard-high",     "Buy 9 ice-creams. Price ₹50 each. How much do you pay?", "ice cream", 450),
    ("hard-high",     "Buy 6 school bags. Price ₹300 each. How much do you pay?",None,       1800),
    ("hard-high",     "Buy 5 board games. Price ₹700 each. How much do you pay?",None,       3500),
    ("hard-high",     "Buy 4 headphones. Price ₹1000 each. How much do you pay?",None,       4000),
]


# ── Main seeding function ─────────────────────────────────────────────────────

def seed_questions():
    questions_col = get_questions_collection()
    modules_col   = get_modules_collection()
    items_col     = get_items_collection()
    currency_col  = get_currency_collection()

    # Guard: skip if already seeded
    if questions_col.count_documents({}) > 0:
        print("⚠️  Questions already seeded. Skipping.")
        return

    # Resolve module ObjectIds
    addition_id        = get_module_id(modules_col, "addition")
    subtraction_id     = get_module_id(modules_col, "subtraction")
    multiplication_id  = get_module_id(modules_col, "multiplication")
    division_id        = get_module_id(modules_col, "division")
    wordproblems_id    = get_module_id(modules_col, "wordproblems")

    now  = datetime.utcnow()
    docs = []

    # ── MCQ helpers ───────────────────────────────────────────────────────────
    def build_mcq(module_id, difficulty, question_text, options, correct_answer, expected_answer):
        currencies = extract_currencies_from_mcq(question_text)
        currency_ids = []
        for value, ctype in currencies:
            cid = get_currency_id(currency_col, value, ctype)
            if cid:
                currency_ids.append(cid)
        return {
            "module_id":       module_id,
            "difficulty":      difficulty,
            "question_text":   question_text,
            "options":         options,
            "correct_answer":  correct_answer,
            "problem_type":    "mcq",
            "expected_answer": expected_answer,
            "created_at":      now,
            "updated_at":      now,
            "item_id":         None,
            "currency_ids":    currency_ids if currency_ids else None,  # Array or null
        }

    def build_word_problem(module_id, difficulty, question_text, item_name, expected_answer):
        item_id = get_item_id(items_col, item_name) if item_name else None
        return {
            "module_id":       module_id,
            "difficulty":      difficulty,
            "question_text":   question_text,
            "options":         None,
            "correct_answer":  None,
            "problem_type":    "drag-drop",       # ✅ updated
            "expected_answer": expected_answer,   # ✅ actual numeric answer
            "created_at":      now,
            "updated_at":      now,
            "item_id":         item_id,
            "currency_id":     None,
        }

    # ── Build Addition MCQ docs ───────────────────────────────────────────────
    for (diff, qtext, opts, ans, ptype, exp) in ADDITION_QUESTIONS:
        docs.append(build_mcq(addition_id, diff, qtext, opts, ans, exp))

    # ── Build Subtraction MCQ docs ────────────────────────────────────────────
    for (diff, qtext, opts, ans, ptype, exp) in SUBTRACTION_QUESTIONS:
        docs.append(build_mcq(subtraction_id, diff, qtext, opts, ans, exp))

    # ── Build Multiplication MCQ docs ─────────────────────────────────────────
    for (diff, qtext, opts, ans, ptype, exp) in MULTIPLICATION_QUESTIONS:
        docs.append(build_mcq(multiplication_id, diff, qtext, opts, ans, exp))

    # ── Build Division MCQ docs ───────────────────────────────────────────────
    for (diff, qtext, opts, ans, ptype, exp) in DIVISION_QUESTIONS:
        docs.append(build_mcq(division_id, diff, qtext, opts, ans, exp))

    # ── Build Word Problem docs ───────────────────────────────────────────────
    for (diff, qtext, item_name, expected_answer) in WORD_PROBLEM_QUESTIONS:
        docs.append(build_word_problem(wordproblems_id, diff, qtext, item_name, expected_answer))

    # ── Insert all at once ────────────────────────────────────────────────────
    result = questions_col.insert_many(docs)

    # ── Summary ───────────────────────────────────────────────────────────────
    mcq_count = sum(1 for d in docs if d["problem_type"] == "mcq")
    wp_count  = sum(1 for d in docs if d["problem_type"] == "word_problem")

    print(f"\n🎉 Questions seeded successfully!")
    print(f"   Total inserted : {len(result.inserted_ids)}")
    print(f"   MCQ            : {mcq_count}")
    print(f"     • Addition       : {sum(1 for d in docs if d['module_id']==addition_id)}")
    print(f"     • Subtraction    : {sum(1 for d in docs if d['module_id']==subtraction_id)}")
    print(f"     • Multiplication : {sum(1 for d in docs if d['module_id']==multiplication_id)}")
    print(f"     • Division       : {sum(1 for d in docs if d['module_id']==division_id)}")
    print(f"   Word Problems  : {wp_count}")
    print(f"\nSchema per document type:")
    print(f"   MCQ          → item_id=null, currency_id=<ObjectId|null>")
    print(f"   Word Problem → currency_id=null, options=null, correct_answer=null, expected_answer=null, item_id=<ObjectId|null>")