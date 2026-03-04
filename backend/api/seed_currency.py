import os
from django.conf import settings
from api.db import get_currency_collection
from datetime import datetime

BASE_PATH = os.path.join(settings.BASE_DIR, "static", "currency-images")

def seed_currency():
    currency_collection = get_currency_collection()

    for currency_type in ["Coins", "Notes"]:
        type_lower = "coin" if currency_type == "Coins" else "note"
        type_path = os.path.join(BASE_PATH, currency_type)

        for value in os.listdir(type_path):
            value_path = os.path.join(type_path, value)
            if not os.path.isdir(value_path):
                continue

            versions = []

            for version in os.listdir(value_path):
                version_path = os.path.join(value_path, version)
                if not os.path.isdir(version_path):
                    continue

                front_image = None
                back_image = None

                for file in os.listdir(version_path):
                    file_url = f"/static/currency-images/{currency_type}/{value}/{version}/{file}"
                    if "front" in file.lower():
                        front_image = file_url
                    elif "back" in file.lower():
                        back_image = file_url

                if front_image and back_image:
                    versions.append({
                        "version_id": version,
                        "front_image": front_image,
                        "back_image": back_image
                    })

            now = datetime.utcnow()

            currency_collection.update_one(
                {"value": int(value), "type": type_lower},
                {
                    "$set": {
                        "value":      int(value),
                        "type":       type_lower,
                        "versions":   versions,
                        "updated_at": now,
                    },
                    "$setOnInsert": {
                        "created_at": now,
                    }
                },
                upsert=True
            )

            print(f"✔ Seeded {value} {type_lower}")

    # Patch existing docs missing created_at — safe to remove after first run
    # Patch existing docs missing created_at and updated_at
    currency_collection.update_many(
        {"created_at": {"$exists": False}},
        {"$set": {
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }}
    )

    print("🎉 Currency seeding completed successfully")