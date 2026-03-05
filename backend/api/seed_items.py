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
    {"name": "Apple",        "image_url": f"{BASE_URL}/apple.png",        "category": "food"},
    {"name": "Balloon",      "image_url": f"{BASE_URL}/ballon.png",       "category": "toy"},
    {"name": "Banana",       "image_url": f"{BASE_URL}/banana.png",       "category": "food"},
    {"name": "Board Game",   "image_url": f"{BASE_URL}/boardgame.png",    "category": "toy"},
    {"name": "Book",         "image_url": f"{BASE_URL}/book.png",         "category": "stationery"},
    {"name": "Chocolate",    "image_url": f"{BASE_URL}/chocolate.png",    "category": "food"},
    {"name": "Cookies",      "image_url": f"{BASE_URL}/cookies.png",      "category": "food"},
    {"name": "Cricket Ball", "image_url": f"{BASE_URL}/cricketball.png",  "category": "toy"},
    {"name": "Cricket Bat",  "image_url": f"{BASE_URL}/cricketbat.png",   "category": "toy"},
    {"name": "Cupcake",      "image_url": f"{BASE_URL}/cupcake.png",      "category": "food"},
    {"name": "Eraser",       "image_url": f"{BASE_URL}/eraser.png",       "category": "stationery"},
    {"name": "Headphone",    "image_url": f"{BASE_URL}/headphone.png",    "category": "electronics"},
    {"name": "Ice Cream",    "image_url": f"{BASE_URL}/icecream.png",     "category": "food"},
    {"name": "Jacket",       "image_url": f"{BASE_URL}/jacket.png",       "category": "clothing"},
    {"name": "Lollipop",     "image_url": f"{BASE_URL}/lollipop.png",     "category": "food"},
    {"name": "Lunch Box",    "image_url": f"{BASE_URL}/lunchbox.png",     "category": "stationery"},
    {"name": "Notebook",     "image_url": f"{BASE_URL}/notebook.png",     "category": "stationery"},
    {"name": "Orange",       "image_url": f"{BASE_URL}/orange.png",       "category": "food"},
    {"name": "Pencil",       "image_url": f"{BASE_URL}/pencil.png",       "category": "stationery"},
    {"name": "School Bag",   "image_url": f"{BASE_URL}/schoolbag.png",    "category": "stationery"},
    {"name": "Shoe",         "image_url": f"{BASE_URL}/shoe.png",         "category": "clothing"},
    {"name": "Story Book",   "image_url": f"{BASE_URL}/storybook.png",    "category": "stationery"},
    {"name": "Toy",          "image_url": f"{BASE_URL}/toy.png",          "category": "toy"},
    {"name": "Toy Ball",     "image_url": f"{BASE_URL}/toyball.png",      "category": "toy"},
    {"name": "Toy Car",      "image_url": f"{BASE_URL}/toycar.png",       "category": "toy"},
    {"name": "T-Shirt",      "image_url": f"{BASE_URL}/tshirt.png",       "category": "clothing"},
    {"name": "Water Bottle", "image_url": f"{BASE_URL}/waterbottle.png",  "category": "stationery"},
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