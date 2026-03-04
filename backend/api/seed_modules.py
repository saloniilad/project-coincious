"""
seed_modules.py
===============
Run this ONCE to insert the 5 modules into MongoDB.

Matches your Module Table schema exactly:
  i.   module_id                → ObjectId (Primary Key, auto by MongoDB as _id)
  ii.  module_name              → String
  iii. unlock_required_module_id → ObjectId (Foreign Key → self, None for addition)
  iv.  required_stars           → Number
  v.   created_at               → Date
  vi.  updated_at               → Date

Usage:
    python manage.py shell
    >>> from api.seed_modules import seed_modules
    >>> seed_modules()
"""

from datetime import datetime
from api.db import get_modules_collection


def seed_modules():
    col = get_modules_collection()

    # ── Check if already seeded ───────────────────────────────────────────────
    if col.count_documents({}) >= 5:
        print("⚠️  Modules already seeded. Skipping.")
        return

    # ── Step 1: Insert Addition (no prerequisite) ─────────────────────────────
    addition_result = col.insert_one({
        "module_name":               "addition",
        "unlock_required_module_id": None,   # No prerequisite — always unlocked
        "required_stars":            0,       # 0 stars needed to access
        "created_at":                datetime.utcnow(),
        "updated_at":                datetime.utcnow(),
    })
    addition_id = addition_result.inserted_id
    print(f"✅ addition       inserted → _id: {addition_id}")

    # ── Step 2: Insert Subtraction (requires addition) ────────────────────────
    subtraction_result = col.insert_one({
        "module_name":               "subtraction",
        "unlock_required_module_id": addition_id,  # FK → addition
        "required_stars":            10,
        "created_at":                datetime.utcnow(),
        "updated_at":                datetime.utcnow(),
    })
    subtraction_id = subtraction_result.inserted_id
    print(f"✅ subtraction    inserted → _id: {subtraction_id}")

    # ── Step 3: Insert Multiplication (requires subtraction) ──────────────────
    multiplication_result = col.insert_one({
        "module_name":               "multiplication",
        "unlock_required_module_id": subtraction_id,  # FK → subtraction
        "required_stars":            150,
        "created_at":                datetime.utcnow(),
        "updated_at":                datetime.utcnow(),
    })
    multiplication_id = multiplication_result.inserted_id
    print(f"✅ multiplication inserted → _id: {multiplication_id}")

    # ── Step 4: Insert Division (requires multiplication) ─────────────────────
    division_result = col.insert_one({
        "module_name":               "division",
        "unlock_required_module_id": multiplication_id,  # FK → multiplication
        "required_stars":            150,
        "created_at":                datetime.utcnow(),
        "updated_at":                datetime.utcnow(),
    })
    division_id = division_result.inserted_id
    print(f"✅ division       inserted → _id: {division_id}")

    # ── Step 5: Insert Word Problems (requires division) ──────────────────────
    col.insert_one({
        "module_name":               "wordproblems",
        "unlock_required_module_id": division_id,  # FK → division
        "required_stars":            150,
        "created_at":                datetime.utcnow(),
        "updated_at":                datetime.utcnow(),
    })
    print(f"✅ wordproblems   inserted")

    print("\n🎉 All 5 modules seeded successfully!")
    print("\nYour modules collection now looks like:")
    print("─" * 60)
    for doc in col.find({}):
        print(f"  module_name: {doc['module_name']}")
        print(f"  _id (module_id): {doc['_id']}")
        print(f"  unlock_required_module_id: {doc['unlock_required_module_id']}")
        print(f"  required_stars: {doc['required_stars']}")
        print(f"  created_at: {doc['created_at']}")
        print(f"  updated_at: {doc['updated_at']}")
        print("─" * 60)