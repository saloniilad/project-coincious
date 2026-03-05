"""
currency_views.py
=================
GET /api/currencies/?ids=id1,id2,...   → fetch currencies by ObjectIds
GET /api/items/?ids=id1,id2,...        → fetch items by ObjectIds
"""

from bson import ObjectId
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .db import get_currency_collection, get_items_collection


# ── Helpers ────────────────────────────────────────────────────────────────────

def _serialize_currency(doc):
    """
    Currency schema:
      { type, value, versions: [{ version_id, front_image, back_image }] }
    We always use versions[0] (the only / latest version).
    front_image example: "/static/currency-images/Coins/1/v1/front.png"
    """
    if not doc:
        return None

    versions = doc.get("versions") or []
    latest   = versions[0] if versions else {}

    return {
        "_id":         str(doc["_id"]),
        "value":       doc.get("value"),
        "type":        doc.get("type"),               # "coin" | "note"
        "front_image": latest.get("front_image", ""), # "/static/currency-images/..."
        "back_image":  latest.get("back_image", ""),
    }


def _serialize_item(doc):
    """
    Item schema:
      { name, category, image_url }
    image_url example: "/static/Items/apple.png"
    """
    if not doc:
        return None
    return {
        "_id":       str(doc["_id"]),
        "name":      doc.get("name", ""),
        "category":  doc.get("category", ""),
        "image_url": doc.get("image_url", ""),        # "/static/Items/apple.png"
    }


def _parse_object_ids(raw: str) -> list:
    """Parse comma-separated ObjectId strings, silently skip invalid ones."""
    result = []
    for part in raw.split(","):
        part = part.strip()
        if part:
            try:
                result.append(ObjectId(part))
            except Exception:
                pass
    return result


# ── Views ──────────────────────────────────────────────────────────────────────

@api_view(["GET"])
def get_currencies_by_ids(request):
    """
    GET /api/currencies/?ids=id1,id2,id3

    Returns currency docs deduplicated and in the same order as requested ids.
    The frontend uses this for the available-money tray in WordProblemGame.
    """
    ids_raw = request.query_params.get("ids", "").strip()
    if not ids_raw:
        return Response(
            {"error": "ids query param is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    object_ids = _parse_object_ids(ids_raw)
    if not object_ids:
        return Response({"currencies": []}, status=status.HTTP_200_OK)

    currency_col = get_currency_collection()
    docs         = list(currency_col.find({"_id": {"$in": object_ids}}))
    doc_map      = {str(doc["_id"]): doc for doc in docs}

    ordered  = []
    seen_ids = set()
    for raw_id in ids_raw.split(","):
        raw_id = raw_id.strip()
        if raw_id in doc_map and raw_id not in seen_ids:
            ordered.append(_serialize_currency(doc_map[raw_id]))
            seen_ids.add(raw_id)

    return Response({"currencies": ordered}, status=status.HTTP_200_OK)


@api_view(["GET"])
def get_items_by_ids(request):
    """
    GET /api/items/?ids=id1,id2,id3

    Returns item docs. Used by WordProblemGame to show the shopping item image.
    """
    ids_raw = request.query_params.get("ids", "").strip()
    if not ids_raw:
        return Response(
            {"error": "ids query param is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    object_ids = _parse_object_ids(ids_raw)
    if not object_ids:
        return Response({"items": []}, status=status.HTTP_200_OK)

    items_col = get_items_collection()
    docs      = list(items_col.find({"_id": {"$in": object_ids}}))
    doc_map   = {str(doc["_id"]): doc for doc in docs}

    ordered  = []
    seen_ids = set()
    for raw_id in ids_raw.split(","):
        raw_id = raw_id.strip()
        if raw_id in doc_map and raw_id not in seen_ids:
            ordered.append(_serialize_item(doc_map[raw_id]))
            seen_ids.add(raw_id)

    return Response({"items": ordered}, status=status.HTTP_200_OK)