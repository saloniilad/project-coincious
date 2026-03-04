"""
seed_items.py
=============
Run this ONCE to insert all items into MongoDB.

Usage:
    python manage.py shell
    >>> from api.seed_items import seed_items
    >>> seed_items()
"""

from datetime import datetime
from api.db import get_items_collection

BASE_URL = "/static/Items"

ITEMS = [
    {"name": "Apple",     "image_url": f"{BASE_URL}/apple.png",     "category": "food"},
    {"name": "Balloon",   "image_url": f"{BASE_URL}/ballon.png",    "category": "toy"},
    {"name": "Banana",    "image_url": f"{BASE_URL}/banana.png",    "category": "food"},
    {"name": "Book",      "image_url": f"{BASE_URL}/book.png",      "category": "stationery"},
    {"name": "Chocolate", "image_url": f"{BASE_URL}/chocolate.png", "category": "food"},
    {"name": "Cookies",   "image_url": f"{BASE_URL}/cookies.png",   "category": "food"},
    {"name": "Cupcake",   "image_url": f"{BASE_URL}/cupcake.png",   "category": "food"},
    {"name": "Ice Cream", "image_url": f"{BASE_URL}/icecream.png",  "category": "food"},
    {"name": "Pencil",    "image_url": f"{BASE_URL}/pencil.png",    "category": "stationery"},
    {"name": "Toy Car",   "image_url": f"{BASE_URL}/toycar.png",    "category": "toy"},
]

def seed_items():
    col = get_items_collection()

    if col.count_documents({}) >= len(ITEMS):
        print("⚠️  Items already seeded. Skipping.")
        return

    now = datetime.utcnow()

    for item in ITEMS:
        col.update_one(
            {"name": item["name"]},
            {
                "$set": {
                    "name":       item["name"],
                    "image_url":  item["image_url"],
                    "category":   item["category"],
                    "updated_at": now,
                },
                "$setOnInsert": {
                    "created_at": now,
                }
            },
            upsert=True
        )
        print(f"✔ Seeded {item['name']}")

    print("🎉 Items seeding completed successfully!")